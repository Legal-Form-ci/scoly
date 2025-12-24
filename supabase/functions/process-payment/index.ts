import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: 'orange' | 'mtn' | 'moov' | 'wave';
  phoneNumber: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
}

// Map payment methods to FedaPay mode for different countries
const getFedaPayMode = (method: string, country: string = 'ci'): string => {
  // Côte d'Ivoire modes
  const ciModes: Record<string, string> = {
    'mtn': 'mtn_ci',
    'moov': 'moov_ci',
    'orange': 'orange_ci',
    'wave': 'wave_ci'
  };
  
  // Bénin modes
  const bjModes: Record<string, string> = {
    'mtn': 'mtn_open',
    'moov': 'moov',
    'orange': 'orange', // Not supported in Benin
    'wave': 'wave'
  };
  
  // Sénégal modes
  const snModes: Record<string, string> = {
    'orange': 'orange_sn',
    'wave': 'wave_sn'
  };
  
  const modesByCountry: Record<string, Record<string, string>> = {
    'ci': ciModes,
    'bj': bjModes,
    'sn': snModes
  };
  
  return modesByCountry[country]?.[method] || ciModes[method] || 'mtn_ci';
};

// Detect country from phone number
const detectCountry = (phone: string): string => {
  const cleanPhone = phone.replace(/\s/g, '').replace(/^\+/, '');
  if (cleanPhone.startsWith('225')) return 'ci'; // Côte d'Ivoire
  if (cleanPhone.startsWith('229')) return 'bj'; // Bénin
  if (cleanPhone.startsWith('221')) return 'sn'; // Sénégal
  if (cleanPhone.startsWith('228')) return 'tg'; // Togo
  if (cleanPhone.startsWith('226')) return 'bf'; // Burkina Faso
  return 'ci'; // Default to Côte d'Ivoire
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fedapaySecretKey = Deno.env.get('FEDAPAY_SECRET_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, amount, paymentMethod, phoneNumber, userId, customerEmail, customerName }: PaymentRequest = await req.json();

    console.log('Payment request received:', { orderId, amount, paymentMethod, phoneNumber, userId });

    // Validate input
    if (!orderId || !amount || !paymentMethod || !phoneNumber || !userId) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number format (Côte d'Ivoire / Bénin format)
    const phoneRegex = /^(\+229|\+225)?[0-9]{8,10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'Numéro de téléphone invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, status, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Commande non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Accès non autorisé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: userId,
        amount,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        status: 'processing',
        metadata: {
          initiated_at: new Date().toISOString(),
          provider: 'fedapay',
          customer_email: customerEmail,
          customer_name: customerName
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du paiement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process with FedaPay
    if (!fedapaySecretKey) {
      console.error('FedaPay secret key not configured');
      
      // Fallback to simulation mode if no API key
      const transactionId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await supabase
        .from('payments')
        .update({
          transaction_id: transactionId,
          status: 'pending',
          metadata: {
            initiated_at: new Date().toISOString(),
            provider: 'simulation',
            note: 'Mode simulation - Clé FedaPay non configurée'
          }
        })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({
          success: true,
          paymentId: payment.id,
          transactionId,
          message: 'Mode simulation - Paiement initié. Veuillez confirmer sur votre téléphone.',
          status: 'pending',
          simulation: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const detectedCountry = detectCountry(phoneNumber);
      const cleanPhoneNumber = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
      // Remove country code for local number
      const localPhone = cleanPhoneNumber.replace(/^(225|229|221|228|226)/, '');
      
      console.log('Detected country:', detectedCountry, 'Local phone:', localPhone);
      
      // Create FedaPay transaction
      const fedapayResponse = await fetch('https://api.fedapay.com/v1/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fedapaySecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Commande Scoly #${orderId.slice(0, 8)}`,
          amount: Math.round(amount),
          currency: { iso: 'XOF' },
          callback_url: `${supabaseUrl}/functions/v1/fedapay-webhook`,
          customer: {
            firstname: customerName?.split(' ')[0] || 'Client',
            lastname: customerName?.split(' ').slice(1).join(' ') || 'Scoly',
            email: customerEmail || 'client@scoly.com',
            phone_number: {
              number: localPhone,
              country: detectedCountry
            }
          },
          metadata: {
            order_id: orderId,
            payment_id: payment.id,
            user_id: userId,
            payment_method: paymentMethod,
            country: detectedCountry
          }
        })
      });

      const fedapayData = await fedapayResponse.json();
      console.log('FedaPay response:', fedapayData);

      if (!fedapayResponse.ok) {
        console.error('FedaPay error:', fedapayData);
        
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            metadata: {
              initiated_at: new Date().toISOString(),
              provider: 'fedapay',
              error: fedapayData
            }
          })
          .eq('id', payment.id);

        return new Response(
          JSON.stringify({
            success: false,
            paymentId: payment.id,
            message: fedapayData.message || 'Erreur lors de la création du paiement FedaPay',
            status: 'failed'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const transactionId = fedapayData.v1?.transaction?.id?.toString() || fedapayData.id?.toString();
      const transactionReference = fedapayData.v1?.transaction?.reference || fedapayData.reference;

      // Now request payment via Mobile Money
      const paymentModeResponse = await fetch(`https://api.fedapay.com/v1/transactions/${transactionId}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fedapaySecretKey}`,
          'Content-Type': 'application/json',
        }
      });

      const tokenData = await paymentModeResponse.json();
      console.log('FedaPay token response:', tokenData);

      // Update payment with FedaPay transaction ID
      await supabase
        .from('payments')
        .update({
          transaction_id: transactionReference || transactionId,
          payment_reference: transactionId,
          status: 'pending',
          metadata: {
            initiated_at: new Date().toISOString(),
            provider: 'fedapay',
            fedapay_transaction_id: transactionId,
            fedapay_reference: transactionReference,
            fedapay_token: tokenData.token,
            payment_url: tokenData.url
          }
        })
        .eq('id', payment.id);

      // Update order payment reference
      await supabase
        .from('orders')
        .update({
          payment_reference: transactionReference || transactionId
        })
        .eq('id', orderId);

      console.log('Payment initiated successfully with FedaPay:', transactionId);

      return new Response(
        JSON.stringify({
          success: true,
          paymentId: payment.id,
          transactionId: transactionReference || transactionId,
          message: 'Paiement initié. Vous allez recevoir une demande de confirmation sur votre téléphone.',
          status: 'pending',
          paymentUrl: tokenData.url // URL pour paiement via navigateur si nécessaire
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fedapayError) {
      console.error('FedaPay API error:', fedapayError);
      
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            initiated_at: new Date().toISOString(),
            provider: 'fedapay',
            error: fedapayError instanceof Error ? fedapayError.message : 'Unknown error'
          }
        })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({
          success: false,
          paymentId: payment.id,
          message: 'Erreur de connexion avec FedaPay',
          status: 'failed'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

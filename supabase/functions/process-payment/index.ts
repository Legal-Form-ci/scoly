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
}

// Simulate payment provider response
// In production, replace with actual API calls to Orange Money, MTN, Moov, Wave APIs
const processWithProvider = async (
  provider: string,
  phoneNumber: string,
  amount: number
): Promise<{ success: boolean; transactionId: string; message: string }> => {
  console.log(`Processing ${provider} payment for ${phoneNumber}, amount: ${amount}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock transaction ID
  const transactionId = `${provider.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Simulate success (in production, this would be the actual API response)
  // For demo purposes, we'll simulate a 95% success rate
  const isSuccess = Math.random() > 0.05;
  
  if (isSuccess) {
    return {
      success: true,
      transactionId,
      message: `Paiement ${provider} initié. Veuillez confirmer sur votre téléphone.`
    };
  } else {
    return {
      success: false,
      transactionId: '',
      message: `Échec du paiement ${provider}. Veuillez réessayer.`
    };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, amount, paymentMethod, phoneNumber, userId }: PaymentRequest = await req.json();

    console.log('Payment request received:', { orderId, amount, paymentMethod, phoneNumber, userId });

    // Validate input
    if (!orderId || !amount || !paymentMethod || !phoneNumber || !userId) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number format (Côte d'Ivoire format)
    const phoneRegex = /^(\+225)?[0-9]{10}$/;
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
          provider: paymentMethod
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

    // Process payment with provider
    const providerResult = await processWithProvider(paymentMethod, phoneNumber, amount);

    if (providerResult.success) {
      // Update payment with transaction ID
      await supabase
        .from('payments')
        .update({
          transaction_id: providerResult.transactionId,
          status: 'pending', // Waiting for user confirmation
          metadata: {
            initiated_at: new Date().toISOString(),
            provider: paymentMethod,
            provider_response: providerResult
          }
        })
        .eq('id', payment.id);

      // Update order payment reference
      await supabase
        .from('orders')
        .update({
          payment_reference: providerResult.transactionId
        })
        .eq('id', orderId);

      console.log('Payment initiated successfully:', providerResult.transactionId);

      return new Response(
        JSON.stringify({
          success: true,
          paymentId: payment.id,
          transactionId: providerResult.transactionId,
          message: providerResult.message,
          status: 'pending'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Update payment as failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            initiated_at: new Date().toISOString(),
            provider: paymentMethod,
            error: providerResult.message
          }
        })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({
          success: false,
          paymentId: payment.id,
          message: providerResult.message,
          status: 'failed'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

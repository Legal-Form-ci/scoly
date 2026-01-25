import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: 'orange' | 'mtn' | 'moov' | 'wave' | 'kkiapay';
  phoneNumber?: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, amount, paymentMethod, phoneNumber, userId, customerEmail, customerName, description }: PaymentRequest = await req.json();

    console.log('Payment request received:', { orderId, amount, paymentMethod, phoneNumber, userId });

    // Validate input
    if (!orderId || !amount || !userId) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants (orderId, amount, userId requis)' }),
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

    // Create payment record for KkiaPay
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: userId,
        amount,
        payment_method: paymentMethod || 'kkiapay',
        phone_number: phoneNumber,
        status: 'pending',
        metadata: {
          initiated_at: new Date().toISOString(),
          provider: 'kkiapay',
          customer_email: customerEmail,
          customer_name: customerName,
          description: description
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

    console.log('Payment record created:', payment.id);

    // KkiaPay payments are initiated from the frontend widget
    // The webhook will update the status when payment completes
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        message: 'Paiement initié. Utilisez le widget KkiaPay pour compléter le paiement.',
        status: 'pending',
        provider: 'kkiapay'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

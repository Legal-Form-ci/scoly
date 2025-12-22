import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmPaymentRequest {
  paymentId: string;
  transactionId: string;
  status: 'completed' | 'failed' | 'cancelled';
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

    const { paymentId, transactionId, status }: ConfirmPaymentRequest = await req.json();

    console.log('Payment confirmation received:', { paymentId, transactionId, status });

    // Validate input
    if (!paymentId || !status) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, orders(id, user_id)')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Paiement non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment status
    const updateData: any = {
      status,
      metadata: {
        ...payment.metadata,
        confirmed_at: new Date().toISOString(),
        confirmation_status: status
      }
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    // Update order status based on payment status
    if (status === 'completed') {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', payment.order_id);

      // Create notification for admin
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'payment',
          title: 'Paiement confirmé',
          message: `Paiement de ${payment.amount} FCFA confirmé pour la commande #${payment.order_id.slice(0, 8)}`,
          data: {
            payment_id: paymentId,
            order_id: payment.order_id,
            amount: payment.amount,
            payment_method: payment.payment_method
          }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        type: 'payment',
        title: 'Paiement réussi',
        message: `Votre paiement de ${payment.amount} FCFA a été confirmé. Votre commande est en cours de préparation.`,
        data: {
          payment_id: paymentId,
          order_id: payment.order_id,
          amount: payment.amount
        }
      });
    } else if (status === 'failed' || status === 'cancelled') {
      // Create notification for user about failed payment
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        type: 'payment',
        title: status === 'failed' ? 'Paiement échoué' : 'Paiement annulé',
        message: status === 'failed' 
          ? `Votre paiement de ${payment.amount} FCFA a échoué. Veuillez réessayer.`
          : `Votre paiement de ${payment.amount} FCFA a été annulé.`,
        data: {
          payment_id: paymentId,
          order_id: payment.order_id,
          amount: payment.amount
        }
      });
    }

    console.log('Payment confirmed successfully:', paymentId, status);

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        status,
        message: status === 'completed' 
          ? 'Paiement confirmé avec succès'
          : status === 'failed'
          ? 'Le paiement a échoué'
          : 'Le paiement a été annulé'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error confirming payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

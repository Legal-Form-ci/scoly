import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { paymentId, orderId } = await req.json();

    console.log('Checking payment status:', { paymentId, orderId });

    let query = supabase
      .from('payments')
      .select('id, status, transaction_id, payment_method, amount, created_at, completed_at, metadata');

    if (paymentId) {
      query = query.eq('id', paymentId);
    } else if (orderId) {
      query = query.eq('order_id', orderId).order('created_at', { ascending: false }).limit(1);
    } else {
      return new Response(
        JSON.stringify({ error: 'paymentId ou orderId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: payment, error } = await query.single();

    if (error || !payment) {
      console.error('Payment not found:', error);
      return new Response(
        JSON.stringify({ error: 'Paiement non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate checking with provider for pending payments
    // In production, this would call the actual payment provider API
    if (payment.status === 'pending' || payment.status === 'processing') {
      // Simulate a check - in production, call the provider's API
      const timeSinceCreation = Date.now() - new Date(payment.created_at).getTime();
      
      // Auto-confirm after 30 seconds for demo purposes
      if (timeSinceCreation > 30000) {
        const newStatus = Math.random() > 0.1 ? 'completed' : 'failed';
        
        await supabase
          .from('payments')
          .update({
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            metadata: {
              ...payment.metadata,
              auto_confirmed_at: new Date().toISOString()
            }
          })
          .eq('id', payment.id);

        if (newStatus === 'completed') {
          // Update order status
          const { data: paymentData } = await supabase
            .from('payments')
            .select('order_id')
            .eq('id', payment.id)
            .single();

          if (paymentData?.order_id) {
            await supabase
              .from('orders')
              .update({ status: 'confirmed' })
              .eq('id', paymentData.order_id);
          }
        }

        payment.status = newStatus;
      }
    }

    console.log('Payment status:', payment.status);

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          transactionId: payment.transaction_id,
          paymentMethod: payment.payment_method,
          amount: payment.amount,
          createdAt: payment.created_at,
          completedAt: payment.completed_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking payment status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

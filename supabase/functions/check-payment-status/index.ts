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
    const fedapaySecretKey = Deno.env.get('FEDAPAY_SECRET_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { paymentId, orderId } = await req.json();

    console.log('Checking payment status:', { paymentId, orderId });

    let query = supabase
      .from('payments')
      .select('id, status, transaction_id, payment_reference, payment_method, amount, created_at, completed_at, metadata');

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

    // If payment is still pending/processing and we have FedaPay credentials, check with FedaPay
    if ((payment.status === 'pending' || payment.status === 'processing') && fedapaySecretKey) {
      const fedapayTransactionId = payment.payment_reference || payment.metadata?.fedapay_transaction_id;
      
      if (fedapayTransactionId) {
        try {
          const fedapayResponse = await fetch(`https://api.fedapay.com/v1/transactions/${fedapayTransactionId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${fedapaySecretKey}`,
              'Content-Type': 'application/json',
            }
          });

          if (fedapayResponse.ok) {
            const fedapayData = await fedapayResponse.json();
            console.log('FedaPay transaction status:', fedapayData);

            const fedapayStatus = fedapayData.v1?.transaction?.status || fedapayData.status;
            
            // Map FedaPay status to our status
            let newStatus = payment.status;
            if (fedapayStatus === 'approved' || fedapayStatus === 'transferred') {
              newStatus = 'completed';
            } else if (fedapayStatus === 'declined' || fedapayStatus === 'cancelled' || fedapayStatus === 'refunded') {
              newStatus = 'failed';
            }

            // Update if status changed
            if (newStatus !== payment.status) {
              const updateData: Record<string, unknown> = {
                status: newStatus,
                metadata: {
                  ...payment.metadata,
                  fedapay_status_check: fedapayStatus,
                  last_checked_at: new Date().toISOString()
                }
              };

              if (newStatus === 'completed') {
                updateData.completed_at = new Date().toISOString();
              }

              await supabase
                .from('payments')
                .update(updateData)
                .eq('id', payment.id);

              // Update order if completed
              if (newStatus === 'completed') {
                const { data: paymentData } = await supabase
                  .from('payments')
                  .select('order_id, user_id, amount')
                  .eq('id', payment.id)
                  .single();

                if (paymentData?.order_id) {
                  await supabase
                    .from('orders')
                    .update({ status: 'confirmed' })
                    .eq('id', paymentData.order_id);

                  // Create notification for user
                  if (paymentData.user_id) {
                    await supabase.from('notifications').insert({
                      user_id: paymentData.user_id,
                      type: 'payment',
                      title: 'Paiement réussi',
                      message: `Votre paiement de ${paymentData.amount} FCFA a été confirmé.`,
                      data: {
                        payment_id: payment.id,
                        order_id: paymentData.order_id,
                        amount: paymentData.amount
                      }
                    });
                  }
                }
              }

              payment.status = newStatus;
            }
          }
        } catch (fedapayError) {
          console.error('Error checking FedaPay status:', fedapayError);
          // Continue with local status
        }
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
          completedAt: payment.completed_at,
          paymentUrl: payment.metadata?.payment_url
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

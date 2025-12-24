import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fedapay-signature',
};

interface FedaPayWebhookEvent {
  id: string;
  entity: string;
  name: string;
  object: {
    id: number;
    klass: string;
    reference: string;
    amount: number;
    description: string;
    status: string;
    mode: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
      user_id?: string;
    };
    customer?: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
    };
    created_at: string;
    updated_at: string;
  };
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

    // Parse webhook payload
    const payload: FedaPayWebhookEvent = await req.json();
    
    console.log('FedaPay webhook received:', JSON.stringify(payload, null, 2));

    const { name: eventName, object: transaction } = payload;

    // Extract metadata
    const orderId = transaction.metadata?.order_id;
    const paymentId = transaction.metadata?.payment_id;
    const userId = transaction.metadata?.user_id;
    const fedapayTransactionId = transaction.id.toString();
    const fedapayReference = transaction.reference;
    const amount = transaction.amount;
    const status = transaction.status;

    console.log('Transaction details:', { 
      eventName, 
      orderId, 
      paymentId, 
      status, 
      amount,
      fedapayTransactionId,
      fedapayReference 
    });

    // Find the payment record
    let paymentRecord;
    
    if (paymentId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      paymentRecord = data;
    } else if (fedapayReference) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_id', fedapayReference)
        .single();
      paymentRecord = data;
    } else if (orderId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      paymentRecord = data;
    }

    if (!paymentRecord) {
      console.error('Payment record not found for webhook');
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map FedaPay status to our status
    let newStatus: string;
    switch (status.toLowerCase()) {
      case 'approved':
      case 'transferred':
        newStatus = 'completed';
        break;
      case 'pending':
      case 'processing':
        newStatus = 'pending';
        break;
      case 'declined':
      case 'cancelled':
      case 'refunded':
        newStatus = 'failed';
        break;
      default:
        newStatus = 'pending';
    }

    // Update payment status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      metadata: {
        ...paymentRecord.metadata,
        fedapay_event: eventName,
        fedapay_status: status,
        webhook_received_at: new Date().toISOString()
      }
    };

    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentRecord.id);

    console.log('Payment updated:', paymentRecord.id, 'status:', newStatus);

    // Update order status if payment completed
    if (newStatus === 'completed' && paymentRecord.order_id) {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', paymentRecord.order_id);

      console.log('Order confirmed:', paymentRecord.order_id);

      // Create notification for admin
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'payment',
          title: 'Paiement FedaPay confirmé',
          message: `Paiement de ${amount} FCFA confirmé pour la commande #${paymentRecord.order_id.slice(0, 8)}`,
          data: {
            payment_id: paymentRecord.id,
            order_id: paymentRecord.order_id,
            amount: amount,
            payment_method: paymentRecord.payment_method,
            provider: 'fedapay'
          }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      // Create notification for user
      if (paymentRecord.user_id) {
        await supabase.from('notifications').insert({
          user_id: paymentRecord.user_id,
          type: 'payment',
          title: 'Paiement réussi',
          message: `Votre paiement de ${amount} FCFA a été confirmé. Votre commande est en cours de préparation.`,
          data: {
            payment_id: paymentRecord.id,
            order_id: paymentRecord.order_id,
            amount: amount
          }
        });
      }
    } else if (newStatus === 'failed' && paymentRecord.user_id) {
      // Notify user of failed payment
      await supabase.from('notifications').insert({
        user_id: paymentRecord.user_id,
        type: 'payment',
        title: 'Paiement échoué',
        message: `Votre paiement de ${amount} FCFA a échoué. Veuillez réessayer.`,
        data: {
          payment_id: paymentRecord.id,
          order_id: paymentRecord.order_id,
          amount: amount,
          reason: status
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        paymentId: paymentRecord.id,
        status: newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing FedaPay webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

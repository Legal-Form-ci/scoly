import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  orderId: string;
  emailType: "confirmation" | "shipped" | "delivered";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, emailType }: OrderEmailRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", order.user_id)
      .single();

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
    const recipientEmail = profile?.email || authUser?.user?.email;

    if (!recipientEmail) {
      throw new Error("No email found for user");
    }

    const customerName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ""}`.trim() 
      : "Client";

    const orderNumber = order.id.slice(0, 8).toUpperCase();
    const totalFormatted = new Intl.NumberFormat("fr-FR").format(order.total_amount) + " FCFA";

    // Build items list
    const itemsList = order.order_items
      .map((item: any) => `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${new Intl.NumberFormat("fr-FR").format(item.total_price)} FCFA</td>
      </tr>`)
      .join("");

    let subject = "";
    let heading = "";
    let message = "";
    let ctaText = "";
    let ctaUrl = "https://izy-scoly.ci/account";

    switch (emailType) {
      case "confirmation":
        subject = `Confirmation de commande #${orderNumber} - Izy-scoly`;
        heading = "Merci pour votre commande !";
        message = `Nous avons bien reçu votre commande et nous la préparons avec soin. Vous recevrez un email lorsqu'elle sera expédiée.`;
        ctaText = "Suivre ma commande";
        break;
      case "shipped":
        subject = `Votre commande #${orderNumber} est en route - Izy-scoly`;
        heading = "Votre commande est en route !";
        message = `Bonne nouvelle ! Votre commande a été expédiée et est en cours de livraison. Notre livreur vous contactera bientôt.`;
        ctaText = "Suivre ma livraison";
        break;
      case "delivered":
        subject = `Votre commande #${orderNumber} a été livrée - Izy-scoly`;
        heading = "Commande livrée !";
        message = `Votre commande a été livrée. Nous espérons que vous êtes satisfait de vos achats. N'hésitez pas à confirmer la réception dans votre espace client.`;
        ctaText = "Confirmer la réception";
        break;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #2563eb; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Izy-scoly</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">${heading}</h2>
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
        Bonjour ${customerName},
      </p>
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
        ${message}
      </p>
      
      <!-- Order Info -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; color: #6b7280;">Numéro de commande</p>
        <p style="margin: 0; font-size: 20px; font-weight: bold; color: #2563eb;">#${orderNumber}</p>
      </div>
      
      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; color: #374151;">Produit</th>
            <th style="padding: 12px; text-align: center; color: #374151;">Qté</th>
            <th style="padding: 12px; text-align: right; color: #374151;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #1f2937;">Total</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #2563eb; font-size: 18px;">${totalFormatted}</td>
          </tr>
        </tfoot>
      </table>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          ${ctaText}
        </a>
      </div>
      
      <!-- Delivery Address -->
      ${order.shipping_address ? `
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">📍 Adresse de livraison</p>
        <p style="margin: 0; color: #78350f;">${order.shipping_address}</p>
      </div>
      ` : ""}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 30px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
        Besoin d'aide ? Contactez-nous à contact@izy-scoly.ci
      </p>
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} Izy-scoly. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend API directly
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Izy-scoly <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent:", emailData);

    // Log the email
    await supabase.from("email_logs").insert({
      order_id: orderId,
      email_type: emailType,
      recipient_email: recipientEmail,
      status: emailResponse.ok ? "sent" : "failed",
      error_message: emailResponse.ok ? null : JSON.stringify(emailData),
    });

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

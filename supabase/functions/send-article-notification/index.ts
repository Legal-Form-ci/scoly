import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  articleId: string;
  status: "approved" | "rejected";
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, status, reason }: NotificationRequest = await req.json();
    console.log(`Sending notification for article ${articleId}, status: ${status}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get article details
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("title_fr, author_id")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      console.error("Article not found:", articleError);
      throw new Error("Article not found");
    }

    // Get author profile and email from auth.users
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", article.author_id)
      .single();

    const { data: userData } = await supabase.auth.admin.getUserById(article.author_id);
    const authorEmail = userData?.user?.email;

    if (!authorEmail) {
      console.error("Author email not found");
      throw new Error("Author email not found");
    }

    const authorName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ""}`.trim() 
      : "Auteur";

    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      subject = `🎉 Votre article "${article.title_fr}" a été approuvé !`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Article Approuvé !</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <p>Bonjour <strong>${authorName}</strong>,</p>
              <p>Excellente nouvelle ! Votre article <strong>"${article.title_fr}"</strong> a été examiné et approuvé par notre équipe de modération.</p>
              <p>Votre article est maintenant publié et accessible à tous les lecteurs d'Izy-scoly.</p>
              <p>Merci pour votre contribution à la communauté Izy-scoly !</p>
              <center>
                <a href="https://izy-scoly.ci/actualites" class="button">Voir mon article</a>
              </center>
            </div>
            <div class="footer">
              <p>L'équipe Izy-scoly</p>
              <p>© ${new Date().getFullYear()} Izy-scoly - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = `📝 Votre article "${article.title_fr}" nécessite des modifications`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .reason-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Article à réviser</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${authorName}</strong>,</p>
              <p>Votre article <strong>"${article.title_fr}"</strong> a été examiné par notre équipe de modération et nécessite quelques modifications avant publication.</p>
              ${reason ? `
              <div class="reason-box">
                <strong>Commentaire de l'équipe :</strong>
                <p>${reason}</p>
              </div>
              ` : ""}
              <p>Vous pouvez modifier votre article depuis votre espace auteur et le soumettre à nouveau pour révision.</p>
              <center>
                <a href="https://izy-scoly.ci/author" class="button">Modifier mon article</a>
              </center>
            </div>
            <div class="footer">
              <p>L'équipe Izy-scoly</p>
              <p>© ${new Date().getFullYear()} Izy-scoly - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Izy-scoly <onboarding@resend.dev>",
        to: [authorEmail],
        subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-article-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

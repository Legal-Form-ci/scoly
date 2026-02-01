import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Support both legacy and new secret names for backward compatibility
    const IZY_SCOLY_AI_KEY = Deno.env.get("IZY_SCOLY_AI_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!IZY_SCOLY_AI_KEY) {
      throw new Error("IZY_SCOLY_AI_KEY is not configured");
    }

    const prompt = `Tu es un expert marketing pour une plateforme e-commerce de fournitures scolaires et bureautiques en Côte d'Ivoire appelée "Izy-Scoly".

Génère un CTA (Call-to-Action) pour cette publicité:
- Titre: ${title}
- Description: ${description || "Pas de description"}

Réponds uniquement en JSON avec ce format exact:
{
  "link_url": "/shop" ou "/actualites" ou "/contact" ou une route pertinente,
  "link_text": "Texte du bouton (3-5 mots max, accrocheur)"
}

Le link_url doit être une route interne commençant par "/" comme:
- "/shop" pour les produits
- "/shop?category=scoly-primaire" pour les catégories spécifiques
- "/actualites" pour les actualités
- "/contact" pour les partenariats
- "/about" pour en savoir plus

Le link_text doit être court, engageant et en français.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${IZY_SCOLY_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un assistant marketing. Réponds uniquement en JSON valide." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let result = { link_url: "/shop", link_text: "Découvrir" };
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, content);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ad-cta:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        link_url: "/shop",
        link_text: "En savoir plus"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

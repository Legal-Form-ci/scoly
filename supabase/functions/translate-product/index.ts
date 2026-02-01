import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TranslateRequest = {
  text: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text }: TranslateRequest = await req.json();
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Support both legacy and new secret names for backward compatibility
    const IZY_SCOLY_AI_KEY = Deno.env.get("IZY_SCOLY_AI_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!IZY_SCOLY_AI_KEY) throw new Error("IZY_SCOLY_AI_KEY is not configured");

    const system =
      "You are a professional product catalog translator. Translate short product names accurately and naturally.";

    const userPrompt = `Translate the following product name from French into English (en), German (de), and Spanish (es).\n\nRules:\n- Keep brand names unchanged\n- Keep numbers/units unchanged\n- Do not add quotes\n- Output ONLY valid JSON with keys en,de,es\n\nText: ${text}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${IZY_SCOLY_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required for AI usage. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) throw new Error("Empty AI response");

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Sometimes models wrap JSON in markdown; strip common fences.
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    }

    const result = {
      en: String(parsed.en ?? "").trim(),
      de: String(parsed.de ?? "").trim(),
      es: String(parsed.es ?? "").trim(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

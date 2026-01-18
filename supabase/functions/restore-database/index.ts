// Lovable Cloud function: restore database from a JSON backup (admin-only)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALL_TABLES = [
  "profiles",
  "products",
  "categories",
  "orders",
  "order_items",
  "cart_items",
  "user_roles",
  "articles",
  "article_comments",
  "article_likes",
  "article_purchases",
  "advertisements",
  "campaigns",
  "commissions",
  "coupons",
  "coupon_redemptions",
  "email_logs",
  "faq",
  "notifications",
  "payments",
  "platform_settings",
  "promotions",
  "resources",
  "reviews",
  "vendor_settings",
  "wishlist",
];

type RestoreRequest = {
  data: Record<string, unknown[]>;
  tables?: string[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Validate requester
    const supabaseAuth = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Admin only
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ success: false, error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RestoreRequest;
    const payload = body?.data || {};

    const requestedTables = (body.tables && body.tables.length > 0 ? body.tables : Object.keys(payload)) as string[];
    const tables = requestedTables.filter((t) => ALL_TABLES.includes(t));

    let total = 0;
    for (const t of tables) {
      const rows = payload[t];
      if (Array.isArray(rows)) total += rows.length;
    }

    let imported = 0;
    const perTable: Record<string, { imported: number; total: number }> = {};

    for (const table of tables) {
      const rows = payload[table];
      if (!Array.isArray(rows)) continue;
      perTable[table] = { imported: 0, total: rows.length };

      // Delete existing rows (service role bypasses RLS)
      // Using neq('id', ...) as a safe no-op filter for tables with id.
      await supabaseAdmin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert in batches
      const batchSize = 250;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabaseAdmin.from(table).insert(batch as any);
        if (!error) {
          imported += batch.length;
          perTable[table].imported += batch.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        total,
        perTable,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("restore-database error", e);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

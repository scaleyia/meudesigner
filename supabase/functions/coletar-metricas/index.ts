import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GRAPH = "https://graph.facebook.com/v21.0";

async function secret(k: string): Promise<string> {
  const { data } = await admin.from("app_secrets").select("value").eq("key", k).single();
  return (data && data.value) || "";
}

async function coletarUm(ag: any) {
  const { data: tok } = await admin.from("social_tokens").select("access_token").eq("account_id", ag.social_account_id).single();
  if (!tok) return false;
  const token = tok.access_token;
  const base = await (await fetch(GRAPH + "/" + ag.ig_media_id + "?fields=like_count,comments_count&access_token=" + token)).json();
  const ins = await (await fetch(GRAPH + "/" + ag.ig_media_id + "/insights?metric=saved,reach,impressions&access_token=" + token)).json();
  const m: Record<string, number> = {};
  for (const it of (ins.data || [])) m[it.name] = (it.values && it.values[0] && it.values[0].value) || 0;
  await admin.from("post_metrics").insert({
    agendamento_id: ag.id, ig_media_id: ag.ig_media_id,
    likes: base.like_count || 0, comments: base.comments_count || 0,
    saved: m.saved || 0, reach: m.reach || 0, impressions: m.impressions || 0,
  });
  return true;
}

Deno.serve(async (req) => {
  try {
    const given = req.headers.get("x-cron-secret") || "";
    const expected = await secret("cron_secret");
    if (!expected || given !== expected) return new Response(JSON.stringify({ error: "nao autorizado" }), { status: 401 });
    const { data: pubs } = await admin.from("agendamentos").select("id,ig_media_id,social_account_id")
      .eq("status", "publicado").not("ig_media_id", "is", null)
      .gte("publicado_em", new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()).limit(100);
    let ok = 0;
    for (const ag of (pubs || [])) { try { if (await coletarUm(ag)) ok++; } catch (_) { /* ignora post individual */ } }
    return new Response(JSON.stringify({ coletados: ok, total: (pubs || []).length }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e && (e as any).message) || e) }), { status: 500 });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GRAPH = "https://graph.facebook.com/v21.0";

async function secret(k: string): Promise<string> {
  const { data } = await admin.from("app_secrets").select("value").eq("key", k).single();
  return (data && data.value) || "";
}
function autoType(t: string) { return t === "BUSINESS" || t === "CREATOR"; }

async function publicarCarrossel(igId: string, token: string, urls: string[], caption: string) {
  const post = async (path: string, params: Record<string, string>) => {
    const qs = new URLSearchParams({ ...params, access_token: token }).toString();
    const r = await fetch(GRAPH + "/" + path + "?" + qs, { method: "POST" });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "erro no Graph API");
    return j;
  };
  let creationId: string;
  if (urls.length === 1) {
    creationId = (await post(igId + "/media", { image_url: urls[0], caption: caption || "" })).id;
  } else {
    const children: string[] = [];
    for (const url of urls.slice(0, 10)) children.push((await post(igId + "/media", { image_url: url, is_carousel_item: "true" })).id);
    creationId = (await post(igId + "/media", { media_type: "CAROUSEL", children: children.join(","), caption: caption || "" })).id;
  }
  return (await post(igId + "/media_publish", { creation_id: creationId })).id as string;
}

async function processarUm(ag: any) {
  // caminho automatico (Business/Creator com conta+token)
  if (ag.modo === "auto" && ag.social_account_id) {
    const { data: acc } = await admin.from("social_accounts").select("*").eq("id", ag.social_account_id).single();
    const { data: tok } = await admin.from("social_tokens").select("access_token").eq("account_id", ag.social_account_id).single();
    if (acc && acc.ativo && autoType(acc.account_type) && tok && acc.ig_user_id) {
      await admin.from("agendamentos").update({ status: "processando" }).eq("id", ag.id);
      try {
        const mediaId = await publicarCarrossel(acc.ig_user_id, tok.access_token, ag.image_urls || [], ag.legenda || "");
        await admin.from("agendamentos").update({ status: "publicado", ig_media_id: mediaId, publicado_em: new Date().toISOString(), erro: null }).eq("id", ag.id);
        return "publicado";
      } catch (e) {
        await admin.from("agendamentos").update({ status: "falhou", erro: String((e && (e as any).message) || e), tentativas: (ag.tentativas || 0) + 1 }).eq("id", ag.id);
        return "falhou";
      }
    }
  }
  // caminho lembrete (conta pessoal / sem auto): sinaliza para o usuario publicar
  await admin.from("agendamentos").update({ status: "aguardando_usuario" }).eq("id", ag.id);
  return "lembrete";
}

Deno.serve(async (req) => {
  try {
    const given = req.headers.get("x-cron-secret") || "";
    const expected = await secret("cron_secret");
    if (!expected || given !== expected) return new Response(JSON.stringify({ error: "nao autorizado" }), { status: 401 });

    const nowIso = new Date().toISOString();
    const { data: due } = await admin.from("agendamentos").select("*")
      .eq("status", "agendado").lte("scheduled_at", nowIso).order("scheduled_at").limit(25);

    const counts: Record<string, number> = { publicado: 0, falhou: 0, lembrete: 0 };
    for (const ag of (due || [])) { const r = await processarUm(ag); counts[r] = (counts[r] || 0) + 1; }
    return new Response(JSON.stringify({ processados: (due || []).length, ...counts }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e && (e as any).message) || e) }), { status: 500 });
  }
});

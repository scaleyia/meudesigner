import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GRAPH = "https://graph.facebook.com/v21.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
function roleOf(jwt: string): string {
  try { return JSON.parse(atob(jwt.split(".")[1])).role || ""; } catch { return ""; }
}

// Publica um carrossel (>=2) ou imagem unica. Retorna o media id ou lanca erro.
export async function publicarCarrossel(igId: string, token: string, urls: string[], caption: string) {
  if (!urls || !urls.length) throw new Error("sem imagens");
  const post = async (path: string, params: Record<string, string>) => {
    const qs = new URLSearchParams({ ...params, access_token: token }).toString();
    const r = await fetch(GRAPH + "/" + path + "?" + qs, { method: "POST" });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "erro no Graph API");
    return j;
  };
  let creationId: string;
  if (urls.length === 1) {
    const c = await post(igId + "/media", { image_url: urls[0], caption: caption || "" });
    creationId = c.id;
  } else {
    const children: string[] = [];
    for (const url of urls.slice(0, 10)) {
      const ch = await post(igId + "/media", { image_url: url, is_carousel_item: "true" });
      children.push(ch.id);
    }
    const carousel = await post(igId + "/media", { media_type: "CAROUSEL", children: children.join(","), caption: caption || "" });
    creationId = carousel.id;
  }
  const pub = await post(igId + "/media_publish", { creation_id: creationId });
  return pub.id as string;
}

// Publica um agendamento inteiro (busca conta/token, atualiza status). Retorna {ok, media_id?|erro?}.
export async function publicarAgendamento(agId: string) {
  const { data: ag } = await admin.from("agendamentos").select("*").eq("id", agId).single();
  if (!ag) return { ok: false, erro: "agendamento nao encontrado" };
  if (!ag.social_account_id) return { ok: false, erro: "sem conta conectada" };
  const { data: acc } = await admin.from("social_accounts").select("*").eq("id", ag.social_account_id).single();
  const { data: tok } = await admin.from("social_tokens").select("access_token").eq("account_id", ag.social_account_id).single();
  if (!acc || !acc.ig_user_id || !tok) return { ok: false, erro: "conta sem token valido" };
  await admin.from("agendamentos").update({ status: "processando" }).eq("id", agId);
  try {
    const mediaId = await publicarCarrossel(acc.ig_user_id, tok.access_token, ag.image_urls || [], ag.legenda || "");
    await admin.from("agendamentos").update({ status: "publicado", ig_media_id: mediaId, publicado_em: new Date().toISOString(), erro: null }).eq("id", agId);
    return { ok: true, media_id: mediaId };
  } catch (e) {
    const msg = String((e && (e as any).message) || e);
    await admin.from("agendamentos").update({ status: "falhou", erro: msg, tentativas: (ag.tentativas || 0) + 1 }).eq("id", agId);
    return { ok: false, erro: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Metodo nao permitido" }, 405);
  try {
    const auth = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const body = await req.json().catch(() => ({}));
    const agId = body?.agendamento_id;
    if (!agId) return json({ error: "agendamento_id obrigatorio" }, 400);

    // autorizacao: service_role (cron) pode tudo; usuario so o proprio agendamento
    if (roleOf(auth) !== "service_role") {
      const { data: ud } = await admin.auth.getUser(auth);
      if (!ud || !ud.user) return json({ error: "nao autorizado" }, 401);
      const { data: ag } = await admin.from("agendamentos").select("user_id").eq("id", agId).single();
      if (!ag || ag.user_id !== ud.user.id) return json({ error: "nao autorizado" }, 403);
    }
    const res = await publicarAgendamento(agId);
    return json(res, res.ok ? 200 : 502);
  } catch (e) {
    return json({ error: String((e && (e as any).message) || e) }, 500);
  }
});

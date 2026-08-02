import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const FN = SB_URL + "/functions/v1/instagram-oauth";
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GRAPH = "https://graph.facebook.com/v21.0";

async function secret(k: string): Promise<string> {
  const { data } = await admin.from("app_secrets").select("value").eq("key", k).single();
  return (data && data.value) || "";
}
function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}
function err(back: string, m: string) {
  return redirect(back + (back.indexOf("?") >= 0 ? "&" : "?") + "error=" + encodeURIComponent(m));
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const action = u.searchParams.get("action");
  const ret = u.searchParams.get("return") || "/agenda.html";
  try {
    const appId = await secret("fb_app_id");
    const appSecret = await secret("fb_app_secret");

    if (action === "start") {
      if (!appId || !appSecret) return err(ret, "Conexao com Instagram ainda nao configurada (falta o app do Facebook).");
      const token = u.searchParams.get("token") || "";
      const { data: ud } = await admin.auth.getUser(token);
      if (!ud || !ud.user) return err(ret, "Sessao invalida. Faca login de novo.");
      const state = crypto.randomUUID().replace(/-/g, "");
      await admin.from("oauth_states").insert({ state, user_id: ud.user.id, return_url: ret });
      const scope = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management";
      const au = "https://www.facebook.com/v21.0/dialog/oauth?client_id=" + appId +
        "&redirect_uri=" + encodeURIComponent(FN + "?action=callback") +
        "&state=" + state + "&response_type=code&scope=" + scope;
      return redirect(au);
    }

    if (action === "callback") {
      const code = u.searchParams.get("code");
      const state = u.searchParams.get("state") || "";
      const { data: st } = await admin.from("oauth_states").select("*").eq("state", state).single();
      const back = (st && st.return_url) || ret;
      if (!code || !st) return err(back, "Falha na autorizacao do Facebook.");

      // 1) code -> user token
      const tr = await fetch(GRAPH + "/oauth/access_token?client_id=" + appId +
        "&client_secret=" + appSecret + "&redirect_uri=" + encodeURIComponent(FN + "?action=callback") +
        "&code=" + code);
      const tj = await tr.json();
      if (!tr.ok || !tj.access_token) return err(back, (tj.error && tj.error.message) || "Erro ao obter token.");
      let userToken = tj.access_token;

      // 2) token de longa duracao
      const lr = await fetch(GRAPH + "/oauth/access_token?grant_type=fb_exchange_token&client_id=" + appId +
        "&client_secret=" + appSecret + "&fb_exchange_token=" + userToken);
      const lj = await lr.json();
      if (lj.access_token) userToken = lj.access_token;

      // 3) achar Pagina + conta IG business
      const pr = await fetch(GRAPH + "/me/accounts?fields=name,access_token,instagram_business_account&access_token=" + userToken);
      const pj = await pr.json();
      const page = (pj.data || []).find((p: any) => p.instagram_business_account);
      if (!page) return err(back, "Nenhuma conta Instagram Business ligada a uma Pagina do Facebook foi encontrada.");
      const igId = page.instagram_business_account.id;
      const pageToken = page.access_token || userToken;

      // 4) dados da conta IG
      const ir = await fetch(GRAPH + "/" + igId + "?fields=username,account_type&access_token=" + pageToken);
      const ij = await ir.json();
      const username = ij.username || "conta";
      const atype = ij.account_type || "BUSINESS";

      // 5) upsert conta + token
      let accountId: string;
      const ex = await admin.from("social_accounts").select("id").eq("user_id", st.user_id).eq("ig_user_id", igId).maybeSingle();
      if (ex.data) {
        accountId = ex.data.id;
        await admin.from("social_accounts").update({ username, account_type: atype, page_id: page.id, ativo: true }).eq("id", accountId);
      } else {
        const ni = await admin.from("social_accounts").insert({ user_id: st.user_id, provider: "instagram", ig_user_id: igId, username, account_type: atype, page_id: page.id, ativo: true }).select("id").single();
        accountId = ni.data!.id;
      }
      await admin.from("social_tokens").upsert({ account_id: accountId, access_token: pageToken, atualizado_em: new Date().toISOString() });
      await admin.from("oauth_states").delete().eq("state", state);

      return redirect(back + (back.indexOf("?") >= 0 ? "&" : "?") + "connected=" + encodeURIComponent("@" + username));
    }

    return new Response("instagram-oauth ok");
  } catch (e) {
    return err(ret, String((e && (e as any).message) || e));
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}

// Sobe UMA imagem (data URL) para o bucket 'posts' na pasta do usuário, via service role.
// Contorna o problema de token desatualizado do cliente de Storage no navegador.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Metodo nao permitido" }, 405);
  try {
    const auth = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: ud } = await admin.auth.getUser(auth);
    if (!ud || !ud.user) return json({ error: "nao autorizado" }, 401);
    const uid = ud.user.id;
    const body = await req.json().catch(() => ({}));
    const cid = String(body?.carousel_id || "sem").replace(/[^a-zA-Z0-9-]/g, "");
    const idx = parseInt(String(body?.i)) || 1;
    const dataUrl = String(body?.dataUrl || "");
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return json({ error: "imagem invalida" }, 400);
    const b64 = dataUrl.slice(comma + 1);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    const path = uid + "/" + cid + "/slide-" + idx + ".png";
    const up = await admin.storage.from("posts").upload(path, bytes, { contentType: "image/png", upsert: true });
    if (up.error) return json({ error: up.error.message }, 500);
    const url = admin.storage.from("posts").getPublicUrl(path).data.publicUrl;
    return json({ url });
  } catch (e) {
    return json({ error: String((e && (e as any).message) || e) }, 500);
  }
});

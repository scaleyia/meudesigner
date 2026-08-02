import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Metodo nao permitido" }, 405);
  try {
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json({ error: "OPENAI_API_KEY nao configurada." }, 500);
    const body = await req.json().catch(() => ({}));
    const tema = body?.tema || "";
    const slides = Array.isArray(body?.slides) ? body.slides : [];
    const resumo = slides.map((s: any, i: number) => (i + 1) + ". " + (s.title || "") + " — " + (s.body || "")).join("\n").slice(0, 3000);
    if (!tema && !resumo) return json({ error: "Sem conteudo para reaproveitar." }, 400);

    const sys = "Voce e social media manager. A partir de um carrossel ja pronto, gera peca de reaproveitamento para o mesmo tema, em portugues do Brasil, capitalizacao natural (nunca Title Case). Responda sempre em JSON.";
    const user = "Tema: \"" + tema + "\".\nConteudo do carrossel:\n" + resumo + "\n\nGere, a partir disso:\n- \"legenda\": legenda pronta para o post do carrossel (2 a 4 paragrafos curtos, com 1 gancho na 1a linha e um CTA no fim);\n- \"hashtags\": array com 12 a 18 hashtags relevantes (sem #, so a palavra);\n- \"reels\": roteiro curto de Reels de 30s baseado no mesmo tema (3 a 5 falas/cortes, com indicacao [corte] entre elas);\n- \"stories\": array de 3 ideias curtas de Stories (enquete/pergunta/bastidor) sobre o tema.\nResponda um objeto JSON EXATO: {\"legenda\":\"...\",\"hashtags\":[\"...\"],\"reels\":\"...\",\"stories\":[\"...\"]}";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.8,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data?.error?.message || "Erro ao chamar a IA." }, 502);
    let parsed;
    try { parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}"); } catch (_) { return json({ error: "A IA nao retornou JSON valido." }, 502); }
    return json({ legenda: parsed.legenda || "", hashtags: parsed.hashtags || [], reels: parsed.reels || "", stories: parsed.stories || [] });
  } catch (e) {
    return json({ error: String((e && (e as any).message) || e) }, 500);
  }
});

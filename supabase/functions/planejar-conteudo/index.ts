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
    const nicho = body?.nicho;
    if (!nicho || String(nicho).trim().length < 2) return json({ error: "Informe o nicho." }, 400);
    const porSemana = Math.min(Math.max(parseInt(String(body?.por_semana)) || 3, 1), 7);
    const total = porSemana * 4;

    const sys = "Voce e estrategista de conteudo para Instagram. Cria calendarios editoriais praticos, variados (educativo, mito x verdade, passo a passo, bastidores, prova social, lista, comparacao), em portugues do Brasil. Capitalizacao natural de frase, nunca Title Case. Responda sempre em JSON.";
    const user = `Monte um plano editorial de 1 mes para o nicho: "${nicho}".\nQuantidade: ${total} carrosseis (aprox. ${porSemana} por semana), distribuidos ao longo de ~28 dias.\nVarie os angulos e evite repetir tema. Para cada item de:\n- "dia": numero do dia no mes (1 a 28), crescente e espalhado conforme a frequencia;\n- "titulo": chamada curta e atraente (ate ~7 palavras);\n- "tema": 1 frase descrevendo do que o carrossel trata (serve de briefing para a IA gerar depois);\n- "formato": um de ["lista","mito x verdade","passo a passo","educativo","bastidores","comparacao"].\nResponda um objeto JSON EXATO no formato:\n{"itens":[{"dia":1,"titulo":"...","tema":"...","formato":"lista"}]}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: 2200,
        temperature: 0.85,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data?.error?.message || "Erro ao chamar a IA." }, 502);
    let parsed;
    try { parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}"); } catch (_) { return json({ error: "A IA nao retornou JSON valido." }, 502); }
    const itens = Array.isArray(parsed.itens) ? parsed.itens.slice(0, total) : [];
    return json({ itens });
  } catch (e) {
    return json({ error: String((e && (e as any).message) || e) }, 500);
  }
});

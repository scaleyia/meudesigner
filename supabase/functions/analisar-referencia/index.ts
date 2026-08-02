import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Engenharia reversa de layout: recebe uma arte de referência e devolve um MOLDE
// estrutural (posições/alinhamentos/cores/badge) para o renderizador Canvas recriar
// o mesmo layout com a marca e os textos do usuário.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Metodo nao permitido" }, 405);
  try {
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json({ error: "OPENAI_API_KEY nao configurada." }, 500);
    const body = await req.json().catch(() => ({}));
    const img = body?.image;
    if (!img || typeof img !== "string") return json({ error: "Envie a imagem de referencia (campo image)." }, 400);

    const sys = "Voce e diretor de arte que faz ENGENHARIA REVERSA de layout de posts de Instagram. Dada uma arte, voce descreve o MOLDE ESTRUTURAL dela (posicoes, alinhamentos, cores, badge) para que outro sistema RE-DESENHE o mesmo layout com outro texto e outra marca. Nao copie o texto da referencia. Coordenadas relativas. Responda sempre JSON.";
    const instr = "Analise a arte e devolva o molde estrutural em JSON EXATO:\n{\n \"fundo\": { \"tipo\": \"solido|foto|gradiente\", \"cor\": \"#rrggbb\", \"cor2\": \"#rrggbb\", \"escuro\": true|false },\n \"titulo\": { \"pos\": \"topo|centro|base\", \"align\": \"esquerda|centro|direita\", \"caixa\": \"normal|maiuscula\", \"peso\": \"regular|bold|black\", \"cor\": \"#rrggbb\", \"tamanho\": \"pequeno|medio|grande\" },\n \"subtitulo\": { \"presente\": true|false, \"cor\": \"#rrggbb\" },\n \"badge\": { \"presente\": true|false, \"canto\": \"sup-dir|sup-esq|inf-dir|inf-esq|nenhum\", \"corFundo\": \"#rrggbb\", \"corTexto\": \"#rrggbb\", \"formato\": \"pilula|retangulo\" },\n \"perfil\": { \"visivel\": true|false, \"pos\": \"topo|base\" },\n \"acento\": \"#rrggbb\",\n \"paleta\": [\"#rrggbb\"],\n \"cena\": \"se fundo=foto, descreva a imagem SEM texto para gerar por IA; senao vazio\",\n \"estilo\": \"1 frase resumo\"\n}";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: 900,
        temperature: 0.3,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: [ { type: "text", text: instr }, { type: "image_url", image_url: { url: img } } ] },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data?.error?.message || "Erro ao analisar a imagem." }, 502);
    let m;
    try { m = JSON.parse(data?.choices?.[0]?.message?.content || "{}"); } catch (_) { return json({ error: "A IA nao retornou JSON valido." }, 502); }
    return json({ molde: m, estilo: m.estilo || "", paleta: Array.isArray(m.paleta) ? m.paleta.slice(0, 5) : [] });
  } catch (e) {
    return json({ error: String((e && (e as any).message) || e) }, 500);
  }
});

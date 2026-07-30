# MeuDesigner

Gerador de carrossel para Instagram com IA. Escolha um template, digite o tema e a IA escreve o roteiro e desenha as artes, prontas pra postar.

Site estático (HTML + CSS + JS) com autenticação e geração via **Supabase** (Auth, Postgres, Edge Functions) e **OpenAI** (texto + imagem).

## Estrutura
- `index.html` — landing page
- `login.html` · `cadastro.html` · `nova-senha.html` — autenticação
- `app.html` + `wizard.js` — o app (assistente de criação em 4 passos: Templates → Tema → Roteiro → Imagens)
- `auth.js` — camada de auth (Supabase, `window.MDAuth`)
- `supabase-config.js` — URL + anon key (públicas)
- `assets/` — marca, fontes auto-hospedadas e previews dos templates

## Backend (Supabase)
- Tabelas: `profiles` (perfil + créditos, RLS) e `carousels` (projetos salvos, RLS)
- RPC `consumir_creditos` (desconto seguro de créditos)
- Edge Functions: `gerar-carrossel` (roteiro via OpenAI) e `gerar-capa` (imagem via OpenAI)
- Secret `OPENAI_API_KEY` configurado no projeto Supabase

## Deploy (Vercel)
Site estático — deploy direto (sem build). Após publicar, adicione o domínio da Vercel
em **Supabase → Authentication → URL Configuration** (Site URL + Redirect URLs) para o
login com Google e a recuperação de senha funcionarem em produção.

---
Feito com Claude Code.

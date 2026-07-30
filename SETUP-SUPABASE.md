# Ativar o login/cadastro (Supabase) — passo a passo

O código de autenticação já está 100% pronto (login, cadastro, recuperar senha, login com
Google e painel `/app` protegido). Só falta conectar o **seu** projeto Supabase.

## 1. Criar o projeto
1. Acesse https://supabase.com → **New project** (escolha nome, senha do banco e região).
2. Espere ~1 min provisionar.

## 2. Pegar as chaves e colar no código
1. No painel do projeto: **Project Settings → API** (ou "Data API").
2. Copie:
   - **Project URL** → ex.: `https://abcdxyz.supabase.co`
   - **anon public** key → um token começando com `eyJ...` (é público, pode ficar no front-end).
3. Cole em **`supabase-config.js`** (na raiz do projeto):
   ```js
   window.SUPABASE_URL = "https://abcdxyz.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
   > Assim que salvar, o banner amarelo de "modo demonstração" some e o login funciona.

## 3. E-mail/senha
- Já vem ligado por padrão (**Authentication → Providers → Email**).
- Para **testar rápido**, você pode desligar a confirmação de e-mail:
  Authentication → Providers → Email → desmarque **"Confirm email"**.
  (Assim o cadastro já entra direto, sem precisar confirmar por e-mail.)
- Para produção, mantenha a confirmação ligada e configure um SMTP próprio
  (Authentication → Emails), pois o SMTP embutido do Supabase é limitado.

## 4. URLs de redirecionamento (importante)
Em **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:8123` (troque pelo domínio real quando publicar)
- **Redirect URLs** (adicione todas):
  - `http://localhost:8123/app.html`
  - `http://localhost:8123/nova-senha.html`
  - (na publicação) `https://seudominio.com/app.html` e `https://seudominio.com/nova-senha.html`

## 5. Login com Google (opcional)
1. No **Google Cloud Console** → APIs & Services → Credentials → **Create OAuth client ID**
   (tipo: Web application).
2. Em **Authorized redirect URIs**, cole a URL de callback do Supabase:
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`
3. Copie o **Client ID** e **Client Secret**.
4. No Supabase: **Authentication → Providers → Google** → cole o Client ID/Secret → **Enable**.

## 6. Testar
1. Servidor local rodando em `http://localhost:8123` (o `python3 -m http.server 8123`).
2. Abra `/cadastro.html`, crie uma conta → deve entrar em `/app.html`.
3. Saia, vá em `/login.html`, entre de novo.
4. Teste "Esqueci minha senha" (chega um e-mail com link → cai em `/nova-senha.html`).
5. Confira usuários criados em **Authentication → Users** no painel do Supabase.

---
Arquivos do sistema de auth: `login.html`, `cadastro.html`, `nova-senha.html`,
`app.html`, `auth.js`, `supabase-config.js`, `assets/auth.css`.

/* =========================================================================
   MeuDesigner · camada de autenticação (Supabase)
   Depende de: @supabase/supabase-js (CDN) + supabase-config.js carregados antes.
   Expõe window.MDAuth com os métodos usados pelas telas.
   ========================================================================= */
(function () {
  var url = window.SUPABASE_URL || "";
  var key = window.SUPABASE_ANON_KEY || "";
  var isPlaceholder = /SEU-PROJETO|SUA-ANON|^$/.test(url) || /SUA-ANON|^$/.test(key);
  var configured = !isPlaceholder;

  var sb = null;
  if (configured && window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  // mensagens de erro do Supabase -> português amigável
  function friendly(err) {
    if (!err) return "Algo deu errado. Tente de novo.";
    var m = (err.message || String(err)).toLowerCase();
    if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
    if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).";
    if (m.includes("already registered") || m.includes("already been registered")) return "Esse e-mail já tem conta. Tente entrar.";
    if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
    if (m.includes("unable to validate email") || m.includes("invalid email")) return "E-mail inválido.";
    if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Espere um pouco e tente de novo.";
    if (m.includes("for security purposes")) return "Aguarde alguns segundos antes de tentar de novo.";
    return err.message || "Algo deu errado. Tente de novo.";
  }

  var origin = window.location.origin;

  var MDAuth = {
    sb: sb,
    configured: configured,
    friendly: friendly,

    // sessão atual (ou null)
    getSession: async function () {
      if (!sb) return null;
      var r = await sb.auth.getSession();
      return r.data ? r.data.session : null;
    },

    onChange: function (cb) {
      if (!sb) return;
      sb.auth.onAuthStateChange(function (evt, session) { cb(evt, session); });
    },

    signUp: async function (email, password, nome) {
      if (!sb) throw new Error("Supabase não configurado.");
      return sb.auth.signUp({
        email: email, password: password,
        options: { data: { nome: nome || "" }, emailRedirectTo: origin + "/app.html" }
      });
    },

    signIn: async function (email, password) {
      if (!sb) throw new Error("Supabase não configurado.");
      return sb.auth.signInWithPassword({ email: email, password: password });
    },

    signInGoogle: async function () {
      if (!sb) throw new Error("Supabase não configurado.");
      return sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: origin + "/app.html" }
      });
    },

    resetRequest: async function (email) {
      if (!sb) throw new Error("Supabase não configurado.");
      return sb.auth.resetPasswordForEmail(email, { redirectTo: origin + "/nova-senha.html" });
    },

    updatePassword: async function (newPassword) {
      if (!sb) throw new Error("Supabase não configurado.");
      return sb.auth.updateUser({ password: newPassword });
    },

    signOut: async function () {
      if (!sb) return;
      await sb.auth.signOut();
    },

    // guarda: exige login; se não houver sessão, manda pro login
    requireAuth: async function () {
      if (!sb) return null;
      var s = await this.getSession();
      if (!s) { window.location.replace("/login.html"); return null; }
      return s.user;
    },

    // se já logado, manda pro painel (usado no login/cadastro)
    redirectIfAuthed: async function () {
      if (!sb) return;
      var s = await this.getSession();
      if (s) window.location.replace("/app.html");
    }
  };

  window.MDAuth = MDAuth;

  // mostra o banner de "configure o Supabase" se ainda estiver com placeholder
  document.addEventListener("DOMContentLoaded", function () {
    if (!configured) {
      var b = document.getElementById("cfgBanner");
      if (b) b.classList.add("show");
    }
  });
})();

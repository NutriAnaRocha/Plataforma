/* ============================================================
   AUTH GUARD — protege telas internas. Sem sessão, volta ao login.
   Também trata logout em qualquer elemento com [data-logout].
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var ready = window.NutriDBReady || Promise.reject(new Error("supabase-client ausente"));

  // Para onde mandar quem comprou um e-book (não tem nada a fazer no painel).
  var BIBLIOTECA_SITE = "https://nutrianarocha.github.io/site/biblioteca.html";

  ready.then(function (c) {
    c.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.replace("index.html"); return; }
      window.__nutriUser = r.data.session.user;
      // Só quem é 'nutri' fica no painel — allowlist, não blocklist. Antes
      // barrávamos só 'paciente', então o comprador de e-book (que nascia
      // 'nutri' por engano) entrava aqui. Ver migração 0018.
      c.from("profiles").select("tipo").maybeSingle().then(function (res) {
        var tipo = res && res.data && res.data.tipo;
        // Fail-open DELIBERADO: se a consulta falhou ou o perfil não veio, não
        // dá para afirmar que a pessoa não é a nutri — e expulsar por um erro
        // de rede trancaria a Ana fora do próprio painel. Só expulsamos quem
        // foi positivamente identificado como outro tipo. A proteção real é o
        // RLS, não este guard.
        if (!tipo) { window.dispatchEvent(new Event("nutri-auth-ready")); return; }
        if (tipo === "paciente") { window.location.replace("portal-paciente.html"); return; }
        if (tipo !== "nutri") { window.location.replace(BIBLIOTECA_SITE); return; }
        window.dispatchEvent(new Event("nutri-auth-ready"));
      }).catch(function () {
        window.dispatchEvent(new Event("nutri-auth-ready")); // idem: fail-open
      });
    });

    // Logout: qualquer [data-logout] (botão "Sair", etc.)
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-logout]");
      if (!t) return;
      e.preventDefault();
      c.auth.signOut().then(function () { window.location.replace("index.html"); });
    });
  }).catch(function () {
    /* CDN indisponível (ex.: offline / file:// sem internet):
       não trava a tela — apenas não há proteção nesta sessão. */
  });
})();

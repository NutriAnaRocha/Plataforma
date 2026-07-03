/* ============================================================
   AUTH GUARD — protege telas internas. Sem sessão, volta ao login.
   Também trata logout em qualquer elemento com [data-logout].
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var ready = window.NutriDBReady || Promise.reject(new Error("supabase-client ausente"));

  ready.then(function (c) {
    c.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.replace("index.html"); return; }
      window.__nutriUser = r.data.session.user;
      // Pacientes não acessam o painel da nutri — vão para o portal deles.
      c.from("profiles").select("tipo").maybeSingle().then(function (res) {
        if (res.data && res.data.tipo === "paciente") { window.location.replace("portal-paciente.html"); return; }
        window.dispatchEvent(new Event("nutri-auth-ready"));
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

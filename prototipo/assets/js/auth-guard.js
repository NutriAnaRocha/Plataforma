/* ============================================================
   AUTH GUARD — protege telas internas. Sem sessão, volta ao login.
   Também trata logout em qualquer elemento com [data-logout].
   Requer supabase-client.js incluído ANTES deste arquivo.

   Além do tipo (nutri/paciente/comprador), agora também confere a
   ASSINATURA da nutri (migração 0038): trial vencido / assinatura
   vencida/cancelada → manda para assinatura.html (paywall). O gate é
   só de INTERFACE (billing); a segurança dos dados é o RLS.
   ============================================================ */
(function () {
  "use strict";

  var ready = window.NutriDBReady || Promise.reject(new Error("supabase-client ausente"));

  // Para onde mandar quem comprou um e-book (não tem nada a fazer no painel).
  var BIBLIOTECA_SITE = "https://nutrianarocha.github.io/site/biblioteca.html";

  function naPaginaAssinatura() {
    return /(^|\/)assinatura\.html$/.test(location.pathname);
  }

  // Deriva o estado de billing a partir da linha de profiles. Fail-open:
  // qualquer dado faltando NÃO tranca (só bloqueia quem foi positivamente
  // identificado como trial-vencido / vencida / cancelada).
  function parseBilling(row) {
    row = row || {};
    var agora = Date.now();
    var status = row.assinatura_status || "ativa";
    var trialEnd = row.trial_expira_em ? new Date(row.trial_expira_em).getTime() : 0;
    var subEnd = row.assinatura_expira_em ? new Date(row.assinatura_expira_em).getTime() : null;
    var isAdmin = row.is_admin === true;
    var out = { status: status, isAdmin: isAdmin, liberado: true, motivo: "ativa", diasRestantes: null, ate: null };

    if (isAdmin) { out.motivo = "admin"; return out; }
    if (status === "ativa") {
      if (subEnd === null || subEnd > agora) {
        out.ate = subEnd;
        if (subEnd) out.diasRestantes = Math.ceil((subEnd - agora) / 86400000);
        return out;
      }
      out.liberado = false; out.motivo = "vencida"; return out;
    }
    if (status === "trial") {
      if (trialEnd > agora) {
        out.motivo = "trial"; out.ate = trialEnd;
        out.diasRestantes = Math.ceil((trialEnd - agora) / 86400000);
        return out;
      }
      out.liberado = false; out.motivo = "trial_expirado"; return out;
    }
    // vencida / cancelada
    out.liberado = false; out.motivo = status;
    return out;
  }

  ready.then(function (c) {
    c.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.replace("index.html"); return; }
      window.__nutriUser = r.data.session.user;

      c.from("profiles")
        .select("tipo,assinatura_status,trial_expira_em,assinatura_expira_em,is_admin")
        .maybeSingle()
        .then(function (res) {
          var row = (res && res.data) || {};
          var tipo = row.tipo;
          // Fail-open DELIBERADO: sem perfil/erro → não expulsa (RLS é a
          // proteção real). Só redireciona quem foi positivamente tipado.
          if (tipo === "paciente") { window.location.replace("portal-paciente.html"); return; }
          if (tipo && tipo !== "nutri") { window.location.replace(BIBLIOTECA_SITE); return; }

          // É nutri (ou tipo desconhecido → trata como nutri). Confere billing.
          var billing = parseBilling(row);
          window.NutriBilling = billing;
          window.dispatchEvent(new CustomEvent("nutri-billing-ready", { detail: billing }));

          if (!billing.liberado && !naPaginaAssinatura()) {
            window.location.replace("assinatura.html");
            return;
          }
          window.dispatchEvent(new Event("nutri-auth-ready"));
        })
        .catch(function () {
          window.dispatchEvent(new Event("nutri-auth-ready")); // fail-open
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

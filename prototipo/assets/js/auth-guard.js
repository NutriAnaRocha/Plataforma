/* ============================================================
   AUTH GUARD — protege telas internas. Sem sessão, volta ao login.
   Também trata logout em qualquer elemento com [data-logout].
   Requer supabase-client.js incluído ANTES deste arquivo.

   Além do tipo (nutri/paciente/comprador), agora também confere a
   ASSINATURA da nutri (migração 0038): trial vencido / assinatura
   vencida/cancelada → manda para assinatura.html (paywall). O gate é
   só de INTERFACE (billing); a segurança dos dados é o RLS.

   RENOVAÇÃO ASSISTIDA (migração 0099): a InfinitePay não cobra sozinha
   todo mês, então quem vence continua entrando por mais 3 dias
   (carência) e vê aqui uma barra avisando, com o botão de pagar. A
   carência é a mesma do banco — nutriplat_carencia_dias().
   ============================================================ */
(function () {
  "use strict";

  var ready = window.NutriDBReady || Promise.reject(new Error("supabase-client ausente"));

  // Para onde mandar quem comprou um e-book (não tem nada a fazer no painel).
  var BIBLIOTECA_SITE = "https://nutrianaluisarocha.com/biblioteca";

  var DIA = 86400000;
  var CARENCIA = 3 * DIA;   // igual a public.nutriplat_carencia_dias()
  var AVISAR_A_PARTIR_DE = 5; // dias — o mesmo gatilho do e-mail (vence_5d)

  // Dias de CALENDÁRIO até a data (não frações de dia): é assim que o
  // e-mail conta, e é assim que a nutri conta. Vencer amanhã às 9h ou às
  // 23h é "amanhã" nos dois casos.
  function diasAte(ts) {
    var fim = new Date(ts), hoje = new Date();
    fim.setHours(0, 0, 0, 0); hoje.setHours(0, 0, 0, 0);
    return Math.round((fim - hoje) / DIA);
  }

  function naPaginaAssinatura() {
    // Aceita a URL limpa: o servidor faz 301 de /assinatura.html para
    // /assinatura, e só com o .html aqui o paywall redirecionava em loop.
    return /(^|\/)assinatura(\.html)?\/?$/.test(location.pathname);
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
    var out = { status: status, isAdmin: isAdmin, liberado: true, motivo: "ativa", diasRestantes: null, ate: null,
                diasCarencia: null, ciclo: row.plano_ciclo || "mensal",
                pagamentos: row.assinatura_pagamentos || 0 };

    if (isAdmin) { out.motivo = "admin"; return out; }
    if (status === "ativa") {
      if (subEnd === null || subEnd > agora) {
        out.ate = subEnd;
        if (subEnd) out.diasRestantes = diasAte(subEnd);
        return out;
      }
      // Venceu, mas ainda dentro da carência: entra e vê o aviso.
      if (subEnd > agora - CARENCIA) {
        out.motivo = "carencia"; out.ate = subEnd;
        out.diasCarencia = diasAte(subEnd + CARENCIA);
        return out;
      }
      out.liberado = false; out.motivo = "vencida"; return out;
    }
    if (status === "trial") {
      if (trialEnd > agora) {
        out.motivo = "trial"; out.ate = trialEnd;
        out.diasRestantes = diasAte(trialEnd);
        return out;
      }
      out.liberado = false; out.motivo = "trial_expirado"; return out;
    }
    // vencida / cancelada
    out.liberado = false; out.motivo = status;
    return out;
  }

  /* ---------- Barra de renovação ----------
     Aparece nos últimos dias do teste/da assinatura e durante a carência.
     Só lembra e leva para o pagamento — quem bloqueia é o gate acima. */
  function fmtDia(ts) {
    try { return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }); }
    catch (e) { return ""; }
  }

  function textoBarra(b) {
    var d = b.diasRestantes;
    if (b.motivo === "carencia") {
      return {
        urgente: true, fixa: true,
        titulo: "Sua assinatura venceu em " + fmtDia(b.ate),
        sub: b.diasCarencia > 1
          ? "Você tem mais " + b.diasCarencia + " dias de acesso liberado. Renove para não perder a vitrine."
          : "Hoje é o último dia de acesso. Seus dados ficam guardados, mas a plataforma bloqueia amanhã.",
        botao: "Renovar agora"
      };
    }
    var quando = d <= 0 ? "hoje" : d === 1 ? "amanhã" : "em " + d + " dias";
    if (b.motivo === "trial" && d != null && d <= AVISAR_A_PARTIR_DE) {
      return {
        urgente: d <= 1, fixa: false,
        titulo: "Seu teste termina " + quando,
        sub: "Assine para continuar com tudo no ar e aparecer em Encontre sua nutri.",
        botao: "Assinar agora"
      };
    }
    if (b.motivo === "ativa" && d != null && d <= AVISAR_A_PARTIR_DE) {
      return {
        urgente: d <= 1, fixa: false,
        titulo: "Sua assinatura vence " + quando,
        sub: d <= 0 ? "Renove hoje para o acesso e a vitrine não pararem."
                    : "Renove até " + fmtDia(b.ate) + " para o acesso e a vitrine não pararem.",
        botao: "Renovar agora"
      };
    }
    return null;
  }

  function barraRenovacao(b) {
    if (!b || b.isAdmin || naPaginaAssinatura()) return;
    var t = textoBarra(b);
    if (!t) return;

    // Fechar some pelo resto do dia — menos na carência, que é para incomodar.
    var chave = "nutri_renov_fechado";
    var hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    try { if (!t.fixa && localStorage.getItem(chave) === hoje) return; } catch (e) { /* sem storage: mostra */ }

    var cor = t.urgente ? "#8a1a30" : "#1C5B57";
    var fundo = t.urgente ? "#fbe4e8" : "#e8f1ef";
    var borda = t.urgente ? "#f0a8b6" : "#a9cfc9";

    var bar = document.createElement("div");
    bar.id = "nutri-renovacao";
    bar.setAttribute("role", "status");
    bar.style.cssText =
      "position:fixed;z-index:40;left:16px;right:16px;bottom:16px;margin:0 auto;max-width:560px;" +
      "background:" + fundo + ";border:1px solid " + borda + ";color:" + cor + ";" +
      "border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.14);padding:14px 16px;" +
      "display:flex;gap:12px;align-items:center;flex-wrap:wrap;" +
      "font-family:'Figtree',system-ui,sans-serif;font-size:14px;line-height:1.4";

    var txt = document.createElement("div");
    txt.style.cssText = "flex:1;min-width:190px";
    var h = document.createElement("strong");
    h.style.cssText = "display:block;font-size:15px;margin-bottom:2px";
    h.textContent = t.titulo;
    var p = document.createElement("span");
    p.textContent = t.sub;
    txt.appendChild(h); txt.appendChild(p);

    var btn = document.createElement("a");
    btn.href = "assinatura.html?renovar=1";
    btn.textContent = t.botao;
    btn.style.cssText =
      "background:" + cor + ";color:#fff;text-decoration:none;font-weight:700;" +
      "padding:10px 18px;border-radius:10px;white-space:nowrap";

    bar.appendChild(txt);
    bar.appendChild(btn);

    if (!t.fixa) {
      var x = document.createElement("button");
      x.type = "button";
      x.setAttribute("aria-label", "Fechar aviso");
      x.textContent = "✕";
      x.style.cssText = "background:none;border:0;color:" + cor + ";font-size:16px;cursor:pointer;padding:4px 2px";
      x.onclick = function () {
        try { localStorage.setItem(chave, hoje); } catch (e) { /* sem storage: só some agora */ }
        bar.remove();
      };
      bar.appendChild(x);
    }
    document.body.appendChild(bar);
  }

  ready.then(function (c) {
    c.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.replace("index.html"); return; }
      window.__nutriUser = r.data.session.user;

      // .eq(id): a conta admin lê todos os perfis pela policy de curadoria, e
      // o maybeSingle() sem filtro virava erro — o fail-open abaixo salvava a
      // navegação, mas is_admin voltava vazio e o billing era lido errado.
      c.from("profiles")
        .select("tipo,assinatura_status,trial_expira_em,assinatura_expira_em,is_admin,assinatura_pagamentos,plano_ciclo")
        .eq("id", r.data.session.user.id)
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
          try { barraRenovacao(billing); } catch (e) { /* aviso nunca derruba a tela */ }
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

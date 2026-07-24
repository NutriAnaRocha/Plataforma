/* ============================================================
   SIDEBAR USER — preenche o badge do profissional (avatar, nome, CRN)
   no rodapé da sidebar de TODAS as páginas do portal do nutri.
   Fonte única: public.profiles via window.NutriPerfil (perfil-db.js).
   Requer supabase-client.js + perfil-db.js incluídos ANTES deste arquivo.
   Idempotente: só escreve quando há dado real, então não conflita com
   páginas que já preenchem o badge por conta própria (dashboard, perfil…).
   ============================================================ */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/);
    return (((p[0] || "")[0] || "") + ((p[1] || "")[0] || "")).toUpperCase();
  }

  function pintar(perfil) {
    if (!perfil) return;
    var nm = el("side-user-name");
    if (nm && perfil.nome) nm.textContent = perfil.nome;
    var cr = el("side-user-crn");
    if (cr && perfil.crn) cr.textContent = perfil.crn;

    var ini = iniciais(perfil.nome);
    [el("side-user-av"), el("user-avatar")].forEach(function (av) {
      if (!av) return;
      if (perfil.avatarUrl) {
        av.innerHTML = '<img src="' + esc(perfil.avatarUrl) + '" alt="" ' +
          'style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />';
      } else if (ini) {
        av.textContent = ini;
      }
    });
  }

  function carregar() {
    if (!window.NutriPerfil || !window.NutriPerfil.get) return;
    window.NutriPerfil.get().then(pintar).catch(function () { /* silencioso */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", carregar);
  } else {
    carregar();
  }

  // exposto para quem quiser repintar após editar o perfil na mesma página
  window.NutriSidebarUser = { refresh: carregar, paint: pintar };
})();

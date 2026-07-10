/* ============================================================
   PERFIL DB — camada de acesso ao Supabase (tabela public.profiles).
   Expõe window.NutriPerfil com get/update + troca de e-mail/senha (auth).
   RLS: cada nutri só lê/edita o próprio perfil (auth.uid() = id).
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var COLS = "id,nome,email,crn,cidade,telefone,instagram,site,bio,especialidades,notif_prefs,avatar_url," +
    "logo_url,carimbo_url,assinatura_url,area_atuacao,area_atuacao_outro,contato_profissional,brand_colors," +
    "whatsapp_config";

  // Paleta padrão (identidade Ana Luísa Rocha) — usada quando a nutri ainda
  // não personalizou as cores. Mantida em sincronia com a migração 0011.
  var CORES_PADRAO = { primaria: "#7B284C", secundaria: "#F4DCE5", destaque: "#9C3D63", fundo: "#FFFFFF" };

  function client() { return window.NutriDBReady; }

  function fromRow(r) {
    r = r || {};
    var cores = r.brand_colors && typeof r.brand_colors === "object" ? r.brand_colors : {};
    return {
      id: r.id,
      nome: r.nome || "",
      email: r.email || "",
      crn: r.crn || "",
      cidade: r.cidade || "",
      telefone: r.telefone || "",
      instagram: r.instagram || "",
      site: r.site || "",
      bio: r.bio || "",
      especialidades: Array.isArray(r.especialidades) ? r.especialidades : [],
      notifPrefs: r.notif_prefs || {},
      avatarUrl: r.avatar_url || "",
      // Identidade profissional
      logoUrl: r.logo_url || "",
      carimboUrl: r.carimbo_url || "",
      assinaturaUrl: r.assinatura_url || "",
      areaAtuacao: Array.isArray(r.area_atuacao) ? r.area_atuacao : [],
      areaAtuacaoOutro: r.area_atuacao_outro || "",
      contatoProfissional: r.contato_profissional || "",
      brandColors: {
        primaria: cores.primaria || CORES_PADRAO.primaria,
        secundaria: cores.secundaria || CORES_PADRAO.secundaria,
        destaque: cores.destaque || CORES_PADRAO.destaque,
        fundo: cores.fundo || CORES_PADRAO.fundo
      },
      whatsappConfig: (r.whatsapp_config && typeof r.whatsapp_config === "object") ? r.whatsapp_config : {}
    };
  }

  var api = {
    CORES_PADRAO: CORES_PADRAO,

    // Perfil da nutri logada (linha única via RLS).
    get: function () {
      return client().then(function (c) {
        return c.from("profiles").select(COLS).maybeSingle();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Atualiza campos do perfil. patch = subconjunto das chaves camelCase.
    update: function (patch) {
      patch = patch || {};
      var row = {};
      if ("nome" in patch) row.nome = (patch.nome || "").trim() || null;
      if ("crn" in patch) row.crn = (patch.crn || "").trim() || null;
      if ("cidade" in patch) row.cidade = (patch.cidade || "").trim() || null;
      if ("telefone" in patch) row.telefone = (patch.telefone || "").trim() || null;
      if ("instagram" in patch) row.instagram = (patch.instagram || "").trim() || null;
      if ("site" in patch) row.site = (patch.site || "").trim() || null;
      if ("bio" in patch) row.bio = (patch.bio || "").trim() || null;
      if ("especialidades" in patch) row.especialidades = patch.especialidades || [];
      if ("notifPrefs" in patch) row.notif_prefs = patch.notifPrefs || {};
      if ("avatarUrl" in patch) row.avatar_url = patch.avatarUrl || null;
      // Identidade profissional
      if ("logoUrl" in patch) row.logo_url = patch.logoUrl || null;
      if ("carimboUrl" in patch) row.carimbo_url = patch.carimboUrl || null;
      if ("assinaturaUrl" in patch) row.assinatura_url = patch.assinaturaUrl || null;
      if ("areaAtuacao" in patch) row.area_atuacao = patch.areaAtuacao || [];
      if ("areaAtuacaoOutro" in patch) row.area_atuacao_outro = (patch.areaAtuacaoOutro || "").trim() || null;
      if ("contatoProfissional" in patch) row.contato_profissional = (patch.contatoProfissional || "").trim() || null;
      if ("brandColors" in patch) row.brand_colors = patch.brandColors || {};
      if ("whatsappConfig" in patch) row.whatsapp_config = patch.whatsappConfig || {};
      var C;
      return client().then(function (c) {
        C = c;
        if (window.__nutriUser && window.__nutriUser.id) return { data: { user: window.__nutriUser } };
        return c.auth.getUser();
      }).then(function (u) {
        var uid = u && u.data && u.data.user && u.data.user.id;
        if (!uid) throw new Error("sessão ausente");
        return C.from("profiles").update(row).eq("id", uid).select(COLS).maybeSingle();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Troca o e-mail de acesso (dispara confirmação por e-mail no Supabase).
    updateEmail: function (email) {
      return client().then(function (c) {
        return c.auth.updateUser({ email: (email || "").trim() });
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    // Troca a senha do usuário logado.
    updatePassword: function (novaSenha) {
      return client().then(function (c) {
        return c.auth.updateUser({ password: novaSenha });
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    }
  };

  window.NutriPerfil = api;
})();

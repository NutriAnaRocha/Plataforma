/* ============================================================
   PERFIL DB — camada de acesso ao Supabase (tabela public.profiles).
   Expõe window.NutriPerfil com get/update + troca de e-mail/senha (auth).
   RLS: cada nutri só lê/edita o próprio perfil (auth.uid() = id).
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var COLS = "id,nome,email,crn,cidade,telefone,instagram,site,bio,especialidades,notif_prefs,avatar_url," +
    "logo_url,carimbo_url,assinatura_url,usar_assinatura,area_atuacao,area_atuacao_outro,contato_profissional,brand_colors," +
    "whatsapp_config," +
    // Perfil público / diretório (0086). perfil_status e plano_tier são
    // somente-leitura aqui: um trigger no banco recusa update nelas.
    "slug,perfil_status,perfil_recusa_motivo,apresentacao,atende_online,atende_presencial,estado," +
    "preco_consulta_cents,aceita_novos,publicado_em,plano_tier," +
    "formacao,ano_formatura,pos_graduacao,atuacao_desde,motivo_entrada," +
    "publico_atendido,como_funciona,bairro";   // 0095

  // Paleta padrão (identidade Ana Luísa Rocha) — usada quando a nutri ainda
  // não personalizou as cores. Mantida em sincronia com a migração 0011.
  var CORES_PADRAO = { primaria: "#840B55", secundaria: "#F1B2DC", destaque: "#A82670", fundo: "#FFFFFF" };

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
      // Assinatura é opcional: só entra no documento se este flag estiver ligado.
      usarAssinatura: r.usar_assinatura !== false,
      areaAtuacao: Array.isArray(r.area_atuacao) ? r.area_atuacao : [],
      areaAtuacaoOutro: r.area_atuacao_outro || "",
      contatoProfissional: r.contato_profissional || "",
      brandColors: {
        primaria: cores.primaria || CORES_PADRAO.primaria,
        secundaria: cores.secundaria || CORES_PADRAO.secundaria,
        destaque: cores.destaque || CORES_PADRAO.destaque,
        fundo: cores.fundo || CORES_PADRAO.fundo
      },
      whatsappConfig: (r.whatsapp_config && typeof r.whatsapp_config === "object") ? r.whatsapp_config : {},
      // Perfil público (diretório)
      slug: r.slug || "",
      perfilStatus: r.perfil_status || "rascunho",
      perfilRecusaMotivo: r.perfil_recusa_motivo || "",
      apresentacao: r.apresentacao || "",
      atendeOnline: r.atende_online !== false,
      atendePresencial: !!r.atende_presencial,
      estado: r.estado || "",
      precoConsultaCents: r.preco_consulta_cents == null ? null : Number(r.preco_consulta_cents),
      aceitaNovos: r.aceita_novos !== false,
      publicadoEm: r.publicado_em || "",
      planoTier: r.plano_tier || "gratis",
      formacao: r.formacao || "",
      anoFormatura: r.ano_formatura == null ? null : Number(r.ano_formatura),
      posGraduacao: Array.isArray(r.pos_graduacao) ? r.pos_graduacao : [],
      atuacaoDesde: r.atuacao_desde == null ? null : Number(r.atuacao_desde),
      motivoEntrada: r.motivo_entrada || "",
      publicoAtendido: r.publico_atendido || "",
      comoFunciona: r.como_funciona || "",
      bairro: r.bairro || ""
    };
  }

  /** Centavos → "180,00"; vazio vira null (preço é opcional na vitrine). */
  function cents(v) {
    var n = String(v == null ? "" : v).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    if (!n) return null;
    var f = Math.round(parseFloat(n) * 100);
    return isFinite(f) && f >= 0 ? f : null;
  }

  var api = {
    CORES_PADRAO: CORES_PADRAO,

    // Perfil da nutri logada. O filtro por uid é obrigatório: a conta admin vê
    // todos os perfis pela policy de curadoria, e sem ele o maybeSingle() dá
    // "multiple rows returned" — quebrava só para a Ana.
    get: function () {
      return client().then(function (c) {
        return window.NutriMeuPerfil(c, COLS);
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
      // Aceita "@perfil", "perfil" ou o link inteiro colado do app: guarda só o usuário.
      if ("instagram" in patch) row.instagram = String(patch.instagram || "").trim()
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "")
        .replace(/[/?#].*$/, "") || null;
      if ("site" in patch) row.site = (patch.site || "").trim() || null;
      if ("bio" in patch) row.bio = (patch.bio || "").trim().slice(0, 300) || null;   // bio breve
      if ("especialidades" in patch) row.especialidades = patch.especialidades || [];
      if ("notifPrefs" in patch) row.notif_prefs = patch.notifPrefs || {};
      if ("avatarUrl" in patch) row.avatar_url = patch.avatarUrl || null;
      // Identidade profissional
      if ("logoUrl" in patch) row.logo_url = patch.logoUrl || null;
      if ("carimboUrl" in patch) row.carimbo_url = patch.carimboUrl || null;
      if ("assinaturaUrl" in patch) row.assinatura_url = patch.assinaturaUrl || null;
      if ("usarAssinatura" in patch) row.usar_assinatura = !!patch.usarAssinatura;
      if ("areaAtuacao" in patch) row.area_atuacao = patch.areaAtuacao || [];
      if ("areaAtuacaoOutro" in patch) row.area_atuacao_outro = (patch.areaAtuacaoOutro || "").trim() || null;
      if ("contatoProfissional" in patch) row.contato_profissional = (patch.contatoProfissional || "").trim() || null;
      if ("brandColors" in patch) row.brand_colors = patch.brandColors || {};
      if ("whatsappConfig" in patch) row.whatsapp_config = patch.whatsappConfig || {};
      // Perfil público. perfil_status/plano_tier ficam de fora de propósito:
      // quem muda é a curadoria (aprovar_perfil) ou o pagamento.
      if ("slug" in patch) row.slug = (patch.slug || "").trim().toLowerCase() || null;
      if ("apresentacao" in patch) row.apresentacao = (patch.apresentacao || "").trim() || null;
      if ("atendeOnline" in patch) row.atende_online = !!patch.atendeOnline;
      if ("atendePresencial" in patch) row.atende_presencial = !!patch.atendePresencial;
      if ("estado" in patch) row.estado = (patch.estado || "").trim().toUpperCase().slice(0, 2) || null;
      if ("precoConsulta" in patch) row.preco_consulta_cents = cents(patch.precoConsulta);
      if ("precoConsultaCents" in patch) row.preco_consulta_cents = patch.precoConsultaCents == null ? null : Number(patch.precoConsultaCents);
      if ("aceitaNovos" in patch) row.aceita_novos = !!patch.aceitaNovos;
      if ("formacao" in patch) row.formacao = (patch.formacao || "").trim() || null;
      if ("anoFormatura" in patch) row.ano_formatura = parseInt(patch.anoFormatura, 10) || null;
      if ("posGraduacao" in patch) row.pos_graduacao = patch.posGraduacao || [];
      if ("atuacaoDesde" in patch) row.atuacao_desde = parseInt(patch.atuacaoDesde, 10) || null;
      if ("motivoEntrada" in patch) row.motivo_entrada = (patch.motivoEntrada || "").trim() || null;
      if ("publicoAtendido" in patch) row.publico_atendido = (patch.publicoAtendido || "").trim().slice(0, 400) || null;
      if ("comoFunciona" in patch) row.como_funciona = (patch.comoFunciona || "").trim().slice(0, 800) || null;
      if ("bairro" in patch) row.bairro = (patch.bairro || "").trim().slice(0, 80) || null;
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

    /* ---------- Perfil público / diretório (0086) ---------- */

    // Vocabulário curado das especialidades (alimenta os checkboxes e,
    // do outro lado, os filtros da busca pública).
    especialidades: function () {
      return client().then(function (c) {
        return c.from("especialidades").select("slug,nome").eq("ativa", true).order("ordem");
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data || [];
      });
    },

    // O endereço /nutri/<slug> já é de outra pessoa?
    slugLivre: function (slug, meuId) {
      slug = (slug || "").trim().toLowerCase();
      if (!slug) return Promise.resolve(false);
      return client().then(function (c) {
        return c.from("profiles").select("id").ilike("slug", slug).limit(1);
      }).then(function (res) {
        if (res.error) throw res.error;              // RLS pode esconder o dono;
        var r = (res.data || [])[0];                 // o banco confirma no publicar.
        return !r || r.id === meuId;
      }).catch(function () { return true; });
    },

    // Envia o perfil para a curadoria. Quem valida de verdade é o banco
    // (publicar_perfil) — a mensagem de erro dele já é escrita para a nutri ler.
    publicar: function () {
      return client().then(function (c) {
        return c.rpc("publicar_perfil");
      }).then(function (res) {
        if (res.error) throw new Error(res.error.message || "não consegui enviar");
        return res.data;   // o slug definitivo
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

/* ============================================================
   PACIENTES DB — camada de acesso ao Supabase (tabela public.pacientes).
   Expõe window.NutriPacientes com list/get/create/update/remove/seed.
   RLS garante o isolamento por nutricionista (nutricionista_id = auth.uid()).
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var COLS = "id,user_id,nome,ini,idade,sexo,objetivo,status,adesao,peso_atual,peso_inicial,meta,altura,imc,ult_consulta,prox_consulta,restricoes,anamnese,observacoes,contato,tags,evolucao,consultas,prescricoes,exames,plano,portal_features";

  var TODAS_FEATURES = ["plano", "evolucao", "consultas", "chat"];

  // DB row (snake) -> shape usado pela UI (camelCase, igual ao mock PAC_DATA)
  function fromRow(r) {
    return {
      id: r.id,
      userId: r.user_id || null,
      nome: r.nome, ini: r.ini || iniciais(r.nome),
      idade: r.idade, sexo: r.sexo,
      objetivo: r.objetivo, status: r.status || "ativo", adesao: r.adesao || 0,
      pesoAtual: numOrNull(r.peso_atual), pesoInicial: numOrNull(r.peso_inicial),
      meta: numOrNull(r.meta), altura: numOrNull(r.altura), imc: numOrNull(r.imc),
      ultConsulta: r.ult_consulta || "—", proxConsulta: r.prox_consulta || "—",
      contato: r.contato || { tel: "", email: "", cidade: "" },
      tags: r.tags || [],
      restricoes: r.restricoes || "", anamnese: r.anamnese || "", observacoes: r.observacoes || "",
      evolucao: r.evolucao || { labels: [], peso: [] },
      consultas: r.consultas || [], prescricoes: r.prescricoes || [], exames: r.exames || [],
      plano: r.plano || { titulo: null, refeicoes: [] },
      portalFeatures: Array.isArray(r.portal_features) ? r.portal_features : TODAS_FEATURES.slice()
    };
  }

  // shape da UI -> colunas para insert/update (não envia id / timestamps / nutricionista_id)
  function toRow(p) {
    var altura = numOrNull(p.altura), pesoAtual = numOrNull(p.pesoAtual);
    var imc = numOrNull(p.imc);
    if (imc == null && pesoAtual != null && altura) imc = +(pesoAtual / (altura * altura)).toFixed(1);
    return {
      nome: (p.nome || "").trim(),
      ini: iniciais(p.nome),
      idade: intOrNull(p.idade),
      sexo: p.sexo || null,
      objetivo: p.objetivo || null,
      status: p.status || "ativo",
      adesao: p.adesao == null ? 0 : intOrNull(p.adesao),
      peso_atual: pesoAtual, peso_inicial: numOrNull(p.pesoInicial),
      meta: numOrNull(p.meta), altura: altura, imc: imc,
      ult_consulta: p.ultConsulta || null, prox_consulta: p.proxConsulta || null,
      restricoes: p.restricoes || null, anamnese: p.anamnese || null, observacoes: p.observacoes || null,
      contato: p.contato || {},
      tags: p.tags || [],
      evolucao: p.evolucao || { labels: [], peso: [] },
      consultas: p.consultas || [], prescricoes: p.prescricoes || [], exames: p.exames || [],
      plano: p.plano || { titulo: null, refeicoes: [] }
    };
  }

  function iniciais(nome) {
    var parts = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    var a = parts[0][0] || "";
    var b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }
  function numOrNull(v) { if (v === "" || v == null) return null; var n = +v; return isNaN(n) ? null : n; }
  function intOrNull(v) { var n = numOrNull(v); return n == null ? null : Math.round(n); }

  function client() { return window.NutriDBReady; }

  var api = {
    fromRow: fromRow,
    toRow: toRow,
    iniciais: iniciais,

    list: function () {
      return client().then(function (c) {
        return c.from("pacientes").select(COLS).order("nome", { ascending: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    get: function (id) {
      return client().then(function (c) {
        return c.from("pacientes").select(COLS).eq("id", id).maybeSingle();
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data ? fromRow(res.data) : null;
      });
    },

    create: function (p) {
      return client().then(function (c) {
        return c.from("pacientes").insert(toRow(p)).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    update: function (id, p) {
      return client().then(function (c) {
        return c.from("pacientes").update(toRow(p)).eq("id", id).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    remove: function (id) {
      return client().then(function (c) {
        return c.from("pacientes").delete().eq("id", id);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    // Popular a conta com os pacientes de exemplo (window.PAC_DATA). Um clique, idempotência
    // fica por conta do chamador (só oferece quando a lista está vazia).
    seedExamples: function () {
      var mock = (window.PAC_DATA && window.PAC_DATA.pacientes) || [];
      if (!mock.length) return Promise.resolve([]);
      var rows = mock.map(toRow);
      return client().then(function (c) {
        return c.from("pacientes").insert(rows).select(COLS);
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    // ---- Chat (tabela mensagens) ----
    listMensagens: function (pacienteId) {
      return client().then(function (c) {
        return c.from("mensagens").select("id,autor,corpo,created_at")
          .eq("paciente_id", pacienteId).order("created_at", { ascending: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data || [];
      });
    },

    sendMensagem: function (pacienteId, autor, corpo) {
      return client().then(function (c) {
        return c.from("mensagens")
          .insert({ paciente_id: pacienteId, autor: autor, corpo: corpo })
          .select("id,autor,corpo,created_at").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
    },

    // ---- Adesão ao plano (marcação feita pelo paciente) ----
    getAdesao: function (pacienteId) {
      return client().then(function (c) {
        return c.from("plano_adesao").select("marcas").eq("paciente_id", pacienteId).maybeSingle();
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data && res.data.marcas) || {};
      });
    },
    // Adesão de vários pacientes de uma vez (para a lista). Devolve { id: marcas }.
    getAdesaoBatch: function (ids) {
      if (!ids || !ids.length) return Promise.resolve({});
      return client().then(function (c) {
        return c.from("plano_adesao").select("paciente_id,marcas").in("paciente_id", ids);
      }).then(function (res) {
        if (res.error) throw res.error;
        var map = {};
        (res.data || []).forEach(function (r) { map[r.paciente_id] = r.marcas || {}; });
        return map;
      });
    },
    setAdesao: function (pacienteId, marcas) {
      return client().then(function (c) {
        return c.from("plano_adesao").upsert(
          { paciente_id: pacienteId, marcas: marcas || {}, updated_at: new Date().toISOString() },
          { onConflict: "paciente_id" }
        );
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    // ---- Entitlements ----
    // Features do portal que ESTE paciente enxerga (subconjunto de TODAS_FEATURES).
    setPortalFeatures: function (pacienteId, features) {
      var clean = (features || []).filter(function (f) { return TODAS_FEATURES.indexOf(f) >= 0; });
      return client().then(function (c) {
        return c.from("pacientes").update({ portal_features: clean }).eq("id", pacienteId)
          .select("id,portal_features").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data.portal_features;
      });
    },

    // ---- Criar login do paciente (Edge Function com service_role) ----
    // Devolve { ok, user_id, email, senha } ou lança Error com .code (o "error" da function).
    criarAcessoPaciente: function (pacienteId, email, senha) {
      return client().then(function (c) {
        return c.functions.invoke("create-patient-access", {
          body: { paciente_id: pacienteId, email: email, senha: senha || undefined }
        });
      }).then(function (res) {
        if (res.error) {
          // functions.invoke embrulha erro HTTP; tenta extrair o código do corpo.
          var e = new Error("falha_function");
          try {
            return res.error.context.json().then(function (b) {
              e.code = (b && b.error) || "erro"; e.detail = b && b.detail; throw e;
            });
          } catch (x) { e.code = "erro_rede"; throw e; }
        }
        if (res.data && res.data.error) { var e2 = new Error(res.data.error); e2.code = res.data.error; throw e2; }
        return res.data;
      });
    }
  };

  api.TODAS_FEATURES = TODAS_FEATURES;
  window.NutriPacientes = api;
})();

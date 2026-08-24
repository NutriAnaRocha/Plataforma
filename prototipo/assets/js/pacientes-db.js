/* ============================================================
   PACIENTES DB — camada de acesso ao Supabase (tabela public.pacientes).
   Expõe window.NutriPacientes com list/get/create/update/remove/seed.
   RLS garante o isolamento por nutricionista (nutricionista_id = auth.uid()).
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var COLS = "id,user_id,nome,ini,idade,data_nascimento,cpf,foto_url,sexo,objetivo,status,adesao,peso_atual,peso_inicial,meta,altura,imc,ult_consulta,prox_consulta,restricoes,anamnese,observacoes,contato,tags,antropometria,evolucao,consultas,prescricoes,orientacoes,exames,questionarios,plano,portal_features,prontuario,created_at";

  // Idade (anos completos) a partir de uma data ISO "YYYY-MM-DD".
  function idadeDeNascimento(iso) {
    if (!iso) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
    if (!m) return null;
    var hoje = new Date();
    var anos = hoje.getFullYear() - (+m[1]);
    var mes = (hoje.getMonth() + 1) - (+m[2]);
    if (mes < 0 || (mes === 0 && hoje.getDate() < (+m[3]))) anos--;
    return (anos >= 0 && anos < 130) ? anos : null;
  }

  var TODAS_FEATURES = ["plano", "evolucao", "consultas", "chat", "intestino", "ciclo"];

  /* Features que NÃO nascem ligadas. "Meu ciclo" e "Meu intestino" são
     espaços de registro íntimo: quem decide abrir é a nutri, na ficha,
     paciente por paciente. Se entrassem no padrão, todo mundo que ainda
     tem portal_features nulo (a maioria dos pacientes antigos) receberia
     de presente um módulo de ciclo menstrual sem ninguém ter pedido. */
  var FEATURES_OPT_IN = ["intestino", "ciclo"];
  var FEATURES_PADRAO = TODAS_FEATURES.filter(function (f) { return FEATURES_OPT_IN.indexOf(f) < 0; });

  // Teto de features por plano de assinatura da nutri (profiles.plano_nutri).
  // 'full' libera tudo. Os planos comerciais ainda não foram definidos pela Ana:
  // quando forem, basta acrescentar entradas aqui (ex.: basico/pro abaixo) e gravar
  // o plano_nutri correspondente no perfil dela — o teto passa a valer sozinho na UI.
  var TIER_FEATURES = {
    full: TODAS_FEATURES.slice()
    // , basico: ["plano", "evolucao"]
    // , pro:    ["plano", "evolucao", "consultas", "chat"]
  };
  function tierFeatures(tier) {
    return TIER_FEATURES[tier] ? TIER_FEATURES[tier].slice() : TODAS_FEATURES.slice(); // desconhecido → não restringe
  }
  var _planoNutri = null; // cache do plano da nutri logada (1 fetch por sessão)
  var _dicasCache = {};   // modulo -> dicas (conteúdo editorial, não muda na sessão)

  // "YYYY-MM-DD" de N dias atrás — recorte das séries de registro diário.
  function desdeISO(dias) {
    var d = new Date();
    d.setDate(d.getDate() - (dias || 30));
    var p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  }

  // DB row (snake) -> shape usado pela UI (camelCase, igual ao mock PAC_DATA)
  function fromRow(r) {
    return {
      id: r.id,
      userId: r.user_id || null,
      nome: r.nome, ini: r.ini || iniciais(r.nome),
      idade: r.idade, dataNascimento: r.data_nascimento || "",
      cpf: r.cpf || "", fotoUrl: r.foto_url || "",
      antropometria: (r.antropometria && typeof r.antropometria === "object") ? r.antropometria : {},
      sexo: r.sexo,
      objetivo: r.objetivo, status: r.status || "ativo", adesao: r.adesao || 0,
      pesoAtual: numOrNull(r.peso_atual), pesoInicial: numOrNull(r.peso_inicial),
      meta: numOrNull(r.meta), altura: numOrNull(r.altura), imc: numOrNull(r.imc),
      ultConsulta: r.ult_consulta || "—", proxConsulta: r.prox_consulta || "—",
      contato: r.contato || { tel: "", email: "", cidade: "" },
      tags: r.tags || [],
      restricoes: r.restricoes || "", anamnese: r.anamnese || "", observacoes: r.observacoes || "",
      evolucao: r.evolucao || { labels: [], peso: [] },
      consultas: r.consultas || [], prescricoes: r.prescricoes || [], exames: r.exames || [],
      orientacoes: Array.isArray(r.orientacoes) ? r.orientacoes : [],
      questionarios: Array.isArray(r.questionarios) ? r.questionarios : [],
      plano: r.plano || { titulo: null, refeicoes: [] },
      treino: (r.treino && typeof r.treino === "object") ? r.treino : null,
      metas: (r.metas && typeof r.metas === "object") ? r.metas : null,
      calculos: (r.calculos && typeof r.calculos === "object") ? r.calculos : null,
      portalFeatures: Array.isArray(r.portal_features) ? r.portal_features : FEATURES_PADRAO.slice(),
      prontuario: r.prontuario || null,
      criadoEm: r.created_at || ""
    };
  }

  // shape da UI -> colunas para insert/update (não envia id / timestamps / nutricionista_id)
  function toRow(p) {
    var altura = numOrNull(p.altura), pesoAtual = numOrNull(p.pesoAtual);
    var imc = numOrNull(p.imc);
    if (imc == null && pesoAtual != null && altura) imc = +(pesoAtual / (altura * altura)).toFixed(1);
    // Nascimento manda: se informado, a idade é calculada automaticamente.
    var nasc = (p.dataNascimento || "").trim() || null;
    var idade = intOrNull(p.idade);
    if (nasc) { var calc = idadeDeNascimento(nasc); if (calc != null) idade = calc; }
    return {
      nome: (p.nome || "").trim(),
      ini: iniciais(p.nome),
      idade: idade,
      data_nascimento: nasc,
      cpf: (p.cpf || "").trim() || null,
      foto_url: p.fotoUrl || null,
      antropometria: p.antropometria || {},
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
        return c.from("pacientes").select("*").order("nome", { ascending: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    get: function (id) {
      return client().then(function (c) {
        return c.from("pacientes").select("*").eq("id", id).maybeSingle();
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data ? fromRow(res.data) : null;
      });
    },

    create: function (p) {
      return client().then(function (c) {
        return c.from("pacientes").insert(toRow(p)).select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Insert em lote (importação de outra plataforma). Devolve os criados.
    // Um erro derruba o lote inteiro — quem chama reparte e tenta de novo.
    createMany: function (lista) {
      if (!lista || !lista.length) return Promise.resolve([]);
      return client().then(function (c) {
        return c.from("pacientes").insert(lista.map(toRow)).select("*");
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    update: function (id, p) {
      return client().then(function (c) {
        return c.from("pacientes").update(toRow(p)).eq("id", id).select("*").single();
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

    // ---- Fotos de evolução (bucket privado 'evolucao') ----
    // Caminho: '<pacienteId>/<fotoId>.jpg'. RLS libera a nutri dona (gerir)
    // e o paciente dono (ler). Ver migração 0035.
    uploadFotoEvolucao: function (pacienteId, fotoId, blob) {
      var path = pacienteId + "/" + fotoId + ".jpg";
      return client().then(function (c) {
        return c.storage.from("evolucao").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return path;
      });
    },
    removerFotoEvolucao: function (path) {
      if (!path) return Promise.resolve(true);
      return client().then(function (c) {
        return c.storage.from("evolucao").remove([path]);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },
    // Gera URLs assinadas (temporárias) para uma lista de caminhos.
    // Devolve um mapa { path: signedUrl }. Caminhos que falharem ficam de fora.
    assinarFotosEvolucao: function (paths, expiresIn) {
      var lista = (paths || []).filter(Boolean);
      if (!lista.length) return Promise.resolve({});
      return client().then(function (c) {
        return c.storage.from("evolucao").createSignedUrls(lista, expiresIn || 7200);
      }).then(function (res) {
        if (res.error) throw res.error;
        var mapa = {};
        (res.data || []).forEach(function (r) { if (r && r.signedUrl && !r.error) mapa[r.path] = r.signedUrl; });
        return mapa;
      });
    },

    // ---- Fotos da refeição do plano (bucket privado 'refeicoes') ----
    // Mesma convenção de caminho e mesmas regras das fotos de evolução
    // ('<pacienteId>/<fotoId>.jpg'): a nutri dona gere, a paciente dona lê.
    // Ver migração 0049.
    uploadFotoRefeicao: function (pacienteId, fotoId, blob) {
      var path = pacienteId + "/" + fotoId + ".jpg";
      return client().then(function (c) {
        return c.storage.from("refeicoes").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return path;
      });
    },
    removerFotoRefeicao: function (path) {
      if (!path) return Promise.resolve(true);
      return client().then(function (c) {
        return c.storage.from("refeicoes").remove([path]);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },
    assinarFotosRefeicao: function (paths, expiresIn) {
      var lista = (paths || []).filter(Boolean);
      if (!lista.length) return Promise.resolve({});
      return client().then(function (c) {
        return c.storage.from("refeicoes").createSignedUrls(lista, expiresIn || 7200);
      }).then(function (res) {
        if (res.error) throw res.error;
        var mapa = {};
        (res.data || []).forEach(function (r) { if (r && r.signedUrl && !r.error) mapa[r.path] = r.signedUrl; });
        return mapa;
      });
    },

    /* ---- Diário do prato (bucket 'pratos' + pratos_registrados) ----
       Aqui quem envia é a PACIENTE, ao contrário de 'refeicoes'. A linha
       com kcal/macros não é gravada daqui: quem grava é a edge function
       'analisar-prato', com service_role — se o cliente pudesse dar
       insert, a paciente digitaria os próprios números e a nutri leria
       como estimativa da IA. Ver migração 0050. */
    uploadPrato: function (pacienteId, id, blob) {
      var path = pacienteId + "/" + id + ".jpg";
      return client().then(function (c) {
        return c.storage.from("pratos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      }).then(function (res) {
        if (res.error) throw res.error;
        return path;
      });
    },

    analisarPrato: function (fotoPath, refeicao, observacao) {
      return client().then(function (c) {
        return c.functions.invoke("analisar-prato", {
          body: { foto_path: fotoPath, refeicao: refeicao || "", observacao: observacao || "" }
        });
      }).then(function (res) {
        if (res.error) {
          // functions.invoke embrulha erro HTTP; o motivo real está no corpo.
          if (res.error.context && res.error.context.json) {
            return res.error.context.json().then(function (b) {
              throw new Error((b && (b.detail || b.error)) || "falha");
            });
          }
          throw new Error("falha");
        }
        return res.data || {};
      });
    },

    listPratos: function (pacienteId, limite) {
      return client().then(function (c) {
        return c.from("pratos_registrados").select("*")
          .eq("paciente_id", pacienteId)
          .order("criado_em", { ascending: false })
          .limit(limite || 30);
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data || [];
      });
    },

    // Apaga a linha E a foto. A foto primeiro seria pior: se a linha
    // falhasse, sobraria um registro apontando para imagem inexistente.
    removerPrato: function (id, fotoPath) {
      return client().then(function (c) {
        return c.from("pratos_registrados").delete().eq("id", id).then(function (res) {
          if (res.error) throw res.error;
          return fotoPath ? c.storage.from("pratos").remove([fotoPath]) : null;
        });
      }).then(function () { return true; });
    },

    /* Comentário da nutri em um prato. A única escrita que o cliente faz
       nesta tabela — e o banco só deixa passar estas duas colunas, para
       a nutri não reescrever a estimativa da IA (migração 0057).
       Texto vazio apaga o comentário. */
    comentarPrato: function (id, texto) {
      var t = String(texto == null ? "" : texto).trim();
      return client().then(function (c) {
        return c.from("pratos_registrados")
          .update({ comentario_nutri: t || null, comentario_em: t ? new Date().toISOString() : null })
          .eq("id", id);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    /* Reação da nutri (emoji) no prato. Mesma trava do comentário: o
       banco só aceita estas colunas (migração 0061). Emoji vazio tira a
       reação — clicar de novo no mesmo emoji desmarca. */
    reagirPrato: function (id, emoji) {
      var e = String(emoji == null ? "" : emoji).trim();
      return client().then(function (c) {
        return c.from("pratos_registrados")
          .update({ reacao_nutri: e || null, reacao_em: e ? new Date().toISOString() : null })
          .eq("id", id);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    assinarFotosPrato: function (paths, expiresIn) {
      var lista = (paths || []).filter(Boolean);
      if (!lista.length) return Promise.resolve({});
      return client().then(function (c) {
        return c.storage.from("pratos").createSignedUrls(lista, expiresIn || 7200);
      }).then(function (res) {
        if (res.error) throw res.error;
        var mapa = {};
        (res.data || []).forEach(function (r) { if (r && r.signedUrl && !r.error) mapa[r.path] = r.signedUrl; });
        return mapa;
      });
    },

    // Popular a conta com os pacientes de exemplo (window.PAC_DATA). Um clique, idempotência
    // fica por conta do chamador (só oferece quando a lista está vazia).
    seedExamples: function () {
      var mock = (window.PAC_DATA && window.PAC_DATA.pacientes) || [];
      if (!mock.length) return Promise.resolve([]);
      var rows = mock.map(toRow);
      return client().then(function (c) {
        return c.from("pacientes").insert(rows).select("*");
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    /* ---- Meu intestino feliz (0067) e Meu ciclo (0068) ----
       O oposto do diário do prato: aqui quem escreve é o PACIENTE, pelo
       client mesmo, porque o dado É o relato dele. A nutri só lê (a RLS
       garante). Um registro por dia: upsert em (paciente_id, data), para
       a tela poder salvar sozinha enquanto ela mexe nos chips sem criar
       cinco linhas do mesmo dia. */
    listIntestino: function (pacienteId, dias) {
      return client().then(function (c) {
        return c.from("intestino_registros").select("*")
          .eq("paciente_id", pacienteId)
          .gte("data", desdeISO(dias || 60))
          .order("data", { ascending: false });
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data || [];
      });
    },

    salvarIntestino: function (pacienteId, reg) {
      var row = {
        paciente_id: pacienteId,
        data: reg.data,
        classificacao: reg.classificacao,
        bristol: reg.bristol == null || reg.bristol === "" ? null : +reg.bristol,
        evacuacoes: reg.evacuacoes == null ? 0 : +reg.evacuacoes,
        sintomas: Array.isArray(reg.sintomas) ? reg.sintomas : [],
        observacao: (reg.observacao || "").trim() || null,
        atualizado_em: new Date().toISOString()
      };
      return client().then(function (c) {
        return c.from("intestino_registros").upsert(row, { onConflict: "paciente_id,data" })
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
    },

    removerIntestino: function (pacienteId, data) {
      return client().then(function (c) {
        return c.from("intestino_registros").delete()
          .eq("paciente_id", pacienteId).eq("data", data);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    listCiclo: function (pacienteId, dias) {
      return client().then(function (c) {
        return c.from("ciclo_registros").select("*")
          .eq("paciente_id", pacienteId)
          .gte("data", desdeISO(dias || 400))   // ~13 ciclos: o bastante para média e regularidade
          .order("data", { ascending: false });
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data || [];
      });
    },

    salvarCiclo: function (pacienteId, reg) {
      var row = {
        paciente_id: pacienteId,
        data: reg.data,
        fluxo: reg.fluxo || "nenhum",
        sintomas: Array.isArray(reg.sintomas) ? reg.sintomas : [],
        // `humores` é a fonte (0069). `humor` segue gravado com o primeiro
        // item só para não quebrar leitura antiga.
        humores: Array.isArray(reg.humores) ? reg.humores : (reg.humor ? [reg.humor] : []),
        humor: (Array.isArray(reg.humores) && reg.humores[0]) || reg.humor || null,
        energia: reg.energia == null || reg.energia === "" ? null : +reg.energia,
        libido: reg.libido == null || reg.libido === "" ? null : +reg.libido,
        observacao: (reg.observacao || "").trim() || null,
        atualizado_em: new Date().toISOString()
      };
      return client().then(function (c) {
        return c.from("ciclo_registros").upsert(row, { onConflict: "paciente_id,data" })
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
    },

    removerCiclo: function (pacienteId, data) {
      return client().then(function (c) {
        return c.from("ciclo_registros").delete()
          .eq("paciente_id", pacienteId).eq("data", data);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    /* Dicas curadas pela nutri (tabela editorial, mesma para todo mundo).
       Uma consulta por módulo, cacheada na sessão: o conteúdo não muda
       enquanto a paciente está com a tela aberta. */
    listDicas: function (modulo) {
      if (_dicasCache[modulo]) return Promise.resolve(_dicasCache[modulo]);
      return client().then(function (c) {
        return c.from("dicas_conteudo").select("gatilho,tipo,emoji,titulo,texto,ordem")
          .eq("modulo", modulo).eq("ativo", true)
          .order("ordem", { ascending: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        _dicasCache[modulo] = res.data || [];
        return _dicasCache[modulo];
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
    // Prontuário completo (jsonb) — salva o objeto inteiro na ficha do paciente.
    saveProntuario: function (id, prontuario) {
      return client().then(function (c) {
        return c.from("pacientes").update({ prontuario: prontuario || null }).eq("id", id)
          .select("id").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    },

    // Questionários / anamneses de retorno (jsonb array) — grava só essa coluna
    // (não passa pelo toRow, isolando a dependência do resto da ficha) e devolve
    // o paciente atualizado no shape da UI.
    saveQuestionarios: function (id, lista) {
      return client().then(function (c) {
        return c.from("pacientes").update({ questionarios: lista || [] }).eq("id", id)
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Orientações entregues ao paciente (jsonb array) — grava só essa coluna.
    saveOrientacoes: function (id, lista) {
      return client().then(function (c) {
        return c.from("pacientes").update({ orientacoes: lista || [] }).eq("id", id)
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Treino em casa (jsonb) — grava só essa coluna.
    saveTreino: function (id, treino) {
      return client().then(function (c) {
        return c.from("pacientes").update({ treino: treino || null }).eq("id", id)
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Cálculos nutricionais (jsonb) — grava só essa coluna.
    saveCalculos: function (id, calculos) {
      return client().then(function (c) {
        return c.from("pacientes").update({ calculos: calculos || null }).eq("id", id)
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Metas / checklist (jsonb) — grava só essa coluna.
    saveMetas: function (id, metas) {
      return client().then(function (c) {
        return c.from("pacientes").update({ metas: metas || null }).eq("id", id)
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Prescrições do paciente (jsonb array) — grava só essa coluna.
    savePrescricoes: function (id, lista) {
      return client().then(function (c) {
        return c.from("pacientes").update({ prescricoes: lista || [] }).eq("id", id)
          .select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
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
    // Plano de assinatura da nutri logada (teto de features). Cacheado; 'full' em caso de erro.
    getPlanoNutri: function () {
      if (_planoNutri) return Promise.resolve(_planoNutri);
      return client().then(function (c) {
        return c.from("profiles").select("plano_nutri").maybeSingle();
      }).then(function (res) {
        if (res.error) throw res.error;
        _planoNutri = (res.data && res.data.plano_nutri) || "full";
        return _planoNutri;
      }).catch(function () { return "full"; });
    },
    // Features que o plano da nutri permite oferecer (teto). Subconjunto de TODAS_FEATURES.
    featuresPermitidas: function () {
      return this.getPlanoNutri().then(function (t) { return tierFeatures(t); });
    },

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

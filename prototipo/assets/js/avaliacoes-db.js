/* ============================================================
   AVALIAÇÕES DB — acesso à tabela public.paciente_avaliacoes
   (migração 0076). Expõe window.NutriAvaliacoes.

   Cada linha é UMA avaliação antropométrica no tempo. A avaliação
   corrente continua em pacientes.antropometria (é o que o plano
   alimentar e os cálculos leem); aqui fica a série que alimenta o
   gráfico de evolução.

   Salvar duas vezes no mesmo dia CORRIGE a avaliação do dia — o
   índice único (paciente_id, data) faz o upsert, para o gráfico não
   ganhar dois pontos por um clique repetido.
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var COLS = "id,paciente_id,data,peso,altura,imc,gordura_pct,massa_gorda,massa_magra," +
             "cintura,quadril,abdomen,soma_dobras,observacao,dados,created_at";

  function client() { return window.NutriDBReady; }
  function n(v) { var x = parseFloat(v); return isNaN(x) ? null : x; }

  function fromRow(r) {
    return {
      id: r.id,
      pacienteId: r.paciente_id,
      data: String(r.data || "").slice(0, 10),
      peso: n(r.peso), altura: n(r.altura), imc: n(r.imc),
      gorduraPct: n(r.gordura_pct), massaGorda: n(r.massa_gorda), massaMagra: n(r.massa_magra),
      cintura: n(r.cintura), quadril: n(r.quadril), abdomen: n(r.abdomen),
      somaDobras: n(r.soma_dobras),
      observacao: r.observacao || "",
      /* De onde veio o %G: dobras medidas (Pollock) ou a estimativa por
         circunferencia do Raio X. Sao metodos diferentes — a evolucao avisa
         quando a serie mistura os dois, senao a nutri compara laranja com maca. */
      gorduraOrigem: (r.dados && r.dados.gorduraPct != null) ? "dobras"
                   : (r.gordura_pct != null ? "estimativa" : ""),
      dados: r.dados || {},
      criadoEm: r.created_at || ""
    };
  }

  /* Monta a linha a partir do objeto `antropometria` da ficha — assim o
     chamador não precisa saber onde cada medida mora no jsonb. O %G
     preferido é o das dobras (medida direta); sem as 7 dobras, cai na
     estimativa do Raio X, que só usa circunferências. */
  function toRow(pacienteId, antropo, data, observacao) {
    var a = antropo || {}, c = a.circunferencias || {}, rx = a.raioX || {};
    var gord = a.gorduraPct != null ? a.gorduraPct : (rx.gorduraPct != null ? rx.gorduraPct : null);
    var mg = a.massaGorda != null ? a.massaGorda : (rx.massaGordaKg != null ? rx.massaGordaKg : null);
    var mm = a.massaMagra != null ? a.massaMagra : (rx.massaMagraKg != null ? rx.massaMagraKg : null);
    return {
      paciente_id: pacienteId,
      data: data,
      peso: n(a.peso), altura: n(a.altura), imc: n(a.imc),
      gordura_pct: n(gord), massa_gorda: n(mg), massa_magra: n(mm),
      cintura: n(c.cintura), quadril: n(c.quadril), abdomen: n(c.abdomen),
      soma_dobras: n(a.somaDobras),
      observacao: (observacao || "").trim() || null,
      dados: a
    };
  }

  window.NutriAvaliacoes = {
    // Série do paciente, da mais ANTIGA para a mais nova (ordem do gráfico).
    list: function (pacienteId) {
      return client().then(function (c) {
        return c.from("paciente_avaliacoes").select(COLS)
          .eq("paciente_id", pacienteId)
          .order("data", { ascending: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    /* Grava a avaliação do dia. onConflict na chave (paciente_id, data)
       para o segundo clique corrigir em vez de duplicar. */
    salvar: function (pacienteId, antropo, data, observacao) {
      var row = toRow(pacienteId, antropo, data || new Date().toISOString().slice(0, 10), observacao);
      return client().then(function (c) {
        return c.from("paciente_avaliacoes")
          .upsert(row, { onConflict: "paciente_id,data" })
          .select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    remove: function (id) {
      return client().then(function (c) {
        return c.from("paciente_avaliacoes").delete().eq("id", id);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    }
  };
})();

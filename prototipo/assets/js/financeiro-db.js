/* ============================================================
   FINANCEIRO DB — acesso à tabela public.lancamentos (migração 0040).
   Expõe window.NutriFinanceiro com list/create/update/remove.
   RLS isola por nutricionista_id = auth.uid().
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";
  var COLS = "id,paciente_id,paciente_nome,descricao,valor_cents,metodo,status,data,created_at";
  function client() { return window.NutriDBReady; }

  function fromRow(r) {
    return {
      id: r.id,
      pacienteId: r.paciente_id || null,
      paciente: r.paciente_nome || "",
      descricao: r.descricao || "",
      valor: (r.valor_cents || 0) / 100,
      valorCents: r.valor_cents || 0,
      metodo: r.metodo || "",
      status: r.status || "pago",
      data: r.data,
      criadoEm: r.created_at || ""
    };
  }
  function toRow(l) {
    var cents = l.valorCents != null ? l.valorCents : Math.round((parseFloat(l.valor) || 0) * 100);
    var row = {
      paciente_nome: (l.paciente || "").trim() || null,
      descricao: (l.descricao || "").trim() || null,
      valor_cents: cents,
      metodo: (l.metodo || "").trim() || null,
      status: l.status || "pago",
      data: l.data || null
    };
    if ("pacienteId" in l) row.paciente_id = l.pacienteId || null;
    return row;
  }

  window.NutriFinanceiro = {
    // Lançamentos a partir de uma data ISO (inclusive), mais recentes primeiro.
    listDesde: function (fromISO) {
      return client().then(function (c) {
        var q = c.from("lancamentos").select(COLS).order("data", { ascending: false });
        if (fromISO) q = q.gte("data", fromISO);
        return q;
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },
    /* Lançamentos de UM paciente (ficha → aba Financeiro). Sem recorte de
       data: a ficha é o histórico inteiro dele, não o mês corrente. */
    listPorPaciente: function (pacienteId) {
      return client().then(function (c) {
        return c.from("lancamentos").select(COLS)
          .eq("paciente_id", pacienteId)
          .order("data", { ascending: false });
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },
    create: function (l) {
      return client().then(function (c) {
        return c.from("lancamentos").insert(toRow(l)).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },
    update: function (id, l) {
      return client().then(function (c) {
        return c.from("lancamentos").update(toRow(l)).eq("id", id).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },
    remove: function (id) {
      return client().then(function (c) {
        return c.from("lancamentos").delete().eq("id", id);
      }).then(function (res) { if (res.error) throw res.error; return true; });
    }
  };
})();

/* ============================================================
   CONSULTAS DB — camada de acesso ao Supabase (tabela public.consultas).
   Expõe window.NutriConsultas com listRange/create/update/remove.
   RLS: nutri gerencia as próprias; paciente só lê as da própria ficha.
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var COLS = "id,paciente_id,paciente_nome,data,inicio,fim,tipo,modo,status,observacoes";

  function client() { return window.NutriDBReady; }
  function hhmm(t) { return t ? String(t).slice(0, 5) : t; }   // 'HH:MM:SS' -> 'HH:MM'

  function fromRow(r) {
    return {
      id: r.id,
      pacienteId: r.paciente_id || null,
      pacienteNome: r.paciente_nome || "",
      data: r.data,                 // 'YYYY-MM-DD'
      inicio: hhmm(r.inicio),
      fim: hhmm(r.fim),
      tipo: r.tipo || "",
      modo: r.modo || "Presencial",
      status: r.status || "proxima",
      observacoes: r.observacoes || ""
    };
  }

  function toRow(c) {
    var row = {
      paciente_nome: (c.pacienteNome || "").trim(),
      data: c.data,
      inicio: c.inicio,
      fim: c.fim,
      tipo: c.tipo || null,
      modo: c.modo || "Presencial",
      status: c.status || "proxima",
      observacoes: c.observacoes || null
    };
    if ("pacienteId" in c) row.paciente_id = c.pacienteId || null;
    return row;
  }

  var api = {
    fromRow: fromRow,

    // Consultas entre duas datas (ISO 'YYYY-MM-DD'), inclusivo.
    listRange: function (fromISO, toISO) {
      return client().then(function (c) {
        return c.from("consultas").select(COLS)
          .gte("data", fromISO).lte("data", toISO)
          .order("data", { ascending: true }).order("inicio", { ascending: true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    create: function (c) {
      return client().then(function (cl) {
        return cl.from("consultas").insert(toRow(c)).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    update: function (id, patch) {
      return client().then(function (cl) {
        return cl.from("consultas").update(toRow(patch)).eq("id", id).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    // Só o status (concluir/cancelar) — evita reescrever a linha inteira.
    setStatus: function (id, status) {
      return client().then(function (cl) {
        return cl.from("consultas").update({ status: status }).eq("id", id).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    remove: function (id) {
      return client().then(function (cl) {
        return cl.from("consultas").delete().eq("id", id);
      }).then(function (res) {
        if (res.error) throw res.error;
        return true;
      });
    }
  };

  window.NutriConsultas = api;
})();

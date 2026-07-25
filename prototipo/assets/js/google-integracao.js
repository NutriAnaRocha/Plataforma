/* ============================================================
   GOOGLE INTEGRAÇÃO — camada de acesso à conexão Google Agenda/Meet.
   Expõe window.NutriGoogle:
     status()             -> Promise<{conectado, email} | null>
     connect(returnTo)    -> redireciona o navegador ao consentimento Google
     disconnect()         -> apaga a conexão (desconecta)
     sync(consultaId, action) -> espelha a consulta no Google Calendar
   Requer supabase-client.js incluído ANTES deste arquivo.
   Sem banco (file://): tudo vira no-op silencioso.
   ============================================================ */
(function () {
  "use strict";

  function client() { return window.NutriDBReady; }

  var api = {
    /* Status da conexão da nutri logada (lê google_conta via RLS própria). */
    status: function () {
      if (!window.NutriDBReady) return Promise.resolve(null);
      return client().then(function (c) {
        return c.from("google_conta").select("email,conectado").maybeSingle();
      }).then(function (res) {
        if (res.error || !res.data) return null;
        return { conectado: !!res.data.conectado, email: res.data.email || "" };
      }).catch(function () { return null; });
    },

    /* Inicia o OAuth: pede a URL à edge function e redireciona o navegador. */
    connect: function (returnTo) {
      if (!window.NutriDBReady) return Promise.reject(new Error("sem_banco"));
      return client().then(function (c) {
        return c.functions.invoke("google-oauth-start", {
          body: { returnTo: returnTo || location.href }
        });
      }).then(function (res) {
        if (res.error) throw res.error;
        var url = res.data && res.data.url;
        if (!url) throw new Error((res.data && res.data.error) || "sem_url");
        window.location.href = url;   // sai da página rumo ao Google
      });
    },

    /* Desconecta: apaga a própria linha de conta e do cofre (RLS de delete). */
    disconnect: function () {
      if (!window.NutriDBReady) return Promise.resolve();
      return client().then(function (c) {
        return Promise.all([
          c.from("google_secret").delete().neq("nutricionista_id", "00000000-0000-0000-0000-000000000000"),
          c.from("google_conta").delete().neq("nutricionista_id", "00000000-0000-0000-0000-000000000000")
        ]);
      });
    },

    /* Espelha uma consulta no Google. action: undefined (upsert) | 'delete'.
       Falha aqui NÃO deve derrubar o fluxo da agenda (a consulta já foi salva),
       então quem chama trata como best-effort. */
    sync: function (consultaId, action) {
      if (!window.NutriDBReady || !consultaId) return Promise.resolve({ skipped: true });
      return client().then(function (c) {
        return c.functions.invoke("google-calendar-sync", {
          body: { consultaId: consultaId, action: action || undefined }
        });
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data || {};
      });
    }
  };

  window.NutriGoogle = api;
})();

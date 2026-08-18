/* ============================================================
   ARQUIVOS DB — acesso à tabela public.paciente_arquivos + bucket
   privado 'arquivos' (migração 0070). Expõe window.NutriArquivos.
   O binário nunca passa pela linha: sobe para o bucket e a tabela
   guarda o caminho. RLS: a nutri dona gerencia; o paciente vê só o
   que estiver com visivel_paciente = true.
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var COLS = "id,paciente_id,nome,categoria,path,mime,tamanho_bytes,visivel_paciente,observacao,created_at";
  var MAX_BYTES = 20 * 1024 * 1024; // 20 MB por arquivo

  function client() { return window.NutriDBReady; }

  function fromRow(r) {
    return {
      id: r.id,
      pacienteId: r.paciente_id,
      nome: r.nome || "",
      categoria: r.categoria || "outros",
      path: r.path,
      mime: r.mime || "",
      tamanho: r.tamanho_bytes || 0,
      visivel: !!r.visivel_paciente,
      observacao: r.observacao || "",
      criadoEm: r.created_at || ""
    };
  }

  // Extensão a partir do nome (sem ponto, minúscula, no máx. 8 chars —
  // evita que um nome esquisito vire um caminho gigante no bucket).
  function extDe(nome) {
    var m = /\.([A-Za-z0-9]{1,8})$/.exec(String(nome || ""));
    return m ? m[1].toLowerCase() : "bin";
  }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  window.NutriArquivos = {
    MAX_BYTES: MAX_BYTES,

    // Arquivos de um paciente, mais recentes primeiro.
    // (No portal, a RLS já devolve só os liberados.)
    list: function (pacienteId) {
      return client().then(function (c) {
        return c.from("paciente_arquivos").select(COLS)
          .eq("paciente_id", pacienteId)
          .order("created_at", { ascending: false });
      }).then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(fromRow);
      });
    },

    /* Envia um File do input e registra a linha. Se o insert falhar, o
       objeto recém-enviado é apagado — senão o bucket junta órfão que
       ninguém mais enxerga (mesma precaução do diário do prato). */
    upload: function (pacienteId, file, meta) {
      meta = meta || {};
      if (!file) return Promise.reject(new Error("Nenhum arquivo selecionado."));
      if (file.size > MAX_BYTES) {
        return Promise.reject(new Error("Arquivo maior que 20 MB. Comprima ou divida antes de enviar."));
      }
      var path = pacienteId + "/" + uuid() + "." + extDe(file.name);
      return client().then(function (c) {
        return c.storage.from("arquivos")
          .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false })
          .then(function (up) {
            if (up.error) throw up.error;
            return c.from("paciente_arquivos").insert({
              paciente_id: pacienteId,
              nome: (file.name || "arquivo").slice(0, 180),
              categoria: meta.categoria || "outros",
              path: path,
              mime: file.type || null,
              tamanho_bytes: file.size || 0,
              visivel_paciente: !!meta.visivel,
              observacao: (meta.observacao || "").trim() || null
            }).select(COLS).single().then(function (res) {
              if (res.error) {
                c.storage.from("arquivos").remove([path]);
                throw res.error;
              }
              return fromRow(res.data);
            });
          });
      });
    },

    // Renomear, trocar categoria/observação ou liberar/ocultar do paciente.
    update: function (id, patch) {
      var row = {};
      if ("nome" in patch) row.nome = (patch.nome || "").trim().slice(0, 180);
      if ("categoria" in patch) row.categoria = patch.categoria;
      if ("visivel" in patch) row.visivel_paciente = !!patch.visivel;
      if ("observacao" in patch) row.observacao = (patch.observacao || "").trim() || null;
      return client().then(function (c) {
        return c.from("paciente_arquivos").update(row).eq("id", id).select(COLS).single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return fromRow(res.data);
      });
    },

    /* Apaga a linha primeiro e só então o objeto: se a ordem fosse a
       inversa e o delete da linha falhasse, sobraria um arquivo listado
       que não abre mais. */
    remove: function (arq) {
      return client().then(function (c) {
        return c.from("paciente_arquivos").delete().eq("id", arq.id).then(function (res) {
          if (res.error) throw res.error;
          return c.storage.from("arquivos").remove([arq.path]);
        });
      }).then(function () { return true; });
    },

    // URLs assinadas (temporárias) para uma lista de caminhos → { path: url }.
    assinar: function (paths, expiresIn) {
      var lista = (paths || []).filter(Boolean);
      if (!lista.length) return Promise.resolve({});
      return client().then(function (c) {
        return c.storage.from("arquivos").createSignedUrls(lista, expiresIn || 3600);
      }).then(function (res) {
        if (res.error) throw res.error;
        var mapa = {};
        (res.data || []).forEach(function (r) { if (r && r.signedUrl && !r.error) mapa[r.path] = r.signedUrl; });
        return mapa;
      });
    },

    // URL assinada única, já com download forçado (mantém o nome original).
    assinarDownload: function (path, nome) {
      return client().then(function (c) {
        return c.storage.from("arquivos").createSignedUrl(path, 3600, { download: nome || true });
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data && res.data.signedUrl;
      });
    }
  };
})();

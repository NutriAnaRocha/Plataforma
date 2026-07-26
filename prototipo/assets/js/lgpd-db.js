/* ============================================================
   LGPD — portabilidade (exportar) e eliminação (excluir conta).
   Expõe window.NutriLGPD.
   - exportar(): baixa um JSON com TODOS os dados que a nutri controla
     (perfil + pacientes + consultas + financeiro + adesão). Só lê tabelas
     do próprio usuário (RLS aplica); tabelas sem permissão/ausentes são
     puladas sem quebrar. Formato aberto (JSON) = direito à portabilidade.
   - excluirConta(): chama a edge function excluir-conta (apaga tudo).
   Requer supabase-client.js incluído antes.
   ============================================================ */
(function () {
  "use strict";

  function client() { return window.NutriDBReady; }

  // Tabelas a exportar. Cada uma é best-effort: erro (sem permissão) ou
  // vazia não interrompe o pacote.
  var TABELAS = [
    { nome: "perfil", tabela: "profiles" },
    { nome: "pacientes", tabela: "pacientes" },
    { nome: "consultas", tabela: "consultas" },
    { nome: "financeiro_lancamentos", tabela: "lancamentos" },
    { nome: "adesao_pacientes", tabela: "plano_adesao" },
    { nome: "nutricionistas_convidadas", tabela: "nutri_convites" }
  ];

  function baixarArquivo(nome, conteudo, mime) {
    var blob = new Blob([conteudo], { type: mime || "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  window.NutriLGPD = {
    // Monta e baixa o pacote de dados. Resolve com um resumo { tabelas, totais }.
    exportar: function () {
      return client().then(function (c) {
        return c.auth.getUser().then(function (u) {
          var uid = u && u.data && u.data.user ? u.data.user.id : null;
          var email = u && u.data && u.data.user ? u.data.user.email : null;

          var jobs = TABELAS.map(function (t) {
            return c.from(t.tabela).select("*").then(function (res) {
              return { nome: t.nome, dados: (res && !res.error && res.data) ? res.data : [] };
            }).catch(function () { return { nome: t.nome, dados: [] }; });
          });

          return Promise.all(jobs).then(function (resultados) {
            var pacote = {
              _meta: {
                gerado_em: new Date().toISOString(),
                plataforma: "NutriLab",
                titular: { id: uid, email: email },
                observacao: "Exportação de dados pessoais (LGPD, art. 18). " +
                  "A nutricionista é a controladora dos dados dos seus pacientes; " +
                  "a NutriLab atua como operadora."
              }
            };
            var totais = {};
            resultados.forEach(function (r) {
              pacote[r.nome] = r.dados;
              totais[r.nome] = r.dados.length;
            });
            var carimbo = new Date().toISOString().slice(0, 10);
            baixarArquivo("nutrilab-meus-dados-" + carimbo + ".json",
              JSON.stringify(pacote, null, 2));
            return { totais: totais };
          });
        });
      });
    },

    // Exclusão definitiva da conta (chama a edge function).
    excluirConta: function () {
      return client().then(function (c) {
        return c.functions.invoke("excluir-conta", { body: { confirmar: "EXCLUIR" } });
      }).then(function (res) {
        if (res.error) {
          if (res.error.context && res.error.context.json) {
            return res.error.context.json().then(function (b) { throw new Error(b && b.error || "falha"); });
          }
          throw new Error("falha");
        }
        var d = res.data || {};
        if (d.error) throw new Error(d.error);
        return d;
      });
    }
  };
})();

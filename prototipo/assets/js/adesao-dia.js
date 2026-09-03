/* ============================================================
   ADESÃO DIÁRIA — o quadro do dia nasce em branco.
   As marcações do paciente (plano, treino, metas) valem para UM dia.
   Na primeira vez que ele abre o portal num dia novo, o que estava
   marcado é arquivado em marcas.__hist[data] e as caixas voltam a
   ficar vazias — é isso que dá à nutri a leitura do acompanhamento
   diário, e não um acumulado que nunca zera.

   Fica tudo dentro do próprio jsonb `marcas` (tabela plano_adesao):
   é a única coisa que a RLS deixa o paciente escrever.

     marcas = {
       "0:1": true,            // marcações de HOJE (plano ri:ii)
       "meta:0": true,         // metas de hoje
       "treino:0:2": true,     // treino de hoje
       "compra:arroz": true,   // lista de compras — NÃO zera (é da semana)
       "lc:extra": [...],      // edições da lista — NÃO zeram
       "__dia": "2026-09-03",  // dia a que as marcações acima pertencem
       "__hist": { "2026-09-02": { "0:1": true, "meta:0": true } }
     }
   ============================================================ */
(function () {
  "use strict";

  var DIAS_GUARDADOS = 90; // ~3 meses de histórico: cobre o intervalo entre consultas

  // Chaves que pertencem ao dia (zeram na virada).
  function ehDiaria(k) {
    return /^\d+:\d+$/.test(k) || k.indexOf("meta:") === 0 || k.indexOf("treino:") === 0;
  }

  // Data local em YYYY-MM-DD (o dia é o do paciente, não o do servidor).
  function hoje(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* Vira o dia se for preciso. Devolve { marcas, mudou } — quem chama
     grava no banco só quando mudou. Não destrói nada: o que sai das
     caixas vai para o histórico. */
  function virar(marcas, dia) {
    marcas = marcas || {};
    dia = dia || hoje();
    if (marcas.__dia === dia) return { marcas: marcas, mudou: false };

    var anterior = marcas.__dia;
    var hist = marcas.__hist && typeof marcas.__hist === "object" ? marcas.__hist : {};
    var doDia = {};
    Object.keys(marcas).forEach(function (k) {
      if (!ehDiaria(k)) return;
      if (marcas[k] === true) doDia[k] = true;
      delete marcas[k];
    });
    // Sem __dia (adesão criada antes desta mudança) não dá para saber a
    // que dia aquilo pertencia: arquiva no dia anterior a hoje, que é a
    // leitura mais próxima da verdade, em vez de jogar fora.
    var alvo = anterior || ontem(dia);
    if (Object.keys(doDia).length) hist[alvo] = merge(hist[alvo], doDia);

    marcas.__hist = podar(hist, dia);
    marcas.__dia = dia;
    return { marcas: marcas, mudou: true };
  }

  function merge(a, b) {
    var out = {};
    Object.keys(a || {}).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) { out[k] = b[k]; });
    return out;
  }

  function ontem(dia) {
    var d = new Date(dia + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return hoje(d);
  }

  function podar(hist, dia) {
    var limite = new Date(dia + "T12:00:00");
    limite.setDate(limite.getDate() - DIAS_GUARDADOS);
    var corte = hoje(limite), out = {};
    Object.keys(hist).forEach(function (k) { if (k >= corte) out[k] = hist[k]; });
    return out;
  }

  // Marcações de um dia qualquer: hoje sai da raiz, o resto do histórico.
  function marcasDoDia(marcas, dia) {
    marcas = marcas || {};
    if (!dia || dia === (marcas.__dia || hoje())) {
      var atual = {};
      Object.keys(marcas).forEach(function (k) { if (ehDiaria(k) && marcas[k] === true) atual[k] = true; });
      return atual;
    }
    return (marcas.__hist && marcas.__hist[dia]) || {};
  }

  // Últimos n dias (mais antigo → mais recente): [{ dia, marcas }].
  function ultimosDias(marcas, n) {
    var fim = (marcas && marcas.__dia) || hoje();
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(fim + "T12:00:00");
      d.setDate(d.getDate() - i);
      var dia = hoje(d);
      out.push({ dia: dia, marcas: marcasDoDia(marcas, dia) });
    }
    return out;
  }

  window.AdesaoDia = {
    hoje: hoje,
    ehDiaria: ehDiaria,
    virar: virar,
    marcasDoDia: marcasDoDia,
    ultimosDias: ultimosDias,
    DIAS_GUARDADOS: DIAS_GUARDADOS
  };
})();

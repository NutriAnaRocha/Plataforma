/* ============================================================
   RELATÓRIOS DATA — casca inicial da tela (window.REL_DATA).
   JS e não JSON de propósito: fetch() de arquivo local é bloqueado
   em file://.

   NÃO é lugar de dado de exemplo. Até 20/09/2026 este arquivo trazia
   um relatório inteiro inventado — 128 pacientes ativos, adesão de 82%,
   retenção de 91%, "Janeiro a Junho de 2026", origem dos pacientes por
   Instagram e Google. Esses números piscavam na tela a cada carregamento
   e FICAVAM lá quando a consulta ao banco falhava (o .catch mantinha o
   mock), do mesmo jeito que acontecia no Dashboard: uma nutri nova abria
   Relatórios e via um consultório cheio que não era o dela.

   A casca agora nasce vazia; quem preenche é construirModelo() a partir
   de window.NutriPacientes + window.NutriConsultas. Sem banco, a tela
   mostra "—" e os estados vazios de cada gráfico.
   ============================================================ */
window.REL_DATA = {
  periodoLabel: "",
  resumo: {},
  evolucao: { labels: [], valores: [] },
  consultas: { labels: [], valores: [] },
  objetivos: [],
  adesao: [],
  origem: []
};

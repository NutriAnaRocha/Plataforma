/* Mock de Relatórios (consolidado) — exposto em window, pois fetch de JSON é bloqueado em file:// */
window.REL_DATA = {
  periodoLabel: "Janeiro a Junho de 2026",
  resumo: {
    ativos: 128, ativosVar: 9,
    novos: 14,
    adesao: 82, adesaoVar: 4,
    retencao: 91
  },

  // Evolução de pacientes ativos (linha)
  evolucao: {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    valores: [86, 94, 103, 110, 119, 128]
  },

  // Consultas realizadas por mês (barras)
  consultas: {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    valores: [64, 72, 81, 78, 92, 104]
  },

  // Distribuição por objetivo (donut)
  objetivos: [
    { nome: "Emagrecimento", pct: 42 },
    { nome: "Reeducação alimentar", pct: 22 },
    { nome: "Hipertrofia", pct: 18 },
    { nome: "Controle clínico", pct: 12 },
    { nome: "Gestante", pct: 6 }
  ],

  // Adesão média por faixa de plano (barras)
  adesao: [
    { nome: "Emagrecimento", pct: 84 },
    { nome: "Hipertrofia", pct: 79 },
    { nome: "Reeducação alimentar", pct: 88 },
    { nome: "Controle clínico", pct: 71 }
  ],

  // Origem dos novos pacientes (barras)
  origem: [
    { nome: "Indicação", pct: 46 },
    { nome: "Instagram", pct: 28 },
    { nome: "Google", pct: 16 },
    { nome: "Outros", pct: 10 }
  ]
};

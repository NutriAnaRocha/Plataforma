/* ============================================================
   FINANCEIRO (consolidado) — mock · window.FIN_DATA
   ============================================================ */
window.FIN_DATA = {
  mesLabel: "Junho de 2026",

  resumo: {
    receita: 18450,        // faturado no mês
    recebido: 14200,       // já recebido
    aReceber: 3400,        // pendente dentro do prazo
    atrasado: 850,         // inadimplência
    variacao: 12.4         // % vs mês anterior
  },

  /* faturamento dos últimos 8 meses (para o gráfico) */
  serie: {
    labels: ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    valores: [11200, 9800, 12400, 13100, 14800, 15600, 16400, 18450]
  },

  /* distribuição por meio de pagamento */
  metodos: [
    { nome: "Pix", ico: "⚡", pct: 46, valor: 8487 },
    { nome: "Cartão de crédito", ico: "💳", pct: 31, valor: 5720 },
    { nome: "Mercado Pago", ico: "🛒", pct: 14, valor: 2583 },
    { nome: "Boleto / Asaas", ico: "🧾", pct: 9, valor: 1660 }
  ],

  /* planos / pacotes ativos */
  planos: [
    { nome: "Acompanhamento mensal", ativos: 24, valor: 280 },
    { nome: "Pacote trimestral", ativos: 11, valor: 720 },
    { nome: "Consulta avulsa", ativos: 8, valor: 350 }
  ],

  /* últimos lançamentos */
  lancamentos: [
    { data: "28/06", paciente: "Marina Costa Ribeiro", desc: "Acompanhamento mensal", metodo: "Pix", valor: 280, status: "pago" },
    { data: "27/06", paciente: "Rafael Antunes", desc: "Pacote trimestral (2/3)", metodo: "Cartão", valor: 720, status: "pago" },
    { data: "26/06", paciente: "Joana Prado", desc: "Consulta avulsa", metodo: "Mercado Pago", valor: 350, status: "pendente" },
    { data: "25/06", paciente: "Carla Bruno", desc: "Acompanhamento mensal", metodo: "Pix", valor: 280, status: "atrasado" },
    { data: "24/06", paciente: "Pedro Lemos", desc: "Avaliação inicial", metodo: "Cartão", valor: 350, status: "pago" },
    { data: "23/06", paciente: "Letícia Maia", desc: "Acompanhamento mensal", metodo: "Boleto", valor: 280, status: "pendente" },
    { data: "22/06", paciente: "Bruno Tavares", desc: "Pacote trimestral (1/3)", metodo: "Pix", valor: 720, status: "pago" }
  ],

  /* integrações de pagamento (visual) */
  integracoes: [
    { nome: "Pix", status: "Conectado", ok: true },
    { nome: "Mercado Pago", status: "Conectado", ok: true },
    { nome: "Asaas", status: "Conectado", ok: true },
    { nome: "Stripe", status: "Conectar", ok: false }
  ]
};

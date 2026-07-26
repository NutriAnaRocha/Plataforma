/* ============================================================
   IA ASSISTENTE (tela cheia) — mock de dados do Nútri AI
   Exposto como window.IA_DATA (JS, não JSON: fetch local é bloqueado em file://)
   ============================================================ */
window.IA_DATA = {
  saudacao: "Olá! 👋 Sou o <strong>Nútri AI</strong>",
  sub: "Seu copiloto clínico. Posso interpretar exames, montar cardápios, resumir a evolução de pacientes, apoiar cálculos de gasto energético e redigir orientações — selecione um paciente para respostas com os dados reais da sua plataforma.",

  /* cards do estado inicial — cada um semeia um prompt */
  capacidades: [
    { ico: "🧪", titulo: "Interpretar exames", desc: "Lê o laboratório e destaca o que importa.", prompt: "Analise os últimos exames do paciente selecionado e me diga o que merece atenção." },
    { ico: "🥗", titulo: "Montar cardápio", desc: "Plano alimentar dentro das metas de macros.", prompt: "Monte um cardápio de um dia para o paciente selecionado, dentro do objetivo dele." },
    { ico: "📈", titulo: "Resumir evolução", desc: "Síntese clínica do progresso do paciente.", prompt: "Resuma a evolução do paciente selecionado com base nos dados disponíveis." },
    { ico: "🧮", titulo: "Apoiar cálculos", desc: "Raciocínio de TMB, GET e VET.", prompt: "Explique como estimar TMB, GET e VET para o paciente selecionado e o ajuste calórico adequado ao objetivo." },
    { ico: "📝", titulo: "Redigir orientações", desc: "Rascunho para enviar ao paciente.", prompt: "Escreva um rascunho de orientações nutricionais para o paciente selecionado." },
    { ico: "💡", titulo: "Tirar dúvida clínica", desc: "Resposta com base em boas práticas.", prompt: "Qual a conduta nutricional inicial para resistência à insulina?" }
  ],

  /* chips rápidos abaixo do campo */
  exemplos: [
    "O que merece atenção nos exames deste paciente?",
    "Sugira substituições para o jantar dentro do objetivo dele",
    "Gere um resumo de evolução para o prontuário",
    "Como abordar baixa adesão ao plano?"
  ]
};

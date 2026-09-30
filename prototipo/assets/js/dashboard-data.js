/* ============================================================
   DASHBOARD DATA — casca inicial do Dashboard (window.DASH_DATA).
   JS e não JSON de propósito: fetch() de arquivo local é bloqueado
   em file://.

   NÃO é lugar de dado de exemplo. Até 20/09/2026 este arquivo trazia
   uma nutri fictícia ("Ana Luísa", CRN inventado), 148 pacientes, uma
   curva de adesão e nomes de gente que não existe. Tudo isso piscava
   na tela a cada carregamento e FICAVA lá quando a consulta ao banco
   falhava (o .catch mantinha o mock) — uma nutri nova via a carteira
   de outra pessoa e podia tomar aquilo por dado seu.
   A casca agora nasce vazia; quem preenche é renderXReal().
   ============================================================ */
window.DASH_DATA = {

  user: { nome: "", saudacao: "", crn: "" },

  stats: [],
  agenda: [],
  evolucao: null,
  pacientes: [],
  aniversariantes: [],
  pendencias: [],
  notificacoes: [],

  /* Sugestões do Nútri AI — perguntas genéricas, sem nome de paciente
     inventado. Levam para ia.html, que responde de verdade. */
  aiSugestoes: [
    "Quais pacientes faltaram esta semana?",
    "Monte um cardápio low-carb de 1.500 kcal",
    "Quem está com adesão abaixo de 50%?",
    "Resuma a evolução de um paciente meu"
  ]
};

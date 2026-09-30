/* ============================================================
   AGENDA DATA — catálogo da tela de Agenda (window.AGENDA_DATA).
   JS e não JSON de propósito: fetch() de arquivo local é bloqueado
   em file://.

   Aqui só entra CATÁLOGO: a janela de expediente, os tipos de consulta
   e as durações que o modal de agendamento oferece. As consultas de
   verdade vêm de window.NutriConsultas (tabela public.consultas).

   Até 20/09/2026 este arquivo trazia também uma semana inteira de
   consultas inventadas e uma lista de dez pacientes que não existem
   ("Marina Costa", "Rafael Andrade"…). Nada disso era lido pela
   agenda — ficava só sendo baixado pelo navegador de toda nutri.
   ============================================================ */
window.AGENDA_DATA = {

  /* Janela de expediente exibida no calendário (horas) */
  horario: { inicio: 7, fim: 20 },

  /* Opções usadas no modal de novo agendamento */
  tipos: ["Primeira consulta", "Retorno", "Avaliação física", "Reavaliação", "Encaixe", "Gestação"],
  duracoes: [30, 45, 60, 90]
};

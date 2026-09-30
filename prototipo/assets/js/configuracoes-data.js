/* ============================================================
   MOCK — Configurações
   Dados fictícios. Exposto como global p/ funcionar por file://.
   ============================================================ */
window.CONFIG_DATA = {
  /* O perfil real vem de window.NutriPerfil (tabela profiles); a tela nasce
     com os campos vazios e só repinta quando o banco responde. Este bloco
     ficou até 20/09/2026 com um perfil inventado — inclusive um "CRN-3 12345"
     que não é de ninguém — sem nunca ser lido por tela nenhuma. */
  perfil: {},

  /* Áreas de atuação (multi-seleção com .chip) */
  especialidades: [
    "Clínica", "Saúde da Mulher", "Esportiva", "Comportamental",
    "Materno Infantil", "Obesidade", "Funcional", "Estética",
    "Vegetariana/Vegana", "Pediatria", "Renal", "Fertilidade"
  ],
  especialidadesAtivas: ["Clínica", "Saúde da Mulher", "Comportamental", "Obesidade"],

  /* Preferências de notificação (chave -> ligado?) */
  notificacoes: [
    { id: "email_consultas", titulo: "Confirmações e lembretes de consulta", desc: "Receba por e-mail quando um paciente confirmar, remarcar ou cancelar.", on: true },
    { id: "push_agenda", titulo: "Alertas de agenda (push)", desc: "Notificação no navegador 30 min antes de cada atendimento.", on: true },
    { id: "resumo_ia", titulo: "Resumo semanal da IA", desc: "Toda segunda, um resumo dos estudos e insights relevantes para você.", on: true },
    { id: "comunidade", titulo: "Atividade na Comunidade", desc: "Curtidas e comentários nas suas publicações e respostas.", on: false },
    { id: "financeiro", titulo: "Resumo financeiro mensal", desc: "Fechamento de receitas, inadimplência e comparativo do mês.", on: true },
    { id: "marketing", titulo: "Novidades e dicas da plataforma", desc: "Atualizações de recursos, webinars e materiais.", on: false }
  ],

  /* Integrações.
     Só Google Agenda e Google Meet conectam de verdade (OAuth, em
     configuracoes.js). O WhatsApp da plataforma é envio ASSISTIDO — não há
     conta para conectar aqui, então o card leva para a tela de WhatsApp.
     Pagamento e NFS-e ainda não existem: ficam marcados como "Em breve" em
     vez de um botão que trocava o rótulo e dava um toast dizendo que tinha
     conectado. Até 20/09/2026 o card do WhatsApp vinha "Conectado" com o
     número (11) 98888-1234, que nunca foi de ninguém. */
  integracoes: [
    { id: "google", nome: "Google Agenda", ico: "📅", desc: "Sincronize seus atendimentos com o Google Calendar automaticamente.", conectado: false, conta: "" },
    { id: "meet", nome: "Google Meet", ico: "🎥", desc: "Gera o link do Meet automaticamente na teleconsulta. Vem junto com o Google Agenda.", conectado: false, conta: "" },
    { id: "whatsapp", nome: "WhatsApp", ico: "💬", desc: "Lembretes e confirmações saem pelo seu próprio WhatsApp, com um clique na ficha do paciente ou na agenda.", conectado: false, conta: "", link: "whatsapp.html", acao: "Ver mensagens" },
    { id: "pagamentos", nome: "Gateway de Pagamento", ico: "💳", desc: "Receber pagamentos online e gerar cobranças recorrentes de pacotes.", conectado: false, conta: "", breve: true },
    { id: "nfe", nome: "Emissor de Nota Fiscal", ico: "🧾", desc: "Emitir NFS-e automaticamente a cada pagamento recebido.", conectado: false, conta: "", breve: true }
  ]
};

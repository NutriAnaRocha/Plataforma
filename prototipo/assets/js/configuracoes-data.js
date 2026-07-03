/* ============================================================
   MOCK — Configurações
   Dados fictícios. Exposto como global p/ funcionar por file://.
   ============================================================ */
window.CONFIG_DATA = {
  perfil: {
    nome: "Ana Luísa Rocha",
    crn: "CRN-3 12345",
    email: "ana.luisa@nutriplat.com.br",
    telefone: "(11) 98888-1234",
    cidade: "São Paulo, SP",
    bio: "Nutricionista clínica com foco em saúde da mulher e emagrecimento saudável. Atendimento humanizado, baseado em evidências.",
    instagram: "@ananutri",
    site: "www.ananutri.com.br"
  },

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

  /* Integrações disponíveis */
  integracoes: [
    { id: "google", nome: "Google Agenda", ico: "📅", desc: "Sincronize seus atendimentos com o Google Calendar automaticamente.", conectado: true, conta: "ana.luisa@gmail.com" },
    { id: "whatsapp", nome: "WhatsApp", ico: "💬", desc: "Envie lembretes e confirmações de consulta direto no WhatsApp do paciente.", conectado: true, conta: "(11) 98888-1234" },
    { id: "pagamentos", nome: "Gateway de Pagamento", ico: "💳", desc: "Receba pagamentos online e gere cobranças recorrentes de pacotes.", conectado: false, conta: "" },
    { id: "meet", nome: "Google Meet / Zoom", ico: "🎥", desc: "Gere o link da teleconsulta automaticamente ao agendar online.", conectado: false, conta: "" },
    { id: "nfe", nome: "Emissor de Nota Fiscal", ico: "🧾", desc: "Emita NFS-e automaticamente a cada pagamento recebido.", conectado: false, conta: "" }
  ]
};

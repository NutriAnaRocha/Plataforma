/* ============================================================
   AGENDA DATA (Tela 4) — mock realista das consultas da semana.
   Disponibilizado como JS (window.AGENDA_DATA) e não JSON de
   propósito: fetch() de arquivo local é bloqueado em file://.

   `dia`: 0 = Segunda … 6 = Domingo. As consultas são tratadas
   como recorrentes na semana exibida (sempre populam o calendário
   do protótipo, independente de qual semana esteja na tela).
   ============================================================ */
window.AGENDA_DATA = {

  /* Janela de expediente exibida no calendário (horas) */
  horario: { inicio: 7, fim: 20 },

  /* Consultas da semana */
  consultas: [
    /* — Segunda — */
    { dia: 0, inicio: "08:00", fim: "08:45", paciente: "Marina Costa",    ini: "MC", tipo: "Retorno",            modo: "Presencial", status: "proxima"  },
    { dia: 0, inicio: "09:30", fim: "10:30", paciente: "Rafael Andrade",  ini: "RA", tipo: "Primeira consulta",  modo: "Online",     status: "proxima"  },
    { dia: 0, inicio: "14:00", fim: "14:45", paciente: "Sofia Almeida",   ini: "SA", tipo: "Retorno",            modo: "Presencial", status: "proxima"  },

    /* — Terça — */
    { dia: 1, inicio: "10:00", fim: "11:00", paciente: "Bruno Tavares",   ini: "BT", tipo: "Avaliação física",   modo: "Presencial", status: "proxima"  },
    { dia: 1, inicio: "15:30", fim: "16:15", paciente: "Patrícia Lima",   ini: "PL", tipo: "Retorno",            modo: "Online",     status: "proxima"  },

    /* — Quarta (dia cheio) — */
    { dia: 2, inicio: "08:00", fim: "08:45", paciente: "Marina Costa",    ini: "MC", tipo: "Retorno",            modo: "Presencial", status: "concluida"  },
    { dia: 2, inicio: "09:00", fim: "10:00", paciente: "Rafael Andrade",  ini: "RA", tipo: "Primeira consulta",  modo: "Online",     status: "concluida"  },
    { dia: 2, inicio: "10:30", fim: "11:15", paciente: "Juliana Prado",   ini: "JP", tipo: "Retorno",            modo: "Presencial", status: "emandamento"},
    { dia: 2, inicio: "13:00", fim: "14:00", paciente: "Bruno Tavares",   ini: "BT", tipo: "Avaliação física",   modo: "Presencial", status: "proxima"  },
    { dia: 2, inicio: "14:30", fim: "15:15", paciente: "Camila Nogueira", ini: "CN", tipo: "Retorno",            modo: "Online",     status: "proxima"  },
    { dia: 2, inicio: "16:00", fim: "16:45", paciente: "Diego Martins",   ini: "DM", tipo: "Reavaliação",        modo: "Presencial", status: "proxima"  },
    { dia: 2, inicio: "17:30", fim: "18:00", paciente: "Letícia Souza",   ini: "LS", tipo: "Encaixe",            modo: "Online",     status: "proxima"  },

    /* — Quinta — */
    { dia: 3, inicio: "08:30", fim: "09:15", paciente: "Eduardo Reis",    ini: "ER", tipo: "Retorno",            modo: "Presencial", status: "proxima"  },
    { dia: 3, inicio: "11:00", fim: "12:00", paciente: "Camila Nogueira", ini: "CN", tipo: "Gestação",           modo: "Online",     status: "proxima"  },
    { dia: 3, inicio: "16:30", fim: "17:15", paciente: "Diego Martins",   ini: "DM", tipo: "Reavaliação",        modo: "Presencial", status: "proxima"  },

    /* — Sexta — */
    { dia: 4, inicio: "09:00", fim: "09:45", paciente: "Juliana Prado",   ini: "JP", tipo: "Retorno",            modo: "Presencial", status: "proxima"  },
    { dia: 4, inicio: "10:30", fim: "11:30", paciente: "Letícia Souza",   ini: "LS", tipo: "Avaliação física",   modo: "Presencial", status: "proxima"  },
    { dia: 4, inicio: "14:00", fim: "14:45", paciente: "Marina Costa",    ini: "MC", tipo: "Retorno",            modo: "Online",     status: "cancelada" },

    /* — Sábado — */
    { dia: 5, inicio: "09:00", fim: "10:00", paciente: "Rafael Andrade",  ini: "RA", tipo: "Reavaliação",        modo: "Presencial", status: "proxima"  }
  ],

  /* Opções usadas no modal de novo agendamento */
  tipos: ["Primeira consulta", "Retorno", "Avaliação física", "Reavaliação", "Encaixe", "Gestação"],
  duracoes: [30, 45, 60, 90],
  pacientes: [
    "Marina Costa", "Rafael Andrade", "Juliana Prado", "Bruno Tavares", "Camila Nogueira",
    "Diego Martins", "Letícia Souza", "Patrícia Lima", "Eduardo Reis", "Sofia Almeida"
  ]
};

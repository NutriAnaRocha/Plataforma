/* ============================================================
   PACIENTES DATA — mock realista da tela de Pacientes.
   window.PAC_DATA. JS (não JSON) para funcionar via file://.
   ============================================================ */
window.PAC_DATA = {

  /* Filtros rápidos (status) — contadores calculados no JS */
  filtros: ["Todos", "Ativos", "Atenção", "Inativos"],

  pacientes: [
    {
      id: "p1", nome: "Marina Costa", ini: "MC", idade: 34, sexo: "F",
      objetivo: "Emagrecimento", status: "ativo", adesao: 82,
      pesoAtual: 71.4, pesoInicial: 84.0, meta: 68, altura: 1.66, imc: 25.9,
      ultConsulta: "Hoje", proxConsulta: "em 28 dias",
      contato: { tel: "(11) 98888-1212", email: "marina.costa@email.com", cidade: "São Paulo · SP" },
      tags: ["Low carb", "Sedentária→ativa"],
      restricoes: "Intolerância à lactose. Sem alergias medicamentosas.",
      anamnese: "Busca emagrecimento sustentável após gestação. Rotina corrida, faz 2 refeições fora de casa. Iniciou caminhadas 3x/semana.",
      observacoes: "Ótima adesão. Reduziu beliscos noturnos. Reavaliar meta na próxima consulta.",
      evolucao: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], peso: [84.0, 81.2, 78.5, 75.1, 73.0, 71.4] },
      consultas: [
        { data: "24/06/2026", tipo: "Retorno", nota: "Adesão 82%. Ajuste de ceia. Solicitado lipidograma." },
        { data: "27/05/2026", tipo: "Retorno", nota: "Perda de 2 kg. Manter plano. Incluir treino de força." },
        { data: "29/04/2026", tipo: "Retorno", nota: "Boa evolução. Revisão de porções no almoço." },
        { data: "01/04/2026", tipo: "Primeira consulta", nota: "Anamnese completa. Plano de 1.500 kcal." }
      ],
      prescricoes: [
        { titulo: "Plano alimentar — Low carb 1.500 kcal", data: "27/05/2026", status: "Ativo" },
        { titulo: "Plano alimentar — 1.700 kcal (adaptação)", data: "01/04/2026", status: "Encerrado" }
      ],
      exames: [
        { titulo: "Lipidograma + Glicemia", data: "24/06/2026", status: "Solicitado" },
        { titulo: "Hemograma completo", data: "01/04/2026", status: "Anexado" }
      ]
    },
    {
      id: "p2", nome: "Rafael Andrade", ini: "RA", idade: 28, sexo: "M",
      objetivo: "Hipertrofia", status: "ativo", adesao: 64,
      pesoAtual: 78.2, pesoInicial: 74.0, meta: 82, altura: 1.78, imc: 24.7,
      ultConsulta: "Hoje", proxConsulta: "em 30 dias",
      contato: { tel: "(11) 97777-3434", email: "rafael.andrade@email.com", cidade: "Guarulhos · SP" },
      tags: ["Hiperproteico", "Treino 5x/sem"],
      restricoes: "Sem restrições alimentares. Suplementa creatina.",
      anamnese: "Pratica musculação há 2 anos, busca ganho de massa magra. Dificuldade em atingir meta calórica.",
      observacoes: "Aumentar densidade calórica no café e pós-treino. Reforçar refeições.",
      evolucao: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], peso: [74.0, 74.8, 75.6, 76.5, 77.4, 78.2] },
      consultas: [
        { data: "24/06/2026", tipo: "Primeira consulta", nota: "Anamnese. Plano hiperproteico 2.900 kcal." }
      ],
      prescricoes: [
        { titulo: "Plano alimentar — Hipertrofia 2.900 kcal", data: "24/06/2026", status: "Ativo" }
      ],
      exames: [
        { titulo: "Bioimpedância", data: "24/06/2026", status: "Anexado" }
      ]
    },
    {
      id: "p3", nome: "Juliana Prado", ini: "JP", idade: 41, sexo: "F",
      objetivo: "Saúde intestinal", status: "ativo", adesao: 91,
      pesoAtual: 63.0, pesoInicial: 66.5, meta: 62, altura: 1.62, imc: 24.0,
      ultConsulta: "há 2 dias", proxConsulta: "em 21 dias",
      contato: { tel: "(11) 96666-5656", email: "juliana.prado@email.com", cidade: "São Paulo · SP" },
      tags: ["Low FODMAP", "SII"],
      restricoes: "Síndrome do intestino irritável. Evitar lactose e excesso de FODMAPs.",
      anamnese: "Quadro de distensão e desconforto abdominal. Em protocolo low FODMAP com reintrodução gradual.",
      observacoes: "Excelente adesão. Sintomas reduzidos. Iniciar fase de reintrodução.",
      evolucao: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], peso: [66.5, 65.8, 65.0, 64.3, 63.6, 63.0] },
      consultas: [
        { data: "22/06/2026", tipo: "Retorno", nota: "Sintomas reduzidos. Iniciar reintrodução de FODMAPs." },
        { data: "30/05/2026", tipo: "Retorno", nota: "Boa resposta ao protocolo. Manter por mais 2 semanas." }
      ],
      prescricoes: [
        { titulo: "Protocolo Low FODMAP — fase 1", data: "30/05/2026", status: "Ativo" }
      ],
      exames: [
        { titulo: "Teste respiratório (lactose)", data: "15/05/2026", status: "Anexado" }
      ]
    },
    {
      id: "p4", nome: "Bruno Tavares", ini: "BT", idade: 37, sexo: "M",
      objetivo: "Performance", status: "atencao", adesao: 47,
      pesoAtual: 88.1, pesoInicial: 89.0, meta: 84, altura: 1.82, imc: 26.6,
      ultConsulta: "há 3 dias", proxConsulta: "a agendar",
      contato: { tel: "(11) 95555-7878", email: "bruno.tavares@email.com", cidade: "Osasco · SP" },
      tags: ["Corredor", "Baixa adesão"],
      restricoes: "Sem restrições. Refeições irregulares por viagens de trabalho.",
      anamnese: "Corredor amador (10k), busca melhora de performance e composição corporal. Viaja muito.",
      observacoes: "⚠ Adesão baixa (47%). Plano alimentar pendente de liberação. Priorizar contato e retorno de reforço.",
      evolucao: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], peso: [89.0, 88.6, 88.9, 88.4, 88.7, 88.1] },
      consultas: [
        { data: "21/06/2026", tipo: "Avaliação física", nota: "Bioimpedância. Adesão baixa — repactuar metas." },
        { data: "20/05/2026", tipo: "Retorno", nota: "Dificuldade com refeições em viagem. Plano flexível." }
      ],
      prescricoes: [
        { titulo: "Plano alimentar — Performance (rascunho)", data: "21/06/2026", status: "Pendente" }
      ],
      exames: [
        { titulo: "Bioimpedância", data: "21/06/2026", status: "Anexado" }
      ]
    },
    {
      id: "p5", nome: "Camila Nogueira", ini: "CN", idade: 31, sexo: "F",
      objetivo: "Gestação saudável", status: "ativo", adesao: 73,
      pesoAtual: 68.9, pesoInicial: 64.0, meta: null, altura: 1.68, imc: 24.4,
      ultConsulta: "há 5 dias", proxConsulta: "em 14 dias",
      contato: { tel: "(11) 94444-9090", email: "camila.nogueira@email.com", cidade: "São Paulo · SP" },
      tags: ["Gestante 22sem", "Materno-infantil"],
      restricoes: "Gestante. Suplementação de ferro e ácido fólico. Evitar cru/embutidos.",
      anamnese: "Gestação de 22 semanas, ganho de peso dentro do esperado. Acompanhamento nutricional pré-natal.",
      observacoes: "Revisar exames do pré-natal. Ajustar aporte de ferro conforme hemograma.",
      evolucao: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], peso: [64.0, 64.9, 65.8, 66.9, 67.9, 68.9] },
      consultas: [
        { data: "19/06/2026", tipo: "Retorno", nota: "Ganho adequado. Revisar exames pré-natal." }
      ],
      prescricoes: [
        { titulo: "Plano alimentar — Gestante 2º trimestre", data: "19/06/2026", status: "Ativo" }
      ],
      exames: [
        { titulo: "Hemograma + Ferritina", data: "10/06/2026", status: "Pendente" }
      ]
    },
    {
      id: "p6", nome: "Diego Martins", ini: "DM", idade: 45, sexo: "M",
      objetivo: "Controle de colesterol", status: "ativo", adesao: 78,
      pesoAtual: 92.3, pesoInicial: 97.0, meta: 88, altura: 1.80, imc: 28.5,
      ultConsulta: "há 1 semana", proxConsulta: "em 25 dias",
      contato: { tel: "(11) 93333-1122", email: "diego.martins@email.com", cidade: "Santo André · SP" },
      tags: ["Dislipidemia", "Cardioprotetor"],
      restricoes: "Hipercolesterolemia. Reduzir gordura saturada e ultraprocessados.",
      anamnese: "Encaminhado pelo cardiologista. LDL elevado. Plano cardioprotetor mediterrâneo.",
      observacoes: "Boa adesão. Reavaliar lipidograma em 60 dias.",
      evolucao: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], peso: [97.0, 96.0, 95.1, 94.0, 93.1, 92.3] },
      consultas: [
        { data: "17/06/2026", tipo: "Reavaliação", nota: "Perda de 4,7 kg. Manter padrão mediterrâneo." }
      ],
      prescricoes: [
        { titulo: "Plano alimentar — Mediterrâneo cardioprotetor", data: "17/06/2026", status: "Ativo" }
      ],
      exames: [
        { titulo: "Lipidograma", data: "05/06/2026", status: "Anexado" }
      ]
    },
    {
      id: "p7", nome: "Letícia Souza", ini: "LS", idade: 26, sexo: "F",
      objetivo: "Reeducação alimentar", status: "inativo", adesao: 38,
      pesoAtual: 70.2, pesoInicial: 72.0, meta: 64, altura: 1.64, imc: 26.1,
      ultConsulta: "há 2 meses", proxConsulta: "—",
      contato: { tel: "(11) 92222-3344", email: "leticia.souza@email.com", cidade: "São Paulo · SP" },
      tags: ["Reativar contato"],
      restricoes: "Sem restrições relatadas.",
      anamnese: "Buscava reeducação alimentar. Interrompeu o acompanhamento após 2 consultas.",
      observacoes: "Paciente inativa. Enviar mensagem de reativação e oferta de retorno.",
      evolucao: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], peso: [72.0, 71.3, 70.8, 70.5, 70.2, 70.2] },
      consultas: [
        { data: "20/04/2026", tipo: "Retorno", nota: "Faltou aos retornos seguintes." },
        { data: "22/03/2026", tipo: "Primeira consulta", nota: "Anamnese. Plano inicial 1.600 kcal." }
      ],
      prescricoes: [
        { titulo: "Plano alimentar — 1.600 kcal", data: "22/03/2026", status: "Encerrado" }
      ],
      exames: []
    }
  ]
};

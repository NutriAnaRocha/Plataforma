/* Mock de Exames (visão geral, todos os pacientes) — exposto em window, pois fetch de JSON é bloqueado em file:// */
window.EX_DATA = {
  resumo: { aguardando: 4, alterados: 9, pacientes: 23, coletas: 5 },

  // Cada item = conjunto de exames enviado por um paciente
  exames: [
    {
      id: "e1", paciente: "Marina Costa Ribeiro", iniciais: "MC", cor: "rosa",
      tipo: "Perfil lipídico + Glicemia + TSH", data: "27 jun 2026", status: "novo", alterados: 3,
      ia: "Colesterol total e LDL acima da meta, com tendência de alta nos últimos 3 exames. TSH no limite superior — considerar reavaliação tireoidiana. Triglicerídeos melhoraram após início do plano low carb.",
      grupos: [
        { grupo: "Perfil lipídico", marcadores: [
          { nome: "Colesterol total", valor: "228", un: "mg/dL", ref: "< 190", status: "alto", hist: [205, 212, 220, 228] },
          { nome: "LDL", valor: "152", un: "mg/dL", ref: "< 130", status: "alto", hist: [138, 144, 149, 152] },
          { nome: "HDL", valor: "48", un: "mg/dL", ref: "> 40", status: "normal", hist: [42, 44, 46, 48] },
          { nome: "Triglicerídeos", valor: "138", un: "mg/dL", ref: "< 150", status: "normal", hist: [190, 172, 150, 138] }
        ]},
        { grupo: "Metabólico", marcadores: [
          { nome: "Glicemia jejum", valor: "104", un: "mg/dL", ref: "70–99", status: "alto", hist: [98, 101, 103, 104] },
          { nome: "Hemoglobina glicada", valor: "5,7", un: "%", ref: "< 5,7", status: "alto", hist: [5.3, 5.5, 5.6, 5.7] },
          { nome: "TSH", valor: "4,1", un: "µUI/mL", ref: "0,4–4,0", status: "alto", hist: [2.8, 3.3, 3.7, 4.1] }
        ]}
      ]
    },
    {
      id: "e2", paciente: "Roberto Lima", iniciais: "RL", cor: "vinho",
      tipo: "Hemograma + Ferro + Vitamina D", data: "25 jun 2026", status: "novo", alterados: 2,
      ia: "Vitamina D insuficiente e ferritina no limite inferior. Hemograma sem alterações relevantes. Sugerir suplementação de vitamina D e reforço de fontes de ferro heme no plano.",
      grupos: [
        { grupo: "Hematológico", marcadores: [
          { nome: "Hemoglobina", valor: "14,2", un: "g/dL", ref: "13–17", status: "normal", hist: [13.8, 14.0, 14.1, 14.2] },
          { nome: "Ferritina", valor: "32", un: "ng/mL", ref: "30–300", status: "normal", hist: [40, 36, 34, 32] },
          { nome: "Ferro sérico", valor: "68", un: "µg/dL", ref: "65–175", status: "normal", hist: [80, 74, 70, 68] }
        ]},
        { grupo: "Vitaminas", marcadores: [
          { nome: "Vitamina D (25-OH)", valor: "22", un: "ng/mL", ref: "> 30", status: "baixo", hist: [28, 26, 24, 22] },
          { nome: "Vitamina B12", valor: "310", un: "pg/mL", ref: "200–900", status: "normal", hist: [340, 330, 320, 310] }
        ]}
      ]
    },
    {
      id: "e3", paciente: "Carla Menezes", iniciais: "CM", cor: "rosa",
      tipo: "Perfil lipídico + Glicemia", data: "21 jun 2026", status: "analisado", alterados: 1,
      ia: "Quadro estável. Apenas LDL discretamente acima do alvo, sem mudança significativa. Manter conduta e reavaliar em 3 meses.",
      grupos: [
        { grupo: "Perfil lipídico", marcadores: [
          { nome: "Colesterol total", valor: "186", un: "mg/dL", ref: "< 190", status: "normal", hist: [192, 190, 188, 186] },
          { nome: "LDL", valor: "134", un: "mg/dL", ref: "< 130", status: "alto", hist: [140, 138, 136, 134] },
          { nome: "Glicemia jejum", valor: "92", un: "mg/dL", ref: "70–99", status: "normal", hist: [95, 94, 93, 92] }
        ]}
      ]
    },
    {
      id: "e4", paciente: "Fernanda Dias", iniciais: "FD", cor: "vinho",
      tipo: "Pré-natal — Hemograma + Glicemia + Ferro", data: "18 jun 2026", status: "novo", alterados: 1,
      ia: "Gestante no 2º trimestre. Discreta anemia ferropriva esperada para o período. Glicemia normal, afastando diabetes gestacional por ora. Reforçar ferro e folato.",
      grupos: [
        { grupo: "Pré-natal", marcadores: [
          { nome: "Hemoglobina", valor: "10,8", un: "g/dL", ref: "> 11", status: "baixo", hist: [11.6, 11.2, 11.0, 10.8] },
          { nome: "Glicemia jejum", valor: "84", un: "mg/dL", ref: "< 92", status: "normal", hist: [82, 83, 85, 84] },
          { nome: "Ferritina", valor: "34", un: "ng/mL", ref: "> 30", status: "normal", hist: [44, 40, 37, 34] }
        ]}
      ]
    },
    {
      id: "e5", paciente: "Juliana Prado", iniciais: "JP", cor: "rosa",
      tipo: "Check-up anual completo", data: "14 jun 2026", status: "analisado", alterados: 0,
      ia: "Todos os marcadores dentro da normalidade. Excelente evolução após reeducação alimentar. Manter plano atual.",
      grupos: [
        { grupo: "Metabólico", marcadores: [
          { nome: "Glicemia jejum", valor: "88", un: "mg/dL", ref: "70–99", status: "normal", hist: [94, 92, 90, 88] },
          { nome: "Colesterol total", valor: "172", un: "mg/dL", ref: "< 190", status: "normal", hist: [188, 182, 176, 172] },
          { nome: "Triglicerídeos", valor: "98", un: "mg/dL", ref: "< 150", status: "normal", hist: [132, 120, 108, 98] }
        ]}
      ]
    }
  ]
};

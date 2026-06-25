/* ============================================================
   PRONTUÁRIO DATA (Tela 5) — paciente completo (mock realista).
   window.PRONT_DATA. JS e não JSON de propósito (fetch local
   bloqueado em file://). Paciente feminino p/ exibir "Saúde da
   Mulher" e protocolo SOP.
   ============================================================ */
window.PRONT_DATA = {

  /* ---------- Identidade / cabeçalho ---------- */
  paciente: {
    nome: "Marina Costa Ribeiro",
    ini: "MC",
    sexo: "F",
    nascimento: "1991-03-12",
    idade: 34,
    cpf: "123.456.789-09",
    rg: "34.567.890-1 SSP/SP",
    email: "marina.costa@email.com",
    telefone: "(11) 98765-4321",
    endereco: "Rua das Acácias, 240 — Pinheiros, São Paulo/SP",
    profissao: "Arquiteta",
    estadoCivil: "Casada",
    primeiraConsulta: "10/02/2025",
    ultimoAtendimento: "18/06/2026",
    proximaConsulta: "02/07/2026 · 08:00",
    status: "Ativo"
  },

  resumo: {
    pesoAtual: 72.4, pesoInicial: 81.0, pesoMeta: 66.0,
    imc: 26.6, imcClasse: "Sobrepeso",
    objetivo: "Emagrecimento + manejo de SOP",
    adesao: 82,
    ultimosExames: "Painel hormonal · 12/06/2026"
  },

  /* ============================================================
     1 · ANAMNESE E PERFIL
     ============================================================ */
  anamnese: {
    clinico: {
      doencasAtuais: ["Síndrome dos ovários policísticos (SOP)", "Resistência à insulina"],
      diagnosticos: ["Esteatose hepática grau I (2023)"],
      cirurgias: ["Apendicectomia (2010)"],
      internacoes: ["Nenhuma relevante"],
      medicamentos: ["Metformina 850mg — 2x/dia", "Anticoncepcional combinado"],
      suplementos: ["Vitamina D 2.000 UI/dia", "Ômega-3 1g/dia", "Inositol 2g/dia"],
      alergias: ["Dipirona"],
      intolerancias: ["Lactose (parcial)"],
      histFamiliar: ["Mãe: diabetes tipo 2 e hipotireoidismo", "Pai: hipertensão", "Avó materna: câncer de mama"]
    },
    habitos: {
      "Horário de trabalho": "09h–18h, com home office 2x/semana",
      "Rotina diária": "Acorda 7h, trabalha sentada, jantar tarde (~21h30)",
      "Qualidade do sono": "Regular — desperta 1–2x/noite",
      "Horas de sono": "6h–6h30 por noite",
      "Consumo hídrico": "~1,2 L/dia (abaixo do ideal)",
      "Atividade física": "Musculação 3x/semana + caminhadas",
      "Tabagismo": "Nega",
      "Consumo de álcool": "Social — 1–2x/semana (vinho)"
    },
    alimentar: {
      "Preferências": "Massas, pães, doces no fim da tarde",
      "Aversões": "Fígado, jiló",
      "Apetite": "Aumentado, principalmente à noite",
      "Mastigação": "Rápida, come com pressa",
      "Horários habituais": "Café 8h · Almoço 13h · Janta 21h30",
      "Fome emocional": "Presente — ansiedade e estresse no trabalho",
      "Compulsão alimentar": "Episódios ocasionais (doces à noite)"
    },
    intestinal: {
      frequencia: "1x a cada 2 dias",
      bristol: 3,
      distensao: "Frequente, após refeições",
      refluxo: "Ocasional",
      gases: "Moderados",
      dor: "Rara"
    },
    mulher: {
      "Menarca": "12 anos",
      "Regularidade menstrual": "Irregular (ciclos de 35–60 dias)",
      "Duração do ciclo": "Variável",
      "Fluxo menstrual": "Moderado",
      "Sintomas pré-menstruais": "Inchaço, irritabilidade, desejo por doces",
      "SOP": "Sim — diagnóstico em 2022",
      "Endometriose": "Não",
      "Mioma": "Não",
      "Anticoncepcionais": "Em uso (combinado oral)",
      "Tentativas de gestação": "Planeja para 2027",
      "Histórico gestacional": "Nuligesta",
      "Menopausa": "Não"
    }
  },

  /* ============================================================
     2 · DIÁRIO ALIMENTAR E SINTOMAS
     ============================================================ */
  diario: [
    { data: "2026-06-22", humor: "🙂 Bem", energia: 7, sono: 6.5, agua: 1.4, sintomas: ["Inchaço leve à tarde"],
      refeicoes: [
        { hora: "08:10", nome: "Café da manhã", desc: "Ovos mexidos, pão integral, café sem açúcar", foto: true },
        { hora: "13:00", nome: "Almoço", desc: "Frango grelhado, arroz integral, salada e feijão", foto: true },
        { hora: "16:30", nome: "Lanche", desc: "Iogurte natural + castanhas", foto: false },
        { hora: "21:00", nome: "Jantar", desc: "Omelete de legumes + salada", foto: true }
      ] },
    { data: "2026-06-21", humor: "😐 Cansada", energia: 5, sono: 5.5, agua: 1.0, sintomas: ["Desejo por doce à noite", "Dor de cabeça"],
      refeicoes: [
        { hora: "08:30", nome: "Café da manhã", desc: "Tapioca com queijo + café", foto: false },
        { hora: "13:20", nome: "Almoço", desc: "Macarrão à bolonhesa (porção grande)", foto: true },
        { hora: "22:00", nome: "Ceia", desc: "2 brigadeiros 🍫", foto: true }
      ] }
  ],

  /* ============================================================
     3 · QUESTIONÁRIOS
     ============================================================ */
  questionarios: [
    { nome: "Ansiedade (GAD-7)",            ico: "😰", status: "Respondido",  pontuacao: 11, max: 21, faixa: "Moderada",  cor: "atencao", data: "12/06/2026" },
    { nome: "Depressão (PHQ-9)",            ico: "🧠", status: "Respondido",  pontuacao: 6,  max: 27, faixa: "Leve",      cor: "ativo",   data: "12/06/2026" },
    { nome: "Qualidade do sono (Pittsburgh)", ico: "😴", status: "Respondido", pontuacao: 9, max: 21, faixa: "Ruim",      cor: "alto",    data: "12/06/2026" },
    { nome: "Compulsão alimentar (ECAP)",   ico: "🍩", status: "Respondido",  pontuacao: 18, max: 46, faixa: "Moderada",  cor: "atencao", data: "10/06/2026" },
    { nome: "Saúde intestinal (Roma IV)",   ico: "🦠", status: "Pendente",    pontuacao: null, max: 100, faixa: "—",      cor: "neutro",  data: "—" },
    { nome: "Saúde hormonal",               ico: "⚖️", status: "Pendente",    pontuacao: null, max: 100, faixa: "—",      cor: "neutro",  data: "—" },
    { nome: "Estilo de vida",               ico: "🌱", status: "Respondido",  pontuacao: 72, max: 100, faixa: "Bom",       cor: "ativo",   data: "08/06/2026" }
  ],

  /* ============================================================
     4 · EXAMES LABORATORIAIS
     ============================================================ */
  exames: {
    datas: ["10/02/2025", "15/09/2025", "12/06/2026"],
    iaResumo: "A <strong>insulina de jejum (18,2)</strong> e o <strong>HOMA-IR (4,0)</strong> permanecem elevados, " +
      "compatíveis com resistência à insulina — embora em <strong>queda</strong> desde fev/2025 (HOMA-IR 5,1 → 4,0). " +
      "A <strong>vitamina D segue insuficiente (27)</strong> mesmo com suplementação; considere ajuste de dose. " +
      "Ferritina e tireoide dentro da normalidade. <strong>Triglicerídeos limítrofes</strong> acompanham o quadro metabólico. " +
      "Tendência geral: <strong>melhora do perfil glicêmico</strong>, manter conduta com inositol e atividade física.",
    grupos: [
      { grupo: "Hemograma e ferro", marcadores: [
        { nome: "Hemoglobina",    valor: 13.4, un: "g/dL",  ref: "12,0–16,0", status: "normal", hist: [13.1, 13.2, 13.4] },
        { nome: "Ferritina",      valor: 48,   un: "ng/mL", ref: "15–150",    status: "normal", hist: [32, 41, 48] },
        { nome: "Ferro sérico",   valor: 86,   un: "µg/dL", ref: "60–170",    status: "normal", hist: [70, 80, 86] }
      ]},
      { grupo: "Vitaminas e minerais", marcadores: [
        { nome: "Vitamina B12",   valor: 410,  un: "pg/mL", ref: "200–900",   status: "normal", hist: [350, 380, 410] },
        { nome: "Vitamina D",     valor: 27,   un: "ng/mL", ref: "30–100",    status: "baixo",  hist: [19, 24, 27] },
        { nome: "Ácido fólico",   valor: 9.1,  un: "ng/mL", ref: "3–17",      status: "normal", hist: [7, 8, 9.1] },
        { nome: "Homocisteína",   valor: 11,   un: "µmol/L",ref: "5–15",      status: "normal", hist: [13, 12, 11] },
        { nome: "Magnésio",       valor: 1.9,  un: "mg/dL", ref: "1,7–2,4",   status: "normal", hist: [1.8, 1.8, 1.9] },
        { nome: "Zinco",          valor: 78,   un: "µg/dL", ref: "70–120",    status: "normal", hist: [72, 75, 78] },
        { nome: "Selênio",        valor: 95,   un: "µg/L",  ref: "70–150",    status: "normal", hist: [88, 90, 95] }
      ]},
      { grupo: "Glicemia / metabólico", marcadores: [
        { nome: "Glicemia jejum", valor: 98,   un: "mg/dL", ref: "70–99",     status: "normal", hist: [104, 101, 98] },
        { nome: "Insulina",       valor: 18.2, un: "µUI/mL",ref: "2,6–24,9",  status: "alto",   hist: [22, 20, 18.2] },
        { nome: "HOMA-IR",        valor: 4.0,  un: "",      ref: "< 2,5",     status: "alto",   hist: [5.1, 4.6, 4.0] },
        { nome: "Hemoglobina glicada", valor: 5.6, un: "%", ref: "< 5,7",     status: "normal", hist: [5.9, 5.8, 5.6] }
      ]},
      { grupo: "Lipídios", marcadores: [
        { nome: "Colesterol total", valor: 192, un: "mg/dL",ref: "< 190",     status: "alto",   hist: [205, 198, 192] },
        { nome: "HDL",            valor: 52,   un: "mg/dL", ref: "> 50",      status: "normal", hist: [48, 50, 52] },
        { nome: "LDL",            valor: 118,  un: "mg/dL", ref: "< 130",     status: "normal", hist: [130, 124, 118] },
        { nome: "Triglicerídeos", valor: 158,  un: "mg/dL", ref: "< 150",     status: "alto",   hist: [180, 170, 158] }
      ]},
      { grupo: "Tireoide e outros", marcadores: [
        { nome: "TSH",            valor: 2.4,  un: "µUI/mL",ref: "0,4–4,0",   status: "normal", hist: [2.6, 2.5, 2.4] },
        { nome: "T3",             valor: 1.2,  un: "ng/mL", ref: "0,8–2,0",   status: "normal", hist: [1.1, 1.1, 1.2] },
        { nome: "T4 livre",       valor: 1.1,  un: "ng/dL", ref: "0,9–1,8",   status: "normal", hist: [1.0, 1.0, 1.1] },
        { nome: "Cortisol",       valor: 14,   un: "µg/dL", ref: "5–23",      status: "normal", hist: [16, 15, 14] },
        { nome: "PCR",            valor: 3.1,  un: "mg/L",  ref: "< 3,0",     status: "alto",   hist: [4.2, 3.6, 3.1] }
      ]}
    ]
  },

  /* ============================================================
     5 · ANTROPOMETRIA E BIOIMPEDÂNCIA
     ============================================================ */
  antropometria: {
    medidas: [
      { data: "10/02/2025", peso: 81.0, altura: 165, imc: 29.8, abdomen: 98, cintura: 92, quadril: 112, braco: 32, coxa: 60, panturrilha: 38 },
      { data: "20/06/2025", peso: 77.5, altura: 165, imc: 28.5, abdomen: 94, cintura: 88, quadril: 109, braco: 31, coxa: 59, panturrilha: 38 },
      { data: "15/12/2025", peso: 74.8, altura: 165, imc: 27.5, abdomen: 90, cintura: 85, quadril: 107, braco: 30, coxa: 58, panturrilha: 37 },
      { data: "18/06/2026", peso: 72.4, altura: 165, imc: 26.6, abdomen: 86, cintura: 81, quadril: 105, braco: 30, coxa: 57, panturrilha: 37 }
    ],
    dobras: { "Tricipital": "22 mm", "Bicipital": "12 mm", "Subescapular": "20 mm", "Suprailíaca": "24 mm", "Abdominal": "28 mm", "Coxa": "26 mm", "Σ Dobras": "132 mm" },
    bioimpedancia: {
      "Massa magra": "47,8 kg", "Massa muscular": "44,1 kg", "Massa gorda": "24,6 kg",
      "% de gordura": "34,0 %", "Água corporal": "52,1 %", "Gordura visceral": "9",
      "Massa óssea": "2,6 kg", "Taxa metabólica basal": "1.412 kcal", "Idade metabólica": "38 anos"
    }
  },

  /* ============================================================
     6 · CÁLCULOS NUTRICIONAIS
     ============================================================ */
  calculos: {
    formula: "Mifflin-St Jeor",
    formulasDisponiveis: ["FAO/WHO", "Harris-Benedict", "Mifflin-St Jeor", "Owen", "Schofield", "IOM", "Katch-McArdle", "Cunningham"],
    tmb: 1412,
    fatorAtividade: 1.55,
    fatorInjuria: 1.0,
    fatorTermico: 1.0,
    get: 2189,
    ajusteManual: -400,
    vet: 1789,
    memoria: [
      "TMB (Mifflin-St Jeor, ♀): (10×72,4) + (6,25×165) − (5×34) − 161 = 1.412 kcal",
      "GET: TMB × FA (1,55) × FI (1,0) × FT (1,0) = 2.189 kcal",
      "VET: GET − 400 kcal (déficit p/ emagrecimento) = 1.789 kcal"
    ]
  },

  /* ============================================================
     7 · PLANEJAMENTO ALIMENTAR
     ============================================================ */
  plano: {
    protocoloAtivo: "Emagrecimento + SOP (baixo índice glicêmico)",
    protocolos: ["Emagrecimento", "Hipertrofia", "Fertilidade", "SOP", "Endometriose", "Gestação", "Menopausa", "Saúde intestinal"],
    refeicoes: [
      { nome: "Café da manhã", hora: "08:00", kcal: 340, itens: [
        { alimento: "Ovos mexidos", qtd: "2 unid.", kcal: 156 },
        { alimento: "Pão integral", qtd: "1 fatia", kcal: 80 },
        { alimento: "Abacate", qtd: "2 col. sopa", kcal: 80 },
        { alimento: "Café sem açúcar", qtd: "1 xícara", kcal: 5 }
      ], subs: "Trocar pão por tapioca (1 unid.)", obs: "Priorizar proteína no início do dia." },
      { nome: "Lanche da manhã", hora: "10:30", kcal: 120, itens: [
        { alimento: "Iogurte natural", qtd: "1 pote", kcal: 90 },
        { alimento: "Chia", qtd: "1 col. chá", kcal: 30 }
      ], subs: "Trocar por 1 fruta + 3 castanhas", obs: "" },
      { nome: "Almoço", hora: "13:00", kcal: 520, itens: [
        { alimento: "Frango grelhado", qtd: "120 g", kcal: 200 },
        { alimento: "Arroz integral", qtd: "4 col. sopa", kcal: 160 },
        { alimento: "Feijão", qtd: "1 concha", kcal: 80 },
        { alimento: "Salada à vontade", qtd: "—", kcal: 40 },
        { alimento: "Azeite", qtd: "1 col. chá", kcal: 40 }
      ], subs: "Frango ↔ peixe ou patinho", obs: "Montar metade do prato com vegetais." },
      { nome: "Lanche da tarde", hora: "16:30", kcal: 160, itens: [
        { alimento: "Whey protein", qtd: "1 scoop", kcal: 120 },
        { alimento: "Banana", qtd: "1/2 unid.", kcal: 40 }
      ], subs: "", obs: "Antes do treino." },
      { nome: "Jantar", hora: "20:00", kcal: 420, itens: [
        { alimento: "Omelete de legumes", qtd: "3 ovos", kcal: 240 },
        { alimento: "Batata-doce", qtd: "1 unid. pequena", kcal: 120 },
        { alimento: "Salada verde", qtd: "—", kcal: 60 }
      ], subs: "Batata-doce ↔ mandioquinha", obs: "Evitar carboidrato refinado à noite." },
      { nome: "Ceia", hora: "22:00", kcal: 110, itens: [
        { alimento: "Chá de camomila", qtd: "1 xícara", kcal: 0 },
        { alimento: "Castanhas", qtd: "3 unid.", kcal: 110 }
      ], subs: "", obs: "Opcional, se houver fome." }
    ],
    totais: { kcal: 1670, ptn: 118, cho: 150, lip: 58, fib: 31 },
    metasMacro: { ptn: 120, cho: 160, lip: 60, fib: 30 },
    micros: { "Vitamina D": "Atenção", "Cálcio": "Adequado", "Ferro": "Adequado", "Magnésio": "Adequado", "Vitamina B12": "Adequado", "Zinco": "Adequado" }
  },

  /* ============================================================
     8 · METAS E OBJETIVOS
     ============================================================ */
  metas: [
    { nome: "Peso",            ico: "⚖️", atual: 72.4, inicial: 81.0, meta: 66.0, un: "kg",     invert: true },
    { nome: "Gordura corporal",ico: "🔥", atual: 34.0, inicial: 39.0, meta: 28.0, un: "%",      invert: true },
    { nome: "Massa muscular",  ico: "💪", atual: 44.1, inicial: 42.0, meta: 47.0, un: "kg",     invert: false },
    { nome: "Hidratação",      ico: "💧", atual: 1.4,  inicial: 1.0,  meta: 2.5,  un: "L/dia",  invert: false },
    { nome: "Passos diários",  ico: "👟", atual: 6800, inicial: 3500, meta: 10000,un: "passos", invert: false },
    { nome: "Exercícios/sem",  ico: "🏋️", atual: 3,    inicial: 1,    meta: 5,    un: "x",      invert: false }
  ],

  /* ============================================================
     9 · ORIENTAÇÕES NUTRICIONAIS
     ============================================================ */
  orientacoes: [
    { titulo: "Guia alimentar para SOP", tipo: "PDF",       ico: "📄", tam: "1,2 MB", data: "12/06/2026" },
    { titulo: "Receitas low-carb",       tipo: "E-book",    ico: "📘", tam: "3,4 MB", data: "10/06/2026" },
    { titulo: "Como montar o prato ideal",tipo: "Guia",     ico: "🍽️", tam: "640 KB", data: "01/06/2026" },
    { titulo: "Protocolo de sono e cortisol", tipo: "Protocolo", ico: "🌙", tam: "820 KB", data: "20/05/2026" },
    { titulo: "Lista de substituições inteligentes", tipo: "PDF", ico: "📄", tam: "510 KB", data: "15/05/2026" }
  ],

  /* ============================================================
     10 · PRESCRIÇÃO DE MANIPULADOS
     ============================================================ */
  manipulados: [
    { nome: "Inositol + Ácido fólico", dosagem: "2 g + 400 mcg", posologia: "1 dose", horario: "Manhã, em jejum", duracao: "90 dias", obs: "Suporte à resistência insulínica (SOP)", status: "Ativo" },
    { nome: "Vitamina D3 + K2",        dosagem: "4.000 UI + 100 mcg", posologia: "1 cápsula", horario: "Almoço", duracao: "60 dias", obs: "Corrigir insuficiência (27 ng/mL)", status: "Ativo" },
    { nome: "Magnésio dimalato",       dosagem: "300 mg", posologia: "1 cápsula", horario: "À noite", duracao: "Contínuo", obs: "Sono e função muscular", status: "Ativo" },
    { nome: "Berberina",               dosagem: "500 mg", posologia: "2x/dia", horario: "Antes das refeições", duracao: "Encerrado", obs: "Ciclo anterior", status: "Encerrado" }
  ],

  /* ============================================================
     11 · ARQUIVOS ANEXOS
     ============================================================ */
  anexos: [
    { nome: "Painel hormonal completo.pdf", categoria: "Exames", ico: "🧪", tam: "1,8 MB", data: "12/06/2026" },
    { nome: "Ultrassom transvaginal.pdf",   categoria: "Exames", ico: "🧪", tam: "2,1 MB", data: "05/06/2026" },
    { nome: "Bioimpedância_jun26.jpg",       categoria: "Relatórios", ico: "📊", tam: "740 KB", data: "18/06/2026" },
    { nome: "Receita médica metformina.pdf", categoria: "Receitas", ico: "💊", tam: "320 KB", data: "02/04/2026" },
    { nome: "Foto refeição almoço.jpg",      categoria: "Fotos", ico: "🍱", tam: "1,1 MB", data: "22/06/2026" },
    { nome: "Termo de consentimento.pdf",    categoria: "Documentos", ico: "📄", tam: "210 KB", data: "10/02/2025" }
  ],

  /* ============================================================
     12 · EVOLUÇÃO CLÍNICA
     ============================================================ */
  evolucao: [
    { data: "18/06/2026", tipo: "Retorno",
      queixa: "Refere melhora da disposição, mas dificuldade com doces à noite.",
      evolucao: "Perda de 2,4 kg desde dez/25. Circunferência abdominal 90→86 cm. Adesão ~82%.",
      diagnostico: "Sobrepeso em redução, resistência insulínica em melhora, padrão de fome emocional noturna.",
      conduta: "Manter VET 1.789 kcal, reforço proteico no jantar, estratégia para compulsão noturna.",
      metas: "Atingir 70 kg até set/26; vit. D > 30.", obs: "Encaminhar guia de sono." },
    { data: "15/12/2025", tipo: "Retorno",
      queixa: "Estabilização do peso nas últimas semanas.",
      evolucao: "Peso 74,8 kg, HOMA-IR 4,6. Treino 3x/sem mantido.",
      diagnostico: "Boa evolução metabólica, platô leve.",
      conduta: "Ajuste de carboidratos e inclusão de berberina (ciclo).", metas: "Reduzir 2 kg em 60 dias.", obs: "" },
    { data: "10/02/2025", tipo: "Primeira consulta",
      queixa: "Ganho de peso progressivo e ciclos irregulares.",
      evolucao: "Peso inicial 81 kg, IMC 29,8. Diagnóstico de SOP em 2022.",
      diagnostico: "Sobrepeso grau I com resistência insulínica associada a SOP.",
      conduta: "Plano hipocalórico de baixo IG, solicitação de exames, suplementação inicial.", metas: "Perda de 5% do peso em 3 meses.", obs: "Vínculo estabelecido." }
  ],

  /* ============================================================
     13 · CHAT
     ============================================================ */
  chat: [
    { de: "paciente", tipo: "texto", conteudo: "Oi Ana! Posso trocar o arroz integral por quinoa?", hora: "Ontem 19:42" },
    { de: "nutri",    tipo: "texto", conteudo: "Oi Marina! Pode sim 😊 mesma quantidade, ótima troca.", hora: "Ontem 20:10" },
    { de: "paciente", tipo: "foto",  conteudo: "Foto do almoço de hoje", hora: "Hoje 13:15" },
    { de: "paciente", tipo: "audio", conteudo: "Áudio · 0:42", hora: "Hoje 13:16" },
    { de: "nutri",    tipo: "texto", conteudo: "Ficou ótimo! Só capricha um pouco mais na salada 🥗", hora: "Hoje 14:02" }
  ],

  /* ============================================================
     14 · DOCUMENTOS
     ============================================================ */
  documentos: [
    { tipo: "Declaração",     ico: "📃", titulo: "Declaração de comparecimento", data: "18/06/2026" },
    { tipo: "Atestado",       ico: "🩺", titulo: "Atestado nutricional", data: "18/06/2026" },
    { tipo: "Relatório",      ico: "📊", titulo: "Relatório de evolução (jun/26)", data: "18/06/2026" },
    { tipo: "Encaminhamento", ico: "➡️", titulo: "Encaminhamento p/ endocrinologista", data: "15/12/2025" },
    { tipo: "Recibo",         ico: "🧾", titulo: "Recibo de consulta", data: "18/06/2026" }
  ],

  /* ============================================================
     15 · FINANCEIRO
     ============================================================ */
  financeiro: {
    resumo: { recebido: 1350, pendente: 250, consultasRealizadas: 6, consultasFuturas: 1 },
    metodos: ["Pix", "Cartão", "Mercado Pago", "Asaas", "Stripe"],
    lancamentos: [
      { data: "18/06/2026", desc: "Consulta de retorno", valor: 250, status: "Pago",     metodo: "Pix" },
      { data: "15/12/2025", desc: "Consulta de retorno", valor: 250, status: "Pago",     metodo: "Cartão" },
      { data: "20/06/2025", desc: "Consulta de retorno", valor: 220, status: "Pago",     metodo: "Pix" },
      { data: "10/02/2025", desc: "Primeira consulta + avaliação", valor: 380, status: "Pago", metodo: "Mercado Pago" },
      { data: "02/07/2026", desc: "Consulta agendada",   valor: 250, status: "Pendente", metodo: "—" }
    ]
  },

  /* Sugestões do Nútri AI nesta tela */
  aiSugestoes: [
    "Resumir os exames mais recentes",
    "Sugerir conduta para a SOP",
    "Gerar relatório de evolução",
    "Montar plano de baixo índice glicêmico"
  ],
  aiRespostaDemo:
    "Analisei o prontuário da Marina. Destaques: <strong>HOMA-IR 4,0</strong> (em queda, ainda elevado) e " +
    "<strong>vitamina D 27</strong> (insuficiente). Recomendo manter o foco em baixo índice glicêmico, reforçar " +
    "proteína no jantar para conter a compulsão noturna e ajustar a dose de vitamina D. Quer que eu gere o resumo clínico completo?"
};

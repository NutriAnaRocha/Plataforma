/* ============================================================
   FEED CIENTÍFICO INTELIGENTE — base de conteúdo
   Exposto como global para funcionar abrindo o HTML por file:// (sem servidor).

   Todos os itens abaixo são REAIS: título, revista, ano, autores e DOI foram
   conferidos no PubMed. O texto em português é curadoria da plataforma,
   escrito a partir do resumo (abstract) publicado — não é tradução literal
   nem reprodução do artigo, que segue no site do periódico.

   Cada item:
     categoria  -> rótulo exibido na tag/chip
     areas      -> chaves que casam com a personalização ("Quais áreas você atende?")
     evidencia  -> 1 a 5 (força da evidência, considerando desenho + certeza GRADE)
     fonte      -> ficha do estudo original (null quando não é estudo indexado)
     leitura    -> artigo completo em seções, renderizado em artigo.html
   ============================================================ */
window.FEED_DATA = {
  /* Resumo da rodada atual */
  semana: {
    eyebrow: "Atualização da Semana",
    title: "9 estudos reais que atualizam sua prática",
    texto: "Jejum 16/8 revisado, zinco na doença renal crônica, a dieta de baixo teor de gordura do WHI e a demência, colágeno vs. whey na força, o programa Mind-Eat na compulsão, probióticos e diversidade da microbiota, colágeno oral para pele e articulações, a primeira pílula oral de GLP-1 (aleniglipron) e nutrição na gestação. Cada card traz o link do estudo original."
  },

  /* Categorias (chips do feed) */
  categorias: [
    "Todos", "Clínica", "Saúde da Mulher", "Esportiva", "Comportamental",
    "Microbiota", "Suplementação", "Obesidade", "Materno Infantil",
    "Artigos", "CFN/CRN", "Gestão"
  ],

  cards: [
    /* ------------------------------------------------------------------ */
    {
      id: "tre-16-8-glicose-lipidios",
      categoria: "Clínica",
      areas: ["Clínica"],
      data: "ago 2026",
      title: "Jejum 16/8 revisado: efeito real (e modesto) na glicemia e nos lipídios",
      resumo: "Meta-análise com 23 ECRs e 1.280 participantes mostra que o jejum intermitente 16/8 reduz discretamente glicemia de jejum, HOMA-IR e insulina, com leve melhora do HDL — sem efeito consistente sobre LDL e triglicérides na população geral.",
      mudou: "O 16/8 confirma benefício metabólico real, mas pequeno: deixa de ser vendido como estratégia com grande impacto lipídico e vira mais uma ferramenta entre várias, não a mais potente.",
      aplicar: "Ofereça o 16/8 a quem já se identifica com o formato, sem prometer resultado lipídico maior que o de outras dietas hipocalóricas; no subgrupo masculino a melhora de LDL e triglicérides foi mais consistente, o que vale monitorar.",
      evidencia: 5,
      link: "https://doi.org/10.1093/nutrit/nuaf206"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "zinco-suplementacao-drc",
      categoria: "Clínica",
      areas: ["Renal", "Suplementação"],
      data: "06 fev 2026",
      title: "Zinco na doença renal crônica: o que a suplementação realmente entrega",
      resumo: "Meta-análise reúne 41 estudos (23 na síntese quantitativa) e mostra que suplementar zinco em adultos com DRC aumenta peso corporal, zinco sérico, HDL, albumina e ingestão energética — sem mudar IMC, colesterol total, triglicérides ou creatinina.",
      mudou: "Zinco deixa de ser suplemento genérico de 'imunidade' nessa população e ganha um perfil de efeito mais claro: nutricional e metabólico modesto, não renal direto.",
      aplicar: "Considere zinco no paciente com DRC e sinais de baixa ingestão energética ou zinco sérico baixo, monitorando peso e albumina — e deixe claro que a evidência ainda é de baixa qualidade, sem impacto comprovado sobre a função renal.",
      evidencia: 3,
      link: "https://doi.org/10.1093/nutrit/nuaf285"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "whi-dieta-baixa-gordura-demencia",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher"],
      data: "09 jun 2026",
      title: "Dieta de baixo teor de gordura não reduziu mortalidade por demência no WHI",
      resumo: "Análise secundária do ensaio WHI, com quase 49 mil mulheres pós-menopausa e até 20 anos de seguimento, não encontrou redução na mortalidade por demência com a dieta de baixo teor de gordura (HR 0,94; IC 95% 0,85–1,05).",
      mudou: "Um resultado negativo relevante: a mesma intervenção que já havia mostrado benefício em outros desfechos do WHI não se traduziu em proteção contra mortalidade por demência, nem nos subtipos Alzheimer e não Alzheimer.",
      aplicar: "Não use proteção cognitiva como argumento para reduzir gordura na dieta da paciente na pós-menopausa — mantenha a recomendação pelos benefícios já demonstrados (mortalidade por câncer de mama, saúde cardiometabólica), sem estender a promessa para um desfecho que este estudo não confirmou.",
      evidencia: 4,
      link: "https://doi.org/10.1097/GME.0000000000002808"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "colageno-whey-forca",
      categoria: "Esportiva",
      areas: ["Esportiva"],
      data: "02 fev 2026",
      title: "Colágeno ou whey: qual suplemento proteico rende mais força e massa magra",
      resumo: "Meta-análise em rede com 78 estudos e 4.755 participantes comparou 13 tipos de suplemento proteico e apontou colágeno e whey como os mais eficazes para ganho de força e massa magra no treino resistido — achado que já gerou contestação metodológica publicada na mesma revista.",
      mudou: "A ideia de que 'proteína é proteína' perde força: o tipo de suplemento parece importar, com o colágeno surpreendendo ao lado do whey, até aqui a referência isolada.",
      aplicar: "Não troque whey por colágeno como conduta padrão ainda — a superioridade do colágeno está sendo questionada por outros pesquisadores; use o estudo para justificar abrir a suplementação proteica além do whey, não para substituí-lo de forma definitiva.",
      evidencia: 4,
      link: "https://doi.org/10.1155/tsm2/5557511"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mind-eat-compulsao",
      categoria: "Comportamental",
      areas: ["Comportamental"],
      data: "21 mai 2026",
      title: "Mind-Eat: programa de mindfulness supera educação em alimentação intuitiva na compulsão",
      resumo: "Ensaio clínico randomizado (66 adultos com sobrepeso/obesidade, 46 analisados) mostra que o programa Mind-Eat, baseado em mindfulness, produziu mais melhora em comer emocional e externo do que um programa educativo baseado em alimentação intuitiva.",
      mudou: "Entre duas abordagens comportamentais concorrentes, a estruturada em mindfulness levou vantagem — mas a amostra pequena pede cautela antes de trocar de protocolo.",
      aplicar: "Para pacientes com compulsão e comer emocional/externo, considere um protocolo estruturado de mindfulness como primeira opção diante da educação em alimentação intuitiva isolada — tratando o achado como promissor, não definitivo, dado o tamanho da amostra.",
      evidencia: 3,
      link: "https://doi.org/10.1186/s12966-026-01931-y"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-diversidade-microbiota",
      categoria: "Microbiota",
      areas: ["Microbiota"],
      data: "07 jan 2026",
      title: "Probiótico muda a diversidade da microbiota em quem já é saudável? A resposta é não",
      resumo: "Meta-análise com 47 estudos (22 com dados de 1.068 pessoas) não encontrou mudança significativa na diversidade da microbiota intestinal com suplementação de probióticos em populações saudáveis.",
      mudou: "Derruba um argumento de venda comum: tomar probiótico 'para diversificar a microbiota' não tem respaldo nesse desfecho específico em gente saudável — o que não invalida outros benefícios de cepas específicas em condições clínicas.",
      aplicar: "Não use 'aumentar a diversidade da microbiota' como justificativa para prescrever probiótico à paciente saudável sem queixa; mantenha a indicação por cepa e desfecho quando houver um problema clínico definido a tratar.",
      evidencia: 5,
      link: "https://doi.org/10.1186/s12916-025-04602-0"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "colageno-pele-articulacoes",
      categoria: "Suplementação",
      areas: ["Suplementação"],
      data: "30 jan 2026",
      title: "Colágeno para pele e articulações: revisão-guarda-chuva confirma efeito, com limites",
      resumo: "Revisão-guarda-chuva de 16 revisões sistemáticas (113 ECRs, 7.983 participantes) encontra evidência de alta certeza para melhora de elasticidade e hidratação da pele, e sinal favorável para saúde musculoesquelética e osteoartrite — mas nada consistente para rugosidade da pele, saúde bucal ou marcadores cardiometabólicos.",
      mudou: "O colágeno oral sai da zona de 'modismo sem prova' e passa a ter respaldo real em desfechos específicos de pele e articulação — desde que a expectativa seja calibrada pelo desfecho certo.",
      aplicar: "Indique colágeno com meta clara (elasticidade/hidratação da pele, ou suporte articular) e uso prolongado, já que o benefício cresce com o tempo de suplementação; não prometa efeito sobre glicemia ou saúde bucal, onde a evidência não sustenta.",
      evidencia: 4,
      link: "https://doi.org/10.1093/asjof/ojag018"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "aleniglipron-glp1-oral",
      categoria: "Obesidade",
      areas: ["Obesidade"],
      data: "05 jun 2026",
      title: "Aleniglipron: pílula oral de GLP-1 mostra até 11,3% de perda de peso em fase 2b",
      resumo: "Ensaio fase 2b com 230 adultos com obesidade ou sobrepeso mostrou perda de peso ajustada por placebo de 8,2%, 9,8% e 11,3% nas doses de 45, 90 e 120 mg em 36 semanas, com o aleniglipron — um agonista de GLP-1 oral, de molécula pequena, não peptídico.",
      mudou: "Abre uma via oral para o efeito GLP-1, diferente das canetas injetáveis — o resultado ainda é de fase 2b, mas confirma que a via oral pode se aproximar do efeito das injeções.",
      aplicar: "Trate como medicação em desenvolvimento, ainda não aprovada nem disponível no Brasil: já vale se atualizar sobre o mecanismo e antecipar, junto à equipe médica, que o suporte nutricional para tolerância e preservação de massa magra será o mesmo desafio já visto com os GLP-1 injetáveis.",
      evidencia: 4,
      link: "https://doi.org/10.1038/s41591-026-04476-6"
    },

    /* ------------------------------------------------------------------ */
    {
      id: "nutricao-gestacao-desfechos",
      categoria: "Materno Infantil",
      areas: ["Materno Infantil", "Saúde da Mulher"],
      data: "14 ago 2026",
      title: "Intervenções nutricionais na gestação reduzem baixo peso ao nascer e diabetes gestacional",
      resumo: "Meta-análise de ensaios clínicos randomizados (2014–2024) mostra que intervenções nutricionais na gravidez aumentaram o peso ao nascer dentro da faixa saudável e reduziram os riscos de baixo peso ao nascer, pequeno para a idade gestacional, prematuridade e diabetes gestacional.",
      mudou: "Reforça, com metodologia atualizada (Cochrane RoB 2 e GRADE), que a intervenção nutricional estruturada na gestação tem efeito mensurável sobre desfechos duros — não é só orientação genérica de 'comer bem'.",
      aplicar: "Estruture a intervenção nutricional do pré-natal com metas específicas de ganho de peso e adequação energética e de micronutrientes desde o início do acompanhamento, já que isso se conecta a menos prematuridade, menos diabetes gestacional e recém-nascidos com peso mais adequado.",
      evidencia: 5,
      link: "https://doi.org/10.1111/jmwh.70172"
    }
  ]
};

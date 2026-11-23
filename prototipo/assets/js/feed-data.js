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
    title: "8 estudos reais para atualizar sua conduta nesta semana",
    texto: "Um estudo nacional japonês com dados de 51.580 internações em UTI (Clinical Nutrition) mostra que apenas 53,5% dos pacientes críticos têm status nutricional classificável pelos critérios GLIM, e que a desnutrição identificada eleva em 23% o risco de morte em 30 dias — pacientes sem avaliação documentada também tiveram mortalidade mais alta. Um ensaio randomizado em mulheres com SOP (Nature Medicine) mostra que o jejum intermitente de 6 horas emagrece tanto quanto a restrição calórica diária, mas só o jejum reduziu o índice de andrógeno livre. Um ensaio de 6 meses (European Journal of Clinical Nutrition) mostra que diferentes estratégias dietéticas reduzem em média 3% do peso em adultos com sobrepeso, sem diferença significativa de eficácia entre as dietas testadas. Um ensaio robusto em lactentes (JAMA Network Open) mostra que fórmula infantil enriquecida com MFGM não melhora significativamente a cognição aos 12 meses frente à fórmula padrão, contrariando ensaios menores anteriores. Uma análise secundária de 3 ECRs em idosos mostra que mais proteína durante a perda de peso preserva mais massa magra apendicular, mas não se traduz em mais força ou função física. Uma meta-análise dose-resposta (Nutrients) mostra que doses baixas de cafeína (1,3-3 mg/kg) já melhoram o desempenho aeróbico em contrarrelógio, sem necessidade de doses mais altas. Um ensaio de viabilidade brasileiro, conduzido no Hospital de Clínicas de Porto Alegre (Lancet Regional Health – Americas), mostra que um programa online de alimentação consciente para pacientes com obesidade e ansiedade não mudou o controle inibitório alimentar medido objetivamente, mas trouxe ganhos psicológicos autorrelatados. E uma meta-análise de 9 ECRs mostra que a dieta mediterrânea melhora HbA1c, LDL e triglicerídeos no diabetes tipo 2, mas o efeito sobre a microbiota intestinal ainda não pôde ser quantificado por falta de padronização entre os estudos. Cada card abre a leitura completa com o link do estudo original."
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
      id: "glim-malnutricao-mortalidade-uti-dpc-japao-coorte",
      categoria: "Clínica",
      areas: ["Clínica", "Gestão"],
      data: "20 ago 2026",
      title: "Estudo nacional japonês: apenas 53,5% dos pacientes críticos têm status nutricional classificável pelo GLIM, e a desnutrição identificada eleva em 23% o risco de morte em 30 dias",
      resumo: "Coorte retrospectiva nacional japonesa, com dados do banco DPC, analisou 51.580 internações de adultos em UTI entre junho de 2024 e setembro de 2025: apenas 53,5% (27.613 pacientes) tiveram status nutricional classificável pelos critérios GLIM, e entre esses, 10,2% foram classificados como desnutridos; a desnutrição associou-se a maior mortalidade hospitalar em 30 dias frente a pacientes não desnutridos (razão de risco ajustada de 1,23, IC95% 1,08-1,41), e pacientes sem avaliação documentada também apresentaram mortalidade mais alta do que os não desnutridos.",
      mudou: "Reforça, com dados nacionais recentes, que a adoção do GLIM na prática real de UTI ainda tem grande lacuna de documentação — quase metade dos pacientes críticos não tem status nutricional classificável — e sugere que a própria ausência de avaliação já é um sinal de risco, não apenas um problema de registro.",
      aplicar: "Nas equipes de terapia intensiva, defenda a aplicação e o registro completo do GLIM para todo paciente internado, já que os dados sugerem que pacientes sem avaliação documentada podem representar um grupo de risco elevado que passa despercebido nos indicadores habituais do serviço.",
      evidencia: 3,
      link: "https://doi.org/10.1016/j.clnu.2026.106765",
      fonte: {
        autores: "Shimizu Akio, Yoshida Minoru, Tomata Yasutake, Momosaki Ryo e Shimizu Sayuri",
        revista: "Clinical Nutrition",
        ano: "2026 (publicado on-line em 20 de agosto de 2026)",
        desenho: "Coorte retrospectiva nacional, banco de dados DPC (Diagnosis Procedure Combination) do Japão",
        amostra: "51.580 internações de adultos em UTI no Japão, junho de 2024 a setembro de 2025",
        doi: "10.1016/j.clnu.2026.106765",
        acesso: "Verificar acesso ao texto completo no site da revista (Elsevier)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O GLIM (Global Leadership Initiative on Malnutrition) é o critério mais recomendado para diagnosticar desnutrição, mas pouco se sabe sobre o quanto ele é efetivamente aplicado e documentado na rotina real de unidades de terapia intensiva. Os autores quiseram medir essa lacuna de documentação em escala nacional e verificar se ela se relaciona com a mortalidade dos pacientes." },
        { h: "Como o estudo foi feito", p: "Usando o banco de dados nacional japonês Diagnosis Procedure Combination (DPC), os pesquisadores identificaram 51.580 internações de adultos em UTI entre junho de 2024 e setembro de 2025. Eles verificaram quantos pacientes tinham um status nutricional classificável pelos critérios GLIM e compararam a mortalidade hospitalar em 30 dias entre pacientes desnutridos, não desnutridos e sem avaliação documentada." },
        { h: "O que foi encontrado", p: "Apenas 53,5% dos pacientes (27.613) tiveram status nutricional classificável; entre esses, 10,2% foram classificados como desnutridos pelo GLIM. A desnutrição associou-se a maior mortalidade hospitalar em 30 dias em comparação com pacientes não desnutridos (razão de risco ajustada de 1,23, IC95% 1,08-1,41). Pacientes cujo status não foi avaliado ou documentado também apresentaram mortalidade mais alta do que os não desnutridos." },
        { h: "O que isso não responde", p: "Por ser observacional e baseado em registros administrativos, o estudo não permite afirmar que melhorar a documentação por si só reduziria a mortalidade — pacientes mais graves podem ser menos frequentemente avaliados por razões assistenciais que o banco de dados não captura. O estudo também não detalha quais fatores explicam a baixa taxa de classificação (53,5%)." },
        { h: "Na prática do consultório", p: "Para profissionais que atuam em terapia intensiva ou hospitais, use este achado para reforçar junto à equipe multiprofissional a importância de aplicar e registrar o GLIM em todo paciente internado — e trate a ausência de avaliação documentada como um possível sinal de alerta, não apenas como uma falha de preenchimento de prontuário." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "jejum-intermitente-tre-pcos-peso-androgenos-ecr",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Obesidade"],
      data: "27 mar 2026",
      title: "ECR em mulheres com SOP: jejum intermitente de 6 horas emagrece tanto quanto a restrição calórica diária, mas só o jejum reduz o índice de andrógeno livre",
      resumo: "Ensaio clínico randomizado com 76 mulheres com síndrome dos ovários policísticos (SOP) comparou, por 6 meses, uma janela de alimentação de 6 horas (jejum intermitente, refeições entre 13h e 19h, sem contagem de calorias), restrição calórica diária de 25% e um grupo controle sem mudança na dieta: a perda de peso foi semelhante entre jejum intermitente (cerca de 4,3%) e restrição calórica (cerca de 4,7%), sem diferença significativa entre os dois grupos ativos, mas apenas o jejum intermitente reduziu o índice de andrógeno livre; não houve eventos adversos graves em nenhum grupo.",
      mudou: "Oferece, em um ensaio controlado, uma alternativa de igual eficácia à contagem de calorias tradicional para perda de peso em mulheres com SOP, e sugere um possível benefício hormonal adicional específico do jejum intermitente (redução do andrógeno livre) que não foi observado com a restrição calórica.",
      aplicar: "Pode-se apresentar a janela de alimentação de 6 horas como opção dietética válida para pacientes com SOP e sobrepeso que não se adaptam bem à contagem de calorias, deixando claro que este é um ensaio único e relativamente pequeno (76 mulheres), e que o achado sobre o andrógeno livre precisa de confirmação em estudos maiores e mais longos.",
      evidencia: 4,
      link: "https://doi.org/10.1038/s41591-026-04316-7",
      fonte: {
        autores: "Corapi S, Runchey MC, Lyons J, Alonso de Leon M, Pavlou V, Lin S, Ezpeleta M, Gabel K, Tussing-Humphreys L, Oddo VM, Alexandria SJ, Sanchez J, Vidmar AP, Varady KA e Cienfuegos S",
        revista: "Nature Medicine",
        ano: "2026 (publicado on-line em 27 de março de 2026; edição impressa de junho de 2026, volume 32(6), p. 2155-2163)",
        desenho: "Ensaio clínico randomizado de 3 braços",
        amostra: "76 mulheres com síndrome dos ovários policísticos, seguimento de 6 meses",
        doi: "10.1038/s41591-026-04316-7",
        acesso: "Verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O jejum intermitente vem sendo estudado como alternativa à restrição calórica tradicional para perda de peso, mas faltavam ensaios randomizados comparando diretamente as duas estratégias especificamente em mulheres com síndrome dos ovários policísticos (SOP), uma população com particularidades metabólicas e hormonais próprias." },
        { h: "Como o estudo foi feito", p: "76 mulheres com SOP foram randomizadas para 6 meses de: alimentação restrita a uma janela de 6 horas (13h às 19h, sem contagem de calorias), restrição calórica diária de 25% das necessidades energéticas, ou um grupo controle sem mudança na dieta. Os desfechos incluíram peso corporal, índice de andrógeno livre e segurança (eventos adversos)." },
        { h: "O que foi encontrado", p: "A perda de peso em 6 meses foi semelhante entre os dois grupos ativos: cerca de 4,3% com o jejum intermitente e cerca de 4,7% com a restrição calórica, sem diferença estatisticamente significativa entre eles. Apenas o grupo de jejum intermitente apresentou redução do índice de andrógeno livre. Não houve eventos adversos graves em nenhum dos grupos." },
        { h: "O que isso não responde", p: "A amostra de 76 mulheres é pequena para um ensaio definitivo, e o estudo não acompanhou desfechos reprodutivos de longo prazo (como regularidade menstrual ou fertilidade) de forma conclusiva. Também não está claro se o benefício sobre o andrógeno livre se mantém além dos 6 meses ou se traduz em melhora clínica perceptível para a paciente." },
        { h: "Na prática do consultório", p: "Para pacientes com SOP e sobrepeso que têm dificuldade com contagem de calorias, a janela de alimentação de 6 horas pode ser apresentada como alternativa de eficácia equivalente para perda de peso — mas comunique que a amostra é pequena, que o achado hormonal é preliminar, e que a estratégia deve ser adaptada à rotina e preferência de cada paciente." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dietas-diferentes-peso-perfil-cardiometabolico-sobrepeso-ecr",
      categoria: "Obesidade",
      areas: ["Obesidade", "Clínica"],
      data: "16 nov 2026",
      title: "ECR de 6 meses: diferentes estratégias dietéticas reduzem em média 3% do peso em adultos com sobrepeso, sem diferença significativa de eficácia entre elas",
      resumo: "Ensaio clínico randomizado de 6 meses com 141 adultos com sobrepeso testou diferentes intervenções dietéticas sobre componentes de gordura abdominal e perfil cardiometabólico: a perda de peso média foi de aproximadamente 3%, com perda de peso clinicamente significativa (≥5%) alcançada por 16,8% dos participantes aos 3 meses e por 30,7% aos 6 meses, sem diferenças significativas entre as diferentes estratégias dietéticas testadas.",
      mudou: "Reforça que diferentes abordagens dietéticas, quando bem implementadas, tendem a convergir para resultados médios semelhantes — sugerindo que a adesão e o tempo de acompanhamento pesam mais do que a escolha específica da estratégia de macronutrientes para alcançar perda de peso clinicamente relevante.",
      aplicar: "Use este achado para individualizar a escolha da estratégia dietética conforme a preferência e a adesão esperada de cada paciente, em vez de assumir superioridade de uma abordagem de macronutrientes sobre outra — e seja realista ao comunicar que, mesmo com acompanhamento estruturado, cerca de 1 em cada 3 pacientes atinge perda de peso ≥5% em 6 meses.",
      evidencia: 4,
      link: "https://doi.org/10.1038/s41430-026-01845-9",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "European Journal of Clinical Nutrition (grupo Nature)",
        ano: "2026 (publicado em 16 de novembro de 2026)",
        desenho: "Ensaio clínico randomizado de 6 meses, múltiplos braços dietéticos",
        amostra: "141 adultos com sobrepeso",
        doi: "10.1038/s41430-026-01845-9",
        acesso: "Verificar acesso ao texto completo no site da revista (PMID 43039960)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Diferentes estratégias dietéticas (como dietas balanceadas, pobres em carboidrato ou pobres em gordura) são frequentemente comparadas entre si na literatura, mas os resultados costumam ser inconsistentes. Os autores testaram, em um ensaio de 6 meses, se diferentes intervenções dietéticas produzem efeitos distintos sobre gordura abdominal, peso e perfil cardiometabólico em adultos com sobrepeso." },
        { h: "Como o estudo foi feito", p: "141 adultos com sobrepeso foram randomizados para diferentes intervenções dietéticas por 6 meses, com avaliações em pontos intermediários (3 meses) e ao final (6 meses). Os desfechos incluíram peso corporal, componentes de gordura abdominal e marcadores cardiometabólicos." },
        { h: "O que foi encontrado", p: "A perda de peso média foi de aproximadamente 3% em todo o grupo. A proporção de participantes que atingiu perda de peso clinicamente significativa (≥5%) foi de 16,8% aos 3 meses e subiu para 30,7% aos 6 meses. Não houve diferenças estatisticamente significativas entre as diferentes estratégias dietéticas testadas em nenhum dos desfechos avaliados." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham os componentes exatos de cada braço dietético nem o grau de adesão de cada grupo ao longo dos 6 meses, o que dificulta saber se a ausência de diferença reflete equivalência real entre as dietas ou dificuldade de adesão uniforme. Também não há dados de seguimento além de 6 meses para avaliar manutenção do peso perdido." },
        { h: "Na prática do consultório", p: "Ao prescrever uma estratégia dietética para perda de peso em pacientes com sobrepeso, priorize a que tiver maior probabilidade de adesão para aquele paciente específico, em vez de assumir que uma estratégia de macronutrientes é inerentemente superior — e comunique, de forma realista, que a perda de peso clinicamente significativa (≥5%) costuma levar meses e não ocorre para todos os pacientes, mesmo com acompanhamento estruturado." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "formula-mfgm-cognicao-lactentes-ecr",
      categoria: "Materno Infantil",
      areas: ["Materno Infantil"],
      data: "19 nov 2026",
      title: "ECR: fórmula infantil enriquecida com membrana do glóbulo de gordura do leite (MFGM) não melhora significativamente a cognição aos 12 meses, em comparação com fórmula padrão",
      resumo: "Ensaio clínico randomizado com lactentes a termo, únicos, recrutados na comunidade com menos de 2 meses de idade (recrutamento entre maio de 2020 e abril de 2022), comparou fórmula infantil enriquecida com membrana do glóbulo de gordura do leite (MFGM) à fórmula padrão, incluindo um grupo de referência de lactentes amamentados (204 lactentes): o escore cognitivo médio aos 12 meses foi de 100,1 no grupo MFGM versus 99,4 no grupo fórmula padrão, uma diferença que não foi estatisticamente significativa.",
      mudou: "Contraria a expectativa, baseada em ensaios menores e mais antigos, de que a suplementação de MFGM na fórmula traria um benefício cognitivo mensurável frente à fórmula padrão — neste ensaio maior e mais recente, não foi encontrada diferença estatisticamente significativa entre os grupos.",
      aplicar: "Tenha cautela ao recomendar fórmulas enriquecidas com MFGM especificamente por alegações de benefício cognitivo — comunique às famílias que a evidência mais recente e robusta não confirma superioridade cognitiva frente à fórmula padrão, e reforce que a amamentação continua sendo a referência sempre que possível.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/43056116/",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "JAMA Network Open",
        ano: "2026 (publicado em 19 de novembro de 2026)",
        desenho: "Ensaio clínico randomizado, com grupo de referência amamentado",
        amostra: "Lactentes a termo, únicos, com menos de 2 meses de idade no recrutamento (comunidade, 2020-2022); grupo de referência amamentado com 204 lactentes",
        doi: "Conferir DOI no registro do PMID 43056116",
        acesso: "Acesso aberto (JAMA Network Open)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Ensaios anteriores, em geral menores, sugeriram que a suplementação de MFGM (membrana do glóbulo de gordura do leite) em fórmulas infantis poderia melhorar o desenvolvimento cognitivo de lactentes não amamentados, aproximando seus resultados dos de lactentes amamentados. Faltava um ensaio maior e mais recente para confirmar esse benefício." },
        { h: "Como o estudo foi feito", p: "Lactentes a termo, únicos, com menos de 2 meses de idade, foram recrutados na comunidade entre maio de 2020 e abril de 2022 e randomizados para fórmula enriquecida com MFGM ou fórmula padrão, com um grupo de referência de lactentes amamentados (204 lactentes) incluído para comparação. O desfecho principal foi o escore cognitivo médio aos 12 meses." },
        { h: "O que foi encontrado", p: "O escore cognitivo médio aos 12 meses foi de 100,1 no grupo que recebeu fórmula com MFGM e de 99,4 no grupo de fórmula padrão — uma diferença pequena e não estatisticamente significativa. Os autores notaram que uma possível redução no número de lactentes com atraso cognitivo mereceria investigação adicional." },
        { h: "O que isso não responde", p: "O estudo não esclarece, a partir dos resumos disponíveis, se subgrupos específicos de lactentes (por exemplo, com maior risco de atraso no desenvolvimento) poderiam se beneficiar de forma diferente da suplementação de MFGM. Também não há, nos materiais consultados, uma comparação estatística direta entre os grupos de fórmula e o grupo de referência amamentado." },
        { h: "Na prática do consultório", p: "Ao orientar famílias que não conseguem ou optam por não amamentar, evite basear a recomendação de uma fórmula específica em alegações de benefício cognitivo ligadas à MFGM — explique que o ensaio mais recente e rigoroso não confirmou esse benefício, e mantenha o foco em orientações de evidência consolidada sobre introdução alimentar e acompanhamento do crescimento." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "proteina-perda-peso-idosos-massa-magra-analise-secundaria",
      categoria: "Suplementação",
      areas: ["Suplementação", "Clínica"],
      data: "22 jan 2026",
      title: "Análise secundária de 3 ECRs: mais proteína durante a perda de peso em idosos preserva mais massa magra apendicular, mas não melhora força nem função física",
      resumo: "Análise secundária de dados de 3 ensaios clínicos randomizados (Muscle Preservation Study, PROBE study e WelPrex study) com 191 idosos com sobrepeso ou obesidade (idade média de 65,1 anos, IMC médio de 32,9 kg/m²) em intervenções de perda de peso: maior ingestão de proteína (variando entre aproximadamente 0,87 e 1,06 g/kg/dia entre os estudos) associou-se a mais massa magra apendicular preservada, mas não a melhores resultados de força de preensão manual, velocidade de marcha ou desempenho físico (SPPB).",
      mudou: "Nuança a suposição de que 'mais proteína' durante a perda de peso em idosos se traduz automaticamente em melhor função física — este estudo mostra uma dissociação entre um efeito positivo na composição corporal (massa magra preservada) e a ausência de efeito mensurável sobre força e função física.",
      aplicar: "Em planos hipocalóricos para idosos, priorizar ingestão de proteína na faixa superior das recomendações continua sendo razoável para proteger a massa magra, mas comunique que preservar massa muscular isoladamente pode não se traduzir em ganho funcional perceptível — associe sempre a um programa de treino de força para atingir diretamente os desfechos de função física.",
      evidencia: 3,
      link: "https://doi.org/10.1186/s12937-025-01279-2",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Nutrition Journal",
        ano: "2026 (publicado em 22 de janeiro de 2026)",
        desenho: "Análise secundária de dados de 3 ensaios clínicos randomizados",
        amostra: "191 idosos com sobrepeso ou obesidade em intervenções de perda de peso",
        doi: "10.1186/s12937-025-01279-2",
        acesso: "Acesso aberto (BioMed Central)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Recomenda-se maior ingestão de proteína durante a perda de peso em idosos para proteger a massa magra e, em tese, a função física. Mas faltavam dados combinando múltiplos ensaios para verificar se esse benefício de composição corporal realmente se traduz em melhor força e desempenho físico nessa população." },
        { h: "Como o estudo foi feito", p: "Os autores reanalisaram dados de 3 ensaios clínicos randomizados (Muscle Preservation Study, PROBE study e WelPrex study), totalizando 191 idosos com sobrepeso ou obesidade (idade média de 65,1 anos, IMC médio de 32,9 kg/m²) em intervenções de perda de peso. A ingestão de proteína observada variou entre aproximadamente 0,87 e 1,06 g/kg/dia entre os estudos. Os desfechos avaliados incluíram massa magra apendicular, força de preensão manual, velocidade de marcha e a Short Physical Performance Battery (SPPB)." },
        { h: "O que foi encontrado", p: "Maior ingestão de proteína associou-se a maior preservação de massa magra apendicular durante a perda de peso. No entanto, essa associação não se repetiu para os desfechos funcionais avaliados: força de preensão manual, velocidade de marcha e SPPB não diferiram significativamente conforme a ingestão de proteína." },
        { h: "O que isso não responde", p: "Por se tratar de uma análise secundária, com ingestão de proteína não necessariamente randomizada dentro de cada estudo original, a relação encontrada é associativa, não causal. Os autores dos estudos originais não foram desenhados especificamente para testar essa questão, o que limita a força da conclusão e reforça a necessidade de ensaios dedicados a esse objetivo." },
        { h: "Na prática do consultório", p: "Ao planejar dietas hipocalóricas para idosos, continue priorizando ingestão de proteína na faixa superior das recomendações para proteger a massa magra, mas não assuma que isso, isoladamente, melhorará força ou função física — combine sempre com treino de força e reavalie a função física como desfecho separado, não como consequência automática da preservação de massa magra." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "cafeina-dose-resposta-desempenho-aerobico-meta-analise",
      categoria: "Esportiva",
      areas: ["Esportiva", "Suplementação"],
      data: "19 jun 2026",
      title: "Meta-análise dose-resposta: doses baixas de cafeína (1,3-3 mg/kg) já melhoram o desempenho aeróbico em provas contrarrelógio, sem necessidade de doses mais altas",
      resumo: "Revisão sistemática com meta-análise dose-resposta sobre o efeito da cafeína oral no desempenho em exercício aeróbico encontrou que doses baixas, entre 1,3 e 3 mg/kg, já podem melhorar o desempenho em provas contrarrelógio ao reduzir o tempo de conclusão, sem necessidade das doses mais altas (frequentemente de 3 a 6 mg/kg) comumente recomendadas na literatura esportiva.",
      mudou: "Desafia a suposição comum de que doses mais altas de cafeína são necessárias para obter benefício ergogênico — sugere que um benefício comparável pode ser alcançado com doses notavelmente mais baixas e, potencialmente, mais bem toleradas.",
      aplicar: "Para atletas de endurance sensíveis a doses mais altas de cafeína (ansiedade, desconforto gastrointestinal, prejuízo do sono), considere começar com doses mais baixas (em torno de 1,3 a 3 mg/kg) como estratégia potencialmente suficiente para benefício de desempenho, individualizando conforme tolerância e uso habitual de cafeína pelo atleta.",
      evidencia: 5,
      link: "https://doi.org/10.3390/nu18121989",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Nutrients",
        ano: "2026 (publicado em 19 de junho de 2026)",
        desenho: "Revisão sistemática com meta-análise dose-resposta",
        amostra: "Ensaios clínicos sobre cafeína oral e desempenho em exercício aeróbico",
        doi: "10.3390/nu18121989",
        acesso: "Acesso aberto (MDPI)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A cafeína é um dos suplementos ergogênicos mais estudados no esporte, mas a dose ideal para desempenho aeróbico ainda é debatida, com recomendações tradicionais apontando para doses de moderadas a altas (3 a 6 mg/kg). Os autores quiseram mapear, de forma sistemática, a relação dose-resposta entre cafeína oral e desempenho em exercício aeróbico." },
        { h: "Como o estudo foi feito", p: "Os autores conduziram uma revisão sistemática com meta-análise dose-resposta de ensaios clínicos que testaram diferentes doses de cafeína oral sobre o desempenho em exercício aeróbico, com foco especial em provas contrarrelógio (time-trial), nas quais o desfecho é o tempo necessário para completar uma distância ou carga de trabalho definida." },
        { h: "O que foi encontrado", p: "Doses baixas de cafeína, entre 1,3 e 3 mg/kg, já se associaram a melhora no desempenho em provas contrarrelógio, reduzindo o tempo de conclusão em comparação com placebo. O benefício não dependeu de doses mais altas, frequentemente recomendadas na prática esportiva." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham se o efeito varia conforme o uso habitual de cafeína pelo atleta (usuários crônicos tendem a responder diferente de não usuários), nem se os resultados se generalizam igualmente para todas as modalidades de exercício aeróbico ou apenas para provas contrarrelógio especificamente." },
        { h: "Na prática do consultório", p: "Ao orientar atletas de endurance sobre suplementação de cafeína, considere que doses mais baixas (1,3 a 3 mg/kg) podem já ser suficientes para benefício de desempenho — uma informação útil especialmente para atletas que relatam efeitos colaterais com doses mais altas, como ansiedade, desconforto gastrointestinal ou prejuízo do sono antes de competições." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mindfulness-alimentacao-obesidade-ansiedade-ecr-brasil",
      categoria: "Comportamental",
      areas: ["Comportamental", "Obesidade"],
      data: "15 jul 2026",
      title: "ECR brasileiro (Porto Alegre): programa online de alimentação consciente para pacientes com obesidade e ansiedade não muda o controle inibitório alimentar, mas traz ganhos psicológicos",
      resumo: "Ensaio clínico randomizado de viabilidade (estudo OMETA), conduzido no Hospital de Clínicas de Porto Alegre, randomizou 52 adultos com obesidade e transtorno de ansiedade generalizada para um programa online de alimentação consciente ('mindful eating') ou um grupo controle que assistiu a vídeos sobre qualidade de vida: não houve melhora clara no controle inibitório alimentar, medido por uma tarefa comportamental objetiva (Go/No-Go com estímulos alimentares), mas houve melhora em diversos desfechos psicológicos secundários autorrelatados.",
      mudou: "Relativiza a ideia de que programas de alimentação consciente mudam diretamente o controle inibitório alimentar medido de forma objetiva — neste ensaio, o benefício pareceu se concentrar mais no bem-estar psicológico autorrelatado do que em uma tarefa comportamental objetiva de impulsividade alimentar.",
      aplicar: "Programas de alimentação consciente podem ser oferecidos como ferramenta complementar para bem-estar psicológico em pacientes com obesidade e ansiedade, mas não se deve esperar, com base neste ensaio, uma mudança mensurável no comportamento alimentar impulsivo isoladamente — combine com outras estratégias comportamentais voltadas diretamente ao comportamento alimentar.",
      evidencia: 4,
      link: "https://doi.org/10.1016/j.lana.2026.101541",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Lancet Regional Health – Americas",
        ano: "2026 (publicado em 15 de julho de 2026, volume 59, artigo 101541)",
        desenho: "Ensaio clínico randomizado de viabilidade (estudo OMETA, NCT06087185)",
        amostra: "52 adultos com obesidade e transtorno de ansiedade generalizada, Hospital de Clínicas de Porto Alegre (Brasil)",
        doi: "10.1016/j.lana.2026.101541",
        acesso: "Acesso aberto (Lancet Regional Health)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Programas de alimentação consciente ('mindful eating') são frequentemente propostos para pacientes com obesidade, com a expectativa de reduzir a alimentação impulsiva ligada a estados emocionais como ansiedade. Faltavam, porém, ensaios que testassem esse efeito usando uma medida comportamental objetiva de controle inibitório alimentar, e não apenas questionários autorrelatados." },
        { h: "Como o estudo foi feito", p: "O ensaio de viabilidade OMETA, conduzido no Hospital de Clínicas de Porto Alegre, randomizou 52 adultos com obesidade e transtorno de ansiedade generalizada para um programa online de alimentação consciente ou um grupo controle que assistiu a vídeos educativos sobre qualidade de vida. O controle inibitório alimentar foi medido por uma tarefa comportamental do tipo Go/No-Go com estímulos de comida, além de desfechos psicológicos secundários autorrelatados." },
        { h: "O que foi encontrado", p: "Não houve melhora clara no desempenho da tarefa Go/No-Go (controle inibitório alimentar objetivo) no grupo que recebeu o programa de alimentação consciente, em comparação com o grupo controle. Por outro lado, houve melhora em diversos desfechos psicológicos secundários autorrelatados entre os participantes do programa." },
        { h: "O que isso não responde", p: "Por ser um ensaio de viabilidade com amostra pequena (52 participantes), o estudo não tem poder estatístico para descartar com segurança um efeito real, porém modesto, sobre o controle inibitório alimentar. Também não fica claro, pelos resumos disponíveis, quais desfechos psicológicos específicos melhoraram nem por quanto tempo esse ganho se sustentou após o fim do programa." },
        { h: "Na prática do consultório", p: "Ao considerar programas de alimentação consciente para pacientes com obesidade e ansiedade, posicione-os como uma ferramenta de apoio ao bem-estar psicológico, não como uma intervenção comprovadamente capaz de mudar, por si só, o comportamento alimentar impulsivo — combine com abordagens comportamentais dirigidas especificamente à relação do paciente com a comida." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dieta-mediterranea-microbiota-diabetes-tipo-2-meta-analise",
      categoria: "Microbiota",
      areas: ["Microbiota", "Clínica"],
      data: "03 nov 2025",
      title: "Meta-análise de 9 ECRs: dieta mediterrânea melhora HbA1c, LDL e triglicerídeos no diabetes tipo 2, mas o efeito sobre a microbiota intestinal ainda não pôde ser quantificado",
      resumo: "Revisão sistemática com meta-análise de 9 ensaios clínicos randomizados (1.337 adultos) comparou intervenções baseadas na dieta mediterrânea a dietas controle em pessoas com diabetes tipo 2: a dieta mediterrânea reduziu HbA1c (diferença média de -0,18), LDL (diferença média de -0,10) e triglicerídeos (diferença média de -0,20) em relação ao controle, sem efeito significativo sobre glicemia de jejum, insulina, HOMA-IR, colesterol total ou HDL; os dados de microbiota intestinal não puderam ser combinados quantitativamente por falta de padronização entre os estudos, mas a síntese narrativa relatou aumento da diversidade alfa e maior presença de táxons como Akkermansia muciniphila e Roseburia spp.",
      mudou: "Confirma, com evidência combinada mais robusta, o benefício metabólico da dieta mediterrânea no diabetes tipo 2 (lipídios e controle glicêmico via HbA1c), mas evidencia que o elo com a microbiota intestinal, apesar de biologicamente plausível e relatado de forma qualitativamente favorável, ainda carece de evidência quantitativa padronizada — uma lacuna metodológica, não um resultado negativo.",
      aplicar: "Continue recomendando o padrão mediterrâneo com confiança para pacientes com diabetes tipo 2 quanto aos benefícios sobre lipídios e HbA1c, mas evite apresentar aos pacientes mecanismos específicos mediados pela microbiota como fato já estabelecido — trate as mudanças na microbiota como uma via plausível e ainda em estudo, não como explicação comprovada do benefício metabólico.",
      evidencia: 5,
      link: "https://doi.org/10.1016/j.numecd.2025.104433",
      fonte: {
        autores: "Lauria F, Formisano A, Dello Russo M, Quaglia C, Giacco R, Russo GL, Spagnuolo C e Vitale M",
        revista: "Nutrition, Metabolism and Cardiovascular Diseases",
        ano: "2026 (publicado on-line em 3 de novembro de 2025; edição impressa de maio de 2026, volume 36(5), artigo 104433)",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "9 ECRs, 1.337 adultos com diabetes tipo 2",
        doi: "10.1016/j.numecd.2025.104433",
        acesso: "Verificar acesso ao texto completo no site da revista (Elsevier); PMID 41381307"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A dieta mediterrânea já é associada a benefícios metabólicos no diabetes tipo 2, e estudos menores sugerem que parte desse efeito poderia ser mediada por mudanças na microbiota intestinal. Os autores reuniram os ensaios randomizados disponíveis para quantificar, de forma mais robusta, tanto os efeitos metabólicos quanto os efeitos sobre a microbiota." },
        { h: "Como o estudo foi feito", p: "Os autores buscaram em cinco bases de dados (PubMed, Embase, Web of Science, Cochrane CENTRAL e Scopus) até outubro de 2024, selecionando ensaios clínicos randomizados que comparassem dietas baseadas no padrão mediterrâneo a dietas controle em adultos com diabetes tipo 2. Nove ensaios, totalizando 1.337 participantes, atenderam aos critérios de inclusão para a meta-análise quantitativa dos desfechos metabólicos." },
        { h: "O que foi encontrado", p: "Em comparação com o controle, a dieta mediterrânea reduziu significativamente HbA1c (diferença média de -0,18), LDL (diferença média de -0,10) e triglicerídeos (diferença média de -0,20). Não houve efeito significativo sobre glicemia de jejum, insulina, HOMA-IR, colesterol total ou HDL. Para a microbiota, a heterogeneidade nos métodos e desfechos relatados impediu uma meta-análise quantitativa; a síntese narrativa apontou aumento da diversidade alfa e maior abundância de táxons associados à saúde metabólica, como Akkermansia muciniphila e Roseburia spp." },
        { h: "O que isso não responde", p: "Os próprios autores afirmam que esta meta-análise não fornece evidência definitiva de que a dieta mediterrânea melhora todos os fatores de risco metabólico do diabetes tipo 2, especialmente no que diz respeito à composição da microbiota — a falta de padronização entre os estudos impede conclusões quantitativas sobre esse elo específico. Eles pedem ensaios mais longos, abordagens individualizadas e investigação mecanística com dados multi-ômicos." },
        { h: "Na prática do consultório", p: "Ao recomendar o padrão mediterrâneo para pacientes com diabetes tipo 2, apoie-se com confiança nos benefícios bem documentados sobre HbA1c, LDL e triglicerídeos — mas, ao explicar o 'porquê' do benefício ao paciente, evite afirmar que ele ocorre 'através da microbiota' como fato estabelecido; apresente essa via como biologicamente plausível e ainda em investigação." }
      ]
    }
  ]
};

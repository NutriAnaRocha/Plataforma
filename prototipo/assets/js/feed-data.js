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
    title: "9 estudos reais que mexem na sua conduta",
    texto: "Uma rede de meta-análise mostra que cada protocolo de jejum intermitente ajuda de um jeito diferente na esteatose hepática (MASLD), uma revisão com 38 estudos reforça quais dietas realmente ajudam na SOP/PMOS, uma meta-análise mais ampla que a do vôlei encontra efeito pequeno da cafeína em atletas mulheres de esportes coletivos, o programa Mind-Eat supera a educação em alimentação intuitiva no comer emocional (sem diferença de peso), a maior meta-análise sobre o tema derruba a promessa de que probióticos aumentam a diversidade da microbiota em gente saudável, uma rede de meta-análise sobre sarcopenia lista suplementos proteicos promissores mas pede cautela com o ranqueamento, um ensaio brasileiro (NutrirCom) não vence a dieta isolada em peso mas reduz mais a ansiedade, apps de mHealth melhoram a autoeficácia materna em amamentação sem ainda provar ganho em exclusividade ou duração, e a maior síntese sobre educação nutricional em diálise confirma ganho de conhecimento e qualidade de vida, com queda modesta de fósforo e potássio. Cada card abre a leitura completa com o link do estudo original."
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
      id: "jejum-intermitente-esteatose-hepatica-rede",
      categoria: "Clínica",
      areas: ["Clínica", "Funcional"],
      data: "24 jun 2026",
      title: "Rede de meta-análise compara protocolos de jejum intermitente na esteatose hepática (MASLD) e mostra que cada um ajuda de um jeito diferente",
      resumo: "Revisão sistemática com meta-análise em rede (frequentista) de ensaios clínicos randomizados comparou alimentação com restrição de horário (TRE), jejum em dias alternados (ADF) e o protocolo 5:2 em adultos com esteatose hepática associada à disfunção metabólica (MASLD): a TRE liderou na redução da gordura no fígado, o ADF liderou em perda de peso e foi o único a melhorar a resistência à insulina, e nenhum protocolo melhorou a rigidez hepática.",
      mudou: "Em vez de tratar 'jejum intermitente' como uma estratégia única, esta rede de meta-análise mostra perfis de efeito diferentes entre os protocolos na MASLD — a TRE parece melhor para gordura no fígado, o ADF para peso e resistência à insulina — e nenhum deles, isoladamente, mudou a rigidez/fibrose hepática.",
      aplicar: "Ao indicar jejum intermitente para um paciente com MASLD, escolha o protocolo pelo desfecho prioritário: TRE quando o foco é reduzir esteatose, ADF quando o foco é perda de peso e resistência à insulina — e deixe claro que a evidência ainda não mostra melhora da rigidez hepática só com dieta, então o acompanhamento com hepatologia continua necessário.",
      evidencia: 5,
      link: "https://doi.org/10.1016/j.clnesp.2026.103415",
      fonte: {
        autores: "Abu Suilik e cols.",
        revista: "Clinical Nutrition ESPEN",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede (frequentista) de ensaios clínicos randomizados",
        amostra: "Ensaios clínicos randomizados comparando protocolos de jejum intermitente (TRE, ADF, 5:2) em adultos com MASLD",
        doi: "10.1016/j.clnesp.2026.103415",
        pubmed: "42342126",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "O jejum intermitente é cada vez mais indicado para pacientes com MASLD, mas 'jejum intermitente' engloba protocolos bem diferentes — alimentação com restrição de horário (TRE), jejum em dias alternados (ADF) e o protocolo 5:2. Faltava uma comparação direta entre eles para saber qual traz mais benefício para o fígado e para o metabolismo."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise em rede (frequentista) reuniu ensaios clínicos randomizados que testaram TRE, ADF, 5:2 ou dieta padrão/controle em adultos com MASLD, avaliando desfechos hepáticos (esteatose por elastografia/CAP, enzimas ALT e AST, rigidez hepática), antropométricos (peso, cintura, gordura corporal) e metabólicos (resistência à insulina pelo HOMA-IR)."
        },
        {
          h: "O que foi encontrado",
          p: "A TRE foi o protocolo mais eficaz para reduzir a esteatose hepática (diferença média de -23,32 dB/m no CAP), seguida pelo 5:2. O ADF trouxe as maiores reduções de peso, cintura e gordura corporal, e foi o único protocolo com melhora significativa da resistência à insulina. Tanto o 5:2 quanto a TRE reduziram significativamente ALT e AST. Nenhum protocolo melhorou de forma significativa a rigidez hepática."
        },
        {
          h: "O que isso não responde",
          p: "Como é uma meta-análise em rede, a robustez de cada comparação depende do número de ensaios diretos disponíveis para aquele par de protocolos, ainda limitado para MASLD. O seguimento dos estudos tende a ser curto, o que não permite saber se essas diferenças entre TRE, ADF e 5:2 se mantêm a longo prazo, nem se a ausência de efeito sobre rigidez hepática se confirma com mais tempo de tratamento."
        },
        {
          h: "Na prática do consultório",
          p: "Ao indicar jejum intermitente para MASLD, escolha o protocolo pelo desfecho prioritário do paciente: TRE para reduzir gordura no fígado, ADF para perda de peso e melhora da resistência à insulina. Em qualquer protocolo, deixe claro que a evidência atual não mostra melhora da rigidez/fibrose hepática só com jejum intermitente — o acompanhamento com hepatologia continua sendo necessário."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "revisao-nutricao-pcos-pmos-2026",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Fertilidade", "Funcional"],
      data: "29 jun 2026",
      title: "Revisão sistemática com 38 estudos mapeia quais dietas realmente melhoram parâmetros metabólicos e hormonais na SOP/PMOS",
      resumo: "Revisão sistemática (protocolo registrado no PROSPERO) reuniu 38 estudos, publicados entre 2015 e 2025, sobre dietas com restrição calórica, baixo índice/carga glicêmica, cetogênica, jejum intermitente e outros padrões em mulheres com síndrome dos ovários policísticos (SOP/PMOS): de forma consistente, dietas de baixo índice glicêmico, ricas em fibra e ômega-3, o padrão mediterrâneo e abordagens anti-inflamatórias apareceram associadas a melhora de sensibilidade à insulina e equilíbrio hormonal.",
      mudou: "Em vez de recomendar 'dieta saudável' de forma genérica para SOP/PMOS, esta revisão reforça que o tipo de dieta importa: baixo índice glicêmico, fibra, ômega-3 e padrão mediterrâneo aparecem repetidamente associados a melhora de insulina e hormônios entre os 38 estudos incluídos.",
      aplicar: "Priorize, na prescrição para SOP/PMOS, os padrões alimentares com mais respaldo nesta revisão — baixo índice/carga glicêmica, fibra e ômega-3 adequados, padrão mediterrâneo — individualizando conforme preferência e adesão da paciente, já que a revisão reúne estudos heterogêneos sem apontar uma dieta única superior a todas as outras.",
      evidencia: 5,
      link: "https://doi.org/10.1007/s00394-026-04030-7",
      fonte: {
        autores: "Akbaş e cols.",
        revista: "European Journal of Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática (protocolo registrado no PROSPERO, seguindo PRISMA), sem meta-análise formal de efeito agrupado",
        amostra: "38 estudos sobre intervenções dietéticas em mulheres com SOP/PMOS, publicados entre fev/2015 e fev/2025",
        doi: "10.1007/s00394-026-04030-7",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Diversas dietas já foram testadas isoladamente em mulheres com SOP/PMOS — restrição calórica, baixo índice glicêmico, cetogênica, jejum intermitente, entre outras — mas faltava reunir essa evidência dispersa numa única revisão para orientar qual abordagem dietética tem mais respaldo para melhorar parâmetros metabólicos, hormonais e inflamatórios."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com protocolo registrado no PROSPERO e busca em oito bases (incluindo PubMed, Cochrane Library e Web of Science) por estudos publicados entre fevereiro de 2015 e fevereiro de 2025 sobre intervenções dietéticas em mulheres com SOP/PMOS, avaliando parâmetros antropométricos, metabólicos, hormonais, inflamatórios e de estresse oxidativo. Foram incluídos 38 estudos."
        },
        {
          h: "O que foi encontrado",
          p: "De forma consistente entre os estudos, dietas de baixo índice/carga glicêmica, ricas em fibra e ômega-3, o padrão mediterrâneo e abordagens anti-inflamatórias e antioxidantes melhoraram sensibilidade à insulina e equilíbrio hormonal; a dieta cetogênica e o jejum intermitente também apareceram entre as estratégias com resultado favorável em parte dos estudos."
        },
        {
          h: "O que isso não responde",
          p: "É uma revisão sistemática qualitativa (sem meta-análise de efeito agrupado), reunindo estudos com desenhos, durações e populações heterogêneos — isso impede afirmar 'qual dieta é a melhor' de forma definitiva, e a síntese apresentada não aprofunda desfechos reprodutivos (ovulação, taxas de gravidez)."
        },
        {
          h: "Na prática do consultório",
          p: "Use esta revisão para priorizar, na prescrição para SOP/PMOS, padrões alimentares com respaldo mais consistente — baixo índice/carga glicêmica, fibra e ômega-3 adequados, padrão mediterrâneo — individualizando pela preferência e adesão da paciente, já que a evidência não aponta uma dieta única superior a todas as outras para essa população."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "cafeina-atletas-mulheres-esportes-coletivos",
      categoria: "Esportiva",
      areas: ["Esportiva"],
      data: "24 jul 2026",
      title: "Meta-análise de três níveis com 26 estudos confirma efeito pequeno, porém real, da cafeína no desempenho de atletas mulheres de esportes coletivos",
      resumo: "Meta-análise de três níveis reunindo 26 ensaios clínicos randomizados, crossover e controlados por placebo, encontrou efeito geral pequeno da cafeína aguda sobre desempenho físico, esportivo específico, fisiológico, perceptivo e cognitivo em atletas mulheres de esportes coletivos (g de Hedges = 0,24; IC95% 0,13-0,35), mais consistente para desempenho físico e redução da percepção de esforço; para habilidades técnicas específicas e desfechos cognitivos, a evidência ainda é incerta.",
      mudou: "Ao contrário do achado recente específico para vôlei (sem efeito ergogênico claro), esta meta-análise mais ampla — que reúne atletas de vários esportes coletivos — encontra um efeito pequeno, porém estatisticamente significativo, da cafeína sobre desempenho físico e percepção de esforço, ainda que a evidência para habilidades técnicas e cognição permaneça incerta.",
      aplicar: "Para atletas mulheres de esportes coletivos em geral, a cafeína aguda pode trazer ganho pequeno em desempenho físico e sensação de esforço mais leve — mas não presuma o mesmo para habilidades técnicas específicas do esporte ou desempenho cognitivo, onde a evidência ainda é escassa, e avalie sempre a resposta individual antes de padronizar a estratégia para o time.",
      evidencia: 5,
      link: "https://doi.org/10.3390/nu18152429",
      fonte: {
        autores: "Li e cols.",
        revista: "Nutrients",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de três níveis de ensaios clínicos randomizados, crossover, cegos e controlados por placebo",
        amostra: "26 estudos (ensaios randomizados crossover), atletas mulheres de esportes coletivos",
        doi: "10.3390/nu18152429",
        pubmed: "42588052",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "A maior parte da evidência sobre cafeína e desempenho esportivo vem de homens ou de esportes específicos isolados. Esta meta-análise reuniu estudos com atletas mulheres de esportes coletivos em geral para quantificar o efeito agudo da cafeína sobre desempenho físico, habilidades técnicas específicas do esporte, respostas fisiológicas, percepção de esforço e desempenho cognitivo, além de investigar possíveis moderadores do efeito."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise de três níveis, usando modelo de efeitos correlacionados e hierárquicos com estimativa de variância robusta por cluster, reuniu 26 ensaios clínicos randomizados, crossover, cegos e controlados por placebo com cafeína aguda em atletas mulheres de esportes coletivos. Os tamanhos de efeito foram sintetizados separadamente por domínio (físico, técnico-esportivo, fisiológico, perceptivo, cognitivo)."
        },
        {
          h: "O que foi encontrado",
          p: "Quando todos os domínios disponíveis foram agrupados, a cafeína aguda teve efeito geral pequeno (g de Hedges = 0,24; IC95% 0,13-0,35). O efeito foi mais consistente para desempenho físico e para redução da percepção de esforço. Para habilidades técnicas específicas do esporte e desempenho cognitivo, a evidência permaneceu incerta, por haver poucos estudos disponíveis em cada domínio."
        },
        {
          h: "O que isso não responde",
          p: "Por agregar esportes coletivos diferentes, o resultado geral pode mascarar variações entre modalidades específicas — como já mostrou, por exemplo, a meta-análise focada só em vôlei, que não encontrou efeito ergogênico. A escassez de estudos por domínio (sobretudo técnico e cognitivo) limita conclusões mais específicas sobre em que tarefa a cafeína realmente ajuda essas atletas."
        },
        {
          h: "Na prática do consultório",
          p: "Para atletas mulheres de esportes coletivos em geral, é razoável testar a cafeína aguda esperando um ganho pequeno em desempenho físico e uma sensação de esforço mais leve — mas sem prometer o mesmo para habilidades técnicas específicas do esporte ou desempenho cognitivo, e sempre avaliando resposta individual e efeitos colaterais antes de padronizar a estratégia para o time."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mind-eat-programa-comer-emocional-obesidade",
      categoria: "Comportamental",
      areas: ["Comportamental", "Estética"],
      data: "21 mai 2026",
      title: "Programa Mind-Eat reduz mais o comer emocional e externo do que um programa já validado de alimentação intuitiva",
      resumo: "Ensaio clínico randomizado unicêntrico comparou o Mind-Eat, programa estruturado baseado em mindfulness, com um programa de educação terapêutica orientado por alimentação intuitiva (tratamento padrão) em 66 adultos com sobrepeso ou obesidade: o Mind-Eat levou a reduções maiores no comer emocional e externo, com melhora de comer consciente e intuitivo, mas sem diferença de peso corporal no curto prazo entre os grupos.",
      mudou: "Mostra que um programa de mindfulness estruturado pode superar um programa já validado de alimentação intuitiva em desfechos comportamentais específicos (comer emocional e externo) — mesmo sem se traduzir, ainda, em diferença de peso corporal no curto prazo.",
      aplicar: "Considere o Mind-Eat (ou princípios equivalentes de mindfulness estruturado) como opção complementar ao trabalho de alimentação intuitiva já feito com pacientes com sobrepeso/obesidade e comer emocional/externo proeminente, mas calibre a expectativa: o ganho observado foi comportamental, não de perda de peso a curto prazo.",
      evidencia: 4,
      link: "https://doi.org/10.1186/s12966-026-01931-y",
      fonte: {
        autores: "Van Beekum e cols.",
        revista: "International Journal of Behavioral Nutrition and Physical Activity",
        ano: "2026",
        desenho: "Ensaio clínico randomizado unicêntrico (1:1)",
        amostra: "66 adultos com sobrepeso ou obesidade randomizados (46 analisados por intenção de tratar modificada)",
        doi: "10.1186/s12966-026-01931-y",
        pubmed: "42163359",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Programas de alimentação intuitiva já são usados como tratamento comportamental de referência para adultos com sobrepeso/obesidade. Este ensaio testou se um programa estruturado baseado em mindfulness (Mind-Eat) traz benefício adicional frente a um programa de educação terapêutica já validado, orientado por princípios de alimentação intuitiva."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio clínico randomizado unicêntrico (1:1) incluiu 66 adultos com sobrepeso ou obesidade; 56 completaram a avaliação inicial e 46 tiveram avaliação basal e ao menos uma avaliação pós-intervenção, entrando na análise por intenção de tratar modificada. Um grupo recebeu o programa Mind-Eat e o outro, um programa de educação terapêutica orientado por alimentação intuitiva (tratamento padrão do serviço)."
        },
        {
          h: "O que foi encontrado",
          p: "Frente ao programa de alimentação intuitiva, o Mind-Eat levou a reduções maiores no comer emocional e no comer externo, além de melhora de comer consciente (mindful eating) e de comer intuitivo. Não houve diferença significativa de peso corporal entre os grupos no curto prazo."
        },
        {
          h: "O que isso não responde",
          p: "A amostra final é pequena (46 participantes analisados) e de centro único, o que limita a generalização. Por ser um desfecho de curto prazo, o estudo não mostra se as mudanças comportamentais observadas se sustentam ao longo do tempo nem se, com mais tempo, elas se traduzem em diferença de peso frente ao programa de alimentação intuitiva."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes com sobrepeso/obesidade e comer emocional ou externo proeminente, considere incorporar elementos de mindfulness estruturado (como os do Mind-Eat) ao trabalho já feito com alimentação intuitiva — mas calibre a expectativa: o ganho demonstrado aqui foi comportamental, não uma perda de peso maior no curto prazo."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-diversidade-microbiota-populacoes-saudaveis",
      categoria: "Microbiota",
      areas: ["Clínica", "Funcional"],
      data: "07 jan 2026",
      title: "Maior meta-análise sobre o tema encontra que probióticos não aumentam a diversidade da microbiota intestinal em pessoas saudáveis",
      resumo: "Revisão sistemática com meta-análise identificou 47 estudos elegíveis, dos quais 22 (1.068 participantes) entraram na meta-análise de diversidade da microbiota intestinal em populações saudáveis: a suplementação de probióticos não produziu alteração estatisticamente significativa nos índices de diversidade microbiana nessa população.",
      mudou: "Contraria uma suposição comum de marketing e de prática clínica — a de que tomar probióticos 'aumenta a diversidade' da microbiota intestinal — pelo menos em pessoas saudáveis, sem disbiose ou doença de base já estabelecida.",
      aplicar: "Não use 'aumento da diversidade da microbiota' como justificativa para indicar probióticos a um paciente saudável sem outra indicação clínica específica; reserve essa expectativa para populações com disbiose documentada, onde a resposta pode ser diferente.",
      evidencia: 5,
      link: "https://doi.org/10.1186/s12916-025-04602-0",
      fonte: {
        autores: "Éliás e cols.",
        revista: "BMC Medicine",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "47 estudos elegíveis; 22 estudos (1.068 participantes) na meta-análise de diversidade da microbiota, populações saudáveis",
        doi: "10.1186/s12916-025-04602-0",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Um dos argumentos mais usados para indicar probióticos é que eles 'aumentam a diversidade' da microbiota intestinal — um marcador geralmente associado a mais resiliência e saúde. Esta revisão testou se essa promessa se sustenta especificamente em pessoas saudáveis, sem uma condição de base que já altere a microbiota."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise buscou em MEDLINE, Embase e Cochrane ensaios clínicos randomizados testando suplementação de probióticos versus placebo/controle em populações saudáveis, com desfecho de diversidade da microbiota intestinal (índices como Shannon e Simpson). Foram identificados 47 estudos elegíveis, dos quais 22 (1.068 participantes) tinham dados suficientes para a meta-análise de diversidade."
        },
        {
          h: "O que foi encontrado",
          p: "A meta-análise não encontrou alteração estatisticamente significativa nos índices de diversidade da microbiota intestinal com a suplementação de probióticos em populações saudáveis, comparada a placebo/controle."
        },
        {
          h: "O que isso não responde",
          p: "O resultado é específico para diversidade da microbiota em pessoas saudáveis — não avalia se os probióticos trazem benefício clínico por outras vias (função de barreira, metabólitos, sintomas digestivos) nem se o efeito é diferente em populações com disbiose já estabelecida, uso de antibióticos ou doenças gastrointestinais, onde outras revisões mostram respostas distintas."
        },
        {
          h: "Na prática do consultório",
          p: "Não use 'aumento da diversidade da microbiota' como justificativa para indicar probióticos a um paciente saudável sem outra indicação clínica específica — segundo esta meta-análise, esse efeito não se confirma nessa população. Reserve essa expectativa para contextos em que a disbiose já está documentada, onde a resposta pode ser diferente."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "suplementacao-proteica-exercicio-sarcopenia-rede",
      categoria: "Suplementação",
      areas: ["Clínica", "Funcional"],
      data: "12 ago 2026",
      title: "Rede de meta-análise compara tipos de suplementação proteica combinada a exercício na sarcopenia, mas pede cautela com o ranqueamento",
      resumo: "Revisão sistemática com meta-análise em rede reuniu 18 ensaios clínicos randomizados (1.341 participantes) comparando estratégias de suplementação proteica ou relacionada à proteína (whey, leucina, HMB, aminoácidos essenciais com vitamina D, entre outras) combinadas a treino resistido ou funcional em idosos com sarcopenia ou alto risco: HMB, proteína enriquecida com whey/leucina e whey/aminoácidos essenciais com vitamina D associaram-se a ganho significativo de força de preensão frente ao controle, mas os próprios autores classificam o ranqueamento como exploratório, dada a rede de evidência esparsa e a certeza muito baixa.",
      mudou: "Reforça que combinar suplementação proteica com exercício resistido/funcional ajuda a força de preensão na sarcopenia — mas a tentativa de apontar 'qual suplemento é melhor' esbarra em evidência ainda frágil, então qualquer ranqueamento entre HMB, whey/leucina ou combinações com vitamina D deve ser visto com cautela.",
      aplicar: "Para pacientes idosos com sarcopenia ou alto risco, mantenha a combinação de suplementação proteica (whey, leucina ou HMB, conforme tolerância e custo) com treino resistido ou funcional como base da conduta — mas não prometa que um tipo específico de suplemento é comprovadamente superior aos demais, já que a certeza da evidência aqui é muito baixa.",
      evidencia: 5,
      link: "https://doi.org/10.3389/fnut.2026.1892302",
      fonte: {
        autores: "Yang e cols.",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede (network meta-analysis) de ensaios clínicos randomizados",
        amostra: "18 ECRs, 1.341 participantes idosos com sarcopenia ou alto risco de sarcopenia",
        doi: "10.3389/fnut.2026.1892302",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Proteína e compostos relacionados (whey, leucina, HMB, aminoácidos essenciais, às vezes combinados a vitamina D) são recomendados junto ao treino resistido para sarcopenia, mas faltava comparar diretamente essas diferentes estratégias de suplementação entre si para saber se alguma se destaca."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise em rede reuniu 18 ensaios clínicos randomizados (1.341 participantes) que testaram diferentes suplementações proteicas ou relacionadas à proteína, combinadas a treino resistido ou funcional, em idosos com sarcopenia ou alto risco. Os desfechos avaliados foram força de preensão manual, índice de massa muscular apendicular (ASMI) e desempenho no teste timed up-and-go (TUG), com ranqueamento das estratégias pelo método SUCRA."
        },
        {
          h: "O que foi encontrado",
          p: "Frente ao controle, estratégias baseadas em HMB, proteína enriquecida com whey/leucina e a combinação de whey/aminoácidos essenciais com vitamina D associaram-se a ganho estatisticamente significativo de força de preensão manual. Os próprios autores destacam que a rede de evidência é esparsa e a certeza é muito baixa, e que o ranqueamento SUCRA deve ser lido como exploratório, não como hierarquia definitiva entre as estratégias."
        },
        {
          h: "O que isso não responde",
          p: "Com apenas 18 ensaios divididos entre várias estratégias de suplementação, o número de comparações diretas por par de intervenções é pequeno, o que fragiliza as estimativas da rede. A certeza da evidência foi classificada como muito baixa, então o estudo não permite afirmar com segurança qual suplementação é superior às demais — apenas que combinar proteína/composto relacionado ao treino tende a ajudar mais do que treino isolado."
        },
        {
          h: "Na prática do consultório",
          p: "Para idosos com sarcopenia ou alto risco, mantenha a combinação de suplementação proteica (whey, leucina ou HMB, conforme tolerância, preferência e custo) com treino resistido ou funcional como base da conduta — mas não prometa que um tipo específico de suplemento é comprovadamente superior aos demais, já que a certeza da evidência para esse ranqueamento ainda é muito baixa."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "nutrircom-abordagem-multicomponente-obesidade",
      categoria: "Obesidade",
      areas: ["Clínica", "Comportamental"],
      data: "27 jan 2026",
      title: "Ensaio brasileiro testa abordagem multicomponente (NutrirCom) em mulheres com obesidade: sem diferença extra no peso, mas queda maior de ansiedade",
      resumo: "Ensaio clínico randomizado de três braços, com 89 mulheres com obesidade da atenção primária em Viçosa (MG), comparou dieta hipocalórica personalizada isolada com duas versões do NutrirCom — abordagem multicomponente que integra estratégias nutricionais, psicoemocionais, comportamentais e sociais: todos os grupos reduziram cintura, glicemia de jejum e gordura corporal e ganharam massa magra, sem diferença significativa entre eles nesses desfechos após ajuste; a ansiedade caiu significativamente apenas nos grupos NutrirCom, não no grupo de dieta isolada.",
      mudou: "Mostra que uma abordagem multicomponente com foco psicoemocional pode não superar a dieta hipocalórica isolada em peso e metabolismo no curto prazo, mas traz um benefício comportamental que a dieta isolada não trouxe: redução da ansiedade.",
      aplicar: "Ao tratar mulheres com obesidade, considere incorporar estratégias psicoemocionais e comportamentais (como as do NutrirCom) ao acompanhamento nutricional não pela promessa de emagrecimento adicional, e sim pelo potencial de melhorar bem-estar emocional — um desfecho que, segundo este ensaio, a dieta isolada não entrega.",
      evidencia: 4,
      link: "https://doi.org/10.3390/nu18030414",
      fonte: {
        autores: "Araújo Gonçalves e cols.",
        revista: "Nutrients",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, paralelo, aberto, de três braços",
        amostra: "89 mulheres com obesidade, atenção primária em Viçosa (MG), Brasil",
        doi: "10.3390/nu18030414",
        pubmed: "41683238",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Estratégias multicomponentes que somam apoio nutricional, psicoemocional, comportamental e social vêm sendo propostas como alternativa mais humanizada à dieta hipocalórica tradicional para obesidade. Este ensaio testou se o NutrirCom — protocolo brasileiro com essas quatro dimensões — supera a dieta hipocalórica personalizada isolada em desfechos antropométricos, metabólicos e psicoemocionais."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio clínico randomizado, paralelo e aberto, de três braços, incluiu 89 mulheres com obesidade da atenção primária em Viçosa (MG): um grupo recebeu dieta hipocalórica personalizada (déficit de 500 a 1000 kcal/dia); outro recebeu 10 sessões individuais baseadas no NutrirCom; o terceiro combinou as sessões individuais do NutrirCom com encontros mensais em grupo para suporte social, ao longo de 6 meses."
        },
        {
          h: "O que foi encontrado",
          p: "Após ajuste, não houve diferença significativa entre os três grupos nos desfechos antropométricos e metabólicos — todos reduziram circunferência da cintura, glicemia de jejum e gordura corporal total, e ganharam massa magra. A ansiedade permaneceu inalterada no grupo de dieta isolada, mas caiu significativamente nos dois grupos que receberam o NutrirCom."
        },
        {
          h: "O que isso não responde",
          p: "A amostra é pequena (89 mulheres, de um único município) e o estudo é aberto (sem cegamento), o que pode influenciar desfechos autorrelatados como ansiedade. Não fica claro se a diferença na ansiedade se sustenta além dos 6 meses de seguimento, nem se o mesmo padrão se repete em outras populações e contextos de atenção primária."
        },
        {
          h: "Na prática do consultório",
          p: "Ao propor uma abordagem multicomponente como o NutrirCom para mulheres com obesidade, não a venda pela promessa de emagrecimento adicional frente à dieta hipocalórica tradicional — neste estudo, o ganho extra apareceu no bem-estar emocional (queda da ansiedade), não no peso ou nos marcadores metabólicos, o que já é um argumento válido para incluir a dimensão psicoemocional no acompanhamento."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mhealth-aplicativos-amamentacao-meta-analise",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Pediatria"],
      data: "17 ago 2026",
      title: "Revisão global com 13 ECRs mostra que aplicativos de mHealth aumentam a autoeficácia em amamentação, mas o efeito sobre exclusividade e duração ainda é incerto",
      resumo: "Revisão sistemática global com meta-análise de 13 ensaios clínicos randomizados (3.269 gestantes e puérperas, 38,5% em países de baixa e média renda) avaliou aplicativos de mHealth — geralmente combinados a mensagens de texto ou telelactação — para promover amamentação: houve aumento da autoeficácia em amamentação (g de Hedges = 1,08; IC95% 0,07-2,1), mas com heterogeneidade muito alta entre os estudos, e evidência mais fraca para início, exclusividade e duração da amamentação.",
      mudou: "Reforça que apps de amamentação funcionam melhor para fortalecer confiança e conhecimento materno do que para mudar diretamente taxas de amamentação exclusiva ou sua duração — um resultado mais modesto do que o marketing desses aplicativos costuma sugerir.",
      aplicar: "Recomende aplicativos de apoio à amamentação como ferramenta para reforçar autoeficácia e conhecimento da mãe, associados a suporte humano (mensagens personalizadas, telelactação) — mas não prometa, só com base no app, aumento de amamentação exclusiva ou maior duração, pois a evidência para esses desfechos ainda é fraca e heterogênea.",
      evidencia: 5,
      link: "https://doi.org/10.1111/mcn.70230",
      fonte: {
        autores: "Yau e cols.",
        revista: "Maternal & Child Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática global com meta-análise de ensaios clínicos randomizados",
        amostra: "13 ECRs, 3.269 gestantes/puérperas (38,5% em países de baixa e média renda)",
        doi: "10.1111/mcn.70230",
        pubmed: "42607106",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Aplicativos de saúde móvel (mHealth) para apoiar a amamentação se popularizaram nos últimos anos, mas faltava uma síntese global e atualizada sobre o que, de fato, eles conseguem melhorar: conhecimento e confiança da mãe, ou desfechos mais concretos como início, exclusividade e duração da amamentação."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática global com meta-análise identificou, entre 3.102 registros triados, 13 ensaios clínicos randomizados (3.269 gestantes e puérperas, 38,5% delas em países de baixa e média renda) testando aplicativos de mHealth — geralmente combinados a mensagens de texto ou telelactação — com duração de 6 semanas a 12 meses. Os desfechos incluíram amamentação exclusiva até 6 meses e em outros momentos, duração total da amamentação e autoeficácia materna."
        },
        {
          h: "O que foi encontrado",
          p: "A meta-análise mostrou aumento da autoeficácia em amamentação com os aplicativos (g de Hedges = 1,08; IC95% 0,07-2,1; p=0,04), mas com heterogeneidade muito alta entre os estudos (I²=90,7%). A síntese qualitativa apontou benefício mais consistente para autoeficácia, conhecimento e confiança materna, e evidência mais fraca para início, exclusividade e duração da amamentação. Intervenções com suporte interativo ou personalizado tiveram os melhores resultados gerais."
        },
        {
          h: "O que isso não responde",
          p: "A heterogeneidade muito alta entre os 13 estudos (populações, tipos de app, contextos socioculturais diferentes) limita a confiança no tamanho exato do efeito sobre autoeficácia, e a evidência para desfechos mais 'duros' — exclusividade e duração da amamentação — ainda não é forte o suficiente para afirmar que o app, isoladamente, muda esses resultados. Fatores maternos, socioculturais e estruturais também afetam o engajamento com o aplicativo."
        },
        {
          h: "Na prática do consultório",
          p: "Recomende aplicativos de apoio à amamentação como ferramenta complementar para fortalecer confiança e conhecimento da mãe — de preferência os que oferecem suporte interativo ou personalizado (mensagens, telelactação) — mas não prometa, só com base no app, aumento de amamentação exclusiva ou maior duração: para esses desfechos, mantenha o acompanhamento humano como parte central do plano."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "educacao-nutricional-dialise-desfechos",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "22 abr 2026",
      title: "Maior revisão já feita sobre educação nutricional em diálise confirma ganho de conhecimento e qualidade de vida, com redução modesta de fósforo e potássio",
      resumo: "Revisão sistemática com meta-análise de 44 estudos (4.106 participantes, combinando ensaios randomizados e não randomizados) avaliou intervenções de educação nutricional em pacientes em diálise: houve melhora consistente do conhecimento e da qualidade de vida relacionada à saúde, com redução modesta de fósforo e potássio séricos frente aos grupos controle.",
      mudou: "É a maior síntese já publicada sobre educação nutricional em diálise — reforça que orientar sistematicamente o paciente (não só prescrever a dieta) traz ganho mensurável de conhecimento e qualidade de vida, além de um efeito modesto sobre marcadores bioquímicos.",
      aplicar: "Estruture a educação nutricional em diálise como intervenção formal e repetida (não uma conversa única), já que o ganho mais consistente foi em conhecimento e qualidade de vida — trate a redução de fósforo e potássio como benefício adicional possível, não como resultado garantido.",
      evidencia: 4,
      link: "https://doi.org/10.1080/07853890.2026.2660389",
      fonte: {
        autores: "Sarmadi e cols.",
        revista: "Annals of Medicine",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de estudos randomizados e não randomizados (certeza avaliada pelo GRADE)",
        amostra: "44 estudos (randomizados e não randomizados), 4.106 participantes adultos em diálise",
        doi: "10.1080/07853890.2026.2660389",
        pubmed: "42015790",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "Pacientes em diálise recebem, com frequência, uma lista de restrições alimentares sem muito investimento em explicar o porquê. Esta é a maior síntese já publicada sobre o efeito de programas estruturados de educação nutricional — e não apenas prescrição de dieta — nos desfechos desses pacientes."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise buscou em sete bases (incluindo MEDLINE, Embase e CENTRAL) até abril de 2026 por estudos randomizados e não randomizados que avaliassem intervenções de educação nutricional em adultos em diálise, totalizando 44 estudos e 4.106 participantes. Risco de viés foi avaliado por RoB-2 (randomizados) e ROBINS-I (não randomizados), com certeza da evidência graduada pelo GRADE e meta-análises de efeitos aleatórios."
        },
        {
          h: "O que foi encontrado",
          p: "A educação nutricional melhorou de forma consistente o conhecimento dos pacientes sobre a própria dieta e a qualidade de vida relacionada à saúde, além de reduzir modestamente os níveis séricos de fósforo e potássio frente aos grupos controle."
        },
        {
          h: "O que isso não responde",
          p: "A revisão mistura estudos randomizados e não randomizados, o que reduz a certeza geral da evidência mesmo com o uso do GRADE; a intensidade, o formato e a duração dos programas de educação variaram muito entre os 44 estudos, o que dificulta apontar 'qual formato funciona melhor'. Também não fica claro se o efeito sobre fósforo e potássio se mantém a longo prazo."
        },
        {
          h: "Na prática do consultório",
          p: "Estruture a educação nutricional em diálise como uma intervenção formal e repetida — não uma orientação única no início do tratamento — já que o ganho mais consistente mostrado aqui foi em conhecimento e qualidade de vida; trate a redução de fósforo e potássio como um benefício adicional possível, não como resultado garantido só com educação."
        }
      ]
    }
  ]
};

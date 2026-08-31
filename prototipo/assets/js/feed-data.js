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
    title: "9 estudos reais que chegam à sua conduta",
    texto: "Telessaúde nutricional em doença cardiovascular, vitamina D na TPM, o ranking de proteína/creatina/ômega-3 para atletas, o programa Mind-Eat contra a alimentação emocional, probióticos que não mudam o TDAH, o que 19 meta-análises dizem sobre multivitamínico, a massa magra que ainda cai sob GLP-1, orientação remota de amamentação e o que a dieta realmente muda na função renal do paciente obeso sem DRC. Cada card abre a leitura completa com o link do estudo original."
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
      id: "nutricao-remota-cardiovascular",
      categoria: "Clínica",
      areas: ["Clínica", "Funcional"],
      data: "13 ago 2026",
      title: "Nutrição por telessaúde em doença cardiovascular: o que a revisão sistemática mostra",
      resumo: "Revisão sistemática reúne os ensaios clínicos randomizados sobre intervenções nutricionais remotas — com ou sem componente de atividade física — em adultos com doença cardiovascular, olhando qualidade da dieta, marcadores bioquímicos e desfechos clínicos.",
      mudou: "Reforça a telessaúde nutricional como via viável de reabilitação cardiovascular de longo prazo, mas os próprios autores dizem que a literatura ainda não permite conclusões definitivas sobre o tamanho do efeito.",
      aplicar: "Considere o acompanhamento nutricional remoto para pacientes cardiopatas com barreira de acesso — geográfica ou de vulnerabilidade social —, mas calibre a expectativa: a evidência ainda é heterogênea demais para prometer resultado específico.",
      evidencia: 3,
      link: "https://doi.org/10.3390/healthcare14162523",
      fonte: {
        autores: "Equipe do Laboratório de Nutrição Clínica e Dietética e do Laboratório de Fisiologia do Exercício Clínico, Universidade de Thessaly (Grécia)",
        revista: "Healthcare (MDPI)",
        ano: "2026",
        desenho: "Revisão sistemática de ensaios clínicos randomizados (sem meta-análise agrupada)",
        amostra: "Ensaios em adultos com doença cardiovascular; número exato de estudos incluídos não especificado nos resumos indexados disponíveis nesta curadoria",
        doi: "10.3390/healthcare14162523",
        pubmed: "",
        acesso: "Acesso aberto (MDPI)"
      },
      leitura: [
        {
          h: "Por que esta revisão existe",
          p: "A reabilitação cardiovascular de longo prazo depende de mudança sustentada de hábito alimentar, mas grande parte dos pacientes tem acesso limitado a acompanhamento presencial contínuo — por distância, mobilidade reduzida ou vulnerabilidade social. A telessaúde nutricional vem sendo testada como alternativa, e esta revisão reúne o que os ensaios clínicos randomizados publicados até agora mostram sobre o tema, isolando o componente nutricional do componente de atividade física quando possível."
        },
        {
          h: "Como o estudo foi feito",
          p: "É uma revisão sistemática de ensaios clínicos randomizados — não uma meta-análise com efeito combinado. Os autores buscaram estudos que testassem intervenção nutricional remota, com ou sem atividade física associada, em adultos com doença cardiovascular, olhando desfechos como biomarcadores bioquímicos, índices cardiovasculares, parâmetros antropométricos, capacidade de exercício, adesão à dieta mediterrânea, qualidade de vida, reinternação e óbito."
        },
        {
          h: "O que os autores encontraram",
          p: "As intervenções nutricionais remotas — por telefone, aplicativo, videochamada ou mensagem — associaram-se a melhora significativa na qualidade da dieta e a mudanças favoráveis nos níveis de atividade física dos participantes. Os autores descrevem a telessaúde como abordagem promissora e viável para o manejo de longo prazo de doenças cardiovasculares crônicas, sobretudo por ampliar o acesso ao cuidado em regiões remotas ou para pacientes com vulnerabilidade social."
        },
        {
          h: "O limite que os próprios autores apontam",
          p: "Por ser síntese qualitativa e não meta-análise, a revisão não estima o tamanho do efeito nem separa com precisão o que vem da nutrição e o que vem da atividade física quando os dois estão combinados. Os autores são explícitos: a literatura atual ainda não permite conclusões definitivas, e são necessários ensaios maiores, com protocolos padronizados, desfechos consistentes e seguimento mais longo."
        },
        {
          h: "Na prática do consultório",
          p: "Use a telessaúde como ferramenta real de ampliação de acesso — especialmente para paciente cardiopata que mora longe, tem mobilidade reduzida ou já abandonou acompanhamento presencial —, mas não venda como equivalente comprovado à consulta presencial. Estruture a modalidade remota com a mesma disciplina de metas e reavaliação que usaria presencialmente, e priorize os desfechos que a revisão aponta como respondendo melhor: qualidade global da dieta e nível de atividade física, não apenas peso."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "vitamina-d-tpm",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Funcional"],
      data: "22 jun 2026",
      title: "Vitamina D na TPM: meta-análise recente sugere alívio, mas o campo ainda é inconsistente",
      resumo: "Meta-análise de 5 ECRs (436 mulheres) sugere que a vitamina D pode reduzir a gravidade global dos sintomas da TPM, principalmente físicos e depressivos, frente a placebo ou cuidado padrão.",
      mudou: "Soma-se a um campo historicamente inconsistente: nem todo ensaio sobre vitamina D e TPM mostra benefício, e esta meta-análise não resolve a controvérsia — apenas aponta um sinal a favor, com poucos estudos.",
      aplicar: "Dosar 25(OH)D em paciente com TPM significativa e tratar deficiência confirmada é conduta já sustentada por outros motivos; trate a suplementação como possível adjuvante nos sintomas de TPM, não como conduta central comprovada.",
      evidencia: 3,
      link: "https://doi.org/10.3390/jcm15124828",
      fonte: {
        autores: "Zainab A. e cols.",
        revista: "Journal of Clinical Medicine (MDPI)",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "5 ECRs, 436 participantes",
        doi: "10.3390/jcm15124828",
        pubmed: "",
        acesso: "Acesso aberto (MDPI)"
      },
      leitura: [
        {
          h: "O problema que a meta-análise ataca",
          p: "A síndrome pré-menstrual afeta significativamente a qualidade de vida de muitas mulheres, e os tratamentos farmacológicos padrão esbarram em efeitos adversos ou contraindicações. A vitamina D é candidata a adjuvante há anos, mas os ensaios clínicos publicados até aqui deram resultados inconsistentes — alguns mostrando melhora clara, outros nenhuma diferença frente a placebo. Esta meta-análise tenta juntar o que existe de ECR e checar se há sinal consistente."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em PubMed, Web of Science, Scopus, Google Scholar e CENTRAL até janeiro de 2026, incluindo apenas ensaios clínicos randomizados que comparassem vitamina D a controle passivo (placebo ou cuidado padrão) em mulheres com TPM. O desfecho primário foi a variação no escore total de gravidade da TPM; desfechos secundários incluíram depressão, ansiedade, sintomas físicos, desejo por comida (craving) e retenção hídrica."
        },
        {
          h: "O que foi encontrado",
          p: "Cinco ensaios, 436 participantes. A vitamina D associou-se a redução da gravidade total dos sintomas de TPM em comparação ao controle passivo, com sinal mais consistente para sintomas físicos e depressivos. A suplementação foi bem tolerada, sem eventos adversos relevantes relatados nos estudos incluídos."
        },
        {
          h: "Por que isso não fecha a questão",
          p: "Cinco estudos é uma base pequena, e a própria literatura sobre vitamina D e TPM que motivou esta revisão é descrita como inconsistente — ensaios anteriores, fora desta meta-análise, não encontraram benefício sobre placebo. Isso não invalida o achado, mas pede cautela: é sinal preliminar, não confirmação robusta, e mais ensaios amplos e bem controlados são necessários antes de tratar isso como conduta estabelecida."
        },
        {
          h: "Na prática do consultório",
          p: "Se a paciente com TPM tem deficiência de vitamina D documentada, corrigir a deficiência já se justifica por motivos ósseos e metabólicos independentemente do efeito sobre TPM — e o possível ganho nos sintomas é bônus, não a razão principal da prescrição. Para paciente com TPM significativa e vitamina D normal, apresente a suplementação como opção de baixo risco e evidência ainda preliminar, sem prometer alívio garantido, e mantenha o manejo padrão (estilo de vida, sono, atividade física, e encaminhamento quando os sintomas forem incapacitantes) como base do cuidado."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "proteina-creatina-omega3-atletas",
      categoria: "Esportiva",
      areas: ["Esportiva"],
      data: "13 mar 2026",
      title: "Proteína, creatina ou ômega-3: qual suplemento serve para qual objetivo do atleta",
      resumo: "Meta-análise em rede com 35 ECRs e 1.211 atletas treinados compara os três suplementos mais usados no esporte e ranqueia qual se destaca em força, resistência e recuperação.",
      mudou: "Acaba com a lógica de 'suplemento único para tudo': cada um tem o desfecho onde realmente se destaca, e combinar as indicações com o objetivo do atleta rende mais do que escolher um suplemento genérico.",
      aplicar: "Priorize creatina quando o objetivo for força máxima, proteína quando for desempenho de resistência, e ômega-3 quando o foco for recuperação — e comunique isso com clareza ao atleta que pergunta 'qual suplemento eu tomo'.",
      evidencia: 4,
      link: "https://doi.org/10.3390/nu18060909",
      fonte: {
        autores: "Wang Z., Qin G., Kim B.-M.",
        revista: "Nutrients (MDPI)",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede de ensaios clínicos randomizados",
        amostra: "35 ECRs, 1.211 participantes em treinamento estruturado há pelo menos 6 meses",
        doi: "10.3390/nu18060909",
        pubmed: "41901084",
        acesso: "Acesso aberto (MDPI)"
      },
      leitura: [
        {
          h: "Por que comparar os três",
          p: "Proteína, creatina e ômega-3 são os suplementos mais estudados e mais usados no esporte, mas raramente são comparados diretamente entre si — a maior parte da literatura testa cada um isoladamente contra placebo. Esta é uma meta-análise em rede, desenho que permite comparar indiretamente intervenções que nunca foram testadas lado a lado, usando placebo como ponte estatística."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em MEDLINE, Embase, Cochrane CENTRAL, Web of Science, SPORTDiscus e Scopus por ensaios clínicos randomizados que testassem suplementação de proteína, creatina ou ômega-3 em pessoas com pelo menos 6 meses de treinamento estruturado. Os desfechos avaliados foram força muscular, desempenho de resistência e recuperação pós-exercício. O ranqueamento entre suplementos foi calculado por SUCRA (probabilidade de ser a melhor opção para aquele desfecho)."
        },
        {
          h: "O que cada suplemento entregou melhor",
          p: "A creatina teve o melhor desempenho para força muscular (diferença média padronizada de 0,46; IC 95% 0,29–0,63; SUCRA 82,4%). A proteína se destacou para desempenho de resistência. O ômega-3 se destacou para desfechos de recuperação pós-exercício. Ou seja: os três suplementos são úteis, mas cada um tem o terreno onde a evidência é mais forte — e não são intercambiáveis."
        },
        {
          h: "O que isso não resolve",
          p: "Meta-análise em rede é comparação indireta, mais frágil que ensaios cabeça a cabeça — os autores não substituem a necessidade de mais estudos comparando os três suplementos dentro do mesmo desenho. A amostra (35 ECRs, 1.211 participantes) também mistura diferentes modalidades esportivas e protocolos de dose, o que limita a precisão da recomendação individual."
        },
        {
          h: "Na prática do consultório",
          p: "Use o objetivo do atleta para guiar a escolha, não o modismo do momento: força e potência pedem creatina (3–5 g/dia); resistência aeróbia se beneficia mais de proteína bem distribuída ao longo do dia; recuperação entre sessões intensas é onde o ômega-3 mostra o sinal mais forte. Nada impede combinar os três quando o objetivo do atleta cobre mais de uma dessas frentes — a meta-análise não testou a combinação, mas também não há motivo fisiológico para achar que eles competem entre si."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mind-eat-programa",
      categoria: "Comportamental",
      areas: ["Comportamental", "Estética"],
      data: "21 mai 2026",
      title: "Programa Mind-Eat supera educação em alimentação intuitiva no comer consciente — mas não no peso",
      resumo: "ECR unicêntrico com 46 adultos com sobrepeso/obesidade: o programa Mind-Eat (mindfulness estruturado) superou a educação em alimentação intuitiva no comer consciente e na alimentação emocional/externa, sem diferença em peso corporal.",
      mudou: "Reforça que 'melhorar a relação com a comida' e 'perder peso' são desfechos diferentes — um programa pode ganhar no primeiro sem ganhar no segundo, e isso não é fracasso da intervenção.",
      aplicar: "Ofereça o Mind-Eat (ou programa equivalente de mindfulness estruturado) quando o objetivo da paciente for reduzir alimentação emocional e externa, mas não prometa perda de peso como consequência automática — trate como desfechos separados na meta terapêutica.",
      evidencia: 3,
      link: "https://doi.org/10.1186/s12966-026-01931-y",
      fonte: {
        autores: "Van Beekum M. e cols.",
        revista: "International Journal of Behavioral Nutrition and Physical Activity (IJBNPA)",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, unicêntrico",
        amostra: "66 adultos randomizados; 56 com avaliação basal; 46 na análise por intenção de tratar modificada",
        doi: "10.1186/s12966-026-01931-y",
        pubmed: "42163359",
        acesso: "Acesso aberto"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Programas de educação em alimentação intuitiva são o tratamento usual em muitos serviços para sobrepeso e obesidade, mas intervenções estruturadas de mindfulness (como o programa Mind-Eat) vêm sendo propostas como alternativa mais intensiva. Este ensaio comparou os dois diretamente, cabeça a cabeça, em vez de comparar mindfulness contra lista de espera — o que é uma escolha metodológica mais exigente."
        },
        {
          h: "Como o estudo foi feito",
          p: "Sessenta e seis adultos com sobrepeso ou obesidade foram randomizados 1:1 entre o programa Mind-Eat — oito sessões experienciais semanais mais uma sessão de seguimento — e o programa padrão do serviço, de educação terapêutica baseada em alimentação intuitiva. Cinquenta e seis completaram a avaliação basal, e 46 entraram na análise por intenção de tratar modificada. Os desfechos incluíram escores de comer consciente, alimentação intuitiva, alimentação emocional e externa, restrição cognitiva, mindfulness traço, bem-estar psicológico, atividade física e peso corporal."
        },
        {
          h: "O que apareceu de diferença",
          p: "Houve interação Grupo × Tempo significativa nos escores de comer consciente, favorecendo o grupo Mind-Eat, mantida tanto logo após a intervenção quanto no seguimento. O grupo Mind-Eat também teve ganhos maiores em alimentação intuitiva, redução de alimentação emocional e externa, e aumento de mindfulness traço. Não houve diferença significativa entre os grupos para restrição cognitiva, bem-estar psicológico, nível de atividade física ou peso corporal."
        },
        {
          h: "O que isso não mostra",
          p: "É um ensaio unicêntrico com amostra pequena (46 na análise final) — generalização para outros contextos e populações pede replicação. E o resultado mais importante para a prática clínica é justamente o que não mudou: nenhum dos dois programas alterou o peso corporal no período estudado, o que separa claramente 'melhora comportamental' de 'perda de peso' como desfechos distintos."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes com alimentação emocional e externa como queixa central — não peso isolado —, o Mind-Eat (ou estrutura equivalente de mindfulness com sessões seriadas e prática guiada) tem evidência real de ganho superior à educação padrão em alimentação intuitiva. Mas alinhe a expectativa: o dado não sustenta prometer perda de peso como resultado da intervenção comportamental. Se a meta da paciente inclui peso, trate como objetivo paralelo, com estratégia nutricional própria, não como consequência automática do trabalho comportamental."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-tdah",
      categoria: "Microbiota",
      areas: ["Pediatria", "Comportamental"],
      data: "17 jul 2026",
      title: "Probióticos no TDAH: meta-análise não encontra benefício nos sintomas-núcleo",
      resumo: "Meta-análise de 9 ECRs (482 crianças e adolescentes) não encontra benefício claro do probiótico sobre os sintomas centrais do TDAH, embora haja sinal exploratório para desfechos emocionais-comportamentais mais amplos.",
      mudou: "Esfria a narrativa do eixo intestino-cérebro como solução para TDAH: a evidência direta de ECR, ainda que limitada, não sustenta prescrever probiótico com a expectativa de melhorar atenção ou hiperatividade.",
      aplicar: "Não ofereça probiótico como intervenção para os sintomas centrais do TDAH; se a família já usa por outro motivo (ex.: sintomas gastrointestinais), não há problema em manter, mas não venda como tratamento do quadro comportamental principal.",
      evidencia: 4,
      link: "https://doi.org/10.3390/nu18142357",
      fonte: {
        autores: "Yan Y. e cols.",
        revista: "Nutrients (MDPI)",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "9 ECRs, 482 crianças e adolescentes com diagnóstico de TDAH (critérios DSM)",
        doi: "10.3390/nu18142357",
        pubmed: "42514426",
        acesso: "Acesso aberto (MDPI)"
      },
      leitura: [
        {
          h: "Por que essa pergunta importa",
          p: "A hipótese de que a disbiose intestinal contribui para o TDAH, via eixo intestino-cérebro, ganhou popularidade nos últimos anos, e probióticos passaram a ser oferecidos como adjuvante — inclusive fora de prescrição médica. Esta meta-análise reúne os ensaios clínicos randomizados existentes para checar se essa promessa se sustenta em evidência direta, e não apenas em plausibilidade biológica."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em PubMed, Embase, Cochrane CENTRAL, Web of Science, PsycINFO e EBSCO, da criação das bases até outubro de 2025, incluindo ECRs em crianças e adolescentes (menores de 18 anos) com TDAH diagnosticado por critérios DSM. As intervenções duraram de 8 a 12 semanas. Os autores avaliaram tanto desfechos diretamente ligados ao TDAH quanto desfechos emocionais-comportamentais mais amplos, relatados pelos pais."
        },
        {
          h: "O que foi encontrado",
          p: "Nove ensaios, 482 participantes. Na síntese exploratória de desfechos relacionados ao TDAH, a suplementação probiótica não mostrou benefício claro (diferença média padronizada de −0,25; IC 95% −0,57 a 0,07; p = 0,131) — ou seja, a evidência atual de ECRs de curta duração não sustenta efeito sobre os sintomas centrais do TDAH. Achados exploratórios sugerem potencial de melhora em desfechos emocionais-comportamentais mais amplos relatados pelos pais, mas esse sinal é preliminar."
        },
        {
          h: "Por que não fechar a porta de vez",
          p: "Nove ECRs é uma base pequena, com cepas, doses e durações heterogêneas, e o próprio desenho de 8 a 12 semanas pode ser curto demais para captar um efeito real, se ele existir. O sinal exploratório em desfechos emocionais-comportamentais mantém a linha de pesquisa aberta, mas ainda não é evidência suficiente para indicar probiótico com esse fim específico."
        },
        {
          h: "Na prática do consultório",
          p: "Para a família que chega perguntando se probiótico 'ajuda no TDAH', a resposta honesta hoje é que a evidência direta de ensaio clínico não mostra esse benefício nos sintomas centrais. Isso não significa desqualificar a saúde intestinal da criança por outros motivos legítimos — só significa não prometer melhora de atenção ou hiperatividade como resultado da suplementação. O tratamento com evidência estabelecida para TDAH continua sendo o manejo comportamental e, quando indicado, farmacológico, conduzido pela equipe responsável."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "multivitaminico-revisao",
      categoria: "Suplementação",
      areas: ["Clínica", "Funcional"],
      data: "25 nov 2025",
      title: "O que 19 meta-análises dizem (e não dizem) sobre multivitamínico",
      resumo: "Revisão rápida reúne 19 meta-análises sobre uso de multivitamínico/mineral, com mais de 5,5 milhões de participantes: há benefício em alguns desfechos específicos, nenhum em mortalidade geral.",
      mudou: "Desloca a pergunta de 'multivitamínico funciona?' para 'funciona para quê': o efeito aparece em cognição, infecção e pressão arterial nos ECRs, mas some quando o desfecho é mortalidade por todas as causas — recomendação ampla e genérica perde sustento.",
      aplicar: "Troque a indicação-padrão de multivitamínico 'para todo mundo' por indicação dirigida ao desfecho que a paciente de fato precisa (cognição, prevenção de infecção, controle pressórico), e não prometa efeito sobre longevidade ou mortalidade geral.",
      evidencia: 4,
      link: "https://doi.org/10.1016/j.arr.2025.102965",
      fonte: {
        autores: "Wang W., Wazny V.K., Mahadzir M.D.A., Maier A.B.",
        revista: "Ageing Research Reviews",
        ano: "2026",
        desenho: "Revisão rápida (rapid review) de meta-análises publicadas",
        amostra: "19 meta-análises elegíveis (2000–2025), mais de 5,5 milhões de participantes ao todo, incluindo mais de 333 mil gestações e cerca de 905 mil crianças expostas à suplementação materna",
        doi: "10.1016/j.arr.2025.102965",
        pubmed: "41308839",
        acesso: "Acesso aberto"
      },
      leitura: [
        {
          h: "Por que uma revisão de revisões",
          p: "Multivitamínico e mineral (MVM) é o suplemento mais usado no mundo, e a literatura sobre ele é gigantesca e fragmentada — meta-análises isoladas respondem perguntas isoladas, cada uma sobre um desfecho e uma população. Esta revisão rápida reúne 19 meta-análises publicadas entre 2000 e 2025 para dar um panorama do que, de fato, tem sustento consistente e do que não tem."
        },
        {
          h: "Como o estudo foi feito",
          p: "É uma 'rapid review' — revisão sistemática com metodologia acelerada, que reúne meta-análises já publicadas em vez de ensaios primários individuais. As 19 meta-análises incluídas somam mais de 5,5 milhões de participantes, cobrindo desde uso geral em adultos até suplementação materna na gestação (mais de 333 mil gestações) e seus efeitos em crianças expostas (quase 905 mil crianças)."
        },
        {
          h: "Onde há sinal de benefício",
          p: "Ensaios clínicos randomizados mostraram benefício de MVM em cognição/memória (sobretudo em idosos), redução de sintomas psicológicos e melhora de desfechos de infecção e de pressão arterial. Estudos observacionais sugeriram associação com menor risco de câncer e doença cardíaca, mas de forma inconsistente entre os estudos. Na gestação, a suplementação materna com MVM associou-se a redução de risco de câncer pediátrico em análises incluídas."
        },
        {
          h: "Onde o sinal desaparece — ou vira alerta",
          p: "Não houve efeito de MVM sobre mortalidade por todas as causas, sobre desfechos de covid-19 nem sobre acuidade visual. Em um dos desfechos avaliados, houve sinal de risco aumentado de progressão de degeneração macular relacionada à idade. Ou seja: a recomendação de multivitamínico 'para viver mais' ou 'para a visão' especificamente não encontra sustento nesta síntese — o benefício é pontual, não universal."
        },
        {
          h: "Na prática do consultório",
          p: "Abandone a prescrição genérica de MVM 'para prevenção' sem alvo definido. Use como ferramenta dirigida: idoso com queixa cognitiva, paciente com infecções de repetição, ou controle pressórico como parte do plano, são cenários com algum sustento em ECR. Gestante e MVM seguem tema à parte — a suplementação pré-natal tem indicação própria e não deve ser confundida com esta análise de uso geral. E não prometa longevidade ou proteção de mortalidade geral como justificativa da indicação — a evidência atual não sustenta essa promessa específica."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "glp1-massa-muscular",
      categoria: "Obesidade",
      areas: ["Clínica", "Funcional"],
      data: "19 jun 2026",
      title: "GLP-1 e massa muscular: o que a meta-análise mostra sobre o que se perde junto com o peso",
      resumo: "Meta-análise de 7 ECRs (821 pacientes) mostra que, sob GLP-1 em dose para obesidade, a massa magra passa a representar proporção maior do peso total — mas a quantidade absoluta de massa magra ainda cai.",
      mudou: "Confirma com dado agregado o que a prática já suspeitava: a perda de peso com GLP-1 é majoritariamente de gordura, mas não é só de gordura — ainda há perda real de massa magra em quilos, que pede estratégia de preservação muscular.",
      aplicar: "Estruture proteína adequada e treino de força desde o início do tratamento com GLP-1, não como reação tardia à perda de massa magra — a meta-análise reforça que a queda absoluta de massa magra é real, mesmo quando a composição relativa melhora.",
      evidencia: 4,
      link: "https://doi.org/10.1038/s41366-026-02118-y",
      fonte: {
        autores: "Laverde L.P., Muñoz-Velandia O.M., Alfonso D. e cols.",
        revista: "International Journal of Obesity (Nature)",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "7 ECRs, 821 pacientes com obesidade tratados com agonista do receptor de GLP-1 em dose de manejo de obesidade, vs. placebo",
        doi: "10.1038/s41366-026-02118-y",
        pubmed: "",
        acesso: "Não confirmado nesta curadoria (Nature Portfolio costuma ser por assinatura)"
      },
      leitura: [
        {
          h: "A pergunta por trás do estudo",
          p: "Agonistas do receptor de GLP-1 em dose para obesidade produzem perda de peso expressiva, e uma preocupação recorrente na prática é quanto dessa perda é gordura e quanto é músculo. Esta meta-análise reúne os ensaios clínicos randomizados que mediram composição corporal para responder isso com dado agregado, em vez de estudo isolado."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em PubMed, Embase e LILACS (literatura latino-americana e caribenha) até março de 2025, incluindo ensaios clínicos randomizados comparando agonistas de GLP-1 em dose de manejo de obesidade contra placebo, em adultos com obesidade. Foram incluídos 7 estudos, com 821 pacientes ao todo, avaliando desfechos de massa magra em termos absolutos e relativos."
        },
        {
          h: "O achado que parece contraditório — mas não é",
          p: "A massa magra como proporção do peso corporal total aumentou (+1,81 pontos percentuais; IC 95% 1,10–2,52; p < 0,00001) — porque a perda de peso é majoritariamente de gordura, então o que resta do corpo tem proporcionalmente mais músculo. Mas em termos absolutos, a massa magra caiu (−1,74 kg; IC 95% −3,04 a −0,45), e o percentual de massa magra também caiu (−3,06%; IC 95% −5,10 a −1,02). As duas coisas são verdadeiras ao mesmo tempo: a composição relativa melhora, mas o músculo perdido em quilos é real."
        },
        {
          h: "O que a meta-análise não resolve",
          p: "Sete estudos e 821 pacientes é uma base modesta para um tema com tanta variação de dose, duração de tratamento e composição corporal basal entre os participantes. A meta-análise também não testa se uma estratégia associada de proteína e treino de força muda esse resultado — ela descreve o que acontece sem intervenção nutricional estruturada, não avalia a mitigação."
        },
        {
          h: "Na prática do consultório",
          p: "Não deixe a melhora da proporção relativa de massa magra esconder a perda absoluta: o paciente ainda está perdendo massa muscular em quilos, e isso importa especialmente em paciente idoso, com massa magra já reduzida, ou em perda de peso rápida e intensa. Estruture ingestão proteica adequada e treino resistido como parte do protocolo desde a primeira consulta com o paciente em uso de GLP-1 — não espere sinais de sarcopenia para agir, porque a meta-análise mostra que a perda de massa magra acompanha o tratamento, não é exceção."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "amamentacao-remota",
      categoria: "Materno Infantil",
      areas: ["Materno Infantil", "Pediatria"],
      data: "01 mai 2026",
      title: "Orientação remota de amamentação: meta-análise reúne 30 ECRs e reforça o ganho, principalmente onde falta suporte presencial",
      resumo: "Meta-análise com 30 ensaios clínicos randomizados e 8.389 lactentes encontra melhora nas taxas de amamentação e no desenvolvimento físico neonatal com orientação remota — telefone, mensagem de texto ou aplicativo —, com efeito mais forte em regiões de menor acesso a suporte presencial.",
      mudou: "Consolida, com base ampla de ECRs, que orientação de amamentação a distância não é 'segunda opção' — é estratégia com evidência própria, particularmente valiosa onde o suporte presencial é escasso.",
      aplicar: "Ofereça e estruture canal remoto de suporte à amamentação (mensagem, telefone, aplicativo) como parte do acompanhamento pós-parto, principalmente para a paciente com barreira de acesso ao retorno presencial nas primeiras semanas.",
      evidencia: 4,
      link: "https://doi.org/10.3389/fpubh.2026.1696927",
      fonte: {
        autores: "Hu M., Sang S., Pei H., Han X., Wei Q., Wei L., Qi J., Li J.",
        revista: "Frontiers in Public Health",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "30 ECRs, 8.389 lactentes",
        doi: "10.3389/fpubh.2026.1696927",
        pubmed: "",
        acesso: "Acesso aberto (Frontiers)"
      },
      leitura: [
        {
          h: "O problema que a meta-análise ataca",
          p: "O suporte presencial à amamentação nas primeiras semanas pós-parto nem sempre está disponível — por distância, falta de profissional na região ou barreira de acesso da própria puérpera. Orientação remota (telefone, mensagem de texto, aplicativos) vem sendo testada como alternativa ou complemento, e esta meta-análise reúne o conjunto mais recente de ensaios clínicos randomizados sobre o tema."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em PubMed, Embase e Cochrane Library até novembro de 2024, incluindo ensaios clínicos randomizados que testassem orientação remota de amamentação — por telefone, SMS ou aplicativo — contra cuidado usual. Foram incluídos 30 estudos, somando 8.389 lactentes, avaliando taxas de amamentação e desfechos de saúde neonatal."
        },
        {
          h: "O que foi encontrado",
          p: "A orientação remota associou-se a melhora significativa nas taxas de amamentação e no desenvolvimento físico dos recém-nascidos, em comparação ao cuidado usual. O efeito foi mais forte em regiões menos desenvolvidas, com menor acesso a suporte presencial estruturado — sugerindo que a orientação remota funciona, em parte, preenchendo uma lacuna de acesso que já existia."
        },
        {
          h: "O que vale ponderar",
          p: "Uma meta-análise que reúne estudos de contextos tão diferentes — desde regiões com forte rede de suporte à amamentação até regiões com pouquíssimo acesso — tende a mostrar maior heterogeneidade entre os resultados individuais, o que pode diluir a precisão de uma estimativa única de efeito. O achado de que o benefício é maior onde o suporte presencial é mais escasso é coerente com isso: a orientação remota parece ganhar mais força exatamente onde substitui uma lacuna real, não onde compete com um suporte já robusto."
        },
        {
          h: "Na prática do consultório",
          p: "Estruture um canal remoto real de suporte à amamentação — não apenas 'me manda mensagem se tiver dúvida', mas um protocolo com contatos programados nas primeiras semanas, sobretudo para a puérpera que mora longe, tem dificuldade de deslocamento ou está fora do período coberto pelas consultas presenciais. Priorize esse investimento justamente nos casos de menor acesso a suporte presencial — é onde a evidência mostra o maior ganho."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dieta-funcao-renal-obesidade",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "29 jun 2026",
      title: "Dieta e função renal na obesidade sem DRC: meta-análise não encontra efeito médio sobre a TFG",
      resumo: "Meta-análise de 18 ECRs (1.438 participantes) em adultos obesos sem doença renal crônica não encontra efeito significativo geral de intervenções dietéticas sobre a taxa de filtração glomerular — mas o resultado muda conforme o método usado para medir a TFG.",
      mudou: "Reduz a expectativa de que qualquer intervenção dietética para emagrecimento 'protege o rim' de forma mensurável na função renal, pelo menos no curto prazo estudado — o efeito depende de como (e não apenas se) a função renal foi avaliada.",
      aplicar: "Não prometa melhora de função renal como benefício automático da dieta para emagrecimento em paciente obeso sem DRC; mantenha a indicação da dieta pelos benefícios metabólicos e de peso já estabelecidos, sem acrescentar a função renal como argumento extra sem base.",
      evidencia: 4,
      link: "https://doi.org/10.3389/fnut.2026.1836822",
      fonte: {
        autores: "Su W., Gou H., Yuan L., Luan Y., Wang Y., Song X., Xiong Y.",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "18 ECRs, 1.438 participantes adultos com obesidade, sem doença renal crônica",
        doi: "10.3389/fnut.2026.1836822",
        pubmed: "",
        acesso: "Acesso aberto (Frontiers)"
      },
      leitura: [
        {
          h: "Por que avaliar função renal em obeso sem DRC",
          p: "Obesidade é fator de risco reconhecido para o desenvolvimento futuro de doença renal, e é comum supor que qualquer intervenção dietética para emagrecimento também 'protege' a função renal, mesmo antes de haver dano estabelecido. Esta meta-análise testa essa suposição diretamente, olhando o efeito de intervenções dietéticas sobre a taxa de filtração glomerular (TFG) em adultos obesos que ainda não têm doença renal crônica."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em PubMed, Web of Science, Embase e Cochrane Library por ensaios clínicos randomizados que testassem intervenção dietética em adultos com obesidade, sem DRC, medindo função renal. Meta-análises de efeitos aleatórios calcularam a diferença média padronizada (SMD), com análise de subgrupo pelo método usado para avaliar a TFG — estimada (eGFR, por fórmula) ou medida diretamente (mGFR)."
        },
        {
          h: "O que foi encontrado",
          p: "No total, 18 ensaios e 1.438 participantes. A intervenção dietética não mostrou efeito significativo geral sobre a TFG (SMD = 0,06; IC 95% −0,20 a 0,32; p = 0,642). Mas a análise de subgrupo revelou diferença relevante conforme o método de avaliação: a TFG estimada (eGFR) aumentou significativamente com a dieta, enquanto a TFG medida diretamente (mGFR) teve redução não significativa — diferença entre os subgrupos estatisticamente relevante (p = 0,0005). Não houve efeito significativo sobre a taxa de excreção urinária de albumina."
        },
        {
          h: "Por que o método de medida muda a conclusão",
          p: "eGFR é calculada por fórmula a partir de creatinina e outras variáveis que mudam com a perda de peso (como massa muscular), o que pode inflar artificialmente a TFG estimada durante emagrecimento, sem refletir mudança real na filtração. mGFR mede diretamente, e é o padrão mais confiável — e foi essa medida que não mostrou melhora (com tendência a piora não significativa). Isso é um alerta prático: usar apenas eGFR para 'provar' benefício renal de uma dieta pode estar medindo o efeito da perda de massa muscular, não da função renal em si."
        },
        {
          h: "Na prática do consultório",
          p: "Continue indicando dieta para emagrecimento em paciente obeso pelos motivos já bem estabelecidos — metabólicos, cardiovasculares, funcionais —, mas não acrescente 'protege o rim' como argumento extra nesse público sem DRC: a evidência agregada não sustenta isso no curto prazo, e o sinal mais confiável (mGFR) nem aponta melhora. Se o objetivo for realmente monitorar função renal durante emagrecimento intenso, prefira ou combine com medida direta em vez de confiar isoladamente na TFG estimada por fórmula."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "cfn-resolucao",
      categoria: "CFN/CRN",
      areas: ["Clínica", "Esportiva", "Saúde da Mulher"],
      data: "2020",
      title: "O que a Resolução CFN nº 656/2020 permite você prescrever",
      resumo: "A norma que delimita a prescrição dietética de suplementos alimentares pelo nutricionista — o que entra, o que não entra e o que precisa ficar registrado.",
      mudou: "Define com clareza o alcance da prescrição e a documentação exigida no prontuário — é o texto que sustenta sua conduta em caso de questionamento.",
      aplicar: "Revise seus modelos de prescrição: via de administração, composição e dosagem precisam constar no registro do paciente e ficar arquivados.",
      evidencia: 5,
      link: "https://cfn.org.br/wp-content/uploads/resolucoes/Res_656_2020.html",
      fonte: {
        autores: "Conselho Federal de Nutricionistas",
        revista: "Resolução CFN nº 656, de 15 de junho de 2020",
        ano: "2020",
        desenho: "Norma do conselho profissional (não é estudo científico)",
        amostra: "—",
        doi: "",
        pubmed: "",
        acesso: "Texto integral livre no site do CFN"
      },
      leitura: [
        {
          h: "O que a resolução regula",
          p: "A Resolução CFN nº 656/2020 dispõe sobre a prescrição dietética de suplementos alimentares pelo nutricionista. Ela é a referência para saber o que está dentro do seu escopo — e é o documento a citar quando a conduta for questionada por outro profissional ou por fiscalização."
        },
        {
          h: "O que está no alcance da prescrição",
          p: "A prescrição dietética de suplementos pelo nutricionista abrange nutrientes, substâncias bioativas, enzimas, prebióticos e probióticos, produtos apícolas como mel, própolis, geleia real e pólen, novos alimentos e novos ingredientes, e outros autorizados pela Anvisa para comercialização — isolados ou combinados. Inclui também medicamentos isentos de prescrição à base de vitaminas e/ou minerais e/ou aminoácidos e/ou proteínas, isolados ou associados entre si."
        },
        {
          h: "A base regulatória",
          p: "A resolução se apoia em atos da Anvisa, entre eles a RDC nº 67/2007 (boas práticas de manipulação de preparações magistrais e oficinais), a RDC nº 24/2011 (registro de medicamentos específicos) e a RDC nº 98/2016 (critérios para classificação de medicamentos isentos de prescrição). Isso importa na prática: o que define se um item é prescritível não é o marketing do produto, é o enquadramento regulatório dele."
        },
        {
          h: "O que precisa ficar registrado",
          p: "O nutricionista deve registrar no prontuário do paciente a via de administração, a composição e a dosagem dos suplementos prescritos, mantendo esses registros arquivados. Não é formalidade: é o que comprova a conduta. Prescrição sem registro correspondente no prontuário é o ponto mais frequente de fragilidade em processos éticos."
        },
        {
          h: "Na prática do consultório",
          p: "Duas checagens rápidas antes de prescrever. Primeira: o produto tem enquadramento regulatório que o coloca dentro do escopo da 656/2020? Segunda: a prescrição que você vai entregar traz via, composição e dosagem, e existe cópia arquivada junto ao prontuário? Se você usa modelos prontos, revise-os uma vez contra esses dois itens — depois disso vira automático. Vale também acompanhar as atualizações e pareceres do seu CRN, porque normas complementares mudam com mais frequência que a resolução em si."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "gestao-precificacao",
      categoria: "Gestão",
      areas: ["Estética", "Funcional", "Clínica"],
      data: "Curadoria",
      title: "Pacotes de acompanhamento: como estruturar e precificar",
      resumo: "Conteúdo prático de gestão de consultório — como montar uma jornada com entregáveis claros no lugar da consulta avulsa.",
      mudou: "Não é estudo científico: é material de gestão produzido pela curadoria da plataforma.",
      aplicar: "Estruture pacotes com entregáveis explícitos (plano, retornos, suporte, materiais) e comunique a jornada, não a sessão.",
      evidencia: 0,
      link: "",
      fonte: null,
      leitura: [
        {
          h: "Antes de tudo: isto não é um estudo",
          p: "Este item não é um artigo científico indexado e não tem estudo original para consultar. É conteúdo prático de gestão, produzido pela curadoria da plataforma, marcado assim de propósito para você não confundir com as evidências clínicas do feed."
        },
        {
          h: "O problema da consulta avulsa",
          p: "Cobrar por sessão isolada coloca a nutricionista numa posição ruim em duas frentes: a receita fica imprevisível mês a mês, e a paciente decide a cada retorno se 'vale a pena voltar' — decisão que costuma perder para a agenda cheia dela. O acompanhamento nutricional produz resultado ao longo de meses, não em uma consulta; a forma de cobrança precisa acompanhar isso."
        },
        {
          h: "O que compõe um pacote",
          p: "Um pacote defensável tem escopo escrito: número de consultas e retornos no período, plano alimentar e revisões previstas, acesso ao portal e aos materiais, canal e janela de suporte entre consultas, e o que não está incluído. Sem essa última linha, todo pacote vira suporte ilimitado na prática. Formatos trimestrais funcionam bem porque cobrem um ciclo completo de adaptação e reavaliação."
        },
        {
          h: "Como chegar no preço",
          p: "Some o tempo real por paciente no período — consultas, preparo de plano, respostas entre consultas, ajustes — e multiplique pelo valor da sua hora. Some os custos fixos rateados (plataforma, sala, contabilidade, impostos). O resultado é o piso, não o preço. O preço final considera também posicionamento e o que a paciente compara. Se o pacote de três meses sair mais barato que três consultas avulsas, deixe a diferença explícita: é o incentivo à continuidade."
        },
        {
          h: "Como comunicar",
          p: "Venda a jornada, não a consulta. Descreva onde a paciente entra e onde ela chega ao fim do período, com os pontos de contato no meio. Na apresentação, mostre os entregáveis concretos — o plano, o portal, os retornos, os materiais — porque é isso que torna o valor visível. E deixe as condições por escrito: prazo, política de remarcação e de cancelamento. Contrato claro previne quase todo atrito futuro."
        }
      ]
    }
  ]
};

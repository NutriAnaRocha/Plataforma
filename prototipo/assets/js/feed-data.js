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
    texto: "Uma meta-análise de coortes com mais de 54 mil cardiopatas reforça a dieta mediterrânea como parte ativa da prevenção secundária cardiovascular, um ensaio randomizado mostra que alimentação com janela de 6 horas emagrece tanto quanto restrição calórica em mulheres com SOP (com ganho extra em androgênios), uma revisão sistemática confirma que creatina + beta-alanina ajudam no esforço de alta intensidade mas não somam benefício em força máxima, a maior meta-análise já feita sobre mindfulness e mindful eating mostra redução real da ingestão alimentar sem mudar a sensação de apetite, uma meta-análise em idosos encontra efeito positivo de probióticos/prebióticos/simbióticos na microbiota e na inflamação (diferente do que se vê em adultos saudáveis em geral), a primeira meta-análise focada em mulheres pós-menopausa confirma ganho pequeno de massa magra e força com creatina (≥5g/dia) associada a treino resistido, uma meta-análise sobre dietas plant-based em sobrepeso/obesidade encontra pouca diferença frente à dieta onívora (com certeza de evidência muito baixa), a maior síntese de ensaios sobre nutrição na gestação confirma redução de baixo peso ao nascer e prematuridade com aconselhamento personalizado, e uma meta-análise em diálise mostra que nenhuma intervenção dietética testada mudou o ângulo de fase. Cada card abre a leitura completa com o link do estudo original.",
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
      id: "dieta-mediterranea-prevencao-secundaria-cardiovascular-coorte",
      categoria: "Clínica",
      areas: ["Clínica", "Funcional"],
      data: "27 jul 2026",
      title: "Meta-análise de coortes com mais de 54 mil pacientes reforça a dieta mediterrânea na prevenção secundária cardiovascular",
      resumo: "Revisão sistemática com meta-análise de 13 estudos de coorte prospectivos (54.034 pacientes com doença cardiovascular já estabelecida, mais de 13.311 eventos) encontrou que maior adesão à dieta mediterrânea associou-se a menor mortalidade por todas as causas (HR 0,74), menor mortalidade cardiovascular (HR 0,84) e menor risco de eventos cardiovasculares recorrentes (HR 0,60).",
      mudou: "Reforça, com a maior síntese de coortes já reunida sobre o tema, que a dieta mediterrânea deve ser tratada como parte ativa da prevenção secundária cardiovascular — ao lado da terapia farmacológica, não como coadjuvante.",
      aplicar: "Para pacientes com doença cardiovascular já estabelecida, priorize e reforce a adesão à dieta mediterrânea como parte do plano terapêutico, deixando claro que a associação encontrada é observacional (não prova causalidade) e que ela complementa, mas não substitui, a terapia farmacológica prescrita pela cardiologia.",
      evidencia: 4,
      link: "https://doi.org/10.1016/j.numecd.2026.104854",
      fonte: {
        autores: "Gitsi e cols.",
        revista: "Nutrition, Metabolism and Cardiovascular Diseases",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de estudos de coorte prospectivos (não ensaios clínicos randomizados)",
        amostra: "13 estudos de coorte prospectivos, 54.034 pacientes com doença cardiovascular estabelecida (mais de 13.311 eventos), seguimento de 2 a 10 anos",
        doi: "10.1016/j.numecd.2026.104854",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "A dieta mediterrânea já é amplamente recomendada na prevenção primária de doença cardiovascular, mas faltava reunir, numa única meta-análise, a evidência de coortes que acompanham especificamente pacientes que já tiveram um evento cardiovascular — ou seja, se a adesão à dieta também se associa a menos mortes e menos eventos recorrentes na prevenção secundária."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise reuniu 13 estudos de coorte prospectivos que acompanharam, por 2 a 10 anos, 54.034 pacientes com doença cardiovascular já estabelecida, totalizando mais de 13.311 eventos. A adesão à dieta mediterrânea foi medida por escores dietéticos validados, e os desfechos avaliados foram mortalidade por todas as causas, mortalidade cardiovascular e eventos cardiovasculares recorrentes."
        },
        {
          h: "O que foi encontrado",
          p: "Maior adesão à dieta mediterrânea associou-se a menor mortalidade por todas as causas (HR 0,74; IC95% 0,65–0,84), menor mortalidade cardiovascular (HR 0,84; IC95% 0,75–0,94) e menor risco de eventos cardiovasculares recorrentes (HR 0,60; IC95% 0,39–0,92)."
        },
        {
          h: "O que isso não responde",
          p: "Por ser uma meta-análise de estudos observacionais (coortes), há risco residual de confundimento — pessoas que seguem mais a dieta mediterrânea também podem ter outros hábitos de vida mais saudáveis, o que pode inflar parte do efeito observado. Isso não permite afirmar causalidade com a mesma força que um ensaio clínico randomizado forneceria."
        },
        {
          h: "Na prática do consultório",
          p: "Use este estudo para reforçar, com peso de evidência, que a dieta mediterrânea é parte ativa do tratamento de quem já tem doença cardiovascular — não apenas prevenção para quem ainda não teve um evento. Mantenha a adesão à terapia farmacológica como prioridade inegociável, com a dieta como estratégia complementar de impacto real."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "alimentacao-restricao-horario-sop-ensaio-randomizado",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Fertilidade", "Funcional"],
      data: "27 mar 2026",
      title: "Ensaio randomizado mostra que alimentação com janela de 6 horas perde peso igual à restrição calórica em mulheres com SOP, com ganho extra em hormônios",
      resumo: "Ensaio clínico randomizado de três braços, com 76 mulheres com síndrome dos ovários policísticos (SOP), comparou 6 meses de alimentação restrita a uma janela de 6 horas (13h–19h, sem contar calorias) com restrição calórica diária de 25% e com um grupo controle sem mudança na dieta: ambas as intervenções ativas reduziram o peso de forma semelhante frente ao controle (−4,32% no grupo de janela restrita vs. −4,66% na restrição calórica, sem diferença entre elas), mas apenas o grupo de janela restrita melhorou o índice de andrógenos livres e a hemoglobina glicada, além de ambos os grupos ativos reduzirem a testosterona.",
      mudou: "Mostra que, para perda de peso em mulheres com SOP, a alimentação com janela restrita sem contar calorias pode ser tão eficaz quanto a restrição calórica tradicional — e, neste ensaio, trouxe ganho hormonal e glicêmico adicional que a restrição calórica isolada não mostrou.",
      aplicar: "Para pacientes com SOP que têm dificuldade em contar calorias, considere a alimentação com janela de 6 horas (ex.: 13h–19h) como alternativa com eficácia semelhante à restrição calórica tradicional para perda de peso — e, segundo este ensaio, com possível ganho adicional em androgênios e glicemia; calibre a expectativa, pois é um único ensaio e ainda não é conduta padrão estabelecida.",
      evidencia: 4,
      link: "https://www.nature.com/articles/s41591-026-04316-7",
      fonte: {
        autores: "Corapi e cols.",
        revista: "Nature Medicine",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, três braços (alimentação com restrição de horário, restrição calórica, controle sem intervenção)",
        amostra: "76 mulheres com SOP, acompanhadas por 6 meses",
        doi: "10.1038/s41591-026-04316-7",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "A restrição calórica tradicional (contar calorias) é eficaz para perda de peso em mulheres com SOP, mas é difícil de manter a longo prazo. Este ensaio testou se a alimentação com janela de horário restrita — sem contar calorias, só limitando o período de ingestão — consegue efeito semelhante sobre peso e, além disso, se traz algum benefício hormonal ou metabólico específico."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio clínico randomizado de três braços incluiu 76 mulheres com SOP, divididas por 6 meses em: alimentação com todas as refeições entre 13h e 19h (janela de 6 horas, sem contagem de calorias), restrição calórica diária de 25% do gasto energético, ou grupo controle sem orientação de mudança na dieta. Foram avaliados peso corporal, testosterona, índice de andrógenos livres e hemoglobina glicada (HbA1c)."
        },
        {
          h: "O que foi encontrado",
          p: "Aos 6 meses, o peso corporal reduziu significativamente nos dois grupos ativos frente ao controle (−4,32% na janela restrita e −4,66% na restrição calórica), sem diferença estatística entre os dois. A testosterona caiu em ambos os grupos ativos, mas apenas o grupo de janela restrita teve melhora significativa do índice de andrógenos livres e da HbA1c."
        },
        {
          h: "O que isso não responde",
          p: "A amostra é pequena (76 participantes em três braços) e vem de um único protocolo, o que limita a generalização. O estudo não avalia desfechos reprodutivos (ovulação, taxas de gravidez) nem mostra se os ganhos hormonais se mantêm além dos 6 meses de seguimento — é um resultado que precisa de replicação."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes com SOP que resistem a contar calorias, ofereça a alimentação com janela de 6 horas como alternativa com eficácia parecida para perda de peso, mencionando o indício (ainda preliminar, de um único ensaio) de ganho extra em andrógenos e glicemia — sem apresentá-la como superior comprovada à restrição calórica tradicional."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creatina-beta-alanina-combinada-revisao-sistematica",
      categoria: "Esportiva",
      areas: ["Esportiva"],
      data: "21 jun 2025",
      title: "Revisão sistemática confirma: combinar creatina e beta-alanina ajuda no exercício de alta intensidade, mas não soma benefício em força máxima ou composição corporal",
      resumo: "Revisão sistemática de 7 ensaios clínicos randomizados (263 participantes) comparou a suplementação combinada de creatina e beta-alanina com a suplementação isolada de cada um: a combinação melhorou o desempenho em exercício de alta intensidade, sobretudo potência anaeróbica e desempenho em esforços repetidos, mas não trouxe ganho adicional de força máxima, teve efeito inconsistente sobre composição corporal entre os estudos e não melhorou capacidade aeróbica frente à suplementação isolada.",
      mudou: "Reforça que combinar creatina e beta-alanina tem valor específico para desempenho anaeróbico e esforços repetidos de alta intensidade — mas desfaz a expectativa de que a combinação sempre supera a suplementação isolada em qualquer desfecho, já que força máxima, composição corporal e capacidade aeróbica não mostraram ganho extra consistente.",
      aplicar: "Para atletas de esportes com esforços repetidos de alta intensidade (ex.: modalidades intermitentes), a combinação de creatina e beta-alanina pode valer a pena — mas, se o objetivo prioritário é força máxima, composição corporal ou capacidade aeróbica, não prometa benefício adicional da combinação frente à suplementação isolada de creatina, já que a evidência atual não mostra essa vantagem.",
      evidencia: 4,
      link: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12251028/",
      fonte: {
        autores: "Ashtary-Larky e cols.",
        revista: "Nutrients",
        ano: "2025",
        desenho: "Revisão sistemática de ensaios clínicos randomizados (sem meta-análise formal de efeito agrupado)",
        amostra: "7 ensaios clínicos randomizados, 263 participantes (231 homens, 32 mulheres)",
        doi: "10.3390/nu17132074",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Creatina e beta-alanina são dois dos suplementos mais estudados em nutrição esportiva, cada um com mecanismo de ação diferente (fosfocreatina muscular vs. tamponamento de íons de hidrogênio via carnosina). Esta revisão testou se combiná-los traz benefício adicional frente ao uso isolado de cada um, em desempenho físico e composição corporal."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática buscou em PubMed/MEDLINE, Scopus e Web of Science ensaios clínicos randomizados que comparassem a suplementação combinada de creatina e beta-alanina com o uso isolado de um dos dois, por pelo menos 4 semanas, em adultos. Foram incluídos 7 ensaios (263 participantes), avaliando desempenho de alta intensidade, força máxima, capacidade aeróbica e composição corporal."
        },
        {
          h: "O que foi encontrado",
          p: "A combinação melhorou o desempenho em exercício de alta intensidade, especialmente potência anaeróbica e desempenho em esforços repetidos, frente à suplementação isolada. Não houve ganho adicional de força máxima nem de capacidade aeróbica (VO2max, limiar de lactato, tempo até exaustão) com a combinação. Os efeitos sobre composição corporal foram inconsistentes entre os estudos — um achou mais ganho de massa magra e redução de gordura com a combinação, outro não encontrou diferença."
        },
        {
          h: "O que isso não responde",
          p: "Com apenas 7 ensaios e sem meta-análise formal de efeito agrupado, a revisão não permite quantificar com precisão o tamanho do benefício da combinação, nem explicar por que os estudos de composição corporal divergem entre si. A amostra é majoritariamente masculina (231 de 263 participantes), o que limita a generalização para mulheres."
        },
        {
          h: "Na prática do consultório",
          p: "Oriente a combinação de creatina e beta-alanina para atletas cujo foco é desempenho repetido de alta intensidade (esportes intermitentes, séries curtas e intensas) — mas não prometa esse mesmo ganho para quem busca prioritariamente força máxima, mudança de composição corporal ou desempenho aeróbico, onde a combinação não mostrou vantagem sobre a suplementação isolada."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mindfulness-mindful-eating-ingestao-apetite-meta-analise",
      categoria: "Comportamental",
      areas: ["Comportamental", "Estética"],
      data: "16 jun 2026",
      title: "Meta-análise com 46 estudos confirma que mindfulness e mindful eating reduzem a ingestão alimentar, mas não mudam a sensação de apetite",
      resumo: "Revisão sistemática com meta-análise reuniu 41 artigos (46 estudos, 3.581 participantes) testando intervenções de mindfulness e mindful eating sobre ingestão alimentar e apetite: houve redução consistente da ingestão alimentar (SMD = −0,24; IC95% −0,35 a −0,12; p<0,001), mas sem efeito estatisticamente significativo sobre fome, saciedade ou plenitude, e o efeito sobre ingestão foi maior em ambientes de laboratório do que em contextos mais próximos do dia a dia.",
      mudou: "Confirma, com a maior síntese já reunida sobre o tema, que mindfulness e mindful eating reduzem quanto a pessoa come — mas, diferente do que às vezes se supõe na prática, não há evidência de que mudem a sensação de fome ou saciedade; o efeito também é mais forte em condições controladas de laboratório do que em situações reais do dia a dia.",
      aplicar: "Ao propor mindfulness ou mindful eating para reduzir a quantidade ingerida, não prometa que o paciente vai 'sentir menos fome' — o ganho mostrado aqui é na quantidade consumida, não na percepção de apetite — e calibre a expectativa de que o efeito no dia a dia pode ser menor do que o observado em estudos de laboratório.",
      evidencia: 5,
      link: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12465136/",
      fonte: {
        autores: "Ahmadyar e cols.",
        revista: "Clinical Psychology Review",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de efeitos aleatórios de estudos experimentais",
        amostra: "41 artigos (46 estudos), 3.581 participantes",
        doi: "10.1016/j.cpr.2026.102780",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Mindfulness, mindful eating e alimentação intuitiva são cada vez mais usados na prática clínica para ajudar pacientes a comer menos ou de forma mais consciente, mas faltava uma síntese robusta que separasse o efeito real sobre quanto a pessoa come do efeito sobre como ela sente fome e saciedade."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise de efeitos aleatórios buscou em PsycINFO, MEDLINE, Embase, Web of Science e Scopus estudos experimentais que manipularam mindfulness, mindful eating ou alimentação intuitiva com grupo controle, medindo ingestão alimentar e/ou apetite (fome, saciedade, plenitude). Foram incluídos 41 artigos (46 estudos, 3.581 participantes); não foram encontradas intervenções relevantes de alimentação intuitiva o suficiente para análise separada."
        },
        {
          h: "O que foi encontrado",
          p: "Mindfulness e mindful eating reduziram a ingestão alimentar de forma consistente frente ao controle (46 estudos; SMD = −0,24; IC95% −0,35 a −0,12; p<0,001). Não houve efeito estatisticamente significativo sobre apetite (fome, saciedade ou plenitude) nos 11 estudos que mediram esse desfecho. O efeito sobre ingestão foi maior em estudos de laboratório do que em contextos mais ecológicos."
        },
        {
          h: "O que isso não responde",
          p: "A maior parte dos estudos incluídos foi conduzida em ambiente de laboratório, com medidas de curto prazo — a revisão não esclarece se a redução de ingestão se sustenta no dia a dia real, fora de contextos controlados, nem qual o mecanismo exato pelo qual mindfulness reduz a quantidade ingerida sem alterar a sensação de fome ou saciedade."
        },
        {
          h: "Na prática do consultório",
          p: "Use mindfulness e mindful eating como ferramentas com respaldo real para reduzir a quantidade ingerida — mas não os venda como estratégia para 'sentir menos fome' ou 'saciar mais rápido', já que o efeito sobre apetite não se confirmou nesta meta-análise. Lembre também que o efeito pode ser menor fora do ambiente controlado de um estudo."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-prebioticos-simbioticos-microbiota-idosos-meta-analise",
      categoria: "Microbiota",
      areas: ["Clínica", "Funcional"],
      data: "29 set 2025",
      title: "Meta-análise de 29 ensaios mostra que probióticos, prebióticos e simbióticos modulam a microbiota e reduzem marcadores inflamatórios em idosos",
      resumo: "Revisão sistemática com meta-análise de 29 ensaios clínicos randomizados (1.633 participantes com 60 anos ou mais) avaliou efeitos de probióticos, prebióticos e simbióticos sobre a microbiota intestinal, ácidos graxos de cadeia curta e marcadores inflamatórios: prebióticos e probióticos aumentaram a abundância de Bifidobacterium, probióticos melhoraram a diversidade microbiana (índice de Shannon), simbióticos elevaram cepas específicas de Lactobacillus e reduziram Pseudomonas, e houve redução de marcadores inflamatórios (IL-1β e TNF-α) com prebióticos e simbióticos.",
      mudou: "Ao contrário do que uma meta-análise recente mostrou para adultos saudáveis em geral (sem efeito sobre diversidade da microbiota), esta síntese específica em idosos de 60 anos ou mais encontra efeito positivo de probióticos sobre diversidade microbiana e de prebióticos/simbióticos sobre marcadores inflamatórios — sugerindo que a resposta pode variar por faixa etária.",
      aplicar: "Ao considerar probióticos, prebióticos ou simbióticos para pacientes idosos (60+), já há uma base mais consistente de que esse grupo pode responder com mudanças favoráveis na microbiota e nos marcadores inflamatórios — diferente da população adulta saudável em geral, onde o ganho em diversidade da microbiota não se confirma.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/41023690/",
      fonte: {
        autores: "Mussa e cols.",
        revista: "Nutrition Journal",
        ano: "2025",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "29 ensaios clínicos randomizados, 1.633 participantes com 60 anos ou mais",
        doi: "10.1186/s12937-025-01218-1",
        pubmed: "41023690",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Envelhecimento costuma vir acompanhado de redução da diversidade da microbiota intestinal e de inflamação crônica de baixo grau ('inflammaging'). Esta revisão testou se probióticos, prebióticos e simbióticos conseguem modular favoravelmente a microbiota, os ácidos graxos de cadeia curta e os marcadores inflamatórios especificamente em idosos."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise buscou em PubMed, Embase, Cochrane Library e Scopus ensaios clínicos randomizados com probióticos, prebióticos ou simbióticos em participantes com 60 anos ou mais, avaliando composição da microbiota, ácidos graxos de cadeia curta (SCFAs) e marcadores inflamatórios (IL-10, IL-1β, TNF-α). Foram incluídos 29 ensaios, totalizando 1.633 participantes."
        },
        {
          h: "O que foi encontrado",
          p: "Prebióticos e probióticos aumentaram a abundância de Bifidobacterium (prebióticos: SMD = 1,09; probióticos: SMD = 0,40). Probióticos melhoraram a diversidade microbiana (índice de Shannon: SMD = 0,76). Simbióticos aumentaram cepas específicas de Lactobacillus (SMD = 0,75) e reduziram Pseudomonas (SMD = −0,55). Nos marcadores inflamatórios, prebióticos aumentaram IL-10 (SMD = 0,61) e reduziram IL-1β (SMD = −0,39); simbióticos reduziram TNF-α (SMD = −0,36)."
        },
        {
          h: "O que isso não responde",
          p: "A heterogeneidade entre cepas, doses e formulações de probióticos/prebióticos/simbióticos é grande, o que dificulta recomendar um protocolo único. A revisão também não avalia desfechos clínicos duros (infecções, hospitalizações, mortalidade) — os desfechos são laboratoriais (composição da microbiota e marcadores inflamatórios), não clínicos diretos."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes idosos, esta meta-análise dá respaldo mais específico do que a evidência em adultos saudáveis em geral para considerar probióticos (diversidade microbiana), prebióticos (Bifidobacterium e IL-10/IL-1β) ou simbióticos (Lactobacillus, TNF-α) como parte do cuidado nutricional — sempre deixando claro que o ganho demonstrado é em marcadores laboratoriais, não ainda em desfechos clínicos como menos infecções ou internações."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creatina-monohidratada-mulheres-pos-menopausa-meta-analise",
      categoria: "Suplementação",
      areas: ["Saúde da Mulher", "Funcional"],
      data: "16 mai 2026",
      title: "Meta-análise de 7 ensaios mostra que creatina (≥5g/dia) com treino resistido traz ganho pequeno, mas real, de massa magra e força em mulheres na pós-menopausa",
      resumo: "Revisão sistemática com meta-análise de 7 ensaios clínicos randomizados, placebo-controlados (608 mulheres pós-menopausa) avaliou suplementação de creatina monohidratada, com ou sem treino resistido: a creatina aumentou massa magra em média 0,37 kg e força em leg-press em 7,5 kg frente a placebo, com benefício mais evidente quando a dose era de 5g/dia ou mais combinada a treino resistido; doses de até 3g/dia sem treino resistido não mostraram efeito mensurável, e o efeito sobre densidade óssea permaneceu incerto.",
      mudou: "Reforça, com a primeira meta-análise focada nessa população, que a creatina pode ser incorporada à rotina de mulheres na pós-menopausa com segurança — mas o ganho só aparece com dose adequada (5g/dia ou mais) associada a treino resistido, não com suplementação isolada em dose baixa.",
      aplicar: "Para pacientes na pós-menopausa, oriente a creatina monohidratada (≥5g/dia) sempre associada a treino resistido como estratégia para ganho pequeno, porém real, de massa magra e força — deixe claro que o efeito sobre densidade óssea ainda não está comprovado e que doses baixas sem treino resistido não mostraram benefício.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/42141930/",
      fonte: {
        autores: "Naddafha e cols.",
        revista: "Journal of the International Society of Sports Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados, placebo-controlados (risco de viés por Cochrane RoB 2; certeza por GRADE)",
        amostra: "7 ensaios clínicos randomizados, 608 mulheres pós-menopausa",
        doi: "10.1080/15502783.2026.2668435",
        pubmed: "42141930",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "A creatina é um dos suplementos mais estudados em homens jovens e atletas, mas faltava uma meta-análise focada especificamente em mulheres na pós-menopausa — fase em que a perda de massa magra e força se acelera — para saber se o suplemento realmente ajuda nessa população e em que dose."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise buscou em MEDLINE, Embase, Scopus, Web of Science, SPORTDiscus e Cochrane CENTRAL (2000 a agosto de 2025) ensaios clínicos randomizados, placebo-controlados, de suplementação de creatina com ou sem treino resistido em mulheres pós-menopausa. Foram incluídos 7 ensaios (608 participantes, idade média de aproximadamente 62 anos, seguimento de 12 a 104 semanas), avaliando massa magra, força (leg-press) e densidade óssea. Risco de viés avaliado por Cochrane RoB 2 e certeza da evidência por GRADE."
        },
        {
          h: "O que foi encontrado",
          p: "A creatina aumentou a massa magra em média 0,37 kg e a força em leg-press em 7,5 kg (3 estudos; n=111; diferença média +7,5 kg; IC95% +2,2 a +12,8; I²=0%) frente a placebo. O benefício foi mais evidente nos estudos que combinaram dose de 5g/dia ou mais com treino resistido; estudos com dose de até 3g/dia sem treino resistido não mostraram efeito mensurável. O efeito sobre densidade óssea permaneceu incerto."
        },
        {
          h: "O que isso não responde",
          p: "O risco de viés foi classificado majoritariamente como 'algumas preocupações' (apenas um grande ensaio duplo-cego pré-registrado foi considerado baixo risco), e o número de ensaios é pequeno, com heterogeneidade nos protocolos de dose e associação com treino resistido. O efeito sobre densidade óssea — um desfecho central para essa população — ainda não está esclarecido e precisa de mais pesquisa."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes na pós-menopausa, oriente creatina monohidratada em dose de 5g/dia ou mais, sempre associada a treino resistido, como estratégia com respaldo real (ainda que modesto) para massa magra e força — e seja transparente de que, até aqui, não há prova de que a creatina isolada proteja a densidade óssea nessa fase da vida."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dietas-plant-based-sobrepeso-obesidade-meta-analise",
      categoria: "Obesidade",
      areas: ["Clínica", "Comportamental"],
      data: "19 jun 2026",
      title: "Meta-análise de 10 ensaios encontra pouca diferença entre dieta plant-based e onívora em peso e marcadores metabólicos, com certeza de evidência muito baixa",
      resumo: "Revisão sistemática com meta-análise de 10 ensaios clínicos randomizados comparou dietas plant-based com dietas onívoras em adultos com sobrepeso ou obesidade: na análise geral, houve pouca ou nenhuma diferença entre os grupos para peso corporal, pressão arterial, glicemia, insulina e perfil lipídico, mas o subgrupo de intervenções com 14 semanas ou mais mostrou redução adicional de IMC (−5,64 kg/m²; 3 ensaios, n=357) e melhora de LDL-c e HbA1c — achados classificados pelos autores com certeza de evidência muito baixa (GRADE).",
      mudou: "Mostra que o benefício de dietas plant-based sobre peso e marcadores metabólicos em sobrepeso/obesidade, quando existe, parece depender de duração mais longa de intervenção (14 semanas ou mais) — e que, na análise geral e na maioria dos desfechos, a diferença frente à dieta onívora é pequena ou nula, com certeza de evidência ainda muito baixa.",
      aplicar: "Ao indicar uma dieta plant-based para perda de peso em paciente com sobrepeso/obesidade, não prometa superioridade clara sobre uma dieta onívora bem estruturada no curto prazo — se optar por essa abordagem, planeje para pelo menos 14 semanas de acompanhamento, já que foi nesse subgrupo que apareceu o maior benefício, e mantenha a expectativa calibrada pela certeza de evidência ainda muito baixa.",
      evidencia: 5,
      link: "https://doi.org/10.3390/nu18121987",
      fonte: {
        autores: "Csölle e cols.",
        revista: "Nutrients",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados (certeza avaliada pelo GRADE)",
        amostra: "10 ensaios clínicos randomizados (de 2.664 registros triados), adultos com sobrepeso ou obesidade, comparando dieta plant-based vs. onívora",
        doi: "10.3390/nu18121987",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Dietas plant-based são frequentemente recomendadas para perda de peso e saúde metabólica, mas faltava uma meta-análise atualizada, restrita a ensaios clínicos randomizados, comparando especificamente essas dietas com dietas onívoras em adultos com sobrepeso ou obesidade — a população em que esse tipo de recomendação é mais comum na prática."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise buscou em Cochrane CENTRAL, MEDLINE, Embase, ClinicalTrials.gov e WHO ICTRP, de 2.664 registros triados, ensaios clínicos randomizados comparando dieta plant-based com dieta onívora em adultos com sobrepeso/obesidade. Foram incluídos 10 RCTs, avaliando peso corporal, pressão arterial, glicemia, insulina, sensibilidade à insulina, perfil lipídico (incluindo LDL-c) e HbA1c, com certeza da evidência graduada pelo GRADE."
        },
        {
          h: "O que foi encontrado",
          p: "Na análise geral, houve pouca ou nenhuma diferença entre dieta plant-based e onívora para peso, pressão arterial, glicemia, insulina, sensibilidade à insulina, colesterol total, triglicerídeos, HDL-c e massa de gordura corporal (ex.: 7 ensaios, n=611, diferença média de IMC de −1,15 kg/m²; IC95% −2,17 a −0,13). No subgrupo com intervenções de 14 semanas ou mais, o efeito foi maior (diferença média de IMC −5,64 kg/m²; IC95% −7,02 a −4,26; 3 ensaios, n=357), com melhorias também em LDL-c e HbA1c. Um ensaio comparando plant-based com dieta ovolactovegetariana não encontrou diferença no IMC."
        },
        {
          h: "O que isso não responde",
          p: "Os próprios autores classificam a certeza da evidência como muito baixa (GRADE) para a maioria dos desfechos, refletindo o pequeno número de ensaios, a heterogeneidade nas definições de 'dieta plant-based' entre os estudos, a curta duração da maioria das intervenções e o risco de viés. O resultado mais favorável (subgrupo ≥14 semanas) vem de apenas 3 ensaios, o que exige cautela antes de generalizar."
        },
        {
          h: "Na prática do consultório",
          p: "Se o paciente com sobrepeso/obesidade tem preferência por uma dieta plant-based, apoie a escolha, mas sem prometer resultado superior à dieta onívora no curto prazo — explique que o benefício mais consistente observado exige pelo menos 14 semanas de adesão, e que a certeza científica para esses achados ainda é baixa, então o acompanhamento individualizado continua sendo o que mais importa."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "intervencoes-nutricionais-gestacao-desfechos-maternos-neonatais-meta-analise",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Pediatria"],
      data: "14 ago 2026",
      title: "Meta-análise de 23 ensaios confirma que intervenções nutricionais na gestação reduzem baixo peso ao nascer, prematuridade e diabetes gestacional",
      resumo: "Revisão sistemática com meta-análise de 23 ensaios clínicos randomizados (9.389 gestantes) avaliou intervenções nutricionais estruturadas durante a gestação: houve aumento do peso ao nascer dentro de limites saudáveis e redução significativa do risco de baixo peso ao nascer, pequeno para idade gestacional, parto prematuro e diabetes gestacional, com efeito mais forte para aconselhamento personalizado e intervenções com 4 ou mais sessões — sem aumento de macrossomia ou de bebês grandes para a idade gestacional.",
      mudou: "Reforça, com a maior síntese de ensaios randomizados já reunida sobre o tema, que estruturar a intervenção nutricional na gestação (aconselhamento personalizado, 4 ou mais sessões) traz ganho real em desfechos neonatais de risco — e que esse ganho não vem ao custo de aumentar o risco de bebês grandes para a idade gestacional.",
      aplicar: "Estruture o acompanhamento nutricional pré-natal com aconselhamento personalizado e pelo menos 4 sessões ao longo da gestação, já que foi esse formato que mostrou maior redução de baixo peso ao nascer, prematuridade e diabetes gestacional — e tranquilize a equipe de que esse ganho não aumenta o risco de macrossomia.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/42598865/",
      fonte: {
        autores: "Sabuncular e cols.",
        revista: "Journal of Midwifery & Women's Health",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados (protocolo registrado no PROSPERO; certeza avaliada por GRADE)",
        amostra: "23 ensaios clínicos randomizados, 9.389 gestantes (4.695 no grupo intervenção, 4.694 no controle)",
        doi: "10.1111/jmwh.70172",
        pubmed: "42598865",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Intervenções nutricionais durante a gestação (aconselhamento, suplementação, educação) são recomendadas de forma ampla, mas faltava uma meta-análise atualizada e focada em ensaios randomizados para quantificar o real impacto dessas intervenções sobre desfechos maternos e neonatais, e identificar que formato de intervenção funciona melhor."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com protocolo registrado no PROSPERO (CRD42024528918), seguindo PRISMA, reuniu 23 ensaios clínicos randomizados (9.389 participantes; 4.695 no grupo intervenção, 4.694 no controle), publicados entre 2014 e 2024. Avaliou peso ao nascer, baixo peso ao nascer, pequeno/grande para idade gestacional, prematuridade, macrossomia, diabetes gestacional, hipertensão gestacional, pré-eclâmpsia, anemia materna, cesárea e admissão em UTI neonatal. Risco de viés avaliado por Cochrane RoB 2 e certeza por GRADE."
        },
        {
          h: "O que foi encontrado",
          p: "As intervenções nutricionais aumentaram significativamente o peso ao nascer dentro de limites saudáveis (p=0,0004) e reduziram o risco de baixo peso ao nascer, pequeno para idade gestacional, parto prematuro (p=0,0009) e diabetes gestacional. Em análise de subgrupo, aconselhamento personalizado aumentou o peso ao nascer (p=0,0007), enquanto educação em grupo não teve efeito significativo (p=0,17); intervenções com 4 ou mais sessões associaram-se a menor taxa de parto prematuro (p=0,01–0,02). Não houve efeito significativo sobre macrossomia, grande para idade gestacional, comprimento ao nascer, perímetro cefálico, hipertensão gestacional, pré-eclâmpsia, anemia materna, cesárea ou admissão em UTI neonatal."
        },
        {
          h: "O que isso não responde",
          p: "A heterogeneidade entre os tipos de intervenção nutricional (aconselhamento, suplementação, educação, fornecimento de alimentos) incluídos nos 23 ensaios dificulta apontar um protocolo único como 'o melhor'. A revisão também não detalha, nas buscas disponíveis, o grau de heterogeneidade estatística entre os estudos para cada desfecho — vale confirmar essa informação no texto completo antes de generalizar os números."
        },
        {
          h: "Na prática do consultório",
          p: "Priorize, no pré-natal, aconselhamento nutricional personalizado (não apenas educação em grupo) e planeje pelo menos 4 sessões ao longo da gestação — foi esse formato que mostrou os maiores ganhos em peso ao nascer e redução de prematuridade e diabetes gestacional, sem aumentar o risco de bebês grandes para a idade gestacional."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "intervencoes-dieteticas-angulo-fase-dialise-meta-analise",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "06 ago 2026",
      title: "Meta-análise mostra que intervenções dietéticas, isoladas ou com proteína/aminoácidos, não mudam o ângulo de fase em pacientes em diálise",
      resumo: "Revisão sistemática com meta-análise de 9 ensaios clínicos randomizados (969 participantes em diálise, de 14 estudos elegíveis) avaliou o efeito de intervenções dietéticas — isoladas, combinadas a exercício, ou baseadas em proteína/aminoácidos — sobre o ângulo de fase (marcador de bioimpedância ligado a massa celular e estado nutricional): nenhuma das abordagens testadas teve impacto estatisticamente significativo sobre o ângulo de fase, com intervalos de confiança cruzando o zero em todas as comparações e heterogeneidade alta entre os estudos.",
      mudou: "Mostra que, apesar de a intervenção dietética continuar sendo central no cuidado nutricional da diálise, o ângulo de fase especificamente não deve ser usado como marcador para julgar se essa intervenção está 'funcionando' no curto prazo — nenhuma estratégia testada moveu esse marcador de forma significativa nos ensaios disponíveis.",
      aplicar: "Ao acompanhar pacientes em diálise, não use o ângulo de fase isoladamente como indicador de resposta à intervenção dietética — segundo esta meta-análise, nem dieta isolada, nem dieta com exercício, nem suplementação proteica/aminoácidos mudaram esse marcador de forma significativa; continue usando outros desfechos (peso, força, qualidade de vida, marcadores bioquímicos) para avaliar a resposta ao cuidado nutricional.",
      evidencia: 4,
      link: "https://doi.org/10.1093/nutrit/nuag113",
      fonte: {
        autores: "Frizzas e cols.",
        revista: "Nutrition Reviews",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "14 estudos elegíveis (9 ensaios clínicos randomizados), 969 participantes adultos em diálise",
        doi: "10.1093/nutrit/nuag113",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "O ângulo de fase, obtido por bioimpedância, é usado como marcador de massa celular e estado nutricional em pacientes em diálise, e intervenções dietéticas costumam ser propostas para melhorá-lo. Esta revisão testou, de forma sistemática, se isso realmente acontece — algo relevante para quem usa esse marcador para acompanhar a resposta ao cuidado nutricional."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise buscou em PubMed, Scopus, Web of Science, CINAHL e Embase (até setembro de 2025) estudos que avaliassem o efeito de intervenções dietéticas sobre o ângulo de fase em pacientes com doença renal crônica em diálise. Foram identificados 14 estudos elegíveis, dos quais 9 eram ensaios clínicos randomizados, totalizando 969 participantes; as intervenções foram agrupadas em dieta isolada, dieta combinada a exercício, e intervenções proteicas/aminoácidos."
        },
        {
          h: "O que foi encontrado",
          p: "Nenhuma das abordagens testadas teve efeito estatisticamente significativo sobre o ângulo de fase: dieta isolada (diferença média +0,26°; IC95% −0,22 a 0,73), todas as intervenções dietéticas combinadas (diferença média +0,22°; IC95% −0,20 a 0,63) e intervenções com aminoácidos/proteína (diferença média +0,49°; IC95% −0,19 a 1,17) — em todas, o intervalo de confiança cruza o zero, indicando ausência de efeito significativo, com heterogeneidade alta entre os estudos (I² de 73% a 80%)."
        },
        {
          h: "O que isso não responde",
          p: "O número de ensaios randomizados disponíveis é pequeno (9) e os próprios autores apontam risco de viés importante nos estudos incluídos, além de heterogeneidade alta — o que limita a confiança no tamanho exato do efeito (ou da ausência de efeito) e reforça a necessidade de ensaios de melhor qualidade metodológica para confirmar esse achado negativo."
        },
        {
          h: "Na prática do consultório",
          p: "Continue com a intervenção dietética como parte central do cuidado nutricional em diálise, mas não a avalie pelo ângulo de fase isoladamente — segundo esta meta-análise, esse marcador não se moveu de forma significativa com nenhuma das estratégias testadas. Prefira acompanhar peso, força, qualidade de vida e marcadores bioquímicos (fósforo, potássio, albumina) para julgar a resposta do paciente."
        }
      ]
    }
  ]
};

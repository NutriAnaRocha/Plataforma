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
    title: "9 estudos reais para atualizar sua conduta nesta semana",
    texto: "Uma meta-análise atualizada de 11 ECRs confirma que a dieta mediterrânea reduz de forma discreta, porém real, a HbA1c e a glicemia de jejum no diabetes tipo 2, uma meta-análise de 78 estudos associa nutracêuticos como vitamina D, inositol e quercetina a melhora de marcadores metabólicos e hormonais na síndrome dos ovários policísticos, uma rede de meta-análise com 35 ECRs mostra que proteína, creatina e beta-alanina têm efeitos distintos sobre força, salto e velocidade de sprint em atletas — mas nenhum aumenta massa muscular —, um ensaio cruzado mostra que a textura dos alimentos ultraprocessados que reduz a velocidade de mastigação diminui a ingestão calórica em cerca de 369 kcal/dia por duas semanas, sem alterar o peso corporal nesse período curto, uma meta-análise de 9 ECRs mostra que a dieta mediterrânea melhora HbA1c, LDL e triglicerídeos em adultos de risco cardiometabólico, com mudanças na microbiota sintetizadas apenas de forma descritiva, uma revisão sistemática de ECRs não encontra efeito anti-inflamatório consistente da creatina sobre PCR ou IL-6, o seguimento de 12 meses de um ECR espanhol mostra que o horário da janela alimentar no jejum intermitente (manhã ou tarde) ajuda a manter a perda de peso após o fim do programa, uma meta-análise de 19 ECRs mostra que a suplementação pré-natal com múltiplos micronutrientes melhora o tamanho ao nascer e o crescimento até os 6 meses frente a ferro e ácido fólico isolados, e uma coorte israelense de 15 anos associa ingestão proteica abaixo de 1,0 g/kg/dia a menor risco de iniciar diálise em doença renal crônica não dialítica, sem sinal de piora nutricional. Cada card abre a leitura completa com o link do estudo original."
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
      id: "dieta-mediterranea-diabetes-tipo2-meta-analise",
      categoria: "Clínica",
      areas: ["Clínica", "Diabetes"],
      data: "13 dez 2025",
      title: "Meta-análise atualizada de 11 ECRs confirma melhora discreta, porém real, do controle glicêmico com a dieta mediterrânea no diabetes tipo 2",
      resumo: "Revisão sistemática com meta-análise de 11 ensaios clínicos randomizados (10 publicações) comparou a dieta mediterrânea a dietas-controle em adultos com diabetes tipo 2: o grupo em padrão mediterrâneo teve redução adicional média de HbA1c de -0,307 pontos percentuais (IC95% -0,451 a -0,163) e de glicemia de jejum de -0,845 mmol/L (IC95% -1,307 a -0,384) em relação ao controle.",
      mudou: "Atualiza, com busca estendida até agosto de 2025, uma síntese de ECRs sobre dieta mediterrânea em diabetes tipo 2 que não era revisada de forma abrangente desde 2015, confirmando um efeito glicêmico real — ainda que modesto — somado aos já conhecidos benefícios sobre peso e perfil lipídico.",
      aplicar: "Use esse dado para reforçar, com respaldo atualizado, a indicação da dieta mediterrânea como estratégia alimentar de primeira linha no diabetes tipo 2 — mas seja honesto com o paciente de que o efeito isolado sobre a HbA1c é pequeno e funciona melhor somado a manejo de peso, atividade física e adesão ao tratamento medicamentoso, não como substituto deles.",
      evidencia: 5,
      link: "https://www.mdpi.com/2072-6643/17/24/3908",
      fonte: {
        autores: "Wu, Hung, Yong, Ching e Hsu",
        revista: "Nutrients",
        ano: "2025",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados (dieta mediterrânea vs. dietas-controle), seguindo PRISMA 2020",
        amostra: "11 ECRs (10 publicações) em adultos com diabetes tipo 2, com busca em PubMed, Web of Science e Embase desde a criação das bases até 17 ago 2025",
        doi: "10.3390/nu17243908",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A última meta-análise abrangente de ensaios clínicos randomizados sobre dieta mediterrânea e controle glicêmico/IMC em diabetes tipo 2 datava de 2015. Os autores buscaram uma síntese atualizada, incorporando a década de novos ensaios publicados desde então, para reavaliar o tamanho real do efeito glicêmico, do IMC, do perfil lipídico e da pressão arterial." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 11 ensaios clínicos randomizados (10 publicações) que compararam a dieta mediterrânea a dietas-controle em adultos com diabetes tipo 2, com busca em PubMed, Web of Science e Embase desde a criação das bases até 17 de agosto de 2025, seguindo as diretrizes PRISMA 2020." },
        { h: "O que foi encontrado", p: "O grupo em dieta mediterrânea apresentou redução média adicional de HbA1c de -0,307 pontos percentuais (IC95% -0,451 a -0,163) e de glicemia de jejum de -0,845 mmol/L (IC95% -1,307 a -0,384) em relação ao grupo-controle. IMC, perfil lipídico e pressão arterial também foram avaliados como desfechos secundários da revisão." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham o número exato de participantes incluídos na análise final, nem a duração média das intervenções, o que dificulta avaliar a consistência dos achados entre estudos. A magnitude do efeito sobre HbA1c, embora estatisticamente significativa, é pequena e pode ter relevância clínica limitada quando usada isoladamente." },
        { h: "Na prática do consultório", p: "Mantenha a dieta mediterrânea (azeite de oliva, hortaliças, leguminosas, grãos integrais, peixes, redução de carnes processadas e ultraprocessados) como base da orientação alimentar no diabetes tipo 2, explicando ao paciente que o impacto sobre a HbA1c é real, porém discreto — o resultado melhora quando combinado a manejo de peso, atividade física regular e adesão ao tratamento medicamentoso." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "nutraceuticos-sop-saude-reprodutiva-meta-analise",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "SOP"],
      data: "24 nov 2025",
      title: "Meta-análise de 78 estudos associa nutracêuticos (vitamina D, inositol, quercetina) a melhora de marcadores metabólicos e hormonais na síndrome dos ovários policísticos",
      resumo: "Revisão sistemática com meta-análise de 78 estudos (ensaios clínicos randomizados e quase-experimentais, 2013-2024) avaliou o efeito de nutracêuticos — entre eles vitamina D, inositol e quercetina — sobre desfechos reprodutivos e metabólicos em mulheres com síndrome dos ovários policísticos (SOP), encontrando redução da insulina de jejum (DM -2,14 μUI/mL) e do LH (DM -1,34 mUI/mL), além de aumento da SHBG (DM +3,72 nmol/L), com a vitamina D mostrando os efeitos mais consistentes.",
      mudou: "Amplia a evidência de que certos nutracêuticos vão além do efeito metabólico já conhecido sobre resistência à insulina, parecendo também modular marcadores hormonais associados à SOP (LH, SHBG) — mas os resultados sobre contagem de folículos ovarianos e sangramento menstrual permaneceram inconsistentes entre os estudos.",
      aplicar: "Considere a avaliação e correção do status de vitamina D como parte do manejo nutricional de pacientes com SOP, e discuta o inositol como opção adjuvante quando pertinente — com a ressalva de que a revisão mistura ensaios randomizados e estudos quase-experimentais (maior heterogeneidade) e que o efeito sobre desfechos menstruais não foi consistente, então o nutracêutico deve complementar, nunca substituir, mudança alimentar, manejo de peso quando indicado e acompanhamento médico/ginecológico.",
      evidencia: 4,
      link: "https://doi.org/10.1111/dom.70307",
      fonte: {
        autores: "Çelik e cols.",
        revista: "Diabetes, Obesity and Metabolism",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados e estudos quase-experimentais, registrada no PROSPERO (CRD42024521879), seguindo PRISMA 2020",
        amostra: "78 estudos elegíveis em mulheres com SOP, com buscas em PubMed, Embase, Cochrane Library, Web of Science e bases regionais, de janeiro/2013 a dezembro/2024, avaliando nutracêuticos como vitamina D, inositol e quercetina",
        doi: "10.1111/dom.70307",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A síndrome dos ovários policísticos (SOP) é frequentemente abordada com intervenções nutricionais e nutracêuticos, mas faltava uma síntese abrangente do efeito específico desses suplementos — como vitamina D, inositol e quercetina — sobre desfechos reprodutivos e metabólicos, e não apenas sobre resistência à insulina isoladamente." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise, registrada a priori no PROSPERO e seguindo PRISMA 2020, buscou em PubMed, Embase, Cochrane Library, Web of Science e bases regionais estudos (ensaios clínicos randomizados e quase-experimentais) publicados entre janeiro de 2013 e dezembro de 2024 que testaram nutracêuticos em mulheres com SOP, reunindo 78 estudos elegíveis." },
        { h: "O que foi encontrado", p: "A suplementação com nutracêuticos associou-se a redução da insulina de jejum (DM -2,14 μUI/mL) e do LH (DM -1,34 mUI/mL), além de aumento da SHBG (DM +3,72 nmol/L). Entre os nutracêuticos avaliados, a vitamina D apresentou os efeitos metabólicos e hormonais mais robustos; já os resultados sobre contagem de folículos ovarianos e sangramento menstrual foram inconsistentes entre os estudos incluídos." },
        { h: "O que isso não responde", p: "A revisão mistura ensaios clínicos randomizados com estudos quase-experimentais, o que aumenta a heterogeneidade metodológica e reduz a certeza da evidência agrupada. Os resumos consultados também não trazem de forma conclusiva o efeito sobre testosterona/hirsutismo, nem especificam dose e duração ideais para cada nutracêutico avaliado." },
        { h: "Na prática do consultório", p: "Avalie e corrija a deficiência de vitamina D em pacientes com SOP como parte do manejo nutricional, e considere o inositol como adjuvante quando indicado — mas comunique que a evidência agrupada envolve estudos heterogêneos, que o efeito sobre desfechos menstruais ainda é incerto, e que os nutracêuticos complementam, não substituem, a mudança de hábitos alimentares e o acompanhamento médico/ginecológico contínuo." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "proteina-creatina-beta-alanina-forca-salto-sprint-atletas",
      categoria: "Esportiva",
      areas: ["Esportiva", "Suplementação"],
      data: "09 jul 2025",
      title: "Rede de meta-análise com 35 ECRs mostra que proteína, creatina e beta-alanina têm efeitos distintos sobre força, salto e velocidade — mas nenhum aumenta massa muscular",
      resumo: "Revisão sistemática com meta-análise em rede de 35 ensaios clínicos randomizados (991 atletas) avaliou suplementos (proteína, creatina, beta-alanina, HMB, vitamina D, cafeína, entre outros) combinados a treinamento de condicionamento: a proteína teve o maior efeito sobre força (SMD 0,64, certeza muito baixa), a beta-alanina liderou no desempenho de salto (SMD 0,41) e a creatina reduziu o tempo de sprint (SMD -0,42, SUCRA 94,57%) — nenhum suplemento aumentou significativamente a massa muscular magra.",
      mudou: "Mostra que, numa mesma rede estatística com múltiplos suplementos comparados entre si, o 'melhor' suplemento depende do desfecho de desempenho perseguido (força, salto ou velocidade) — e que, mesmo assim, nenhum deles se mostrou eficaz para aumentar massa muscular, contrariando uma expectativa comum sobre suplementação esportiva.",
      aplicar: "Oriente a escolha do suplemento pelo objetivo de desempenho do atleta (proteína para força, beta-alanina e creatina para salto, creatina para velocidade de sprint), mas não prometa ganho de massa muscular com base nesses suplementos isoladamente — e lembre que a certeza da evidência variou de muito baixa a moderada entre os desfechos, com risco de viés em quase 90% dos estudos incluídos, então trate o ranqueamento como orientador, não definitivo.",
      evidencia: 5,
      link: "https://www.frontiersin.org/articles/10.3389/fnut.2025.1636970/full",
      fonte: {
        autores: "Deng e cols.",
        revista: "Frontiers in Nutrition",
        ano: "2025",
        desenho: "Revisão sistemática com meta-análise em rede (network meta-analysis) de ensaios clínicos randomizados",
        amostra: "35 ECRs, 991 atletas, comparando múltiplos suplementos (proteína, creatina, beta-alanina, HMB, vitamina D, cafeína, entre outros) combinados a treinamento de condicionamento",
        doi: "10.3389/fnut.2025.1636970",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Diferentes suplementos esportivos (proteína, creatina, beta-alanina, HMB, vitamina D, cafeína, entre outros) raramente foram comparados entre si, dentro do mesmo modelo estatístico, quanto ao efeito sobre força, salto, velocidade de sprint e massa muscular em atletas. Esta revisão buscou colocar os principais suplementos lado a lado para identificar qual se destaca em cada desfecho de desempenho." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise em rede reuniu 35 ensaios clínicos randomizados (991 atletas) que testaram suplementos combinados a treinamento de condicionamento, avaliando força muscular, desempenho de salto, velocidade de sprint e massa muscular, com ranqueamento dos suplementos pelo método SUCRA." },
        { h: "O que foi encontrado", p: "A proteína teve o maior efeito sobre força muscular (SMD 0,64), mas com certeza de evidência muito baixa. No desempenho de salto, a beta-alanina liderou (SMD 0,41) e a creatina também ajudou (SMD 0,30), ambos com certeza moderada. Para velocidade de sprint, a creatina reduziu o tempo (SMD -0,42, SUCRA 94,57%), também com certeza moderada. Nenhum suplemento aumentou de forma significativa a massa muscular magra." },
        { h: "O que isso não responde", p: "Cerca de 89% dos estudos incluídos tinham algum grau de preocupação ou alto risco de viés, o que reduz a confiança nos resultados — especialmente no achado de força, classificado como de certeza muito baixa. Por ser uma rede de meta-análise, boa parte das comparações entre suplementos é indireta, e o estudo não testa o efeito de combinar suplementos entre si." },
        { h: "Na prática do consultório", p: "Use esta hierarquia por desfecho para orientar a escolha do suplemento conforme a prioridade do atleta — proteína quando o foco é força, beta-alanina e creatina para salto, creatina para velocidade de sprint —, mas não venda nenhum desses suplementos como estratégia para ganho de massa muscular isoladamente, e comunique ao atleta que boa parte da evidência, sobretudo para força, ainda é de certeza baixa a muito baixa." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "velocidade-mastigacao-textura-ultraprocessados-ingestao-calorica",
      categoria: "Comportamental",
      areas: ["Comportamental", "Comportamento Alimentar"],
      data: "01 abr 2026",
      title: "Textura dos alimentos ultraprocessados que reduz a velocidade de mastigação diminui a ingestão calórica por 2 semanas, sem alterar o peso corporal nesse período",
      resumo: "Ensaio clínico randomizado cruzado (crossover) com 41 adultos comparou 14 dias de dieta de textura 'rápida' a 14 dias de dieta de textura 'lenta', ambas compostas por mais de 90% de alimentos ultraprocessados e equivalentes em densidade energética e porções oferecidas: a dieta de textura que reduziu a velocidade de mastigação levou a uma ingestão calórica média cerca de 369 kcal/dia menor, efeito que se manteve estável ao longo das duas semanas, sem diferença de peso corporal entre as duas dietas nesse período curto.",
      mudou: "Mostra que a textura do alimento — e não apenas sua classificação como ultraprocessado — modula de forma sustentada a ingestão calórica espontânea, sugerindo que a velocidade de mastigação é um mecanismo comportamental independente, manipulável mesmo dentro de uma dieta rica em ultraprocessados.",
      aplicar: "Como estratégia comportamental complementar (nunca substituta à redução de ultraprocessados), pode-se sugerir trocar por versões mais firmes/consistentes dos alimentos que o paciente já consome, o que tende a reduzir naturalmente a velocidade de mastigação e o volume ingerido; cautela: é um único ECR, com amostra pequena (n=41) e curta duração (2 semanas, sem mudança detectável no peso corporal), então não prometa efeito sobre a balança com base só nisso.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/41314613/",
      fonte: {
        autores: "Forde e cols.",
        revista: "The American Journal of Clinical Nutrition (AJCN)",
        ano: "2026",
        desenho: "Ensaio clínico randomizado cruzado (crossover), com alimentação ad libitum controlada ao longo de 2 dietas de 14 dias",
        amostra: "41 adultos; duas dietas de 14 dias cada (textura associada a ingestão rápida vs. lenta, ambas com mais de 90% da energia proveniente de alimentos ultraprocessados)",
        pubmed: "41314613",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Estudos anteriores já mostravam que comer mais rápido aumenta a ingestão calórica em uma única refeição. Faltava saber se esse efeito se mantém por semanas, dentro de uma dieta baseada majoritariamente em ultraprocessados, ou se o corpo 'se adapta' e o efeito desaparece." },
        { h: "Como o estudo foi feito", p: "41 adultos receberam, em ordem cruzada, duas dietas de 14 dias compostas por mais de 90% de alimentos ultraprocessados, equivalentes em densidade energética e porções oferecidas — a diferença principal era a textura dos alimentos, que naturalmente acelera ou desacelera a mastigação. A ingestão foi medida de forma ad libitum (o quanto a pessoa realmente escolheu comer)." },
        { h: "O que foi encontrado", p: "Na dieta de textura que reduzia a velocidade de mastigação, os participantes ingeriram, em média, cerca de 369 kcal/dia menos do que na dieta de textura que acelerava a mastigação — e essa diferença não diminuiu ao longo das duas semanas. Não houve diferença de peso corporal entre as duas dietas nesse período de 14 dias." },
        { h: "O que isso não responde", p: "A amostra é pequena (41 pessoas) e o acompanhamento é de apenas duas semanas — tempo curto demais para que uma diferença de peso apareça mesmo com a redução calórica observada. Também não se sabe se o efeito se mantém em dietas mais variadas (não majoritariamente ultraprocessadas) ou por períodos mais longos." },
        { h: "Na prática do consultório", p: "Pode ser uma ferramenta comportamental adicional — por exemplo, sugerir versões mais firmes de alimentos que o paciente já consome no dia a dia — mas não prometa perda de peso com base neste estudo (que não mostrou diferença de peso em 2 semanas) nem substitua a orientação central de reduzir a proporção de ultraprocessados na dieta, que continua sendo a prioridade com maior corpo de evidência." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dieta-mediterranea-microbiota-risco-cardiometabolico",
      categoria: "Microbiota",
      areas: ["Microbiota", "Cardiometabólico"],
      data: "03 nov 2025",
      title: "Meta-análise de 9 ECRs: dieta mediterrânea melhora HbA1c, LDL e triglicerídeos em adultos de risco cardiometabólico, com mudanças apenas descritivas na microbiota intestinal",
      resumo: "Revisão sistemática com meta-análise de 9 ECRs (1.337 participantes) comparou dietas no padrão mediterrâneo a dietas-controle em adultos com risco aumentado de diabetes tipo 2 ou doença cardiovascular; houve redução significativa de HbA1c (diferença média -0,18%; IC95% -0,35 a -0,01) e melhora de LDL-colesterol e triglicerídeos, sem efeito significativo sobre glicemia de jejum, insulina, HOMA-IR, colesterol total ou HDL, enquanto os dados de microbiota — sintetizados apenas de forma descritiva, não estatisticamente agrupada, por grande heterogeneidade de métodos entre os estudos — mostraram aumento da diversidade alfa e maior presença de táxons como Akkermansia muciniphila e Roseburia spp.",
      mudou: "Reforça, com base em ECRs agrupados, que a dieta mediterrânea melhora marcadores metabólicos relevantes (HbA1c, LDL, triglicerídeos) neste público de risco, mas evidencia que a ligação causal entre as alterações na microbiota e esses benefícios metabólicos ainda não pode ser tratada como estabelecida — os próprios autores só conseguiram sintetizar os dados de microbiota de forma descritiva.",
      aplicar: "Pode-se recomendar o padrão mediterrâneo com razoável confiança para melhorar HbA1c e perfil lipídico em pacientes de risco cardiometabólico, mas evite, na conversa com o paciente, atribuir esse benefício diretamente a 'mudanças na microbiota' como se fosse um mecanismo comprovado — essa parte da evidência ainda é qualitativa/exploratória, não um achado causal consolidado.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/41381307/",
      fonte: {
        autores: "Lauria e cols.",
        revista: "Nutrition, Metabolism and Cardiovascular Diseases",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados (protocolo PROSPERO CRD42023428016)",
        amostra: "9 ECRs; 1.337 participantes adultos com risco aumentado de diabetes tipo 2 ou doença cardiovascular",
        doi: "10.1016/j.numecd.2025.104433",
        pubmed: "41381307",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A dieta mediterrânea já é associada a menor risco cardiometabólico, e estudos menores sugeriam que parte desse efeito passaria por mudanças na microbiota intestinal. Faltava reunir os ensaios clínicos randomizados disponíveis para checar, ao mesmo tempo, marcadores metabólicos e microbiota em pessoas de risco para diabetes tipo 2 e doença cardiovascular." },
        { h: "Como o estudo foi feito", p: "Os autores buscaram em cinco bases de dados (até outubro de 2024) ensaios clínicos randomizados que comparassem dietas no padrão mediterrâneo a dietas-controle em adultos de risco cardiometabólico, reunindo 9 estudos com 1.337 participantes. Os desfechos metabólicos foram agrupados estatisticamente; os de microbiota, medidos de formas muito diferentes entre os estudos, foram descritos de forma qualitativa." },
        { h: "O que foi encontrado", p: "A dieta mediterrânea reduziu significativamente a HbA1c (diferença média -0,18%; IC95% -0,35 a -0,01) e melhorou LDL-colesterol e triglicerídeos versus controle, sem diferença significativa em glicemia de jejum, insulina, HOMA-IR, colesterol total ou HDL. Na análise descritiva da microbiota, os estudos relataram aumento da diversidade alfa e maior abundância de táxons como Akkermansia muciniphila e Roseburia spp." },
        { h: "O que isso não responde", p: "Como os dados de microbiota não foram agrupados estatisticamente (métodos de sequenciamento e relato de táxons muito variados entre os estudos), não é possível afirmar que a mudança na microbiota seja causa das melhoras metabólicas — pode ser apenas uma alteração associada. Os próprios autores pedem estudos mais longos e abordagens multi-ômicas." },
        { h: "Na prática do consultório", p: "Use a dieta mediterrânea como recomendação com bom suporte de ECRs para melhorar HbA1c e lipídios em pacientes de risco cardiometabólico, mas seja cauteloso ao explicar o 'porquê' ao paciente — atribuir o benefício à microbiota ainda é uma hipótese exploratória, não um mecanismo comprovado." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creatina-marcadores-inflamatorios-meta-analise",
      categoria: "Suplementação",
      areas: ["Suplementação", "Desempenho Físico"],
      data: "19 fev 2026",
      title: "Meta-análise de ECRs não encontra efeito anti-inflamatório consistente da suplementação de creatina em humanos",
      resumo: "Revisão sistemática com meta-análise de 8 ensaios clínicos randomizados, duplo-cegos e controlados por placebo avaliou o efeito da suplementação de creatina sobre marcadores inflamatórios (PCR, IL-6, IL-1β, TNF-α e PGE2); não houve redução significativa da PCR, nem no efeito agudo (SMD 0,32; p=0,30) nem no crônico (SMD -0,11; IC95% -0,69 a 0,48; p=0,73), tampouco da IL-6 (SMD -0,06; IC95% -0,64 a 0,53; p=0,84).",
      mudou: "Contesta a ideia, popular entre praticantes de atividade física, de que a creatina teria efeito anti-inflamatório relevante em humanos — a evidência atual de ECRs não sustenta essa alegação, ainda que a creatina continue com evidência sólida para desempenho e força muscular (desfecho fora do escopo desta revisão).",
      aplicar: "Ao conversar com pacientes que suplementam creatina esperando benefício anti-inflamatório (ex.: recuperação pós-exercício), explique que a evidência atual de ECRs não confirma esse efeito sobre PCR e IL-6 — a indicação de creatina deve continuar sendo baseada em desempenho físico e força, não em um suposto efeito anti-inflamatório.",
      evidencia: 5,
      link: "https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2026.1743603/full",
      fonte: {
        autores: "Grupo de pesquisa da Unesp (Marília), com apoio da FAPESP",
        revista: "Frontiers in Immunology",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados, duplo-cegos, controlados por placebo, registrada no PROSPERO (CRD420251027784)",
        amostra: "8 ECRs em humanos (populações saudáveis, atléticas e clínicas)",
        doi: "10.3389/fimmu.2026.1743603",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A creatina é amplamente usada para ganho de força e desempenho, e circula a ideia de que também teria efeito anti-inflamatório. Os autores quiseram reunir os ensaios clínicos randomizados e controlados por placebo que testaram esse efeito especificamente sobre marcadores inflamatórios no sangue." },
        { h: "Como o estudo foi feito", p: "Foram incluídos 8 ensaios clínicos randomizados, duplo-cegos e controlados por placebo, em populações saudáveis, atléticas e clínicas, avaliando marcadores como PCR, IL-6, IL-1β, TNF-α e PGE2, tanto em contextos agudos (pós-exercício) quanto crônicos (suplementação prolongada)." },
        { h: "O que foi encontrado", p: "Não houve redução significativa da PCR, nem no efeito agudo (SMD 0,32; p=0,30) nem no crônico (SMD -0,11; IC95% -0,69 a 0,48; p=0,73), e também não houve redução significativa da IL-6 (SMD -0,06; IC95% -0,64 a 0,53; p=0,84). Os autores notaram benefícios pontuais em contextos de exercício de endurance intenso, mas de forma inconsistente entre as populações estudadas." },
        { h: "O que isso não responde", p: "O número de ensaios incluídos é pequeno (8 estudos) e heterogêneo em população e protocolo, então não se exclui que subgrupos específicos (ex.: atletas de endurance) possam ter alguma resposta anti-inflamatória; a revisão também não avalia os efeitos já bem estabelecidos da creatina sobre força e desempenho, que não eram o foco aqui." },
        { h: "Na prática do consultório", p: "Continue recomendando creatina com base em sua evidência consolidada para força, massa muscular e desempenho, mas não a posicione como suplemento anti-inflamatório para o paciente — essa narrativa, popular nas redes sociais, não é sustentada pelos ECRs reunidos nesta revisão." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "jejum-intermitente-restricao-horaria-manutencao-peso-12-meses",
      categoria: "Obesidade",
      areas: ["Comportamental", "Clínica"],
      data: "18 jul 2026",
      title: "Horário da janela alimentar no jejum intermitente (16:8) influencia a manutenção da perda de peso 12 meses após o fim do programa, mostra ECR",
      resumo: "Seguimento de 12 meses de um ensaio clínico randomizado espanhol comparou, em 99 adultos de 30-60 anos com sobrepeso ou obesidade, quatro padrões de 12 semanas (horário habitual/controle, janela de 8h iniciada antes das 10h, janela de 8h iniciada após as 13h, e janela de 8h autosselecionada, todos com orientação de padrão mediterrâneo): um ano após o fim do programa (65 dos 99 participantes reavaliados), o grupo de horário habitual voltou a ganhar peso, enquanto os grupos de janela matinal e vespertina mantiveram a perda alcançada nas 12 semanas — mesmo com só cerca de 26% dos participantes ainda seguindo formalmente a restrição horária nesse momento.",
      mudou: "Sugere que o horário escolhido para a janela alimentar — não apenas a restrição horária em si — pode influenciar a manutenção da perda de peso no longo prazo, e que parte do benefício persiste mesmo entre quem abandona a restrição formal após o fim do programa.",
      aplicar: "Ao indicar jejum intermitente/restrição horária para manutenção de peso, considere orientar uma janela alimentar fixa (de manhã ou de tarde) em vez de deixar o horário totalmente livre — mas trate esse achado como preliminar: é uma análise secundária de um ensaio pequeno, com perda relevante de seguimento (65 de 99 participantes avaliados em 12 meses).",
      evidencia: 4,
      link: "https://doi.org/10.1016/j.clnu.2026.106706",
      fonte: {
        autores: "Camacho-Cardenosa e cols.",
        revista: "Clinical Nutrition",
        ano: "2026",
        desenho: "Análise secundária de ensaio clínico randomizado, com seguimento de 12 meses após intervenção de 12 semanas",
        amostra: "99 adultos de 30-60 anos com sobrepeso ou obesidade randomizados em 4 grupos (controle de horário habitual, janela de 8h matinal, janela de 8h vespertina, janela de 8h autosselecionada); 65 reavaliados no seguimento de 12 meses",
        doi: "10.1016/j.clnu.2026.106706",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Jejum intermitente com restrição horária da alimentação (time-restricted eating) costuma mostrar perda de peso ao final de programas de curto prazo, mas a dúvida recorrente é se esse resultado se mantém depois que o programa termina — e se o horário escolhido para a janela alimentar (mais cedo ou mais tarde no dia) faz diferença para essa manutenção." },
        { h: "Como o estudo foi feito", p: "Este é o seguimento de 12 meses de um ensaio clínico randomizado espanhol que, por 12 semanas, comparou quatro grupos em 99 adultos de 30-60 anos com sobrepeso ou obesidade: horário habitual de alimentação (controle), janela de 8 horas iniciada antes das 10h (early), janela de 8 horas iniciada depois das 13h (late), e janela de 8 horas escolhida livremente pelo participante (self-selected), todos com orientação de padrão alimentar mediterrâneo. Peso foi reavaliado 1 ano após o fim do programa, com 65 dos 99 participantes completando essa avaliação final." },
        { h: "O que foi encontrado", p: "Um ano após o fim das 12 semanas de intervenção, o grupo de horário habitual (controle) voltou a ganhar peso, enquanto os grupos de janela matinal (early) e vespertina (late) mantiveram a perda de peso alcançada durante o programa. Na reavaliação, apenas cerca de 26% dos participantes ainda seguiam formalmente a restrição horária — ainda assim, o benefício de peso persistiu nos grupos de horário fixo." },
        { h: "O que isso não responde", p: "É uma análise secundária de um ensaio pequeno (99 participantes randomizados, apenas 65 reavaliados em 12 meses), o que limita a precisão das estimativas e abre espaço para viés de quem permaneceu no seguimento. O estudo também não isola completamente o efeito do horário da janela do efeito da própria restrição calórica implícita na restrição horária." },
        { h: "Na prática do consultório", p: "Ao indicar jejum intermitente/restrição horária para manutenção de peso no longo prazo, considere orientar uma janela alimentar fixa (de manhã ou de tarde) em vez de deixar a escolha do horário totalmente livre — mas trate esse achado como hipótese-gerador, dado o tamanho pequeno da amostra e a perda relevante de seguimento, e continue individualizando a indicação pela rotina e preferência real do paciente." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mms-pre-natal-vs-ferro-folico-crescimento-infantil",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Pediatria"],
      data: "28 abr 2025",
      title: "Suplementação pré-natal com múltiplos micronutrientes melhora o tamanho ao nascer e o crescimento infantil até os 6 meses, frente a ferro e ácido fólico isolados",
      resumo: "Revisão sistemática com meta-análise de 19 ensaios clínicos randomizados comparou suplementação pré-natal com múltiplos micronutrientes (MMS) com a suplementação padrão de ferro e ácido fólico (IFA): MMS associou-se a maior comprimento/estatura e peso do nascimento até os 6 meses, maior perímetro cefálico até os 12 meses e maior circunferência do braço até os 3 meses, mas as diferenças não persistiram além desses períodos.",
      mudou: "Reforça a suplementação pré-natal com múltiplos micronutrientes — e não apenas ferro e ácido fólico isolados — como estratégia com respaldo de meta-análise para melhorar o tamanho ao nascer e o crescimento inicial do bebê, ainda que esse ganho se atenue com o tempo após os primeiros meses.",
      aplicar: "Em gestantes atendidas em contextos onde a suplementação de múltiplos micronutrientes está disponível e indicada (conforme diretriz local e prescrição médica), reforce a adesão a essa suplementação em vez de apenas ferro e ácido fólico isolados, e, quando possível, discuta a continuidade de algum suporte nutricional no pós-parto para tentar sustentar o ganho de crescimento do bebê além dos 6 meses.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/40306386/",
      fonte: {
        autores: "Gomes e cols.",
        revista: "The American Journal of Clinical Nutrition (AJCN)",
        ano: "2025",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados, registrada no PROSPERO (CRD42024551864)",
        amostra: "19 ECRs incluídos, comparando suplementação pré-natal com múltiplos micronutrientes (MMS) vs. ferro e ácido fólico (IFA), com desfechos de tamanho ao nascer e crescimento até 24 meses de idade",
        doi: "10.1016/j.ajcnut.2025.04.022",
        pubmed: "40306386",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Suplementos pré-natais de múltiplos micronutrientes (MMS) são promovidos como alternativa à suplementação padrão de ferro e ácido fólico (IFA) isolados na gestação, mas faltava uma síntese atualizada, reunindo os ensaios randomizados disponíveis, sobre se o MMS de fato melhora o tamanho do bebê ao nascer e o crescimento infantil nos primeiros dois anos de vida, frente ao IFA isolado." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 19 ensaios clínicos randomizados que compararam suplementação pré-natal com múltiplos micronutrientes (MMS) à suplementação padrão de ferro e ácido fólico (IFA), avaliando medidas antropométricas do bebê ao nascer e em visitas de acompanhamento até os 24 meses de idade (comprimento/estatura, peso, perímetro cefálico e circunferência do braço)." },
        { h: "O que foi encontrado", p: "Comparado ao IFA isolado, o MMS pré-natal associou-se a maior comprimento e peso do nascimento até os 6 meses de idade, maior crescimento do perímetro cefálico até os 12 meses, e maior circunferência do braço até os 3 meses — além de menor risco de retardo de crescimento (stunting) e baixo peso nos primeiros meses. Os autores concluem que o benefício do MMS sobre o tamanho ao nascer e o crescimento infantil é mais consistente até cerca de 6 meses de idade, atenuando-se depois disso." },
        { h: "O que isso não responde", p: "A revisão reúne ensaios com populações, doses e contextos nutricionais variados (incluindo diferentes prevalências de baixo peso ao nascer), e o próprio padrão de atenuação do benefício ao longo do tempo sugere que a continuidade da suplementação (inclusive no pós-parto) pode ser necessária para sustentar o ganho — algo que a revisão não testa diretamente como intervenção própria." },
        { h: "Na prática do consultório", p: "Em serviços e contextos onde a suplementação de múltiplos micronutrientes na gestação está disponível e indicada (sempre seguindo diretriz local e prescrição médica), esta meta-análise reforça a prioridade do MMS sobre o ferro e ácido fólico isolados para apoiar o tamanho ao nascer e o crescimento inicial do bebê — e abre a discussão sobre manter algum suporte nutricional também no pós-parto, já que o benefício isolado da suplementação pré-natal tende a se atenuar depois dos 6 meses." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "ingestao-proteica-baixa-dialise-drc-coorte",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "28 abr 2026",
      title: "Ingestão proteica abaixo de 1,0 g/kg/dia associa-se a menor risco de desfechos renais e de diálise em doença renal crônica não dialítica, mostra coorte israelense de 15 anos",
      resumo: "Estudo de coorte retrospectivo com 1.441 adultos com doença renal crônica (DRC) não dialítica, estágios 3-4, acompanhados por até 15 anos no sistema de saúde Clalit (Israel), estimou a ingestão proteica por excreção de nitrogênio ureico em urina de 24h; na análise pareada por escore de propensão, ingestão proteica abaixo de 1,0 g/kg/dia associou-se a menor risco do desfecho composto (queda ≥50% do TFGe, início de diálise ou óbito; razão de risco 0,77, IC95% 0,62-0,97; ajustada 0,75, IC95% 0,60-0,93) e, isoladamente, a menor risco de iniciar diálise (razão de risco 0,65, IC95% 0,42-0,99), sem diferença significativa na velocidade de queda do TFGe nem em marcadores nutricionais.",
      mudou: "Em dados observacionais robustos e de seguimento longo, reforça que uma restrição proteica moderada (abaixo de 1,0 g/kg/dia) pode se associar a menor necessidade de diálise em DRC avançada não dialítica sem sinal de piora nutricional — mas é um estudo observacional, não um ensaio randomizado, e não houve efeito estatisticamente significativo isolado sobre a velocidade de queda do TFGe.",
      aplicar: "No acompanhamento de pacientes com DRC estágios 3-4, reforce junto à equipe nefrológica metas de ingestão proteica moderada (em torno de 0,8-1,0 g/kg/dia) como parte do plano para retardar a necessidade de diálise, mas monitore de perto marcadores nutricionais (albumina, peso, massa muscular) e individualize a conduta, já que o desenho observacional não permite afirmar causalidade.",
      evidencia: 3,
      link: "https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2848230",
      fonte: {
        autores: "Beberashvili e cols.",
        revista: "JAMA Network Open",
        ano: "2026",
        desenho: "Estudo de coorte retrospectivo com pareamento por escore de propensão",
        amostra: "1.441 adultos com DRC não dialítica estágios 3-4, dados do Clalit Health Services, Israel, seguimento de até 15 anos",
        doi: "10.1001/jamanetworkopen.2026.9575",
        pubmed: "42048078",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A quantidade ideal de proteína na dieta de pacientes com doença renal crônica (DRC) avançada ainda divide a literatura: restringir demais pode piorar o estado nutricional, mas ingestões mais altas são associadas, em alguns estudos, a progressão mais rápida da doença. Este estudo buscou avaliar, com dados de vida real e seguimento muito longo, se a ingestão proteica efetivamente consumida se associa a desfechos renais — incluindo início de diálise — em adultos com DRC não dialítica, estágios 3 e 4." },
        { h: "Como o estudo foi feito", p: "Estudo de coorte retrospectivo usou dados do sistema de saúde Clalit (Israel) para acompanhar 1.441 adultos com DRC estágios 3-4 por até 15 anos. A ingestão proteica foi estimada de forma objetiva pela excreção de nitrogênio ureico em urina de 24 horas, normalizada pelo peso corporal, e os participantes foram classificados em ingestão mais baixa (<1,0 g/kg/dia) ou mais alta (≥1,0 g/kg/dia). Pareamento por escore de propensão equilibrou características basais entre os grupos para a análise comparativa principal." },
        { h: "O que foi encontrado", p: "No grupo pareado, a ingestão proteica abaixo de 1,0 g/kg/dia associou-se a menor risco do desfecho composto (queda de pelo menos 50% da taxa de filtração glomerular estimada, início de diálise de longo prazo ou óbito por qualquer causa; razão de risco 0,77, IC95% 0,62-0,97, ajustada para 0,75, IC95% 0,60-0,93), impulsionado principalmente por menor risco de iniciar diálise (razão de risco de 0,65, IC95% 0,42-0,99). Não houve diferença estatisticamente significativa entre os grupos na velocidade de queda da função renal nem em marcadores nutricionais — ou seja, sem sinal de que a ingestão mais baixa prejudicou o estado nutricional." },
        { h: "O que isso não responde", p: "Por ser um estudo observacional, mesmo com pareamento por escore de propensão, não é possível afirmar causalidade — pacientes que naturalmente comem menos proteína podem diferir de outras formas não totalmente capturadas pelo pareamento. O estudo também não encontrou efeito estatisticamente significativo isolado sobre a velocidade de queda da função renal, o que concentra a força da conclusão principalmente no desfecho de início de diálise." },
        { h: "Na prática do consultório", p: "No acompanhamento de pacientes com DRC estágios 3-4, este estudo reforça — sem substituir a individualização caso a caso — a relevância de discutir metas de ingestão proteica moderada (em torno de 0,8 a 1,0 g/kg/dia) junto à equipe nefrológica como parte do plano para retardar a necessidade de diálise, sempre monitorando de perto marcadores de estado nutricional (albumina, peso, força/massa muscular) para evitar o risco oposto de desnutrição proteico-calórica." }
      ]
    }
  ]
};

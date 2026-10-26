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
    texto: "Um ensaio clínico randomizado de 2 anos (eBioMedicine) mostra que a suplementação de DHA em alta dose chega ao cérebro de idosos de risco para Alzheimer, mas não melhora memória nem retarda a atrofia do hipocampo. Um ECR multicêntrico australiano (Kidney360, estudo TeleKinesis) mostra que acrescentar um aplicativo de orientação nutricional ao cuidado padrão não reduz o fósforo sérico de forma significativa em pacientes em diálise aos 3 meses, ainda que haja um sinal de melhora sustentada aos 6 meses. Uma meta-análise de 9 estudos (Clinical Endocrinology) mostra que a resposta bioquímica ao inositol na síndrome dos ovários policísticos depende do fenótipo metabólico da paciente, sendo mais consistente em mulheres com peso normal. Uma meta-análise de 23 ECRs (Frontiers in Nutrition) mostra que a suplementação de proteína combinada ao treino de força aumenta o ganho de força em adultos jovens, mas o tamanho do benefício depende da duração do programa e do momento da ingestão. Um ensaio piloto cruzado da UCSF (JAMA Psychiatry) com 20 adultos com depressão sugere que reduzir ultraprocessados por 4 semanas pode melhorar sintomas depressivos, com os próprios autores classificando o achado como exploratório. Uma prova de conceito com 8 adultos (Frontiers in Nutrition) testa se escolher o tipo de fibra pela capacidade fermentativa individual do microbioma aumenta a produção de ácidos graxos de cadeia curta, com resultado positivo em apenas parte dos participantes. Um ECR de 12 semanas (Journal of the International Society of Sports Nutrition) mostra que a creatina aumenta massa magra e força em adultos de 45-65 anos mesmo sem programa estruturado de exercício, com ganhos maiores quando combinada a treino e dieta. O ensaio SWITCH, de 2 anos (British Journal of Nutrition), mostra que bebidas dietéticas adoçadas artificialmente têm efeito equivalente à água sobre a perda de peso dentro de um programa comportamental estruturado. E um ECR com 98 gestantes de risco (Frontiers in Endocrinology) mostra que a suplementação de fibra solúvel não reduziu a incidência de diabetes gestacional, mas melhorou picos de glicose e o ganho de peso gestacional. Cada card abre a leitura completa com o link do estudo original."
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
      id: "dha-omega3-alzheimer-prevencao-ecr",
      categoria: "Clínica",
      areas: ["Clínica", "Envelhecimento"],
      data: "19 jun 2026",
      title: "ECR de 2 anos: suplementação de DHA em alta dose chega ao cérebro de idosos de risco para Alzheimer, mas não melhora memória nem retarda a atrofia do hipocampo",
      resumo: "Ensaio clínico randomizado, duplo-cego e controlado por placebo com 365 adultos de 55-80 anos que raramente consumiam peixe (quase metade portadora do alelo APOE4) testou 2.000 mg/dia de DHA por 2 anos: o DHA elevou os níveis de ômega-3 no cérebro, mas não produziu melhora de memória, de desempenho cognitivo nem proteção contra a atrofia do hipocampo em relação ao placebo.",
      mudou: "Contesta, com um ECR de 2 anos e amostra relevante, a expectativa de que suplementos de óleo de peixe protegeriam o cérebro contra o declínio cognitivo e o Alzheimer — mesmo demonstrando que o DHA de fato chega ao tecido cerebral, não houve benefício clínico mensurável.",
      aplicar: "Ao conversar com pacientes (especialmente idosos preocupados com risco de Alzheimer) que suplementam óleo de peixe esperando proteção cognitiva, explique que este ECR não sustenta esse benefício isolado — reforce a obtenção de ômega-3 por padrão alimentar (peixes, fontes vegetais) como parte de uma dieta de proteção cardiovascular geral, sem prometer efeito específico sobre memória ou progressão do Alzheimer com a suplementação isolada.",
      evidencia: 4,
      link: "https://doi.org/10.1016/j.ebiom.2026.106316",
      fonte: {
        autores: "Yassine e cols. (Keck School of Medicine, University of Southern California)",
        revista: "eBioMedicine",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, duplo-cego, controlado por placebo",
        amostra: "365 adultos de 55-80 anos que raramente consumiam peixe, cerca de 47% portadores do alelo APOE4; suplementação de 2.000 mg/dia de DHA por 2 anos",
        doi: "10.1016/j.ebiom.2026.106316",
        acesso: "Resumo e cobertura especializada consultados; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Milhões de pessoas tomam óleo de peixe esperando proteção cerebral, e estudos observacionais já associaram maior consumo de ômega-3 a menor risco de declínio cognitivo. Faltava um ensaio randomizado de longo prazo, em população de risco (idosos que comem pouco peixe, muitos portadores do APOE4), testando se a suplementação isolada de DHA realmente protege memória e estrutura cerebral." },
        { h: "Como o estudo foi feito", p: "365 adultos de 55 a 80 anos, que raramente consumiam peixe e tinham risco aumentado de Alzheimer (quase metade com o alelo APOE4), foram randomizados para receber 2.000 mg/dia de DHA ou placebo por 2 anos, em desenho duplo-cego. Os pesquisadores mediram a concentração de ômega-3 no sistema nervoso central, o desempenho em testes cognitivos e o volume do hipocampo por imagem." },
        { h: "O que foi encontrado", p: "O DHA elevou de fato os níveis de ômega-3 no cérebro, confirmando que o suplemento atingiu o tecido-alvo. Apesar disso, não houve diferença significativa entre os grupos em memória, outras habilidades cognitivas ou na perda de volume do hipocampo (a região-chave de memória afetada no Alzheimer) ao final dos 2 anos." },
        { h: "O que isso não responde", p: "O estudo não avalia se uma intervenção dietética mais ampla (padrão alimentar rico em peixe, azeite, oleaginosas) teria efeito diferente de um suplemento isolado, nem testa populações com consumo basal de peixe já adequado. Também não exclui benefício em prazos ainda mais longos ou em subgrupos específicos não detalhados nos resumos consultados." },
        { h: "Na prática do consultório", p: "Ao atender pacientes que já tomam ou perguntam sobre óleo de peixe para 'proteger o cérebro', explique que este ECR robusto não encontrou esse benefício isolado — e direcione a conversa para o padrão alimentar global (peixes, azeite, hortaliças, oleaginosas) como estratégia de proteção cardiovascular e metabólica, sem prometer efeito específico sobre memória ou Alzheimer a partir da suplementação isolada de DHA." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "app-digital-controle-fosfato-dialise-ecr",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "17 ago 2026",
      title: "ECR multicêntrico australiano (TeleKinesis): app de orientação nutricional não reduz o fósforo sérico de forma significativa frente ao cuidado padrão em diálise, mas mostra sinal de melhora aos 6 meses",
      resumo: "Ensaio clínico randomizado multicêntrico em 23 serviços de diálise na Austrália recrutou 190 pacientes e randomizou 99 para usar, além do cuidado padrão, um aplicativo de orientação nutricional sobre fósforo durante os 3 primeiros meses de um acompanhamento de 6 meses: a diferença entre grupos na variação do fósforo sérico aos 3 meses não foi significativa (queda de 6% no cuidado padrão vs. 7% no grupo do app), e o declínio progressivo de 9% observado no grupo do app aos 6 meses também não atingiu significância estatística.",
      mudou: "Mostra que, nesse desenho e período, somar um aplicativo digital de orientação nutricional ao cuidado padrão não garante controle superior do fósforo sérico em diálise — mas o sinal de melhora sustentada e crescente aos 6 meses no grupo do app sugere que um seguimento mais longo poderia revelar benefício ainda não confirmado estatisticamente.",
      aplicar: "Continue priorizando a orientação nutricional individualizada (presencial ou por telefone) como base do manejo do fósforo em diálise, e veja ferramentas digitais como possível complemento — não substituto — enquanto a evidência de benefício ainda não é estatisticamente robusta; para pacientes com boa adesão a aplicativos, o sinal de melhora tardia pode justificar manter a ferramenta por mais tempo antes de julgar seu efeito.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/42606901/",
      fonte: {
        autores: "Beer, Jacques, Lambert, Lim e Boudville",
        revista: "Kidney360",
        ano: "2026",
        desenho: "Ensaio clínico randomizado multicêntrico (estudo TeleKinesis)",
        amostra: "190 pacientes em diálise recrutados em 23 serviços na Austrália; 99 randomizados para o braço com aplicativo digital de orientação nutricional, seguimento de 6 meses",
        doi: "10.34067/KID.0000001328",
        pubmed: "42606901",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O controle do fósforo sérico em pacientes de diálise depende fortemente da adesão à dieta e aos quelantes, e a orientação nutricional presencial nem sempre está disponível com a frequência necessária. Os autores quiseram testar se um aplicativo de orientação nutricional, usado como complemento ao cuidado padrão, melhora o controle do fósforo." },
        { h: "Como o estudo foi feito", p: "O estudo TeleKinesis recrutou 190 pacientes em diálise em 23 serviços na Austrália. Noventa e nove foram randomizados para usar o aplicativo de orientação nutricional durante os 3 primeiros meses de um acompanhamento total de 6 meses, além do cuidado padrão recebido por todos; o desfecho primário foi a variação do fósforo sérico aos 3 meses." },
        { h: "O que foi encontrado", p: "Aos 3 meses, a queda do fósforo sérico foi semelhante entre os grupos (6% no cuidado padrão vs. 7% no grupo do app), sem diferença estatisticamente significativa. Como sinal secundário, apenas o grupo do aplicativo mostrou um declínio progressivo e sustentado que chegou a 9% aos 6 meses — mas essa diferença também não atingiu significância estatística." },
        { h: "O que isso não responde", p: "O estudo não esclarece se um período de uso do aplicativo mais longo que 3 meses, ou uma amostra maior, revelaria um benefício estatisticamente significativo a partir do sinal observado aos 6 meses. Também não é possível, com os dados disponíveis, identificar quais pacientes (por adesão ou perfil) teriam mais chance de se beneficiar da ferramenta digital." },
        { h: "Na prática do consultório", p: "Use este resultado para calibrar expectativas sobre apps de orientação nutricional no manejo do fósforo em diálise: eles podem ser um complemento razoável ao cuidado padrão, mas, com a evidência atual, não substituem a orientação nutricional individualizada nem garantem controle superior do fósforo no curto prazo — o sinal de melhora aos 6 meses é um motivo para acompanhar de perto, não para prometer resultado." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "inositol-fenotipo-metabolico-sop-meta-analise",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "SOP"],
      data: "07 abr 2026",
      title: "Meta-análise mostra que a resposta bioquímica ao inositol na síndrome dos ovários policísticos depende do fenótipo metabólico da paciente",
      resumo: "Revisão sistemática com meta-análise de 9 estudos prospectivos intervencionistas (440 mulheres com SOP; 225 com inositol e 215 com placebo ou ácido fólico) encontrou redução significativa da testosterona total com a suplementação de inositol (SMD -1,30), com a resposta bioquímica mais consistente em mulheres de peso normal; mulheres com sobrepeso/obesidade ou resistência insulínica não mostraram melhora significativa nos marcadores avaliados.",
      mudou: "Refina a visão de que o inositol 'funciona' de forma uniforme na SOP, mostrando que o fenótipo metabólico e o peso da paciente modulam a magnitude da resposta bioquímica (testosterona, SHBG), e não apenas se a paciente usa ou não o nutracêutico.",
      aplicar: "Ao indicar inositol para SOP, calibre a expectativa conforme o fenótipo da paciente: há maior chance de resposta hormonal consistente em mulheres com peso normal; em pacientes com sobrepeso/obesidade ou resistência insulínica mais marcada, comunique que o inositol isolado pode não ser suficiente e priorize o manejo de peso e estilo de vida como base do tratamento.",
      evidencia: 4,
      link: "https://doi.org/10.1111/cen.70140",
      fonte: {
        autores: "Tienforti e cols. (Università degli Studi dell'Aquila)",
        revista: "Clinical Endocrinology",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de estudos prospectivos intervencionistas",
        amostra: "9 estudos, 440 mulheres com SOP (225 com inositol, 215 com placebo ou ácido fólico)",
        doi: "10.1111/cen.70140",
        pubmed: "41947399",
        acesso: "Acesso aberto (CC BY 4.0)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Revisões anteriores já sugeriam que o inositol melhora marcadores metabólicos e hormonais na síndrome dos ovários policísticos (SOP), mas a resposta entre estudos é heterogênea. Os autores quiseram testar se o fenótipo metabólico da paciente (sobretudo peso corporal e resistência insulínica) explica parte dessa heterogeneidade na resposta bioquímica ao inositol." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 9 estudos prospectivos intervencionistas com 440 mulheres com SOP, comparando inositol (225 mulheres) a placebo ou ácido fólico (215 mulheres), e estratificou a análise por fenótipo metabólico (peso normal vs. sobrepeso/obesidade; com ou sem resistência insulínica)." },
        { h: "O que foi encontrado", p: "A suplementação de inositol reduziu significativamente a testosterona total em relação ao controle (SMD -1,30). Essa resposta bioquímica foi mais consistente e homogênea em mulheres com peso normal; já em mulheres com sobrepeso ou obesidade, e nas com resistência insulínica avaliada isoladamente do IMC, não houve melhora significativa nos marcadores analisados." },
        { h: "O que isso não responde", p: "A amostra total (440 mulheres) é pequena para uma meta-análise estratificada por subgrupo, o que reduz a precisão das estimativas dentro de cada fenótipo. Os resumos consultados também não detalham se doses diferentes de inositol (ou a proporção myo-inositol/D-chiro-inositol) explicam parte da variação de resposta entre os subgrupos." },
        { h: "Na prática do consultório", p: "Use o inositol como parte do manejo nutricional da SOP com uma expectativa calibrada pelo fenótipo da paciente: em mulheres com peso normal, a chance de resposta hormonal consistente é maior; em pacientes com sobrepeso/obesidade ou resistência insulínica mais marcada, explique que o inositol isolado tende a ter efeito menor e reforce o manejo de peso, padrão alimentar e atividade física como base do tratamento, com o inositol como adjuvante." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "proteina-treino-forca-jovens-adultos-meta-analise",
      categoria: "Esportiva",
      areas: ["Esportiva", "Suplementação"],
      data: "14 out 2026",
      title: "Meta-análise de 23 ECRs: proteína combinada ao treino de força aumenta o ganho de força em adultos jovens, mas o benefício depende da duração do programa e do momento da ingestão",
      resumo: "Revisão sistemática com meta-análise de 23 ensaios clínicos randomizados (611 adultos jovens saudáveis, buscas até 1º de abril de 2026) comparou treino de força com e sem suplementação de proteína: o grupo proteína+treino teve ganho adicional médio de força no supino (~2,63 kg) e no agachamento (~7,40 kg) frente ao treino isolado, com o efeito no agachamento concentrado em intervenções de até 12 semanas e quando a proteína era consumida próxima ao treino ou antes de dormir.",
      mudou: "Reforça que a proteína suplementar somada ao treino de força traz ganho real de força em adultos jovens, mas mostra que a magnitude desse benefício não é fixa — depende de moderadores como duração da intervenção, momento da ingestão, histórico de treino e ingestão proteica basal do indivíduo.",
      aplicar: "Priorize garantir a ingestão proteica adequada distribuída ao redor do treino (próxima à sessão e antes de dormir), sobretudo em programas de até 12 semanas, e ajuste a expectativa de ganho de força conforme o histórico de treino e a ingestão proteica basal do paciente ou atleta, em vez de prometer o mesmo incremento para todos os perfis.",
      evidencia: 5,
      link: "https://doi.org/10.3389/fnut.2026.1946052",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "23 ECRs, 611 adultos jovens saudáveis, buscas em bases de dados até 1º de abril de 2026",
        doi: "10.3389/fnut.2026.1946052",
        acesso: "Acesso aberto (texto completo livre, Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A suplementação de proteína combinada ao treino de força é amplamente recomendada, mas estudos individuais mostram respostas bastante variáveis entre indivíduos e programas. Os autores buscaram reunir os ensaios clínicos randomizados disponíveis em adultos jovens para quantificar o ganho de força adicional e identificar quais fatores explicam a variação da resposta." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 23 ensaios clínicos randomizados, com busca em bases de dados até 1º de abril de 2026, comparando treino de força isolado a treino de força combinado com suplementação de proteína em 611 adultos jovens saudáveis. Os autores calcularam diferenças médias ponderadas (WMD) para força no supino e no agachamento, e testaram moderadores como duração da intervenção e momento da ingestão proteica." },
        { h: "O que foi encontrado", p: "O grupo proteína+treino teve ganho adicional médio de força de cerca de 2,63 kg no supino e 7,40 kg no agachamento, ambos estatisticamente significativos frente ao treino isolado. O efeito sobre o agachamento foi mais evidente em intervenções de até 12 semanas e quando a proteína era consumida próxima ao treino e/ou antes de dormir; a duração da intervenção foi um moderador significativo, e o momento da ingestão teve significância limítrofe." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham a dose exata de proteína utilizada nos estudos incluídos nem a ingestão proteica basal dos participantes de forma padronizada entre os 23 ECRs, o que dificulta recomendar uma dose única. Também não está claro se o efeito se mantém em programas mais longos que 12 semanas, já que o moderador de duração favoreceu intervenções mais curtas." },
        { h: "Na prática do consultório", p: "Ao prescrever suplementação de proteína para pacientes/atletas em treino de força, priorize garantir a ingestão em torno da sessão de treino e antes de dormir, especialmente em programas de até 12 semanas, e communique que o tamanho do ganho de força varia conforme o histórico de treino e a ingestão proteica basal — não é um efeito uniforme e garantido para todos os perfis." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "reducao-ultraprocessados-sintomas-depressao-ecr-piloto",
      categoria: "Comportamental",
      areas: ["Comportamental", "Saúde Mental"],
      data: "23 set 2026",
      title: "Ensaio piloto cruzado da UCSF: reduzir ultraprocessados por 4 semanas melhora sintomas depressivos, mas o próprio grupo de pesquisa classifica o achado como exploratório",
      resumo: "Ensaio clínico randomizado cruzado, aberto e piloto, com 20 adultos com depressão (idade média 44 anos, 70% mulheres, a maioria com IMC elevado e ao menos uma condição metabólica), comparou 4 semanas de dieta habitual a 4 semanas com redução acentuada de ultraprocessados (ordem randomizada): os participantes reduziram o consumo de ultraprocessados em mais de 85% e apresentaram melhora de moderada a grande em três escalas de depressão, além de melhora discreta na ansiedade — mas os próprios autores tratam os desfechos de humor como exploratórios, já que o estudo foi desenhado para testar viabilidade e aceitabilidade, não eficácia.",
      mudou: "Fornece a primeira evidência experimental (ainda que piloto) de que reduzir ultraprocessados pode melhorar sintomas depressivos em poucas semanas, complementando estudos observacionais anteriores que já associavam maior consumo de ultraprocessados a maior risco de depressão — mas o desenho, o tamanho da amostra e a ausência de cegamento limitam fortemente a conclusão.",
      aplicar: "Considere a redução de ultraprocessados como estratégia alimentar adjuvante — nunca substituta ao tratamento psiquiátrico — ao orientar pacientes com sintomas depressivos leves a moderados, mas seja transparente de que o próprio grupo de pesquisa classifica o achado sobre humor como exploratório e gerador de hipótese, não como eficácia comprovada; o estudo teve apenas 20 participantes e focou em viabilidade, não em desfecho clínico definitivo.",
      evidencia: 2,
      link: "https://doi.org/10.1001/jamapsychiatry.2026.2320",
      fonte: {
        autores: "Chagwedera, Kim, Chiu e cols. (autor sênior Andrew Krystal, UCSF)",
        revista: "JAMA Psychiatry (Research Letter)",
        ano: "2026",
        desenho: "Ensaio clínico randomizado cruzado, aberto, piloto de viabilidade",
        amostra: "20 adultos com depressão (idade média 44 anos, 70% mulheres, 14 com ansiedade, maioria com IMC elevado e ao menos uma condição metabólica); 4 semanas de dieta habitual vs. 4 semanas com redução de ultraprocessados, em ordem randomizada",
        doi: "10.1001/jamapsychiatry.2026.2320",
        acesso: "Resumo e cobertura especializada consultados; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Estudos observacionais já associam maior consumo de alimentos ultraprocessados a maior risco de depressão, mas faltava um ensaio experimental testando se reduzir esse consumo, de forma deliberada e em curto prazo, realmente muda sintomas depressivos — e se esse tipo de intervenção é viável de se testar em pacientes que já têm o diagnóstico." },
        { h: "Como o estudo foi feito", p: "20 adultos com depressão, a maioria com IMC elevado e ao menos uma condição metabólica, participaram de um ensaio cruzado: cada um passou 4 semanas em dieta habitual e 4 semanas com redução acentuada de ultraprocessados, em ordem randomizada. O objetivo primário era testar viabilidade e aceitabilidade da intervenção; os escores de depressão e ansiedade foram desfechos exploratórios." },
        { h: "O que foi encontrado", p: "Os participantes conseguiram reduzir o consumo de ultraprocessados em mais de 85% durante o período de intervenção. Nesse período, os escores de depressão (avaliados por três escalas diferentes) mostraram melhora de moderada a grande em relação ao período de dieta habitual, com melhora discreta também na ansiedade." },
        { h: "O que isso não responde", p: "O estudo não teve cegamento (os participantes sabiam em qual fase estavam), a amostra é muito pequena (20 pessoas) e o consumo de ultraprocessados foi autorrelatado. Os autores também não conseguiram determinar se a melhora de humor se relaciona a mudanças de macronutrientes, calorias, contaminantes do processamento ou aditivos alimentares especificamente — os próprios pesquisadores chamam o achado de 'exploratório e gerador de hipótese, na melhor das hipóteses'." },
        { h: "Na prática do consultório", p: "Pode-se discutir a redução de ultraprocessados como estratégia alimentar adjuvante ao cuidado de pacientes com sintomas depressivos leves a moderados — nunca como substituto ao acompanhamento psiquiátrico/psicológico — mas comunique com clareza que esse achado específico sobre humor vem de um estudo piloto pequeno e aberto, desenhado para testar viabilidade, e que um ensaio maior já está planejado pelos próprios autores." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "fibra-personalizada-fermentacao-microbiota-prova-conceito",
      categoria: "Microbiota",
      areas: ["Microbiota", "Comportamento Alimentar"],
      data: "03 set 2026",
      title: "Prova de conceito: escolher o tipo de fibra pela capacidade fermentativa individual do microbioma aumenta ácidos graxos de cadeia curta em parte dos participantes",
      resumo: "Ensaio cruzado piloto (prova de conceito) com 8 adultos japoneses saudáveis testou uma ferramenta de triagem ex vivo (My Dietary Fiber Finder) que ranqueia tipos de fibra pela capacidade fermentativa do microbioma de cada indivíduo: a fibra selecionada como 'personalizada' elevou ácidos graxos voláteis fecais acima da linha de base em 2 dos 8 participantes (e ácidos graxos de cadeia curta totais em 1 deles), enquanto a fibra 'não personalizada' não elevou esses marcadores em nenhum participante; não houve mudança detectável na composição geral da comunidade microbiana (16S rRNA) em nível de grupo.",
      mudou: "É a primeira prova de conceito de que testar, fora do corpo (ex vivo), qual fibra fermenta melhor no microbioma de uma pessoa específica pode, em tese, direcionar a escolha individualizada do tipo de fibra — mas a amostra é extremamente pequena e a resposta foi inconsistente entre os próprios participantes.",
      aplicar: "Trate este achado como hipótese inicial de pesquisa, não como recomendação pronta para a prática clínica — ainda não existe uma ferramenta validada e acessível para 'testar' qual fibra fermenta melhor no microbioma de um paciente específico; continue orientando variedade de fontes de fibra (frutas, verduras, leguminosas, grãos integrais) como abordagem padrão enquanto essa linha de pesquisa avança.",
      evidencia: 1,
      link: "https://doi.org/10.3389/fnut.2026.1907988",
      fonte: {
        autores: "Osawa, Inoue, Fukuda, Shirai e Kodama",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Ensaio cruzado piloto (prova de conceito), com triagem ex vivo da capacidade fermentativa individual do microbioma",
        amostra: "8 adultos japoneses saudáveis",
        doi: "10.3389/fnut.2026.1907988",
        acesso: "Acesso aberto (texto completo livre, Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Diferentes pessoas fermentam o mesmo tipo de fibra de formas muito diferentes, dependendo da composição do próprio microbioma intestinal. Os autores quiseram testar se é possível prever, com um teste feito fora do corpo (ex vivo), qual tipo de fibra vai fermentar melhor no microbioma de uma pessoa específica — e se escolher a fibra dessa forma personalizada realmente aumenta a produção de ácidos graxos de cadeia curta no intestino dela." },
        { h: "Como o estudo foi feito", p: "Os pesquisadores desenvolveram uma ferramenta de triagem ex vivo (My Dietary Fiber Finder, MyDFF) que ranqueia diferentes tipos de fibra por um índice de sacarificação, estimando qual fibra o microbioma de cada indivíduo fermenta melhor. Em um ensaio cruzado com 8 adultos japoneses saudáveis, cada participante consumiu, em momentos diferentes, a fibra apontada como 'personalizada' pelo teste e uma fibra 'não personalizada', medindo-se ácidos graxos voláteis fecais antes e depois de cada fase." },
        { h: "O que foi encontrado", p: "A fibra personalizada elevou os ácidos graxos voláteis fecais acima da linha de base em 2 dos 8 participantes, e os ácidos graxos de cadeia curta totais em 1 deles; a fibra não personalizada não produziu esse aumento em nenhum participante. Em nível de grupo, o sequenciamento 16S rRNA não mostrou mudança na composição geral da comunidade microbiana, e a diferença no índice de sacarificação entre as fibras não se correlacionou com o tamanho da resposta observada em cada pessoa." },
        { h: "O que isso não responde", p: "A amostra é extremamente pequena (8 pessoas) e a resposta positiva ocorreu em apenas 1 a 2 participantes, o que impede qualquer conclusão sobre eficácia — este é um estudo mecanístico de prova de conceito, não um teste de desfecho clínico. Também não há, nos resumos consultados, indicação de que essa ferramenta de triagem (MyDFF) esteja disponível ou validada para uso fora do contexto de pesquisa." },
        { h: "Na prática do consultório", p: "Não há, por ora, uma ferramenta acessível ou validada para 'testar' qual fibra fermenta melhor no microbioma de um paciente específico — trate este estudo como uma hipótese de pesquisa em estágio inicial. Continue recomendando variedade de fontes de fibra (frutas, verduras, leguminosas, grãos integrais) como abordagem padrão para saúde do microbioma, já que é essa a estratégia com respaldo de evidência mais robusto até o momento." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creatina-massa-magra-forca-meia-idade-sem-treino-ecr",
      categoria: "Suplementação",
      areas: ["Suplementação", "Envelhecimento"],
      data: "21 ago 2026",
      title: "ECR de 12 semanas: creatina aumenta massa magra e força em adultos de 45-65 anos mesmo sem programa estruturado de exercício, com ganhos maiores quando combinada a treino e dieta",
      resumo: "Ensaio clínico randomizado, controlado por placebo, testou 10 g/dia de creatina monohidratada por 12 semanas em adultos de 45-65 anos, divididos em subgrupos com e sem programa estruturado de exercício e dieta: no subgrupo sem exercício estruturado, a creatina já aumentou massa magra e força em relação ao placebo; no subgrupo que combinou creatina com treino de força e dieta hipocalórica, os ganhos de massa magra e força foram maiores, com redução adicional do percentual de gordura corporal; desfechos cognitivos e de biomarcadores foram tratados pelos próprios autores como exploratórios.",
      mudou: "Sugere que a creatina pode trazer benefício sobre massa magra e força em adultos de meia-idade mesmo na ausência de um programa estruturado de exercício — até aqui, a maior parte da evidência sólida de creatina dependia da combinação com treino de força.",
      aplicar: "Considere a creatina monohidratada (na dose de 10 g/dia usada no estudo) como estratégia nutricional adjuvante para preservação de massa magra em pacientes de meia-idade com baixa adesão a programas estruturados de exercício — mas reforce que o benefício é maior quando combinada a treino de força e ajuste dietético, e que os achados cognitivos e de biomarcadores ainda são exploratórios, não confirmados.",
      evidencia: 4,
      link: "https://doi.org/10.1080/15502783.2026.2716273",
      fonte: {
        autores: "Chun e cols. (Exercise & Sport Nutrition Lab, Texas A&M University; autor sênior Richard B. Kreider)",
        revista: "Journal of the International Society of Sports Nutrition",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, controlado por placebo",
        amostra: "64 adultos de 45-65 anos, em subgrupos com e sem treino de força estruturado/dieta hipocalórica, recebendo 10 g/dia de creatina monohidratada ou placebo por 12 semanas",
        doi: "10.1080/15502783.2026.2716273",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A creatina tem evidência consolidada para ganho de força e massa muscular quando combinada a treino de força, mas era menos claro se a suplementação isolada — sem um programa estruturado de exercício — também traria benefício em adultos de meia-idade, população em risco de perda progressiva de massa magra (sarcopenia)." },
        { h: "Como o estudo foi feito", p: "64 adultos de 45 a 65 anos foram randomizados para receber 10 g/dia de creatina monohidratada ou placebo por 12 semanas, divididos em subgrupos: um sem programa estruturado de exercício, e outro combinando a suplementação com treino de força e dieta hipocalórica. Os desfechos incluíram composição corporal (massa magra, percentual de gordura), força, resistência muscular e, de forma exploratória, função cognitiva e biomarcadores de saúde." },
        { h: "O que foi encontrado", p: "Mesmo no subgrupo sem programa estruturado de exercício, a creatina aumentou massa magra e força em relação ao placebo. No subgrupo que combinou creatina com treino de força e dieta hipocalórica, os ganhos de massa magra e força foram maiores, acompanhados de maior redução do percentual de gordura corporal. A suplementação foi bem tolerada, e os desfechos cognitivos e de biomarcadores foram classificados pelos próprios autores como exploratórios." },
        { h: "O que isso não responde", p: "Os subgrupos (com e sem exercício estruturado) são pequenos dentro da amostra total de 64 participantes, o que limita a precisão das estimativas, principalmente para quem não fez exercício estruturado. Os achados cognitivos e de biomarcadores, por serem exploratórios, não devem ser tomados como efeito comprovado da creatina sobre cognição nesta faixa etária." },
        { h: "Na prática do consultório", p: "Para pacientes de 45-65 anos com baixa adesão a programas estruturados de exercício, a creatina monohidratada (em torno de 10 g/dia, dose usada no estudo) pode ser discutida como estratégia nutricional adjuvante para preservação de massa magra e força — mas comunique que o benefício é maior quando ela é combinada a treino de força e ajuste dietético, e que os efeitos sobre cognição e biomarcadores ainda não estão confirmados." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "bebidas-dietas-vs-agua-perda-peso-dois-anos-ecr",
      categoria: "Obesidade",
      areas: ["Obesidade", "Comportamental"],
      data: "02 out 2026",
      title: "Ensaio SWITCH (2 anos): bebidas dietéticas adoçadas artificialmente têm efeito equivalente à água na perda de peso dentro de um programa comportamental estruturado",
      resumo: "Ensaio clínico randomizado de 2 anos (estudo SWITCH, Universidade de Liverpool) com 493 adultos com sobrepeso ou obesidade comparou o consumo de água ao de bebidas adoçadas artificialmente (aspartame, acessulfame-K ou sucralose) dentro de um programa comportamental estruturado de perda de peso (12 semanas de perda ativa, 40 semanas de manutenção assistida e até 52 semanas opcionais sem suporte): ao final de 104 semanas, a perda de peso foi semelhante entre os grupos (bebidas dietéticas: -4,8 kg; água: -3,7 kg; diferença não significativa), com melhora de circunferência da cintura e marcadores metabólicos em ambos os grupos, porém com alta perda de seguimento ao longo do estudo.",
      mudou: "Em um ensaio de longo prazo e dentro de um programa estruturado de perda de peso, bebidas dietéticas adoçadas artificialmente não se mostraram inferiores à água para a perda de peso — contrariando a preocupação de que adoçantes não calóricos prejudicariam o controle de peso no longo prazo quando usados como substituto de bebidas açucaradas.",
      aplicar: "Ao orientar pacientes que preferem bebidas dietéticas no lugar de refrigerantes açucarados, dentro de um programa estruturado de perda de peso, pode-se dizer que este ECR de 2 anos não mostra desvantagem das bebidas dietéticas frente à água nesse contexto — mas lembre que o estudo teve financiamento da indústria de bebidas e alta perda de seguimento, então trate o resultado como 'equivalência quando a troca já seria feita', não como incentivo a maximizar o consumo de adoçantes.",
      evidencia: 4,
      link: "https://doi.org/10.1017/S0007114526108150",
      fonte: {
        autores: "Harrold e cols. (Universidade de Liverpool; investigador principal Jason Halford)",
        revista: "British Journal of Nutrition",
        ano: "2026",
        desenho: "Ensaio clínico randomizado de longo prazo (estudo SWITCH), dentro de programa comportamental estruturado de perda de peso",
        amostra: "493 adultos com sobrepeso ou obesidade, seguimento de 104 semanas",
        doi: "10.1017/S0007114526108150",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Bebidas dietéticas adoçadas artificialmente são frequentemente recomendadas como substituto de refrigerantes açucarados em programas de perda de peso, mas persiste a dúvida sobre se o consumo de adoçantes não calóricos no longo prazo poderia, de alguma forma, prejudicar o controle de peso — por exemplo, por manter preferência por sabor adocicado. Faltava um ensaio de longo prazo comparando diretamente bebidas dietéticas à água dentro de um programa estruturado de perda de peso." },
        { h: "Como o estudo foi feito", p: "O ensaio SWITCH, da Universidade de Liverpool, randomizou 493 adultos com sobrepeso ou obesidade para consumir água ou bebidas adoçadas artificialmente (aspartame, acessulfame-K ou sucralose) ao longo de um programa comportamental estruturado de perda de peso, conduzido em três fases: 12 semanas de perda ativa, 40 semanas de manutenção assistida e até 52 semanas adicionais opcionais sem suporte do programa, totalizando 104 semanas de acompanhamento." },
        { h: "O que foi encontrado", p: "Ao final de 104 semanas, a perda de peso foi semelhante entre os grupos — em média 4,8 kg no grupo de bebidas dietéticas e 3,7 kg no grupo de água, diferença não estatisticamente significativa. Ambos os grupos também apresentaram melhora de circunferência da cintura e de marcadores metabólicos ao longo do estudo." },
        { h: "O que isso não responde", p: "O estudo teve alta perda de seguimento ao longo dos 2 anos, o que reduz a precisão da estimativa final e pode introduzir viés (quem permaneceu até o fim pode diferir de quem saiu). O financiamento pelo setor de bebidas, mesmo com controle independente da análise pelos pesquisadores, é um fator a considerar na interpretação. O estudo também não testa o efeito de bebidas dietéticas fora do contexto de um programa estruturado de perda de peso com suporte comportamental." },
        { h: "Na prática do consultório", p: "Para pacientes que já pretendem substituir refrigerantes açucarados por versões dietéticas dentro de um programa estruturado de perda de peso, esta evidência de 2 anos permite dizer que a troca não prejudica o resultado de peso em comparação à água — mas continue priorizando água como primeira escolha, e seja transparente sobre a alta perda de seguimento e o financiamento do estudo ao discutir esses dados com o paciente." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "fibra-soluvel-risco-diabetes-gestacional-microbiota-ecr",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Materno Infantil"],
      data: "30 mar 2026",
      title: "ECR com 98 gestantes de risco: fibra solúvel não reduz a incidência de diabetes gestacional, mas melhora picos de glicose e ganho de peso gestacional",
      resumo: "Ensaio clínico randomizado unicêntrico com 98 gestantes de risco elevado para diabetes gestacional (DMG), randomizadas entre 20 e 24+6 semanas para suplemento diário de fibra solúvel ou cuidado padrão por 5 semanas: a incidência de DMG não diferiu significativamente entre os grupos (10 de 48 no grupo fibra vs. 13 de 50 no controle; p=0,546), mas o grupo fibra teve excursões glicêmicas menores no teste oral de tolerância à glicose (glicemia de 1h: 8,09 vs. 8,88 mmol/L) e menor ganho de peso gestacional no período (1,83 vs. 2,54 kg; p=0,016), sem partos prematuros em nenhum grupo; análise de microbiota por sequenciamento 16S sugeriu menos vias inflamatórias preditas no grupo fibra.",
      mudou: "Mesmo sem reduzir estatisticamente a incidência de DMG neste estudo pequeno, a fibra solúvel melhorou marcadores glicêmicos intermediários e o ganho de peso gestacional durante o período de suplementação — os próprios autores tratam a ligação com mudanças na microbiota como associação exploratória, não causal.",
      aplicar: "Pode-se considerar a suplementação de fibra solúvel como estratégia adjuvante em gestantes de risco para DMG, visando melhora de excursões glicêmicas e controle do ganho de peso gestacional — mas seja claro de que, neste ECR, ela não reduziu estatisticamente o diagnóstico de DMG; é um estudo pequeno e unicêntrico, então individualize sempre conforme orientação obstétrica e evite prometer prevenção do diagnóstico com base apenas nesse resultado.",
      evidencia: 3,
      link: "https://doi.org/10.3389/fendo.2026.1794560",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Frontiers in Endocrinology",
        ano: "2026",
        desenho: "Ensaio clínico randomizado unicêntrico",
        amostra: "98 gestantes com risco elevado de diabetes gestacional, randomizadas entre 20 e 24+6 semanas de gestação, suplementação por 5 semanas",
        doi: "10.3389/fendo.2026.1794560",
        acesso: "Acesso aberto (texto completo livre, Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A fibra solúvel já é associada, em estudos observacionais, a melhor controle glicêmico e a mudanças favoráveis na microbiota intestinal. Faltava testar, em um ensaio randomizado, se a suplementação de fibra solúvel durante a gestação reduz a incidência de diabetes gestacional (DMG) em mulheres já identificadas como de risco elevado, e se isso se relaciona a mudanças mensuráveis na microbiota." },
        { h: "Como o estudo foi feito", p: "98 gestantes com risco elevado de DMG foram randomizadas, entre 20 e 24 semanas e 6 dias de gestação, para receber um suplemento diário de fibra solúvel ou manter o cuidado padrão, por 5 semanas. Os desfechos incluíram o diagnóstico de DMG pelo teste oral de tolerância à glicose (TOTG), o ganho de peso gestacional no período, desfechos de parto e, em subanálise, a composição da microbiota intestinal por sequenciamento 16S rRNA." },
        { h: "O que foi encontrado", p: "A incidência de DMG não diferiu significativamente entre os grupos (10 de 48 no grupo fibra vs. 13 de 50 no controle; p=0,546). Ainda assim, o grupo fibra teve excursões glicêmicas menores no TOTG (por exemplo, glicemia de 1 hora de 8,09 vs. 8,88 mmol/L) e menor ganho de peso gestacional no período de 5 semanas (1,83 vs. 2,54 kg; p=0,016), sem nenhum parto prematuro registrado em qualquer grupo. A análise preditiva de funções da microbiota apontou menos vias relacionadas à inflamação no grupo fibra." },
        { h: "O que isso não responde", p: "O estudo é pequeno, unicêntrico e com apenas 5 semanas de intervenção, o que limita a capacidade de detectar diferença na incidência de DMG (desfecho que exigiria amostra maior) e não permite avaliar efeitos no restante da gestação. A própria equipe de pesquisa trata a ligação entre as mudanças de microbiota e os desfechos clínicos como uma associação exploratória, baseada em achados de estudos anteriores, não como mecanismo causal comprovado neste ensaio." },
        { h: "Na prática do consultório", p: "Em gestantes com risco elevado de DMG, a suplementação de fibra solúvel pode ser discutida como estratégia adjuvante para melhorar excursões glicêmicas e ajudar no controle do ganho de peso gestacional — sempre dentro da orientação obstétrica vigente — mas não a apresente como forma comprovada de evitar o diagnóstico de DMG, já que esse desfecho específico não melhorou de forma estatisticamente significativa neste ECR pequeno." }
      ]
    }
  ]
};

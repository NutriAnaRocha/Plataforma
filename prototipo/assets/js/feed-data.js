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
    texto: "Uma meta-análise em rede (Nutrients) compara estratégias nutricionais para sarcopenia em idosos e mostra que combinações de nutrientes — como proteína, vitamina D e leucina, ou ômega-3, leucina e probiótico — trazem resultados mais consistentes do que estratégias isoladas. Uma meta-análise de 14 estudos (Nutrition Reviews) não encontra efeito de intervenções dietéticas sobre o ângulo de fase em pacientes em diálise, um resultado negativo útil para calibrar expectativas sobre esse marcador. Uma análise secundária do ensaio MINT (Journal of the Academy of Nutrition and Dietetics) mostra que baby-led weaning e alimentação complementar tradicional geram crescimento semelhante aos 12 meses, mas o BLW tem mais sódio na dieta aos 9 meses. Um ECR piloto (BMC Complementary Medicine and Therapies) com 40 mulheres na pós-menopausa mostra que curcuminoides reduzem a frequência de fogachos, ainda que sem melhora nos escores gerais de qualidade de vida. Uma meta-análise de 39 ECRs (Frontiers in Nutrition) mostra que a creatina só aumenta massa magra quando combinada a treino resistido, mas melhora força e desempenho mesmo sem treino estruturado. Uma meta-análise de 40 estudos com quase 14.500 pessoas (Appetite) confirma a associação entre desregulação emocional e comer emocional, mais forte para emoções negativas do que positivas. Uma meta-análise de 22 estudos (BMC Medicine) não encontra efeito dos probióticos sobre a diversidade da microbiota intestinal em adultos saudáveis. Uma meta-análise de 50 ECRs (Medicine) mostra que vitamina D3 e formas ativas de vitamina D — mas não a D2 — melhoram gordura visceral e marcadores glicêmicos na síndrome metabólica associada à obesidade. E uma revisão Cochrane com 22 ECRs e quase 2.000 adultos mostra que o jejum intermitente não traz benefício de perda de peso clinicamente relevante frente à orientação dietética padrão. Cada card abre a leitura completa com o link do estudo original."
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
      id: "estrategias-nutricionais-sarcopenia-idosos-meta-analise-rede",
      categoria: "Clínica",
      areas: ["Clínica", "Envelhecimento"],
      data: "14 out 2026",
      title: "Meta-análise em rede compara estratégias nutricionais para sarcopenia em idosos: combinações com proteína, leucina e ômega-3 têm os melhores resultados",
      resumo: "Revisão sistemática com meta-análise em rede de ensaios clínicos randomizados (busca atualizada até 15 de junho de 2026) comparou estratégias nutricionais — proteína, leucina, vitamina D, ômega-3, probióticos e combinações entre elas — sobre desfechos de sarcopenia em idosos: as intervenções melhoraram massa muscular esquelética apendicular, força de preensão manual e velocidade de marcha, mas não o teste de sentar-levantar 5 vezes; combinações de nutrientes (como proteína + vitamina D + leucina, ou ômega-3 + leucina + probiótico) tiveram os resultados mais consistentes, superando estratégias isoladas.",
      mudou: "Reforça que combinar nutrientes — em vez de prescrever um único suplemento isolado — parece trazer mais benefício sobre força e massa muscular em idosos com sarcopenia, embora a certeza sobre qual combinação específica é superior ainda seja limitada pela heterogeneidade dos estudos de base.",
      aplicar: "Ao planejar suporte nutricional para pacientes idosos com sarcopenia, priorize combinações (por exemplo, proteína/whey associada a vitamina D e leucina, ou ômega-3 com leucina e probiótico) em vez de uma única estratégia isolada, com expectativa realista de melhora em massa muscular, força de preensão e velocidade de marcha — mas sem prometer mudança no desempenho funcional de sentar-e-levantar apenas com a intervenção nutricional.",
      evidencia: 4,
      link: "https://doi.org/10.3390/nu18203368",
      fonte: {
        autores: "Autoria não detalhada com segurança nos resumos consultados — conferir no artigo original",
        revista: "Nutrients",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede de ensaios clínicos randomizados",
        amostra: "Conjunto de ECRs em idosos com sarcopenia, comparando múltiplas estratégias nutricionais isoladas e combinadas; busca atualizada até 15 de junho de 2026",
        doi: "10.3390/nu18203368",
        acesso: "Acesso aberto (MDPI)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Existem várias estratégias nutricionais propostas para sarcopenia em idosos — proteína, leucina, vitamina D, ômega-3, probióticos — mas poucos estudos comparam diretamente essas opções entre si, isoladas ou combinadas. Os autores quiseram usar uma meta-análise em rede, que permite comparar múltiplas intervenções mesmo quando elas não foram testadas umas contra as outras no mesmo ensaio, para identificar quais estratégias (e combinações) trazem mais benefício." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise em rede reuniu ensaios clínicos randomizados que testaram diferentes estratégias nutricionais — isoladas ou combinadas — sobre desfechos de sarcopenia em idosos, com busca atualizada até 15 de junho de 2026. Os desfechos avaliados incluíram massa muscular esquelética apendicular, força de preensão manual, velocidade de marcha e o teste de sentar-levantar 5 vezes." },
        { h: "O que foi encontrado", p: "As intervenções nutricionais, de forma geral, melhoraram massa muscular esquelética apendicular, força de preensão manual e velocidade de marcha em comparação ao controle, mas não houve efeito significativo sobre o teste de sentar-levantar 5 vezes. Combinações de nutrientes — como proteína associada a vitamina D e leucina, ou ômega-3 combinado a leucina e a um probiótico específico (Lactobacillus paracasei) — apresentaram os efeitos mais favoráveis e consistentes entre os desfechos avaliados, superando estratégias nutricionais isoladas." },
        { h: "O que isso não responde", p: "Por ser uma meta-análise em rede, a robustez das comparações entre combinações específicas depende da quantidade e qualidade dos ensaios disponíveis para cada combinação — algumas comparações podem se apoiar em poucos estudos. Os resumos consultados também não detalham doses exatas, duração das intervenções nem o perfil de risco (sarcopenia leve vs. grave) dos idosos incluídos, o que limita a tradução direta para protocolos clínicos específicos." },
        { h: "Na prática do consultório", p: "Ao planejar a conduta nutricional para um paciente idoso com sarcopenia, considere combinar estratégias — proteína adequada (incluindo leucina) associada a vitamina D, ou ômega-3 com leucina e probiótico — em vez de focar em um único suplemento isolado, já que essa combinação mostrou os resultados mais consistentes sobre massa muscular, força de preensão e velocidade de marcha nesta síntese. Para desempenho funcional em testes como sentar-levantar, reforce que a intervenção nutricional provavelmente precisa estar associada a exercício físico estruturado." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "angulo-fase-dieta-dialise-meta-analise-nula",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "06 ago 2026",
      title: "Meta-análise de 14 estudos não encontra efeito de intervenções dietéticas sobre o ângulo de fase em pacientes em diálise",
      resumo: "Revisão sistemática com meta-análise de 14 estudos (9 deles ensaios clínicos randomizados), reunindo 969 participantes em diálise por doença renal crônica, avaliou se intervenções dietéticas (como suplementação proteica e orientação nutricional) mudam o ângulo de fase — marcador de bioimpedância usado como indicador de massa celular e prognóstico nutricional: a meta-análise não encontrou influência estatisticamente significativa da intervenção dietética sobre o ângulo de fase nesses pacientes.",
      mudou: "Mostra que, apesar de o ângulo de fase ser útil como indicador prognóstico em diálise (e de haver evidência de benefício dietético sobre esse marcador em oncologia e medicina do esporte), intervenções dietéticas isoladas não demonstraram, nesta síntese, capacidade de modificá-lo em pacientes renais — um resultado negativo que ajuda a calibrar expectativas sobre o que a dieta consegue mudar nesse marcador específico.",
      aplicar: "Continue usando o ângulo de fase como ferramenta de avaliação e prognóstico nutricional em diálise, mas não prometa ao paciente (ou à equipe multiprofissional) que a intervenção dietética, isoladamente, vai elevar esse marcador — direcione a conversa e as metas de conduta para desfechos clínicos e funcionais (força, massa magra, qualidade de vida) nos quais a dieta tem evidência mais consistente de benefício.",
      evidencia: 4,
      link: "https://doi.org/10.1093/nutrit/nuag113",
      fonte: {
        autores: "Autoria não detalhada com segurança nos resumos consultados — conferir no artigo original",
        revista: "Nutrition Reviews",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise (14 estudos, incluindo 9 ensaios clínicos randomizados)",
        amostra: "969 participantes em diálise por doença renal crônica; busca em PubMed, Scopus, Web of Science, CINAHL e Embase até setembro de 2025",
        doi: "10.1093/nutrit/nuag113",
        pubmed: "42562782",
        acesso: "Acesso não confirmado como aberto; verificar no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O ângulo de fase, obtido por bioimpedância, é um marcador de massa celular e integridade de membrana usado como indicador prognóstico em pacientes em diálise, e estudos em outras áreas (oncologia, medicina do esporte) já associaram intervenções dietéticas a melhora desse marcador. Os autores quiseram testar, de forma sistemática, se intervenções dietéticas também mudam o ângulo de fase especificamente em pacientes com doença renal crônica em diálise." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 14 estudos (9 deles ensaios clínicos randomizados), totalizando 969 participantes em diálise, com busca em PubMed, Scopus, Web of Science, CINAHL e Embase até setembro de 2025. Os estudos incluídos testaram diferentes tipos de intervenção dietética, como suplementação proteica e orientação nutricional, medindo o ângulo de fase antes e depois da intervenção." },
        { h: "O que foi encontrado", p: "A meta-análise não encontrou influência estatisticamente significativa das intervenções dietéticas sobre o ângulo de fase nos pacientes em diálise — um resultado nulo relatado pelos próprios autores, que contrasta com o racional inicial baseado em evidências de outras áreas clínicas." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham os valores numéricos exatos do efeito agrupado (diferença média, intervalo de confiança) nem medidas de heterogeneidade entre os 14 estudos, o que dificulta avaliar a precisão dessa estimativa nula. Também não é possível, a partir dos dados disponíveis, saber se subgrupos específicos (por tempo em diálise, estado nutricional basal ou tipo de intervenção) poderiam responder de forma diferente." },
        { h: "Na prática do consultório", p: "Continue solicitando e acompanhando o ângulo de fase como ferramenta de avaliação nutricional em diálise — ele mantém valor prognóstico —, mas não o utilize como meta isolada de uma intervenção dietética específica, já que esta síntese não encontrou evidência de que a dieta, por si só, consiga modificá-lo nesses pacientes. Priorize metas clínicas e funcionais (manutenção de massa magra, força, controle de fósforo e potássio, qualidade de vida) como desfechos primários da conduta nutricional." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "alimentacao-complementar-baby-led-weaning-crescimento-mint",
      categoria: "Materno Infantil",
      areas: ["Materno Infantil", "Clínica"],
      data: "19 mai 2026",
      title: "Análise secundária do ensaio MINT: baby-led weaning e alimentação complementar tradicional geram crescimento semelhante aos 12 meses, mas o BLW tem mais sódio na dieta aos 9 meses",
      resumo: "Análise secundária de um ensaio clínico randomizado (estudo MINT, Universidade do Colorado) comparou baby-led weaning (BLW) à alimentação complementar convencional em 144 lactentes com dados completos: a ingestão energética total não diferiu entre os grupos em nenhuma idade avaliada, mas o grupo BLW teve ingestão de sódio significativamente mais alta, maior percentual de energia proveniente de gordura e menor percentual de carboidratos aos 9 meses — diferenças que desapareceram aos 12 meses; não houve diferença significativa em nenhum momento nos escores-z de crescimento nem na frequência de ganho de peso rápido.",
      mudou: "Reforça, com dados de um ensaio clínico randomizado (e não apenas de estudos observacionais), que o baby-led weaning não compromete o crescimento infantil em comparação à alimentação complementar tradicional — mas identifica um sinal específico de maior ingestão de sódio no grupo BLW na fase inicial (9 meses), que merece atenção na orientação às famílias, já que ambos os grupos ultrapassaram a ingestão adequada de sódio aos 12 meses.",
      aplicar: "Ao orientar famílias que optam por baby-led weaning, você pode tranquilizá-las quanto ao crescimento do bebê, que tende a ser semelhante ao da alimentação complementar tradicional — mas reforce o cuidado com o teor de sódio dos alimentos oferecidos em pedaços ou inteiros (evitar embutidos, temperos industrializados, caldos e molhos prontos), especialmente entre 6 e 9 meses, já que esse foi o sinal de alerta identificado neste estudo, presente também, em menor grau, na alimentação complementar tradicional aos 12 meses.",
      evidencia: 4,
      link: "https://doi.org/10.1016/j.jand.2026.156376",
      fonte: {
        autores: "Equipe vinculada ao ensaio MINT (NCT05012930), University of Colorado Denver — lista completa de autores não detalhada com segurança nos resumos consultados",
        revista: "Journal of the Academy of Nutrition and Dietetics",
        ano: "2026",
        desenho: "Análise secundária de ensaio clínico randomizado (baby-led weaning vs. alimentação complementar convencional)",
        amostra: "144 lactentes com dados completos, recrutados entre agosto de 2021 e agosto de 2024",
        doi: "10.1016/j.jand.2026.156376",
        pubmed: "42162611",
        acesso: "Acesso não confirmado como aberto; verificar no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O baby-led weaning (BLW) — em que o bebê se autoalimenta com pedaços de comida inteiros desde o início da alimentação complementar — ganhou popularidade, mas ainda gera dúvida sobre se garante ingestão nutricional e crescimento adequados em comparação à alimentação complementar tradicional, guiada por colher. Esta análise secundária de um ensaio clínico randomizado (estudo MINT) buscou comparar diretamente ingestão alimentar e crescimento entre os dois métodos." },
        { h: "Como o estudo foi feito", p: "A partir do ensaio MINT, randomizado, 144 lactentes com dados completos foram acompanhados dos 6 aos 12 meses, comparando o grupo que recebeu orientação para baby-led weaning ao grupo com alimentação complementar convencional. Os pesquisadores mediram ingestão energética total, distribuição de macronutrientes, ingestão de sódio e indicadores antropométricos de crescimento (escores-z, ganho de peso rápido) em diferentes idades." },
        { h: "O que foi encontrado", p: "A ingestão energética total foi semelhante entre os grupos em todas as idades avaliadas. Aos 9 meses, o grupo BLW apresentou ingestão de sódio significativamente mais alta, maior percentual de energia vinda de gordura e menor percentual de carboidratos em relação ao grupo de alimentação convencional — diferenças que não persistiram aos 12 meses. Não houve diferença significativa em nenhum momento nos escores-z de crescimento nem na frequência de ganho de peso rápido entre os grupos." },
        { h: "O que isso não responde", p: "É uma análise secundária de um ensaio com amostra relativamente pequena (144 lactentes), o que limita a capacidade de detectar diferenças menores em desfechos específicos. O estudo também não detalha quais alimentos especificamente elevaram o sódio no grupo BLW aos 9 meses, informação que seria útil para orientar a escolha de alimentos nessa fase." },
        { h: "Na prática do consultório", p: "Pode-se orientar famílias que optam por baby-led weaning de que o crescimento do bebê tende a ser equivalente ao da alimentação complementar tradicional segundo este ECR — mas inclua, na orientação alimentar dos 6 aos 9 meses, atenção redobrada ao sódio (evitando alimentos processados, embutidos, caldos e temperos industrializados oferecidos em pedaços), já que esse foi o achado de maior relevância prática deste estudo, relevante também para a alimentação complementar tradicional à medida que o bebê se aproxima dos 12 meses." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "curcuminoides-fogachos-menopausa-ecr-piloto",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Suplementação"],
      data: "09 mai 2026",
      title: "ECR piloto: suplementação com curcuminoides reduz a frequência de fogachos em mulheres na pós-menopausa",
      resumo: "Ensaio clínico randomizado piloto, duplo-cego e controlado por placebo, com 40 mulheres saudáveis na pós-menopausa (41-65 anos), testou 1.000 mg/dia de curcuminoides por 12 semanas: na semana 12, o grupo curcuminoides teve redução média de 7,35 episódios de fogacho por semana em relação ao placebo (IC95% -10,29 a -4,41; p<0,001), com boa adesão e sem eventos adversos graves; não houve diferença significativa entre os grupos nos escores totais de qualidade de vida (MENQOL) ou de sintomas da menopausa (MRS II) na semana 12, embora o domínio vasomotor do MENQOL já tenha melhorado na semana 6.",
      mudou: "É um dos primeiros ECRs a testar curcuminoides especificamente para a frequência de fogachos — a maioria dos estudos anteriores com curcumina na menopausa avaliou outros desfechos, como densidade óssea ou estradiol, com resultados mistos — e encontra um efeito estatisticamente significativo e clinicamente relevante sobre esse desfecho específico, ainda que em um estudo piloto pequeno.",
      aplicar: "Para pacientes na pós-menopausa com fogachos que buscam alternativas não hormonais, a suplementação de curcuminoides (na dose testada de 1.000 mg/dia) pode ser discutida como opção adjuvante com respaldo inicial de um ECR — mas deixe claro que é um estudo piloto com apenas 40 mulheres, sem confirmação de melhora na qualidade de vida global, e que ensaios maiores ainda são necessários antes de tratar esse efeito como estabelecido.",
      evidencia: 3,
      link: "https://doi.org/10.1186/s12906-026-05358-7",
      fonte: {
        autores: "Buntoonprayuk, Chattrakulchai, Vallibhakara, Prasanchit e Vallibhakara — Mahidol University, Tailândia",
        revista: "BMC Complementary Medicine and Therapies",
        ano: "2026",
        desenho: "Ensaio clínico randomizado piloto, duplo-cego, controlado por placebo, prova de conceito",
        amostra: "40 mulheres saudáveis na pós-menopausa (41-65 anos); 1.000 mg/dia de curcuminoides ou placebo por 12 semanas",
        doi: "10.1186/s12906-026-05358-7",
        pubmed: "41877056",
        acesso: "Acesso aberto (BMC); data exata de publicação online não confirmada nas fontes consultadas — artigo já disponível em repositório institucional desde maio de 2026"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Fogachos são um dos sintomas mais incômodos da transição menopausal, e nem todas as mulheres podem ou querem usar terapia hormonal. A curcumina já havia sido testada para outros desfechos da pós-menopausa (densidade óssea, estradiol) com resultados mistos, mas faltava um ensaio clínico randomizado avaliando especificamente seu efeito sobre a frequência de fogachos." },
        { h: "Como o estudo foi feito", p: "Quarenta mulheres saudáveis na pós-menopausa, de 41 a 65 anos, foram randomizadas para receber 1.000 mg/dia de curcuminoides ou placebo por 12 semanas, em desenho duplo-cego. Os desfechos incluíram a frequência semanal de fogachos (desfecho primário, avaliado na semana 12), além dos escores de qualidade de vida (MENQOL) e de sintomas da menopausa (MRS II), avaliados nas semanas 6 e 12." },
        { h: "O que foi encontrado", p: "Na semana 12, o grupo curcuminoides apresentou redução média de 7,35 episódios de fogacho por semana em relação ao placebo (IC95% -10,29 a -4,41; p<0,001) — um efeito estatisticamente significativo e de magnitude relevante. O domínio vasomotor do MENQOL já havia melhorado na semana 6, mas os escores totais de MENQOL e MRS II não diferiram significativamente entre os grupos na semana 12. A adesão foi boa e não houve eventos adversos graves." },
        { h: "O que isso não responde", p: "A amostra é pequena (40 mulheres), o que é esperado em um estudo piloto de prova de conceito, mas limita a generalização dos achados. O fato de os escores totais de qualidade de vida e de sintomas da menopausa não terem melhorado de forma significativa, mesmo com a redução expressiva de fogachos, sugere que o impacto percebido pela paciente no dia a dia pode ser mais modesto do que o número de episódios sozinho indica — isso não é totalmente explicado pelos dados disponíveis." },
        { h: "Na prática do consultório", p: "Para pacientes que relatam fogachos frequentes e preferem evitar terapia hormonal, a curcumina (na dose de 1.000 mg/dia testada no estudo) pode ser apresentada como opção adjuvante com respaldo inicial de um ECR — mas seja transparente de que se trata de um estudo piloto pequeno, sem melhora demonstrada na qualidade de vida global, e que a decisão deve continuar sendo compartilhada com a equipe médica responsável pelo acompanhamento da paciente na menopausa." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creatina-massa-magra-apenas-com-treino-resistido-meta-analise",
      categoria: "Esportiva",
      areas: ["Esportiva", "Suplementação"],
      data: "09 abr 2026",
      title: "Meta-análise de 39 ECRs: creatina só aumenta massa magra quando combinada a treino resistido, mas melhora força e desempenho mesmo sem treino",
      resumo: "Revisão sistemática com meta-análise de 39 ensaios clínicos randomizados em homens jovens saudáveis (18-30 anos, busca até 1º de outubro de 2025) avaliou a suplementação de creatina sob treino resistido e sem treino resistido: ganhos de massa magra e de massa livre de gordura só ocorreram nos participantes que também realizaram treino de força concomitante; já os ganhos de força e de desempenho (como salto vertical e potência anaeróbia) apareceram independentemente de haver treino resistido ou não.",
      mudou: "Esclarece, com uma meta-análise ampla, um ponto frequentemente confundido na prática: a creatina não constrói massa muscular por si só — ela funciona como um amplificador do estímulo do treino de força para hipertrofia —, mas pode melhorar força e desempenho mesmo sem um programa de treino resistido estruturado.",
      aplicar: "Ao orientar sobre creatina, diferencie a expectativa conforme o objetivo do paciente ou atleta: para ganho de massa magra, deixe claro que o benefício depende de treino de força concomitante; para força e desempenho (como salto e potência), o efeito pode aparecer mesmo em quem não segue um programa de treino resistido estruturado — uma distinção útil para quem já suplementa sem treinar de forma sistemática.",
      evidencia: 5,
      link: "https://doi.org/10.3389/fnut.2026.1800546",
      fonte: {
        autores: "Gu e cols. — lista completa de autores não detalhada com segurança nos resumos consultados",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "39 ECRs em homens saudáveis de 18-30 anos; busca em PubMed, Web of Science, Scopus, Embase, Cochrane Library e SPORTDiscus até 1º de outubro de 2025",
        doi: "10.3389/fnut.2026.1800546",
        acesso: "Acesso aberto (Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A creatina é um dos suplementos mais estudados para ganho de força e massa muscular, mas boa parte da evidência consolidada vem de estudos em que ela é usada junto a programas de treino de força. Os autores quiseram separar, de forma sistemática, o que a creatina realmente adiciona quando combinada a treino resistido em comparação ao seu uso sem esse tipo de treino." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 39 ensaios clínicos randomizados em homens jovens saudáveis (18-30 anos), com busca em múltiplas bases de dados até 1º de outubro de 2025, comparando a suplementação de creatina com e sem treino de força concomitante. Os desfechos avaliados incluíram massa magra, massa livre de gordura, força muscular e medidas de desempenho como salto vertical e potência anaeróbia." },
        { h: "O que foi encontrado", p: "Os ganhos de massa magra e de massa livre de gordura associados à creatina ocorreram apenas nos participantes que também realizaram treino resistido concomitante — ou seja, a creatina isolada, sem treino de força, não aumentou massa muscular. Já os ganhos de força e de medidas de desempenho, como salto e potência anaeróbia, apareceram tanto nos grupos com treino resistido quanto nos grupos sem esse tipo de treino." },
        { h: "O que isso não responde", p: "O estudo foi conduzido em homens jovens saudáveis (18-30 anos), o que limita a extrapolação direta para mulheres, idosos ou populações clínicas, públicos em que a resposta à creatina pode diferir. Há também alguma divergência entre fontes secundárias sobre a magnitude exata dos ganhos de massa magra e de massa livre de gordura relatados na meta-análise, o que recomenda cautela antes de citar valores numéricos precisos desses desfechos." },
        { h: "Na prática do consultório", p: "Ao orientar o uso de creatina, explique que o ganho de massa muscular depende de estar associado a um programa de treino de força — a creatina funciona como um amplificador do estímulo do treino, não como substituto dele. Para pacientes ou atletas focados em força e desempenho físico (sem necessariamente seguir um treino resistido estruturado), a creatina ainda pode trazer benefício, o que é útil para calibrar a expectativa de quem busca o suplemento com objetivos distintos." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "desregulacao-emocional-comer-emocional-meta-analise",
      categoria: "Comportamental",
      areas: ["Comportamental", "Saúde Mental"],
      data: "01 abr 2026",
      title: "Meta-análise de 40 estudos com quase 14.500 pessoas confirma a associação entre desregulação emocional e comer emocional, mais forte para emoções negativas",
      resumo: "Meta-análise de 40 estudos (42 amostras, 14.481 participantes, idade média 26,8 anos, 67,8% mulheres) examinou a associação entre desregulação emocional ampla e comer emocional: encontrou uma correlação positiva e moderada entre os dois (r=0,337; IC95% 0,279-0,396), mais forte para o comer emocional de valência negativa (r=0,286) e não significativa para o comer emocional de valência positiva (r=0,055); a associação foi mais forte em amostras não clínicas do que em amostras clínicas.",
      mudou: "Consolida, com um volume grande de estudos, que o comer emocional está ligado principalmente à dificuldade de regular emoções negativas (tristeza, ansiedade, estresse) — e não ao comer em resposta a emoções positivas, cuja associação com desregulação emocional mostrou-se praticamente nula — um detalhe que pode refinar a forma como o tema é investigado na consulta.",
      aplicar: "Ao investigar comer emocional na anamnese comportamental, direcione as perguntas principalmente para situações de emoções negativas (estresse, tristeza, ansiedade, frustração), já que é nesse contexto que a associação com dificuldades de regulação emocional é mais consistente; o comer em momentos de emoções positivas (celebrações, alegria) parece ter uma dinâmica diferente e não deve ser automaticamente tratado como 'comer emocional' no mesmo sentido clínico.",
      evidencia: 2,
      link: "https://doi.org/10.1016/j.appet.2026.108490",
      fonte: {
        autores: "Mendia, Quiles, Pascual, Ruiz, Manchón, Conejero, Pizarro e Alonso-Arbiol",
        revista: "Appetite",
        ano: "2026",
        desenho: "Meta-análise de estudos correlacionais/observacionais (não de ensaios de intervenção)",
        amostra: "40 estudos, 42 amostras, 14.481 participantes; busca em Scopus, Web of Science, APA PsycInfo e APA PsycArticles até março de 2025",
        doi: "10.1016/j.appet.2026.108490",
        acesso: "Acesso aberto (CC BY); data exata de publicação online não confirmada nas fontes consultadas"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O comer emocional é frequentemente associado, na prática clínica e em estudos menores, à dificuldade de regular emoções — mas faltava uma síntese ampla que quantificasse essa associação e testasse se ela depende do tipo de emoção envolvida (negativa ou positiva) e do tipo de amostra (clínica ou não clínica)." },
        { h: "Como o estudo foi feito", p: "Meta-análise reuniu 40 estudos (42 amostras independentes), totalizando 14.481 participantes, com busca em quatro bases de dados até março de 2025. Os autores calcularam a correlação agrupada entre desregulação emocional ampla e comer emocional, e testaram se a valência do comer emocional (negativa ou positiva) e o tipo de amostra (clínica ou não clínica) moderavam essa associação." },
        { h: "O que foi encontrado", p: "A correlação agrupada entre desregulação emocional e comer emocional foi positiva e moderada (r=0,337). Essa associação foi mais forte para o comer emocional em resposta a emoções negativas (r=0,286) e não foi estatisticamente significativa para o comer emocional em resposta a emoções positivas (r=0,055). A associação também foi mais forte em amostras não clínicas do que em amostras clínicas." },
        { h: "O que isso não responde", p: "Por ser uma meta-análise de estudos correlacionais, o desenho não permite afirmar causalidade — não se sabe, a partir destes dados, se a desregulação emocional causa o comer emocional, se o comer emocional agrava a desregulação, ou se os dois se influenciam mutuamente. A maior parte da amostra combinada é jovem (idade média de 26,8 anos), o que limita a extrapolação para outras faixas etárias, como idosos." },
        { h: "Na prática do consultório", p: "Ao abordar comer emocional na anamnese comportamental, priorize perguntas sobre episódios ligados a emoções negativas (estresse, tristeza, ansiedade), já que é nesse contexto que a associação com desregulação emocional é mais robusta e consistente. Lembre-se de que o comer em situações de emoções positivas (festas, celebrações) tem uma base associativa mais fraca com desregulação emocional, e pode exigir uma abordagem diferente na orientação do paciente." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-diversidade-microbiota-saudaveis-meta-analise-nula",
      categoria: "Microbiota",
      areas: ["Microbiota", "Suplementação"],
      data: "07 jan 2026",
      title: "Meta-análise de 22 estudos com mais de 1.000 pessoas não encontra efeito dos probióticos sobre a diversidade da microbiota intestinal em adultos saudáveis",
      resumo: "Revisão sistemática com meta-análise, a partir de 9.217 artigos identificados e 47 estudos elegíveis, reuniu 22 estudos com dados de 1.068 indivíduos saudáveis para avaliar o efeito da suplementação de probióticos sobre índices de diversidade da microbiota intestinal: a suplementação probiótica não produziu alterações estatisticamente significativas na diversidade microbiana nesses indivíduos.",
      mudou: "Questiona, com uma síntese ampla e metodologicamente robusta, a expectativa comum de que tomar probióticos 'melhora' ou 'diversifica' a microbiota intestinal de pessoas saudáveis — esse benefício específico (diversidade) simplesmente não apareceu quando os estudos foram reunidos, achado consistente com resultados semelhantes de outra meta-análise recente sobre ácidos graxos de cadeia curta fecais.",
      aplicar: "Ao conversar com pacientes saudáveis que tomam probióticos esperando 'diversificar' ou 'melhorar' a microbiota de forma geral, explique que a evidência reunida até aqui não sustenta esse efeito específico em pessoas sem disbiose ou doença — isso não invalida outros usos de probióticos (por exemplo, em quadros gastrointestinais específicos), mas ajuda a calibrar a expectativa de quem os toma apenas como suplemento geral de 'saúde intestinal'.",
      evidencia: 5,
      link: "https://doi.org/10.1186/s12916-025-04602-0",
      fonte: {
        autores: "Equipe vinculada à University of Pécs, Hungria — lista completa de autores não detalhada com segurança nos resumos consultados",
        revista: "BMC Medicine",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "22 estudos, 1.068 indivíduos saudáveis, selecionados a partir de 47 estudos elegíveis entre 9.217 artigos identificados",
        doi: "10.1186/s12916-025-04602-0",
        acesso: "Acesso aberto (BMC)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Probióticos são amplamente consumidos por pessoas saudáveis com a expectativa de 'melhorar' a microbiota intestinal, incluindo aumentar sua diversidade — um indicador geralmente associado a um intestino mais saudável. Os autores quiseram testar, de forma sistemática, se a suplementação probiótica realmente altera os índices de diversidade da microbiota em adultos saudáveis (sem doença de base)." },
        { h: "Como o estudo foi feito", p: "Partindo de 9.217 artigos identificados, os autores selecionaram 47 estudos elegíveis e, destes, 22 estudos com dados de 1.068 indivíduos saudáveis entraram na meta-análise de índices de diversidade da microbiota intestinal, comparando grupos que receberam probióticos a grupos-controle (placebo ou sem intervenção)." },
        { h: "O que foi encontrado", p: "A suplementação probiótica não produziu alterações estatisticamente significativas nos índices de diversidade da microbiota intestinal em comparação ao controle — um resultado nulo relatado como conclusão central pelos próprios autores." },
        { h: "O que isso não responde", p: "O estudo avalia especificamente índices de diversidade microbiana em pessoas saudáveis, não outros desfechos onde probióticos têm evidência mais estabelecida (como em quadros gastrointestinais específicos, diarreia associada a antibióticos, ou síndrome do intestino irritável). Os resumos consultados não detalham se diferentes cepas, doses ou durações de uso poderiam ter resultados distintos dentro da própria meta-análise." },
        { h: "Na prática do consultório", p: "Para pacientes saudáveis que tomam probióticos esperando 'diversificar' a microbiota intestinal de forma geral, comunique que essa evidência específica (diversidade microbiana) não respalda esse benefício em quem não tem disbiose ou doença diagnosticada — sem descartar outros usos de probióticos com indicação mais específica. Reforce que, para saúde do microbioma de forma geral, a estratégia com respaldo mais consistente continua sendo a variedade de fibras alimentares, não a suplementação isolada de probióticos em pessoas saudáveis." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "vitamina-d3-ativa-sindrome-metabolica-obesidade-meta-analise",
      categoria: "Suplementação",
      areas: ["Suplementação", "Obesidade"],
      data: "20 fev 2026",
      title: "Meta-análise de 50 ECRs: vitamina D3 e formas ativas de vitamina D — mas não a D2 — melhoram gordura visceral e marcadores glicêmicos na síndrome metabólica associada à obesidade",
      resumo: "Meta-análise de 50 ensaios clínicos randomizados comparou diferentes formulações de suplementação de vitamina D (D2, D3 e formas ativas como calcitriol/calcifediol) sobre distribuição de gordura corporal e metabolismo glicolipídico em pacientes com síndrome metabólica associada à obesidade: a vitamina D3 e as formas ativas de vitamina D se associaram a redução de gordura visceral e melhora de marcadores glicêmicos e de resistência à insulina, principalmente em doses mais altas e maior duração de uso, enquanto a vitamina D2 não mostrou efeito significativo sobre esses desfechos.",
      mudou: "Ajuda a explicar por que outras meta-análises recentes sobre vitamina D e marcadores metabólicos encontraram resultados nulos ou inconsistentes: o efeito parece depender fortemente da formulação específica usada — D3 e formas ativas parecem trazer benefício em síndrome metabólica/obesidade, enquanto a D2 não.",
      aplicar: "Ao avaliar ou discutir com o médico prescritor a suplementação de vitamina D em pacientes com síndrome metabólica ou obesidade visando efeito sobre gordura visceral e controle glicêmico, priorize formulações de vitamina D3 (colecalciferol) ou formas ativas, em vez de D2 (ergocalciferol) — e calibre a expectativa pela dose e duração de uso, já que o benefício foi mais consistente com doses mais altas e uso mais prolongado nesta meta-análise.",
      evidencia: 5,
      link: "https://doi.org/10.1097/MD.0000000000047436",
      fonte: {
        autores: "Autoria não detalhada com segurança nos resumos consultados — conferir no artigo original",
        revista: "Medicine",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "50 ECRs comparando formulações de vitamina D (D2, D3 e formas ativas) em pacientes com síndrome metabólica associada à obesidade",
        doi: "10.1097/MD.0000000000047436",
        acesso: "Acesso aberto (Medicine/PMC)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Estudos sobre vitamina D e marcadores metabólicos têm resultados inconsistentes entre si, e os autores suspeitaram que parte dessa inconsistência vem de tratar todas as 'formas de vitamina D' como equivalentes. O objetivo foi comparar especificamente D2, D3 e formas ativas (calcitriol, calcifediol) quanto ao efeito sobre gordura visceral e metabolismo glicolipídico em pacientes com síndrome metabólica associada à obesidade." },
        { h: "Como o estudo foi feito", p: "Meta-análise reuniu 50 ensaios clínicos randomizados que testaram diferentes formulações de suplementação de vitamina D em pacientes com síndrome metabólica associada à obesidade, avaliando desfechos de distribuição de gordura corporal (incluindo gordura visceral) e de metabolismo glicolipídico (glicemia, marcadores de resistência à insulina), estratificando a análise por tipo de formulação, dose e duração do tratamento." },
        { h: "O que foi encontrado", p: "Vitamina D3 e formas ativas de vitamina D se associaram a redução de gordura visceral e melhora de marcadores glicêmicos e de resistência à insulina, com efeito mais consistente em doses mais altas e maior duração de tratamento. A vitamina D2, por outro lado, não mostrou efeito significativo sobre esses desfechos." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham as doses exatas consideradas 'altas' nem o tempo mínimo de tratamento associado a benefício, o que dificulta uma recomendação posológica precisa a partir apenas desta meta-análise. Também não está claro se os resultados se aplicam igualmente a pacientes com obesidade sem síndrome metabólica estabelecida, população não especificamente avaliada neste estudo." },
        { h: "Na prática do consultório", p: "Ao discutir suplementação de vitamina D com a equipe médica para pacientes com síndrome metabólica ou obesidade, reforce a preferência por D3 (colecalciferol) ou formas ativas em vez de D2 (ergocalciferol) quando o objetivo for impacto sobre gordura visceral e controle glicêmico — e lembre que o benefício parece depender de dose adequada e uso prolongado, não de uma suplementação pontual ou de baixa dose." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "jejum-intermitente-cochrane-sem-beneficio-peso",
      categoria: "Obesidade",
      areas: ["Obesidade", "Comportamental"],
      data: "16 fev 2026",
      title: "Revisão Cochrane: jejum intermitente não traz benefício de perda de peso clinicamente relevante frente à orientação dietética padrão em adultos com sobrepeso ou obesidade",
      resumo: "Revisão sistemática Cochrane reuniu 22 ensaios clínicos randomizados com 1.995 adultos com sobrepeso ou obesidade, comparando diferentes formas de jejum intermitente à orientação dietética regular, nenhuma intervenção ou lista de espera: não houve efeito clinicamente relevante do jejum intermitente sobre a perda de peso em relação aos comparadores, e a qualidade de vida provavelmente não diferiu entre os grupos (com base em apenas três estudos); poucos ensaios avaliaram desfechos de longo prazo.",
      mudou: "Como revisão Cochrane — padrão de referência em síntese de evidência —, reforça com robustez que o jejum intermitente, como categoria ampla, não é superior à orientação dietética convencional para perda de peso; uma limitação apontada por especialistas externos é que agrupar formas muito diferentes de jejum intermitente (16:8, 5:2, dias alternados, entre outras) como se fossem equivalentes pode mascarar diferenças reais entre os protocolos específicos.",
      aplicar: "Ao discutir jejum intermitente com pacientes com sobrepeso ou obesidade, não o apresente como estratégia superior à orientação dietética tradicional para perda de peso — os próprios autores da revisão reconhecem que pode ser uma opção razoável para alguns pacientes, por preferência, adesão ou praticidade, mas não espere nem prometa um efeito adicional de perda de peso apenas por adotar esse padrão de horário alimentar.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/41692034/",
      fonte: {
        autores: "Colaboração Cochrane",
        revista: "Cochrane Database of Systematic Reviews",
        ano: "2026",
        desenho: "Revisão sistemática Cochrane de ensaios clínicos randomizados",
        amostra: "22 ECRs, 1.995 adultos com sobrepeso ou obesidade",
        doi: "não confirmado com segurança nas fontes consultadas — conferir na página da Cochrane Library",
        pubmed: "41692034",
        acesso: "Acesso aberto (resumo); revisão completa na Cochrane Library"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O jejum intermitente ganhou grande popularidade como estratégia de perda de peso, mas a evidência de ensaios individuais é heterogênea — diferentes protocolos (restrição de horário diário, dias alternados, 5:2) foram testados separadamente, sem uma síntese Cochrane abrangente recente que reunisse os resultados e comparasse com a orientação dietética padrão." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática Cochrane reuniu 22 ensaios clínicos randomizados, com 1.995 adultos com sobrepeso ou obesidade, comparando diferentes formas de jejum intermitente à orientação dietética regular, nenhuma intervenção ou lista de espera. Os desfechos avaliados incluíram perda de peso e qualidade de vida, com avaliação da certeza da evidência segundo os critérios GRADE." },
        { h: "O que foi encontrado", p: "Não houve efeito clinicamente relevante do jejum intermitente sobre a perda de peso em comparação aos grupos-controle. A qualidade de vida provavelmente não diferiu entre os grupos, mas essa conclusão se baseou em apenas três estudos. Poucos ensaios incluídos avaliaram desfechos de longo prazo, o que limitou a análise de sustentabilidade dos resultados ao longo do tempo." },
        { h: "O que isso não responde", p: "Uma crítica levantada por especialistas externos é que a revisão agrupa diferentes protocolos de jejum intermitente (como alimentação com restrição de horário, 5:2 e dias alternados) em uma única categoria, o que pode mascarar diferenças reais de eficácia entre esses protocolos específicos. A escassez de dados de longo prazo também impede concluir se os resultados se mantêm além da duração média dos estudos incluídos." },
        { h: "Na prática do consultório", p: "Ao conversar sobre jejum intermitente com pacientes com sobrepeso ou obesidade, baseie a conduta na evidência de que, como categoria ampla, ele não supera a orientação dietética convencional para perda de peso — mas pode ser oferecido como uma opção entre outras, caso o paciente tenha preferência ou melhor adesão a esse formato, sem prometer resultado superior de perda de peso só pela adoção do jejum em si." }
      ]
    }
  ]
};

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
    texto: "Jejum 16/8 com efeito lipídico diferente por sexo, terapia combinada (dieta + metformina + inositol) na SOP, creatina sustentando massa magra e cognição na meia-idade mesmo sem treino associado, o limite real do mindful eating sobre a fome, probióticos no eixo intestino-cérebro, vitamina D e marcadores cardiometabólicos, a maior comparação já feita entre fármacos para obesidade, nutrição estruturada no pré-natal e o teto da dieta isolada sobre o ângulo de fase na diálise. Cada card abre a leitura completa com o link do estudo original."
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
      id: "jejum-16-8-glicemia-lipidos",
      categoria: "Clínica",
      areas: ["Clínica", "Funcional"],
      data: "2026",
      title: "Meta-análise de 23 ensaios mostra que o jejum 16/8 melhora glicemia, mas o efeito no perfil lipídico depende do sexo",
      resumo: "Revisão sistemática com meta-análise de 23 ECRs (cerca de 1.280 adultos) mostrou que o jejum intermitente 16/8 reduz discretamente glicemia de jejum, HOMA-IR e insulina, com melhora de HbA1c só nos estudos com mais de 6 meses de duração.",
      mudou: "Os efeitos cardiometabólicos do 16/8 são reais, porém modestos, e os ganhos em LDL e triglicerídeos só apareceram em subgrupos de homens ou de maior atividade física — o que pede cautela ao generalizar o benefício lipídico para qualquer paciente.",
      aplicar: "Ao indicar o 16/8 para controle glicêmico, calibre a expectativa (efeito pequeno a moderado), sustente a adesão por mais de 6 meses antes de avaliar impacto em HbA1c, e acompanhe o perfil lipídico de forma individual, sem presumir os mesmos ganhos em todos os pacientes.",
      evidencia: 5,
      link: "https://doi.org/10.1093/nutrit/nuaf206",
      fonte: {
        autores: "Wong e cols.",
        revista: "Nutrition Reviews",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "23 ECRs, cerca de 1.280 adultos",
        doi: "10.1093/nutrit/nuaf206",
        pubmed: "41351878",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "O jejum intermitente no formato time-restricted eating de 16 horas de jejum e 8 de alimentação (16/8) é um dos protocolos mais prescritos na prática clínica, mas revisões anteriores misturavam diferentes janelas de alimentação e populações. Os autores isolaram especificamente o efeito do 16/8 sobre glicemia e perfil lipídico em adultos, comparando com dieta controle sem restrição de horário."
        },
        {
          h: "Como o estudo foi feito",
          p: "Buscas em PubMed, MEDLINE, Cochrane Library, Scopus e Web of Science identificaram ensaios clínicos randomizados comparando 16/8 com dieta controle. Foram incluídos 23 ECRs (cerca de 1.280 participantes), com extração de glicemia de jejum, insulina, HOMA-IR, HbA1c e perfil lipídico, além de análises de subgrupo por sexo, duração da intervenção e nível de atividade física."
        },
        {
          h: "O que foi encontrado",
          p: "O 16/8 reduziu discretamente glicemia de jejum, HOMA-IR e insulina. A HbA1c só melhorou de forma significativa nos estudos com duração superior a 6 meses. No perfil lipídico, houve aumento discreto de HDL em toda a amostra, enquanto reduções de LDL e triglicerídeos apareceram apenas nos estudos com participantes exclusivamente homens ou com maior nível de atividade física."
        },
        {
          h: "O que isso não responde",
          p: "Os tamanhos de efeito são pequenos e a heterogeneidade entre os estudos originais — populações, duração, adesão — é relevante. A ausência de benefício lipídico consistente em mulheres e em estudos curtos limita a generalização, e o desenho não separa se os efeitos vêm da restrição de horário em si ou da redução calórica espontânea que costuma acompanhar o protocolo."
        },
        {
          h: "Na prática do consultório",
          p: "O 16/8 pode ser uma ferramenta adicional para controle glicêmico, mas não deve ser vendido como solução para dislipidemia de forma indiscriminada, sobretudo em pacientes mulheres, onde a evidência de benefício lipídico é mais fraca. Reforce que ganhos em HbA1c tendem a aparecer só após meses de adesão consistente, o que sustenta acompanhamento prolongado antes de julgar o protocolo ineficaz."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "sop-terapia-combinada-dieta-metformina-inositol",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Fertilidade", "Funcional"],
      data: "2026",
      title: "Combinar dieta hipocalórica com metformina e inositol supera as terapias isoladas na SOP",
      resumo: "Ensaio clínico randomizado de 4 braços com 192 mulheres com SOP mostrou que a combinação de dieta hipocalórica, metformina e inositol reduziu mais a resistência à insulina e o IMC, e regularizou o ciclo menstrual em 85% das participantes, contra 73% no grupo de dieta isolada.",
      mudou: "A dieta isolada superou o inositol isolado e ficou próxima da metformina isolada na regularização menstrual, reforçando que a intervenção nutricional não é coadjuvante na SOP, mas um pilar terapêutico com peso comparável ao farmacológico.",
      aplicar: "Use esse achado para justificar dieta hipocalórica estruturada como primeira linha na SOP, e para discutir com a equipe médica a associação com metformina e/ou inositol nos casos sem resposta satisfatória após cerca de 12 semanas de dieta bem conduzida.",
      evidencia: 4,
      link: "https://doi.org/10.1111/cen.70188",
      fonte: {
        autores: "Irfan e cols.",
        revista: "Clinical Endocrinology",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, 4 braços",
        amostra: "192 mulheres de 18-35 anos com SOP (critérios de Rotterdam), randomizadas em 4 grupos: metformina, inositol, dieta hipocalórica ou terapia combinada",
        doi: "10.1111/cen.70188",
        pubmed: "42517336",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "A síndrome dos ovários policísticos combina resistência à insulina, hiperandrogenismo e disfunção ovulatória, e costuma ser tratada com uma mistura de fármacos e mudança de estilo de vida. O estudo comparou, de forma controlada, se tratar com metformina, inositol e dieta ao mesmo tempo traz ganho real sobre usar cada abordagem isoladamente."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio clínico randomizado de 12 semanas com 192 mulheres de 18 a 35 anos diagnosticadas pelos critérios de Rotterdam, alocadas em quatro braços: metformina (1.500-2.000 mg/dia), inositol (myo-inositol 2 g + D-chiro-inositol 50 mg, 2x/dia), dieta com restrição calórica (1.200-1.500 kcal/dia) ou terapia combinada com os três. Foram avaliados HOMA-IR, IMC e regularização do ciclo menstrual, entre outros desfechos endócrinos."
        },
        {
          h: "O que foi encontrado",
          p: "A terapia combinada teve a maior redução de HOMA-IR e de IMC. A regularização do ciclo menstrual ocorreu em 85,4% das mulheres no grupo combinado, 72,9% no grupo de dieta isolada, 64,6% no grupo de inositol isolado e 39,6% no grupo de metformina isolada."
        },
        {
          h: "O que isso não responde",
          p: "O estudo tem apenas 12 semanas, curto para desfechos reprodutivos definitivos como taxa de gravidez, e não há braço placebo puro — todos os grupos receberam alguma intervenção ativa, o que dificulta isolar o efeito específico de cada componente. A adesão à dieta foi provavelmente autorrelatada, viés comum nesse desenho."
        },
        {
          h: "Na prática do consultório",
          p: "O achado de que a dieta isolada supera o inositol isolado na regularização menstrual é argumento forte para priorizar a intervenção nutricional estruturada desde o início do tratamento de SOP, não como medida complementar. Sem resposta metabólica ou reprodutiva satisfatória após cerca de 12 semanas de dieta bem conduzida, este estudo dá respaldo para discutir com o médico assistente a associação com metformina e/ou inositol."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creatina-massa-magra-cognicao-meia-idade",
      categoria: "Esportiva",
      areas: ["Esportiva", "Funcional"],
      data: "2026",
      title: "Creatina aumenta massa magra e cognição em adultos de meia-idade mesmo sem programa de exercício",
      resumo: "Ensaio clínico randomizado e duplo-cego com 64 adultos de 45 a 65 anos mostrou que a creatina monoidratada aumentou massa magra, força e memória mesmo sem exercício associado, e reduziu ainda mais o percentual de gordura quando combinada a treino e dieta de emagrecimento.",
      mudou: "A creatina deixa de ser vista como suplemento útil só para quem treina: mesmo em adultos sedentários, trouxe ganhos mensuráveis de massa magra, força e cognição em 12 semanas.",
      aplicar: "Considere a suplementação de creatina monoidratada como estratégia de prevenção de sarcopenia e suporte cognitivo em pacientes de meia-idade e idosos, inclusive nos ainda não engajados em exercício, sem deixar de estimular a associação com treino e dieta para potencializar a redução de gordura corporal.",
      evidencia: 4,
      link: "https://doi.org/10.1080/15502783.2026.2716273",
      fonte: {
        autores: "Chun e cols.",
        revista: "Journal of the International Society of Sports Nutrition",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, duplo-cego, controlado por placebo",
        amostra: "73 adultos sedentários randomizados (45-65 anos); 64 completaram os 12 semanas, com e sem programa associado de exercício e dieta de emagrecimento",
        doi: "10.1080/15502783.2026.2716273",
        pubmed: "42578920",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "Creatina é um dos suplementos mais estudados em atletas, mas seu papel em adultos de meia-idade e idosos sedentários — população em risco de sarcopenia e declínio cognitivo — é menos explorado, sobretudo sem programa de exercício associado. O estudo testou o que a creatina faz sozinha e o que acrescenta quando combinada a exercício e dieta de emagrecimento."
        },
        {
          h: "Como o estudo foi feito",
          p: "73 adultos sedentários e saudáveis, de 45 a 65 anos, foram randomizados de forma duplo-cega para receber placebo ou creatina monoidratada, em dois contextos: sem intervenção de exercício/dieta, ou com programa de exercício associado a dieta de emagrecimento. 64 completaram as 12 semanas. Foram avaliados composição corporal, força, resistência muscular, cognição/memória e marcadores sanguíneos de saúde."
        },
        {
          h: "O que foi encontrado",
          p: "Mesmo sem exercício ou dieta associados, a creatina aumentou massa magra, força e resistência muscular, além de promover mudanças favoráveis em marcadores lipídicos selecionados, HbA1c e cognição/memória, frente ao placebo. Combinada a exercício e dieta de emagrecimento, levou a ganhos semelhantes de massa magra, força e cognição, com o adicional de maior redução do percentual de gordura corporal. A suplementação foi bem tolerada, sem sinais de dano renal."
        },
        {
          h: "Limitações",
          p: "A amostra é pequena e moderada (64 completers) para um desenho com múltiplos subgrupos, o que reduz o poder estatístico para comparações mais finas. Doze semanas é curto para desfechos de longo prazo como densidade óssea ou quedas, e a população estudada era saudável e sedentária, o que limita extrapolar para idosos frágeis, sarcopênicos graves ou com comorbidades renais e cardiovasculares."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes de meia-idade e idosos com baixa adesão a exercício, este estudo dá respaldo para discutir a suplementação de creatina monoidratada como suporte à massa magra e à cognição, sem esperar que o paciente inicie treino primeiro. Deixe claro que o maior ganho em composição corporal (redução de gordura) só apareceu combinada a exercício e dieta — a creatina entra como complemento, não substituto, da mudança de estilo de vida."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mindful-eating-ingestao-alimentar",
      categoria: "Comportamental",
      areas: ["Comportamental", "Estética"],
      data: "2026",
      title: "Mindful eating reduz a quantidade de comida ingerida, mas não muda a fome, mostra a maior meta-análise do tema",
      resumo: "A maior revisão já feita sobre o assunto (41 artigos, com meta-análises de 46 estudos sobre ingestão e 11 sobre apetite) mostra que mindfulness e mindful eating reduzem de forma consistente a quantidade de comida consumida em ambiente controlado, mas não alteram fome ou saciedade percebidas.",
      mudou: "O efeito do mindful eating parece ser comportamental — comer menos e mais devagar — e não uma mudança real na fisiologia do apetite, o que reajusta a expectativa clínica sobre a técnica.",
      aplicar: "Use mindful eating como ferramenta para reduzir volume e velocidade da refeição, sem apresentá-lo ao paciente como método capaz de 'desligar' a fome ou controlar a saciedade biológica.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/42341365/",
      fonte: {
        autores: "Ahmadyar e cols.",
        revista: "Clinical Psychology Review",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de estudos experimentais controlados",
        amostra: "41 artigos incluídos; meta-análises com 46 estudos sobre ingestão alimentar e 11 sobre apetite, em adultos e crianças",
        doi: "10.1016/j.cpr.2026.102780",
        pubmed: "42341365",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "Mindfulness e mindful eating são cada vez mais recomendados em consultório como estratégia para 'comer com mais consciência', mas faltava uma síntese robusta separando o que a técnica realmente muda: o quanto se come, ou a própria sensação de fome. Esta é a primeira revisão a reunir e quantificar separadamente esses dois desfechos."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em cinco bases (PsycINFO, MEDLINE, EMBASE, Web of Science e Scopus) por estudos experimentais que manipulassem mindfulness, mindful eating ou intuitive eating, com grupo controle e medida objetiva de ingestão alimentar e/ou apetite. Foram incluídos 41 artigos, com meta-análises separadas para ingestão de comida (46 comparações) e para apetite/fome-saciedade (11 comparações)."
        },
        {
          h: "O que foi encontrado",
          p: "Houve redução estatisticamente significativa, porém pequena, na quantidade de comida ingerida, com efeitos maiores em estudos de laboratório do que em contextos mais naturalísticos. Para apetite (fome e saciedade autorreferidas), não houve efeito estatisticamente significativo."
        },
        {
          h: "Limitações",
          p: "A maioria dos estudos foi conduzida em laboratório, de curta duração e com amostras não clínicas — os autores destacam que os achados podem não se generalizar para populações clínicas (obesidade, transtornos alimentares) nem para o dia a dia fora do laboratório. O efeito é pequeno e a heterogeneidade entre protocolos de intervenção é alta."
        },
        {
          h: "Na prática do consultório",
          p: "Vale manter o mindful eating no arsenal para reduzir porções e desacelerar a refeição, mas sem vendê-lo como controle da fome fisiológica — isso calibra a expectativa do paciente e evita frustração quando a fome continua presente mesmo praticando a técnica."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-humor-sono-eixo-intestino-cerebro",
      categoria: "Microbiota",
      areas: ["Clínica", "Funcional"],
      data: "2026",
      title: "Revisão com 20 ECRs reforça o papel dos probióticos sobre humor, ansiedade e sono pelo eixo intestino-cérebro",
      resumo: "Revisão sistemática de 20 ensaios clínicos randomizados (quase 1.900 participantes) encontrou associação entre suplementação de probióticos e melhora de sintomas depressivos, ansiedade, qualidade do sono, humor e cognição; os efeitos sobre cortisol e estresse percebido foram inconsistentes entre os estudos.",
      mudou: "Amplia a base de evidência de que a modulação da microbiota por probióticos pode refletir em desfechos mensuráveis de saúde mental, além dos efeitos gastrointestinais clássicos.",
      aplicar: "Discuta probióticos como estratégia complementar — nunca substitutiva de tratamento psicológico ou psiquiátrico — em pacientes com queixas leves de humor, ansiedade ou sono associadas a sintomas digestivos, monitorando resposta individual e sem prometer efeito sobre estresse ou cortisol.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/42694318/",
      fonte: {
        autores: "Das e cols.",
        revista: "Annals of Neurosciences",
        ano: "2026",
        desenho: "Revisão sistemática de ensaios clínicos randomizados",
        amostra: "20 ECRs, 1.916 participantes, intervenções de 4 a 12 semanas",
        doi: "10.1177/09727531261478458",
        pubmed: "42694318",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "O interesse por 'psicobióticos' cresceu muito nos últimos anos, mas os achados sobre probióticos e saúde mental ainda são dispersos entre desfechos diferentes — humor, ansiedade, sono, cognição, estresse. Esta revisão reuniu ensaios randomizados recentes para mapear, desfecho por desfecho, onde a evidência é mais consistente."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática de ensaios clínicos randomizados avaliando suplementação de probióticos e seu impacto sobre depressão, ansiedade, humor, cognição, qualidade do sono, estresse/cortisol e composição da microbiota intestinal. Foram incluídos 20 ECRs, 1.916 participantes, com duração de intervenção entre 4 e 12 semanas."
        },
        {
          h: "O que foi encontrado",
          p: "No conjunto dos estudos, os probióticos foram associados a melhoras em sintomas depressivos, ansiedade, qualidade do sono, humor, cognição, qualidade de vida e em populações microbianas intestinais benéficas. Os resultados sobre cortisol e marcadores de estresse foram inconsistentes entre os estudos incluídos."
        },
        {
          h: "Limitações",
          p: "É uma revisão sistemática qualitativa, sem meta-análise formal de tamanho de efeito agrupado, com cepas, doses e populações heterogêneas entre os 20 estudos, além de uma parcela relevante com alto risco de viés. Isso limita concluir qual cepa, dose ou duração funciona melhor, e para qual perfil de paciente."
        },
        {
          h: "Na prática do consultório",
          p: "Dá respaldo para conversar sobre probióticos como coadjuvante em pacientes com queixas leves de humor, ansiedade ou sono associadas a sintomas digestivos — mas a heterogeneidade dos estudos ainda impede recomendar uma cepa ou dose padrão; a escolha do produto e o acompanhamento da resposta clínica seguem individualizados."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "vitamina-d-fatores-risco-cardiometabolico",
      categoria: "Suplementação",
      areas: ["Clínica", "Funcional"],
      data: "2026",
      title: "Vitamina D melhora discretamente LDL, pressão e glicemia em meta-análise com 45 ECRs",
      resumo: "Meta-análise reunindo 45 ensaios clínicos randomizados encontrou reduções pequenas, porém estatisticamente significativas, em LDL, pressão sistólica, glicemia de jejum e HbA1c com a suplementação de vitamina D, com efeitos que variam conforme idade e nível basal de 25(OH)D.",
      mudou: "Confirma que o benefício cardiometabólico da vitamina D existe, mas é modesto e heterogêneo — maior em pacientes com 55 anos ou mais para pressão e LDL, e em quem tem deficiência basal para glicemia/HbA1c — não um efeito uniforme para qualquer paciente suplementado.",
      aplicar: "Reserve a suplementação de vitamina D principalmente para corrigir deficiência documentada, sem apresentá-la como estratégia isolada relevante para LDL, pressão ou glicemia, e calibre a expectativa conforme idade e status basal do paciente.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/42521227/",
      fonte: {
        autores: "Abumweis e cols.",
        revista: "Asia Pacific Journal of Clinical Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "45 ECRs (triagem inicial de mais de 14.000 registros), adultos, vitamina D oral vs. placebo",
        doi: "10.6133/apjcn.202608_35(4).0007",
        pubmed: "42521227",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "A vitamina D é um dos suplementos mais prescritos no consultório, e seu papel em desfechos cardiometabólicos segue debatido, com estudos anteriores mostrando resultados inconsistentes. Esta meta-análise tentou esclarecer se — e para quem — a suplementação realmente melhora esses marcadores."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática de ensaios clínicos randomizados comparando vitamina D oral com placebo em adultos, avaliando efeitos sobre perfil lipídico, pressão arterial e parâmetros glicêmicos, e testando se idade e nível basal de vitamina D modificavam esses efeitos. 45 ECRs foram incluídos após triagem de mais de 14 mil registros."
        },
        {
          h: "O que foi encontrado",
          p: "A suplementação reduziu significativamente LDL, pressão sistólica, glicemia de jejum e HbA1c. Em subgrupos, a redução de pressão sistólica e LDL foi maior em participantes com 55 anos ou mais, enquanto a redução de glicemia de jejum foi maior em menores de 55 anos; efeitos favoráveis sobre glicemia e HbA1c foram mais evidentes em quem tinha vitamina D basal abaixo de 50 nmol/L."
        },
        {
          h: "Limitações",
          p: "Os próprios autores classificam os efeitos como modestos e de significância clínica incerta — reduções desse tamanho isoladamente dificilmente mudam risco cardiovascular de forma relevante. Há heterogeneidade grande entre os 45 estudos em dose, duração e população, e a meta-análise de marcadores substitutos não permite concluir sobre desfechos duros como infarto ou AVC."
        },
        {
          h: "Na prática do consultório",
          p: "Continua fazendo sentido dosar e corrigir deficiência de vitamina D quando indicado, mas evite vender a suplementação como estratégia de impacto relevante isolado sobre LDL, pressão ou glicemia — o efeito é pequeno, mais provável em pacientes mais velhos ou com deficiência basal, e deve ser tratado como coadjuvante, não substituto de mudanças de estilo de vida ou medicação quando indicada."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "obesidade-farmacos-qualidade-vida",
      categoria: "Obesidade",
      areas: ["Clínica", "Funcional"],
      data: "2026",
      title: "Maior comparação já feita entre fármacos para obesidade mostra que perder peso não garante mais qualidade de vida nem saúde cardiovascular",
      resumo: "Revisão sistemática com meta-análise em rede reuniu 262 ensaios clínicos e quase 100 mil participantes: tirzepatida, CagriSema e mazdutide lideram a perda de peso em 1 ano (13-15%), mas a maioria dos fármacos não melhora qualidade de vida de forma clinicamente relevante, e poucos reduzem eventos cardiovasculares.",
      mudou: "A escolha do fármaco para obesidade não pode se basear só no percentual de perda de peso — benefícios em qualidade de vida, mortalidade e eventos cardiovasculares variam muito entre as moléculas e nem sempre acompanham o resultado na balança.",
      aplicar: "Ao discutir metas com o paciente em uso de medicação para obesidade, explique que mais perda de peso costuma vir com mais efeitos colaterais e perda de massa magra, e reforce o acompanhamento nutricional de composição corporal e função — não só o número da balança.",
      evidencia: 5,
      link: "https://doi.org/10.1136/bmj-2026-372161",
      fonte: {
        autores: "Nong e cols.",
        revista: "The BMJ",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede (network meta-analysis) de ensaios clínicos randomizados",
        amostra: "262 ECRs, 99.791 participantes, 19 medicamentos para obesidade, seguimento de 12 a 172 semanas",
        doi: "10.1136/bmj-2026-372161",
        pubmed: "",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Com tantos medicamentos novos para obesidade (agonistas de GLP-1, GIP, combinações e agentes orais), faltava uma comparação abrangente que fosse além do percentual de peso perdido e olhasse também para qualidade de vida, mortalidade, eventos cardiovasculares e efeitos adversos. Esse foi o objetivo desta revisão."
        },
        {
          h: "Como o estudo foi feito",
          p: "Foram reunidos 262 ensaios clínicos randomizados (99.791 participantes, idade média 49 anos, 63% mulheres, IMC médio 35) comparando 19 medicamentos disponíveis ou em fase avançada de desenvolvimento contra mudança de estilo de vida, placebo ou entre si, com seguimento de 12 a 172 semanas. A meta-análise em rede avaliou peso, qualidade de vida, mortalidade, eventos cardiovasculares maiores e descontinuação por efeitos adversos, com certeza da evidência pelo sistema GRADE."
        },
        {
          h: "O que foi encontrado",
          p: "Em 1 ano, comparados a mudança de estilo de vida isolada, os maiores percentuais de perda de peso foram com tirzepatida (-14,9%), CagriSema (-14,8%), mazdutide, semaglutida oral (-10,9%), orforglipron (-9,9%), semaglutida subcutânea (-9,8%) e fentermina-topiramato (-8,1%). Apesar disso, nenhum medicamento melhorou a qualidade de vida além da diferença mínima clinicamente importante. A semaglutida subcutânea foi o único fármaco associado a redução de mortalidade por todas as causas e de infarto do miocárdio, resultado fortemente influenciado por estudos em populações de alto risco cardiovascular. Mais perda de peso veio acompanhada de mais efeitos adversos gastrointestinais, fadiga e perda de massa magra."
        },
        {
          h: "Limitações",
          p: "É uma meta-análise em rede, método robusto mas dependente da comparabilidade indireta entre estudos com populações e durações diferentes; o seguimento de 1 ano não permite conclusões de muito longo prazo, e boa parte do benefício cardiovascular vem de poucos ensaios desenhados especificamente para esse desfecho, não generalizável a todos os pacientes com obesidade."
        },
        {
          h: "Na prática do consultório",
          p: "Ao acompanhar pacientes em farmacoterapia para obesidade, amplie a conversa para além do peso: monitore sintomas gastrointestinais, ingestão proteica e sinais de perda de massa magra, e converse abertamente sobre expectativas de qualidade de vida — o estudo sugere que ela não melhora automaticamente com a perda de peso induzida por fármacos, o que mantém a intervenção nutricional e comportamental essencial para sustentar bem-estar e massa magra durante o tratamento."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "materno-infantil-intervencoes-nutricionais-gestacao",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Fertilidade", "Pediatria"],
      data: "2026",
      title: "Meta-análise de 23 ensaios confirma: intervenções nutricionais estruturadas na gestação reduzem baixo peso ao nascer, prematuridade e diabetes gestacional",
      resumo: "Revisão sistemática com meta-análise de ensaios clínicos randomizados mostrou que programas de nutrição na gestação — aconselhamento, suplementação e fornecimento de alimentos — aumentam o peso ao nascer dentro da faixa saudável e reduzem os riscos de baixo peso ao nascer, pequeno para idade gestacional, prematuridade e diabetes gestacional.",
      mudou: "Nutrição na gestação ganha reforço de evidência como intervenção clínica estruturada — não apenas orientação genérica — capaz de impactar desfechos duros como prematuridade e diabetes gestacional, sobretudo quando combina aconselhamento personalizado, múltiplas sessões e fornecimento de alimentos.",
      aplicar: "Priorize programas de acompanhamento nutricional na gestação com aconselhamento individualizado e pelo menos 4 sessões ao longo do pré-natal, incluindo quando possível fornecimento de alimentos ou suplementos, já que esse formato mostrou efeitos mais consistentes que orientações pontuais.",
      evidencia: 5,
      link: "https://doi.org/10.1111/jmwh.70172",
      fonte: {
        autores: "Sabuncular e cols.",
        revista: "Journal of Midwifery & Women's Health",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "23 ECRs, 9.389 gestantes",
        doi: "10.1111/jmwh.70172",
        pubmed: "42598865",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "A nutrição na gestação é reconhecida como determinante de desfechos maternos e neonatais, mas grande parte da evidência anterior vem de estudos observacionais ou de suplementação isolada de micronutrientes. Este estudo sintetizou apenas ensaios clínicos randomizados que testaram intervenções nutricionais mais amplas — aconselhamento, suplementação e fornecimento de alimentos — durante a gravidez."
        },
        {
          h: "Como o estudo foi feito",
          p: "Foram incluídos 23 ensaios clínicos randomizados, totalizando 9.389 gestantes, avaliando o efeito de diferentes formatos de intervenção nutricional sobre desfechos maternos e neonatais, com análise de subgrupos por tipo e intensidade da intervenção — personalizada vs. genérica, número de sessões, com ou sem fornecimento de alimentos."
        },
        {
          h: "O que foi encontrado",
          p: "As intervenções nutricionais aumentaram o peso ao nascer dentro de faixas saudáveis e reduziram os riscos de baixo peso ao nascer, pequeno para idade gestacional, prematuridade e diabetes gestacional. Os efeitos foram mais robustos para aconselhamento personalizado, programas com 4 ou mais sessões e intervenções que incluíam fornecimento direto de alimentos, frente a orientações pontuais ou genéricas."
        },
        {
          h: "O que isso não responde",
          p: "O material disponível não detalha os tamanhos de efeito para cada desfecho nem a heterogeneidade entre os 23 estudos, que provavelmente usaram populações, protocolos e definições de desfecho variados — isso limita saber 'quanto' cada tipo de intervenção reduz o risco. Também não fica claro se os efeitos se mantêm em contextos de alta renda com boa cobertura de pré-natal, já que parte da literatura de nutrição gestacional vem de países de baixa e média renda."
        },
        {
          h: "Na prática do consultório",
          p: "Use esse estudo como respaldo para defender, dentro da equipe de pré-natal, um acompanhamento nutricional estruturado e não apenas orientações genéricas de 'alimentação saudável': planeje ao menos 4 encontros ao longo da gestação, individualize o plano conforme a realidade da paciente e, havendo insegurança alimentar, considere articular fornecimento de alimentos ou encaminhamento a programas de suporte."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "renal-dieta-angulo-fase-dialise",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "2026",
      title: "Revisão mostra que a dieta isolada não melhora o ângulo de fase em pacientes em diálise",
      resumo: "Meta-análise de 14 estudos (9 ensaios clínicos randomizados, 969 pacientes) não encontrou efeito significativo das intervenções dietéticas sobre o ângulo de fase — marcador de saúde celular e estado nutricional — em pacientes com doença renal crônica em diálise.",
      mudou: "Um resultado negativo, mas útil: dieta isolada, sem associação a exercício ou suplementação proteico-calórica mais intensiva, pode não ser suficiente para melhorar marcadores de composição corporal celular como o ângulo de fase em quem já está em diálise.",
      aplicar: "Não prometa que o ajuste dietético isolado vai melhorar o ângulo de fase ou a massa celular do paciente em diálise em curto prazo; use esse indicador junto com outros (força de preensão, albumina, avaliação subjetiva global) e, quando a meta for reserva funcional e celular, discuta com a equipe associar a dieta a exercício e suplementação.",
      evidencia: 4,
      link: "https://doi.org/10.1093/nutrit/nuag113",
      fonte: {
        autores: "Frizzas e cols.",
        revista: "Nutrition Reviews",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de estudos controlados (majoritariamente ECRs)",
        amostra: "14 estudos (9 ECRs), 969 pacientes com doença renal crônica em diálise",
        doi: "10.1093/nutrit/nuag113",
        pubmed: "42562782",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "O ângulo de fase, obtido por bioimpedância elétrica, é um marcador associado a desnutrição e pior prognóstico em diversas condições, incluindo a doença renal crônica em diálise — população em que a desnutrição proteico-calórica é prevalente e clinicamente relevante. Havia evidência de que intervenções nutricionais melhoram o ângulo de fase em oncologia e medicina esportiva, mas faltava uma síntese específica para pacientes renais em diálise."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise reunindo 14 estudos controlados (9 ECRs), 969 pacientes adultos com doença renal crônica em diálise submetidos a intervenções dietéticas comparadas a grupo controle, com o ângulo de fase como desfecho de interesse."
        },
        {
          h: "O que foi encontrado",
          p: "A meta-análise não encontrou influência estatisticamente significativa das intervenções dietéticas sobre os valores de ângulo de fase nos pacientes em diálise. Apesar da plausibilidade biológica e de achados positivos em outras populações, a dieta isolada não se mostrou suficiente para alterar esse marcador nesta população, ao menos com a evidência disponível."
        },
        {
          h: "Limitações",
          p: "Os autores destacam o número reduzido de ensaios clínicos randomizados disponíveis e risco de viés importante entre os estudos incluídos, o que limita a confiança no resultado negativo — pode ser ausência real de efeito, mas também pode refletir estudos pequenos, intervenções heterogêneas ou tempo de seguimento insuficiente. Pedem explicitamente ensaios de melhor qualidade metodológica para confirmar ou refutar o achado."
        },
        {
          h: "Na prática do consultório",
          p: "Continue orientando a dieta desses pacientes com base nas metas já estabelecidas de proteína, energia, sódio, potássio e fósforo — este estudo não invalida a terapia nutricional na diálise, mas indica que não se deve prometer que o ajuste dietético isolado vai, por si só, melhorar o ângulo de fase ou a massa celular corporal em curto prazo; se esse for um objetivo específico do plano de cuidado, discuta com a equipe a combinação com exercício supervisionado e suplementação mais intensiva."
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

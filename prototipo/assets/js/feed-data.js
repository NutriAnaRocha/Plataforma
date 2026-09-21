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
    texto: "Meta-análise em rede põe a alimentação com restrição de horário à frente do jejum curto para diabetes tipo 2, a mesma estratégia mostra ganho na resistência à insulina da síndrome que acaba de ser renomeada de SOP para PMOS, cafeína não sustenta o desempenho de atletas mulheres de vôlei, um ensaio brasileiro testa mindful eating em obesidade com ansiedade generalizada, probióticos seguem de olho no eixo intestino-cérebro, ômega-3 mostra efeito pequeno sobre comportamento antissocial, a maior comparação de fármacos já feita em obesidade pediátrica, programas nutricionais estruturados no pré-natal reduzem desfechos adversos e a dieta isolada segue sem mudar o ângulo de fase na diálise. Cada card abre a leitura completa com o link do estudo original."
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
      id: "tre-cer-diabetes-tipo-2-rede",
      categoria: "Clínica",
      areas: ["Clínica", "Funcional"],
      data: "15 jul 2026",
      title: "Meta-análise em rede compara jejum e restrição calórica em diabetes tipo 2 e coloca a alimentação com restrição de horário à frente",
      resumo: "Revisão sistemática com meta-análise em rede de 13 ECRs (805 adultos com sobrepeso ou obesidade e diabetes tipo 2) comparou alimentação com restrição de horário (TRE), jejum de curto prazo e restrição calórica contínua: a TRE liderou o ranqueamento de eficácia para HbA1c, peso, IMC, cintura e glicemia de jejum frente à dieta geral, com a restrição calórica contínua obtendo resultados parecidos.",
      mudou: "Numa comparação direta entre as estratégias de jejum e restrição calórica mais usadas na prática, a TRE aparece à frente das demais — mas por margem pequena sobre a restrição calórica contínua, e a evidência para o jejum de curto prazo ainda é considerada insuficiente para conclusões firmes.",
      aplicar: "Ao escolher entre TRE, jejum de curto prazo e restrição calórica contínua para pacientes com diabetes tipo 2 e sobrepeso/obesidade, priorize a estratégia que sustente melhor adesão: os ganhos metabólicos da TRE e da restrição calórica contínua foram semelhantes nesta meta-análise, o que dá liberdade para individualizar pela rotina do paciente em vez de seguir um protocolo fixo.",
      evidencia: 5,
      link: "https://doi.org/10.3389/fnut.2026.1853598",
      fonte: {
        autores: "Xu e cols.",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede (network meta-analysis) de ensaios clínicos randomizados",
        amostra: "13 ECRs, 805 adultos com sobrepeso ou obesidade e diabetes tipo 2",
        doi: "10.3389/fnut.2026.1853598",
        pubmed: "42528610",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "TRE (alimentação com janela de horário restrita), jejum de curto prazo (dias alternados ou protocolos como o 5:2) e restrição calórica contínua são as três estratégias dietéticas mais discutidas para diabetes tipo 2 com sobrepeso/obesidade, mas raramente foram comparadas entre si de forma direta e simultânea. O estudo usou meta-análise em rede para ranquear qual delas traz mais benefício metabólico frente à dieta geral sem restrição."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca sistemática em PubMed, Embase, Web of Science e Cochrane Library identificou 13 ensaios clínicos randomizados (805 participantes) comparando TRE, jejum de curto prazo, restrição calórica contínua ou dieta geral em adultos com sobrepeso/obesidade e diabetes tipo 2. Os desfechos — HbA1c, peso corporal, IMC, circunferência da cintura, glicemia de jejum e colesterol total — foram sintetizados por meta-análise em rede de efeitos aleatórios, com ranqueamento das intervenções pelo método SUCRA."
        },
        {
          h: "O que foi encontrado",
          p: "Frente à dieta geral, a TRE reduziu significativamente HbA1c (diferença média de -0,55%), peso corporal (-2,32 kg), IMC (-1,32 kg/m²), circunferência da cintura (-3,69 cm), glicemia de jejum (-0,85 mmol/L) e colesterol total (-0,17 mmol/L), ficando em primeiro lugar no ranqueamento SUCRA na maioria dos desfechos. A restrição calórica contínua teve efeitos favoráveis de magnitude parecida. Já o jejum de curto prazo não teve evidência suficiente para conclusões definitivas nesta análise."
        },
        {
          h: "O que isso não responde",
          p: "O número de ensaios por comparação direta é pequeno, o que enfraquece a robustez de algumas estimativas da rede, e há heterogeneidade relevante nos protocolos de TRE e de restrição calórica entre os estudos originais. A maioria teve seguimento curto, o que não permite avaliar se as diferenças entre TRE e restrição calórica contínua se sustentam a longo prazo."
        },
        {
          h: "Na prática do consultório",
          p: "Este ranqueamento é um bom argumento para manter a TRE como opção de primeira linha ao lado da restrição calórica contínua em pacientes com diabetes tipo 2 e sobrepeso/obesidade, mas a diferença entre as duas é pequena — na prática, a escolha deve seguir o que o paciente consegue sustentar, não um protocolo 'vencedor' fixo. Para o jejum de curto prazo, mantenha cautela até haver mais ECRs específicos."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "tre-pmos-sop-resistencia-insulina",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Fertilidade", "Funcional"],
      data: "26 jun 2026",
      title: "SOP foi renomeada para PMOS em consenso global — e a primeira meta-análise sob o novo nome confirma ganho de sensibilidade à insulina com o jejum de horário restrito",
      resumo: "Em maio de 2026, um consenso publicado na The Lancet, reunindo 56 organizações e mais de 14 mil respondentes, renomeou a síndrome dos ovários policísticos (SOP) para 'Polyendocrine Metabolic Ovarian Syndrome' (PMOS). Já sob o novo nome, uma meta-análise de 4 ECRs (216 mulheres) mostrou que a alimentação com restrição de horário (TRE) melhora HOMA-IR, QUICKI e HDL frente aos grupos controle.",
      mudou: "Você vai começar a ver 'PMOS' em vez de 'SOP' na literatura internacional — é a mesma condição, com nome escolhido para deixar claro que ela é endócrino-metabólica, não uma doença restrita ao ovário. No campo prático, a evidência de que a TRE melhora a resistência à insulina nessa população ganha reforço, mesmo com poucos estudos disponíveis ainda.",
      aplicar: "Comece a adotar o termo PMOS (ou 'SOP/PMOS') na comunicação com pacientes e equipe multiprofissional, explicando a mudança de nome sem alarde. Na conduta, a TRE segue como estratégia dietética válida para melhorar sensibilidade à insulina nessa população, mas com base em apenas 4 ensaios pequenos — trate como opção promissora, não como consenso fechado.",
      evidencia: 5,
      link: "https://doi.org/10.3390/nu18132096",
      fonte: {
        autores: "Hamsho e cols.",
        revista: "Nutrients",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "4 ECRs, 216 mulheres com PMOS (SOP)",
        doi: "10.3390/nu18132096",
        pubmed: "42451100",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "Antes do estudo: por que o nome mudou",
          p: "Em maio de 2026, a The Lancet publicou o resultado de um processo de consenso global de cerca de uma década, com 56 organizações acadêmicas, clínicas e de pacientes e mais de 14.300 respondentes em pesquisas internacionais, propondo substituir 'síndrome dos ovários policísticos' (SOP) por 'Polyendocrine Metabolic Ovarian Syndrome' (PMOS). A justificativa: o nome antigo sugere doença ovariana e cistos patológicos, o que não é a realidade para todas as pacientes, obscurece as disfunções endócrinas e metabólicas centrais do quadro (resistência à insulina, hiperandrogenismo) e contribui para diagnóstico tardio. É a mesma condição clínica, apenas com nome novo — a implementação segue em estágios."
        },
        {
          h: "A pergunta do estudo",
          p: "Já usando a nova nomenclatura, esta revisão avaliou se a alimentação com restrição de horário (TRE) melhora desfechos metabólicos, hormonais e antropométricos em mulheres com PMOS, uma população em que resistência à insulina é praticamente central ao quadro."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em PubMed, Embase, Scopus e Web of Science identificou 4 ensaios clínicos randomizados com 216 mulheres com PMOS — três comparando TRE com restrição calórica e um com ingestão livre (ad libitum). Foram extraídos HOMA-IR, QUICKI, perfil lipídico e medidas antropométricas, com meta-análise de efeitos aleatórios."
        },
        {
          h: "O que foi encontrado",
          p: "Frente aos grupos controle, a TRE melhorou significativamente o HOMA-IR (diferença média de -0,58) e a sensibilidade à insulina pelo QUICKI (diferença média de 0,08), além de elevar o HDL (diferença média de 1,97 mg/dL). A adesão relatada nos estudos incluídos foi boa."
        },
        {
          h: "O que isso não responde",
          p: "Apenas 4 ECRs pequenos sustentam esse achado, com protocolos de TRE heterogêneos entre si (janelas de horário e duração variadas) e amostras modestas. Não há dados suficientes aqui sobre desfechos reprodutivos (ovulação, gravidez) nem sobre manutenção do efeito após o fim da intervenção."
        },
        {
          h: "Na prática do consultório",
          p: "Dá respaldo para oferecer a TRE como estratégia dietética em mulheres com PMOS/SOP focadas em melhorar resistência à insulina, dentro de um plano mais amplo — mas com a quantidade de evidência ainda pequena, calibre a expectativa da paciente e monitore a resposta individual em vez de prometer resultado padronizado."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "cafeina-volei-feminino-desempenho",
      categoria: "Esportiva",
      areas: ["Esportiva"],
      data: "08 jul 2026",
      title: "Primeira meta-análise focada em mulheres não confirma efeito ergogênico da cafeína no vôlei",
      resumo: "Revisão sistemática com meta-análise de três níveis, reunindo 5 estudos (66 jogadoras de vôlei), não encontrou evidência consistente de que a cafeína aguda (2 a 6,4 mg/kg) melhore desempenho técnico, físico ou fisiológico nessa população, com certeza da evidência classificada como muito baixa pelo GRADE e relatos de efeitos adversos como tremor e ansiedade em algumas atletas.",
      mudou: "A maior parte da evidência sobre cafeína e vôlei vem de homens ou amostras mistas — este é o primeiro recorte específico para mulheres, e o resultado contraria a expectativa comum de benefício ergogênico consistente.",
      aplicar: "Não trate a suplementação de cafeína como benefício garantido para atletas mulheres de vôlei: avalie resposta individual (inclusive efeitos colaterais como tremor e ansiedade) antes de padronizar a estratégia pré-jogo, e explique à atleta que a evidência específica para o esporte e o sexo dela ainda é muito limitada.",
      evidencia: 5,
      link: "https://doi.org/10.3389/fnut.2026.1880118",
      fonte: {
        autores: "Zhang e cols.",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de três níveis (three-level meta-analysis) de ensaios clínicos randomizados, majoritariamente crossover e duplo-cegos",
        amostra: "5 estudos, 66 atletas mulheres de vôlei",
        doi: "10.3389/fnut.2026.1880118",
        pubmed: "42488219",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Cafeína é um dos suplementos ergogênicos mais estudados, mas quase toda a evidência em vôlei vinha de atletas homens ou de amostras mistas. Este estudo isolou o efeito da suplementação aguda de cafeína sobre desempenho físico, fisiológico e técnico-específico (ataque/spike) em jogadoras de vôlei, e explorou de forma preliminar o papel do ciclo menstrual, da dose e do momento de ingestão."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca sistemática em março de 2026 nas bases PubMed, Web of Science, Cochrane Library e ProQuest, seguindo PRISMA 2020 e registro prospectivo no PROSPERO, identificou ensaios clínicos randomizados com cafeína aguda (2 a 6,4 mg/kg) em jogadoras de vôlei. Qualidade metodológica avaliada pelas escalas PEDro e RoB 2, com certeza da evidência classificada pelo sistema GRADE, e síntese por meta-análise de três níveis."
        },
        {
          h: "O que foi encontrado",
          p: "A meta-análise, com apenas 5 estudos e 66 atletas, não encontrou evidência consistente de efeito ergogênico da cafeína sobre desempenho técnico específico (ataque), desempenho físico (salto vertical, mudança de direção, força de preensão manual, potência) ou desfechos fisiológicos (frequência cardíaca). Houve relatos de efeitos adversos como tremores nas mãos e ansiedade em algumas participantes. A certeza global da evidência foi classificada como muito baixa pelo GRADE."
        },
        {
          h: "Limitações",
          p: "O número de estudos e participantes é muito pequeno (5 estudos, 66 atletas) para um desfecho tão dependente de contexto esportivo, o que limita o poder estatístico e a generalização. A heterogeneidade de protocolos (dose, timing) e a amostra restrita a nível competitivo e faixa etária específicos também pesam na leitura do resultado nulo — é um achado que contraria a expectativa, mas ainda precisa de mais estudos para ser confirmado."
        },
        {
          h: "Na prática do consultório",
          p: "Ao orientar cafeína pré-jogo para atletas mulheres de vôlei, não presuma ganho de desempenho automático: teste a resposta individual com cautela, observe efeitos colaterais como tremor e ansiedade — que podem atrapalhar mais do que ajudar em um esporte técnico — e mantenha a decisão caso a caso até que estudos maiores e mais específicos estejam disponíveis."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mindfulness-eating-obesidade-ansiedade",
      categoria: "Comportamental",
      areas: ["Comportamental", "Estética"],
      data: "15 jul 2026",
      title: "Ensaio brasileiro testa mindful eating em obesidade com ansiedade generalizada e mede o efeito sobre controle inibitório",
      resumo: "Ensaio clínico randomizado piloto, conduzido no Hospital de Clínicas de Porto Alegre com 70 adultos com obesidade e transtorno de ansiedade generalizada, testou 5 semanas de mindful eating em grupo contra um vídeo educativo, com controle inibitório (teste Go/No-Go) como desfecho primário, além de avaliar a viabilidade de medir estigma de peso internalizado no desenho do estudo.",
      mudou: "É um estudo de viabilidade, não um ECR definitivo de eficácia — mas o achado exploratório de que o tempo de tela atenua o efeito protetor da apreciação corporal sobre o estigma de peso internalizado chama atenção para um fator pouco discutido na prática: o uso de telas pode interferir na forma como a paciente lida com o próprio corpo durante o tratamento.",
      aplicar: "Ao incluir mindful eating no plano de pacientes com obesidade e ansiedade, pergunte também sobre tempo de tela e uso de redes sociais — este estudo piloto sugere que esse hábito pode enfraquecer o benefício da apreciação corporal sobre o estigma de peso internalizado, um ponto a explorar na anamnese comportamental.",
      evidencia: 4,
      link: "https://doi.org/10.1016/j.lana.2026.101541",
      fonte: {
        autores: "Kim e cols.",
        revista: "The Lancet Regional Health – Americas",
        ano: "2026",
        desenho: "Ensaio clínico randomizado piloto/de viabilidade, com grupo controle ativo (vídeo educativo)",
        amostra: "70 adultos com obesidade e transtorno de ansiedade generalizada (36 no grupo de mindful eating, 34 no controle), Hospital de Clínicas de Porto Alegre",
        doi: "10.1016/j.lana.2026.101541",
        pubmed: "42482693",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Mindfulness-based eating (ME) é cada vez mais estudado para obesidade, mas sua associação com transtorno de ansiedade generalizada (TAG) — condição comum nessa população — é pouco explorada. O estudo, conduzido no Brasil, testou os efeitos agudos do ME sobre controle inibitório em adultos com obesidade e TAG, e avaliou a viabilidade de incorporar a medida de estigma de peso internalizado (IWS) no desenho de futuros ECRs maiores."
        },
        {
          h: "Como o estudo foi feito",
          p: "Setenta adultos com obesidade e TAG foram randomizados para 5 semanas de ME em grupo (n=36) ou um vídeo educativo assíncrono de saúde como controle ativo (n=34). O desfecho primário foi o controle inibitório, medido pelo teste Go/No-Go; desfechos secundários incluíram apreciação corporal, estigma de peso internalizado e tempo de tela."
        },
        {
          h: "O que foi encontrado",
          p: "O estudo confirmou a viabilidade de medir estigma de peso internalizado dentro de um ECR sobre obesidade e ansiedade. Um achado exploratório relevante foi que o tempo de uso de telas modera a relação entre apreciação corporal e estigma de peso internalizado: quanto maior o uso de dispositivos, menor o efeito protetor da apreciação corporal sobre o estigma internalizado."
        },
        {
          h: "O que isso não responde",
          p: "É um estudo piloto/de viabilidade, com amostra pequena e curta duração (5 semanas) — não foi desenhado para provar eficácia definitiva do ME sobre controle inibitório ou peso corporal, e sim para testar se o desenho de pesquisa funciona. O achado sobre tempo de tela é exploratório e precisa de confirmação em estudos maiores antes de virar recomendação padrão."
        },
        {
          h: "Na prática do consultório",
          p: "Vale manter mindful eating no plano de pacientes com obesidade e ansiedade, mas sem esperar mudança rápida em 5 semanas — e vale abrir espaço na consulta para perguntar sobre tempo de tela e redes sociais, já que esse hábito pode interferir em como a paciente relaciona apreciação corporal e estigma de peso internalizado, segundo este achado ainda preliminar."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-humor-sono-eixo-intestino-cerebro",
      categoria: "Microbiota",
      areas: ["Clínica", "Funcional"],
      data: "01 set 2026",
      title: "Revisão com 20 ECRs reforça o papel dos probióticos sobre humor, ansiedade e sono pelo eixo intestino-cérebro",
      resumo: "Revisão sistemática de 20 ensaios clínicos randomizados (1.916 participantes) encontrou associação entre suplementação de probióticos e melhora de sintomas depressivos, ansiedade, qualidade do sono, humor e cognição; os efeitos sobre cortisol e estresse percebido foram inconsistentes entre os estudos.",
      mudou: "Segue sendo o maior conjunto de evidência publicado até agora sobre probióticos e desfechos de saúde mental — a leitura desta semana é a mesma revisão já destacada anteriormente, mantida no feed por ainda ser a mais recente e robusta disponível no tema.",
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
      id: "omega-3-comportamento-antissocial",
      categoria: "Suplementação",
      areas: ["Clínica", "Pediatria"],
      data: "set 2026",
      title: "Meta-análise com 25 ECRs confirma efeito pequeno, mas consistente, do ômega-3 sobre comportamento antissocial",
      resumo: "Revisão sistemática com meta-análise de 25 ensaios clínicos randomizados (2.889 participantes) encontrou redução estatisticamente significativa do comportamento antissocial com suplementação de ômega-3, com tamanho de efeito pequeno (g ≈ 0,13-0,14) e maior nos participantes não medicados.",
      mudou: "Reforça, com mais estudos incluídos, um achado que já vinha sendo sugerido em literaturas anteriores: ômega-3 tem efeito real sobre comportamento antissocial, mas pequeno — não é uma intervenção isolada capaz de substituir manejo comportamental ou psiquiátrico quando indicado.",
      aplicar: "Ao discutir suplementação de ômega-3 com famílias ou pacientes preocupados com comportamento antissocial ou agressividade, seja honesto sobre a magnitude pequena do efeito: pode ser um componente a mais dentro de um plano de cuidado multiprofissional, não uma solução isolada, e tende a ter maior impacto em quem ainda não usa medicação para o quadro.",
      evidencia: 5,
      link: "https://doi.org/10.1111/jcpp.70153",
      fonte: {
        autores: "Raine e cols.",
        revista: "Journal of Child Psychology and Psychiatry",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados (registro prévio no PROSPERO)",
        amostra: "25 ECRs, 2.889 participantes; publicação eletrônica em abril de 2026, edição impressa em setembro de 2026 (vol. 67, nº 9)",
        doi: "10.1111/jcpp.70153",
        pubmed: "41980788",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "O ômega-3 é um ácido graxo essencial para estrutura e função cerebral, e estudos anteriores sobre seu efeito no comportamento antissocial tinham resultados variáveis. Esta meta-análise reuniu o maior conjunto de ECRs já sintetizado sobre o tema para tentar estabelecer se — e o quanto — a suplementação reduz esse tipo de comportamento."
        },
        {
          h: "Como o estudo foi feito",
          p: "Foram incluídos 25 ensaios clínicos randomizados (2.889 participantes, registro prévio no PROSPERO) testando suplementação de ômega-3 versus placebo sobre desfechos de comportamento antissocial. Os autores conduziram duas análises separadas — por estudo independente e por laboratório independente — e avaliaram subgrupos por idade, sexo, dose, tamanho amostral, qualidade do estudo e uso concomitante de medicação."
        },
        {
          h: "O que foi encontrado",
          p: "Ambas as análises mostraram redução estatisticamente significativa (p<0,001) do comportamento antissocial com a suplementação de ômega-3, com tamanhos de efeito pequenos (g=0,13 e g=0,14). As análises de subgrupo por idade, sexo, dose e qualidade do estudo não foram significativas, mas o efeito foi maior em participantes que não usavam medicação para o quadro comportamental."
        },
        {
          h: "Limitações",
          p: "O tamanho de efeito é pequeno (g~0,13-0,14), o que limita o impacto clínico prático isoladamente, e há heterogeneidade de doses e populações entre os 25 ECRs. A publicação eletrônica original é de abril de 2026, mais antiga que o ideal para 'notícia da semana' — está aqui pela robustez do número de estudos incluídos e por ser a edição impressa mais recente do periódico (setembro de 2026)."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes (sobretudo crianças e adolescentes) com queixas comportamentais em acompanhamento multiprofissional, este estudo dá respaldo para discutir o ômega-3 como componente adicional do plano nutricional, com expectativa realista de efeito pequeno — e reforçando que o benefício parece maior justamente em quem ainda não está em uso de medicação específica para o quadro."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "farmacoterapia-obesidade-pediatrica-rede",
      categoria: "Obesidade",
      areas: ["Clínica", "Pediatria"],
      data: "17 jun 2026",
      title: "Maior comparação já feita entre fármacos para obesidade em crianças e adolescentes aponta semaglutida e fentermina-topiramato à frente",
      resumo: "Revisão sistemática com meta-análise em rede de 41 ensaios clínicos randomizados (3.923 participantes) comparou terapias farmacológicas como adjuvante à mudança de estilo de vida em crianças e adolescentes com sobrepeso ou obesidade: semaglutida teve a maior redução do percentil de IMC-95 (-20,40%), seguida por fentermina-topiramato (-18,35%), que os autores apontam como possível preferência por tolerabilidade mais favorável.",
      mudou: "É a comparação mais ampla já feita entre opções farmacológicas para obesidade pediátrica, reforçando que a farmacoterapia como adjuvante ao estilo de vida tem eficácia real nessa faixa etária — mas com diferenças de tolerabilidade entre as opções que pesam tanto quanto a magnitude da perda de IMC.",
      aplicar: "Ao acompanhar pacientes pediátricos em farmacoterapia para obesidade junto à equipe médica, mantenha o foco no que é seu: sustentar a mudança de estilo de vida que dá base ao tratamento, monitorar ingestão nutricional e efeitos colaterais gastrointestinais, e ajudar a família a entender que o fármaco é adjuvante, não substituto, da intervenção nutricional e comportamental.",
      evidencia: 5,
      link: "https://doi.org/10.1111/dom.70986",
      fonte: {
        autores: "Luo e cols.",
        revista: "Diabetes, Obesity and Metabolism",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede (network meta-analysis) de ensaios clínicos randomizados",
        amostra: "41 ECRs, 3.923 crianças e adolescentes; publicação eletrônica em junho de 2026, edição impressa em setembro de 2026 (vol. 28, nº 9)",
        doi: "10.1111/dom.70986",
        pubmed: "42310900",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Com a prevalência de obesidade pediátrica em alta e novas opções farmacológicas aprovadas ou em fase avançada de estudo, faltava uma comparação abrangente entre os tratamentos disponíveis como adjuvantes à terapia de estilo de vida especificamente em crianças e adolescentes."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca sistemática em PubMed, Embase, Cochrane CENTRAL, ICTRP/OMS e ClinicalTrials.gov até julho de 2025 reuniu 41 ensaios clínicos randomizados (3.923 participantes) comparando diferentes fármacos, isolados ou como adjuvantes à modificação de estilo de vida, em crianças e adolescentes com sobrepeso ou obesidade. A meta-análise em rede usou modelo de efeitos aleatórios, com certeza da evidência avaliada pelo método GRADE."
        },
        {
          h: "O que foi encontrado",
          p: "Frente à modificação isolada de estilo de vida, a semaglutida produziu a maior redução no percentil de IMC-95 (diferença média de -20,40%), seguida por fentermina-topiramato (-18,35%). Em termos de respondedores, semaglutida e fentermina-topiramato geraram, respectivamente, cerca de 500 e 554 pacientes adicionais por 1.000 pessoas-ano atingindo ao menos 5% de redução do IMC. Os autores destacam a fentermina-topiramato como possível opção preferencial por tolerabilidade mais favorável, apesar da semaglutida ter magnitude de efeito ligeiramente maior."
        },
        {
          h: "Limitações",
          p: "É uma meta-análise em rede, método que depende da comparabilidade indireta entre estudos com populações e durações diferentes; a maioria dos ensaios pediátricos tem seguimento curto, o que limita conclusões sobre segurança e eficácia em longo prazo nessa faixa etária ainda em desenvolvimento."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes pediátricos em farmacoterapia para obesidade, este estudo reforça a importância de manter a intervenção nutricional e comportamental como base do tratamento — o fármaco entra como adjuvante, e a escolha entre as opções costuma pesar tolerabilidade tanto quanto magnitude de perda de IMC. Acompanhe ingestão nutricional, sintomas gastrointestinais e crescimento ao longo do tratamento, discutindo qualquer sinal de alerta com a equipe médica responsável."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "materno-infantil-intervencoes-nutricionais-gestacao",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Fertilidade", "Pediatria"],
      data: "14 ago 2026",
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
      data: "06 ago 2026",
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
    }
  ]
};

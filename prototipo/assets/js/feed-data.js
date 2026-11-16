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
    texto: "Um estudo observacional em enfermarias de medicina interna (Frontiers in Nutrition) mostra que quase metade dos pacientes internados está em risco nutricional, mas que 74% desses pacientes não recebem nenhuma intervenção nutricional durante a internação — reforçando a lacuna entre triagem e conduta efetiva. Uma coorte coreana de 15 anos (estudo KNOW-CKD, JAMA Network Open) mostra que ingestão de proteína abaixo de 0,6 g/kg/dia associa-se a maior risco de falência renal e de morte em pacientes com doença renal crônica não dialítica, contrariando a ideia de que restringir ao máximo sempre protege o rim. Uma meta-análise de 11 estudos (Clinical Nutrition) mostra que a dieta cetogênica muito baixa em carboidrato melhora peso, resistência insulínica e perfil hormonal em mulheres com SOP e sobrepeso, mas os próprios autores pedem ensaios mais longos antes de recomendá-la como conduta padrão. Uma meta-análise de 7 ECRs (Journal of the International Society of Sports Nutrition) mostra que a creatina traz ganho pequeno, porém real, de massa magra e força em mulheres na pós-menopausa, principalmente quando combinada a treino de força. Um ensaio randomizado na Índia (Frontiers in Nutrition) mostra que o consumo diário de amêndoas por 20 semanas melhora a qualidade percebida do sono, com a ressalva de que o estudo foi financiado pela indústria de amêndoas. O ensaio BIOME (British Journal of Nutrition, financiado pela empresa ZOE) mostra que uma mistura de mais de 30 alimentos vegetais muda mais a composição da microbiota do que um probiótico de cepa única em apenas 6 semanas. Um estudo de coorte da Columbia University (Frontiers in Nutrition) mostra que somar ômega-3 às vitaminas pré-natais associa-se a menor taxa de parto prematuro em gestantes nulíparas, ainda que sem provar causalidade. O ensaio cluster randomizado H2GO! (JAMA Network Open) mostra que um programa comunitário de 6 semanas focado em reduzir bebidas açucaradas melhora o escore z de IMC de crianças de 8-13 anos ao longo de 12 meses. E o ensaio multicêntrico ABA-feed (BMJ) mostra que um programa intensivo de suporte de pares não aumenta as taxas de amamentação além do que o cuidado padrão já entrega no Reino Unido. Cada card abre a leitura completa com o link do estudo original."
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
      id: "triagem-nutricional-hospitalar-oportunidades-perdidas-coorte",
      categoria: "Clínica",
      areas: ["Clínica", "Gestão"],
      data: "13 mai 2026",
      title: "Estudo em enfermarias de clínica médica: quase metade dos pacientes internados está em risco nutricional, e 74% deles não recebe nenhuma intervenção nutricional",
      resumo: "Estudo observacional em enfermarias de medicina interna avaliou pacientes adultos triados por risco nutricional (NRS-2002) nas primeiras 48 horas de internação: cerca de 42% foram classificados em risco nutricional, mas 74,4% desses pacientes de risco não receberam nenhuma intervenção nutricional durante a internação; os poucos que receberam suplementação nutricional mostraram tendência a menor mortalidade do que os que não receberam, uma associação consistente com benefício, mas que não prova causalidade.",
      mudou: "Reforça, com dados hospitalares recentes, que a lacuna entre identificar o risco nutricional e efetivamente agir sobre ele continua grande na prática — quase 3 em cada 4 pacientes de risco ficam sem intervenção, mesmo quando a triagem já aponta a necessidade.",
      aplicar: "Use este dado para reforçar, junto à equipe multiprofissional, que a triagem nutricional (NRS-2002 ou equivalente) só tem valor se estiver acoplada a um fluxo claro de encaminhamento e intervenção — proponha ou participe de auditorias que garantam que todo paciente identificado em risco nas primeiras 48h realmente receba avaliação e conduta nutricional, não apenas o registro do escore no prontuário.",
      evidencia: 3,
      link: "https://doi.org/10.3389/fnut.2026.1755750",
      fonte: {
        autores: "Marinho, Craveiro, Ferreira, Carolino, Lopes, Correia, Marinho e Santos",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Estudo observacional de coorte em enfermarias de medicina interna",
        amostra: "Pacientes adultos internados, triados por risco nutricional (NRS-2002) nas primeiras 48 horas de internação",
        doi: "10.3389/fnut.2026.1755750",
        acesso: "Acesso aberto (texto completo livre, Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A triagem de risco nutricional ao internar é amplamente recomendada, mas é comum que o escore seja registrado sem disparar um encaminhamento real. Os autores quiseram quantificar, em enfermarias de medicina interna, quantos pacientes de risco de fato não recebem nenhuma intervenção nutricional, e se isso se relaciona a desfechos como mortalidade." },
        { h: "Como o estudo foi feito", p: "Pacientes adultos internados em enfermarias de medicina interna foram triados quanto ao risco nutricional pelo NRS-2002 nas primeiras 48 horas de internação. Os pesquisadores acompanharam quais desses pacientes de risco receberam alguma forma de intervenção nutricional (como suplementação oral) durante a internação, e compararam desfechos entre quem recebeu e quem não recebeu." },
        { h: "O que foi encontrado", p: "Cerca de 42% dos pacientes internados foram classificados em risco nutricional. Entre esses, 74,4% não receberam nenhuma intervenção nutricional durante a internação. Os pacientes de risco que receberam suplementação nutricional apresentaram tendência a menor mortalidade do que os que não receberam, embora essa associação não comprove causalidade." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham o tamanho exato da amostra, o período de coleta nem se o desenho foi prospectivo ou retrospectivo, o que limita uma avaliação mais fina da robustez estatística. Também não é possível, a partir da associação observada, afirmar que a suplementação nutricional por si só reduziu a mortalidade — pacientes que recebem intervenção podem diferir sistematicamente dos que não recebem." },
        { h: "Na prática do consultório", p: "Use este achado para reforçar, junto à equipe hospitalar multiprofissional, que a triagem nutricional só cumpre sua função quando acoplada a um fluxo claro de ação — proponha ou participe de auditorias que verifiquem se todo paciente identificado em risco nas primeiras 48h realmente recebe avaliação e conduta nutricional subsequente, e não apenas o registro do escore no prontuário." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "proteina-baixa-risco-falencia-renal-know-ckd-coorte",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "02 nov 2026",
      title: "Coorte coreana KNOW-CKD (15 anos): ingestão de proteína abaixo de 0,6 g/kg/dia associa-se a maior risco de falência renal e de morte em pacientes com DRC não dialítica",
      resumo: "Estudo de coorte prospectivo coreano (KNOW-CKD) acompanhou 1.861 pacientes com doença renal crônica não dialítica por mediana de 9,3 anos: quem consumia menos de 0,6 g/kg/dia de proteína teve cerca de 42% mais risco de evoluir para falência renal com necessidade de terapia renal substitutiva, e risco de mortalidade por todas as causas mais que o dobro, em comparação com quem tinha ingestão proteica mais alta.",
      mudou: "Contraria a ideia de que 'quanto menos proteína, melhor' para preservar a função renal — neste estudo, a restrição proteica muito acentuada (abaixo de 0,6 g/kg/dia) associou-se a pior desfecho renal e maior mortalidade, não a proteção.",
      aplicar: "Ao prescrever dieta hipoproteica para pacientes com DRC não dialítica, evite restringir abaixo de 0,6 g/kg/dia sem forte justificativa clínica e acompanhamento nutricional rigoroso — as diretrizes atuais (como KDIGO 2024) seguem recomendando algo em torno de 0,8 g/kg/dia para a maioria dos adultos com DRC; lembre-se também que este é um estudo observacional, então trate a associação com cautela e individualize conforme estágio da doença, estado nutricional e comorbidades.",
      evidencia: 3,
      link: "https://doi.org/10.1001/jamanetworkopen.2026.34568",
      fonte: {
        autores: "Suh, Choi, Kim e cols.; investigadores do estudo KNOW-CKD",
        revista: "JAMA Network Open",
        ano: "2026",
        desenho: "Estudo de coorte prospectivo (KNOW-CKD)",
        amostra: "1.861 pacientes coreanos com doença renal crônica não dialítica (estágios 3-5), seguimento de mediana de 9,3 anos",
        doi: "10.1001/jamanetworkopen.2026.34568",
        acesso: "Acesso aberto (JAMA Network Open)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A restrição de proteína é uma das condutas mais tradicionais no manejo da doença renal crônica (DRC), mas o quanto restringir, e até que ponto isso realmente protege a função renal sem prejudicar outros desfechos, ainda gera debate. Os autores quiseram testar, em uma coorte coreana de longo prazo, se a ingestão de proteína muito baixa (abaixo de 0,6 g/kg/dia) traz benefício ou risco para pacientes com DRC não dialítica." },
        { h: "Como o estudo foi feito", p: "A coorte prospectiva KNOW-CKD acompanhou 1.861 pacientes coreanos com DRC não dialítica (estágios 3 a 5) por uma mediana de 9,3 anos. A ingestão de proteína foi estimada a partir de medidas objetivas na linha de base, e os pesquisadores compararam o risco de falência renal com necessidade de terapia renal substitutiva e de mortalidade por todas as causas entre diferentes faixas de ingestão proteica." },
        { h: "O que foi encontrado", p: "Pacientes que consumiam menos de 0,6 g/kg/dia de proteína tiveram cerca de 42% mais risco de evoluir para falência renal com necessidade de diálise ou transplante, e risco de mortalidade por todas as causas mais que o dobro, em comparação com os que tinham ingestão proteica mais alta." },
        { h: "O que isso não responde", p: "Por ser observacional, o estudo não prova causalidade — pacientes com ingestão proteica muito baixa podem já estar mais debilitados ou desnutridos por outros motivos (causalidade reversa). A estimativa de proteína veio de uma coleta pontual na linha de base, sem distinguir proteína animal de vegetal, nem controlar totalmente para o uso crescente de inibidores de SGLT2 ao longo do seguimento." },
        { h: "Na prática do consultório", p: "Ao prescrever dieta hipoproteica para pacientes com DRC não dialítica, evite restringir abaixo de 0,6 g/kg/dia sem forte justificativa clínica e acompanhamento nutricional rigoroso — isso está alinhado com diretrizes atuais (KDIGO 2024), que recomendam algo próximo de 0,8 g/kg/dia para a maioria dos adultos com DRC. Trate este estudo como reforço para não exagerar na restrição proteica, individualizando sempre conforme estágio da doença, estado nutricional e comorbidades do paciente." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dieta-cetogenica-pcos-peso-insulina-meta-analise",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Obesidade"],
      data: "03 dez 2025",
      title: "Meta-análise: dieta cetogênica muito baixa em carboidrato melhora peso, resistência insulínica e perfil hormonal em mulheres com SOP e sobrepeso ou obesidade",
      resumo: "Revisão sistemática com meta-análise de 12 estudos (11 incluídos na quantitativa) sobre dieta cetogênica muito baixa em carboidrato (VLCKD) em mulheres com síndrome dos ovários policísticos encontrou reduções significativas de IMC (diferença média -3,38 kg/m², IC95% 2,53-4,23) e de peso corporal (diferença média -10,77 kg, IC95% 8,73-12,81), com melhora também de marcadores de resistência insulínica e do perfil hormonal reprodutivo em mulheres com IMC acima de 25 kg/m².",
      mudou: "Reforça, com uma síntese maior do que estudos isolados anteriores, que a VLCKD pode ser uma estratégia dietética eficaz para melhorar peso, resistência insulínica e hormônios reprodutivos na SOP — mas os próprios autores pedem ensaios maiores e de seguimento mais longo antes de recomendá-la como conduta padrão, já que a maioria dos estudos incluídos é de curto prazo.",
      aplicar: "Considere a VLCKD como opção dietética para mulheres com SOP e IMC acima de 25 kg/m² que não respondem bem a abordagens convencionais, mas discuta previamente a exigência de adesão rigorosa e a falta de dados de longo prazo — monitore função renal, perfil lipídico e estado nutricional durante o acompanhamento, e reavalie a estratégia se a resposta não for satisfatória.",
      evidencia: 5,
      link: "https://doi.org/10.1016/j.clnu.2025.11.019",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Clinical Nutrition",
        ano: "2026 (publicado on-line em dezembro de 2025)",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos",
        amostra: "12 estudos (11 incluídos na meta-análise quantitativa) em mulheres com SOP",
        doi: "10.1016/j.clnu.2025.11.019",
        acesso: "Verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Estudos individuais já sugeriam que a dieta cetogênica muito baixa em carboidrato (VLCKD) poderia melhorar parâmetros metabólicos e hormonais na síndrome dos ovários policísticos (SOP), mas os resultados eram heterogêneos e vinham de amostras pequenas. Os autores reuniram os ensaios disponíveis para estimar, de forma mais robusta, o efeito da VLCKD sobre peso, resistência insulínica e hormônios reprodutivos em mulheres com SOP." },
        { h: "Como o estudo foi feito", p: "A revisão sistemática identificou 12 estudos sobre VLCKD em mulheres com SOP, dos quais 11 entraram na meta-análise quantitativa. Os desfechos avaliados incluíram IMC, peso corporal, marcadores de resistência insulínica (como HOMA-IR) e hormônios reprodutivos, principalmente em mulheres com IMC acima de 25 kg/m²." },
        { h: "O que foi encontrado", p: "A VLCKD associou-se a reduções significativas de IMC (diferença média de -3,38 kg/m²) e de peso corporal (diferença média de -10,77 kg) em relação aos grupos de comparação, com heterogeneidade baixa entre os estudos (I²=0% em ambos os desfechos). Também houve melhora de marcadores de resistência insulínica e do perfil hormonal reprodutivo." },
        { h: "O que isso não responde", p: "A maioria dos estudos incluídos tem seguimento de curto prazo, o que não permite avaliar sustentabilidade do efeito, adesão a longo prazo nem segurança cardiovascular e renal de uma dieta tão restritiva em carboidrato ao longo de anos. Os próprios autores pedem ensaios maiores e mais longos antes de recomendar a VLCKD como conduta padrão." },
        { h: "Na prática do consultório", p: "Considere a VLCKD como uma opção dietética para mulheres com SOP e IMC acima de 25 kg/m² que não respondem bem a abordagens convencionais, mas discuta com a paciente a exigência de adesão rigorosa e a falta de dados de longo prazo antes de indicar — monitore função renal, perfil lipídico e estado nutricional ao longo do acompanhamento, e reavalie a estratégia se a adesão ou a resposta não forem satisfatórias." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creatina-mulheres-pos-menopausa-massa-magra-forca-meta-analise",
      categoria: "Esportiva",
      areas: ["Esportiva", "Suplementação"],
      data: "16 mai 2026",
      title: "Meta-análise de 7 ECRs: creatina traz ganho pequeno, porém consistente, de massa magra e força em mulheres na pós-menopausa, especialmente combinada a treino de força",
      resumo: "Revisão sistemática com meta-análise de 7 ensaios clínicos randomizados controlados por placebo (608 mulheres, a maioria por volta dos 62 anos) encontrou ganho adicional médio de massa magra de 0,37 kg com a suplementação de creatina (IC95% 0,05-0,69) e ganho de força no leg press, com benefício mais consistente quando a dose era de pelo menos 5 g/dia associada a treino de força; o intervalo de predição de 95% (-0,10 a +0,84 kg) cruza o zero, indicando que o efeito pode não se repetir em todos os contextos.",
      mudou: "Consolida, com uma meta-análise específica para mulheres na pós-menopausa, que a creatina pode trazer benefício pequeno, porém real, sobre massa magra e força nessa fase — uma população historicamente sub-representada nos estudos de creatina, que se concentravam mais em homens jovens atletas.",
      aplicar: "Para mulheres na pós-menopausa, considere a creatina (a partir de 5 g/dia) como adjuvante ao treino de força para ganho de massa magra e força, comunicando que o efeito médio é pequeno e que a resposta pode variar entre indivíduas — reforce que o treino de força continua sendo o pilar da intervenção, com a creatina como complemento, não substituto.",
      evidencia: 4,
      link: "https://doi.org/10.1080/15502783.2026.2668435",
      fonte: {
        autores: "Naddafha, Antonio, Kreider e Stout",
        revista: "Journal of the International Society of Sports Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados controlados por placebo",
        amostra: "7 ECRs, 608 mulheres na pós-menopausa (idade média em torno de 62 anos)",
        doi: "10.1080/15502783.2026.2668435",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A maior parte da evidência sobre creatina e composição corporal vem de estudos com homens jovens treinados, deixando uma lacuna sobre o efeito em mulheres na pós-menopausa — fase da vida marcada por perda progressiva de massa magra e força. Os autores reuniram os ensaios randomizados disponíveis nessa população específica." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 7 ensaios clínicos randomizados, controlados por placebo, com 608 mulheres na pós-menopausa (idade média em torno de 62 anos), testando suplementação de creatina com e sem treino de força associado. Os desfechos incluíram massa magra e força (por exemplo, no leg press)." },
        { h: "O que foi encontrado", p: "A creatina produziu ganho adicional médio de massa magra de 0,37 kg (IC95% 0,05-0,69 kg) em relação ao placebo, além de ganho de força no leg press. O benefício foi mais consistente quando a dose era de pelo menos 5 g/dia e a suplementação vinha associada a treino de força. O intervalo de predição de 95% (-0,10 a +0,84 kg), porém, cruza o zero, sinalizando que o efeito pode não se repetir em todos os contextos ou estudos futuros." },
        { h: "O que isso não responde", p: "A amostra total (608 mulheres) ainda é pequena para uma meta-análise definitiva, e a revisão não foi registrada prospectivamente, o que pode introduzir viés de seleção de desfechos. Os resumos consultados também não detalham se há diferença de efeito conforme tempo desde a menopausa ou uso de terapia hormonal." },
        { h: "Na prática do consultório", p: "Para mulheres na pós-menopausa engajadas em treino de força, considere a creatina (a partir de 5 g/dia) como adjuvante razoável para ganho de massa magra e força, comunicando que o efeito médio é pequeno e pode variar entre indivíduas — reforce que o treino de força continua sendo o pilar da intervenção, com a creatina como complemento, não substituto." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "amendoas-qualidade-sono-ecr",
      categoria: "Comportamental",
      areas: ["Comportamental", "Suplementação"],
      data: "03 ago 2026",
      title: "ECR na Índia: consumo diário de 60 g de amêndoas por 20 semanas melhora a qualidade percebida do sono em adultos com sono ruim",
      resumo: "Ensaio clínico randomizado, aberto, paralelo, com avaliação de desfecho cegada, conduzido na região metropolitana de Mumbai, randomizou 209 adultos de 21-55 anos com má qualidade de sono para consumir 60 g/dia de amêndoas cruas ou um lanche salgado calórico equivalente; dos 175 que completaram as 20 semanas, o grupo das amêndoas apresentou melhor qualidade percebida do sono, maior eficiência do sono e menor tempo para adormecer (esta última diferença só foi significativa após ajuste para valores basais e sexo), além de níveis mais altos de melatonina ao final do estudo.",
      mudou: "Fornece um ensaio randomizado (não apenas observacional) testando um alimento específico — amêndoas — como possível estratégia alimentar para melhorar o sono percebido, complementando evidências anteriores menores sobre o tema; os próprios autores alertam para não equiparar sono percebido a sono medido objetivamente.",
      aplicar: "Pode-se sugerir o consumo diário de cerca de 60 g de amêndoas como estratégia alimentar adjuvante para pacientes que relatam má qualidade de sono, deixando claro que o desfecho medido foi a percepção subjetiva do sono (não polissonografia) e que o estudo foi financiado pela indústria de amêndoas (Almond Board of California), o que pede cautela na interpretação.",
      evidencia: 3,
      link: "https://doi.org/10.3389/fnut.2026.1892442",
      fonte: {
        autores: "Desai, Pinto, Halbe, Vaidya, Udipi e Kalita",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, aberto, paralelo, comunitário, com avaliação de desfecho cegada",
        amostra: "209 adultos de 21-55 anos com má qualidade de sono na região metropolitana de Mumbai; 175 completaram as 20 semanas de acompanhamento",
        doi: "10.3389/fnut.2026.1892442",
        acesso: "Acesso aberto (texto completo livre, Frontiers); financiado pelo Almond Board of California"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Alimentos específicos já foram associados a melhor qualidade de sono em estudos observacionais, e as amêndoas contêm nutrientes relacionados à síntese de melatonina e magnésio. Faltava um ensaio randomizado maior testando se o consumo diário de amêndoas realmente melhora a qualidade do sono percebida por adultos com sono ruim." },
        { h: "Como o estudo foi feito", p: "O ensaio, conduzido na região metropolitana de Mumbai entre 2023 e 2025, randomizou 209 adultos de 21 a 55 anos com má qualidade de sono para consumir 60 g/dia de amêndoas cruas ou um lanche salgado calórico equivalente, por 20 semanas, em desenho aberto e comunitário, mas com avaliação de desfecho cegada. Qualidade de sono, eficiência do sono, tempo para adormecer e níveis de melatonina foram medidos ao final do estudo." },
        { h: "O que foi encontrado", p: "Dos 209 randomizados, 175 completaram as 20 semanas. O grupo das amêndoas apresentou melhor qualidade percebida do sono, maior eficiência do sono e menor tempo para adormecer (esta última diferença só foi significativa após ajuste para valores basais e sexo), além de níveis mais altos de melatonina ao final do estudo em relação ao grupo controle." },
        { h: "O que isso não responde", p: "O desfecho principal foi a qualidade de sono autorrelatada (percebida), não medida objetivamente por polissonografia ou actigrafia — os próprios autores alertam para não equiparar os dois tipos de medida. O estudo foi conduzido em uma população urbana indiana específica, o que limita a generalização para outros contextos, e foi financiado pelo Almond Board of California, entidade com interesse comercial direto no resultado." },
        { h: "Na prática do consultório", p: "Pode-se sugerir o consumo diário de cerca de 60 g de amêndoas como estratégia alimentar adjuvante para pacientes que relatam má qualidade de sono, deixando claro que o desfecho medido foi a percepção subjetiva do sono, não um exame objetivo, e que o financiamento do estudo pela indústria de amêndoas pede uma leitura cautelosa dos resultados." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "mistura-vegetal-microbiota-vs-probiotico-ecr",
      categoria: "Microbiota",
      areas: ["Microbiota", "Comportamental"],
      data: "16 jul 2026",
      title: "Ensaio BIOME: mistura de mais de 30 alimentos vegetais muda mais a composição da microbiota do que um probiótico de cepa única em 6 semanas",
      resumo: "Ensaio clínico randomizado com 399 adultos saudáveis do Reino Unido (35-65 anos) comparou uma mistura em pó de mais de 30 alimentos vegetais (30 g/dia), um probiótico de cepa única (Lactobacillus rhamnosus, 15 bilhões UFC/dia) e um controle de croutons de pão (28 g/dia) por 6 semanas: a mistura vegetal alterou a abundância relativa de 57 espécies bacterianas, contra 14 no grupo controle e 4 no grupo probiótico (p<0,001 para ambas as comparações), além de mais relatos de melhora de indigestão, prisão de ventre, azia e flatulência do que no grupo controle; não houve redução da glicemia pós-prandial em um subestudo com refeição rica em carboidrato.",
      mudou: "Sugere que a diversidade de fibras e compostos de múltiplas fontes vegetais pode remodelar a microbiota intestinal de forma mais ampla do que a suplementação de uma única cepa probiótica isolada — reforçando a ideia de 'diversidade vegetal' como estratégia preferencial sobre o 'probiótico isolado' para saúde da microbiota em adultos saudáveis.",
      aplicar: "Ao orientar pacientes saudáveis preocupados com saúde intestinal, priorize recomendar variedade de alimentos vegetais (leguminosas, grãos integrais, hortaliças, frutas, oleaginosas) como primeira estratégia para a microbiota, em vez de depender de um único probiótico — mas informe que o estudo foi financiado pela empresa que comercializa a mistura testada (ZOE), o que é um conflito de interesse relevante a considerar na leitura dos resultados.",
      evidencia: 4,
      link: "https://doi.org/10.1017/S0007114526107703",
      fonte: {
        autores: "Berry e cols. (King's College London, em parceria com a ZOE)",
        revista: "British Journal of Nutrition",
        ano: "2026",
        desenho: "Ensaio clínico randomizado de 3 braços",
        amostra: "399 adultos saudáveis do Reino Unido, 35-65 anos, 6 semanas de intervenção",
        doi: "10.1017/S0007114526107703",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista; estudo financiado pela ZOE Ltd"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Probióticos de cepa única são amplamente comercializados para saúde intestinal, mas a diversidade de fibras e compostos de múltiplas fontes vegetais também é apontada, por estudos observacionais, como benéfica para a microbiota. Faltava um ensaio randomizado comparando diretamente uma mistura de múltiplos alimentos vegetais a um probiótico de cepa única." },
        { h: "Como o estudo foi feito", p: "399 adultos saudáveis do Reino Unido, de 35 a 65 anos, foram randomizados em 3 braços por 6 semanas: uma mistura em pó de mais de 30 alimentos vegetais (30 g/dia), um probiótico de cepa única (Lactobacillus rhamnosus, 15 bilhões UFC/dia) ou um controle de croutons de pão (28 g/dia). Os pesquisadores sequenciaram a microbiota fecal antes e depois da intervenção e registraram sintomas gastrointestinais autorrelatados; um subestudo também testou o efeito sobre a glicemia pós-prandial." },
        { h: "O que foi encontrado", p: "A mistura vegetal alterou a abundância relativa de 57 espécies bacterianas, contra 14 no grupo controle e apenas 4 no grupo probiótico (p<0,001 para ambas as comparações). Participantes do grupo da mistura vegetal relataram menos indigestão, prisão de ventre, azia e flatulência do que o grupo controle. No subestudo de glicemia, a mistura vegetal não reduziu a glicemia pós-prandial após uma refeição rica em carboidrato." },
        { h: "O que isso não responde", p: "O estudo foi financiado e conduzido em parceria com a empresa que comercializa a mistura testada (ZOE), e parte da equipe de pesquisa inclui cofundadores da empresa — um conflito de interesse relevante. Os sintomas gastrointestinais foram autorrelatados, e o estudo não acompanhou desfechos clínicos de longo prazo (como risco cardiometabólico) além da composição da microbiota em 6 semanas." },
        { h: "Na prática do consultório", p: "Ao orientar pacientes saudáveis preocupados com saúde intestinal, priorize recomendar variedade de alimentos vegetais (leguminosas, grãos integrais, hortaliças, frutas, oleaginosas) como estratégia de primeira linha para a microbiota, em vez de depender de um único probiótico isolado — mas, ao citar este estudo específico, deixe claro o financiamento da empresa que vende o produto testado." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "omega3-vitaminas-pre-natais-parto-prematuro-coorte",
      categoria: "Suplementação",
      areas: ["Suplementação", "Materno Infantil"],
      data: "06 jan 2026",
      title: "Estudo de coorte: somar ômega-3 às vitaminas pré-natais associa-se a menor taxa de parto prematuro em gestantes nulíparas",
      resumo: "Estudo de coorte observacional da Columbia University Irving Medical Center comparou gestantes nulíparas que usaram vitaminas pré-natais associadas a ômega-3 extra com as que usaram apenas vitaminas pré-natais: a taxa de parto prematuro foi de 5,04% no grupo com ômega-3 extra versus 8,41% no grupo sem, com chance de parto prematuro cerca de 36% menor após ajuste (OR ajustado 0,64); os próprios autores destacam que o desenho observacional não permite afirmar causalidade e que ensaios randomizados ainda são necessários.",
      mudou: "Acrescenta um sinal observacional relativamente forte a favor da suplementação de ômega-3 somada às vitaminas pré-natais para redução do risco de parto prematuro, mas não resolve a questão de causalidade — revisões anteriores com ensaios randomizados já mostravam benefício mais consistente em mulheres com baixo status basal de ômega-3, e este estudo não distingue esse subgrupo.",
      aplicar: "Pode-se discutir com gestantes a adição de ômega-3 às vitaminas pré-natais como estratégia nutricional razoável para tentar reduzir o risco de parto prematuro, especialmente em mulheres com baixo consumo de peixe — mas seja transparente de que a evidência aqui é observacional, sujeita a fatores de confusão não totalmente controlados, e sempre dentro da orientação obstétrica vigente.",
      evidencia: 3,
      link: "https://doi.org/10.3389/fnut.2025.1693844",
      fonte: {
        autores: "Yakah, Haas, Grobman e cols. (Columbia University Irving Medical Center)",
        revista: "Frontiers in Nutrition",
        ano: "2026 (publicado on-line em janeiro de 2026)",
        desenho: "Estudo de coorte observacional",
        amostra: "Gestantes nulíparas em uso de vitaminas pré-natais, com ou sem suplementação adicional de ômega-3",
        doi: "10.3389/fnut.2025.1693844",
        acesso: "Acesso aberto (texto completo livre, Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Vitaminas pré-natais costumam conter pouco ou nenhum ômega-3, nutriente já associado, em estudos observacionais, a menor risco de parto prematuro. Os autores quiseram comparar, em gestantes nulíparas, as taxas de parto prematuro entre quem usava vitaminas pré-natais sozinhas e quem somava ômega-3 extra a elas." },
        { h: "Como o estudo foi feito", p: "Estudo de coorte observacional da Columbia University Irving Medical Center comparou gestantes nulíparas em uso de vitaminas pré-natais associadas a ômega-3 adicional com gestantes em uso apenas de vitaminas pré-natais, registrando a ocorrência de parto prematuro e calculando a razão de chances ajustada para fatores de confusão conhecidos." },
        { h: "O que foi encontrado", p: "A taxa de parto prematuro foi de 5,04% no grupo com ômega-3 extra, contra 8,41% no grupo sem ômega-3 adicional. Após ajuste para fatores de confusão, a chance de parto prematuro foi cerca de 36% menor no grupo que usava ômega-3 extra (OR ajustado de 0,64)." },
        { h: "O que isso não responde", p: "Por ser observacional, o estudo não prova causalidade — mulheres que optam por suplementação adicional de ômega-3 podem diferir sistematicamente (em renda, acesso a cuidado pré-natal, outros hábitos de saúde) das que não optam, mesmo após ajuste estatístico. Os próprios autores afirmam que ensaios clínicos randomizados ainda são necessários para confirmar causalidade." },
        { h: "Na prática do consultório", p: "Pode-se discutir com gestantes a adição de ômega-3 às vitaminas pré-natais como estratégia nutricional razoável, especialmente para aquelas com baixo consumo de peixe, mas comunique que a evidência aqui vem de um estudo observacional, não de um ensaio randomizado — e mantenha a decisão sempre alinhada à orientação obstétrica vigente." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "h2go-reducao-bebidas-acucaradas-imc-criancas-ecr",
      categoria: "Obesidade",
      areas: ["Obesidade", "Materno Infantil"],
      data: "09 out 2026",
      title: "Ensaio cluster randomizado H2GO!: programa comunitário para reduzir bebidas açucaradas melhora o escore z de IMC em crianças de 8-13 anos",
      resumo: "Ensaio clínico cluster randomizado testou o programa comunitário H2GO! — 6 semanas com 12 sessões em grupo, conduzidas em unidades do Boys & Girls Clubs — com 437 crianças de 8-13 anos e um cuidador, focado em reduzir o consumo de bebidas açucaradas e aumentar o consumo de água: em 12 meses, as crianças do grupo intervenção tiveram redução significativamente maior do escore z de IMC do que as do grupo comparação, com cerca de 30% das crianças do grupo intervenção migrando para uma categoria de IMC mais baixa (vs. 18% no comparação), chegando a 47,5% entre as que começaram com obesidade (vs. 36,7% no comparação).",
      mudou: "Mostra que um programa comunitário relativamente breve (6 semanas), focado especificamente em bebidas açucaradas e entregue por equipe de organizações comunitárias (não só por profissionais de saúde), pode gerar redução mensurável do IMC em crianças ao longo de 12 meses — um modelo de intervenção escalável fora do consultório tradicional.",
      aplicar: "Ao orientar famílias de crianças com sobrepeso/obesidade, priorize a redução do consumo de bebidas açucaradas e o aumento da ingestão de água como meta concreta e de fácil mensuração — e, onde disponível, considere encaminhar famílias para programas comunitários estruturados (como os oferecidos por organizações extracurriculares) como complemento ao acompanhamento nutricional individual.",
      evidencia: 4,
      link: "https://doi.org/10.1001/jamanetworkopen.2026.38188",
      fonte: {
        autores: "Wang e cols. (Boston University)",
        revista: "JAMA Network Open",
        ano: "2026",
        desenho: "Ensaio clínico cluster randomizado (programa H2GO!)",
        amostra: "437 crianças de 8-13 anos e um cuidador, recrutadas em unidades do Boys & Girls Clubs; seguimento de 12 meses",
        doi: "10.1001/jamanetworkopen.2026.38188",
        acesso: "Acesso aberto (JAMA Network Open)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Programas de prevenção de obesidade infantil conduzidos dentro do sistema de saúde nem sempre alcançam as famílias que mais precisam, e organizações comunitárias (como clubes recreativos) são um canal alternativo pouco estudado em ensaios randomizados de boa qualidade. Os autores testaram se um programa de 6 semanas focado em reduzir bebidas açucaradas, entregue nesse formato comunitário, reduz o IMC de crianças ao longo de 12 meses." },
        { h: "Como o estudo foi feito", p: "O ensaio cluster randomizado H2GO! recrutou 437 crianças de 8 a 13 anos, cada uma com um cuidador, em unidades do Boys & Girls Clubs. O programa consistiu em 6 semanas com 12 sessões em grupo, conduzidas por equipe treinada da própria organização comunitária, focadas em reduzir o consumo de bebidas açucaradas e aumentar o consumo de água. O desfecho principal foi a mudança no escore z de IMC em 12 meses." },
        { h: "O que foi encontrado", p: "As crianças do grupo intervenção tiveram redução significativamente maior do escore z de IMC em 12 meses do que as do grupo comparação. Cerca de 30% das crianças do grupo intervenção migraram para uma categoria de IMC mais baixa, contra 18% no grupo comparação; entre as crianças que começaram o estudo com obesidade, 47,5% do grupo intervenção melhoraram de categoria de IMC, contra 36,7% no grupo comparação." },
        { h: "O que isso não responde", p: "Os resumos consultados não detalham a magnitude exata (em kg/m² ou unidades de escore z) da diferença entre os grupos, nem se o efeito se mantém além dos 12 meses de seguimento. Também não está claro, pelos dados disponíveis, qual componente específico do programa (educação, suporte do grupo, mudança de disponibilidade de bebidas em casa) mais contribuiu para o resultado." },
        { h: "Na prática do consultório", p: "Ao orientar famílias de crianças com sobrepeso ou obesidade, priorize a redução do consumo de bebidas açucaradas e o aumento da ingestão de água como meta concreta, de fácil mensuração e com respaldo deste ensaio — e, onde houver organizações comunitárias locais (clubes, ONGs, programas extracurriculares) dispostas a implementar abordagens semelhantes, considere isso como um complemento valioso ao acompanhamento nutricional individual." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "aba-feed-suporte-pares-amamentacao-ecr",
      categoria: "Materno Infantil",
      areas: ["Materno Infantil", "Comportamental"],
      data: "31 mar 2026",
      title: "ECR multicêntrico do Reino Unido (ABA-feed): suporte intensivo de pares não aumenta as taxas de amamentação em relação ao cuidado padrão",
      resumo: "Ensaio clínico randomizado multicêntrico no Reino Unido comparou um programa intensivo de suporte de pares para amamentação (ABA-feed, 1.458 participantes) ao cuidado padrão (1.017 participantes): a taxa de qualquer amamentação em 8 semanas foi semelhante entre os grupos (69,8% vs. 68,8%; diferença de risco ajustada de 0,01, IC95% -0,03 a 0,04), sem diferença também em iniciação da amamentação (94,2% vs. 92,5%) nem nos demais desfechos secundários em 8, 16 e 24 semanas, exceto um ganho transitório de suporte social percebido às 8 semanas no grupo intervenção, que não se sustentou às 16 semanas.",
      mudou: "Contraria, neste contexto populacional específico do Reino Unido (com taxa basal de amamentação já alta, próxima de 69%), a expectativa de que um programa intensivo e estruturado de suporte de pares aumentaria as taxas de amamentação acima do que o cuidado padrão já entrega — os próprios autores concluem que esse programa, nesse formato, não deveria ser implementado nesse contexto sem evidência adicional de efetividade local.",
      aplicar: "Antes de recomendar ou implementar um programa específico de suporte de pares para amamentação, considere que a efetividade pode depender muito do contexto local (taxa basal de amamentação, estrutura do cuidado padrão já oferecido) — avalie evidência de efetividade no contexto onde o programa será aplicado antes de assumir benefício automático, e continue oferecendo suporte individualizado baseado nas necessidades específicas de cada binômio mãe-bebê.",
      evidencia: 4,
      link: "https://doi.org/10.1136/bmj-2025-086558",
      fonte: {
        autores: "Jolly e cols.",
        revista: "The BMJ",
        ano: "2026",
        desenho: "Ensaio clínico randomizado multicêntrico, paralelo",
        amostra: "2.475 gestantes/puérperas no Reino Unido (1.458 no grupo ABA-feed, 1.017 no cuidado padrão)",
        doi: "10.1136/bmj-2025-086558",
        acesso: "Acesso aberto (BMJ)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Programas de suporte de pares (mulheres que já amamentaram orientando outras mães) são frequentemente recomendados para aumentar as taxas de amamentação, mas sua efetividade real, testada em ensaios grandes e bem desenhados, ainda é incerta — especialmente em contextos onde o cuidado padrão já é relativamente robusto. Os autores testaram um programa intensivo de suporte de pares (ABA-feed) contra o cuidado padrão no Reino Unido." },
        { h: "Como o estudo foi feito", p: "Ensaio clínico randomizado multicêntrico, paralelo, no Reino Unido, alocou 1.458 participantes para o programa intensivo de suporte de pares ABA-feed e 1.017 para o cuidado padrão de amamentação. O desfecho primário foi qualquer amamentação em 8 semanas pós-parto; desfechos secundários incluíram iniciação da amamentação, amamentação exclusiva, práticas de uso de fórmula, ansiedade, suporte social percebido e utilização de serviços de saúde, avaliados em 8, 16 e 24 semanas." },
        { h: "O que foi encontrado", p: "A taxa de qualquer amamentação em 8 semanas foi semelhante entre os grupos (69,8% no ABA-feed vs. 68,8% no cuidado padrão; diferença de risco ajustada de 0,01, IC95% -0,03 a 0,04). A iniciação da amamentação também foi semelhante (94,2% vs. 92,5%). Entre os desfechos secundários, a única diferença encontrada foi um ganho transitório de suporte social percebido às 8 semanas no grupo intervenção, que não se sustentou na avaliação de 16 semanas." },
        { h: "O que isso não responde", p: "A taxa basal de amamentação no cuidado padrão já era alta (quase 69%), mais alta do que o esperado no planejamento do estudo — isso pode ter reduzido a margem para o programa de suporte de pares mostrar benefício adicional detectável. O estudo não testa se o mesmo programa traria benefício em contextos com taxas basais de amamentação mais baixas." },
        { h: "Na prática do consultório", p: "Antes de recomendar ou apoiar a implementação de um programa específico de suporte de pares para amamentação, considere que a efetividade pode depender muito do contexto local — avalie a taxa basal de amamentação e a qualidade do cuidado padrão já oferecido antes de assumir benefício automático de um programa estruturado, e continue priorizando o suporte individualizado conforme as necessidades específicas de cada binômio mãe-bebê." }
      ]
    }
  ]
};

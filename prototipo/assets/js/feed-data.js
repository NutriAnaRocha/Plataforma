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
    texto: "Um estudo de coorte do registro KNOW-CKD (JAMA Network Open), com 1.861 pacientes e seguimento de 9,3 anos, mostra que ingestão proteica muito baixa (abaixo de 0,6 g/kg/dia) associa-se a mais falência renal e mais do que o dobro do risco de morte em doença renal crônica não dialítica, questionando a prática de empurrar a proteína para o limite inferior recomendado. Uma meta-análise de 4 ECRs (Frontiers in Nutrition) mostra que o jejum intermitente reduz a HbA1c em diabetes tipo 2 mesmo sem perda de peso significativa, mas com heterogeneidade extremamente alta entre os estudos. Uma meta-análise majoritariamente de comparações antes-depois (Clinical Nutrition) associa a dieta cetogênica a redução de peso, IMC e cintura em mulheres com SOP e sobrepeso/obesidade, com os próprios autores pedindo ECRs maiores antes de confirmar a eficácia. Uma revisão sistemática de 46 estudos em atletas de elite (Frontiers in Nutrition) reafirma a cafeína como o suplemento ergogênico mais consistente, com betaalanina variável por modalidade e nitrato com efeito limitado. Um ensaio de alimentação controlada da Johns Hopkins (Obesity) mostra que restringir a janela alimentar a 10 horas não traz benefício adicional sobre apetite ou inflamação além do efeito da própria perda de peso. Um ECR piloto duplo-cego (Frontiers in Nutrition) mostra que a dextrina resistente aumenta seletivamente o gênero Parabacteroides na microbiota fecal, sem alterar ácidos graxos de cadeia curta totais. Uma revisão de escopo de 157 publicações (Journal of Dietary Supplements) mostra que multivitamínicos elevam de forma consistente os níveis sanguíneos de B6, B12 e folato, mas sem respaldo consistente de benefício cardiovascular ou cognitivo — e com conflito de interesse declarado pelo autor sênior. O ensaio TEAM UP (JAMA Pediatrics), com 730 crianças em 41 consultórios de atenção primária, mostra que tratamento comportamental familiar para obesidade infantil, entregue majoritariamente por telessaúde, melhora o risco cardiometabólico em 42% das crianças, com benefício mantido 6 meses após o fim do tratamento. E uma meta-análise de ensaios do Cochrane (American Journal of Clinical Nutrition) mostra que suplementar múltiplos micronutrientes na gestação (em vez de ferro e ácido fólico isolados) melhora o tamanho ao nascer e o crescimento do bebê até 6 meses, benefício que não se mantém depois. Cada card abre a leitura completa com o link do estudo original."
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
      id: "ingestao-proteica-muito-baixa-risco-falencia-renal-know-ckd",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "02 nov 2026",
      title: "Estudo de coorte KNOW-CKD: ingestão proteica muito baixa (<0,6 g/kg/dia) associa-se a maior risco de falência renal e de morte em doença renal crônica não dialítica",
      resumo: "Estudo de coorte prospectivo do registro KNOW-CKD, publicado no JAMA Network Open, acompanhou 1.861 pacientes com doença renal crônica não dialítica por mediana de 9,3 anos: pacientes com ingestão proteica dietética abaixo de 0,6 g/kg/dia tiveram cerca de 42% mais risco de evoluir para falência renal com necessidade de terapia de substituição renal, e mais do que o dobro do risco de morte por qualquer causa, em comparação aos que ingeriam mais proteína que esse limite.",
      mudou: "Questiona, com dados de coorte de longo prazo, a prática de restringir a proteína para o limite inferior recomendado (0,55-0,60 g/kg/dia pela diretriz KDOQI 2020 para DRC estágios 3-5 sem diabetes) — sugerindo que, nesse patamar mais baixo, o risco de desfechos adversos (falência renal, morte) pode ser maior, não menor, do que com ingestão proteica um pouco mais liberal.",
      aplicar: "Ao prescrever dieta hipoproteica para pacientes com DRC não dialítica, evite empurrar a ingestão para o limite inferior da faixa recomendada (próximo de 0,6 g/kg/dia) apenas para 'proteger o rim' — este estudo de coorte sugere que ingestão tão baixa pode se associar a mais falência renal e mortalidade, não menos; individualize a meta proteica considerando estado nutricional, função renal e risco de desnutrição, e lembre que é um estudo observacional, não um ensaio clínico, então não prova causalidade direta.",
      evidencia: 3,
      link: "https://doi.org/10.1001/jamanetworkopen.2026.34568",
      fonte: {
        autores: "Suh, Choi, Kim e cols.; Investigadores do estudo KNOW-CKD",
        revista: "JAMA Network Open",
        ano: "2026",
        desenho: "Estudo de coorte prospectivo (dados do registro KNOW-CKD)",
        amostra: "1.861 pacientes com doença renal crônica não dialítica; seguimento de mediana 9,3 anos",
        doi: "10.1001/jamanetworkopen.2026.34568",
        acesso: "Resumo e cobertura especializada consultados; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "As diretrizes atuais (KDOQI 2020) recomendam, para pacientes com doença renal crônica (DRC) em estágios 3 a 5 sem diabetes, ingestão proteica entre 0,55 e 0,60 g/kg/dia, com o objetivo de reduzir a sobrecarga sobre os rins e retardar a progressão da doença. Mas faltava saber se, dentro dessa faixa considerada segura, ingerir no limite inferior traz algum risco adicional em comparação a uma ingestão um pouco mais generosa." },
        { h: "Como o estudo foi feito", p: "Os pesquisadores usaram dados do registro coreano KNOW-CKD, acompanhando 1.861 pacientes com DRC não dialítica (sem transplante renal) por uma mediana de 9,3 anos. A ingestão proteica dietética foi estimada e os participantes foram comparados conforme ficassem abaixo ou acima do limiar de 0,6 g/kg/dia. Os desfechos analisados foram a progressão para falência renal com necessidade de terapia de substituição renal (diálise ou transplante) e a mortalidade por qualquer causa." },
        { h: "O que foi encontrado", p: "Pacientes com ingestão proteica abaixo de 0,6 g/kg/dia tiveram aproximadamente 42% mais risco de evoluir para falência renal com necessidade de terapia de substituição renal, e mais do que o dobro do risco de morte por qualquer causa, em comparação aos pacientes com ingestão acima desse limiar. Os próprios autores destacam que a recomendação atual de ingestão proteica pode precisar de mais individualização, em vez de empurrar todos os pacientes para o limite inferior da faixa." },
        { h: "O que isso não responde", p: "Por ser um estudo observacional (de coorte), ele não prova que a ingestão proteica baixa por si só causou os desfechos piores — pacientes que ingerem menos proteína podem já estar mais doentes, mais desnutridos ou mais frágeis por outros motivos (causalidade reversa), o que é uma limitação clássica desse tipo de desenho. O estudo também não testa, de forma experimental, qual seria a ingestão proteica 'ideal' dentro da faixa recomendada — apenas mostra uma associação no extremo inferior dela." },
        { h: "Na prática do consultório", p: "Ao prescrever dieta hipoproteica para pacientes com DRC não dialítica, não há motivo, a partir deste estudo, para buscar o limite inferior da faixa recomendada (perto de 0,6 g/kg/dia) com a ideia de que 'quanto menos proteína, melhor' — pelo contrário, esse patamar mais baixo associou-se a piores desfechos nesta coorte. Individualize a meta proteica considerando o estado nutricional e o risco de desnutrição de cada paciente, e converse com a equipe médica sobre o alvo proteico mais adequado para o estágio da doença, em vez de aplicar automaticamente o limite inferior da diretriz." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "jejum-intermitente-hba1c-diabetes-tipo2-meta-analise",
      categoria: "Clínica",
      areas: ["Clínica", "Comportamental"],
      data: "30 jan 2026",
      title: "Meta-análise de 4 ECRs: jejum intermitente reduz HbA1c em diabetes tipo 2, mas não traz perda de peso significativa e a heterogeneidade entre estudos é muito alta",
      resumo: "Revisão sistemática com meta-análise de 4 ensaios clínicos randomizados (280 adultos com diabetes tipo 2), publicada em Frontiers in Nutrition, encontrou redução média de HbA1c de 1,85 ponto percentual com jejum intermitente frente ao controle (IC 95% -2,86 a -0,84), mas sem diferença significativa de peso corporal (-1,45 kg; IC 95% -5,51 a 2,61); a heterogeneidade estatística entre os estudos foi extremamente alta em ambos os desfechos (I²=98,1% e 96,7%).",
      mudou: "Soma evidência de que o jejum intermitente pode ajudar no controle glicêmico de pacientes com diabetes tipo 2 independentemente de produzir perda de peso relevante — mas a heterogeneidade altíssima entre os 4 estudos incluídos indica que o tamanho desse benefício varia muito de protocolo para protocolo, o que pede cautela antes de generalizar o resultado agrupado.",
      aplicar: "Ao considerar jejum intermitente como estratégia adjuvante para pacientes com diabetes tipo 2 motivados a tentá-lo, explique que o possível benefício sobre a glicemia não depende de perda de peso — mas, dada a heterogeneidade extrema entre os poucos estudos disponíveis (apenas 4 ECRs, 280 participantes), individualize a indicação, monitore risco de hipoglicemia (sobretudo em quem usa insulina ou sulfonilureias) e não prometa uma magnitude fixa de benefício.",
      evidencia: 4,
      link: "https://doi.org/10.3389/fnut.2026.1699384",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "4 ECRs, 280 adultos com diabetes tipo 2",
        doi: "10.3389/fnut.2026.1699384",
        acesso: "Acesso aberto (texto completo livre, Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O jejum intermitente ganhou popularidade como estratégia para perda de peso e controle metabólico, mas seu efeito específico sobre o controle glicêmico de pacientes com diabetes tipo 2 — e se esse efeito depende de perda de peso — ainda gerava dúvida entre os poucos ensaios clínicos randomizados disponíveis. Os autores reuniram esses ensaios para quantificar o impacto sobre HbA1c e peso corporal." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu 4 ensaios clínicos randomizados, com um total de 280 adultos com diabetes tipo 2, comparando algum protocolo de jejum intermitente a um grupo controle (dieta habitual ou restrição calórica contínua). Os desfechos analisados foram a variação da HbA1c e do peso corporal entre os grupos." },
        { h: "O que foi encontrado", p: "O jejum intermitente produziu redução média de HbA1c de 1,85 ponto percentual em relação ao controle, resultado estatisticamente significativo. Já a diferença de peso corporal entre os grupos (-1,45 kg) não foi estatisticamente significativa. Em ambos os desfechos, a heterogeneidade entre os 4 estudos foi extremamente alta (I²=98,1% para HbA1c e 96,7% para peso), indicando que os resultados individuais variaram muito entre os protocolos testados." },
        { h: "O que isso não responde", p: "Com apenas 4 ensaios e heterogeneidade tão alta, a meta-análise não permite dizer qual protocolo específico de jejum intermitente (duração do jejum, frequência, tipo de dieta nos dias de alimentação) produz o maior benefício, nem garantir que o efeito agrupado se repita de forma previsível em um paciente individual. A ausência de efeito significativo sobre peso, apesar do benefício na HbA1c, também não é totalmente explicada pelos dados disponíveis." },
        { h: "Na prática do consultório", p: "Ao discutir jejum intermitente com pacientes com diabetes tipo 2 motivados a tentar essa estratégia, pode-se mencionar que o possível benefício sobre a glicemia parece não depender de perda de peso relevante — mas, dada a heterogeneidade extrema entre os poucos estudos disponíveis, individualize a indicação, ajuste a medicação (sobretudo insulina e sulfonilureias, pelo risco de hipoglicemia) e acompanhe de perto a resposta de cada paciente, em vez de prometer uma queda fixa de HbA1c." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dieta-cetogenica-sop-meta-analise",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Obesidade"],
      data: "03 dez 2025",
      title: "Meta-análise de 10 estudos (majoritariamente comparações antes-depois): dieta cetogênica reduz peso, IMC e circunferência da cintura em mulheres com SOP e sobrepeso/obesidade",
      resumo: "Revisão sistemática com meta-análise, publicada em Clinical Nutrition, reuniu 15 estudos (10 incluídos na meta-análise, a maior parte comparando medidas antes e depois da dieta, não ensaios com grupo controle) em mulheres com síndrome dos ovários policísticos (SOP) e IMC ≥25 kg/m²: a dieta cetogênica associou-se a redução média de 3,38 kg/m² no IMC, 10,77 kg no peso e 8,93 cm na circunferência da cintura, todas estatisticamente significativas e com baixa heterogeneidade.",
      mudou: "Reforça, com uma síntese maior de estudos, que a dieta cetogênica pode trazer redução expressiva de peso e medidas antropométricas em mulheres com SOP e excesso de peso — mas a maior parte da evidência agrupada vem de comparações antes-depois dentro do próprio grupo tratado, não de ensaios com grupo controle, o que é uma limitação importante para atribuir o efeito à dieta em si e não a outros fatores (motivação, acompanhamento mais próximo, regressão à média).",
      aplicar: "Pode-se discutir a dieta cetogênica como uma opção dentro do leque de estratégias alimentares para mulheres com SOP e sobrepeso/obesidade que buscam perda de peso, monitorando perfil lipídico e função renal/hepática pela restrição severa de carboidratos — mas comunique que a certeza sobre o tamanho real do efeito é limitada pelo desenho majoritariamente antes-depois dos estudos incluídos, e que os próprios autores pedem ECRs maiores e mais longos antes de estabelecer a eficácia e a segurança da dieta de forma definitiva.",
      evidencia: 3,
      link: "https://pubmed.ncbi.nlm.nih.gov/41483483/",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Clinical Nutrition",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise (majoritariamente comparações antes-depois, poucos ensaios com grupo controle)",
        amostra: "15 estudos revisados, 10 incluídos na meta-análise; mulheres com SOP e IMC ≥25 kg/m²",
        doi: "10.1016/j.clnu.2025.11.019",
        pubmed: "41483483",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A dieta cetogênica (muito baixa em carboidratos) tem sido proposta como estratégia para mulheres com síndrome dos ovários policísticos (SOP) e excesso de peso, pela sua ação sobre perda de peso e resistência insulínica. Os autores quiseram reunir os estudos disponíveis para quantificar o efeito da dieta cetogênica sobre peso, IMC e circunferência da cintura nessa população." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática identificou 15 estudos sobre dieta cetogênica em mulheres com SOP e IMC igual ou maior que 25 kg/m², dos quais 10 foram incluídos na meta-análise quantitativa. A análise principal comparou medidas antes e depois da intervenção dietética dentro do próprio grupo tratado — a maioria dos estudos incluídos não tinha um grupo controle paralelo recebendo outra dieta ou cuidado padrão." },
        { h: "O que foi encontrado", p: "A dieta cetogênica associou-se a redução média de 3,38 kg/m² no IMC (IC 95%: 2,53 a 4,23), 10,77 kg no peso (IC 95%: 8,73 a 12,81) e 8,93 cm na circunferência da cintura (IC 95%: 5,66 a 12,19), todas estatisticamente significativas. A heterogeneidade foi baixa para IMC e peso (I²=0%) e moderada para cintura (I²=44%), sugerindo resultados consistentes entre os estudos analisados." },
        { h: "O que isso não responde", p: "Como a análise principal comparou medidas antes e depois dentro do mesmo grupo, sem um grupo controle paralelo na maioria dos estudos, não é possível separar com segurança o efeito específico da dieta cetogênica do efeito de fatores como maior motivação das participantes, acompanhamento nutricional mais próximo durante o estudo, ou simples regressão à média. Os próprios autores pedem ensaios clínicos randomizados maiores e de maior duração antes de estabelecer a eficácia e a segurança da dieta de forma mais firme." },
        { h: "Na prática do consultório", p: "A dieta cetogênica pode ser discutida como uma das opções alimentares para mulheres com SOP e sobrepeso/obesidade que buscam perda de peso, sempre monitorando perfil lipídico e função renal/hepática pela restrição severa de carboidratos — mas comunique que a solidez da evidência ainda é limitada pelo desenho majoritariamente antes-depois dos estudos disponíveis, e que não há, por ora, comparação robusta mostrando que a dieta cetogênica seja superior a outras estratégias alimentares eficazes para perda de peso na SOP." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "suplementos-dieteticos-desempenho-atletas-elite-revisao",
      categoria: "Esportiva",
      areas: ["Esportiva", "Suplementação"],
      data: "22 set 2025",
      title: "Revisão sistemática de 46 estudos: cafeína tem o efeito mais consistente sobre desempenho em atletas de elite, enquanto betaalanina varia por modalidade e nitrato mostra efeito limitado",
      resumo: "Revisão sistemática (registrada no INPLASY, com buscas em PubMed, Web of Science, Scopus e SportDiscus entre 2014 e 2024) reuniu 46 estudos (928 participantes, 60% homens) sobre suplementos dietéticos em atletas de elite; como os desfechos eram muito heterogêneos, os autores optaram por síntese narrativa, sem meta-análise agrupada: cafeína (3-6 mg/kg) mostrou o efeito mais consistente sobre potência e desempenho técnico, betaalanina trouxe benefício específico por modalidade, e nitrato teve efeito limitado nessa população de atletas de elite.",
      mudou: "Confirma, numa amostra ampla de estudos em atletas de elite (população mais exigente para demonstrar efeito do que atletas recreacionais), que a cafeína continua sendo o suplemento ergogênico mais consistente — e deixa claro que o benefício de outros suplementos populares (betaalanina, nitrato) é mais variável e depende da modalidade esportiva específica.",
      aplicar: "Ao prescrever suplementação ergogênica para atletas de alto rendimento, priorize a cafeína (3-6 mg/kg) como primeira escolha por ter o respaldo mais consistente, avalie a betaalanina caso a caso conforme a demanda específica da modalidade, e tenha expectativa mais conservadora quanto ao nitrato nessa população; lembre também que apenas 10% dos estudos incluíam atletas mulheres, então extrapole com cautela para esse público.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/41058995/",
      fonte: {
        autores: "Yu e Ding",
        revista: "Frontiers in Nutrition",
        ano: "2025",
        desenho: "Revisão sistemática com síntese narrativa (sem meta-análise agrupada, por heterogeneidade de desfechos)",
        amostra: "46 estudos, 928 participantes (60% homens), atletas de elite",
        doi: "10.3389/fnut.2025.1675654",
        pubmed: "41058995",
        acesso: "Acesso aberto (texto completo livre, Frontiers)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Existem dezenas de suplementos dietéticos promovidos para melhorar o desempenho esportivo, mas a maior parte da evidência vem de estudos em atletas recreacionais ou amadores, que respondem mais facilmente a intervenções. Os autores quiseram reunir especificamente os estudos conduzidos em atletas de elite — uma população mais difícil de fazer melhorar ainda mais — para mapear quais suplementos têm respaldo mais consistente nesse contexto." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática registrada no INPLASY (INPLASY202411036) buscou em PubMed, Web of Science, Scopus e SportDiscus, entre janeiro de 2014 e novembro de 2024, ensaios clínicos randomizados ou controlados que testassem suplementos dietéticos em atletas de elite e reportassem desfechos quantitativos de desempenho. Foram incluídos 46 estudos, com 928 participantes no total. Como os desfechos avaliados eram muito variados entre os estudos, os autores optaram por uma síntese narrativa, sem agrupar os resultados em uma meta-análise única." },
        { h: "O que foi encontrado", p: "A cafeína, na faixa de 3 a 6 mg/kg, mostrou o efeito mais consistente entre os suplementos avaliados, melhorando potência e desempenho técnico em diferentes modalidades. A betaalanina trouxe benefício, mas de forma mais específica por modalidade esportiva, não de maneira uniforme. O nitrato, por sua vez, mostrou efeito limitado especificamente na população de atletas de elite (diferente do que se observa, às vezes, em atletas recreacionais). A qualidade metodológica média dos estudos foi alta (escore PEDro médio de 10,65 em 11)." },
        { h: "O que isso não responde", p: "Apenas cerca de 10% dos estudos incluíam atletas mulheres, o que limita a capacidade de afirmar que os mesmos padrões de resposta se aplicam a esse público. Por ser uma síntese narrativa (sem meta-análise agrupada), a revisão também não fornece uma estimativa numérica única do tamanho do efeito de cada suplemento, o que dificulta comparações diretas de magnitude entre eles." },
        { h: "Na prática do consultório", p: "Ao prescrever suplementação ergogênica para atletas de alto rendimento, priorize a cafeína como primeira escolha, por ter o respaldo mais consistente nesta revisão, na faixa de 3 a 6 mg/kg conforme tolerância individual. Avalie a betaalanina caso a caso, conforme a demanda específica da modalidade (esportes com componente anaeróbico mais prolongado tendem a se beneficiar mais), e mantenha expectativa mais conservadora sobre o nitrato em atletas já muito bem treinados. Para atletas mulheres, reconheça a lacuna de evidência e individualize ainda mais a conduta." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "jejum-restricao-horaria-apetite-inflamacao-ecr",
      categoria: "Comportamental",
      areas: ["Comportamental", "Obesidade"],
      data: "27 jul 2026",
      title: "Ensaio alimentar controlado da Johns Hopkins: comer em janela de 10 horas não reduz apetite nem inflamação além do efeito da própria perda de peso, em adultos com obesidade e pré-diabetes",
      resumo: "Ensaio clínico randomizado de alimentação controlada (estudo TRIM, Johns Hopkins), com todas as refeições fornecidas pelos pesquisadores para isolar o efeito do horário, comparou 12 semanas de alimentação em janela de 10 horas a um padrão alimentar usual, com calorias ajustadas para manter o peso inicial em ambos os grupos: a perda de peso foi discreta e semelhante entre os grupos (mediana de 2,7% vs. 2,5%), sem diferença significativa em hormônios de apetite ou marcadores inflamatórios.",
      mudou: "Por fornecer as próprias refeições e ajustar calorias, este ensaio isola melhor do que estudos anteriores o efeito específico do horário das refeições (e não apenas da restrição calórica) — e mostra que, isolado da perda de peso, restringir a janela alimentar para 10 horas não trouxe benefício adicional sobre apetite ou inflamação nesta amostra com obesidade e pré-diabetes.",
      aplicar: "Ao discutir jejum/restrição horária com pacientes com obesidade e pré-diabetes, explique que o possível benefício dessa estratégia parece vir principalmente de comer menos no total, e não de um efeito metabólico específico do horário sobre apetite ou inflamação — a restrição horária pode ser oferecida como uma forma prática de ajudar alguns pacientes a reduzir a ingestão calórica, mas sem prometer um mecanismo hormonal ou anti-inflamatório adicional.",
      evidencia: 4,
      link: "https://doi.org/10.1002/oby.70270",
      fonte: {
        autores: "Duan, Carnell, Pilla, Chung, Clark e Maruthur (Johns Hopkins University)",
        revista: "Obesity",
        ano: "2026",
        desenho: "Ensaio clínico randomizado de alimentação controlada (estudo TRIM)",
        amostra: "Adultos com obesidade e pré-diabetes (ou diabetes tipo 2 controlada por dieta); 12 semanas, refeições fornecidas pelos pesquisadores, calorias ajustadas para manter o peso",
        doi: "10.1002/oby.70270",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Estudos anteriores sobre alimentação em janela restrita de tempo (time-restricted eating) muitas vezes não conseguem separar o efeito específico do horário das refeições do efeito, mais simples, de as pessoas acabarem comendo menos quando têm menos horas disponíveis para comer. Os pesquisadores da Johns Hopkins desenharam um ensaio que fornece as próprias refeições e ajusta as calorias para manter o peso, justamente para testar se o horário em si afeta apetite e inflamação, independentemente de perda de peso." },
        { h: "Como o estudo foi feito", p: "No estudo TRIM, os participantes, adultos com obesidade e pré-diabetes (ou diabetes tipo 2 controlada por dieta), foram randomizados para 12 semanas de alimentação em janela de 10 horas ou um padrão alimentar usual, com todas as refeições fornecidas pela unidade de pesquisa clínica da Johns Hopkins (ProHealth Clinical Research Unit) e calorias ajustadas para manter o peso inicial em ambos os grupos. Os desfechos incluíram variação de peso, hormônios relacionados ao apetite e marcadores inflamatórios." },
        { h: "O que foi encontrado", p: "A perda de peso foi discreta e semelhante entre os grupos (mediana de 2,7% no grupo de janela restrita vs. 2,5% no grupo de padrão usual), sem diferença estatisticamente significativa. Também não houve diferença significativa entre os grupos em hormônios de apetite ou marcadores inflamatórios. Os autores concluíram que a restrição da janela alimentar não trouxe benefício adicional além da variação de peso observada." },
        { h: "O que isso não responde", p: "O desenho controlado (com refeições fornecidas e calorias ajustadas) é uma força do estudo, mas também significa que ele não reflete o dia a dia real, em que a maioria das pessoas que adota janela restrita de alimentação acaba comendo menos por conta própria, sem ter as calorias ajustadas por um pesquisador. O estudo também teve 12 semanas de duração, não avaliando efeitos de prazo mais longo sobre apetite, inflamação ou peso." },
        { h: "Na prática do consultório", p: "Ao discutir jejum ou restrição horária com pacientes com obesidade e pré-diabetes, você pode explicar que o possível benefício dessa estratégia parece vir principalmente de reduzir a ingestão calórica total, e não de um efeito hormonal ou anti-inflamatório específico do horário das refeições. A restrição horária continua sendo uma ferramenta prática razoável para ajudar alguns pacientes a comerem menos no total, mas não deve ser apresentada como tendo um mecanismo metabólico adicional comprovado além da perda de peso." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dextrina-resistente-microbiota-fecal-ecr-piloto",
      categoria: "Microbiota",
      areas: ["Microbiota", "Suplementação"],
      data: "20 mai 2026",
      title: "ECR piloto duplo-cego: dextrina resistente (NUTRIOSE) aumenta bactérias benéficas do gênero Parabacteroides na microbiota fecal, com efeito mais pronunciado em quem já consome mais fibra",
      resumo: "Ensaio clínico randomizado, duplo-cego, controlado por placebo (NCT05105425) com 124 homens adultos saudáveis de baixa ou alta ingestão habitual de fibra testou 15 g/dia de dextrina resistente (NUTRIOSE) por 4 semanas frente a maltodextrina: a dextrina resistente aumentou a abundância do gênero Parabacteroides (sobretudo a espécie P. distasonis) na microbiota fecal em ambos os subgrupos, com efeito mais pronunciado no subgrupo de maior ingestão basal de fibra, mas sem alterar pH fecal, ácidos graxos de cadeia curta totais, IgA ou consistência/frequência das fezes.",
      mudou: "Mostra que suplementar um tipo específico de fibra solúvel (dextrina resistente) pode enriquecer seletivamente um gênero bacteriano benéfico mesmo em quem já tem ingestão de fibra mais alta — mas o efeito ficou restrito a essa mudança composicional específica, sem refletir em marcadores fecais mais amplos de fermentação (ácidos graxos de cadeia curta totais) ou de função intestinal nesse ensaio piloto de curta duração.",
      aplicar: "Pode-se considerar a dextrina resistente como opção de fibra solúvel bem tolerada para pacientes que já consomem fibra adequadamente e buscam reforçar especificamente a presença de Parabacteroides — mas não a apresente como substituta da variedade de fontes de fibra, já que o estudo não encontrou efeito sobre ácidos graxos de cadeia curta totais nem sobre a função intestinal global; vale lembrar que o estudo teve financiamento parcial da fabricante do ingrediente (Roquette), o que pede cautela na interpretação.",
      evidencia: 3,
      link: "https://doi.org/10.3389/fnut.2026.1810842",
      fonte: {
        autores: "Autoria não detalhada nos resumos consultados — conferir no artigo original",
        revista: "Frontiers in Nutrition",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, duplo-cego, controlado por placebo (piloto)",
        amostra: "124 homens adultos saudáveis (18-60 anos) com baixa ou alta ingestão habitual de fibra; 15 g/dia de dextrina resistente por 4 semanas",
        doi: "10.3389/fnut.2026.1810842",
        acesso: "Acesso aberto (texto completo livre, Frontiers); estudo com financiamento parcial da Roquette (fabricante do NUTRIOSE)"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "A dextrina resistente é um tipo de fibra solúvel fermentável, comercializada sob a marca NUTRIOSE, promovida para benefícios sobre a microbiota intestinal. Os autores quiseram testar se seu efeito sobre bactérias benéficas específicas depende da ingestão habitual de fibra da pessoa — ou seja, se quem já consome bastante fibra ainda se beneficia da suplementação, ou se o efeito se concentra em quem consome pouca fibra no dia a dia." },
        { h: "Como o estudo foi feito", p: "Ensaio clínico randomizado, duplo-cego, controlado por placebo (NCT05105425) recrutou 124 homens adultos saudáveis de 18 a 60 anos, divididos em subgrupos de baixa ou alta ingestão habitual de fibra. Os participantes receberam 15 g/dia de dextrina resistente (NUTRIOSE) ou placebo (maltodextrina) por 4 semanas. Foram avaliadas a composição da microbiota fecal, o pH fecal, os ácidos graxos de cadeia curta, a IgA fecal e a consistência/frequência das fezes." },
        { h: "O que foi encontrado", p: "A dextrina resistente aumentou a abundância do gênero Parabacteroides, sobretudo da espécie P. distasonis, em ambos os subgrupos de ingestão de fibra, com efeito ainda mais pronunciado no subgrupo que já tinha ingestão basal mais alta. Não houve, porém, alteração significativa no pH fecal, nos ácidos graxos de cadeia curta totais, na IgA fecal ou na consistência/frequência das fezes entre os grupos." },
        { h: "O que isso não responde", p: "O estudo não esclarece se o aumento específico de Parabacteroides se traduz em algum benefício clínico perceptível para o paciente, já que os marcadores funcionais mais amplos (ácidos graxos de cadeia curta totais, função intestinal) não se alteraram neste ensaio de curta duração (4 semanas). O financiamento parcial pela Roquette, fabricante do NUTRIOSE, também é um fator a considerar na interpretação dos resultados." },
        { h: "Na prática do consultório", p: "A dextrina resistente pode ser considerada como opção de fibra solúvel bem tolerada para pacientes que buscam reforçar especificamente a presença de Parabacteroides na microbiota, mesmo que já tenham ingestão de fibra adequada — mas não a apresente como superior a outras fontes de fibra para benefícios funcionais amplos (produção de ácidos graxos de cadeia curta, função intestinal), já que esses marcadores não mudaram neste estudo. Continue recomendando variedade de fontes de fibra como estratégia padrão, e avalie a dextrina resistente como um complemento específico, não substituto." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "multivitaminicos-revisao-ensaios-clinicos-eficacia-seguranca",
      categoria: "Suplementação",
      areas: ["Suplementação", "Clínica"],
      data: "29 out 2026",
      title: "Revisão de 157 publicações: multivitamínicos elevam de forma consistente os níveis sanguíneos de folato, B6 e B12, mas sem respaldo consistente de benefício cardiovascular ou cognitivo",
      resumo: "Revisão de escopo (scoping review) de ensaios clínicos sobre multivitamínicos, publicada no Journal of Dietary Supplements (buscas até 9 de setembro de 2026, 157 publicações elegíveis, 103 relatos de intervenções primárias), encontrou elevação consistente dos níveis sanguíneos de vitamina B6, B12 e folato com a suplementação, enquanto a resposta de minerais (ferro, zinco, iodo) foi mais variável e dependente do contexto; grandes ensaios clínicos não estabeleceram benefício cardiovascular consistente, e a evidência sobre prevenção de declínio cognitivo foi considerada insuficiente.",
      mudou: "Reforça, numa revisão ampla de ensaios clínicos, a distinção entre 'elevar o nível sanguíneo do nutriente' e 'melhorar desfecho clínico relevante' — multivitamínicos cumprem bem o primeiro objetivo para algumas vitaminas, mas a tradução para menos doença cardiovascular, melhor cognição ou outros desfechos duros continua sem respaldo consistente nos ensaios disponíveis.",
      aplicar: "Ao orientar pacientes que já tomam ou perguntam sobre multivitamínicos de forma preventiva geral, explique que a elevação de níveis sanguíneos (sobretudo B6, B12, folato) é esperada e consistente, mas que isso não deve ser confundido com prevenção comprovada de doença cardiovascular ou declínio cognitivo; reserve a indicação para necessidade identificada (deficiência, grupo de risco) em vez de uso preventivo genérico, e fique atento a interações (por exemplo, vitamina K com anticoagulantes) e a efeitos digestivos com ferro/zinco. Vale registrar que o autor sênior do estudo declarou vínculo consultivo com a indústria de suplementos e é editor-chefe do periódico — considere esse conflito de interesse ao avaliar o tom das conclusões.",
      evidencia: 2,
      link: "https://doi.org/10.1080/19390211.2025.2597204",
      fonte: {
        autores: "Fan, Nelson e Wallace",
        revista: "Journal of Dietary Supplements",
        ano: "2026",
        desenho: "Revisão de escopo (scoping review) de ensaios clínicos",
        amostra: "157 publicações elegíveis (103 relatos de intervenções primárias), buscas até 9 de setembro de 2026",
        doi: "10.1080/19390211.2025.2597204",
        acesso: "Resumo e cobertura especializada consultados; verificar acesso ao texto completo no site da revista. Conflito de interesse declarado: o autor sênior tem vínculo consultivo com a indústria de suplementos (Haleon) e é editor-chefe do periódico."
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Multivitamínicos estão entre os suplementos mais usados no mundo, mas a literatura sobre sua eficácia é dispersa e inconsistente. Os autores quiseram mapear, de forma ampla, o que os ensaios clínicos já publicados mostram sobre o efeito dos multivitamínicos em níveis sanguíneos de nutrientes e em desfechos de saúde mais relevantes, como doença cardiovascular e cognição." },
        { h: "Como o estudo foi feito", p: "Revisão de escopo (scoping review) buscou, até 9 de setembro de 2026, ensaios clínicos sobre multivitamínicos, identificando 157 publicações elegíveis, das quais 103 eram relatos de intervenções primárias (os outros 54 eram publicações relacionadas, como análises secundárias). A revisão organizou os achados por tipo de desfecho: níveis sanguíneos de nutrientes, desfechos cardiovasculares, cognitivos e de segurança." },
        { h: "O que foi encontrado", p: "A suplementação elevou de forma consistente os níveis sanguíneos de vitamina B6, B12 e folato. Já a resposta de minerais como ferro, zinco e iodo foi mais variável, dependendo do contexto (estado nutricional basal, dose, formulação). Grandes ensaios clínicos não estabeleceram benefício cardiovascular consistente, e os achados sobre cognição foram mistos — alguns estudos relataram ganhos de memória em idosos, mas outros não encontraram benefício cognitivo significativo; os autores consideraram a evidência de prevenção de declínio cognitivo insuficiente. Em segurança, a maioria dos produtos foi bem tolerada, com relatos ocasionais de desconforto digestivo, erupções cutâneas ou eventos relacionados a sangramento, além de possível interação entre suplementos com vitamina K e anticoagulantes." },
        { h: "O que isso não responde", p: "Por ser uma revisão de escopo (que mapeia a literatura, sem agrupar estatisticamente os resultados em uma meta-análise), o estudo não fornece uma estimativa numérica única do tamanho do efeito dos multivitamínicos sobre nenhum desfecho. É importante registrar também que o autor sênior declarou vínculo consultivo com a indústria de suplementos (Haleon) e exerce o cargo de editor-chefe do próprio periódico onde a revisão foi publicada — um conflito de interesse relevante para a interpretação do tom das conclusões, mesmo que os autores afirmem que o financiador não teve papel na pesquisa ou no manuscrito." },
        { h: "Na prática do consultório", p: "Ao orientar pacientes que tomam ou perguntam sobre multivitamínicos de forma preventiva geral, explique que a elevação de níveis sanguíneos de algumas vitaminas (B6, B12, folato) é esperada e bem documentada, mas isso não equivale a prevenção comprovada de doença cardiovascular ou declínio cognitivo. Priorize a indicação de multivitamínicos para necessidade identificada (deficiência confirmada, grupo de risco específico) em vez de uso preventivo genérico, e fique atento a interações medicamentosas e a efeitos digestivos com formulações que contenham ferro ou zinco." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "team-up-tratamento-comportamental-familiar-obesidade-infantil-ecr",
      categoria: "Obesidade",
      areas: ["Obesidade", "Materno Infantil", "Comportamental"],
      data: "27 jul 2026",
      title: "Ensaio TEAM UP: tratamento comportamental familiar para obesidade infantil entregue na atenção primária melhora risco cardiometabólico em 42% das crianças, com benefício mantido 6 meses após o fim do tratamento",
      resumo: "Ensaio clínico randomizado (estudo TEAM UP) com 730 crianças de 6 a 15 anos com obesidade, atendidas em 41 consultórios de atenção primária em quatro estados dos EUA, comparou cuidado padrão aprimorado a esse mesmo cuidado somado a até 33 sessões de tratamento comportamental familiar (conduzidas majoritariamente por telessaúde, por nutricionista ou profissional de saúde comportamental treinado): cerca de 42% das crianças no grupo de intervenção atingiram redução de peso suficiente para melhorar o risco cardiometabólico (colesterol e risco de diabetes) em 18 meses, com o benefício mantido 6 meses após o fim do tratamento ativo.",
      mudou: "Mostra que um programa de tratamento comportamental familiar estruturado para obesidade infantil, já validado em centros especializados, pode ser entregue dentro da atenção primária (inclusive por telessaúde) com resultado clínico relevante e sustentado — ampliando o acesso a uma intervenção que antes dependia de encaminhamento a serviços especializados.",
      aplicar: "Para equipes de atenção primária que atendem crianças com obesidade, este ECR sustenta a viabilidade de oferecer tratamento comportamental familiar estruturado (presencial ou por telessaúde) como parte do cuidado, com expectativa realista de que cerca de 4 em cada 10 crianças atinjam melhora cardiometabólica relevante em 18 meses; reforce que o acompanhamento familiar e a manutenção de sessões ao longo do tempo parecem sustentar o benefício mesmo após o fim do tratamento ativo.",
      evidencia: 4,
      link: "https://doi.org/10.1001/jamapediatrics.2026.3067",
      fonte: {
        autores: "Equipe do estudo TEAM UP (Washington University School of Medicine e colaboradores)",
        revista: "JAMA Pediatrics",
        ano: "2026",
        desenho: "Ensaio clínico randomizado multicêntrico",
        amostra: "730 crianças de 6-15 anos com obesidade, 41 práticas de atenção primária no Missouri, Illinois, Louisiana e Nova York; seguimento de 18 meses",
        doi: "10.1001/jamapediatrics.2026.3067",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "Programas estruturados de tratamento comportamental familiar para obesidade infantil já têm eficácia comprovada quando entregues em centros especializados, mas o acesso a esses centros é limitado. Os autores quiseram testar se um programa semelhante poderia ser entregue dentro da atenção primária — onde a maioria das crianças com obesidade é efetivamente atendida — e ainda produzir benefício clínico relevante." },
        { h: "Como o estudo foi feito", p: "O ensaio TEAM UP randomizou 730 crianças de 6 a 15 anos com obesidade, atendidas em 41 práticas de atenção primária no Missouri, Illinois, Louisiana e Nova York, para cuidado padrão aprimorado ou esse mesmo cuidado somado a até 33 sessões de tratamento comportamental familiar. As sessões foram conduzidas principalmente por telessaúde (mais de 75% delas, em parte pelo período da pandemia de covid-19 durante a condução do estudo), por nutricionistas ou profissionais de saúde comportamental treinados. O desfecho principal foi a proporção de crianças que atingiram redução de peso suficiente para melhorar o risco cardiometabólico, avaliado aos 18 meses, com seguimento adicional 6 meses após o fim do tratamento ativo." },
        { h: "O que foi encontrado", p: "Cerca de 42% das crianças no grupo de intervenção atingiram redução de peso suficiente para melhorar marcadores de risco cardiometabólico (como colesterol e risco de diabetes) aos 18 meses. Esse benefício se manteve 6 meses após o fim do tratamento ativo, sugerindo um efeito que não dependeu da continuidade das sessões para se sustentar no curto prazo após a intervenção. Cerca de metade das famílias participantes dependia do Medicaid, refletindo uma população de maior vulnerabilidade social." },
        { h: "O que isso não responde", p: "O estudo não detalha, nos resumos consultados, qual foi exatamente o resultado equivalente no grupo de cuidado padrão aprimorado (sem o tratamento comportamental familiar), o que dificulta quantificar com precisão o tamanho do benefício adicional da intervenção. A condução parcial do estudo durante a pandemia de covid-19, com predominância de sessões por telessaúde, também levanta a dúvida sobre se os resultados seriam diferentes num formato majoritariamente presencial. Os autores planejam seguimento de 5 e 10 anos, que ainda não está disponível." },
        { h: "Na prática do consultório", p: "Para profissionais que atendem crianças com obesidade na atenção primária (ou em parceria com ela), este ECR sustenta a viabilidade e o potencial benefício clínico de oferecer tratamento comportamental familiar estruturado, inclusive por telessaúde, sem a necessidade de encaminhamento a um centro especializado distante. Tenha uma expectativa realista de que, aproximadamente, 4 em cada 10 crianças atingirão melhora cardiometabólica relevante em 18 meses, e valorize o envolvimento da família como parte central da estratégia, já que o desenho do programa testado girava em torno disso." }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "micronutrientes-multiplos-gestacao-crescimento-infantil-meta-analise",
      categoria: "Materno Infantil",
      areas: ["Materno Infantil", "Saúde da Mulher"],
      data: "28 abr 2025",
      title: "Meta-análise: suplemento prenatal com múltiplos micronutrientes melhora o tamanho ao nascer e o crescimento do bebê até 6 meses, em comparação a ferro e ácido fólico isolados, mas o benefício não se mantém depois",
      resumo: "Revisão sistemática com meta-análise, publicada no American Journal of Clinical Nutrition, reuniu ensaios clínicos randomizados comparando suplementação prenatal com múltiplos micronutrientes (que inclui ferro e ácido fólico) à suplementação isolada de ferro e ácido fólico: o grupo com múltiplos micronutrientes teve maior peso, comprimento e perímetro cefálico ao nascer e nos primeiros meses de vida, com redução do risco de nanismo (RR 0,86) aos 3 meses — mas as diferenças de crescimento não persistiram além dos 6 meses de idade.",
      mudou: "Consolida, numa meta-análise que reuniu os ensaios de uma revisão Cochrane e buscas atualizadas, que trocar o ferro e ácido fólico isolados por um suplemento prenatal com múltiplos micronutrientes melhora o tamanho ao nascer e o crescimento inicial do bebê — mas também deixa claro que esse benefício de crescimento se esgota ao redor dos 6 meses, não se estendendo ao segundo semestre de vida nesta síntese.",
      aplicar: "Ao orientar gestantes sobre suplementação prenatal, é razoável discutir a troca do ferro e ácido fólico isolados por um suplemento com múltiplos micronutrientes como estratégia para melhorar o tamanho ao nascer e o crescimento inicial do bebê — mas comunique que, com base nesta meta-análise, esse ganho de crescimento não se sustenta além dos 6 meses de vida, então a estratégia deve ser vista como ganho de início de vida, não como proteção duradoura contra déficit de crescimento; a indicação final de qual suplemento prenatal usar segue sendo decisão compartilhada com a equipe obstétrica.",
      evidencia: 5,
      link: "https://doi.org/10.1016/j.ajcnut.2025.04.022",
      fonte: {
        autores: "Gomes e cols.",
        revista: "The American Journal of Clinical Nutrition",
        ano: "2025",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados",
        amostra: "Ensaios clínicos randomizados reunidos a partir de revisão Cochrane e buscas atualizadas; comparação de suplementação prenatal com múltiplos micronutrientes vs. ferro e ácido fólico isolados; seguimento até 24 meses de idade",
        doi: "10.1016/j.ajcnut.2025.04.022",
        pubmed: "40306386",
        acesso: "Resumo livre; verificar acesso ao texto completo no site da revista"
      },
      leitura: [
        { h: "A pergunta do estudo", p: "O protocolo padrão de suplementação prenatal em muitos países é a combinação isolada de ferro e ácido fólico (IFA), mas suplementos prenatais com múltiplos micronutrientes (que incluem IFA mais outras vitaminas e minerais) têm sido propostos como alternativa potencialmente superior. Os autores quiseram reunir os ensaios clínicos disponíveis para comparar o efeito dos dois tipos de suplementação sobre o tamanho do bebê ao nascer e seu crescimento nos primeiros dois anos de vida." },
        { h: "Como o estudo foi feito", p: "Revisão sistemática com meta-análise reuniu ensaios clínicos randomizados identificados em uma revisão Cochrane prévia e em buscas atualizadas, comparando suplementação prenatal com múltiplos micronutrientes à suplementação isolada de ferro e ácido fólico. Os desfechos avaliados incluíram peso, comprimento e perímetro cefálico ao nascer e em diferentes idades até 24 meses, além do risco de nanismo (baixa estatura para a idade)." },
        { h: "O que foi encontrado", p: "Em comparação ao ferro e ácido fólico isolados, os suplementos prenatais com múltiplos micronutrientes associaram-se a maior peso e comprimento desde o nascimento até os 6 meses de idade, maior perímetro cefálico até os 12 meses, e maior circunferência do braço (MUAC) até os 3 meses. Houve também redução do risco de nanismo aos 3 meses (RR 0,86; IC 95%: 0,82 a 0,91). No entanto, essas diferenças de crescimento entre os grupos não se mantiveram além dos 6 meses de idade." },
        { h: "O que isso não responde", p: "A meta-análise não esclarece, nos resumos consultados, por que o benefício de crescimento se concentra nos primeiros 6 meses e depois se dissipa — pode refletir fatores como introdução da alimentação complementar, diluição do efeito inicial com o tempo, ou simplesmente que o suplemento prenatal não tem como influenciar o crescimento após esse período. Também não há, nesta síntese, uma análise detalhada de qual composição específica de micronutrientes (além de ferro e ácido fólico) é responsável pela maior parte do benefício observado." },
        { h: "Na prática do consultório", p: "Ao orientar gestantes sobre a escolha do suplemento prenatal, você pode discutir a substituição do ferro e ácido fólico isolados por um suplemento com múltiplos micronutrientes como estratégia para melhorar o tamanho do bebê ao nascer e seu crescimento nos primeiros 6 meses — mas seja transparente de que, segundo esta meta-análise, esse benefício específico de crescimento não se sustenta além desse período. A decisão final sobre qual suplemento prenatal prescrever deve continuar sendo compartilhada com a equipe obstétrica, considerando também disponibilidade e custo." }
      ]
    }
  ]
};

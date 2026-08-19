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
    title: "7 estudos reais que mexem na sua conduta",
    texto: "Creatina na saúde da mulher, manutenção de peso pós-tirzepatida (SURMOUNT-4), cepas de probiótico na SII, a virada da Cochrane sobre vitamina D na gestação, inositol na SOP pela diretriz internacional, proteína na DRC e mindfulness na compulsão. Cada card abre a leitura completa com o link do estudo original."
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
      id: "creatina-mulheres",
      categoria: "Esportiva",
      areas: ["Esportiva", "Saúde da Mulher"],
      data: "2025",
      title: "Creatina na saúde da mulher: do ciclo menstrual à menopausa",
      resumo: "Revisão do JISSN reúne o que já se sabe sobre creatina em mulheres — força, composição corporal, humor e cognição — e mostra onde a evidência ainda é fina.",
      mudou: "A creatina deixa de ser assunto só de atleta: há sinal de benefício ao longo da vida da mulher, mas os dados na perimenopausa e na gestação ainda são iniciais.",
      aplicar: "3–5 g/dia é a dose usual e segura, e o efeito aparece quando ela vem junto de treino de força — não isolada.",
      evidencia: 3,
      link: "https://doi.org/10.1080/15502783.2025.2502094",
      fonte: {
        autores: "Smith-Ryan e cols.",
        revista: "Journal of the International Society of Sports Nutrition",
        ano: "2025",
        desenho: "Revisão narrativa",
        amostra: "Síntese de estudos históricos e recentes em mulheres",
        doi: "10.1080/15502783.2025.2502094",
        pubmed: "40371844",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "Por que esta revisão existe",
          p: "A pesquisa com creatina foi construída majoritariamente em homens. Mulheres têm diferenças fisiológicas relevantes — flutuação hormonal no ciclo menstrual, gestação e menopausa — e essas variações afetam o metabolismo da creatina. Os autores fazem um apanhado histórico do que foi estudado em mulheres, o que os estudos antigos deixaram passar e onde a evidência está hoje."
        },
        {
          h: "Como o estudo foi feito",
          p: "É uma revisão narrativa, não uma meta-análise: os autores selecionam e discutem a literatura, sem cálculo de efeito combinado. Isso significa que ela serve para organizar o campo e apontar direções — não para estabelecer tamanho de efeito. Vale ler com esse peso."
        },
        {
          h: "O que os autores encontraram",
          p: "Os estudos iniciais mostraram benefício de creatina no desempenho de exercício em mulheres, mas quase sempre ignoraram a fase do ciclo menstrual. A pesquisa mais recente passou a controlar essa variável. O conjunto aponta efeito positivo sobre força muscular, desempenho e composição corporal, sobretudo quando a suplementação é combinada com treino resistido. Há ainda sinal de melhora de humor e função cognitiva, com possível alívio de sintomas depressivos. Evidência emergente sugere benefício na gestação e na pós-menopausa."
        },
        {
          h: "Onde a evidência é fraca",
          p: "Os dados em mulheres na perimenopausa continuam limitados. Os próprios autores listam como agenda de pesquisa: otimizar as estratégias de dose para mulheres, entender implicações de longo prazo e explorar o uso na gestação e na perimenopausa. Ou seja: entusiasmo com creatina fora do esporte é legítimo, mas ainda não tem o mesmo lastro que tem no contexto de performance."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes que treinam força, a conduta é bem sustentada: 3–5 g/dia de monoidratado, uso contínuo, sem necessidade de saturação. Para pacientes na peri e pós-menopausa interessadas em massa magra, cognição ou humor, a conversa é de decisão compartilhada — explique que o sinal é promissor mas ainda não é definitivo, e amarre a suplementação ao treino de força, que é o que sustenta o efeito. Registre no prontuário a indicação e a dose, conforme a Resolução CFN nº 656/2020."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "tirzepatida-manutencao",
      categoria: "Obesidade",
      areas: ["Clínica", "Funcional"],
      data: "2024",
      title: "SURMOUNT-4: o que acontece quando a tirzepatida é retirada",
      resumo: "Ensaio publicado no JAMA: quem parou a medicação reganhou peso (+14,0%) enquanto quem continuou seguiu perdendo (−5,5%) nas mesmas 52 semanas.",
      mudou: "O reganho após a suspensão é a regra, não a exceção. O acompanhamento nutricional deixa de ser acessório e vira a peça que sustenta o resultado a longo prazo.",
      aplicar: "Se a paciente pretende desmamar da medicação em algum momento, comece a construir o protocolo de transição e preservação de massa magra desde o início — não no mês da suspensão.",
      evidencia: 5,
      link: "https://doi.org/10.1001/jama.2023.24945",
      fonte: {
        autores: "Aronne e cols. (grupo SURMOUNT-4)",
        revista: "JAMA",
        ano: "2024",
        desenho: "Ensaio clínico randomizado de retirada (fase 3, duplo-cego, controlado por placebo)",
        amostra: "783 adultos com obesidade no período aberto; 670 randomizados, em 70 centros de 4 países",
        doi: "10.1001/jama.2023.24945",
        pubmed: "38078870",
        acesso: "Resumo livre no site do JAMA; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Já se sabia que a tirzepatida produz perda de peso expressiva. O que não se sabia era o que sustenta esse resultado: o remédio precisa continuar, ou a perda se mantém sozinha depois? O SURMOUNT-4 foi desenhado exatamente para responder isso."
        },
        {
          h: "Como o estudo foi feito",
          p: "Adultos com IMC ≥ 30, ou ≥ 27 com complicação relacionada ao peso (diabetes excluído), receberam tirzepatida subcutânea semanal na dose máxima tolerada (10 ou 15 mg) por 36 semanas, em regime aberto, com orientação de dieta e atividade física. Na semana 36, os 670 participantes que chegaram ao fim foram sorteados 1:1 para continuar a tirzepatida (335) ou trocar por placebo (335) durante mais 52 semanas, em duplo-cego. O desfecho primário foi a variação percentual média de peso entre a semana 36 e a semana 88."
        },
        {
          h: "Os números",
          p: "As 36 semanas iniciais produziram perda média de 20,9% do peso. Da semana 36 à 88, quem continuou com tirzepatida perdeu mais 5,5%; quem foi para o placebo ganhou 14,0% — diferença de 19,4 pontos percentuais (IC 95% −21,2 a −17,7; p < 0,001). Manteve pelo menos 80% do peso perdido: 89,5% do grupo tirzepatida contra 16,6% do placebo. No balanço das 88 semanas, a redução total foi de 25,3% com tirzepatida e 9,9% com placebo. Os eventos adversos mais comuns foram gastrointestinais, em geral leves a moderados, mais frequentes com a medicação."
        },
        {
          h: "O que isso não responde",
          p: "A média de idade era 48 anos e 71% eram mulheres — a amostra não é universal. O estudo excluiu pessoas com diabetes. E, principalmente: ele mostra o que acontece com a retirada abrupta dentro de um ensaio, não testou um protocolo nutricional estruturado de transição. O reganho de 14% é o cenário sem estratégia de desmame — que é justamente onde a nutrição entra."
        },
        {
          h: "Na prática do consultório",
          p: "Duas conversas mudam de lugar. A primeira é de expectativa: a paciente precisa saber, desde a primeira consulta, que interromper sem plano tende a devolver boa parte do peso. A segunda é de composição corporal: perdas rápidas de 20% ou mais cobram massa magra, e a janela de retirada é o pior momento para chegar sarcopênica. Ancore o acompanhamento em proteína adequada, treino resistido e monitoramento de composição corporal — não só de peso. Se houver desmame previsto, escalone: reduza a dose e aumente a densidade do acompanhamento no mesmo período."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-sii",
      categoria: "Microbiota",
      areas: ["Clínica", "Funcional"],
      data: "2023",
      title: "Qual cepa de probiótico para qual sintoma na SII",
      resumo: "Meta-análise em rede com 81 ensaios e 9.253 participantes ranqueia as cepas por desfecho — dor, distensão, qualidade de vida e forma das fezes.",
      mudou: "Prescrever 'um probiótico' não é conduta. O efeito é cepa-específico e desfecho-específico: a cepa que melhora dor não é a mesma que melhora a forma das fezes.",
      aplicar: "Escolha a cepa pelo sintoma dominante da paciente e pelo subtipo de SII, e reavalie em 4–8 semanas antes de manter ou trocar.",
      evidencia: 4,
      link: "https://doi.org/10.3390/nu15173856",
      fonte: {
        autores: "Xie e cols.",
        revista: "Nutrients",
        ano: "2023",
        desenho: "Revisão sistemática com meta-análise em rede",
        amostra: "81 ensaios clínicos randomizados, 9.253 participantes adultos com SII",
        doi: "10.3390/nu15173856",
        pubmed: "37686889",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "O problema que o estudo ataca",
          p: "A eficácia dos probióticos na síndrome do intestino irritável sempre foi controversa, e parte da confusão vem de tratar 'probiótico' como uma coisa só. Ensaios diferentes usaram cepas diferentes, mediram desfechos diferentes e chegaram a conclusões conflitantes. Esta é a primeira síntese a ranquear a eficácia cepa a cepa, separada por desfecho."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca na literatura até junho de 2023, incluindo apenas ensaios clínicos randomizados em adultos com SII. A meta-análise em rede permite comparar indiretamente cepas que nunca foram testadas uma contra a outra, usando o placebo como ponte. O ranqueamento é expresso em SUCRA — quanto mais perto de 100%, maior a probabilidade daquela cepa ser a melhor para aquele desfecho específico."
        },
        {
          h: "Os resultados por desfecho",
          p: "Gravidade global dos sintomas (IBS-SSS): quatro cepas isoladas e cinco misturas superaram o placebo, com Lactobacillus acidophilus DDS-1 em primeiro (SUCRA 92,9%). Qualidade de vida: uma mistura com cinco probióticos ficou em primeiro (SUCRA 100%). Dor abdominal: Bacillus coagulans MTCC 5856 (96,9%) e Bacillus coagulans Unique IS2 (92,6%) entre os mais eficazes. Distensão abdominal: três cepas isoladas e duas misturas foram eficazes. SII com predomínio de diarreia — frequência evacuatória: quatro cepas e uma mistura superaram o placebo; forma das fezes (escala de Bristol): Bacillus coagulans MTCC 5856 (99,6%) e Saccharomyces cerevisiae CNCM I-3856 (89,7%) na frente."
        },
        {
          h: "As ressalvas",
          p: "Comparação indireta em rede é menos robusta que comparação cabeça a cabeça — os próprios autores dizem que novos estudos são necessários para confirmar o ranking. Além disso, apenas algumas cepas mostraram efeito para desfechos específicos: a maioria dos produtos de prateleira não tem cepa identificada nem dose testada. E identificação de cepa é literal: DDS-1 e MTCC 5856 são códigos de linhagem, não sinônimos de 'Lactobacillus' ou 'Bacillus'."
        },
        {
          h: "Na prática do consultório",
          p: "Comece pelo sintoma que mais incomoda a paciente. Dor e distensão dominantes apontam para Bacillus coagulans com cepa identificada; SII-D com fezes desmanchadas apontam para B. coagulans MTCC 5856 ou S. cerevisiae CNCM I-3856; queixa difusa de qualidade de vida favorece as misturas multicepas. Na hora de indicar o produto, exija o código da cepa no rótulo — sem ele, não há como saber se é a linhagem estudada. Marque reavaliação em 4 a 8 semanas: sem resposta, troque a cepa em vez de aumentar a dose."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "vitd-gestacao",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Fertilidade", "Pediatria"],
      data: "2024",
      title: "Cochrane revisa vitamina D na gestação — e a base de evidência encolhe",
      resumo: "A atualização de 2024 retirou 21 estudos por problemas de confiabilidade. Sobraram 10, e a certeza da evidência caiu para baixa ou muito baixa.",
      mudou: "Inverte o discurso: a suplementação universal de vitamina D no pré-natal não tem hoje o respaldo que se supunha para pré-eclâmpsia, DMG ou prematuridade.",
      aplicar: "Dosar 25(OH)D e individualizar quem tem deficiência real, em vez de suplementar toda gestante por protocolo.",
      evidencia: 3,
      link: "https://doi.org/10.1002/14651858.CD008873.pub5",
      fonte: {
        autores: "Palacios e cols.",
        revista: "Cochrane Database of Systematic Reviews",
        ano: "2024",
        desenho: "Revisão sistemática Cochrane com meta-análise e avaliação GRADE",
        amostra: "10 estudos incluídos; na comparação principal, 8 estudos com 2.313 gestantes",
        doi: "10.1002/14651858.CD008873.pub5",
        pubmed: "39077939",
        acesso: "Resumo livre na Cochrane Library; texto completo pode exigir acesso institucional"
      },
      leitura: [
        {
          h: "O que mudou nesta atualização",
          p: "A versão anterior desta revisão incluía 30 estudos. Nesta atualização, os autores aplicaram uma ferramenta de avaliação de confiabilidade (trustworthiness) baseada em critérios pré-definidos de integridade científica. O resultado foi drástico: 20 estudos foram movidos para 'aguardando classificação', um foi excluído e um novo foi incluído — restaram 10. Retirar esses ensaios rebaixou a certeza da evidência para baixa ou muito baixa, por limitações de desenho, inconsistência entre estudos e imprecisão."
        },
        {
          h: "Vitamina D isolada vs. placebo ou nenhuma intervenção",
          p: "Oito estudos, 2.313 gestantes. Quatro foram julgados de baixo risco de viés na maioria dos domínios; quatro, de risco alto ou incerto. A evidência é muito incerta quanto ao efeito sobre pré-eclâmpsia (RR 0,53; IC 95% 0,21–1,33; 1 estudo, 165 mulheres), diabetes gestacional (RR 0,53; IC 0,03–8,28; 1 estudo, 165 mulheres), parto prematuro antes de 37 semanas (RR 0,76; IC 0,25–2,33; 3 estudos, 1.368 mulheres), síndrome nefrítica e hipercalcemia. Os intervalos de confiança são largos demais para sustentar conduta."
        },
        {
          h: "Onde houve sinal",
          p: "A suplementação pode reduzir o risco de hemorragia pós-parto grave (RR 0,68; IC 0,51–0,91; evidência de baixa certeza) — mas apenas um estudo, com 1.134 mulheres, reportou esse desfecho. E pode reduzir o risco de baixo peso ao nascer (RR 0,69; IC 0,44–1,08; 3 estudos, 371 bebês; baixa certeza), com a ressalva explícita dos autores de que o limite superior do intervalo não permite descartar aumento de risco. As combinações com cálcio, ou com cálcio e outros micronutrientes, produziram evidência muito incerta em todos os desfechos avaliados."
        },
        {
          h: "Como ler isso sem exagerar para nenhum lado",
          p: "Baixa certeza não é o mesmo que ausência de efeito: significa que os estudos existentes não permitem concluir. A vitamina D continua sendo um nutriente essencial e a deficiência documentada continua sendo condição a tratar. O que esta revisão derruba é o argumento de suplementar toda gestante à base de desfechos obstétricos, porque a evidência que sustentava esse argumento em grande parte não sobreviveu ao crivo de confiabilidade."
        },
        {
          h: "Na prática do consultório",
          p: "Mantenha a dosagem de 25(OH)D no início do pré-natal e trate a deficiência confirmada — isso não está em discussão. O que muda é a conversa com a gestante sem deficiência: não prometa redução de pré-eclâmpsia, diabetes gestacional ou prematuridade, porque a evidência atual não sustenta a promessa. Alinhe a conduta ao protocolo do serviço e ao acompanhamento obstétrico, e reavalie o status ao longo da gestação em vez de fixar dose no primeiro trimestre e esquecer."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "sop-inositol",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Fertilidade", "Funcional"],
      data: "2024",
      title: "Inositol na SOP: o que a diretriz internacional de 2023 realmente encontrou",
      resumo: "Meta-análise encomendada para embasar a diretriz internacional da SOP: 30 ensaios, 2.230 participantes — e uma conclusão mais modesta do que o mercado vende.",
      mudou: "Inositol não é primeira linha consolidada. Há benefício possível em alguns marcadores metabólicos, mas a evidência global é limitada e inconclusiva.",
      aplicar: "Decisão compartilhada: apresente o inositol como opção com evidência incerta e melhor tolerância gastrointestinal que a metformina, não como certeza.",
      evidencia: 3,
      link: "https://doi.org/10.1210/clinem/dgad762",
      fonte: {
        autores: "Fitz e cols.",
        revista: "The Journal of Clinical Endocrinology and Metabolism (JCEM)",
        ano: "2024",
        desenho: "Revisão sistemática com meta-análise, produzida para a atualização de 2023 das diretrizes internacionais baseadas em evidência para SOP",
        amostra: "30 ensaios, 2.230 participantes (1.093 intervenção, 1.137 controle); 19 estudos agrupados em meta-análise",
        doi: "10.1210/clinem/dgad762",
        pubmed: "38163998",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "Por que este trabalho pesa",
          p: "Não é mais uma meta-análise avulsa: foi conduzida especificamente para informar a atualização de 2023 das diretrizes internacionais baseadas em evidência para SOP. É o documento que os autores da diretriz usaram para decidir o que recomendar sobre inositol — o que o torna a referência mais próxima do consenso atual."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em Medline, PsycInfo, EMBASE, All EBM e CINAHL, do início das bases até agosto de 2022. Foram extraídos desfechos hormonais, metabólicos, lipídicos, psicológicos, antropométricos, reprodutivos e eventos adversos, por um revisor com verificação independente por um segundo. Treze comparações foram avaliadas, três delas com dados agrupados em meta-análise."
        },
        {
          h: "O que foi encontrado",
          p: "A evidência sugere benefício do mio-inositol ou do D-quiro-inositol (DCI) em algumas medidas metabólicas, e benefício potencial do DCI sobre a ovulação — mas o inositol pode não ter efeito sobre os demais desfechos. Na comparação com metformina: a metformina pode melhorar mais a relação cintura-quadril e o hirsutismo; provavelmente não há diferença nos desfechos reprodutivos; e a evidência sobre IMC é muito incerta. O mio-inositol provavelmente causa menos eventos adversos gastrointestinais que a metformina, e os eventos são tipicamente leves e autolimitados."
        },
        {
          h: "A conclusão que o mercado costuma omitir",
          p: "As palavras dos autores são explícitas: a evidência que sustenta o uso do inositol no manejo da SOP é limitada e inconclusiva. A recomendação é que profissional e paciente considerem essa incerteza junto com valores e preferências individuais, em decisão compartilhada. Isso é bem diferente de 'adjuvante de primeira linha', que é como o suplemento costuma ser apresentado."
        },
        {
          h: "Na prática do consultório",
          p: "O inositol continua sendo uma opção defensável, sobretudo para a paciente que não tolerou metformina — o perfil gastrointestinal é melhor. Mas a conversa precisa ser honesta: efeito provável em alguns marcadores metabólicos, possível efeito ovulatório com o DCI, e incerteza no resto. A base da conduta na SOP com perfil insulínico alterado segue sendo alimentar e comportamental — padrão de baixa carga glicêmica, atividade física e manejo de peso quando indicado. O inositol entra como adjuvante, com meta clara e prazo de reavaliação, não como o centro do tratamento."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "renal-proteina",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "2025",
      title: "Dieta hipoproteica na DRC: evidência, controvérsias e como aplicar",
      resumo: "Revisão no Journal of Internal Medicine organiza a briga: excesso de proteína agride o rim, restrição excessiva consome músculo — e o alvo é individual.",
      mudou: "Sai a meta fixa em g/kg para todo mundo; entra a decisão por estágio da DRC, idade, estado nutricional e complicações.",
      aplicar: "Antes de definir a meta proteica, avalie estado nutricional e massa muscular — restringir uma paciente já sarcopênica piora o prognóstico.",
      evidencia: 3,
      link: "https://doi.org/10.1111/joim.20117",
      fonte: {
        autores: "Mafra e cols.",
        revista: "Journal of Internal Medicine",
        ano: "2025",
        desenho: "Revisão narrativa com orientações práticas",
        amostra: "Síntese da literatura sobre ingestão proteica na DRC não dialítica",
        doi: "10.1111/joim.20117",
        pubmed: "40739997",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A controvérsia",
          p: "O benefício da dieta hipoproteica em pacientes com função renal alterada permanece controverso. Os autores começam reconhecendo o motivo: estudos de ingestão alimentar são intrinsecamente complexos e carregam vieses que precisam ser compreendidos e controlados. Por isso a evidência nessa área continua limitada e disputada — o que não significa que não haja o que fazer."
        },
        {
          h: "O que está bem estabelecido",
          p: "Existe literatura abundante ligando ingestão proteica excessiva nesses pacientes a problemas cardiovasculares, estresse oxidativo, hiperfosfatemia, doença mineral óssea, acidose metabólica, inflamação e disbiose intestinal — um conjunto que contribui tanto para o dano renal quanto para desordens sistêmicas concomitantes. O excesso de proteína também leva a acúmulo de produtos nitrogenados, sobrecarregando a função renal."
        },
        {
          h: "O outro lado do risco",
          p: "Restringir demais é igualmente perigoso: consumo proteico excessivamente restritivo leva à perda de massa muscular, o que pode piorar desfechos clínicos e o prognóstico da paciente. Os autores insistem que a dieta hipoproteica continua sendo uma recomendação valiosa na DRC não dialítica — desde que idade, estado nutricional e complicações da doença sejam cuidadosamente considerados."
        },
        {
          h: "O que a revisão não entrega",
          p: "Por ser uma revisão narrativa, ela não estabelece faixas numéricas com força de meta-análise nem substitui as diretrizes nefrológicas (KDIGO, KDOQI) na definição de valores por estágio. O valor dela está em nomear os dois riscos simultâneos e defender uma estratégia individualizada e monitorada — não em fixar números."
        },
        {
          h: "Na prática do consultório",
          p: "Antes de escrever a meta proteica, faça a avaliação nutricional completa: massa muscular, força de preensão, histórico de perda de peso, exames de fósforo e bicarbonato. Em paciente idosa ou com sinais de desnutrição, restringir proteína sem estratégia de preservação muscular é trocar um risco por outro. Combine a meta com energia adequada — restrição proteica sem energia suficiente vira catabolismo — e monitore TFG, estado nutricional e marcadores metabólicos em intervalos definidos. E deixe registrado no prontuário o raciocínio que levou àquela meta, porque ela vai precisar ser revista conforme a doença evolui."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "compulsao-mindful",
      categoria: "Comportamental",
      areas: ["Comportamental", "Estética"],
      data: "2025",
      title: "Mindfulness na compulsão alimentar: forte contra nada, empatado contra terapia",
      resumo: "Atualização de 10 anos com 54 estudos: efeito médio-grande contra controles sem intervenção psicológica, e efeito desprezível contra outras psicoterapias ativas.",
      mudou: "A pergunta certa deixa de ser 'mindfulness funciona?' e passa a ser 'mindfulness funciona melhor que a psicoterapia que a paciente já poderia estar fazendo?' — e aí o ganho some.",
      aplicar: "Ótimo recurso para quem não está em acompanhamento psicológico nenhum; não é motivo para substituir uma terapia em andamento.",
      evidencia: 4,
      link: "https://doi.org/10.1007/s10865-025-00550-5",
      fonte: {
        autores: "Liu e cols.",
        revista: "Journal of Behavioral Medicine",
        ano: "2025",
        desenho: "Revisão sistemática com meta-análise (atualização de 10 anos da revisão de Godfrey, Gallo & Afari, 2015)",
        amostra: "54 estudos incluídos (contra 19 na revisão original)",
        doi: "10.1007/s10865-025-00550-5",
        pubmed: "39979674",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "O que foi atualizado",
          p: "Intervenções baseadas em mindfulness (MBIs) ganharam popularidade no tratamento da compulsão alimentar, e revisões anteriores encontraram efeitos de médio-grande a grande. Como a literatura cresceu rápido, os autores refizeram a revisão de Godfrey, Gallo e Afari (2015) dez anos depois. O salto de volume é evidente: 19 estudos elegíveis então, 54 agora."
        },
        {
          h: "Como o estudo foi feito",
          p: "Busca em PubMed, PsycINFO e Web of Science com termos que cobriam compulsão alimentar, comer excessivo, episódios bulímicos objetivos, terapia de aceitação e compromisso (ACT), terapia comportamental dialética (DBT), mindfulness, meditação e mindful eating. A meta-análise de efeitos aleatórios calculou tamanhos de efeito entre grupos, separando dois tipos de comparação — e é aí que está o achado principal."
        },
        {
          h: "Os dois resultados que precisam ser lidos juntos",
          p: "Contra controles sem intervenção psicológica (lista de espera, cuidado usual), as MBIs tiveram efeito médio-grande: g de Hedges médio de −0,65 ao fim do tratamento e −0,71 no seguimento. Contra controles psicológicos ativos — ou seja, outra psicoterapia de verdade — o efeito foi desprezível: −0,05 ao fim do tratamento e +0,13 no seguimento. Entre as MBIs, a DBT foi a que reuniu mais estudos com efeitos grandes. Intervenções que miravam diretamente a compulsão tiveram efeitos maiores do que aquelas em que a compulsão era desfecho secundário."
        },
        {
          h: "O que os autores pedem a seguir",
          p: "Mais ensaios randomizados comparando MBIs com outras intervenções psicológicas, meta-análises que separem os tipos de MBI e os alvos da intervenção, e seguimentos mais longos. Os estudos novos incluídos nesta revisão foram mais internacionais, focaram mais em participantes com sobrepeso ou obesidade e envolveram mais componentes de autoajuda e tecnologia — o que também abre a questão de dose e adesão."
        },
        {
          h: "Na prática do consultório",
          p: "Para a paciente com compulsão que não está em acompanhamento psicológico algum, oferecer práticas estruturadas de mindful eating é uma intervenção com evidência real de benefício — e cabe dentro do escopo do nutricionista quando aplicada ao comportamento alimentar. Para a paciente que já faz terapia, o dado diz o oposto do senso comum: não há ganho em trocar. O caminho útil é integrar, alinhando com quem acompanha. E prefira protocolos que mirem a compulsão diretamente, com prática guiada e regular, em vez de orientações genéricas de 'comer com atenção' — a diferença de efeito entre as duas coisas apareceu na meta-análise."
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

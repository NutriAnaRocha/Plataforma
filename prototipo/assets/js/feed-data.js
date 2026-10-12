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
    texto: "Uma meta-análise com avaliação GRADE separa a folha de oliveira (melhora o perfil lipídico) do bagaço de oliva (sem benefício cardiometabólico) como suplementos derivados da oliveira, um ensaio randomizado associa suplementação de ferro a maior taxa de gravidez em mulheres em FIV, uma rede de meta-análise mostra que creatina, proteína e ômega-3 se destacam cada um em um desfecho diferente (força, resistência e recuperação) em atletas treinados, um ensaio brasileiro mostra que um programa de dissonância cognitiva supera uma abordagem educacional para alimentação intuitiva e imagem corporal, com ganho mantido por até 48 semanas, uma revisão sistemática encontra que pró/pré/simbióticos modulam a microbiota de lactentes sem sinal de efeito no eixo intestino-cérebro ou no neurodesenvolvimento, uma revisão rápida de 19 meta-análises sobre multivitamínico/mineral encontra benefício em cognição e pressão arterial mas nenhum em mortalidade, o ensaio DELISH mostra que um padrão mediterrâneo adaptado não supera a restrição calórica tradicional em perda de peso — mas melhora mais a qualidade da dieta —, um grande ensaio em Bangladesh mostra que suplemento de energia-proteína fortificado não reduz restrição de crescimento fetal frente ao suplemento padrão de micronutrientes, e um estudo confirma o ângulo de fase por bioimpedância como preditor moderado de sobrevida em 5 anos na hemodiálise. Cada card abre a leitura completa com o link do estudo original."
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
      id: "folha-oliveira-bagaco-oliva-cardiometabolico",
      categoria: "Clínica",
      areas: ["Clínica"],
      data: "01 out 2026",
      title: "Meta-análise com avaliação GRADE mostra que a folha de oliveira melhora o perfil lipídico, mas o bagaço de oliva não traz benefício cardiometabólico consistente",
      resumo: "Revisão sistemática com meta-análise de 30 ensaios clínicos randomizados (1.726 participantes) avaliou 21 marcadores cardiometabólicos e antropométricos com suplementação de folha de oliveira (olive leaf) ou bagaço/resíduo de oliva (olive pomace): a folha de oliveira melhorou colesterol total, LDL, triglicerídeos e ApoB, sem efeito sobre controle glicêmico; o bagaço de oliva não mostrou benefício cardiometabólico ou antropométrico consistente.",
      mudou: "Até aqui, folha de oliveira e bagaço de oliva eram frequentemente tratados como opções intercambiáveis de suplementação derivada da oliveira — esta meta-análise com avaliação GRADE separa os dois: só a folha de oliveira tem respaldo consistente para melhora do perfil lipídico, enquanto o bagaço de oliva não mostrou o mesmo benefício.",
      aplicar: "Ao considerar suplementação derivada da oliveira para melhorar o perfil lipídico, priorize produtos de folha de oliveira (olive leaf) com respaldo nesta meta-análise, e não espere o mesmo efeito de suplementos de bagaço de oliva — e não prometa impacto sobre glicemia só com esse suplemento, já que esse desfecho não melhorou com nenhum dos dois.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/42303499/",
      fonte: {
        autores: "Mansouri e cols.",
        revista: "Nutrition, Metabolism and Cardiovascular Diseases",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise de ensaios clínicos randomizados, com avaliação de certeza da evidência pelo sistema GRADE",
        amostra: "30 ECRs, 1.726 participantes, 21 biomarcadores cardiometabólicos e antropométricos avaliados",
        doi: "10.1016/j.numecd.2026.104821",
        pubmed: "42303499",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Suplementos derivados da oliveira — folha (olive leaf) e bagaço/resíduo da prensagem (olive pomace) — são frequentemente promovidos juntos como fontes de compostos fenólicos anti-inflamatórios e cardioprotetores. Faltava uma meta-análise que avaliasse os dois separadamente, com avaliação formal da certeza da evidência, para saber se ambos merecem a mesma confiança clínica."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise reuniu 30 ensaios clínicos randomizados (1.726 participantes) testando suplementação com folha de oliveira ou bagaço de oliva versus placebo/controle, avaliando 21 biomarcadores — perfil lipídico, inflamação, controle glicêmico, sensibilidade à insulina, antropometria e pressão arterial. A certeza da evidência para cada desfecho foi classificada pelo sistema GRADE."
        },
        {
          h: "O que foi encontrado",
          p: "A suplementação com folha de oliveira melhorou marcadores do perfil lipídico — colesterol total, triglicerídeos, LDL, ApoB e LDL oxidada — mas não teve efeito significativo sobre controle glicêmico. Já o bagaço de oliva não mostrou benefício cardiometabólico ou antropométrico consistente, com sinal de possível aumento de um marcador inflamatório (IL-8) em parte dos estudos."
        },
        {
          h: "O que isso não responde",
          p: "A certeza da evidência (GRADE) variou de muito baixa a alta entre os diferentes desfechos, rebaixada em vários casos por heterogeneidade e imprecisão — e o número de ensaios disponíveis para o bagaço de oliva é bem menor que para a folha, o que limita a confiança nas conclusões sobre esse subproduto especificamente. O estudo também não avalia desfechos clínicos duros (eventos cardiovasculares), apenas marcadores intermediários."
        },
        {
          h: "Na prática do consultório",
          p: "Se for considerar suplementação derivada da oliveira para apoiar o perfil lipídico, priorize produtos à base de folha de oliveira, que têm respaldo mais consistente nesta meta-análise — e não estenda a mesma expectativa a suplementos de bagaço de oliva. Em ambos os casos, não prometa impacto sobre glicemia ou peso corporal apenas com o suplemento."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "suplementacao-ferro-fertilidade-fiv",
      categoria: "Saúde da Mulher",
      areas: ["Saúde da Mulher", "Fertilidade"],
      data: "15 fev 2026",
      title: "Ensaio randomizado associa suplementação de ferro a maior taxa de gravidez em mulheres em fertilização in vitro",
      resumo: "Ensaio clínico randomizado, duplo-cego e controlado, com 112 mulheres de 20-39 anos em fertilização in vitro (FIV), comparou suplementação de ferro com placebo: o grupo que recebeu ferro teve taxa de gravidez maior (50% vs. 28,5%; p=0,020) e mais embriões obtidos, sem diferença estatisticamente significativa na qualidade embrionária.",
      mudou: "Sugere, num primeiro ensaio randomizado sobre o tema, que corrigir o estado de ferro pode se relacionar com melhores desfechos reprodutivos em mulheres em FIV — não apenas com indicadores laboratoriais de anemia, que costumam ser o foco tradicional da suplementação de ferro.",
      aplicar: "Avalie e corrija o estado de ferro de pacientes em preparo para FIV como parte do acompanhamento nutricional pré-tratamento — mas, por ser um único ensaio pequeno e sem detalhes de dose ou duração ideal no resumo disponível, não prometa aumento da taxa de gravidez apenas com a suplementação, e individualize a indicação pelo status de ferro real da paciente.",
      evidencia: 4,
      link: "https://acta.tums.ac.ir/index.php/acta/article/view/11414",
      fonte: {
        autores: "Hojjati, Nakhaei e cols.",
        revista: "Acta Medica Iranica",
        ano: "2026",
        desenho: "Ensaio clínico randomizado, duplo-cego, controlado por placebo",
        amostra: "112 mulheres de 20-39 anos em tratamento de fertilização in vitro (FIV)",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "A deficiência de ferro é comum em mulheres em idade reprodutiva, mas a maior parte da evidência sobre suplementação de ferro foca em corrigir anemia, não em desfechos reprodutivos. Este ensaio testou se suplementar ferro durante o tratamento de fertilização in vitro (FIV) se associa a melhores taxas de gravidez e qualidade embrionária."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio clínico randomizado, duplo-cego e controlado por placebo incluiu 112 mulheres de 20 a 39 anos em tratamento de FIV, comparando suplementação de ferro com placebo durante o protocolo de estimulação ovariana, com avaliação de taxa de gravidez, número de embriões obtidos e qualidade embrionária."
        },
        {
          h: "O que foi encontrado",
          p: "A taxa de gravidez foi significativamente maior no grupo que recebeu ferro (50%) do que no grupo placebo (28,5%; p=0,020). O grupo ferro também obteve mais embriões em média, mas não houve diferença estatisticamente significativa na qualidade embrionária entre os grupos (p=0,055, no limite da significância)."
        },
        {
          h: "O que isso não responde",
          p: "É um ensaio único e relativamente pequeno (112 mulheres), sem detalhamento claro, no resumo disponível, sobre a dose de ferro usada, a duração da suplementação ou se as participantes já tinham deficiência de ferro confirmada antes de entrar no estudo — isso limita saber para quem, exatamente, a suplementação faz mais diferença, e os próprios autores pedem mais pesquisa sobre dose e efeitos de longo prazo."
        },
        {
          h: "Na prática do consultório",
          p: "Inclua a avaliação do estado de ferro (ferritina, hemoglobina) no acompanhamento nutricional de mulheres em preparo para FIV, e corrija deficiências identificadas — mas não venda a suplementação de ferro como garantia de aumento da taxa de gravidez: é um achado de um único ensaio, que precisa ser confirmado por estudos maiores antes de embasar uma recomendação padronizada."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "proteina-creatina-omega3-rede-atletas",
      categoria: "Esportiva",
      areas: ["Esportiva"],
      data: "13 mar 2026",
      title: "Rede de meta-análise compara proteína, creatina e ômega-3 em atletas treinados: cada suplemento se destaca em um desfecho diferente",
      resumo: "Revisão sistemática com meta-análise em rede reuniu 35 ensaios clínicos randomizados (1.211 participantes com pelo menos 6 meses de treino estruturado) comparando suplementação de proteína, creatina e ômega-3: a creatina liderou em força muscular, a proteína em desempenho de resistência (endurance) e o ômega-3 em recuperação, sem divergência relevante entre evidência direta e indireta na rede.",
      mudou: "Em vez de perguntar 'qual suplemento é o melhor' para atletas de forma genérica, esta rede de meta-análise reforça que a resposta depende do desfecho prioritário: cada um dos três suplementos — creatina, proteína e ômega-3 — se destacou em uma finalidade diferente, sem um 'vencedor' único entre eles.",
      aplicar: "Oriente a escolha do suplemento pelo objetivo do atleta: creatina quando a prioridade é força muscular, proteína quando é desempenho de resistência, e ômega-3 quando é recuperação pós-exercício — e lembre que as comparações entre os três vieram majoritariamente de uma rede de evidência indireta, então trate o ranqueamento como orientador, não como hierarquia definitiva.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/41901084/",
      fonte: {
        autores: "Wang, Qin e Kim",
        revista: "Nutrients",
        ano: "2026",
        desenho: "Revisão sistemática com meta-análise em rede (network meta-analysis) de ensaios clínicos randomizados",
        amostra: "35 ECRs, 1.211 participantes com pelo menos 6 meses de treino estruturado",
        doi: "10.3390/nu18060909",
        pubmed: "41901084",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Proteína, creatina e ômega-3 são os suplementos mais usados por atletas treinados, mas raramente foram comparados diretamente entre si quanto ao efeito sobre força, resistência e recuperação. Esta rede de meta-análise buscou colocar os três lado a lado para orientar qual se destaca em cada desfecho."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática com meta-análise em rede buscou em seis bases de dados ensaios clínicos randomizados testando proteína, creatina ou ômega-3 em pessoas com pelo menos 6 meses de treino estruturado, reunindo 35 ensaios e 1.211 participantes. Os desfechos avaliados foram força muscular, desempenho de resistência (endurance) e recuperação pós-exercício, com ranqueamento pelo método SUCRA."
        },
        {
          h: "O que foi encontrado",
          p: "A creatina teve o maior efeito sobre força muscular, a proteína sobre desempenho de resistência, e o ômega-3 sobre recuperação (SUCRA de 88,7% para recuperação). A avaliação de consistência da rede não encontrou divergência relevante entre as comparações diretas e indiretas em nenhum dos desfechos."
        },
        {
          h: "O que isso não responde",
          p: "Como é uma rede de meta-análise, boa parte das comparações entre os três suplementos é indireta (não vêm de ensaios que testaram os três ao mesmo tempo nas mesmas pessoas), o que é uma limitação inerente ao método. O estudo também não avalia o que acontece quando os três são combinados, nem diferencia populações por sexo, idade ou modalidade esportiva."
        },
        {
          h: "Na prática do consultório",
          p: "Use esta hierarquia por desfecho para orientar a prescrição: creatina como prioridade para ganho de força, proteína para desempenho de resistência, e ômega-3 quando o foco é recuperação pós-treino — mas comunique ao atleta que o ranqueamento vem de comparações majoritariamente indiretas entre os suplementos, não de testes cabeça a cabeça."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "dissonancia-cognitiva-alimentacao-intuitiva-ecr",
      categoria: "Comportamental",
      areas: ["Comportamental"],
      data: "01 set 2026",
      title: "Programa baseado em dissonância cognitiva aumenta alimentação intuitiva e imagem corporal positiva em mulheres brasileiras, com ganhos mantidos por até 48 semanas",
      resumo: "Ensaio clínico randomizado com 110 mulheres brasileiras de 18-35 anos comparou um programa baseado em dissonância cognitiva com um programa educacional e um grupo controle passivo: o grupo de dissonância cognitiva teve maior aumento de apreciação corporal, orientação corporal interna e motivação à saúde para exercício, além de redução da alimentação restritiva — com ganhos sustentados nos acompanhamentos de 24 e 48 semanas.",
      mudou: "Mostra que um programa estruturado de dissonância cognitiva pode superar tanto uma intervenção educacional quanto a ausência de intervenção para melhorar alimentação intuitiva e imagem corporal em mulheres jovens brasileiras, com efeito que se mantém por quase um ano — não é só um ganho de curto prazo.",
      aplicar: "Considere técnicas de dissonância cognitiva (questionar ativamente, em grupo, crenças e ideais de corpo irreais) como estratégia estruturada para trabalhar imagem corporal e alimentação intuitiva com pacientes mulheres jovens, além da educação nutricional tradicional — os ganhos aparecem já no curto prazo e se sustentam por até 48 semanas neste estudo.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/42259168/",
      fonte: {
        autores: "Resende e cols.",
        revista: "Body Image",
        ano: "2026",
        desenho: "Ensaio clínico randomizado controlado, de três braços (dissonância cognitiva, educacional, controle passivo)",
        amostra: "110 mulheres brasileiras, 18-35 anos",
        doi: "10.1016/j.bodyim.2026.102129",
        pubmed: "42259168",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Programas baseados em dissonância cognitiva — que levam a pessoa a questionar ativamente, em grupo, ideais de corpo magro e crenças sobre dieta — já mostraram resultado na prevenção de transtornos alimentares. Este ensaio testou se um programa desse tipo, desenvolvido para mulheres brasileiras, também melhora alimentação intuitiva, imagem corporal e motivação para exercício, comparado a um programa educacional e à ausência de intervenção."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio clínico randomizado controlado, de três braços, incluiu 110 mulheres brasileiras de 18 a 35 anos, distribuídas entre o programa de dissonância cognitiva, um programa educacional sobre alimentação e corpo, e um grupo controle passivo. Os desfechos — alimentação intuitiva, apreciação corporal, orientação corporal interna, motivação à saúde para exercício físico e alimentação restritiva/descontrolada/emocional — foram medidos antes, depois e em acompanhamentos de 24 e 48 semanas."
        },
        {
          h: "O que foi encontrado",
          p: "O grupo de dissonância cognitiva teve ganhos maiores que os outros dois grupos em apreciação corporal, orientação corporal interna e motivação à saúde para exercício físico, além de redução mais acentuada da alimentação restritiva logo após a intervenção. Nos acompanhamentos de 24 e 48 semanas, os ganhos se mantiveram em todos os desfechos, com queda sustentada também nos escores de alimentação restritiva, descontrolada e emocional."
        },
        {
          h: "O que isso não responde",
          p: "A amostra é formada só por mulheres jovens brasileiras, o que limita a generalização para homens, outras faixas etárias ou outros contextos culturais. O resumo disponível não detalha claramente as perdas de seguimento ao longo das 48 semanas, o que pode influenciar a robustez dos resultados de longo prazo."
        },
        {
          h: "Na prática do consultório",
          p: "Para pacientes mulheres jovens com dificuldade em sair de um padrão restritivo ou com imagem corporal negativa, considere incorporar elementos de dissonância cognitiva — discussão ativa e em grupo sobre ideais de corpo e crenças alimentares — ao trabalho de alimentação intuitiva já feito, já que este estudo mostra ganho mantido por quase um ano, superior a uma abordagem puramente educacional."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "probioticos-eixo-intestino-cerebro-lactentes",
      categoria: "Microbiota",
      areas: ["Materno Infantil", "Funcional"],
      data: "18 jun 2026",
      title: "Revisão sistemática mostra que pró, pré e simbióticos modulam a microbiota de lactentes, mas sem sinal claro de efeito no eixo intestino-cérebro",
      resumo: "Revisão sistemática de 6 ensaios clínicos randomizados (1.148 lactentes de 0 a 36 meses) avaliou intervenções com probióticos, prebióticos ou simbióticos voltadas ao eixo intestino-cérebro: houve modulação localizada da microbiota e da imunidade mucosa (como enriquecimento de Bifidobacterium e Lactobacillus), mas citocinas sistêmicas, calprotectina fecal, marcadores de permeabilidade, cortisol salivar basal e desfechos de neurodesenvolvimento permaneceram inalterados.",
      mudou: "Contraria a expectativa, cada vez mais difundida, de que modular a microbiota no início da vida já basta para influenciar o eixo intestino-cérebro e o neurodesenvolvimento — esta revisão mostra efeito local na microbiota e na mucosa, mas sem sinal de propagação para marcadores sistêmicos neuroimunes ou para desfechos de neurodesenvolvimento em lactentes saudáveis ou levemente sintomáticos.",
      aplicar: "Não prometa aos pais/cuidadores que um probiótico, prebiótico ou simbiótico vai 'ajudar o desenvolvimento cerebral' do lactente com base no eixo intestino-cérebro — a evidência atual mostra efeito sobre a microbiota local, mas não sobre marcadores neuroimunes sistêmicos ou neurodesenvolvimento nessa população.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/42330779/",
      fonte: {
        autores: "Carnazzo, Vitello e cols.",
        revista: "Journal of Neuroimmunology",
        ano: "2026",
        desenho: "Revisão sistemática de ensaios clínicos randomizados (sem meta-análise quantitativa agrupada)",
        amostra: "6 ECRs, 1.148 lactentes randomizados (0-36 meses); 923 com dados em ao menos um biomarcador do eixo intestino-cérebro",
        doi: "10.1016/j.jneuroim.2026.579005",
        pubmed: "42330779",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Intervenções com probióticos, prebióticos e simbióticos no início da vida são promovidas, cada vez mais, com a promessa de beneficiar o 'eixo intestino-cérebro' e o neurodesenvolvimento do lactente. Esta revisão buscou reunir a evidência de ensaios randomizados para checar se essa modulação da microbiota realmente se traduz em efeitos neuroimunes ou de neurodesenvolvimento mensuráveis."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão sistemática buscou em PubMed/MEDLINE, Scopus e Web of Science ensaios clínicos randomizados que testaram probióticos, prebióticos ou simbióticos em lactentes de 0 a 36 meses, com desfechos relacionados ao eixo intestino-cérebro — citocinas sistêmicas, calprotectina fecal, marcadores de permeabilidade intestinal, cortisol salivar basal e neurodesenvolvimento. Foram incluídos 6 ensaios elegíveis, com 1.148 participantes randomizados."
        },
        {
          h: "O que foi encontrado",
          p: "Os estudos mostraram modulação localizada da microbiota e da imunidade mucosa — como enriquecimento seletivo de Bifidobacterium e Lactobacillus e mudanças modestas no pH fecal e na IgA secretora. No entanto, citocinas sistêmicas, calprotectina fecal, marcadores de permeabilidade, cortisol salivar basal e desfechos de neurodesenvolvimento permaneceram inalterados entre os grupos."
        },
        {
          h: "O que isso não responde",
          p: "Apenas 6 ensaios foram elegíveis, uma base pequena e heterogênea (populações, tipos de intervenção e tempos de acompanhamento diferentes), sem meta-análise quantitativa agrupada. A revisão também avaliou majoritariamente lactentes saudáveis ou levemente sintomáticos — não respondeu se o efeito seria diferente em populações de maior risco (prematuridade, disbiose documentada, exposição a antibióticos)."
        },
        {
          h: "Na prática do consultório",
          p: "Ao orientar famílias sobre probióticos, prebióticos ou simbióticos para lactentes, não use 'benefício para o eixo intestino-cérebro' ou 'apoio ao neurodesenvolvimento' como justificativa — a evidência atual mostra modulação da microbiota local, mas nenhum sinal consistente de efeito em marcadores neuroimunes sistêmicos ou em desfechos de neurodesenvolvimento nessa faixa etária."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "multivitaminico-mineral-revisao-meta-analises",
      categoria: "Suplementação",
      areas: ["Clínica", "Funcional"],
      data: "25 nov 2025",
      title: "Revisão rápida de 19 meta-análises sobre multivitamínicos/minerais encontra benefício em cognição e pressão arterial, mas nenhum em mortalidade",
      resumo: "Revisão rápida reuniu 19 meta-análises (publicadas entre 2000 e 2025) sobre uso de suplementos multivitamínicos/minerais (MVM): em ensaios randomizados, houve melhora de cognição global, memória episódica e lembrança imediata em adultos idosos ou cognitivamente íntegros, redução de sintomas psicológicos em pessoas saudáveis e queda da pressão arterial sistólica em populações de risco — sem benefício para mortalidade por todas as causas, desfechos de covid-19, acuidade visual ou vários outros domínios cognitivos.",
      mudou: "Em vez de tratar multivitamínico/mineral como 'sem evidência' ou como panaceia, esta revisão rápida de 19 meta-análises mostra um padrão mais específico: benefício real em alguns desfechos (cognição, pressão arterial sistólica, sintomas psicológicos), mas nenhum ganho em mortalidade — o efeito depende claramente de qual desfecho, população e contexto de saúde se está olhando.",
      aplicar: "Ao conversar sobre suplementação multivitamínica/mineral com pacientes, seja específico sobre o que a evidência sustenta — possível benefício cognitivo em idosos e para pressão arterial sistólica em grupos de risco — e não deixe o paciente esperar impacto em mortalidade ou em saúde geral só com o MVM; a indicação deve seguir sendo individualizada pela necessidade nutricional real.",
      evidencia: 5,
      link: "https://pubmed.ncbi.nlm.nih.gov/41308839/",
      fonte: {
        autores: "Wang, Wazny, Mahadzir e Maier",
        revista: "Ageing Research Reviews",
        ano: "2026",
        desenho: "Revisão rápida (rapid review) de meta-análises de ensaios randomizados e estudos observacionais",
        amostra: "19 meta-análises elegíveis, publicadas entre 2000 e 2025",
        doi: "10.1016/j.arr.2025.102965",
        pubmed: "41308839",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Suplementos multivitamínicos/minerais (MVM) estão entre os mais vendidos no mundo, mas a literatura sobre seus efeitos é fragmentada em dezenas de meta-análises com desfechos muito diferentes. Esta revisão rápida buscou reunir essas meta-análises numa síntese única para mapear em quais desfechos, de fato, há evidência de benefício."
        },
        {
          h: "Como o estudo foi feito",
          p: "Revisão rápida (rapid review) buscou em MEDLINE e EMBASE meta-análises sobre uso de MVM publicadas entre 2000 e 2025, reunindo 19 meta-análises elegíveis que avaliaram desfechos de ensaios clínicos randomizados e de estudos observacionais, cobrindo cognição, pressão arterial, mortalidade, risco de câncer, doença cardíaca, covid-19, acuidade visual e outros."
        },
        {
          h: "O que foi encontrado",
          p: "Em ensaios randomizados, o uso de MVM se associou a melhora de cognição global, memória episódica e lembrança imediata em adultos idosos ou cognitivamente íntegros, a redução de sintomas psicológicos em pessoas saudáveis, e a queda da pressão arterial sistólica em populações de risco. Não houve benefício para mortalidade por todas as causas, desfechos de covid-19, acuidade visual ou vários outros domínios cognitivos. Nos estudos observacionais, os achados foram mistos, com associação para alguns tipos de câncer e doença cardíaca, mas não para câncer de mama, próstata, AVC ou mortalidade geral."
        },
        {
          h: "O que isso não responde",
          p: "A definição de 'MVM' variou muito entre as 19 meta-análises incluídas (composição, dose, população), o que dificulta uma recomendação única. Vale registrar que este estudo foi financiado pela Haleon, fabricante de suplementos, e pela National University of Singapore — uma fonte de financiamento que merece ser considerada ao interpretar conclusões favoráveis ao uso de MVM. Boa parte da evidência observacional também é sujeita a fatores de confusão (quem toma MVM pode ter outros hábitos de saúde diferentes)."
        },
        {
          h: "Na prática do consultório",
          p: "Use esta revisão para ser específico, não genérico, ao discutir multivitamínico/mineral com pacientes: existe sinal de benefício para cognição em idosos e para pressão arterial sistólica em grupos de risco, mas nenhum para mortalidade ou saúde geral — e, como o estudo tem financiamento de uma fabricante de suplementos, vale ler as conclusões com esse contexto em mente, sem deixar de considerar os achados em si."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "delish-dieta-mediterranea-perda-peso-ecr",
      categoria: "Obesidade",
      areas: ["Clínica", "Comportamental"],
      data: "20 ago 2026",
      title: "Ensaio DELISH: programa de perda de peso com padrão mediterrâneo adaptado não supera o programa de restrição calórica em peso, mas melhora mais a qualidade da dieta",
      resumo: "Ensaio clínico randomizado (DELISH) com 360 adultos com obesidade (IMC ≥30) na atenção primária da Carolina do Norte (EUA) comparou um programa de perda de peso baseado em padrão alimentar mediterrâneo adaptado culturalmente com um programa controle focado em restrição calórica: em 24 meses, a variação percentual de peso corporal foi semelhante entre os grupos (-3,40% vs. -3,51%; diferença não significativa), mas o grupo do padrão mediterrâneo teve melhora significativamente maior na qualidade geral da dieta.",
      mudou: "Mostra que adaptar culturalmente um padrão mediterrâneo para perda de peso não supera a restrição calórica tradicional em peso corporal no longo prazo (24 meses) — mas entrega, com peso semelhante, uma dieta de melhor qualidade geral, o que é um argumento a favor do padrão mediterrâneo que vai além da balança.",
      aplicar: "Ao escolher entre um programa de restrição calórica tradicional e um programa de padrão mediterrâneo adaptado para perda de peso, não decida só pela expectativa de perda de peso — que tende a ser semelhante no longo prazo — e considere o padrão mediterrâneo quando a prioridade adicional do paciente for melhorar a qualidade geral da alimentação, não apenas o número da balança.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/42623075/",
      fonte: {
        autores: "Keyserling, Wu, Ammerman e cols.",
        revista: "JAMA Network Open",
        ano: "2026",
        desenho: "Ensaio clínico randomizado (DELISH), seguimento de 24 meses",
        amostra: "360 adultos com obesidade (IMC ≥30), 18-75 anos, randomizados; 118 avaliados no desfecho de 24 meses",
        doi: "10.1001/jamanetworkopen.2026.29006",
        pubmed: "42623075",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Programas de perda de peso baseados no padrão mediterrâneo são promovidos como alternativa mais sustentável e culturalmente flexível à restrição calórica tradicional. O ensaio DELISH testou se um programa de padrão mediterrâneo adaptado culturalmente ao sudeste dos EUA produz mais perda de peso e melhor qualidade de dieta do que um programa controle focado apenas em redução calórica, em adultos com obesidade atendidos na atenção primária."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio clínico randomizado incluiu 360 adultos com obesidade (IMC ≥30), de 18 a 75 anos, recrutados em uma clínica acadêmica e seis clínicas comunitárias de atenção primária na Carolina do Norte central. Um grupo recebeu um programa comportamental de perda de peso baseado em padrão alimentar mediterrâneo adaptado culturalmente; o outro, um programa controle focado em restrição calórica. O desfecho primário foi avaliado em 24 meses de seguimento."
        },
        {
          h: "O que foi encontrado",
          p: "Em 24 meses, a variação percentual média ajustada do peso corporal foi de -3,40% no grupo do padrão mediterrâneo e -3,51% no grupo controle — uma diferença de -0,11 pontos percentuais, sem significância estatística (IC95% -1,79 a 1,57; p=0,90). O grupo do padrão mediterrâneo teve melhora significativamente maior na qualidade geral da dieta, mesmo com perda de peso semelhante ao grupo controle."
        },
        {
          h: "O que isso não responde",
          p: "Dos 360 participantes randomizados, apenas 118 tiveram o desfecho avaliado em 24 meses — uma perda de seguimento relevante ao longo dos dois anos de estudo, que pode limitar a generalização dos achados. A elegibilidade também dependeu de triagem e indicação de médicos de atenção primária, o que pode introduzir viés de seleção."
        },
        {
          h: "Na prática do consultório",
          p: "Ao propor um programa de padrão mediterrâneo adaptado para perda de peso em pacientes com obesidade, não prometa perda de peso maior do que a de um programa de restrição calórica tradicional — neste ensaio, os resultados de peso foram equivalentes. Use, em vez disso, o argumento da qualidade da dieta: o padrão mediterrâneo entregou uma alimentação de melhor qualidade geral com perda de peso semelhante, o que pode ser um critério de escolha relevante para o paciente."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "bep-fortificado-gestacao-bangladesh-ecr",
      categoria: "Materno Infantil",
      areas: ["Saúde da Mulher", "Pediatria"],
      data: "01 jun 2026",
      title: "Ensaio com 3.390 gestantes em Bangladesh: suplemento de energia-proteína balanceada fortificado não reduz restrição de crescimento fetal frente ao suplemento padrão de micronutrientes",
      resumo: "Ensaio de efetividade com randomização por cluster, em área rural de Bangladesh com alta prevalência de desnutrição materna, comparou suplementação antenatal com energia-proteína balanceada (BEP) fortificada — direcionada ou não por risco nutricional — com o suplemento padrão de múltiplos micronutrientes (MMS) em 3.390 gestantes: nem o BEP não direcionado nem o BEP direcionado diferiram do MMS isolado nos desfechos primários (peso ao nascer, baixo peso ao nascer, pequeno para a idade gestacional).",
      mudou: "Questiona a expectativa de que fortificar e intensificar a suplementação antenatal com energia e proteína (além dos micronutrientes já padrão) traga, por si só, redução adicional de restrição de crescimento fetal em contextos de alta desnutrição materna — pelo menos nesta população e neste desenho de suplemento, o ganho extra não apareceu frente ao MMS isolado.",
      aplicar: "Não assuma automaticamente que adicionar suplementação de energia-proteína balanceada ao suplemento padrão de micronutrientes antenatal vai reduzir baixo peso ao nascer ou pequeno-para-idade-gestacional — segundo este ensaio, em população com alta desnutrição materna, isso não se confirmou; mantenha o suplemento padrão de micronutrientes como base e avalie a necessidade de energia/proteína extra caso a caso, não como protocolo padrão.",
      evidencia: 4,
      link: "https://pubmed.ncbi.nlm.nih.gov/42349909/",
      fonte: {
        autores: "Christian e cols.",
        revista: "BMJ Global Health",
        ano: "2026",
        desenho: "Ensaio de efetividade com randomização por cluster, 4 braços",
        amostra: "3.390 gestantes recrutadas; 2.950 mulheres com 2.976 nascidos vivos, 2.674 bebês medidos até 72h de vida, em Bangladesh rural",
        doi: "10.1136/bmjgh-2026-023766",
        pubmed: "42349909",
        acesso: "Acesso aberto (texto completo livre)"
      },
      leitura: [
        {
          h: "A pergunta do estudo",
          p: "Em contextos de alta prevalência de desnutrição materna, suplementos antenatais de energia-proteína balanceada (BEP) são propostos como complemento à suplementação padrão de múltiplos micronutrientes (MMS), na expectativa de reduzir restrição de crescimento fetal e baixo peso ao nascer. Este ensaio testou se um BEP fortificado — oferecido a todas as gestantes ou direcionado por risco nutricional — reduz esses desfechos frente ao MMS isolado."
        },
        {
          h: "Como o estudo foi feito",
          p: "Ensaio de efetividade com randomização por cluster (por setor), em área rural de Bangladesh, teve 4 braços: MMS isolado (controle), BEP fortificado oferecido a todas as gestantes, BEP direcionado por IMC pré-gestacional baixo, e BEP direcionado por IMC baixo combinado a ganho de peso gestacional inadequado. Foram recrutadas 3.390 gestantes, com 2.950 mulheres e 2.976 nascidos vivos incluídos na análise, e 2.674 bebês com medidas antropométricas colhidas até 72 horas de vida."
        },
        {
          h: "O que foi encontrado",
          p: "No grupo controle (MMS isolado), o peso médio ao nascer foi 2.763 g, com 41,4% dos bebês pequenos para a idade gestacional e 23,4% com baixo peso ao nascer — refletindo a alta carga de desnutrição da população estudada. Nem o BEP não direcionado nem o BEP direcionado (isoladamente ou combinado a ganho de peso gestacional inadequado) diferiram do MMS isolado nos desfechos primários (peso ao nascer, baixo peso ao nascer, pequeno para idade gestacional) nem nos secundários. Houve sinais exploratórios de subgrupo — como possível maior benefício em mulheres com anemia —, mas os próprios autores tratam esses achados como hipótese-geradores, não confirmatórios."
        },
        {
          h: "O que isso não responde",
          p: "Os achados de subgrupo (por exemplo, em mulheres com anemia) são exploratórios e não devem ser lidos como confirmação de benefício nesses subgrupos — os próprios autores pedem cautela. O estudo também é específico de uma população rural de Bangladesh com perfil nutricional particular, o que limita a extrapolação direta para outros contextos de desnutrição materna."
        },
        {
          h: "Na prática do consultório",
          p: "Em contextos de alta desnutrição materna, mantenha a suplementação padrão de múltiplos micronutrientes como base do cuidado antenatal, e não assuma que adicionar um suplemento fortificado de energia-proteína vai, por si só, reduzir baixo peso ao nascer ou restrição de crescimento fetal — segundo este ensaio de grande porte, esse ganho extra não se confirmou. A decisão de complementar com energia/proteína extra deve seguir sendo individualizada, não um protocolo padrão para toda gestante desnutrida."
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "angulo-fase-sobrevida-hemodialise",
      categoria: "Clínica",
      areas: ["Renal", "Clínica"],
      data: "01 mai 2026",
      title: "Ângulo de fase por bioimpedância prediz sobrevida em 5 anos de pacientes em hemodiálise, com ponto de corte de 4°",
      resumo: "Estudo observacional retrospectivo com 140 pacientes em hemodiálise avaliou o ângulo de fase (marcador de bioimpedância elétrica ligado ao estado nutricional e à integridade celular) como preditor de sobrevida em 5 anos: pacientes sobreviventes tiveram ângulo de fase médio maior (4,55° vs. 3,97°), com ponto de corte ideal de 4° (AUC 0,686) separando melhor e piores prognósticos; a sobrevida global em 1, 3 e 5 anos foi de 88%, 66% e 57%.",
      mudou: "Reforça o ângulo de fase como ferramenta prática e de baixo custo (obtida por bioimpedância) para estratificar risco nutricional e prognóstico em hemodiálise, com um ponto de corte específico (4°) que pode orientar decisões clínicas — mas o poder discriminativo (AUC de 0,686) é apenas moderado, não altíssimo.",
      aplicar: "Incorpore a medida do ângulo de fase por bioimpedância na avaliação nutricional de rotina de pacientes em hemodiálise, usando o ponto de corte de 4° como um sinal de alerta adicional para maior risco de mortalidade em 5 anos — mas use-o como mais uma peça do quadro nutricional, não como teste isolado e definitivo, já que seu poder discriminativo é moderado.",
      evidencia: 3,
      link: "https://pubmed.ncbi.nlm.nih.gov/42269447/",
      fonte: {
        autores: "Ruperto, Giorgi, Quiroga, Sánchez-Horrillo e Bajo",
        revista: "Nutrition",
        ano: "2026",
        desenho: "Estudo observacional retrospectivo, com análise de sobrevida (Kaplan-Meier e regressão de Cox)",
        amostra: "140 pacientes em hemodiálise, idade mediana de 74 anos, 46,5% homens",
        doi: "10.1016/j.nut.2026.113271",
        pubmed: "42269447",
        acesso: "Resumo livre; texto completo por assinatura"
      },
      leitura: [
        {
          h: "Por que este estudo importa",
          p: "O ângulo de fase, obtido por bioimpedância elétrica, é um marcador de integridade de membrana celular e estado nutricional/muscular cada vez mais usado em nefrologia. Este estudo testou formalmente sua capacidade de prever sobrevida em 5 anos em pacientes em hemodiálise, buscando um ponto de corte prático para uso clínico."
        },
        {
          h: "Como o estudo foi feito",
          p: "Estudo observacional retrospectivo incluiu 140 pacientes em hemodiálise (idade mediana de 74 anos, 46,5% homens), com medida do ângulo de fase e do ângulo de fase padronizado por bioimpedância, seguidos para avaliação de sobrevida em 1, 3 e 5 anos por curvas de Kaplan-Meier e regressão de Cox."
        },
        {
          h: "O que foi encontrado",
          p: "O ângulo de fase médio foi maior entre os sobreviventes (4,55° ± 0,93) do que entre os não sobreviventes (3,97° ± 0,99). O ponto de corte ideal identificado foi de 4°, com área sob a curva (AUC) de 0,686; para o ângulo de fase padronizado, o corte foi de -1,89, com AUC de 0,654. A sobrevida global foi de 88% em 1 ano, 66% em 3 anos e 57% em 5 anos."
        },
        {
          h: "O que isso não responde",
          p: "A amostra é pequena (140 pacientes) e de um único centro, o que limita a generalização do ponto de corte encontrado. As áreas sob a curva (0,654-0,686) indicam poder discriminativo apenas moderado — o ângulo de fase ajuda a estratificar risco, mas não é, isoladamente, um preditor forte de sobrevida. Por ser observacional, o estudo também não testa se intervir sobre o estado nutricional (e, consequentemente, sobre o ângulo de fase) muda a sobrevida."
        },
        {
          h: "Na prática do consultório",
          p: "Use o ângulo de fase por bioimpedância como mais um dado na avaliação nutricional de pacientes em hemodiálise — um valor abaixo de 4° pode servir de alerta adicional para maior risco de mortalidade em 5 anos — mas combine sempre com outros marcadores nutricionais e clínicos, já que seu poder discriminativo isolado é moderado, não altíssimo."
        }
      ]
    }
  ]
};

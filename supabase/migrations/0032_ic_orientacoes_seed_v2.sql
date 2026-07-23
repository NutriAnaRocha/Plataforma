-- ============================================================
--  Plataforma Nutri — Migração 0032
--  Biblioteca de Orientações — EXPANSÃO E ENRIQUECIMENTO (v2).
--
--  1) Enriquece as orientações-base já existentes (mais blocos/itens,
--     mantendo o mesmo slug — o upsert atualiza).
--  2) Adiciona novas orientações-base (condições metabólicas, gestação,
--     esporte e hábitos do dia a dia).
--
--  Mesmo contrato do 0026: nutricionista_id = NULL (base curada), texto
--  autoral voltado ao paciente, referência institucional citável (sem
--  DOI/título inventado). Reexecutável: on conflict do slug base, atualiza.
-- ============================================================

insert into public.ic_orientacoes
  (nutricionista_id, nome, slug, sinonimos, categoria, eixo, grupo, resumo, blocos, dica_pratica, referencias, atencao)
values

-- ============================================================
--  CONDIÇÕES — enriquecidas
-- ============================================================
(null, 'Ansiedade', 'ansiedade', '{ansiedade,nervosismo,estresse,agitacao}', 'condicao', 'Saúde mental', 'Comportamento',
 'Alimentação e rotina que ajudam a regular o estado de ansiedade.',
 '[{"titulo":"No prato","itens":["Mantenha refeições em horários regulares — ficar muitas horas sem comer favorece oscilação de humor e irritabilidade.","Combine fontes de triptofano (ovos, banana, aveia, castanhas) com carboidrato integral, que ajuda o corpo a usá-lo.","Inclua magnésio (folhas verdes-escuras, sementes, leguminosas) e ômega-3 (sardinha, linhaça, chia)."]},{"titulo":"Cafeína e álcool","itens":["Reduza café, energéticos e chá preto no fim do dia — a cafeína pode intensificar a sensação de agitação e atrapalhar o sono.","Evite usar álcool para relaxar: ele piora o sono e o humor no dia seguinte."]},{"titulo":"Rotina","itens":["Atividade física regular tem efeito consistente sobre a ansiedade.","Cuide do sono e reduza telas à noite.","Respiração lenta antes das refeições ajuda a comer com mais atenção."]},{"titulo":"Um dia possível","itens":["Café da manhã: aveia com banana e pasta de amendoim.","Lanche: iogurte natural com castanhas.","Jantar leve e cedo, evitando cafeína depois das 16h."]}]'::jsonb,
 'Um lanche da tarde com banana, aveia e castanhas reúne triptofano, magnésio e carboidrato — combinação que favorece o bem-estar no fim do dia.',
 '[{"fonte":"World Health Organization","ano":2022,"detalhe":"Estilo de vida e saúde mental"}]'::jsonb,
 'Orientação alimentar é complementar. Sintomas intensos ou persistentes exigem acompanhamento médico/psicológico.'),

(null, 'Humor deprimido', 'depressao', '{depressao,humor,tristeza,desanimo}', 'condicao', 'Saúde mental', 'Comportamento',
 'Suporte alimentar para o humor, associado ao tratamento de saúde.',
 '[{"titulo":"Padrão alimentar","itens":["Aproxime-se de um padrão mediterrâneo: verduras, legumes, frutas, leguminosas, azeite, peixes e grãos integrais.","Reduza ultraprocessados, frituras e excesso de açúcar — associados a pior humor a longo prazo.","Não pule refeições; a fome intensa piora irritabilidade e vontade de doce."]},{"titulo":"Nutrientes de atenção","itens":["Ômega-3 (peixes gordos, linhaça, chia).","Vitaminas do complexo B e folato (leguminosas, folhas verdes, ovos).","Vitamina D e ferro merecem checagem quando há cansaço persistente."]},{"titulo":"Facilitando nos dias difíceis","itens":["Deixe opções semiprontas e saudáveis à mão (fruta lavada, castanhas, iogurte).","Refeições simples valem mais que receita elaborada que não sai do papel.","Exposição ao sol pela manhã e uma caminhada curta ajudam humor e apetite."]}]'::jsonb,
 'Deixe frutas e castanhas visíveis e à mão nos dias de menos disposição — reduz a chance de recorrer a ultraprocessados.',
 '[{"fonte":"World Health Organization","ano":2022,"detalhe":"Dieta e saúde mental"}]'::jsonb,
 'Não substitui tratamento. Ideação de morte, piora rápida ou perda de funcionalidade: encaminhar com prioridade.'),

(null, 'Síndrome do intestino irritável', 'sii', '{sii,intestino,irritavel,colon,gases,distensao}', 'condicao', 'Saúde intestinal', 'Funcional',
 'Estratégias para reduzir gases, distensão e desconforto intestinal.',
 '[{"titulo":"Como comer","itens":["Faça refeições menores e mais frequentes, sem pressa e mastigando bem.","Observe e anote os alimentos que pioram seus sintomas — cada pessoa tem gatilhos diferentes.","Cafeína, álcool, frituras e refrigerantes costumam intensificar o desconforto."]},{"titulo":"Fibras e FODMAPs","itens":["Prefira fibras solúveis (aveia, cenoura cozida, banana) a grandes volumes de fibra insolúvel de uma vez.","Uma redução temporária de FODMAPs pode ajudar, mas deve ser guiada e por tempo limitado — não é para a vida toda.","Hidrate-se bem ao longo do dia."]},{"titulo":"Rotina e estresse","itens":["O intestino responde ao estresse — sono e pausas ajudam tanto quanto a comida.","Atividade física leve e regular melhora o trânsito e a distensão.","Coma em ambiente calmo, sem resolver pendências à mesa."]}]'::jsonb,
 'Um diário simples de alimentos e sintomas por 2 semanas costuma revelar os gatilhos com mais clareza do que cortar tudo de uma vez.',
 '[{"fonte":"American College of Gastroenterology","ano":2021,"detalhe":"Diretriz de manejo da SII"},{"fonte":"Monash University","ano":2023,"detalhe":"Programa FODMAP"}]'::jsonb,
 'Perda de peso, sangramento, anemia, febre ou sintomas noturnos não são da SII — investigar com médico.'),

(null, 'Gastrite e refluxo', 'gastrite-refluxo', '{gastrite,refluxo,azia,queimacao,estomago}', 'condicao', 'Saúde intestinal', 'Funcional',
 'Hábitos que reduzem azia, queimação e desconforto no estômago.',
 '[{"titulo":"Rotina das refeições","itens":["Coma em porções menores e evite deitar nas 2–3 horas após comer.","Não fique longos períodos em jejum — o estômago vazio também incomoda.","Mastigue devagar e evite líquidos em grande volume durante a refeição."]},{"titulo":"O que costuma piorar","itens":["Frituras, alimentos muito gordurosos, café, álcool, refrigerante, excesso de pimenta e cítricos em jejum.","Cigarro piora o refluxo.","Se há sobrepeso, a perda de peso reduz bastante os sintomas."]},{"titulo":"À noite","itens":["Jante mais cedo e leve, evitando gordura à noite.","Eleve a cabeceira da cama (não só travesseiros) se o refluxo é noturno.","Roupas muito apertadas na cintura pioram a pressão sobre o estômago."]}]'::jsonb,
 'Elevar a cabeceira da cama e jantar mais cedo e leve costuma reduzir o refluxo noturno sem precisar de nada além.',
 '[{"fonte":"American College of Gastroenterology","ano":2022,"detalhe":"Diretrizes de DRGE e dispepsia"}]'::jsonb,
 'Dor intensa, vômito com sangue, fezes escuras ou emagrecimento: procurar atendimento. H. pylori é conduta médica.'),

(null, 'TPM (tensão pré-menstrual)', 'tpm', '{tpm,pre,menstrual,colica,inchaco,irritabilidade}', 'condicao', 'Saúde da mulher', 'Ciclo',
 'Ajustes na semana pré-menstrual para inchaço, cólica e humor.',
 '[{"titulo":"Na semana que antecede","itens":["Reduza sal e ultraprocessados para diminuir a retenção e o inchaço.","Fracione as refeições para estabilizar a energia e a vontade de doce.","Capriche em magnésio (folhas, sementes, cacau, leguminosas) e cálcio (laticínios, gergelim, folhas)."]},{"titulo":"Bem-estar","itens":["Mantenha atividade física leve a moderada — ajuda humor e cólica.","Cuide do sono e da hidratação.","Modere cafeína se ela piora a irritabilidade e o sono."]},{"titulo":"Vontade de doce","itens":["Prefira fruta com castanha ou um quadrado de chocolate amargo a esconder e depois exagerar.","Comer de 3 em 3 horas reduz a fissura do fim da tarde.","Água e chá sem cafeína ajudam a segurar o beliscar automático."]}]'::jsonb,
 'Um quadradinho de chocolate 70% ajuda a matar a vontade e ainda oferece magnésio — melhor do que segurar até a compulsão.',
 '[{"fonte":"ACOG (American College of Obstetricians and Gynecologists)","ano":2023,"detalhe":"Manejo da síndrome pré-menstrual"}]'::jsonb,
 'Sintomas incapacitantes (TDPM) merecem avaliação ginecológica.'),

(null, 'Menopausa', 'menopausa', '{menopausa,climaterio,fogacho,calor}', 'condicao', 'Saúde da mulher', 'Ciclo',
 'Alimentação para o período do climatério: osso, coração e peso.',
 '[{"titulo":"Prioridades","itens":["Proteína em todas as refeições ajuda a preservar massa muscular, que tende a cair nessa fase.","Cálcio e vitamina D para a saúde óssea (laticínios, folhas verdes, gergelim, sol com orientação).","Fibras, frutas, legumes e grãos integrais para intestino, saciedade e coração."]},{"titulo":"Peso e sintomas","itens":["A gordura tende a se concentrar no abdômen — força muscular e passos diários fazem diferença.","Cafeína, álcool e refeições muito quentes/picantes podem intensificar os fogachos em algumas mulheres.","Cuide do sono: ele impacta apetite e humor."]},{"titulo":"Coração em foco","itens":["O risco cardiovascular sobe nessa fase — azeite, peixes, oleaginosas e menos ultraprocessado protegem.","Reduza sal e alimentos industrializados para ajudar a pressão.","Fibra solúvel (aveia, leguminosas) ajuda o colesterol."]}]'::jsonb,
 'Treino de força 2–3x por semana é um dos melhores investimentos dessa fase — protege osso, músculo e metabolismo.',
 '[{"fonte":"The North American Menopause Society","ano":2022,"detalhe":"Nutrição e estilo de vida no climatério"}]'::jsonb,
 'Reposição hormonal e sintomas intensos são conduta médica.'),

(null, 'Emagrecimento — hábitos', 'emagrecimento-habitos', '{emagrecer,peso,habitos,dieta}', 'condicao', 'Comportamento', 'Peso',
 'Comportamentos que sustentam o emagrecimento no dia a dia.',
 '[{"titulo":"Estrutura do dia","itens":["Faça refeições com proteína e fibra — saciam mais e por mais tempo.","Coma com atenção, sem tela, devagar; o cérebro leva cerca de 20 minutos para registrar a saciedade.","Planeje lanches; a fome sem plano é o que costuma sair do trilho."]},{"titulo":"Ambiente","itens":["Deixe o saudável visível e o menos saudável fora de vista.","Beba água ao longo do dia; às vezes sede é confundida com fome.","Priorize sono: dormir mal aumenta a fome e a vontade de doce no dia seguinte."]},{"titulo":"O que sustenta a longo prazo","itens":["Mudanças pequenas e mantidas superam dietas radicais que não duram.","Movimento diário (passos, escada, força) protege o resultado.","Um deslize não é recaída — retome a próxima refeição sem compensar pulando."]}]'::jsonb,
 'Monte o prato pela ordem: primeiro salada/legumes, depois proteína, por último o carboidrato. Ajuda a comer o suficiente sem contar caloria o tempo todo.',
 '[{"fonte":"World Health Organization","ano":2020,"detalhe":"Recomendações de dieta saudável e peso"}]'::jsonb,
 'Emagrecimento muito rápido, uso de compostos sem prescrição ou relação sofrida com a comida: reavaliar a conduta.'),

(null, 'Compulsão alimentar', 'compulsao', '{compulsao,binge,descontrole,fome,emocional}', 'condicao', 'Comportamento', 'Peso',
 'Reduzir episódios de comer em excesso e sem controle.',
 '[{"titulo":"Prevenção","itens":["Não pule refeições nem faça restrição severa — a fome extrema é gatilho clássico de compulsão.","Coma de 3 em 3 horas mais ou menos, com proteína e fibra.","Evite ter em casa, em grande quantidade, o alimento que costuma disparar o episódio."]},{"titulo":"No momento da vontade","itens":["Antes de comer no automático, pare e pergunte: é fome física ou emocional?","Adie 10 minutos e beba água; muitas vezes a onda passa.","Se comeu além do planejado, retome a próxima refeição normalmente — sem punição ou pular refeição depois."]},{"titulo":"Cuidar do gatilho","itens":["Sono ruim, estresse e tédio disparam mais que a fome real — observe o padrão.","Ter um plano B para a noite (chá, banho, alongamento) ajuda a não descontar na comida.","Falar sobre os episódios com um profissional reduz a vergonha e o ciclo."]}]'::jsonb,
 'Culpa e restrição depois de um episódio tendem a alimentar o ciclo. Acolher e retomar a rotina quebra o ciclo melhor do que compensar.',
 '[{"fonte":"National Institute for Health and Care Excellence (NICE)","ano":2020,"detalhe":"Transtornos alimentares — orientações"}]'::jsonb,
 'Episódios frequentes, purgação ou grande sofrimento: encaminhar para equipe (psicologia/psiquiatria).'),

(null, 'Constipação intestinal', 'constipacao', '{constipacao,intestino,preso,prisao,ventre}', 'condicao', 'Saúde intestinal', 'Funcional',
 'Hábitos para regularizar o funcionamento do intestino.',
 '[{"titulo":"Os três pilares","itens":["Fibras: frutas com casca/bagaço, legumes, folhas, leguminosas e grãos integrais ao longo do dia.","Água: aumentar a fibra sem beber água pode piorar — os dois andam juntos.","Movimento: caminhar e atividade física estimulam o intestino."]},{"titulo":"Rotina","itens":["Respeite o horário do intestino, geralmente após uma refeição; não segure a vontade.","Frutas como mamão, ameixa e kiwi ajudam muitas pessoas.","Aumente as fibras aos poucos para evitar gases."]},{"titulo":"Reforços simples","itens":["Um copo de água morna em jejum pode estimular o reflexo intestinal.","Apoiar os pés num banquinho no vaso favorece a evacuação.","Sementes de chia/linhaça hidratadas somam fibra e água ao mesmo tempo."]}]'::jsonb,
 '1–2 colheres de sopa de sementes (chia ou linhaça) hidratadas, mais água ao longo do dia, é um começo simples e eficaz.',
 '[{"fonte":"World Gastroenterology Organisation","ano":2022,"detalhe":"Constipação — diretriz global"}]'::jsonb,
 'Mudança súbita do hábito intestinal, sangue nas fezes ou emagrecimento: investigar com médico.'),

(null, 'Insônia e higiene do sono', 'insonia', '{insonia,sono,dormir,acordar}', 'condicao', 'Saúde mental', 'Sono',
 'Alimentação e rotina que favorecem um sono melhor.',
 '[{"titulo":"À noite","itens":["Evite cafeína (café, chá preto/verde, energético, chocolate amargo) a partir do meio da tarde.","Jante mais cedo e leve; refeições pesadas ou muito gordurosas atrapalham o sono.","Modere líquidos perto de dormir para reduzir despertares."]},{"titulo":"Rotina","itens":["Horários regulares de dormir e acordar, inclusive no fim de semana.","Reduza telas e luz forte na última hora antes de deitar.","Um lanche leve com triptofano (leite, banana, aveia) pode ajudar quem sente fome à noite."]},{"titulo":"Durante o dia","itens":["Luz natural pela manhã ajuda a acertar o relógio biológico.","Atividade física regular melhora o sono — evite treino muito intenso perto de dormir.","Cochilos longos no fim da tarde atrapalham a noite."]}]'::jsonb,
 'Álcool dá sono no início, mas fragmenta o sono na segunda metade da noite — não é bom indutor.',
 '[{"fonte":"American Academy of Sleep Medicine","ano":2021,"detalhe":"Higiene do sono"}]'::jsonb,
 'Insônia persistente, ronco com pausas ou sonolência diurna importante: avaliação médica.'),

-- ============================================================
--  CONDIÇÕES — novas
-- ============================================================
(null, 'Pré-diabetes e resistência à insulina', 'pre-diabetes', '{prediabetes,pre,diabetes,glicemia,insulina,resistencia,glicose}', 'condicao', 'Cardiometabólico', 'Glicemia',
 'Alimentação e hábitos para melhorar a glicemia e a sensibilidade à insulina.',
 '[{"titulo":"No prato","itens":["Priorize alimentos de verdade: verduras, legumes, leguminosas, frutas inteiras, proteína e grãos integrais.","Troque carboidratos refinados (pão branco, açúcar, farinha) por versões integrais e menores porções.","Sempre combine o carboidrato com proteína, fibra e/ou gordura boa — isso suaviza a subida da glicose."]},{"titulo":"Bebidas e doces","itens":["Reduza refrigerante, suco e bebidas açucaradas — sobem a glicose rápido e enganam a saciedade.","Prefira a fruta inteira ao suco, mesmo natural.","Água, café e chá sem açúcar são os melhores acompanhamentos."]},{"titulo":"Movimento e peso","itens":["Caminhar após as refeições ajuda a controlar a glicose do momento.","Treino de força melhora a sensibilidade à insulina de forma consistente.","Perder de 5 a 10% do peso, quando há excesso, já traz ganho importante."]}]'::jsonb,
 'Uma caminhada de 10–15 minutos logo depois do almoço é uma das formas mais simples de reduzir o pico de glicose da refeição.',
 '[{"fonte":"American Diabetes Association","ano":2023,"detalhe":"Padrões de cuidado — prevenção do diabetes"},{"fonte":"Sociedade Brasileira de Diabetes","ano":2023,"detalhe":"Diretriz de pré-diabetes"}]'::jsonb,
 'Acompanhamento médico e exames de glicemia/HbA1c são necessários. Uso de medicação é conduta médica.'),

(null, 'Colesterol e triglicerídeos altos', 'colesterol', '{colesterol,ldl,hdl,triglicerides,triglicerideos,dislipidemia,gordura}', 'condicao', 'Cardiometabólico', 'Lipídios',
 'Ajustes alimentares para melhorar o perfil de gorduras do sangue.',
 '[{"titulo":"Trocar gorduras","itens":["Reduza frituras, embutidos, gordura visível das carnes e ultraprocessados.","Use azeite, abacate, castanhas e sementes como fontes de gordura boa.","Prefira peixes (sardinha, atum, salmão) algumas vezes por semana."]},{"titulo":"Fibra que ajuda","itens":["Fibra solúvel (aveia, leguminosas, maçã, cenoura) ajuda a reduzir o LDL.","Aumente vegetais e frutas inteiras ao longo do dia.","Grãos integrais no lugar dos refinados."]},{"titulo":"Triglicerídeos em foco","itens":["Reduza açúcar, doces, farinha branca e álcool — eles elevam bastante os triglicerídeos.","Bebidas açucaradas têm efeito direto; troque por água.","Atividade física regular melhora triglicerídeos e HDL."]}]'::jsonb,
 'Meia xícara de aveia no café da manhã, junto com menos açúcar e álcool, costuma render melhora visível já no próximo exame.',
 '[{"fonte":"Sociedade Brasileira de Cardiologia","ano":2017,"detalhe":"Diretriz de dislipidemias"},{"fonte":"American Heart Association","ano":2021,"detalhe":"Dieta e saúde cardiovascular"}]'::jsonb,
 'A indicação de medicação (estatinas, etc.) é do médico. Colesterol muito alto pode ter causa genética — investigar.'),

(null, 'Pressão alta (hipertensão)', 'hipertensao', '{hipertensao,pressao,alta,sal,sodio}', 'condicao', 'Cardiometabólico', 'Pressão',
 'Alimentação que ajuda a controlar a pressão arterial.',
 '[{"titulo":"Sódio é o principal","itens":["Reduza sal de adição e, principalmente, os ultraprocessados (embutidos, temperos prontos, salgadinhos, enlatados) — são a maior fonte de sódio.","Tempere com alho, cebola, ervas, limão e especiarias no lugar de caldos e temperos industrializados.","Leia o rótulo: quanto menos sódio por porção, melhor."]},{"titulo":"Padrão que protege","itens":["O padrão DASH funciona: frutas, verduras, legumes, leguminosas, laticínios magros e grãos integrais.","Potássio (frutas, folhas, feijão, banana) ajuda a contrabalancear o sódio.","Menos frituras e gordura de má qualidade."]},{"titulo":"Estilo de vida","itens":["Atividade física regular reduz a pressão.","Modere o álcool e evite o cigarro.","Se há excesso de peso, emagrecer ajuda diretamente."]}]'::jsonb,
 'Provar a comida antes de sair salgando e deixar o saleiro fora da mesa já reduz bastante o sódio do dia.',
 '[{"fonte":"Sociedade Brasileira de Cardiologia","ano":2020,"detalhe":"Diretriz de hipertensão arterial"},{"fonte":"National Heart, Lung, and Blood Institute","ano":2021,"detalhe":"Plano alimentar DASH"}]'::jsonb,
 'A pressão deve ser acompanhada pelo médico. Não suspenda medicação por conta própria.'),

(null, 'Alimentação na gestação', 'gestacao', '{gestacao,gravidez,gestante,gravida,pre-natal}', 'condicao', 'Saúde da mulher', 'Gestação',
 'O que priorizar e o que evitar para uma gestação saudável.',
 '[{"titulo":"Priorizar","itens":["Variedade: frutas, verduras, legumes, leguminosas, proteínas e grãos integrais em todas as refeições.","Ferro (carnes, leguminosas, folhas verdes) com vitamina C para melhorar a absorção.","Cálcio (laticínios, gergelim, folhas) e boa hidratação ao longo do dia."]},{"titulo":"Evitar por segurança","itens":["Carnes, ovos e peixes crus ou malpassados; leite e queijos não pasteurizados.","Peixes com muito mercúrio (tubarão, peixe-espada) e excesso de atum.","Álcool: não há quantidade segura na gestação. Modere a cafeína."]},{"titulo":"Desconfortos comuns","itens":["Enjoo: refeições menores e mais frequentes, evitando ficar de estômago vazio.","Azia: comer devagar, evitar deitar após comer e reduzir frituras.","Constipação: capriche em fibras, água e movimento."]}]'::jsonb,
 'Higienizar bem folhas e frutas cruas e evitar alimentos crus de origem animal previne infecções que importam mais na gestação.',
 '[{"fonte":"FEBRASGO","ano":2021,"detalhe":"Nutrição na gestação"},{"fonte":"World Health Organization","ano":2016,"detalhe":"Recomendações de pré-natal"}]'::jsonb,
 'Suplementação (ácido fólico, ferro, etc.) e o acompanhamento são do pré-natal médico. Individualize sempre.'),

(null, 'SOP (ovários policísticos)', 'sop', '{sop,ovarios,policisticos,insulina,irregular,hormonal}', 'condicao', 'Saúde da mulher', 'Ciclo',
 'Alimentação e hábitos que ajudam no manejo da SOP.',
 '[{"titulo":"Glicemia e insulina","itens":["Priorize carboidratos integrais e sempre combinados com proteína, fibra e gordura boa.","Reduza açúcar, doces e ultraprocessados, que pioram a resistência à insulina.","Distribua os carboidratos ao longo do dia em vez de concentrar de uma vez."]},{"titulo":"Prato de base","itens":["Vegetais, leguminosas, proteínas magras, peixes e gorduras boas (azeite, castanhas).","Fibra em todas as refeições para saciedade e glicemia mais estável.","Padrão mais próximo do mediterrâneo tende a ajudar."]},{"titulo":"Movimento e peso","itens":["Treino de força e atividade regular melhoram a sensibilidade à insulina.","Quando há excesso de peso, uma redução modesta já melhora ciclo e sintomas.","Sono e manejo do estresse também influenciam o quadro."]}]'::jsonb,
 'O foco não é dieta radical, e sim estabilizar a glicemia: carboidrato integral + proteína + fibra em cada refeição.',
 '[{"fonte":"FEBRASGO","ano":2020,"detalhe":"Síndrome dos ovários policísticos"},{"fonte":"International PCOS Network","ano":2023,"detalhe":"Diretriz internacional de SOP"}]'::jsonb,
 'Diagnóstico e tratamento (incluindo medicação) são médicos. Individualizar conforme sintomas e exames.'),

(null, 'Anemia por falta de ferro', 'anemia-ferro', '{anemia,ferro,ferropriva,cansaco,palidez}', 'condicao', 'Nutrientes', 'Ferro',
 'Como melhorar a ingestão e a absorção de ferro pela alimentação.',
 '[{"titulo":"Fontes de ferro","itens":["Ferro de melhor absorção: carnes, aves e peixes.","Ferro vegetal: feijão, lentilha, grão-de-bico, folhas verde-escuras, tofu.","Distribua essas fontes entre as refeições do dia."]},{"titulo":"Melhorar a absorção","itens":["Combine o ferro vegetal com vitamina C (laranja, limão, acerola, tomate, pimentão).","Evite café, chá e leite junto da refeição principal — atrapalham a absorção do ferro.","Deixe o cafezinho para 1 hora depois da refeição."]},{"titulo":"No dia a dia","itens":["Feijão com arroz e uma salada com limão é uma combinação clássica e eficiente.","Uma fruta cítrica na sobremesa ajuda a aproveitar o ferro do almoço.","Remolho de leguminosas melhora o aproveitamento dos minerais."]}]'::jsonb,
 'Um suco de laranja ou uma laranja de sobremesa no almoço do feijão aumenta bastante a absorção do ferro vegetal.',
 '[{"fonte":"World Health Organization","ano":2016,"detalhe":"Anemia por deficiência de ferro"},{"fonte":"Ministério da Saúde (Brasil)","ano":2022,"detalhe":"Prevenção da anemia ferropriva"}]'::jsonb,
 'O diagnóstico é por exame de sangue. A suplementação de ferro é conduta médica — não iniciar por conta própria.'),

-- ============================================================
--  ESPORTE
-- ============================================================
(null, 'Antes e depois do treino', 'pre-pos-treino', '{treino,pretreino,postreino,esporte,academia,exercicio,recuperacao}', 'condicao', 'Esporte', 'Performance',
 'O que comer em volta do treino para energia e recuperação.',
 '[{"titulo":"Antes do treino","itens":["Priorize carboidrato de fácil digestão (fruta, pão, tapioca, aveia) para energia.","Refeição maior: 2–3 horas antes. Lanche leve: 30–60 minutos antes.","Evite muita gordura e fibra logo antes — pesam e podem dar desconforto."]},{"titulo":"Depois do treino","itens":["Combine proteína (ovo, iogurte, frango, whey) com carboidrato para recuperar.","Não precisa ser imediato ao segundo, mas não pule a refeição seguinte.","Reponha líquidos perdidos no suor."]},{"titulo":"Hidratação","itens":["Beba água antes, durante e depois — mesmo sem sede.","Treinos longos ou muito intensos e com muito suor podem pedir reposição de sais.","Urina clara ao longo do dia é um bom sinal de hidratação."]}]'::jsonb,
 'Uma banana antes e um iogurte com fruta depois já resolvem bem a maioria dos treinos do dia a dia.',
 '[{"fonte":"Sociedade Brasileira de Medicina do Exercício e do Esporte","ano":2021,"detalhe":"Nutrição e atividade física"},{"fonte":"American College of Sports Medicine","ano":2016,"detalhe":"Nutrição para o desempenho"}]'::jsonb,
 'Atletas e treinos de alto volume exigem individualização. Suplementos só com avaliação profissional.'),

-- ============================================================
--  GERAIS — hábitos do dia a dia
-- ============================================================
(null, 'Montando um prato equilibrado', 'prato-equilibrado', '{prato,equilibrado,montar,porcao,refeicao,metodo}', 'geral', 'Rotina', 'Hábitos',
 'Um método visual simples para montar refeições sem contar caloria.',
 '[{"titulo":"A divisão do prato","itens":["Metade do prato: verduras e legumes (variados e coloridos).","Um quarto: proteína (carne, frango, peixe, ovo, leguminosas).","Um quarto: carboidrato, de preferência integral (arroz, batata, mandioca, macarrão)."]},{"titulo":"Complementos","itens":["Uma gordura boa: fio de azeite, abacate ou um punhado de castanhas.","Fruta como sobremesa em vez de doce.","Água como bebida principal da refeição."]},{"titulo":"Ordem que sacia","itens":["Comece pela salada/legumes, depois a proteína, por último o carboidrato.","Coma devagar e sem tela — o corpo leva ~20 minutos para sinalizar saciedade.","Sirva o prato uma vez; repetir por hábito costuma ser mais que o necessário."]}]'::jsonb,
 'Não precisa balança nem app: o método do prato (metade vegetais, um quarto proteína, um quarto carboidrato) já organiza a maioria das refeições.',
 '[{"fonte":"Harvard T.H. Chan School of Public Health","ano":2011,"detalhe":"Prato Saudável (Healthy Eating Plate)"},{"fonte":"Ministério da Saúde (Brasil)","ano":2014,"detalhe":"Guia Alimentar para a População Brasileira"}]'::jsonb,
 null),

(null, 'Hidratação no dia a dia', 'hidratacao', '{hidratacao,agua,beber,liquido,sede}', 'geral', 'Rotina', 'Hábitos',
 'Como manter uma boa hidratação sem complicar.',
 '[{"titulo":"Quanto e como","itens":["Distribua a água ao longo do dia em vez de grandes quantidades de uma vez.","Tenha sempre uma garrafa à vista — o que está à mão é o que se bebe.","A sede já é sinal de que faltou; beba antes de sentir."]},{"titulo":"Bons sinais","itens":["Urina clara ao longo do dia costuma indicar boa hidratação.","Calor, atividade física e amamentação aumentam a necessidade.","Idosos sentem menos sede — vale criar lembretes."]},{"titulo":"Cuidados","itens":["Prefira água; refrigerantes e sucos açucarados hidratam mas somam açúcar.","Café e chá contam como líquido, mas modere a cafeína.","Águas saborizadas com fruta e hortelã ajudam quem tem dificuldade."]}]'::jsonb,
 'Deixar uma garrafa cheia sempre à vista na mesa de trabalho costuma resolver mais do que qualquer meta rígida de litros.',
 '[{"fonte":"European Food Safety Authority","ano":2010,"detalhe":"Ingestão adequada de água"}]'::jsonb,
 'Restrição ou necessidade aumentada de líquidos em doenças renais/cardíacas é conduta médica.'),

(null, 'Leitura de rótulos', 'leitura-rotulos', '{rotulo,rotulos,embalagem,ingredientes,tabela,nutricional}', 'geral', 'Rotina', 'Compras',
 'Como olhar o rótulo para escolher melhor no mercado.',
 '[{"titulo":"Lista de ingredientes","itens":["Vêm em ordem de quantidade: os primeiros são o que mais tem no produto.","Quanto menor e mais reconhecível a lista, melhor.","Açúcar aparece com muitos nomes (xarope de glicose, maltodextrina, dextrose) — some todos."]},{"titulo":"Na tabela e na frente","itens":["Compare por porção e olhe sódio, açúcares e gorduras.","No Brasil, a lupa preta na frente avisa alto em açúcar, sódio ou gordura saturada.","Compare produtos parecidos e escolha o com menos selos e menos sódio/açúcar."]},{"titulo":"Não se engane","itens":["Integral, natural, fit e zero na frente não garantem que seja saudável — confira o rótulo.","Zero açúcar pode ter muita gordura ou sódio, e vice-versa.","Alimento de verdade, sem rótulo, quase sempre é a melhor escolha."]}]'::jsonb,
 'Olhe primeiro a lista de ingredientes: se o açúcar (em qualquer nome) está entre os primeiros, já diz muito sobre o produto.',
 '[{"fonte":"ANVISA","ano":2022,"detalhe":"Rotulagem nutricional frontal"},{"fonte":"Ministério da Saúde (Brasil)","ano":2014,"detalhe":"Guia Alimentar para a População Brasileira"}]'::jsonb,
 null),

(null, 'Comer fora de casa', 'comer-fora', '{fora,restaurante,delivery,rodizio,viagem,social}', 'geral', 'Rotina', 'Hábitos',
 'Escolhas para manter o equilíbrio fora de casa sem sofrer.',
 '[{"titulo":"No restaurante","itens":["Comece pela salada ou por um vegetal — ajuda a chegar menos faminto no resto.","Prefira grelhados, assados e cozidos a frituras e molhos pesados.","Peça o molho e a farofa à parte para controlar a quantidade."]},{"titulo":"Bebidas e sobremesa","itens":["Água ou algo sem açúcar como bebida principal.","Se quiser sobremesa, divida ou escolha uma opção com fruta.","Álcool soma calorias e abre o apetite — modere."]},{"titulo":"Buffet e delivery","itens":["No buffet, dê uma volta antes de servir e monte um prato só.","No delivery, decida antes de abrir o app com fome.","Não precisa ser perfeito: uma boa escolha na maioria das vezes já sustenta o resultado."]}]'::jsonb,
 'Chegar menos faminto (com um lanche leve antes) é o que mais evita exageros no restaurante ou no rodízio.',
 '[{"fonte":"Ministério da Saúde (Brasil)","ano":2014,"detalhe":"Guia Alimentar para a População Brasileira"}]'::jsonb,
 null),

(null, 'Lanches práticos e saudáveis', 'lanches-praticos', '{lanche,lanches,merenda,belisco,fome,praticos}', 'geral', 'Rotina', 'Hábitos',
 'Ideias de lanches que seguram a fome sem apelar para ultraprocessado.',
 '[{"titulo":"Combinações que saciam","itens":["Fruta + castanhas (ex.: maçã com amêndoas).","Iogurte natural + aveia ou fruta.","Ovo cozido, ou pão integral com pasta de grão-de-bico/queijo."]},{"titulo":"Para levar","itens":["Mix de castanhas em porções já separadas.","Fruta de casca resistente (banana, maçã, pera, tangerina).","Iogurte ou palitos de cenoura/pepino em potinho."]},{"titulo":"Estratégia","itens":["Ter o lanche pronto e à mão evita o salgadinho da máquina.","Combine sempre uma proteína ou gordura boa com a fruta — sacia mais.","Deixe o menos saudável fora de vista e o saudável na frente."]}]'::jsonb,
 'Separar porções de castanhas no domingo e deixar na bolsa/gaveta resolve o lanche da tarde da semana inteira.',
 '[{"fonte":"Ministério da Saúde (Brasil)","ano":2014,"detalhe":"Guia Alimentar para a População Brasileira"}]'::jsonb,
 null)

on conflict (slug) where (nutricionista_id is null)
do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  eixo = excluded.eixo, grupo = excluded.grupo, resumo = excluded.resumo,
  blocos = excluded.blocos, dica_pratica = excluded.dica_pratica,
  referencias = excluded.referencias, atencao = excluded.atencao, updated_at = now();

notify pgrst, 'reload schema';

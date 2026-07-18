-- ============================================================
--  Plataforma Nutri — Migração 0026
--  Semente da Biblioteca de Orientações (conteúdo AUTORAL).
--
--  Base curada: nutricionista_id = NULL. Texto voltado ao paciente,
--  escrito do zero, com referência institucional citável (sem DOI/título
--  inventado). Reexecutável: on conflict do slug base, atualiza.
-- ============================================================

insert into public.ic_orientacoes
  (nutricionista_id, nome, slug, sinonimos, categoria, eixo, grupo, resumo, blocos, dica_pratica, referencias, atencao)
values
-- ---------- CONDIÇÕES ----------
(null, 'Ansiedade', 'ansiedade', '{ansiedade,nervosismo,estresse,agitacao}', 'condicao', 'Saúde mental', 'Comportamento',
 'Alimentação e rotina que ajudam a regular o estado de ansiedade.',
 '[{"titulo":"No prato","itens":["Mantenha refeições em horários regulares — ficar muitas horas sem comer favorece oscilação de humor e irritabilidade.","Combine fontes de triptofano (ovos, banana, aveia, castanhas) com carboidrato integral, que ajuda o corpo a usá-lo.","Inclua magnésio (folhas verdes-escuras, sementes, leguminosas) e ômega-3 (sardinha, linhaça, chia)."]},{"titulo":"Cafeína e álcool","itens":["Reduza café, energéticos e chá preto no fim do dia — a cafeína pode intensificar a sensação de agitação e atrapalhar o sono.","Evite usar álcool para relaxar: ele piora o sono e o humor no dia seguinte."]},{"titulo":"Rotina","itens":["Atividade física regular tem efeito consistente sobre a ansiedade.","Cuide do sono e reduza telas à noite."]}]'::jsonb,
 'Um lanche da tarde com banana, aveia e castanhas reúne triptofano, magnésio e carboidrato — combinação que favorece o bem-estar no fim do dia.',
 '[{"fonte":"World Health Organization","ano":2022,"detalhe":"Estilo de vida e saúde mental"}]'::jsonb,
 'Orientação alimentar é complementar. Sintomas intensos ou persistentes exigem acompanhamento médico/psicológico.'),

(null, 'Humor deprimido', 'depressao', '{depressao,humor,tristeza,desanimo}', 'condicao', 'Saúde mental', 'Comportamento',
 'Suporte alimentar para o humor, associado ao tratamento de saúde.',
 '[{"titulo":"Padrão alimentar","itens":["Aproxime-se de um padrão mediterrâneo: verduras, legumes, frutas, leguminosas, azeite, peixes e grãos integrais.","Reduza ultraprocessados, frituras e excesso de açúcar — associados a pior humor a longo prazo.","Não pule refeições; a fome intensa piora irritabilidade e vontade de doce."]},{"titulo":"Nutrientes de atenção","itens":["Ômega-3 (peixes gordos, linhaça, chia).","Vitaminas do complexo B e folato (leguminosas, folhas verdes, ovos).","Vitamina D e ferro merecem checagem quando há cansaço persistente."]}]'::jsonb,
 'Deixe frutas e castanhas visíveis e à mão nos dias de menos disposição — reduz a chance de recorrer a ultraprocessados.',
 '[{"fonte":"World Health Organization","ano":2022,"detalhe":"Dieta e saúde mental"}]'::jsonb,
 'Não substitui tratamento. Ideação de morte, piora rápida ou perda de funcionalidade: encaminhar com prioridade.'),

(null, 'Síndrome do intestino irritável', 'sii', '{sii,intestino,irritavel,colon,gases,distensao}', 'condicao', 'Saúde intestinal', 'Funcional',
 'Estratégias para reduzir gases, distensão e desconforto intestinal.',
 '[{"titulo":"Como comer","itens":["Faça refeições menores e mais frequentes, sem pressa e mastigando bem.","Observe e anote os alimentos que pioram seus sintomas — cada pessoa tem gatilhos diferentes.","Cafeína, álcool, frituras e refrigerantes costumam intensificar o desconforto."]},{"titulo":"Fibras e FODMAPs","itens":["Prefira fibras solúveis (aveia, cenoura cozida, banana) a grandes volumes de fibra insolúvel de uma vez.","Uma redução temporária de FODMAPs pode ajudar, mas deve ser guiada e por tempo limitado — não é para a vida toda.","Hidrate-se bem ao longo do dia."]}]'::jsonb,
 'Um diário simples de alimentos e sintomas por 2 semanas costuma revelar os gatilhos com mais clareza do que cortar tudo de uma vez.',
 '[{"fonte":"American College of Gastroenterology","ano":2021,"detalhe":"Diretriz de manejo da SII"},{"fonte":"Monash University","ano":2023,"detalhe":"Programa FODMAP"}]'::jsonb,
 'Perda de peso, sangramento, anemia, febre ou sintomas noturnos não são da SII — investigar com médico.'),

(null, 'Gastrite e refluxo', 'gastrite-refluxo', '{gastrite,refluxo,azia,queimacao,estomago}', 'condicao', 'Saúde intestinal', 'Funcional',
 'Hábitos que reduzem azia, queimação e desconforto no estômago.',
 '[{"titulo":"Rotina das refeições","itens":["Coma em porções menores e evite deitar nas 2–3 horas após comer.","Não fique longos períodos em jejum — o estômago vazio também incomoda.","Mastigue devagar e evite líquidos em grande volume durante a refeição."]},{"titulo":"O que costuma piorar","itens":["Frituras, alimentos muito gordurosos, café, álcool, refrigerante, excesso de pimenta e cítricos em jejum.","Cigarro piora o refluxo.","Se há sobrepeso, a perda de peso reduz bastante os sintomas."]}]'::jsonb,
 'Elevar a cabeceira da cama e jantar mais cedo e leve costuma reduzir o refluxo noturno sem precisar de nada além.',
 '[{"fonte":"American College of Gastroenterology","ano":2022,"detalhe":"Diretrizes de DRGE e dispepsia"}]'::jsonb,
 'Dor intensa, vômito com sangue, fezes escuras ou emagrecimento: procurar atendimento. H. pylori é conduta médica.'),

(null, 'TPM (tensão pré-menstrual)', 'tpm', '{tpm,pre,menstrual,colica,inchaco,irritabilidade}', 'condicao', 'Saúde da mulher', 'Ciclo',
 'Ajustes na semana pré-menstrual para inchaço, cólica e humor.',
 '[{"titulo":"Na semana que antecede","itens":["Reduza sal e ultraprocessados para diminuir a retenção e o inchaço.","Fracione as refeições para estabilizar a energia e a vontade de doce.","Capriche em magnésio (folhas, sementes, cacau, leguminosas) e cálcio (laticínios, gergelim, folhas)."]},{"titulo":"Bem-estar","itens":["Mantenha atividade física leve a moderada — ajuda humor e cólica.","Cuide do sono e da hidratação.","Modere cafeína se ela piora a irritabilidade e o sono."]}]'::jsonb,
 'Um quadradinho de chocolate 70% ajuda a matar a vontade e ainda oferece magnésio — melhor do que segurar até a compulsão.',
 '[{"fonte":"ACOG (American College of Obstetricians and Gynecologists)","ano":2023,"detalhe":"Manejo da síndrome pré-menstrual"}]'::jsonb,
 'Sintomas incapacitantes (TDPM) merecem avaliação ginecológica.'),

(null, 'Menopausa', 'menopausa', '{menopausa,climaterio,fogacho,calor}', 'condicao', 'Saúde da mulher', 'Ciclo',
 'Alimentação para o período do climatério: osso, coração e peso.',
 '[{"titulo":"Prioridades","itens":["Proteína em todas as refeições ajuda a preservar massa muscular, que tende a cair nessa fase.","Cálcio e vitamina D para a saúde óssea (laticínios, folhas verdes, gergelim, sol com orientação).","Fibras, frutas, legumes e grãos integrais para intestino, saciedade e coração."]},{"titulo":"Peso e sintomas","itens":["A gordura tende a se concentrar no abdômen — força muscular e passos diários fazem diferença.","Cafeína, álcool e refeições muito quentes/picantes podem intensificar os fogachos em algumas mulheres.","Cuide do sono: ele impacta apetite e humor."]}]'::jsonb,
 'Treino de força 2–3x por semana é um dos melhores investimentos dessa fase — protege osso, músculo e metabolismo.',
 '[{"fonte":"The North American Menopause Society","ano":2022,"detalhe":"Nutrição e estilo de vida no climatério"}]'::jsonb,
 'Reposição hormonal e sintomas intensos são conduta médica.'),

(null, 'Emagrecimento — hábitos', 'emagrecimento-habitos', '{emagrecer,peso,habitos,dieta}', 'condicao', 'Comportamento', 'Peso',
 'Comportamentos que sustentam o emagrecimento no dia a dia.',
 '[{"titulo":"Estrutura do dia","itens":["Faça refeições com proteína e fibra — saciam mais e por mais tempo.","Coma com atenção, sem tela, devagar; o cérebro leva cerca de 20 minutos para registrar a saciedade.","Planeje lanches; a fome sem plano é o que costuma sair do trilho."]},{"titulo":"Ambiente","itens":["Deixe o saudável visível e o menos saudável fora de vista.","Beba água ao longo do dia; às vezes sede é confundida com fome.","Priorize sono: dormir mal aumenta a fome e a vontade de doce no dia seguinte."]}]'::jsonb,
 'Monte o prato pela ordem: primeiro salada/legumes, depois proteína, por último o carboidrato. Ajuda a comer o suficiente sem contar caloria o tempo todo.',
 '[{"fonte":"World Health Organization","ano":2020,"detalhe":"Recomendações de dieta saudável e peso"}]'::jsonb,
 'Emagrecimento muito rápido, uso de compostos sem prescrição ou relação sofrida com a comida: reavaliar a conduta.'),

(null, 'Compulsão alimentar', 'compulsao', '{compulsao,binge,descontrole,fome,emocional}', 'condicao', 'Comportamento', 'Peso',
 'Reduzir episódios de comer em excesso e sem controle.',
 '[{"titulo":"Prevenção","itens":["Não pule refeições nem faça restrição severa — a fome extrema é gatilho clássico de compulsão.","Coma de 3 em 3 horas mais ou menos, com proteína e fibra.","Evite ter em casa, em grande quantidade, o alimento que costuma disparar o episódio."]},{"titulo":"No momento da vontade","itens":["Antes de comer no automático, pare e pergunte: é fome física ou emocional?","Adie 10 minutos e beba água; muitas vezes a onda passa.","Se comeu além do planejado, retome a próxima refeição normalmente — sem punição ou pular refeição depois."]}]'::jsonb,
 'Culpa e restrição depois de um episódio tendem a alimentar o ciclo. Acolher e retomar a rotina quebra o ciclo melhor do que compensar.',
 '[{"fonte":"National Institute for Health and Care Excellence (NICE)","ano":2020,"detalhe":"Transtornos alimentares — orientações"}]'::jsonb,
 'Episódios frequentes, purgação ou grande sofrimento: encaminhar para equipe (psicologia/psiquiatria).'),

(null, 'Constipação intestinal', 'constipacao', '{constipacao,intestino,preso,prisao,ventre}', 'condicao', 'Saúde intestinal', 'Funcional',
 'Hábitos para regularizar o funcionamento do intestino.',
 '[{"titulo":"Os três pilares","itens":["Fibras: frutas com casca/bagaço, legumes, folhas, leguminosas e grãos integrais ao longo do dia.","Água: aumentar a fibra sem beber água pode piorar — os dois andam juntos.","Movimento: caminhar e atividade física estimulam o intestino."]},{"titulo":"Rotina","itens":["Respeite o horário do intestino, geralmente após uma refeição; não segure a vontade.","Frutas como mamão, ameixa e kiwi ajudam muitas pessoas.","Aumente as fibras aos poucos para evitar gases."]}]'::jsonb,
 '1–2 colheres de sopa de sementes (chia ou linhaça) hidratadas, mais água ao longo do dia, é um começo simples e eficaz.',
 '[{"fonte":"World Gastroenterology Organisation","ano":2022,"detalhe":"Constipação — diretriz global"}]'::jsonb,
 'Mudança súbita do hábito intestinal, sangue nas fezes ou emagrecimento: investigar com médico.'),

(null, 'Insônia e higiene do sono', 'insonia', '{insonia,sono,dormir,acordar}', 'condicao', 'Saúde mental', 'Sono',
 'Alimentação e rotina que favorecem um sono melhor.',
 '[{"titulo":"À noite","itens":["Evite cafeína (café, chá preto/verde, energético, chocolate amargo) a partir do meio da tarde.","Jante mais cedo e leve; refeições pesadas ou muito gordurosas atrapalham o sono.","Modere líquidos perto de dormir para reduzir despertares."]},{"titulo":"Rotina","itens":["Horários regulares de dormir e acordar, inclusive no fim de semana.","Reduza telas e luz forte na última hora antes de deitar.","Um lanche leve com triptofano (leite, banana, aveia) pode ajudar quem sente fome à noite."]}]'::jsonb,
 'Álcool dá sono no início, mas fragmenta o sono na segunda metade da noite — não é bom indutor.',
 '[{"fonte":"American Academy of Sleep Medicine","ano":2021,"detalhe":"Higiene do sono"}]'::jsonb,
 'Insônia persistente, ronco com pausas ou sonolência diurna importante: avaliação médica.'),

-- ---------- TÉCNICAS DO DIA A DIA ----------
(null, 'Branqueamento de vegetais', 'branqueamento', '{branqueamento,escaldar,vegetais,congelar}', 'tecnica', 'Culinária', 'Técnicas',
 'Escaldar rapidamente e resfriar para preservar cor, textura e nutrientes.',
 '[{"titulo":"Passo a passo","itens":["Ferva bastante água e prepare ao lado uma tigela com água e gelo.","Mergulhe o vegetal na água fervente por pouco tempo (folhas ~1 min; brócolis/couve-flor ~2–3 min).","Retire e mergulhe imediatamente na água com gelo para parar o cozimento.","Escorra bem antes de guardar ou congelar."]},{"titulo":"Para que serve","itens":["Mantém a cor viva e a textura firme.","Reduz perdas ao congelar — o vegetal chega melhor no dia de usar.","Facilita higienizar e pré-preparar a semana."]}]'::jsonb,
 'Branqueie e congele em porções já lavadas e picadas: no dia corrido, é só usar.',
 '[{"fonte":"Embrapa Hortaliças","ano":2020,"detalhe":"Pré-processamento e conservação de hortaliças"}]'::jsonb,
 null),

(null, 'Remolho de leguminosas', 'remolho-leguminosas', '{remolho,demolho,feijao,grao,lentilha,gases}', 'tecnica', 'Culinária', 'Técnicas',
 'Deixar de molho antes de cozinhar reduz gases e melhora a digestão.',
 '[{"titulo":"Como fazer","itens":["Cubra os grãos com bastante água e deixe de molho de 8 a 12 horas (de um dia para o outro).","Descarte a água do molho e cozinhe com água nova.","Para lentilha e grão-de-bico, o mesmo vale; ajuste o tempo de cozimento."]},{"titulo":"Por que ajuda","itens":["Reduz os oligossacarídeos que causam gases e desconforto.","Diminui os antinutrientes (fitatos), melhorando o aproveitamento de minerais como ferro e zinco.","Encurta o tempo de cozimento e economiza gás."]}]'::jsonb,
 'Trocar a água do molho e a de cozimento é o que mais reduz os gases — não reaproveite a água do remolho.',
 '[{"fonte":"Embrapa Arroz e Feijão","ano":2019,"detalhe":"Preparo e valor nutricional de leguminosas"}]'::jsonb,
 null),

(null, 'Higienização de folhas e vegetais', 'higienizacao-vegetais', '{higienizacao,lavar,sanitizar,folhas,cloro}', 'tecnica', 'Culinária', 'Segurança',
 'Lavar e sanitizar corretamente o que será consumido cru.',
 '[{"titulo":"Passo a passo","itens":["Lave folha a folha em água corrente para retirar sujeira e terra.","Deixe de molho por 10–15 minutos em solução sanitizante (1 colher de sopa de água sanitária própria para alimentos por litro de água).","Enxágue em água corrente e escorra.","Guarde seco, em recipiente fechado, na geladeira."]}]'::jsonb,
 'Use sempre água sanitária SEM perfume e com indicação para alimentos no rótulo, respeitando a diluição.',
 '[{"fonte":"ANVISA","ano":2021,"detalhe":"Boas práticas e higienização de hortifrúti"}]'::jsonb,
 'Gestantes e pessoas imunossuprimidas devem ter atenção redobrada com alimentos crus.'),

(null, 'Congelamento e porcionamento', 'congelamento-porcionamento', '{congelar,freezer,porcao,marmita,planejamento}', 'tecnica', 'Culinária', 'Planejamento',
 'Congelar em porções para facilitar a rotina e evitar desperdício.',
 '[{"titulo":"Como organizar","itens":["Resfrie o alimento antes de levar ao freezer; não congele ainda quente.","Divida em porções do tamanho de uma refeição e etiquete com nome e data.","Prefira potes ou sacos próprios para freezer, tirando o excesso de ar."]},{"titulo":"Bom saber","itens":["Descongele na geladeira, não em temperatura ambiente.","Não recongele o que já foi descongelado cru.","Feijão, arroz, carnes cozidas, caldos e legumes branqueados congelam muito bem."]}]'::jsonb,
 'Um domingo de pré-preparo (proteínas grelhadas + leguminosas + legumes branqueados) resolve a semana e ajuda a seguir o plano.',
 '[{"fonte":"ANVISA","ano":2021,"detalhe":"Boas práticas: conservação e congelamento"}]'::jsonb,
 null),

(null, 'Ativação de oleaginosas', 'ativacao-oleaginosas', '{ativacao,demolho,castanha,noz,amendoa,semente}', 'tecnica', 'Culinária', 'Técnicas',
 'Demolho de castanhas e sementes para melhorar a digestão.',
 '[{"titulo":"Como fazer","itens":["Cubra as castanhas/sementes com água e deixe de molho de 6 a 8 horas.","Descarte a água, enxágue e escorra.","Consuma nos dias seguintes (guarde na geladeira) ou seque em forno baixo/desidratador para ficarem crocantes."]},{"titulo":"Por que fazer","itens":["Reduz os fitatos, melhorando o aproveitamento de minerais.","Deixa mais leve e fácil de digerir para quem sente desconforto.","Melhora a textura em receitas e pastas."]}]'::jsonb,
 'Ative de uma vez uma quantidade para a semana e mantenha na geladeira — pronto para o lanche.',
 '[{"fonte":"Embrapa","ano":2019,"detalhe":"Antinutrientes e biodisponibilidade de minerais"}]'::jsonb,
 null)

on conflict (slug) where (nutricionista_id is null)
do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  eixo = excluded.eixo, grupo = excluded.grupo, resumo = excluded.resumo,
  blocos = excluded.blocos, dica_pratica = excluded.dica_pratica,
  referencias = excluded.referencias, atencao = excluded.atencao, updated_at = now();

notify pgrst, 'reload schema';

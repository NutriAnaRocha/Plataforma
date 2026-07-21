-- ============================================================
--  Plataforma Nutri — Migração 0032
--  Ampliação da Biblioteca de Receitas (conteúdo AUTORAL, escrito do zero).
--
--  Preparações caseiras comuns da cozinha funcional — que não têm dono —
--  redigidas com texto original nosso. NÃO reproduzem nenhum livro de
--  terceiros. Base curada: nutricionista_id = NULL.
--  Reexecutável (upsert por slug base).
-- ============================================================

insert into public.ic_receitas
  (nutricionista_id, nome, slug, sinonimos, categoria, tags, resumo, porcoes, tempo_min, kcal_porcao, ingredientes, modo_preparo, dica, atencao)
values

-- ---------------- CAFÉ & LANCHES ----------------
(null, 'Pão low carb de frigideira', 'pao-low-carb-frigideira', array['pao','low carb','frigideira','mug'], 'cafe-lanche',
 array['low carb','sem glúten','rápida'],
 'Pãozinho individual pronto em minutos, sem farinha de trigo.', '1 unidade', 10, 200,
 array['1 ovo','2 colheres de sopa de farinha de amêndoas','1 colher de sopa de psyllium (ou farinha de linhaça)','1/2 colher de chá de fermento','1 pitada de sal'],
 array['Misture todos os ingredientes até virar uma massa homogênea.','Deixe descansar 2 minutos para o psyllium hidratar.','Molde e leve à frigideira antiaderente tampada, em fogo baixo.','Doure dos dois lados até firmar.'],
 'Corte ao meio e recheie como um sanduíche.', 'Contém ovo e oleaginosas.'),

(null, 'Cookie funcional de aveia e cacau', 'cookie-aveia-cacau', array['cookie','biscoito','aveia','cacau'], 'cafe-lanche',
 array['sem açúcar','fibras'],
 'Cookies macios sem açúcar refinado, com aveia e cacau.', '8 unidades', 25, 90,
 array['1 banana bem madura amassada','1 xícara de aveia em flocos','2 colheres de sopa de cacau em pó 100%','1 colher de sopa de pasta de amendoim','Adoçante a gosto (opcional)'],
 array['Misture a banana com a aveia, o cacau e a pasta de amendoim.','Deixe a massa descansar 5 minutos.','Modele bolinhas e achate sobre a assadeira forrada.','Asse a 180°C por cerca de 15 minutos.'],
 'Guarde em pote fechado por até 4 dias.', 'Contém glúten (aveia) e amendoim.'),

(null, 'Geleia de chia com morango', 'geleia-chia-morango', array['geleia','chia','morango'], 'cafe-lanche',
 array['sem açúcar','rápida'],
 'Geleia natural que engrossa com a chia, sem açúcar.', '1 pote pequeno', 15, 40,
 array['1 xícara de morangos picados','1 colher de sopa de chia','1 colher de sopa de água','Adoçante ou raspas de limão a gosto'],
 array['Leve os morangos ao fogo baixo com a água até desmancharem.','Desligue e misture a chia.','Deixe esfriar: a geleia engrossa sozinha na geladeira.'],
 'Funciona com qualquer fruta vermelha ou manga.', null),

(null, 'Mingau funcional de aveia com maçã', 'mingau-aveia-maca', array['mingau','aveia','maca','papa'], 'cafe-lanche',
 array['fibras','conforto'],
 'Mingau quentinho de aveia com maçã e canela.', '1 porção', 10, 220,
 array['3 colheres de sopa de aveia','200 ml de leite ou bebida vegetal','1/2 maçã ralada','Canela a gosto'],
 array['Leve a aveia com o leite ao fogo baixo, mexendo sempre.','Quando engrossar, junte a maçã ralada.','Finalize com canela e sirva quente.'],
 'A maçã já adoça; ajuste o adoçante só se precisar.', 'Contém glúten (aveia).'),

(null, 'Iogurte natural caseiro', 'iogurte-caseiro', array['iogurte','probiotico','caseiro'], 'cafe-lanche',
 array['probiótico','proteica'],
 'Iogurte cremoso feito em casa, só leite e fermento.', '1 litro', 30, 70,
 array['1 litro de leite integral','1 pote de iogurte natural integral (como isca)'],
 array['Aqueça o leite até quase ferver e deixe amornar.','Dissolva o iogurte natural no leite morno.','Cubra e mantenha aquecido (forno desligado ou pano) por 8 a 12 horas.','Leve à geladeira depois de firmar.'],
 'Guarde um potinho para ser a isca da próxima leva.', 'Contém derivados de leite.'),

(null, 'Bolo de caneca de banana', 'bolo-caneca-banana', array['bolo','caneca','banana','microondas'], 'cafe-lanche',
 array['rápida','sem açúcar'],
 'Bolinho individual de micro-ondas em 5 minutos.', '1 porção', 5, 250,
 array['1 banana amassada','1 ovo','3 colheres de sopa de aveia','1/2 colher de chá de fermento','Canela a gosto'],
 array['Misture tudo direto na caneca.','Leve ao micro-ondas por cerca de 2 a 3 minutos.','Espere um minuto antes de comer.'],
 'Uma colher de cacau vira versão chocolate.', 'Contém ovo e glúten (aveia).'),

(null, 'Biscoito crocante de gergelim', 'biscoito-gergelim', array['biscoito','gergelim','crocante'], 'cafe-lanche',
 array['sem glúten','crocante'],
 'Biscoitos salgados crocantes, sem farinha de trigo.', '12 unidades', 25, 60,
 array['1/2 xícara de gergelim','2 colheres de sopa de farinha de linhaça','1 clara de ovo','1 pitada de sal'],
 array['Misture tudo até formar uma pasta.','Espalhe fino sobre papel manteiga.','Marque em quadrados e asse a 170°C até dourar.','Deixe esfriar para ficar crocante.'],
 'Ótimos para acompanhar patês e pastas.', 'Contém ovo e gergelim.'),

-- ---------------- REFEIÇÕES ----------------
(null, 'Creme de abóbora com gengibre', 'creme-abobora-gengibre', array['creme','sopa','abobora','gengibre'], 'refeicao',
 array['vegano','reconfortante'],
 'Sopa cremosa e levemente picante, ótima à noite.', '3 porções', 30, 130,
 array['500 g de abóbora em cubos','1/2 cebola','1 pedaço pequeno de gengibre','Sal, azeite e cheiro-verde a gosto','Água ou caldo de legumes'],
 array['Refogue a cebola e o gengibre no azeite.','Junte a abóbora e cubra com água.','Cozinhe até amaciar e bata tudo no liquidificador.','Ajuste o sal e finalize com cheiro-verde.'],
 'Uma colher de leite de coco deixa mais aveludado.', null),

(null, 'Lasanha de abobrinha', 'lasanha-abobrinha', array['lasanha','abobrinha','low carb'], 'refeicao',
 array['low carb','proteica'],
 'Fatias de abobrinha no lugar da massa da lasanha.', '4 porções', 50, 300,
 array['3 abobrinhas em fatias finas no comprimento','400 g de carne moída magra','2 xícaras de molho de tomate caseiro','Queijo ralado a gosto','Sal e temperos a gosto'],
 array['Grelhe rapidamente as fatias de abobrinha para soltar a água.','Prepare a carne moída com o molho de tomate.','Monte camadas: abobrinha, carne, molho, repetindo.','Cubra com queijo e asse a 200°C por 20 minutos.'],
 'Deixe descansar 10 minutos antes de cortar.', 'Contém derivados de leite.'),

(null, 'Hambúrguer de grão-de-bico', 'hamburguer-grao-de-bico', array['hamburguer','grao de bico','vegetariano','burger'], 'refeicao',
 array['vegetariano','proteica','fibras'],
 'Hambúrguer vegetal que não desmancha, assado ou grelhado.', '4 unidades', 30, 180,
 array['2 xícaras de grão-de-bico cozido','2 colheres de sopa de aveia','1/2 cebola picada','Alho, salsinha, sal e cominho a gosto'],
 array['Amasse o grão-de-bico com um garfo, deixando pedaços.','Misture a aveia, a cebola e os temperos até dar liga.','Modele os hambúrgueres.','Grelhe na frigideira ou asse a 200°C, virando na metade.'],
 'A aveia é o que segura a massa; não pule.', 'Contém glúten (aveia).'),

(null, 'Purê de couve-flor', 'pure-couve-flor', array['pure','couve-flor','low carb'], 'refeicao',
 array['low carb','acompanhamento'],
 'Purê leve e cremoso no lugar do de batata.', '3 porções', 20, 90,
 array['1 couve-flor média em buquês','1 dente de alho','1 colher de sopa de azeite ou manteiga','Sal e noz-moscada a gosto'],
 array['Cozinhe a couve-flor no vapor até ficar bem macia.','Escorra muito bem para o purê não ficar aguado.','Bata com o alho, o azeite e os temperos até ficar liso.'],
 'Escorrer bem é o segredo da cremosidade.', null),

(null, 'Salmão assado com legumes', 'salmao-assado-legumes', array['salmao','peixe','assado','papelote'], 'refeicao',
 array['proteica','ômega-3'],
 'Prato completo assado no papelote, tudo junto.', '2 porções', 30, 320,
 array['2 postas de salmão','1 abobrinha e 1 tomate em rodelas','Limão, azeite, sal e ervas a gosto'],
 array['Monte cada porção sobre um pedaço de papel-alumínio.','Coloque os legumes, o salmão por cima e tempere.','Regue com limão e azeite e feche o papelote.','Asse a 200°C por cerca de 20 minutos.'],
 'O papelote mantém o peixe úmido e suculento.', 'Contém peixe.'),

(null, 'Risoto de quinoa com legumes', 'risoto-quinoa', array['risoto','quinoa','vegetariano'], 'refeicao',
 array['proteica','sem glúten'],
 'Cremoso como risoto, feito com quinoa no lugar do arroz.', '3 porções', 30, 260,
 array['1 xícara de quinoa','2 a 3 xícaras de caldo de legumes','1/2 cebola e 1 dente de alho','Legumes picados a gosto (abobrinha, cenoura, ervilha)','Azeite, sal e cheiro-verde'],
 array['Refogue a cebola e o alho no azeite.','Junte a quinoa e os legumes e mexa.','Adicione o caldo aos poucos, mexendo, até a quinoa ficar macia.','Finalize com cheiro-verde.'],
 'Uma colher de requeijão light deixa mais cremoso.', null),

(null, 'Torta de frango low carb', 'torta-frango-low-carb', array['torta','frango','low carb'], 'refeicao',
 array['low carb','proteica'],
 'Torta de liquidificador com massa de farinha de amêndoas.', '6 porções', 45, 280,
 array['3 ovos','1 xícara de farinha de amêndoas','1/2 xícara de leite ou bebida vegetal','1 colher de chá de fermento','2 xícaras de frango cozido e desfiado temperado'],
 array['Bata os ovos, a farinha, o leite e o fermento.','Despeje metade da massa na forma untada.','Distribua o recheio de frango e cubra com o restante da massa.','Asse a 180°C por cerca de 30 minutos.'],
 'O recheio pode ser de legumes ou atum.', 'Contém ovo e oleaginosas.'),

(null, 'Salada de folhas com figo e nozes', 'salada-figo-nozes', array['salada','figo','nozes','folhas'], 'refeicao',
 array['fibras','antioxidante'],
 'Salada agridoce com figos e crocância das nozes.', '2 porções', 10, 160,
 array['Mix de folhas verdes','2 figos em gomos (ou 4 damascos secos)','1 punhado de nozes','Azeite, limão e sal a gosto'],
 array['Lave e seque bem as folhas.','Monte com o figo e as nozes por cima.','Tempere com azeite, limão e sal na hora de servir.'],
 'Umas lascas de queijo fresco combinam bem.', 'Contém oleaginosas.'),

(null, 'Molho de iogurte com hortelã', 'molho-iogurte-hortela', array['molho','iogurte','hortela','salada'], 'refeicao',
 array['leve','rápida'],
 'Molho refrescante para saladas e legumes assados.', '4 porções', 5, 40,
 array['1/2 xícara de iogurte natural','1 colher de sopa de azeite','Hortelã picada a gosto','Sal, limão e alho amassado a gosto'],
 array['Misture o iogurte com o azeite e o limão.','Junte a hortelã, o alho e o sal.','Gele antes de usar.'],
 'Ótimo também como dip de palitos de legumes.', 'Contém derivados de leite.'),

(null, 'Berinjela gratinada', 'berinjela-gratinada', array['berinjela','gratinada','forno'], 'refeicao',
 array['vegetariano','low carb'],
 'Berinjela ao molho de tomate gratinada no forno.', '3 porções', 40, 180,
 array['2 berinjelas em rodelas','2 xícaras de molho de tomate caseiro','Queijo ralado a gosto','Azeite, sal e orégano'],
 array['Tempere as rodelas de berinjela e asse até amaciar.','Num refratário, alterne berinjela e molho de tomate.','Cubra com queijo e orégano.','Gratine a 200°C até dourar.'],
 'Salpicar sal e deixar a berinjela descansar tira o amargor.', 'Contém derivados de leite.'),

(null, 'Farofa de aveia', 'farofa-aveia', array['farofa','aveia','acompanhamento'], 'refeicao',
 array['fibras','sem farinha de mandioca'],
 'Farofa crocante feita com aveia em flocos.', '4 porções', 15, 120,
 array['1 xícara de aveia em flocos grossos','1/2 cebola picada','1 colher de sopa de azeite','Cenoura ralada e cheiro-verde a gosto','Sal a gosto'],
 array['Refogue a cebola no azeite.','Junte a cenoura e refogue rapidamente.','Adicione a aveia e mexa em fogo baixo até tostar.','Finalize com sal e cheiro-verde.'],
 'Não deixe queimar: a aveia tosta rápido.', 'Contém glúten (aveia).'),

-- ---------------- DOCES FIT ----------------
(null, 'Sagu de chia com suco de uva', 'sagu-chia-uva', array['sagu','chia','uva','sobremesa'], 'doce',
 array['sem açúcar','fibras'],
 'Sobremesa que imita o sagu, feita com chia.', '2 porções', 15, 120,
 array['3 colheres de sopa de chia','1 xícara de suco de uva integral','Adoçante a gosto (opcional)'],
 array['Misture a chia com o suco de uva.','Mexa bem e espere 5 minutos; mexa de novo para não empelotar.','Leve à geladeira por pelo menos 2 horas até virar gel.'],
 'Fica lindo em camadas com iogurte.', null),

(null, 'Cheesecake funcional de frutas vermelhas', 'cheesecake-funcional', array['cheesecake','frutas vermelhas','sobremesa'], 'doce',
 array['proteica','sem açúcar refinado'],
 'Cheesecake sem forno, com base de castanhas.', '6 porções', 30, 210,
 array['1 xícara de castanhas + 4 tâmaras (base)','2 xícaras de iogurte grego (ou cream cheese)','Adoçante e suco de limão a gosto','1 xícara de frutas vermelhas para a cobertura'],
 array['Bata as castanhas com as tâmaras e forre o fundo da forma.','Misture o iogurte com o adoçante e o limão e espalhe sobre a base.','Cozinhe as frutas vermelhas até formar uma calda e deixe esfriar.','Cubra o creme com a calda e gele por algumas horas.'],
 'A base fica firme com a forma de fundo removível.', 'Contém oleaginosas e derivados de leite.'),

(null, 'Picolé de banana com cacau', 'picole-banana-cacau', array['picole','banana','cacau','sorvete'], 'doce',
 array['sem açúcar','vegano'],
 'Picolé cremoso de banana coberto com cacau.', '4 unidades', 15, 110,
 array['2 bananas maduras','2 colheres de sopa de cacau em pó 100%','1 colher de sopa de pasta de amendoim','Um pouco de água se precisar'],
 array['Bata as bananas com a pasta de amendoim até virar creme.','Distribua em forminhas de picolé e congele.','Derreta o cacau com um pouco de água e passe por cima na hora de servir.'],
 'Sem forminha, use copinhos e palitos.', 'Contém amendoim.'),

(null, 'Trufa de tâmara e castanhas', 'trufa-tamara-castanha', array['trufa','tamara','castanha','doce fit'], 'doce',
 array['sem açúcar refinado','vegano'],
 'Docinho enrolado só com frutas secas e castanhas.', '10 unidades', 20, 80,
 array['1 xícara de tâmaras sem caroço','1/2 xícara de castanhas (caju ou nozes)','1 colher de sopa de cacau em pó 100%','Coco ralado para envolver'],
 array['Bata as tâmaras com as castanhas e o cacau no processador.','Modele bolinhas.','Passe no coco ralado.','Gele antes de servir.'],
 'Se a massa esfarelar, junte 1 tâmara extra.', 'Contém oleaginosas.'),

(null, 'Creme gelado de maracujá', 'creme-maracuja', array['creme','maracuja','mousse','sobremesa'], 'doce',
 array['proteica','rápida'],
 'Mousse cremosa de maracujá sem leite condensado.', '2 porções', 10, 130,
 array['1 xícara de iogurte natural gelado','Polpa de 1 maracujá','Adoçante a gosto','Sementes de maracujá para decorar'],
 array['Bata o iogurte com a polpa e o adoçante.','Prove e ajuste o doce.','Sirva gelado, decorado com as sementes.'],
 'Congelar por 1 hora deixa com textura de sorvete.', 'Contém derivados de leite.'),

-- ---------------- BEBIDAS ----------------
(null, 'Chá anti-inflamatório de cúrcuma e gengibre', 'cha-curcuma-gengibre', array['cha','curcuma','gengibre','anti-inflamatorio'], 'bebida',
 array['anti-inflamatório','sem cafeína'],
 'Infusão morna de cúrcuma e gengibre com limão.', '1 xícara', 10, 15,
 array['1 xícara de água','1/2 colher de chá de cúrcuma em pó','1 rodela de gengibre','Suco de 1/2 limão','1 pitada de pimenta-do-reino'],
 array['Ferva a água com o gengibre e a cúrcuma por 5 minutos.','Desligue e junte o limão e a pimenta.','Coe e beba morno.'],
 'A pimenta ajuda o corpo a aproveitar a cúrcuma.', null),

(null, 'Smoothie de frutas vermelhas', 'smoothie-frutas-vermelhas', array['smoothie','frutas vermelhas','vitamina'], 'bebida',
 array['antioxidante','rápida'],
 'Smoothie cremoso e antioxidante em 5 minutos.', '1 copo', 5, 160,
 array['1 xícara de frutas vermelhas congeladas','1/2 banana','1/2 xícara de iogurte natural','Água ou bebida vegetal para bater'],
 array['Bata tudo no liquidificador até ficar cremoso.','Ajuste o líquido para a textura desejada.','Sirva na hora.'],
 'Congelar as frutas deixa o smoothie mais encorpado.', 'Contém derivados de leite.'),

(null, 'Suco verde detox', 'suco-verde-detox', array['suco verde','detox','couve'], 'bebida',
 array['fibras','clorofila'],
 'Suco verde leve com couve, limão e maçã.', '1 copo grande', 5, 90,
 array['1 folha de couve sem talo','1 maçã','Suco de 1/2 limão','200 ml de água de coco ou água','1 pedaço pequeno de gengibre'],
 array['Bata todos os ingredientes no liquidificador.','Coe se preferir mais leve.','Beba imediatamente para aproveitar os nutrientes.'],
 'Beber logo após bater preserva mais vitaminas.', null),

(null, 'Golden milk (leite dourado)', 'golden-milk', array['golden milk','leite dourado','curcuma'], 'bebida',
 array['anti-inflamatório','reconfortante'],
 'Bebida quente e reconfortante de cúrcuma.', '1 xícara', 10, 90,
 array['1 xícara de leite ou bebida vegetal','1/2 colher de chá de cúrcuma','1 pitada de canela e pimenta-do-reino','Adoçante a gosto'],
 array['Aqueça o leite com a cúrcuma, a canela e a pimenta.','Mexa bem, sem deixar ferver.','Adoce a gosto e beba quente.'],
 'Ótima para o fim da tarde ou antes de dormir.', 'Pode conter derivados de leite (conforme a bebida).'),

(null, 'Água aromatizada de limão e hortelã', 'agua-aromatizada', array['agua aromatizada','detox','hortela','limao'], 'bebida',
 array['sem açúcar','hidratante'],
 'Água saborizada para beber mais ao longo do dia.', '1 jarra', 5, 5,
 array['1 litro de água','1/2 limão em rodelas','Folhas de hortelã','Rodelas de pepino (opcional)'],
 array['Coloque o limão, a hortelã e o pepino na jarra.','Complete com a água.','Leve à geladeira por 1 hora antes de beber.'],
 'Uma jarra na geladeira ajuda a bater a meta de água.', null)

on conflict (slug) where (nutricionista_id is null)
do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  tags = excluded.tags, resumo = excluded.resumo, porcoes = excluded.porcoes,
  tempo_min = excluded.tempo_min, kcal_porcao = excluded.kcal_porcao,
  ingredientes = excluded.ingredientes, modo_preparo = excluded.modo_preparo,
  dica = excluded.dica, atencao = excluded.atencao, updated_at = now();

notify pgrst, 'reload schema';

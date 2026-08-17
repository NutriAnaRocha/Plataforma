-- ============================================================
--  Plataforma Nutri — Migração 0064
--  Receitas — lote 4 (50 receitas novas para a base curada)
--
--  18 refeições · 14 café/lanche · 9 doces · 9 bebidas
--
--  Conteúdo AUTORAL. Reexecutável (upsert pelo slug da base).
--  kcal e proteína são ESTIMATIVAS por porção, para orientar o encaixe
--  no plano — não substituem cálculo do alimento pesado.
-- ============================================================

insert into public.ic_receitas
  (nutricionista_id, nome, slug, sinonimos, categoria, tags, resumo, porcoes, tempo_min, kcal_porcao, proteina_g, ingredientes, modo_preparo, dica, atencao)
values

-- ============================================================
--  REFEIÇÕES
-- ============================================================

(null, 'Frango xadrez fit', 'frango-xadrez-fit', array['frango xadrez','xadrez','frango oriental'], 'refeicao',
 array['proteica','rápida','almoço'],
 'O xadrez do restaurante chinês, sem o açúcar e sem o excesso de óleo.', '3 porções', 25, 310, 32,
 array['500 g de peito de frango em cubos','1 pimentão vermelho e 1 verde em cubos','1 cebola em cubos grandes','50 g de castanha de caju sem sal','2 colheres de sopa de shoyu com baixo sódio','1 colher de chá de amido de milho dissolvido em 1/2 xícara de água','1 dente de alho','1 colher de sopa de azeite'],
 array['Tempere o frango com alho, um pouco de shoyu e pimenta e deixe 15 minutos.','Doure o frango em fogo alto no azeite, em duas levas, para selar em vez de cozinhar. Reserve.','Na mesma panela, salteie a cebola e os pimentões por 3 minutos — devem ficar firmes.','Volte o frango, junte o shoyu e o amido dissolvido e mexa até engrossar.','Desligue e misture a castanha na hora de servir.'],
 'Panela cheia cozinha no vapor e solta água. Doure o frango em duas levas: é o que dá a casquinha.', 'Contém castanha e soja (shoyu, com glúten se não for tamari).'),

(null, 'Strogonoff de frango leve', 'strogonoff-frango-leve', array['strogonoff','estrogonofe','estrogonofe de frango'], 'refeicao',
 array['proteica','sem creme de leite','almoço'],
 'Cremoso com iogurte natural no lugar do creme de leite.', '4 porções', 30, 290, 33,
 array['600 g de peito de frango em tiras','1 xícara de iogurte natural integral','2 colheres de sopa de extrato de tomate','200 g de champignon fatiado','1 cebola picada','1 dente de alho','1 colher de sopa de mostarda','1 colher de sopa de azeite','Sal e pimenta a gosto'],
 array['Doure o frango temperado no azeite em fogo alto e reserve.','Refogue a cebola e o alho, junte o champignon e cozinhe até soltar e evaporar a água.','Volte o frango, acrescente o extrato de tomate e a mostarda e cozinhe 5 minutos.','Desligue o fogo, espere baixar a fervura e só então misture o iogurte.'],
 'Iogurte em fogo alto talha. Sempre com a panela desligada e mexendo devagar.', 'Contém derivados de leite.'),

(null, 'Omelete de forno com legumes', 'omelete-de-forno', array['omelete','omelete de forno','fritada','torta de ovo'], 'refeicao',
 array['proteica','low carb','marmita'],
 'Uma omelete grande assada, que rende a semana inteira.', '4 porções', 40, 200, 18,
 array['6 ovos','1 abobrinha ralada','1 cenoura ralada','1/2 cebola picada','100 g de queijo minas em cubos','2 colheres de sopa de leite ou bebida vegetal','Cheiro-verde, sal e pimenta a gosto'],
 array['Esprema a abobrinha ralada num pano para tirar a água — esse passo evita a omelete encharcada.','Bata os ovos com o leite e os temperos.','Misture os legumes e o queijo.','Despeje numa forma untada e asse a 180°C por 25–30 minutos, até firmar no centro.'],
 'Assada em forminhas de muffin vira lanche de bolsa: 15 minutos de forno e pronto.', 'Contém ovo e derivados de leite.'),

(null, 'Peixe no papelote', 'peixe-no-papelote', array['peixe no papel','papelote','peixe assado'], 'refeicao',
 array['proteica','low carb','forno','pouca louça'],
 'Peixe assado no papel-alumínio com legumes: cozinha no próprio vapor.', '2 porções', 30, 280, 34,
 array['2 filés de tilápia, merluza ou saint peter (150 g cada)','1 tomate em rodelas','1/2 cebola em rodelas','1 abobrinha em rodelas finas','Suco de 1 limão','1 colher de sopa de azeite','Sal, pimenta e ervas (alecrim ou tomilho)'],
 array['Tempere os filés com limão, sal e pimenta e deixe 10 minutos.','Monte cada papelote: legumes embaixo, peixe por cima, fio de azeite e ervas.','Feche o papel-alumínio bem, sem deixar abertura para o vapor escapar.','Asse a 200°C por 20 minutos e sirva no próprio papelote.'],
 'Legumes embaixo protegem o peixe do calor direto e ele não resseca.', 'Peixe.'),

(null, 'Almôndegas ao molho de tomate', 'almondegas-molho-tomate', array['almôndega','almondegas','bolinho de carne'], 'refeicao',
 array['proteica','congela bem','almoço'],
 'Almôndegas assadas, não fritas, cozidas no molho caseiro.', '4 porções', 45, 320, 30,
 array['500 g de patinho moído','1 ovo','3 colheres de sopa de aveia em flocos finos','1/2 cebola ralada','1 dente de alho amassado','Salsinha, sal e pimenta a gosto','Molho: 2 xícaras de tomate pelado, 1 dente de alho, 1 colher de sopa de azeite, manjericão'],
 array['Misture a carne, o ovo, a aveia, a cebola e os temperos com as mãos, sem sovar demais.','Modele bolinhas do tamanho de uma noz e asse a 200°C por 15 minutos.','Prepare o molho: refogue o alho no azeite, junte o tomate e cozinhe 15 minutos.','Transfira as almôndegas para o molho e cozinhe 10 minutos em fogo baixo.'],
 'A aveia substitui a farinha de rosca e dá liga igual. Congele cruas, já modeladas.', 'Contém ovo e glúten (aveia, salvo se certificada sem glúten).'),

(null, 'Chili de carne com feijão', 'chili-carne-feijao', array['chili','chilli','carne com feijão'], 'refeicao',
 array['proteica','fibras','congela bem'],
 'Prato único de carne, feijão e legumes — sustenta e rende.', '5 porções', 50, 330, 26,
 array['400 g de patinho moído','2 xícaras de feijão carioca ou preto cozido','1 lata de tomate pelado','1 cebola picada','1 pimentão picado','2 dentes de alho','1 colher de chá de páprica defumada','1 colher de chá de cominho','Pimenta, sal e azeite a gosto'],
 array['Doure a carne em fogo alto até secar a água que ela solta.','Junte a cebola, o alho e o pimentão e refogue 5 minutos.','Acrescente os temperos secos e deixe fritar 30 segundos — é o que libera o aroma.','Junte o tomate e o feijão com um pouco do caldo e cozinhe 25 minutos em fogo baixo.'],
 'Melhora de um dia para o outro. Rende 5 marmitas e congela por até 3 meses.', null),

(null, 'Yakisoba de legumes com frango', 'yakisoba-legumes', array['yakisoba','macarrão oriental','yakissoba'], 'refeicao',
 array['proteica','vegetais','rápida'],
 'Macarrão integral com muito legume e pouco molho.', '3 porções', 25, 400, 28,
 array['200 g de macarrão integral','400 g de peito de frango em tiras','1 cenoura em tiras','1 xícara de brócolis','1 xícara de repolho fatiado','1/2 pimentão','2 colheres de sopa de shoyu com baixo sódio','1 colher de chá de gengibre ralado','1 colher de sopa de óleo de gergelim ou azeite'],
 array['Cozinhe o macarrão al dente, escorra e passe água fria para parar o cozimento.','Doure o frango em fogo alto e reserve.','Salteie os legumes por ordem de firmeza: cenoura e brócolis primeiro, repolho e pimentão por último.','Volte o frango e o macarrão, regue com o shoyu e o gengibre e misture por 1 minuto.'],
 'Legume de yakisoba tem que estourar entre os dentes. Fogo alto e panela larga.', 'Contém glúten e soja.'),

(null, 'Arroz de couve-flor', 'arroz-de-couve-flor', array['arroz de couve flor','couve-flor ralada','arroz low carb'], 'refeicao',
 array['low carb','acompanhamento','vegetariana'],
 'Substituto do arroz com um terço das calorias.', '4 porções', 15, 60, 3,
 array['1 couve-flor média','1/2 cebola picada','1 dente de alho','1 colher de sopa de azeite','Sal, pimenta e cheiro-verde a gosto'],
 array['Passe os buquês de couve-flor no processador em pulsos rápidos, até virarem grãos do tamanho de arroz.','Refogue a cebola e o alho no azeite.','Junte a couve-flor e salteie por 5 minutos, em panela destampada.','Tempere e finalize com cheiro-verde.'],
 'Panela tampada faz a couve-flor cozinhar no vapor e virar papa. Sempre destampada.', null),

(null, 'Quibe assado de forno', 'quibe-assado', array['quibe','kibe','quibe de forno'], 'refeicao',
 array['proteica','forno','congela bem'],
 'Quibe de travessa, assado em vez de frito.', '6 porções', 60, 250, 22,
 array['1 xícara de trigo para quibe','500 g de patinho moído','1 cebola pequena ralada','1/2 xícara de hortelã picada','Suco de 1 limão','Sal, pimenta síria e canela a gosto','1 colher de sopa de azeite'],
 array['Hidrate o trigo em água fria por 30 minutos e esprema muito bem.','Misture o trigo escorrido com a carne, a cebola, a hortelã, o limão e os temperos.','Espalhe numa assadeira, marque losangos com a faca e regue com azeite.','Asse a 200°C por 35–40 minutos, até dourar por cima.'],
 'Trigo mal escorrido deixa o quibe borrachudo. Esprema com as duas mãos, com força.', 'Contém glúten.'),

(null, 'Abobrinha recheada com atum', 'abobrinha-recheada-atum', array['abobrinha recheada','barquete de abobrinha'], 'refeicao',
 array['low carb','proteica','forno'],
 'Barquinhas de abobrinha com recheio de atum gratinado.', '2 porções', 35, 260, 25,
 array['2 abobrinhas médias','1 lata de atum em água, escorrido','1/2 cebola picada','1 tomate sem sementes picado','2 colheres de sopa de requeijão light','50 g de queijo muçarela ralado','Azeite, sal e orégano a gosto'],
 array['Corte as abobrinhas ao meio no comprimento e retire o miolo com uma colher, formando barquinhas.','Pique o miolo e refogue com a cebola e o tomate.','Misture o atum e o requeijão ao refogado e tempere.','Recheie as abobrinhas, cubra com o queijo e asse a 200°C por 20 minutos.'],
 'Pré-asse as barquinhas vazias por 10 minutos se quiser a abobrinha bem macia.', 'Contém peixe e derivados de leite.'),

(null, 'Sopa de legumes com frango', 'sopa-legumes-frango', array['sopa','sopa de legumes','canja de legumes'], 'refeicao',
 array['jantar leve','fibras','congela bem'],
 'Jantar leve e quente, com proteína suficiente para sustentar a noite.', '4 porções', 40, 220, 24,
 array['400 g de peito de frango','1 cenoura em cubos','1 chuchu em cubos','1 abobrinha em cubos','1 batata pequena em cubos','1 talo de salsão (opcional)','1 cebola e 2 dentes de alho','1,5 litro de água','Sal, pimenta e cheiro-verde'],
 array['Refogue a cebola e o alho no fundo da panela.','Junte o frango inteiro e a água e cozinhe 20 minutos.','Retire o frango, desfie e devolve à panela.','Acrescente os legumes e cozinhe mais 15 minutos, até ficarem macios sem desmanchar.','Ajuste o sal e finalize com cheiro-verde.'],
 'Sopa sem proteína dá fome às 22h. O frango desfiado é o que segura a noite.', null),

(null, 'Moqueca de peixe', 'moqueca-de-peixe', array['moqueca','peixe ao leite de coco'], 'refeicao',
 array['proteica','sem glúten','almoço'],
 'Moqueca caprichada, com leite de coco e sem azeite de dendê em excesso.', '4 porções', 40, 330, 30,
 array['600 g de filé de peixe branco em postas','200 ml de leite de coco','1 pimentão vermelho e 1 amarelo em rodelas','2 tomates em rodelas','1 cebola em rodelas','2 dentes de alho','Suco de 1 limão','1 colher de sopa de azeite','Coentro, sal e pimenta a gosto'],
 array['Tempere o peixe com limão, alho, sal e pimenta e deixe 20 minutos.','Monte a panela em camadas: azeite, cebola, tomate, pimentão e o peixe por cima.','Regue com o leite de coco e tampe.','Cozinhe em fogo baixo por 20 minutos, sem mexer — só balance a panela.','Finalize com coentro fresco.'],
 'Não mexa com colher: o peixe desmancha. Balançar a panela pelo cabo já distribui o caldo.', 'Peixe.'),

(null, 'Torta de legumes de liquidificador', 'torta-legumes-liquidificador', array['torta salgada','torta de liquidificador','torta de legumes'], 'refeicao',
 array['prática','vegetariana','forno'],
 'Massa batida no liquidificador, recheio de legumes — 10 minutos de trabalho.', '8 fatias', 55, 210, 9,
 array['Massa: 3 ovos, 1 xícara de leite, 1/2 xícara de azeite, 1,5 xícara de farinha de aveia ou integral, 1 colher de sopa de fermento, sal','Recheio: 1 cenoura ralada, 1 xícara de brócolis picado, 1 tomate picado, 1/2 cebola, 100 g de queijo minas em cubos','Orégano a gosto'],
 array['Refogue rapidamente os legumes do recheio e deixe esfriar.','Bata todos os itens da massa no liquidificador, deixando o fermento por último, batido em pulsos.','Despeje metade da massa na forma untada, distribua o recheio e cubra com o resto.','Asse a 180°C por 40 minutos.'],
 'Recheio quente na massa crua faz a torta solar. Espere esfriar.', 'Contém ovo, glúten e derivados de leite.'),

(null, 'Salada de grão-de-bico com atum', 'salada-grao-de-bico', array['salada de grão de bico','salada proteica','salada fria'], 'refeicao',
 array['proteica','fibras','marmita fria'],
 'Salada que é refeição: fibra, proteína e nada de murchar na marmita.', '3 porções', 15, 340, 24,
 array['2 xícaras de grão-de-bico cozido','1 lata de atum em água, escorrido','1 tomate sem sementes picado','1/2 cebola roxa em cubinhos','1/2 pepino picado','Suco de 1 limão','2 colheres de sopa de azeite','Salsinha, sal e pimenta'],
 array['Deixe a cebola roxa de molho em água gelada por 10 minutos para tirar o ardido.','Misture todos os ingredientes numa tigela.','Tempere com limão, azeite, sal e pimenta e leve à geladeira por 30 minutos antes de servir.'],
 'Fica melhor no dia seguinte e não murcha: é a salada certa para levar de casa.', 'Contém peixe.'),

(null, 'Panqueca integral de carne moída', 'panqueca-integral-carne', array['panqueca salgada','panqueca de carne','panqueca integral'], 'refeicao',
 array['proteica','forno','congela bem'],
 'A panqueca da infância com massa integral e recheio magro.', '4 porções (8 panquecas)', 50, 350, 27,
 array['Massa: 2 ovos, 1 xícara de leite, 3/4 xícara de farinha integral, 1 colher de sopa de azeite, sal','Recheio: 400 g de patinho moído, 1 cebola, 2 dentes de alho, 1 xícara de molho de tomate','Cobertura: 1 xícara de molho de tomate e orégano'],
 array['Bata os itens da massa no liquidificador e deixe descansar 15 minutos.','Faça discos finos em frigideira antiaderente quente, dourando dos dois lados.','Refogue a carne com a cebola e o alho, junte o molho e apure.','Recheie, enrole, disponha num refratário, cubra com molho e leve ao forno a 180°C por 15 minutos.'],
 'Descansar a massa 15 minutos hidrata a farinha integral e a panqueca para de rasgar.', 'Contém ovo, glúten e leite.'),

(null, 'Cozido de carne com legumes', 'cozido-carne-legumes', array['cozido','carne de panela','carne cozida com legumes'], 'refeicao',
 array['proteica','panela de pressão','congela bem'],
 'Carne macia desmanchando, com os legumes cozidos no próprio caldo.', '5 porções', 60, 350, 32,
 array['700 g de músculo ou acém em cubos','2 cenouras em rodelas grossas','1 mandioquinha ou batata-doce em pedaços','1 chuchu em cubos','1 cebola e 3 dentes de alho','2 folhas de louro','1 colher de sopa de azeite','Sal, pimenta e cheiro-verde'],
 array['Doure a carne em levas na pressão aberta, com o azeite — a cor vem daí.','Junte cebola, alho e louro e refogue.','Cubra com água quente, tampe e cozinhe 25 minutos na pressão.','Abra, junte os legumes e cozinhe destampado até ficarem macios e o caldo encorpar.'],
 'Legume junto desde o começo vira purê. Entra sempre depois que a carne já está macia.', null),

(null, 'Frango ao curry com leite de coco', 'frango-ao-curry', array['curry','frango com curry','frango indiano'], 'refeicao',
 array['proteica','sem lactose','almoço'],
 'Molho amarelo cremoso, sem creme de leite e sem farinha.', '4 porções', 30, 340, 31,
 array['600 g de peito de frango em cubos','200 ml de leite de coco','1 cebola picada','2 dentes de alho','1 colher de chá de gengibre ralado','1 colher de sopa de curry em pó','1/2 colher de chá de cúrcuma','1 colher de sopa de azeite','Sal e coentro a gosto'],
 array['Doure o frango temperado no azeite e reserve.','Refogue a cebola, o alho e o gengibre.','Junte o curry e a cúrcuma e frite os temperos por 30 segundos.','Volte o frango, acrescente o leite de coco e cozinhe 10 minutos em fogo baixo até encorpar.'],
 'Fritar o curry no óleo antes do líquido tira o gosto de pó e escurece o molho na medida.', null),

(null, 'Escondidinho de couve-flor com frango', 'escondidinho-couve-flor', array['escondidinho','escondidinho low carb','purê de couve-flor com frango'], 'refeicao',
 array['low carb','proteica','forno'],
 'Purê de couve-flor no lugar da batata, com frango desfiado embaixo.', '4 porções', 45, 280, 30,
 array['1 couve-flor média','500 g de peito de frango cozido e desfiado','1 cebola e 2 dentes de alho','1 xícara de molho de tomate','2 colheres de sopa de requeijão light','50 g de queijo ralado','Sal, pimenta e noz-moscada'],
 array['Cozinhe a couve-flor no vapor até ficar bem macia e escorra muito bem.','Bata com o requeijão, sal, pimenta e noz-moscada até virar um purê liso.','Refogue a cebola e o alho, junte o frango e o molho e apure.','Monte: frango embaixo, purê por cima, queijo ralado e forno a 200°C por 20 minutos.'],
 'Couve-flor cozida na água encharca o purê. Vapor, e escorra numa peneira por 5 minutos.', 'Contém derivados de leite.'),

-- ============================================================
--  CAFÉ E LANCHES
-- ============================================================

(null, 'Pão integral caseiro', 'pao-integral-caseiro', array['pão integral','pão caseiro','pão de forma integral'], 'cafe-lanche',
 array['integral','fibras','forno'],
 'Pão de forma integral de verdade, sem conservante e sem açúcar escondido.', '15 fatias', 180, 130, 5,
 array['3 xícaras de farinha de trigo integral','1 xícara de farinha de trigo branca','10 g de fermento biológico seco','1,5 xícara de água morna','2 colheres de sopa de azeite','1 colher de sopa de mel ou melado','1 colher de chá de sal'],
 array['Dissolva o fermento na água morna com o mel e espere 10 minutos espumar.','Misture as farinhas e o sal, junte o líquido e o azeite e sove por 10 minutos.','Deixe crescer coberto por 1 hora, até dobrar.','Modele, coloque na forma untada e deixe crescer mais 40 minutos.','Asse a 180°C por 35–40 minutos; o pão está pronto quando soa oco ao bater no fundo.'],
 'Água morna, nunca quente: acima de 45°C o fermento morre e o pão não cresce.', 'Contém glúten.'),

(null, 'Granola caseira sem açúcar', 'granola-caseira', array['granola','granola caseira','cereal caseiro'], 'cafe-lanche',
 array['sem açúcar','fibras','rende muito'],
 'Granola crocante adoçada só com a fruta e um fio de mel.', '10 porções de 40 g', 40, 190, 5,
 array['3 xícaras de aveia em flocos grossos','1/2 xícara de castanhas picadas','1/4 xícara de sementes (girassol, abóbora)','2 colheres de sopa de coco ralado sem açúcar','3 colheres de sopa de óleo de coco derretido','3 colheres de sopa de mel ou melado','1 colher de chá de canela','1 pitada de sal'],
 array['Misture os secos numa tigela grande.','Regue com o óleo de coco e o mel e misture até tudo ficar úmido.','Espalhe numa assadeira em camada fina e asse a 150°C por 25–30 minutos, mexendo na metade.','Deixe esfriar completamente na assadeira antes de guardar — é esfriando que fica crocante.'],
 'Guarde em pote de vidro bem fechado: dura 3 semanas. Fruta seca entra só depois de assar.', 'Contém glúten (aveia) e oleaginosas.'),

(null, 'Barrinha de cereal caseira', 'barrinha-cereal-caseira', array['barrinha','barra de cereal','barrinha de aveia'], 'cafe-lanche',
 array['sem açúcar','lanche de bolsa','fibras'],
 'A barrinha da bolsa, sem xarope de glicose na lista.', '10 barrinhas', 35, 160, 4,
 array['1,5 xícara de aveia em flocos','1/2 xícara de tâmaras sem caroço','1/2 xícara de castanhas picadas','3 colheres de sopa de pasta de amendoim integral','2 colheres de sopa de mel','1 colher de sopa de semente de chia','1 pitada de sal'],
 array['Bata as tâmaras no processador até formar uma pasta.','Misture com a pasta de amendoim e o mel levemente aquecidos.','Incorpore a aveia, as castanhas, a chia e o sal, apertando bem a massa.','Espalhe numa forma forrada, comprimindo com força, e leve à geladeira por 2 horas.','Corte em barras e embrulhe individualmente.'],
 'Se esfarelar ao cortar, faltou compressão: use o fundo de um copo para prensar.', 'Contém amendoim, oleaginosas e glúten (aveia).'),

(null, 'Patê de atum', 'pate-de-atum', array['patê de atum','pasta de atum','creme de atum'], 'cafe-lanche',
 array['proteica','rápida','low carb'],
 'Recheio de sanduíche ou pasta para vegetais, pronto em 5 minutos.', '4 porções', 5, 110, 13,
 array['1 lata de atum em água, escorrido','3 colheres de sopa de iogurte natural','1 colher de sopa de requeijão light','1/4 de cebola bem picada','1 colher de sopa de salsinha','Suco de 1/2 limão','Sal e pimenta a gosto'],
 array['Amasse o atum com um garfo.','Misture o iogurte, o requeijão, a cebola e a salsinha.','Tempere com limão, sal e pimenta e leve à geladeira por 20 minutos antes de servir.'],
 'Escorra o atum apertando na própria tampa: patê aguado não gruda no pão.', 'Contém peixe e derivados de leite.'),

(null, 'Patê de ricota com ervas', 'pate-ricota-ervas', array['patê de ricota','pasta de ricota','requeijão caseiro de ricota'], 'cafe-lanche',
 array['proteica','low carb','rápida'],
 'Substituto caseiro do requeijão, com metade da gordura.', '6 porções', 10, 70, 7,
 array['250 g de ricota fresca','3 colheres de sopa de iogurte natural','1 colher de sopa de azeite','1 dente de alho pequeno','Cebolinha, salsinha e orégano a gosto','Sal e pimenta'],
 array['Bata a ricota com o iogurte, o azeite e o alho no processador até ficar liso.','Junte as ervas picadas e misture com a espátula.','Ajuste o sal e guarde em pote fechado por até 4 dias.'],
 'Um fio de água gelada no processador deixa a textura igual à do requeijão cremoso.', 'Contém derivados de leite.'),

(null, 'Waffle de aveia', 'waffle-de-aveia', array['waffle','waffle fit','waffle integral'], 'cafe-lanche',
 array['proteica','sem açúcar','café da manhã'],
 'Waffle de aveia e ovo, doce ou salgado.', '2 unidades', 15, 230, 15,
 array['2 ovos','1/2 xícara de farinha de aveia','1/2 banana amassada (ou 2 colheres de sopa de leite, na versão salgada)','1 colher de chá de fermento em pó','1 pitada de canela e sal'],
 array['Bata tudo com um garfo até homogêneo e deixe descansar 5 minutos.','Aqueça bem a máquina de waffle e unte levemente.','Despeje a massa e asse por 4–5 minutos, sem abrir antes.','Sirva com fruta, iogurte ou pasta de amendoim.'],
 'Abrir a máquina cedo rasga o waffle ao meio. Espere parar de sair vapor.', 'Contém ovo e glúten (aveia).'),

(null, 'Muffin de banana com aveia', 'muffin-banana-aveia', array['muffin','muffin de banana','bolinho de banana'], 'cafe-lanche',
 array['sem açúcar','sem farinha branca','lanche de bolsa'],
 'Bolinho individual de banana, adoçado só pela fruta.', '12 unidades', 35, 120, 4,
 array['3 bananas bem maduras','2 ovos','1,5 xícara de farinha de aveia','1/4 xícara de óleo de coco ou azeite suave','1 colher de sopa de fermento em pó','1 colher de chá de canela','1/4 xícara de nozes ou gotas de chocolate 70% (opcional)'],
 array['Amasse as bananas e misture os ovos e o óleo.','Incorpore a farinha de aveia, a canela e, por último, o fermento.','Distribua em forminhas de muffin até 3/4 da altura.','Asse a 180°C por 20–25 minutos.'],
 'Quanto mais preta a banana, mais doce o muffin. Congelam bem já assados.', 'Contém ovo e glúten (aveia).'),

(null, 'Sanduíche natural de frango', 'sanduiche-natural-frango', array['sanduíche natural','sanduba','lanche natural'], 'cafe-lanche',
 array['proteica','lanche de bolsa','rápida'],
 'O clássico da lanchonete, feito em casa e sem maionese industrializada.', '1 unidade', 10, 320, 26,
 array['2 fatias de pão integral','100 g de frango desfiado','2 colheres de sopa de iogurte natural','1 colher de chá de mostarda','1 cenoura ralada','Folhas de alface','Sal, pimenta e cheiro-verde'],
 array['Misture o frango com o iogurte, a mostarda, a cenoura e os temperos.','Monte o sanduíche com a alface entre o pão e o recheio.','Embrulhe firme em papel-manteiga se for levar.'],
 'A folha de alface funciona como barreira: o pão não umedece até a hora do lanche.', 'Contém glúten e derivados de leite.'),

(null, 'Homus de grão-de-bico', 'homus', array['homus','húmus','hommus','pasta de grão de bico'], 'cafe-lanche',
 array['vegana','fibras','proteína vegetal'],
 'Pasta cremosa de grão-de-bico para comer com legumes ou pão integral.', '6 porções', 15, 140, 6,
 array['2 xícaras de grão-de-bico cozido','2 colheres de sopa de tahine (pasta de gergelim)','Suco de 1 limão','1 dente de alho','2 colheres de sopa de azeite','1/2 colher de chá de cominho','Sal a gosto','Água gelada para ajustar'],
 array['Bata no processador o grão-de-bico, o tahine, o limão, o alho e o cominho.','Acrescente água gelada aos poucos, com o processador ligado, até virar um creme liso.','Ajuste o sal, sirva com um fio de azeite e páprica por cima.'],
 'Tirar a pele do grão-de-bico dá trabalho, mas é o que separa um homus bom de um homus sedoso.', 'Contém gergelim.'),

(null, 'Guacamole', 'guacamole', array['guacamole','pasta de abacate','avocado'], 'cafe-lanche',
 array['vegana','gordura boa','rápida'],
 'Abacate temperado — gordura boa que segura a fome da tarde.', '4 porções', 10, 150, 2,
 array['1 avocado ou 1/2 abacate maduro','1 tomate sem sementes picado','1/4 de cebola roxa bem picada','Suco de 1 limão','Coentro picado a gosto','Sal e pimenta'],
 array['Amasse o abacate com o garfo, deixando pedaços — guacamole não é purê.','Misture o limão imediatamente, para não escurecer.','Junte o tomate, a cebola e o coentro e tempere.'],
 'Guardar com o caroço dentro é lenda; o que evita escurecer é filme plástico encostado na superfície.', null),

(null, 'Pipoca temperada de panela', 'pipoca-temperada', array['pipoca','pipoca de panela','pipoca fit'], 'cafe-lanche',
 array['fibras','lanche da noite','integral'],
 'Pipoca de panela com pouco óleo — cereal integral e barato.', '2 porções', 10, 130, 3,
 array['1/4 xícara de milho de pipoca','1 colher de sopa de azeite ou óleo de coco','Sal a gosto','Opcional: páprica, orégano, curry ou canela'],
 array['Aqueça o óleo com 3 grãos de milho na panela tampada.','Quando os 3 estourarem, junte o resto do milho, tampe e balance a panela fora do fogo por 30 segundos.','Volte ao fogo médio e balance de vez em quando até os estouros ficarem espaçados.','Tempere fora do fogo.'],
 'Sem manteiga e sem micro-ondas de saquinho, a pipoca é lanche noturno bom: fibra e volume por poucas calorias.', null),

(null, 'Bolo de fubá fit', 'bolo-fuba-fit', array['bolo de fubá','bolo de milho','fubá'], 'cafe-lanche',
 array['sem açúcar','sem glúten','forno'],
 'Bolo de fubá com erva-doce, sem açúcar refinado e sem trigo.', '10 fatias', 50, 170, 5,
 array['3 ovos','1,5 xícara de fubá','1/2 xícara de farinha de aveia ou polvilho doce','1/2 xícara de óleo de coco ou azeite suave','1 xícara de leite ou bebida vegetal','1/2 xícara de xilitol ou adoçante forno e fogão','1 colher de sopa de fermento em pó','1 colher de chá de erva-doce'],
 array['Bata os ovos, o óleo, o leite e o adoçante no liquidificador.','Passe para a tigela e incorpore o fubá, a farinha e a erva-doce.','Misture o fermento por último.','Asse a 180°C por 35–40 minutos.'],
 'Deixe a massa descansar 10 minutos antes de assar: o fubá hidrata e o bolo fica menos arenoso.', 'Contém ovo; leva leite se não usar bebida vegetal.'),

(null, 'Wrap integral de frango', 'wrap-integral-frango', array['wrap','rap10','enrolado','tortilla integral'], 'cafe-lanche',
 array['proteica','rápida','marmita'],
 'Almoço de bolsa: enrola, embrulha e leva.', '1 unidade', 10, 340, 28,
 array['1 tortilla integral','120 g de frango grelhado desfiado','2 colheres de sopa de homus ou requeijão light','Folhas verdes','1/4 de tomate em tiras','1/4 de cenoura ralada','Sal e pimenta'],
 array['Aqueça a tortilla rapidamente na frigideira seca — isso a deixa maleável e ela para de rachar.','Espalhe o homus deixando 2 cm de borda livre.','Distribua o recheio em faixa no terço inferior.','Dobre as laterais para dentro e enrole apertado, de baixo para cima.'],
 'Recheio no meio da tortilla vaza. Sempre no terço de baixo, e as laterais dobradas antes.', 'Contém glúten.'),

(null, 'Smoothie bowl de frutas vermelhas', 'smoothie-bowl', array['smoothie bowl','tigela de smoothie','açaí bowl'], 'cafe-lanche',
 array['antioxidante','café da manhã','sem açúcar'],
 'Smoothie grosso de colher, com fruta congelada e sem açúcar.', '1 porção', 10, 300, 14,
 array['1 xícara de frutas vermelhas congeladas','1/2 banana congelada','1/2 xícara de iogurte natural','1 colher de sopa de proteína em pó ou 2 de aveia','Cobertura: granola, chia, coco ralado, fruta fresca'],
 array['Bata as frutas congeladas com o iogurte usando o mínimo de líquido possível.','Use o socador do liquidificador ou processador — a mistura tem que ficar de colher, não de canudo.','Sirva na tigela e distribua as coberturas na hora.'],
 'Fruta congelada é obrigatória. Com fruta fresca e gelo vira suco batido, não bowl.', 'Contém derivados de leite; a granola leva glúten.'),

-- ============================================================
--  DOCES
-- ============================================================

(null, 'Pudim de chia com coco', 'pudim-chia-coco', array['pudim de chia','chia pudding','chia com leite de coco'], 'doce',
 array['sem açúcar','fibras','preparo na véspera'],
 'Deixa pronto à noite e come de manhã ou de sobremesa.', '2 porções', 10, 180, 5,
 array['3 colheres de sopa de semente de chia','1 xícara de leite de coco ou bebida vegetal','1 colher de chá de mel ou adoçante','1/2 colher de chá de essência de baunilha','Fruta picada para servir'],
 array['Misture a chia, o leite, o adoçante e a baunilha num pote.','Mexa bem, espere 5 minutos e mexa de novo — esse segundo mexido é o que evita os grumos.','Tampe e leve à geladeira por no mínimo 4 horas.','Sirva com fruta picada por cima.'],
 'Proporção que nunca falha: 3 colheres de chia para 1 xícara de líquido.', null),

(null, 'Banana assada com canela', 'banana-assada-canela', array['banana assada','banana no forno','sobremesa de banana'], 'doce',
 array['sem açúcar','2 ingredientes','rápida'],
 'Duas bananas, canela e forno: a sobremesa mais simples que existe.', '2 porções', 25, 120, 1,
 array['2 bananas maduras','Canela em pó a gosto','1 colher de chá de mel (opcional)','Opcional: castanhas picadas'],
 array['Corte as bananas ao meio no comprimento, sem descascar.','Coloque num refratário, polvilhe canela e regue com o mel.','Asse a 200°C por 20 minutos, até a casca escurecer e a polpa borbulhar.','Sirva quente, com castanhas por cima.'],
 'Assar com a casca concentra o açúcar da fruta e ela fica doce como doce de compota.', null),

(null, 'Maçã assada recheada', 'maca-assada', array['maçã assada','maça assada','sobremesa de maçã'], 'doce',
 array['sem açúcar','fibras','forno'],
 'Maçã de forno com recheio de aveia e castanha — sobremesa quente de inverno.', '2 porções', 40, 190, 3,
 array['2 maçãs','2 colheres de sopa de aveia em flocos','1 colher de sopa de castanhas picadas','1 colher de chá de mel','Canela e cravo a gosto','1 colher de chá de óleo de coco'],
 array['Retire o miolo das maçãs com uma faca, sem furar o fundo.','Misture a aveia, as castanhas, o mel, o óleo de coco e a canela.','Recheie as maçãs e coloque num refratário com um dedo de água.','Asse a 180°C por 30 minutos, até a maçã ficar macia ao espetar.'],
 'A água no fundo da assadeira faz a maçã cozinhar no vapor e não ressecar.', 'Contém oleaginosas e glúten (aveia).'),

(null, 'Brownie funcional de feijão preto', 'brownie-funcional', array['brownie','brownie fit','brownie de feijão'], 'doce',
 array['sem glúten','proteína vegetal','forno'],
 'Ninguém percebe o feijão — e ele é quem dá a textura molhadinha.', '12 pedaços', 45, 150, 5,
 array['1,5 xícara de feijão preto cozido e bem escorrido','3 ovos','1/2 xícara de cacau em pó 100%','1/2 xícara de xilitol ou adoçante forno e fogão','1/4 xícara de óleo de coco','1 colher de chá de fermento em pó','1 pitada de sal','50 g de chocolate 70% picado'],
 array['Lave e escorra muito bem o feijão, até a água sair limpa.','Bata no processador o feijão, os ovos e o óleo até virar um creme totalmente liso.','Junte o cacau, o adoçante e o sal e bata de novo; misture o fermento por último.','Espalhe na forma, salpique o chocolate picado e asse a 180°C por 25–30 minutos.','Não asse demais: o brownie tem que sair com o centro úmido.'],
 'O ponto é palito saindo com farelinhas grudadas, nunca limpo.', 'Contém ovo.'),

(null, 'Nice cream de banana', 'nice-cream-banana', array['nice cream','sorvete de banana','sorvete caseiro'], 'doce',
 array['sem açúcar','1 ingrediente','vegana'],
 'Sorvete cremoso feito só de banana congelada.', '2 porções', 5, 110, 2,
 array['3 bananas maduras congeladas em rodelas','Opcional: 1 colher de sopa de cacau, pasta de amendoim ou 1/4 xícara de frutas vermelhas','2 colheres de sopa de leite ou bebida vegetal (só se precisar)'],
 array['Bata as rodelas congeladas no processador.','Nos primeiros 30 segundos vira farelo; continue batendo, raspando as laterais.','De repente a mistura vira creme — é o ponto de sorvete.','Sirva na hora ou leve ao freezer por 30 minutos para firmar.'],
 'Não jogue líquido nos primeiros 2 minutos: a paciência é o que faz virar creme, não o leite.', null),

(null, 'Beijinho funcional', 'beijinho-funcional', array['beijinho','docinho de coco','branquinho'], 'doce',
 array['sem açúcar','sem leite condensado','festa'],
 'Docinho de festa com tâmara e coco, sem leite condensado.', '15 unidades', 20, 60, 1,
 array['1 xícara de tâmaras sem caroço','1 xícara de coco ralado sem açúcar','2 colheres de sopa de leite de coco','1 pitada de sal','Coco ralado para empanar'],
 array['Deixe as tâmaras de molho em água morna por 10 minutos e escorra.','Bata no processador com o coco, o leite de coco e o sal até formar uma massa que solta das paredes.','Leve à geladeira por 30 minutos para firmar.','Enrole as bolinhas e passe no coco ralado.'],
 'Massa mole demais? Mais coco ralado e mais 20 minutos de geladeira resolvem.', null),

(null, 'Mousse de morango com iogurte', 'mousse-morango-iogurte', array['mousse de morango','mousse de iogurte','sobremesa de morango'], 'doce',
 array['proteica','sem açúcar','rápida'],
 'Mousse aerado de fruta com iogurte, sem creme de leite.', '4 porções', 15, 110, 8,
 array['2 xícaras de morangos','1 xícara de iogurte natural integral','1 colher de sopa de gelatina incolor sem sabor','3 colheres de sopa de água','Adoçante a gosto'],
 array['Hidrate a gelatina na água por 5 minutos e dissolva no micro-ondas por 15 segundos.','Bata os morangos com o iogurte e o adoçante no liquidificador.','Com o liquidificador ligado, adicione a gelatina dissolvida em fio.','Distribua em taças e leve à geladeira por 3 horas.'],
 'Gelatina fria e mistura fria formam fiapos. Dissolva morna e despeje em fio, com o motor ligado.', 'Contém derivados de leite.'),

(null, 'Bolo de cenoura fit', 'bolo-cenoura-fit', array['bolo de cenoura','bolo de cenoura fit','bolo funcional de cenoura'], 'doce',
 array['sem açúcar','sem farinha branca','forno'],
 'O bolo de cenoura de sempre, com farinha de aveia e cobertura de cacau.', '10 fatias', 50, 190, 6,
 array['2 cenouras médias','3 ovos','1/2 xícara de óleo de coco ou azeite suave','2 xícaras de farinha de aveia','1/2 xícara de xilitol ou adoçante forno e fogão','1 colher de sopa de fermento em pó','Cobertura: 2 colheres de sopa de cacau, 2 de adoçante, 3 de leite, 1 de óleo de coco'],
 array['Bata no liquidificador a cenoura picada, os ovos, o óleo e o adoçante até ficar bem liso.','Passe para a tigela e incorpore a farinha de aveia; o fermento entra por último.','Asse a 180°C por 35 minutos.','Cobertura: leve os ingredientes ao fogo baixo até engrossar e espalhe no bolo ainda morno.'],
 'Cenoura mal batida deixa fiapo. Bata até o líquido ficar completamente uniforme, sem pontinhos.', 'Contém ovo e glúten (aveia).'),

(null, 'Gelatina natural com frutas', 'gelatina-natural', array['gelatina natural','gelatina de suco','gelatina sem corante'], 'doce',
 array['sem açúcar','sem corante','leve'],
 'Gelatina de suco de fruta de verdade, sem pó colorido.', '4 porções', 15, 60, 3,
 array['500 ml de suco natural (uva integral, laranja ou abacaxi)','1 colher de sopa de gelatina incolor sem sabor','1/4 xícara de água','1 xícara de frutas picadas','Adoçante se necessário'],
 array['Hidrate a gelatina na água por 5 minutos e dissolva em banho-maria ou 15 segundos no micro-ondas.','Misture ao suco, mexendo bem.','Distribua as frutas picadas nas taças e cubra com o líquido.','Leve à geladeira por 4 horas.'],
 'Abacaxi e kiwi crus têm enzima que impede a gelatina de firmar. Se usar, ferva a fruta antes.', null),

-- ============================================================
--  BEBIDAS
-- ============================================================

(null, 'Chá de hibisco gelado', 'cha-hibisco-gelado', array['hibisco','chá gelado','chá de hibisco'], 'bebida',
 array['sem açúcar','antioxidante','refrescante'],
 'Substituto do refrigerante: gelado, ácido e com zero açúcar.', '1 litro', 15, 5, 0,
 array['2 colheres de sopa de flores secas de hibisco','1 litro de água','Suco de 1 limão','Folhas de hortelã','Gelo'],
 array['Ferva a água e desligue o fogo.','Junte o hibisco e deixe em infusão tampado por 8 minutos — mais que isso amarga.','Coe, deixe esfriar e leve à geladeira.','Sirva com limão, hortelã e gelo.'],
 'É a bebida certa para tirar o refrigerante da mesa: mesma acidez, mesma cor forte, sem açúcar.', 'Hibisco em grande quantidade pode interferir em anti-hipertensivos — moderação se houver medicação.'),

(null, 'Limonada suíça sem açúcar', 'limonada-suica', array['limonada','limonada suíça','limonada com casca'], 'bebida',
 array['sem açúcar','refrescante','rápida'],
 'A limonada cremosa da casca, adoçada sem açúcar.', '2 copos', 10, 40, 1,
 array['2 limões taiti bem lavados','500 ml de água gelada','Adoçante a gosto','Gelo'],
 array['Corte as pontas dos limões e depois em 4 partes, retirando o miolo branco central.','Bata com a água gelada por no máximo 10 segundos — mais que isso extrai o amargo da casca.','Coe imediatamente, apertando pouco.','Adoce e sirva com gelo.'],
 'Água gelada e batida curta: são os dois pontos que separam a limonada suave da amarga.', null),

(null, 'Suco de melancia com hortelã', 'suco-melancia-hortela', array['suco de melancia','melancia','suco refrescante'], 'bebida',
 array['hidratante','sem açúcar','verão'],
 'Melancia batida pura — quase toda água, sem açúcar nenhum adicionado.', '2 copos', 5, 60, 1,
 array['3 xícaras de melancia em cubos, sem sementes','8 folhas de hortelã','Suco de 1/2 limão','Gelo'],
 array['Bata a melancia com a hortelã e o limão.','Não coe: a fibra é o que segura o pico de glicose.','Sirva imediatamente com gelo.'],
 'Congele a melancia em cubos e bata sem água: vira uma bebida cremosa, quase sorvete.', null),

(null, 'Chocolate quente fit', 'chocolate-quente-fit', array['chocolate quente','achocolatado','chocolate cremoso'], 'bebida',
 array['sem açúcar','conforto','inverno'],
 'Chocolate quente cremoso com cacau puro, sem achocolatado industrializado.', '1 caneca', 10, 150, 8,
 array['200 ml de leite ou bebida vegetal','1 colher de sopa de cacau em pó 100%','1 colher de chá de amido de milho','Adoçante a gosto','1 pitada de canela e de sal'],
 array['Dissolva o cacau e o amido em 3 colheres do leite frio, formando uma pasta lisa.','Aqueça o restante do leite e junte a pasta, mexendo sempre.','Cozinhe em fogo baixo por 3 minutos, até engrossar.','Finalize com canela e uma pitada de sal.'],
 'A pitada de sal é o que faz o cacau puro deixar de ser amargo e virar chocolate.', 'Leva leite se não usar bebida vegetal.'),

(null, 'Café proteico gelado', 'cafe-proteico', array['café proteico','café gelado','protein coffee','café com whey'], 'bebida',
 array['proteica','pré-treino','rápida'],
 'Café gelado com proteína — lanche líquido de 20 g de proteína.', '1 copo', 5, 160, 22,
 array['150 ml de café coado gelado','100 ml de leite ou bebida vegetal','1 scoop de proteína em pó (baunilha ou chocolate)','Gelo','Canela a gosto'],
 array['Bata tudo no liquidificador ou na coqueteleira, com o café já frio.','Sirva com gelo e canela por cima.'],
 'Proteína em café quente empelota. O café precisa estar frio antes de encontrar o pó.', 'Contém derivados de leite se a proteína for whey.'),

(null, 'Kefir com frutas', 'kefir-com-frutas', array['kefir','quefir','bebida fermentada'], 'bebida',
 array['probiótico','intestino','café da manhã'],
 'Fermentado vivo com fruta — probiótico para o intestino.', '1 porção', 5, 160, 9,
 array['1 xícara de kefir de leite coado','1/2 banana ou 1/2 xícara de frutas vermelhas','1 colher de sopa de aveia','1 colher de chá de mel (opcional)','Canela a gosto'],
 array['Bata o kefir com a fruta rapidamente, só até misturar.','Junte a aveia e a canela.','Consuma na hora, sem aquecer.'],
 'Aquecer mata os probióticos. Kefir é sempre gelado ou em temperatura ambiente.', 'Contém derivados de leite.'),

(null, 'Suco detox de cenoura com maçã', 'suco-detox-cenoura-maca', array['suco de cenoura','suco detox','cenoura com maçã'], 'bebida',
 array['detox','antioxidante','fibras'],
 'Cenoura, maçã e gengibre — doce natural, sem açúcar adicionado.', '1 copo (300 ml)', 5, 100, 1,
 array['1 cenoura média picada','1 maçã com casca, sem sementes','1 pedaço pequeno de gengibre','Suco de 1/2 limão','200 ml de água gelada'],
 array['Bata tudo no liquidificador até ficar homogêneo.','Prefira não coar — com a fibra, o açúcar da fruta é absorvido mais devagar.','Beba na hora, antes de oxidar.'],
 'Detox não desintoxica nada: quem faz isso é o fígado. O ganho aqui é fruta, fibra e água.', null),

(null, 'Chá de camomila com erva-doce', 'cha-camomila-erva-doce', array['chá de camomila','camomila','chá calmante','erva-doce'], 'bebida',
 array['calmante','digestivo','noite'],
 'Chá da noite: acalma e ajuda a digestão do jantar.', '1 xícara', 10, 2, 0,
 array['1 colher de chá de flores de camomila','1 colher de chá de erva-doce (funcho)','200 ml de água','Rodela de limão (opcional)'],
 array['Ferva a água e desligue.','Junte as ervas, tampe e deixe em infusão por 5 minutos.','Coe e beba morno, de preferência 40 minutos antes de dormir.'],
 'Tampar a xícara durante a infusão preserva os óleos essenciais — é onde está o efeito calmante.', 'Camomila pode interagir com anticoagulantes.'),

(null, 'Smoothie de mamão com aveia', 'smoothie-mamao-aveia', array['smoothie de mamão','vitamina de mamão','mamão com aveia'], 'bebida',
 array['intestino','fibras','café da manhã'],
 'Mamão, aveia e linhaça: a combinação clássica para o intestino preso.', '1 copo grande', 5, 250, 10,
 array['1 fatia grande de mamão papaia','1 xícara de leite ou bebida vegetal','2 colheres de sopa de aveia em flocos','1 colher de sopa de linhaça dourada moída','1 colher de chá de mel (opcional)'],
 array['Bata tudo no liquidificador até ficar cremoso.','Beba na hora, para a linhaça não oxidar.'],
 'Linhaça inteira passa pelo intestino sem ser digerida. Precisa estar moída na hora.', 'Contém glúten (aveia) e leite, se não usar bebida vegetal.')

on conflict (slug) where nutricionista_id is null do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  tags = excluded.tags, resumo = excluded.resumo, porcoes = excluded.porcoes,
  tempo_min = excluded.tempo_min, kcal_porcao = excluded.kcal_porcao,
  proteina_g = excluded.proteina_g, ingredientes = excluded.ingredientes,
  modo_preparo = excluded.modo_preparo, dica = excluded.dica, atencao = excluded.atencao;

notify pgrst, 'reload schema';

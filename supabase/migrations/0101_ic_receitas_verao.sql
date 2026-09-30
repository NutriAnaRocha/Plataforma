-- ============================================================
--  Plataforma Nutri — Migração 0101 (era 0078 na nuvem; 0078 local já é mercado_analises_custo)
--  Receitas — lote VERÃO (23 receitas novas para a base curada)
--
--  7 bebidas (smoothies e sucos) · 6 doces gelados (sorvetes e picolés)
--  · 9 refeições leves (saladas, "massas" de legume, prato frio)
--  · 1 café/lanche. Todas com a tag 'verão'; no fim, a tag também
--  entra nas receitas de verão que já estavam na base (sucos detox,
--  nice cream, lasanha de berinjela, macarrão de abobrinha…), para a
--  busca "verão" trazer o cardápio inteiro.
--
--  Acompanha o modelo de plano "Verão leve e refrescante"
--  (plano-alimentar.js, id "verao", 1200/1500/1800/2000 kcal).
--
--  Conteúdo AUTORAL. Reexecutável (upsert pelo slug da base).
--  kcal e proteína são ESTIMATIVAS por porção, para orientar o encaixe
--  no plano — não substituem cálculo do alimento pesado.
-- ============================================================

insert into public.ic_receitas
  (nutricionista_id, nome, slug, sinonimos, categoria, tags, resumo, porcoes, tempo_min, kcal_porcao, proteina_g, ingredientes, modo_preparo, dica, atencao)
values

-- ============================================================
--  BEBIDAS
-- ============================================================

(null, 'Smoothie proteico de frutas vermelhas', 'smoothie-proteico-frutas-vermelhas', array['smoothie proteico','smoothie com whey','vitamina de frutas vermelhas','smoothie de frutas vermelhas congeladas'], 'bebida',
 array['verão','proteica','café da manhã','pós-treino'],
 'Frutas vermelhas congeladas, iogurte e whey: cremoso, gelado e com proteína de refeição.', '1 copo grande (400 ml)', 5, 275, 33,
 array['1 xícara (140 g) de mix de frutas vermelhas congeladas, sem açúcar','1 pote (170 g) de iogurte natural desnatado','1 dose (30 g) de whey protein baunilha ou sem sabor','1 colher de chá de chia','50 ml de água gelada ou leite desnatado'],
 array['Coloque primeiro o iogurte e a água no liquidificador — o líquido embaixo faz a fruta congelada girar.','Junte as frutas vermelhas ainda congeladas, o whey e a chia.','Bata no pulso até ficar cremoso, sem gelo inteiro.','Sirva na hora.'],
 'A fruta congelada faz o papel do gelo: o smoothie fica espesso sem aguar. Congele morango e banana maduros em porções para ter sempre à mão.', 'Contém leite (iogurte e whey). Com intolerância à lactose, use whey isolado e iogurte sem lactose.'),

(null, 'Smoothie tropical de manga, maracujá e coco', 'smoothie-tropical-manga', array['smoothie de manga','smoothie tropical','vitamina de manga','manga com maracujá'], 'bebida',
 array['verão','refrescante','hidratação','sem lactose'],
 'Manga congelada batida com água de coco e maracujá — gosto de praia, sem açúcar.', '1 copo grande (350 ml)', 5, 140, 2,
 array['1 xícara (150 g) de manga em cubos congelada','Polpa de 1 maracujá (ou 50 g de polpa congelada sem açúcar)','200 ml de água de coco gelada','4 folhas de hortelã','Gelo a gosto'],
 array['Bata a água de coco com o maracujá no pulso, só para soltar as sementes, e coe.','Volte o líquido ao liquidificador com a manga congelada e a hortelã.','Bata até ficar liso e sirva gelado.'],
 'Para virar lanche completo, bata junto 1 pote de iogurte natural ou 1 dose de whey — a proteína segura a fome até o almoço.', null),

(null, 'Smoothie verde proteico', 'smoothie-verde-proteico', array['smoothie verde','vitamina verde proteica','smoothie de abacaxi com couve'], 'bebida',
 array['verão','proteica','detox','pós-treino'],
 'O suco verde que vira refeição: abacaxi, couve, banana congelada e whey.', '1 copo grande (400 ml)', 5, 230, 26,
 array['1 fatia de abacaxi em cubos congelada','1 folha de couve sem o talo (ou 1 punhado de espinafre)','1/2 banana congelada','1 dose (30 g) de whey protein baunilha ou sem sabor','200 ml de água de coco gelada','1 rodela fina de gengibre'],
 array['Bata a couve com a água de coco primeiro, até não sobrar pedaço de folha.','Junte o abacaxi, a banana, o gengibre e o whey.','Bata até ficar cremoso e sirva na hora.'],
 'Bater a folha antes com o líquido é o que evita o smoothie com fiapo verde.', 'Contém leite (whey).'),

(null, 'Suco refrescante de melão com gengibre e limão', 'suco-melao-gengibre', array['suco de melão','melão com gengibre','suco refrescante'], 'bebida',
 array['verão','refrescante','hidratação','sem açúcar'],
 'Melão bem gelado com um toque de gengibre: leve, doce e muito hidratante.', '2 copos (300 ml cada)', 5, 70, 1,
 array['2 fatias grandes (300 g) de melão sem casca e sem sementes, gelado','Suco de 1 limão','1 rodela de gengibre (ou 1/2 colher de chá ralado)','300 ml de água gelada','Folhas de hortelã e gelo'],
 array['Bata o melão, o limão, o gengibre e a água até ficar liso.','Não precisa coar nem adoçar.','Sirva com gelo e hortelã.'],
 'Melão maduro dispensa adoçante. Escolha o que tem perfume forte na base do cabo.', null),

(null, 'Limonada de coco sem açúcar', 'limonada-de-coco', array['limonada de coco','limonada cremosa','limonada com coco'], 'bebida',
 array['verão','refrescante','sem açúcar','sem lactose'],
 'Limonada cremosa feita com água de coco — doce natural, sem leite condensado.', '2 copos (300 ml cada)', 5, 80, 1,
 array['400 ml de água de coco gelada','2 limões-taiti bem lavados','2 colheres de sopa de leite de coco','Gelo e folhas de hortelã'],
 array['Corte os limões em 4 e retire o miolo branco do centro (é o que amarga).','Bata os limões com casca, a água de coco e o leite de coco por no máximo 10 segundos, no pulso.','Coe imediatamente, apertando bem, e sirva com gelo.'],
 'Bateu demais, amargou: a casca do limão solta o amargor depois de 10 segundos. Coe na hora.', null),

(null, 'Suco de acerola com laranja e couve', 'suco-acerola-couve', array['suco de acerola','acerola com laranja','suco verde de acerola'], 'bebida',
 array['verão','vitamina C','detox','imunidade'],
 'Acerola, laranja e couve: o suco com mais vitamina C da lista, sem açúcar.', '2 copos (300 ml cada)', 5, 90, 2,
 array['1 xícara (120 g) de acerola fresca ou 2 pacotes (200 g) de polpa congelada sem açúcar','Suco de 2 laranjas','1 folha de couve sem o talo','200 ml de água gelada','Gelo a gosto'],
 array['Bata a couve com a água até dissolver bem.','Junte a acerola e o suco de laranja e bata mais 20 segundos.','Coe se preferir (perde parte da fibra) e sirva na hora.'],
 'Vitamina C oxida rápido: faça e beba. Suco guardado na geladeira perde boa parte dela em poucas horas.', null),

(null, 'Água aromatizada de frutas vermelhas e alecrim', 'agua-frutas-vermelhas', array['água saborizada','água aromatizada','infused water','água com frutas'], 'bebida',
 array['verão','hidratação','zero açúcar'],
 'Para quem não gosta de beber água pura: cor, aroma e quase nenhuma caloria.', '1 jarra (1 litro)', 5, 10, 0,
 array['1 litro de água gelada','1/2 xícara de frutas vermelhas congeladas','1 raminho de alecrim','Rodelas de 1/2 limão'],
 array['Coloque as frutas, o alecrim e o limão na jarra.','Complete com a água e leve à geladeira por pelo menos 1 hora.','Pode completar com água mais 1 vez no mesmo dia.'],
 'As frutas congeladas funcionam como gelo e soltam cor e sabor enquanto descongelam.', null),

-- ============================================================
--  DOCES GELADOS
-- ============================================================

(null, 'Sorvete proteico de chocolate', 'sorvete-proteico-chocolate', array['sorvete proteico','sorvete de whey','sorvete fit de chocolate','sorvete caseiro de chocolate'], 'doce',
 array['verão','proteica','sem açúcar','sobremesa'],
 'Banana congelada, cacau e whey batidos: textura de sorvete de massa, com proteína.', '2 porções', 10, 175, 14,
 array['2 bananas maduras cortadas em rodelas e congeladas','1 dose (30 g) de whey protein chocolate ou baunilha','2 colheres de sopa de cacau em pó 100%','3 colheres de sopa de leite desnatado ou bebida vegetal'],
 array['Congele as bananas em rodelas por no mínimo 6 horas.','Bata no processador (ou liquidificador potente) com o leite, parando para raspar as laterais.','Quando ficar cremoso, junte o whey e o cacau e bata só até misturar.','Sirva na hora como soft ou leve ao freezer por 1 hora para firmar.'],
 'Processador funciona melhor que liquidificador aqui. No liquidificador, use o pulso e um pouco mais de leite.', 'Contém leite (whey).'),

(null, 'Frozen yogurt de frutas vermelhas', 'frozen-yogurt-frutas-vermelhas', array['frozen yogurt','frozen de iogurte','sorvete de iogurte','sorvete de frutas vermelhas'], 'doce',
 array['verão','sobremesa','probiótico'],
 'Iogurte batido com frutas vermelhas congeladas: sorvete pronto em 5 minutos.', '2 porções', 5, 120, 6,
 array['2 xícaras (280 g) de mix de frutas vermelhas congeladas, sem açúcar','1 pote (170 g) de iogurte natural integral ou grego natural','1 colher de sopa de mel (opcional)','Raspas de limão (opcional)'],
 array['Bata as frutas congeladas com o iogurte no processador até formar um creme firme.','Prove e adoce com o mel só se precisar.','Sirva na hora ou leve 30 minutos ao freezer.'],
 'Iogurte grego deixa mais cremoso e com mais proteína. Sem mel, a porção cai para cerca de 90 kcal.', 'Contém leite.'),

(null, 'Picolé de iogurte com frutas vermelhas', 'picole-iogurte-frutas-vermelhas', array['picolé de iogurte','picolé caseiro','picolé fit','geladinho de iogurte'], 'doce',
 array['verão','sobremesa','criança'],
 'Picolé cremoso de iogurte com pedaços de fruta — para ter sempre no freezer.', '6 picolés', 10, 50, 3,
 array['2 potes (340 g) de iogurte natural integral','1 xícara de frutas vermelhas (frescas ou congeladas) picadas','1 colher de sopa de mel (opcional)','Essência de baunilha (opcional)'],
 array['Misture o iogurte com o mel e a baunilha.','Distribua as frutas nas forminhas e complete com o iogurte.','Dê leves batidas na forma para tirar as bolhas, coloque os palitos e congele por 6 horas.','Para desenformar, passe a forma rapidamente em água morna.'],
 'Amasse metade das frutas antes de misturar: o picolé fica rajado de cor e com sabor em todas as mordidas.', 'Contém leite.'),

(null, 'Sorvete de manga com maracujá', 'sorvete-manga-maracuja', array['sorvete de manga','sorvete de maracujá','sorvete de frutas caseiro','sorbet de manga'], 'doce',
 array['verão','sobremesa','sem lactose','vegano'],
 'Sorbet de manga congelada com polpa de maracujá — só fruta, sem açúcar.', '3 porções', 10, 110, 1,
 array['3 xícaras (450 g) de manga madura em cubos congelada','Polpa de 2 maracujás (ou 100 g de polpa congelada sem açúcar)','2 colheres de sopa de leite de coco','Suco de 1/2 limão'],
 array['Deixe a manga congelada 5 minutos fora do freezer para amolecer um pouco.','Bata no processador com o maracujá, o leite de coco e o limão até ficar liso.','Sirva na hora ou guarde em pote fechado no freezer; tire 10 minutos antes de servir.'],
 'Manga bem madura (Palmer ou Tommy) é o que adoça. Com manga verde, o sorvete fica ácido.', null),

(null, 'Picolé de melancia com limão e hortelã', 'picole-melancia-limao', array['picolé de melancia','geladinho de melancia','picolé de fruta'], 'doce',
 array['verão','hidratação','sem açúcar','vegano','criança'],
 'O picolé mais leve da lista: melancia batida com limão e hortelã.', '8 picolés', 10, 25, 0,
 array['4 xícaras (600 g) de melancia sem sementes em cubos','Suco de 1 limão','6 folhas de hortelã','1 kiwi em rodelas finas (opcional, para decorar)'],
 array['Bata a melancia com o limão e a hortelã e coe.','Se quiser, encoste uma rodela de kiwi na parede de cada forminha.','Complete com o suco, coloque os palitos e congele por 6 horas.'],
 'Melancia não precisa de açúcar. O limão realça o doce da fruta.', null),

(null, 'Granita de abacaxi com hortelã', 'granita-abacaxi-hortela', array['granita','raspadinha de abacaxi','abacaxi gelado','sorbet de abacaxi'], 'doce',
 array['verão','refrescante','sem açúcar','vegano'],
 'Raspadinha italiana de abacaxi: cristais de gelo com gosto de fruta.', '4 porções', 15, 50, 0,
 array['1/2 abacaxi maduro (500 g) sem casca','10 folhas de hortelã','Suco de 1 limão','100 ml de água'],
 array['Bata tudo e coe.','Despeje numa travessa rasa e leve ao freezer.','A cada 40 minutos, raspe com um garfo, das bordas para o centro — repita 3 ou 4 vezes, até ficar todo em cristais.','Sirva em taças geladas.'],
 'Travessa rasa congela por igual. Esqueceu de raspar e virou bloco? Deixe 10 minutos fora e raspe.', null),

-- ============================================================
--  REFEIÇÕES LEVES
-- ============================================================

(null, 'Espaguete de abobrinha ao pesto com frango', 'espaguete-abobrinha-pesto', array['macarrão de abobrinha ao pesto','espaguete de abobrinha','zoodles','abobrinha ao pesto'], 'refeicao',
 array['verão','low carb','proteica','rápida'],
 'Fios de abobrinha salteados com pesto de manjericão e frango grelhado.', '2 porções', 20, 330, 34,
 array['2 abobrinhas médias em fios (espiralizador ou descascador de legumes)','250 g de peito de frango em tiras','Pesto: 1 xícara de folhas de manjericão, 1 colher de sopa de castanha-do-pará ou nozes, 2 colheres de sopa de parmesão ralado, 1 colher de sopa de azeite, 1 dente de alho pequeno, suco de 1/2 limão e 2 colheres de sopa de água','8 tomates-cereja cortados ao meio','Sal e pimenta a gosto'],
 array['Bata os ingredientes do pesto no mixer até virar uma pasta.','Grelhe o frango temperado em frigideira bem quente e reserve.','Na mesma frigideira, salteie os fios de abobrinha por no máximo 2 minutos — devem ficar al dente.','Desligue o fogo, misture o pesto, o frango e os tomates e sirva na hora.'],
 'Abobrinha cozida demais vira água. Dois minutos na frigideira quente e desliga; salgue só no prato.', 'Contém castanha e leite (parmesão).'),

(null, 'Lasanha de berinjela com frango e ricota', 'lasanha-berinjela-frango-ricota', array['lasanha de berinjela com frango','lasanha fit','lasanha sem massa','berinjela com ricota'], 'refeicao',
 array['verão','low carb','proteica','marmita'],
 'Camadas de berinjela grelhada, frango desfiado, creme de ricota e molho de tomate.', '4 porções', 60, 280, 32,
 array['2 berinjelas grandes em fatias de 0,5 cm no comprimento','400 g de peito de frango cozido e desfiado','2 xícaras de molho de tomate caseiro','250 g de ricota amassada com 3 colheres de sopa de leite, sal e noz-moscada','100 g de muçarela ralada','Manjericão, orégano, sal e azeite'],
 array['Grelhe as fatias de berinjela numa frigideira antiaderente pincelada com azeite, 2 minutos de cada lado. Reserve.','Misture o frango com metade do molho de tomate.','Monte num refratário: molho, berinjela, frango, creme de ricota — repita e termine com berinjela, molho e muçarela.','Asse a 200 °C por 25 minutos, até gratinar. Espere 10 minutos antes de cortar.'],
 'Grelhar a berinjela antes é o que evita lasanha aguada. Não precisa deixar de molho no sal.', 'Contém leite.'),

(null, 'Salada tropical de frango com manga', 'salada-tropical-frango-manga', array['salada de frango com manga','salada tropical','salada com fruta'], 'refeicao',
 array['verão','proteica','almoço','sem glúten'],
 'Folhas, frango grelhado, manga, pepino e castanha com molho de limão e hortelã.', '2 porções', 20, 320, 30,
 array['2 xícaras de mix de folhas (alface, rúcula, agrião)','250 g de peito de frango grelhado em tiras','1 manga pequena em cubos','1 pepino japonês em meia-lua','1/4 de cebola roxa em fatias finas','2 colheres de sopa de castanha-de-caju picada','Molho: suco de 1 limão, 1 colher de sopa de azeite, 1 colher de chá de mel, hortelã picada, sal e pimenta'],
 array['Deixe a cebola roxa 10 minutos no suco de limão do molho — ela perde a ardência.','Complete o molho com o azeite, o mel e a hortelã.','Monte as folhas, o pepino, a manga e o frango.','Regue com o molho só na hora de servir e finalize com a castanha.'],
 'Para marmita, leve o molho num potinho separado: a folha temperada murcha em minutos.', 'Contém castanha.'),

(null, 'Tabule de quinoa com hortelã', 'tabule-quinoa', array['tabule','salada de quinoa','quinoa com hortelã','tabule sem glúten'], 'refeicao',
 array['verão','sem glúten','vegana','acompanhamento'],
 'O tabule árabe trocando o trigo pela quinoa: fresco, cítrico e sem glúten.', '4 porções', 25, 180, 6,
 array['1 xícara de quinoa crua lavada','2 tomates sem sementes em cubinhos','1 pepino em cubinhos','1/2 cebola roxa picada','1 maço de salsinha picada','1/2 xícara de hortelã picada','Suco de 2 limões','2 colheres de sopa de azeite','Sal e pimenta-síria a gosto'],
 array['Cozinhe a quinoa em 2 xícaras de água por 12 minutos, até a água secar. Espalhe numa travessa para esfriar.','Misture os legumes e as ervas.','Tempere com limão, azeite, sal e pimenta-síria e misture a quinoa fria.','Leve à geladeira por 30 minutos antes de servir.'],
 'Lave a quinoa numa peneira fina antes de cozinhar: tira a saponina, que deixa o grão amargo.', null),

(null, 'Salada de lentilha com legumes e limão', 'salada-lentilha-legumes', array['salada de lentilha','lentilha fria','lentilha na salada'], 'refeicao',
 array['verão','fibras','vegana','marmita'],
 'Lentilha al dente com legumes crus e molho de limão — rende a semana.', '4 porções', 30, 210, 11,
 array['1 xícara de lentilha crua','1 cenoura ralada','1 pimentão vermelho em cubinhos','1 pepino em cubinhos','1/2 cebola roxa picada','Cheiro-verde a gosto','Molho: suco de 2 limões, 2 colheres de sopa de azeite, 1 colher de chá de mostarda, sal e pimenta'],
 array['Cozinhe a lentilha em água sem sal por 15 a 18 minutos — deve ficar firme, não desmanchar.','Escorra e passe na água fria para parar o cozimento.','Misture com os legumes e as ervas.','Bata o molho e tempere a salada ainda morna: a lentilha absorve melhor.'],
 'Sal só depois de cozida: salgada na água, a casca da lentilha endurece.', null),

(null, 'Gaspacho (sopa fria de tomate)', 'gaspacho', array['gazpacho','sopa fria','sopa de tomate gelada'], 'refeicao',
 array['verão','refrescante','vegana','entrada'],
 'Sopa espanhola servida gelada: tomate, pepino e pimentão batidos com azeite.', '4 porções', 15, 90, 2,
 array['6 tomates bem maduros','1 pepino sem casca','1/2 pimentão vermelho','1/4 de cebola','1 dente de alho','2 colheres de sopa de azeite','1 colher de sopa de vinagre de maçã','Sal, pimenta e 200 ml de água gelada'],
 array['Pique grosseiramente todos os legumes.','Bata tudo com o azeite, o vinagre e a água até ficar bem liso.','Acerte o sal e leve à geladeira por no mínimo 2 horas.','Sirva bem gelado, com cubinhos de pepino e fio de azeite.'],
 'Como entrada antes do almoço, sacia e ajuda a comer menos no prato principal.', null),

(null, 'Poke de salmão', 'poke-salmao', array['poke','poke bowl','bowl de salmão'], 'refeicao',
 array['verão','proteica','ômega-3','almoço'],
 'Tigela havaiana: arroz, salmão em cubos, manga, pepino, edamame e gergelim.', '2 porções', 25, 420, 28,
 array['200 g de salmão fresco próprio para consumo cru, em cubos','1 xícara de arroz integral ou arroz japonês cozido e frio','1/2 manga em cubos','1 pepino japonês em rodelas','1/2 xícara de edamame cozido (ou cenoura ralada)','1/2 abacate em fatias','1 colher de sopa de gergelim','Molho: 2 colheres de sopa de shoyu com baixo sódio, suco de 1/2 limão, 1 colher de chá de óleo de gergelim, gengibre ralado'],
 array['Misture o molho e deixe o salmão marinando nele por 10 minutos na geladeira.','Monte as tigelas com o arroz na base e os ingredientes em setores.','Coloque o salmão por cima e finalize com gergelim.'],
 'Salmão cru só de peixaria de confiança e comprado no dia. Quem prefere, sela os cubos 1 minuto na frigideira.', 'Peixe cru: não indicado para gestantes, imunossuprimidos e crianças pequenas. Contém soja (shoyu) e gergelim.'),

(null, 'Rolinhos de berinjela com ricota', 'rolinhos-berinjela-ricota', array['involtini de berinjela','rolinho de berinjela','berinjela recheada'], 'refeicao',
 array['verão','vegetariana','low carb','jantar'],
 'Fatias de berinjela grelhada enroladas com ricota e ervas, gratinadas no molho.', '3 porções', 40, 220, 15,
 array['1 berinjela grande em fatias finas no comprimento','250 g de ricota','1 ovo','2 colheres de sopa de parmesão ralado','Manjericão, raspas de limão, sal e pimenta','1 1/2 xícara de molho de tomate caseiro'],
 array['Grelhe as fatias de berinjela 2 minutos de cada lado numa frigideira antiaderente.','Amasse a ricota com o ovo, o parmesão, o manjericão e as raspas de limão.','Coloque 1 colher de recheio na ponta de cada fatia e enrole.','Arrume os rolinhos sobre o molho num refratário e asse a 200 °C por 20 minutos.'],
 'Com salada verde vira jantar completo. Para mais proteína, misture frango desfiado no recheio.', 'Contém leite e ovo.'),

(null, 'Salada de abobrinha com atum e tomate-cereja', 'salada-abobrinha-atum', array['salada de abobrinha crua','carpaccio de abobrinha com atum','salada fria de abobrinha'], 'refeicao',
 array['verão','proteica','low carb','sem fogão'],
 'Abobrinha crua em fitas, atum, tomate-cereja e azeitona — almoço sem ligar o fogão.', '2 porções', 15, 250, 27,
 array['1 abobrinha grande em fitas finas (descascador de legumes)','2 latas (240 g) de atum em água, escorrido','10 tomates-cereja ao meio','8 azeitonas pretas','1 xícara de rúcula','Molho: suco de 1 limão, 1 colher de sopa de azeite, orégano, sal e pimenta'],
 array['Tempere as fitas de abobrinha com o limão e uma pitada de sal e deixe 5 minutos — elas amaciam sem cozinhar.','Junte a rúcula, os tomates, as azeitonas e o atum.','Regue com o azeite, o orégano e a pimenta e sirva.'],
 'Atum em água tem metade das calorias do atum em óleo e a mesma proteína.', 'Peixe.'),

-- ============================================================
--  CAFÉ / LANCHE
-- ============================================================

(null, 'Parfait de iogurte com frutas vermelhas', 'parfait-frutas-vermelhas', array['parfait','copo de iogurte com frutas','iogurte com granola e frutas'], 'cafe-lanche',
 array['verão','proteica','café da manhã','lanche'],
 'Camadas de iogurte, frutas vermelhas e granola num copo — montado na véspera.', '1 porção', 5, 250, 14,
 array['1 pote (170 g) de iogurte natural desnatado ou grego natural','1/2 xícara de frutas vermelhas (frescas ou descongeladas)','2 colheres de sopa de granola sem açúcar','1 colher de chá de chia','Canela (opcional)'],
 array['No copo, alterne camadas de iogurte, frutas e chia.','Leve à geladeira (pode ser de um dia para o outro).','Coloque a granola só na hora de comer, para ficar crocante.'],
 'Frutas congeladas descongelam na geladeira durante a noite e soltam uma calda natural no iogurte.', 'Contém leite e glúten (granola, salvo se sem glúten).')

on conflict (slug) where nutricionista_id is null do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  tags = excluded.tags, resumo = excluded.resumo, porcoes = excluded.porcoes,
  tempo_min = excluded.tempo_min, kcal_porcao = excluded.kcal_porcao,
  proteina_g = excluded.proteina_g, ingredientes = excluded.ingredientes,
  modo_preparo = excluded.modo_preparo, dica = excluded.dica, atencao = excluded.atencao;

-- Receitas de verão que já estavam na base ganham a tag, para a busca
-- "verão" trazer o cardápio inteiro. Só na base curada e sem duplicar.
update public.ic_receitas
   set tags = array_append(tags, 'verão')
 where nutricionista_id is null
   and not ('verão' = any(tags))
   and slug in (
     'suco-verde-detox', 'suco-melancia-hortela', 'suco-detox-abacaxi-hortela',
     'suco-detox-beterraba', 'suco-detox-cenoura-maca', 'agua-aromatizada',
     'limonada-suica', 'cha-hibisco-gelado', 'smoothie-frutas-vermelhas',
     'smoothie-bowl', 'vitamina-verde', 'cafe-proteico',
     'nice-cream-banana', 'picole-banana-cacau', 'creme-maracuja',
     'mousse-morango-iogurte', 'gelatina-natural',
     'lasanha-de-berinjela', 'lasanha-abobrinha', 'macarrao-de-abobrinha',
     'abobrinha-recheada-atum', 'salada-grao-de-bico', 'salada-figo-nozes'
   );

notify pgrst, 'reload schema';

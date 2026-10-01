-- ============================================================
--  Plataforma Nutri — Migração 0102
--  Receitas — lote VERÃO PRÁTICO (4 receitas para rotina puxada)
--
--  Acompanham a revisão do modelo de plano "Verão leve e refrescante"
--  (plano-alimentar.js, id "verao"): café com ovos cozidos e suco verde
--  de 3 ingredientes, almoço em marmita fria e jantar de peixe na
--  airfryer. Tudo em até 15 minutos, sem utensílio especial.
--
--  Conteúdo AUTORAL. Reexecutável (upsert pelo slug da base).
--  kcal e proteína são ESTIMATIVAS por porção.
-- ============================================================

insert into public.ic_receitas
  (nutricionista_id, nome, slug, sinonimos, categoria, tags, resumo, porcoes, tempo_min, kcal_porcao, proteina_g, ingredientes, modo_preparo, dica, atencao)
values

(null, 'Suco verde prático (3 ingredientes)', 'suco-verde-pratico', array['suco verde','suco verde rápido','suco de couve com abacaxi','suco detox prático'], 'bebida',
 array['verão','prático','café da manhã','hidratação','sem lactose'],
 'Couve, abacaxi e limão batidos com água e gelo: 3 minutos, sem coar.', '1 copo grande (300 ml)', 3, 50, 1,
 array['1 folha pequena de couve sem o talo (20 g)','1 fatia de abacaxi (75 g)','Suco de 1/2 limão','200 ml de água gelada','Gelo a gosto'],
 array['Bata a couve com a água primeiro, até não sobrar pedaço de folha.','Junte o abacaxi, o limão e o gelo e bata de novo.','Beba na hora, sem coar, para aproveitar a fibra.'],
 'Deixe o abacaxi já cortado em cubos no congelador e a couve lavada e picada num pote na geladeira: de manhã é só jogar no liquidificador. O abacaxi congelado dispensa o gelo.', null),

(null, 'Salada de lentilha com frango', 'salada-lentilha-frango', array['salada de lentilha','marmita de lentilha','lentilha com frango desfiado','salada fria de lentilha'], 'refeicao',
 array['verão','prático','marmita','proteica','almoço'],
 'Marmita fria que se monta em 5 minutos com lentilha e frango cozidos no fim de semana.', '1 marmita', 10, 370, 46,
 array['1 concha (80 g) de lentilha cozida e escorrida','6 colheres de sopa (120 g) de frango desfiado','1 tomate picado','1/2 pepino picado','2 colheres de sopa de cenoura ralada','Folhas a gosto (alface, rúcula)','Molho: 1 colher de sopa de azeite, suco de 1/2 limão, sal, pimenta e cheiro-verde'],
 array['No pote, coloque o molho no fundo.','Por cima, a lentilha, o frango, a cenoura, o tomate e o pepino, nessa ordem.','As folhas vão por último, longe do molho, para não murchar.','Na hora de comer, é só misturar.'],
 'No domingo, cozinhe 1 pacote de lentilha (sem deixar desmanchar) e 500 g de peito de frango para desfiar. Guardados em potes, rendem as marmitas da semana. A lentilha pode ser trocada por grão-de-bico.', null),

(null, 'Salada de macarrão com atum', 'salada-macarrao-atum', array['salada de macarrão','macarrão frio com atum','marmita de macarrão','salada de massa com atum'], 'refeicao',
 array['verão','prático','marmita','almoço'],
 'Macarrão integral frio, atum de lata e legumes: almoço completo sem fogão no dia.', '1 marmita', 15, 420, 30,
 array['1 xícara (125 g) de macarrão integral cozido (parafuso ou penne)','1 lata pequena de atum escorrido (80 g)','1 tomate picado (ou 8 tomates-cereja)','2 colheres de sopa de cenoura ralada','2 colheres de sopa de milho verde','1 punhado de rúcula','Molho: 1 colher de sopa de azeite, suco de 1/2 limão, orégano, sal e pimenta'],
 array['Cozinhe o macarrão al dente, escorra e passe em água fria para parar o cozimento.','Misture o macarrão com o atum, o tomate, a cenoura e o milho.','Tempere com o molho e coloque a rúcula por cima na hora de fechar o pote.'],
 'Cozinhe meio pacote de macarrão de uma vez: guardado com um fio de azeite na geladeira, dura 3 dias. Atum em água tem menos calorias que o em óleo e a mesma proteína; sardinha em lata também serve.', 'Contém glúten (macarrão) e peixe.'),

(null, 'Peixe na airfryer com batata-doce', 'peixe-airfryer-batata-doce', array['peixe na airfryer','filé de peixe assado','tilápia na airfryer','merluza assada com batata-doce'], 'refeicao',
 array['verão','prático','proteica','jantar'],
 'Filé de peixe e batata-doce na mesma cesta da airfryer, em 15 minutos, com salada ao lado.', '1 porção', 15, 310, 30,
 array['1 filé de peixe branco (120 g): tilápia, merluza ou pescada','1 batata-doce pequena (100 g) em rodelas finas','1 colher de chá de azeite','Suco de 1/2 limão, alho, sal, páprica e cheiro-verde','Salada: alface e tomate a gosto'],
 array['Tempere o peixe com limão, alho, sal e páprica.','Coloque a batata-doce na airfryer a 200 °C por 7 minutos.','Junte o peixe na cesta e deixe mais 8 a 10 minutos, até o filé soltar em lascas.','Regue com o azeite e sirva com a salada.'],
 'Filé de peixe congelado em porções individuais vai direto da embalagem para a airfryer: aumente 3 a 4 minutos. Sem airfryer, use o forno a 200 °C por 20 minutos.', 'Peixe.')

on conflict (slug) where nutricionista_id is null do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  tags = excluded.tags, resumo = excluded.resumo, porcoes = excluded.porcoes,
  tempo_min = excluded.tempo_min, kcal_porcao = excluded.kcal_porcao,
  proteina_g = excluded.proteina_g, ingredientes = excluded.ingredientes,
  modo_preparo = excluded.modo_preparo, dica = excluded.dica, atencao = excluded.atencao;

notify pgrst, 'reload schema';

-- ============================================================
--  Plataforma Nutri — Migração 0028
--  Semente da Biblioteca de Receitas (conteúdo AUTORAL).
--  Base curada: nutricionista_id = NULL. Reexecutável (upsert por slug base).
-- ============================================================

insert into public.ic_receitas
  (nutricionista_id, nome, slug, sinonimos, categoria, tags, resumo, porcoes, tempo_min, kcal_porcao, ingredientes, modo_preparo, dica, atencao)
values
(null, 'Panqueca de banana e aveia', 'panqueca-banana-aveia', array['panqueca','banana','aveia'], 'cafe-lanche',
 array['sem açúcar','proteica','rápida'],
 'Massa de 3 ingredientes, sem farinha e sem açúcar.', '1 porção (2 panquecas)', 10, 260,
 array['1 banana madura','1 ovo','2 colheres de sopa de aveia em flocos','Canela a gosto'],
 array['Amasse a banana e misture o ovo e a aveia até formar uma massa.','Aqueça uma frigideira antiaderente e despeje pequenas porções.','Doure dos dois lados em fogo baixo.','Finalize com canela.'],
 'Fica ótima com pasta de amendoim ou frutas por cima.', null),

(null, 'Crepioca proteica', 'crepioca', array['crepioca','tapioca','ovo'], 'cafe-lanche',
 array['proteica','sem glúten','rápida'],
 'Tapioca com ovo — leve, versátil e sem glúten.', '1 unidade', 8, 180,
 array['1 ovo','2 colheres de sopa de goma de tapioca','1 pitada de sal','Recheio a gosto (queijo, frango, folhas)'],
 array['Bata o ovo com a tapioca e o sal até ficar homogêneo.','Despeje na frigideira antiaderente quente.','Quando firmar, vire, adicione o recheio e dobre ao meio.'],
 'Versão doce: troque o sal por canela e recheie com fruta.', null),

(null, 'Aveia da noite (overnight oats)', 'overnight-oats', array['overnight','aveia','da noite'], 'cafe-lanche',
 array['prático','fibras','leva-junto'],
 'Deixa pronto na geladeira de um dia para o outro.', '1 pote', 5, 300,
 array['4 colheres de sopa de aveia','1 pote de iogurte natural (ou leite/bebida vegetal)','1 colher de chá de chia','Fruta picada e canela a gosto'],
 array['Misture a aveia, o iogurte e a chia num pote.','Adicione a fruta e a canela.','Tampe e deixe na geladeira por pelo menos 4 horas (ou a noite toda).'],
 'Monte 2–3 potes de uma vez para a semana.', null),

(null, 'Muffin de ovo com legumes', 'muffin-de-ovo', array['muffin','ovo','egg muffin','omelete de forno'], 'cafe-lanche',
 array['low carb','proteica','leva-junto'],
 'Omeletinhos assados em forminha — ótimos para levar.', '6 unidades', 30, 90,
 array['6 ovos','1 xícara de legumes picados (tomate, espinafre, abobrinha)','Queijo ralado a gosto','Sal e temperos a gosto'],
 array['Bata os ovos com sal e temperos.','Misture os legumes e o queijo.','Distribua em forminhas de silicone ou untadas.','Asse a 180°C por cerca de 20 minutos, até firmar.'],
 'Duram 3–4 dias na geladeira; bom lanche proteico.', 'Contém ovo e derivados de leite.'),

(null, 'Frango cremoso rápido', 'frango-cremoso', array['frango','cremoso','desfiado'], 'refeicao',
 array['proteica','low carb'],
 'Frango desfiado cremoso sem creme de leite pesado.', '2 porções', 25, 240,
 array['2 filés de frango cozidos e desfiados','2 colheres de sopa de requeijão light (ou iogurte grego)','1 tomate picado','Cebola, alho e cheiro-verde a gosto'],
 array['Refogue a cebola e o alho.','Junte o frango desfiado e o tomate e tempere.','Desligue o fogo e misture o requeijão até ficar cremoso.'],
 'Serve como recheio de crepioca, tapioca ou sobre arroz.', 'Contém derivados de leite.'),

(null, 'Escondidinho de batata-doce', 'escondidinho-batata-doce', array['escondidinho','batata doce','carne'], 'refeicao',
 array['proteica','conforto'],
 'Troca a batata comum pela batata-doce; puro conforto.', '4 porções', 45, 380,
 array['500 g de batata-doce cozida','400 g de carne moída magra','1 cebola e 1 dente de alho','Sal, tomate e temperos a gosto'],
 array['Amasse a batata-doce ainda quente formando um purê.','Refogue a carne com cebola, alho e temperos.','Num refratário, faça camadas: carne embaixo, purê por cima.','Leve ao forno a 200°C por 15 minutos para gratinar.'],
 'Congela bem em porções individuais.', null),

(null, 'Bolinho de atum de frigideira', 'bolinho-atum', array['bolinho','atum','hamburguer de atum'], 'refeicao',
 array['proteica','rápida'],
 'Sem fritura, feito na frigideira em minutos.', '2 porções', 15, 220,
 array['1 lata de atum ralado (escorrido)','1 ovo','2 colheres de sopa de aveia ou farinha de aveia','Cebola, salsinha e sal a gosto'],
 array['Misture todos os ingredientes até dar liga.','Modele bolinhos achatados.','Doure em frigideira antiaderente dos dois lados.'],
 'Bom com salada e um fio de azeite.', 'Contém peixe, ovo e glúten (aveia).'),

(null, 'Chips de legumes assados', 'chips-de-legumes', array['chips','abobrinha','berinjela','assado'], 'cafe-lanche',
 array['low carb','crocante'],
 'Fatias assadas no lugar da batata frita.', '2 porções', 30, 90,
 array['1 abobrinha ou berinjela em fatias finas','1 fio de azeite','Sal, páprica e ervas a gosto'],
 array['Fatie bem fino (uma faca boa ou mandolina ajuda).','Tempere com azeite, sal e páprica.','Espalhe sem sobrepor numa assadeira.','Asse a 180°C virando na metade, até ficarem crocantes.'],
 'Quanto mais fina a fatia, mais crocante fica.', null),

(null, 'Mousse de cacau proteico', 'mousse-cacau', array['mousse','cacau','chocolate','doce fit'], 'doce',
 array['proteica','sem açúcar'],
 'Sobremesa cremosa sem açúcar, em 5 minutos.', '1 porção', 5, 160,
 array['1 pote de iogurte natural (ou grego)','1 colher de sopa de cacau em pó 100%','Adoçante a gosto','Raspas de cacau ou fruta para decorar'],
 array['Misture o iogurte, o cacau e o adoçante até ficar liso.','Gele por alguns minutos.','Decore a gosto.'],
 'Congelar por 1 hora vira um "sorvete" cremoso.', 'Contém derivados de leite.'),

(null, 'Brigadeiro de tâmara', 'brigadeiro-tamara', array['brigadeiro','tamara','doce fit'], 'doce',
 array['sem açúcar refinado','vegano'],
 'Docinho enrolado sem açúcar refinado.', '8 unidades', 20, 70,
 array['1 xícara de tâmaras sem caroço','2 colheres de sopa de cacau em pó 100%','1 a 2 colheres de sopa de água','Cacau ou coco para envolver'],
 array['Bata as tâmaras no processador com o cacau e a água até virar uma massa.','Modele bolinhas com as mãos levemente úmidas.','Passe no cacau ou coco.','Gele antes de servir.'],
 'Se a massa estiver mole, leve à geladeira antes de enrolar.', null),

(null, 'Vitamina verde', 'vitamina-verde', array['vitamina','smoothie','suco verde'], 'bebida',
 array['fibras','rápida'],
 'Fruta, folha e uma boa dose de fibra no copo.', '1 copo', 5, 180,
 array['1 folha de couve sem talo','1/2 banana congelada','200 ml de água (ou bebida vegetal)','1 colher de chá de linhaça ou chia'],
 array['Bata tudo no liquidificador até ficar homogêneo.','Sirva na hora.'],
 'Congelar a banana deixa a bebida cremosa e gelada.', null),

(null, 'Pão de queijo de tapioca', 'pao-de-queijo-tapioca', array['pao de queijo','tapioca','sem glúten'], 'cafe-lanche',
 array['sem glúten','rápida'],
 'Versão de frigideira/airfryer, sem farinha de trigo.', '4 unidades', 20, 110,
 array['4 colheres de sopa de goma de tapioca','3 colheres de sopa de queijo minas ou muçarela ralado','1 colher de sopa de leite','1 pitada de sal'],
 array['Misture todos os ingredientes até dar liga.','Modele bolinhas.','Asse em airfryer ou forno a 200°C por cerca de 12 minutos.'],
 'Bom para o café da manhã sem glúten.', 'Contém derivados de leite.')

on conflict (slug) where (nutricionista_id is null)
do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  tags = excluded.tags, resumo = excluded.resumo, porcoes = excluded.porcoes,
  tempo_min = excluded.tempo_min, kcal_porcao = excluded.kcal_porcao,
  ingredientes = excluded.ingredientes, modo_preparo = excluded.modo_preparo,
  dica = excluded.dica, atencao = excluded.atencao, updated_at = now();

notify pgrst, 'reload schema';

-- ============================================================
--  Plataforma Nutri — Migração 0059
--  Receitas — lote 3 (as que a Ana pediu por nome) + proteína por porção
--  nas receitas que já estavam na base.
--
--  Conteúdo AUTORAL. Reexecutável (upsert pelo slug da base).
--  Valores de kcal e proteína são ESTIMATIVAS por porção, para orientar
--  o encaixe no plano — não substituem cálculo do alimento pesado.
-- ============================================================

insert into public.ic_receitas
  (nutricionista_id, nome, slug, sinonimos, categoria, tags, resumo, porcoes, tempo_min, kcal_porcao, proteina_g, ingredientes, modo_preparo, dica, atencao)
values

-- ---------- Jantares ----------
(null, 'Macarrão de abobrinha ao sugo com frango', 'macarrao-de-abobrinha', array['espaguete de abobrinha','espaguete de legumes','macarrão de abobrinha','noodles de abobrinha'], 'refeicao',
 array['low carb','proteica','jantar leve'],
 'Fios de abobrinha no lugar da massa, com molho de tomate e frango desfiado.', '2 porções', 25, 290, 28,
 array['2 abobrinhas médias','300 g de peito de frango','1 xícara de molho de tomate caseiro','1 dente de alho','1 colher de sopa de azeite','Sal, orégano e manjericão a gosto'],
 array['Corte a abobrinha em tiras finas com fatiador, espiralizador ou descascador de legumes.','Cozinhe o frango, desfie e reserve.','Refogue o alho no azeite, junte o molho de tomate e o frango, tempere e deixe apurar 5 minutos.','Salteie a abobrinha em fogo alto por 2–3 minutos, só para aquecer — ela solta água e murcha rápido.','Sirva o molho por cima, na hora, com manjericão.'],
 'Não cozinhe demais a abobrinha: 2 minutos bastam, senão vira purê. Escorra a água que soltar antes de montar o prato.', null),

(null, 'Lasanha de berinjela', 'lasanha-de-berinjela', array['lasanha','berinjela','lasanha sem massa'], 'refeicao',
 array['low carb','sem glúten','jantar','forno'],
 'Camadas de berinjela no lugar da massa, com carne e queijo.', '4 porções', 60, 340, 26,
 array['2 berinjelas grandes','400 g de carne moída magra (patinho)','2 xícaras de molho de tomate','1 cebola picada','2 dentes de alho','150 g de queijo muçarela ralado','2 colheres de sopa de azeite','Sal, orégano e pimenta a gosto'],
 array['Corte as berinjelas em fatias no sentido do comprimento (0,5 cm), salpique sal e deixe descansar 15 minutos para tirar o amargor.','Seque as fatias, pincele azeite e asse a 200°C por 15 minutos (ou grelhe na frigideira).','Refogue a cebola e o alho, junte a carne moída e doure; acrescente o molho e cozinhe 10 minutos.','Monte em camadas num refratário: molho, berinjela, molho, berinjela — terminando com molho.','Cubra com o queijo e asse a 180°C por 20 minutos, até gratinar.','Descanse 10 minutos antes de cortar.'],
 'Assar a berinjela antes é o que evita a lasanha aguada. Congela bem em porções.', 'Contém derivados de leite.'),

-- ---------- Lanches ----------
(null, 'Tapioca recheada de frango', 'tapioca-recheada-frango', array['tapioca','beiju','tapioca de frango'], 'cafe-lanche',
 array['sem glúten','proteica','rápida'],
 'A tapioca de sempre, com recheio que sustenta.', '1 unidade', 12, 250, 22,
 array['3 colheres de sopa de goma de tapioca hidratada','100 g de frango desfiado temperado','1 colher de sopa de requeijão ou cream cheese','Cheiro-verde a gosto'],
 array['Espalhe a goma numa frigideira antiaderente quente, peneirando, até cobrir o fundo.','Quando a goma ligar e soltar do fundo, vire.','Espalhe o recheio de um lado, dobre ao meio e sirva.'],
 'Goma seca não liga: se a sua estiver esfarelando, borrife um pouco de água, misture e peneire.', 'Contém derivados de leite se usar requeijão.'),

(null, 'Cuscuz salgado com ovo', 'cuscuz-salgado', array['cuscuz','cuscuz nordestino','flocão'], 'cafe-lanche',
 array['sem glúten','proteica','café da manhã'],
 'Cuscuz nordestino de milho, com ovo por cima — café da manhã que segura.', '1 porção', 15, 300, 14,
 array['1/2 xícara de flocão de milho','1/3 xícara de água','1 pitada de sal','1 ovo','1 colher de chá de azeite','Cheiro-verde a gosto'],
 array['Umedeça o flocão com a água e o sal, misture com as mãos e deixe hidratar 10 minutos.','Coloque na cuscuzeira (ou numa peneira sobre panela com água fervente) e cozinhe no vapor por 5–8 minutos.','Frite ou mexa o ovo no azeite e sirva por cima do cuscuz.'],
 'Sem cuscuzeira: use um escorredor de macarrão sobre a panela, tampado.', null),

(null, 'Cuscuz doce de coco', 'cuscuz-doce', array['cuscuz doce','cuscuz com leite','flocão doce'], 'cafe-lanche',
 array['sem glúten','doce','café da manhã'],
 'Versão doce do cuscuz, com leite de coco e sem açúcar refinado.', '2 porções', 15, 260, 5,
 array['1 xícara de flocão de milho','2/3 xícara de água','1 pitada de sal','1/2 xícara de leite de coco','1 colher de sopa de coco ralado sem açúcar','Canela a gosto','Adoçante ou 1 colher de chá de mel (opcional)'],
 array['Hidrate o flocão com a água e o sal por 10 minutos.','Cozinhe no vapor por 5–8 minutos.','Regue com o leite de coco morno, salpique o coco ralado e a canela.'],
 'Fica ótimo com banana em rodelas por cima.', null),

(null, 'Panqueca doce de cacau', 'panqueca-doce-cacau', array['panqueca','panqueca de chocolate','panqueca doce'], 'cafe-lanche',
 array['sem açúcar','proteica','doce'],
 'Panqueca de cacau recheada de banana — sobremesa que serve de lanche.', '1 porção (2 panquecas)', 15, 290, 16,
 array['1 ovo','1 banana madura','2 colheres de sopa de aveia em flocos finos','1 colher de sopa de cacau em pó 100%','1 pitada de canela','Recheio: 1 banana em rodelas e 1 colher de chá de pasta de amendoim'],
 array['Bata no liquidificador o ovo, a banana, a aveia, o cacau e a canela.','Despeje pequenas porções na frigideira antiaderente quente, em fogo baixo.','Vire quando a superfície firmar e as bordas soltarem.','Recheie com a banana e a pasta de amendoim e dobre.'],
 'Fogo baixo é o segredo: massa com cacau queima antes de assar por dentro.', 'Contém ovo e amendoim.'),

(null, 'Bolo fit de cacau', 'bolo-fit-cacau', array['bolo fit','bolo de chocolate fit','bolo funcional'], 'cafe-lanche',
 array['sem açúcar','sem glúten','forno'],
 'Bolo de chocolate sem açúcar e sem farinha branca, fofinho.', '8 fatias', 45, 180, 6,
 array['3 ovos','1 xícara de farinha de aveia','1/2 xícara de cacau em pó 100%','1/2 xícara de óleo de coco derretido (ou azeite suave)','1/2 xícara de leite (ou bebida vegetal)','1/2 xícara de adoçante forno e fogão (ou xilitol)','1 colher de sopa de fermento em pó'],
 array['Bata os ovos, o óleo, o leite e o adoçante no liquidificador.','Passe para uma tigela e incorpore a farinha de aveia e o cacau peneirados.','Misture o fermento por último, delicadamente.','Asse em forma untada a 180°C por 30–35 minutos; espete um palito para conferir.'],
 'Não abra o forno nos primeiros 20 minutos — o bolo murcha.', 'Contém ovo; leva leite se não usar bebida vegetal.'),

-- ---------- Sucos detox ----------
(null, 'Suco detox de beterraba com laranja', 'suco-detox-beterraba', array['suco detox','beterraba','suco de beterraba'], 'bebida',
 array['detox','antioxidante','fibras'],
 'Beterraba e laranja — cor forte, sabor doce natural.', '1 copo (300 ml)', 5, 110, 2,
 array['1/2 beterraba pequena crua picada','Suco de 2 laranjas','1 pedaço pequeno de gengibre','200 ml de água gelada'],
 array['Bata tudo no liquidificador até ficar homogêneo.','Coe se preferir mais leve — sem coar, mantém as fibras.','Beba na hora.'],
 'Sem coar rende mais saciedade; coado, vira só açúcar de fruta.', 'Beterraba escurece o xixi e as fezes — é normal.'),

(null, 'Suco detox de abacaxi com hortelã', 'suco-detox-abacaxi-hortela', array['suco detox','abacaxi','hortelã','suco verde'], 'bebida',
 array['detox','digestivo','refrescante'],
 'Abacaxi, hortelã e gengibre: leve e digestivo.', '1 copo (300 ml)', 5, 90, 1,
 array['2 fatias de abacaxi','6 folhas de hortelã','1 pedaço pequeno de gengibre','1 folha de couve (opcional)','200 ml de água gelada'],
 array['Bata tudo no liquidificador.','Sirva imediatamente, com gelo.'],
 'Congele o abacaxi em cubos: dispensa o gelo e fica cremoso.', null)

on conflict (slug) where nutricionista_id is null do update set
  nome = excluded.nome, sinonimos = excluded.sinonimos, categoria = excluded.categoria,
  tags = excluded.tags, resumo = excluded.resumo, porcoes = excluded.porcoes,
  tempo_min = excluded.tempo_min, kcal_porcao = excluded.kcal_porcao,
  proteina_g = excluded.proteina_g, ingredientes = excluded.ingredientes,
  modo_preparo = excluded.modo_preparo, dica = excluded.dica, atencao = excluded.atencao;

-- ---------- Proteína por porção nas receitas que já existiam ----------
update public.ic_receitas r set proteina_g = v.p
from (values
  ('panqueca-banana-aveia', 10), ('crepioca', 10), ('overnight-oats', 12),
  ('muffin-de-ovo', 7), ('pao-de-queijo-tapioca', 5), ('pao-low-carb-frigideira', 12),
  ('mingau-aveia-maca', 8), ('bolo-caneca-banana', 8), ('cookie-aveia-cacau', 3),
  ('biscoito-gergelim', 3), ('chips-de-legumes', 2), ('geleia-chia-morango', 1),
  ('iogurte-caseiro', 6),
  ('frango-cremoso', 30), ('salmao-assado-legumes', 30), ('escondidinho-batata-doce', 22),
  ('lasanha-abobrinha', 25), ('berinjela-gratinada', 14), ('torta-frango-low-carb', 22),
  ('hamburguer-grao-de-bico', 9), ('bolinho-atum', 18), ('risoto-quinoa', 12),
  ('creme-abobora-gengibre', 5), ('pure-couve-flor', 5), ('salada-figo-nozes', 8),
  ('molho-iogurte-hortela', 2), ('farofa-aveia', 4),
  ('mousse-cacau', 5), ('brigadeiro-tamara', 2), ('trufa-tamara-castanha', 2),
  ('cheesecake-funcional', 8), ('creme-maracuja', 6), ('picole-banana-cacau', 2),
  ('sagu-chia-uva', 2),
  ('smoothie-frutas-vermelhas', 8), ('suco-verde-detox', 2), ('vitamina-verde', 6),
  ('golden-milk', 4), ('cha-curcuma-gengibre', 0), ('agua-aromatizada', 0)
) as v(slug, p)
where r.slug = v.slug and r.nutricionista_id is null and r.proteina_g is null;

notify pgrst, 'reload schema';

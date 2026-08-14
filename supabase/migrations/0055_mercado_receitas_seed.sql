-- ============================================================
--  Plataforma Nutri — Migração 0055
--  ACERVO DE RECEITAS do app "No mercado com a Nutri Ana"
--
--  GERADO por mercado/calcular_receitas.py a partir de
--  mercado/receitas_dados.py. NÃO EDITE ESTE ARQUIVO À MÃO: mexa na
--  fonte e rode o script de novo, senão o número deixa de bater com o
--  ingrediente que o originou.
--
--  kcal, ptn, cho, lip e fibra são POR PORÇÃO, somados pela TACO
--  (NEPA/Unicamp, 4ª ed. ampliada e revisada) e divididos pelo rendimento.
--  Ingrediente que a TACO de 2011 não tem (chia, quinoa, whey) traz a
--  fonte no próprio JSON, em 'fonte'.
-- ============================================================

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'suco-verde-de-couve-abacaxi-e-gengibre',
  'Suco verde de couve, abacaxi e gengibre',
  'O clássico do ''detox'' — só que sem promessa milagrosa e com fibra de verdade.',
  array['suco', 'detox', 'vegana', 'vegetariana', 'fruta']::text[],
  5, 2, 255,
  46.0, 1.4, 11.4, 0.2, 1.5,
  '[{"item": "2 folhas grandes de couve", "gramas": 40, "taco_id": 115, "fonte": null, "nome_tabela": "Couve, manteiga, crua"}, {"item": "2 fatias de abacaxi", "gramas": 150, "taco_id": 164, "fonte": null, "nome_tabela": "Abacaxi, cru"}, {"item": "1 pedacinho de gengibre", "gramas": 5, "taco_id": null, "fonte": "extra:gengibre", "nome_tabela": "gengibre"}, {"item": "suco de 1/2 limão", "gramas": 15, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}, {"item": "300 ml de água gelada", "gramas": 300, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Lave bem as folhas de couve e rasgue com a mão, sem o talo mais grosso.', 'Bata tudo no liquidificador com a água até ficar homogêneo.', 'Beba sem coar: o que fica na peneira é justamente a fibra, que é o motivo de o suco valer mais que o refrigerante.']::text[],
  'Suco nenhum desintoxica ninguém — quem faz isso é o seu fígado, de graça e o dia inteiro. O que este aqui faz é te dar fruta e folha numa hora em que você provavelmente não comeria nem uma nem outra.',
  1)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'suco-de-melancia-com-hortela',
  'Suco de melancia com hortelã',
  'Três ingredientes, zero açúcar adicionado e o preço de uma fatia de melancia.',
  array['suco', 'fruta', 'vegana', 'vegetariana', 'economica', 'detox']::text[],
  5, 2, 209,
  67.6, 1.9, 17.0, 0.0, 0.3,
  '[{"item": "2 fatias grossas de melancia sem casca", "gramas": 400, "taco_id": 235, "fonte": null, "nome_tabela": "Melancia, crua"}, {"item": "6 folhas de hortelã", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "suco de 1/2 limão", "gramas": 15, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Corte a melancia em cubos e tire as sementes maiores.', 'Bata com a hortelã e o limão. A melancia já tem água suficiente — não precisa acrescentar.', 'Sirva na hora, com gelo.']::text[],
  'Nesta você não precisa adoçar nada. Se der vontade de pôr açúcar, prove antes: quase sempre a vontade some.',
  2)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'vitamina-de-banana-com-aveia',
  'Vitamina de banana com aveia',
  'O café da manhã de quem acordou atrasada e não vai ficar com fome às 10 h.',
  array['suco', 'fruta', 'vegetariana', 'economica']::text[],
  5, 1, 331,
  279.6, 12.4, 53.6, 3.0, 4.6,
  '[{"item": "1 banana nanica", "gramas": 100, "taco_id": 179, "fonte": null, "nome_tabela": "Banana, nanica, crua"}, {"item": "3 colheres de sopa de aveia em flocos", "gramas": 30, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "1 copo de leite desnatado", "gramas": 200, "taco_id": 457, "fonte": null, "nome_tabela": "Leite, de vaca, desnatado, UHT"}, {"item": "canela a gosto", "gramas": 1, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Bata a banana com o leite até ficar liso.', 'Junte a aveia e bata mais 10 segundos — se bater demais, vira cola.', 'Polvilhe canela por cima.']::text[],
  'É a aveia que segura a fome: sozinha, a banana batida sobe e desce rápido. Banana mais madura deixa mais doce sem precisar de açúcar.',
  3)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'creme-de-abacate-com-cacau',
  'Creme de abacate com cacau',
  'Gosto de mousse de chocolate, feito com fruta e sem forno.',
  array['sobremesa', 'lowcarb', 'cetogenica', 'vegana', 'vegetariana', 'fruta']::text[],
  5, 2, 98,
  94.4, 1.9, 10.3, 7.0, 6.6,
  '[{"item": "1/2 abacate maduro", "gramas": 150, "taco_id": 163, "fonte": null, "nome_tabela": "Abacate, cru"}, {"item": "1 colher de sopa cheia de cacau em pó 100%", "gramas": 10, "taco_id": null, "fonte": "extra:cacau_po", "nome_tabela": "cacau_po"}, {"item": "adoçante ou 1 colher de chá de mel", "gramas": 7, "taco_id": 507, "fonte": null, "nome_tabela": "Mel, de abelha"}, {"item": "2 colheres de sopa de água gelada", "gramas": 30, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Amasse bem o abacate com um garfo ou bata no mixer.', 'Junte o cacau, o mel e a água e misture até virar um creme liso e escuro.', 'Leve à geladeira por 10 minutos se quiser mais firme.']::text[],
  'Cacau em pó 100% é diferente de achocolatado: o segundo é açúcar com sabor de chocolate. Olhe a lista de ingredientes — se açúcar vier antes do cacau, é doce, não é cacau.',
  4)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'iogurte-com-morango-e-castanha',
  'Iogurte com morango e castanha',
  'A sobremesa que substitui o pote de iogurte de morango do mercado — que é quase todo açúcar.',
  array['sobremesa', 'fruta', 'vegetariana', 'lowcarb']::text[],
  5, 1, 270,
  178.9, 9.2, 10.9, 11.7, 2.3,
  '[{"item": "1 pote de iogurte natural", "gramas": 170, "taco_id": 448, "fonte": null, "nome_tabela": "Iogurte, natural"}, {"item": "6 morangos", "gramas": 90, "taco_id": 239, "fonte": null, "nome_tabela": "Morango, cru"}, {"item": "2 castanhas-do-pará picadas", "gramas": 10, "taco_id": 589, "fonte": null, "nome_tabela": "Castanha-do-Brasil, crua"}]'::jsonb,
  array['Corte os morangos e amasse metade deles com o garfo, para soltar o suco.', 'Misture no iogurte natural.', 'Cubra com o restante dos morangos e a castanha picada.']::text[],
  'Compare no mercado: o iogurte ''sabor morango'' costuma ter o dobro de açúcar do natural — e o morango dele, quando existe, aparece no fim da lista.',
  5)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'ovos-mexidos-cremosos',
  'Ovos mexidos cremosos',
  'Cinco minutos, uma frigideira e proteína suficiente para a manhã inteira.',
  array['principal', 'lowcarb', 'cetogenica', 'vegetariana', 'economica']::text[],
  5, 1, 123,
  219.5, 14.5, 2.0, 16.7, 0.0,
  '[{"item": "2 ovos", "gramas": 100, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "1 colher de chá de manteiga", "gramas": 5, "taco_id": 262, "fonte": null, "nome_tabela": "Manteiga, sem sal"}, {"item": "1 colher de sopa de requeijão", "gramas": 15, "taco_id": 468, "fonte": null, "nome_tabela": "Queijo, requeijão, cremoso"}, {"item": "sal e cebolinha", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Bata os ovos com o sal, sem exagero — bater demais deixa o ovo borrachudo.', 'Derreta a manteiga em fogo BAIXO e despeje os ovos.', 'Mexa devagar e tire do fogo quando ainda estiverem um pouco moles: eles terminam de cozinhar no calor da panela.', 'Misture o requeijão fora do fogo e salpique cebolinha.']::text[],
  'Fogo alto é o que estraga ovo mexido. O creme vem do fogo baixo, não da quantidade de gordura.',
  6)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'salada-de-tomate-pepino-e-cebola',
  'Salada de tomate, pepino e cebola',
  'A salada mais barata do Brasil, temperada do jeito certo.',
  array['salada', 'vegana', 'vegetariana', 'economica', 'lowcarb', 'detox']::text[],
  5, 2, 192,
  73.6, 2.0, 6.2, 5.2, 2.4,
  '[{"item": "2 tomates", "gramas": 200, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1 pepino", "gramas": 130, "taco_id": 142, "fonte": null, "nome_tabela": "Pepino, cru"}, {"item": "1/2 cebola", "gramas": 40, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, vinagre e orégano", "gramas": 5, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Corte tudo em cubos parecidos — salada com pedaços do mesmo tamanho come melhor.', 'Deixe a cebola de molho em água gelada por 2 minutos se quiser tirar o ardido.', 'Tempere com azeite, vinagre, sal e orégano só na hora de servir, senão o tomate solta água.']::text[],
  'O azeite não é vilão aqui: sem gordura, boa parte das vitaminas do tomate e da folha passa direto pelo seu corpo.',
  7)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'banana-com-pasta-de-amendoim',
  'Banana com pasta de amendoim',
  'Doce de dois ingredientes para o fim da tarde, quando bate a fome de bobagem.',
  array['sobremesa', 'fruta', 'vegana', 'vegetariana', 'economica']::text[],
  5, 1, 121,
  209.1, 6.4, 27.7, 10.2, 3.1,
  '[{"item": "1 banana", "gramas": 100, "taco_id": 179, "fonte": null, "nome_tabela": "Banana, nanica, crua"}, {"item": "1 colher de sopa de pasta de amendoim integral", "gramas": 20, "taco_id": null, "fonte": "extra:pasta_amendoim", "nome_tabela": "pasta_amendoim"}, {"item": "canela", "gramas": 1, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Corte a banana ao meio no comprimento.', 'Espalhe a pasta de amendoim por cima e polvilhe canela.', 'Se quiser, leve ao congelador por 20 minutos: vira picolé.']::text[],
  'Pasta de amendoim boa tem UM ingrediente: amendoim. Se a lista trouxer açúcar, gordura vegetal e sal, você comprou doce, não amendoim.',
  8)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'mamao-com-aveia-e-limao',
  'Mamão com aveia e limão',
  'Café da manhã de dois minutos que resolve o intestino preso melhor que qualquer chá.',
  array['fruta', 'sobremesa', 'vegana', 'vegetariana', 'economica', 'detox']::text[],
  5, 1, 240,
  198.9, 5.2, 40.3, 3.5, 7.3,
  '[{"item": "1 fatia grande de mamão formosa", "gramas": 200, "taco_id": 225, "fonte": null, "nome_tabela": "Mamão, Formosa, cru"}, {"item": "2 colheres de sopa de aveia em flocos", "gramas": 20, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "suco de 1/2 limão", "gramas": 15, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}, {"item": "1 colher de chá de linhaça", "gramas": 5, "taco_id": 594, "fonte": null, "nome_tabela": "Linhaça, semente"}]'::jsonb,
  array['Corte o mamão em cubos no prato fundo.', 'Espalhe a aveia e a linhaça por cima.', 'Esprema o limão na hora de comer — ele corta o enjoativo do mamão.']::text[],
  'Fibra sem água não funciona: tome um copo de água junto, senão a aveia faz o efeito contrário.',
  9)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'suco-de-beterraba-com-laranja',
  'Suco de beterraba com laranja',
  'Cor de vinho, gosto de laranja — o jeito de comer beterraba sem perceber.',
  array['suco', 'detox', 'vegana', 'vegetariana', 'economica']::text[],
  5, 2, 157,
  62.0, 1.5, 14.6, 0.0, 1.1,
  '[{"item": "1/2 beterraba crua pequena", "gramas": 60, "taco_id": 98, "fonte": null, "nome_tabela": "Beterraba, crua"}, {"item": "suco de 3 laranjas", "gramas": 250, "taco_id": 209, "fonte": null, "nome_tabela": "Laranja, baía, suco"}, {"item": "1 pedacinho de gengibre", "gramas": 4, "taco_id": null, "fonte": "extra:gengibre", "nome_tabela": "gengibre"}]'::jsonb,
  array['Descasque e pique a beterraba crua bem miúdo (ou rale).', 'Bata com o suco de laranja e o gengibre por 1 minuto.', 'Beba na hora: o suco de laranja perde vitamina C parado na geladeira.']::text[],
  'Beterraba crua tem mais nitrato que a cozida — é o que dá fama a este suco entre quem treina.',
  10)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'torrada-de-abacate-com-ovo',
  'Torrada de abacate com ovo',
  'O lanche da moda, feito com pão de verdade e sem gastar R$ 30 na cafeteria.',
  array['principal', 'vegetariana', 'economica']::text[],
  5, 1, 173,
  266.8, 12.2, 29.4, 12.5, 7.9,
  '[{"item": "1 fatia de pão integral", "gramas": 50, "taco_id": 52, "fonte": null, "nome_tabela": "Pão, trigo, forma, integral"}, {"item": "1/4 de abacate", "gramas": 70, "taco_id": 163, "fonte": null, "nome_tabela": "Abacate, cru"}, {"item": "1 ovo cozido", "gramas": 50, "taco_id": 488, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cozido/10minutos"}, {"item": "sal, limão e pimenta", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Torre o pão até ficar firme — abacate em pão mole desmonta.', 'Amasse o abacate com sal, limão e pimenta e espalhe no pão.', 'Corte o ovo cozido em rodelas por cima.']::text[],
  'No pão, leia a lista: se a primeira farinha for branca, o ''integral'' da frente é só marketing. Integral de verdade traz farinha de trigo integral em primeiro lugar.',
  11)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'agua-saborizada-de-limao-e-hortela',
  'Água saborizada de limão, gengibre e hortelã',
  'Para quem não consegue beber água pura — e não quer trocar por refrigerante zero.',
  array['suco', 'detox', 'vegana', 'vegetariana', 'economica']::text[],
  5, 4, 268,
  6.4, 0.2, 2.0, 0.0, 0.2,
  '[{"item": "1 litro de água", "gramas": 1000, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "1 limão em rodelas", "gramas": 60, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}, {"item": "1 pedaço de gengibre em lâminas", "gramas": 8, "taco_id": null, "fonte": "extra:gengibre", "nome_tabela": "gengibre"}, {"item": "1 punhado de hortelã", "gramas": 5, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Ponha tudo numa jarra com água gelada.', 'Deixe na geladeira por pelo menos 1 hora (esse tempo é de espera, não de trabalho).', 'Beba ao longo do dia e troque o limão a cada 24 h, senão amarga.']::text[],
  'Não emagrece nem ''seca''. O que ela faz é te fazer beber mais água — e isso, sim, muda como você passa o dia.',
  12)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'omelete-de-espinafre-e-queijo',
  'Omelete de espinafre e queijo',
  'Almoço inteiro numa frigideira, com mais proteína que um filé pequeno.',
  array['principal', 'lowcarb', 'cetogenica', 'vegetariana']::text[],
  10, 1, 178,
  273.0, 19.0, 3.6, 20.0, 0.8,
  '[{"item": "2 ovos", "gramas": 100, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "1 punhado de espinafre", "gramas": 40, "taco_id": 119, "fonte": null, "nome_tabela": "Espinafre, Nova Zelândia, cru"}, {"item": "1 fatia de queijo minas frescal", "gramas": 30, "taco_id": 461, "fonte": null, "nome_tabela": "Queijo, minas, frescal"}, {"item": "1 colher de chá de azeite", "gramas": 5, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal e pimenta", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Refogue o espinafre no azeite por 1 minuto, só até murchar. Reserve.', 'Bata os ovos com sal e despeje na frigideira quente, em fogo médio-baixo.', 'Quando a borda firmar, ponha o espinafre e o queijo de um lado só e dobre.', 'Deixe mais 1 minuto com a frigideira tampada para o queijo derreter.']::text[],
  'Gema não é problema: a fama de vilã do colesterol caiu por terra e é nela que estão a colina e as vitaminas do ovo.',
  13)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'crepioca-de-queijo',
  'Crepioca de queijo',
  'Sem glúten, pronta antes do café passar, e segura até o almoço.',
  array['principal', 'vegetariana', 'economica']::text[],
  10, 1, 163,
  294.4, 18.2, 20.3, 15.0, 0.1,
  '[{"item": "2 ovos", "gramas": 100, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "2 colheres de sopa de goma de tapioca", "gramas": 30, "taco_id": null, "fonte": "extra:goma_tapioca", "nome_tabela": "goma_tapioca"}, {"item": "1 fatia de queijo minas", "gramas": 30, "taco_id": 461, "fonte": null, "nome_tabela": "Queijo, minas, frescal"}, {"item": "sal e orégano", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Bata os ovos com a goma e o sal até ficar homogêneo — sem grumos de goma.', 'Despeje na frigideira antiaderente quente e espalhe fino.', 'Quando soltar do fundo, vire, ponha o queijo, dobre e desligue.']::text[],
  'Crepioca só de goma e água é carboidrato quase puro. É o ovo que a transforma em refeição — não diminua a proporção dele.',
  14)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'tapioca-de-frango-desfiado',
  'Tapioca de frango desfiado',
  'Aquele frango que sobrou de ontem virando o jantar de hoje.',
  array['principal', 'economica']::text[],
  10, 1, 150,
  248.8, 20.7, 27.8, 5.5, 0.6,
  '[{"item": "3 colheres de sopa de goma de tapioca", "gramas": 45, "taco_id": null, "fonte": "extra:goma_tapioca", "nome_tabela": "goma_tapioca"}, {"item": "1/2 xícara de frango cozido desfiado", "gramas": 60, "taco_id": 408, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cozido"}, {"item": "1 colher de sopa de requeijão", "gramas": 15, "taco_id": 468, "fonte": null, "nome_tabela": "Queijo, requeijão, cremoso"}, {"item": "tomate e cebolinha", "gramas": 30, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}]'::jsonb,
  array['Espalhe a goma peneirada na frigideira quente, sem gordura, até virar um disco.', 'Misture o frango com o requeijão e o tomate picado.', 'Recheie de um lado, dobre e sirva.']::text[],
  'Peneirar a goma é o segredo da tapioca que não fica borrachuda.',
  15)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'macarrao-de-abobrinha-ao-alho-e-oleo',
  'Macarrão de abobrinha ao alho e óleo',
  'Cara de macarrão, corpo de legume — e fica pronto no tempo de ferver a água do outro.',
  array['principal', 'lowcarb', 'vegana', 'vegetariana', 'economica', 'cetogenica']::text[],
  10, 2, 218,
  133.8, 2.6, 10.0, 10.2, 3.1,
  '[{"item": "2 abobrinhas médias", "gramas": 400, "taco_id": 71, "fonte": null, "nome_tabela": "Abobrinha, italiana, crua"}, {"item": "3 dentes de alho", "gramas": 12, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, pimenta e salsinha", "gramas": 5, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Corte a abobrinha em tiras finas com o descascador de legumes (ou rale no ralo grosso).', 'Doure o alho fatiado no azeite em fogo baixo, sem queimar — alho queimado amarga tudo.', 'Junte a abobrinha e mexa por 2 a 3 minutos: ela precisa ficar ''al dente'', não mole.', 'Tempere e sirva imediatamente, senão solta água.']::text[],
  'Não cozinhe demais. Abobrinha passada do ponto vira sopa dentro do prato — e é isso que faz as pessoas dizerem que não gostam.',
  16)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'salada-de-grao-de-bico-com-tomate',
  'Salada de grão-de-bico com tomate',
  'Proteína vegetal barata que aguenta 3 dias na geladeira e vai na marmita.',
  array['salada', 'vegana', 'vegetariana', 'economica', 'principal']::text[],
  10, 3, 186,
  238.5, 9.9, 30.6, 9.4, 8.7,
  '[{"item": "2 xícaras de grão-de-bico já cozido", "gramas": 300, "taco_id": null, "fonte": "extra:grao_bico_cozido", "nome_tabela": "grao_bico_cozido"}, {"item": "2 tomates", "gramas": 180, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1/2 cebola roxa", "gramas": 40, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "1 punhado de salsinha", "gramas": 10, "taco_id": 153, "fonte": null, "nome_tabela": "Salsa, crua"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, limão e pimenta", "gramas": 8, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Escorra e lave o grão-de-bico se for de lata — tira boa parte do sódio.', 'Pique o tomate sem sementes e a cebola bem miúda.', 'Misture tudo com azeite, limão e sal e deixe descansar 5 minutos antes de comer.']::text[],
  'Cozinhar um pacote de grão-de-bico seco no domingo sai por menos de um terço do preço da lata — e rende salada, pasta e sopa a semana inteira.',
  17)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'atum-com-salada-de-folhas',
  'Atum com salada de folhas e azeitona',
  'O almoço de quem tem 10 minutos e uma lata na despensa.',
  array['salada', 'principal', 'lowcarb', 'economica']::text[],
  10, 1, 320,
  337.2, 33.6, 5.0, 20.4, 3.3,
  '[{"item": "1 lata de atum escorrido", "gramas": 120, "taco_id": 277, "fonte": null, "nome_tabela": "Atum, conserva em óleo"}, {"item": "1 prato de alface", "gramas": 80, "taco_id": 78, "fonte": null, "nome_tabela": "Alface, crespa, crua"}, {"item": "1 tomate", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "6 azeitonas", "gramas": 20, "taco_id": 521, "fonte": null, "nome_tabela": "Azeitona, verde, conserva"}, {"item": "1 colher de sopa de azeite e limão", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Escorra bem o atum, apertando com a tampa da lata.', 'Monte as folhas rasgadas com a mão, o tomate e a azeitona.', 'Ponha o atum no centro e tempere com azeite e limão.']::text[],
  'Atum em óleo tem mais caloria que o em água, mas o óleo fica na lata — escorrido, a diferença é bem menor do que dizem.',
  18)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'panqueca-de-banana-e-ovo',
  'Panqueca de banana e ovo',
  'Dois ingredientes, gosto de sobremesa, e nenhum açúcar adicionado.',
  array['sobremesa', 'fruta', 'vegetariana', 'economica']::text[],
  10, 1, 221,
  313.4, 17.2, 38.7, 10.7, 3.7,
  '[{"item": "1 banana bem madura", "gramas": 100, "taco_id": 179, "fonte": null, "nome_tabela": "Banana, nanica, crua"}, {"item": "2 ovos", "gramas": 100, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "2 colheres de sopa de aveia", "gramas": 20, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "canela", "gramas": 1, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Amasse a banana e misture os ovos e a aveia até virar uma massa grossa.', 'Faça panquecas pequenas na frigideira antiaderente, em fogo baixo.', 'Vire com cuidado quando aparecerem bolhas na superfície — esta massa é mais frágil que a de trigo.']::text[],
  'Quanto mais preta a casca da banana, mais doce fica sem precisar de açúcar. Banana com casca manchada não é banana estragada.',
  19)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'cuscuz-com-ovo-e-tomate',
  'Cuscuz nordestino com ovo',
  'Café da manhã de menos de R$ 3 que sustenta a manhã inteira.',
  array['principal', 'economica', 'vegetariana']::text[],
  10, 1, 285,
  298.2, 10.7, 41.2, 10.7, 4.1,
  '[{"item": "1 xícara de cuscuz de milho pronto", "gramas": 150, "taco_id": 533, "fonte": null, "nome_tabela": "Cuscuz, de milho, cozido com sal"}, {"item": "1 ovo", "gramas": 50, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "1 tomate", "gramas": 80, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1 colher de chá de azeite", "gramas": 5, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Hidrate a farinha de milho com água e sal, deixe descansar 5 minutos e cozinhe na cuscuzeira.', 'Enquanto isso, frite o ovo no azeite e pique o tomate.', 'Sirva o ovo por cima do cuscuz com o tomate ao lado.']::text[],
  'Cuscuz sozinho é carboidrato. É o ovo que muda a história da sua manhã — sem ele você vai estar com fome às 9h30.',
  20)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'pao-de-queijo-de-frigideira',
  'Pão de queijo de frigideira',
  'A vontade de pão de queijo resolvida em 10 minutos, sem forno.',
  array['vegetariana', 'sobremesa', 'economica']::text[],
  10, 1, 112,
  247.5, 13.5, 19.4, 12.5, 0.0,
  '[{"item": "1 ovo", "gramas": 50, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "2 colheres de sopa de polvilho doce", "gramas": 20, "taco_id": 146, "fonte": null, "nome_tabela": "Polvilho, doce"}, {"item": "1 fatia de queijo minas", "gramas": 40, "taco_id": 461, "fonte": null, "nome_tabela": "Queijo, minas, frescal"}, {"item": "1 pitada de sal", "gramas": 2, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Misture o ovo, o polvilho e o sal até ficar liso.', 'Despeje na frigideira antiaderente em fogo baixo e ponha o queijo picado por cima.', 'Tampe por 2 minutos, dobre ao meio e sirva.']::text[],
  'É mais parente da crepioca do que do pão de queijo da padaria — mas mata a vontade e tem proteína, o que o da padaria não tem.',
  21)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'smoothie-de-morango-com-iogurte',
  'Smoothie de morango com iogurte',
  'Cremoso como milk-shake, com proteína de verdade e sem xarope.',
  array['suco', 'sobremesa', 'fruta', 'vegetariana']::text[],
  5, 1, 327,
  154.3, 8.3, 19.3, 5.5, 2.5,
  '[{"item": "1 xícara de morangos congelados", "gramas": 150, "taco_id": 239, "fonte": null, "nome_tabela": "Morango, cru"}, {"item": "1 pote de iogurte natural", "gramas": 170, "taco_id": 448, "fonte": null, "nome_tabela": "Iogurte, natural"}, {"item": "1 colher de chá de mel", "gramas": 7, "taco_id": 507, "fonte": null, "nome_tabela": "Mel, de abelha"}]'::jsonb,
  array['Use os morangos CONGELADOS — é o que dá a textura de milk-shake sem gelo.', 'Bata tudo no liquidificador até ficar cremoso.', 'Se ficar grosso demais, junte uma colher de leite, não de água.']::text[],
  'Congelar a fruta madura que ia estragar é o truque que faz smoothie sair de graça e evitar desperdício.',
  22)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'ovo-cozido-com-cottage-e-tomate',
  'Ovos cozidos com cottage e tomate-cereja',
  'Lanche de 10 minutos com 20 g de proteína, para levar na bolsa.',
  array['lowcarb', 'cetogenica', 'vegetariana', 'salada']::text[],
  10, 1, 248,
  287.5, 20.8, 5.1, 20.2, 1.0,
  '[{"item": "2 ovos cozidos", "gramas": 100, "taco_id": 488, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cozido/10minutos"}, {"item": "3 colheres de sopa de queijo cottage", "gramas": 60, "taco_id": null, "fonte": "extra:cottage", "nome_tabela": "cottage"}, {"item": "6 tomates-cereja", "gramas": 80, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "azeite, sal e orégano", "gramas": 8, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Cozinhe os ovos por 8 minutos a partir da fervura, para a gema ficar cozida mas não esfarelenta.', 'Passe pela água fria — é o que faz a casca sair inteira.', 'Monte com o cottage e os tomates, regue com azeite e tempere.']::text[],
  'Cottage é o queijo com mais proteína e menos gordura da prateleira. O que engana é o sódio: compare a tabela entre as marcas.',
  23)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'wrap-de-alface-com-frango',
  'Wrap de alface com frango',
  'O recheio do sanduíche sem o pão — e sem aquela moleza depois do almoço.',
  array['lowcarb', 'principal', 'salada']::text[],
  10, 1, 250,
  225.5, 34.1, 5.6, 6.9, 2.4,
  '[{"item": "4 folhas grandes de alface americana", "gramas": 80, "taco_id": 77, "fonte": null, "nome_tabela": "Alface, americana, crua"}, {"item": "1 xícara de frango cozido desfiado", "gramas": 100, "taco_id": 408, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cozido"}, {"item": "1 colher de sopa de requeijão", "gramas": 15, "taco_id": 468, "fonte": null, "nome_tabela": "Queijo, requeijão, cremoso"}, {"item": "1 cenoura ralada", "gramas": 50, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "sal, limão e pimenta", "gramas": 5, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Misture o frango desfiado com o requeijão, a cenoura ralada e os temperos.', 'Ponha o recheio no centro de cada folha de alface.', 'Enrole como um charuto e prenda com palito.']::text[],
  'Alface americana é a que aguenta enrolar sem rasgar. Crespa é mais nutritiva, mas quebra na hora de fechar.',
  24)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'sardinha-na-torrada-com-limao',
  'Sardinha na torrada com limão',
  'O ômega-3 mais barato do mercado, numa lata que custa menos que um café.',
  array['principal', 'economica']::text[],
  10, 2, 138,
  313.8, 15.0, 27.4, 16.9, 3.9,
  '[{"item": "1 lata de sardinha escorrida", "gramas": 125, "taco_id": 319, "fonte": null, "nome_tabela": "Sardinha, conserva em óleo"}, {"item": "4 fatias de pão integral", "gramas": 100, "taco_id": 52, "fonte": null, "nome_tabela": "Pão, trigo, forma, integral"}, {"item": "1/2 cebola roxa", "gramas": 30, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "suco de 1 limão e salsinha", "gramas": 20, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Escorra a sardinha e amasse com o garfo, aproveitando a espinha (ela é macia e cheia de cálcio).', 'Misture com a cebola picada e o limão.', 'Torre o pão e espalhe por cima.']::text[],
  'Sardinha entrega o mesmo ômega-3 do salmão por menos de um décimo do preço. É o melhor custo-benefício da prateleira inteira.',
  25)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'salada-de-atum-com-grao-de-bico',
  'Salada de atum com grão-de-bico',
  'Marmita fria que não precisa de micro-ondas e não murcha até a hora do almoço.',
  array['salada', 'principal', 'economica']::text[],
  10, 2, 198,
  278.6, 23.1, 23.1, 10.7, 6.5,
  '[{"item": "1 lata de atum escorrido", "gramas": 120, "taco_id": 277, "fonte": null, "nome_tabela": "Atum, conserva em óleo"}, {"item": "1 xícara de grão-de-bico cozido", "gramas": 150, "taco_id": null, "fonte": "extra:grao_bico_cozido", "nome_tabela": "grao_bico_cozido"}, {"item": "1 tomate", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1/4 de cebola", "gramas": 25, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "1 colher de sopa de azeite e limão", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Misture tudo numa tigela.', 'Tempere com azeite, limão, sal e pimenta.', 'Guarde em pote fechado: no dia seguinte fica ainda melhor.']::text[],
  'Esta é a marmita de quem não tem geladeira no trabalho — sem folha, ela aguenta a manhã em temperatura ambiente numa bolsa térmica.',
  26)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'mingau-de-aveia-com-maca',
  'Mingau de aveia com maçã e canela',
  'Conforto de inverno em 10 minutos, sem leite condensado.',
  array['sobremesa', 'fruta', 'vegetariana', 'economica']::text[],
  10, 1, 372,
  299.7, 12.8, 56.2, 3.8, 5.3,
  '[{"item": "4 colheres de sopa de aveia em flocos", "gramas": 40, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "1 copo de leite desnatado", "gramas": 200, "taco_id": 457, "fonte": null, "nome_tabela": "Leite, de vaca, desnatado, UHT"}, {"item": "1 maçã com casca", "gramas": 130, "taco_id": 222, "fonte": null, "nome_tabela": "Maçã, Fuji, com casca, crua"}, {"item": "canela em pó", "gramas": 2, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Rale metade da maçã e corte a outra metade em cubos.', 'Leve a aveia, o leite e a maçã ralada ao fogo baixo, mexendo até engrossar (uns 5 minutos).', 'Sirva com os cubos de maçã e bastante canela por cima.']::text[],
  'A maçã ralada adoça o mingau inteiro. Se ainda quiser doce, prove primeiro com a canela: ela dá sensação de doçura sem açúcar nenhum.',
  27)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'guacamole-com-palitos-de-legume',
  'Guacamole com palitos de legume',
  'Petisco de fim de tarde que substitui a bolacha recheada sem drama.',
  array['vegana', 'vegetariana', 'lowcarb', 'salada', 'cetogenica']::text[],
  10, 3, 205,
  126.7, 2.5, 13.0, 8.6, 8.8,
  '[{"item": "1 abacate maduro", "gramas": 300, "taco_id": 163, "fonte": null, "nome_tabela": "Abacate, cru"}, {"item": "1 tomate sem semente", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1/4 de cebola", "gramas": 25, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "suco de 1 limão", "gramas": 20, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}, {"item": "1 cenoura e 1 pepino em palitos", "gramas": 180, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}]'::jsonb,
  array['Amasse o abacate com o limão — o limão é o que impede de escurecer.', 'Misture o tomate e a cebola picados bem miúdos, sal e pimenta.', 'Sirva com os legumes cortados em palitos.']::text[],
  'O abacate brasileiro é maior e mais aguado que o avocado, mas faz o mesmo trabalho — e custa um terço do preço.',
  28)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'suco-de-abacaxi-com-hortela-e-chia',
  'Suco de abacaxi com hortelã e chia',
  'O suco que sacia — a chia é o que faz ele durar mais que 20 minutos.',
  array['suco', 'fruta', 'vegana', 'vegetariana', 'detox']::text[],
  5, 2, 268,
  82.3, 2.0, 16.1, 2.0, 3.2,
  '[{"item": "3 fatias de abacaxi", "gramas": 220, "taco_id": 164, "fonte": null, "nome_tabela": "Abacaxi, cru"}, {"item": "1 colher de sopa de chia", "gramas": 12, "taco_id": null, "fonte": "extra:chia", "nome_tabela": "chia"}, {"item": "8 folhas de hortelã", "gramas": 4, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "300 ml de água", "gramas": 300, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Bata o abacaxi com a água e a hortelã.', 'Junte a chia e mexa com a colher (não bata: a chia precisa ficar inteira).', 'Espere 5 minutos: ela incha e vira gel, e é isso que segura a fome.']::text[],
  'Chia sem líquido suficiente atrapalha em vez de ajudar. A regra é 10 partes de líquido para 1 de chia.',
  29)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'ricota-temperada-para-passar-no-pao',
  'Ricota temperada para passar no pão',
  'Substitui o requeijão do pote com metade da gordura — e você sabe o que tem dentro.',
  array['vegetariana', 'lowcarb', 'economica']::text[],
  10, 4, 80,
  135.3, 8.0, 3.3, 10.1, 0.2,
  '[{"item": "1 peça pequena de ricota", "gramas": 250, "taco_id": 469, "fonte": null, "nome_tabela": "Queijo, ricota"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "1/2 cebola pequena", "gramas": 30, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "cebolinha, sal e pimenta", "gramas": 10, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "suco de 1/2 limão", "gramas": 10, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Amasse a ricota com o garfo até esfarelar toda.', 'Bata no mixer com o azeite e o limão até virar creme (junte 1 colher de água se precisar).', 'Misture a cebola bem picadinha e a cebolinha na mão, para dar textura.']::text[],
  'Requeijão de pote tem amido, gordura e conservante. Este dura 4 dias na geladeira e tem três ingredientes.',
  30)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'frango-grelhado-com-legumes-na-frigideira',
  'Frango grelhado com legumes na frigideira',
  'Prato completo numa panela só, sem esperar forno esquentar.',
  array['principal', 'lowcarb', 'economica']::text[],
  30, 2, 376,
  324.3, 35.0, 12.9, 14.8, 4.2,
  '[{"item": "2 filés de peito de frango", "gramas": 300, "taco_id": 409, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cru"}, {"item": "1 abobrinha", "gramas": 200, "taco_id": 71, "fonte": null, "nome_tabela": "Abobrinha, italiana, crua"}, {"item": "1 cenoura", "gramas": 100, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "1 pimentão vermelho", "gramas": 120, "taco_id": 145, "fonte": null, "nome_tabela": "Pimentão, vermelho, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "alho, sal, páprica e pimenta", "gramas": 12, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}]'::jsonb,
  array['Tempere o frango com alho, sal e páprica e deixe descansar 10 minutos — esse tempo é o que faz diferença no sabor.', 'Grelhe em frigideira bem quente, 4 a 5 minutos de cada lado, sem ficar cutucando.', 'Tire o frango e, na mesma frigideira, salteie os legumes cortados em tiras por 5 minutos.', 'Volte o frango por cima dos legumes, tampe e desligue.']::text[],
  'Frango seco é frango virado demais. Vire uma vez só e deixe descansar 3 minutos antes de cortar — o suco volta para dentro da carne.',
  31)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'strogonoff-de-frango-leve',
  'Strogonoff de frango leve',
  'O strogonoff de domingo com iogurte no lugar do creme de leite — e ninguém percebe.',
  array['principal', 'economica']::text[],
  30, 4, 236,
  216.7, 30.2, 5.8, 7.6, 1.2,
  '[{"item": "500 g de peito de frango em cubos", "gramas": 500, "taco_id": 409, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cru"}, {"item": "1 pote de iogurte natural", "gramas": 170, "taco_id": 448, "fonte": null, "nome_tabela": "Iogurte, natural"}, {"item": "2 colheres de sopa de extrato de tomate", "gramas": 40, "taco_id": 158, "fonte": null, "nome_tabela": "Tomate, extrato"}, {"item": "1 cebola", "gramas": 100, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 dentes de alho", "gramas": 8, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "1 xícara de champignon (opcional)", "gramas": 100, "taco_id": null, "fonte": "extra:champignon", "nome_tabela": "champignon"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "mostarda, sal e pimenta", "gramas": 15, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Doure a cebola e o alho no azeite e junte o frango em cubos.', 'Cozinhe até o frango soltar e secar o líquido — é aí que ele pega gosto.', 'Junte o extrato de tomate, a mostarda e o champignon e cozinhe 5 minutos.', 'DESLIGUE O FOGO e só então misture o iogurte, mexendo devagar.']::text[],
  'Iogurte no fogo talha. Ele entra sempre com a panela desligada — é a única regra desta receita.',
  32)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'omelete-de-forno-com-legumes',
  'Omelete de forno com legumes',
  'Faz no domingo, come a semana — quente ou frio, e vai na marmita.',
  array['principal', 'lowcarb', 'vegetariana', 'economica']::text[],
  30, 4, 187,
  217.6, 15.1, 7.0, 14.3, 1.7,
  '[{"item": "6 ovos", "gramas": 300, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "1 abobrinha ralada", "gramas": 180, "taco_id": 71, "fonte": null, "nome_tabela": "Abobrinha, italiana, crua"}, {"item": "1 cenoura ralada", "gramas": 100, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "1/2 cebola", "gramas": 50, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "100 g de queijo minas", "gramas": 100, "taco_id": 461, "fonte": null, "nome_tabela": "Queijo, minas, frescal"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, orégano e cebolinha", "gramas": 8, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Aqueça o forno a 200 °C e unte uma forma pequena.', 'Bata os ovos com sal e misture os legumes ralados crus, a cebola e o queijo picado.', 'Despeje na forma e asse por 20 a 25 minutos, até firmar no centro.', 'Espere 5 minutos antes de cortar, senão desmancha.']::text[],
  'Ralar os legumes em vez de picar faz eles cozinharem no mesmo tempo do ovo — é o que evita o pedaço de cenoura cru no meio.',
  33)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'quibe-de-abobrinha-assado',
  'Quibe assado de abobrinha com carne',
  'Metade do trigo trocado por legume: mesma cara, mais comida de verdade.',
  array['principal', 'economica']::text[],
  30, 4, 205,
  226.8, 24.6, 15.9, 7.3, 4.1,
  '[{"item": "400 g de patinho moído", "gramas": 400, "taco_id": 376, "fonte": null, "nome_tabela": "Carne, bovina, patinho, sem gordura, cru"}, {"item": "1 abobrinha grande ralada e espremida", "gramas": 250, "taco_id": 71, "fonte": null, "nome_tabela": "Abobrinha, italiana, crua"}, {"item": "1 xícara de trigo para quibe (seco)", "gramas": 60, "taco_id": null, "fonte": "extra:bulgur_seco", "nome_tabela": "bulgur_seco"}, {"item": "1 cebola", "gramas": 80, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "hortelã, sal, pimenta e limão", "gramas": 20, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Hidrate o trigo em água por 20 minutos e esprema muito bem (esse tempo é de espera).', 'Rale a abobrinha e esprema com as mãos até tirar toda a água — quibe aguado não assa.', 'Misture tudo com a mão, aperte na forma e risque losangos por cima.', 'Regue com azeite e asse a 200 °C por 25 minutos.']::text[],
  'Peça no açougue para moer o patinho na hora. A carne moída pronta da bandeja costuma ser a de recorte mais gorda do balcão.',
  34)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'escondidinho-de-batata-doce-com-frango',
  'Escondidinho de batata-doce com frango',
  'Comfort food de verdade, com carboidrato que não te derruba às 15 h.',
  array['principal', 'economica']::text[],
  30, 4, 316,
  366.9, 37.8, 32.9, 8.7, 4.2,
  '[{"item": "600 g de batata-doce cozida", "gramas": 600, "taco_id": 88, "fonte": null, "nome_tabela": "Batata, doce, cozida"}, {"item": "400 g de frango cozido desfiado", "gramas": 400, "taco_id": 408, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cozido"}, {"item": "1 cebola", "gramas": 80, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 colheres de sopa de extrato de tomate", "gramas": 40, "taco_id": 158, "fonte": null, "nome_tabela": "Tomate, extrato"}, {"item": "100 g de queijo minas ralado", "gramas": 100, "taco_id": 461, "fonte": null, "nome_tabela": "Queijo, minas, frescal"}, {"item": "2 colheres de sopa de leite", "gramas": 30, "taco_id": 458, "fonte": null, "nome_tabela": "Leite, de vaca, integral"}, {"item": "sal, alho e cheiro-verde", "gramas": 15, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}]'::jsonb,
  array['Amasse a batata-doce ainda quente com o leite e sal até virar purê.', 'Refogue a cebola e o alho, junte o frango desfiado e o extrato de tomate.', 'Monte: frango embaixo, purê por cima, queijo no topo.', 'Leve ao forno a 200 °C por 15 minutos para gratinar.']::text[],
  'Batata-doce cozida com casca perde menos nutriente e desmancha menos. A casca sai sozinha depois de cozida.',
  35)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'peixe-assado-com-batata-e-tomate',
  'Peixe assado com batata e tomate',
  'Uma assadeira, 25 minutos de forno e nenhuma panela para lavar.',
  array['principal', 'economica']::text[],
  30, 2, 408,
  334.7, 29.1, 25.2, 13.2, 3.5,
  '[{"item": "2 filés de merluza", "gramas": 300, "taco_id": 302, "fonte": null, "nome_tabela": "Merluza, filé, cru"}, {"item": "2 batatas em rodelas finas", "gramas": 250, "taco_id": 92, "fonte": null, "nome_tabela": "Batata, inglesa, crua"}, {"item": "2 tomates em rodelas", "gramas": 180, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1/2 cebola em rodelas", "gramas": 50, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "alho, sal, limão e orégano", "gramas": 15, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}]'::jsonb,
  array['Tempere o peixe com limão, alho e sal.', 'Forre a assadeira com as batatas em rodelas FINAS, regue com azeite e leve ao forno a 220 °C por 10 minutos.', 'Ponha o peixe por cima, cubra com tomate e cebola, regue com o resto do azeite.', 'Volte ao forno por mais 15 minutos.']::text[],
  'A batata entra antes porque demora mais que o peixe. Tudo junto desde o começo dá batata crua com peixe seco.',
  36)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'lentilha-refogada-com-legumes',
  'Lentilha refogada com legumes',
  'Prato principal vegano de R$ 4 a porção, com ferro e proteína.',
  array['principal', 'vegana', 'vegetariana', 'economica']::text[],
  30, 4, 219,
  168.3, 7.9, 23.3, 5.7, 10.1,
  '[{"item": "2 xícaras de lentilha cozida", "gramas": 400, "taco_id": 577, "fonte": null, "nome_tabela": "Lentilha, cozida"}, {"item": "1 cenoura em cubos", "gramas": 100, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "1 abobrinha em cubos", "gramas": 150, "taco_id": 71, "fonte": null, "nome_tabela": "Abobrinha, italiana, crua"}, {"item": "1 cebola", "gramas": 90, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "3 dentes de alho", "gramas": 12, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "1 tomate", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "louro, sal, cominho e salsinha", "gramas": 15, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Refogue cebola e alho no azeite até dourar.', 'Junte os legumes em cubos e refogue 5 minutos.', 'Acrescente a lentilha já cozida, o tomate e os temperos, e cozinhe mais 10 minutos em fogo baixo.']::text[],
  'Coma com uma fruta cítrica na sequência: a vitamina C aumenta muito o aproveitamento do ferro das leguminosas. Café logo depois faz o contrário.',
  37)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'chili-vegetariano-de-feijao',
  'Chili vegetariano de feijão',
  'O jeito de comer feijão que faz até quem ''não gosta de feijão'' repetir.',
  array['principal', 'vegana', 'vegetariana', 'economica']::text[],
  30, 4, 272,
  202.6, 8.6, 30.8, 6.1, 13.2,
  '[{"item": "3 xícaras de feijão carioca cozido", "gramas": 500, "taco_id": 561, "fonte": null, "nome_tabela": "Feijão, carioca, cozido"}, {"item": "1 lata de milho verde escorrido", "gramas": 150, "taco_id": null, "fonte": "extra:milho_verde_lata", "nome_tabela": "milho_verde_lata"}, {"item": "1 pimentão vermelho", "gramas": 120, "taco_id": 145, "fonte": null, "nome_tabela": "Pimentão, vermelho, cru"}, {"item": "1 cebola", "gramas": 90, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "3 dentes de alho", "gramas": 12, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 tomates", "gramas": 180, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "cominho, páprica, pimenta e sal", "gramas": 15, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Refogue cebola, alho e pimentão no azeite.', 'Junte o tomate picado e cozinhe até desmanchar.', 'Acrescente o feijão com um pouco do caldo, o milho e os temperos.', 'Cozinhe em fogo baixo por 15 minutos, amassando um pouco do feijão para engrossar.']::text[],
  'Amassar parte do feijão contra a panela é o que engrossa o caldo sem farinha nenhuma.',
  38)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'berinjela-recheada-com-carne',
  'Berinjela recheada',
  'Parece prato de restaurante e usa a berinjela que ia murchar na gaveta.',
  array['principal', 'lowcarb', 'economica']::text[],
  30, 2, 454,
  367.4, 37.6, 15.4, 17.7, 7.4,
  '[{"item": "2 berinjelas", "gramas": 400, "taco_id": 96, "fonte": null, "nome_tabela": "Berinjela, crua"}, {"item": "250 g de patinho moído", "gramas": 250, "taco_id": 376, "fonte": null, "nome_tabela": "Carne, bovina, patinho, sem gordura, cru"}, {"item": "1 cebola", "gramas": 80, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 dentes de alho", "gramas": 8, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "1 tomate", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "60 g de queijo mussarela", "gramas": 60, "taco_id": null, "fonte": "extra:mussarela", "nome_tabela": "mussarela"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, orégano e manjericão", "gramas": 10, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Corte as berinjelas ao meio e cave o miolo com a colher, sem furar a casca. Pique o miolo.', 'Refogue cebola, alho, a carne e o miolo da berinjela; junte o tomate e tempere.', 'Recheie as cascas, cubra com mussarela e asse a 200 °C por 20 minutos.']::text[],
  'Berinjela amarga é berinjela velha. Escolha as firmes e de casca brilhante — não precisa de sal nem de molho antes.',
  39)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'sopa-creme-de-abobora-com-gengibre',
  'Sopa-creme de abóbora com gengibre',
  'Cremosa sem creme de leite nenhum: a própria abóbora faz o trabalho.',
  array['principal', 'vegana', 'vegetariana', 'economica', 'detox']::text[],
  30, 4, 406,
  112.4, 4.0, 19.7, 3.5, 5.0,
  '[{"item": "800 g de abóbora cabotiá em cubos", "gramas": 800, "taco_id": 65, "fonte": null, "nome_tabela": "Abóbora, cabotian, crua"}, {"item": "1 cebola", "gramas": 90, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 dentes de alho", "gramas": 8, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "1 pedaço de gengibre", "gramas": 10, "taco_id": null, "fonte": "extra:gengibre", "nome_tabela": "gengibre"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, pimenta e noz-moscada", "gramas": 8, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "700 ml de água", "gramas": 700, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Refogue cebola, alho e gengibre no azeite.', 'Junte a abóbora em cubos e a água e cozinhe 20 minutos, até desmanchar no garfo.', 'Bata no liquidificador (com cuidado, quente) e volte ao fogo para acertar o sal.']::text[],
  'Cabotiá é a abóbora de casca escura e polpa alaranjada e firme — é a que dá creme. A moranga aguada vira sopa rala.',
  40)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'salada-morna-de-quinoa',
  'Salada morna de quinoa com legumes',
  'A salada que serve de prato principal — proteína completa, sem carne.',
  array['salada', 'principal', 'vegana', 'vegetariana']::text[],
  30, 3, 237,
  208.2, 5.9, 28.0, 8.8, 5.1,
  '[{"item": "2 xícaras de quinoa cozida", "gramas": 300, "taco_id": null, "fonte": "extra:quinoa_cozida", "nome_tabela": "quinoa_cozida"}, {"item": "1 abobrinha em cubos", "gramas": 150, "taco_id": 71, "fonte": null, "nome_tabela": "Abobrinha, italiana, crua"}, {"item": "1 cenoura em cubos", "gramas": 100, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "10 tomates-cereja", "gramas": 120, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "suco de 1 limão, sal e hortelã", "gramas": 20, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Cozinhe a quinoa em 2 partes de água para 1 de grão, por 15 minutos, e escorra.', 'Salteie a abobrinha e a cenoura no azeite, deixando firmes.', 'Misture tudo ainda morno com o tomate cortado, o limão e a hortelã.']::text[],
  'Lave a quinoa em água corrente antes de cozinhar: ela tem uma camada natural amarga na casca (saponina) que estraga o prato.',
  41)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'frango-xadrez-caseiro',
  'Frango xadrez caseiro',
  'O prato do delivery chinês feito em casa, com um terço do sódio.',
  array['principal', 'economica']::text[],
  30, 3, 275,
  336.4, 35.3, 13.0, 16.5, 4.2,
  '[{"item": "400 g de peito de frango em cubos", "gramas": 400, "taco_id": 409, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cru"}, {"item": "1 pimentão verde e 1 vermelho", "gramas": 220, "taco_id": 144, "fonte": null, "nome_tabela": "Pimentão, verde, cru"}, {"item": "1 cebola", "gramas": 90, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "50 g de amendoim torrado", "gramas": 50, "taco_id": 558, "fonte": null, "nome_tabela": "Amendoim, torrado, salgado"}, {"item": "2 colheres de sopa de shoyu", "gramas": 30, "taco_id": null, "fonte": "extra:shoyu", "nome_tabela": "shoyu"}, {"item": "1 colher de sopa de óleo", "gramas": 10, "taco_id": 272, "fonte": null, "nome_tabela": "Óleo, de soja"}, {"item": "alho e gengibre", "gramas": 20, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "1 colher de chá de amido de milho", "gramas": 5, "taco_id": 42, "fonte": null, "nome_tabela": "Milho, amido, cru"}]'::jsonb,
  array['Tempere o frango com shoyu, alho e gengibre e deixe 10 minutos.', 'Frite o frango em fogo ALTO, em duas levas — panela cheia cozinha em vez de dourar.', 'Junte os pimentões e a cebola em cubos grandes e salteie 3 minutos: eles ficam crocantes.', 'Dissolva o amido em 1/2 xícara de água, junte para encorpar e finalize com o amendoim.']::text[],
  'Shoyu é sal líquido: 1 colher de sopa tem quase 1 g de sódio. Use o de teor reduzido e não acrescente sal.',
  42)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'hamburguer-caseiro-de-patinho',
  'Hambúrguer caseiro de patinho',
  'Dois ingredientes contra os quinze do congelado — e fica melhor.',
  array['principal', 'lowcarb', 'economica']::text[],
  30, 4, 141,
  182.9, 27.3, 1.1, 6.9, 0.3,
  '[{"item": "500 g de patinho moído", "gramas": 500, "taco_id": 376, "fonte": null, "nome_tabela": "Carne, bovina, patinho, sem gordura, cru"}, {"item": "1/2 cebola bem picada", "gramas": 50, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "sal e pimenta", "gramas": 8, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "1 colher de chá de azeite", "gramas": 5, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Misture a carne com a cebola e o sal SEM amassar demais — quanto mais você trabalha a carne, mais dura ela fica.', 'Faça bolas de 125 g e achate entre dois plásticos, com uma covinha no centro.', 'Grelhe em frigideira bem quente, 3 minutos de cada lado, virando uma vez só.']::text[],
  'Vire o pacote do hambúrguer congelado e conte os ingredientes. Este aqui tem três — e você acabou de ver quais.',
  43)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'panqueca-integral-de-carne',
  'Panqueca integral de carne moída',
  'Massa e recheio do zero em meia hora, e congela pronta para o dia corrido.',
  array['principal', 'economica']::text[],
  30, 4, 282,
  339.9, 31.7, 30.7, 10.6, 5.3,
  '[{"item": "1 xícara de farinha de trigo integral", "gramas": 120, "taco_id": null, "fonte": "extra:farinha_trigo_integral", "nome_tabela": "farinha_trigo_integral"}, {"item": "2 ovos", "gramas": 100, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "1 xícara de leite desnatado", "gramas": 200, "taco_id": 457, "fonte": null, "nome_tabela": "Leite, de vaca, desnatado, UHT"}, {"item": "400 g de patinho moído", "gramas": 400, "taco_id": 376, "fonte": null, "nome_tabela": "Carne, bovina, patinho, sem gordura, cru"}, {"item": "1 xícara de molho de tomate", "gramas": 200, "taco_id": 159, "fonte": null, "nome_tabela": "Tomate, molho industrializado"}, {"item": "1 cebola e 2 dentes de alho", "gramas": 100, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Bata no liquidificador a farinha, os ovos, o leite e uma pitada de sal. Deixe descansar 10 minutos.', 'Faça discos finos na frigideira antiaderente, sem gordura.', 'Refogue cebola, alho e a carne; tempere e deixe secar.', 'Recheie, enrole, cubra com o molho e leve ao forno por 10 minutos.']::text[],
  'A massa pronta congela com plástico entre os discos e dura 2 meses. Fazer o dobro dá o mesmo trabalho.',
  44)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'abobrinha-recheada-vegetariana',
  'Abobrinha recheada com grão-de-bico',
  'Recheio vegetariano que fica firme e não vira papa no forno.',
  array['principal', 'vegetariana', 'vegana', 'lowcarb']::text[],
  30, 2, 365,
  268.7, 9.9, 33.2, 12.3, 9.7,
  '[{"item": "2 abobrinhas grandes", "gramas": 400, "taco_id": 71, "fonte": null, "nome_tabela": "Abobrinha, italiana, crua"}, {"item": "1 xícara de grão-de-bico cozido", "gramas": 150, "taco_id": null, "fonte": "extra:grao_bico_cozido", "nome_tabela": "grao_bico_cozido"}, {"item": "1 tomate", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1/2 cebola e 2 dentes de alho", "gramas": 60, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, cúrcuma e salsinha", "gramas": 10, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Corte as abobrinhas ao meio e retire o miolo com a colher.', 'Refogue cebola, alho e o miolo picado; junte o grão-de-bico amassado grosseiramente e o tomate.', 'Recheie e asse a 200 °C por 20 minutos.']::text[],
  'Amasse só metade do grão-de-bico: a outra metade inteira é o que dá textura e faz o recheio parecer carne moída.',
  45)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'arroz-integral-com-legumes',
  'Arroz integral com legumes',
  'Deixa de ser acompanhamento e vira o prato — com o que tiver na geladeira.',
  array['principal', 'vegana', 'vegetariana', 'economica']::text[],
  30, 4, 207,
  208.2, 4.9, 34.0, 6.3, 6.1,
  '[{"item": "2 xícaras de arroz integral cozido", "gramas": 400, "taco_id": 1, "fonte": null, "nome_tabela": "Arroz, integral, cozido"}, {"item": "1 cenoura em cubinhos", "gramas": 100, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "1 xícara de brócolis", "gramas": 120, "taco_id": 100, "fonte": null, "nome_tabela": "Brócolis, cozido"}, {"item": "1/2 xícara de ervilha", "gramas": 80, "taco_id": 560, "fonte": null, "nome_tabela": "Ervilha, enlatada, drenada"}, {"item": "1 cebola e 2 dentes de alho", "gramas": 100, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal e cebolinha", "gramas": 8, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Refogue cebola e alho no azeite.', 'Junte a cenoura, depois o brócolis e a ervilha, e refogue por 5 minutos.', 'Misture o arroz integral já cozido, acerte o sal e finalize com cebolinha.']::text[],
  'Arroz integral demora 40 minutos para cozinhar — cozinhe uma panela grande no domingo e ele resolve quatro jantares.',
  46)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'tofu-mexido-com-curcuma',
  'Tofu mexido com cúrcuma',
  'A versão vegana do ovo mexido, com a mesma cor e mais proteína do que parece.',
  array['principal', 'vegana', 'vegetariana', 'lowcarb']::text[],
  30, 2, 234,
  162.2, 11.1, 7.7, 11.1, 2.5,
  '[{"item": "300 g de tofu firme", "gramas": 300, "taco_id": 584, "fonte": null, "nome_tabela": "Soja, queijo (tofu)"}, {"item": "1/2 cebola", "gramas": 50, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "1 tomate", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "2 dentes de alho", "gramas": 8, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "cúrcuma, sal, pimenta e cebolinha", "gramas": 10, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Esprema o tofu num pano limpo para tirar a água — é o passo que todo mundo pula e que decide a textura.', 'Esfarele com as mãos e refogue com cebola, alho e cúrcuma.', 'Junte o tomate no fim e deixe secar por 5 minutos.']::text[],
  'Tofu não tem gosto por natureza — ele pega o tempero que você der. Quem achou ruim provou sem tempero nenhum.',
  47)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'salada-de-repolho-roxo-com-cenoura',
  'Salada de repolho roxo com cenoura e gergelim',
  'Dura 3 dias na geladeira sem murchar — a salada da marmita de segunda a quarta.',
  array['salada', 'vegana', 'vegetariana', 'economica', 'lowcarb', 'detox']::text[],
  30, 4, 172,
  146.6, 3.7, 13.2, 10.2, 4.3,
  '[{"item": "1/2 repolho roxo fatiado fino", "gramas": 400, "taco_id": 150, "fonte": null, "nome_tabela": "Repolho, roxo, cru"}, {"item": "2 cenouras raladas", "gramas": 200, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "2 colheres de sopa de gergelim", "gramas": 20, "taco_id": 593, "fonte": null, "nome_tabela": "Gergelim, semente"}, {"item": "3 colheres de sopa de azeite", "gramas": 30, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "suco de 2 limões, sal e pimenta", "gramas": 40, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Fatie o repolho o mais fino que conseguir e rale a cenoura no ralo grosso.', 'Tempere com limão e sal e AMASSE com as mãos por 1 minuto: ele murcha na medida e para de soltar água depois.', 'Junte o azeite e o gergelim tostado na frigideira seca.']::text[],
  'É o amassar com sal e limão que faz esta salada durar. Sem isso, no dia seguinte ela vira água no fundo do pote.',
  48)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'sopa-de-legumes-com-frango',
  'Sopa de legumes com frango desfiado',
  'Jantar quente e completo de dia frio, sem creme e sem caldo de tablete.',
  array['principal', 'economica']::text[],
  30, 4, 568,
  188.1, 18.7, 17.5, 4.9, 3.6,
  '[{"item": "300 g de peito de frango", "gramas": 300, "taco_id": 409, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cru"}, {"item": "2 batatas", "gramas": 250, "taco_id": 92, "fonte": null, "nome_tabela": "Batata, inglesa, crua"}, {"item": "2 cenouras", "gramas": 200, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "1 chuchu", "gramas": 200, "taco_id": 113, "fonte": null, "nome_tabela": "Chuchu, cru"}, {"item": "1 cebola e 3 dentes de alho", "gramas": 110, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "1,2 litro de água, sal, louro e cheiro-verde", "gramas": 1200, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Doure a cebola e o alho no azeite no fundo da panela, junte o frango inteiro e a água.', 'Cozinhe 15 minutos, tire o frango e desfie.', 'Ponha os legumes em cubos nesse caldo e cozinhe até ficarem macios.', 'Volte o frango desfiado, acerte o sal e finalize com cheiro-verde.']::text[],
  'Caldo de tablete é sal, gordura e realçador. Cozinhar o frango na própria água da sopa dá o caldo de graça e sem sódio nenhum a mais.',
  49)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'pizza-de-frigideira',
  'Pizza de frigideira',
  'Mata a vontade de pizza numa sexta sem pedir delivery.',
  array['principal', 'lowcarb', 'vegetariana']::text[],
  30, 2, 238,
  364.6, 24.1, 17.5, 22.2, 3.5,
  '[{"item": "3 ovos", "gramas": 150, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "3 colheres de sopa de farinha de aveia", "gramas": 30, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "1/2 xícara de molho de tomate", "gramas": 100, "taco_id": 159, "fonte": null, "nome_tabela": "Tomate, molho industrializado"}, {"item": "100 g de mussarela", "gramas": 100, "taco_id": null, "fonte": "extra:mussarela", "nome_tabela": "mussarela"}, {"item": "tomate em rodelas e orégano", "gramas": 90, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1 colher de chá de azeite", "gramas": 5, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}]'::jsonb,
  array['Bata os ovos com a farinha de aveia e uma pitada de sal.', 'Faça um disco na frigideira antiaderente em fogo baixo, tampado, até firmar.', 'Vire, espalhe o molho, a mussarela e o tomate.', 'Tampe por 3 minutos, só até derreter o queijo.']::text[],
  'Não é pizza de padaria e não adianta fingir que é. É a resposta honesta para a vontade de sexta à noite — com proteína no lugar da farinha branca.',
  50)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'salada-caprese-com-azeite',
  'Caprese de tomate e queijo',
  'Três ingredientes italianos e o jantar de verão que não precisa de fogão.',
  array['salada', 'vegetariana', 'lowcarb', 'cetogenica']::text[],
  5, 2, 224,
  334.1, 18.1, 5.8, 27.1, 1.6,
  '[{"item": "3 tomates em rodelas", "gramas": 270, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "150 g de mussarela de búfala", "gramas": 150, "taco_id": null, "fonte": "extra:mussarela", "nome_tabela": "mussarela"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "manjericão, sal e pimenta", "gramas": 8, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Corte o tomate e o queijo em rodelas da mesma espessura e intercale no prato.', 'Regue com azeite e salpique sal grosso e pimenta.', 'Rasgue o manjericão com a mão na hora de servir — cortado com faca, ele escurece.']::text[],
  'Tomate na geladeira perde o sabor. Guarde fora dela e você não vai precisar de tempero nenhum além do sal.',
  51)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'frango-ao-molho-de-mostarda',
  'Frango ao molho de mostarda e creme',
  'Molho de restaurante com iogurte grego, sem farinha e sem creme de leite de caixinha.',
  array['principal', 'lowcarb', 'cetogenica']::text[],
  30, 3, 229,
  270.4, 39.2, 3.2, 10.2, 0.7,
  '[{"item": "500 g de peito de frango em bifes", "gramas": 500, "taco_id": 409, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cru"}, {"item": "3 colheres de sopa de iogurte grego natural", "gramas": 90, "taco_id": null, "fonte": "extra:iogurte_grego", "nome_tabela": "iogurte_grego"}, {"item": "2 colheres de sopa de mostarda", "gramas": 30, "taco_id": null, "fonte": "extra:mostarda", "nome_tabela": "mostarda"}, {"item": "1/2 cebola", "gramas": 50, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, pimenta e salsinha", "gramas": 8, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Grelhe os bifes temperados no azeite e reserve.', 'Na mesma panela, refogue a cebola com um pouco de água para soltar o fundo dourado — é dali que vem o sabor do molho.', 'Desligue o fogo, misture o iogurte e a mostarda e volte o frango só para aquecer.']::text[],
  'Iogurte grego natural tem quase o dobro da proteína do comum e nenhum açúcar. O ''grego'' de potinho de sobremesa é outra coisa: leia o rótulo.',
  52)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'mousse-de-coco-cetogenico',
  'Mousse de coco',
  'Sobremesa cremosa sem açúcar e sem farinha, pronta em 10 minutos.',
  array['sobremesa', 'lowcarb', 'cetogenica', 'vegana', 'vegetariana']::text[],
  10, 3, 75,
  137.9, 0.9, 2.2, 15.1, 0.8,
  '[{"item": "1 lata de leite de coco gelado", "gramas": 200, "taco_id": 523, "fonte": null, "nome_tabela": "Leite, de coco"}, {"item": "2 colheres de sopa de coco ralado", "gramas": 20, "taco_id": 590, "fonte": null, "nome_tabela": "Coco, cru"}, {"item": "adoçante a gosto", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "raspas de limão", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Deixe a lata de leite de coco na geladeira de um dia para o outro e use só a parte grossa de cima.', 'Bata na batedeira por 3 minutos, até virar chantilly.', 'Misture o coco ralado, o adoçante e as raspas de limão e leve à geladeira.']::text[],
  'Só funciona com leite de coco integral gelado — o light não tem gordura suficiente para montar.',
  53)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'salmao-grelhado-com-brocolis',
  'Salmão grelhado com brócolis no alho',
  'O jantar de 15 minutos que entrega ômega-3 e sai da frigideira direto para o prato.',
  array['principal', 'lowcarb', 'cetogenica']::text[],
  30, 2, 322,
  388.7, 32.6, 8.7, 25.3, 5.4,
  '[{"item": "2 postas de salmão", "gramas": 300, "taco_id": 316, "fonte": null, "nome_tabela": "Salmão, sem pele, fresco, cru"}, {"item": "1 maço de brócolis", "gramas": 300, "taco_id": 100, "fonte": null, "nome_tabela": "Brócolis, cozido"}, {"item": "3 dentes de alho", "gramas": 12, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, limão e pimenta", "gramas": 12, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Tempere o salmão só com sal e limão e grelhe com a pele para baixo por 4 minutos, sem mexer.', 'Vire e deixe 2 minutos — o miolo pode ficar levemente rosado.', 'Cozinhe o brócolis no vapor por 5 minutos e salteie no azeite com alho.']::text[],
  'Se o salmão estiver caro, esta receita fica igual de boa com sardinha fresca ou cavala — os três têm o mesmo tipo de gordura.',
  54)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'bolo-de-banana-com-aveia',
  'Bolo de banana com aveia',
  'Bolo que se adoça sozinho com a fruta — sem açúcar e sem farinha branca.',
  array['sobremesa', 'vegetariana', 'fruta', 'economica']::text[],
  60, 10, 76,
  146.6, 5.0, 21.7, 4.9, 2.4,
  '[{"item": "4 bananas bem maduras", "gramas": 400, "taco_id": 179, "fonte": null, "nome_tabela": "Banana, nanica, crua"}, {"item": "3 ovos", "gramas": 150, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "2 xícaras de aveia em flocos", "gramas": 180, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "2 colheres de sopa de óleo", "gramas": 20, "taco_id": 272, "fonte": null, "nome_tabela": "Óleo, de soja"}, {"item": "1 colher de sopa de fermento e canela", "gramas": 15, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Bata no liquidificador 3 bananas, os ovos e o óleo.', 'Misture a aveia numa tigela e por último o fermento, mexendo devagar.', 'Despeje na forma, cubra com a banana restante fatiada e canela.', 'Asse a 180 °C por 35 a 40 minutos — o palito sai limpo quando está pronto.']::text[],
  'Bananas com casca preta são as ideais: quanto mais maduras, mais doce o bolo, e você não precisa de açúcar nenhum.',
  55)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'bolo-de-cenoura-integral',
  'Bolo de cenoura integral',
  'O bolo da vovó com farinha integral e cobertura de cacau de verdade.',
  array['sobremesa', 'vegetariana', 'economica']::text[],
  60, 12, 82,
  221.0, 5.0, 30.2, 10.2, 3.6,
  '[{"item": "3 cenouras médias", "gramas": 300, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "3 ovos", "gramas": 150, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "1/2 xícara de óleo", "gramas": 100, "taco_id": 272, "fonte": null, "nome_tabela": "Óleo, de soja"}, {"item": "2 xícaras de farinha de trigo integral", "gramas": 240, "taco_id": null, "fonte": "extra:farinha_trigo_integral", "nome_tabela": "farinha_trigo_integral"}, {"item": "1 xícara de açúcar mascavo", "gramas": 160, "taco_id": 493, "fonte": null, "nome_tabela": "Açúcar, mascavo"}, {"item": "1 colher de sopa de fermento", "gramas": 15, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "2 colheres de sopa de cacau em pó para a calda", "gramas": 20, "taco_id": null, "fonte": "extra:cacau_po", "nome_tabela": "cacau_po"}]'::jsonb,
  array['Bata no liquidificador a cenoura crua picada, os ovos e o óleo até ficar liso.', 'Misture com a farinha e o açúcar mascavo, e o fermento por último.', 'Asse a 180 °C por 40 minutos.', 'Para a calda, ferva o cacau com 3 colheres de água e 2 de açúcar mascavo por 2 minutos.']::text[],
  'Continua sendo bolo — o integral e o mascavo mudam a fibra e o sabor, não a caloria. A diferença que importa é comer um pedaço, não metade da forma.',
  56)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'lasanha-de-berinjela',
  'Lasanha de berinjela',
  'A lasanha inteira, sem uma folha de massa — e ninguém sente falta.',
  array['principal', 'lowcarb', 'economica']::text[],
  60, 6, 325,
  297.1, 28.2, 12.8, 15.3, 5.9,
  '[{"item": "3 berinjelas grandes em fatias", "gramas": 700, "taco_id": 96, "fonte": null, "nome_tabela": "Berinjela, crua"}, {"item": "500 g de patinho moído", "gramas": 500, "taco_id": 376, "fonte": null, "nome_tabela": "Carne, bovina, patinho, sem gordura, cru"}, {"item": "2 xícaras de molho de tomate", "gramas": 400, "taco_id": 159, "fonte": null, "nome_tabela": "Tomate, molho industrializado"}, {"item": "200 g de mussarela", "gramas": 200, "taco_id": null, "fonte": "extra:mussarela", "nome_tabela": "mussarela"}, {"item": "1 cebola e 3 dentes de alho", "gramas": 120, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, orégano e manjericão", "gramas": 12, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Fatie a berinjela no comprimento, pincele azeite e asse a 220 °C por 15 minutos — isso tira a água e evita a lasanha aguada.', 'Refogue cebola, alho e carne e junte o molho de tomate.', 'Monte em camadas: berinjela, carne, queijo, repetindo.', 'Asse a 200 °C por 25 minutos.']::text[],
  'Não pule o passo de assar a berinjela antes. É a diferença entre lasanha e sopa de berinjela na travessa.',
  57)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'frango-assado-inteiro-com-legumes',
  'Frango assado inteiro com legumes',
  'O almoço de domingo que vira marmita de segunda e caldo de terça.',
  array['principal', 'economica']::text[],
  60, 6, 306,
  391.9, 42.4, 19.8, 15.4, 3.4,
  '[{"item": "1 frango inteiro de 1,2 kg (dá cerca de 800 g de carne)", "gramas": 800, "taco_id": 393, "fonte": null, "nome_tabela": "Frango, caipira, inteiro, sem pele, cozido"}, {"item": "4 batatas", "gramas": 500, "taco_id": 92, "fonte": null, "nome_tabela": "Batata, inglesa, crua"}, {"item": "3 cenouras", "gramas": 300, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "1 cebola grande", "gramas": 150, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "6 dentes de alho", "gramas": 24, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "3 colheres de sopa de azeite", "gramas": 30, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, limão, alecrim e páprica", "gramas": 30, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Tempere o frango por dentro e por fora e deixe na geladeira o máximo que der (esse tempo é de espera).', 'Espalhe os legumes em pedaços grandes na assadeira e ponha o frango por cima.', 'Asse coberto com papel-alumínio a 200 °C por 40 minutos.', 'Tire o alumínio e asse mais 15 a 20 minutos para dourar.']::text[],
  'Guarde a carcaça: fervida com cebola e cheiro-verde por 40 minutos, ela vira um caldo caseiro que aposenta o tablete.',
  58)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'moqueca-de-peixe',
  'Moqueca de peixe',
  'Prato de festa numa panela só — e sem dendê pesado.',
  array['principal']::text[],
  60, 4, 379,
  324.6, 31.6, 10.6, 17.9, 2.9,
  '[{"item": "700 g de filé de merluza", "gramas": 700, "taco_id": 302, "fonte": null, "nome_tabela": "Merluza, filé, cru"}, {"item": "1 vidro de leite de coco", "gramas": 200, "taco_id": 523, "fonte": null, "nome_tabela": "Leite, de coco"}, {"item": "2 tomates", "gramas": 180, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "2 pimentões", "gramas": 220, "taco_id": 145, "fonte": null, "nome_tabela": "Pimentão, vermelho, cru"}, {"item": "1 cebola grande", "gramas": 150, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "4 dentes de alho", "gramas": 16, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "coentro, sal, limão e páprica", "gramas": 30, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}]'::jsonb,
  array['Tempere o peixe com limão, alho e sal e deixe 20 minutos.', 'Faça camadas na panela: cebola, tomate, pimentão, peixe, e repita.', 'Regue com azeite e leite de coco, tampe e cozinhe em fogo BAIXO por 25 minutos, sem mexer.', 'Finalize com coentro. Nunca mexa com colher — balance a panela, senão o peixe desmancha.']::text[],
  'Leite de coco de vidro costuma ter só coco e água. O de caixinha ''para culinária'' quase sempre traz espessante e conservante — vire e compare.',
  59)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'torta-de-liquidificador-de-frango',
  'Torta de liquidificador de frango',
  'Massa no liquidificador, recheio do que sobrou, e o jantar de quinta está resolvido.',
  array['principal', 'economica']::text[],
  60, 8, 152,
  307.3, 22.2, 18.5, 16.4, 2.7,
  '[{"item": "3 ovos", "gramas": 150, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "1 xícara de leite desnatado", "gramas": 200, "taco_id": 457, "fonte": null, "nome_tabela": "Leite, de vaca, desnatado, UHT"}, {"item": "1/2 xícara de óleo", "gramas": 100, "taco_id": 272, "fonte": null, "nome_tabela": "Óleo, de soja"}, {"item": "1,5 xícara de farinha de trigo integral", "gramas": 180, "taco_id": null, "fonte": "extra:farinha_trigo_integral", "nome_tabela": "farinha_trigo_integral"}, {"item": "400 g de frango cozido desfiado", "gramas": 400, "taco_id": 408, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cozido"}, {"item": "1 tomate e 1 cebola", "gramas": 170, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "1 colher de sopa de fermento e sal", "gramas": 15, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Bata os ovos, o leite e o óleo; junte a farinha e o sal e, por último, o fermento.', 'Refogue o frango com cebola e tomate e tempere bem.', 'Ponha metade da massa na forma, o recheio, e cubra com o resto.', 'Asse a 200 °C por 35 a 40 minutos.']::text[],
  'Recheio molhado afunda a massa. Deixe o frango secar bem na panela antes de montar.',
  60)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'granola-caseira-sem-acucar',
  'Granola caseira sem açúcar',
  'Um pote que dura o mês e custa metade da granola ''fit'' do mercado.',
  array['sobremesa', 'vegana', 'vegetariana', 'economica']::text[],
  60, 15, 33,
  146.0, 3.7, 17.8, 7.3, 2.5,
  '[{"item": "3 xícaras de aveia em flocos", "gramas": 270, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "1/2 xícara de castanha-de-caju picada", "gramas": 70, "taco_id": 588, "fonte": null, "nome_tabela": "Castanha-de-caju, torrada, salgada"}, {"item": "1/2 xícara de coco em lascas", "gramas": 50, "taco_id": 590, "fonte": null, "nome_tabela": "Coco, cru"}, {"item": "3 colheres de sopa de mel", "gramas": 60, "taco_id": 507, "fonte": null, "nome_tabela": "Mel, de abelha"}, {"item": "2 colheres de sopa de óleo de coco", "gramas": 25, "taco_id": null, "fonte": "extra:oleo_coco", "nome_tabela": "oleo_coco"}, {"item": "2 colheres de sopa de linhaça e canela", "gramas": 25, "taco_id": 594, "fonte": null, "nome_tabela": "Linhaça, semente"}]'::jsonb,
  array['Misture tudo numa tigela até a aveia ficar úmida por igual.', 'Espalhe FINO numa assadeira e asse a 160 °C por 25 minutos, mexendo na metade do tempo.', 'Deixe esfriar COMPLETAMENTE na assadeira antes de guardar — é ao esfriar que ela fica crocante.']::text[],
  'Compare com a do mercado: a industrializada costuma ter açúcar entre os três primeiros ingredientes, e algumas trazem cobertura de chocolate chamada de ''gotas''.',
  61)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'cookies-de-aveia-com-banana',
  'Cookies de aveia com banana',
  'Três ingredientes, 20 minutos de forno, e a lancheira da semana resolvida.',
  array['sobremesa', 'vegana', 'vegetariana', 'economica', 'fruta']::text[],
  60, 12, 42,
  85.7, 2.8, 16.9, 1.5, 2.5,
  '[{"item": "3 bananas maduras", "gramas": 300, "taco_id": 179, "fonte": null, "nome_tabela": "Banana, nanica, crua"}, {"item": "2 xícaras de aveia em flocos", "gramas": 180, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "2 colheres de sopa de cacau em pó ou uvas-passas", "gramas": 20, "taco_id": null, "fonte": "extra:cacau_po", "nome_tabela": "cacau_po"}, {"item": "canela", "gramas": 3, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Amasse bem as bananas com o garfo.', 'Misture a aveia e a canela até dar liga; deixe descansar 5 minutos para a aveia hidratar.', 'Faça montinhos achatados na assadeira forrada e asse a 180 °C por 20 minutos.']::text[],
  'Dura 4 dias em pote fechado e congela bem. É o lanche que evita a compra de biscoito recheado na saída da escola.',
  62)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'almondegas-ao-molho-de-tomate',
  'Almôndegas ao molho de tomate',
  'Rende, congela e agrada criança — com carne magra e aveia no lugar da farinha.',
  array['principal', 'economica']::text[],
  60, 5, 235,
  259.3, 29.8, 12.8, 9.7, 3.5,
  '[{"item": "600 g de patinho moído", "gramas": 600, "taco_id": 376, "fonte": null, "nome_tabela": "Carne, bovina, patinho, sem gordura, cru"}, {"item": "1 ovo", "gramas": 50, "taco_id": 489, "fonte": null, "nome_tabela": "Ovo, de galinha, inteiro, cru"}, {"item": "4 colheres de sopa de aveia em flocos", "gramas": 40, "taco_id": 7, "fonte": null, "nome_tabela": "Aveia, flocos, crua"}, {"item": "1/2 cebola e 3 dentes de alho", "gramas": 62, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 xícaras de molho de tomate", "gramas": 400, "taco_id": 159, "fonte": null, "nome_tabela": "Tomate, molho industrializado"}, {"item": "1 colher de sopa de azeite", "gramas": 10, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, orégano e salsinha", "gramas": 12, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Misture a carne, o ovo, a aveia, a cebola bem picada e os temperos.', 'Faça bolinhas do tamanho de uma noz e doure na panela com azeite, girando para pegar cor de todos os lados.', 'Cubra com o molho de tomate e cozinhe tampado em fogo baixo por 20 minutos.']::text[],
  'A aveia faz aqui o mesmo papel da farinha de rosca — e ainda entrega fibra em vez de farinha branca.',
  63)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'compota-de-maca-sem-acucar',
  'Compota de maçã com canela',
  'Sobremesa quente de inverno com o açúcar que já vem na fruta.',
  array['sobremesa', 'fruta', 'vegana', 'vegetariana', 'economica']::text[],
  60, 4, 236,
  112.6, 0.6, 31.0, 0.0, 2.7,
  '[{"item": "6 maçãs com casca", "gramas": 800, "taco_id": 222, "fonte": null, "nome_tabela": "Maçã, Fuji, com casca, crua"}, {"item": "1 pau de canela e cravo", "gramas": 5, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "suco de 1 limão", "gramas": 20, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}, {"item": "1/2 xícara de água", "gramas": 120, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Corte as maçãs em cubos, com casca (é nela que está a maior parte da fibra).', 'Cozinhe em fogo baixo com a água, o limão e as especiarias por 30 minutos, mexendo às vezes.', 'Amasse com o garfo para a textura que preferir.']::text[],
  'Dura 5 dias na geladeira e substitui geleia no pão — a geleia de pote é, em geral, mais açúcar do que fruta.',
  64)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'feijao-carioca-do-zero',
  'Feijão carioca do zero',
  'A panela que alimenta a semana por menos de R$ 1 a porção.',
  array['principal', 'vegana', 'vegetariana', 'economica']::text[],
  120, 10, 71,
  190.4, 10.4, 32.4, 2.7, 9.6,
  '[{"item": "500 g de feijão carioca seco", "gramas": 500, "taco_id": 562, "fonte": null, "nome_tabela": "Feijão, carioca, cru"}, {"item": "1 cebola grande", "gramas": 150, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "5 dentes de alho", "gramas": 20, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "2 folhas de louro, sal e cheiro-verde", "gramas": 20, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Deixe o feijão de molho por 8 a 12 horas, trocando a água uma vez (esse tempo é de espera, não de trabalho).', 'Jogue fora a água do molho: é ela que leva boa parte do que causa gases.', 'Cozinhe na pressão com água nova e louro por 25 minutos depois que pegar pressão.', 'Refogue cebola e alho no azeite, junte 2 conchas de feijão amassado, devolva à panela e cozinhe mais 10 minutos.']::text[],
  'Feijão é a proteína mais barata do Brasil e, com arroz, forma proteína completa. Congele em porções: descongela em 3 minutos e acaba com a desculpa do ''não tenho o que comer''.',
  65)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'frango-desfiado-da-semana',
  'Frango desfiado da semana',
  'Duas horas de domingo que viram cinco jantares — a base de metade das receitas daqui.',
  array['principal', 'economica', 'lowcarb']::text[],
  120, 8, 206,
  217.6, 33.1, 3.6, 7.1, 0.9,
  '[{"item": "1,2 kg de peito de frango", "gramas": 1200, "taco_id": 409, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cru"}, {"item": "2 cebolas", "gramas": 200, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "6 dentes de alho", "gramas": 24, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 tomates", "gramas": 180, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "sal, louro, páprica e cúrcuma", "gramas": 25, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Cozinhe o peito inteiro em água com louro e sal por 30 minutos.', 'Desfie com dois garfos ainda morno — frio, ele resiste.', 'Refogue cebola, alho e tomate no azeite e junte o frango com um pouco da água do cozimento.', 'Divida em potes de uma refeição e congele o que não for usar em 3 dias.']::text[],
  'Guarde a água do cozimento: é caldo de frango de verdade, sem sódio, e vale ouro na sopa da semana.',
  66)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'pao-integral-caseiro',
  'Pão integral caseiro',
  'Quatro ingredientes contra os vinte do pão de forma da prateleira.',
  array['vegetariana', 'vegana', 'economica']::text[],
  120, 14, 60,
  135.4, 4.2, 26.3, 2.2, 2.9,
  '[{"item": "3 xícaras de farinha de trigo integral", "gramas": 360, "taco_id": null, "fonte": "extra:farinha_trigo_integral", "nome_tabela": "farinha_trigo_integral"}, {"item": "1 xícara de farinha de trigo comum", "gramas": 120, "taco_id": 35, "fonte": null, "nome_tabela": "Farinha, de trigo"}, {"item": "1 tablete de fermento biológico fresco", "gramas": 15, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "1 colher de sopa de mel", "gramas": 20, "taco_id": 507, "fonte": null, "nome_tabela": "Mel, de abelha"}, {"item": "300 ml de água morna e sal", "gramas": 300, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Dissolva o fermento no mel com um pouco de água morna (morna, não quente: água fervendo mata o fermento).', 'Misture as farinhas, o sal, o azeite e a água e sove por 10 minutos, até a massa ficar lisa.', 'Deixe crescer coberto por 1 hora, até dobrar (tempo de espera).', 'Modele, ponha na forma, deixe crescer mais 30 minutos e asse a 200 °C por 35 minutos.']::text[],
  'Vire o pacote do pão de forma industrializado: além do açúcar e da gordura, ele traz conservante para durar 15 dias na prateleira. Este dura 4 — e é por isso que ele é pão.',
  67)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'carne-de-panela-com-legumes',
  'Carne de panela com legumes',
  'O corte barato que fica macio de tanto tempo — e faz o próprio molho.',
  array['principal', 'economica']::text[],
  120, 6, 341,
  336.2, 38.7, 15.9, 12.7, 3.4,
  '[{"item": "1 kg de músculo em cubos", "gramas": 1000, "taco_id": 372, "fonte": null, "nome_tabela": "Carne, bovina, músculo, sem gordura, cru"}, {"item": "3 cenouras", "gramas": 300, "taco_id": 110, "fonte": null, "nome_tabela": "Cenoura, crua"}, {"item": "2 batatas grandes", "gramas": 300, "taco_id": 92, "fonte": null, "nome_tabela": "Batata, inglesa, crua"}, {"item": "2 cebolas", "gramas": 200, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "5 dentes de alho", "gramas": 20, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "2 tomates", "gramas": 180, "taco_id": 157, "fonte": null, "nome_tabela": "Tomate, com semente, cru"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "louro, sal, pimenta e cheiro-verde", "gramas": 25, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Doure a carne em levas, sem lotar a panela — é o dourado que dá cor e sabor ao molho.', 'Refogue cebola, alho e tomate no mesmo fundo.', 'Volte a carne, cubra com água quente e cozinhe tampado por 1h30 em fogo baixo (ou 40 min na pressão).', 'Junte os legumes na última meia hora, para não desmancharem.']::text[],
  'Músculo e acém custam metade do filé e ficam mais macios em cozimento longo. Carne de panela cara é dinheiro jogado fora.',
  68)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'homus-de-grao-de-bico',
  'Homus de grão-de-bico',
  'Pasta cremosa para a semana toda, do jeito árabe, com grão cozido em casa.',
  array['vegana', 'vegetariana', 'economica', 'salada']::text[],
  120, 8, 54,
  202.4, 8.9, 23.4, 8.9, 5.2,
  '[{"item": "300 g de grão-de-bico seco", "gramas": 300, "taco_id": 575, "fonte": null, "nome_tabela": "Grão-de-bico, cru"}, {"item": "3 colheres de sopa de gergelim (ou tahine)", "gramas": 30, "taco_id": 593, "fonte": null, "nome_tabela": "Gergelim, semente"}, {"item": "4 colheres de sopa de azeite", "gramas": 40, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "suco de 2 limões", "gramas": 40, "taco_id": 220, "fonte": null, "nome_tabela": "Limão, tahiti, cru"}, {"item": "3 dentes de alho", "gramas": 12, "taco_id": 82, "fonte": null, "nome_tabela": "Alho, cru"}, {"item": "sal, cominho e páprica", "gramas": 12, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Deixe o grão-de-bico de molho de um dia para o outro (tempo de espera) e cozinhe na pressão por 25 minutos.', 'Guarde a água do cozimento antes de escorrer.', 'Bata tudo no processador, juntando a água do cozimento aos poucos até virar creme.', 'Sirva com azeite e páprica por cima.']::text[],
  'É a água do cozimento — não mais azeite — que deixa o homus cremoso. Foi assim que virou o creme que é há séculos.',
  69)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();

insert into public.mercado_receitas
  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,
   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)
values (
  'caldo-verde-leve',
  'Caldo verde leve',
  'O caldo de festa junina sem a linguiça gordurosa boiando por cima.',
  array['principal', 'economica']::text[],
  60, 6, 443,
  150.0, 8.7, 20.7, 4.1, 2.9,
  '[{"item": "5 batatas", "gramas": 700, "taco_id": 92, "fonte": null, "nome_tabela": "Batata, inglesa, crua"}, {"item": "1 maço de couve fatiada fina", "gramas": 200, "taco_id": 115, "fonte": null, "nome_tabela": "Couve, manteiga, crua"}, {"item": "100 g de frango desfiado", "gramas": 100, "taco_id": 408, "fonte": null, "nome_tabela": "Frango, peito, sem pele, cozido"}, {"item": "1 cebola e 4 dentes de alho", "gramas": 140, "taco_id": 107, "fonte": null, "nome_tabela": "Cebola, crua"}, {"item": "2 colheres de sopa de azeite", "gramas": 20, "taco_id": 260, "fonte": null, "nome_tabela": "Azeite, de oliva, extra virgem"}, {"item": "1,5 litro de água, sal e pimenta", "gramas": 1500, "taco_id": null, "fonte": "extra:livre", "nome_tabela": "livre"}]'::jsonb,
  array['Cozinhe as batatas na água com sal até desmancharem e bata no liquidificador com o próprio caldo.', 'Refogue cebola e alho no azeite e junte o creme de batata.', 'Ponha o frango desfiado e, com o fogo desligado, a couve fatiada bem fina.', 'A couve cozinha só com o calor do caldo — assim ela fica verde e não perde tudo.']::text[],
  'A cremosidade vem da batata, não do creme de leite. A linguiça calabresa tradicional traz mais sódio numa rodela do que a sopa inteira precisa.',
  70)
on conflict (slug) do update set
  titulo=excluded.titulo, chamada=excluded.chamada,
  categorias=excluded.categorias, tempo_min=excluded.tempo_min,
  rende=excluded.rende, porcao_g=excluded.porcao_g,
  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,
  lip=excluded.lip, fibra=excluded.fibra,
  ingredientes=excluded.ingredientes, preparo=excluded.preparo,
  dica=excluded.dica, ordem=excluded.ordem,
  atualizado_em=now();


notify pgrst, 'reload schema';

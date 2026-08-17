# -*- coding: utf-8 -*-
"""
Receitas do app "No mercado com a Nutri Ana" — a FONTE do acervo.

COMO LER UM INGREDIENTE
    ("2 ovos", 100, 489)
     |          |    +-- linha da TACO que dá o número (taco_alimentos.id)
     |          +------- gramas que entram na conta
     +------------------ como se compra e se mede na cozinha

Quem faz a conta é calcular_receitas.py: soma os ingredientes pela TACO,
divide pelas porções e gera o SQL. Nenhum valor nutricional é digitado
aqui — se estivesse digitado, ninguém saberia refazer a conta depois.

QUANDO O ALIMENTO NÃO ESTÁ NA TACO
    A TACO é de 2011 e não tem chia, quinoa, whey nem pasta de amendoim.
    Nesses casos o id vira uma chave de texto do dicionário EXTRA, logo
    abaixo, onde cada valor traz a fonte. É a exceção — a régua continua
    sendo a tabela brasileira.

TEMPO
    'tempo' é a faixa que a tela filtra (5, 10, 30, 60, 120) e conta o
    tempo de MÃO NA MASSA, não o do relógio. Bolo que assa 40 min sem
    ninguém olhar é 60; geladeira de 4 h não vira 120.

CONFORMIDADE (Res. CFN 856/2026)
    Receita culinária é orientação geral. Nada aqui promete emagrecer,
    curar, desintoxicar ou tratar doença — 'detox' é o nome popular do
    filtro (o que a pessoa digita), e a tela explica que o corpo já tem
    fígado e rim para isso. Nenhuma receita indica suplemento em dose,
    e nenhuma se dirige a um paciente específico.
"""

# ------------------------------------------------------------------
# Alimentos fora da TACO — kcal, ptn, cho, lip, fibra por 100 g.
# ------------------------------------------------------------------
EXTRA = {
    "livre":          (0, 0, 0, 0, 0, "sal, vinagre, temperos secos, água, café e adoçante"),
    "chia":           (486, 16.5, 42.1, 30.7, 34.4, "USDA SR Legacy 12006"),
    "linhaca_dourada":(534, 18.3, 28.9, 42.2, 27.3, "USDA SR Legacy 12220"),
    "quinoa_cozida":  (120, 4.4, 21.3, 1.9, 2.8, "USDA SR Legacy 20137"),
    "grao_bico_cozido":(164, 8.9, 27.4, 2.6, 7.6, "USDA SR Legacy 16057"),
    "tilapia_grelhada":(128, 26.2, 0, 2.7, 0, "USDA SR Legacy 15262"),
    "whey_concentrado":(380, 78.0, 8.0, 4.0, 0, "média dos rótulos brasileiros, whey concentrado"),
    "cottage":        (98, 11.1, 3.4, 4.3, 0, "USDA SR Legacy 01015"),
    "mussarela":      (300, 22.2, 2.2, 22.4, 0, "TBCA/USP — queijo mussarela"),
    "gengibre":       (80, 1.8, 17.8, 0.8, 2.0, "USDA SR Legacy 11216"),
    "cacau_po":       (228, 19.6, 57.9, 13.7, 37.0, "USDA SR Legacy 19165 — cacau em pó 100%"),
    "pasta_amendoim": (588, 25.1, 19.6, 50.4, 6.0, "USDA SR Legacy 16098 — sem açúcar"),
    "leite_amendoas": (15, 0.6, 0.6, 1.2, 0.3, "média dos rótulos, sem açúcar"),
    "iogurte_grego":  (97, 9.0, 3.9, 5.0, 0, "USDA SR Legacy 01287 — natural, sem açúcar"),
    "oleo_coco":      (862, 0, 0, 100, 0, "USDA SR Legacy 04047"),
    "farinha_amendoa":(590, 21.2, 21.6, 50.6, 10.6, "USDA SR Legacy 12061"),
    "goma_tapioca":   (240, 0.1, 59.0, 0.1, 0.5, "TBCA/USP — goma de tapioca hidratada"),
    "pts_seca":       (337, 51.0, 33.0, 1.2, 17.0, "TBCA/USP — proteína texturizada de soja"),
    "shoyu":          (60, 10.5, 5.6, 0.1, 0.8, "USDA SR Legacy 16124"),
    "psyllium":       (200, 1.0, 88.0, 0.5, 80.0, "média dos rótulos"),
    "bulgur_seco":    (342, 12.3, 75.9, 1.3, 18.3, "USDA SR Legacy 20013 — trigo para quibe"),
    "farinha_trigo_integral": (340, 13.2, 72.6, 2.5, 10.7, "USDA SR Legacy 20080"),
    "milho_verde_lata": (98, 3.2, 21.4, 0.8, 2.5, "USDA SR Legacy 11901 — drenado"),
    "champignon":     (22, 3.1, 3.3, 0.3, 1.0, "USDA SR Legacy 11260"),
    "mostarda":       (66, 4.0, 5.0, 3.3, 3.3, "USDA SR Legacy 02046"),
    "leite_coco_leve":(75, 0.7, 2.0, 7.0, 0, "média dos rótulos — leite de coco light"),
}

RECEITAS = [

# ==================================================================
#  5 MINUTOS — o que se faz com fome, em pé, sem lavar panela
# ==================================================================

dict(
    slug="suco-verde-de-couve-abacaxi-e-gengibre",
    titulo="Suco verde de couve, abacaxi e gengibre",
    chamada="O clássico do 'detox' — só que sem promessa milagrosa e com fibra de verdade.",
    cat=["suco", "detox", "vegana", "vegetariana", "fruta"],
    tempo=5, rende=2,
    ing=[
        ("2 folhas grandes de couve", 40, 115),
        ("2 fatias de abacaxi", 150, 164),
        ("1 pedacinho de gengibre", 5, "gengibre"),
        ("suco de 1/2 limão", 15, 220),
        ("300 ml de água gelada", 300, "livre"),
    ],
    preparo=[
        "Lave bem as folhas de couve e rasgue com a mão, sem o talo mais grosso.",
        "Bata tudo no liquidificador com a água até ficar homogêneo.",
        "Beba sem coar: o que fica na peneira é justamente a fibra, que é o motivo de o suco valer mais que o refrigerante.",
    ],
    dica="Suco nenhum desintoxica ninguém — quem faz isso é o seu fígado, de graça e o dia inteiro. O que este aqui faz é te dar fruta e folha numa hora em que você provavelmente não comeria nem uma nem outra.",
),

dict(
    slug="suco-de-melancia-com-hortela",
    titulo="Suco de melancia com hortelã",
    chamada="Três ingredientes, zero açúcar adicionado e o preço de uma fatia de melancia.",
    cat=["suco", "fruta", "vegana", "vegetariana", "economica", "detox"],
    tempo=5, rende=2,
    ing=[
        ("2 fatias grossas de melancia sem casca", 400, 235),
        ("6 folhas de hortelã", 3, "livre"),
        ("suco de 1/2 limão", 15, 220),
    ],
    preparo=[
        "Corte a melancia em cubos e tire as sementes maiores.",
        "Bata com a hortelã e o limão. A melancia já tem água suficiente — não precisa acrescentar.",
        "Sirva na hora, com gelo.",
    ],
    dica="Nesta você não precisa adoçar nada. Se der vontade de pôr açúcar, prove antes: quase sempre a vontade some.",
),

dict(
    slug="vitamina-de-banana-com-aveia",
    titulo="Vitamina de banana com aveia",
    chamada="O café da manhã de quem acordou atrasada e não vai ficar com fome às 10 h.",
    cat=["suco", "fruta", "vegetariana", "economica"],
    tempo=5, rende=1,
    ing=[
        ("1 banana nanica", 100, 179),
        ("3 colheres de sopa de aveia em flocos", 30, 7),
        ("1 copo de leite desnatado", 200, 457),
        ("canela a gosto", 1, "livre"),
    ],
    preparo=[
        "Bata a banana com o leite até ficar liso.",
        "Junte a aveia e bata mais 10 segundos — se bater demais, vira cola.",
        "Polvilhe canela por cima.",
    ],
    dica="É a aveia que segura a fome: sozinha, a banana batida sobe e desce rápido. Banana mais madura deixa mais doce sem precisar de açúcar.",
),

dict(
    slug="creme-de-abacate-com-cacau",
    titulo="Creme de abacate com cacau",
    chamada="Gosto de mousse de chocolate, feito com fruta e sem forno.",
    cat=["sobremesa", "lowcarb", "cetogenica", "vegana", "vegetariana", "fruta"],
    tempo=5, rende=2,
    ing=[
        ("1/2 abacate maduro", 150, 163),
        ("1 colher de sopa cheia de cacau em pó 100%", 10, "cacau_po"),
        ("adoçante ou 1 colher de chá de mel", 7, 507),
        ("2 colheres de sopa de água gelada", 30, "livre"),
    ],
    preparo=[
        "Amasse bem o abacate com um garfo ou bata no mixer.",
        "Junte o cacau, o mel e a água e misture até virar um creme liso e escuro.",
        "Leve à geladeira por 10 minutos se quiser mais firme.",
    ],
    dica="Cacau em pó 100% é diferente de achocolatado: o segundo é açúcar com sabor de chocolate. Olhe a lista de ingredientes — se açúcar vier antes do cacau, é doce, não é cacau.",
),

dict(
    slug="iogurte-com-morango-e-castanha",
    titulo="Iogurte com morango e castanha",
    chamada="A sobremesa que substitui o pote de iogurte de morango do mercado — que é quase todo açúcar.",
    cat=["sobremesa", "fruta", "vegetariana", "lowcarb"],
    tempo=5, rende=1,
    ing=[
        ("1 pote de iogurte natural", 170, 448),
        ("6 morangos", 90, 239),
        ("2 castanhas-do-pará picadas", 10, 589),
    ],
    preparo=[
        "Corte os morangos e amasse metade deles com o garfo, para soltar o suco.",
        "Misture no iogurte natural.",
        "Cubra com o restante dos morangos e a castanha picada.",
    ],
    dica="Compare no mercado: o iogurte 'sabor morango' costuma ter o dobro de açúcar do natural — e o morango dele, quando existe, aparece no fim da lista.",
),

dict(
    slug="ovos-mexidos-cremosos",
    titulo="Ovos mexidos cremosos",
    chamada="Cinco minutos, uma frigideira e proteína suficiente para a manhã inteira.",
    cat=["principal", "lowcarb", "cetogenica", "vegetariana", "economica"],
    tempo=5, rende=1,
    ing=[
        ("2 ovos", 100, 489),
        ("1 colher de chá de manteiga", 5, 262),
        ("1 colher de sopa de requeijão", 15, 468),
        ("sal e cebolinha", 3, "livre"),
    ],
    preparo=[
        "Bata os ovos com o sal, sem exagero — bater demais deixa o ovo borrachudo.",
        "Derreta a manteiga em fogo BAIXO e despeje os ovos.",
        "Mexa devagar e tire do fogo quando ainda estiverem um pouco moles: eles terminam de cozinhar no calor da panela.",
        "Misture o requeijão fora do fogo e salpique cebolinha.",
    ],
    dica="Fogo alto é o que estraga ovo mexido. O creme vem do fogo baixo, não da quantidade de gordura.",
),

dict(
    slug="salada-de-tomate-pepino-e-cebola",
    titulo="Salada de tomate, pepino e cebola",
    chamada="A salada mais barata do Brasil, temperada do jeito certo.",
    cat=["salada", "vegana", "vegetariana", "economica", "lowcarb", "detox"],
    tempo=5, rende=2,
    ing=[
        ("2 tomates", 200, 157),
        ("1 pepino", 130, 142),
        ("1/2 cebola", 40, 107),
        ("1 colher de sopa de azeite", 10, 260),
        ("sal, vinagre e orégano", 5, "livre"),
    ],
    preparo=[
        "Corte tudo em cubos parecidos — salada com pedaços do mesmo tamanho come melhor.",
        "Deixe a cebola de molho em água gelada por 2 minutos se quiser tirar o ardido.",
        "Tempere com azeite, vinagre, sal e orégano só na hora de servir, senão o tomate solta água.",
    ],
    dica="O azeite não é vilão aqui: sem gordura, boa parte das vitaminas do tomate e da folha passa direto pelo seu corpo.",
),

dict(
    slug="banana-com-pasta-de-amendoim",
    titulo="Banana com pasta de amendoim",
    chamada="Doce de dois ingredientes para o fim da tarde, quando bate a fome de bobagem.",
    cat=["sobremesa", "fruta", "vegana", "vegetariana", "economica"],
    tempo=5, rende=1,
    ing=[
        ("1 banana", 100, 179),
        ("1 colher de sopa de pasta de amendoim integral", 20, "pasta_amendoim"),
        ("canela", 1, "livre"),
    ],
    preparo=[
        "Corte a banana ao meio no comprimento.",
        "Espalhe a pasta de amendoim por cima e polvilhe canela.",
        "Se quiser, leve ao congelador por 20 minutos: vira picolé.",
    ],
    dica="Pasta de amendoim boa tem UM ingrediente: amendoim. Se a lista trouxer açúcar, gordura vegetal e sal, você comprou doce, não amendoim.",
),

dict(
    slug="mamao-com-aveia-e-limao",
    titulo="Mamão com aveia e limão",
    chamada="Café da manhã de dois minutos que resolve o intestino preso melhor que qualquer chá.",
    cat=["fruta", "sobremesa", "vegana", "vegetariana", "economica", "detox"],
    tempo=5, rende=1,
    ing=[
        ("1 fatia grande de mamão formosa", 200, 225),
        ("2 colheres de sopa de aveia em flocos", 20, 7),
        ("suco de 1/2 limão", 15, 220),
        ("1 colher de chá de linhaça", 5, 594),
    ],
    preparo=[
        "Corte o mamão em cubos no prato fundo.",
        "Espalhe a aveia e a linhaça por cima.",
        "Esprema o limão na hora de comer — ele corta o enjoativo do mamão.",
    ],
    dica="Fibra sem água não funciona: tome um copo de água junto, senão a aveia faz o efeito contrário.",
),

dict(
    slug="suco-de-beterraba-com-laranja",
    titulo="Suco de beterraba com laranja",
    chamada="Cor de vinho, gosto de laranja — o jeito de comer beterraba sem perceber.",
    cat=["suco", "detox", "vegana", "vegetariana", "economica"],
    tempo=5, rende=2,
    ing=[
        ("1/2 beterraba crua pequena", 60, 98),
        ("suco de 3 laranjas", 250, 209),
        ("1 pedacinho de gengibre", 4, "gengibre"),
    ],
    preparo=[
        "Descasque e pique a beterraba crua bem miúdo (ou rale).",
        "Bata com o suco de laranja e o gengibre por 1 minuto.",
        "Beba na hora: o suco de laranja perde vitamina C parado na geladeira.",
    ],
    dica="Beterraba crua tem mais nitrato que a cozida — é o que dá fama a este suco entre quem treina.",
),

dict(
    slug="torrada-de-abacate-com-ovo",
    titulo="Torrada de abacate com ovo",
    chamada="O lanche da moda, feito com pão de verdade e sem gastar R$ 30 na cafeteria.",
    cat=["principal", "vegetariana", "economica"],
    tempo=5, rende=1,
    ing=[
        ("1 fatia de pão integral", 50, 52),
        ("1/4 de abacate", 70, 163),
        ("1 ovo cozido", 50, 488),
        ("sal, limão e pimenta", 3, "livre"),
    ],
    preparo=[
        "Torre o pão até ficar firme — abacate em pão mole desmonta.",
        "Amasse o abacate com sal, limão e pimenta e espalhe no pão.",
        "Corte o ovo cozido em rodelas por cima.",
    ],
    dica="No pão, leia a lista: se a primeira farinha for branca, o 'integral' da frente é só marketing. Integral de verdade traz farinha de trigo integral em primeiro lugar.",
),

dict(
    slug="agua-saborizada-de-limao-e-hortela",
    titulo="Água saborizada de limão, gengibre e hortelã",
    chamada="Para quem não consegue beber água pura — e não quer trocar por refrigerante zero.",
    cat=["suco", "detox", "vegana", "vegetariana", "economica"],
    tempo=5, rende=4,
    ing=[
        ("1 litro de água", 1000, "livre"),
        ("1 limão em rodelas", 60, 220),
        ("1 pedaço de gengibre em lâminas", 8, "gengibre"),
        ("1 punhado de hortelã", 5, "livre"),
    ],
    preparo=[
        "Ponha tudo numa jarra com água gelada.",
        "Deixe na geladeira por pelo menos 1 hora (esse tempo é de espera, não de trabalho).",
        "Beba ao longo do dia e troque o limão a cada 24 h, senão amarga.",
    ],
    dica="Não emagrece nem 'seca'. O que ela faz é te fazer beber mais água — e isso, sim, muda como você passa o dia.",
),

# ==================================================================
#  10 MINUTOS — uma frigideira, no máximo duas
# ==================================================================

dict(
    slug="omelete-de-espinafre-e-queijo",
    titulo="Omelete de espinafre e queijo",
    chamada="Almoço inteiro numa frigideira, com mais proteína que um filé pequeno.",
    cat=["principal", "lowcarb", "cetogenica", "vegetariana"],
    tempo=10, rende=1,
    ing=[
        ("2 ovos", 100, 489),
        ("1 punhado de espinafre", 40, 119),
        ("1 fatia de queijo minas frescal", 30, 461),
        ("1 colher de chá de azeite", 5, 260),
        ("sal e pimenta", 3, "livre"),
    ],
    preparo=[
        "Refogue o espinafre no azeite por 1 minuto, só até murchar. Reserve.",
        "Bata os ovos com sal e despeje na frigideira quente, em fogo médio-baixo.",
        "Quando a borda firmar, ponha o espinafre e o queijo de um lado só e dobre.",
        "Deixe mais 1 minuto com a frigideira tampada para o queijo derreter.",
    ],
    dica="Gema não é problema: a fama de vilã do colesterol caiu por terra e é nela que estão a colina e as vitaminas do ovo.",
),

dict(
    slug="crepioca-de-queijo",
    titulo="Crepioca de queijo",
    chamada="Sem glúten, pronta antes do café passar, e segura até o almoço.",
    cat=["principal", "vegetariana", "economica"],
    tempo=10, rende=1,
    ing=[
        ("2 ovos", 100, 489),
        ("2 colheres de sopa de goma de tapioca", 30, "goma_tapioca"),
        ("1 fatia de queijo minas", 30, 461),
        ("sal e orégano", 3, "livre"),
    ],
    preparo=[
        "Bata os ovos com a goma e o sal até ficar homogêneo — sem grumos de goma.",
        "Despeje na frigideira antiaderente quente e espalhe fino.",
        "Quando soltar do fundo, vire, ponha o queijo, dobre e desligue.",
    ],
    dica="Crepioca só de goma e água é carboidrato quase puro. É o ovo que a transforma em refeição — não diminua a proporção dele.",
),

dict(
    slug="tapioca-de-frango-desfiado",
    titulo="Tapioca de frango desfiado",
    chamada="Aquele frango que sobrou de ontem virando o jantar de hoje.",
    cat=["principal", "economica"],
    tempo=10, rende=1,
    ing=[
        ("3 colheres de sopa de goma de tapioca", 45, "goma_tapioca"),
        ("1/2 xícara de frango cozido desfiado", 60, 408),
        ("1 colher de sopa de requeijão", 15, 468),
        ("tomate e cebolinha", 30, 157),
    ],
    preparo=[
        "Espalhe a goma peneirada na frigideira quente, sem gordura, até virar um disco.",
        "Misture o frango com o requeijão e o tomate picado.",
        "Recheie de um lado, dobre e sirva.",
    ],
    dica="Peneirar a goma é o segredo da tapioca que não fica borrachuda.",
),

dict(
    slug="macarrao-de-abobrinha-ao-alho-e-oleo",
    titulo="Macarrão de abobrinha ao alho e óleo",
    chamada="Cara de macarrão, corpo de legume — e fica pronto no tempo de ferver a água do outro.",
    cat=["principal", "lowcarb", "vegana", "vegetariana", "economica", "cetogenica"],
    tempo=10, rende=2,
    ing=[
        ("2 abobrinhas médias", 400, 71),
        ("3 dentes de alho", 12, 82),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal, pimenta e salsinha", 5, "livre"),
    ],
    preparo=[
        "Corte a abobrinha em tiras finas com o descascador de legumes (ou rale no ralo grosso).",
        "Doure o alho fatiado no azeite em fogo baixo, sem queimar — alho queimado amarga tudo.",
        "Junte a abobrinha e mexa por 2 a 3 minutos: ela precisa ficar 'al dente', não mole.",
        "Tempere e sirva imediatamente, senão solta água.",
    ],
    dica="Não cozinhe demais. Abobrinha passada do ponto vira sopa dentro do prato — e é isso que faz as pessoas dizerem que não gostam.",
),

dict(
    slug="salada-de-grao-de-bico-com-tomate",
    titulo="Salada de grão-de-bico com tomate",
    chamada="Proteína vegetal barata que aguenta 3 dias na geladeira e vai na marmita.",
    cat=["salada", "vegana", "vegetariana", "economica", "principal"],
    tempo=10, rende=3,
    ing=[
        ("2 xícaras de grão-de-bico já cozido", 300, "grao_bico_cozido"),
        ("2 tomates", 180, 157),
        ("1/2 cebola roxa", 40, 107),
        ("1 punhado de salsinha", 10, 153),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal, limão e pimenta", 8, "livre"),
    ],
    preparo=[
        "Escorra e lave o grão-de-bico se for de lata — tira boa parte do sódio.",
        "Pique o tomate sem sementes e a cebola bem miúda.",
        "Misture tudo com azeite, limão e sal e deixe descansar 5 minutos antes de comer.",
    ],
    dica="Cozinhar um pacote de grão-de-bico seco no domingo sai por menos de um terço do preço da lata — e rende salada, pasta e sopa a semana inteira.",
),

dict(
    slug="atum-com-salada-de-folhas",
    titulo="Atum com salada de folhas e azeitona",
    chamada="O almoço de quem tem 10 minutos e uma lata na despensa.",
    cat=["salada", "principal", "lowcarb", "economica"],
    tempo=10, rende=1,
    ing=[
        ("1 lata de atum escorrido", 120, 277),
        ("1 prato de alface", 80, 78),
        ("1 tomate", 90, 157),
        ("6 azeitonas", 20, 521),
        ("1 colher de sopa de azeite e limão", 10, 260),
    ],
    preparo=[
        "Escorra bem o atum, apertando com a tampa da lata.",
        "Monte as folhas rasgadas com a mão, o tomate e a azeitona.",
        "Ponha o atum no centro e tempere com azeite e limão.",
    ],
    dica="Atum em óleo tem mais caloria que o em água, mas o óleo fica na lata — escorrido, a diferença é bem menor do que dizem.",
),

dict(
    slug="panqueca-de-banana-e-ovo",
    titulo="Panqueca de banana e ovo",
    chamada="Dois ingredientes, gosto de sobremesa, e nenhum açúcar adicionado.",
    cat=["sobremesa", "fruta", "vegetariana", "economica"],
    tempo=10, rende=1,
    ing=[
        ("1 banana bem madura", 100, 179),
        ("2 ovos", 100, 489),
        ("2 colheres de sopa de aveia", 20, 7),
        ("canela", 1, "livre"),
    ],
    preparo=[
        "Amasse a banana e misture os ovos e a aveia até virar uma massa grossa.",
        "Faça panquecas pequenas na frigideira antiaderente, em fogo baixo.",
        "Vire com cuidado quando aparecerem bolhas na superfície — esta massa é mais frágil que a de trigo.",
    ],
    dica="Quanto mais preta a casca da banana, mais doce fica sem precisar de açúcar. Banana com casca manchada não é banana estragada.",
),

dict(
    slug="cuscuz-com-ovo-e-tomate",
    titulo="Cuscuz nordestino com ovo",
    chamada="Café da manhã de menos de R$ 3 que sustenta a manhã inteira.",
    cat=["principal", "economica", "vegetariana"],
    tempo=10, rende=1,
    ing=[
        ("1 xícara de cuscuz de milho pronto", 150, 533),
        ("1 ovo", 50, 489),
        ("1 tomate", 80, 157),
        ("1 colher de chá de azeite", 5, 260),
    ],
    preparo=[
        "Hidrate a farinha de milho com água e sal, deixe descansar 5 minutos e cozinhe na cuscuzeira.",
        "Enquanto isso, frite o ovo no azeite e pique o tomate.",
        "Sirva o ovo por cima do cuscuz com o tomate ao lado.",
    ],
    dica="Cuscuz sozinho é carboidrato. É o ovo que muda a história da sua manhã — sem ele você vai estar com fome às 9h30.",
),

dict(
    slug="pao-de-queijo-de-frigideira",
    titulo="Pão de queijo de frigideira",
    chamada="A vontade de pão de queijo resolvida em 10 minutos, sem forno.",
    cat=["vegetariana", "sobremesa", "economica"],
    tempo=10, rende=1,
    ing=[
        ("1 ovo", 50, 489),
        ("2 colheres de sopa de polvilho doce", 20, 146),
        ("1 fatia de queijo minas", 40, 461),
        ("1 pitada de sal", 2, "livre"),
    ],
    preparo=[
        "Misture o ovo, o polvilho e o sal até ficar liso.",
        "Despeje na frigideira antiaderente em fogo baixo e ponha o queijo picado por cima.",
        "Tampe por 2 minutos, dobre ao meio e sirva.",
    ],
    dica="É mais parente da crepioca do que do pão de queijo da padaria — mas mata a vontade e tem proteína, o que o da padaria não tem.",
),

dict(
    slug="smoothie-de-morango-com-iogurte",
    titulo="Smoothie de morango com iogurte",
    chamada="Cremoso como milk-shake, com proteína de verdade e sem xarope.",
    cat=["suco", "sobremesa", "fruta", "vegetariana"],
    tempo=5, rende=1,
    ing=[
        ("1 xícara de morangos congelados", 150, 239),
        ("1 pote de iogurte natural", 170, 448),
        ("1 colher de chá de mel", 7, 507),
    ],
    preparo=[
        "Use os morangos CONGELADOS — é o que dá a textura de milk-shake sem gelo.",
        "Bata tudo no liquidificador até ficar cremoso.",
        "Se ficar grosso demais, junte uma colher de leite, não de água.",
    ],
    dica="Congelar a fruta madura que ia estragar é o truque que faz smoothie sair de graça e evitar desperdício.",
),

dict(
    slug="ovo-cozido-com-cottage-e-tomate",
    titulo="Ovos cozidos com cottage e tomate-cereja",
    chamada="Lanche de 10 minutos com 20 g de proteína, para levar na bolsa.",
    cat=["lowcarb", "cetogenica", "vegetariana", "salada"],
    tempo=10, rende=1,
    ing=[
        ("2 ovos cozidos", 100, 488),
        ("3 colheres de sopa de queijo cottage", 60, "cottage"),
        ("6 tomates-cereja", 80, 157),
        ("azeite, sal e orégano", 8, 260),
    ],
    preparo=[
        "Cozinhe os ovos por 8 minutos a partir da fervura, para a gema ficar cozida mas não esfarelenta.",
        "Passe pela água fria — é o que faz a casca sair inteira.",
        "Monte com o cottage e os tomates, regue com azeite e tempere.",
    ],
    dica="Cottage é o queijo com mais proteína e menos gordura da prateleira. O que engana é o sódio: compare a tabela entre as marcas.",
),

dict(
    slug="wrap-de-alface-com-frango",
    titulo="Wrap de alface com frango",
    chamada="O recheio do sanduíche sem o pão — e sem aquela moleza depois do almoço.",
    cat=["lowcarb", "principal", "salada"],
    tempo=10, rende=1,
    ing=[
        ("4 folhas grandes de alface americana", 80, 77),
        ("1 xícara de frango cozido desfiado", 100, 408),
        ("1 colher de sopa de requeijão", 15, 468),
        ("1 cenoura ralada", 50, 110),
        ("sal, limão e pimenta", 5, "livre"),
    ],
    preparo=[
        "Misture o frango desfiado com o requeijão, a cenoura ralada e os temperos.",
        "Ponha o recheio no centro de cada folha de alface.",
        "Enrole como um charuto e prenda com palito.",
    ],
    dica="Alface americana é a que aguenta enrolar sem rasgar. Crespa é mais nutritiva, mas quebra na hora de fechar.",
),

dict(
    slug="sardinha-na-torrada-com-limao",
    titulo="Sardinha na torrada com limão",
    chamada="O ômega-3 mais barato do mercado, numa lata que custa menos que um café.",
    cat=["principal", "economica"],
    tempo=10, rende=2,
    ing=[
        ("1 lata de sardinha escorrida", 125, 319),
        ("4 fatias de pão integral", 100, 52),
        ("1/2 cebola roxa", 30, 107),
        ("suco de 1 limão e salsinha", 20, 220),
    ],
    preparo=[
        "Escorra a sardinha e amasse com o garfo, aproveitando a espinha (ela é macia e cheia de cálcio).",
        "Misture com a cebola picada e o limão.",
        "Torre o pão e espalhe por cima.",
    ],
    dica="Sardinha entrega o mesmo ômega-3 do salmão por menos de um décimo do preço. É o melhor custo-benefício da prateleira inteira.",
),

dict(
    slug="salada-de-atum-com-grao-de-bico",
    titulo="Salada de atum com grão-de-bico",
    chamada="Marmita fria que não precisa de micro-ondas e não murcha até a hora do almoço.",
    cat=["salada", "principal", "economica"],
    tempo=10, rende=2,
    ing=[
        ("1 lata de atum escorrido", 120, 277),
        ("1 xícara de grão-de-bico cozido", 150, "grao_bico_cozido"),
        ("1 tomate", 90, 157),
        ("1/4 de cebola", 25, 107),
        ("1 colher de sopa de azeite e limão", 10, 260),
    ],
    preparo=[
        "Misture tudo numa tigela.",
        "Tempere com azeite, limão, sal e pimenta.",
        "Guarde em pote fechado: no dia seguinte fica ainda melhor.",
    ],
    dica="Esta é a marmita de quem não tem geladeira no trabalho — sem folha, ela aguenta a manhã em temperatura ambiente numa bolsa térmica.",
),

dict(
    slug="mingau-de-aveia-com-maca",
    titulo="Mingau de aveia com maçã e canela",
    chamada="Conforto de inverno em 10 minutos, sem leite condensado.",
    cat=["sobremesa", "fruta", "vegetariana", "economica"],
    tempo=10, rende=1,
    ing=[
        ("4 colheres de sopa de aveia em flocos", 40, 7),
        ("1 copo de leite desnatado", 200, 457),
        ("1 maçã com casca", 130, 222),
        ("canela em pó", 2, "livre"),
    ],
    preparo=[
        "Rale metade da maçã e corte a outra metade em cubos.",
        "Leve a aveia, o leite e a maçã ralada ao fogo baixo, mexendo até engrossar (uns 5 minutos).",
        "Sirva com os cubos de maçã e bastante canela por cima.",
    ],
    dica="A maçã ralada adoça o mingau inteiro. Se ainda quiser doce, prove primeiro com a canela: ela dá sensação de doçura sem açúcar nenhum.",
),

dict(
    slug="guacamole-com-palitos-de-legume",
    titulo="Guacamole com palitos de legume",
    chamada="Petisco de fim de tarde que substitui a bolacha recheada sem drama.",
    cat=["vegana", "vegetariana", "lowcarb", "salada", "cetogenica"],
    tempo=10, rende=3,
    ing=[
        ("1 abacate maduro", 300, 163),
        ("1 tomate sem semente", 90, 157),
        ("1/4 de cebola", 25, 107),
        ("suco de 1 limão", 20, 220),
        ("1 cenoura e 1 pepino em palitos", 180, 110),
    ],
    preparo=[
        "Amasse o abacate com o limão — o limão é o que impede de escurecer.",
        "Misture o tomate e a cebola picados bem miúdos, sal e pimenta.",
        "Sirva com os legumes cortados em palitos.",
    ],
    dica="O abacate brasileiro é maior e mais aguado que o avocado, mas faz o mesmo trabalho — e custa um terço do preço.",
),

dict(
    slug="suco-de-abacaxi-com-hortela-e-chia",
    titulo="Suco de abacaxi com hortelã e chia",
    chamada="O suco que sacia — a chia é o que faz ele durar mais que 20 minutos.",
    cat=["suco", "fruta", "vegana", "vegetariana", "detox"],
    tempo=5, rende=2,
    ing=[
        ("3 fatias de abacaxi", 220, 164),
        ("1 colher de sopa de chia", 12, "chia"),
        ("8 folhas de hortelã", 4, "livre"),
        ("300 ml de água", 300, "livre"),
    ],
    preparo=[
        "Bata o abacaxi com a água e a hortelã.",
        "Junte a chia e mexa com a colher (não bata: a chia precisa ficar inteira).",
        "Espere 5 minutos: ela incha e vira gel, e é isso que segura a fome.",
    ],
    dica="Chia sem líquido suficiente atrapalha em vez de ajudar. A regra é 10 partes de líquido para 1 de chia.",
),

dict(
    slug="ricota-temperada-para-passar-no-pao",
    titulo="Ricota temperada para passar no pão",
    chamada="Substitui o requeijão do pote com metade da gordura — e você sabe o que tem dentro.",
    cat=["vegetariana", "lowcarb", "economica"],
    tempo=10, rende=4,
    ing=[
        ("1 peça pequena de ricota", 250, 469),
        ("2 colheres de sopa de azeite", 20, 260),
        ("1/2 cebola pequena", 30, 107),
        ("cebolinha, sal e pimenta", 10, "livre"),
        ("suco de 1/2 limão", 10, 220),
    ],
    preparo=[
        "Amasse a ricota com o garfo até esfarelar toda.",
        "Bata no mixer com o azeite e o limão até virar creme (junte 1 colher de água se precisar).",
        "Misture a cebola bem picadinha e a cebolinha na mão, para dar textura.",
    ],
    dica="Requeijão de pote tem amido, gordura e conservante. Este dura 4 dias na geladeira e tem três ingredientes.",
),

# ==================================================================
#  30 MINUTOS — o jantar de dia de semana
# ==================================================================

dict(
    slug="frango-grelhado-com-legumes-na-frigideira",
    titulo="Frango grelhado com legumes na frigideira",
    chamada="Prato completo numa panela só, sem esperar forno esquentar.",
    cat=["principal", "lowcarb", "economica"],
    tempo=30, rende=2,
    ing=[
        ("2 filés de peito de frango", 300, 409),
        ("1 abobrinha", 200, 71),
        ("1 cenoura", 100, 110),
        ("1 pimentão vermelho", 120, 145),
        ("2 colheres de sopa de azeite", 20, 260),
        ("alho, sal, páprica e pimenta", 12, 82),
    ],
    preparo=[
        "Tempere o frango com alho, sal e páprica e deixe descansar 10 minutos — esse tempo é o que faz diferença no sabor.",
        "Grelhe em frigideira bem quente, 4 a 5 minutos de cada lado, sem ficar cutucando.",
        "Tire o frango e, na mesma frigideira, salteie os legumes cortados em tiras por 5 minutos.",
        "Volte o frango por cima dos legumes, tampe e desligue.",
    ],
    dica="Frango seco é frango virado demais. Vire uma vez só e deixe descansar 3 minutos antes de cortar — o suco volta para dentro da carne.",
),

dict(
    slug="strogonoff-de-frango-leve",
    titulo="Strogonoff de frango leve",
    chamada="O strogonoff de domingo com iogurte no lugar do creme de leite — e ninguém percebe.",
    cat=["principal", "economica"],
    tempo=30, rende=4,
    ing=[
        ("500 g de peito de frango em cubos", 500, 409),
        ("1 pote de iogurte natural", 170, 448),
        ("2 colheres de sopa de extrato de tomate", 40, 158),
        ("1 cebola", 100, 107),
        ("2 dentes de alho", 8, 82),
        ("1 xícara de champignon (opcional)", 100, "champignon"),
        ("1 colher de sopa de azeite", 10, 260),
        ("mostarda, sal e pimenta", 15, "livre"),
    ],
    preparo=[
        "Doure a cebola e o alho no azeite e junte o frango em cubos.",
        "Cozinhe até o frango soltar e secar o líquido — é aí que ele pega gosto.",
        "Junte o extrato de tomate, a mostarda e o champignon e cozinhe 5 minutos.",
        "DESLIGUE O FOGO e só então misture o iogurte, mexendo devagar.",
    ],
    dica="Iogurte no fogo talha. Ele entra sempre com a panela desligada — é a única regra desta receita.",
),

dict(
    slug="omelete-de-forno-com-legumes",
    titulo="Omelete de forno com legumes",
    chamada="Faz no domingo, come a semana — quente ou frio, e vai na marmita.",
    cat=["principal", "lowcarb", "vegetariana", "economica"],
    tempo=30, rende=4,
    ing=[
        ("6 ovos", 300, 489),
        ("1 abobrinha ralada", 180, 71),
        ("1 cenoura ralada", 100, 110),
        ("1/2 cebola", 50, 107),
        ("100 g de queijo minas", 100, 461),
        ("1 colher de sopa de azeite", 10, 260),
        ("sal, orégano e cebolinha", 8, "livre"),
    ],
    preparo=[
        "Aqueça o forno a 200 °C e unte uma forma pequena.",
        "Bata os ovos com sal e misture os legumes ralados crus, a cebola e o queijo picado.",
        "Despeje na forma e asse por 20 a 25 minutos, até firmar no centro.",
        "Espere 5 minutos antes de cortar, senão desmancha.",
    ],
    dica="Ralar os legumes em vez de picar faz eles cozinharem no mesmo tempo do ovo — é o que evita o pedaço de cenoura cru no meio.",
),

dict(
    slug="quibe-de-abobrinha-assado",
    titulo="Quibe assado de abobrinha com carne",
    chamada="Metade do trigo trocado por legume: mesma cara, mais comida de verdade.",
    cat=["principal", "economica"],
    tempo=30, rende=4,
    ing=[
        ("400 g de patinho moído", 400, 376),
        ("1 abobrinha grande ralada e espremida", 250, 71),
        ("1 xícara de trigo para quibe (seco)", 60, "bulgur_seco"),
        ("1 cebola", 80, 107),
        ("hortelã, sal, pimenta e limão", 20, "livre"),
        ("1 colher de sopa de azeite", 10, 260),
    ],
    preparo=[
        "Hidrate o trigo em água por 20 minutos e esprema muito bem (esse tempo é de espera).",
        "Rale a abobrinha e esprema com as mãos até tirar toda a água — quibe aguado não assa.",
        "Misture tudo com a mão, aperte na forma e risque losangos por cima.",
        "Regue com azeite e asse a 200 °C por 25 minutos.",
    ],
    dica="Peça no açougue para moer o patinho na hora. A carne moída pronta da bandeja costuma ser a de recorte mais gorda do balcão.",
),

dict(
    slug="escondidinho-de-batata-doce-com-frango",
    titulo="Escondidinho de batata-doce com frango",
    chamada="Comfort food de verdade, com carboidrato que não te derruba às 15 h.",
    cat=["principal", "economica"],
    tempo=30, rende=4,
    ing=[
        ("600 g de batata-doce cozida", 600, 88),
        ("400 g de frango cozido desfiado", 400, 408),
        ("1 cebola", 80, 107),
        ("2 colheres de sopa de extrato de tomate", 40, 158),
        ("100 g de queijo minas ralado", 100, 461),
        ("2 colheres de sopa de leite", 30, 458),
        ("sal, alho e cheiro-verde", 15, 82),
    ],
    preparo=[
        "Amasse a batata-doce ainda quente com o leite e sal até virar purê.",
        "Refogue a cebola e o alho, junte o frango desfiado e o extrato de tomate.",
        "Monte: frango embaixo, purê por cima, queijo no topo.",
        "Leve ao forno a 200 °C por 15 minutos para gratinar.",
    ],
    dica="Batata-doce cozida com casca perde menos nutriente e desmancha menos. A casca sai sozinha depois de cozida.",
),

dict(
    slug="peixe-assado-com-batata-e-tomate",
    titulo="Peixe assado com batata e tomate",
    chamada="Uma assadeira, 25 minutos de forno e nenhuma panela para lavar.",
    cat=["principal", "economica"],
    tempo=30, rende=2,
    ing=[
        ("2 filés de merluza", 300, 302),
        ("2 batatas em rodelas finas", 250, 92),
        ("2 tomates em rodelas", 180, 157),
        ("1/2 cebola em rodelas", 50, 107),
        ("2 colheres de sopa de azeite", 20, 260),
        ("alho, sal, limão e orégano", 15, 82),
    ],
    preparo=[
        "Tempere o peixe com limão, alho e sal.",
        "Forre a assadeira com as batatas em rodelas FINAS, regue com azeite e leve ao forno a 220 °C por 10 minutos.",
        "Ponha o peixe por cima, cubra com tomate e cebola, regue com o resto do azeite.",
        "Volte ao forno por mais 15 minutos.",
    ],
    dica="A batata entra antes porque demora mais que o peixe. Tudo junto desde o começo dá batata crua com peixe seco.",
),

dict(
    slug="lentilha-refogada-com-legumes",
    titulo="Lentilha refogada com legumes",
    chamada="Prato principal vegano de R$ 4 a porção, com ferro e proteína.",
    cat=["principal", "vegana", "vegetariana", "economica"],
    tempo=30, rende=4,
    ing=[
        ("2 xícaras de lentilha cozida", 400, 577),
        ("1 cenoura em cubos", 100, 110),
        ("1 abobrinha em cubos", 150, 71),
        ("1 cebola", 90, 107),
        ("3 dentes de alho", 12, 82),
        ("2 colheres de sopa de azeite", 20, 260),
        ("1 tomate", 90, 157),
        ("louro, sal, cominho e salsinha", 15, "livre"),
    ],
    preparo=[
        "Refogue cebola e alho no azeite até dourar.",
        "Junte os legumes em cubos e refogue 5 minutos.",
        "Acrescente a lentilha já cozida, o tomate e os temperos, e cozinhe mais 10 minutos em fogo baixo.",
    ],
    dica="Coma com uma fruta cítrica na sequência: a vitamina C aumenta muito o aproveitamento do ferro das leguminosas. Café logo depois faz o contrário.",
),

dict(
    slug="chili-vegetariano-de-feijao",
    titulo="Chili vegetariano de feijão",
    chamada="O jeito de comer feijão que faz até quem 'não gosta de feijão' repetir.",
    cat=["principal", "vegana", "vegetariana", "economica"],
    tempo=30, rende=4,
    ing=[
        ("3 xícaras de feijão carioca cozido", 500, 561),
        ("1 lata de milho verde escorrido", 150, "milho_verde_lata"),
        ("1 pimentão vermelho", 120, 145),
        ("1 cebola", 90, 107),
        ("3 dentes de alho", 12, 82),
        ("2 tomates", 180, 157),
        ("2 colheres de sopa de azeite", 20, 260),
        ("cominho, páprica, pimenta e sal", 15, "livre"),
    ],
    preparo=[
        "Refogue cebola, alho e pimentão no azeite.",
        "Junte o tomate picado e cozinhe até desmanchar.",
        "Acrescente o feijão com um pouco do caldo, o milho e os temperos.",
        "Cozinhe em fogo baixo por 15 minutos, amassando um pouco do feijão para engrossar.",
    ],
    dica="Amassar parte do feijão contra a panela é o que engrossa o caldo sem farinha nenhuma.",
),

dict(
    slug="berinjela-recheada-com-carne",
    titulo="Berinjela recheada",
    chamada="Parece prato de restaurante e usa a berinjela que ia murchar na gaveta.",
    cat=["principal", "lowcarb", "economica"],
    tempo=30, rende=2,
    ing=[
        ("2 berinjelas", 400, 96),
        ("250 g de patinho moído", 250, 376),
        ("1 cebola", 80, 107),
        ("2 dentes de alho", 8, 82),
        ("1 tomate", 90, 157),
        ("60 g de queijo mussarela", 60, "mussarela"),
        ("1 colher de sopa de azeite", 10, 260),
        ("sal, orégano e manjericão", 10, "livre"),
    ],
    preparo=[
        "Corte as berinjelas ao meio e cave o miolo com a colher, sem furar a casca. Pique o miolo.",
        "Refogue cebola, alho, a carne e o miolo da berinjela; junte o tomate e tempere.",
        "Recheie as cascas, cubra com mussarela e asse a 200 °C por 20 minutos.",
    ],
    dica="Berinjela amarga é berinjela velha. Escolha as firmes e de casca brilhante — não precisa de sal nem de molho antes.",
),

dict(
    slug="sopa-creme-de-abobora-com-gengibre",
    titulo="Sopa-creme de abóbora com gengibre",
    chamada="Cremosa sem creme de leite nenhum: a própria abóbora faz o trabalho.",
    cat=["principal", "vegana", "vegetariana", "economica", "detox"],
    tempo=30, rende=4,
    ing=[
        ("800 g de abóbora cabotiá em cubos", 800, 65),
        ("1 cebola", 90, 107),
        ("2 dentes de alho", 8, 82),
        ("1 pedaço de gengibre", 10, "gengibre"),
        ("1 colher de sopa de azeite", 10, 260),
        ("sal, pimenta e noz-moscada", 8, "livre"),
        ("700 ml de água", 700, "livre"),
    ],
    preparo=[
        "Refogue cebola, alho e gengibre no azeite.",
        "Junte a abóbora em cubos e a água e cozinhe 20 minutos, até desmanchar no garfo.",
        "Bata no liquidificador (com cuidado, quente) e volte ao fogo para acertar o sal.",
    ],
    dica="Cabotiá é a abóbora de casca escura e polpa alaranjada e firme — é a que dá creme. A moranga aguada vira sopa rala.",
),

dict(
    slug="salada-morna-de-quinoa",
    titulo="Salada morna de quinoa com legumes",
    chamada="A salada que serve de prato principal — proteína completa, sem carne.",
    cat=["salada", "principal", "vegana", "vegetariana"],
    tempo=30, rende=3,
    ing=[
        ("2 xícaras de quinoa cozida", 300, "quinoa_cozida"),
        ("1 abobrinha em cubos", 150, 71),
        ("1 cenoura em cubos", 100, 110),
        ("10 tomates-cereja", 120, 157),
        ("2 colheres de sopa de azeite", 20, 260),
        ("suco de 1 limão, sal e hortelã", 20, 220),
    ],
    preparo=[
        "Cozinhe a quinoa em 2 partes de água para 1 de grão, por 15 minutos, e escorra.",
        "Salteie a abobrinha e a cenoura no azeite, deixando firmes.",
        "Misture tudo ainda morno com o tomate cortado, o limão e a hortelã.",
    ],
    dica="Lave a quinoa em água corrente antes de cozinhar: ela tem uma camada natural amarga na casca (saponina) que estraga o prato.",
),

dict(
    slug="frango-xadrez-caseiro",
    titulo="Frango xadrez caseiro",
    chamada="O prato do delivery chinês feito em casa, com um terço do sódio.",
    cat=["principal", "economica"],
    tempo=30, rende=3,
    ing=[
        ("400 g de peito de frango em cubos", 400, 409),
        ("1 pimentão verde e 1 vermelho", 220, 144),
        ("1 cebola", 90, 107),
        ("50 g de amendoim torrado", 50, 558),
        ("2 colheres de sopa de shoyu", 30, "shoyu"),
        ("1 colher de sopa de óleo", 10, 272),
        ("alho e gengibre", 20, 82),
        ("1 colher de chá de amido de milho", 5, 42),
    ],
    preparo=[
        "Tempere o frango com shoyu, alho e gengibre e deixe 10 minutos.",
        "Frite o frango em fogo ALTO, em duas levas — panela cheia cozinha em vez de dourar.",
        "Junte os pimentões e a cebola em cubos grandes e salteie 3 minutos: eles ficam crocantes.",
        "Dissolva o amido em 1/2 xícara de água, junte para encorpar e finalize com o amendoim.",
    ],
    dica="Shoyu é sal líquido: 1 colher de sopa tem quase 1 g de sódio. Use o de teor reduzido e não acrescente sal.",
),

dict(
    slug="hamburguer-caseiro-de-patinho",
    titulo="Hambúrguer caseiro de patinho",
    chamada="Dois ingredientes contra os quinze do congelado — e fica melhor.",
    cat=["principal", "lowcarb", "economica"],
    tempo=30, rende=4,
    ing=[
        ("500 g de patinho moído", 500, 376),
        ("1/2 cebola bem picada", 50, 107),
        ("sal e pimenta", 8, "livre"),
        ("1 colher de chá de azeite", 5, 260),
    ],
    preparo=[
        "Misture a carne com a cebola e o sal SEM amassar demais — quanto mais você trabalha a carne, mais dura ela fica.",
        "Faça bolas de 125 g e achate entre dois plásticos, com uma covinha no centro.",
        "Grelhe em frigideira bem quente, 3 minutos de cada lado, virando uma vez só.",
    ],
    dica="Vire o pacote do hambúrguer congelado e conte os ingredientes. Este aqui tem três — e você acabou de ver quais.",
),

dict(
    slug="panqueca-integral-de-carne",
    titulo="Panqueca integral de carne moída",
    chamada="Massa e recheio do zero em meia hora, e congela pronta para o dia corrido.",
    cat=["principal", "economica"],
    tempo=30, rende=4,
    ing=[
        ("1 xícara de farinha de trigo integral", 120, "farinha_trigo_integral"),
        ("2 ovos", 100, 489),
        ("1 xícara de leite desnatado", 200, 457),
        ("400 g de patinho moído", 400, 376),
        ("1 xícara de molho de tomate", 200, 159),
        ("1 cebola e 2 dentes de alho", 100, 107),
        ("1 colher de sopa de azeite", 10, 260),
    ],
    preparo=[
        "Bata no liquidificador a farinha, os ovos, o leite e uma pitada de sal. Deixe descansar 10 minutos.",
        "Faça discos finos na frigideira antiaderente, sem gordura.",
        "Refogue cebola, alho e a carne; tempere e deixe secar.",
        "Recheie, enrole, cubra com o molho e leve ao forno por 10 minutos.",
    ],
    dica="A massa pronta congela com plástico entre os discos e dura 2 meses. Fazer o dobro dá o mesmo trabalho.",
),

dict(
    slug="abobrinha-recheada-vegetariana",
    titulo="Abobrinha recheada com grão-de-bico",
    chamada="Recheio vegetariano que fica firme e não vira papa no forno.",
    cat=["principal", "vegetariana", "vegana", "lowcarb"],
    tempo=30, rende=2,
    ing=[
        ("2 abobrinhas grandes", 400, 71),
        ("1 xícara de grão-de-bico cozido", 150, "grao_bico_cozido"),
        ("1 tomate", 90, 157),
        ("1/2 cebola e 2 dentes de alho", 60, 107),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal, cúrcuma e salsinha", 10, "livre"),
    ],
    preparo=[
        "Corte as abobrinhas ao meio e retire o miolo com a colher.",
        "Refogue cebola, alho e o miolo picado; junte o grão-de-bico amassado grosseiramente e o tomate.",
        "Recheie e asse a 200 °C por 20 minutos.",
    ],
    dica="Amasse só metade do grão-de-bico: a outra metade inteira é o que dá textura e faz o recheio parecer carne moída.",
),

dict(
    slug="arroz-integral-com-legumes",
    titulo="Arroz integral com legumes",
    chamada="Deixa de ser acompanhamento e vira o prato — com o que tiver na geladeira.",
    cat=["principal", "vegana", "vegetariana", "economica"],
    tempo=30, rende=4,
    ing=[
        ("2 xícaras de arroz integral cozido", 400, 1),
        ("1 cenoura em cubinhos", 100, 110),
        ("1 xícara de brócolis", 120, 100),
        ("1/2 xícara de ervilha", 80, 560),
        ("1 cebola e 2 dentes de alho", 100, 107),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal e cebolinha", 8, "livre"),
    ],
    preparo=[
        "Refogue cebola e alho no azeite.",
        "Junte a cenoura, depois o brócolis e a ervilha, e refogue por 5 minutos.",
        "Misture o arroz integral já cozido, acerte o sal e finalize com cebolinha.",
    ],
    dica="Arroz integral demora 40 minutos para cozinhar — cozinhe uma panela grande no domingo e ele resolve quatro jantares.",
),

dict(
    slug="tofu-mexido-com-curcuma",
    titulo="Tofu mexido com cúrcuma",
    chamada="A versão vegana do ovo mexido, com a mesma cor e mais proteína do que parece.",
    cat=["principal", "vegana", "vegetariana", "lowcarb"],
    tempo=30, rende=2,
    ing=[
        ("300 g de tofu firme", 300, 584),
        ("1/2 cebola", 50, 107),
        ("1 tomate", 90, 157),
        ("2 dentes de alho", 8, 82),
        ("1 colher de sopa de azeite", 10, 260),
        ("cúrcuma, sal, pimenta e cebolinha", 10, "livre"),
    ],
    preparo=[
        "Esprema o tofu num pano limpo para tirar a água — é o passo que todo mundo pula e que decide a textura.",
        "Esfarele com as mãos e refogue com cebola, alho e cúrcuma.",
        "Junte o tomate no fim e deixe secar por 5 minutos.",
    ],
    dica="Tofu não tem gosto por natureza — ele pega o tempero que você der. Quem achou ruim provou sem tempero nenhum.",
),

dict(
    slug="salada-de-repolho-roxo-com-cenoura",
    titulo="Salada de repolho roxo com cenoura e gergelim",
    chamada="Dura 3 dias na geladeira sem murchar — a salada da marmita de segunda a quarta.",
    cat=["salada", "vegana", "vegetariana", "economica", "lowcarb", "detox"],
    tempo=30, rende=4,
    ing=[
        ("1/2 repolho roxo fatiado fino", 400, 150),
        ("2 cenouras raladas", 200, 110),
        ("2 colheres de sopa de gergelim", 20, 593),
        ("3 colheres de sopa de azeite", 30, 260),
        ("suco de 2 limões, sal e pimenta", 40, 220),
    ],
    preparo=[
        "Fatie o repolho o mais fino que conseguir e rale a cenoura no ralo grosso.",
        "Tempere com limão e sal e AMASSE com as mãos por 1 minuto: ele murcha na medida e para de soltar água depois.",
        "Junte o azeite e o gergelim tostado na frigideira seca.",
    ],
    dica="É o amassar com sal e limão que faz esta salada durar. Sem isso, no dia seguinte ela vira água no fundo do pote.",
),

dict(
    slug="sopa-de-legumes-com-frango",
    titulo="Sopa de legumes com frango desfiado",
    chamada="Jantar quente e completo de dia frio, sem creme e sem caldo de tablete.",
    cat=["principal", "economica"],
    tempo=30, rende=4,
    ing=[
        ("300 g de peito de frango", 300, 409),
        ("2 batatas", 250, 92),
        ("2 cenouras", 200, 110),
        ("1 chuchu", 200, 113),
        ("1 cebola e 3 dentes de alho", 110, 107),
        ("1 colher de sopa de azeite", 10, 260),
        ("1,2 litro de água, sal, louro e cheiro-verde", 1200, "livre"),
    ],
    preparo=[
        "Doure a cebola e o alho no azeite no fundo da panela, junte o frango inteiro e a água.",
        "Cozinhe 15 minutos, tire o frango e desfie.",
        "Ponha os legumes em cubos nesse caldo e cozinhe até ficarem macios.",
        "Volte o frango desfiado, acerte o sal e finalize com cheiro-verde.",
    ],
    dica="Caldo de tablete é sal, gordura e realçador. Cozinhar o frango na própria água da sopa dá o caldo de graça e sem sódio nenhum a mais.",
),

dict(
    slug="pizza-de-frigideira",
    titulo="Pizza de frigideira",
    chamada="Mata a vontade de pizza numa sexta sem pedir delivery.",
    cat=["principal", "lowcarb", "vegetariana"],
    tempo=30, rende=2,
    ing=[
        ("3 ovos", 150, 489),
        ("3 colheres de sopa de farinha de aveia", 30, 7),
        ("1/2 xícara de molho de tomate", 100, 159),
        ("100 g de mussarela", 100, "mussarela"),
        ("tomate em rodelas e orégano", 90, 157),
        ("1 colher de chá de azeite", 5, 260),
    ],
    preparo=[
        "Bata os ovos com a farinha de aveia e uma pitada de sal.",
        "Faça um disco na frigideira antiaderente em fogo baixo, tampado, até firmar.",
        "Vire, espalhe o molho, a mussarela e o tomate.",
        "Tampe por 3 minutos, só até derreter o queijo.",
    ],
    dica="Não é pizza de padaria e não adianta fingir que é. É a resposta honesta para a vontade de sexta à noite — com proteína no lugar da farinha branca.",
),

# ==================================================================
#  CETOGÊNICAS E LOWCARB — pouca farinha, nenhuma promessa
# ==================================================================

dict(
    slug="salada-caprese-com-azeite",
    titulo="Caprese de tomate e queijo",
    chamada="Três ingredientes italianos e o jantar de verão que não precisa de fogão.",
    cat=["salada", "vegetariana", "lowcarb", "cetogenica"],
    tempo=5, rende=2,
    ing=[
        ("3 tomates em rodelas", 270, 157),
        ("150 g de mussarela de búfala", 150, "mussarela"),
        ("2 colheres de sopa de azeite", 20, 260),
        ("manjericão, sal e pimenta", 8, "livre"),
    ],
    preparo=[
        "Corte o tomate e o queijo em rodelas da mesma espessura e intercale no prato.",
        "Regue com azeite e salpique sal grosso e pimenta.",
        "Rasgue o manjericão com a mão na hora de servir — cortado com faca, ele escurece.",
    ],
    dica="Tomate na geladeira perde o sabor. Guarde fora dela e você não vai precisar de tempero nenhum além do sal.",
),

dict(
    slug="frango-ao-molho-de-mostarda",
    titulo="Frango ao molho de mostarda e creme",
    chamada="Molho de restaurante com iogurte grego, sem farinha e sem creme de leite de caixinha.",
    cat=["principal", "lowcarb", "cetogenica"],
    tempo=30, rende=3,
    ing=[
        ("500 g de peito de frango em bifes", 500, 409),
        ("3 colheres de sopa de iogurte grego natural", 90, "iogurte_grego"),
        ("2 colheres de sopa de mostarda", 30, "mostarda"),
        ("1/2 cebola", 50, 107),
        ("1 colher de sopa de azeite", 10, 260),
        ("sal, pimenta e salsinha", 8, "livre"),
    ],
    preparo=[
        "Grelhe os bifes temperados no azeite e reserve.",
        "Na mesma panela, refogue a cebola com um pouco de água para soltar o fundo dourado — é dali que vem o sabor do molho.",
        "Desligue o fogo, misture o iogurte e a mostarda e volte o frango só para aquecer.",
    ],
    dica="Iogurte grego natural tem quase o dobro da proteína do comum e nenhum açúcar. O 'grego' de potinho de sobremesa é outra coisa: leia o rótulo.",
),

dict(
    slug="mousse-de-coco-cetogenico",
    titulo="Mousse de coco",
    chamada="Sobremesa cremosa sem açúcar e sem farinha, pronta em 10 minutos.",
    cat=["sobremesa", "lowcarb", "cetogenica", "vegana", "vegetariana"],
    tempo=10, rende=3,
    ing=[
        ("1 lata de leite de coco gelado", 200, 523),
        ("2 colheres de sopa de coco ralado", 20, 590),
        ("adoçante a gosto", 3, "livre"),
        ("raspas de limão", 3, "livre"),
    ],
    preparo=[
        "Deixe a lata de leite de coco na geladeira de um dia para o outro e use só a parte grossa de cima.",
        "Bata na batedeira por 3 minutos, até virar chantilly.",
        "Misture o coco ralado, o adoçante e as raspas de limão e leve à geladeira.",
    ],
    dica="Só funciona com leite de coco integral gelado — o light não tem gordura suficiente para montar.",
),

dict(
    slug="salmao-grelhado-com-brocolis",
    titulo="Salmão grelhado com brócolis no alho",
    chamada="O jantar de 15 minutos que entrega ômega-3 e sai da frigideira direto para o prato.",
    cat=["principal", "lowcarb", "cetogenica"],
    tempo=30, rende=2,
    ing=[
        ("2 postas de salmão", 300, 316),
        ("1 maço de brócolis", 300, 100),
        ("3 dentes de alho", 12, 82),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal, limão e pimenta", 12, 220),
    ],
    preparo=[
        "Tempere o salmão só com sal e limão e grelhe com a pele para baixo por 4 minutos, sem mexer.",
        "Vire e deixe 2 minutos — o miolo pode ficar levemente rosado.",
        "Cozinhe o brócolis no vapor por 5 minutos e salteie no azeite com alho.",
    ],
    dica="Se o salmão estiver caro, esta receita fica igual de boa com sardinha fresca ou cavala — os três têm o mesmo tipo de gordura.",
),

# ==================================================================
#  1 HORA — o de domingo, o que rende a semana
# ==================================================================

dict(
    slug="bolo-de-banana-com-aveia",
    titulo="Bolo de banana com aveia",
    chamada="Bolo que se adoça sozinho com a fruta — sem açúcar e sem farinha branca.",
    cat=["sobremesa", "vegetariana", "fruta", "economica"],
    tempo=60, rende=10,
    ing=[
        ("4 bananas bem maduras", 400, 179),
        ("3 ovos", 150, 489),
        ("2 xícaras de aveia em flocos", 180, 7),
        ("2 colheres de sopa de óleo", 20, 272),
        ("1 colher de sopa de fermento e canela", 15, "livre"),
    ],
    preparo=[
        "Bata no liquidificador 3 bananas, os ovos e o óleo.",
        "Misture a aveia numa tigela e por último o fermento, mexendo devagar.",
        "Despeje na forma, cubra com a banana restante fatiada e canela.",
        "Asse a 180 °C por 35 a 40 minutos — o palito sai limpo quando está pronto.",
    ],
    dica="Bananas com casca preta são as ideais: quanto mais maduras, mais doce o bolo, e você não precisa de açúcar nenhum.",
),

dict(
    slug="bolo-de-cenoura-integral",
    titulo="Bolo de cenoura integral",
    chamada="O bolo da vovó com farinha integral e cobertura de cacau de verdade.",
    cat=["sobremesa", "vegetariana", "economica"],
    tempo=60, rende=12,
    ing=[
        ("3 cenouras médias", 300, 110),
        ("3 ovos", 150, 489),
        ("1/2 xícara de óleo", 100, 272),
        ("2 xícaras de farinha de trigo integral", 240, "farinha_trigo_integral"),
        ("1 xícara de açúcar mascavo", 160, 493),
        ("1 colher de sopa de fermento", 15, "livre"),
        ("2 colheres de sopa de cacau em pó para a calda", 20, "cacau_po"),
    ],
    preparo=[
        "Bata no liquidificador a cenoura crua picada, os ovos e o óleo até ficar liso.",
        "Misture com a farinha e o açúcar mascavo, e o fermento por último.",
        "Asse a 180 °C por 40 minutos.",
        "Para a calda, ferva o cacau com 3 colheres de água e 2 de açúcar mascavo por 2 minutos.",
    ],
    dica="Continua sendo bolo — o integral e o mascavo mudam a fibra e o sabor, não a caloria. A diferença que importa é comer um pedaço, não metade da forma.",
),

dict(
    slug="lasanha-de-berinjela",
    titulo="Lasanha de berinjela",
    chamada="A lasanha inteira, sem uma folha de massa — e ninguém sente falta.",
    cat=["principal", "lowcarb", "economica"],
    tempo=60, rende=6,
    ing=[
        ("3 berinjelas grandes em fatias", 700, 96),
        ("500 g de patinho moído", 500, 376),
        ("2 xícaras de molho de tomate", 400, 159),
        ("200 g de mussarela", 200, "mussarela"),
        ("1 cebola e 3 dentes de alho", 120, 107),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal, orégano e manjericão", 12, "livre"),
    ],
    preparo=[
        "Fatie a berinjela no comprimento, pincele azeite e asse a 220 °C por 15 minutos — isso tira a água e evita a lasanha aguada.",
        "Refogue cebola, alho e carne e junte o molho de tomate.",
        "Monte em camadas: berinjela, carne, queijo, repetindo.",
        "Asse a 200 °C por 25 minutos.",
    ],
    dica="Não pule o passo de assar a berinjela antes. É a diferença entre lasanha e sopa de berinjela na travessa.",
),

dict(
    slug="frango-assado-inteiro-com-legumes",
    titulo="Frango assado inteiro com legumes",
    chamada="O almoço de domingo que vira marmita de segunda e caldo de terça.",
    cat=["principal", "economica"],
    tempo=60, rende=6,
    ing=[
        ("1 frango inteiro de 1,2 kg (dá cerca de 800 g de carne)", 800, 393),
        ("4 batatas", 500, 92),
        ("3 cenouras", 300, 110),
        ("1 cebola grande", 150, 107),
        ("6 dentes de alho", 24, 82),
        ("3 colheres de sopa de azeite", 30, 260),
        ("sal, limão, alecrim e páprica", 30, 220),
    ],
    preparo=[
        "Tempere o frango por dentro e por fora e deixe na geladeira o máximo que der (esse tempo é de espera).",
        "Espalhe os legumes em pedaços grandes na assadeira e ponha o frango por cima.",
        "Asse coberto com papel-alumínio a 200 °C por 40 minutos.",
        "Tire o alumínio e asse mais 15 a 20 minutos para dourar.",
    ],
    dica="Guarde a carcaça: fervida com cebola e cheiro-verde por 40 minutos, ela vira um caldo caseiro que aposenta o tablete.",
),

dict(
    slug="moqueca-de-peixe",
    titulo="Moqueca de peixe",
    chamada="Prato de festa numa panela só — e sem dendê pesado.",
    cat=["principal"],
    tempo=60, rende=4,
    ing=[
        ("700 g de filé de merluza", 700, 302),
        ("1 vidro de leite de coco", 200, 523),
        ("2 tomates", 180, 157),
        ("2 pimentões", 220, 145),
        ("1 cebola grande", 150, 107),
        ("4 dentes de alho", 16, 82),
        ("2 colheres de sopa de azeite", 20, 260),
        ("coentro, sal, limão e páprica", 30, 220),
    ],
    preparo=[
        "Tempere o peixe com limão, alho e sal e deixe 20 minutos.",
        "Faça camadas na panela: cebola, tomate, pimentão, peixe, e repita.",
        "Regue com azeite e leite de coco, tampe e cozinhe em fogo BAIXO por 25 minutos, sem mexer.",
        "Finalize com coentro. Nunca mexa com colher — balance a panela, senão o peixe desmancha.",
    ],
    dica="Leite de coco de vidro costuma ter só coco e água. O de caixinha 'para culinária' quase sempre traz espessante e conservante — vire e compare.",
),

dict(
    slug="torta-de-liquidificador-de-frango",
    titulo="Torta de liquidificador de frango",
    chamada="Massa no liquidificador, recheio do que sobrou, e o jantar de quinta está resolvido.",
    cat=["principal", "economica"],
    tempo=60, rende=8,
    ing=[
        ("3 ovos", 150, 489),
        ("1 xícara de leite desnatado", 200, 457),
        ("1/2 xícara de óleo", 100, 272),
        ("1,5 xícara de farinha de trigo integral", 180, "farinha_trigo_integral"),
        ("400 g de frango cozido desfiado", 400, 408),
        ("1 tomate e 1 cebola", 170, 157),
        ("1 colher de sopa de fermento e sal", 15, "livre"),
    ],
    preparo=[
        "Bata os ovos, o leite e o óleo; junte a farinha e o sal e, por último, o fermento.",
        "Refogue o frango com cebola e tomate e tempere bem.",
        "Ponha metade da massa na forma, o recheio, e cubra com o resto.",
        "Asse a 200 °C por 35 a 40 minutos.",
    ],
    dica="Recheio molhado afunda a massa. Deixe o frango secar bem na panela antes de montar.",
),

dict(
    slug="granola-caseira-sem-acucar",
    titulo="Granola caseira sem açúcar",
    chamada="Um pote que dura o mês e custa metade da granola 'fit' do mercado.",
    cat=["sobremesa", "vegana", "vegetariana", "economica"],
    tempo=60, rende=15,
    ing=[
        ("3 xícaras de aveia em flocos", 270, 7),
        ("1/2 xícara de castanha-de-caju picada", 70, 588),
        ("1/2 xícara de coco em lascas", 50, 590),
        ("3 colheres de sopa de mel", 60, 507),
        ("2 colheres de sopa de óleo de coco", 25, "oleo_coco"),
        ("2 colheres de sopa de linhaça e canela", 25, 594),
    ],
    preparo=[
        "Misture tudo numa tigela até a aveia ficar úmida por igual.",
        "Espalhe FINO numa assadeira e asse a 160 °C por 25 minutos, mexendo na metade do tempo.",
        "Deixe esfriar COMPLETAMENTE na assadeira antes de guardar — é ao esfriar que ela fica crocante.",
    ],
    dica="Compare com a do mercado: a industrializada costuma ter açúcar entre os três primeiros ingredientes, e algumas trazem cobertura de chocolate chamada de 'gotas'.",
),

dict(
    slug="cookies-de-aveia-com-banana",
    titulo="Cookies de aveia com banana",
    chamada="Três ingredientes, 20 minutos de forno, e a lancheira da semana resolvida.",
    cat=["sobremesa", "vegana", "vegetariana", "economica", "fruta"],
    tempo=60, rende=12,
    ing=[
        ("3 bananas maduras", 300, 179),
        ("2 xícaras de aveia em flocos", 180, 7),
        ("2 colheres de sopa de cacau em pó ou uvas-passas", 20, "cacau_po"),
        ("canela", 3, "livre"),
    ],
    preparo=[
        "Amasse bem as bananas com o garfo.",
        "Misture a aveia e a canela até dar liga; deixe descansar 5 minutos para a aveia hidratar.",
        "Faça montinhos achatados na assadeira forrada e asse a 180 °C por 20 minutos.",
    ],
    dica="Dura 4 dias em pote fechado e congela bem. É o lanche que evita a compra de biscoito recheado na saída da escola.",
),

dict(
    slug="almondegas-ao-molho-de-tomate",
    titulo="Almôndegas ao molho de tomate",
    chamada="Rende, congela e agrada criança — com carne magra e aveia no lugar da farinha.",
    cat=["principal", "economica"],
    tempo=60, rende=5,
    ing=[
        ("600 g de patinho moído", 600, 376),
        ("1 ovo", 50, 489),
        ("4 colheres de sopa de aveia em flocos", 40, 7),
        ("1/2 cebola e 3 dentes de alho", 62, 107),
        ("2 xícaras de molho de tomate", 400, 159),
        ("1 colher de sopa de azeite", 10, 260),
        ("sal, orégano e salsinha", 12, "livre"),
    ],
    preparo=[
        "Misture a carne, o ovo, a aveia, a cebola bem picada e os temperos.",
        "Faça bolinhas do tamanho de uma noz e doure na panela com azeite, girando para pegar cor de todos os lados.",
        "Cubra com o molho de tomate e cozinhe tampado em fogo baixo por 20 minutos.",
    ],
    dica="A aveia faz aqui o mesmo papel da farinha de rosca — e ainda entrega fibra em vez de farinha branca.",
),

dict(
    slug="compota-de-maca-sem-acucar",
    titulo="Compota de maçã com canela",
    chamada="Sobremesa quente de inverno com o açúcar que já vem na fruta.",
    cat=["sobremesa", "fruta", "vegana", "vegetariana", "economica"],
    tempo=60, rende=4,
    ing=[
        ("6 maçãs com casca", 800, 222),
        ("1 pau de canela e cravo", 5, "livre"),
        ("suco de 1 limão", 20, 220),
        ("1/2 xícara de água", 120, "livre"),
    ],
    preparo=[
        "Corte as maçãs em cubos, com casca (é nela que está a maior parte da fibra).",
        "Cozinhe em fogo baixo com a água, o limão e as especiarias por 30 minutos, mexendo às vezes.",
        "Amasse com o garfo para a textura que preferir.",
    ],
    dica="Dura 5 dias na geladeira e substitui geleia no pão — a geleia de pote é, em geral, mais açúcar do que fruta.",
),

# ==================================================================
#  2 HORAS — o domingo que resolve a semana inteira
# ==================================================================

dict(
    slug="feijao-carioca-do-zero",
    titulo="Feijão carioca do zero",
    chamada="A panela que alimenta a semana por menos de R$ 1 a porção.",
    cat=["principal", "vegana", "vegetariana", "economica"],
    tempo=120, rende=10,
    ing=[
        ("500 g de feijão carioca seco", 500, 562),
        ("1 cebola grande", 150, 107),
        ("5 dentes de alho", 20, 82),
        ("2 colheres de sopa de azeite", 20, 260),
        ("2 folhas de louro, sal e cheiro-verde", 20, "livre"),
    ],
    preparo=[
        "Deixe o feijão de molho por 8 a 12 horas, trocando a água uma vez (esse tempo é de espera, não de trabalho).",
        "Jogue fora a água do molho: é ela que leva boa parte do que causa gases.",
        "Cozinhe na pressão com água nova e louro por 25 minutos depois que pegar pressão.",
        "Refogue cebola e alho no azeite, junte 2 conchas de feijão amassado, devolva à panela e cozinhe mais 10 minutos.",
    ],
    dica="Feijão é a proteína mais barata do Brasil e, com arroz, forma proteína completa. Congele em porções: descongela em 3 minutos e acaba com a desculpa do 'não tenho o que comer'.",
),

dict(
    slug="frango-desfiado-da-semana",
    titulo="Frango desfiado da semana",
    chamada="Duas horas de domingo que viram cinco jantares — a base de metade das receitas daqui.",
    cat=["principal", "economica", "lowcarb"],
    tempo=120, rende=8,
    ing=[
        ("1,2 kg de peito de frango", 1200, 409),
        ("2 cebolas", 200, 107),
        ("6 dentes de alho", 24, 82),
        ("2 tomates", 180, 157),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal, louro, páprica e cúrcuma", 25, "livre"),
    ],
    preparo=[
        "Cozinhe o peito inteiro em água com louro e sal por 30 minutos.",
        "Desfie com dois garfos ainda morno — frio, ele resiste.",
        "Refogue cebola, alho e tomate no azeite e junte o frango com um pouco da água do cozimento.",
        "Divida em potes de uma refeição e congele o que não for usar em 3 dias.",
    ],
    dica="Guarde a água do cozimento: é caldo de frango de verdade, sem sódio, e vale ouro na sopa da semana.",
),

dict(
    slug="pao-integral-caseiro",
    titulo="Pão integral caseiro",
    chamada="Quatro ingredientes contra os vinte do pão de forma da prateleira.",
    cat=["vegetariana", "vegana", "economica"],
    tempo=120, rende=14,
    ing=[
        ("3 xícaras de farinha de trigo integral", 360, "farinha_trigo_integral"),
        ("1 xícara de farinha de trigo comum", 120, 35),
        ("1 tablete de fermento biológico fresco", 15, "livre"),
        ("2 colheres de sopa de azeite", 20, 260),
        ("1 colher de sopa de mel", 20, 507),
        ("300 ml de água morna e sal", 300, "livre"),
    ],
    preparo=[
        "Dissolva o fermento no mel com um pouco de água morna (morna, não quente: água fervendo mata o fermento).",
        "Misture as farinhas, o sal, o azeite e a água e sove por 10 minutos, até a massa ficar lisa.",
        "Deixe crescer coberto por 1 hora, até dobrar (tempo de espera).",
        "Modele, ponha na forma, deixe crescer mais 30 minutos e asse a 200 °C por 35 minutos.",
    ],
    dica="Vire o pacote do pão de forma industrializado: além do açúcar e da gordura, ele traz conservante para durar 15 dias na prateleira. Este dura 4 — e é por isso que ele é pão.",
),

dict(
    slug="carne-de-panela-com-legumes",
    titulo="Carne de panela com legumes",
    chamada="O corte barato que fica macio de tanto tempo — e faz o próprio molho.",
    cat=["principal", "economica"],
    tempo=120, rende=6,
    ing=[
        ("1 kg de músculo em cubos", 1000, 372),
        ("3 cenouras", 300, 110),
        ("2 batatas grandes", 300, 92),
        ("2 cebolas", 200, 107),
        ("5 dentes de alho", 20, 82),
        ("2 tomates", 180, 157),
        ("2 colheres de sopa de azeite", 20, 260),
        ("louro, sal, pimenta e cheiro-verde", 25, "livre"),
    ],
    preparo=[
        "Doure a carne em levas, sem lotar a panela — é o dourado que dá cor e sabor ao molho.",
        "Refogue cebola, alho e tomate no mesmo fundo.",
        "Volte a carne, cubra com água quente e cozinhe tampado por 1h30 em fogo baixo (ou 40 min na pressão).",
        "Junte os legumes na última meia hora, para não desmancharem.",
    ],
    dica="Músculo e acém custam metade do filé e ficam mais macios em cozimento longo. Carne de panela cara é dinheiro jogado fora.",
),

dict(
    slug="homus-de-grao-de-bico",
    titulo="Homus de grão-de-bico",
    chamada="Pasta cremosa para a semana toda, do jeito árabe, com grão cozido em casa.",
    cat=["vegana", "vegetariana", "economica", "salada"],
    tempo=120, rende=8,
    ing=[
        ("300 g de grão-de-bico seco", 300, 575),
        ("3 colheres de sopa de gergelim (ou tahine)", 30, 593),
        ("4 colheres de sopa de azeite", 40, 260),
        ("suco de 2 limões", 40, 220),
        ("3 dentes de alho", 12, 82),
        ("sal, cominho e páprica", 12, "livre"),
    ],
    preparo=[
        "Deixe o grão-de-bico de molho de um dia para o outro (tempo de espera) e cozinhe na pressão por 25 minutos.",
        "Guarde a água do cozimento antes de escorrer.",
        "Bata tudo no processador, juntando a água do cozimento aos poucos até virar creme.",
        "Sirva com azeite e páprica por cima.",
    ],
    dica="É a água do cozimento — não mais azeite — que deixa o homus cremoso. Foi assim que virou o creme que é há séculos.",
),

dict(
    slug="caldo-verde-leve",
    titulo="Caldo verde leve",
    chamada="O caldo de festa junina sem a linguiça gordurosa boiando por cima.",
    cat=["principal", "economica"],
    tempo=60, rende=6,
    ing=[
        ("5 batatas", 700, 92),
        ("1 maço de couve fatiada fina", 200, 115),
        ("100 g de frango desfiado", 100, 408),
        ("1 cebola e 4 dentes de alho", 140, 107),
        ("2 colheres de sopa de azeite", 20, 260),
        ("1,5 litro de água, sal e pimenta", 1500, "livre"),
    ],
    preparo=[
        "Cozinhe as batatas na água com sal até desmancharem e bata no liquidificador com o próprio caldo.",
        "Refogue cebola e alho no azeite e junte o creme de batata.",
        "Ponha o frango desfiado e, com o fogo desligado, a couve fatiada bem fina.",
        "A couve cozinha só com o calor do caldo — assim ela fica verde e não perde tudo.",
    ],
    dica="A cremosidade vem da batata, não do creme de leite. A linguiça calabresa tradicional traz mais sódio numa rodela do que a sopa inteira precisa.",
),

# ==================================================================
#  LOTE 2 — as 30 que fecham o acervo em 100
#
#  Escolhidas pelo buraco, não pelo gosto: o acervo tinha só 7 sucos,
#  11 saladas, 14 sobremesas e 10 cetogênicas contra 42 pratos
#  principais. Aqui entram sobremesa sem forno, salada de verdade
#  (que sustenta, não a folha triste), o básico que se cozinha uma vez
#  e rende a semana, e as duas panelas que quase toda casa tem hoje:
#  a air fryer e o liquidificador.
# ==================================================================

# ------------------------------- 5 MINUTOS -------------------------------

dict(
    slug="salada-de-manga-com-pepino-e-limao",
    titulo="Salada de manga com pepino e limão",
    chamada="Doce, ácida e crocante na mesma garfada — e fica pronta enquanto a panela esquenta.",
    cat=["salada", "fruta", "vegana", "vegetariana", "economica", "detox"],
    tempo=5, rende=2,
    ing=[
        ("1 manga Palmer firme", 200, 229),
        ("1 pepino japonês", 150, 142),
        ("suco de 1 limão", 20, 220),
        ("hortelã, sal e pimenta", 5, "livre"),
    ],
    preparo=[
        "Corte a manga e o pepino em cubos parecidos — o mesmo tamanho é o que faz a garfada ter as duas coisas.",
        "Tempere com o limão, um pouco de sal e pimenta.",
        "Rasgue a hortelã com a mão por cima na hora de servir.",
    ],
    dica="Escolha a manga ainda firme. A madura demais vira purê no prato e some no meio do pepino.",
),

dict(
    slug="salada-de-rucula-com-pera-e-castanha",
    titulo="Salada de rúcula com pera e castanha",
    chamada="A salada que não parece castigo: amargo da rúcula, doce da pera, crocância da castanha.",
    cat=["salada", "vegetariana", "lowcarb"],
    tempo=5, rende=2,
    ing=[
        ("1 maço pequeno de rúcula", 60, 152),
        ("1 pera", 130, 242),
        ("2 colheres de sopa de castanha-de-caju", 30, 588),
        ("1 colher de sopa de azeite", 10, 260),
        ("limão, sal e pimenta", 10, "livre"),
    ],
    preparo=[
        "Lave e seque bem a rúcula — folha molhada não segura tempero, escorrega.",
        "Fatie a pera fina, com casca.",
        "Junte tudo, quebre as castanhas com a mão e tempere só na hora de comer.",
    ],
    dica="A castanha aqui não é enfeite: é a gordura boa que segura a fome. Salada só de folha volta a dar fome em uma hora.",
),

dict(
    slug="pasta-de-atum-com-cottage",
    titulo="Pasta de atum com cottage",
    chamada="Toda a proteína do atum sem a maionese — para o pão, a torrada ou a colher mesmo.",
    cat=["lowcarb", "cetogenica", "principal", "economica"],
    tempo=5, rende=2,
    ing=[
        ("1 lata de atum escorrido", 120, 277),
        ("4 colheres de sopa de cottage", 100, "cottage"),
        ("1 colher de sopa de azeite", 10, 260),
        ("cebolinha, limão, sal e pimenta", 15, "livre"),
    ],
    preparo=[
        "Escorra bem o atum, apertando com a tampa da lata.",
        "Misture com o cottage até virar pasta, amassando com o garfo.",
        "Termine com limão, cebolinha e pimenta.",
    ],
    dica="O cottage faz o papel cremoso da maionese com uma fração da gordura — e ainda soma proteína em vez de só somar caloria.",
),

dict(
    slug="leite-dourado-de-curcuma",
    titulo="Leite dourado de cúrcuma",
    chamada="A bebida quente do fim da noite, para quem quer largar o doce depois do jantar.",
    cat=["suco", "vegetariana", "detox"],
    tempo=5, rende=2,
    ing=[
        ("2 xícaras de leite desnatado", 400, 457),
        ("1 colher de chá de mel", 7, 507),
        ("cúrcuma, canela e uma pitada de pimenta-do-reino", 5, "livre"),
    ],
    preparo=[
        "Aqueça o leite sem deixar ferver.",
        "Junte a cúrcuma, a canela e a pimenta — a pimenta é o que faz a cúrcuma ser aproveitada pelo corpo.",
        "Adoce com o mel fora do fogo e beba quente.",
    ],
    dica="Cúrcuma não cura nada sozinha e não substitui remédio nenhum. O que esta xícara faz de concreto é ocupar o lugar do doce das 22 h — e isso já é bastante.",
),

dict(
    slug="picole-de-iogurte-com-morango",
    titulo="Picolé de iogurte com morango",
    chamada="Três ingredientes, nenhum corante, e a criança nem desconfia que é fruta.",
    cat=["sobremesa", "fruta", "vegetariana", "economica"],
    tempo=5, rende=6,
    ing=[
        ("2 potes de iogurte natural", 400, 448),
        ("1 caixa de morangos", 200, 239),
        ("1 colher de sopa de mel", 30, 507),
    ],
    preparo=[
        "Bata o iogurte com metade dos morangos e o mel.",
        "Pique o resto dos morangos e misture com a colher, para ficar pedaço na mordida.",
        "Encha as forminhas e leve ao congelador por cerca de 4 horas (tempo de espera, não de trabalho).",
    ],
    dica="Picolé de fruta comprado costuma ser água, açúcar e aroma. Aqui a fruta é o ingrediente principal — e o iogurte ainda traz proteína.",
),

dict(
    slug="salada-de-beterraba-com-cenoura-ralada",
    titulo="Salada de beterraba com cenoura ralada",
    chamada="Duas raízes baratas, cruas e no ralador — a salada mais colorida do prato feito.",
    cat=["salada", "vegana", "vegetariana", "economica", "detox"],
    tempo=5, rende=4,
    ing=[
        ("1 beterraba média crua", 200, 98),
        ("2 cenouras", 150, 110),
        ("suco de 1 limão", 20, 220),
        ("1 colher de sopa de azeite", 10, 260),
        ("salsa e sal", 10, "livre"),
    ],
    preparo=[
        "Rale a beterraba e a cenoura no ralador grosso.",
        "Tempere na hora com limão, azeite e sal.",
        "Sirva logo: crua e ralada na hora, ela é doce; parada de véspera, solta água.",
    ],
    dica="Crua a beterraba mantém melhor o folato e o nitrato natural, que se perdem na água quando ela é fervida — e ainda economiza gás.",
),

# ------------------------------ 10 MINUTOS ------------------------------

dict(
    slug="shakshuka-rapida",
    titulo="Shakshuka rápida",
    chamada="Ovos cozidos dentro do molho de tomate: jantar de uma frigideira só.",
    cat=["principal", "lowcarb", "vegetariana", "economica"],
    tempo=10, rende=2,
    ing=[
        ("4 ovos", 200, 489),
        ("3 tomates maduros", 300, 157),
        ("1 cebola", 80, 107),
        ("2 dentes de alho", 8, 82),
        ("1 colher e meia de sopa de azeite", 15, 260),
        ("páprica, cominho, sal e pimenta", 5, "livre"),
    ],
    preparo=[
        "Refogue a cebola e o alho no azeite até ficarem transparentes.",
        "Junte o tomate picado e os temperos, e deixe apurar uns 5 minutos, amassando com a colher.",
        "Abra quatro buracos no molho e quebre um ovo em cada um.",
        "Tampe e deixe até a clara firmar e a gema ainda tremer — cerca de 4 minutos.",
    ],
    dica="Não mexa depois de pôr os ovos. É o molho quente que cozinha, e mexer transforma a shakshuka em ovo mexido com tomate.",
),

dict(
    slug="aveia-dormida-com-frutas",
    titulo="Aveia dormida com frutas",
    chamada="Você monta hoje à noite e acorda com o café da manhã pronto na geladeira.",
    cat=["economica", "vegetariana", "fruta"],
    tempo=10, rende=1,
    ing=[
        ("4 colheres de sopa de aveia em flocos", 40, 7),
        ("1 pote pequeno de iogurte natural", 120, 448),
        ("1 banana", 80, 179),
        ("1 colher de sopa de chia", 10, "chia"),
        ("canela", 2, "livre"),
    ],
    preparo=[
        "Num pote com tampa, misture a aveia, a chia e o iogurte.",
        "Junte metade da banana amassada e a canela.",
        "Tampe e deixe na geladeira de um dia para o outro.",
        "De manhã, complete com o resto da banana em rodelas.",
    ],
    dica="A aveia de molho fica mais fácil de digerir e mais cremosa, sem cozinhar nada. É o mesmo prato do mingau — só que sem panela e sem pressa de manhã.",
),

dict(
    slug="salada-de-lentilha-com-cenoura",
    titulo="Salada de lentilha com cenoura",
    chamada="A salada que substitui o prato: proteína vegetal, fibra e o preço da lentilha.",
    cat=["salada", "vegana", "vegetariana", "economica", "principal"],
    tempo=10, rende=3,
    ing=[
        ("2 xícaras de lentilha já cozida", 300, 577),
        ("1 cenoura ralada", 100, 110),
        ("1/2 cebola roxa", 60, 107),
        ("salsa picada", 15, 153),
        ("2 colheres de sopa de azeite", 20, 260),
        ("limão, sal e pimenta", 15, "livre"),
    ],
    preparo=[
        "Escorra bem a lentilha cozida e deixe esfriar.",
        "Junte a cenoura ralada, a cebola em fatias finas e a salsa.",
        "Tempere com azeite, limão, sal e pimenta e deixe descansar 5 minutos antes de comer.",
    ],
    dica="A vitamina C do limão ajuda o corpo a aproveitar o ferro da lentilha. Não é crendice: é o único truque de cozinha que muda mesmo a absorção do ferro vegetal.",
),

dict(
    slug="cuscuz-com-atum",
    titulo="Cuscuz com atum",
    chamada="O almoço de dez minutos que cabe no bolso: cuscuz, uma lata e o que tiver na geladeira.",
    cat=["economica", "principal"],
    tempo=10, rende=2,
    ing=[
        ("2 xícaras de cuscuz de milho pronto", 300, 533),
        ("1 lata de atum escorrido", 120, 277),
        ("1 tomate", 100, 157),
        ("1/2 cebola", 40, 107),
        ("1 colher de sopa de azeite", 10, 260),
        ("cheiro-verde, sal e pimenta", 10, "livre"),
    ],
    preparo=[
        "Prepare o cuscuz na cuscuzeira ou no micro-ondas, como está no pacote.",
        "Misture o atum escorrido com tomate, cebola e cheiro-verde.",
        "Sirva por cima do cuscuz quente, com o azeite na hora.",
    ],
    dica="O flocão de milho sozinho é quase só carboidrato. É a lata de atum que transforma isso num almoço que sustenta até a noite.",
),

dict(
    slug="salada-de-repolho-com-maca",
    titulo="Salada de repolho com maçã",
    chamada="O coleslaw da lanchonete, feito com iogurte no lugar da maionese.",
    cat=["salada", "vegetariana", "economica"],
    tempo=10, rende=4,
    ing=[
        ("1/2 repolho branco pequeno", 300, 149),
        ("1 maçã com casca", 150, 222),
        ("1 cenoura", 100, 110),
        ("1/2 pote de iogurte natural", 100, 448),
        ("1 colher de chá de mostarda", 10, "mostarda"),
        ("limão, sal e pimenta", 10, "livre"),
    ],
    preparo=[
        "Fatie o repolho bem fino e rale a cenoura e a maçã no ralador grosso.",
        "Misture o iogurte com a mostarda, o limão, o sal e a pimenta.",
        "Junte tudo e deixe 10 minutos na geladeira antes de servir.",
    ],
    dica="O limão na maçã ralada não é só sabor: é o que impede que ela escureça enquanto a salada espera na mesa.",
),

dict(
    slug="vitamina-de-mamao-com-linhaca",
    titulo="Vitamina de mamão com linhaça",
    chamada="Para quem acorda com o intestino travado — fibra de verdade, não chá milagroso.",
    cat=["suco", "fruta", "detox", "vegetariana", "economica"],
    tempo=5, rende=2,
    ing=[
        ("1/2 mamão papaia", 300, 226),
        ("1 xícara de leite desnatado", 200, 457),
        ("1 colher de sopa de linhaça", 15, 594),
        ("gelo", 100, "livre"),
    ],
    preparo=[
        "Bata tudo no liquidificador até ficar liso.",
        "Beba na hora: a linhaça moída oxida rápido e perde a graça se ficar parada.",
    ],
    dica="Quem faz o intestino andar é a fibra somada à água — e não a linhaça sozinha. Se o dia inteiro for de pouca água, nem esta vitamina resolve.",
),

dict(
    slug="bowl-de-iogurte-com-aveia-e-banana",
    titulo="Bowl de iogurte com aveia e banana",
    chamada="A sobremesa que também serve de café da manhã — e que não precisa de forno nem de açúcar.",
    cat=["sobremesa", "fruta", "vegetariana", "economica"],
    tempo=5, rende=1,
    ing=[
        ("1 pote de iogurte natural", 200, 448),
        ("1 banana", 100, 179),
        ("2 colheres de sopa de aveia em flocos", 25, 7),
        ("1 colher de sopa de castanha-de-caju picada", 10, 588),
        ("canela", 2, "livre"),
    ],
    preparo=[
        "Ponha o iogurte no fundo da tigela.",
        "Cubra com a banana em rodelas, a aveia e a castanha picada.",
        "Termine com canela por cima.",
    ],
    dica="Se quiser deixar mais doce, amasse metade da banana no iogurte antes. Banana amassada adoça muito mais do que banana em rodela.",
),

dict(
    slug="pudim-de-chia-com-manga",
    titulo="Pudim de chia com manga",
    chamada="Sobremesa sem forno, sem leite de vaca e sem açúcar — e ainda parece coisa de cafeteria.",
    cat=["sobremesa", "vegana", "vegetariana", "fruta"],
    tempo=10, rende=2,
    ing=[
        ("3 colheres de sopa de chia", 30, "chia"),
        ("1 xícara de leite de coco light", 200, "leite_coco_leve"),
        ("1 manga madura", 200, 229),
    ],
    preparo=[
        "Misture a chia com o leite de coco e mexa bem — e mexa de novo depois de 5 minutos, senão vira uma pedra no fundo.",
        "Deixe na geladeira por pelo menos 3 horas (tempo de espera).",
        "Bata a manga até virar creme e ponha por cima na hora de servir.",
    ],
    dica="É a manga madura que adoça: nenhum açúcar entra aqui. Se a sua estiver ácida, espere mais um ou dois dias na fruteira em vez de corrigir com açúcar.",
),

dict(
    slug="mousse-de-maracuja-com-iogurte",
    titulo="Mousse de maracujá com iogurte",
    chamada="O sabor do mousse de leite condensado, sem a lata inteira de leite condensado.",
    cat=["sobremesa", "vegetariana"],
    tempo=10, rende=4,
    ing=[
        ("2 potes de iogurte grego natural", 400, "iogurte_grego"),
        ("polpa de 2 maracujás", 100, 233),
        ("1 colher de sopa de mel", 30, 507),
    ],
    preparo=[
        "Bata o iogurte com metade da polpa e o mel até ficar aerado.",
        "Distribua em taças e leve à geladeira por 1 hora (tempo de espera).",
        "Cubra com o resto da polpa, com as sementes, na hora de servir.",
    ],
    dica="O mousse tradicional leva uma lata de leite condensado para quatro porções — perto de 90 g de açúcar. Aqui a acidez do maracujá faz o trabalho que o açúcar fazia.",
),

# ------------------------------ 30 MINUTOS ------------------------------

dict(
    slug="frango-na-air-fryer-com-paprica",
    titulo="Frango na air fryer com páprica",
    chamada="Dourado por fora, suculento por dentro, com uma colher de azeite no lugar da fritura.",
    cat=["principal", "lowcarb", "cetogenica"],
    tempo=30, rende=4,
    ing=[
        ("2 peitos de frango em filés", 600, 409),
        ("2 colheres de sopa de azeite", 20, 260),
        ("suco de 1 limão", 20, 220),
        ("páprica, alho em pó, sal e pimenta", 15, "livre"),
    ],
    preparo=[
        "Tempere os filés e deixe descansar 10 minutos — esse tempo é o que faz o tempero entrar.",
        "Preaqueça a air fryer a 200 °C por 3 minutos.",
        "Asse por 8 minutos, vire e asse mais 6.",
        "Deixe descansar 3 minutos fora do aparelho antes de cortar, para o suco não escorrer todo na tábua.",
    ],
    dica="Não empilhe os filés no cesto. Air fryer é ar circulando: peça amontoada cozinha no vapor e sai pálida e borrachuda.",
),

dict(
    slug="curry-de-grao-de-bico-com-leite-de-coco",
    titulo="Curry de grão-de-bico com leite de coco",
    chamada="Um prato vegano que sacia de verdade — e que fica melhor no dia seguinte.",
    cat=["vegana", "vegetariana", "principal", "economica"],
    tempo=30, rende=4,
    ing=[
        ("2 xícaras de grão-de-bico cozido", 400, "grao_bico_cozido"),
        ("1 xícara de leite de coco light", 200, "leite_coco_leve"),
        ("2 tomates", 200, 157),
        ("1 cebola", 100, 107),
        ("2 dentes de alho", 10, 82),
        ("2 punhados de espinafre", 100, 119),
        ("1 colher e meia de sopa de azeite", 15, 260),
        ("curry, cúrcuma, gengibre em pó e sal", 10, "livre"),
    ],
    preparo=[
        "Refogue cebola e alho no azeite e junte os temperos secos, mexendo 30 segundos para acordar o cheiro.",
        "Ponha o tomate picado e deixe desmanchar.",
        "Junte o grão-de-bico e o leite de coco e cozinhe 10 minutos em fogo baixo.",
        "Desligue e misture o espinafre — ele murcha só com o calor da panela.",
    ],
    dica="Grão-de-bico com arroz forma proteína tão completa quanto a da carne. É por isso que quase toda cozinha do mundo tem um par assim: feijão com arroz é o nosso.",
),

dict(
    slug="pts-a-bolonhesa",
    titulo="Proteína de soja à bolonhesa",
    chamada="O molho de carne moída do domingo, por uma fração do preço da carne.",
    cat=["vegana", "vegetariana", "economica", "principal"],
    tempo=30, rende=4,
    ing=[
        ("1 xícara de proteína de soja seca", 100, "pts_seca"),
        ("4 tomates", 400, 157),
        ("1 cebola", 80, 107),
        ("2 dentes de alho", 8, 82),
        ("1 colher e meia de sopa de azeite", 15, 260),
        ("louro, orégano, sal e pimenta", 10, "livre"),
    ],
    preparo=[
        "Hidrate a proteína de soja em água quente por 10 minutos, escorra e aperte bem para tirar a água.",
        "Refogue cebola e alho no azeite, junte a soja e deixe dourar de verdade — é aqui que ela ganha gosto.",
        "Ponha o tomate picado e os temperos e cozinhe 15 minutos em fogo baixo.",
    ],
    dica="Apertar a soja depois de hidratar é o passo que quase todo mundo pula — e é o que tira o gosto de papelão que dá fama ruim a ela.",
),

dict(
    slug="bolinho-de-atum-assado",
    titulo="Bolinho de atum assado",
    chamada="Gosto de bolinho frito, feito no forno, com aveia no lugar da farinha branca.",
    cat=["principal", "lowcarb", "economica"],
    tempo=30, rende=4,
    ing=[
        ("2 latas de atum escorrido", 240, 277),
        ("2 ovos", 100, 489),
        ("6 colheres de sopa de aveia em flocos", 60, 7),
        ("1/2 cebola", 60, 107),
        ("salsa picada", 10, 153),
        ("sal, pimenta e orégano", 5, "livre"),
    ],
    preparo=[
        "Misture tudo numa tigela até dar liga e deixe 5 minutos parado — a aveia precisa desse tempo para absorver.",
        "Faça bolinhas com a colher e ponha numa assadeira forrada.",
        "Asse a 200 °C por 20 minutos, virando na metade.",
    ],
    dica="Servem de lanche da tarde, de jantar com salada e de recheio de sanduíche no dia seguinte. Feitos numa vez, resolvem três refeições.",
),

dict(
    slug="kafta-de-carne-assada",
    titulo="Kafta de carne assada",
    chamada="Carne moída temperada de verdade, no forno, sem nada além de tempero fresco.",
    cat=["principal", "lowcarb", "cetogenica"],
    tempo=30, rende=4,
    ing=[
        ("500 g de acém moído", 500, 327),
        ("1 cebola", 80, 107),
        ("salsa e hortelã picadas", 20, 153),
        ("2 dentes de alho", 8, 82),
        ("sal, cominho, canela e pimenta", 10, "livre"),
    ],
    preparo=[
        "Bata a cebola, o alho e as ervas no processador (ou pique muito fino) e misture à carne.",
        "Sove a mistura com a mão por 2 minutos — sem isso a kafta racha e desmancha.",
        "Modele em cilindros em volta de espetos ou faça no formato de linguiça.",
        "Asse a 220 °C por 18 minutos, virando na metade.",
    ],
    dica="Uma pitada de canela na carne não deixa gosto de doce: é o que dá o sabor árabe que a gente reconhece e não sabe nomear.",
),

dict(
    slug="tabule-de-bulgur",
    titulo="Tabule de bulgur",
    chamada="A salada em que a salsa é o ingrediente principal, não o enfeite.",
    cat=["salada", "vegana", "vegetariana", "economica"],
    tempo=30, rende=4,
    ing=[
        ("1 xícara de trigo para quibe", 120, "bulgur_seco"),
        ("3 tomates sem semente", 300, 157),
        ("1 pepino", 150, 142),
        ("2 maços de salsa", 40, 153),
        ("1/2 cebola roxa", 60, 107),
        ("3 colheres de sopa de azeite", 30, 260),
        ("suco de 2 limões e sal", 30, "livre"),
    ],
    preparo=[
        "Cubra o trigo com água fria e deixe hidratar por 20 minutos (tempo de espera).",
        "Escorra apertando bem numa peneira.",
        "Pique tudo miúdo e misture com o azeite, o limão e o sal.",
        "Deixe descansar 10 minutos na geladeira antes de servir.",
    ],
    dica="Água fria, não quente. Trigo hidratado na água fervente vira mingau e o tabule perde a mordida.",
),

dict(
    slug="risoto-de-quinoa-com-champignon",
    titulo="Risoto de quinoa com champignon",
    chamada="A cremosidade do risoto sem ficar meia hora em pé mexendo a panela.",
    cat=["vegetariana", "principal"],
    tempo=30, rende=3,
    ing=[
        ("3 xícaras de quinoa cozida", 450, "quinoa_cozida"),
        ("2 xícaras de champignon fatiado", 200, "champignon"),
        ("1 cebola", 80, 107),
        ("2 dentes de alho", 8, 82),
        ("2 colheres de sopa de azeite", 20, 260),
        ("60 g de queijo minas ralado", 60, 461),
        ("caldo de legumes, sal e pimenta", 300, "livre"),
    ],
    preparo=[
        "Doure o champignon no azeite sem mexer muito, até soltar a água e voltar a fritar.",
        "Junte cebola e alho e refogue.",
        "Ponha a quinoa cozida e o caldo aos poucos, mexendo até ficar cremoso.",
        "Desligue e misture o queijo ralado.",
    ],
    dica="A quinoa já cozida vira risoto em cinco minutos. Cozinhe uma panela grande no domingo e ela resolve prato de semana inteira.",
),

dict(
    slug="macarrao-ao-molho-de-tomate-caseiro",
    titulo="Macarrão ao molho de tomate caseiro",
    chamada="Tomate, alho e azeite: o molho de sempre, sem o açúcar e o sódio do vidro pronto.",
    cat=["economica", "vegetariana", "vegana", "principal"],
    tempo=30, rende=4,
    ing=[
        ("320 g de macarrão", 320, 40),
        ("6 tomates maduros", 600, 157),
        ("1 cebola", 100, 107),
        ("3 dentes de alho", 12, 82),
        ("3 colheres de sopa de azeite", 30, 260),
        ("manjericão, sal e pimenta", 10, "livre"),
    ],
    preparo=[
        "Refogue a cebola e o alho no azeite em fogo baixo, sem deixar queimar.",
        "Junte os tomates picados e cozinhe 20 minutos, amassando com a colher.",
        "Cozinhe o macarrão e junte ao molho na própria panela, com um pouco da água do cozimento.",
        "Manjericão só no fim, com o fogo desligado.",
    ],
    dica="A água do cozimento tem amido e é ela que faz o molho grudar no macarrão. Escorrer tudo na pia é jogar fora o que ligaria o prato.",
),

dict(
    slug="caldo-de-feijao-com-legumes",
    titulo="Caldo de feijão com legumes",
    chamada="O feijão que sobrou vira o jantar de hoje — quente, barato e com fibra de sobra.",
    cat=["economica", "vegana", "vegetariana", "principal"],
    tempo=30, rende=4,
    ing=[
        ("3 conchas de feijão carioca cozido", 500, 561),
        ("1 cenoura", 100, 110),
        ("2 fatias de abóbora cabotiá", 200, 65),
        ("1 cebola", 80, 107),
        ("2 dentes de alho", 8, 82),
        ("1 colher e meia de sopa de azeite", 15, 260),
        ("água, louro, sal e pimenta", 800, "livre"),
    ],
    preparo=[
        "Cozinhe a cenoura e a abóbora em pedaços na água com sal até ficarem bem macias.",
        "Bata metade do feijão com esses legumes e o caldo.",
        "Refogue cebola e alho no azeite, junte tudo e o resto do feijão inteiro.",
        "Deixe ferver 10 minutos para encorpar.",
    ],
    dica="É a abóbora batida que engrossa, não a farinha nem o creme de leite. Caldo grosso não precisa de nada além de um legume cozido demais.",
),

# ------------------------------ 60 MINUTOS ------------------------------

dict(
    slug="bolo-de-fuba-com-erva-doce",
    titulo="Bolo de fubá com erva-doce",
    chamada="O bolo de fubá da fazenda, no liquidificador, sem cobertura nenhuma.",
    cat=["sobremesa", "economica", "vegetariana"],
    tempo=60, rende=12,
    ing=[
        ("2 xícaras de fubá", 250, 43),
        ("1 xícara de farinha de trigo", 100, 35),
        ("3/4 de xícara de açúcar", 150, 492),
        ("3 ovos", 150, 489),
        ("1 xícara e meia de leite desnatado", 300, 457),
        ("1/3 de xícara de óleo", 80, 272),
        ("1 colher de sopa de fermento e erva-doce", 20, "livre"),
    ],
    preparo=[
        "Bata no liquidificador os ovos, o leite, o óleo e o açúcar.",
        "Passe para uma tigela e misture o fubá, a farinha e a erva-doce.",
        "O fermento entra por último, mexendo com a colher.",
        "Asse a 180 °C por cerca de 40 minutos, até o palito sair seco.",
    ],
    dica="Uma fatia deste bolo tem menos açúcar que a maioria dos bolos de caixinha — e nenhum ingrediente com nome que você não saiba pronunciar. Mas continua sendo bolo: a fatia é uma, não o pedaço inteiro.",
),

dict(
    slug="bolo-de-maca-integral",
    titulo="Bolo de maçã integral",
    chamada="Metade da massa é maçã — e é ela que adoça, não a xícara de açúcar.",
    cat=["sobremesa", "economica", "vegetariana", "fruta"],
    tempo=60, rende=12,
    ing=[
        ("3 maçãs com casca", 400, 222),
        ("2 xícaras de farinha de trigo integral", 250, "farinha_trigo_integral"),
        ("1/2 xícara de aveia em flocos", 60, 7),
        ("3 ovos", 150, 489),
        ("1/2 xícara de açúcar mascavo", 100, 493),
        ("1/4 de xícara de óleo", 60, 272),
        ("1 colher de sopa de fermento e canela", 20, "livre"),
    ],
    preparo=[
        "Rale duas maçãs e reserve a terceira em fatias para cobrir.",
        "Bata os ovos com o açúcar e o óleo e junte a maçã ralada.",
        "Misture a farinha integral, a aveia e a canela, e o fermento por último.",
        "Cubra com as fatias, polvilhe canela e asse a 180 °C por 45 minutos.",
    ],
    dica="A farinha integral pede um pouco mais de líquido e deixa o bolo mais denso — é assim mesmo. Bolo integral fofinho como o branco costuma ser integral só no nome.",
),

dict(
    slug="frango-recheado-com-ricota-e-espinafre",
    titulo="Frango recheado com ricota e espinafre",
    chamada="Prato de restaurante com dois ingredientes baratos escondidos dentro do filé.",
    cat=["principal", "lowcarb"],
    tempo=60, rende=4,
    ing=[
        ("2 peitos de frango grandes", 600, 409),
        ("150 g de ricota", 150, 469),
        ("2 punhados de espinafre", 150, 119),
        ("2 dentes de alho", 8, 82),
        ("2 colheres de sopa de azeite", 20, 260),
        ("sal, noz-moscada e pimenta", 8, "livre"),
    ],
    preparo=[
        "Refogue o espinafre com o alho, escorra a água e misture com a ricota amassada.",
        "Abra os peitos em manta (corte lateral, sem separar) e tempere dos dois lados.",
        "Recheie, feche com palito e sele numa frigideira quente.",
        "Termine no forno a 200 °C por 25 minutos.",
    ],
    dica="Escorrer a água do espinafre é o que separa o recheio cremoso do recheio que vaza. Aperte na peneira até parar de pingar.",
),

dict(
    slug="pao-de-aveia-de-forma",
    titulo="Pão de aveia de forma",
    chamada="Pão caseiro sem sova e sem tempo de crescer — mistura, assa e come.",
    cat=["economica", "vegetariana"],
    tempo=60, rende=12,
    ing=[
        ("3 xícaras de aveia em flocos", 300, 7),
        ("1 xícara e meia de farinha de trigo integral", 150, "farinha_trigo_integral"),
        ("3 ovos", 150, 489),
        ("1 pote de iogurte natural", 200, 448),
        ("1 colher de sopa de fermento e sal", 25, "livre"),
        ("gergelim para polvilhar", 20, 593),
    ],
    preparo=[
        "Bata metade da aveia no liquidificador até virar farinha.",
        "Misture tudo numa tigela, com o fermento por último.",
        "Ponha numa forma de bolo inglês untada e polvilhe o gergelim.",
        "Asse a 180 °C por 40 minutos e espere esfriar antes de fatiar.",
    ],
    dica="Este pão é feito com fermento químico, não biológico: não cresce como pão de padaria e é mais denso mesmo. Em compensação fica pronto em uma hora, do zero.",
),

# ------------------------------ 120 MINUTOS -----------------------------

dict(
    slug="molho-de-tomate-caseiro-da-semana",
    titulo="Molho de tomate caseiro da semana",
    chamada="Uma panela no domingo e você não compra mais molho de vidro.",
    cat=["economica", "vegana", "vegetariana"],
    tempo=120, rende=8,
    ing=[
        ("15 tomates bem maduros", 1500, 157),
        ("2 cebolas", 200, 107),
        ("5 dentes de alho", 20, 82),
        ("4 colheres de sopa de azeite", 40, 260),
        ("manjericão, louro, sal e pimenta", 20, "livre"),
    ],
    preparo=[
        "Faça um X na base de cada tomate, escalde em água fervente por 1 minuto e tire a pele.",
        "Refogue cebola e alho no azeite em fogo baixo por 10 minutos, sem dourar.",
        "Junte os tomates picados e cozinhe em fogo baixo por 1 hora e meia, mexendo de vez em quando.",
        "Manjericão só no fim. Guarde em potes na geladeira por até 5 dias, ou congele em porções.",
    ],
    dica="O molho de vidro costuma trazer açúcar para corrigir a acidez do tomate ruim. Com tomate maduro de verdade e uma hora e meia de fogo baixo, o açúcar não faz falta.",
),

dict(
    slug="grao-de-bico-cozido-do-zero",
    titulo="Grão-de-bico cozido do zero",
    chamada="Um pacote de grão seco rende o que cinco latas custam — e sem o sódio da conserva.",
    cat=["economica", "vegana", "vegetariana"],
    tempo=120, rende=8,
    ing=[
        ("500 g de grão-de-bico seco", 500, 575),
        ("água, louro e sal", 2000, "livre"),
    ],
    preparo=[
        "Deixe o grão de molho em água por 12 horas, trocando a água uma vez (tempo de espera).",
        "Escorra, cubra com água nova e cozinhe na pressão por 25 minutos depois de pegar pressão.",
        "Salgue só no fim do cozimento — sal no início endurece a casca.",
        "Congele em porções com um pouco do caldo, que é o que impede o grão de ressecar.",
    ],
    dica="A água do molho leva junto boa parte dos compostos que dão gases. Trocar essa água e não cozinhar nela é o que faz diferença de verdade na barriga.",
),

]

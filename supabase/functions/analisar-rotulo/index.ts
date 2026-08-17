// ============================================================
//  Edge Function: analisar-rotulo
//  App "NO MERCADO COM A NUTRI ANA" — a pessoa fotografa o rótulo
//  (frente, tabela nutricional, lista de ingredientes) e recebe:
//    1. a leitura do produto em linguagem de gente
//    2. a explicação dos ingredientes que ninguém entende
//    3. SEMPRE caminhos de troca por ALIMENTO (sem marca), em três
//       degraus: versão melhor do mesmo item, mesmo papel na refeição
//       com menos processamento, e a opção in natura
//    4. quando o produto não é boa escolha, PELO MENOS 3 MARCAS reais
//
//  DIFERENÇAS EM RELAÇÃO AO RESTO DA PLATAFORMA
//
//  - É ABERTA (deploy com --no-verify-jwt). Quem usa não é
//    necessariamente paciente da Ana; esse é o ponto do app. O
//    Authorization é OPCIONAL e só serve para liberar o limite maior.
//
//  - A FOTO NÃO É GUARDADA. Chega em base64 no corpo, vai para o
//    modelo e morre aqui. Ver o cabeçalho da migração 0051.
//
//  - AS MARCAS NÃO SAEM DA MEMÓRIA DO MODELO. Elas vêm da tabela
//    mercado_produtos (espelho da Open Food Facts, Brasil). O modelo
//    só ESCOLHE dentro de uma lista que já existe na prateleira e
//    escreve o porquê. Modelo inventando marca, num app assinado por
//    uma nutricionista registrada, é risco profissional dela.
//
//  - REGRA DAS 3 MARCAS: se a base não conseguir oferecer três marcas
//    DIFERENTES e melhores, o app não sugere nenhuma e diz isso. Meia
//    sugestão viraria favorecimento de marca.
//
//  Res. CFN 856/2026: orientação geral de leitura de rótulo, não
//  avaliação nutricional individualizada e não prescrição. O prompt
//  proíbe diagnóstico, dieta, promessa e julgamento moral da comida.
//
//  Chave da OpenAI no secret OPENAI_API_KEY; modelo via OPENAI_MODEL
//  (padrão gpt-4o-mini, que enxerga imagem).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ---------- Freios de custo ----------
// A conta da OpenAI é da Ana e o app é grátis: o teto não é comercial, é
// de sobrevivência. Cada leitura custa cerca de R$ 0,01 a R$ 0,02, então
// estes três números SÃO a fatura do mês — mexer neles é mexer no bolso
// dela. Calibrados com ela em 01/08/2026, com o pedido explícito de
// gastar menos.
//
//   visitante 3/dia   -> ~R$ 0,05 no dia dele
//   paciente 15/dia   -> uma compra inteira lida com folga
//   global 150/dia    -> teto de ~R$ 3/dia (~R$ 90/mês) no PIOR caso,
//                        ou seja, só se o app estourar de gente
const LIMITE_VISITANTE = 3;    // por dispositivo, por dia
const LIMITE_LIBERADO = 15;    // paciente da Ana ou a própria nutri
const LIMITE_GLOBAL = 150;     // teto do app inteiro por dia
const LIMITE_CODIGO_DIA = 25;  // por pacote comprado, por dia (anti-vazamento)
// A assinatura NÃO tem teto por dia: uma compra de mercado é uma rajada (15
// leituras numa tarde, nada por dez dias), e cortar no meio do corredor é
// exatamente o momento errado. O teto é do MÊS, e a pessoa vê o saldo dele
// depois de cada leitura. Janela corrida de 30 dias, não mês do calendário:
// quem assina no dia 28 não pode ganhar dois tetos em três dias.
const LIMITE_ASSINANTE_MES = 100;
const JANELA_MES_MS = 30 * 24 * 3600 * 1000;
// Aparelhos que podem usar o MESMO código pago. Os tetos acima seguram o
// volume, mas não impedem um código colado num grupo de WhatsApp de virar o
// app de meio bairro dentro desse volume. 3 cobre celular + tablet + uma
// troca de aparelho; a vaga de quem sumiu há 30 dias volta sozinha (a regra
// da janela mora na migration 0066).
const LIMITE_APARELHOS = 3;
const JANELA_APARELHOS_DIAS = 30;

// Categorias que existem no espelho da Open Food Facts. O modelo é
// OBRIGADO a escolher uma delas (ou "outro"): categoria livre não casaria
// com nada na base e a busca de alternativas voltaria vazia sempre.
// Precisa espelhar mercado/importar_off.py.
const CATEGORIAS: Record<string, string> = {
  "biscuits": "Biscoitos e bolachas",
  "breakfast-cereals": "Cereais matinais",
  "granolas": "Granolas",
  "cereal-bars": "Barras de cereal",
  "protein-bars": "Barras de proteína",
  "yogurts": "Iogurtes",
  "cheeses": "Queijos",
  "milks": "Leites",
  "plant-based-milk-alternatives": "Bebidas vegetais",
  "breads": "Pães",
  "pastas": "Massas e macarrão",
  "rices": "Arroz",
  "beans": "Feijão e leguminosas",
  "flours": "Farinhas",
  "oats": "Aveia",
  "tapiocas": "Tapioca e goma",
  "chocolates": "Chocolates",
  "candies": "Balas e doces",
  "ice-creams": "Sorvetes",
  "snacks": "Salgadinhos e petiscos",
  "crisps": "Batata frita de pacote",
  "sodas": "Refrigerantes",
  "fruit-juices": "Sucos",
  "energy-drinks": "Energéticos",
  "sweeteners": "Adoçantes",
  "sugars": "Açúcares",
  "jams": "Geleias",
  "honeys": "Méis",
  "peanut-butters": "Pasta de amendoim",
  "coffees": "Cafés",
  "teas": "Chás",
  "butters": "Manteigas",
  "margarines": "Margarinas",
  "vegetable-oils": "Óleos vegetais",
  "olive-oils": "Azeites",
  "mayonnaises": "Maioneses",
  "ketchup": "Ketchup",
  "sauces": "Molhos",
  "canned-tuna": "Atum e sardinha em lata",
  "sausages": "Salsichas e linguiças",
  "hams": "Presunto e frios",
  "frozen-foods": "Congelados",
  "pizzas": "Pizzas",
  "instant-noodles": "Macarrão instantâneo",
  "soups": "Sopas",
  "eggs": "Ovos",
  "salts": "Sais",
};

// A COMIDA DE VERDADE, PELA TACO.
//
// Pedido da Ana: a TACO passa a ser a base das respostas. Ela não tem marca
// nem código de barras — é tabela de alimento in natura e preparações —, então
// não substitui a Open Food Facts na indicação de marca. O que ela faz, e a
// OFF não pode fazer, é dar um PONTO DE COMPARAÇÃO de fonte oficial: quanto
// tem de açúcar, sódio e saturada o alimento de verdade daquela prateleira.
//
// Só existe entrada aqui onde a comparação é honesta. Bala e chocolate não
// têm "equivalente in natura", e inventar um viraria sermão — categoria sem
// referência simplesmente não mostra a comparação.
//
// Os ids são os números da própria TACO, conferidos contra o PDF oficial
// (ver mercado/extrai_taco.py e a migração 0052).
const REFERENCIA_TACO: Record<string, number> = {
  "sodas": 209,                  // Laranja, baía, suco
  "fruit-juices": 208,           // Laranja, baía, crua (a fruta inteira)
  "energy-drinks": 209,          // Laranja, baía, suco
  "breakfast-cereals": 7,        // Aveia, flocos, crua
  "granolas": 7,                 // Aveia, flocos, crua
  "oats": 7,                     // Aveia, flocos, crua
  "cereal-bars": 182,            // Banana, prata, crua
  "protein-bars": 557,           // Amendoim, grão, cru
  "snacks": 61,                  // Pipoca, com óleo de soja, sem sal
  "crisps": 61,                  // Pipoca, com óleo de soja, sem sal
  "yogurts": 448,                // Iogurte, natural
  "peanut-butters": 557,         // Amendoim, grão, cru
  "canned-tuna": 278,            // Atum, fresco, cru
  "sausages": 321,               // Sardinha, inteira, crua
  "hams": 488,                   // Ovo, de galinha, inteiro, cozido
  "instant-noodles": 40,         // Macarrão, trigo, cru
  "pastas": 40,                  // Macarrão, trigo, cru
  "breads": 52,                  // Pão, trigo, forma, integral
  "rices": 1,                    // Arroz, integral, cozido
  "beans": 561,                  // Feijão, carioca, cozido
  "cheeses": 461,                // Queijo, minas, frescal
  "milks": 458,                  // Leite, de vaca, integral
  "eggs": 488,                   // Ovo, de galinha, inteiro, cozido
  "olive-oils": 260,             // Azeite, de oliva, extra virgem
  "honeys": 507,                 // Mel, de abelha
  "biscuits": 53,                // Pão, trigo, francês
};

// Glossário da casa. Está aqui, e não solto na cabeça do modelo, porque
// estas são as perguntas que a Ana responde toda semana e a resposta
// precisa sair igual e correta todas as vezes — inclusive a da farinha
// enriquecida, que é lei desde 2002 e quase ninguém sabe.
const GLOSSARIO = `
- "farinha de trigo enriquecida com ferro e ácido fólico": não é um tipo especial de farinha nem um diferencial do produto. É farinha branca comum: desde 2002 a lei brasileira (RDC 344/2002, hoje RDC 150/2017) OBRIGA toda farinha de trigo e de milho vendida no país a receber ferro e ácido fólico, para prevenir anemia e defeitos de formação do bebê na gestação. Todo pão, macarrão e biscoito de farinha branca traz isso escrito. "Enriquecida" ali não quer dizer integral nem mais nutritiva que outra marca.
- "farinha de trigo integral": aí sim é o grão inteiro, com farelo e germe — tem fibra de verdade. Só vale se aparecer no COMEÇO da lista; muitos "integrais" trazem farinha branca em primeiro e um pouco de integral no fim.
- "açúcar invertido", "xarope de glicose", "maltodextrina", "dextrose", "xarope de milho", "melado", "açúcar demerara", "açúcar de coco": são todos açúcar. Aparecem com nomes diferentes na mesma lista para que nenhum deles chegue ao topo — somados, muitas vezes seriam o primeiro ingrediente.
- "gordura vegetal hidrogenada": fonte de gordura trans, a pior para o coração. Praticamente banida no Brasil desde 2023, mas ainda aparece em produto antigo ou importado.
- "gordura vegetal" / "gordura de palma": gordura saturada, comum em recheio e cobertura para dar textura e durar mais.
- "aroma idêntico ao natural" / "aroma artificial": sabor feito em laboratório. Não faz mal por si, mas indica produto que precisa de ajuda para ter gosto de comida.
- "realçador de sabor glutamato monossódico (INS 621)": intensifica o sabor e vem junto de bastante sódio.
- "conservante", "estabilizante", "espessante", "emulsificante", "corante": aditivos de tecnologia de alimento. Um ou outro é normal; uma fila deles é o sinal mais honesto de ultraprocessado.
- "INS" seguido de número: é o código internacional do aditivo. Muitos códigos numa lista curta = produto muito processado.
- "proteína isolada de soja", "proteína texturizada": proteína extraída, usada para dar estrutura e aumentar o número de proteína do rótulo.
- "fibra alimentar", "inulina", "polidextrose": fibras adicionadas. Contam como fibra, mas não substituem a fibra do alimento de verdade.
- "leite em pó desnatado" em produto que se vende como lácteo: costuma indicar reconstituição, não leite fresco.
- "soro de leite" / "soro de leite em pó": subproduto barato do queijo, usado para dar volume. Em "queijo" e "requeijão" muitas vezes indica produto de qualidade inferior.
`.trim();

// Diet e light são definidos em LEI (Portaria SVS/MS 29/1998 e RDC
// 54/2012). Texto fixo e não gerado pelo modelo porque é a confusão que
// mais faz gente comprar errado, e uma alucinação aqui seria a Ana
// ensinando errado com o nome dela na tela.
const DIET_LIGHT = `
DIET (Portaria SVS/MS 29/1998): produto formulado para dietas com RESTRIÇÃO ESPECÍFICA — é isento de um nutriente (geralmente açúcar, mas pode ser gordura, sódio ou proteína). Foi feito para quem precisa cortar aquele nutriente, como a pessoa com diabetes. DIET NÃO QUER DIZER MENOS CALORIA: chocolate diet tira o açúcar e costuma compensar com MAIS gordura, ficando às vezes mais calórico que o normal.
LIGHT (RDC 54/2012): produto com REDUÇÃO DE NO MÍNIMO 25% de um nutriente ou das calorias em relação ao produto convencional da mesma marca. Light não é isento — só tem menos. E o "menos" pode ser de sódio, de gordura ou de açúcar, não necessariamente de caloria.
Em resumo: diet é para quem PRECISA excluir um nutriente; light é para quem quer REDUZIR. Nenhum dos dois significa "emagrecedor", e nos dois casos a única forma de saber é virar o pacote e ler a tabela.
`.trim();

const SYSTEM_LEITURA = `Você é o leitor de rótulos do app "No mercado com a Nutri Ana", da nutricionista brasileira Ana Luísa Rocha.
Quem está do outro lado está DE PÉ NO CORREDOR DO MERCADO, com o produto na mão, decidindo se leva. Escreva em português do Brasil, direto, curto e adulto. Sem jargão, sem sermão e sem culpa.

Você recebe de 1 a 3 fotos do MESMO produto (frente da embalagem, tabela nutricional, lista de ingredientes).

Devolva APENAS um JSON válido, sem texto fora do JSON, no formato EXATO:
{
  "eh_rotulo": true,
  "produto": "nome do produto como está na embalagem",
  "marca": "marca, se der para ver",
  "categoria_tag": "biscuits",
  "porcao": "30 g (2 unidades)",
  "tabela": { "base": "porcao", "kcal": 140, "ptn_g": 2, "cho_g": 20, "acucar_g": 8, "fibra_g": 1, "lip_g": 6, "sat_g": 3, "sodio_mg": 95 },
  "por_100g": { "kcal": 467, "acucar_g": 27, "sat_g": 10, "sodio_mg": 317, "fibra_g": 3 },
  "diet_light": "nenhum",
  "veredito": "atencao",
  "resumo": "1 ou 2 frases dizendo o que esse produto é, de verdade",
  "destaques": ["o que ele tem de bom"],
  "alertas": ["o que pesa contra, do mais importante para o menos"],
  "ingredientes": [{ "termo": "farinha de trigo enriquecida com ferro e ácido fólico", "explicacao": "..." }],
  "porcao_g": 10,
  "consumo_g": 40,
  "consumo_desc": "o pacotinho inteiro, 4 fatias",
  "funcao": "base crocante que carrega recheio no lanche da tarde",
  "caminhos_intro": "",
  "caminhos": [{ "tipo": "melhor_versao", "titulo": "torrada 100% integral", "melhora": "farinha integral em primeiro lugar, o dobro de fibra por 100 g" }],
  "falta": []
}

REGRAS DE LEITURA
- "categoria_tag": escolha OBRIGATORIAMENTE uma desta lista, a mais próxima: ${Object.keys(CATEGORIAS).join(", ")}. Se nenhuma servir, use "outro".
- "tabela" é o que está IMPRESSO no rótulo, na base declarada ("base": "porcao" ou "100g"). Não invente número que não dá para ler: use null no campo.
- "por_100g" é a conversão para 100 g/ml, que é a única base em que dá para comparar marcas — a porção é escolha do fabricante e serve justamente para o número parecer pequeno. Se a tabela já for por 100 g, repita. Se não der para converter, use null.
- "diet_light": "diet", "light", "zero", "ambos" ou "nenhum", conforme o que a EMBALAGEM declara.

VEREDITO — "boa", "atencao" ou "evitar". Julgue o PRODUTO na categoria dele, não a pessoa.

Use como âncora os limites da Anvisa para a lupa preta "ALTO EM" (por 100 g em sólidos): açúcar adicionado a partir de 15 g, gordura saturada a partir de 6 g, sódio a partir de 600 mg. Em líquidos os limites são bem menores (7,5 g de açúcar, 3 g de saturada, 300 mg de sódio por 100 ml).
- "evitar": bate DOIS ou mais desses limites; OU açúcar (em qualquer nome) aparece entre os TRÊS primeiros ingredientes; OU tem gordura vegetal hidrogenada; OU a lista tem mais de 5 aditivos. Se a embalagem traz lupa preta, o piso é "atencao" e quase sempre "evitar".
- "atencao": bate UM dos limites, ou tem ponto fraco claro sem chegar ao acima.
- "boa": não bate nenhum limite, lista curta e com nomes de comida.
- Alimento in natura ou de ingrediente único (arroz, feijão, aveia, ovo, azeite) tende a "boa" mesmo sendo calórico. Caloria alta sozinha não condena: azeite e pasta de amendoim são calóricos e bons.
- Não amoleça o veredito por gentileza. A pessoa está decidindo uma compra e precisa da verdade; o cuidado está no TOM, não em suavizar o fato.

"ingredientes": explique de 2 a 5 termos da lista que a pessoa comum NÃO entende, na ordem em que importam. Explicação de 1 a 2 frases, concreta, sem enrolação.

PRIORIDADE OBRIGATÓRIA: se a lista trouxer "farinha (de trigo ou de milho) enriquecida com ferro e ácido fólico", esse termo SEMPRE entra, e em primeiro lugar. É a confusão mais comum do supermercado — a pessoa lê "enriquecida" e acha que levou algo melhor — e desfazê-la é a razão de este app existir.

Use exatamente este conhecimento quando o termo aparecer:
${GLOSSARIO}

Quando um dos nomes de açúcar da lista acima aparecer (xarope de glicose, açúcar invertido, maltodextrina, dextrose, melado...), a explicação PRECISA dizer com todas as letras que aquilo é açúcar com outro nome, e que vários nomes diferentes na mesma lista servem para nenhum deles chegar ao topo. Explicar só a função técnica ("dissolve melhor", "dá textura") é enganar quem está lendo.

Se o produto for diet, light ou zero, inclua em "ingredientes" um item com "termo" igual a "diet ou light?" explicando a diferença com base nisto:
${DIET_LIGHT}

"destaques": 0 a 3, e devolva [] sem dó quando não houver nada de verdade a elogiar — um elogio inventado destrói a confiança na leitura inteira. Vale só vantagem NUTRICIONAL comprovável pelo rótulo: fibra relevante, proteína relevante, lista curta, integral de verdade (integral no começo da lista), sem açúcar adicionado, sódio baixo para a categoria.
NUNCA use como destaque:
- sabor, textura, praticidade, "é gostoso", "é prático" — não é mérito nutricional;
- o que a lei OBRIGA todo mundo a ter. "Enriquecida com ferro e ácido fólico" é obrigatório em toda farinha de trigo do Brasil: não é qualidade do produto e listar isso a favor contradiz exatamente o que este app ensina;
- ausência de gordura trans, que também é praticamente obrigatória hoje;
- "contém vitaminas" em produto ultraprocessado que foi fortificado para parecer melhor.

"alertas": 0 a 4, do mais grave ao menos. Cada um: o FATO com o NÚMERO do rótulo e o que ele significa na prática ("34 g de açúcar por 100 g — mais de um terço do pacote é açúcar"). Nunca fale em doença, risco, "faz mal", "problemas de saúde" ou consequência a longo prazo: você está lendo um rótulo, não avaliando a saúde de ninguém.

"porcao_g": o peso ou volume da porção declarada no rótulo, só o número, em g (ou ml). "10 g (1 fatia)" vira 10. null se não der para ler.
"consumo_g": quanto uma pessoa come DE UMA VEZ desse produto, na vida real, no mesmo tipo de unidade. Ninguém come uma fatia de torrada, meio biscoito ou 20 g de salgadinho: se a embalagem for de porte individual (sachê, pacotinho de 15 g, unidade de 90 g), o consumo real é a embalagem inteira; se for pacote grande, estime com honestidade o que se come numa sentada. Deixe null só quando a porção declarada JÁ for o que se come de verdade.
"consumo_desc": em poucas palavras, o QUE é a quantidade de "consumo_g" — "o pacotinho inteiro, 4 fatias", "meio pote", "a lata", "uma tigela". Descreve o CONSUMO, nunca a porção do rótulo: se consumo_g é 15 g e a porção é 10 g (1 fatia), a descrição é "o pacotinho de 15 g", não "1 fatia". "" se consumo_g for null. Se você citar um número de unidades, ele tem de FECHAR com os pesos: 4 fatias de uma porção de 10 g são 40 g, não 60 g.
NÃO faça conta de caloria aqui: dê os números e a descrição; a conta é feita depois, fora de você.

"funcao": em poucas palavras, o PAPEL desse alimento na refeição — o que ele resolve para quem comprou (base crocante que carrega recheio, lanche seco de trigo, bebida do café da manhã, proteína rápida do almoço). É o que permite sugerir caminho mesmo para produto que não se encaixa em categoria nenhuma.

"caminhos": de 2 a 4 alternativas, SEMPRE. É PROIBIDO devolver lista vazia e é PROIBIDO dizer que você não identificou a categoria do produto: se a categoria não existir, trabalhe em cima da "funcao" que você mesmo escreveu. Nesta ordem, e no máximo um item de cada "tipo":
1. "melhor_versao" — o MESMO tipo de produto com ingredientes melhores (mais integral, sem açúcar na lista, menos sódio).
2. "mesmo_papel" — outro alimento que cumpre a MESMA função na refeição, com menos processamento.
3. "in_natura" — comida que não vem com rótulo: fruta, ovo, raiz, tubérculo, castanha, aveia em flocos, tapioca, café. Pão, biscoito e iogurte de pote NÃO são in natura, mesmo integrais — se você não achar nada sem rótulo que sirva para aquele momento, deixe este item de fora e devolva só dois caminhos.
"titulo": o alimento, em 2 a 6 palavras, SEM MARCA e CONCRETO o bastante para a pessoa saber o que pegar: "banana com pasta de amendoim", "ovo cozido", "torrada 100% integral" — nunca uma categoria solta como "fruta", "castanhas" ou "algo natural".
"melhora": UMA frase dizendo o que exatamente melhora — fibra, açúcar, sódio, grau de processamento —, de preferência com número. É PROIBIDO o elogio genérico: "é mais saudável", "é natural", "é nutritiva", "é uma opção melhor", "menos processamento" sozinho não dizem nada.
ERRADO: "banana — opção natural e nutritiva". CERTO: "banana — o açúcar vem com fibra, e não há sódio nem gordura adicionada como no recheio".
ERRADO: "biscoito de aveia — menos processamento". CERTO: "biscoito de aveia — a aveia entra como primeiro ingrediente, o que triplica a fibra em relação a esse aqui".
Nada de prometer resultado.

CRITÉRIOS DE "MELHOR" (use só estes): posição dos ingredientes na lista, principalmente açúcar e gordura; integral de verdade, com farinha integral como 1º ingrediente; sódio e açúcar por 100 g, nunca só pela porção da embalagem; grau de processamento (classificação NOVA); fibra e proteína por 100 g.

"caminhos_intro": UMA frase antes da lista. Se o produto já for uma escolha razoável (veredito "boa", ou "atencao" sem nada grave), diga isso com todas as letras — "esse aqui já é uma escolha ok, não precisa trocar" — e apresente os caminhos como variação, não como correção. Se o produto for fraco, NÃO repita o veredito nem os alertas ("esse produto não é uma boa escolha" a pessoa já leu acima): parta da vontade dela e emende nos caminhos — "se a vontade é de algo doce e crocante, dá para resolver assim".

"falta": liste o que você NÃO conseguiu ler e que faria diferença. Use exatamente os valores "tabela" (não veio a tabela nutricional), "ingredientes" (não veio a lista de ingredientes) ou "nitidez" (a foto está ilegível). Se leu tudo, devolva [].

PROIBIDO
- Diagnosticar, prescrever dieta, mandar cortar refeição, sugerir jejum, suplemento ou medicamento.
- Dizer "comida boa/ruim", "proibido", "veneno", "pecado", "engorda", "compensar". Sem moralizar comida.
- Prometer resultado, peso ou prazo.
- Citar MARCA em qualquer lugar, inclusive nos "caminhos": ali se fala de alimento ("torrada 100% integral", "fruta com pasta de amendoim"), nunca de fabricante. A indicação de marca é escolhida em outra etapa, a partir de uma base real de produtos.
- Dizer que um alimento é "proibido", ou prescrever quantidade individual ("coma 2 fatias por dia").
- Inventar número que não está na foto.

Se a imagem NÃO for um rótulo/embalagem de alimento, devolva exatamente:
{ "eh_rotulo": false, "produto": "o que a imagem parece ser", "marca": "", "categoria_tag": "outro", "porcao": "", "tabela": {}, "por_100g": {}, "diet_light": "nenhum", "veredito": "atencao", "resumo": "", "destaques": [], "alertas": [], "ingredientes": [], "porcao_g": null, "consumo_g": null, "consumo_desc": "", "funcao": "", "caminhos_intro": "", "caminhos": [], "falta": [] }`;

const SYSTEM_ALTERNATIVAS = `Você escolhe alternativas de compra para o app "No mercado com a Nutri Ana".

Recebe: o produto que a pessoa pegou na prateleira e uma LISTA DE CANDIDATOS REAIS, já filtrados como nutricionalmente melhores, todos da mesma categoria e todos existentes no mercado brasileiro.

Escolha EXATAMENTE 3, de TRÊS MARCAS DIFERENTES, e escreva por que cada uma é melhor.

Devolva APENAS um JSON válido:
{ "escolhas": [{ "code": "7891000000000", "porque": "tem metade do açúcar e a lista de ingredientes é bem mais curta" }] }

REGRAS
- Use SOMENTE os "code" que vieram na lista. Nunca invente produto, marca ou código.
- As três precisam ser de marcas diferentes entre si. Indicar três produtos da mesma marca seria favorecer marca.
- "porque": UMA frase curta, concreta e comparando com o produto que a pessoa pegou ("tem menos da metade do sódio", "não tem açúcar na lista"). Use os números que vieram, sem inventar.
- PREFIRA O QUE EXISTE NO MERCADO COMUM. Quem está no corredor precisa achar aquilo na prateleira do lado. Evite item de nicho, importado, de loja de suplemento ou de marca que só se compra pela internet (linha "proteica", "fit", whey, marca desconhecida). Entre um produto de nicho um pouco melhor e um produto comum quase tão bom, escolha o comum.
- Prefira também o produto que é a MESMA COISA que a pessoa quer comer. Quem pegou biscoito recheado quer biscoito, não barra de proteína: a alternativa tem de resolver a mesma vontade, senão não é alternativa, é sermão.
- Se a lista tiver menos de 3 marcas diferentes, devolva {"escolhas": []}.
- Não prometa resultado nem diga que o produto "emagrece" ou "é saudável" de forma absoluta. Compare, apenas.`;

/** A explicação de diet/light é ESCRITA AQUI, não pelo modelo.
 *
 *  Duas razões. A primeira é confiabilidade: num teste com um chocolate
 *  diet o modelo simplesmente ignorou a instrução de incluí-la, e essa
 *  explicação é o motivo de metade das pessoas abrirem este app — não
 *  pode depender de sorte. A segunda é jurídica: diet e light têm
 *  definição em lei (Portaria SVS/MS 29/1998 e RDC 54/2012), e um
 *  parágrafo alucinado aqui seria a Ana, com o CRN dela na tela,
 *  ensinando errado. Texto fixo, sempre igual, sempre certo. */
function explicacaoDietLight(tipo: string): { termo: string; explicacao: string } | null {
  const diet =
    "Diet quer dizer ISENTO de um nutriente — quase sempre o açúcar, mas pode ser gordura, " +
    "sódio ou proteína. É um produto feito para quem precisa EXCLUIR aquele nutriente, como a " +
    "pessoa com diabetes. Atenção: diet não quer dizer menos caloria. Ao tirar o açúcar, o " +
    "fabricante costuma repor gordura — chocolate diet muitas vezes é MAIS calórico que o comum.";
  const light =
    "Light quer dizer redução de NO MÍNIMO 25% de um nutriente ou das calorias, em relação ao " +
    "produto convencional. Light não é isento: só tem menos. E esse 'menos' pode ser de sódio ou " +
    "de gordura, não necessariamente de caloria — vale conferir na tabela do que foi reduzido.";
  const zero =
    "Zero quer dizer isento daquele nutriente (quase sempre o açúcar), e no lugar dele entra " +
    "adoçante. Zero açúcar não é zero caloria: o produto pode continuar cheio de gordura. " +
    "Diferente do light, que só precisa ter 25% a menos, o zero é isento de verdade.";

  switch (tipo) {
    case "diet": return { termo: "Esse produto é diet — o que isso quer dizer?", explicacao: diet };
    case "light": return { termo: "Esse produto é light — o que isso quer dizer?", explicacao: light };
    case "zero": return { termo: "Esse produto é zero — o que isso quer dizer?", explicacao: zero };
    case "ambos": return { termo: "Diet e light não são a mesma coisa", explicacao: diet + " Já o " + light.charAt(0).toLowerCase() + light.slice(1) };
    default: return null;
  }
}

/** "29 calorias por fatia" é verdade e é armadilha: ninguém come uma fatia.
 *
 *  A porção do rótulo é escolha do fabricante e existe para o número parecer
 *  pequeno. O modelo só diz DUAS coisas aqui — quanto pesa a porção declarada
 *  e quanto se come de uma vez na vida real —; a multiplicação é feita aqui,
 *  porque conta errada com o CRN da Ana na tela é pior do que conta nenhuma.
 *
 *  Silêncio quando falta número ou quando a diferença é pequena (menos de
 *  1,3×): aí não há armadilha, e a frase viraria alarme sem motivo. */
function contaDoConsumoReal(
  porcaoG: number | null,
  consumoG: number | null,
  desc: string,
  p100: Record<string, unknown>,
): string {
  if (!porcaoG || !consumoG || consumoG < porcaoG * 1.3) return "";
  const kcal100 = n(p100.kcal);
  if (kcal100 == null) return "";

  const f = consumoG / 100;
  const num = (v: number) => String(Math.round(v)).replace(".", ",");
  const dec = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

  const partes = [num(kcal100 * f) + " kcal"];
  const ac = n(p100.acucar_g);
  const so = n(p100.sodio_mg);
  if (ac != null && ac > 0) partes.push(dec(ac * f) + " g de açúcar");
  if (so != null && so > 0) partes.push(num(so * f) + " mg de sódio");

  // A descrição vem do modelo e o peso também, e às vezes os dois brigam
  // ("4 fatias" com 60 g quando a fatia tem 10 g). Quem manda é o peso, que é
  // o número que entra na conta: se a contagem de unidades não bate com ele,
  // a descrição cai e sobra só o peso. Contradição na tela derruba a leitura
  // inteira, e a conta é o que a pessoa veio buscar.
  const unidades = desc.match(/(\d+)\s*(fatia|unidade|biscoito|torrada|colher|copo|pacote)/i);
  const bate = !unidades || Math.abs(Number(unidades[1]) * porcaoG - consumoG) <= consumoG * 0.2;
  const oQue = desc && bate ? desc + " (" + dec(consumoG) + " g)" : dec(consumoG) + " g";
  return "O rótulo faz a conta em cima de " + dec(porcaoG) + " g. Na quantidade que se come de " +
    "verdade — " + oQue + " — são " + partes.join(", ") + ".";
}

function n(v: unknown): number | null {
  const x = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
  return typeof x === "number" && isFinite(x) && x >= 0 ? Math.round(x * 10) / 10 : null;
}

function txt(v: unknown, max: number): string {
  return String(v == null ? "" : v).trim().slice(0, max);
}

function listaDeTextos(v: unknown, max: number): string[] {
  return (Array.isArray(v) ? v : [])
    .map((s) => txt(s, 300))
    .filter(Boolean)
    .slice(0, max);
}

/** Nota de "peso contra" por 100 g. Menor é melhor.
 *
 *  Serve só para ORDENAR candidatos dentro da MESMA categoria antes de
 *  mostrá-los ao modelo — não é nota de saúde e não aparece para a
 *  pessoa. Comparar azeite com refrigerante por esta conta não faria
 *  sentido, e é por isso que a busca é sempre presa à categoria.
 *
 *  Os divisores são ordens de grandeza de "porção de referência" que
 *  colocam açúcar, gordura saturada e sódio numa escala parecida, para
 *  que nenhum dos três domine o ranking sozinho. */
function penalidade(p: Record<string, number | null>): number {
  const v = (k: string) => (typeof p[k] === "number" ? (p[k] as number) : 0);
  return (
    v("acucar") / 5 +
    v("sat") / 2 +
    (v("sodio") * 1000) / 200 +
    (p.nova === 4 ? 3 : 0) +
    v("aditivos") * 0.4 -
    v("fibra") / 3 -
    v("ptn") / 8
  );
}

/** A Open Food Facts é COLABORATIVA: quem cadastra é usuário comum digitando
 *  o rótulo em casa. Isso deixa dois rastros que envenenam o ranking acima.
 *
 *  1. VALOR IMPOSSÍVEL (erro de digitação). Auditoria de 01/08/2026 na base:
 *     31 produtos com mais de 10 g de sódio por 100 g, 13 acima de 900 kcal,
 *     4 com mais de 100 g de açúcar em 100 g de produto.
 *
 *  2. DADO FALTANDO VIRANDO NOTA BOA — o pior dos dois, porque é silencioso.
 *     penalidade() lê ausência como zero: sem gordura saturada declarada o
 *     produto pontua como se tivesse zero, e sem grupo NOVA pontua como se
 *     não fosse ultraprocessado (3 pontos, o mesmo peso de 15 g de açúcar).
 *     Medido: 56 dos 127 primeiros colocados chegaram lá por falta de dado,
 *     e não por serem melhores.
 *
 *  Por isso só entra na disputa quem tem a tabela COMPLETA e PLAUSÍVEL. Custo
 *  medido dessa exigência: uma única categoria (sopas) perde a sugestão por
 *  ficar com menos de 3 marcas. É barato perto de indicar, com o CRN da Ana
 *  na tela, um produto que só parecia melhor porque ninguém preencheu. */
function dadoConfiavel(c: Record<string, unknown>): boolean {
  const num = (k: string) => (typeof c[k] === "number" ? (c[k] as number) : null);
  const acucar = num("acucar"), sat = num("sat"), sodio = num("sodio");
  const kcal = num("kcal"), lip = num("lip"), ptn = num("ptn");

  // completo: sem esses quatro não há comparação honesta
  if (acucar === null || sat === null || sodio === null || num("nova") === null) return false;

  // plausível: nada disso cabe em 100 g de comida
  if (acucar > 100 || sat > 100 || (kcal !== null && kcal > 900) || sodio > 10) return false;
  if (acucar + (lip ?? 0) + (ptn ?? 0) > 105) return false;

  return true;
}

/** Nomes que a Open Food Facts guarda mas que não servem para indicar
 *  compra: fardo, caixa com 12, "leve mais pague menos". A pessoa está
 *  procurando UM produto na prateleira. */
function nomeUsavel(nome: string): boolean {
  if (nome.length < 4 || nome.length > 90) return false;
  return !/(pack|fardo|caixa com|display|leve mais|pague menos|c\/ ?\d{2,}|\d{2,} ?unidades|atacado)/i.test(nome);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
  const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  if (!OPENAI_KEY) return json({ error: "IA não configurada (falta OPENAI_API_KEY)." }, 500);

  // ---------- 1) Corpo ----------
  let body: {
    fotos?: Array<string | { url?: string; tipo?: string }>;
    dispositivo?: string;
    codigo?: string;   // pacote de leituras comprado (opcional)
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const dispositivo = txt(body.dispositivo, 64);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(dispositivo)) return json({ error: "dispositivo_invalido" }, 400);

  // Aceita string solta ou { url, tipo }. O tipo diz QUAL parte do pacote
  // é aquela foto, e isso decide a resolução enviada ao modelo (abaixo).
  const TIPOS = ["frente", "tabela", "ingredientes"];
  const fotos = (Array.isArray(body.fotos) ? body.fotos : [])
    .map((f) => (typeof f === "string" ? { url: f, tipo: "" } : { url: String(f?.url || ""), tipo: String(f?.tipo || "") }))
    .filter((f) => /^data:image\/(jpeg|png|webp);base64,/.test(f.url))
    .map((f) => ({ url: f.url, tipo: TIPOS.includes(f.tipo) ? f.tipo : "" }))
    .slice(0, 3);
  if (!fotos.length) return json({ error: "sem_foto", detail: "Mande ao menos uma foto do rótulo." }, 400);
  const pesoTotal = fotos.reduce((s, f) => s + f.url.length, 0);
  if (pesoTotal > 9 * 1024 * 1024) return json({ error: "foto_muito_grande" }, 413);

  const admin = createClient(SUPABASE_URL, SERVICE);

  // ---------- 2) Identidade (OPCIONAL) ----------
  // Sem Authorization o app funciona igual, só com limite menor. Essa é a
  // proposta do produto: a pessoa no mercado usa na hora, sem cadastro.
  let uid: string | null = null;
  let liberado = false;
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader && !/Bearer\s+$/.test(authHeader)) {
    try {
      const asCaller = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u } = await asCaller.auth.getUser();
      if (u?.user) {
        uid = u.user.id;
        const { data: ok } = await admin.rpc("mercado_acesso_liberado", { p_uid: uid });
        liberado = ok === true;
      }
    } catch {
      // Token vencido não bloqueia: cai para visitante em vez de dar erro
      // na cara de quem só quer ler um rótulo.
    }
  }

  // ---------- 2b) Pacote de leituras comprado ----------
  // Quem comprou não é "visitante com limite": ela pagou por leitura.
  // O código vem do localStorage do app (ou digitado por ela em outro
  // aparelho) e é conferido aqui — o cliente só diz qual é, nunca quanto
  // vale. O crédito só é DEBITADO lá embaixo, depois da leitura dar certo.
  const codigo = txt(body.codigo, 16).toUpperCase();
  let pagante = false;
  let saldoAntes = 0;
  let assinante = false;   // assinatura vigente: lê sem gastar crédito

  // O MESMO campo de código serve para os dois produtos — a pessoa não
  // deveria precisar saber se comprou "pacote" ou "assinatura". A
  // assinatura é olhada primeiro porque quem assina não tem saldo para
  // gastar: ela lê à vontade enquanto o acesso estiver em dia.
  if (/^[A-Z0-9-]{6,16}$/.test(codigo)) {
    const { data: vale } = await admin.rpc("mercado_assinatura_valida", { p_codigo: codigo });
    if (vale === true) {
      assinante = true;
      pagante = true;
    }
  }

  if (!assinante && /^[A-Z0-9-]{6,16}$/.test(codigo)) {
    // Assinatura que venceu não pode cair no "código inexistente": ela
    // pagou de verdade, e o recado certo é renovar, não conferir letra.
    const { data: acesso } = await admin.rpc("mercado_acesso", { p_codigo: codigo });
    if (acesso && acesso.ok === true && acesso.tipo === "assinatura") {
      return json({
        error: "assinatura_vencida",
        detail: "Sua assinatura venceu. Renovando, o acervo e a leitura sem limite " +
                "voltam na hora — e você continua com o mesmo código. 🌸",
        codigo_valido: true,
      }, 402);
    }

    const { data: s } = await admin.rpc("mercado_saldo", { p_codigo: codigo });
    if (s && s.ok === true && Number(s.restam) > 0) {
      pagante = true;
      saldoAntes = Number(s.restam);
    } else if (s && s.ok === true) {
      return json({
        error: "creditos_esgotados",
        detail: "Suas leituras compradas acabaram. Você pode comprar outro pacote " +
                "ou continuar usando o app de graça amanhã. 🌸",
        codigo_valido: true,
      }, 402);
    } else {
      return json({
        error: "codigo_invalido",
        detail: "Não encontrei esse código. Confira as letras — ou use o app " +
                "no limite gratuito enquanto isso. 🌸",
      }, 404);
    }
  }

  // ---------- 2c) Quantos aparelhos usam este código ----------
  // Só vale para quem paga: o visitante já é contado por dispositivo, e um
  // código só existe depois de uma compra. O registro acontece ANTES da
  // leitura porque o que se está protegendo é justamente o custo dela.
  if (pagante) {
    const { data: ap, error: apErro } = await admin.rpc("mercado_dispositivo_ok", {
      p_codigo: codigo,
      p_dispositivo: dispositivo,
      p_limite: LIMITE_APARELHOS,
      p_janela_dias: JANELA_APARELHOS_DIAS,
    });
    // Falha de infra não pode barrar quem pagou: se a checagem não respondeu,
    // a leitura segue. O risco de deixar passar é um centavo; o de bloquear
    // é uma cliente pagante travada no corredor do mercado.
    if (!apErro && ap && ap.ok === false && ap.motivo === "limite") {
      return json({
        error: "limite_dispositivos",
        limite: LIMITE_APARELHOS,
        detail: `Esse código já está em uso em ${LIMITE_APARELHOS} aparelhos. ` +
          "Ele é pessoal — se você trocou de celular, é só usar o app neste " +
          "mesmo aparelho por uns dias que a vaga do antigo se libera. " +
          "Qualquer coisa, fale com a Ana. 🌸",
      }, 429);
    }
  }

  // ---------- 3) Freios de custo ----------
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { count: usoGlobal } = await admin
    .from("mercado_analises")
    .select("id", { count: "exact", head: true })
    .gte("criado_em", desde);
  // O teto global existe para proteger a fatura da Ana num app GRÁTIS.
  // Quem pagou não pode esbarrar nele: ela não tem culpa de o app ter
  // feito sucesso hoje, e "volte amanhã" para quem comprou é calote.
  if (!pagante && (usoGlobal || 0) >= LIMITE_GLOBAL) {
    return json({
      error: "limite_global",
      detail: "O app bateu o limite de análises de hoje. Tente de novo amanhã. 🌸",
    }, 429);
  }

  // Mas o pagante também não é ilimitado no DIA: um código que vazou num
  // grupo grande poderia queimar o pacote inteiro (e a fatura junto) em
  // minutos. 25 leituras por dia é muito mais do que uma compra real pede.
  // Quanto a assinante já leu no mês corrido. Calculado antes do teto porque
  // o mesmo número vira o saldo que ela vê na tela depois da leitura.
  let usoAssinaturaMes = 0;
  if (assinante) {
    const desdeMes = new Date(Date.now() - JANELA_MES_MS).toISOString();
    const { count } = await admin
      .from("mercado_analises")
      .select("id", { count: "exact", head: true })
      .eq("codigo_credito", codigo)
      .gte("criado_em", desdeMes);
    usoAssinaturaMes = count || 0;
    if (usoAssinaturaMes >= LIMITE_ASSINANTE_MES) {
      return json({
        error: "limite_assinante_mes",
        assinante: true,
        limite: LIMITE_ASSINANTE_MES,
        detail: `Você usou as ${LIMITE_ASSINANTE_MES} leituras do seu mês. ` +
          "Elas voltam aos poucos, conforme as mais antigas completam 30 dias — " +
          "e as 100 receitas continuam abertas. 🌸",
      }, 429);
    }
  }

  if (pagante && !assinante) {
    const { count: usoDoCodigo } = await admin
      .from("mercado_analises")
      .select("id", { count: "exact", head: true })
      .eq("codigo_credito", codigo)
      .gte("criado_em", desde);
    // O pacote pré-pago mantém o teto do DIA: ele não tem janela mensal para
    // segurar um código que vazou num grupo grande, e 25 leituras num dia já
    // é muito acima de qualquer compra de mercado.
    if ((usoDoCodigo || 0) >= LIMITE_CODIGO_DIA) {
      return json({
        error: "limite_codigo_dia",
        detail: `Esse código já leu ${LIMITE_CODIGO_DIA} rótulos hoje. Seus créditos ` +
          "continuam guardados — amanhã ele volta a funcionar. 🌸",
      }, 429);
    }
  }

  // Conta pelo dispositivo, e também pela conta quando há uma: sem a
  // segunda checagem, bastaria limpar o localStorage para zerar o limite.
  const filtro = admin
    .from("mercado_analises")
    .select("id", { count: "exact", head: true })
    .gte("criado_em", desde);
  const { count: usoMeu } = uid
    ? await filtro.or(`user_id.eq.${uid},dispositivo.eq.${dispositivo}`)
    : await filtro.eq("dispositivo", dispositivo);

  const meuLimite = liberado ? LIMITE_LIBERADO : LIMITE_VISITANTE;
  if (!pagante && (usoMeu || 0) >= meuLimite) {
    return json({
      error: "limite_diario",
      liberado,
      limite: meuLimite,
      detail: liberado
        ? `Você já leu ${meuLimite} rótulos hoje. Amanhã o app abre de novo. 🌸`
        : `Você leu ${meuLimite} rótulos hoje — é o limite de quem usa sem conta. Pacientes da Ana leem ${LIMITE_LIBERADO} por dia.`,
    }, 429);
  }

  // ---------- 4) Leitura do rótulo ----------
  async function openai(mensagens: unknown[], maxTokens: number) {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0.2,       // leitura de rótulo quer estabilidade, não criatividade
        response_format: { type: "json_object" },
        messages: mensagens,
      }),
    });
    if (!resp.ok) throw new Error("openai_" + resp.status + ":" + (await resp.text()).slice(0, 300));
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!raw) throw new Error("openai_vazio");
    return JSON.parse(raw);
  }

  let out: Record<string, unknown>;
  try {
    out = await openai([
      { role: "system", content: SYSTEM_LEITURA },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `São ${fotos.length} foto(s) do MESMO produto` +
              (fotos.some((f) => f.tipo)
                ? `, nesta ordem: ${fotos.map((f) => f.tipo || "parte do pacote").join(", ")}. `
                : ". ") +
              `Leia o rótulo e devolva o JSON pedido.`,
          },
          // A resolução muda conforme o que a foto precisa entregar, e isso
          // é dinheiro: imagem em "high" custa várias vezes mais que em
          // "low", e a leitura é o gasto do app.
          //   tabela e ingredientes -> "high": letra miúda em fundo colorido.
          //     Em resolução baixa o modelo lê "0,5 g" como "0,6 g", e num
          //     app de rótulo errar o número é errar tudo.
          //   frente do pacote -> "low": dali só saem nome, marca e os selos
          //     grandes (diet, light, lupa preta). Não precisa de lupa.
          ...fotos.map((f) => ({
            type: "image_url",
            image_url: { url: f.url, detail: f.tipo === "frente" ? "low" : "high" },
          })),
        ],
      },
    ], 1600);
  } catch (e) {
    const m = String(e);
    return json({ error: "erro_ia", detail: m.slice(0, 300) }, 502);
  }

  if (out.eh_rotulo === false) {
    return json({
      ok: false,
      nao_e_rotulo: true,
      descricao: txt(out.produto, 120),
      error: "Não reconheci um rótulo de alimento nessa foto. Fotografe a embalagem, com a tabela nutricional e a lista de ingredientes à vista.",
    });
  }

  const catTag = txt(out.categoria_tag, 40);
  const categoria = CATEGORIAS[catTag] || "";
  const veredito = ["boa", "atencao", "evitar"].includes(txt(out.veredito, 10))
    ? txt(out.veredito, 10)
    : "atencao";

  const p100 = (out.por_100g || {}) as Record<string, unknown>;
  const dietLight = txt(out.diet_light, 20) || "nenhum";

  // ---------- 4b) A comida de verdade, pela TACO ----------
  // Fonte oficial brasileira (NEPA/Unicamp) contra o produto de pacote, na
  // única base que permite comparar: 100 g. Sai da tabela, não do modelo —
  // pelo mesmo motivo de diet/light ser texto fixo.
  let referencia: Record<string, unknown> | null = null;
  const idRef = REFERENCIA_TACO[catTag];
  if (idRef) {
    const { data: ref } = await admin
      .from("taco_alimentos")
      .select("nome,kcal,ptn,cho,lip,fibra,sodio_mg,sat_g")
      .eq("id", idRef)
      .maybeSingle();
    if (ref) {
      referencia = {
        nome: ref.nome,
        por_100g: {
          kcal: ref.kcal, ptn_g: ref.ptn, cho_g: ref.cho, lip_g: ref.lip,
          fibra_g: ref.fibra, sat_g: ref.sat_g, sodio_mg: ref.sodio_mg,
        },
        fonte: "TACO 4ª ed. — NEPA/Unicamp",
      };
    }
  }

  // ---------- 5a) Caminhos (SEMPRE, em qualquer veredito) ----------
  // Duas perguntas diferentes, e o app confundia as duas. "Que MARCA eu levo"
  // depende da base da Open Food Facts e da categoria; "o que eu levo no lugar
  // disso" não depende de nada além do rótulo que ela acabou de fotografar.
  // Antes, produto fora da taxonomia (uma torrada, por exemplo) caía no vazio e
  // o app respondia que não sabia a categoria — desistindo dela por um detalhe
  // interno que ninguém do lado de fora tem por que conhecer.
  //
  // Vêm da MESMA chamada da leitura: nenhum token a mais, nenhuma espera a
  // mais. E são alimento, nunca marca — marca só sai da base real, abaixo.
  const TIPOS_CAMINHO = ["melhor_versao", "mesmo_papel", "in_natura"];
  const vistos = new Set<string>();
  const caminhos = (Array.isArray(out.caminhos) ? out.caminhos : [])
    .map((c: Record<string, unknown>) => ({
      tipo: TIPOS_CAMINHO.includes(txt(c?.tipo, 20)) ? txt(c?.tipo, 20) : "mesmo_papel",
      titulo: txt(c?.titulo, 90),
      melhora: txt(c?.melhora, 260),
    }))
    .filter((c) => {
      if (!c.titulo || !c.melhora) return false;
      if (vistos.has(c.tipo)) return false;   // um item por tipo: são três olhares, não três repetições
      vistos.add(c.tipo);
      return true;
    })
    .sort((a, b) => TIPOS_CAMINHO.indexOf(a.tipo) - TIPOS_CAMINHO.indexOf(b.tipo))
    .slice(0, 4);

  // ---------- 5b) Marcas reais (só quando o produto não é boa escolha) ----------
  // Produto bom não ganha lista de concorrentes: a pessoa veio decidir uma
  // compra, e empurrar marca para quem já escolheu bem seria propaganda.
  let alternativas: Array<Record<string, unknown>> = [];
  let motivoSemAlternativa = "";

  if (veredito !== "boa" && categoria) {
    const { data: cands } = await admin
      .from("mercado_produtos")
      .select("code,nome,marca,quantidade,nova,aditivos,kcal,ptn,cho,acucar,fibra,lip,sat,sodio,ingredientes")
      .eq("categoria_tag", catTag)
      .limit(400);

    const meu = {
      acucar: n(p100.acucar_g),
      sat: n(p100.sat_g),
      sodio: n(p100.sodio_mg) != null ? (n(p100.sodio_mg) as number) / 1000 : null,
      fibra: n(p100.fibra_g),
      ptn: null,
      nova: 4,
      aditivos: 0,
    };
    const minhaPenalidade = penalidade(meu as Record<string, number | null>);

    const ranqueados = (cands || [])
      .filter((c) => nomeUsavel(String(c.nome || "")) && String(c.marca || "").trim())
      .filter((c) => dadoConfiavel(c as unknown as Record<string, unknown>))
      .map((c) => ({ ...c, pen: penalidade(c as unknown as Record<string, number | null>) }))
      // Só entra quem é MELHOR que o produto da mão dela. Quando não deu
      // para converter a tabela para 100 g, minhaPenalidade fica frouxa e
      // o corte não filtra nada — por isso o ranking abaixo ainda ordena.
      .filter((c) => c.pen < minhaPenalidade)
      .sort((a, b) => a.pen - b.pen);

    // Uma marca por linha: a lista precisa mostrar OPÇÃO, e três produtos
    // da mesma marca não é opção, é vitrine.
    const porMarca = new Map<string, typeof ranqueados[number]>();
    for (const c of ranqueados) {
      const chave = String(c.marca).toLowerCase().split(",")[0].trim();
      if (chave && !porMarca.has(chave)) porMarca.set(chave, c);
    }
    const finalistas = Array.from(porMarca.values()).slice(0, 10);

    if (finalistas.length < 3) {
      // A REGRA DAS 3 MARCAS: menos de três marcas diferentes e melhores,
      // não sugere nenhuma.
      motivoSemAlternativa =
        "Ainda não tenho três marcas diferentes dessa categoria na base para comparar com honestidade, " +
        "então prefiro não indicar nenhuma a indicar poucas. Os caminhos acima valem do mesmo jeito.";
    } else {
      try {
        const escolha = await openai([
          { role: "system", content: SYSTEM_ALTERNATIVAS },
          {
            role: "user",
            content: JSON.stringify({
              produto_da_pessoa: {
                nome: txt(out.produto, 120),
                marca: txt(out.marca, 80),
                categoria,
                por_100g: p100,
                alertas: listaDeTextos(out.alertas, 4),
              },
              candidatos: finalistas.map((c) => ({
                code: c.code,
                nome: c.nome,
                marca: c.marca,
                quantidade: c.quantidade,
                por_100g: {
                  kcal: c.kcal, proteina_g: c.ptn, acucar_g: c.acucar,
                  fibra_g: c.fibra, gordura_sat_g: c.sat,
                  sodio_mg: c.sodio != null ? Math.round(Number(c.sodio) * 1000) : null,
                },
                grupo_nova: c.nova,
                qtd_aditivos: c.aditivos,
              })),
            }),
          },
        ], 700);

        const escolhas = Array.isArray(escolha.escolhas) ? escolha.escolhas : [];
        const marcasUsadas = new Set<string>();
        for (const e of escolhas) {
          const achado = finalistas.find((c) => String(c.code) === String(e?.code));
          if (!achado) continue;                       // código inventado: descarta
          const marca = String(achado.marca).toLowerCase().split(",")[0].trim();
          if (marcasUsadas.has(marca)) continue;       // marca repetida: descarta
          marcasUsadas.add(marca);
          alternativas.push({
            code: achado.code,
            nome: achado.nome,
            marca: String(achado.marca).split(",")[0].trim(),
            quantidade: achado.quantidade || "",
            porque: txt(e?.porque, 200),
          });
        }

        // A regra vale também depois da escolha do modelo: se ele
        // devolveu duas, o app não mostra duas.
        if (alternativas.length < 3) {
          alternativas = [];
          motivoSemAlternativa =
            "Não consegui fechar três marcas diferentes para comparar agora — prefiro não indicar pela metade. " +
            "Os caminhos acima valem do mesmo jeito.";
        }
      } catch {
        alternativas = [];
        motivoSemAlternativa =
          "Não consegui buscar marcas para comparar agora. Os caminhos acima valem do mesmo jeito.";
      }
    }
  }

  // ---------- 6) Grava e devolve ----------
  const linha = {
    user_id: uid,
    dispositivo,
    codigo_credito: pagante ? codigo : null,
    produto: txt(out.produto, 180),
    marca: txt(out.marca, 120),
    categoria: categoria || null,
    categoria_tag: catTag || null,
    veredito,
    resumo: txt(out.resumo, 600),
    tabela: {
      porcao: txt(out.porcao, 80),
      declarada: out.tabela || {},
      por_100g: p100,
      diet_light: dietLight,
      // Vão dentro do jsonb, e não em colunas novas, para o histórico já
      // gravado continuar abrindo sem migração de schema.
      referencia,
      // Os dois números que o modelo deu ficam gravados junto com a frase:
      // quando a conta não aparece, é aqui que se vê se faltou leitura da
      // porção ou se ele achou que a porção já era realista.
      consumo: {
        porcao_g: n(out.porcao_g),
        consumo_g: n(out.consumo_g),
        desc: txt(out.consumo_desc, 80),
      },
      porcao_real: contaDoConsumoReal(
        n(out.porcao_g), n(out.consumo_g), txt(out.consumo_desc, 80), p100,
      ),
      funcao: txt(out.funcao, 120),
      caminhos_intro: txt(out.caminhos_intro, 240),
      caminhos,
    },
    destaques: listaDeTextos(out.destaques, 3),
    alertas: listaDeTextos(out.alertas, 4),
    ingredientes: (() => {
      const fixo = explicacaoDietLight(dietLight);
      const doModelo = (Array.isArray(out.ingredientes) ? out.ingredientes : [])
        .map((i: Record<string, unknown>) => ({
          termo: txt(i?.termo, 160),
          explicacao: txt(i?.explicacao, 700),
        }))
        .filter((i) => {
          if (!i.termo || !i.explicacao) return false;
          // Quando a explicação oficial de diet/light já vai entrar, qualquer
          // tentativa do modelo de explicar o mesmo assunto sai — senão a
          // pessoa lê duas versões do mesmo conceito, e a errada é a dele.
          if (fixo && /\b(diet|light|zero)\b/i.test(i.termo)) return false;
          return true;
        })
        .slice(0, 5);
      return fixo ? [fixo, ...doModelo] : doModelo;
    })(),
    alternativas,
    modelo: MODEL,
  };

  const { data: gravado, error: insErr } = await admin
    .from("mercado_analises")
    .insert(linha)
    .select("*")
    .single();
  if (insErr) return json({ error: "falha_ao_gravar", detail: insErr.message }, 500);

  // O crédito só é debitado AGORA, com a leitura pronta e gravada. Se a
  // OpenAI falhasse, ou a foto não fosse um rótulo, a pessoa teria pago
  // por nada — e cobrar por erro nosso é o tipo de coisa que faz alguém
  // desinstalar o app e contar para as amigas. O risco do outro lado
  // (duas leituras simultâneas com um crédito só) é de UMA leitura.
  let restamCreditos = 0;
  if (pagante && !assinante) {
    // Assinatura não gasta nada: o que ela comprou foi tempo, não leitura.
    const { data: deb } = await admin.rpc("mercado_consumir_credito", { p_codigo: codigo });
    restamCreditos = deb && deb.ok === true ? Number(deb.restam) : Math.max(0, saldoAntes - 1);
  }

  return json({
    ok: true,
    analise: gravado,
    sem_alternativa: motivoSemAlternativa,
    falta: listaDeTextos(out.falta, 3),
    // A assinante também vê saldo agora: um teto que existe e ninguém enxerga
    // vira "o app parou de funcionar" no dia em que ela esbarra nele. O -1
    // conta esta leitura, que acabou de ser gravada.
    restam: assinante
      ? Math.max(0, LIMITE_ASSINANTE_MES - usoAssinaturaMes - 1)
      : (pagante ? restamCreditos : Math.max(0, meuLimite - (usoMeu || 0) - 1)),
    limite_mes: assinante ? LIMITE_ASSINANTE_MES : null,
    pagante,
    assinante,
    liberado,
  });
});

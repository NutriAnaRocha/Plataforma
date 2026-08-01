// ============================================================
//  Edge Function: analisar-rotulo
//  App "NO MERCADO COM A NUTRI ANA" — a pessoa fotografa o rótulo
//  (frente, tabela nutricional, lista de ingredientes) e recebe:
//    1. a leitura do produto em linguagem de gente
//    2. a explicação dos ingredientes que ninguém entende
//    3. quando o produto não é boa escolha, PELO MENOS 3 MARCAS reais
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

"falta": liste o que você NÃO conseguiu ler e que faria diferença. Use exatamente os valores "tabela" (não veio a tabela nutricional), "ingredientes" (não veio a lista de ingredientes) ou "nitidez" (a foto está ilegível). Se leu tudo, devolva [].

PROIBIDO
- Diagnosticar, prescrever dieta, mandar cortar refeição, sugerir jejum, suplemento ou medicamento.
- Dizer "comida boa/ruim", "proibido", "veneno", "pecado", "engorda", "compensar". Sem moralizar comida.
- Prometer resultado, peso ou prazo.
- Falar de marca concorrente aqui. As alternativas são escolhidas em outra etapa, a partir de uma base real.
- Inventar número que não está na foto.

Se a imagem NÃO for um rótulo/embalagem de alimento, devolva exatamente:
{ "eh_rotulo": false, "produto": "o que a imagem parece ser", "marca": "", "categoria_tag": "outro", "porcao": "", "tabela": {}, "por_100g": {}, "diet_light": "nenhum", "veredito": "atencao", "resumo": "", "destaques": [], "alertas": [], "ingredientes": [], "falta": [] }`;

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
  let body: { fotos?: Array<string | { url?: string; tipo?: string }>; dispositivo?: string };
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

  // ---------- 3) Freios de custo ----------
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { count: usoGlobal } = await admin
    .from("mercado_analises")
    .select("id", { count: "exact", head: true })
    .gte("criado_em", desde);
  if ((usoGlobal || 0) >= LIMITE_GLOBAL) {
    return json({
      error: "limite_global",
      detail: "O app bateu o limite de análises de hoje. Tente de novo amanhã. 🌸",
    }, 429);
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
  if ((usoMeu || 0) >= meuLimite) {
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

  // ---------- 5) Alternativas (só quando o produto não é boa escolha) ----------
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
        "Ainda não tenho três marcas diferentes dessa categoria na base para comparar com honestidade — " +
        "então prefiro não indicar nenhuma a indicar poucas.";
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
            "Não consegui fechar três marcas diferentes para comparar agora. Prefiro não indicar pela metade.";
        }
      } catch {
        alternativas = [];
        motivoSemAlternativa = "Não consegui buscar as alternativas agora. Tente de novo daqui a pouco.";
      }
    }
  }

  // ---------- 6) Grava e devolve ----------
  const linha = {
    user_id: uid,
    dispositivo,
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

  return json({
    ok: true,
    analise: gravado,
    sem_alternativa: motivoSemAlternativa,
    falta: listaDeTextos(out.falta, 3),
    restam: Math.max(0, meuLimite - (usoMeu || 0) - 1),
    liberado,
  });
});

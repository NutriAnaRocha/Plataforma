// ============================================================
//  mercado-receitas — o acervo do app "No mercado com a Nutri Ana"
//
//  { acao: "lista", categoria?, tempo?, busca?, dispositivo?, codigo? }
//      -> os CARTÕES: título, chamada, tempo, rendimento, kcal e
//         proteína por porção. Isto é aberto de propósito: é a vitrine,
//         é o que faz alguém querer assinar, e é o que o Google pode ver.
//
//  { acao: "receita", slug, dispositivo, codigo? }
//      -> a receita INTEIRA: lista de compras e modo de preparo. Aqui
//         mora a trava.
//
//  POR QUE A TRAVA É AQUI E NÃO NA TELA
//    Se o app baixasse tudo e escondesse com JavaScript, o acervo
//    inteiro estaria a um F12 de distância — e o acervo é o produto.
//    A tela nunca recebe o preparo de uma receita que a pessoa não
//    liberou. Ela nem sabe o tamanho do texto que está faltando.
//
//  AS TRÊS DE GRAÇA
//    Contadas no servidor, por dispositivo, em mercado_receitas_vistas.
//    Reabrir uma que ela já viu não gasta outra — só receita nova conta.
//    Quem limpa o navegador ganha mais três: é aceitável, porque servir
//    texto já pronto do banco não custa nada (diferente da leitura de
//    rótulo, que chama a OpenAI) e quem faz isso não ia assinar mesmo.
//
//  verify_jwt = false: o app funciona sem conta, como o resto dele.
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

const GRATIS = 3;                 // receitas completas antes de assinar
const TEMPOS = [5, 10, 30, 60, 120];

const CATEGORIAS = [
  "principal", "rapida", "salada", "suco", "sobremesa", "fruta",
  "lowcarb", "cetogenica", "detox", "vegetariana", "vegana", "economica",
];

// Campos do cartão. O que NÃO está aqui é o produto: 'ingredientes',
// 'preparo' e 'dica' nunca saem numa listagem.
const CARTAO =
  "slug,titulo,chamada,categorias,tempo_min,rende,porcao_g,kcal,ptn,cho,lip,fibra";

function txt(v: unknown, max = 80) {
  return String(v ?? "").trim().slice(0, max);
}

/** Assinatura em dia? Vale para receita e para leitura de rótulo. */
async function assinaturaAtiva(admin: any, codigo: string) {
  if (!codigo || !/^[A-Z0-9-]{6,16}$/.test(codigo)) return false;
  const { data } = await admin.rpc("mercado_assinatura_valida", { p_codigo: codigo });
  return data === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    acao?: string; slug?: string; categoria?: string; tempo?: number;
    busca?: string; dispositivo?: string; codigo?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "json_invalido" }, 400);
  }

  const dispositivo = txt(body.dispositivo, 64);
  const codigo = txt(body.codigo, 16).toUpperCase();

  // ---------------------------------------------------------- LISTA
  if (body.acao === "lista") {
    let q = admin
      .from("mercado_receitas")
      .select(CARTAO)
      .eq("publicada", true)
      .order("ordem", { ascending: true })
      .limit(300);

    const categoria = txt(body.categoria, 20);
    if (categoria && CATEGORIAS.includes(categoria)) {
      // 'rapida' não é uma etiqueta guardada no banco: é o jeito como a
      // pessoa fala de "até 10 minutos". Traduzir aqui evita marcar a
      // mesma receita duas vezes na fonte e as duas saírem de sincronia.
      if (categoria === "rapida") q = q.lte("tempo_min", 10);
      else q = q.contains("categorias", [categoria]);
    }

    const tempo = Number(body.tempo || 0);
    if (TEMPOS.includes(tempo)) q = q.lte("tempo_min", tempo);

    const busca = txt(body.busca, 40);
    if (busca) {
      const t = busca.replace(/[%,()]/g, " ");
      q = q.or(`titulo.ilike.%${t}%,chamada.ilike.%${t}%`);
    }

    const { data, error } = await q;
    if (error) return json({ error: "falha_na_lista", tecnico: error.message }, 500);

    // Quais destas ela já pode abrir sem gastar nada.
    let liberadas: string[] = [];
    let usadas = 0;
    const assina = await assinaturaAtiva(admin, codigo);
    if (!assina && dispositivo) {
      const { data: v } = await admin
        .from("mercado_receitas_vistas")
        .select("slug")
        .eq("dispositivo", dispositivo);
      liberadas = (v ?? []).map((x: { slug: string }) => x.slug);
      usadas = liberadas.length;
    }

    return json({
      ok: true,
      total: (data ?? []).length,
      receitas: data ?? [],
      assinante: assina,
      liberadas,
      gratis_restantes: assina ? null : Math.max(0, GRATIS - usadas),
    });
  }

  // -------------------------------------------------------- RECEITA
  if (body.acao === "receita") {
    const slug = txt(body.slug, 90);
    if (!slug) return json({ error: "slug_ausente" }, 400);

    const { data: receita, error } = await admin
      .from("mercado_receitas")
      .select("*")
      .eq("slug", slug)
      .eq("publicada", true)
      .maybeSingle();

    if (error) return json({ error: "falha_na_busca", tecnico: error.message }, 500);
    if (!receita) return json({ error: "receita_nao_encontrada" }, 404);

    // 1) Assinante entra direto.
    if (await assinaturaAtiva(admin, codigo)) {
      return json({ ok: true, receita, assinante: true });
    }

    if (!dispositivo) return json({ error: "dispositivo_ausente" }, 400);

    // 2) Já destravou esta antes? Não gasta de novo.
    const { data: jaVi } = await admin
      .from("mercado_receitas_vistas")
      .select("slug")
      .eq("dispositivo", dispositivo)
      .eq("slug", slug)
      .maybeSingle();

    const { count } = await admin
      .from("mercado_receitas_vistas")
      .select("slug", { count: "exact", head: true })
      .eq("dispositivo", dispositivo);

    const usadas = count ?? 0;

    if (jaVi) {
      return json({
        ok: true, receita, assinante: false,
        gratis_restantes: Math.max(0, GRATIS - usadas),
      });
    }

    // 3) Ainda tem das três?
    if (usadas >= GRATIS) {
      return json({
        error: "assinatura_necessaria",
        detail: `Você já abriu as ${GRATIS} receitas que são de graça. ` +
                "O acervo inteiro fica liberado na assinatura. 🌸",
        gratis_restantes: 0,
        titulo: receita.titulo,   // dá para a tela dizer qual ficou travada
      }, 402);
    }

    await admin.from("mercado_receitas_vistas")
      .insert({ dispositivo, slug })
      .select("slug");

    return json({
      ok: true, receita, assinante: false,
      gratis_restantes: Math.max(0, GRATIS - (usadas + 1)),
      acabou_de_gastar: true,
    });
  }

  return json({ error: "acao_desconhecida" }, 400);
});

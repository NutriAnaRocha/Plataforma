// ============================================================
//  diretorio-buscar — a vitrine pública de nutricionistas.
//
//  { acao: "filtros" }
//      -> especialidades do domínio + estados que hoje têm alguém atendendo.
//
//  { acao: "lista", temas?, modalidade?, estado?, busca?, limite?, pagina? }
//      -> os CARTÕES: foto, nome, CRN, cidade, especialidades, preço e a
//         apresentação. Aberto de propósito — é o que o Google indexa e o
//         que faz o paciente querer clicar.
//
//  { acao: "perfil", slug }
//      -> a página da nutri: o cartão + bio, formação e redes.
//
//  POR QUE ISTO É UMA FUNCTION E NÃO UMA POLICY DE RLS
//    RLS filtra LINHA, não COLUNA. Uma policy "perfil aprovado é legível por
//    todos" entregaria junto telefone, is_admin, assinatura_status e
//    carimbo_url de quem publicasse. Aqui a lista de colunas é branca e
//    explícita: o que não está em CARTAO/PERFIL não sai daqui.
//
//  A ORDEM DA LISTA (e por que ela é declarada na tela)
//    QUEM ENTRA (15/09/2026): perfil aprovado E assinatura vigente — a
//    vitrine é o diferencial de quem assina a plataforma (migração 0094,
//    mesma regra de nutri_na_vitrine). Não há plano pago por posição.
//    1. quem está aceitando novos pacientes.
//    3. aderência ao quiz (especialidade em comum, modalidade, estado).
//    4. sorteio com semente do dia, para desempatar sem privilegiar sempre
//       a mesma pessoa dentro do mesmo nível.
//    O site rotula a faixa paga como "Perfis em destaque" e explica o
//    critério no rodapé — CFN 856 veda publicidade que engane sobre isso.
//
//  verify_jwt = false: ninguém precisa de conta para procurar uma nutri.
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

// O cartão da lista. Nada fora daqui chega ao navegador de quem busca.
const CARTAO =
  "slug,nome,crn,cidade,estado,avatar_url,apresentacao,area_atuacao," +
  "atende_online,atende_presencial,preco_consulta_cents,plano_tier,aceita_novos," +
  "instagram,site";   // a paciente decide também pelo Instagram (17/09)

// A página da nutri acrescenta o que ajuda a decidir por quem vai te atender.
const PERFIL = CARTAO + ",bio,instagram,site,formacao,ano_formatura,pos_graduacao,atuacao_desde," +
  "publico_atendido,como_funciona,bairro";   // 0095

// Colunas lidas só para decidir se o perfil está na vitrine (0094). Nunca
// saem daqui: são removidas antes de responder.
const VIGENCIA = ",assinatura_status,assinatura_expira_em,is_admin";

/** Mesma regra de public.nutri_na_vitrine: assinatura ativa e no prazo, ou admin. */
function vigente(p: any) {
  if (p.is_admin === true) return true;
  if (p.assinatura_status !== "ativa") return false;
  return !p.assinatura_expira_em || new Date(p.assinatura_expira_em).getTime() > Date.now();
}

function semVigencia({ assinatura_status, assinatura_expira_em, is_admin, ...p }: any) {
  return p;
}

// Colunas lidas só para ORDENAR — a avaliação do atendimento não vai para o
// navegador (migração 0093: nota é sinal interno, não vitrine). São removidas
// junto com os campos _ antes de responder.
const ORDENACAO = ",avaliacao_media,avaliacao_qtd";

// Média bayesiana: com poucas avaliações a nota puxa para a média a priori,
// então uma nutri com um único 5 não passa na frente de quem tem trinta 4,8.
const NOTA_PRIOR = 4.6;   // média a priori
const NOTA_PESO = 5;      // quantas avaliações "virtuais" a priori vale

function qualidade(p: any) {
  const qtd = Number(p.avaliacao_qtd) || 0;
  const media = Number(p.avaliacao_media) || 0;
  return (media * qtd + NOTA_PRIOR * NOTA_PESO) / (qtd + NOTA_PESO);
}
// O INTERRUPTOR DA NOTA PÚBLICA (16/09/2026).
// A vitrine com filtros levantou a pergunta "filtrar por nº de avaliações?".
// Resposta: ainda não. Com um punhado de perfis, uma nutri com UMA avaliação
// passaria por reputação, e a 0093 amarra exibição pública à moderação de
// comentário por causa do Art. 69. Virar para true publica média e quantidade
// no card (a partir de MIN_AVALIACOES) — o navegador já sabe desenhar o selo.
const MOSTRAR_NOTA = false;
const MIN_AVALIACOES = 5;

const TETO = 200;   // teto do que sai do banco antes de ordenar aqui
const PAGINA = 12;

function txt(v: unknown, max = 120) {
  return String(v ?? "").trim().slice(0, max);
}

/** Semente estável dentro do dia: a ordem não dança a cada F5. */
function sementeDoDia(chave: string) {
  const dia = new Date().toISOString().slice(0, 10);
  let h = 2166136261;
  for (const c of dia + chave) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Quanto este perfil responde ao que a pessoa pediu no quiz. */
function aderencia(p: any, temas: string[], modalidade: string, estado: string) {
  let s = 0;
  const areas: string[] = Array.isArray(p.area_atuacao) ? p.area_atuacao : [];
  for (const t of temas) {
    if (areas.some((a) => a.toLowerCase() === t.toLowerCase())) s += 3;
  }
  if (modalidade === "online" && p.atende_online) s += 2;
  if (modalidade === "presencial" && p.atende_presencial) s += 2;
  if (estado && p.estado && p.estado.toUpperCase() === estado.toUpperCase()) s += 1;
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "json_invalido" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const acao = txt(body.acao, 20) || "lista";

  // ---------- filtros ----------
  if (acao === "filtros") {
    const [esp, est] = await Promise.all([
      admin.from("especialidades").select("slug,nome").eq("ativa", true).order("ordem"),
      admin.from("profiles").select("estado" + VIGENCIA)
        .eq("perfil_status", "aprovado").not("estado", "is", null),
    ]);
    const estados = [...new Set((est.data ?? []).filter(vigente).map((r: any) => txt(r.estado, 2).toUpperCase()))]
      .filter(Boolean).sort();
    return json({ especialidades: esp.data ?? [], estados });
  }

  // ---------- perfil ----------
  if (acao === "perfil") {
    const slug = txt(body.slug, 80).toLowerCase();
    if (!slug) return json({ error: "slug_ausente" }, 400);

    const { data, error } = await admin.from("profiles").select(PERFIL + VIGENCIA)
      .eq("perfil_status", "aprovado").ilike("slug", slug).limit(1).maybeSingle();

    if (error) return json({ error: "falha_consulta" }, 500);
    // Assinatura vencida some da vitrine inteira, inclusive do link direto.
    if (!data || !vigente(data)) return json({ error: "nao_encontrado" }, 404);
    return json({ nutri: semVigencia(data) });
  }

  // ---------- lista ----------
  const temas: string[] = Array.isArray(body.temas)
    ? body.temas.slice(0, 6).map((t: unknown) => txt(t, 60)).filter(Boolean)
    : [];
  const modalidade = txt(body.modalidade, 12);
  const estado = txt(body.estado, 2);
  const busca = txt(body.busca, 60);
  const pagina = Math.max(0, Math.min(50, parseInt(String(body.pagina ?? 0), 10) || 0));
  const limite = Math.max(1, Math.min(24, parseInt(String(body.limite ?? PAGINA), 10) || PAGINA));

  // Faixa de valor em centavos. Vem do navegador em centavos já convertidos;
  // ausente/lixo vira "sem limite" — filtro quebrado não pode esvaziar a lista.
  const nCent = (v: unknown) => {
    const n = parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 100_000_00) : null;
  };
  const precoMin = nCent(body.preco_min_cents) ?? 0;
  const precoMax = nCent(body.preco_max_cents) ?? Infinity;
  const soAceitaNovos = body.aceita_novos === true || body.aceita_novos === "true";
  const ordem = txt(body.ordem, 16) || "relevancia";

  let q = admin.from("profiles").select(CARTAO + ORDENACAO + VIGENCIA)
    .eq("perfil_status", "aprovado")
    .limit(TETO);

  // QUEM APARECE: CRN conferido e publicado (perfil_status 'aprovado') E
  // assinatura vigente, conferida em vigente() — a busca por nome já usa o
  // único .or() que o PostgREST aceita por consulta.

  // Modalidade é filtro duro: quem só atende presencial não serve a quem
  // procura online. "tanto_faz" não filtra nada.
  if (modalidade === "online") q = q.eq("atende_online", true);
  if (modalidade === "presencial") q = q.eq("atende_presencial", true);
  if (estado) q = q.ilike("estado", estado);
  if (busca) q = q.or(`nome.ilike.%${busca}%,cidade.ilike.%${busca}%`);
  // Especialidade também é filtro duro quando a pessoa escolheu: melhor uma
  // lista curta e certa do que uma longa com gente que não trata aquilo.
  if (temas.length) q = q.overlaps("area_atuacao", temas);
  // "Aceitando novos pacientes" só filtra quando a pessoa MARCA: sem a marca,
  // agenda fechada continua na lista (no fim), porque o perfil ainda informa.
  if (soAceitaNovos) q = q.eq("aceita_novos", true);

  const { data, error } = await q;
  if (error) return json({ error: "falha_consulta" }, 500);

  /* PREÇO É FILTRADO AQUI, NÃO NO SQL, por duas razões:
     1. quem não publicou valor NÃO pode ser descartado (campo opcional;
        sumir puniria quem acabou de publicar) — e um `.gte` no PostgREST
        derruba NULL sem pedir licença;
     2. o `.or()` da busca por nome já é o único que a consulta comporta.
     Com TETO de 200 linhas, peneirar em memória é barato. */
  const noPreco = (p: any) => {
    const c = p.preco_consulta_cents;
    if (c == null) return true;
    return c >= precoMin && c <= precoMax;
  };

  const lista = (data ?? []).filter(vigente).filter(noPreco)
    .map(({ avaliacao_media, avaliacao_qtd, ...p }: any) => ({
      ...semVigencia(p),
      // A nota só atravessa quando o interruptor está ligado E há amostra.
      ...(MOSTRAR_NOTA && Number(avaliacao_qtd) >= MIN_AVALIACOES
        ? { avaliacao_media: Number(avaliacao_media), avaliacao_qtd: Number(avaliacao_qtd) }
        : {}),
      _score: aderencia(p, temas, modalidade, estado),
      _qual: qualidade({ avaliacao_media, avaliacao_qtd }),
      _sorte: sementeDoDia(p.slug ?? ""),
      _sem: p.preco_consulta_cents == null,
    }));

  if (ordem === "preco_asc" || ordem === "preco_desc") {
    // Ordem pedida pela pessoa: ela manda, e só ela. Quem não publicou valor
    // vai para o fim nos dois sentidos — não é "a mais barata" nem "a mais cara".
    const dir = ordem === "preco_asc" ? 1 : -1;
    lista.sort((a, b) =>
      Number(a._sem) - Number(b._sem) ||
      dir * ((a.preco_consulta_cents ?? 0) - (b.preco_consulta_cents ?? 0)) ||
      a._sorte - b._sorte
    );
  } else {
    // Relevância: quem aceita novos vem antes; depois quem responde ao que a
    // pessoa filtrou; só então a avaliação desempata — sem aparecer no card.
    lista.sort((a, b) =>
      Number(b.aceita_novos) - Number(a.aceita_novos) ||
      b._score - a._score ||
      b._qual - a._qual ||
      a._sorte - b._sorte
    );
  }

  const total = lista.length;
  const pag = lista.slice(pagina * limite, pagina * limite + limite)
    .map(({ _rank, _score, _qual, _sorte, _sem, ...p }) => p);

  return json({
    total,
    pagina,
    tem_mais: (pagina + 1) * limite < total,
    // A tela separa a faixa de destaque usando isto — o rótulo "Perfis em
    // destaque" precisa bater com o que a ordem realmente fez.
    destaques: pag.filter((p: any) => p.plano_tier === "completo").length,
    nutris: pag,
  });
});

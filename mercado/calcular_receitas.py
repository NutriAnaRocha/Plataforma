# -*- coding: utf-8 -*-
"""
Calcula a nutrição das receitas pela TACO e gera o SQL do acervo.

    python calcular_receitas.py            -> confere e mostra a tabela
    python calcular_receitas.py --sql      -> grava o seed em supabase/migrations/

POR QUE ESTE ARQUIVO EXISTE
    Nenhum valor de kcal ou proteína é digitado à mão em receitas_dados.py.
    Aqui a conta é feita ingrediente por ingrediente, pela TACO (NEPA/Unicamp,
    4ª ed.), e o resultado é REFAZÍVEL: rodar de novo devolve o mesmo número.
    Isso importa porque quem assina o app é uma nutricionista registrada —
    número estimado por chute não se defende diante do CRN.

O QUE ELE CONFERE ANTES DE CALCULAR
    - todo taco_id existe mesmo na tabela;
    - toda chave de EXTRA existe no dicionário;
    - slug único, tempo numa das faixas da tela, categoria do vocabulário;
    - e avisa quando uma porção sai absurda (acima de 900 kcal ou abaixo
      de 40), que é o sintoma típico de grama digitada errada.
"""
import io, json, os, sys, urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from receitas_dados import RECEITAS, EXTRA          # noqa: E402

SUPA = "https://btsqrpxzlkmucrfvsytl.supabase.co"
ANON = "sb_publishable_WinaFUxjvv0ODjSs7sT2dQ_k7GlLLxh"
CACHE = os.path.join(AQUI, "taco_cache.json")

CATEGORIAS = {
    "lowcarb", "cetogenica", "detox", "vegetariana", "vegana",
    "sobremesa", "salada", "suco", "principal", "fruta", "economica",
}
TEMPOS = {5, 10, 30, 60, 120}


def taco():
    """Baixa a TACO uma vez e guarda em disco — ela não muda."""
    if os.path.exists(CACHE):
        return {int(x["id"]): x for x in json.load(open(CACHE, encoding="utf-8"))}
    url = (SUPA + "/rest/v1/taco_alimentos"
           "?select=id,nome,kcal,ptn,cho,lip,fibra&limit=2000")
    req = urllib.request.Request(url, headers={"apikey": ANON, "User-Agent": "nutri/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        dados = json.loads(r.read().decode("utf-8"))
    json.dump(dados, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    return {int(x["id"]): x for x in dados}


def por100(fonte, ref):
    """Devolve (nome, kcal, ptn, cho, lip, fibra) por 100 g de um ingrediente."""
    if isinstance(ref, str):
        if ref not in EXTRA:
            raise KeyError("EXTRA sem a chave '%s'" % ref)
        v = EXTRA[ref]
        return (ref, v[0], v[1], v[2], v[3], v[4])
    if ref not in fonte:
        raise KeyError("taco_id %s não existe na tabela" % ref)
    a = fonte[ref]
    n = lambda k: float(a[k] or 0)
    return (a["nome"], n("kcal"), n("ptn"), n("cho"), n("lip"), n("fibra"))


def calcular(tabela):
    saida, avisos = [], []
    vistos = set()

    for r in RECEITAS:
        if r["slug"] in vistos:
            avisos.append("SLUG REPETIDO: " + r["slug"])
        vistos.add(r["slug"])
        if r["tempo"] not in TEMPOS:
            avisos.append("%s: tempo %s fora das faixas" % (r["slug"], r["tempo"]))
        for c in r["cat"]:
            if c not in CATEGORIAS:
                avisos.append("%s: categoria desconhecida '%s'" % (r["slug"], c))
        if "vegana" in r["cat"] and "vegetariana" not in r["cat"]:
            avisos.append("%s: vegana sem marcar vegetariana (some do filtro)" % r["slug"])

        tot = dict(kcal=0.0, ptn=0.0, cho=0.0, lip=0.0, fibra=0.0)
        ings = []
        for medida, gramas, ref in r["ing"]:
            nome, k, p, c, l, f = por100(tabela, ref)
            fator = float(gramas) / 100.0
            tot["kcal"] += k * fator
            tot["ptn"] += p * fator
            tot["cho"] += c * fator
            tot["lip"] += l * fator
            tot["fibra"] += f * fator
            ings.append({
                "item": medida,
                "gramas": gramas,
                "taco_id": ref if isinstance(ref, int) else None,
                "fonte": None if isinstance(ref, int) else "extra:" + ref,
                "nome_tabela": nome,
            })

        rende = int(r["rende"])
        porcao = {k: round(v / rende, 1) for k, v in tot.items()}
        gramas_total = sum(float(g) for _, g, _ in r["ing"])

        if porcao["kcal"] > 900:
            avisos.append("%s: %s kcal por porção — confira as gramas" % (r["slug"], porcao["kcal"]))
        if porcao["kcal"] < 40:
            avisos.append("%s: só %s kcal por porção — confira as gramas" % (r["slug"], porcao["kcal"]))

        saida.append(dict(r, calc=porcao, ings=ings,
                          porcao_g=round(gramas_total / rende)))
    return saida, avisos


# ---------------------------------------------------------------- SQL
def lit(s):
    if s is None:
        return "null"
    return "'" + str(s).replace("'", "''") + "'"


def arr(xs):
    return "array[" + ", ".join(lit(x) for x in xs) + "]::text[]"


def sql(receitas):
    linhas = ["""-- ============================================================
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
""" ]
    for i, r in enumerate(receitas):
        ing_json = json.dumps(r["ings"], ensure_ascii=False)
        linhas.append(
            "insert into public.mercado_receitas\n"
            "  (slug, titulo, chamada, categorias, tempo_min, rende, porcao_g,\n"
            "   kcal, ptn, cho, lip, fibra, ingredientes, preparo, dica, ordem)\n"
            "values (\n"
            "  %s,\n  %s,\n  %s,\n  %s,\n  %d, %d, %s,\n"
            "  %s, %s, %s, %s, %s,\n"
            "  %s::jsonb,\n"
            "  %s,\n"
            "  %s,\n  %d)\n"
            "on conflict (slug) do update set\n"
            "  titulo=excluded.titulo, chamada=excluded.chamada,\n"
            "  categorias=excluded.categorias, tempo_min=excluded.tempo_min,\n"
            "  rende=excluded.rende, porcao_g=excluded.porcao_g,\n"
            "  kcal=excluded.kcal, ptn=excluded.ptn, cho=excluded.cho,\n"
            "  lip=excluded.lip, fibra=excluded.fibra,\n"
            "  ingredientes=excluded.ingredientes, preparo=excluded.preparo,\n"
            "  dica=excluded.dica, ordem=excluded.ordem,\n"
            "  atualizado_em=now();\n"
            % (lit(r["slug"]), lit(r["titulo"]), lit(r.get("chamada")),
               arr(r["cat"]), r["tempo"], r["rende"], r["porcao_g"],
               r["calc"]["kcal"], r["calc"]["ptn"], r["calc"]["cho"],
               r["calc"]["lip"], r["calc"]["fibra"],
               lit(ing_json), arr(r["preparo"]), lit(r.get("dica")), i + 1)
        )
    linhas.append("\nnotify pgrst, 'reload schema';\n")
    return "\n".join(linhas)


def main():
    tabela = taco()
    receitas, avisos = calcular(tabela)

    print("%-46s %5s %4s %5s %5s %s" % ("RECEITA", "min", "rend", "kcal", "ptn", "categorias"))
    print("-" * 108)
    for r in receitas:
        print("%-46s %5d %4d %5.0f %4.1f  %s" % (
            r["slug"][:46], r["tempo"], r["rende"],
            r["calc"]["kcal"], r["calc"]["ptn"], ",".join(r["cat"])))

    print("\n%d receitas." % len(receitas))
    por_tempo = {}
    por_cat = {}
    for r in receitas:
        por_tempo[r["tempo"]] = por_tempo.get(r["tempo"], 0) + 1
        for c in r["cat"]:
            por_cat[c] = por_cat.get(c, 0) + 1
    print("por tempo:", dict(sorted(por_tempo.items())))
    print("por categoria:", dict(sorted(por_cat.items(), key=lambda x: -x[1])))

    if avisos:
        print("\nAVISOS:")
        for a in avisos:
            print("  -", a)
    else:
        print("\nNenhum aviso.")

    if "--sql" in sys.argv:
        destino = os.path.join(AQUI, "..", "supabase", "migrations",
                               "0055_mercado_receitas_seed.sql")
        io.open(destino, "w", encoding="utf-8").write(sql(receitas))
        print("\nSQL gravado em", os.path.normpath(destino))


if __name__ == "__main__":
    main()

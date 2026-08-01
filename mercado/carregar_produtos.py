#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Carrega produtos.jsonl (saida de importar_off.py) na tabela
public.mercado_produtos, pela Management API da Supabase.

Roda em LOTES e com ON CONFLICT DO UPDATE, entao pode ser executado de
novo a qualquer momento para atualizar a base sem duplicar nada -- o
codigo de barras e a chave. E o jeito de a base envelhecer bem: a Open
Food Facts recebe produto novo toda semana.

Uso:  python carregar_produtos.py [--lote 150]

Credenciais: ~/.claude/.nutri-supabase-credentials (SUPABASE_PAT, PROJECT_REF)
"""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from apply_migration_api import load_creds, run_sql   # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
ENTRADA = os.path.join(AQUI, "produtos.jsonl")

COLUNAS = ["code", "nome", "marca", "quantidade", "categoria_tag", "categoria",
           "nova", "nutriscore", "aditivos", "labels", "ingredientes",
           "kcal", "ptn", "cho", "acucar", "fibra", "lip", "sat", "sodio"]


def lit(v):
    """Literal SQL. Nada aqui vem do usuario final -- e um arquivo que eu
    mesmo gerei --, mas o texto vem da OFF, onde nome de produto tem aspas,
    barra invertida e ate quebra de linha. Escapar e obrigatorio."""
    if v is None or v == "":
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, list):
        if not v:
            return "'{}'"
        return "ARRAY[" + ",".join(lit(str(x)) for x in v) + "]::text[]"
    s = str(v).replace("\\", "\\\\").replace("'", "''").replace("\x00", "")
    return "E'" + s.replace("\n", "\\n").replace("\r", "") + "'"


def main():
    lote = 150
    if "--lote" in sys.argv:
        lote = int(sys.argv[sys.argv.index("--lote") + 1])

    if not os.path.exists(ENTRADA):
        print("Nao achei %s -- rode importar_off.py antes." % ENTRADA)
        return 1

    linhas = []
    with open(ENTRADA, encoding="utf-8") as f:
        for l in f:
            l = l.strip()
            if l:
                linhas.append(json.loads(l))
    print("%d produtos para carregar" % len(linhas))

    creds = load_creds()
    pat, ref = creds["SUPABASE_PAT"], creds["PROJECT_REF"]

    total = 0
    for i in range(0, len(linhas), lote):
        pedaco = linhas[i:i + lote]
        valores = []
        for p in pedaco:
            valores.append("(" + ",".join(lit(p.get(c)) for c in COLUNAS) + ")")
        sql = (
            "insert into public.mercado_produtos (" + ",".join(COLUNAS) + ") values\n"
            + ",\n".join(valores)
            + "\non conflict (code) do update set "
            + ", ".join("%s = excluded.%s" % (c, c) for c in COLUNAS if c != "code")
            + ", atualizado_em = now();"
        )
        ok, out = run_sql(pat, ref, sql)
        if not ok:
            print("FALHOU no lote %d-%d: %s" % (i, i + len(pedaco), out[:400]))
            return 1
        total += len(pedaco)
        print("  %d/%d" % (total, len(linhas)), flush=True)

    ok, out = run_sql(pat, ref,
                      "select categoria, count(*) as n from public.mercado_produtos "
                      "group by categoria order by n desc;")
    print("\nNa base agora:")
    if ok:
        for r in json.loads(out):
            print("  %-30s %4d" % (r["categoria"], r["n"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

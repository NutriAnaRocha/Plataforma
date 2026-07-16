#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplica uma migração SQL no Supabase pela MANAGEMENT API (não precisa da senha
do banco nem da CLI — só do Personal Access Token).

Uso:  python apply_migration_api.py supabase/migrations/0016_ebooks_infinitepay.sql [--yes]

Credenciais: ~/.claude/.nutri-supabase-credentials  (SUPABASE_PAT, PROJECT_REF)
"""
import sys, os, json, urllib.request, urllib.error

CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")


def load_creds():
    d = {}
    with open(CRED, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            # tira comentário inline (ex.: "TOKEN=xxx   # nota")
            d[k.strip()] = v.split("#")[0].strip()
    return d


def run_sql(pat, ref, sql):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{ref}/database/query",
        data=json.dumps({"query": sql}).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + pat,
            "Content-Type": "application/json",
            # O WAF da Supabase bloqueia o User-Agent padrão do urllib (403).
            "User-Agent": "claude-code-nutri/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return True, r.read().decode()
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()[:800]}"
    except Exception as e:
        return False, str(e)


def main():
    if len(sys.argv) < 2:
        print("uso: python apply_migration_api.py <arquivo.sql> [--yes]")
        sys.exit(1)
    path = sys.argv[1]
    if not os.path.isfile(path):
        print("arquivo nao encontrado:", path)
        sys.exit(1)
    sql = open(path, encoding="utf-8").read()

    print("=" * 60)
    print("MIGRACAO:", path)
    print("=" * 60)
    if "--yes" not in sys.argv:
        print(sql)
        if input("Aplicar no banco de producao? (digite SIM): ").strip() != "SIM":
            print("Cancelado.")
            sys.exit(0)

    c = load_creds()
    ok, out = run_sql(c["SUPABASE_PAT"], c["PROJECT_REF"], sql)
    if ok:
        print("OK — migracao aplicada.")
        print("retorno:", out[:400])
    else:
        print("ERRO:", out)
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplica uma migração SQL no Postgres do Supabase da Plataforma Nutri.
Uso:  python apply_migration.py supabase/migrations/0007_perfil_extra.sql
Credenciais lidas de C:\\Users\\<user>\\.claude\\.nutri-supabase-credentials
Pede confirmação explícita antes de rodar.

Obs: exige DB_PASSWORD no arquivo de credenciais. Se não houver, use
apply_migration_api.py (roda o SQL pela Management API, só com o PAT).
"""
import sys, os, re
import psycopg2

CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")

def load_creds():
    d = {}
    with open(CRED, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            d[k.strip()] = v.strip()
    return d

def main():
    if len(sys.argv) < 2:
        print("uso: python apply_migration.py <arquivo.sql>")
        sys.exit(1)
    path = sys.argv[1]
    if not os.path.isfile(path):
        print("arquivo nao encontrado:", path)
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        sql = f.read()

    print("=" * 60)
    print("MIGRACAO:", path)
    print("=" * 60)
    print(sql)
    print("=" * 60)
    if "--yes" in sys.argv:
        print(">> --yes: aplicando sem prompt.")
    else:
        ans = input("Aplicar no banco de producao? (digite SIM): ").strip()
        if ans != "SIM":
            print("Cancelado.")
            sys.exit(0)

    c = load_creds()
    conn = psycopg2.connect(
        host=c["DB_HOST"], port=c.get("DB_PORT", "5432"),
        user=c["DB_USER"], password=c["DB_PASSWORD"], dbname="postgres",
        sslmode="require", connect_timeout=15,
    )
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print("OK — migracao aplicada e commitada.")
    except Exception as e:
        conn.rollback()
        print("ERRO — rollback:", e)
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Liga o Resend na NutriPlat: grava os dois secrets que a edge function
`nutriplat-renovacao` espera e confere se o envio passou a funcionar.

Sem RESEND_API_KEY + EMAIL_REMETENTE a function grava todo aviso com
canal 'sem_provedor' e ok=false — o card de Admin mostra "Os e-mails não
estão saindo". Com os dois, o canal vira 'email'.

Uso:
  python ligar_resend.py --key re_xxxxxxxx
  python ligar_resend.py --key re_xxx --de "NutriPlat <contato@nutrianaluisarocha.com>"
  python ligar_resend.py --so-teste            (secrets já gravados: só confere)
  python ligar_resend.py --so-teste --enviar   (dispara o envio de verdade)

Credenciais do Supabase: ~/.claude/.nutri-supabase-credentials (PAT + REF).
O segredo do cron sai do cofre do próprio banco, não de arquivo.
"""
import sys, os, json, argparse, urllib.request, urllib.error

CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")
DE_PADRAO = "NutriPlat <contato@nutrianaluisarocha.com>"
SLUG = "nutriplat-renovacao"


def load_creds():
    d = {}
    with open(CRED, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            d[k.strip()] = v.split("#")[0].strip()
    return d


def api(pat, metodo, caminho, corpo=None):
    url = "https://api.supabase.com" + caminho
    data = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(url, data=data, method=metodo, headers={
        "Authorization": "Bearer " + pat,
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            txt = r.read().decode()
            return True, (json.loads(txt) if txt.strip() else {})
    except urllib.error.HTTPError as e:
        return False, e.read().decode()


def cron_secret(pat, ref):
    """Lê o segredo do cron do cofre — é o header que a function exige."""
    sql = "select decrypted_secret from vault.decrypted_secrets where name='nutriplat_cron'"
    ok, out = api(pat, "POST", f"/v1/projects/{ref}/database/query", {"query": sql})
    if not ok or not out:
        return None
    return out[0].get("decrypted_secret")


def chamar_function(url_base, anon_ou_segredo, seco):
    url = f"{url_base}/functions/v1/{SLUG}"
    corpo = json.dumps({"seco": True} if seco else {}).encode()
    req = urllib.request.Request(url, data=corpo, method="POST", headers={
        "Content-Type": "application/json",
        "x-cron-secret": anon_ou_segredo,
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return True, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return False, e.read().decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", help="API key do Resend (re_...)")
    ap.add_argument("--de", default=DE_PADRAO, help="EMAIL_REMETENTE")
    ap.add_argument("--so-teste", action="store_true", help="não grava secrets")
    ap.add_argument("--enviar", action="store_true", help="envia de verdade (sem --seco)")
    a = ap.parse_args()

    c = load_creds()
    pat = os.environ.get("SUPABASE_TOKEN") or c["SUPABASE_PAT"]
    ref = c["PROJECT_REF"]
    url_base = f"https://{ref}.supabase.co"

    if not a.so_teste:
        if not a.key:
            print("Falta --key (a API key do Resend).")
            sys.exit(2)
        if not a.key.startswith("re_"):
            print("A chave do Resend começa com 're_'. Confira o que foi colado.")
            sys.exit(2)
        ok, out = api(pat, "POST", f"/v1/projects/{ref}/secrets", [
            {"name": "RESEND_API_KEY", "value": a.key},
            {"name": "EMAIL_REMETENTE", "value": a.de},
        ])
        if not ok:
            print("ERRO ao gravar os secrets:", out)
            sys.exit(1)
        print("Secrets gravados: RESEND_API_KEY, EMAIL_REMETENTE =", a.de)

    ok, nomes = api(pat, "GET", f"/v1/projects/{ref}/secrets")
    if ok:
        tem = sorted(s["name"] for s in nomes if s["name"] in ("RESEND_API_KEY", "EMAIL_REMETENTE"))
        print("Conferido no projeto:", tem or "NENHUM dos dois")

    seg = cron_secret(pat, ref)
    if not seg:
        print("Não achei 'nutriplat_cron' no cofre — sem ele a function devolve 401.")
        sys.exit(1)

    ok, out = chamar_function(url_base, seg, seco=not a.enviar)
    print(("ENVIO REAL" if a.enviar else "TESTE SECO") + ":", json.dumps(out, ensure_ascii=False)[:900])


main()

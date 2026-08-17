#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Faz o DEPLOY de uma Edge Function no Supabase pela MANAGEMENT API
(sem CLI, só com o Personal Access Token).

Uso:  python deploy_function.py <slug> [--no-verify-jwt]
      (lê supabase/functions/<slug>/index.ts)

Credenciais: ~/.claude/.nutri-supabase-credentials  (SUPABASE_PAT, PROJECT_REF)
"""
import sys, os, json, uuid, urllib.request, urllib.error

CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")


def load_creds():
    d = {}
    for line in open(CRED, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            d[k.strip()] = v.split("#")[0].strip()
    return d


def multipart(fields, files):
    """fields: dict[str,str]; files: list[(name, filename, content_bytes, ctype)]."""
    boundary = "----nutri" + uuid.uuid4().hex
    body = b""
    for name, val in fields.items():
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode()
        body += val.encode("utf-8") + b"\r\n"
    for name, filename, content, ctype in files:
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode()
        body += f"Content-Type: {ctype}\r\n\r\n".encode()
        body += content + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    return boundary, body


def deploy(pat, ref, slug, source, verify_jwt):
    metadata = {
        "name": slug,
        "entrypoint_path": "index.ts",
        "verify_jwt": verify_jwt,
    }
    boundary, body = multipart(
        {"metadata": json.dumps(metadata)},
        [("file", "index.ts", source.encode("utf-8"), "application/typescript")],
    )
    url = f"https://api.supabase.com/v1/projects/{ref}/functions/deploy?slug={slug}"
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={
            "Authorization": "Bearer " + pat,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "claude-code-nutri/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return True, r.read().decode()
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()[:900]}"
    except Exception as e:
        return False, str(e)


def main():
    if len(sys.argv) < 2:
        print("uso: python deploy_function.py <slug> [--no-verify-jwt]")
        sys.exit(1)
    slug = sys.argv[1]
    verify_jwt = "--no-verify-jwt" not in sys.argv
    path = os.path.join("supabase", "functions", slug, "index.ts")
    if not os.path.isfile(path):
        print("nao encontrado:", path)
        sys.exit(1)
    source = open(path, encoding="utf-8").read()

    c = load_creds()
    # Quando o PAT vence, a sessao do painel aberta no Chromium serve no mesmo
    # endpoint: basta exportar SUPABASE_TOKEN (ver scratchpad/sql_painel.py).
    token = os.environ.get("SUPABASE_TOKEN") or c["SUPABASE_PAT"]
    print(f">> deploy {slug} (verify_jwt={verify_jwt}) ...")
    ok, out = deploy(token, c["PROJECT_REF"], slug, source, verify_jwt)
    if ok:
        try:
            j = json.loads(out)
            print("OK —", j.get("slug", slug), "| status=", j.get("status"), "| version=", j.get("version"))
        except Exception:
            print("OK —", out[:300])
    else:
        print("ERRO:", out)
        sys.exit(1)


if __name__ == "__main__":
    main()

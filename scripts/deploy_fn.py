import io, json, os, sys, uuid, urllib.request, urllib.error

CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")
C = {}
for l in io.open(CRED, encoding="utf-8"):
    l = l.split("#")[0].strip()
    if "=" in l:
        k, v = l.split("=", 1); C[k.strip()] = v.strip().strip('"').strip("'")

REF = C["PROJECT_REF"]; PAT = C["SUPABASE_PAT"]; ANON = C["SUPABASE_ANON_KEY"]
SLUG = "diretorio-buscar"
FONTE = r"H:\Meu Drive\NUTRI ANA LUISA ROCHA\Plataforma Nutri\supabase\functions\diretorio-buscar\index.ts"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")

def api(url, data=None, method="GET", ctype=None):
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + PAT)
    req.add_header("User-Agent", UA)
    if ctype: req.add_header("Content-Type", ctype)
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

# ---------- 1) backup do que está no ar ----------
try:
    corpo = api("https://api.supabase.com/v1/projects/%s/functions/%s/body" % (REF, SLUG))
    io.open("backup_diretorio-buscar.ts", "wb").write(corpo)
    print("backup salvo: %d bytes" % len(corpo))
except urllib.error.HTTPError as e:
    print("AVISO: nao consegui baixar o corpo atual (%s) — seguindo assim mesmo" % e.code)

# ---------- 2) deploy ----------
src = io.open(FONTE, "rb").read()
meta = json.dumps({"name": SLUG, "entrypoint_path": "index.ts", "verify_jwt": False}).encode()
b = "----nutriplat" + uuid.uuid4().hex
def parte(nome, corpo, filename=None, ct="application/json"):
    disp = 'form-data; name="%s"' % nome
    if filename: disp += '; filename="%s"' % filename
    return (("--%s\r\nContent-Disposition: %s\r\nContent-Type: %s\r\n\r\n" % (b, disp, ct)).encode()
            + corpo + b"\r\n")
body = parte("metadata", meta) + parte("file", src, "index.ts", "application/typescript") + ("--%s--\r\n" % b).encode()

try:
    r = api("https://api.supabase.com/v1/projects/%s/functions/deploy?slug=%s" % (REF, SLUG),
            data=body, method="POST", ctype="multipart/form-data; boundary=" + b)
    d = json.loads(r.decode())
    print("DEPLOY OK — versao %s, status %s" % (d.get("version"), d.get("status")))
except urllib.error.HTTPError as e:
    sys.exit("DEPLOY FALHOU %s: %s" % (e.code, e.read().decode()[:400]))

# ---------- 3) smoke test contra a function no ar ----------
def chamar(payload):
    req = urllib.request.Request(
        "https://%s.supabase.co/functions/v1/%s" % (REF, SLUG),
        data=json.dumps(payload).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", ANON); req.add_header("Authorization", "Bearer " + ANON)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

falhas = []
try:
    f = chamar({"acao": "filtros"})
    print("filtros: %d especialidades, %d estados" % (len(f.get("especialidades", [])), len(f.get("estados", []))))
except Exception as e:
    falhas.append("filtros: %s" % e)

casos = [
    ("lista simples", {"acao": "lista", "limite": 5}),
    ("ordem menor valor", {"acao": "lista", "ordem": "preco_asc", "limite": 5}),
    ("ordem maior valor", {"acao": "lista", "ordem": "preco_desc", "limite": 5}),
    ("faixa ate R$150", {"acao": "lista", "preco_max_cents": 15000, "limite": 5}),
    ("faixa 150-300", {"acao": "lista", "preco_min_cents": 15000, "preco_max_cents": 30000, "limite": 5}),
    ("so aceita novos", {"acao": "lista", "aceita_novos": True, "limite": 5}),
    ("busca texto", {"acao": "lista", "busca": "ana", "limite": 5}),
    ("param lixo", {"acao": "lista", "preco_min_cents": "abc", "ordem": "xpto", "limite": 5}),
]
for nome, p in casos:
    try:
        d = chamar(p)
        ns = d.get("nutris", [])
        precos = [n.get("preco_consulta_cents") for n in ns]
        vazou = [k for n in ns for k in n if k.startswith("avaliacao") or k.startswith("assinatura") or k in ("is_admin",)]
        if vazou: falhas.append("%s VAZOU campo interno: %s" % (nome, set(vazou)))
        print("  %-20s total=%-3s devolvidos=%-2d precos=%s" % (nome, d.get("total"), len(ns), precos))
    except Exception as e:
        falhas.append("%s: %s" % (nome, e))

print("\nFALHAS:", falhas if falhas else "nenhuma")

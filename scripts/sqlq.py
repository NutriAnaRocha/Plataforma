import io, json, os, sys, urllib.request, urllib.error
CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")
C = {}
for l in io.open(CRED, encoding="utf-8"):
    l = l.split("#")[0].strip()
    if "=" in l:
        k, v = l.split("=", 1); C[k.strip()] = v.strip().strip('"').strip("'")
def sql(q):
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/%s/database/query" % C["PROJECT_REF"],
        data=json.dumps({"query": q}).encode(), method="POST")
    req.add_header("Authorization", "Bearer " + C["SUPABASE_PAT"])
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit("HTTP %s: %s" % (e.code, e.read().decode()[:300]))

print("especialidades:", sql("select count(*) filter (where ativa) as ativas, count(*) as total from public.especialidades;"))
print("perfis por status:", sql("select perfil_status, count(*) from public.profiles where tipo='nutri' group by 1;"))
print("candidatos a vitrine:", sql("""
  select nome, perfil_status, assinatura_status, assinatura_expira_em, is_admin,
         slug, estado, preco_consulta_cents, aceita_novos, plano_tier,
         array_length(area_atuacao,1) as n_areas
    from public.profiles where tipo='nutri' order by created_at limit 10;"""))

print("\ncolunas de especialidades:", sql("""
  select column_name, data_type from information_schema.columns
   where table_schema='public' and table_name='especialidades' order by ordinal_position;"""))
print("\namostra:", sql("select * from public.especialidades limit 3;"))

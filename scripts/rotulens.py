#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Suporte e vigia de custo do RotuLens, sem SQL na mao.

Ate aqui, emitir um codigo de cortesia, esticar a assinatura de quem teve
problema no pagamento ou saber quanto o app gastou de OpenAI exigia abrir
o painel do Supabase e escrever SELECT. Isso e trabalho que a Ana nao tem
por que fazer, e e o tipo de tarefa que se adia justo no dia em que a
cliente esta esperando.

  python scripts/rotulens.py uso [--dias 14]
      Quantas leituras por dia, quanto custou (estimado) e quem gastou.

  python scripts/rotulens.py achar --email pessoa@email.com
  python scripts/rotulens.py achar --codigo ABCD-1234
      Acha o acesso de alguem que escreveu pedindo socorro.

  python scripts/rotulens.py novo --meses 1 [--email pessoa@email.com]
                                  [--motivo "brinde da live"]
      Cria um codigo NOVO (cortesia ou venda fora do checkout). Se o
      e-mail for informado, a pessoa consegue recuperar o codigo sozinha
      pelo app depois.

  python scripts/rotulens.py renovar ABCD-1234 --meses 3
      Estica o vencimento de quem ja tem codigo, sem trocar o codigo.

  python scripts/rotulens.py pagamentos [--dias 30]
      Os pagamentos que o webhook recebeu, com o status de cada entrega.
      E aqui que se ve uma venda que entrou e nao virou codigo.

Credenciais: ~/.claude/.nutri-supabase-credentials
"""
import argparse
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")

# Custo por leitura para a estimativa. Nao e a fatura: e uma regua para
# perceber que algo saiu do lugar (o dia em que o numero dobra e o dia de
# olhar a fatura de verdade). Recalibrar quando a fatura real chegar.
CUSTO_LEITURA_BRL = 0.02

# Mesmo alfabeto do codigo gerado pela edge function: sem 0/O, 1/I/L, 5/S.
ALFABETO = "ABCDEFGHJKMNPQRTUVWXYZ2346789"


def creds():
    d = {}
    for linha in io.open(CRED, encoding="utf-8"):
        linha = linha.split("#")[0].strip()
        if "=" in linha:
            k, v = linha.split("=", 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    return d


C = creds()


def sql(query):
    """Roda SQL pela Management API. Devolve lista de dicts."""
    url = "https://api.supabase.com/v1/projects/%s/database/query" % C["PROJECT_REF"]
    req = urllib.request.Request(
        url, data=json.dumps({"query": query}).encode("utf-8"), method="POST")
    req.add_header("Authorization", "Bearer " + C["SUPABASE_PAT"])
    req.add_header("Content-Type", "application/json")
    # Sem User-Agent de navegador, a Cloudflare da api.supabase.com da 1010.
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                 "AppleWebKit/537.36 (KHTML, like Gecko) "
                                 "Chrome/127.0.0.0 Safari/537.36")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        corpo = e.read().decode("utf-8")[:500]
        if e.code == 401:
            print("PAT vencido (401). Ver a memoria feedback-supabase-token-do-painel.")
        raise SystemExit("Erro %s: %s" % (e.code, corpo))


def esc(s):
    """Aspa simples para literal de SQL. Tudo que entra aqui vem da linha
    de comando da Ana, mas escapar e barato e engano de digitacao com
    apostrofo derrubaria o comando."""
    return "'" + str(s).replace("'", "''") + "'"


def novo_codigo():
    import secrets
    s = ""
    for i in range(8):
        if i == 4:
            s += "-"
        s += secrets.choice(ALFABETO)
    return s


def tabela(linhas, colunas):
    """Imprime alinhado. Sem dependencia externa: isto roda no PC da Ana."""
    if not linhas:
        print("  (nada aqui)")
        return
    larg = [max(len(c), max(len(str(l.get(c, "") or "")) for l in linhas)) for c in colunas]
    print("  " + "  ".join(c.ljust(w) for c, w in zip(colunas, larg)))
    print("  " + "  ".join("-" * w for w in larg))
    for l in linhas:
        print("  " + "  ".join(str(l.get(c, "") or "").ljust(w)
                              for c, w in zip(colunas, larg)))


# ------------------------------------------------------------------
def cmd_uso(a):
    linhas = sql("""
      select (timezone('America/Sao_Paulo', criado_em))::date::text as dia,
             count(*) as leituras,
             count(*) filter (where codigo_credito is not null) as de_pagante,
             count(distinct dispositivo) as aparelhos,
             count(distinct ip_hash) as origens
        from mercado_analises
       where criado_em > now() - interval '%d days'
       group by 1 order by 1 desc
    """ % int(a.dias))
    print("\nLeituras por dia (America/Sao_Paulo)\n")
    for l in linhas:
        l["custo_R$"] = ("%.2f" % (l["leituras"] * CUSTO_LEITURA_BRL)).replace(".", ",")
    tabela(linhas, ["dia", "leituras", "de_pagante", "aparelhos", "origens", "custo_R$"])

    total = sum(l["leituras"] for l in linhas)
    print("\n  Total no periodo: %d leituras  ~R$ %.2f (estimado a R$ %.2f cada)"
          % (total, total * CUSTO_LEITURA_BRL, CUSTO_LEITURA_BRL))
    print("  A estimativa e regua, nao fatura. Conferir em platform.openai.com/usage")
    print("  e manter o limite mensal (hard limit) ligado la.\n")

    # Quem mais gastou: o sinal de codigo vazado aparece aqui antes de
    # aparecer na fatura.
    top = sql("""
      select coalesce(codigo_credito, '(gratis)') as codigo, count(*) as leituras,
             count(distinct dispositivo) as aparelhos
        from mercado_analises
       where criado_em > now() - interval '%d days'
       group by 1 order by 2 desc limit 8
    """ % int(a.dias))
    print("Quem mais leu no periodo\n")
    tabela(top, ["codigo", "leituras", "aparelhos"])
    print()


def cmd_achar(a):
    if a.email:
        print("\nPagamentos com esse e-mail\n")
        tabela(sql("""
          select criado_em::date::text as dia, produto, valor_centavos, codigo, status
            from mercado_pagamentos
           where lower(email) = lower(%s)
           order by criado_em desc
        """ % esc(a.email)),
               ["dia", "produto", "valor_centavos", "codigo", "status"])
        print()
        return

    cod = a.codigo.strip().upper()
    print("\nAssinatura\n")
    tabela(sql("""
      select codigo, plano, expira_em::date::text as vence,
             (expira_em > now()) as ativa, renovacoes,
             coalesce(ultimo_uso::date::text, '-') as ultimo_uso
        from mercado_assinaturas where codigo = %s
    """ % esc(cod)), ["codigo", "plano", "vence", "ativa", "renovacoes", "ultimo_uso"])

    print("\nAparelhos usando o codigo\n")
    tabela(sql("""
      select dispositivo, primeiro_uso::date::text as desde,
             ultimo_uso::date::text as ate
        from mercado_codigo_dispositivos where codigo = %s
       order by ultimo_uso desc
    """ % esc(cod)), ["dispositivo", "desde", "ate"])

    print("\nLeituras nos ultimos 30 dias\n")
    tabela(sql("""
      select count(*) as leituras
        from mercado_analises
       where codigo_credito = %s and criado_em > now() - interval '30 days'
    """ % esc(cod)), ["leituras"])
    print()


def cmd_novo(a):
    cod = novo_codigo()
    plano = "anual" if int(a.meses) >= 12 else "mensal"
    # transaction_nsu e UNIQUE e NOT NULL: um codigo emitido a mao nao tem
    # pagamento na InfinitePay, entao carrega uma marca que diz isso.
    nsu = "MANUAL-" + cod
    sql("""
      insert into mercado_assinaturas
        (codigo, transaction_nsu, order_nsu, valor_centavos, plano, expira_em)
      values (%s, %s, 'manual', 0, %s, now() + make_interval(months => %d))
    """ % (esc(cod), esc(nsu), esc(plano), int(a.meses)))

    if a.email:
        # Com o e-mail gravado, ela recupera o codigo sozinha pelo app se
        # perder — sem precisar escrever para a Ana de novo.
        sql("""
          insert into mercado_pagamentos
            (transaction_nsu, order_nsu, produto, email, valor_centavos,
             codigo, status, detalhe)
          values (%s, 'manual', 'assinatura', %s, 0, %s, 'entregue', %s)
          on conflict (transaction_nsu) do nothing
        """ % (esc(nsu), esc(a.email), esc(cod), esc(a.motivo or "emitido a mao")))

    print("\n  Codigo: %s" % cod)
    print("  Vale por %d mes(es). Plano %s." % (int(a.meses), plano))
    if a.email:
        print("  Recuperavel pelo app com o e-mail %s." % a.email)
    print("\n  Mensagem pronta para enviar:\n")
    print("  Seu acesso ao RotuLens esta liberado! 🌸")
    print("  Codigo: %s" % cod)
    print("  Abra nutrianaluisarocha.com/mercado/, va em Conta e digite o codigo.\n")


def cmd_renovar(a):
    cod = a.codigo.strip().upper()
    r = sql("""
      update mercado_assinaturas
         set expira_em = greatest(expira_em, now()) + make_interval(months => %d),
             renovacoes = renovacoes + 1
       where codigo = %s
      returning codigo, plano, expira_em::date::text as vence
    """ % (int(a.meses), esc(cod)))
    if not r:
        print("\n  Nao achei o codigo %s.\n" % cod)
        return
    print("\n  %s agora vale ate %s (+%d mes(es)).\n"
          % (r[0]["codigo"], r[0]["vence"], int(a.meses)))


def cmd_pagamentos(a):
    print("\nPagamentos recebidos pelo webhook\n")
    tabela(sql("""
      select criado_em::date::text as dia, produto,
             coalesce(email, '-') as email, valor_centavos as centavos,
             coalesce(codigo, '-') as codigo, status
        from mercado_pagamentos
       where criado_em > now() - interval '%d days'
       order by criado_em desc
    """ % int(a.dias)), ["dia", "produto", "email", "centavos", "codigo", "status"])
    print("\n  status 'entregue' = codigo criado. Qualquer outro merece um olhar:")
    print("  a venda entrou e a pessoa pode estar sem acesso.\n")


p = argparse.ArgumentParser(description="Suporte do RotuLens")
sub = p.add_subparsers(dest="cmd", required=True)

s = sub.add_parser("uso"); s.add_argument("--dias", type=int, default=14); s.set_defaults(f=cmd_uso)
s = sub.add_parser("achar")
s.add_argument("--email"); s.add_argument("--codigo"); s.set_defaults(f=cmd_achar)
s = sub.add_parser("novo")
s.add_argument("--meses", type=int, required=True)
s.add_argument("--email"); s.add_argument("--motivo"); s.set_defaults(f=cmd_novo)
s = sub.add_parser("renovar")
s.add_argument("codigo"); s.add_argument("--meses", type=int, required=True)
s.set_defaults(f=cmd_renovar)
s = sub.add_parser("pagamentos"); s.add_argument("--dias", type=int, default=30)
s.set_defaults(f=cmd_pagamentos)

a = p.parse_args()
if a.cmd == "achar" and not (a.email or a.codigo):
    raise SystemExit("achar precisa de --email ou --codigo")
a.f(a)

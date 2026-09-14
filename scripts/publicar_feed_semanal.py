#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Publica a atualizacao semanal do Feed Cientifico.

A rotina na nuvem (segunda 8h) so deixa a branch feed/auto-AAAA-MM-DD no
GitHub: ela nao tem as credenciais da Hostinger. Sem este passo local as
branches se acumulavam e o feed ficou 4 semanas parado (18/08 a 14/09/2026).

Roda no Notebook-NutriAna (tarefa agendada "Anutri - Feed cientifico",
segunda 14h, ou assim que o notebook ligar):
  1. pega a branch de feed mais nova
  2. valida: o JS carrega, tem >= 6 cards, e todo DOI existe (Crossref ou PubMed)
  3. commita so o feed-data.js na main, carimba os assets e publica o app

Uso:  python scripts/publicar_feed_semanal.py [--aplicar]
      sem --aplicar so valida e mostra o que faria
"""
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALVO = "prototipo/assets/js/feed-data.js"
HTMLS = ["prototipo/index.html", "prototipo/artigo.html"]
DEPLOY = "H:/Meu Drive/Skills/Skills Autorais/Gerar-Site-Nutri/scripts/deploy.py"
LOG = os.path.join(RAIZ, "scripts", "publicar_feed_semanal.log")
UA = {"User-Agent": "anutri-feed/1.0 (nutrianalrocha@gmail.com)"}


def log(msg):
    linha = datetime.now().strftime("%Y-%m-%d %H:%M ") + msg
    print(linha)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(linha + "\n")


def git(*args, check=True):
    r = subprocess.run(["git", *args], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8")
    if check and r.returncode != 0:
        raise RuntimeError("git " + " ".join(args) + ": " + r.stderr.strip())
    return r.stdout


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.load(r)


def doi_existe(doi):
    try:
        get_json("https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="/()"))
        return True
    except Exception:
        pass
    # recem-publicado as vezes ainda nao esta no Crossref, mas ja esta no PubMed
    try:
        termo = urllib.parse.quote('"%s"[AID]' % doi)
        j = get_json("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&term=" + termo)
        return int(j["esearchresult"]["count"]) > 0
    except Exception:
        return False


def carregar_cards(codigo):
    """Executa o feed-data.js num Chromium de verdade: pega erro de sintaxe."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        dados = pg.evaluate("(c) => { new Function(c)(); return window.FEED_DATA; }", codigo)
        b.close()
    return dados


def main():
    aplicar = "--aplicar" in sys.argv
    git("fetch", "origin", "--prune", "--quiet")
    branches = sorted(re.findall(r"origin/feed/auto-\d{4}-\d{2}-\d{2}", git("branch", "-r")))
    if not branches:
        log("nenhuma branch de feed no GitHub")
        return 0
    nova = branches[-1]
    codigo = git("show", nova + ":" + ALVO)
    if codigo == git("show", "HEAD:" + ALVO):
        log(nova + " ja esta na main - nada a fazer")
        return 0

    dados = carregar_cards(codigo)
    cards = (dados or {}).get("cards") or []
    if len(cards) < 6:
        log("REPROVADO %s: so %d cards" % (nova, len(cards)))
        return 1
    dois = [c["fonte"]["doi"] for c in cards if c.get("fonte") and c["fonte"].get("doi")]
    falhos = [d for d in dois if not doi_existe(d)]
    if falhos:
        log("REPROVADO %s: DOI nao encontrado %s" % (nova, falhos))
        return 1
    log("%s valida: %d cards, %d DOIs conferidos" % (nova, len(cards), len(dois)))
    if not aplicar:
        log("(simulacao - rode com --aplicar para publicar)")
        return 0

    with open(os.path.join(RAIZ, ALVO), "w", encoding="utf-8", newline="") as f:
        f.write(codigo)
    subprocess.run([sys.executable, "scripts/versionar_assets.py"], cwd=RAIZ, check=True)
    git("add", ALVO, *HTMLS)
    git("commit", "-m", "Feed cientifico: publica " + nova.split("/", 1)[1], "--", ALVO, *HTMLS)

    r = subprocess.run([sys.executable, DEPLOY, "app", "--aplicar"], cwd=RAIZ,
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        log("ERRO no deploy: " + (r.stderr or r.stdout).strip()[-500:])
        return 1
    log("publicado no app.nutrianaluisarocha.com")

    push = subprocess.run(["git", "push", "origin", "HEAD:main"], cwd=RAIZ, capture_output=True, text=True)
    if push.returncode != 0:
        log("aviso: push para o GitHub falhou (o app ja esta no ar): " + push.stderr.strip()[-300:])
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        log("ERRO: %s" % e)
        sys.exit(1)

# -*- coding: utf-8 -*-
"""Confere a vitrine publicada: renderiza, filtros carregam, painel do
celular abre, atalho de preco vira pilula e mexe na URL. Sem screenshot:
tudo medido no DOM."""
import sys
from playwright.sync_api import sync_playwright

URL = "https://app.nutrianaluisarocha.com/encontre-sua-nutri"
PERFIL = r"C:\Users\Nutri Ana Luisa\.claude\chromium-profile"
erros, ok, falhas = [], [], []

def checa(nome, cond, detalhe=""):
    (ok if cond else falhas).append("%s %s" % (nome, detalhe))

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(PERFIL, headless=True, viewport={"width": 1280, "height": 900})
    pg = ctx.new_page()
    pg.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: erros.append("pageerror: %s" % e))
    pg.goto(URL, wait_until="networkidle", timeout=60000)

    checa("quiz sumiu", pg.locator(".quiz").count() == 0)
    checa("coluna de filtros", pg.locator(".vit-filtros").is_visible())
    checa("grupos de filtro = 5", pg.locator(".fgrupo").count() == 5, "(%d)" % pg.locator(".fgrupo").count())
    n_temas = pg.locator("#temas input[type=checkbox]").count()
    checa("especialidades carregaram", n_temas > 0, "(%d)" % n_temas)
    n_uf = pg.locator("#estado option").count()
    checa("estados carregaram", n_uf > 1, "(%d options)" % n_uf)
    checa("contador preenchido", pg.locator("#contador").inner_text().strip() not in ("", "Buscando…"),
          "-> %r" % pg.locator("#contador").inner_text().strip())
    checa("ordenacao visivel", pg.locator("#ordem").is_visible())
    checa("botao Filtros escondido no desktop", not pg.locator("#abrir-filtros").is_visible())

    # atalho de preco -> pilula + URL
    pg.locator("#atalhos-preco button").first.click()
    pg.wait_for_timeout(1800)
    checa("atalho marcou", "is-on" in (pg.locator("#atalhos-preco button").first.get_attribute("class") or ""))
    checa("pilula apareceu", pg.locator(".pilula").count() > 0, "(%d)" % pg.locator(".pilula").count())
    checa("URL guardou o filtro", "max=150" in pg.url, "-> %s" % pg.url)
    checa("botao limpar apareceu", pg.locator("#limpar").is_visible())
    # remover pela pilula
    pg.locator(".pilula").first.click()
    pg.wait_for_timeout(1800)
    checa("pilula removeu o filtro", pg.locator(".pilula").count() == 0 and "max=" not in pg.url, "-> %s" % pg.url)

    # ordenar por valor
    pg.select_option("#ordem", "preco_asc")
    pg.wait_for_timeout(1800)
    checa("ordem foi pra URL", "ordem=preco_asc" in pg.url, "-> %s" % pg.url)
    checa("sem faixa de destaque ao ordenar por valor", pg.locator(".faixa__titulo").count() == 0)

    # ---- celular ----
    pg2 = ctx.new_page()
    pg2.on("console", lambda m: erros.append("mob: " + m.text) if m.type == "error" else None)
    pg2.set_viewport_size({"width": 390, "height": 844})
    pg2.goto(URL, wait_until="networkidle", timeout=60000)
    checa("mob: botao Filtros visivel", pg2.locator("#abrir-filtros").is_visible())
    checa("mob: painel fechado de inicio", not pg2.locator(".vit-filtros").is_visible())
    pg2.locator("#abrir-filtros").click()
    pg2.wait_for_timeout(500)
    checa("mob: painel abriu", pg2.locator(".vit-filtros").is_visible())
    checa("mob: X visivel", pg2.locator("#fechar-filtros").is_visible())
    pg2.locator("#fechar-filtros").click()
    pg2.wait_for_timeout(400)
    checa("mob: painel fechou", not pg2.locator(".vit-filtros").is_visible())
    larg = pg2.evaluate("document.documentElement.scrollWidth")
    checa("mob: sem rolagem lateral", larg <= 391, "(scrollWidth=%d)" % larg)
    ctx.close()

print("OK (%d):" % len(ok))
for o in ok: print("  +", o)
print("\nFALHAS (%d):" % len(falhas))
for f in falhas: print("  X", f)
print("\nERROS DE CONSOLE (%d):" % len(erros))
for e in erros[:10]: print("  !", e)

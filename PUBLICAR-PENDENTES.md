# Publicar o que está pendente (para o Claude do notebook)

> Instruções para o Claude Code rodando no Notebook-NutriAna, dentro da pasta
> da Plataforma. Execute os passos em ordem e pare no primeiro erro, contando
> à Ana o que aconteceu.

O que está esperando publicação (commits no `main`):
- cardápio de verão (modelo de plano + receitas — migrations 0101 e 0102);
- antropometria estilo WebDiet (evolução no portal da paciente, comparativo,
  "Nova avaliação"), janela de **APAGAR** para confirmar exclusões e alimentos
  de marca (Growth, Dux, Essential, Nutrify, Flormel, Hey!Mu, A Tal da Castanha,
  colágeno, creatina) — migration 0103.

## Passo a passo

1. **Atualizar a cópia local**
   ```
   git pull origin main
   ```
   Se houver conflito, pare e avise a Ana (não descarte nada).

2. **Carimbar as versões dos assets** (para o navegador não usar cache velho)
   ```
   python scripts/versionar_assets.py
   ```

3. **Publicar o app na Hostinger**
   ```
   python "H:/Meu Drive/Skills/Skills Autorais/Gerar-Site-Nutri/scripts/deploy.py" app --aplicar
   ```
   (É o mesmo comando que `scripts/publicar_feed_semanal.py` usa.)

4. **Aplicar as migrations no Supabase** — só as que ainda não foram aplicadas.
   Todas são reexecutáveis (não duplicam nada), então rodar de novo é seguro:
   ```
   python apply_migration_api.py supabase/migrations/0101_ic_receitas_verao.sql --yes
   python apply_migration_api.py supabase/migrations/0102_ic_receitas_verao_praticas.sql --yes
   python apply_migration_api.py supabase/migrations/0103_avaliacoes_backfill.sql --yes
   ```

5. **Guardar o carimbo do passo 2**
   ```
   git add -A prototipo
   git commit -m "Versiona os assets do deploy"
   git push origin HEAD:main
   ```
   (Se o passo 2 não mudou nada, pule este passo.)

6. **Conferir no ar** (app.nutrianaluisarocha.com, recarregar com Ctrl+Shift+R):
   - apagar qualquer item pede para digitar **APAGAR**;
   - na ficha de uma paciente, Antropometria abre com o gráfico no topo e o botão
     **＋ Nova avaliação**;
   - no Planejamento Alimentar, buscar "whey growth" e "heymu" encontra os produtos;
   - o modelo **☀️ Verão leve e refrescante** aparece em "Ou use um modelo pronto";
   - na biblioteca de receitas, buscar "verão" traz as receitas de verão.

Ao terminar, conte à Ana o que foi publicado e o resultado da conferência.

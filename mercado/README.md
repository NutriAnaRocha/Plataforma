# No mercado com a Nutri Ana

App gratuito e instalável em que a pessoa fotografa o rótulo de um produto no
supermercado e recebe, na hora: a leitura da tabela, a explicação dos
ingredientes que ninguém entende e — quando o produto não é boa escolha —
**pelo menos três marcas** para levar no lugar.

Onde cada pedaço mora:

| Parte | Caminho |
|---|---|
| App (telas, PWA) | `Sites/site/mercado/` |
| Chamada de IA + regras | `Plataforma Nutri/supabase/functions/analisar-rotulo/` |
| Banco (tabelas, RLS) | `Plataforma Nutri/supabase/migrations/0051_mercado_com_a_nutri.sql` |
| Base de produtos | esta pasta (`importar_off.py`, `carregar_produtos.py`) |
| Divulgação | seção `#app` em `Sites/site/index.html` |

Endereço: **https://nutrianarocha.github.io/site/mercado/**

---

## As três decisões que explicam o resto

**1. A foto não é guardada em lugar nenhum.**
Diferente do diário do prato (migração 0050), aqui não existe bucket. A imagem
vai em base64 no corpo da chamada, é lida pelo modelo e morre ali. Rótulo de
produto não tem valor clínico depois de lido, e o app aceita gente sem conta —
guardar foto de quem não tem `auth.uid()` criaria arquivo sem dono.

**2. As marcas vêm de uma base real, nunca da memória do modelo.**
A tabela `mercado_produtos` é um espelho do recorte brasileiro da
[Open Food Facts](https://br.openfoodfacts.org). O modelo apenas **escolhe**
dentro de uma lista que já existe na prateleira e escreve o porquê — ele nunca
inventa um produto. Num app que dá indicação de compra assinada por uma
nutricionista registrada, marca alucinada é risco profissional da Ana.

**3. A regra das três marcas está no código, não na boa vontade.**
Indicação de produto só se sustenta se não favorecer marca. Então: nunca menos
de três, sempre de **marcas diferentes**, e se a base não conseguir oferecer as
três, o app não indica nenhuma e diz isso em voz alta. A checagem acontece duas
vezes — antes de perguntar ao modelo e depois da resposta dele.

---

## Por que espelhar a Open Food Facts em vez de consultar ao vivo

A API de **busca** da OFF limita a ~10 requisições por minuto e devolve `503`
acima disso (medido: metade das categorias falhou numa sondagem sem pausa). As
edge functions da Supabase saem por poucos IPs compartilhados, então duas
pessoas usando o app ao mesmo tempo já derrubariam a busca de alternativas.

Espelhado, a busca vira uma query SQL local: instantânea, sem limite e imune à
OFF sair do ar. O dump mundial (1,2 GB comprimido) foi descartado por peso — o
recorte por categoria entrega o que o app usa por uma fração disso.

## Atualizar a base de produtos

A OFF recebe produto novo toda semana. Para atualizar (dá para rodar quantas
vezes quiser — a chave é o código de barras e nada duplica):

```bash
cd "Plataforma Nutri/mercado"
python importar_off.py --paginas 3        # ~50 min, respeitando o limite da OFF
python carregar_produtos.py               # sobe para o Postgres
```

Se alguma categoria voltar com `0 utilizaveis`, foi `503` — repasse só nela:

```bash
python importar_off.py --somente olive-oils,honeys,granolas --anexar
python carregar_produtos.py
```

Só entra na base produto com **nome, energia, açúcar e sódio por 100 g**. Sem
esses números não há comparação possível, e uma alternativa sem tabela seria a
Ana recomendando às cegas.

## Limites diários (freio de custo)

A conta da OpenAI é da Ana e o app é grátis, então o teto é de sobrevivência,
não comercial. Ficam no topo de `analisar-rotulo/index.ts`:

| Quem | Leituras por dia |
|---|---|
| Visitante (sem entrar) | 5 |
| Paciente da Ana ou a própria nutri | 40 |
| O app inteiro | 600 |

Quem tem acesso liberado é decidido pela função `mercado_acesso_liberado`, no
banco: tem ficha de paciente, ou é nutri. É o ponto único a mexer quando isso
virar assinatura paga.

## Conformidade (Res. CFN 856/2026)

- O app faz **orientação geral sobre leitura de rótulo** — não é avaliação
  nutricional individualizada nem prescrição. Está escrito na tela de resultado
  e na tela de conta.
- **Art. 37** (conteúdo com IA): declarado em toda leitura e no rodapé.
- **Indicação de marca**: nunca menos de três, sempre de marcas diferentes, com
  a origem do dado declarada e a informação de que a Ana não recebe de nenhuma.
- O prompt proíbe diagnosticar, prescrever, prometer resultado, falar em doença
  e moralizar comida ("veneno", "pecado", "engorda").
- As explicações fixas de **diet/light** são escritas no servidor, não pelo
  modelo — têm definição em lei (Portaria SVS/MS 29/1998 e RDC 54/2012) e num
  teste o modelo simplesmente ignorou a instrução de incluí-las.

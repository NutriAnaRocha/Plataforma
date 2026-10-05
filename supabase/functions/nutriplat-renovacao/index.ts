// ============================================================
//  nutriplat-renovacao — o aviso de renovação da assinatura (17/09/2026)
//
//  A InfinitePay não tem cobrança recorrente com webhook por nutri (ver
//  nutriplat-pagamento), então a renovação é ASSISTIDA: todo dia às 9h
//  (cron do banco, migração 0100) esta função pergunta ao banco quem está
//  para vencer e manda um e-mail com o botão de pagar.
//
//  Quem avisar sai de renovacoes_a_avisar(); cada envio é registrado em
//  renovacao_avisos (user + tipo + data do vencimento), então rodar duas
//  vezes no mesmo dia não manda e-mail repetido.
//
//  Sem RESEND_API_KEY a função NÃO falha: registra o aviso como não
//  enviado (canal 'sem_provedor') e devolve o resumo — o banner dentro do
//  app continua avisando de qualquer jeito.
//
//  Proteção: verify_jwt = false (o cron do banco não tem JWT); quem chama
//  precisa mandar o header x-cron-secret igual ao secret CRON_SECRET.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const APP = "https://nutriplat.com.br";
const LINK = `${APP}/assinatura?renovar=1`;
const SUPORTE = "nutrianalrocha@gmail.com";

type Alvo = {
  user_id: string; email: string; nome: string | null;
  tipo: string; referencia: string; dias: number; ciclo: string; preco: number;
};

const reais = (centavos: number) =>
  "R$ " + (centavos / 100).toFixed(2).replace(".", ",");

const dataBR = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

const primeiroNome = (n: string | null) => (n || "").trim().split(/\s+/)[0] || "";

// Assunto + miolo de cada aviso. O texto fala com a nutri, não com o sistema.
function texto(a: Alvo): { assunto: string; titulo: string; corpo: string; botao: string } {
  const nome = primeiroNome(a.nome);
  const ola = nome ? `Oi, ${nome}!` : "Oi!";
  const valor = reais(a.preco);
  const quando = dataBR(a.referencia);
  const cicloTxt = a.ciclo === "anual" ? "do plano anual"
    : a.ciclo === "semestral" ? "do plano semestral" : "da mensalidade";

  switch (a.tipo) {
    case "trial_3d":
      return {
        assunto: "Faltam 3 dias do seu teste na NutriPlat",
        titulo: "Seu teste termina em 3 dias",
        corpo: `${ola} Seu período de teste vai até <strong>${quando}</strong>. Para continuar com os seus pacientes, ` +
          `o prontuário e a agenda no ar — e aparecer em <em>Encontre sua nutri</em> — é só assinar por <strong>${valor}</strong>. ` +
          `Os dias de teste que ainda faltam continuam valendo.`,
        botao: "Assinar agora",
      };
    case "trial_fim":
      return {
        assunto: "Seu teste na NutriPlat termina hoje",
        titulo: "Último dia do seu teste",
        corpo: `${ola} Hoje é o último dia do seu teste. Assinando por <strong>${valor}</strong> você continua ` +
          `exatamente de onde parou: nada é apagado.`,
        botao: "Assinar agora",
      };
    case "vence_5d":
      return {
        assunto: `Sua assinatura da NutriPlat vence em 5 dias (${quando})`,
        titulo: "Sua assinatura vence em 5 dias",
        corpo: `${ola} O pagamento ${cicloTxt} vence em <strong>${quando}</strong>. ` +
          `É só clicar no botão abaixo para pagar <strong>${valor}</strong> pelo Pix ou cartão.`,
        botao: "Renovar agora",
      };
    case "vence_1d":
      return {
        assunto: "Sua assinatura da NutriPlat vence amanhã",
        titulo: "Sua assinatura vence amanhã",
        corpo: `${ola} O pagamento ${cicloTxt} vence <strong>amanhã (${quando})</strong>. ` +
          `Renovando hoje por <strong>${valor}</strong>, seu acesso e o seu perfil na vitrine não param.`,
        botao: "Renovar agora",
      };
    case "venceu":
      return {
        assunto: "Sua assinatura da NutriPlat venceu ontem",
        titulo: "Sua assinatura venceu",
        corpo: `${ola} O pagamento ${cicloTxt} venceu em <strong>${quando}</strong>. ` +
          `Você ainda tem 2 dias de acesso liberado para não perder nada. ` +
          `Renove por <strong>${valor}</strong> e seguimos normalmente.`,
        botao: "Renovar agora",
      };
    default: // bloqueio
      return {
        assunto: "Último dia de acesso à NutriPlat",
        titulo: "Hoje é o último dia de acesso",
        corpo: `${ola} Sua assinatura venceu em <strong>${quando}</strong> e hoje termina o prazo extra. ` +
          `A partir de amanhã o acesso fica bloqueado — <strong>seus dados continuam guardados</strong> e voltam ` +
          `no mesmo lugar assim que você renovar por <strong>${valor}</strong>.`,
        botao: "Renovar e voltar",
      };
  }
}

function html(a: Alvo): string {
  const t = texto(a);
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f6f4f2;padding:24px;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#2b2b2b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e1dd">
    <tr><td style="background:#1C5B57;padding:20px 24px;color:#fff;font-size:18px;font-weight:700">NutriPlat</td></tr>
    <tr><td style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.25;color:#1C5B57">${t.titulo}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6">${t.corpo}</p>
      <a href="${LINK}" style="display:inline-block;background:#1C5B57;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px">${t.botao}</a>
      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b">
        O botão abre a sua área de assinatura já com o valor certo. Pagamento pela InfinitePay (Pix, cartão ou parcelado).<br />
        Qualquer dúvida, responda este e-mail ou escreva para ${SUPORTE}.
      </p>
    </td></tr>
  </table></body></html>`;
}

async function enviar(a: Alvo, key: string, de: string): Promise<{ ok: boolean; detalhe: string }> {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: de,
        to: [a.email],
        reply_to: SUPORTE,
        subject: texto(a).assunto,
        html: html(a),
      }),
    });
    const resposta = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, detalhe: `resend_${r.status}: ${JSON.stringify(resposta).slice(0, 180)}` };
    return { ok: true, detalhe: String((resposta as { id?: string })?.id || "") };
  } catch (e) {
    return { ok: false, detalhe: String(e).slice(0, 180) };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SEGREDO = Deno.env.get("CRON_SECRET");
  if (!SEGREDO) return json({ error: "sem_cron_secret" }, 503);
  if (req.headers.get("x-cron-secret") !== SEGREDO) return json({ error: "nao_autorizado" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let seco = false;
  try { seco = (await req.json())?.seco === true; } catch { /* corpo vazio: envio normal */ }

  const { data, error } = await admin.rpc("renovacoes_a_avisar");
  if (error) return json({ ok: false, error: error.message }, 500);
  const alvos = (data || []) as Alvo[];
  if (seco) return json({ ok: true, seco: true, total: alvos.length, alvos });

  const KEY = Deno.env.get("RESEND_API_KEY");
  const DE = Deno.env.get("EMAIL_REMETENTE"); // "NutriPlat <contato@seudominio.com>"
  const resumo: Record<string, number> = {};
  let enviados = 0, falhas = 0;

  for (const a of alvos) {
    resumo[a.tipo] = (resumo[a.tipo] || 0) + 1;
    let ok = false, canal = "sem_provedor", detalhe = "RESEND_API_KEY ausente";
    if (KEY && DE) {
      canal = "email";
      const r = await enviar(a, KEY, DE);
      ok = r.ok; detalhe = r.detalhe;
    }
    ok ? enviados++ : falhas++;
    await admin.rpc("registrar_aviso_renovacao", {
      p_user: a.user_id, p_tipo: a.tipo, p_ref: a.referencia,
      p_canal: canal, p_ok: ok, p_detalhe: detalhe,
    });
  }

  return json({ ok: true, total: alvos.length, enviados, falhas, por_tipo: resumo, email: !!(KEY && DE) });
});

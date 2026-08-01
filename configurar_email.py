#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Liga o SMTP próprio no Supabase e troca os 3 e-mails de autenticação
(convite, redefinir senha, confirmar e-mail) do padrão em inglês para o
texto em português da Ana.

POR QUE OS DOIS JUNTOS: no plano gratuito, o Supabase recusa template
customizado enquanto o projeto usa o serviço de e-mail embutido
("Email template modification is not available for free tier projects
using the default email provider"). Sem SMTP próprio não há tradução —
então é uma coisa só.

Uso:  python configurar_email.py --host smtp.resend.com --port 465 \
          --user resend --pass re_xxx --de contato@seudominio.com.br
      python configurar_email.py --so-templates      (SMTP já configurado)

Credenciais do Supabase: ~/.claude/.nutri-supabase-credentials
Passo a passo de onde tirar host/user/senha: PASSO-A-PASSO-EMAIL.md
"""
import sys, os, json, argparse, urllib.request, urllib.error

CRED = os.path.join(os.path.expanduser("~"), ".claude", ".nutri-supabase-credentials")
VINHO = "#840B55"
REMETENTE_NOME = "Ana Luísa Rocha — Nutricionista"


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


# ---------------------------------------------------------------- templates
def pagina(titulo, corpo, rotulo_botao, rodape_extra=""):
    """Um só molde para os três e-mails: mesma caixa branca sobre fundo
    rosado, mesmo botão, mesma assinatura com CRN. E-mail não tem CSS
    externo nem flexbox confiável — por isso tudo é style inline."""
    return f"""<div style="margin:0;padding:24px 12px;background:#faf7f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3a3a3a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px 28px;border:1px solid #efe6ea">
    <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:{VINHO}">{titulo}</h1>
    {corpo}
    <p style="margin:28px 0 8px">
      <a href="{{{{ .ConfirmationURL }}}}" style="display:inline-block;background:{VINHO};color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:99px">{rotulo_botao}</a>
    </p>
    <p style="margin:18px 0 0;font-size:13px;color:#8a8a8a">Se o botão não funcionar, copie e cole este endereço no navegador:<br>
      <span style="word-break:break-all">{{{{ .ConfirmationURL }}}}</span></p>
    {rodape_extra}
    <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #efe6ea;font-size:13px;color:#8a8a8a">
      Ana Luísa Rocha — Nutricionista · CRN 25100401
    </p>
  </div>
</div>"""


# O MESMO convite serve a quem compra e-book, a quem entra no programa
# "Meu Plano" e à nutri convidada — por isso é caloroso, mas não cita
# produto nenhum: citar sairia errado em dois dos três casos.
INVITE = pagina(
    "Sua conta está pronta 🌸",
    '<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Que bom ter você por aqui. Para entrar, '
    'falta só criar a sua senha — é com ela que você acessa pelo celular ou pelo computador.</p>'
    '<p style="margin:0;font-size:15px;line-height:1.6">O link abaixo vale por pouco tempo. '
    'Se ele expirar, use a opção <strong>“Esqueci minha senha”</strong> na tela de entrada.</p>',
    "Criar minha senha",
)

RECOVERY = pagina(
    "Defina uma nova senha",
    '<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Recebi um pedido para redefinir a senha da sua conta. '
    'É só clicar no botão abaixo e escolher uma nova.</p>',
    "Criar nova senha",
    rodape_extra='<p style="margin:16px 0 0;font-size:13px;color:#8a8a8a">'
                 'Se não foi você quem pediu, pode ignorar este e-mail — a sua senha continua a mesma.</p>',
)

CONFIRMATION = pagina(
    "Confirme o seu e-mail",
    '<p style="margin:0;font-size:15px;line-height:1.6">Falta um passo para concluir o seu cadastro: '
    'confirme que este e-mail é seu.</p>',
    "Confirmar meu e-mail",
)

TEMPLATES = {
    "mailer_subjects_invite": "Sua conta está pronta — crie a sua senha",
    "mailer_templates_invite_content": INVITE,
    "mailer_subjects_recovery": "Redefinir a sua senha",
    "mailer_templates_recovery_content": RECOVERY,
    "mailer_subjects_confirmation": "Confirme o seu e-mail",
    "mailer_templates_confirmation_content": CONFIRMATION,
}


# ---------------------------------------------------------------- API
def patch_auth(pat, ref, body):
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/%s/config/auth" % ref,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + pat,
            "Content-Type": "application/json",
            # O WAF da Supabase bloqueia o User-Agent padrão do urllib (403).
            "User-Agent": "claude-code-nutri/1.0",
        },
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode("utf-8")[:500]
        raise SystemExit("ERRO HTTP %s — %s" % (e.code, detalhe))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host"); ap.add_argument("--port", type=int, default=465)
    ap.add_argument("--user"); ap.add_argument("--pass", dest="senha")
    ap.add_argument("--de", help="endereço remetente, ex.: contato@seudominio.com.br")
    ap.add_argument("--so-templates", action="store_true",
                    help="só troca os textos; assume SMTP já configurado")
    a = ap.parse_args()

    cr = load_creds()
    pat, ref = cr.get("SUPABASE_PAT"), cr.get("PROJECT_REF")
    if not pat or not ref:
        raise SystemExit("Faltam SUPABASE_PAT/PROJECT_REF em " + CRED)

    body = dict(TEMPLATES)
    if not a.so_templates:
        if not all([a.host, a.user, a.senha, a.de]):
            raise SystemExit("Faltam --host/--user/--pass/--de (ou use --so-templates).")
        body.update({
            "smtp_host": a.host,
            "smtp_port": a.port,
            "smtp_user": a.user,
            "smtp_pass": a.senha,
            "smtp_admin_email": a.de,
            "smtp_sender_name": REMETENTE_NOME,
        })
        # O limite padrão do Supabase é baixo demais para um dia de
        # lançamento (convite + reenvio + "esqueci a senha" no mesmo dia).
        body["rate_limit_email_sent"] = 100

    r = patch_auth(pat, ref, body)
    print("SMTP  :", r.get("smtp_host") or "(embutido do Supabase)")
    print("De    :", r.get("smtp_admin_email") or "—", "/", r.get("smtp_sender_name") or "—")
    for k in ("invite", "recovery", "confirmation"):
        assunto = r.get("mailer_subjects_" + k)
        corpo = r.get("mailer_templates_%s_content" % k) or ""
        print("%-13s %-45r %d chars" % (k, assunto, len(corpo)))
    print("\nOK. Teste agora: convide um e-mail seu em Authentication > Users > Invite.")


if __name__ == "__main__":
    main()

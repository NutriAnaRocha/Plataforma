-- ============================================================
--  Plataforma Nutri — Migração 0071
--  ENVIOS DE WHATSAPP: registro de cada mensagem que saiu.
--
--  Fase 1 do envio é assistida (canal 'link'): a plataforma monta o
--  texto já com as variáveis resolvidas e abre a conversa; a nutri
--  aperta enviar no WhatsApp. Como o app do WhatsApp não devolve
--  confirmação, o que gravamos aqui é o que a plataforma ENTREGOU
--  para envio — por isso não existe status 'entregue'/'lida'.
--  Quando entrar a Cloud API oficial (fase 2), o mesmo registro passa
--  a receber canal 'cloud_api' + status vindo do webhook.
--
--  O texto é gravado RESOLVIDO (com nome/data já trocados): é ele que
--  vira histórico na aba Comunicação da ficha, e o modelo pode mudar
--  depois sem reescrever o passado.
-- ============================================================

create table if not exists public.whatsapp_envios (
  id               uuid primary key default gen_random_uuid(),
  nutricionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paciente_id      uuid references public.pacientes(id) on delete set null,
  paciente_nome    text not null default '',       -- denormalizado: histórico sobrevive à ficha
  consulta_id      uuid references public.consultas(id) on delete set null,
  template_id      text not null,                  -- 'lembrete_24h', 'custom_...', 'livre'
  titulo           text,                           -- rótulo da automação no momento do envio
  telefone         text not null,                  -- só dígitos, com DDI (ex.: 5521994094557)
  texto            text not null,                  -- mensagem final, variáveis já resolvidas
  canal            text not null default 'link',   -- 'link' = api.whatsapp.com/send (assistido)
  enviado_em       timestamptz not null default now()
);

-- 'wa.me' fica aceito por compatibilidade com os primeiros registros: o
-- encurtador wa.me estraga emoji de 4 bytes (💜 vira "?") no redirect, então
-- o link montado passou a ser api.whatsapp.com/send.
alter table public.whatsapp_envios drop constraint if exists whatsapp_envios_canal_chk;
alter table public.whatsapp_envios add constraint whatsapp_envios_canal_chk
  check (canal in ('link', 'wa.me', 'cloud_api'));

create index if not exists whatsapp_envios_nutri_idx
  on public.whatsapp_envios (nutricionista_id, enviado_em desc);
create index if not exists whatsapp_envios_pac_idx
  on public.whatsapp_envios (paciente_id, enviado_em desc);

alter table public.whatsapp_envios enable row level security;

-- A nutri dona do envio gerencia os próprios registros.
drop policy if exists "whatsapp_envios_nutri_all" on public.whatsapp_envios;
create policy "whatsapp_envios_nutri_all" on public.whatsapp_envios
  for all to authenticated
  using (auth.uid() = nutricionista_id)
  with check (auth.uid() = nutricionista_id);

-- O paciente NÃO lê esta tabela: mensagem de WhatsApp ele já tem no
-- próprio celular, e aqui ficam também as que a nutri só preparou.

notify pgrst, 'reload schema';

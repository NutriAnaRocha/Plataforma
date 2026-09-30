-- ============================================================
--  Plataforma Nutri — Migração 0089
--  VÍNCULO PACIENTE ↔ NUTRI: trocar de profissional sem trocar de conta.
--
--  O que travava: pacientes_user_uidx (0003) era UNIQUE GLOBAL em user_id.
--  Um login de paciente só podia existir dentro da ficha de UMA nutri — se
--  ele quisesse outra profissional, precisava de outro e-mail. Num diretório
--  isso quebra no primeiro paciente que troca.
--
--  O que passa a valer: unique (nutricionista_id, user_id). Cada nutri tem no
--  máximo uma ficha daquele login; o mesmo login pode existir em fichas de
--  nutris diferentes, e o histórico com a anterior fica preservado do lado dela.
--
--  Deliberadamente NÃO mexemos na ficha da nutri anterior ao aceitar um novo
--  vínculo: a carteira de uma nutri não pode ser alterada pela ação de outra.
--  Quem diz qual acompanhamento está valendo é o paciente, em
--  paciente_preferencias.nutri_ativa_id — é o que o portal abre por padrão.
-- ============================================================

-- ------------------------------------------------------------
-- 1) O índice.
-- ------------------------------------------------------------
drop index if exists public.pacientes_user_uidx;

create unique index if not exists pacientes_user_nutri_uidx
  on public.pacientes (nutricionista_id, user_id) where user_id is not null;

-- De onde veio cada ficha — separa quem a nutri cadastrou do que a vitrine trouxe.
alter table public.pacientes
  add column if not exists origem text not null default 'manual';

alter table public.pacientes drop constraint if exists pacientes_origem_chk;
alter table public.pacientes add constraint pacientes_origem_chk
  check (origem in ('manual','convite','diretorio','programa','importado'));

-- Qual acompanhamento o paciente considera o atual (o portal abre este).
alter table public.paciente_preferencias
  add column if not exists nutri_ativa_id uuid references public.profiles(id) on delete set null;

-- ------------------------------------------------------------
-- 2) aceitar_solicitacao(): o aceite cria a ficha.
--    SECURITY DEFINER porque precisa ler a solicitação e escrever em
--    pacientes numa transação só; a checagem de dono é explícita.
-- ------------------------------------------------------------
create or replace function public.aceitar_solicitacao(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s        public.solicitacoes_atendimento%rowtype;
  v_pac_id uuid;
  v_ini    text;
begin
  select * into s from public.solicitacoes_atendimento where id = p_id;
  if s.id is null then raise exception 'solicitação não encontrada'; end if;
  if s.nutricionista_id <> auth.uid() then
    raise exception 'esta solicitação não é sua';
  end if;
  if s.status <> 'nova' then
    raise exception 'esta solicitação já foi respondida';
  end if;

  -- Já existe ficha desse login com esta nutri? Reaproveita (paciente que
  -- volta depois de um tempo não vira ficha duplicada).
  select id into v_pac_id
    from public.pacientes
   where nutricionista_id = s.nutricionista_id and user_id = s.paciente_user_id
   limit 1;

  if v_pac_id is null then
    -- Iniciais no padrão da carteira (primeiro + último nome).
    v_ini := upper(
      left(split_part(trim(s.nome), ' ', 1), 1) ||
      coalesce(nullif(left(split_part(trim(s.nome), ' ',
        greatest(array_length(string_to_array(trim(s.nome), ' '), 1), 1)), 1), ''), '')
    );

    insert into public.pacientes (nutricionista_id, user_id, nome, ini, status, objetivo, contato, origem)
    values (
      s.nutricionista_id,
      s.paciente_user_id,
      s.nome,
      v_ini,
      'ativo',
      nullif(s.respostas->>'objetivo', ''),
      jsonb_strip_nulls(jsonb_build_object(
        'tel',    nullif(s.telefone, ''),
        'email',  nullif(s.email, ''),
        'cidade', nullif(s.respostas->>'cidade', '')
      )),
      'diretorio'
    )
    returning id into v_pac_id;
  end if;

  update public.solicitacoes_atendimento
     set status = 'aceita', paciente_id = v_pac_id, respondida_em = now()
   where id = p_id;

  -- Se o paciente ainda não tem acompanhamento marcado como atual, este vira.
  update public.paciente_preferencias
     set nutri_ativa_id = s.nutricionista_id, updated_at = now()
   where user_id = s.paciente_user_id and nutri_ativa_id is null;

  return v_pac_id;
end; $$;

-- ------------------------------------------------------------
-- 3) recusar_solicitacao(): recusar é normal (agenda cheia, caso fora da área).
--    O motivo é opcional para a nutri, mas quando existe chega ao paciente.
-- ------------------------------------------------------------
create or replace function public.recusar_solicitacao(p_id uuid, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.solicitacoes_atendimento%rowtype;
begin
  select * into s from public.solicitacoes_atendimento where id = p_id;
  if s.id is null then raise exception 'solicitação não encontrada'; end if;
  if s.nutricionista_id <> auth.uid() then
    raise exception 'esta solicitação não é sua';
  end if;
  if s.status <> 'nova' then
    raise exception 'esta solicitação já foi respondida';
  end if;

  update public.solicitacoes_atendimento
     set status = 'recusada',
         recusa_motivo = nullif(trim(coalesce(p_motivo, '')), ''),
         respondida_em = now()
   where id = p_id;
end; $$;

notify pgrst, 'reload schema';

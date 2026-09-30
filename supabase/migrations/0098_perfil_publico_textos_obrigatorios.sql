-- Perfil público completo: Sobre você, Quem atende e Como funciona passam a
-- ser obrigatórios para enviar à análise (espelha pendencias() em perfil-profissional.js).
CREATE OR REPLACE FUNCTION public.publicar_perfil()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.profiles%rowtype;
  v_slug text;
begin
  select * into r from public.profiles where id = auth.uid();
  if r.id is null then raise exception 'perfil não encontrado'; end if;

  if coalesce(r.tipo, 'nutri') <> 'nutri' then
    raise exception 'só o perfil de nutricionista vai para o diretório';
  end if;
  if r.avatar_url is null or length(r.avatar_url) < 32 then
    raise exception 'falta a sua foto';
  end if;
  if r.apresentacao is null or char_length(r.apresentacao) < 40 then
    raise exception 'escreva a sua apresentação (pelo menos 40 caracteres)';
  end if;
  if coalesce(nullif(trim(r.crn), ''), '') = '' then
    raise exception 'falta o seu CRN';
  end if;
  if coalesce(array_length(r.area_atuacao, 1), 0) = 0 then
    raise exception 'escolha pelo menos uma especialidade';
  end if;
  if coalesce(nullif(trim(r.cidade), ''), '') = ''
     or coalesce(nullif(trim(r.estado), ''), '') = '' then
    raise exception 'informe a cidade e o estado';
  end if;
  if not (r.atende_online or r.atende_presencial) then
    raise exception 'informe se atende online, presencial ou os dois';
  end if;
  -- Textos da página pública (0098): sem eles o paciente não tem o que avaliar.
  if char_length(trim(coalesce(r.bio, ''))) < 80 then
    raise exception 'escreva o Sobre você (pelo menos 80 caracteres)';
  end if;
  if char_length(trim(coalesce(r.publico_atendido, ''))) < 40 then
    raise exception 'escreva quem você atende (pelo menos 40 caracteres)';
  end if;
  if char_length(trim(coalesce(r.como_funciona, ''))) < 80 then
    raise exception 'explique como funciona a consulta (pelo menos 80 caracteres)';
  end if;
  -- É o Instagram (ou o site) que dá à Ana o que analisar antes de aprovar.
  if coalesce(nullif(trim(r.instagram), ''), '') = ''
     and coalesce(nullif(trim(r.site), ''), '') = '' then
    raise exception 'informe o seu Instagram ou o seu site';
  end if;

  -- Slug: respeita o escolhido; se não houver, deriva do nome e desempata.
  v_slug := public.slugify(coalesce(r.slug, r.nome));
  if v_slug is null then raise exception 'não consegui gerar o seu endereço; escolha um'; end if;
  if exists (select 1 from public.profiles p
              where lower(p.slug) = v_slug and p.id <> r.id) then
    if r.slug is not null then
      raise exception 'o endereço "%" já está em uso', v_slug;
    end if;
    v_slug := v_slug || '-' || substr(replace(r.id::text, '-', ''), 1, 4);
  end if;

  perform set_config('app.allow_curadoria', 'on', true);
  update public.profiles
     set slug = v_slug,
         perfil_status = 'em_analise',
         perfil_recusa_motivo = null
   where id = r.id;

  return v_slug;
end; $function$;

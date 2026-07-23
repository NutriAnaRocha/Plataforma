-- 0034 — Cálculos nutricionais (TMB/GET/VET) por paciente
-- Coluna jsonb aditiva na tabela pacientes. Guarda o último cálculo salvo:
-- { formula, sexo, idade, peso, altura, massaMagra, fatorAtividade, fatorInjuria,
--   objetivo, ajuste, tmb, get, vet, macros:{...}, memoria:[...], atualizadoEm }.
-- Aditiva e nullable: não afeta linhas nem RLS existentes.

alter table public.pacientes add column if not exists calculos jsonb;

comment on column public.pacientes.calculos is 'Último cálculo nutricional salvo (TMB/GET/VET + macros). Ver calculos.js.';

notify pgrst, 'reload schema';

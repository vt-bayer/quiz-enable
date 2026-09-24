-- Quiz ENABLE — execute no SQL Editor do Supabase
-- Usa apenas a Publishable key no front-end (RLS abaixo).

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_participante text not null check (tipo_participante in ('colaborador', 'terceiro')),
  matricula text,
  empresa text,
  pontos integer not null default 0,
  acertos integer not null default 0,
  tempo_segundos integer not null default 0,
  premio text,
  criado_em timestamptz not null default now()
);

-- Uma matrícula (não vazia) só pode participar uma vez
create unique index if not exists participantes_matricula_unica
  on public.participantes (matricula)
  where matricula is not null and btrim(matricula) <> '';

alter table public.participantes enable row level security;

-- Permissões de tabela para a API
grant select, insert, update, delete on table public.participantes to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Visitantes: inserir participação
drop policy if exists "anon_insert_participantes" on public.participantes;
create policy "anon_insert_participantes"
  on public.participantes
  for insert
  to anon, authenticated
  with check (true);

-- Visitantes: ler ranking
drop policy if exists "anon_select_participantes" on public.participantes;
create policy "anon_select_participantes"
  on public.participantes
  for select
  to anon, authenticated
  using (true);

-- Visitantes: atualizar prêmio da roleta
drop policy if exists "anon_update_premio" on public.participantes;
create policy "anon_update_premio"
  on public.participantes
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Administradores autenticados: excluir registros
drop policy if exists "auth_delete_participantes" on public.participantes;
create policy "auth_delete_participantes"
  on public.participantes
  for delete
  to authenticated
  using (auth.uid() is not null);

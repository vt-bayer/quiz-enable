-- Quiz ENABLE — schema fases / participações (SQL Editor do Supabase)
-- Fuso operacional: America/Sao_Paulo (aplicado no cliente)

create table if not exists public.fases (
  id text primary key,
  nome text not null,
  ordem integer not null,
  horario_inicio text not null,
  horario_fim text not null,
  status text not null default 'agendada',
  ativa_manual boolean not null default false,
  pausada_manual boolean not null default false,
  ranking_congelado boolean not null default false,
  embaralhar_perguntas boolean not null default true,
  data_evento date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.perguntas (
  id text primary key,
  fase_id text references public.fases(id),
  enunciado text not null,
  alternativas jsonb not null,
  explicacao text,
  dificuldade text not null check (dificuldade in ('facil', 'intermediaria', 'dificil')),
  ordem_na_fase integer not null default 0,
  status text not null default 'ativa' check (status in ('ativa', 'inativa', 'reserva')),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  tipo_publico text not null check (tipo_publico in ('bayer', 'parceiro')),
  empresa_parceira text,
  email text,
  matricula text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.participacoes (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid references public.participantes(id),
  participante_nome text not null,
  tipo_publico text not null check (tipo_publico in ('bayer', 'parceiro')),
  empresa_parceira text,
  fase_id text not null,
  fase_nome text not null,
  data_evento date,
  horario_inicio_fase text,
  horario_fim_fase text,
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluida', 'incompleta', 'expirada', 'cancelada')),
  quantidade_perguntas integer not null default 5,
  quantidade_acertos integer not null default 0,
  pontuacao integer not null default 0,
  tempo_total_segundos integer not null default 0,
  posicao_ranking integer,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists participacoes_unicas_fase_matricula
  on public.participacoes (fase_id, (coalesce(participante_nome, '')), tipo_publico)
  where status = 'concluida';

create table if not exists public.respostas (
  id uuid primary key default gen_random_uuid(),
  participacao_id uuid not null references public.participacoes(id) on delete cascade,
  pergunta_id text not null,
  alternativa_selecionada text,
  correta boolean not null default false,
  pontos_obtidos integer not null default 0,
  respondida_em timestamptz not null default now(),
  tempo_resposta_segundos integer
);

create unique index if not exists respostas_unicas
  on public.respostas (participacao_id, pergunta_id);

create table if not exists public.auditoria_administrativa (
  id uuid primary key default gen_random_uuid(),
  administrador_id text,
  acao text not null,
  entidade text,
  entidade_id text,
  valor_anterior text,
  novo_valor text,
  motivo text,
  criado_em timestamptz not null default now()
);

create table if not exists public.historico_exportacao (
  id uuid primary key default gen_random_uuid(),
  administrador_id text,
  formato text not null,
  filtros_aplicados jsonb,
  quantidade_registros integer,
  criado_em timestamptz not null default now()
);

alter table public.fases enable row level security;
alter table public.perguntas enable row level security;
alter table public.participantes enable row level security;
alter table public.participacoes enable row level security;
alter table public.respostas enable row level security;
alter table public.auditoria_administrativa enable row level security;
alter table public.historico_exportacao enable row level security;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;

drop policy if exists "pub_select_fases" on public.fases;
create policy "pub_select_fases" on public.fases for select to anon, authenticated using (true);

drop policy if exists "auth_all_fases" on public.fases;
create policy "auth_all_fases" on public.fases for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "pub_select_perguntas" on public.perguntas;
create policy "pub_select_perguntas" on public.perguntas for select to anon, authenticated using (true);

drop policy if exists "auth_all_perguntas" on public.perguntas;
create policy "auth_all_perguntas" on public.perguntas for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "pub_insert_participantes" on public.participantes;
create policy "pub_insert_participantes" on public.participantes for insert to anon, authenticated with check (true);

drop policy if exists "auth_select_participantes" on public.participantes;
create policy "auth_select_participantes" on public.participantes for select to authenticated using (auth.uid() is not null);

drop policy if exists "pub_insert_participacoes" on public.participacoes;
create policy "pub_insert_participacoes" on public.participacoes for insert to anon, authenticated with check (true);

drop policy if exists "pub_update_participacoes" on public.participacoes;
create policy "pub_update_participacoes" on public.participacoes for update to anon, authenticated using (true) with check (true);

drop policy if exists "pub_select_participacoes" on public.participacoes;
create policy "pub_select_participacoes" on public.participacoes for select to anon, authenticated using (true);

drop policy if exists "auth_delete_participacoes" on public.participacoes;
create policy "auth_delete_participacoes" on public.participacoes for delete to authenticated using (auth.uid() is not null);

drop policy if exists "pub_insert_respostas" on public.respostas;
create policy "pub_insert_respostas" on public.respostas for insert to anon, authenticated with check (true);

drop policy if exists "pub_select_respostas" on public.respostas;
create policy "pub_select_respostas" on public.respostas for select to authenticated using (auth.uid() is not null);

drop policy if exists "auth_auditoria" on public.auditoria_administrativa;
create policy "auth_auditoria" on public.auditoria_administrativa for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "auth_export" on public.historico_exportacao;
create policy "auth_export" on public.historico_exportacao for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

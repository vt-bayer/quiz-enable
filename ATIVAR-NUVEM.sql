-- ============================================================
-- EXECUTE UMA VEZ no Supabase → SQL Editor → Run
-- Projeto: Quiz ENABLE (gravação compartilhada entre dispositivos)
-- ============================================================

create table if not exists public.participacoes (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid,
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

create index if not exists participacoes_fase_status_idx
  on public.participacoes (fase_id, status);

create index if not exists participacoes_ranking_idx
  on public.participacoes (fase_id, pontuacao desc, quantidade_acertos desc, tempo_total_segundos asc);

alter table public.participacoes enable row level security;

grant select, insert, update, delete on table public.participacoes to anon, authenticated;

drop policy if exists "pub_select_participacoes" on public.participacoes;
create policy "pub_select_participacoes"
  on public.participacoes for select
  to anon, authenticated
  using (true);

drop policy if exists "pub_insert_participacoes" on public.participacoes;
create policy "pub_insert_participacoes"
  on public.participacoes for insert
  to anon, authenticated
  with check (true);

drop policy if exists "pub_update_participacoes" on public.participacoes;
create policy "pub_update_participacoes"
  on public.participacoes for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "auth_delete_participacoes" on public.participacoes;
create policy "auth_delete_participacoes"
  on public.participacoes for delete
  to authenticated
  using (auth.uid() is not null);

-- Teste rápido (opcional): deve retornar 0 linhas sem erro
-- select count(*) from public.participacoes;

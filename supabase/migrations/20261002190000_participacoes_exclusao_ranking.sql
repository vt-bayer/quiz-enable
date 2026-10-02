-- Migration: exclusão lógica + recálculo atômico de ranking
-- Aplicar no SQL Editor do projeto (ambiente técnico / desenvolvedor)

create table if not exists public.participacoes (
  id uuid primary key default gen_random_uuid(),
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
  status text not null default 'em_andamento',
  quantidade_perguntas integer not null default 5,
  quantidade_acertos integer not null default 0,
  pontuacao integer not null default 0,
  tempo_total_segundos integer not null default 0,
  posicao_ranking integer,
  sincronizado boolean not null default true,
  excluida boolean not null default false,
  excluida_em timestamptz,
  excluida_por text,
  motivo_exclusao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.participacoes add column if not exists sincronizado boolean not null default true;
alter table public.participacoes add column if not exists excluida boolean not null default false;
alter table public.participacoes add column if not exists excluida_em timestamptz;
alter table public.participacoes add column if not exists excluida_por text;
alter table public.participacoes add column if not exists motivo_exclusao text;

create index if not exists idx_participacoes_fase_status
  on public.participacoes (fase_id, status);
create index if not exists idx_participacoes_excluida
  on public.participacoes (excluida)
  where excluida = true;

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

grant select, insert on table public.auditoria_administrativa to anon, authenticated;

create or replace function public.recalcular_ranking_fase(p_fase_id text)
returns void
language plpgsql
security definer
as $$
begin
  update public.participacoes
  set posicao_ranking = null, atualizado_em = now()
  where fase_id = p_fase_id
    and (status <> 'concluida' or coalesce(excluida, false) = true);

  with ordenado as (
    select
      id,
      row_number() over (
        order by
          pontuacao desc,
          quantidade_acertos desc,
          tempo_total_segundos asc,
          finalizado_em asc nulls last
      ) as pos
    from public.participacoes
    where fase_id = p_fase_id
      and status = 'concluida'
      and coalesce(excluida, false) = false
  )
  update public.participacoes p
  set posicao_ranking = o.pos, atualizado_em = now()
  from ordenado o
  where p.id = o.id;
end;
$$;

create or replace function public.excluir_participacao_admin(
  p_id uuid,
  p_motivo text,
  p_admin_id text default 'admin'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_fase text;
  v_status text;
  v_exc boolean;
begin
  if p_motivo is null or length(trim(p_motivo)) < 2 then
    return jsonb_build_object('ok', false, 'codigo', 'motivo_invalido');
  end if;

  select fase_id, status, coalesce(excluida, false)
    into v_fase, v_status, v_exc
  from public.participacoes
  where id = p_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'codigo', 'nao_encontrada');
  end if;

  if v_exc or v_status = 'excluida' then
    return jsonb_build_object('ok', false, 'codigo', 'ja_excluida');
  end if;

  update public.participacoes
  set
    status = 'excluida',
    excluida = true,
    excluida_em = now(),
    excluida_por = coalesce(p_admin_id, 'admin'),
    motivo_exclusao = trim(p_motivo),
    posicao_ranking = null,
    atualizado_em = now()
  where id = p_id;

  perform public.recalcular_ranking_fase(v_fase);

  insert into public.auditoria_administrativa (administrador_id, acao, entidade, entidade_id, motivo, novo_valor)
  values (coalesce(p_admin_id, 'admin'), 'excluir_participacao', 'participacao', p_id::text, trim(p_motivo), 'excluida');

  return jsonb_build_object('ok', true, 'fase_id', v_fase);
exception when others then
  return jsonb_build_object('ok', false, 'codigo', 'erro_interno');
end;
$$;

create or replace function public.restaurar_participacao_admin(
  p_id uuid,
  p_admin_id text default 'admin'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_fase text;
begin
  select fase_id into v_fase
  from public.participacoes
  where id = p_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'codigo', 'nao_encontrada');
  end if;

  update public.participacoes
  set
    status = 'concluida',
    excluida = false,
    excluida_em = null,
    excluida_por = null,
    motivo_exclusao = null,
    atualizado_em = now()
  where id = p_id;

  perform public.recalcular_ranking_fase(v_fase);

  insert into public.auditoria_administrativa (administrador_id, acao, entidade, entidade_id, novo_valor)
  values (coalesce(p_admin_id, 'admin'), 'restaurar_participacao', 'participacao', p_id::text, 'concluida');

  return jsonb_build_object('ok', true, 'fase_id', v_fase);
exception when others then
  return jsonb_build_object('ok', false, 'codigo', 'erro_interno');
end;
$$;

grant execute on function public.recalcular_ranking_fase(text) to anon, authenticated;
grant execute on function public.excluir_participacao_admin(uuid, text, text) to anon, authenticated;
grant execute on function public.restaurar_participacao_admin(uuid, text) to anon, authenticated;

alter table public.participacoes replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.participacoes;
  exception when duplicate_object then null;
  end;
end $$;

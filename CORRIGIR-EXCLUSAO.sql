-- Corrigir exclusão lógica (rodar 1x no SQL Editor do Supabase)
-- Problema: a tabela antiga não aceitava status = 'excluida'
-- e a auditoria bloqueava a função RPC.

alter table public.participacoes drop constraint if exists participacoes_status_check;
alter table public.participacoes add constraint participacoes_status_check
  check (status in (
    'em_andamento', 'concluida', 'incompleta', 'expirada',
    'cancelada', 'aguardando_sync', 'excluida'
  ));

alter table public.participacoes add column if not exists excluida boolean not null default false;
alter table public.participacoes add column if not exists excluida_em timestamptz;
alter table public.participacoes add column if not exists excluida_por text;
alter table public.participacoes add column if not exists motivo_exclusao text;

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

alter table public.auditoria_administrativa enable row level security;
grant select, insert on table public.auditoria_administrativa to anon, authenticated;

drop policy if exists "pub_select_auditoria" on public.auditoria_administrativa;
create policy "pub_select_auditoria"
  on public.auditoria_administrativa for select
  to anon, authenticated
  using (true);

drop policy if exists "pub_insert_auditoria" on public.auditoria_administrativa;
create policy "pub_insert_auditoria"
  on public.auditoria_administrativa for insert
  to anon, authenticated
  with check (true);

create or replace function public.excluir_participacao_admin(
  p_id uuid,
  p_motivo text,
  p_admin_id text default 'admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

  begin
    insert into public.auditoria_administrativa (administrador_id, acao, entidade, entidade_id, motivo, novo_valor)
    values (coalesce(p_admin_id, 'admin'), 'excluir_participacao', 'participacao', p_id::text, trim(p_motivo), 'excluida');
  exception when others then
    null;
  end;

  return jsonb_build_object('ok', true, 'fase_id', v_fase);
exception when others then
  return jsonb_build_object('ok', false, 'codigo', 'erro_interno', 'detalhe', SQLERRM);
end;
$$;

grant execute on function public.excluir_participacao_admin(uuid, text, text) to anon, authenticated;

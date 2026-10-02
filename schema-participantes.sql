-- LEGADO: schema antigo de participantes (substituído por schema-quiz.sql).
-- Execute schema-quiz.sql no SQL Editor do Supabase para o modelo de 3 fases.
-- Mantido apenas para referência de migração.
--
-- Removido: coluna premio e política anon_update_premio (roleta descontinuada).

-- Opcional: limpar coluna premio se a tabela antiga ainda existir
-- alter table public.participantes drop column if exists premio;

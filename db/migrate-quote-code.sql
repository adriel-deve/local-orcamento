-- Migração para aumentar o tamanho do campo quote_code
-- Execute este script no banco Neon PostgreSQL

ALTER TABLE quotes ALTER COLUMN quote_code TYPE VARCHAR(255);

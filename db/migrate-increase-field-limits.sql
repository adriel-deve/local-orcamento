-- Aumentar limite de caracteres para campos que podem ter textos longos
-- Especialmente o campo 'name' em items que pode ter descrições longas

ALTER TABLE items ALTER COLUMN name TYPE VARCHAR(1000);
ALTER TABLE quotes ALTER COLUMN company TYPE VARCHAR(500);
ALTER TABLE quotes ALTER COLUMN client TYPE VARCHAR(500);
ALTER TABLE quotes ALTER COLUMN representative TYPE VARCHAR(500);
ALTER TABLE quotes ALTER COLUMN supplier TYPE VARCHAR(500);
ALTER TABLE quotes ALTER COLUMN machine_model TYPE VARCHAR(500);

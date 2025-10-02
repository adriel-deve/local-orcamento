import pool from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const usePostgreSQL = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';

async function migrate() {
  console.log('🔄 Iniciando migração para adicionar campos de status...');
  console.log(`Banco de dados: ${usePostgreSQL ? 'PostgreSQL (Neon)' : 'MySQL (local)'}`);

  try {
    if (usePostgreSQL) {
      // PostgreSQL migration
      console.log('Executando migração PostgreSQL...');

      // Verificar e adicionar coluna business_status
      await pool.execute(`
        ALTER TABLE quotes
        ADD COLUMN IF NOT EXISTS business_status VARCHAR(20) DEFAULT 'ativa'
      `);

      // Adicionar outras colunas
      await pool.execute(`
        ALTER TABLE quotes
        ADD COLUMN IF NOT EXISTS purchase_order VARCHAR(128) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS closed_by INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS baixa_reason TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS baixa_at TIMESTAMP DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS baixa_by INTEGER DEFAULT NULL
      `).catch(err => {
        if (!err.message.includes('already exists')) throw err;
        console.log('⚠️  Algumas colunas já existem, continuando...');
      });

      // Criar índices
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_business_status ON quotes(business_status)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_supplier ON quotes(supplier)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)`);

    } else {
      // MySQL migration
      console.log('Executando migração MySQL...');

      await pool.execute(`
        ALTER TABLE quotes
        ADD COLUMN IF NOT EXISTS business_status ENUM('ativa', 'baixa', 'pedido_compra', 'finalizada') DEFAULT 'ativa' COMMENT 'Status de negócio da cotação',
        ADD COLUMN IF NOT EXISTS purchase_order VARCHAR(128) DEFAULT NULL COMMENT 'Número do pedido de compra',
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Data de finalização',
        ADD COLUMN IF NOT EXISTS closed_by INT NULL DEFAULT NULL COMMENT 'Usuário que finalizou',
        ADD COLUMN IF NOT EXISTS baixa_reason TEXT NULL DEFAULT NULL COMMENT 'Motivo da baixa',
        ADD COLUMN IF NOT EXISTS baixa_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Data da baixa',
        ADD COLUMN IF NOT EXISTS baixa_by INT NULL DEFAULT NULL COMMENT 'Usuário que deu baixa'
      `).catch(err => {
        if (!err.message.includes('Duplicate column')) throw err;
        console.log('⚠️  Algumas colunas já existem, continuando...');
      });

      // Criar índices
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_business_status ON quotes(business_status)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_supplier ON quotes(supplier)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id)`);
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)`);
    }

    console.log('✅ Migração concluída com sucesso!');
    console.log('Novos campos adicionados:');
    console.log('  - business_status: Status de negócio (ativa, baixa, pedido_compra, finalizada)');
    console.log('  - purchase_order: Número do pedido de compra');
    console.log('  - closed_at: Data de finalização');
    console.log('  - closed_by: Usuário que finalizou');
    console.log('  - baixa_reason: Motivo da baixa');
    console.log('  - baixa_at: Data da baixa');
    console.log('  - baixa_by: Usuário que deu baixa');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

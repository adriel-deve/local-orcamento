// Script para criar ZIP para deploy na Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Preparando arquivos para deploy na Vercel...');

// Criar pasta temporária para os arquivos
const deployDir = path.join(__dirname, 'vercel-deploy');

if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);

// Lista de arquivos/pastas essenciais para incluir
const essentialFiles = [
  'src/',
  'views/',
  'public/',
  'db/',
  'package.json',
  'vercel.json',
  '.env.example'
];

// Lista de arquivos/pastas para EXCLUIR
const excludePatterns = [
  '.git',
  'node_modules',
  '.env',
  'uploads',
  'output',
  'data',
  'local-orcamentos',
  '.vscode',
  'create-deploy-zip.js',
  'test-',
  '*.log'
];

console.log('📁 Copiando arquivos essenciais...');

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      return filePath.match(pattern.replace('*', '.*'));
    }
    return filePath.includes(pattern);
  });
}

function copyRecursive(src, dest) {
  if (shouldExclude(src)) {
    return;
  }

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copiar arquivos essenciais
essentialFiles.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(deployDir, file);

  if (fs.existsSync(srcPath)) {
    console.log(`✅ Copiando: ${file}`);
    copyRecursive(srcPath, destPath);
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
  }
});

// Criar pastas necessárias vazias
const emptyDirs = ['uploads', 'output'];
emptyDirs.forEach(dir => {
  const dirPath = path.join(deployDir, dir);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');
  console.log(`📁 Criada pasta: ${dir}`);
});

// Criar arquivo README para deploy
const readmeContent = `# Local Orçamentos - Deploy Vercel

## Arquivos incluídos neste deploy:
- ✅ Código fonte completo
- ✅ CSS moderno inline
- ✅ PDF geração client-side (jsPDF)
- ✅ Conexão banco PostgreSQL/Neon
- ✅ Formulários funcionais

## Environment Variables necessárias:
\`\`\`
DATABASE_URL=postgresql://neondb_owner:npg_nk0EB9PqrCQV@ep-ancient-voice-adoo5ffm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
\`\`\`

## Após deploy, testar:
1. Homepage com layout moderno
2. Formulário "Nova Cotação"
3. Botão "Gerar PDF (Novo)"
4. Salvamento no banco
`;

fs.writeFileSync(path.join(deployDir, 'README-DEPLOY.md'), readmeContent);

console.log('\n🎉 Arquivos preparados para deploy!');
console.log(`📂 Pasta criada: ${deployDir}`);
console.log('\n📋 Próximos passos:');
console.log('1. Compacte a pasta "vercel-deploy" em ZIP');
console.log('2. Vá para https://vercel.com/dashboard');
console.log('3. Clique em "Add New Project"');
console.log('4. Selecione "Import Third-Party Git Repository"');
console.log('5. Faça upload do ZIP');
console.log('6. Configure as environment variables');
console.log('7. Deploy!');

console.log('\n🔗 Environment Variables:');
console.log('DATABASE_URL=postgresql://neondb_owner:npg_nk0EB9PqrCQV@ep-ancient-voice-adoo5ffm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require');
console.log('NODE_ENV=production');
# Script para configurar variáveis de ambiente no Vercel
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "CONFIGURANDO VARIÁVEIS DE AMBIENTE NO VERCEL" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Variáveis
$DATABASE_URL = "postgresql://neondb_owner:npg_nk0EB9PqrCQV@ep-ancient-voice-adoo5ffm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
$SESSION_SECRET = "pharmatec-orcamentos-secret-key-2024-v1-production"
$NODE_ENV = "production"
$DB_TYPE = "postgresql"

Write-Host "[1/4] Configurando DATABASE_URL..." -ForegroundColor Yellow
echo $DATABASE_URL | vercel env add DATABASE_URL production preview development

Write-Host ""
Write-Host "[2/4] Configurando SESSION_SECRET..." -ForegroundColor Yellow
echo $SESSION_SECRET | vercel env add SESSION_SECRET production preview development

Write-Host ""
Write-Host "[3/4] Configurando NODE_ENV..." -ForegroundColor Yellow
echo $NODE_ENV | vercel env add NODE_ENV production

Write-Host ""
Write-Host "[4/4] Configurando DB_TYPE..." -ForegroundColor Yellow
echo $DB_TYPE | vercel env add DB_TYPE production preview development

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "VARIÁVEIS CONFIGURADAS COM SUCESSO!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: vercel --prod" -ForegroundColor White
Write-Host "   (Para fazer redeploy com as novas variáveis)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ou aguarde o deploy automático do último commit" -ForegroundColor White
Write-Host ""
Write-Host "3. Teste em: https://local-orcamento.vercel.app/health" -ForegroundColor White
Write-Host ""
Read-Host "Pressione ENTER para continuar"

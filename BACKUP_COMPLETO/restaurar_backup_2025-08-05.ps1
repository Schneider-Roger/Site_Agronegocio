# SCRIPT DE RESTAURAÇÃO DO BACKUP
# Site Agronegócio - Backup 2025-08-05_09-59-53

Write-Host "=== SCRIPT DE RESTAURAÇÃO - SITE AGRONEGÓCIO ===" -ForegroundColor Cyan
Write-Host ""

# Caminhos
$caminhoBackup = "g:\backup_site_agronegocio\backup_2025-08-05_09-59-53"
$caminhoDestino = "g:\site_Agronegocio_restaurado"

# Verificar se o backup existe
if (-Not (Test-Path $caminhoBackup)) {
    Write-Host "❌ ERRO: Backup não encontrado em $caminhoBackup" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Backup encontrado: $caminhoBackup" -ForegroundColor Green
Write-Host "📁 Destino da restauração: $caminhoDestino" -ForegroundColor Yellow
Write-Host ""

# Confirmar restauração
$confirmacao = Read-Host "Deseja prosseguir com a restauração? (S/N)"
if ($confirmacao -ne "S" -and $confirmacao -ne "s") {
    Write-Host "❌ Restauração cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Iniciando restauração..." -ForegroundColor Cyan

# Criar diretório de destino se não existir
if (-Not (Test-Path $caminhoDestino)) {
    New-Item -Path $caminhoDestino -ItemType Directory -Force | Out-Null
    Write-Host "✅ Diretório de destino criado" -ForegroundColor Green
}

# Copiar arquivos
Write-Host "📋 Copiando arquivos do backup..."
robocopy $caminhoBackup $caminhoDestino /E /R:2 /W:1 | Out-Null

if ($LASTEXITCODE -le 1) {
    Write-Host "✅ Arquivos copiados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro durante a cópia dos arquivos" -ForegroundColor Red
    exit 1
}

# Navegar para o diretório restaurado
Set-Location $caminhoDestino
Write-Host "📁 Navegando para: $caminhoDestino" -ForegroundColor Yellow

# Verificar se package.json existe
if (Test-Path "package.json") {
    Write-Host "📦 Instalando dependências (npm install)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erro ao instalar dependências" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  package.json não encontrado - pulando instalação de dependências" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 RESTAURAÇÃO CONCLUÍDA COM SUCESSO! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verificar se todos os arquivos foram restaurados" -ForegroundColor White
Write-Host "   2. Iniciar o servidor: node server.js" -ForegroundColor White
Write-Host "   3. Testar a aplicação no navegador" -ForegroundColor White
Write-Host ""
Write-Host "📁 Localização da restauração: $caminhoDestino" -ForegroundColor Yellow
Write-Host "📄 Consulte o RELATORIO_BACKUP.md para mais detalhes" -ForegroundColor Yellow

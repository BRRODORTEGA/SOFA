# Script para configurar banco de dados PostgreSQL local
# Execute: .\setup-local-db.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração de Banco de Dados Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se PostgreSQL está instalado
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL não encontrado no PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale o PostgreSQL primeiro:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Baixe e instale o PostgreSQL" -ForegroundColor White
    Write-Host "3. Certifique-se de adicionar ao PATH durante a instalação" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ PostgreSQL encontrado: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Solicitar senha do postgres
$senha = Read-Host "Digite a senha do usuário 'postgres'" -AsSecureString
$senhaPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha)
)

# Nome do banco
$dbName = "ai_sofa"

Write-Host ""
Write-Host "Criando banco de dados '$dbName'..." -ForegroundColor Yellow

# Criar banco de dados
$env:PGPASSWORD = $senhaPlain
$createDb = psql -U postgres -c "CREATE DATABASE $dbName;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Banco de dados '$dbName' criado com sucesso!" -ForegroundColor Green
} else {
    if ($createDb -match "already exists") {
        Write-Host "⚠️  Banco de dados '$dbName' já existe." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erro ao criar banco de dados:" -ForegroundColor Red
        Write-Host $createDb -ForegroundColor Red
        exit 1
    }
}

# Limpar senha da memória
$env:PGPASSWORD = $null
$senhaPlain = $null

Write-Host ""
Write-Host "Atualizando arquivo .env..." -ForegroundColor Yellow

# Ler .env atual
$envContent = Get-Content .env -ErrorAction SilentlyContinue
if (-not $envContent) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

# Solicitar senha novamente para o .env
$senhaEnv = Read-Host "Digite a senha novamente para salvar no .env" -AsSecureString
$senhaEnvPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaEnv)
)

# Atualizar DATABASE_URL
$newEnvContent = $envContent | ForEach-Object {
    if ($_ -match "^DATABASE_URL=") {
        "DATABASE_URL=postgresql://postgres:$senhaEnvPlain@localhost:5432/$dbName"
    } else {
        $_
    }
}

$newEnvContent | Out-File -FilePath .env -Encoding utf8 -Force

Write-Host "✅ Arquivo .env atualizado!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Execute: npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "2. Ou teste: npx prisma studio" -ForegroundColor White
Write-Host ""

# Limpar senha
$senhaEnvPlain = $null




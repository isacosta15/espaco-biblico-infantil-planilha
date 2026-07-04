@echo off
echo ============================================
echo  Espaço Bíblico Infantil - Instalação
echo ============================================
echo.

echo [1/3] Instalando dependências...
if exist pnpm-lock.yaml (
    echo Removendo lockfile antigo para recalcular pacotes do Windows...
    del /f /q pnpm-lock.yaml
)
call pnpm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependências.
    pause
    exit /b 1
)

echo.
echo [2/3] Criando tabelas no banco de dados...
call pnpm --filter @workspace/db run push
if errorlevel 1 (
    echo ERRO: Falha ao criar tabelas. Verifique se o PostgreSQL está rodando e o arquivo .env está correto.
    pause
    exit /b 1
)

echo.
echo [3/3] Instalação concluída!
echo.
echo Agora execute o arquivo: 2-iniciar.bat
echo.
pause

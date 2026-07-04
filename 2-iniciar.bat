@echo off
echo ============================================
echo  Espaço Bíblico Infantil - Iniciando...
echo ============================================
echo.
echo Abrindo o servidor backend (API)...
start "EBI - Backend" cmd /k "set PORT=8080 && pnpm --filter @workspace/api-server run dev:local"

echo Aguardando 8 segundos para o backend iniciar...
timeout /t 8 /nobreak > nul

echo Abrindo o servidor frontend (tela)...
start "EBI - Frontend" cmd /k "set PORT=3000 && set BASE_PATH=/ && set API_PORT=8080 && pnpm --filter @workspace/espaco-biblico run dev"

echo.
echo Aguardando mais 5 segundos...
timeout /t 5 /nobreak > nul

echo.
echo Abrindo o sistema no navegador...
start http://localhost:3000

echo.
echo ============================================
echo  Sistema iniciado!
echo  Acesse: http://localhost:3000
echo  Login:  admin@ebi.com / admin123
echo ============================================
echo.
echo Mantenha as duas janelas abertas enquanto usa o sistema.
echo Para encerrar, feche as duas janelas pretas (servidores).
echo.
pause

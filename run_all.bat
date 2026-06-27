@echo off

echo ==============================
echo Iniciando SC Companion Parser
echo ==============================

cd /d "%~dp0"

echo.
echo [1/3] Processando logs...
bun run src/index.ts

echo.
echo [2/3] Gerando relatorio...
bun run src/report.ts

echo.
echo [3/3] Abrindo HTML...

start "" report.html

echo.
echo Tudo pronto ✅
pause

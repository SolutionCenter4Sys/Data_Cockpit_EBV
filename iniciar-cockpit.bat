@echo off
chcp 65001 >nul
title Cockpit EBV — Frontend

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║          COCKPIT EBV — Plataforma de Dados           ║
echo  ║              Foursys ^| MVP v1.0 ^| 2026              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Verifica se node_modules existe
if not exist "node_modules\" (
    echo  [1/2] Instalando dependencias, aguarde...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  [ERRO] Falha na instalacao das dependencias.
        echo  Verifique sua conexao com a internet e tente novamente.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependencias instaladas com sucesso!
    echo.
) else (
    echo  [OK] Dependencias ja instaladas.
    echo.
)

echo  [2/2] Iniciando servidor de desenvolvimento...
echo.
echo  -------------------------------------------------------
echo   URL: http://localhost:8000
echo   Mock API: ativa (dados simulados EBV)
echo   Hot reload: ativado
echo  -------------------------------------------------------
echo.
echo  Pressione Ctrl+C para encerrar o servidor.
echo.

call npm run dev

pause

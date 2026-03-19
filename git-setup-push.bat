@echo off
chcp 65001 >nul
title Cockpit EBV — Git Setup + Push

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   Cockpit EBV — Configurar Git e fazer Push          ║
echo  ║   Repo: SolutionCenter4Sys/Data_Cockpit_EBV          ║
echo  ║   Fix:  output_location = dist                       ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"
echo  Diretorio: %CD%
echo.

:: ── Verificar git ────────────────────────────────────────────────────────────
git --version >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] git nao encontrado.
    pause & exit /b 1
)

:: ── Inicializar git se necessario ─────────────────────────────────────────────
if not exist ".git\" (
    echo  [1/6] Inicializando repositorio git...
    git init -b main
    if errorlevel 1 ( echo  [ERRO] Falha no git init. & pause & exit /b 1 )
    echo  [OK] Git inicializado!
) else (
    echo  [1/6] Git ja inicializado.
)

:: ── Configurar remote ────────────────────────────────────────────────────────
echo.
echo  [2/6] Configurando remote origin...

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin https://github.com/SolutionCenter4Sys/Data_Cockpit_EBV.git
    echo  [OK] Remote adicionado.
) else (
    git remote set-url origin https://github.com/SolutionCenter4Sys/Data_Cockpit_EBV.git
    echo  [OK] Remote atualizado.
)

:: ── Buscar histórico do GitHub ────────────────────────────────────────────────
echo.
echo  [3/6] Buscando historico do GitHub (fetch)...
git fetch origin main
if errorlevel 1 (
    echo  [AVISO] Fetch falhou — pode ser um repo novo. Continuando...
)

:: ── Configurar branch main e integrar histórico ───────────────────────────────
echo.
echo  [4/6] Sincronizando com branch main do GitHub...

git branch -M main 2>nul

:: Verificar se há commits locais
git log --oneline -1 >nul 2>&1
if errorlevel 1 (
    :: Sem commits locais — resetar para o estado do remote
    git reset origin/main 2>nul
    echo  [OK] Branch sincronizada com origin/main
) else (
    echo  [OK] Branch main configurada
)

:: ── Add + Commit ──────────────────────────────────────────────────────────────
echo.
echo  [5/6] Criando commit com todas as atualizacoes...
git add -A

git diff --cached --quiet
if errorlevel 1 (
    echo.
    echo  Arquivos no commit:
    git diff --cached --name-only
    echo.
    git commit -m "fix: corrige output_location=dist + Light Mode Equifax + theme toggle"
    if errorlevel 1 ( echo  [ERRO] Falha no commit. & pause & exit /b 1 )
    echo.
    echo  [OK] Commit criado!
) else (
    echo  [OK] Nenhuma alteracao nova para commitar.
)

:: ── Push ─────────────────────────────────────────────────────────────────────
echo.
echo  [6/6] Fazendo push para GitHub...
echo  (pode pedir usuario e senha/token do GitHub)
echo.

git push origin main
if errorlevel 1 (
    echo.
    echo  [TENTATIVA 2] Forçando push (--force-with-lease)...
    git push origin main --force-with-lease
    if errorlevel 1 (
        echo  [ERRO] Push falhou.
        echo.
        echo  Possiveis causas:
        echo    - Credenciais nao configuradas
        echo    - Sem permissao no repositorio
        echo.
        echo  Solucao: configure suas credenciais git:
        echo    git config --global credential.helper manager
        pause & exit /b 1
    )
)

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  ✓  PUSH REALIZADO COM SUCESSO!                     ║
echo  ║                                                     ║
echo  ║  GitHub Actions vai iniciar o deploy automatico.    ║
echo  ║  Acompanhe em:                                      ║
echo  ║  github.com/SolutionCenter4Sys/Data_Cockpit_EBV     ║
echo  ║  (aba Actions)                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Abrir Actions no navegador
start "" "https://github.com/SolutionCenter4Sys/Data_Cockpit_EBV/actions"

pause

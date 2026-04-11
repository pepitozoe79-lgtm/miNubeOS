@echo off
setlocal
title Instalador de NubeOS

echo ======================================================
echo           INSTALADOR Y EJECUTOR DE NubeOS
echo ======================================================
echo.

:: 1. Verificar Node.js
echo [1/4] Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Node.js instalado.
    echo Por favor, instala Node.js desde https://nodejs.org/ antes de continuar.
    pause
    exit /b
)
echo OK.

:: 2. Instalar dependencias del Backend
echo.
echo [2/4] Instalando dependencias del Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] No se pudieron instalar las dependencias del Backend.
    pause
    exit /b
)
cd ..
echo OK.

:: 3. Instalar dependencias del Frontend
echo.
echo [3/4] Instalando dependencias del Frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] No se pudieron instalar las dependencias del Frontend.
    pause
    exit /b
)
cd ..
echo OK.

:: 4. Ejecutar la aplicacion
echo.
echo [4/4] Iniciando NubeOS...
echo.
echo La aplicacion se abrira en dos ventanas de terminal nuevas.
echo Por favor, no las cierres mientras uses NubeOS.
echo.

:: Iniciar Backend en una nueva ventana
start "NubeOS Backend (API)" cmd /c "cd backend && node src/index.js"

:: Iniciar Frontend en una nueva ventana
start "NubeOS Frontend (Web)" cmd /c "cd frontend && npm run dev"

echo.
echo ======================================================
echo   NubeOS se esta iniciando...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo ======================================================
echo.
echo Puedes cerrar esta ventana ahora. Presiona cualquier tecla para salir.
pause >nul
exit

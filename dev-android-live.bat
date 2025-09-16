@echo off
echo =======================================================
echo        LIVE RELOAD PARA ANDROID - BARBERIA DANY
echo =======================================================
echo.
echo Este script configura live reload para desarrollo Android
echo Los cambios se reflejan automáticamente en el dispositivo/emulador
echo.
echo REQUISITOS:
echo 1. Dispositivo Android conectado vía USB (con USB Debugging)
echo 2. O emulador Android ejecutándose
echo 3. Android Studio instalado
echo.
echo =======================================================
echo.

REM Verificar si el servidor está corriendo
netstat -an | findstr "3000" >nul
if %errorlevel% equ 0 (
    echo ✅ Servidor de desarrollo detectado en puerto 3000
) else (
    echo ❌ Servidor de desarrollo no está corriendo
    echo Ejecutando npm run dev...
    start /b npm run dev
    timeout /t 3
)

echo.
echo Iniciando live reload para Android...
echo Los cambios en el código se reflejarán automáticamente
echo.
echo IMPORTANTE: 
echo - Mantén este terminal abierto
echo - Los cambios tardan ~2-3 segundos en reflejarse
echo - Para detener: Ctrl+C
echo.

npx cap run android --livereload --external
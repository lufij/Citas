@echo off
cls
echo =======================================================
echo           GENERADOR DE APK RELEASE FIRMADO
echo                   BARBERIA DANY v1.0
echo =======================================================
echo.
echo Este script genera un APK release firmado listo para distribución.
echo.
echo PROCESO AUTOMATIZADO:
echo 1. Construir aplicación web (npm run build)
echo 2. Sincronizar con Android (npx cap sync)
echo 3. Generar APK firmado (gradlew assembleRelease)
echo.
echo =======================================================
echo.

REM Volver al directorio raíz
cd /d "%~dp0"

echo [1/3] Construyendo aplicación web...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Falló el build de la aplicación web
    pause
    exit /b 1
)

echo.
echo [2/3] Sincronizando con Android...
call npx cap sync
if %errorlevel% neq 0 (
    echo ERROR: Falló la sincronización con Android
    pause
    exit /b 1
)

echo.
echo [3/3] Generando APK release firmado...
cd android
call gradlew clean assembleRelease
if %errorlevel% neq 0 (
    echo ERROR: Falló la generación del APK
    pause
    exit /b 1
)

cd ..
echo.
echo =======================================================
echo              ¡APK GENERADO EXITOSAMENTE!
echo =======================================================
echo.
echo Ubicación: android\app\build\outputs\apk\release\app-release.apk
echo Tamaño: ~3.2 MB
echo Firmado: SÍ (Listo para distribución)
echo.
echo INFORMACIÓN DE LA APLICACIÓN:
echo - Nombre: Barberia Dany
echo - Versión: 1.0
echo - Package: com.barberiadany.app
echo - Firmado por: Luis Interiano
echo.
echo PRÓXIMOS PASOS:
echo 1. Probar la APK en dispositivos Android
echo 2. Para Play Store: Generar Android App Bundle (AAB)
echo 3. Para distribución directa: Usar esta APK
echo.
echo =======================================================

REM Mostrar información del archivo generado
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo APK generado el: %date% %time%
    for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do echo Tamaño: %%~zA bytes
    echo.
    echo ¿Deseas abrir la carpeta con el APK? (s/n)
    set /p choice=
    if /i "%choice%"=="s" (
        explorer "android\app\build\outputs\apk\release\"
    )
) else (
    echo ERROR: No se encontró el APK generado
)

echo.
pause
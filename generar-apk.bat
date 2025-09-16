@echo off
echo =======================================================
echo           GENERADOR DE APK PARA BARBERIA DANY
echo =======================================================
echo.
echo Este script te ayudará a generar la APK de tu aplicación.
echo.
echo PRERREQUISITOS:
echo 1. Android Studio instalado
echo 2. Android SDK configurado
echo 3. Variables de entorno configuradas
echo.
echo =======================================================
echo           OPCIONES DISPONIBLES:
echo =======================================================
echo.
echo 1. GENERAR APK DEBUG (para pruebas)
echo    Comando: gradlew assembleDebug
echo    Ubicación: android\app\build\outputs\apk\debug\
echo.
echo 2. GENERAR APK RELEASE (para producción)
echo    Comando: gradlew assembleRelease
echo    Ubicación: android\app\build\outputs\apk\release\
echo.
echo 3. ABRIR EN ANDROID STUDIO
echo    Comando: npx cap open android
echo.
echo =======================================================
echo           INSTALACIÓN DEL SDK:
echo =======================================================
echo.
echo Si no tienes Android Studio:
echo 1. Descarga desde: https://developer.android.com/studio
echo 2. Instala y abre Android Studio
echo 3. Ve a SDK Manager y descarga SDK Platform API 34+
echo 4. Configura las variables de entorno:
echo    - ANDROID_HOME: ruta al SDK
echo    - PATH: agregar %ANDROID_HOME%\platform-tools
echo.
echo =======================================================
echo.
pause

REM Intentar detectar Android SDK automáticamente
set "POSSIBLE_SDK_PATHS=%LOCALAPPDATA%\Android\Sdk;%APPDATA%\Android\Sdk;C:\Android\Sdk"

for %%P in (%POSSIBLE_SDK_PATHS%) do (
    if exist "%%P\platform-tools\adb.exe" (
        echo Android SDK encontrado en: %%P
        echo sdk.dir=%%P > local.properties
        echo.
        echo ¿Deseas generar APK debug ahora? (s/n)
        set /p choice=
        if /i "%choice%"=="s" (
            echo Generando APK debug...
            gradlew assembleDebug
        )
        goto :end
    )
)

echo.
echo No se encontró el Android SDK automáticamente.
echo Por favor, instala Android Studio y configura el SDK.
echo.
echo Después, ejecuta manualmente:
echo   1. cd android
echo   2. .\gradlew assembleDebug
echo.

:end
pause
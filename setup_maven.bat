@echo off
title Maven Setup Tool
echo [Step 1] Checking Java Environment...
java -version
if %errorlevel% neq 0 (
    echo [ERROR] Java not found. Please install JDK 17 first.
    pause
    exit /b
)

echo.
echo [Step 2] Downloading Maven Wrapper...
echo Starting download via PowerShell...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/takari/maven-wrapper/master/mvnw.cmd' -OutFile 'mvnw.cmd'"

if exist mvnw.cmd (
    echo [SUCCESS] mvnw.cmd downloaded.
    echo.
    echo [Step 3] Building Project...
    call mvnw clean package -DskipTests
) else (
    echo [ERROR] Download failed. Check your internet connection.
)

echo.
echo ======================================================
echo Build process finished.
echo ======================================================
pause

@echo off
setlocal
echo ======================================================
echo [INFO] 사용자 지정 경로로 빌드를 시작합니다.
echo Maven 경로: C:\apache-maven-3.9.12\bin\mvn
echo ======================================================

cd /d "c:\web-project"

:: 전체 경로를 사용하여 Maven 실행
call "C:\apache-maven-3.9.12\bin\mvn" clean package -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 빌드에 실패했습니다. 경로가 맞는지, 프로젝트에 오류가 없는지 확인하세요.
) else (
    echo.
    echo [SUCCESS] 빌드가 성공적으로 완료되었습니다!
    echo [결과물 위치]
    dir target\*.war /b /s
)

echo.
pause

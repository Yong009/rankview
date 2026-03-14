@echo off
setlocal
echo ======================================================
echo [INFO] Acttopia 프로젝트 빌드를 시작합니다.
echo ======================================================

echo [1/2] Maven을 사용하여 프로젝트 빌드 중 (mvn clean package)...
call mvn clean package -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 빌드 중 오류가 발생했습니다.
    goto :END
)

echo.
echo [2/2] 빌드 결과물 확인 중...
echo.
echo [생성된 파일 목록]
dir target\*.war /b /s 2>nul
dir target\*.jar /b /s 2>nul

echo.
echo [SUCCESS] 빌드가 성공적으로 완료되었습니다!
echo ======================================================

:END
pause

@echo off
setlocal
echo ======================================================
echo [INFO] AWS Lightsail 빌드 디버그 모드 시작
echo ======================================================

echo [1/3] Java 환경 확인 중...
java -version
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java를 찾을 수 없습니다. JDK가 설치되어 있는지 확인하세요.
    goto :ERROR_EXIT
)

echo.
echo [2/3] Maven(mvn) 환경 확인 중...
call mvn -version
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Maven(mvn)을 찾을 수 없습니다. 
    echo Maven이 설치되어 있고 PATH 환경 변수에 등록되어 있는지 확인하세요.
    goto :ERROR_EXIT
)

echo.
echo [3/3] 실제 빌드 시도 중 (mvn clean package)...
call mvn clean package -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 빌드 도중 오류가 발생했습니다. 위 메시지를 확인해 주세요.
) else (
    echo.
    echo [SUCCESS] 빌드가 성공적으로 완료되었습니다!
    echo [결과물 위치]
    dir target\*.war /b /s
    echo.
    echo 이 WAR 파일을 Lightsail 서버로 업로드하시면 됩니다.
)

goto :END

:ERROR_EXIT
echo.
echo [도움말] 
echo 1. JDK 17 이상이 설치되어 있어야 합니다.
echo 2. Maven이 설치되어 있고, 시스템 환경 변수(Path)에 bin 폴더가 등록되어야 합니다.
echo 3. 'mvnw' 파일이 있다면 'call mvnw clean package'를 시도해 보세요.

:END
echo ======================================================
echo 아무 키나 누르면 창이 닫힙니다.
pause > nle

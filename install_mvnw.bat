@echo off
setlocal
echo ======================================================
echo [INFO] Maven Wrapper(mvnw) 설치를 시도합니다.
echo ======================================================

:: Java 확인
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java가 설치되어 있지 않습니다. JDK를 먼저 설치해 주세요.
    pause
    exit /b
)

:: Maven Wrapper 생성 (Maven 없이도 빌드 가능하게 함)
echo [1/2] Maven Wrapper 생성 중...
:: 만약 시스템에 mvn이 없다면, 이 단계가 실패할 수 있습니다. 
:: 하지만 보통 Spring Boot 프로젝트라면 기본적으로 mvnw가 있거나 생성 가능합니다.
call mvn -Dartifact=org.apache.maven.wrapper:maven-wrapper:3.2.0:wrapper -Dquiet=true wrapper:wrapper

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 시스템에 Maven(mvn)이 설치되어 있지 않아 자동 설치가 어렵습니다.
    echo 아래 사이트에서 Maven을 다운로드하여 설치하거나 PATH를 설정해 주세요.
    echo https://maven.apache.org/download.cgi
    pause
    exit /b
)

echo [2/2] 생성된 Wrapper로 빌드 테스트...
call mvnw clean package -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] 빌드 성공! target 폴더를 확인하세요.
)

pause

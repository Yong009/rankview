@echo off
echo [INFO] AWS Lightsail 배포를 위한 빌드를 시작합니다...
mvn clean package -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 빌드에 실패했습니다. Maven(mvn)이 설치되어 있고 PATH에 등록되어 있는지 확인해 주세요.
) else (
    echo [SUCCESS] 빌드가 완료되었습니다.
    dir target\*.war
    echo [INFO] 생성된 WAR 파일을 AWS Lightsail 인스턴스에 업로드하세요.
)
pause

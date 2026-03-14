@echo off
setlocal
echo ======================================================
echo [INFO] 외부 톰캣용 WAR 빌드를 시작합니다.
echo ======================================================

cd /d "%~dp0"

:: 로컬 Maven을 사용하여 빌드 수행 (Wrapper 다운로드 오류 해결)
echo [1/2] 프로젝트 빌드 중 (Local Maven 사용)...
call "C:\apache-maven-3.9.12\bin\mvn.cmd" clean package -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 빌드 중 오류가 발생했습니다. 코드를 확인해 주세요.
    goto :END
)

echo.
echo [2/2] 빌드 결과물 확인 중...
echo.
if exist "target\rankmanager-0.0.1-SNAPSHOT.war" (
    echo [SUCCESS] 빌드가 성공적으로 완료되었습니다!
    echo [결과 파일] target\rankmanager-0.0.1-SNAPSHOT.war
    echo.
    echo [안내] 위 파일의 이름을 ROOT.war로 변경하여 
    echo        서버의 /opt/tomcat/webapps/ 폴더에 업로드하세요.
) else (
    echo [ERROR] 결과 파일을 찾을 수 없습니다. target 폴더를 확인해 주세요.
)

:END
echo.
pause

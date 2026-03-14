@echo off
setlocal
echo [Step 1] Current directory: %cd%
echo [Step 2] User: %username%
echo [Step 3] Maven path checking...
where mvn
if %errorlevel% neq 0 (
    echo [ERROR] 'mvn' command not found in PATH.
) else (
    echo [SUCCESS] 'mvn' found.
)

echo [Step 4] java path checking...
where java
if %errorlevel% neq 0 (
    echo [ERROR] 'java' command not found in PATH.
) else (
    echo [SUCCESS] 'java' found.
)

echo.
echo ======================================================
echo 만약 이 창이 바로 꺼진다면, 'CMD'를 먼저 열고 이 파일을 드래그해서 실행해 주세요.
echo ======================================================
echo.
pause

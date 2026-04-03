@REM Maven wrapper for Windows
@echo off
set MAVEN_OPTS=-Xmx512m

where mvn >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    mvn %*
) else (
    echo ERROR: Maven is not installed or not in PATH.
    echo Please install Maven from https://maven.apache.org/download.cgi
    echo Or use: winget install Apache.Maven
    exit /B 1
)

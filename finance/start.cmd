@echo off
rem Start the personal finance web app (Windows). Needs Python 3.10+.
if not "%~1"=="--inner" (
    cmd /k ""%~f0" --inner"
    exit /b
)
cd /d "%~dp0"
set "PY="
py -3 --version >nul 2>&1
if not errorlevel 1 set "PY=py -3"
if not defined PY (
    python --version >nul 2>&1
    if not errorlevel 1 set "PY=python"
)
if not defined PY (
    echo Python not found. Install it from https://www.python.org/downloads/ and tick "Add python.exe to PATH".
    goto :eof
)
echo Keep this window open while you use the app: http://127.0.0.1:8765
%PY% -m fin serve --open

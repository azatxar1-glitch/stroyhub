@echo off
rem Запуск веб-интерфейса личных финансов (Windows). Нужен Python 3.10+.
cd /d "%~dp0"
python -m fin serve --open
pause

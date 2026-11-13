@echo off
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo 未找到 Python。你可以直接双击 index.html 打开，或安装 Python 后重试。
  pause
  exit /b 1
)
python serve.py
pause

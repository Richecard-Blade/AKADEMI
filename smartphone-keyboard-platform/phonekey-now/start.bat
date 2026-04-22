@echo off
REM PhoneKey — Lanceur Windows
REM Double-clique sur ce fichier pour démarrer

echo.
echo  ⌨  PhoneKey — Installation des dependances...
echo.

python -m pip install --quiet websockets qrcode pyautogui

echo.
echo  Demarrage du serveur PhoneKey...
echo.

python "%~dp0server.py"

pause

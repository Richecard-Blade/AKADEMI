@echo off
title PhoneKey — Serveur clavier

echo.
echo  Installation des dependances...
python -m pip install --quiet websockets qrcode keyboard 2>nul

echo.
python "%~dp0server.py"

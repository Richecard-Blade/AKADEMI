@echo off
title PhoneKey — Serveur clavier

echo.
echo  Installation des dependances...
python -m pip install --quiet websockets qrcode 2>nul

echo.
echo  ========================================================
echo   PhoneKey demarre. Notez bien l'URL affichee ensuite.
echo   Cette fenetre disparait dans 3 secondes apres le lancement.
echo   Le serveur continue de tourner en arriere-plan.
echo   Pour arreter : Gestionnaire des taches ^> python.exe
echo  ========================================================
echo.

python "%~dp0server.py"

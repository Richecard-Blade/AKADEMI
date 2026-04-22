#!/bin/bash
# PhoneKey — Lanceur Linux/macOS
# Usage : ./start.sh
# Avec PIN : PHONEKEY_PIN=1234 ./start.sh

set -e

echo ""
echo "⌨  PhoneKey — Installation des dépendances..."

# Installer websockets et qrcode si absents
python3 -m pip install --quiet websockets qrcode 2>/dev/null \
  || pip3 install --quiet websockets qrcode

# Vérifier xdotool sur Linux
if [[ "$(uname)" == "Linux" ]]; then
  if ! command -v xdotool &>/dev/null; then
    echo ""
    echo "Installation de xdotool (nécessaire pour l'injection clavier)..."
    if command -v apt-get &>/dev/null; then
      sudo apt-get install -y xdotool
    elif command -v dnf &>/dev/null; then
      sudo dnf install -y xdotool
    elif command -v pacman &>/dev/null; then
      sudo pacman -S --noconfirm xdotool
    else
      echo "⚠  Installe xdotool manuellement puis relance."
      exit 1
    fi
  fi
fi

echo ""
python3 "$(dirname "$0")/server.py"

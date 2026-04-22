# ⌨ PhoneKey — Guide de lancement immédiat

> **Temps de setup : 2 minutes. Aucune installation d'app. Fonctionne sur tout smartphone.**

---

## Prérequis

| Besoin | Détail |
|--------|--------|
| **Python 3.8+** | Déjà installé sur macOS/Linux. [Windows : python.org](https://python.org) |
| **Même réseau WiFi** | Ton ordi et ton smartphone sur le même WiFi |
| **xdotool** | Linux uniquement (installé automatiquement par le script) |

---

## Lancement en 1 commande

### Linux / macOS
```bash
# Télécharge ce dossier, puis :
cd phonekey-now
chmod +x start.sh
./start.sh
```

### Windows
```
Double-clique sur start.bat
```

### Commande directe (si Python installé)
```bash
pip install websockets qrcode
python server.py
```

---

## Connexion depuis ton smartphone

1. Le terminal affiche une **URL** et un **QR code**
2. **Scanne le QR code** avec ton smartphone (ou tape l'URL dans le navigateur)
3. Le clavier s'ouvre dans le navigateur — **c'est prêt**

```
═══════════════════════════════════════════════
  ⌨  PhoneKey — Clavier smartphone activé
═══════════════════════════════════════════════

  📱 Sur ton smartphone, ouvre :

      http://192.168.1.42:7832

  [QR CODE AFFICHÉ ICI]

  [✓] Serveur prêt. En attente de connexion…
```

---

## Utilisation

### Clavier principal (onglet QWERTY)
- **Lettres et chiffres** : tap direct
- **Majuscule** : appuie sur ⇧ puis la lettre
- **Ctrl+C / Ctrl+V** : barre de raccourcis en bas
- **Touches flèches** : rangée du bas

### Onglets disponibles
| Onglet | Contenu |
|--------|---------|
| **QWERTY** | Clavier standard complet |
| **Spéciaux** | F1-F12, Home, End, PgUp, PgDn, Insert, Delete |
| **Macros** | Phrases prédéfinies (git commit, console.log, etc.) |
| **Pavé** | Pavé numérique |

### Raccourcis rapides (barre du bas)
- **Copier** → Ctrl+C
- **Coller** → Ctrl+V
- **Tout sélectionner** → Ctrl+A
- **Annuler** → Ctrl+Z
- **Rétablir** → Ctrl+Shift+Z

---

## Option sécurité (réseau partagé)

Lance avec un PIN pour que seul toi puisses te connecter :

```bash
# Linux/macOS
PHONEKEY_PIN=1234 ./start.sh

# Windows
set PHONEKEY_PIN=1234 && python server.py
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| "xdotool non trouvé" (Linux) | `sudo apt install xdotool` |
| Le smartphone ne voit pas le serveur | Vérifie que les deux appareils sont sur le même WiFi |
| Les touches ne s'injectent pas (macOS) | Autorise "Accessibilité" dans Préférences → Confidentialité |
| Les touches ne s'injectent pas (Windows) | Lance `start.bat` en tant qu'administrateur |
| Port déjà utilisé | Change `HTTP_PORT` et `WS_PORT` dans `server.py` |

### macOS — Autorisation accessibilité obligatoire

```
Préférences Système → Confidentialité et sécurité
→ Accessibilité → ajouter Terminal (ou iTerm)
```

---

## Partager avec un ami

Ton ami doit juste :
1. Être sur **ton réseau WiFi** (ou partage de connexion)
2. Ouvrir l'URL dans son navigateur
3. Commencer à taper

Aucune installation sur son téléphone.

---

## Ports utilisés

| Port | Usage |
|------|-------|
| 7832 | Interface web (HTTP) |
| 7833 | WebSocket (temps réel) |

Ouvre ces ports dans ton pare-feu si nécessaire.

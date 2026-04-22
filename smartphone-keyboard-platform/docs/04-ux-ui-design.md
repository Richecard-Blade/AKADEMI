# 4. UX/UI Design

## 4.1 Principes de design

| Principe | Application |
|----------|-------------|
| **Zéro friction** | Connexion en < 5 secondes, pas de configuration manuelle |
| **Confiance immédiate** | Indicateur de statut connexion toujours visible |
| **Performance perçue** | Feedback visuel/haptique instantané sur chaque touche |
| **Adaptation au contexte** | Layouts qui changent selon l'application active |
| **Accessibilité** | WCAG 2.1 AA, support VoiceOver / TalkBack |

---

## 4.2 Parcours utilisateur (User Journey)

### Première utilisation

```
[Téléchargement app]
        │
        ▼
[Splash screen + value proposition (3 sec)]
        │
        ▼
[Onboarding — 3 écrans max]
  Écran 1 : "Connectez votre téléphone à l'ordinateur"
            └─ Animation câble USB ou QR Code WiFi
  Écran 2 : "Installez l'agent sur votre ordinateur"
            └─ QR Code lien téléchargement + deeplink
  Écran 3 : "Prêt. Tapez."
            └─ Preview du clavier
        │
        ▼
[Détection automatique connexion]
  ┌─────────────────────────────┐
  │ USB détecté ?              │──YES──► Connexion instantanée
  │ (câble branché)            │         Confirmation haptique
  └─────────────────────────────┘
        │ NO
        ▼
  ┌─────────────────────────────┐
  │ Agent desktop sur réseau ? │──YES──► QR Code pairing
  │ (mDNS discovery)           │         < 5 secondes
  └─────────────────────────────┘
        │ NO
        ▼
  [Guide Bluetooth pairing]
        │
        ▼
[CLAVIER ACTIF — Interface principale]
```

### Utilisation quotidienne (usage récurrent)

```
[Ouvrir app]  ──►  [Reconnexion auto < 1 sec]  ──►  [Frappe immédiate]
    ▲                                                          │
    └──────────────────────────────────────────────────────────┘
                    Usage continu sans friction
```

---

## 4.3 Interface mobile — Écran principal

### Layout de l'écran clavier

```
┌──────────────────────────────────────────────────────┐
│ ●●●  PhoneKey          [USB ✓] [⚡Chargement]  ⚙️   │  ← Status bar
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Texte prévisualisé en temps réel]          │   │  ← Preview zone
│  │  Ce que vous tapez apparaît ici...           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [QWERTY] [AZERTY] [Macros] [Pad numérique] [F-Keys] │  ← Tabs layouts
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐ │
│  │ Q  │ W  │ E  │ R  │ T  │ Y  │ U  │ I  │ O  │ P  │ │
│  ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤ │
│  │ A  │ S  │ D  │ F  │ G  │ H  │ J  │ K  │ L  │ ⌫  │ │  ← Clavier
│  ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤ │
│  │⇧  │ Z  │ X  │ C  │ V  │ B  │ N  │ M  │ !  │ ↵  │ │
│  ├────┴────┴────┴────┴────┴────┴────┴────┴────┴────┤ │
│  │ Ctrl │ Alt │      SPACE           │ ← │ → │ Esc │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [Copier] [Coller] [Sélect tout] [Annuler] [Rétablir]│  ← Quick actions
└──────────────────────────────────────────────────────┘
```

### Spécifications des touches

| Élément | Valeur | Justification |
|---------|--------|---------------|
| Hauteur rangée touches | 52 dp | Zone cliquable confortable (min 44 dp Apple HIG) |
| Largeur touche standard | 9.5% écran | Adaptatif toutes tailles |
| Rayon coins touches | 8 dp | Design moderne, feedback visuel clair |
| Feedback haptique | 8ms vibration légère | Confirmation frappe sans bruit |
| Feedback visuel | Flash 80ms sur touche | Confirmation immédiate |
| Police sur touches | SF Pro / Roboto 16sp bold | Lisibilité maximale |
| Contraste couleur | > 4.5:1 (WCAG AA) | Accessibilité |
| Thème par défaut | Dark (fond #1A1A2E) | Réduction fatigue oculaire |

---

## 4.4 Layouts spécialisés

### Layout Macros (onglet Macros)

```
┌──────────────────────────────────────────────────────┐
│ MACROS                            [+ Nouvelle] [Edit] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌───────────────────┐  ┌───────────────────────┐   │
│  │ 📋 Git commit msg │  │ 📧 Email signature    │   │
│  │ "feat: {cursor}"  │  │ "Cordialement,\n..."  │   │
│  │ [Appuyer]         │  │ [Appuyer]             │   │
│  └───────────────────┘  └───────────────────────┘   │
│  ┌───────────────────┐  ┌───────────────────────┐   │
│  │ 🔐 SELECT * FROM  │  │ 💻 npm run dev        │   │
│  │ table WHERE id=   │  │ [Appuyer]             │   │
│  │ [Appuyer]         │  │                       │   │
│  └───────────────────┘  └───────────────────────┘   │
│                                                      │
│  [Réorganiser]  [Importer]  [Exporter]  [Partager]   │
└──────────────────────────────────────────────────────┘
```

### Création d'une macro

```
Déclencheur : texte trigger ou bouton dédié
Contenu     : texte statique OU dynamique (variables)
Variables   :
  {cursor}   → position curseur après insertion
  {date}     → date du jour (format configurable)
  {clip}     → contenu presse-papiers
  {input}    → popup demande de saisie
  {counter}  → compteur auto-incrémenté

Exemple macro développeur :
  Trigger : bouton "Console.log"
  Contenu : "console.log('{input:Variable}:', {input:Variable});"
  → Produit : console.log('user:', user);
```

### Layout touches de fonction (F-Keys)

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ F1  │ F2  │ F3  │ F4  │ F5  │ F6  │ F7  │ F8  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ F9  │ F10 │ F11 │ F12 │ Ins │ Del │ Home│ End │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│PgUp │PgDn │PrtSc│ScrLk│Paus │NumLk│     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### Pavé numérique

```
┌─────┬─────┬─────┬─────┐
│  7  │  8  │  9  │  /  │
├─────┼─────┼─────┼─────┤
│  4  │  5  │  6  │  *  │
├─────┼─────┼─────┼─────┤
│  1  │  2  │  3  │  -  │
├─────┼─────┼─────┼────-┤
│  0      │  .  │  +  │
├─────────┼─────┼─────┘
│  Entrée │  ←  │
└─────────┴─────┘
```

---

## 4.5 Fonctionnalités avancées UX

### Gestes sur l'écran clavier

| Geste | Action |
|-------|--------|
| Swipe gauche sur espace | Curseur ← |
| Swipe droite sur espace | Curseur → |
| Swipe haut sur lettre | Variante (é, è, ê, ë sur E) |
| Swipe bas sur touche | Caractère alternatif (chiffre) |
| Double tap Shift | Caps Lock |
| Long press touche | Répétition accélérée |
| Pinch sur clavier | Zoom taille clavier |
| 3-finger swipe haut | Basculer layout |

### Barre rapide contextuelle

Détecte l'application active sur le desktop et adapte la barre :

```
App détectée : VS Code
┌────────────────────────────────────────────────────┐
│ [Ctrl+`] [Ctrl+P] [Ctrl+Shift+P] [F5] [Ctrl+Z]   │
└────────────────────────────────────────────────────┘

App détectée : Terminal
┌────────────────────────────────────────────────────┐
│ [↑ Hist.] [Ctrl+C] [Ctrl+L] [Ctrl+D] [Tab] [!$]  │
└────────────────────────────────────────────────────┘

App détectée : Chrome / Safari
┌────────────────────────────────────────────────────┐
│ [Ctrl+T] [Ctrl+W] [Ctrl+L] [Ctrl+F] [Alt+←] [F5] │
└────────────────────────────────────────────────────┘
```

### Presse-papiers intelligent

```
[Icône clipboard en bas à droite]
    │
    ▼ [Appui long]
┌─────────────────────────────────────┐
│ HISTORIQUE PRESSE-PAPIERS (10 max)  │
├─────────────────────────────────────┤
│ 1. "npm install --save-dev..."      │ [Coller]
│ 2. "john.doe@email.com"            │ [Coller]
│ 3. SELECT * FROM users WHERE...     │ [Coller]
│ 4. https://github.com/...           │ [Coller]
├─────────────────────────────────────┤
│ [Effacer historique]  [Épingler]    │
└─────────────────────────────────────┘
```

---

## 4.6 Design tokens et charte graphique

```json
{
  "colors": {
    "background": {
      "primary": "#0F0F1A",
      "secondary": "#1A1A2E",
      "keyboard": "#16213E"
    },
    "key": {
      "default": "#0F3460",
      "pressed": "#E94560",
      "modifier": "#1A1A4E",
      "special": "#0D3349",
      "border": "#2A2A5E"
    },
    "accent": "#E94560",
    "success": "#00C896",
    "warning": "#FFB800",
    "error": "#FF4757",
    "text": {
      "primary": "#EEEEFF",
      "secondary": "#8888BB",
      "key": "#FFFFFF"
    }
  },
  "typography": {
    "keyLabel": { "size": 16, "weight": "600", "family": "system-ui" },
    "keySubLabel": { "size": 10, "weight": "400", "family": "system-ui" },
    "statusBar": { "size": 13, "weight": "500" }
  },
  "spacing": {
    "keyGap": 6,
    "keyBorderRadius": 8,
    "keyHeight": 52,
    "rowPadding": 4
  },
  "animation": {
    "keyPress": { "duration": 80, "easing": "ease-out" },
    "connectionBadge": { "duration": 300, "easing": "spring" }
  }
}
```

---

## 4.7 Écran de statut connexion

```
┌──────────────────────────────────────────────────────┐
│                  CONNEXION ACTIVE                    │
│                                                      │
│         ⚡ USB — MacBook Pro de Jean                │
│         ████████████████████  Latence: 3ms           │
│         Connecté depuis 1h 23min                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Touches     │  │  Caractères  │  │  Macros   │  │
│  │  envoyées    │  │  tapés       │  │  utilisées│  │
│  │   1,247      │  │    986       │  │    12     │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  [Changer de machine] [Déconnecter] [Paramètres]    │
└──────────────────────────────────────────────────────┘
```

---

## 4.8 Accessibilité

| Fonctionnalité | Implémentation |
|---------------|----------------|
| VoiceOver / TalkBack | Labels ARIA sur chaque touche, annonce du caractère tapé |
| Taille de police | Respecte Dynamic Type iOS / Font Scale Android |
| Contraste élevé | Mode WCAG AAA disponible (contrast > 7:1) |
| Switch Access | Navigation séquentielle alternative (Bluetooth switch) |
| Gaucher | Option inversion layout clavier |
| Tremblements | Délai ajustable avant répétition, zone tactile élargie |
| Mode monochrome | Support complet sans dépendance couleur seule |

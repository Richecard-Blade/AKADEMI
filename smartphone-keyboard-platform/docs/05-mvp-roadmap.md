# 5. MVP & Roadmap de développement

## 5.1 Définition du MVP

### Principe de sélection
Le MVP doit permettre de **valider l'hypothèse principale** : un smartphone peut remplacer efficacement un clavier physique avec une latence acceptable et une connexion fiable. Tout le reste est reporté.

### Fonctionnalités MVP (Phase 0 — Semaines 1-8)

| # | Fonctionnalité | Priorité | Effort |
|---|---------------|----------|--------|
| 1 | Connexion WiFi (WebSocket) via QR Code | MUST | M |
| 2 | Clavier QWERTY standard (lettres + chiffres) | MUST | M |
| 3 | Touches spéciales : Shift, Ctrl, Alt, Enter, Backspace, Esc | MUST | S |
| 4 | Touches flèches | MUST | S |
| 5 | Agent desktop Windows + macOS | MUST | L |
| 6 | Injection HID (SendInput / CGEventPost) | MUST | M |
| 7 | Pairing sécurisé par QR Code (TLS) | MUST | M |
| 8 | Indicateur statut connexion (connecté/déconnecté) | MUST | S |
| 9 | Reconnexion automatique | MUST | S |
| 10 | App mobile Android (React Native) | MUST | L |

### Ce qui N'est PAS dans le MVP

| Fonctionnalité | Raison du report |
|---------------|-----------------|
| Support USB | Complexité technique (AOA/MFi) — Phase 1 |
| Support iOS | Contraintes MFi/App Store — Phase 1 |
| Macros | Besoin validé mais non critique — Phase 1 |
| Presse-papiers synchronisé | Fonctionnalité confort — Phase 1 |
| Layouts personnalisés | Personnalisation — Phase 2 |
| App Linux desktop | Segment mineur au départ — Phase 1 |
| Mode BLE | Moins critique que WiFi — Phase 1 |
| Barre contextuelle apps | Complexité intégration — Phase 2 |
| Offre Cloud/Pro | Monétisation — Phase 2 |

---

## 5.2 Roadmap par phases

### Phase 0 — MVP Foundation (Semaines 1–8)

```
Semaine 1-2 : Infrastructure & Protocole
├── Setup mono-repo (pnpm workspaces + Cargo workspace)
├── Implémentation protocole PKP v1 (sérialisation binaire)
├── Serveur WebSocket TLS côté agent Rust (tokio-tungstenite)
└── Client WebSocket côté React Native

Semaine 3-4 : Clavier mobile de base
├── Composant clavier React Native (layout QWERTY)
├── Gestion touches : lettres, chiffres, spéciaux
├── Feedback haptique et visuel
└── Envoi événements KeyDown/KeyUp via WebSocket

Semaine 5-6 : Agent desktop + HID
├── Agent Rust : réception paquets PKP
├── HID injection Windows (SendInput API)
├── HID injection macOS (CGEventPost)
└── Gestion modifiers (Shift, Ctrl, Alt, Cmd/Win)

Semaine 7-8 : Connexion & Sécurité
├── Pairing QR Code (mDNS discovery + TLS cert auto-signé)
├── Reconnexion automatique (backoff exponentiel)
├── UI statut connexion mobile
└── Packaging agent desktop (installeur simple)

LIVRABLE : APK Android beta + Agent Win/Mac installable
CRITÈRE DE SUCCÈS : < 20 ms latence WiFi, 0 déconnexion/heure
```

### Phase 1 — Feature Completeness (Semaines 9–20)

```
Sprint 1 (S9-10) : Support USB Android
├── Implémentation AOA 2.0 côté app Android
├── Driver USB host côté agent Rust (rusb / libusb)
└── Détection automatique câble + fallback WiFi

Sprint 2 (S11-12) : Support iOS
├── Module ExternalAccessory Swift (ou usbmuxd tunnel)
├── Publication TestFlight beta
└── Gestion certificat MFi (ou workaround)

Sprint 3 (S13-14) : Macros & Raccourcis
├── Éditeur macros (texte statique + variables)
├── Bibliothèque de macros prédéfinies par métier
└── Exécution macro avec gestion {cursor}

Sprint 4 (S15-16) : Presse-papiers & Gestes
├── Sync presse-papiers bidirectionnel
├── Historique clipboard (10 entrées)
└── Gestes swipe sur espace (navigation curseur)

Sprint 5 (S17-18) : Linux + BLE
├── HID injection Linux (uinput)
├── Agent Rust : GATT server BLE (btleplug)
└── Pairing BLE sécurisé

Sprint 6 (S19-20) : Polissage MVP+
├── Onboarding animé (3 écrans)
├── Mode sombre / clair
├── Layouts AZERTY, QWERTZ
└── Paramètres avancés (délai répétition, taille touches)

LIVRABLE : v1.0 App Store + Google Play + Agent toutes plateformes
```

### Phase 2 — Différenciation (Semaines 21–36)

```
Sprint 7-8 : Barre contextuelle (app awareness)
├── Agent desktop : détection app active (accessibility API)
├── Envoi nom app vers mobile
└── Profils raccourcis par app (VS Code, Terminal, Chrome...)

Sprint 9-10 : Offre Pro & Cloud
├── Infrastructure cloud (Rust/Axum API)
├── Auth OIDC + gestion licences
├── Sync profils cross-device (chiffré E2E)
└── Système de paiement (Stripe)

Sprint 11-12 : Fonctionnalités avancées
├── Multi-machine (switcher entre 3 PC depuis 1 mobile)
├── Pavé tactile (mousepad mode)
├── Dictée vocale → texte (Whisper on-device)
└── Mode présentateur (slides control)

Sprint 13-14 : Offre Business
├── MDM deployment (APK enterprise / .msi GPO)
├── SSO SAML/OIDC
├── Audit logs (admin console)
└── Politique de sécurité centralisée

LIVRABLE : v2.0 avec offre Pro/Business
```

### Phase 3 — Scale & Ecosystem (Semaines 37–52)

```
- API publique pour intégrations tiers
- SDK pour éditeurs de logiciels (ajouter support PhoneKey)
- Marketplace de profils macros (communauté)
- Support tablettes comme clavier secondaire
- Mode gaming (layout WASD optimisé, anti-ghosting)
- Intégration native IDE (extension VS Code, JetBrains plugin)
```

---

## 5.3 Plan technique détaillé MVP

### Structure du mono-repo

```
phonekey/
├── apps/
│   ├── mobile/                 # React Native + Expo
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Keyboard/
│   │   │   │   │   ├── KeyboardLayout.tsx
│   │   │   │   │   ├── Key.tsx
│   │   │   │   │   └── ModifierKey.tsx
│   │   │   │   └── StatusBar/
│   │   │   ├── screens/
│   │   │   │   ├── KeyboardScreen.tsx
│   │   │   │   ├── ConnectionScreen.tsx
│   │   │   │   └── OnboardingScreen.tsx
│   │   │   ├── services/
│   │   │   │   ├── transport/
│   │   │   │   │   ├── WebSocketTransport.ts
│   │   │   │   │   ├── UsbTransport.ts      # Phase 1
│   │   │   │   │   └── BleTransport.ts      # Phase 1
│   │   │   │   ├── ConnectionManager.ts
│   │   │   │   └── MacroEngine.ts           # Phase 1
│   │   │   └── store/
│   │   │       └── connectionStore.ts
│   │   └── android/ ios/
│   │
│   └── desktop-agent/          # Rust
│       ├── src/
│       │   ├── main.rs
│       │   ├── transport/
│       │   │   ├── mod.rs
│       │   │   ├── websocket.rs
│       │   │   ├── usb.rs      # Phase 1
│       │   │   └── ble.rs      # Phase 1
│       │   ├── hid/
│       │   │   ├── mod.rs
│       │   │   ├── windows.rs
│       │   │   ├── macos.rs
│       │   │   └── linux.rs    # Phase 1
│       │   ├── protocol/
│       │   │   ├── mod.rs
│       │   │   ├── packet.rs
│       │   │   └── crypto.rs
│       │   └── pairing.rs
│       └── Cargo.toml
│
└── packages/
    └── shared-protocol/        # Types partagés (si WASM)
        ├── src/lib.rs
        └── Cargo.toml
```

### Métriques de succès MVP

| Métrique | Seuil minimal | Objectif |
|----------|--------------|----------|
| Latence médiane WiFi | < 30 ms | < 15 ms |
| Taux de reconnexion auto | > 95% | > 99% |
| Temps de connexion initiale | < 10 s | < 5 s |
| Crashs app mobile / jour | < 1 | 0 |
| Note App Store / Play Store | > 3.5 | > 4.5 |
| NPS beta testeurs | > 20 | > 50 |
| Rétention J7 | > 30% | > 50% |

---

## 5.4 Effort et équipe

### Équipe minimale MVP

| Rôle | Profil | Temps |
|------|--------|-------|
| Lead mobile dev | React Native senior | 100% 8 semaines |
| Lead backend/agent | Rust senior | 100% 8 semaines |
| UI/UX designer | Mobile designer | 50% 8 semaines |
| Product owner | Vous | 30% |

### Budget estimatif MVP

| Poste | Coût estimé |
|-------|------------|
| Développement (2 devs × 8 sem) | 20 000 – 30 000 € |
| Design | 3 000 – 5 000 € |
| Infrastructure (cloud beta) | 200 €/mois |
| Comptes développeur (Apple + Google) | 124 € |
| Devices de test | 500 € |
| **TOTAL MVP** | **~25 000 – 36 000 €** |

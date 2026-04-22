# 3. Architecture technique détaillée

## 3.1 Stack technologique

### Application Mobile (iOS + Android)

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Framework | React Native 0.74 + Expo | Code partagé iOS/Android, accès natif USB/BLE |
| Langage | TypeScript strict | Sécurité typage, partage types avec desktop |
| UI | React Native Skia | Rendu haute performance du clavier (60/120 fps) |
| État | Zustand | Léger, performant, pas de boilerplate Redux |
| USB Android | `react-native-usb` + module natif Java | Accès AOA 2.0 |
| USB iOS | Module natif Swift ExternalAccessory | Protocole MFi / usbmuxd |
| BLE | `react-native-ble-plx` | BLE GATT le plus mature en RN |
| WiFi découverte | `react-native-zeroconf` | mDNS/Bonjour sans config IP |
| Chiffrement | `react-native-quick-crypto` | Chiffrement natif (pas JS pur) |
| Tests | Jest + Detox | Tests unitaires et E2E |

### Agent Desktop

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Langage | Rust 1.78+ | Performances, sécurité mémoire, binaire natif |
| Runtime async | Tokio | Gestion concurrente USB/WiFi/BLE |
| HID injection Linux | `evdev` + `uinput` (crate) | Injection kernel-level, latence minimale |
| HID injection Windows | `SendInput` Win32 API | Standard Microsoft, compatible UAC |
| HID injection macOS | `CGEventPost` CoreGraphics | API native Apple |
| USB Host Android | `libusb-1.0` via crate `rusb` | Contrôle AOA côté desktop |
| USB iOS | `libimobiledevice` + usbmuxd | Tunnel TCP sur USB |
| Serveur WebSocket | `tokio-tungstenite` | WS sécurisé pour WiFi |
| BLE serveur | `btleplug` crate | GATT server cross-platform |
| Interface système tray | `tray-icon` crate | Icône système Windows/macOS/Linux |
| Packaging | Tauri v2 | Distribuer avec UI de config (optionnel) |
| Tests | `cargo test` + `criterion` (benchmarks) | |

### Services Cloud (optionnel, Pro/Business)

| Composant | Technologie | Usage |
|-----------|-------------|-------|
| API Backend | Rust (Axum) | Sync profils, licences |
| Base de données | PostgreSQL + Redis | Profils utilisateurs, sessions |
| Auth | OIDC / JWT | SSO Business |
| CDN updates | CloudFront | Distribution binaires agent |
| Monitoring | OpenTelemetry → Grafana | Métriques latence, usage |

---

## 3.2 Protocole de communication PhoneKey (PKP v1)

### Format de trame binaire

```
┌──────┬──────┬──────┬──────────┬─────────┬──────────────┬──────┐
│  2B  │  1B  │  1B  │    4B    │   2B    │   variable   │  4B  │
├──────┼──────┼──────┼──────────┼─────────┼──────────────┼──────┤
│Magic │ Ver  │ Type │  SeqNum  │ PayLen  │   Payload    │  CRC │
│0xPK  │ 0x01 │ enum │ uint32   │ uint16  │ AES-256-GCM  │CRC32 │
└──────┴──────┴──────┴──────────┴─────────┴──────────────┴──────┘
```

### Types de paquets

```rust
enum PacketType {
    // Contrôle
    Handshake       = 0x01,  // Échange clés + TOTP
    Keepalive       = 0x02,  // Ping/Pong toutes les 500ms
    Disconnect      = 0x03,  // Déconnexion propre
    
    // Entrées clavier
    KeyDown         = 0x10,  // Touche pressée
    KeyUp           = 0x11,  // Touche relâchée
    KeyCombo        = 0x12,  // Combinaison (Ctrl+C, etc.)
    
    // Texte
    TextInsert      = 0x20,  // Injection texte brut (optimisé macros)
    
    // Clipboard
    ClipboardSet    = 0x30,  // Envoyer contenu presse-papiers
    ClipboardGet    = 0x31,  // Demander contenu presse-papiers
    
    // Système
    MediaKey        = 0x40,  // Volume, play/pause, etc.
    SpecialKey      = 0x41,  // F1-F24, arrows, etc.
    
    // Sync
    ProfileSync     = 0x50,  // Synchroniser macros/layouts
}
```

### Payload KeyDown/KeyUp

```rust
struct KeyEvent {
    keycode: u16,       // HID Usage ID standard
    modifiers: u8,      // Bitmask: Ctrl|Shift|Alt|Super|...
    timestamp_us: u64,  // Timestamp microseconde côté mobile
    flags: u8,          // Repeat, injected, etc.
}
```

---

## 3.3 Gestion des inputs clavier en temps réel

### Pipeline de traitement côté mobile

```
Touch Event (native OS)
    │ ~0.5 ms (frame callback)
    ▼
Key Identification
    │ Lookup table keysym → HID keycode
    │ Application modifiers (Shift, Alt, etc.)
    ▼
Dead Key / Compose handling
    │ Gestion séquences (è = ` + e, etc.)
    ▼
Macro Engine Check
    │ Correspondance pattern → expansion
    ▼
Packet Builder
    │ Sérialisation binaire + chiffrement AES-GCM
    ▼
Transport Layer (USB / WiFi / BLE)
    │ Envoi sur le canal prioritaire disponible
    ▼
[Desktop Agent]
```

### Pipeline côté Desktop Agent

```
Receive Packet
    │
    ▼
Decrypt + Verify (AES-256-GCM + CRC)
    │
    ▼
Sequence Number Check (anti-replay)
    │
    ▼
HID Injector
    ├── Linux: write() → /dev/uinput
    ├── Windows: SendInput() avec KEYBDINPUT
    └── macOS: CGEventCreateKeyboardEvent()
    │
    ▼
Application active reçoit l'événement
```

---

## 3.4 Optimisation latence

### Techniques employées

#### 1. Prédiction de touche (speculative send)
- Le paquet est envoyé dès le `touchstart` (avant `touchend`)
- Si `touchend` rapide (< 50 ms) : la pression est considérée intentionnelle
- Annulation envoyée si `touchcancel` détecté (glissement accidentel)

#### 2. Batching adaptatif
```
Mode normal : envoi immédiat par touche
Mode texte rapide (> 8 touches/sec) : batch 2-3 touches, délai 2ms
→ Réduit les aller-retours réseau sans impact perceptible
```

#### 3. Transport USB : Bulk Transfers
- Pas de polling : interruption USB hardware sur événement
- Taille maximale buffer : 64 octets (1 paquet PKP = 20 octets typique)
- Latence effective : 1–3 ms câble + 0.5 ms traitement = **< 5 ms**

#### 4. Transport WiFi : WebSocket Nagle désactivé
```rust
stream.set_nodelay(true)?;  // Disable Nagle algorithm
// → Envoi immédiat sans attente buffer full
```

#### 5. Thread dédié haute priorité (desktop)
```rust
// Agent desktop : thread receveur avec priorité OS élevée
std::thread::Builder::new()
    .name("phonekey-hid-injector".into())
    .spawn(move || {
        set_thread_priority(ThreadPriority::Max);
        injection_loop(rx);
    })?;
```

### Benchmarks cibles

| Métrique | Objectif | Mesure de référence |
|----------|----------|-------------------|
| Latence USB bout-en-bout | ≤ 8 ms | Tests sur Pixel 7 + Ubuntu |
| Latence WiFi (LAN Gigabit) | ≤ 15 ms | Tests sur réseau 5GHz |
| Latence BLE 5.0 | ≤ 25 ms | Tests sur iPhone 14 |
| Débit max (touches/sec) | ≥ 20 kps | Macro expansion |
| CPU mobile (frappe normale) | ≤ 3% | Pixel 7 |
| CPU desktop | ≤ 0.5% | i7-10th gen |
| RAM agent desktop | ≤ 15 MB | Rust binaire statique |

---

## 3.5 Sécurité

### Modèle de menaces

| Menace | Vecteur | Mitigation |
|--------|---------|------------|
| Interception réseau (keylogger) | WiFi sniffing | TLS 1.3 + chiffrement payload AES-256-GCM |
| Connexion non autorisée | Réseau local compromis | TOTP pairing à usage unique |
| Replay attack | Capture et réinjection paquets | Sequence numbers + timestamps |
| Usurpation d'identité | Faux agent desktop | Certificat auto-signé épinglé lors du pairing |
| Accès physique USB | Câble malveillant | Confirmation visuelle obligatoire à chaque connexion |
| Exfiltration de données | Agent malveillant | Code open source, audit indépendant |

### Protocole de pairing

```
1. SCAN QR CODE
   Mobile affiche QR contenant :
   ├── Public key de l'agent (ECDH P-256)
   └── TOTP seed (30 secondes)

2. DESKTOP AGENT
   └── Vérifie TOTP dans la fenêtre de 30s

3. ÉCHANGE DE CLÉS (ECDH)
   └── Dérivation clé symétrique AES-256 (HKDF)
   └── Stockage sécurisé (Keychain iOS / Keystore Android)

4. SESSION ÉTABLIE
   └── Chaque paquet chiffré avec clé dérivée + nonce aléatoire
   └── Re-keying automatique toutes les 1000 paquets
```

### Audit et compliance

- Code agent desktop en **open source** (licence Apache 2.0)
- Protocole PKP entièrement documenté (RFC-style)
- Aucune donnée de frappe envoyée en cloud (vérifiable réseau)
- Compatible SOC 2 Type II (pour offre Business)
- RGPD : aucune PII collectée par défaut

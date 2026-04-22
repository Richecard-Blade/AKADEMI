# 2. Proposition de solution

## 2.1 Fonctionnement global de la plateforme

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHONEKEY PLATFORM                         │
│                                                                   │
│  ┌──────────────────┐         ┌─────────────────────────────┐   │
│  │   MOBILE APP     │         │      DESKTOP AGENT          │   │
│  │  (React Native)  │◄───────►│         (Rust)              │   │
│  │                  │  USB /  │                             │   │
│  │  ┌────────────┐  │  WiFi / │  ┌─────────────────────┐   │   │
│  │  │ Keyboard   │  │  BLE    │  │  HID Emulation      │   │   │
│  │  │ Interface  │  │         │  │  (uinput / WinAPI)  │   │   │
│  │  └────────────┘  │         │  └─────────────────────┘   │   │
│  │  ┌────────────┐  │         │  ┌─────────────────────┐   │   │
│  │  │ Macro      │  │         │  │  Transport Manager  │   │   │
│  │  │ Engine     │  │         │  │  USB > WiFi > BLE   │   │   │
│  │  └────────────┘  │         │  └─────────────────────┘   │   │
│  │  ┌────────────┐  │         │  ┌─────────────────────┐   │   │
│  │  │ Connection │  │         │  │  Security Layer     │   │   │
│  │  │ Manager   │  │         │  │  TLS 1.3 + TOTP     │   │   │
│  │  └────────────┘  │         │  └─────────────────────┘   │   │
│  └──────────────────┘         └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de données — frappe d'une touche

```
[Touche pressée sur mobile]
        │
        ▼ (< 1 ms)
[Capture événement touch]
        │
        ▼ (< 1 ms)
[Encodage KeyCode → protocole PhoneKey]
        │
        ▼
[Transport sélectionné automatiquement]
   USB (< 2 ms) │ WiFi (< 8 ms) │ BLE (< 15 ms)
        │
        ▼
[Agent desktop reçoit le paquet]
        │
        ▼ (< 1 ms)
[Injection HID via OS API]
        │
        ▼
[Caractère apparaît dans l'application active]

TOTAL : ≤ 8 ms (USB), ≤ 15 ms (WiFi), ≤ 25 ms (BLE)
```

---

## 2.2 Comparaison USB vs WiFi vs Bluetooth

### Tableau comparatif complet

| Critère | USB (AOA/NCM) | WiFi (LAN) | Bluetooth BLE |
|---------|--------------|------------|---------------|
| **Latence** | 2–5 ms | 5–15 ms | 15–30 ms |
| **Fiabilité** | Excellente | Très bonne | Bonne |
| **Bande passante** | 480 Mbps | 100+ Mbps | 2 Mbps |
| **Portée** | Câble (1–3 m) | ~50 m (LAN) | ~10 m |
| **Setup** | Plug-and-play | Réseau commun requis | Pairing manuel |
| **Sécurité** | Physique (excellente) | TLS requis (bonne) | Bonne (si BLE 4.2+) |
| **Consommation batterie mobile** | Recharge pendant usage | Modérée | Faible |
| **Compatibilité** | Android (AOA 2.0+) / iOS (Lightning/USB-C) | Universel | Universel |
| **Fonctionne sans réseau** | Oui | Non (LAN requis) | Oui |
| **Coût infra** | Nul | Nul (LAN existant) | Nul |

### Recommandation : Priorité de connexion automatique

```
Priorité 1 : USB filaire
   └─► Détection automatique du câble USB
   └─► Protocole : Android Open Accessory (AOA) 2.0 sur Android
   └─► Protocole : MFi / USB-C sur iOS (avec fallback WebUSB)

Priorité 2 : WiFi local
   └─► Détection automatique via mDNS/Bonjour (zeroconf)
   └─► Pas de configuration IP manuelle
   └─► WebSocket sécurisé TLS 1.3

Priorité 3 : Bluetooth BLE
   └─► HID over GATT Profile
   └─► Pairing TOTP one-time uniquement
   └─► Reconnexion automatique
```

### Détail USB — Architecture AOA (Android)

```
Android App
    │
    │  USB Cable
    │
    ▼
Desktop Agent (USB Host mode via AOA)
    │
    ├─ AOA Bulk Transfer (data channel)
    ├─ AOA Interrupt Transfer (keyboard HID events)
    └─ AOA isochronous (si audio futur)
```

**Android Open Accessory 2.0** permet à l'ordinateur (via l'agent) d'agir comme "USB Accessory Host", transformant le téléphone en périphérique USB sans jailbreak ni root.

**iOS** : Utilise le protocole ExternalAccessory sur Lightning ou USB-C natif. Nécessite un certificat MFi pour distribution App Store (ou TestFlight pour beta). Alternative : tunneling TCP via `usbmuxd` (déjà utilisé par `idb`/`libimobiledevice`).

---

## 2.3 Architecture système globale

### Composants de la plateforme

```
┌─────────────────────────────────────────────────────────┐
│                    PHONEKEY ECOSYSTEM                    │
├──────────────────┬──────────────────┬───────────────────┤
│   Mobile App     │  Desktop Agent   │  Cloud Services   │
│  (iOS/Android)   │ (Win/Mac/Linux)  │   (optionnel)     │
├──────────────────┼──────────────────┼───────────────────┤
│ React Native     │ Rust binary      │ Sync profiles     │
│ Expo             │ Tauri (UI)       │ Licence mgmt      │
│ TypeScript       │ tokio async      │ Analytics opt-in  │
│                  │ hidapi crate     │ Update server     │
├──────────────────┴──────────────────┴───────────────────┤
│              PROTOCOLE PHONEKEY (PKP v1)                │
│  Binary framing · AES-256-GCM · Sequence numbers       │
│  Keepalive · Auto-reconnect · Compression LZ4           │
└─────────────────────────────────────────────────────────┘
```

### Pas de serveur intermédiaire

- Toute communication est **peer-to-peer locale** (USB, WiFi LAN, BLE)
- Le cloud est **optionnel** et uniquement pour : sync de profils, licences, mises à jour
- **Aucune frappe ne transite par internet** — garantie architecturale de confidentialité

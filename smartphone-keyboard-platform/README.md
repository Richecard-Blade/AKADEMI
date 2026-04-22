# PhoneKey — Smartphone as External Keyboard Platform

> Turn any smartphone into a reliable, low-latency external keyboard for any computer.

---

## Vision

PhoneKey resolves a universal pain point: keyboard unavailability.  
Whether your physical keyboard fails, you're traveling light, or you want a smarter input surface,  
your smartphone becomes a full-featured, secure, professional-grade keyboard in seconds.

---

## Table of Contents

1. [Analyse du besoin](docs/01-analyse-du-besoin.md)
2. [Proposition de solution](docs/02-proposition-de-solution.md)
3. [Architecture technique](docs/03-architecture-technique.md)
4. [UX/UI Design](docs/04-ux-ui-design.md)
5. [MVP & Roadmap](docs/05-mvp-roadmap.md)
6. [Différenciation & Innovation](docs/06-differenciation-innovation.md)

---

## Quick Summary

| Dimension         | Choix                                      |
|-------------------|--------------------------------------------|
| Transport primaire | USB (HID over AOA / NCM)                  |
| Fallback 1        | WiFi local (WebSocket chiffré, <5 ms)      |
| Fallback 2        | Bluetooth BLE HID                          |
| App mobile        | React Native (iOS + Android)               |
| Agent desktop     | Rust (Windows/macOS/Linux)                 |
| Latence cible     | ≤ 8 ms USB, ≤ 15 ms WiFi, ≤ 25 ms BLE    |
| Sécurité          | TLS 1.3 + TOTP pairing + chiffrement E2E  |

---

## Project Structure

```
smartphone-keyboard-platform/
├── docs/                    # Specifications and design documents
├── src/
│   ├── mobile/              # React Native application
│   ├── desktop/             # Rust desktop agent
│   └── shared/              # Shared types, protocols, utils
└── design/                  # UI mockups and design tokens
```

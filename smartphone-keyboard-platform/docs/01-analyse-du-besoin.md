# 1. Analyse du besoin

## 1.1 Cas d'usage principaux

### Urgence / Dépannage
| Scénario | Fréquence estimée | Criticité |
|----------|------------------|-----------|
| Clavier physique en panne (liquide, chute, usure) | Très fréquent | Critique |
| Clavier manquant en déplacement professionnel | Fréquent | Haute |
| Clavier introuvable dans un open space / salle de réunion | Courant | Moyenne |
| Ordinateur emprunté sans clavier disponible | Occasionnel | Haute |

### Productivité / Confort
| Scénario | Valeur apportée |
|----------|----------------|
| Développeur : macros, snippets de code, raccourcis IDE | Gain de temps significatif |
| Présentateur : contrôle slides à distance | Fluidité de présentation |
| Gestionnaire de contenu : copier-coller multi-presse-papiers | Réduction d'erreurs |
| Utilisateur couché/éloigné de l'écran (TV/monitor distant) | Confort d'usage |
| Saisie en langue non supportée par le clavier physique | Accessibilité |

### Environnements professionnels spéciaux
| Contexte | Besoin spécifique |
|----------|------------------|
| Salle blanche / laboratoire | Clavier sans contact physique sur l'ordinateur |
| Datacenter | Administration serveur headless sans clavier dédié |
| Environnement sécurisé (BYOD restreint) | Saisie via appareil personnel contrôlé |
| Télétravail multi-postes | Un seul smartphone contrôle plusieurs machines |

---

## 1.2 Utilisateurs cibles

### Segment 1 — Professionnels IT (prioritaire)
- **Profil** : Développeurs, sysadmins, DevOps
- **Besoins** : Macros, raccourcis clavier complexes, latence ultra-faible
- **Sensibilité** : Sécurité, fiabilité, personnalisation poussée
- **Volumétrie** : ~50 M d'utilisateurs mondiaux potentiels

### Segment 2 — Travailleurs du savoir
- **Profil** : Rédacteurs, managers, consultants, étudiants
- **Besoins** : Simplicité de connexion, fiabilité quotidienne
- **Sensibilité** : Facilité d'utilisation, vitesse de setup
- **Volumétrie** : ~200 M d'utilisateurs potentiels

### Segment 3 — Créatifs et présentateurs
- **Profil** : Graphistes, formateurs, orateurs
- **Besoins** : Raccourcis logiciels (Figma, Premiere), contrôle à distance
- **Sensibilité** : Ergonomie de l'interface, customisation
- **Volumétrie** : ~30 M d'utilisateurs potentiels

### Segment 4 — Utilisateurs occasionnels
- **Profil** : Grand public, seniors, utilisateurs multi-appareils
- **Besoins** : Solution de secours simple, plug-and-play
- **Sensibilité** : Prix, simplicité
- **Volumétrie** : ~500 M d'utilisateurs potentiels

---

## 1.3 Problèmes des solutions existantes

### Analyse concurrentielle

| Solution existante | Problèmes identifiés |
|-------------------|---------------------|
| **Remote Mouse** | Latence élevée WiFi (30-80 ms), pas de support USB, sécurité douteuse, UX dépassée |
| **Unified Remote** | Architecture client-serveur lourde, configuration complexe, pas d'USB, freemium agressif |
| **InputStick** (dongle Bluetooth) | Matériel supplémentaire requis, coût, perte possible, pas de mobile natif |
| **Typeeto** (macOS uniquement) | Limité à un seul OS, Bluetooth uniquement, pas d'app dédiée |
| **Serverless Keyboard** | Abandonné, non maintenu, sécurité nulle |
| **KiwiMote** | Interface mobile médiocre, latence non optimisée, peu de fonctionnalités |

### Pain points universels identifiés

1. **Latence** : Toutes les solutions WiFi/BT dépassent 30 ms, imperceptible pour la frappe normale mais pénalisant pour les raccourcis rapides
2. **Fiabilité de connexion** : Déconnexions fréquentes, reconnexion manuelle requise
3. **Sécurité** : Trafic en clair ou chiffrement faible (risque keylogger réseau)
4. **Support USB absent** : Aucune solution grand public n'exploite la connexion USB filaire
5. **UX mobile insuffisante** : Claviers virtuels standards non optimisés pour le cas d'usage
6. **Personnalisation limitée** : Impossibilité de créer des macros, layouts personnalisés
7. **Multi-OS incomplet** : Rares solutions couvrent Windows + macOS + Linux simultanément
8. **Pas de mode offline** : Dépendance réseau même en local
9. **Onboarding complexe** : Configuration réseau requise (IP, ports firewall)

---

## 1.4 Opportunité de marché

- **TAM** (Total Addressable Market) : ~780 M de travailleurs avec ordinateur + smartphone
- **SAM** (Serviceable Addressable Market) : ~150 M en pays développés, actifs sur ordinateur daily
- **SOM** (Serviceable Obtainable Market) an 1 : ~500 K utilisateurs (niche IT + early adopters)

### Modèle de monétisation envisagé
- **Freemium** : Usage basique gratuit (1 profil, WiFi/BT uniquement)
- **Pro** (4,99€/mois) : USB, macros illimitées, multi-machine, chiffrement renforcé
- **Business** (14,99€/mois/siège) : Déploiement MDM, audit logs, SSO

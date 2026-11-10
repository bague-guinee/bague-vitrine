# BAGUÉ — Architecture technique finale

Système national d'identification du bétail par empreinte de mufle (Guinée).
Version finale du 4 novembre 2026. Elle remplace la version du 2 novembre
(application Flutter, empreinte 512-d, détecteur YOLOv8-pose, tablettes).

Documents de référence (claude.ai) :

- Architecture technique finale (avec schémas) : https://claude.ai/artifact/74hjD9Ap86Bf7efDHgnsXK
- Réseau national de boîtiers et traçabilité (terrain, humain, gouvernance) : https://claude.ai/artifact/HPB8uJNJjJBmW7WDJKYK77
- Stratégie technique frugale et coûts : https://claude.ai/artifact/P4WTKch3ENrdwEkrEsZQRr

---

## 1. Décisions finales

| Sujet | Décision | Pourquoi |
|---|---|---|
| Éleveur | Téléphone à touches : USSD, SMS, guichet | Ni smartphone ni lecture exigés |
| Kits de terrain (barrage, marché, frontière) | Raspberry Pi CM5 2 Go + caméra à mise au point fixe dans un cône à LED, 165–250 USD | Photos régulières, appareil dédié, même logiciel partout |
| Postes fixes (sous-préfectures, grands marchés, abattoirs) | CM5 4 Go solaire, toujours connecté, serveur Wi-Fi local, 920–1 520 USD | Relais du système ; recharge les kits chaque matin |
| Mode de contrôle | Vérification 1 contre 1 (boucle/carte/QR puis mufle) ; 1 contre tous seulement pour doublons et liste rouge | Fausses alertes rares même à des millions d'animaux |
| Détecteur | YOLOX-Nano ou NanoDet-Plus, 3 classes (mufle, narine gauche, narine droite), Apache-2.0 | Alignement par les narines, pas de licence AGPL (Ultralytics) |
| Encodeur | MobileNetV4-Conv-S distillé depuis ConvNeXt-Nano (ArcFace) | 3,8 M paramètres, 0,2 GMAC |
| Empreinte | 128 dimensions int8 (128 octets) ; 64 premières dimensions pour le QR (entraînement « Matryoshka ») | 16× plus léger que 512-d float32 |
| Inférence | ONNX Runtime partout (kits, postes, serveur), int8 | Un seul fichier de modèle, aucune conversion |
| Base | PostgreSQL 16 + pgvector (`halfvec(128)`, HNSW, pré-filtre `bit(128)`) ; SQLite sur les CM5 | Une seule base relationnelle + vectorielle |
| Hébergement | VPS Hetzner pour le pilote (≈ 30–171 USD/mois selon la taille) ; migration au centre de données national Tier 3 de Conakry au passage à l'échelle ; VPS européen gardé en sauvegarde chiffrée | Aucun achat avant validation ; souveraineté ensuite |
| Coût technique | ≈ 105 / 451 / 2 703 USD par mois pour 10 000 / 100 000 / 1 000 000 de vaches | ≈ 0,03 USD par vache et par an à grande échelle |

---

## 2. Vue d'ensemble

```
 Éleveur (téléphone à touches) ⇄ Opérateurs (USSD, SMS) ⇄ SERVEUR CENTRAL ──► Stockage objet
                                                          (VPS → Conakry)     (recadrages, sauvegardes)
                                                            ▲          ▲
                                               4G continu   │          │ HTTPS
                                                            ▼          ▼
                                                    POSTE CM5        Tableau de bord autorités
                                         (sous-préfecture, marché, abattoir)
                                                            │ Wi-Fi chaque matin
                                  ┌─────────────────────────┼─────────────────────────┐
                                  ▼                         ▼                         ▼
                           Kit CM5 barrage           Kit CM5 marché           Kit CM5 frontière
                           (4G, liste rouge)        (tournée des marchés)     (animaux importés)
```

Chaque niveau fonctionne seul quelque temps : kit sans réseau = liste rouge du matin ;
poste coupé = registre de sa région ; serveur central = USSD toujours disponible.

---

## 3. Composants

| Composant | Matériel | Logiciel | Données gardées |
|---|---|---|---|
| Kit CM5 | CM5 2 Go, eMMC 16 Go, Camera Module 3 + cône rond à LED, écran 5" sur le dessus (portrait), gâchette, 4G Cat-1 + GPS (sauf marché), 4×21700. Prototype : CM5 4 Go sur carte Waveshare CM5-IO-BASE-A, sans 4G ; fichiers 3D dans `hardware/` | Linux, appli BAGUÉ Python, ONNX Runtime, SQLite | Liste rouge, empreintes en transit et de la zone, file d'événements signés |
| Poste CM5 | CM5 4 Go, écran 7", 1–2 caméras (guichet + perche), routeur 4G double SIM, imprimante thermique, solaire 200 W + LiFePO4 100 Ah | Même appli en mode poste + serveur local de synchro | Registre régional int8 (≈ 400 Mo / 1 M vaches), liste rouge, file d'événements |
| Serveur central | VPS puis centre national | FastAPI, PostgreSQL + pgvector, ONNX Runtime, Caddy, Docker Compose | Registre national complet |
| Passerelle opérateurs | — | API SMS Orange Guinée, agrégateur multi-opérateurs, USSD | Journal des échanges |
| Stockage / sauvegarde | Stockage objet (Hetzner), second site | pgBackRest ou WAL-G | Recadrages 384 px WebP, sauvegardes chiffrées |
| Tableau de bord | Navigateur | Appli web + carte des préfectures | Rien en local |
| Surveillance | — | Uptime Kuma, Prometheus + Grafana, GlitchTip | Métriques |

---

## 4. Pipeline biométrique

```
Photo dans le cône (distance et lumière fixes)
  → Contrôle qualité (variance du laplacien, lumière, contraste, taille) — rejet = reprendre
  → Détection YOLOX-Nano int8 : mufle + 2 narines
  → Alignement (narines horizontales, carré natif)        bague_bio/alignment.py
  → Normalisation 224×224 + CLAHE                         bague_bio/preprocess.py
  → MobileNetV4-Conv-S int8 → 128-d L2 → int8 (128 octets)
  → Comparaison : 1 contre 1 (boucle/carte/QR), puis liste rouge
  → Décision VERT / ROUGE à confirmer / ORANGE / GRIS     bague_bio/matcher.py
```

| Résultat | Condition | Action |
|---|---|---|
| Vert | Correspond à l'animal annoncé, au-dessus du seuil 1:1, non signalé | Propriétaire affiché (téléphone masqué pour un acheteur) |
| Rouge à confirmer | Correspond à un animal de la liste rouge | 2e photo vs 3–5 empreintes de l'animal volé, mufles côte à côte, robe et sexe |
| Rouge confirmé | 2e photo conforme | Mise à l'écart discrète, procès-verbal, propriétaire + gendarmerie prévenus |
| Orange | Zone grise ou marge insuffisante | Refaire la photo ; jamais de saisie |
| Gris | Aucun animal | Inconnu ; enrôlement sur place au marché ; aucune sanction |

Seuils : 1:1 calibré à FMR ≤ 1/10 000 ; liste rouge et registre visés à 1/1 000 000 avec
confirmation humaine ; marge obligatoire entre 1er et 2e animal. Recalibrés à chaque `model_version`.

---

## 5. Données

Trois registres séparés :

| Registre | Tables | Qui écrit |
|---|---|---|
| Identité (ne change jamais) | `cattle`, `muzzle_templates` (`halfvec(128)` + `model_version`) | Agent habilité, avec photo du mufle |
| Propriété (change, se conteste) | `cattle_owners`, `ownership_transfers`, `ownership_oppositions` | Éleveur (USSD/guichet), poste, comité de médiation |
| Événements (ajout seulement) | `verification_scans`, `theft_reports`, `travel_certificates`, `health_events`, `device_events` | Chaque point de service |
| Référentiels | `users`, `sites`, `devices`, `agent_credentials`, `prefectures` (9 régions, 44 préfectures, décret du 20/08/2026) | Administration |
| Recours et messages | `disputes`, `sms_messages`, `ussd_sessions`, `payments` | Serveur |

Règles conservées de la version précédente : `model_version` sur chaque empreinte (jamais de
mélange entre modèles) ; un seul signalement ouvert par animal ; `UNIQUE(owner_id, client_ref)`
pour l'idempotence hors ligne ; préfectures en table ; `verification_scans` = journal d'audit.

Règles ajoutées : propriété « déclarée » puis « confirmée » après 30 jours sans opposition ;
un mufle proche à l'enrôlement part en vérification humaine (jamais de refus automatique) ;
statut inactif après 3 ans sans scan ; jamais de taille de troupeau ni de GPS renvoyé à un
acheteur ou à un agent de barrage ; aucun export en masse.

Formats : empreinte serveur `halfvec(128)` (256 o) ; empreinte CM5/réseau int8 (128 o) ;
empreinte QR 64 o (30 animaux max par QR) ; recadrage WebP 384 px (≈ 25–30 Ko) ;
fiches/événements CBOR + zstd. Les photos brutes ne sont pas gardées.

---

## 6. Synchronisation

| Liaison | Canal | Quand |
|---|---|---|
| Poste ↔ serveur | 4G double SIM (fibre si dispo) | En continu |
| Kit ↔ poste | Wi-Fi local | Chaque matin et soir |
| Kit → serveur | 4G Cat-1 | Dès qu'il y a du réseau |
| Serveur → kit hors réseau | SMS signé, lots de 10 numéros | Vol urgent seulement |
| Éleveur ↔ serveur | USSD / SMS via opérateurs | À la demande |

Événements créés sur l'appareil (UUID, heure GPS, position, signature Ed25519), idempotents ;
mises à jour différentielles ; envois reprenables (tus).
Règles de conflit : le vol gagne toujours ; un mufle = une identité (le 2e enrôlement part en
vérification) ; inconnu localement = gris provisoire sans sanction ; liste rouge > 24 h signalée,
> 72 h mention « non à jour » ; ordre des événements = heure GPS.

---

## 7. Sécurité

- Clé Ed25519 par appareil, disque chiffré, révocation et effacement à distance.
- 10 % des scans envoient leur recadrage ; le serveur recalcule l'empreinte (anti-falsification).
- Certificats de voyage : CBOR + signature Ed25519 de l'État + Base45, vérifiables hors ligne ;
  liste d'annulation synchronisée. Clés de l'État uniquement sur le serveur central, rotation prévue.
- Agents : carte NFC + PIN ; pas d'animal sans photo valide ; audits au hasard.
- Rôles : éleveur, agent d'élevage, agent de marché, vétérinaire, police, douane, administrateur.
- Sauvegarde complète quotidienne + archivage continu des journaux PostgreSQL sur un second site ;
  restauration testée chaque mois.
- Cadre légal : loi L/2016/037/AN ; le décret créant le registre interdit son usage fiscal.

---

## 8. Hébergement

| Registre | Serveurs (Hetzner, oct. 2026) | Par mois |
|---|---|---|
| 10 000 vaches | CPX22 + stockage objet 1 To | ≈ 30 USD |
| 100 000 vaches | CPX32 + stockage objet | ≈ 49 USD |
| 1 000 000 vaches | API CPX32 + base CPX42 + réplique CPX32 + stockage | ≈ 171 USD |

Serveur de test conseillé (CPX22, ≈ 23 USD/mois). Mises à jour signées, d'abord sur 5 % des
appareils. Nouveau modèle = nouvelle `model_version` + recalcul depuis les recadrages.

Migration vers le centre national : mêmes conteneurs ; réplication PostgreSQL quelques jours ;
bascule un soir de faible activité (les appareils gardent leur file) ; VPS européen en lecture
seule un mois, puis sauvegarde chiffrée hors site (≈ 10–40 USD/mois).
Coût en Guinée (hypothèses, pas de tarif publié) : achat 10 000–20 000 USD ; ≈ 1 100–2 500 USD/mois
si BAGUÉ paie tout, ≈ 250–500 USD/mois si l'État fournit place, électricité et connexion.

---

## 9. Données et entraînement de l'IA

### Collecte (phase 1, 3 à 6 mois)

Objectif minimum avant pilote : 1 500 à 3 000 animaux, 8 à 15 photos chacun, au moins 2 séances
espacées de plusieurs semaines. Zones contrastées : Fouta-Djalon (N'Dama), Haute-Guinée (zébus
croisés, transhumance), un grand marché. Binômes enquêteur + vétérinaire, pendant les campagnes de
vaccination. Collecte avec les kits CM5 (mode « collecte ») et leur cône, pour que les photos
d'entraînement ressemblent à celles du terrain. Boucle temporaire comme vérité terrain.
Consentement de l'éleveur ; données personnelles séparées des photos.

Données publiques pour démarrer (vérifier les licences) :
- https://rune.une.edu.au/web/handle/1959.11/37490
- https://researchdata.edu.au/biometric-identification-cattle-learning-context/4023986

### Étiquetage

Détecteur : 1 500 à 2 000 images annotées (boîte du mufle + 2 boîtes de narines) dans CVAT ou
Label Studio → YOLOX-Nano ou NanoDet-Plus → ONNX int8. Identités : structure de dossiers
`data/muzzles/<id_animal>/*.jpg`, alignés avec `training/align_dataset.py`.

### Entraînement

| Étape | Détail |
|---|---|
| Découpage | Par animal (70 / 15 / 15) |
| Prétraitement | Même détecteur et même alignement qu'en production, puis `bague_bio/preprocess.py` |
| Augmentations | Recadrage, rotation ±12°, perspective, couleur, flou, effacement ; pas de miroir |
| Professeur | ConvNeXt-Nano + ArcFace (s = 30, m = 0,4) |
| Élève (production) | MobileNetV4-Conv-S, distillation des empreintes du professeur, tête 128-d, perte aussi sur les 64 premières dimensions |
| Export | ONNX, quantification int8 statique (≈ 500 photos de calibration), test de parité (cosinus ≥ 0,99, taux d'erreur ±1 point) ; QAT si besoin |
| Calibration | Seuil 1:1 à FMR ≤ 1/10 000 ; liste rouge à 1/1 000 000 ; critères pilote : rang-1 ≥ 98 %, FRR au seuil ≤ 5 % |

Amélioration continue : chaque ORANGE suivi d'un VERT devient une paire difficile ;
ré-entraînement trimestriel ; nouvelle `model_version` ; recalcul ; bascule.

---

## 10. Écarts avec le code actuel (`bague-backend`)

Fait (version 0.2.0) :

- [x] Cœur biométrique isolé dans `bague_bio/`, partagé par le serveur, le kit et l'entraînement
- [x] `EMBEDDING_DIM` 512 → 128 (refus clair d'une ancienne base 512) ; perte Matryoshka sur 64 ; têtes ArcFace et AdaFace
- [x] Distillation ConvNeXt-Nano → MobileNetV4-Conv-S ; export ONNX ; int8 statique avec contrôle de parité
- [x] Protocole d'évaluation `bague_bio/evaluation` : inter-séances, ensemble ouvert, bootstrap par animal, sous-groupes, seuils figés
- [x] Manifeste contrôlé (consentement, colonnes personnelles interdites, doublons, découpage par animal sans fuite)
- [x] Qualité : reflets, score, meilleure image d'une rafale de 3 sur le kit
- [x] Pas de ROUGE sur une seule photo : `POST /verify` demande une 2e photo (`needs_confirmation`), `confirm_alert`
- [x] Dossier `edge/` (kit) : caméra, interface plein écran, file hors ligne ; route `/ussd`

Fait (version 0.3.0) :

- [x] Règle des deux photos complète : la 2e photo doit être une nouvelle prise (`same_frame` refuse un doublon)
- [x] Kit : image carrée (centre 1296 × 1296), interface portrait et paysage
- [x] Matériel par code (`hardware/`) : bague avant, 3 cônes ronds (110, 130, 150 mm), bords souples, corps du kit, contrôles en volume
- [x] Fichiers d'impression posés sur le plateau et fiches de réglages (Raise3D Pro2 Plus, PLA ou ABS, TPU)
- [x] Normes du dépôt : licence, citation, journal des versions, règles de contribution, contrôles avant commit

Reste à faire :

- [ ] Décodeur YOLOv8-pose → YOLOX-Nano / NanoDet-Plus 3 classes dans `alignment.py`
- [ ] Migration `muzzle_templates.embedding` → `halfvec(128)` ; quantification int8 des empreintes stockées
- [ ] `POST /verify` 1:1 avec numéro annoncé ; propriété déclarée/confirmée ; inactifs
- [ ] Tables `sites`, `agent_credentials`, `device_events`, `cattle_owners`, `travel_certificates`, `health_events`, `disputes`, `sms_messages`, `ussd_sessions`, `payments`
- [ ] Routes `/devices/sync`, `/devices/{id}/bundle`, `/sms/inbound`, certificats, validation des ventes, recours
- [ ] Signatures Ed25519 ; certificats CBOR/Base45 ; SMS groupés vers les kits hors réseau
- [ ] Kit : modèle int8 et liste rouge en local (contrôle sans réseau), SQLite, mises à jour signées, impression
- [ ] Docker Compose de production (Caddy, sauvegardes, surveillance), passerelle USSD/SMS réelle
- [ ] Mesures sur le CM5 (latence, autonomie) et sur de vrais mufles guinéens

L'application Flutter prévue au départ est abandonnée.

---

## 11. Questions ouvertes

Avec l'État, avant le pilote : tarif et conditions du centre de données national ; code USSD
commun et tarif SMS de service public (ARPT, opérateurs) ; hébergement hors de Guinée accepté ou
non pendant le pilote.

Pendant le pilote : précision réelle du modèle int8 128-d (et de l'empreinte 64 o) sur mufles
guinéens ; cône (photos acceptées, tailles selon les races, temps par scan) ; autonomie des kits,
temps de calcul sur CM5, prix définitifs des CM5 après devis.

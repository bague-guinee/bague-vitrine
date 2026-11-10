# BAGUÉ — Veille scientifique sur l'identification par le mufle

Notes de lecture d'articles utiles au projet, avec ce qu'ils changent (ou confirment) pour BAGUÉ.

---

## 1. Khalifa & Abdultawab (2026) — modèle hors ligne YOLOv8 + EfficientNetV2-S + ArcFace

**Référence** : Khalifa A.G., Abdultawab A.S. « An offline deep learning model for bovine muzzle identification using the variance of the Laplacian, YOLOv8, EfficientNetV2-S, and ArcFace ». *BMC Veterinary Research* (2026) 22:622. https://doi.org/10.1186/s12917-026-05948-0 — publié le 19/10/2026, accès libre (CC BY 4.0). Université de Beni-Suef, Égypte.

### Ce qu'ils ont fait

| Étape | Choix |
| --- | --- |
| Qualité | Variance du laplacien ; rejet si score < 4,0 (échelle propre à leur pipeline) |
| Détection | YOLOv8n, une classe « muzzle », entrée 640×640, confiance 0,25, IoU 0,50 ; 50 époques, AdamW, lr 0,001 |
| Recadrage | Boîte YOLO + marge |
| Contraste | CLAHE sur le canal L (LAB), seuil 2,5, grille 8×8 |
| Encodeur | EfficientNetV2-S pré-entraîné ImageNet, 224×224, projection 1280→512 + BatchNorm1d, sans dropout |
| Perte | ArcFace, s = 30, m = 0,5 |
| Entraînement | 5 époques backbone gelé, AdamW lr 3e-4, wd 1e-4, 50 époques, batch 32, cosine warm restarts |
| Déploiement | ONNX opset 14, ONNX Runtime 1.23.2, CPU Intel i9 ; empreintes dans SQLite ; modèle 81,9 Mo |
| Décision | Accepté si cosinus ≥ 0,70 **et** écart angulaire 1er–2e candidat ≥ 0,03 rad (≈ 1,7°), sinon rejet |

Données : *Cow Muzzle Dataset* Kaggle (Ashik, 2025 — https://www.kaggle.com/datasets/sharifashik/cow-muzzle-dataset) : 1 300 images, 160 vaches, 640×640 ; plus un petit jeu terrain : 400 images, 30 vaches + 22 buffles, smartphone 64 MP, de jour sans flash, à 15–20 cm, **deux séances à une semaine d'intervalle** (galerie = séance 1, test = séance 2).

### Résultats clés

| Mesure | Kaggle | Terrain |
| --- | --- | --- |
| Exactitude (test) | 96,2 % | **80,8 %** |
| Taux de faux rejets (FRR) | 3,75 % | **16 %** |
| Précision | 99,35 % | 95,45 % |
| Temps d'extraction | ≈ 106 ms | **≈ 2,3 s** (dont détection YOLO 1,5–1,8 s) |
| Comparaison | ≈ 33 ms | ≈ 29 ms |

- Validation : EER 23,95 %, AUC 0,837. Points de fonctionnement : EER à 0,747 ; haute sécurité (FMR ≤ 1 %) à 0,871 ; confort (FNMR ≤ 5 %) à 0,681.
- Animaux non enregistrés (80 essais) : 97,5 % rejetés, 2,5 % de fausses acceptations.
- Écart de domaine : **−15,4 points** d'exactitude entre images Kaggle et photos terrain ; extraction ≈ 20 fois plus lente sur le terrain.
- Les auteurs le disent : prototype, **pas prêt pour le terrain**. Non testé : éclairage, distance, flou de bougé, angles, stabilité dans le temps. Objectif visé : ≥ 90 % sur le terrain, < 500 ms par image, dégradation < 5 %.

### Ce que cela confirme pour BAGUÉ

1. **Même chaîne que la nôtre** : contrôle qualité → détecteur → recadrage → CLAHE → encodeur ArcFace → cosinus + marge entre le 1er et le 2e candidat. Notre architecture est dans l'état de l'art publié.
2. **Le vrai risque est l'écart de domaine**, pas le modèle : un modèle bon sur Kaggle perd 15 points sur des photos de smartphone. Le **cône** de BAGUÉ (distance et lumière fixes) attaque directement les causes citées (angle, distance, lumière, bougé). Il faut collecter les données d'entraînement **avec le kit et son cône**, comme prévu.
3. **Deux séances espacées** pour la collecte (galerie / test) : c'est leur protocole ; garder le nôtre (2 séances à plusieurs semaines).
4. **Le 1 contre tous est difficile** : à 160–212 animaux, EER ≈ 24 % au seuil fixe. À des millions de vaches, seule la **vérification 1 contre 1** (animal annoncé par boucle, carte ou QR) tient, avec confirmation humaine pour le ROUGE. Choix de BAGUÉ confirmé.
5. **Seuils par usage** : comme eux, définir un seuil « haute sécurité » (ROUGE, saisie) et un seuil « confort » (contrôles de routine), calibrés sur nos propres données.

### Ce que cela change pour BAGUÉ

1. **Vitesse sur le CM5** : leur détection prend 1,5–1,8 s par photo terrain sur un i9. Sur le kit : réduire l'image avant la détection (entrée 320–416 px), détecteur int8 (YOLOX-Nano / NanoDet), puis recadrer dans l'image pleine résolution. Avec le cône, le mufle remplit le cadre : la détection peut être allégée.
2. **Tester les animaux non enregistrés** : ajouter à notre évaluation un lot d'« imposteurs » (vaches jamais enrôlées) et mesurer le taux de rejet et les fausses acceptations, en plus de la précision.
3. **Point de départ d'entraînement** : leur recette (ArcFace s = 30, m = 0,5, AdamW 3e-4, backbone gelé 5 époques) sert de base pour notre professeur ; notre élève reste MobileNetV4 int8 128-d (≈ 20 fois plus léger que leurs 82 Mo).
4. **Jeu Kaggle** : 1 300 images utilisables pour un premier essai (licence à vérifier sur la page Kaggle), mais insuffisant seul à cause de l'écart de domaine.
5. **Seuil de flou** : leur 4,0 et notre 60 ne sont pas sur la même échelle ; à recalibrer sur des photos prises avec le cône.

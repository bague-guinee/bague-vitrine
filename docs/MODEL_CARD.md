# Fiche du modèle — reconnaissance du mufle BAGUÉ

Format inspiré de Mitchell et al., « Model Cards for Model Reporting » (FAT* 2019). Chaque version du modèle publiée met cette fiche à jour, avec son rapport d'évaluation.

## État actuel

**Aucun modèle entraîné sur de vraies vaches n'est publié à ce jour.** Le démonstrateur utilise un descripteur de texture (`texture-lbp-v1`), suffisant pour montrer le fonctionnement du système, pas pour un usage réel. Le premier modèle sera entraîné sur les photos de la collecte en Guinée (voir la [fiche des données](DATASHEET.md)).

## Détails

| | |
| --- | --- |
| Entrée | Photo du mufle prise dans le cône du kit, recadrée en carré, 224 × 224 px, CLAHE |
| Sortie | Empreinte de 128 nombres, normalisée (128 octets en int8) ; les 64 premiers nombres forment une empreinte réduite pour le QR code |
| Professeur | ConvNeXt-Nano, pré-entraîné ImageNet, tête AdaFace ou ArcFace, perte Matryoshka sur 64-d |
| Élève (kit) | MobileNetV4-Conv-S, distillé du professeur, ONNX int8 (≈ 3 Mo) |
| Décision | Similarité cosinus, seuil + marge entre le 1er et le 2e animal ; ROUGE confirmé par deux photos et un humain |
| Code | `training/` (entraînement), `bague_bio/` (production), `bague_bio/evaluation/` (protocole) |

## Usages prévus

- Vérifier qu'un bovin présenté est bien l'animal annoncé (code, carte, QR) : vérification 1 contre 1.
- Repérer un animal signalé volé lors d'un contrôle (marché, barrage, abattoir), **avec confirmation humaine**.
- Éviter qu'un même animal soit enregistré deux fois.

## Usages hors du champ prévu (interdits)

- Sanctionner, saisir ou arrêter sur la seule base du score.
- Identifier d'autres espèces que les bovins, ou des personnes.
- Évaluer la valeur ou la santé d'un animal.
- Localiser ou compter les troupeaux d'un éleveur à des fins fiscales ou commerciales.

## Facteurs qui influencent la performance

À mesurer et à publier séparément pour chaque version :

- **Animal** : race (N'Dama, zébu, métis), âge (le mufle d'un veau grandit), état du mufle (sec, humide, sale, blessé).
- **Prise de vue** : reflets, flou de bougé, angle, appareil (kit, téléphone), opérateur.
- **Temps** : écart entre l'enrôlement et le contrôle (jours, mois, années).
- **Environnement** : saison, poussière, lumière ambiante malgré le cône.

## Mesures

Selon `bague_bio/evaluation/protocol.py` (vocabulaire ISO/IEC 19795-1) :

- taux de fausses correspondances (FMR) et de faux rejets (FNMR) aux seuils de sécurité et de confort ;
- EER ;
- rang 1 et rang 5 ;
- taux de rejet des animaux jamais enregistrés ;
- les mêmes mesures par sous-groupe ;
- intervalles de confiance à 95 % (Wilson, et bootstrap par animal).

Seuils fixés sur la validation, appliqués tels quels au test.

## Résultats

| Version | Données | FMR (sécurité) | FNMR (sécurité) | Rang 1 | Rapport |
| --- | --- | --- | --- | --- | --- |
| — | Aucune évaluation sur de vraies vaches pour l'instant | — | — | — | — |

Les essais sur données synthétiques vérifient uniquement que la chaîne fonctionne. Ils ne sont pas des résultats de précision.

## Points d'attention

- Les publications récentes observent une forte baisse entre images de laboratoire et photos de terrain (par exemple −15 points, Khalifa et Abdultawab, 2026). Seule une évaluation sur des photos prises avec le kit, en plusieurs séances, compte.
- La stabilité du mufle sur plusieurs années, surtout chez les veaux, n'est pas encore démontrée. Il faudra réenregistrer régulièrement les animaux jeunes.
- La quantification int8 est refusée si elle modifie trop les empreintes (cosinus moyen inférieur à 0,99).

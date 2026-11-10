# Fiche des données — photos de mufles BAGUÉ

Format inspiré de Gebru et al., « Datasheets for Datasets » (CACM 2021). Les parties entre crochets sont remplies au fil de la collecte.

## Motivation

- **But** : entraîner et évaluer la reconnaissance du mufle des bovins de Guinée, avec des photos prises dans les conditions réelles du kit.
- **Pourquoi un jeu propre à la Guinée** : les jeux publics (par exemple Kaggle, 160 vaches) viennent d'autres races et d'autres appareils. La littérature montre une forte baisse de précision quand on passe à des photos de terrain.
- **Qui collecte** : binômes enquêteur et vétérinaire, pendant les campagnes de vaccination. [Organismes partenaires]
- **Financement** : [à compléter]

## Composition

- **Une ligne par photo** dans le manifeste CSV (`training/manifest.py`) :
  - le chemin de la photo ;
  - le code pseudonyme de l'animal ;
  - la séance et la date ;
  - la race, le sexe, la classe d'âge ;
  - la région ;
  - l'appareil ;
  - le numéro de consentement ;
  - la vérification par boucle d'oreille.
- **Objectif minimal avant le pilote** : 1 500 à 3 000 animaux, 8 à 15 photos chacun, au moins 2 séances espacées de plusieurs semaines.
- **Zones contrastées** : Fouta-Djalon (N'Dama), Haute-Guinée (zébus et croisés, transhumance), un grand marché.
- **Vérité terrain** : une boucle d'oreille temporaire, posée à la première séance, relie les séances d'un même animal.
- **Ce que le jeu ne contient pas** : ni nom, ni téléphone, ni GPS des éleveurs. Le manifeste refuse ces colonnes. Le lien entre code animal et éleveur reste dans le registre, séparé et protégé.

## Collecte

- **Matériel** : photos prises avec le kit BAGUÉ et son cône (distance et lumière fixes), en mode collecte, pour ressembler aux photos de production.
- **Séance** : 3 à 5 photos en relevant le cône entre chaque prise, puis une deuxième séance quelques semaines plus tard. Une troisième séance après plusieurs mois mesure la stabilité.
- **Consentement** : l'éleveur accepte par écrit ou devant témoin, après lecture dans sa langue (`docs/CONSENTEMENT.md`).
- **Hygiène** : bord du cône désinfecté entre deux animaux.
- **Comité d'éthique** : [avis et numéro]

## Prétraitement

- Contrôle qualité automatique : flou, exposition, contraste, reflets. Les photos refusées sont gardées à part pour étudier les échecs.
- Détection et alignement du mufle par les narines, recadrage carré 224 px, CLAHE (`bague_bio.preprocess`).
- Les photos identiques rangées sous deux animaux différents sont détectées (empreinte perceptuelle) et bloquent l'entraînement.

## Usages

- **Découpage par animal**, enregistré avec le hachage du manifeste : un animal n'apparaît que dans un seul des trois ensembles (entraînement, validation, test).
- **Réservé** à l'entraînement et à l'évaluation de BAGUÉ et aux publications scientifiques associées.
- **Interdit** : tout usage fiscal, commercial ou de surveillance des éleveurs.

## Diffusion

- Les photos ne sont pas publiées.
- Un éventuel jeu public sera anonymisé, validé par les autorités guinéennes et les partenaires, sous une licence restreinte à la recherche.

## Maintenance

- **Responsable** : Thierno Diallo (technologie), avec les partenaires vétérinaires. [Contact]
- **Retrait** : un éleveur peut retirer son consentement. Ses photos sont alors retirées du jeu à la version suivante, et les modèles suivants sont réentraînés sans elles.
- **Versions** : chaque version du jeu porte le hachage de son manifeste, cité dans les rapports d'évaluation.

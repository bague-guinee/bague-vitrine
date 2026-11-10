# BAGUÉ — Charte éthique

BAGUÉ touche aux biens des éleveurs, à leur réputation et parfois à leur liberté : une erreur peut faire accuser quelqu'un de vol. Cette charte fixe des principes, les risques qu'ils combattent et **la protection concrète** qui les applique, dans le code ou sur le terrain. Un principe sans protection n'est qu'une intention.

## 1. Ne jamais accuser sur la seule foi de la machine

| Risque | Protection |
| --- | --- |
| Une fausse correspondance désigne un animal comme volé | ROUGE seulement si **deux photos concordantes** (deux vraies prises, pas la même photo renvoyée) désignent le même animal (`bague_bio.matcher.confirm_alert`), les deux photos gardées comme preuve, puis **confirmation humaine** : mufles côte à côte, robe, sexe (la vue côte à côte sur l'écran du kit reste à faire) |
| Une photo médiocre conduit à une saisie | ORANGE = « refaire la photo », **jamais** de saisie ; le kit explique quoi corriger (flou, reflets, lumière) |
| Un seuil mal réglé multiplie les fausses alertes | Seuils calibrés sur la validation à un taux de fausses correspondances fixé à l'avance, puis vérifiés sur des animaux jamais vus (`bague_bio.evaluation`) |
| Un animal non enregistré est traité comme suspect | GRIS = inconnu, **aucune sanction** ; on propose l'enregistrement gratuit |
| Personne ne peut contester | Chaque décision est journalisée (agent, kit, heure, score) ; recours auprès d'un comité de médiation ; la propriété n'est « confirmée » qu'après 30 jours sans opposition |

## 2. Mesurer honnêtement et publier les erreurs

- Les chiffres publiés viennent du protocole `bague_bio/evaluation/protocol.py` : enrôlement et contrôle sur des **séances différentes**, animaux **jamais enregistrés**, intervalles de confiance **par animal**.
- Chaque rapport commence par ses limites (données synthétiques, échantillon trop petit, seuils calibrés sur les mêmes données). Elles sont générées automatiquement : on ne peut pas les oublier.
- Aucun taux d'erreur n'est affirmé au-delà de ce que le nombre de comparaisons permet de démontrer (règle de trois).
- Les échecs sont publiés comme les réussites.

## 3. Équité entre éleveurs et entre races

- Les erreurs sont mesurées **par race, âge, appareil et région**. Un écart important entre N'Dama, zébus et métis bloque le déploiement jusqu'à correction (collecte ciblée, réentraînement).
- Les fausses correspondances sont aussi mesurées **entre animaux d'une même race**, le cas le plus difficile.
- L'enregistrement est **gratuit** et possible au guichet : un téléphone à touches suffit, sans carte d'identité obligatoire pour l'éleveur qui n'en a pas (témoin du chef de village ou du vétérinaire).
- Les éleveurs transhumants, les femmes et les jeunes propriétaires doivent pouvoir enregistrer leurs animaux à leur nom.
- Le registre ne doit jamais servir à cibler une communauté. Les statistiques publiques restent agrégées par préfecture.

## 4. Protéger les données des éleveurs

| Principe | Protection |
| --- | --- |
| Minimisation | Le manifeste d'entraînement **refuse** les colonnes nom, téléphone, GPS, propriétaire (`training/manifest.py`) ; les animaux y sont désignés par un code pseudonyme |
| Consentement | Toute photo sans numéro de consentement est **exclue** de l'entraînement et comptée dans le rapport ; formulaire : `docs/CONSENTEMENT.md` |
| Finalité | Lutte contre le vol et traçabilité sanitaire. Le décret créant le registre doit interdire l'usage fiscal (cadre : loi L/2016/037/AN) |
| Pas de carte des troupeaux | Jamais de taille de troupeau ni de position GPS montrée à un acheteur ou à un agent de barrage : ce serait une carte pour les voleurs |
| Rôles | Un acheteur voit un téléphone masqué ; seuls les rôles habilités voient plus ; aucun export en masse |
| Sécurité | Clé par kit, révocable ; pages de démonstration interdites en production ; photos brutes non conservées |
| Droits | L'éleveur consulte ses animaux par `*123#`, peut faire corriger une erreur et retirer son consentement pour la recherche |

## 5. Empêcher les abus de pouvoir

Un kit de contrôle peut devenir un outil de racket à un barrage.

- Chaque contrôle est signé par la clé du kit et lié à l'agent : les contrôles sans suite, les ROUGE en série ou les contrôles hors de la zone du kit sont repérables.
- Un ROUGE ne se règle jamais sur place contre paiement : procès-verbal et prévenance du propriétaire et de la gendarmerie.
- Le tableau de bord des autorités permet des audits au hasard.

## 6. Bien-être et santé des animaux

- La méthode est **non invasive** : une photo, sans marquage ni perçage.
- **Le cône touche le mufle de nombreux animaux : risque de transmission de maladies** (fièvre aphteuse, par exemple). Le bord du cône se nettoie et se désinfecte entre deux animaux, et le kit est désinfecté entre deux sites. Ce geste fait partie de la formation des agents.
- Aucune contention prolongée : si l'animal s'agite, on arrête et on reprend plus tard.

## 7. Recherche responsable

- **Avis d'un comité d'éthique** compétent (université vétérinaire, ministère de l'Élevage) avant toute collecte à grande échelle.
- **Souveraineté** : les données collectées en Guinée restent sous contrôle guinéen. Les photos ne sont pas publiées. Un jeu public éventuel serait anonymisé et validé par les autorités.
- **Partage** : partenariat avec des chercheurs et vétérinaires guinéens, co-auteurs des publications.
- **Licences** : dépendances aux licences compatibles. YOLOv8 (Ultralytics, AGPL) est écarté au profit de YOLOX ou NanoDet (Apache-2.0).
- **Données publiques** (par exemple Kaggle) : licence vérifiée et notée dans le manifeste (colonne `consentement`, par exemple `PUBLIC:kaggle-cow-muzzle:licence-vérifiée-AAAA-MM-JJ`).

## 8. Environnement

- Postes solaires. Batteries LiFePO4, plus sûres à la chaleur et plus durables.
- Reprise et recyclage des batteries en fin de vie, prévus dès l'achat.

## Fiches associées

- [Fiche du modèle](MODEL_CARD.md) : usages prévus et interdits, facteurs de performance.
- [Fiche des données](DATASHEET.md) : comment le jeu de données est collecté, pour quoi faire, et ses limites.
- [Formulaire de consentement](CONSENTEMENT.md).

# English Practice — 20262027

Support de révision facultatif pour **5E4, 4E2, 4E3, 3E2 et 3E4**.
Les treize leçons contiennent cinquante exercices principaux. Ce site statique
ne nécessite ni serveur applicatif, ni base de données, ni dépendance JavaScript.

## Organisation

- `index.html` : choix de la classe.
- Chaque classe : sommaire des unités, puis sommaire des leçons.
- Chaque leçon : `index.html` et un fichier de contenu JavaScript.
- `assets/css/style.css` : styles, navigation, champs et indications communes.
- `assets/js/app.js` : moteur partagé de rendu, correction, tirage et sauvegarde.
- `assets/lessons.json` : inventaire des leçons et de leurs URL.

Les URL existantes sont conservées, y compris la casse de `4E3/Unit1/LessonA/`.
Tous les liens internes sont relatifs et fonctionnent sous le préfixe GitHub Pages
`/20262027/` ainsi que sous un autre chemin. Pour une nouvelle classe, reprendre
les mêmes niveaux de navigation sans renommer les URL déjà diffusées.

## Modifier les exercices

Dans chaque leçon, `lesson.js` (ou `lesson-a.js`, `lesson-b.js`, `lesson-c.js`
pour 5E4) appelle `EnglishPractice.mount` avec les données propres à la classe.
Modifier ces données pour changer les consignes, questions, options et réponses.
Le HTML ne doit pas contenir de copie du moteur ni des styles communs.

Les 24 pages sont générées par `scripts/build-pages.cjs`. Après modification
d’une banque, du moteur ou des styles, exécuter `node scripts/build-pages.cjs`.
Le générateur met à jour les versions des ressources pour éviter les anciens
scripts en cache, les sommaires et les énoncés disponibles sans JavaScript.
Modifier les données et le générateur plutôt que les pages HTML produites.

Chaque exercice a un identifiant, un type, une consigne et une banque `items`
(ou des `scenarios` pour la chronologie). Chaque question a un identifiant stable
et un énoncé. Les types fermés ont une liste `answers` ; les choix ont aussi
`choices`. Les champs `count` et `mode` définissent la taille du tirage et les
règles de comparaison. Un exercice peut contenir un `challenge` indépendant.

Les types disponibles sont `text`, `choice`, `matching`, `chronology`, `writing`
et `free`. Les réponses sont affichées avec `textContent` : ne pas ajouter de HTML
dans les énoncés ou les réponses. Les banques ne doivent pas contenir de doublons.
Le nombre de questions annoncé est calculé depuis la banque réelle.

## Correction et sauvegarde

La normalisation prend en compte la casse, la ponctuation, les contractions et
plusieurs variantes usuelles. Les variantes de quantité sont limitées pour ne
pas accepter `many street art`. Certaines variantes sont propres à la traduction
et ne sont pas acceptées dans un exercice exigeant une forme donnée.

Après trois vérifications infructueuses d’une réponse non vide, une réponse
possible peut être révélée. Une réponse non reconnue peut être une formulation
correcte absente de la banque : le message le précise. Les rédactions proposent
une aide à la relecture, sans garantir tout le sens ni toute la grammaire.
Les champs libres sont signalés comme non autocorrigés.

Le navigateur conserve localement les questions tirées, les saisies, les tentatives
et les résultats vérifiés, séparément pour chaque leçon. Aucun envoi réseau,
compte ou suivi enseignant. `Try again` recommence seulement l’exercice concerné.
Modifier une banque invalide seulement la sauvegarde de cet exercice. Effacer les
données du navigateur supprime les réponses. Si le stockage est bloqué, le site
reste utilisable et affiche un avertissement de sauvegarde indisponible.

Les champs sont associés à leurs libellés et indications. Les résultats sont
annoncés par des zones de statut ; le focus revient au titre après une reprise.

## Vérifier et prévisualiser

Node.js 20 ou supérieur, sans installation de dépendances :

```sh
npm test
python3 -m http.server 8000
```

Ouvrir ensuite `http://localhost:8000/`. Les tests contrôlent la navigation,
les banques, les variantes de correction, la sauvegarde et les interactions du
moteur sur un adaptateur DOM. Ils ne remplacent pas un test visuel en navigateur.
Le workflow `.github/workflows/check.yml` exécute les contrôles sur les pushes
et les pull requests, puis teste les treize leçons dans Chromium : navigation
depuis les classes, affichage des 50 exercices, sauvegarde, reprises isolées,
mobile et lecture sans JavaScript. Les captures sont conservées comme artefacts.
Ce workflow ne déploie pas le site.

Pour lancer ce contrôle navigateur localement :

```sh
python3 -m pip install playwright==1.62.0
python3 -m playwright install chromium
python3 tests/browser-smoke.py
```

Sur un environnement qui bloque les navigations de Chromium,
`SITE_RENDER_ONLY=1 python3 tests/browser-smoke.py` vérifie le DOM réel et le
rendu aux formats ordinateur et téléphone, sans tester la navigation réseau.
Le mode complet reste obligatoire dans la CI.

Les exercices ne dépendent plus de la réussite d’un chargement pour être lisibles :
leurs énoncés sont présents dans le HTML. Le correcteur les enrichit lorsqu’il
est disponible. Une erreur sur un exercice est isolée pour ne pas masquer les
autres exercices de la leçon. La refonte graphique conserve les URL et les banques.

Sur une copie textuelle récupérée par le connecteur, l’image binaire existante
d’Emma peut manquer : `SITE_ALLOW_MISSING_BINARY=1 npm test` ignore uniquement ce
contrôle de présence. Un checkout complet et la CI utilisent `npm test` sans
cette exception. Conserver `5E4/unit1/lesson-b/emma-id-card.png` dans le dépôt.

## GitHub Pages

Le site reste compatible avec une publication depuis la branche principale,
dossier racine. Aucune compilation n’est nécessaire. Les changements locaux et
les tests n’effectuent aucune publication.

# Mission : les 30 ans de Manon — mise en route (≈ 15 min)

Le formulaire (`index.html`) envoie chaque participation vers **un Google Sheet** (une ligne par personne)
et range chaque photo dans **un dossier Google Drive**. Les invités n'ont besoin d'aucun compte.

```
Téléphone de l'invité ──► index.html ──► Google Apps Script ──► Google Sheet (réponses)
                                                          └──► Google Drive (photos)
```

## 1. Créer le Google Sheet et brancher le script

1. Sur [sheets.google.com](https://sheets.google.com), crée une feuille vide nommée **« Manon 30 ans – réponses »**.
2. Menu **Extensions → Apps Script**.
3. Efface le code d'exemple, colle tout le contenu de `Code.gs`, puis **Enregistrer** (💾).
4. Dans la barre du haut, choisis la fonction **`setup`** et clique sur **▶ Exécuter**.
   Google demande des autorisations (Sheets + Drive) : accepte.
   (Écran « Google n'a pas validé cette appli » : *Paramètres avancés → Accéder à… (non sécurisé)*. C'est ton propre script.)
   → La feuille reçoit ses en-têtes et un dossier **« Manon 30 ans - photos »** apparaît dans ton Drive.

## 2. Publier le script

1. **Déployer → Nouveau déploiement**, roue dentée ⚙ → **Application Web**.
2. *Exécuter en tant que* : **Moi**. *Qui a accès* : **Tout le monde**.
3. **Déployer**, puis copie l'**URL de l'application Web** (elle finit par `/exec`).

> « Tout le monde » signifie que n'importe qui possédant cette URL peut envoyer une réponse (c'est ce qui permet aux
> invités de participer sans compte). L'URL est longue et secrète ; ne la partage pas ailleurs. Le script limite la taille des
> envois et ignore les robots simples.

## 3. Connecter le formulaire

Ouvre `index.html`, repère ce bloc près du début du `<script>` et remplace le texte par ton URL :

```js
const CONFIG = {
  ENDPOINT: 'https://script.google.com/macros/s/XXXXXXXX/exec'
};
```

## 4. Mettre le formulaire en ligne

`index.html` est un fichier unique : n'importe quel hébergement statique convient, par exemple
**GitHub Pages**, **Netlify** ou **Vercel**. Tu obtiens un lien à envoyer à tes invités.

## 5. Tester avant d'envoyer à 20 personnes

1. Ouvre le lien sur ton téléphone et remplis le formulaire en entier, avec une photo.
2. Vérifie dans le Sheet : une nouvelle ligne, avec le lien de la photo.
3. Vérifie dans Drive : la photo est dans le dossier.
4. Supprime ensuite la ligne et la photo de test.

## Récupérer les données pour le jeu

- **Réponses** : dans le Sheet, *Fichier → Télécharger → Valeurs séparées par des virgules (.csv)*.
- **Photos** : dans le dossier Drive, sélectionne tout → *Télécharger* (un zip). Le nom du fichier commence par le prénom
  du participant, et la colonne « Photo (fichier) » du Sheet indique le fichier correspondant à chaque ligne.
- Ensuite, envoie-moi le CSV et les photos dans le chat : je construis le jeu avec ces données intégrées directement
  dans la page, ce qui évite toute dépendance réseau pendant la soirée.

## Si tu modifies `Code.gs` plus tard

Après modification : **Déployer → Gérer les déploiements → ✏ → Version : Nouvelle version → Déployer**.
L'URL reste la même.

## Dépannage rapide

| Symptôme | Piste |
|---|---|
| « L'envoi n'est pas encore configuré » | L'URL n'a pas été collée dans `index.html`. |
| « L'envoi n'a pas abouti » | Vérifie *Qui a accès : Tout le monde*, et que l'URL se termine par `/exec`. Réessaie le lien de l'URL dans un navigateur : tu dois voir `{"ok":true,...}`. |
| Rien dans le Sheet mais pas d'erreur | Tu as peut-être modifié `Code.gs` sans créer une **nouvelle version** du déploiement. |
| Aucune ligne, erreur « Script non initialisé » | Exécute `setup` (étape 1.4). |

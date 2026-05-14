<div align="center">

# Chinese Web Translator

Traduction de pages web privée, locale et gratuite pour explorer l'internet chinois.

<p>
  <a href="README.md">English</a> · <strong>Français</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

<p>
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-WebExtension-4285F4">
  <img alt="Firefox" src="https://img.shields.io/badge/Firefox-WebExtension-FF7139">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-MTranServer-0B7285">
  <img alt="Offline" src="https://img.shields.io/badge/Runs-local%20%26%20offline-2F9E44">
  <img alt="Cost" src="https://img.shields.io/badge/API%20cost-%240-37B24D">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-black">
</p>

<p>
  Traduisez des sites en chinois, anglais et français directement dans le navigateur avec des modèles CPU locaux.
  Pas d'API payante, pas de token, pas de compteur d'usage, et aucun contenu de page envoyé vers un service cloud de traduction.
</p>

</div>

---

## Points forts

<table>
  <tr>
    <td><strong>Gratuit à utiliser</strong></td>
    <td>Aucune clé API, aucun budget de tokens, aucun abonnement, aucune facturation par page.</td>
  </tr>
  <tr>
    <td><strong>Local first</strong></td>
    <td>L'extension navigateur parle à un backend sur <code>127.0.0.1</code>. Les modèles de traduction restent sur votre machine.</td>
  </tr>
  <tr>
    <td><strong>Fait pour naviguer</strong></td>
    <td>Traduisez le texte directement dans la page, continuez à lire, puis restaurez les textes originaux si besoin.</td>
  </tr>
  <tr>
    <td><strong>Bidirectionnel</strong></td>
    <td>La route par défaut est <code>chinois -> anglais</code>, avec la route inverse et les routes françaises incluses.</td>
  </tr>
  <tr>
    <td><strong>Mode automatique</strong></td>
    <td>Traduit automatiquement les pages et le contenu dynamique pendant la navigation.</td>
  </tr>
  <tr>
    <td><strong>Backend en une commande</strong></td>
    <td>Lancez le backend avec Docker Compose, en natif via <code>npx</code>, ou comme service utilisateur Linux.</td>
  </tr>
</table>

## Pourquoi ce projet existe

Le web chinois est immense, très actif, et souvent difficile à explorer à cause de la barrière de la langue. Les traducteurs intégrés aux navigateurs aident, mais beaucoup de solutions dépendent de services cloud propriétaires, imposent des quotas, ou envoient le texte des pages hors de votre machine.

Chinese Web Translator est une alternative pragmatique et locale:

- parcourir des forges de code chinoises, forums, documentations, blogs, boutiques et pages de projets;
- garder un coût de traduction nul après le téléchargement des modèles;
- conserver une extension petite et facile à auditer;
- exécuter soi-même le backend de traduction.

Le but n'est pas de battre DeepL ou Google Translate sur toutes les nuances. Le but est de rendre la navigation quotidienne plus privée, plus économique et plus confortable.

## Ce qui peut être traduit

Directions par défaut:

- `chinois -> anglais`
- `anglais -> chinois`

Directions supplémentaires incluses:

- `chinois -> français`
- `français -> chinois`

La cible par défaut est l'anglais afin de rendre le projet utile au plus grand nombre. Le chemin inverse permet aux lecteurs chinois de parcourir des pages anglaises, et les routes françaises couvrent aussi les usages francophones.

## Fonctionnement

```text
Page web
  -> le content script repère le texte traduisible
  -> le service worker de l'extension groupe les textes
  -> http://127.0.0.1:8989/translate/batch
  -> MTranServer local
  -> modèles CPU de type Mozilla/Bergamot
```

Cette séparation est volontaire:

- l'extension reste une WebExtension légère;
- le backend peut être mis à jour indépendamment;
- les modèles sont stockés localement;
- aucun onglet navigateur n'a besoin d'accéder directement aux fichiers des modèles.

## Modèle de sécurité

Chinese Web Translator est conçu en local-first, mais cela reste une extension navigateur capable de lire le texte des pages lorsqu'elle est activée.

Ce que le projet fait pour réduire le risque:

- Le backend s'attache à `127.0.0.1` en mode natif.
- Docker publie le backend uniquement sur `127.0.0.1`, pas sur votre réseau local.
- L'extension accepte seulement les URL de backend HTTP locales: `127.0.0.1`, `localhost` ou `[::1]`.
- Aucune requête de traduction n'est envoyée vers une API cloud par défaut.
- Le conteneur Docker s'exécute avec l'utilisateur non privilégié `node`.
- L'extension n'utilise pas `eval`, de scripts distants, ni `innerHTML` pour le contenu traduit.

Point de vigilance:

- Le content script cible toutes les URL afin de pouvoir traduire n'importe quelle page. Gardez la traduction automatique désactivée sur les sites sensibles si vous ne voulez pas que leur texte soit envoyé à votre backend local.

## Démarrage rapide

### 1. Lancer le backend local

Docker est le chemin le plus simple:

```bash
docker compose up -d --build
```

Au premier lancement, les modèles sont téléchargés dans un volume Docker persistant:

```text
zh-Hans_en
en_zh-Hans
en_fr
fr_en
```

Vérifiez que le backend répond:

```bash
curl -s http://127.0.0.1:8989/health
```

Réponse attendue:

```json
{"status":"ok"}
```

Docker est configuré avec `restart: unless-stopped`, donc le backend redémarre quand Docker démarre.

### 2. Charger l'extension

Chrome ou Chromium:

1. Ouvrez `chrome://extensions`.
2. Activez le mode développeur.
3. Cliquez sur `Load unpacked`.
4. Sélectionnez le dossier `extension`.

Firefox:

1. Ouvrez `about:debugging#/runtime/this-firefox`.
2. Cliquez sur `Load Temporary Add-on`.
3. Sélectionnez `extension/manifest.json`.

### 3. Naviguer

Ouvrez une page en chinois, anglais ou français, cliquez sur l'icône de l'extension, choisissez la direction de traduction, puis lancez la traduction.

Activez `Auto translate` si vous voulez que les pages soient traduites dès leur ouverture.

## Backend natif

Docker est recommandé, mais le lancement natif via `npx` est supporté.

Télécharger les modèles une fois:

```bash
./download-models.sh
```

Démarrer le backend:

```bash
./start-local-server.sh
```

Installer un service utilisateur Linux:

```bash
./scripts/install-systemd-user.sh
```

Inspecter le service:

```bash
systemctl --user status chinese-web-translator.service
journalctl --user -u chinese-web-translator.service -f
```

Le supprimer:

```bash
./scripts/uninstall-systemd-user.sh
```

## Fonctionnalités de l'extension

| Fonctionnalité | Détails |
| --- | --- |
| Traduction dans la page | Remplace les noeuds de texte directement là où ils apparaissent. |
| Restauration | Revient au texte original de la page. |
| Original au survol | Garde le texte source original disponible via le titre natif du navigateur. |
| Contenu dynamique | Surveille le nouveau contenu inséré et le traduit en mode automatique. |
| Requêtes groupées | Envoie plusieurs textes courts par requête pour réduire la charge du backend. |
| URL backend locale | Valeur par défaut: `http://127.0.0.1:8989/translate/batch`. |

## Taille des modèles

Tailles locales approximatives des modèles dans la configuration actuelle:

| Route | Taille |
| --- | ---: |
| `zh-Hans_en` | 53 MB |
| `en_zh-Hans` | 50 MB |
| `en_fr` | 36 MB |
| `fr_en` | 36 MB |

Après le premier téléchargement, les modèles peuvent être utilisés hors ligne.

## Packager l'extension

```bash
./scripts/package-extension.sh
```

Le fichier zip est écrit dans `dist/`.

## Dépannage

Le backend ne répond pas:

```bash
curl -s http://127.0.0.1:8989/health
```

Chrome affiche encore l'ancien comportement:

1. Ouvrez `chrome://extensions`.
2. Rechargez `Chinese Web Translator`.
3. Rechargez l'onglet cible.

Une erreur HTTP 500 de MTranServer signifie généralement que l'endpoint ou le payload est incorrect. L'endpoint doit être:

```text
http://127.0.0.1:8989/translate/batch
```

## Limites actuelles

- Le chinois traditionnel nécessite l'ajout de la route `zh-Hant_en` au jeu de modèles.
- Le texte dans les images n'est pas traité par OCR.
- Les Shadow DOM fermés et certains iframes ne sont pas traduits.
- Les pages très dynamiques peuvent nécessiter une relance manuelle.
- La traduction automatique locale est souvent moins nuancée que les meilleurs systèmes cloud.
- MTranServer est une dépendance backend tierce. Les versions sont épinglées, mais les nouvelles releases doivent quand même être relues avant une montée de version.

## Structure du dépôt

```text
extension/                    Source WebExtension
docker/entrypoint.sh          Entrypoint du conteneur
docker-compose.yml            Backend local en une commande
Dockerfile                    Image conteneur MTranServer
download-models.sh            Aide au téléchargement natif des modèles
start-local-server.sh         Lanceur natif du backend
scripts/install-systemd-user.sh
scripts/uninstall-systemd-user.sh
scripts/package-extension.sh
systemd/chinese-web-translator.service
```

## Contribuer

Les contributions sont les bienvenues. Le principe principal est simple: rester local-first, gratuit à exécuter et facile à auditer.

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

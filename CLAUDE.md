# CSM Dashboard — Contexte projet

## Pourquoi ce projet existe

Dashboard de priorisation pour l'équipe CSM/KAM de Didask. L'équipe perd 50 % de ses effectifs : le dashboard est un **copilote de priorisation** qui permet à chaque CSM de savoir instantanément sur quels comptes agir en premier — sans passer du temps à consolider des données dispersées.

## Glossaire métier

| Terme | Définition |
|---|---|
| **CSM** | Customer Success Manager — suivi relation et santé client |
| **KAM** | Key Account Manager — suivi commercial et renouvellement |
| **Pulse** | Note de sentiment hebdomadaire du CSM sur le compte (1 à 5) |
| **Tier** | Niveau d'accompagnement contractuel : Premium / Standard / Light |
| **Health Score** | Score de santé 0–100, calculé sur 4 axes (voir ci-dessous) |
| **Churn Risk** | Risque de churn 0–100, combinant santé dégradée + urgence temporelle |
| **Engagement** | Moyenne des jours depuis dernière connexion (uLog) et dernière activité longue (lLog) |
| **Relation** | Nombre de jours depuis le dernier RDV, comparé au seuil par Tier |
| **Proactivité** | Présence ou non d'un prochain RDV planifié |

## Formules de calcul (score.js)

**Health Score** (sur 100) :
- Pulse (20 pts) : 5→20, 4→15, 3→10, 2→5, 1→0
- Engagement (40 pts) : moyenne connexion ≤15j→40, ≤30j→20, >30j→0
- Relation (30 pts) : selon seuil Tier — Premium 30j, Standard 90j, Light 365j
- Proactivité (10 pts) : RDV planifié→10, sinon→0

**Churn Risk** (sur 100) :
- Risque santé : `min(60 - healthScore × 0.6, 60)`
- Urgence temporelle : 0 si >120j, interpolé linéairement si <120j, 40 si expiré
- Total : `min(risqueSanté + urgence, 100)`

## Stack technique

- **HTML / CSS / JS pur** — pas de framework, pas de build step
- **Tailwind CSS** via CDN (`https://cdn.tailwindcss.com`)
- **ES Modules** natifs (`type="module"`, imports avec `./` et extension `.js`)
- **Hébergement** : Cloudflare Pages (déploiement depuis `main`)
- **Données** : `data.js` pour le MVP, migration Google Sheets prévue

## Structure des fichiers

```
index.html   → structure HTML pure, aucun JS inline
style.css    → styles custom (variables CSS, composants non couverts par Tailwind)
app.js       → logique UI : filtres, tri, drawTable, openDetails
data.js      → export const DB = [...] — source de données
score.js     → fonctions de calcul métier : getScoreDetails, calcScore, getDays, getChurnRisk
```

## Conventions de code

- **Pas de jQuery**, pas de React, pas de Vite — tout reste en vanilla JS
- **Palette** : `#1a1a1a` (ink), `#f9b494` (peach/accent), fond `#f2f4f8`
- **Police** : Inter (Google Fonts) — ou DM Sans si déjà en place
- **Commenter les fonctions de calcul métier** dans `score.js` (le WHY, pas le WHAT)
- Les fonctions appelées depuis des `onclick` HTML doivent être exposées via `window.*` en fin d'`app.js`
- Chemins toujours relatifs avec `./` (requis pour Cloudflare Pages)

## Roadmap

| Phase | Contenu |
|---|---|
| **MVP (2 semaines)** | Dashboard statique avec `data.js`, filtres, tri, fiche compte, health score, churn risk |
| **Intégrations** | HubSpot (activités, deals), Modjo (appels, Pulse auto), Hyperline (MRR, contrats) |
| **Données produit** | Connexion API Didask app (engagement réel des utilisateurs) |
| **Alertes** | Slack (alertes churn), Intercom (actions rapides in-app) |
| **Google Sheets** | Remplacement de `data.js` par lecture Sheets API pour saisie CSM sans code |

## Ce qu'il faut savoir avant de toucher au code

1. Le dashboard doit fonctionner sans serveur — pas de backend, pas de Node en prod.
2. Toute nouvelle colonne ou métrique doit d'abord être ajoutée dans le schéma de `data.js`.
3. Les seuils métier (Pulse, jours de relation, etc.) sont intentionnels — ne pas les modifier sans validation équipe.
4. Le déploiement se fait automatiquement depuis `main` sur Cloudflare Pages.

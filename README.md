# Lappen

A shared shopping list, built as an installable web app for phones. Add an item on one phone and it shows up on the other. Tap an item to cross it off, or swipe it to the left to remove it. Items you have added before are suggested as you type.

## Stack

- React 19, Vite and TypeScript, with React Router
- [Firebase](https://firebase.google.com): Firestore for sync and the offline cache, anonymous Auth
- [Vercel](https://vercel.com) for hosting
- `vite-plugin-pwa` for the service worker, manifest and app icons
- Vitest and Testing Library

How it fits together is described in [docs/architecture.md](docs/architecture.md).

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the web app config from the Firebase console (Project settings → Your apps).
3. `npm run dev`

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests |
| `npm run rules:deploy` | Deploy `firestore.rules` to Firebase |

## Deploy

Vercel builds and deploys every push to `main`, and builds a preview for every pull request. The `VITE_FIREBASE_*` variables from `.env` must also be set in the Vercel project.

Firestore rules are not part of the Vercel build; deploy them with `npm run rules:deploy`. The Firebase CLI runs through `npx --engine-strict=false firebase-tools`. Its `superstatic` dependency declares support only up to Node 24.

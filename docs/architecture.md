# Architecture

Lappen is a shared shopping list for a household, used as an installable web app on phones.
Three constraints shaped how it is built:

- Two people edit the same list from different phones, often in a shop with poor signal.
- Every tap has to feel instant, so the app never waits for the network before updating the screen.
- There are no accounts yet, but the data model must allow adding them later.

## Overview

```
phone: React app + service worker
   │  Firestore SDK with a persistent local cache
   ▼
Firestore (europe-north1)    real-time listeners, access checked by firestore.rules
Firebase Auth                one anonymous user per device
Vercel                       builds and serves dist/, previews per pull request
```

There is no server code. The browser talks to Firestore directly, and `firestore.rules` decides what each user may read and write.

## Folders

| Folder | Holds |
|---|---|
| `src/` | The React app: routes, data hooks, styles |
| `src/data/` | `items.ts` holds pure list logic (sorting, suggestions). `store.ts` holds the Firestore hooks and writes |
| `shared/constants/` | App name, theme colours, collection names, paths and UI text, imported by the app and the Vite config |

## Data model

```
households/{householdId}       { members: [uid], names: { uid: name }, createdAt }
lists/{listId}                 { name, householdId, createdAt }
lists/{listId}/items/{itemId}  { name, checked, createdAt }
lists/{listId}/history/{key}   { name, count }
```

Lists created before households existed have `members: [uid]` instead of `householdId`. The app moves them into the owner's household on start.

## Decisions

1. **Anonymous auth instead of accounts.** Each device signs in anonymously on first launch, and the session is kept. Firebase can later link an anonymous user to an email or Google account without losing data.
2. **Households instead of shared lists.** Everyone in a household sees all its lists. A household is created on first start. The invite link carries the household ID, which is the secret, and joining moves the joiner's own lists into the new household and takes them out of their old one, all in one batch. The rules let a non-member change a household in one way only: add themself to `members`. Members may also remove themself and set names.
3. **Writes are never awaited.** Firestore applies a write to its local cache and fires listeners at once, then syncs in the background. The UI only reads from listeners, so it updates immediately, offline included.
4. **Item listeners wait for membership.** A listener that is refused by the rules stops for good. The list page therefore only listens to items once the list shows up among the household's lists and the server has confirmed it, since a list created on this device shows up locally before the server has it.
5. **Suggestions are per list.** Every added item increments a counter in the list's `history`, keyed by its normalised name. Suggestions are prefix matches ordered by that count, leaving out items already on the list.
6. **Motion follows Crosscheck.** Pages slide in from the side they are reached from, rows glide to their new place with a FLIP animation when an item is ticked, removed rows and the undo bar fade out before they unmount, a row swiped to the left follows the finger and slides out once it passes the threshold, and a theme change crossfades with a view transition. All of it is skipped when the phone asks for reduced motion.
7. **Listeners remember their last result.** Every query's latest snapshot is kept in memory for the session. A page that mounts again draws what its queries last returned straight away, and its listener updates it from there. Without this each page started empty while Firestore read its cache, and the title, rows and buttons popped in one after another, which shows as a jump on phones.
8. **What you use in the shop is within thumb reach.** The add field sits in a dock right above the bottom nav, rows run edge to edge with the check on the right, and ticked items fold away under I korgen with a receipt-style total below. The dock is rendered into `body` so the page slide's transform does not carry it along, and it follows the visual viewport so it stays above the on-screen keyboard.
9. **Deleting a list deletes its subcollections.** Firestore keeps subcollections when their parent is deleted, so the app deletes a list's `items` and `history` and the list itself in one batch. Any household member may delete a list from its options menu in the header, after a confirmation step, so it is never one tap away while shopping.

# Architecture

Cartners is a shared shopping list for a household, used as an installable web app on phones.
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
4. **Listeners outlast writes still on their way.** A listener that is refused by the rules stops for good. A household created or joined on this device shows up locally before the server has it, so the lists of a new device, or of a household just joined, were refused and never came back, which left the join button disabled for good. A refused listener therefore starts again once the device's pending writes have reached the server, and gives up if it is refused again before the server has answered it. Item listeners also wait for membership: the list page only listens to items once the list shows up among the household's lists and the server has confirmed it.
5. **Suggestions are per list.** Every added item increments a counter in the list's `history`, keyed by its normalised name. The add screen lists that history, most added first, and narrows it by prefix as you type. Items already on the list are marked instead of left out.
6. **Motion follows Crosscheck.** Pages slide in from the side they are reached from, rows glide to their new place with a FLIP animation when an item is ticked, removed rows and the undo bar fade out before they unmount, a row swiped to the left follows the finger and slides out once it passes the threshold, the options sheet slides up from the bottom while the add screen fades up, both slide back down when dismissed, and a theme change crossfades with a view transition. All of it is skipped when the phone asks for reduced motion.
7. **Listeners remember their last result.** Every query's latest snapshot is kept in memory for the session. A page that mounts again draws what its queries last returned straight away, and its listener updates it from there. Without this each page started empty while Firestore read its cache, and the title, rows and buttons popped in one after another, which shows as a jump on phones.
8. **What you use in the shop is within thumb reach.** An add button sits in a dock right above the bottom nav, rows run edge to edge with a plain check beside ticked items, and ticked items gather under an I korgen section that starts open and can be folded away. The add button opens a full-screen add screen with the field at the top, so the on-screen keyboard never covers it and iOS has no reason to scroll the page. The screen closes as soon as an item is added. Its history rows look like the list's own rows. The dock is rendered into `body` so the page slide's transform does not carry it along.
9. **Haptics come from a switch that is clicked through its label.** iOS gives no vibration API, but toggling an `<input type="checkbox" switch>` plays a tick. Each haptic button clicks a hidden label for a throwaway switch on tap, and completed actions that are not a button tap, such as adding an item from the keyboard or swiping one away, call the same function. The switch is never laid over the button itself, because a switch takes over drag gestures and would stop the list from scrolling.
10. **Gestures follow iOS.** Rows, the left-edge swipe back and dragging a sheet down by its grabber all use one drag hook: the element follows the finger and commits once it passes a share of its size or is flicked, otherwise it springs back. The edge swipe is only on in the installed app, since Safari has its own back gesture. The list name moves into the header once the large title scrolls under it. The add screen fades in instead of sliding up, because its field gets focus as it opens, and a field still below the screen at that moment makes iOS pan the whole page to reveal it.
11. **Deleting a list deletes its subcollections.** Firestore keeps subcollections when their parent is deleted, so the app deletes a list's `items` and `history` and the list itself in one batch. Any household member may delete a list from its options menu in the header, after a confirmation step, so it is never one tap away while shopping.

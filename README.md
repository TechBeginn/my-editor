# Real-Time Collaborative Text Editor

A Google Docs-style editor where multiple people can type into the same
document at the same time, without overwriting each other's changes.

## Why this project
Normal apps sync data by having one person "win" or by locking things
so only one person edits at a time. This project solves the harder,
real problem: how do you let many people edit the same text
simultaneously and have everyone's screen end up identical, no matter
what order their changes arrive in?

## The core idea (CRDT)
Instead of storing a document as one string of text, it's stored as a
list of individual characters. Each character has:
- a unique ID (never reused, never changes)
- a reference to the ID of the character it comes right after

New characters are inserted "after ID X", not "at position 5". This
means two people typing at the same time never fight over a numeric
position — their edits just slot into place independently, and a
simple, consistent tie-breaking rule (see `backend/src/crdt.js`)
guarantees every user's screen converges to the exact same result.

## Project structure
- `backend/` — the server: holds the real document state (the CRDT),
  and pushes changes to everyone over WebSockets
- `frontend/` — the React app users actually type into

## Status
🚧 Early build. See PROGRESS.md for where things stand.

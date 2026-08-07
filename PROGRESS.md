# Progress Log
Paste this file's contents at the start of a new session with Claude
so it knows exactly where we left off.

## Day 1
- Set up project folders: backend/, frontend/
- Learned the core idea behind CRDTs (text as a list of characters,
  each with a unique ID, inserted "after" another character's ID
  instead of at a numeric position)
- Built backend/src/crdt.js and backend/src/position.js (fractional
  position keys for ordering -- switched to this after the first
  sibling-scanning approach had a real bug)
- Wrote backend/test/crdt.test.js -- all tests pass
- Known limitation, documented on purpose (not a bug): the
  "interleaving anomaly" -- if two people type multi-character
  insertions at the exact same spot at the exact same time, the
  characters can interleave instead of staying as clean words. Both
  copies still converge to the identical (interleaved) result, which
  is the core CRDT guarantee. A real fix exists (origin-tracking /
  algorithms like Fugue) but was consciously deferred for time.
- GitHub repo live at github.com/TechBeginn/my-editor

## Day 2
- Built backend/src/documentRoom.js (DocumentRoom + DocumentManager --
  testable server logic, no networking involved)
- Built backend/src/server.js (thin WebSocket wrapper using the `ws`
  library, wires real connections to DocumentRoom)
- Wrote backend/test/documentRoom.test.js -- all tests pass

## Day 3
- Built the actual browser frontend: frontend/index.html,
  frontend/app.js, frontend/crdt-client.js, frontend/diff.js
- Plain HTML/JS for now (no React yet)
- diff.js compares old vs new textarea content to figure out what was
  typed/deleted, converts that into CRDT insert/delete operations
- CONFIRMED WORKING: two browser tabs sync live through the real
  WebSocket server
- This laptop has TWO separate Desktop folders (plain Desktop vs
  OneDrive Desktop) -- Git Bash and File Explorer can point to
  different ones. Project now consistently lives under
  ~/Desktop/my-editor. Use `explorer.exe .` from inside Git Bash to
  open File Explorer at the exact folder the terminal is in.
- Everything committed and pushed to GitHub successfully.

## Day 4
- Built backend/src/persistence.js (saveRoom/loadRoom -- saves each
  room's document to a JSON file in backend/data/, loads it back on
  server start)
- Wired persistence into documentRoom.js (loads on create, saves after
  every operation)
- CONFIRMED WORKING: typed text survives a full server restart
- Added .gitignore (node_modules/, backend/data/) so generated files
  and saved documents don't get committed
- Committed and pushed to GitHub

## Next up (not started yet)
- Deployment (Render) -- signing up for a Render account, not done yet
- Add repo description + topics on GitHub (quick, improves how it
  looks to recruiters)
- Live cursors
- Demo video/GIF for resume
- Possibly upgrade frontend to React
- Add "Known Limitations" section to README about interleaving anomaly

## About me
- Final-year BTech CS student, building this for my resume/portfolio
- I'm new to git, npm, and terminal workflows -- please explain things
  in plain, simple language by default (I'll ask for professional
  wording separately if I need it for something specific)
- Give me ONE step at a time, don't dump a wall of steps at once
- I'm on Windows using Git Bash (not cmd)
- If I hit a "file not found" type error, check whether it's the
  dual-Desktop-folder issue before assuming I did something wrong

## How to resume a session
1. Paste this file
2. Paste your latest code (or say "check my repo")
3. Say what's broken / what you're stuck on, if anything

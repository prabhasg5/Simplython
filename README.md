# 🤖 Simplython

**Learn real Python by helping Pip the robot rescue a storm-wrecked island.**

▶️ **Play:** https://prabhasg5.github.io/Simplython/

A storm hit Pip's island, and Pip only understands Python. Kids write real Python code to wake Pip up, walk the beach, dodge crabs, fix buggy programs and rebuild the hut, one level at a time, climbing a roadmap to the trophy at the top.

## What's inside

**Session 1 — "Wake Up Pip!"**: 55 levels + an endless practice mode

| Zone | What you learn |
|---|---|
| 😴 Wake Pip | `print()`: make Pip talk, tell jokes, and draw pixel art |
| 🏖️ Beach Walk | `move()`, `turn_left()`, `turn_right()`, `collect()`: step-by-step instructions |
| 🦀 Crab Trouble | Find and fix bugs, and predict what code will do |
| 🛖 Build the Hut | `place()`: build a hut log by log, then decorate it |
| 🌊 Escape the Tide | Boss levels that combine everything |
| 🐚 Shell Hunt | A new random beach every time, getting bigger and harder |

## Features

- **Real Python** in the browser, powered by [Pyodide](https://pyodide.org)
- **Kid-friendly errors**: *"Pip doesn't know the word mvoe. Did you mean move?"*
- **Watch your code run**, with step-by-step mode and the current line highlighted
- **Roadmap** that unlocks one level at a time, with stars, hints, confetti and a final victory screen
- **Read-aloud** instructions 🔊
- **Google sign-in**, so progress is saved and continues on any device
- **Parent panel** 👨‍🏫 with questions to ask, time spent per level, and skip/unlock controls

## Built with

Plain HTML, CSS and JavaScript (no build step) · [Pyodide](https://pyodide.org) · [CodeMirror](https://codemirror.net/5/) · [Firebase](https://firebase.google.com) Auth & Firestore · GitHub Pages

## Run it locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

Run the level tests (every level's solution goes through the Python engine):

```bash
node test.mjs
```

## Project layout

| File | What it does |
|---|---|
| `index.html`, `style.css` | Screens and styles |
| `main.js` | Game flow: roadmap, levels, animation, progress |
| `levels.js` | Every level as data: map, starter code, hints, solution |
| `pipbot.py` | Pip's world in Python: the commands and the friendly error messages |
| `worker.js` | Runs the code in Pyodide off the main thread, so an endless loop can't freeze the page |
| `cloud.js` | Google sign-in and saved progress |

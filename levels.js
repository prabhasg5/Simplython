// Session 1: "Wake Up Pip!". Every level is plain data; add a level = add an object.
//
// type:    card | talk | grid | predict | endless
// map:     rows of tiles. P=Pip  .=sand  #=rock  ~=water  C=crab  S=shell  W=wood  F=flag
//          B/D/O/R = see-through spot to build 🪵/🚪/🪟/🔺   l/d/o/r = already built
// dir:     where Pip faces at the start: 0 up, 1 right (default), 2 down, 3 left
// wood:    logs Pip carries at the start (leave out = unlimited)
// par:     max lines for ⭐⭐⭐
// check:   custom win rule (r = run result); default = all shells, all build spots, on the flag
// need:    message when the custom check fails
// ask:     question for the parent to ask (parent panel)
// maps:    several beaches instead of one map; the same code must work on all of them
// uses:    Python ideas the code must use: for while if else elif def return fstring += var and or
// ban:     commands taken away for this level
// gift:    (showoff card) item given to the child

export const PARTS = {
  A: "Wake Pip", B: "Beach Walk", K: "Break", C: "Crab Trouble",
  D: "Build the Hut", E: "Escape the Tide", F: "Shell Hunt",
  G: "Pip's Backpack", H: "Loop Lagoon", I: "Crab Crossroads", J: "Robot Workshop", L: "Treasure Cove",
};

const FUN = ["😀", "😂", "🎉", "⭐", "🌞", "🐚", "🤖", "🦀", "🌴", "🔋"];
const SQUARES = ["⬜", "🟨", "🟦", "🟩", "🟥", "🟫", "⬛", "🟧", "🟪"];
const BUILD = ["🪵", "🚪", "🪟", "🔺", "🌺", "⭐", "🌴", "🚩"];
const CODE = ["move()", "turn_left()", "turn_right()", "collect()"];
const SENSE = ["front_is_clear()", "on_shell()", "at_flag()"];

const lines = (...rows) => rows.join("\n");
const said = (r, re) => r.said.some((s) => re.test(s));
const clean = (s) => s.replace(/\s/g, "");
const art = (target) => (r) =>
  r.said.length === target.length && target.every((row, i) => clean(r.said[i]) === row);
const artNeed = (target) => (r) => {
  const i = target.findIndex((row, i) => clean(r.said[i] ?? "") !== row);
  if (i >= 0) return `Row ${i + 1} doesn't match the picture yet. Look closely!`;
  return `Your picture has ${r.said.length} rows, but it needs ${target.length}.`;
};

const SUN = ["⬜⬜🟨⬜⬜", "⬜🟨🟨🟨⬜", "🟨🟨🟨🟨🟨", "⬜🟨🟨🟨⬜", "⬜⬜🟨⬜⬜"];
const BOAT = ["⬜⬜🟥⬜⬜", "⬜⬜🟥🟥⬜", "⬜⬜🟫⬜⬜", "🟫🟫🟫🟫🟫", "🟦🟦🟦🟦🟦"];
const ROBOT = ["⬜🟦🟦🟦⬜", "🟦⬛🟦⬛🟦", "🟦🟦🟦🟦🟦", "🟦⬛⬛⬛🟦", "⬜🟦⬜🟦⬜"];
const FIELD = Array(4).fill("🟩".repeat(6));
const TRI = [1, 2, 3, 4, 5].map((n) => "⭐".repeat(n));
const SNAP = Array.from({ length: 15 }, (_, i) => ((i + 1) % 3 ? String(i + 1) : "Snap! 🦀"));
const prints = (rows) => lines(...rows.map((r) => `print("${r}")`));

const OPEN = (w, h, px, py) =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === px && y === py ? "P" : ".")).join(""));

export const LEVELS = [
  // ───────────── A. Wake Pip (print) ─────────────
  {
    id: "intro", part: "A", type: "card", emoji: "🌩️🏝️😴",
    title: "The Storm",
    text: "Last night a huge storm hit the island. The hut fell down, the shells got scattered and Pip the robot fell fast asleep on the beach.\n\nPip only understands one language: **Python**.\n\nCaptain {name}, you are the only one who can help!",
    button: "Let's wake Pip up! →",
  },
  {
    id: "a1", part: "A", type: "talk", sleepy: true, title: "Wake up!",
    text: "Pip is fast asleep 😴. The code is already written for you. Press the green **▶ Run** button!",
    starter: `print("Wake up Pip!")`, solution: `print("Wake up Pip!")`,
    check: (r) => r.said.length > 0, need: "Press ▶ Run to wake Pip up.",
    ask: "What do you think print does?",
  },
  {
    id: "a2", part: "A", type: "talk", title: "Say hello",
    text: "Pip is awake! Make Pip say `Hello`. Click between the two quotes \" \", type **Hello**, then press Run.",
    starter: `print("")`, solution: `print("Hello")`,
    hints: ["Click right between the two \" marks, then type Hello"],
    check: (r) => said(r, /hello/i), need: "Pip needs to say Hello.",
    ask: "Why do the words need quotes around them?",
  },
  {
    id: "a3", part: "A", type: "talk", title: "Who are you?",
    text: "Pip asks: *Who woke me up?* Make Pip say your name, Captain {name}!",
    starter: `print("My name is ")`, solution: `print("My name is {name}")`,
    hints: ["Type your name before the last quote \""],
    check: (r, ctx) => r.said.some((s) => s.toLowerCase().includes(ctx.name.toLowerCase())),
    need: "Make Pip say your name, inside the quotes.",
    ask: "What would happen if you typed your name outside the quotes?",
  },
  {
    id: "a4", part: "A", type: "talk", title: "Three lines",
    text: "Every `print` is one line. Make Pip say **3 things**: good morning, your name, and *Let's fix the island!*",
    starter: lines(`print("Good morning!")`, `# add 2 more print lines below`, ``),
    solution: lines(`print("Good morning!")`, `print("I am Captain {name}")`, `print("Let's fix the island!")`),
    hints: ["Copy the first line, then change the words inside the quotes"],
    check: (r) => r.said.length >= 3, need: "Pip needs to say 3 lines. Use 3 print lines.",
    ask: "How many lines will Pip say if you write 5 prints?",
  },
  {
    id: "a5", part: "A", type: "talk", title: "Countdown",
    text: "Pip wants to count down: **3, 2, 1, Go!** But the lines got mixed up in the storm. Put them in the right order.",
    starter: lines(`print("1")`, `print("Go!")`, `print("3")`, `print("2")`),
    solution: lines(`print("3")`, `print("2")`, `print("1")`, `print("Go!")`),
    hints: ["The computer runs lines from top to bottom", "The first line should be print(\"3\")"],
    check: (r) => JSON.stringify(r.said) === JSON.stringify(["3", "2", "1", "Go!"]),
    need: "Pip should say 3, then 2, then 1, then Go!",
    ask: "Which line does the computer run first? Why?",
  },
  {
    id: "a6", part: "A", type: "talk", title: "Joke time",
    text: "Tell Pip a joke! Use one `print` for the question and one for the answer. Pip will laugh 😂",
    starter: lines(`print("Why did the robot go to the beach?")`, ``),
    solution: lines(`print("Why did the robot go to the beach?")`, `print("To recharge its batteries! 🔋")`),
    palette: FUN,
    check: (r) => r.said.filter((s) => s.trim()).length >= 2, need: "Use 2 print lines: a question and an answer.",
    ask: "Can you make up your own joke now?",
  },
  {
    id: "a7", part: "A", type: "talk", title: "Emoji party",
    text: "Pip loves emoji! Click the emoji buttons above the code to add them **inside the quotes**. Make Pip say a line with at least 2 emoji.",
    starter: `print("I love the beach ")`, solution: `print("I love the beach 🌞🐚")`,
    palette: FUN,
    check: (r) => r.said.some((s) => [...s].filter((ch) => ch.codePointAt(0) > 0x2000).length >= 2),
    need: "Put at least 2 emoji inside the quotes.",
    ask: "Is an emoji a word or a picture to the computer? (Trick question: to Python it's just text!)",
  },
  {
    id: "a8", part: "A", type: "talk", target: SUN, title: "Pixel sun 🎨",
    text: "Each `print` can draw one row of a picture! Copy the sun on the left. The first 2 rows are done. Add the other 3.",
    starter: lines(...SUN.slice(0, 2).map((r) => `print("${r}")`), ``), solution: prints(SUN),
    palette: SQUARES, check: art(SUN), need: artNeed(SUN),
    hints: ["Row 3 is five yellow squares: 🟨🟨🟨🟨🟨", "Rows 4 and 5 are the same as rows 2 and 1"],
    ask: "Which rows are the same? Why?",
  },
  {
    id: "a9", part: "A", type: "talk", target: BOAT, title: "Pixel boat ⛵",
    text: "Now copy the boat. Only the first row is done this time!",
    starter: lines(`print("${BOAT[0]}")`, ``), solution: prints(BOAT),
    palette: SQUARES, check: art(BOAT), need: artNeed(BOAT),
    hints: ["Do one row at a time, from the top. Count the squares!"],
    ask: "How many print lines does the boat need?",
  },
  {
    id: "a10", part: "A", type: "talk", target: ROBOT, title: "Pixel Pip 🤖",
    text: "Draw Pip! This time you write every row yourself.",
    starter: lines(`# one print for each row`, ``), solution: prints(ROBOT),
    palette: SQUARES, check: art(ROBOT), need: artNeed(ROBOT),
    hints: ["Start with print(\"⬜🟦🟦🟦⬜\")"],
    ask: "Can you change the colour of Pip's eyes?",
  },
  {
    id: "a11", part: "A", type: "talk", target: SUN, title: "Seagull mess 🐦",
    text: "A naughty seagull messed up the sun picture! Two rows are in the wrong place and one square is the wrong colour. Fix it.",
    starter: lines(`print("${SUN[0]}")`, `print("${SUN[2]}")`, `print("${SUN[1]}")`, `print("⬜🟨🟥🟨⬜")`, `print("${SUN[4]}")`),
    solution: prints(SUN), palette: SQUARES, check: art(SUN), need: artNeed(SUN),
    hints: ["Run it first and compare with the picture on the left", "Swap rows 2 and 3, and change the 🟥 to 🟨"],
    ask: "How did you find the mistakes?",
  },
  {
    id: "a12", part: "A", type: "talk", freeArt: true, saveArt: true, title: "Your own picture 🖼️",
    text: "Draw anything you like: a fish, a house, a flag, a face! Use at least **4 rows**, each with at least 3 squares. It will be saved on your island.",
    starter: lines(`# draw your own picture!`, ``),
    solution: prints(["🟦🟦🟦🟦", "🟦🟧🟧🟦", "🟧🟧🟧🟦", "🟦🟧🟧🟦"]),
    palette: SQUARES,
    check: (r) => r.said.length >= 4 && r.said.every((s) => [...clean(s)].length >= 3),
    need: "Use at least 4 print lines, with at least 3 squares in each.",
    ask: "Tell me about your picture. Which line draws which part?",
  },

  // ───────────── B. Beach Walk (commands, order) ─────────────
  {
    id: "b1", part: "B", type: "grid", title: "First steps", map: ["P.F"],
    text: "Pip is ready to explore! `move()` makes Pip take **one step forward**. Get Pip to the flag 🏁.",
    starter: lines(`move()`, ``), solution: lines(`move()`, `move()`), par: 2,
    hints: ["Pip needs 2 steps. Write move() twice."],
    ask: "How many steps does Pip need? Count the squares first.",
  },
  {
    id: "b2", part: "B", type: "grid", title: "Longer walk", map: ["P.....F"],
    text: "A longer beach! Count the squares, then write enough `move()` lines.",
    starter: lines(`move()`, `move()`, ``), solution: lines(...Array(6).fill("move()")), par: 6,
    ask: "Count with your finger: how many moves?",
  },
  {
    id: "b3", part: "B", type: "grid", title: "Turn left", map: ["##F", "##.", "P.."],
    text: "`turn_left()` makes Pip turn left. It turns **without** taking a step. See the little arrow? That's where Pip is looking.",
    starter: lines(`move()`, `move()`, ``), solution: lines(`move()`, `move()`, `turn_left()`, `move()`, `move()`), par: 5,
    hints: ["After 2 moves, Pip has to turn left, then move 2 more times"],
    ask: "Stand up and turn left. Did you move forward?",
  },
  {
    id: "b4", part: "B", type: "grid", title: "Turn right", map: ["...F", ".###", "P###"], dir: 0,
    text: "Pip is looking **up** this time. `turn_right()` turns Pip to the right.",
    starter: ``, solution: lines(`move()`, `move()`, `turn_right()`, `move()`, `move()`, `move()`), par: 6,
    hints: ["Go up 2 squares first", "Then turn_right() and move 3 times"],
    ask: "If Pip is looking up and turns right, where is Pip looking now?",
  },
  {
    id: "b5", part: "B", type: "grid", title: "Zig-zag stairs", map: ["###F", "##..", "#..#", "P.##"],
    text: "Climb the stairs! Left, right, left, right…",
    starter: ``, par: 11,
    solution: lines(`move()`, `turn_left()`, `move()`, `turn_right()`, `move()`, `turn_left()`, `move()`, `turn_right()`, `move()`, `turn_left()`, `move()`),
    hints: ["Move, turn_left, move, turn_right… and repeat!"],
    ask: "Do you see a pattern in your code?",
  },
  {
    id: "b6", part: "B", type: "grid", title: "First shell 🐚", map: ["P.S.F"],
    text: "Shells! When Pip stands on a shell, `collect()` picks it up. Collect it and go to the flag.",
    starter: ``, solution: lines(`move()`, `move()`, `collect()`, `move()`, `move()`), par: 5,
    hints: ["Move to the shell first, then collect(), then keep going"],
    ask: "What happens if you collect() on the wrong square?",
  },
  {
    id: "b7", part: "B", type: "grid", title: "Shell corner", map: ["F.S#", "##.#", "P.S#"],
    text: "Two shells this time. Collect both, then reach the flag.",
    starter: ``, par: 10,
    solution: lines(`move()`, `move()`, `collect()`, `turn_left()`, `move()`, `move()`, `collect()`, `turn_left()`, `move()`, `move()`),
    ask: "Before you run it, point to where Pip will be after each line.",
  },
  {
    id: "b8", part: "B", type: "grid", title: "Around the rock", map: ["#.S.#", "P.#.F"],
    text: "A big rock 🪨 is in the way. Go around it and grab the shell on top!",
    starter: ``, par: 11,
    solution: lines(`move()`, `turn_left()`, `move()`, `turn_right()`, `move()`, `collect()`, `move()`, `turn_right()`, `move()`, `turn_left()`, `move()`),
    ask: "What happens if Pip walks into the rock? Try it!",
  },
  {
    id: "b9", part: "B", type: "grid", title: "Got it!", map: ["P.S.S.F"],
    text: "Pip is so happy with every shell. After each `collect()`, make Pip say `Got it!` with `print`.",
    starter: ``, par: 10,
    solution: lines(`move()`, `move()`, `collect()`, `print("Got it!")`, `move()`, `move()`, `collect()`, `print("Got it!")`, `move()`, `move()`),
    check: (r) => r.shellsLeft === 0 && r.onFlag && r.said.filter((s) => /got it/i.test(s)).length >= 2,
    need: "Collect both shells, say Got it! after each one, and reach the flag.",
    ask: "Can you mix print with the moving commands? Does it still work?",
  },
  {
    id: "b10", part: "B", type: "grid", title: "Crab beach 🦀", map: ["P.C.F", "..S.."],
    text: "Crabs pinch! Never walk into a crab 🦀. Go around it, and grab the shell on the way.",
    starter: ``, par: 11,
    solution: lines(`move()`, `turn_right()`, `move()`, `turn_left()`, `move()`, `collect()`, `move()`, `turn_left()`, `move()`, `turn_right()`, `move()`),
    ask: "Is there more than one way around the crab?",
  },
  {
    id: "b11", part: "B", type: "grid", title: "Water's edge 🌊", map: ["~~~~~~", "P.S..~", "~~~~.~", "F.S..~", "~~~~~~"],
    text: "Pip can't swim! Follow the sand, collect both shells and get to the flag.",
    starter: ``, par: 14,
    solution: lines(`move()`, `move()`, `collect()`, `move()`, `move()`, `turn_right()`, `move()`, `move()`, `turn_right()`, `move()`, `move()`, `collect()`, `move()`, `move()`),
    ask: "Which turn is the tricky one?",
  },
  {
    id: "b12", part: "B", type: "grid", title: "The long way round", dir: 0,
    map: ["......S", ".#####.", ".#FS...", ".######", "P######"],
    text: "A long, winding path. Take it one step at a time. Tip: run your code often to check!",
    starter: ``, par: 21,
    solution: lines(...Array(4).fill("move()"), `turn_right()`, ...Array(6).fill("move()"), `collect()`, `turn_right()`, `move()`, `move()`, `turn_right()`, `move()`, `move()`, `move()`, `collect()`, `move()`),
    ask: "That was a lot of move() lines! Do you wish there was a shortcut? (There is, in a later session!)",
  },
  {
    id: "b13", part: "B", type: "grid", title: "Pick a path", map: ["S...S", ".#.#.", "P...F"],
    text: "Collect **both** shells, then reach the flag. Which way is shortest? Try to do it in 13 lines for ⭐⭐⭐.",
    starter: ``, par: 13,
    solution: lines(`turn_left()`, `move()`, `move()`, `collect()`, `turn_right()`, `move()`, `move()`, `move()`, `move()`, `collect()`, `turn_right()`, `move()`, `move()`),
    ask: "Plan it with your finger first. Which shell will you get first?",
  },
  {
    id: "b14", part: "B", type: "grid", title: "Shell bonanza", dir: 0,
    map: ["S.#..S", "..#.C.", "P...S.", "###F##"],
    text: "The big one! Three shells, a crab and a rock wall. Plan your path, then code it.",
    starter: ``, par: 27,
    solution: lines(`move()`, `move()`, `collect()`, `turn_right()`, `turn_right()`, `move()`, `move()`, `turn_left()`, ...Array(4).fill("move()"), `collect()`, `move()`, `turn_left()`, `move()`, `move()`, `collect()`, `turn_left()`, `turn_left()`, `move()`, `move()`, `turn_right()`, `move()`, `move()`, `turn_left()`, `move()`),
    ask: "How did you turn Pip all the way around?",
  },

  // ───────────── Break ─────────────
  {
    id: "break", part: "K", type: "card", emoji: "🧍➡️🤖",
    title: "Break time: Be the Robot!",
    text: "Time to stand up! 🙌\n\n**Grown-up:** write a little program on paper, like:\n`move()` `move()` `turn_left()` `move()`\n\n**Captain {name}:** be Pip! Walk exactly what the paper says: one step per `move()`, and turn on the spot for a turn.\n\nThen swap: Captain writes the code and the grown-up is the robot. Can you make them walk into the sofa? 😄",
    button: "I'm back! →",
  },

  // ───────────── C. Crab Trouble (debug + predict) ─────────────
  {
    id: "c1", part: "C", type: "grid", debug: true, title: "Crabby's mix-up", map: ["##F", "##.", "P.."],
    text: "🦀 Crabby the crab sneaked in and **mixed up Pip's code**! Run it to see what goes wrong, then fix it.",
    starter: lines(`move()`, `turn_left()`, `move()`, `move()`, `move()`),
    solution: lines(`move()`, `move()`, `turn_left()`, `move()`, `move()`), par: 5,
    hints: ["Pip turns too early. Move the turn_left() line down"],
    ask: "How did you find the bug? Where did Pip go wrong?",
  },
  {
    id: "c2", part: "C", type: "grid", debug: true, title: "Spelling bug", map: ["P...F"],
    text: "Crabby changed a word! Run it and read what Pip says.",
    starter: lines(`move()`, `mvoe()`, `move()`, `move()`), solution: lines(`move()`, `move()`, `move()`, `move()`), par: 4,
    ask: "Why can't the computer guess what you meant?",
  },
  {
    id: "c3", part: "C", type: "grid", debug: true, title: "Missing brackets", map: ["P.S.F"],
    text: "Something is missing on one line. Commands always need their brackets `()`!",
    starter: lines(`move()`, `move`, `collect()`, `move()`, `move()`), solution: lines(`move()`, `move()`, `collect()`, `move()`, `move()`), par: 5,
    ask: "What do the brackets () tell the computer?",
  },
  {
    id: "c4", part: "C", type: "grid", debug: true, title: "Lost quote", map: ["P.F"],
    text: "Pip wants to celebrate at the flag, but Crabby stole something from the `print` line.",
    starter: lines(`move()`, `move()`, `print("I made it!)`), solution: lines(`move()`, `move()`, `print("I made it!")`), par: 3,
    check: (r) => r.onFlag && r.said.length > 0, need: "Reach the flag and make Pip say I made it!",
    ask: "How many quotes does a print need?",
  },
  {
    id: "c5", part: "C", type: "grid", debug: true, title: "Wrong way!", map: ["...F", ".###", "P###"], dir: 0,
    text: "Pip turned the wrong way. Fix one word!",
    starter: lines(`move()`, `move()`, `turn_left()`, `move()`, `move()`, `move()`),
    solution: lines(`move()`, `move()`, `turn_right()`, `move()`, `move()`, `move()`), par: 6,
    ask: "Which is your left hand and which is your right hand?",
  },
  {
    id: "c6", part: "C", type: "grid", debug: true, title: "One step short", map: ["F.S#", "##.#", "P.S#"],
    text: "Crabby deleted one line! Pip tries to pick up a shell that isn't there. Find where the missing step goes.",
    starter: lines(`move()`, `move()`, `collect()`, `turn_left()`, `move()`, `collect()`, `turn_left()`, `move()`, `move()`),
    solution: lines(`move()`, `move()`, `collect()`, `turn_left()`, `move()`, `move()`, `collect()`, `turn_left()`, `move()`, `move()`), par: 10,
    hints: ["Use the 👣 Step button to watch one line at a time"],
    ask: "How did the 👣 Step button help?",
  },
  {
    id: "c7", part: "C", type: "grid", debug: true, title: "Splash!", map: ["~~~~~~", "P.S.F~", "~~~~~~"],
    text: "Oh no, Pip walks right into the sea! Fix the code so Pip stops at the flag.",
    starter: lines(`move()`, `move()`, `collect()`, `move()`, `move()`, `move()`),
    solution: lines(`move()`, `move()`, `collect()`, `move()`, `move()`), par: 5,
    ask: "Is it a missing line or an extra line this time?",
  },
  {
    id: "p1", part: "C", type: "predict", title: "Where will Pip stop? 🔮", map: ["P....."],
    text: "Read the code. **Tap the square** where you think Pip will stop. Then watch!",
    starter: lines(`move()`, `move()`, `move()`),
    ask: "Count along with your finger.",
  },
  {
    id: "p2", part: "C", type: "predict", title: "Predict: one turn", map: ["......", "P....."],
    text: "Read the code carefully. Where will Pip stop? Tap it!",
    starter: lines(`move()`, `move()`, `turn_left()`, `move()`),
    ask: "Which way does Pip face after turn_left()?",
  },
  {
    id: "p3", part: "C", type: "predict", title: "Predict: up and over", map: OPEN(5, 5, 0, 4), dir: 0,
    text: "Pip starts looking up. Follow the code with your finger, then tap where Pip stops.",
    starter: lines(`move()`, `move()`, `turn_right()`, `move()`, `move()`, `move()`, `turn_right()`, `move()`),
    ask: "Act it out with your finger on the screen, line by line.",
  },
  {
    id: "p4", part: "C", type: "predict", title: "Predict: turn around", map: OPEN(5, 3, 2, 1),
    text: "What happens if Pip turns left **twice**? Tap where Pip stops.",
    starter: lines(`move()`, `turn_left()`, `turn_left()`, `move()`, `move()`, `move()`),
    ask: "Two left turns... which way is Pip facing now?",
  },
  {
    id: "p5", part: "C", type: "predict", title: "Predict: the square", map: OPEN(4, 4, 0, 3), dir: 0,
    text: "A longer one! Where does Pip end up?",
    starter: lines(`move()`, `move()`, `turn_right()`, `move()`, `move()`, `turn_right()`, `move()`, `move()`, `turn_right()`, `move()`, `move()`),
    ask: "Surprise! Why did Pip end up there?",
  },
  {
    id: "p6", part: "C", type: "predict", title: "Predict: the stairs", map: OPEN(6, 6, 0, 5),
    text: "Last one! Left, right, left, right… where does Pip stop?",
    starter: lines(`move()`, `turn_left()`, `move()`, `turn_right()`, `move()`, `turn_left()`, `move()`, `turn_right()`, `move()`),
    ask: "Which level from before did this remind you of?",
  },

  // ───────────── D. Build the Hut (place) ─────────────
  {
    id: "d1", part: "D", type: "grid", title: "Collect wood 🪵", map: ["P.W.W.W"], wood: 0,
    text: "The storm knocked Pip's hut down! First, collect all the wood. `collect()` picks up wood too.",
    starter: ``, par: 9,
    solution: lines(`move()`, `move()`, `collect()`, `move()`, `move()`, `collect()`, `move()`, `move()`, `collect()`),
    check: (r) => r.woodLeft === 0, need: "Collect all 3 pieces of wood.",
    ask: "How much wood does Pip have now?",
  },
  {
    id: "d2", part: "D", type: "grid", title: "Drop a log", map: ["P.B"], wood: 1,
    text: "`place(\"🪵\")` puts a log down **where Pip is standing**. Walk to the see-through square and place the log there.",
    starter: lines(`move()`, `move()`, ``), solution: lines(`move()`, `move()`, `place("🪵")`), par: 3,
    palette: BUILD, hints: ["Click the 🪵 button to type the log. Don't forget the quotes!"],
    ask: "What's inside the brackets this time? Why?",
  },
  {
    id: "d3", part: "D", type: "grid", title: "Three logs", map: ["PBBB"], wood: 3,
    text: "Fill all three see-through squares. Move, place, move, place…",
    starter: ``, solution: lines(`move()`, `place("🪵")`, `move()`, `place("🪵")`, `move()`, `place("🪵")`), par: 6,
    palette: BUILD,
    ask: "What happens if you place before you move?",
  },
  {
    id: "d4", part: "D", type: "grid", title: "Hut: the floor",
    map: [".......", ".......", ".......", ".......", "PBBBBB.", "......."], wood: 5,
    text: "Now the real hut! Start with the **floor**: 5 logs in a row.",
    starter: ``, par: 10, palette: BUILD,
    solution: lines(...Array(5).fill(lines(`move()`, `place("🪵")`))),
    ask: "How many lines did you write? How many logs?",
  },
  {
    id: "d5", part: "D", type: "grid", title: "Hut: the walls",
    map: [".......", ".......", ".B...B.", ".B...B.", "Plllll.", "......."], wood: 4,
    text: "Floor done ✅. Now build the **walls**: two logs on each side. Pip can walk on the floor.",
    starter: ``, par: 15, palette: BUILD,
    solution: lines(`move()`, `turn_left()`, `move()`, `place("🪵")`, `move()`, `place("🪵")`, `turn_right()`, `move()`, `move()`, `move()`, `move()`, `place("🪵")`, `turn_right()`, `move()`, `place("🪵")`),
    hints: ["Do the left wall first, going up", "Then walk across the top to the right wall"],
    ask: "Which wall did you build first? Could you do it the other way?",
  },
  {
    id: "d6", part: "D", type: "grid", title: "Hut: door & windows",
    map: [".......", ".......", ".lO.Ol.", ".l.D.l.", ".lllll.", "...P..."], dir: 0,
    text: "Every hut needs a door 🚪 and windows 🪟. `place(\"🚪\")` and `place(\"🪟\")` work just like the log.",
    starter: ``, par: 12, palette: BUILD,
    solution: lines(`move()`, `move()`, `place("🚪")`, `move()`, `turn_left()`, `move()`, `place("🪟")`, `turn_left()`, `turn_left()`, `move()`, `move()`, `place("🪟")`),
    ask: "What's different between place(\"🚪\") and place(\"🪟\")?",
  },
  {
    id: "d7", part: "D", type: "grid", title: "Hut: the roof",
    map: [".......", "PRRRRR.", ".lo.ol.", ".l.d.l.", ".lllll.", "......."],
    text: "Last part: the **roof**! Use `place(\"🔺\")` on all 5 squares.",
    starter: ``, par: 10, palette: BUILD,
    solution: lines(...Array(5).fill(lines(`move()`, `place("🔺")`))),
    ask: "This code repeats a lot. What two lines keep repeating?",
    win: "The hut is finished! 🏠",
  },
  {
    id: "d8", part: "D", type: "grid", title: "Storm damage!", dir: 0, wood: 0,
    map: [".......", ".rrrrr.", ".lo.ol.", "WB.d.l.", "WlllBl.", "P......"],
    text: "Oh no, the wind blew 2 logs away! Collect the wood 🪵 next to the hut, then fix both holes.",
    starter: ``, par: 13, palette: BUILD,
    solution: lines(`move()`, `collect()`, `move()`, `collect()`, `turn_right()`, `move()`, `place("🪵")`, `move()`, `move()`, `move()`, `turn_right()`, `move()`, `place("🪵")`),
    ask: "Why did Pip need to collect wood first?",
  },
  {
    id: "d9", part: "D", type: "grid", title: "Make it yours! 🌺", saveHut: true,
    map: [".......", ".rrrrr.", ".lo.ol.", ".l.d.l.", ".lllll.", "P......"],
    text: "Decorate the hut any way you like! Walk Pip around and place flowers 🌺, stars ⭐, palm trees 🌴 or a flag 🚩. Place **at least 3** things. It gets saved to your island!",
    starter: ``, palette: BUILD,
    solution: lines(`place("🌺")`, `move()`, `place("🌴")`, `move()`, `place("🚩")`),
    check: (r) => Object.keys(r.placed).length >= 3, need: "Place at least 3 decorations.",
    ask: "Tell me about your design!",
  },

  // ───────────── E. Boss: Escape the Tide ─────────────
  {
    id: "e1", part: "E", type: "grid", title: "Boss 1: The tide is coming 🌊", dir: 0,
    map: ["S..C..F", ".#...#S", "P..S...", "~~~~~~~"],
    text: "The tide is rising! Collect all 3 shells before the water comes, then get to the flag. Watch out for the crab!",
    starter: ``, par: 19,
    solution: lines(`move()`, `move()`, `collect()`, `turn_right()`, `move()`, `move()`, `turn_right()`, `move()`, `move()`, `turn_left()`, `move()`, `collect()`, `move()`, `move()`, `move()`, `turn_left()`, `move()`, `collect()`, `move()`),
    ask: "Which commands did you use? Name all of them!",
  },
  {
    id: "e2", part: "E", type: "grid", title: "Boss 2: Bridge out!", wood: 0,
    map: ["~~~~~~~", "PSW.BSF", "~~~~~~~"],
    text: "The bridge is broken! Collect the shells and the wood, fix the gap with a log, and when you reach the flag make Pip say `Safe!`",
    starter: ``, par: 11, palette: BUILD,
    solution: lines(`move()`, `collect()`, `move()`, `collect()`, `move()`, `move()`, `place("🪵")`, `move()`, `collect()`, `move()`, `print("Safe!")`),
    check: (r) => r.shellsLeft === 0 && r.missing === 0 && r.onFlag && said(r, /safe/i),
    need: "Collect the shells, fix the gap with a log, reach the flag and say Safe!",
    ask: "You used 5 different commands here. Which ones?",
  },
  {
    id: "e3", part: "E", type: "grid", title: "Boss 3: Home before the tide!",
    map: ["S.....C", ".rrrrr.", ".lo.ol.", ".l.d.l.", "Clllll.", "P..S..S"],
    text: "The final challenge! Collect all 3 shells, get Pip to the **hut door 🚪**, and then make Pip say `We did it!`",
    starter: ``, par: 33,
    solution: lines(`move()`, `move()`, `move()`, `collect()`, `move()`, `move()`, `move()`, `collect()`, `turn_left()`, ...Array(4).fill("move()"), `turn_left()`, ...Array(6).fill("move()"), `turn_right()`, `move()`, `collect()`, `turn_right()`, `turn_right()`, `move()`, `move()`, `move()`, `turn_left()`, `move()`, `move()`, `move()`, `print("We did it!")`),
    check: (r) => r.shellsLeft === 0 && r.x === 3 && r.y === 3 && said(r, /we did it/i),
    need: "Collect all 3 shells, stand on the hut door 🚪, then say We did it!",
    ask: "What was the hardest part of today?",
  },
  {
    id: "showoff", part: "E", type: "card", showoff: true, emoji: "🏆",
    title: "Captain {name} saved the beach!",
    text: "Look what you built today with Python. Pip got a present for you too: a fancy hat! 🎩",
    button: "Play Shell Hunt →", gift: "🎩",
  },

  // ───────────── F. Shell Hunt (endless practice) ─────────────
  {
    id: "hunt", part: "F", type: "endless", title: "Shell Hunt 🔁",
    text: "A new beach every time! Collect **all** the shells 🐚, then reach the flag 🏁. Each beach is a bit bigger than the last.",
    starter: ``,
    hints: ["Plan the path with your finger first", "Do one shell at a time, and press Run often to check"],
    ask: "Can you beat your best score?",
  },

  // ═════════════ SESSION 2: "Treasure Island" (variables, loops, if, functions) ═════════════
  {
    id: "s2", part: "G", type: "card", emoji: "🗺️💰🏝️",
    title: "Session 2: Treasure Island",
    text: "A bottle washed up on the beach with an old **treasure map** inside! 🗺️\n\nThe treasure is on Treasure Island, and the way there is long and tricky. Pip needs to learn the four big ideas real programmers use every day:\n\n🎒 **Variables**: boxes that remember things\n🔁 **Loops**: doing things again and again\n🔀 **If**: making decisions\n🛠️ **Functions**: teaching Pip new words\n\nEvery level you win earns 🪙 coins. Spend them in the 🛍️ Shop on new looks, hats, pets and backgrounds!",
    button: "Let's find the treasure! →",
  },

  // ───────────── G. Pip's Backpack (variables) ─────────────
  {
    id: "g1", part: "G", type: "talk", title: "A box with a name 📦",
    text: "A **variable** is a box with a name. `shells = 5` puts 5 in a box called `shells`. Then `print(shells)` shows what's inside. No quotes!\n\nPip just found more shells. Change the 5 to **7** and run it.",
    starter: lines(`shells = 5`, `print(shells)`), solution: lines(`shells = 7`, `print(shells)`),
    uses: ["var"], check: (r) => r.vars.shells === 7 && said(r, /^7$/), need: "Put 7 in the shells box, then print(shells).",
    hints: ["Change only the number on the first line"],
    ask: "What's the name of the box? What's inside it?",
  },
  {
    id: "g2", part: "G", type: "talk", title: "Name tags 🏷️",
    text: "Boxes can hold words too, with quotes. Make a box called `pet` with `\"Crabby\"` inside, then make Pip say `My pet is Crabby` using the box.",
    starter: lines(`friend = "Pip"`, `print("My friend is", friend)`, ``, `# make a pet box here`, ``),
    solution: lines(`friend = "Pip"`, `print("My friend is", friend)`, `pet = "Crabby"`, `print("My pet is", pet)`),
    uses: ["var"], check: (r) => /crabby/i.test(r.vars.pet) && said(r, /my pet is crabby/i),
    need: 'Make pet = "Crabby", then print("My pet is", pet)',
    hints: ["Copy the two lines at the top, then change friend to pet", "A comma in print puts a space between things"],
    ask: "What does the comma inside print do?",
  },
  {
    id: "g3", part: "G", type: "talk", debug: true, title: "Quotes or no quotes? 🐛",
    text: "Pip should say how many coconuts are in the box, but Pip just says the word *coconuts*! Run it, then fix it.",
    starter: lines(`coconuts = 12`, `print("coconuts")`), solution: lines(`coconuts = 12`, `print(coconuts)`),
    check: (r) => said(r, /^12$/), need: "Pip should say 12. Quotes mean: this exact word. No quotes mean: what's in the box.",
    ask: "When do we use quotes, and when don't we?",
  },
  {
    id: "g4", part: "G", type: "talk", title: "Fruit maths 🍌🍎",
    text: "Python is great at maths! Pip has 3 bananas and 4 apples. Make a box called `total` that adds them up: `total = bananas + apples`. Then print it.",
    starter: lines(`bananas = 3`, `apples = 4`, ``), solution: lines(`bananas = 3`, `apples = 4`, `total = bananas + apples`, `print(total)`),
    uses: ["var"], check: (r) => r.vars.total === 7 && said(r, /^7$/), need: "Make total = bananas + apples, then print(total). It should say 7.",
    ask: "If Pip finds 2 more apples, which line would you change?",
  },
  {
    id: "g5", part: "G", type: "talk", title: "The shell shop 🛍️",
    text: "Multiply with a star: `cost = price * shells`. One shell costs 3 coins and Pip wants 4 shells. Work out the cost and print it.",
    starter: lines(`price = 3`, `shells = 4`, ``), solution: lines(`price = 3`, `shells = 4`, `cost = price * shells`, `print(cost)`),
    check: (r) => r.vars.cost === 12 && said(r, /^12$/), need: "Make a cost box, then print(cost). It should say 12.",
    ask: "What would 10 shells cost?",
  },
  {
    id: "g6", part: "G", type: "talk", title: "Boxes can change 🔄",
    text: "`coins = coins + 5` means: take what's in the box, add 5, put it back.\n\nPip has 10 coins, finds **5** more, then spends **3** on ice cream 🍦. Change the box, then print how many coins are left.",
    starter: lines(`coins = 10`, `coins = coins + 5`, ``), solution: lines(`coins = 10`, `coins = coins + 5`, `coins = coins - 3`, `print(coins)`),
    check: (r) => r.vars.coins === 12 && said(r, /^12$/), need: "Pip should end with 12 coins, and print(coins) at the end.",
    hints: ["Taking away is a minus: coins = coins - 3"],
    ask: "What's in the box after each line?",
  },
  {
    id: "g7", part: "G", type: "talk", title: "The += shortcut ⚡",
    text: "`score += 10` is a shortcut for `score = score + 10`. Pip scores 10 points three times. Use `+=` three times, then print the score.",
    starter: lines(`score = 0`, `score += 10`, ``), solution: lines(`score = 0`, `score += 10`, `score += 10`, `score += 10`, `print(score)`),
    uses: ["+="], check: (r) => r.vars.score === 30 && said(r, /^30$/), need: "score should be 30, and Pip should print it.",
    ask: "What would score -= 5 do?",
  },
  {
    id: "g8", part: "G", type: "talk", debug: true, title: "Words + numbers = 💥",
    text: "Pip wants to say `I am 8 years old`, but the code crashes! Run it and read the error. Fix it with commas, or with `str(age)`.",
    starter: lines(`age = 8`, `print("I am " + age + " years old")`),
    solution: lines(`age = 8`, `print("I am", age, "years old")`),
    check: (r) => said(r, /^I am 8 years old$/), need: "Pip should say exactly: I am 8 years old",
    ask: "Why can't Python add a word and a number?",
  },
  {
    id: "g9", part: "G", type: "talk", title: "Magic f-strings ✨",
    text: "Put an **f** before the quotes and Python fills in the boxes for you: `f\"I have {shells} shells\"`.\n\nMake Pip say `Crabby has 8 legs` with an f-string that uses the `pet` and `legs` boxes.",
    starter: lines(`pet = "Crabby"`, `legs = 8`, `print(f"{pet} has ...")`),
    solution: lines(`pet = "Crabby"`, `legs = 8`, `print(f"{pet} has {legs} legs")`),
    uses: ["fstring"], check: (r) => said(r, /^Crabby has 8 legs$/), need: "Pip should say: Crabby has 8 legs",
    hints: ["Put {legs} where the number goes"],
    ask: "What happens if you forget the f?",
  },
  {
    id: "g10", part: "G", type: "grid", title: "Shell counter 🔢", map: ["P.S.S.SF"],
    text: "Pip keeps count! Start with `count = 0`. After each `collect()`, do `count += 1`. At the flag, `print(count)`.",
    starter: lines(`count = 0`, `move()`, `move()`, `collect()`, `count += 1`, ``),
    solution: lines(`count = 0`, `move()`, `move()`, `collect()`, `count += 1`, `move()`, `move()`, `collect()`, `count += 1`, `move()`, `move()`, `collect()`, `count += 1`, `move()`, `print(count)`),
    check: (r) => r.shellsLeft === 0 && r.onFlag && r.vars.count === 3 && r.said.at(-1) === "3",
    need: "Collect all 3 shells, add 1 to count each time, reach the flag, then print(count).",
    ask: "How does the computer remember the number?",
  },
  {
    id: "g11", part: "G", type: "talk", title: "Swap the boxes 🔀",
    text: "Oops! Box `a` has the banana and box `b` has the apple, but Pip wants them the other way round. Swap them **without typing any fruit**. Tip: use a third box called `spare`.",
    starter: lines(`a = "🍌"`, `b = "🍎"`, ``, `# swap them here`, ``, `print(a, b)`),
    solution: lines(`a = "🍌"`, `b = "🍎"`, `spare = a`, `a = b`, `b = spare`, `print(a, b)`),
    check: (r) => r.vars.a === "🍎" && r.vars.b === "🍌" && said(r, /^🍎 🍌$/), need: "Box a should end up with 🍎 and box b with 🍌.",
    hints: ["First put a into the spare box: spare = a", "Then a = b, and then b = spare"],
    ask: "Why do we need the spare box? Try swapping two cups of water!",
  },
  {
    id: "g12", part: "G", type: "talk", title: "Pirate share 🏴‍☠️",
    text: "Pip found 20 gold coins to share with 4 friends. `//` divides and gives a whole number.\n\nMake `gold = 20` and `friends = 4`, work out `each = gold // friends`, then use an f-string to say `Each friend gets 5 coins`.",
    starter: lines(`# write your code here`, ``), solution: lines(`gold = 20`, `friends = 4`, `each = gold // friends`, `print(f"Each friend gets {each} coins")`),
    uses: ["var", "fstring"], check: (r) => r.vars.each === 5 && said(r, /^Each friend gets 5 coins$/),
    need: "Make each = gold // friends, then print an f-string that says: Each friend gets 5 coins",
    ask: "What if there were 5 friends? Change it and see!",
  },

  // ───────────── H. Loop Lagoon (for, range, while) ─────────────
  {
    id: "h1", part: "H", type: "grid", title: "Repeat after me 🔁", map: ["P.....F"],
    text: "Remember writing `move()` again and again? A **for loop** repeats for you!\n\n`for i in range(3):` repeats the pushed-in lines 3 times. Pip needs **6** steps. Change one number.",
    starter: lines(`for i in range(3):`, `    move()`), solution: lines(`for i in range(6):`, `    move()`),
    uses: ["for"], par: 2,
    ask: "How many lines would this take without a loop?",
  },
  {
    id: "h2", part: "H", type: "grid", title: "The really long beach", map: ["P" + ".".repeat(11) + "F"],
    text: "12 steps! Write the loop yourself. Don't forget the `:` at the end, and push the inside line in with **Tab**.",
    starter: ``, solution: lines(`for i in range(12):`, `    move()`), uses: ["for"], par: 2,
    hints: ["First line: for i in range(12):", "Next line: press Tab, then write move()"],
    ask: "What do the spaces at the start of a line tell Python?",
  },
  {
    id: "h3", part: "H", type: "grid", title: "Two lines in a loop", map: ["PSSSSS"],
    text: "A loop can repeat **more than one line**. Every pushed-in line is inside the loop. Move and collect, 5 times!",
    starter: lines(`for i in range(5):`, `    move()`, ``), solution: lines(`for i in range(5):`, `    move()`, `    collect()`),
    uses: ["for"], par: 3,
    ask: "What happens if collect() isn't pushed in? Try it!",
  },
  {
    id: "h4", part: "H", type: "talk", title: "Hip hip hooray! 🎉",
    text: "Loops work with `print` too. Make Pip say `Hip hip hooray!` **5 times** with a loop.",
    starter: ``, solution: lines(`for i in range(5):`, `    print("Hip hip hooray!")`),
    uses: ["for"], par: 2, check: (r) => r.said.filter((s) => /hooray/i.test(s)).length === 5,
    need: "Pip should say Hip hip hooray! exactly 5 times.",
    ask: "How would you make it 100 times? Try it!",
  },
  {
    id: "h5", part: "H", type: "talk", title: "Counting with i 🔢",
    text: "`i` is a box that the loop changes every time! `range(1, 4)` gives 1, 2, 3. It stops **before** 4.\n\nMake Pip count from **1 to 10**.",
    starter: lines(`for i in range(1, 4):`, `    print(i)`), solution: lines(`for i in range(1, 11):`, `    print(i)`),
    uses: ["for"], check: (r) => r.said.join(",") === "1,2,3,4,5,6,7,8,9,10", need: "Pip should count 1, 2, 3 ... all the way to 10.",
    hints: ["range stops before the last number. To reach 10 you need range(1, 11)"],
    ask: "Why do we need 11 to count to 10?",
  },
  {
    id: "h6", part: "H", type: "talk", title: "Rocket countdown 🚀",
    text: "`range(10, 0, -1)` counts **backwards**: 10, 9, 8 ... 1. Count down from 10, and **after** the loop print `Blast off! 🚀`.",
    starter: ``, solution: lines(`for i in range(10, 0, -1):`, `    print(i)`, `print("Blast off! 🚀")`),
    uses: ["for"], palette: FUN,
    check: (r) => r.said.length === 11 && r.said.slice(0, 10).join(",") === "10,9,8,7,6,5,4,3,2,1" && /blast off/i.test(r.said[10]),
    need: "Count 10 down to 1, then say Blast off! 🚀 once, after the loop (not pushed in).",
    ask: "What happens if Blast off is pushed in?",
  },
  {
    id: "h7", part: "H", type: "predict", title: "Predict: loop walk 🔮", map: OPEN(6, 3, 0, 2),
    text: "Read the loop. How many steps does it really take? Tap where Pip stops!",
    starter: lines(`for i in range(2):`, `    move()`, `    move()`, `turn_left()`, `move()`),
    ask: "Which lines are inside the loop, and which are not?",
  },
  {
    id: "h8", part: "H", type: "grid", title: "Around the rock pool", dir: 0, map: [".S..", ".##S", "S##.", "P.S."],
    text: "Pip walks all around the rock pool. Every side is the same: move, collect, move, move, turn right. Put it in a loop that repeats **4** times!",
    starter: ``, solution: lines(`for i in range(4):`, `    move()`, `    collect()`, `    move()`, `    move()`, `    turn_right()`),
    uses: ["for"], par: 6,
    ask: "How many lines would this be without the loop?",
  },
  {
    id: "h9", part: "H", type: "grid", title: "Stairs in a loop 🪜", map: ["###F", "##..", "#..#", "P.##"],
    text: "Remember the zig-zag stairs? That took 11 lines! Find the part that repeats and put it in a loop. ⭐⭐⭐ for 5 lines.",
    starter: ``, solution: lines(`for i in range(3):`, `    move()`, `    turn_left()`, `    move()`, `    turn_right()`),
    uses: ["for"], par: 5,
    hints: ["One stair is: move, turn_left, move, turn_right", "There are 3 stairs"],
    ask: "How did you find the pattern?",
  },
  {
    id: "h10", part: "H", type: "talk", target: FIELD, title: "Loop painter 🎨",
    text: "`\"🟩\" * 6` makes 6 green squares in a row! Use a loop to print a field **4 rows** tall and **6 squares** wide.",
    starter: ``, solution: lines(`for i in range(4):`, `    print("🟩" * 6)`),
    uses: ["for"], palette: SQUARES, check: art(FIELD), need: artNeed(FIELD),
    ask: "How would you make the field 10 rows tall?",
  },
  {
    id: "h11", part: "H", type: "talk", target: TRI, title: "Star triangle ⭐",
    text: "Use `i` inside the loop to make each row longer! Copy the triangle: row 1 has 1 star and row 5 has 5 stars.",
    starter: lines(`for i in range(1, 6):`, `    print("⭐")`), solution: lines(`for i in range(1, 6):`, `    print("⭐" * i)`),
    uses: ["for"], check: art(TRI), need: artNeed(TRI),
    hints: ["Multiply the star by i: \"⭐\" * i"],
    ask: "Can you make the triangle upside down?",
  },
  {
    id: "h12", part: "H", type: "grid", title: "While not at the flag 🏁", maps: ["P..F", "P......F", "P.F"],
    text: "A **while loop** keeps going *while* something is true. `at_flag()` tells you if Pip is on the flag.\n\n`while not at_flag():` means: keep going until you reach the flag. Your code is tested on **3 beaches** of different lengths!",
    starter: lines(`while not at_flag():`, `    `), solution: lines(`while not at_flag():`, `    move()`),
    uses: ["while"], par: 2, palette: [...CODE, ...SENSE],
    ask: "Why can't a for loop with a number work on all 3 beaches?",
  },
  {
    id: "h13", part: "H", type: "grid", title: "Shell trail", maps: ["PSSSF", "PSF", "PSSSSSSF"],
    text: "There's a shell on every square up to the flag, but every beach is a different length! Collect them all with a while loop. Careful with the order of your lines.",
    starter: ``, solution: lines(`move()`, `while not at_flag():`, `    collect()`, `    move()`),
    uses: ["while"], palette: [...CODE, ...SENSE],
    hints: ["Take the first step before the loop starts", "Inside the loop: collect(), then move()"],
    ask: "Why did the first move() need to be before the loop?",
  },

  // ───────────── I. Crab Crossroads (if, else, elif, and) ─────────────
  {
    id: "i1", part: "I", type: "talk", title: "If the bag is full 🎒",
    text: "`if` lets Pip **decide**. The pushed-in lines only run **if** the question is true. `>` means *bigger than*.\n\nPip has 15 shells. Add an `if` that says `My bag is full!` when shells is bigger than 10.",
    starter: lines(`shells = 15`, ``), solution: lines(`shells = 15`, `if shells > 10:`, `    print("My bag is full!")`),
    uses: ["if"], check: (r) => said(r, /bag is full/i), need: "Use if shells > 10: and put a print that says My bag is full! inside it.",
    hints: ["if shells > 10:", "Push the print in with Tab, like in a loop"],
    ask: "What happens if you change shells to 3? Try it!",
  },
  {
    id: "i2", part: "I", type: "talk", title: "Or else! 🏊🏰",
    text: "`else` is what happens when the `if` is **not** true. Add an `else` that prints `Let's build sandcastles 🏰`. Then change the temperature to **15** and run it.",
    starter: lines(`temperature = 30`, `if temperature > 25:`, `    print("Swim time 🏊")`, ``),
    solution: lines(`temperature = 15`, `if temperature > 25:`, `    print("Swim time 🏊")`, `else:`, `    print("Let's build sandcastles 🏰")`),
    uses: ["if", "else"], check: (r) => r.vars.temperature <= 25 && said(r, /sandcastle/i) && !said(r, /swim/i),
    need: "Add else: with a sandcastle print, and change the temperature to 15.",
    hints: ["else: goes all the way to the left, under the if"],
    ask: "Can both messages ever show at the same time?",
  },
  {
    id: "i3", part: "I", type: "talk", debug: true, title: "The secret password 🔐",
    text: "The hut door opens with the password `coconut`, but Crabby broke the `if`! Run it and fix it. Remember: `=` puts a value in a box, and `==` asks *are these the same?*",
    starter: lines(`password = "coconut"`, `if password = "coconut":`, `    print("The door opens! 🚪")`),
    solution: lines(`password = "coconut"`, `if password == "coconut":`, `    print("The door opens! 🚪")`),
    check: (r) => said(r, /door opens/i), need: "Fix the if so the door opens.",
    ask: "What's the difference between = and ==?",
  },
  {
    id: "i4", part: "I", type: "talk", title: "Pip's battery 🔋",
    text: "`elif` means *else if*: one more question to try. Pip's battery is at 50. Add `elif battery > 20:` that prints `I'm OK 🙂`.",
    starter: lines(`battery = 50`, `if battery > 80:`, `    print("Full power! ⚡")`, `else:`, `    print("I need a charge 🪫")`),
    solution: lines(`battery = 50`, `if battery > 80:`, `    print("Full power! ⚡")`, `elif battery > 20:`, `    print("I'm OK 🙂")`, `else:`, `    print("I need a charge 🪫")`),
    uses: ["elif"], check: (r) => r.said.length === 1 && said(r, /OK/), need: "Add elif battery > 20: between the if part and the else, and print I'm OK 🙂",
    hints: ["The elif goes between the if part and the else: line"],
    ask: "Which message shows if battery is 10? And 95?",
  },
  {
    id: "i5", part: "I", type: "talk", title: "Sunny and warm ☀️",
    text: "`and` means **both** must be true. `True` and `False` are special words, with no quotes!\n\nIt's sunny and warm today. Write an `if` with `and` that prints `Beach day! 🏖️` when it's sunny and warm.",
    starter: lines(`sunny = True`, `warm = True`, ``), solution: lines(`sunny = True`, `warm = True`, `if sunny and warm:`, `    print("Beach day! 🏖️")`),
    uses: ["if", "and"], check: (r) => said(r, /beach day/i), need: "Write if sunny and warm: and put print(\"Beach day! 🏖️\") inside it.",
    ask: "If warm = False, is it still a beach day? What would or do?",
  },
  {
    id: "i6", part: "I", type: "talk", debug: true, title: "Guess the number 🎲",
    text: "Pip is thinking of 7. The guess is 3, so Pip should say `Too low`. But Crabby swapped something! Run it and fix the bug.",
    starter: lines(`secret = 7`, `guess = 3`, `if guess == secret:`, `    print("You got it! 🎉")`, `elif guess > secret:`, `    print("Too low")`, `else:`, `    print("Too high")`),
    solution: lines(`secret = 7`, `guess = 3`, `if guess == secret:`, `    print("You got it! 🎉")`, `elif guess < secret:`, `    print("Too low")`, `else:`, `    print("Too high")`),
    check: (r) => r.said.join() === "Too low", need: "With guess = 3 Pip should say only: Too low",
    hints: ["Is 3 bigger or smaller than 7? Look at the > sign"],
    ask: "Change guess to 7. What does Pip say now?",
  },
  {
    id: "i7", part: "I", type: "grid", title: "Maybe a shell? 🐚", maps: ["PSS.F", "P.S.F", "PS.SF"],
    text: "Now Pip can ask about the beach! `on_shell()` is True when Pip is standing on a shell.\n\nWalk 4 steps, and **if** there's a shell, collect it. It must work on **3 different beaches**!",
    starter: lines(`for i in range(4):`, `    move()`, ``), solution: lines(`for i in range(4):`, `    move()`, `    if on_shell():`, `        collect()`),
    uses: ["for", "if"], palette: [...CODE, ...SENSE],
    hints: ["Inside the loop: if on_shell():", "collect() needs TWO Tabs: it's inside the if, which is inside the loop"],
    ask: "Why does the same code work on every beach?",
  },
  {
    id: "i8", part: "I", type: "grid", title: "Walk to the rock 🪨", maps: ["P..F#", "P.....F#", "PF#"],
    text: "`front_is_clear()` is True when nothing is blocking Pip. Use `while front_is_clear():` to walk right up to the rock, on any beach!",
    starter: ``, solution: lines(`while front_is_clear():`, `    move()`),
    uses: ["while"], par: 2, palette: [...CODE, ...SENSE],
    ask: "What would happen with no rock at all?",
  },
  {
    id: "i9", part: "I", type: "grid", title: "Beachcomber 🔍", maps: ["PS.S..SF", "P..SS.F", "PSSSF", "P....SF"],
    text: "Walk to the flag and collect every shell on the way. You don't know where the shells are, so ask!",
    starter: ``, solution: lines(`while not at_flag():`, `    move()`, `    if on_shell():`, `        collect()`),
    uses: ["while", "if"], palette: [...CODE, ...SENSE],
    hints: ["Use while not at_flag(): for the walking", "Inside it, after move(), ask if on_shell():"],
    ask: "Can you explain your code, line by line?",
  },
  {
    id: "i10", part: "I", type: "predict", title: "Predict: until the rock 🔮", map: ["......", "P...#.", "......"],
    text: "Pip walks *while* the front is clear, then does two more things. Where does Pip stop? Tap it!",
    starter: lines(`while front_is_clear():`, `    move()`, `turn_left()`, `move()`),
    ask: "Why did Pip stop before the rock and not on it?",
  },
  {
    id: "i11", part: "I", type: "grid", title: "Follow the path 🐾", maps: [["F..", "##.", "P.."], ["#F", "#.", "#.", "P."], [".....", ".###.", "..F#.", "####.", "P...."]],
    text: "If the way is clear, move. **Else**, turn left. Repeat until the flag. This one rule works on all 3 paths!",
    starter: lines(`while not at_flag():`, `    if front_is_clear():`, `        move()`, ``),
    solution: lines(`while not at_flag():`, `    if front_is_clear():`, `        move()`, `    else:`, `        turn_left()`),
    uses: ["while", "if", "else"], palette: [...CODE, ...SENSE],
    hints: ["else: lines up with the if above it"],
    ask: "Could a robot vacuum use a rule like this?",
  },
  {
    id: "i12", part: "I", type: "grid", title: "Hop over the rocks 🦘", maps: [["......", "P.#..F"], ["......", "P..#.F"], ["......", "P#...F"]],
    text: "There's a rock somewhere on the path. If the way is clear, move. Else, hop over it: go up, across 2 squares, and back down. Works on all 3 beaches?",
    starter: lines(`while not at_flag():`, `    if front_is_clear():`, `        move()`, `    else:`, `        turn_left()`, ``),
    solution: lines(`while not at_flag():`, `    if front_is_clear():`, `        move()`, `    else:`, `        turn_left()`, `        move()`, `        turn_right()`, `        move()`, `        move()`, `        turn_right()`, `        move()`, `        turn_left()`),
    uses: ["while", "if", "else"], palette: [...CODE, ...SENSE],
    hints: ["The hop: turn_left, move, turn_right, move, move, turn_right, move, turn_left", "At the end of the hop, Pip must face right again"],
    ask: "What would make this code shorter? (Next zone: functions!)",
  },

  // ───────────── J. Robot Workshop (functions) ─────────────
  {
    id: "j1", part: "J", type: "grid", title: "Teach Pip a new word 🛠️", map: ["S.P..F"],
    text: "A **function** is a new word you teach Pip. `def turn_around():` and the pushed-in lines say what the word means. Then you can use it like any other command!\n\nThe function is ready. Use `turn_around()` to grab the shell behind Pip, then go to the flag.",
    starter: lines(`def turn_around():`, `    turn_left()`, `    turn_left()`, ``, `turn_around()`, ``),
    solution: lines(`def turn_around():`, `    turn_left()`, `    turn_left()`, ``, `turn_around()`, `move()`, `move()`, `collect()`, `turn_around()`, `for i in range(5):`, `    move()`),
    uses: ["def"],
    ask: "Why is turn_around() easier to read than two turn_left() lines?",
  },
  {
    id: "j2", part: "J", type: "grid", title: "Make your own word", map: ["PSSSS"],
    text: "Now you write one! Make a function called `grab` that does `move()` and then `collect()`. Then use `grab()` 4 times, or in a loop!",
    starter: lines(`def grab():`, `    `, ``), solution: lines(`def grab():`, `    move()`, `    collect()`, ``, `for i in range(4):`, `    grab()`),
    uses: ["def"],
    ask: "What other new words would be useful for Pip?",
  },
  {
    id: "j3", part: "J", type: "grid", title: "Pip forgot turn_right! 😱", map: ["...F", ".###", "P###"], dir: 0, ban: ["turn_right"],
    text: "Oh no, Pip forgot how to `turn_right()`! But three left turns make a right turn. Teach Pip a function called `right()` and use it to reach the flag.",
    starter: lines(`def right():`, `    `, ``),
    solution: lines(`def right():`, `    turn_left()`, `    turn_left()`, `    turn_left()`, ``, `move()`, `move()`, `right()`, `move()`, `move()`, `move()`),
    uses: ["def"],
    hints: ["Stand up and turn left 3 times. Which way are you facing?"],
    ask: "Is three lefts really the same as one right?",
  },
  {
    id: "j4", part: "J", type: "talk", title: "Cheer squad 📣",
    text: "Functions can print too. Make `cheer()` print `Go Pip!` and then `🎉🎉🎉`. Call it **3 times**.",
    starter: lines(`def cheer():`, `    print("Go Pip!")`, ``),
    solution: lines(`def cheer():`, `    print("Go Pip!")`, `    print("🎉🎉🎉")`, ``, `cheer()`, `cheer()`, `cheer()`),
    uses: ["def"], palette: FUN,
    check: (r) => r.said.filter((s) => /go pip/i.test(s)).length === 3 && r.said.length === 6,
    need: "cheer() should print 2 lines, and you call it 3 times: 6 lines in total.",
    ask: "If you change the cheer inside the function, how many lines change?",
  },
  {
    id: "j5", part: "J", type: "talk", title: "Hello, friends! 👋",
    text: "Functions can take an **input** in the brackets. In `def greet(friend):` the word `friend` is a box that gets filled each time.\n\nGreet all 3 friends: `Crabby`, `Seagull` and `Turtle`.",
    starter: lines(`def greet(friend):`, `    print(f"Hello {friend}!")`, ``, `greet("Crabby")`, ``),
    solution: lines(`def greet(friend):`, `    print(f"Hello {friend}!")`, ``, `greet("Crabby")`, `greet("Seagull")`, `greet("Turtle")`),
    uses: ["def"], check: (r) => ["Crabby", "Seagull", "Turtle"].every((f) => said(r, new RegExp(`Hello ${f}!`))),
    need: "Pip should say Hello Crabby!, Hello Seagull! and Hello Turtle!",
    ask: "What's inside the friend box the second time?",
  },
  {
    id: "j6", part: "J", type: "grid", title: "walk(steps) 🚶", map: ["####F", "####.", "####.", "####.", "P...."],
    text: "Make a function `walk(steps)` with a loop inside that moves `steps` times. Then `walk(4)` moves 4 squares!",
    starter: lines(`def walk(steps):`, `    for i in range(steps):`, `        `, ``),
    solution: lines(`def walk(steps):`, `    for i in range(steps):`, `        move()`, ``, `walk(4)`, `turn_left()`, `walk(4)`),
    uses: ["def", "for"], par: 6,
    ask: "How is walk(4) better than 4 move() lines?",
  },
  {
    id: "j7", part: "J", type: "talk", title: "Functions that answer ↩️",
    text: "`return` sends an answer back. `double(21)` gives back 42.\n\nWrite a function `add(a, b)` that returns `a + b`, then `print(add(5, 7))`.",
    starter: lines(`def double(n):`, `    return n * 2`, ``, `print(double(21))`, ``),
    solution: lines(`def double(n):`, `    return n * 2`, ``, `print(double(21))`, ``, `def add(a, b):`, `    return a + b`, ``, `print(add(5, 7))`),
    uses: ["def", "return"], check: (r) => said(r, /^12$/), need: "Write def add(a, b): with return a + b inside, then print(add(5, 7)). Pip should say 12.",
    ask: "What's the difference between print and return?",
  },
  {
    id: "j8", part: "J", type: "grid", debug: true, title: "The lazy function 😴", map: ["PSSF"],
    text: "Crabby says this code is perfect, but Pip doesn't move at all! Run it. What's missing?",
    starter: lines(`def grab():`, `    move()`, `    collect()`, ``, `# Pip, go!`),
    solution: lines(`def grab():`, `    move()`, `    collect()`, ``, `grab()`, `grab()`, `move()`),
    hints: ["Making a function only teaches Pip the word. You still have to say it: grab()"],
    ask: "Why doesn't def on its own make Pip do anything?",
  },
  {
    id: "j9", part: "J", type: "grid", title: "The big staircase 🪜", map: ["#####F", "####..", "###..#", "##..##", "#..###", "P.####"],
    text: "Make a function `stair()` that climbs **one** stair. Then use a loop to climb all 5!",
    starter: lines(`def stair():`, `    `, ``),
    solution: lines(`def stair():`, `    move()`, `    turn_left()`, `    move()`, `    turn_right()`, ``, `for i in range(5):`, `    stair()`),
    uses: ["def", "for"], par: 7,
    ask: "What if there were 100 stairs? What would you change?",
  },
  {
    id: "j10", part: "J", type: "grid", title: "Speedy builder 🧱", map: ["PBBBB", "BBBB."],
    text: "Make `build_row(n)` that moves and places a log `n` times. Use it to build both rows!",
    starter: lines(`def build_row(n):`, `    for i in range(n):`, `        `, ``),
    solution: lines(`def build_row(n):`, `    for i in range(n):`, `        move()`, `        place("🪵")`, ``, `build_row(4)`, `turn_right()`, `move()`, `turn_right()`, `build_row(4)`),
    uses: ["def", "for"], palette: BUILD,
    hints: ["After the first row, turn right, move down, and turn right again"],
    ask: "Where else could build_row help?",
  },

  // ───────────── L. Treasure Cove (bosses: everything together) ─────────────
  {
    id: "l1", part: "L", type: "talk", title: "Crab Snap! 🦀",
    text: "A famous game! Count from 1 to 15, but for every number you can split into 3s, say `Snap! 🦀` instead.\n\n`i % 3` gives the **remainder** after dividing by 3. If it's 0, it splits exactly!",
    starter: lines(`for i in range(1, 16):`, `    if i % 3 == 0:`, `        print("Snap! 🦀")`, ``),
    solution: lines(`for i in range(1, 16):`, `    if i % 3 == 0:`, `        print("Snap! 🦀")`, `    else:`, `        print(i)`),
    uses: ["for", "if", "else"], check: (r) => r.said.join(",") === SNAP.join(","),
    need: "Pip should say 1, 2, Snap! 🦀, 4, 5, Snap! 🦀 ... up to 15. Use else: to print the other numbers.",
    ask: "Can you make it say Pop! for numbers you can split into 5s?",
  },
  {
    id: "l2", part: "L", type: "grid", title: "Boss: Shell census 📋", maps: ["P.S..SS.F", "PSSS.F", "P...S..F"],
    text: "Walk to the flag, collect every shell, and **count** them with a variable. At the flag, print how many you found. Every beach is different!",
    starter: lines(`count = 0`, ``),
    solution: lines(`count = 0`, `while not at_flag():`, `    move()`, `    if on_shell():`, `        collect()`, `        count += 1`, `print(count)`),
    uses: ["while", "if"], palette: [...CODE, ...SENSE],
    check: (r) => r.shellsLeft === 0 && r.onFlag && r.said.at(-1) === String(r.shells),
    need: "Collect every shell, count each one with count += 1, reach the flag, then print(count).",
    ask: "Which line does the counting? Which line remembers the number?",
  },
  {
    id: "l3", part: "L", type: "grid", title: "Boss: Rocky road 🪨🐚", maps: [["......", "PS#.SF"], ["......", "P.S#.F"], ["......", "P#S#SF"]],
    text: "Rocks **and** shells! Make a `hop()` function to jump over rocks. Then loop until the flag: collect if there's a shell, move if it's clear, else hop!",
    starter: lines(`def hop():`, `    turn_left()`, `    # ...`, ``, `while not at_flag():`, `    `),
    solution: lines(`def hop():`, `    turn_left()`, `    move()`, `    turn_right()`, `    move()`, `    move()`, `    turn_right()`, `    move()`, `    turn_left()`, ``, `while not at_flag():`, `    if on_shell():`, `        collect()`, `    if front_is_clear():`, `        move()`, `    else:`, `        hop()`),
    uses: ["def", "while", "if", "else"], palette: [...CODE, ...SENSE],
    hints: ["Copy the hop from Hop over the rocks into the function", "In the loop: if on_shell(): collect(), then if front_is_clear(): move(), else: hop()"],
    ask: "Which ideas did you use? Variables, loops, if, functions?",
  },
  {
    id: "l4", part: "L", type: "grid", title: "Boss: The treasure! 💰", map: ["PSSSS", "SSSSS", "SSSSS", "####F"],
    text: "The treasure is under the flag, but the beach is covered in shells! Collect **every** shell, then dig at the flag. Use a function and loops to keep it short.",
    starter: ``,
    solution: lines(`def grab_row():`, `    for i in range(4):`, `        move()`, `        collect()`, ``, `grab_row()`, `turn_right()`, `move()`, `collect()`, `turn_right()`, `grab_row()`, `turn_left()`, `move()`, `collect()`, `turn_left()`, `grab_row()`, `turn_right()`, `move()`),
    uses: ["def", "for"], par: 17, palette: [...CODE, ...SENSE],
    hints: ["Each row is 4 × (move, collect). Make that a function!", "Between rows: turn, move, collect, turn"],
    win: "You found the treasure! 💰",
    ask: "What was the hardest level in Treasure Island?",
  },
  {
    id: "showoff2", part: "L", type: "card", showoff: true, gift: "👑", emoji: "👑💰",
    title: "Captain {name} found the treasure!",
    text: "You learned the four big ideas of programming: **variables**, **loops**, **if** and **functions**. Real programmers use them every single day!\n\nPip has a gift for you: a golden crown 👑. Wear it in the 🛍️ Shop.",
    button: "Back to the map →",
  },
];

// One-row beaches can be written as a plain string; the first beach is the one shown when the level opens.
for (const l of LEVELS) if (l.maps) l.map = (l.maps = l.maps.map((m) => (typeof m === "string" ? [m] : m)))[0];

const USES = {
  for: "a for loop", while: "a while loop", if: "an if", else: "an else", elif: "an elif",
  def: "your own function (def)", return: "return", fstring: 'an f-string: f"..."', "+=": "+=",
  var: "a variable (a box with a name, like shells = 5)", and: "and", or: "or",
};
const missingUse = (level, r) => (level.uses || []).find((u) => !r.used?.includes(u));

/** Did the child pass? r = result from pipbot.run */
export function check(level, r, ctx = {}) {
  if (r.error || missingUse(level, r)) return false;
  if (level.check) return level.check(r, ctx);
  return r.shellsLeft === 0 && r.missing === 0 && (!r.hasFlag || r.onFlag);
}

/** Friendly reason why check() failed. */
export function whyNot(level, r) {
  const u = missingUse(level, r);
  if (u) return `It works, but this level is practice for ${USES[u]}. Can you use ${USES[u]} this time?`;
  if (level.need) return typeof level.need === "function" ? level.need(r) : level.need;
  if (r.shellsLeft) return r.shellsLeft === 1 ? "There's still 1 shell to collect 🐚" : `There are still ${r.shellsLeft} shells to collect 🐚`;
  if (r.missing) return `${r.missing} see-through square${r.missing > 1 ? "s are" : " is"} still empty. Build on ${r.missing > 1 ? "them" : "it"}!`;
  if (r.hasFlag && !r.onFlag) return "Pip didn't reach the flag 🏁 yet. Keep going!";
  return "Not quite yet. Read the task again!";
}

/** Random solvable beach for Shell Hunt; gets bigger with each round. */
export function makeHuntMap(round) {
  const rand = (n) => Math.floor(Math.random() * n);
  const w = Math.min(5 + (round >> 1), 10), h = Math.min(4 + Math.floor(round / 3), 7);
  const shells = Math.min(1 + (round >> 1), 6), rocky = Math.min(0.12 + round * 0.02, 0.3);
  for (;;) {
    const g = Array.from({ length: h }, () =>
      Array.from({ length: w }, () => (Math.random() < rocky ? (Math.random() < 0.3 ? "C" : "#") : ".")));
    const px = rand(w), py = rand(h);
    g[py][px] = "P";
    // every shell and the flag must be reachable from Pip
    const seen = new Set([`${px},${py}`]), queue = [[px, py]], open = [];
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (g[ny]?.[nx] === "." && !seen.has(`${nx},${ny}`)) {
          seen.add(`${nx},${ny}`);
          queue.push([nx, ny]);
          open.push([nx, ny]);
        }
      }
    }
    if (open.length < shells + 3) continue;
    open.sort(() => Math.random() - 0.5);
    open.slice(0, shells).forEach(([x, y]) => (g[y][x] = "S"));
    const [fx, fy] = open[shells];
    g[fy][fx] = "F";
    return { map: g.map((r) => r.join("")), dir: rand(4) };
  }
}

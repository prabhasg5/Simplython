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

export const PARTS = {
  A: "Wake Pip", B: "Beach Walk", K: "Break", C: "Crab Trouble",
  D: "Build the Hut", E: "Escape the Tide", F: "Shell Hunt",
};

const FUN = ["😀", "😂", "🎉", "⭐", "🌞", "🐚", "🤖", "🦀", "🌴", "🔋"];
const SQUARES = ["⬜", "🟨", "🟦", "🟩", "🟥", "🟫", "⬛", "🟧", "🟪"];
const BUILD = ["🪵", "🚪", "🪟", "🔺", "🌺", "⭐", "🌴", "🚩"];

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
    button: "Play Shell Hunt →",
  },

  // ───────────── F. Shell Hunt (endless practice) ─────────────
  {
    id: "hunt", part: "F", type: "endless", title: "Shell Hunt 🔁",
    text: "A new beach every time! Collect **all** the shells 🐚, then reach the flag 🏁. Each beach is a bit bigger than the last.",
    starter: ``,
    hints: ["Plan the path with your finger first", "Do one shell at a time, and press Run often to check"],
    ask: "Can you beat your best score?",
  },
];

/** Did the child pass? r = result from pipbot.run */
export function check(level, r, ctx = {}) {
  if (r.error) return false;
  if (level.check) return level.check(r, ctx);
  return r.shellsLeft === 0 && r.missing === 0 && (!r.hasFlag || r.onFlag);
}

/** Friendly reason why check() failed. */
export function whyNot(level, r) {
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

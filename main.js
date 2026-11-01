import { LEVELS, PARTS, check, whyNot, makeHuntMap } from "./levels.js";
import { cloudEnabled, initCloud, signIn, signOut, saveCloud, flushCloud } from "./cloud.js";

const $ = (s) => document.querySelector(s);
const KEY = "simplython";
const TILE = { "#": "🪨", C: "🦀", S: "🐚", W: "🪵", F: "🏁", l: "🪵", d: "🚪", o: "🪟", r: "🔺" };
const TARGET = { B: "🪵", D: "🚪", O: "🪟", R: "🔺" };
const KIND = { "#": "rock", "~": "water", l: "built", d: "built", o: "built", r: "built" };
const CHEERS = ["Great job", "Awesome", "You did it", "Brilliant", "Super coding", "Amazing"];

// ---------- saved progress (this browser, plus Firestore when signed in with Google) ----------
let P = load();
function load() {
  try { return upgrade(JSON.parse(localStorage.getItem(KEY))); }
  catch { return upgrade(); }
}
// Fills in anything older saves don't have yet (coins, shop items, what the avatar wears).
function upgrade(s) {
  s = { levels: {}, code: {}, ...s };
  s.owned ||= [];
  s.wear ||= { avatar: "🤖", hat: "", pet: "", theme: "beach" };
  if (s.coins === undefined) s.coins = Object.values(s.levels).reduce((n, r) => n + (r.stars || 0), 0) * 5; // welcome bonus for stars already won
  if (s.hat) { if (!s.owned.includes("🎩")) s.owned.push("🎩"); s.wear.hat ||= "🎩"; delete s.hat; } // the old Session 1 gift
  return s;
}
function save() {
  const json = JSON.stringify(P);
  try { localStorage.setItem(KEY, json); } catch { /* private mode: progress lasts this visit only */ }
  saveCloud(json);
}
const rec = (id) => (P.levels[id] ||= { stars: 0, time: 0 });
const done = (i) => !!P.levels[LEVELS[i]?.id]?.done;
// Shell Hunt (endless) never blocks the road: the level after it opens once the level before it is done.
const unlocked = (i) => P.unlockAll || i === 0 || done(i) || done(i - 1) || (LEVELS[i - 1]?.type === "endless" && done(i - 2));
const totalStars = () => Object.values(P.levels).reduce((n, r) => n + (r.stars || 0), 0);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fill = (s = "") => s.replaceAll("{name}", P.name || "Captain");
const md = (s) => esc(fill(s))
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>")
  .replace(/`(.+?)`/g, "<code>$1</code>").replace(/\n/g, "<br>");

// the child's avatar, with the hat and pet bought in the shop
const me = (face = P.wear.avatar) => `<span class="av"><span class="face">${face}</span>`
  + (P.wear.hat ? `<span class="hat">${P.wear.hat}</span>` : "") + (P.wear.pet ? `<span class="pet">${P.wear.pet}</span>` : "") + "</span>";

// ---------- Python runner (Pyodide in a worker, killed if it runs too long) ----------
let worker, ready = false, busy = false, pending = null;
function startWorker() {
  ready = false;
  worker = new Worker("worker.js");
  worker.onmessage = ({ data }) => {
    if (data.ready) { ready = true; return setRunButton(); }
    if (data.fatal) return msg("😴 Pip couldn't wake up. Check the internet connection and reload the page.", "bad");
    if (pending) { clearTimeout(pending.timer); pending.resolve(data); pending = null; }
  };
  setRunButton();
}
function runPython(payload) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.terminate();
      pending = null;
      startWorker();
      resolve({ actions: [], said: [], error: { msg: "Pip got dizzy! 😵‍💫 The code kept running and never stopped.", line: 0 } });
    }, 5000);
    pending = { resolve, timer };
    worker.postMessage(payload);
  });
}

// ---------- level state ----------
let cur = 0, level, map, dir, result = null, step = 0, timer = null, hintsUsed = 0, guess = null;
let W, cells = [], pipEl = null, cellSize = 48, openedAt = Date.now(), nextAfterWin = false;
let lineMark = null;

const cm = CodeMirror($("#editor"), {
  mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4,
  extraKeys: { Tab: (ed) => ed.replaceSelection("    "), "Ctrl-Enter": () => run(), "Cmd-Enter": () => run() },
});
cm.on("change", () => {
  if (!level || level.type === "predict") return;
  result = null;
  markLine(null);
  if (level.type !== "endless") { P.code[level.id] = cm.getValue(); save(); }
});

function openLevel(i) {
  if (i < 0 || i >= LEVELS.length) return;
  flushTime();
  stop();
  cur = i; level = LEVELS[i]; P.current = i; save();
  result = null; step = 0; hintsUsed = 0; guess = null;
  ({ map, dir } = level.type === "endless" ? hunt() : { map: level.map, dir: level.dir ?? 1 });
  $("#map").hidden = true;
  scrollTo(0, 0);
  const card = level.type === "card";
  $("#card").hidden = !card;
  $("#play").hidden = card;
  if (card) return showCard();

  const predict = level.type === "predict";
  $("#part-name").textContent = PARTS[level.part] + (level.debug ? " · 🐛 fix the bug" : predict ? " · 🔮 predict" : "");
  $("#title").textContent = fill(level.title);
  $("#text").innerHTML = md(level.text) + (level.type === "endless" ? huntLine() : "")
    + (level.maps ? `<br><span class="hunt">🏝️ Tested on ${level.maps.length} different beaches</span>` : "");
  $("#hint-box").innerHTML = "";
  $("#hint").hidden = $("#fresh").hidden = $("#step").hidden = predict;
  setHintButton();
  $("#editor").classList.toggle("readonly", predict);
  cm.setOption("readOnly", predict ? "nocursor" : false);
  cm.setValue(predict ? level.starter : P.code[level.id] ?? fill(level.starter));
  cm.clearHistory();
  cm.refresh();
  renderPalette();
  resetWorld();
  setRunButton();
  msg(predict ? "👆 Read the code, then tap the square where you think Pip will stop." : "");
}

// ---------- the world on screen ----------
function resetWorld() {
  stop();
  step = 0;
  W = { rows: (map || []).map((r) => [...r]), x: 0, y: 0, d: dir, rot: dir * 90, placed: {}, said: [] };
  W.rows.forEach((r, y) => r.forEach((c, x) => { if (c === "P") { W.x = x; W.y = y; r[x] = "."; } }));
  markLine(null);
  $("#bubble").className = "quiet";
  renderStage();
}

function renderStage() {
  const st = $("#stage");
  st.innerHTML = "";
  st.style = "";
  if (!map) return renderTalk(st);
  const cols = Math.max(...W.rows.map((r) => r.length));
  cellSize = Math.max(28, Math.min(64, Math.floor(($("#stage-wrap").clientWidth - 24) / cols)));
  st.className = "grid" + (level.type === "predict" ? " predict" : "");
  st.style.setProperty("--cell", cellSize + "px");
  st.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
  cells = W.rows.map((r, y) => r.map((_, x) => {
    const el = document.createElement("div");
    el.onclick = () => pickGuess(x, y);
    st.append(el);
    return el;
  }));
  W.rows.forEach((r, y) => r.forEach((_, x) => paint(x, y)));
  pipEl = document.createElement("div");
  pipEl.className = "pip";
  pipEl.innerHTML = `<div class="arrow"></div>${me()}`;
  st.append(pipEl);
  placePip();
}

function renderTalk(st) {
  pipEl = null;
  st.className = "talk";
  const board = (title, text, id = "") => `<div class="board"><b>${title}</b><pre ${id && `id="${id}"`}>${esc(text)}</pre></div>`;
  st.innerHTML = `<div class="talk-pip">${me(level.sleepy ? "😴" : undefined)}</div>`
    + (level.target ? board("Copy this picture", level.target.join("\n")) : "")
    + board(level.target || level.freeArt ? "Your picture" : "What Pip said", "", "out");
}

function paint(x, y) {
  const c = W.rows[y][x], item = W.placed[`${x},${y}`];
  const el = cells[y][x];
  el.className = `cell ${KIND[c] || "sand"}` + (TARGET[c] && !item ? " ghost" : "") + (item ? " placed" : "")
    + (guess && guess.x === x && guess.y === y ? " guess" : "");
  el.textContent = item || TILE[c] || TARGET[c] || "";
}

function placePip() {
  pipEl.style.transform = `translate(${W.x * cellSize}px, ${W.y * cellSize}px)`;
  pipEl.style.setProperty("--rot", W.rot + "deg");
}

function say(text, bad = false) {
  const b = $("#bubble");
  b.className = bad ? "bad" : "";
  b.textContent = text;
  b.style.animation = "none";
  void b.offsetWidth; // restart the pop animation
  b.style.animation = "";
}

function face(f) {
  const el = $("#stage .face");
  if (el) el.textContent = f;
}

function apply(a) {
  markLine(a.line);
  if (a.t === "move") { W.x = a.x; W.y = a.y; placePip(); }
  else if (a.t === "turn") { W.rot += (a.d - W.d + 4) % 4 === 1 ? 90 : -90; W.d = a.d; placePip(); }
  else if (a.t === "collect") {
    W.rows[a.y][a.x] = ".";
    paint(a.x, a.y);
    cells[a.y][a.x].classList.add("sparkle");
  }
  else if (a.t === "place") { W.placed[`${a.x},${a.y}`] = a.item; paint(a.x, a.y); }
  else if (a.t === "say") {
    W.said.push(a.text);
    say(a.text);
    if (!map) { face(P.wear.avatar); $("#out").textContent = W.said.join("\n"); }
  }
  else if (a.t === "bump" && pipEl) {
    pipEl.classList.remove("bump");
    void pipEl.offsetWidth;
    pipEl.classList.add("bump");
    sfx("bump");
  }
}

function markLine(line, cls = "running") {
  if (lineMark) cm.removeLineClass(lineMark.h, "background", lineMark.cls);
  lineMark = null;
  if (line > 0 && line <= cm.lineCount()) {
    lineMark = { h: cm.addLineClass(line - 1, "background", cls), cls };
    if (cls === "error-line") cm.scrollIntoView({ line: line - 1, ch: 0 }, 40);
  }
}

// ---------- running ----------
const delay = () => 900 - $("#speed").value * 8.2;
function stop() { clearTimeout(timer); timer = null; }

async function run(stepMode = false) {
  if (!ready || busy || !level || level.type === "card") return;
  if (level.type === "predict" && !guess) return msg("👆 First tap the square where you think Pip will stop!", "info");
  resetWorld();
  msg("");
  busy = true; setRunButton();
  // Levels with several beaches run the code on each one, then show the first beach it fails on (or the last).
  const maps = level.maps || [map], results = [];
  for (const m of maps) {
    results.push(await runPython({ code: cm.getValue(), map: m, dir, wood: level.wood, ban: level.ban }));
    if (results.at(-1).error?.line === 0 && !results.at(-1).actions.length) break; // timed out: no point trying the rest
  }
  const pass = (r) => !r.error && check(level, r, { name: P.name });
  let k = results.findIndex((r) => !pass(r));
  if (k < 0) k = results.length - 1;
  result = results[k];
  if (maps.length > 1) {
    result.beach = { k, n: maps.length, ok: results.filter(pass).length };
    if (map !== maps[k]) { map = maps[k]; resetWorld(); }
  }
  busy = false; setRunButton();
  step = 0;
  stepMode ? stepOnce() : play();
}
function play() {
  if (step < result.actions.length) { apply(result.actions[step++]); timer = setTimeout(play, delay()); }
  else { timer = null; finish(); }
}
function stepOnce() {
  if (step < result.actions.length) apply(result.actions[step++]);
  if (step >= result.actions.length) finish();
  else msg(`👣 Line ${result.actions[step - 1].line} done. Press Step again for the next one.`, "info");
}
function stepButton() {
  if (busy) return;
  if (!result || result.finished) return run(true);
  stop();
  stepOnce();
}

function finish() {
  const r = result;
  r.finished = true;
  markLine(null);
  if (level.type === "predict") {
    const right = guess.x === r.x && guess.y === r.y;
    return win(right ? 3 : 1, right ? "" : "Pip stopped somewhere else. Press Play again and watch closely!", right ? "You read the code like a pro! 🔮" : "Not that square, but good try!");
  }
  if (r.error) {
    if (r.error.line) markLine(r.error.line, "error-line");
    face("😵");
    say(r.error.msg, true);
    return msg(beachLine(r) + `🤖 ${esc(r.error.msg)}` + (r.error.line ? `<span class="where">line ${r.error.line}</span>` : ""), "bad");
  }
  if (!check(level, r, { name: P.name })) {
    face("🤔");
    return msg(beachLine(r) + `🤖 ${esc(whyNot(level, r))}`, "bad");
  }
  let stars = 3;
  const tips = [];
  if (level.par && r.lines > level.par) { stars--; tips.push(`For ⭐⭐⭐, can you do it in ${level.par} lines or fewer? You used ${r.lines}.`); }
  if (hintsUsed) { stars--; tips.push("Try again without a hint to get more stars!"); }
  if (r.beach) tips.unshift(`It worked on all ${r.beach.n} beaches! 🏝️`);
  win(Math.max(1, stars), tips.join(" "));
}
// only worth saying when the code already works on some beaches
const beachLine = (r) => r.beach?.ok ? `🏝️ Your code works on ${r.beach.ok} of the ${r.beach.n} beaches, but not on this one (beach ${r.beach.k + 1}):<br>` : "";

function win(stars, tip = "", title = "") {
  const rc = rec(level.id), first = !rc.done, before = rc.stars || 0;
  rc.done = true;
  rc.stars = Math.max(before, stars);
  if (level.saveArt) P.art = result.said;
  if (level.saveHut) P.hut = { map, placed: result.placed };
  title ||= level.win || `${CHEERS[Math.floor(Math.random() * CHEERS.length)]}, Captain ${P.name}!`;
  const endless = level.type === "endless";
  if (endless) {
    const h = P.hunt;
    h.today += result.shells;
    h.best = Math.max(h.best, h.today);
    title = `Beach #${h.round} cleared! +${result.shells} 🐚`;
    h.round++;
    delete h.map;
  }
  // 🪙 5 for a first win, 10 for every new star; Shell Hunt pays 2 per shell
  const coins = endless ? result.shells * 2 : (first ? 5 : 0) + (rc.stars - before) * 10;
  P.coins += coins;
  $("#win-coins").textContent = coins ? `+${coins} 🪙` : "";
  flushTime();
  save();
  updateHeader();
  pipEl?.classList.add("happy");
  $("#stage .talk-pip")?.classList.add("happy");
  msg("");
  $("#win-stars").textContent = endless ? "🐚".repeat(Math.min(result.shells, 8)) : "⭐".repeat(stars) + "☆".repeat(3 - stars);
  $("#win-title").textContent = title;
  $("#win-tip").textContent = tip;
  $("#win-again").hidden = endless;
  $("#win-next").textContent = endless ? "Next beach →" : "🗺️ Back to the map";
  $("#win .win-pip").innerHTML = me();
  setTimeout(() => { $("#win").showModal(); confettiBurst(); sfx("win"); }, 500);
}

function pickGuess(x, y) {
  if (level.type !== "predict" || busy || timer) return;
  const old = guess;
  guess = { x, y };
  if (old) paint(old.x, old.y);
  paint(x, y);
  run();
}

// ---------- Shell Hunt ----------
function hunt() {
  const h = (P.hunt ||= { round: 1, best: 0, today: 0 });
  const today = new Date().toDateString();
  if (h.day !== today) { h.day = today; h.today = 0; }
  if (!h.map) Object.assign(h, makeHuntMap(h.round));
  save();
  return { map: h.map, dir: h.dir };
}
const huntLine = () => `<br><span class="hunt">Beach #${P.hunt.round} · Shells today: ${P.hunt.today} 🐚 · Best day: ${P.hunt.best} 🏆</span>`;

// ---------- cards ----------
function showCard() {
  $("#card-emoji").textContent = level.emoji;
  $("#card-title").textContent = fill(level.title);
  $("#card-text").innerHTML = md(level.text);
  $("#card-btn").textContent = level.button;
  $("#card-extra").innerHTML = level.showoff ? showoffHTML() : "";
  if (level.showoff) {
    if (level.gift && !P.owned.includes(level.gift)) { P.owned.push(level.gift); P.wear.hat = level.gift; save(); updateHeader(); }
    victoryConfetti();
    sfx("win");
  }
}
function showoffHTML() {
  let h = `<div class="trophies"><div class="trophy"><b>${totalStars()} ⭐</b><span>stars</span></div>`
    + `<div class="trophy"><b>${me()}</b><span>Your gift: ${level.gift}</span></div>`
    + `<div class="trophy"><b>${P.coins} 🪙</b><span>coins</span></div></div>`;
  if (P.hut) {
    const cols = P.hut.map[0].length;
    h += `<h3>Your hut</h3><div class="mini" style="grid-template-columns:repeat(${cols},34px)">`
      + P.hut.map.flatMap((row, y) => [...row].map((c, x) =>
        `<span class="${KIND[c] || ""}">${esc(P.hut.placed[`${x},${y}`] || TILE[c] || "")}</span>`)).join("")
      + "</div>";
  }
  if (P.art) h += `<h3>Your picture</h3><pre class="art">${esc(P.art.join("\n"))}</pre>`;
  return h;
}

// ---------- header, palette, hints, messages ----------
function updateHeader() {
  $("#captain").textContent = `🧑‍✈️ Captain ${P.name}`;
  $("#star-total").textContent = `⭐ ${totalStars()}`;
  $("#coin-total").textContent = `🪙 ${P.coins}`;
}

// ---------- roadmap ----------
const ZONE_EMOJI = { A: "😴", B: "🏖️", K: "🧍", C: "🦀", D: "🛖", E: "🌊", F: "🐚", G: "🎒", H: "🔁", I: "🔀", J: "🛠️", L: "💰" };
const nextIndex = () => LEVELS.findIndex((l, i) => !done(i) && unlocked(i));
const nodeIcon = (l, i) =>
  l.showoff ? "🏆" : l.type === "card" ? "📜" : l.type === "endless" ? "🔁" : l.type === "predict" ? "🔮" : l.debug ? "🐛" : i;

function showMap() {
  flushTime();
  stop();
  level = null;
  $("#play").hidden = $("#card").hidden = true;
  $("#map").hidden = false;
  renderMap();
}

function renderMap() {
  const box = $("#map-inner"), w = box.clientWidth, next = nextIndex(), pts = [];
  box.innerHTML = "";
  let y = 40, part, focus;
  LEVELS.forEach((l, i) => {
    if (l.part !== part) {
      part = l.part;
      const zone = LEVELS.filter((x) => x.part === part), fixed = zone.filter((x) => P.levels[x.id]?.done).length;
      box.insertAdjacentHTML("beforeend", `<div class="zone part-${part}" style="top:${y}px">${ZONE_EMOJI[part]} ${PARTS[part]}`
        + ` <span>${fixed === zone.length ? "✅" : `${fixed}/${zone.length}`}</span></div>`);
      y += 90;
    }
    const x = w / 2 + Math.sin(i * 0.75) * Math.min(w * 0.28, 200);
    pts.push([x, y]);
    const r = P.levels[l.id], open = unlocked(i), b = document.createElement("button");
    b.className = `node part-${l.part}` + (r?.done ? " done" : "") + (open ? "" : " locked")
      + (i === next ? " next" : "") + (l.showoff ? " goal" : "");
    b.style.left = x + "px";
    b.style.top = y + "px";
    b.setAttribute("aria-label", `${fill(l.title)}${open ? "" : " (locked)"}`);
    const stars = r?.done && !["card", "endless"].includes(l.type) ? `<span class="stars">${"⭐".repeat(r.stars || 0)}${"☆".repeat(3 - (r.stars || 0))}</span>` : "";
    b.innerHTML = `<span class="icon">${open ? nodeIcon(l, i) : "🔒"}</span>${stars}`
      + `<span class="label ${x > w / 2 ? "left" : "right"}">${esc(fill(l.title))}</span>`;
    b.onclick = () => (open ? openLevel(i) : lockedTap(b));
    box.append(b);
    if (i === next) {
      box.insertAdjacentHTML("beforeend", `<div class="you" style="left:${x + (x > w / 2 ? 62 : -62)}px;top:${y}px">${me()}</div>`);
      focus = b;
    }
    y += l.showoff ? 130 : 96;
  });
  // laid out top-down above, then flipped so the journey climbs from the bottom up to the trophy
  const H = y - 40;
  box.style.height = H + "px";
  box.querySelectorAll("[style*='top']").forEach((el) => (el.style.top = H - parseFloat(el.style.top) + "px"));
  const line = (p) => p.map(([px, py]) => `${px},${H - py}`).join(" ");
  const walked = next < 0 ? pts : pts.slice(0, next + 1);
  box.insertAdjacentHTML("afterbegin", `<svg class="road" width="${w}" height="${H}">`
    + `<polyline class="base" points="${line(pts)}"/><polyline class="walked" points="${line(walked)}"/></svg>`);
  (focus || box.lastElementChild).scrollIntoView({ block: "center" });
}

function lockedTap(b) {
  b.classList.remove("shake");
  void b.offsetWidth;
  b.classList.add("shake");
  const n = nextIndex();
  toast(`🔒 Finish “${fill(LEVELS[n].title)}” first!`);
}

function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.hidden = true), 2200);
}

// ---------- confetti (canvas-confetti from CDN; the game works without it) ----------
let winConfetti;
function confettiBurst() {
  try { (winConfetti ||= confetti.create($("#win-fx"), { resize: true }))({ particleCount: 90, spread: 80, origin: { y: 0.6 } }); }
  catch { /* offline: no confetti */ }
}
function victoryConfetti() {
  try {
    const end = Date.now() + 4000;
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    setTimeout(() => confetti({ particleCount: 200, spread: 120, startVelocity: 45, origin: { y: 0.4 } }), 600);
  } catch { /* offline: no confetti */ }
}

function renderPalette() {
  const p = $("#palette");
  p.innerHTML = "";
  p.hidden = !level.palette;
  for (const e of level.palette || []) {
    const b = document.createElement("button");
    b.textContent = e;
    b.title = "Add " + e;
    if (e.length > 3) b.className = "code"; // a command, not an emoji
    b.onclick = () => { cm.replaceSelection(e); cm.focus(); };
    p.append(b);
  }
}

const hintList = () => [...(level.hints || []), ...(level.solution ? ["__answer"] : [])];
function setHintButton() {
  const list = hintList(), b = $("#hint");
  b.disabled = hintsUsed >= list.length;
  b.textContent = list[hintsUsed] === "__answer" ? "👀 Show me the answer" : "💡 Hint";
}
function showHint() {
  const h = hintList()[hintsUsed++];
  if (!h) return;
  $("#hint-box").insertAdjacentHTML("beforeend", h === "__answer"
    ? `<div class="hint">Here's one way to do it. Try typing it yourself!<pre>${esc(fill(level.solution))}</pre></div>`
    : `<div class="hint">💡 ${md(h)}</div>`);
  setHintButton();
}

function setRunButton() {
  const b = $("#run");
  b.disabled = !ready || busy;
  b.textContent = !ready ? "Pip is waking up… ⏳" : busy ? "Thinking… 🤔" : "▶ Run";
}

function msg(html, kind = "") {
  const m = $("#message");
  m.innerHTML = html;
  m.className = kind;
}

function speak(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(fill(text).replace(/[*`#]/g, "").replace(/_/g, " "));
    u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch { /* no speech in this browser */ }
}

// ---------- time per level (for the parent panel) ----------
function flushTime() {
  if (level && openedAt) rec(level.id).time += (Date.now() - openedAt) / 1000;
  openedAt = document.hidden ? null : Date.now();
  save();
}
document.addEventListener("visibilitychange", () => {
  flushTime();
  if (document.hidden) flushCloud();
});

// ---------- shop: avatars, hats, pets and backgrounds, bought with coins ----------
const SHOP = {
  avatar: { title: "Avatars", items: { "🤖": 0, "🧒": 30, "👧": 30, "👦": 30, "🧑‍🚀": 120, "🧙": 150, "🥷": 150, "🧜": 150, "🦸": 200, "🧚": 200,
    "🐱": 60, "🐶": 60, "🐼": 80, "🦊": 80, "🐸": 80, "🐵": 100, "🐧": 100, "🐯": 120, "🦁": 120, "🦄": 250, "🐲": 300 } },
  hat: { title: "Hats & caps", items: { "🧢": 50, "🎀": 50, "🎩": 80, "👒": 80, "⛑️": 100, "🎓": 120, "🤠": 150, "👑": 400 } },
  pet: { title: "Pets", items: { "🐥": 80, "🐢": 100, "🐰": 120, "🐹": 120, "🦜": 150, "🐙": 180, "🦖": 250, "🐉": 400 } },
  theme: { title: "Backgrounds", items: { beach: 0, jungle: 150, space: 200, ocean: 200, candy: 250 } },
};
// Music is a tiny tune made with Web Audio, so there are no files to download. Notes are MIDI numbers, 0 = rest.
const THEMES = {
  beach: { icon: "🏝️", name: "Sunny beach", deco: ["☀️", "☁️", "☁️", "🌴", "🌴", "🐦", "⛵", "🐚"],
    notes: [72, 0, 76, 79, 76, 0, 74, 72, 74, 0, 76, 0, 72, 0, 67, 0], bass: [48, 53, 55, 48] },
  jungle: { icon: "🌴", name: "Jungle", deco: ["🌞", "🦜", "🌿", "🌳", "🌴", "🦋", "🐒", "🌺"],
    notes: [69, 72, 0, 69, 74, 0, 72, 69, 67, 0, 69, 72, 76, 0, 74, 0], bass: [45, 45, 50, 52] },
  space: { icon: "🚀", name: "Outer space", deco: ["🪐", "⭐", "✨", "🌙", "🚀", "🛸", "⭐", "🌍"],
    notes: [76, 0, 79, 0, 83, 0, 81, 79, 76, 0, 74, 0, 71, 0, 0, 0], bass: [40, 43, 45, 38] },
  ocean: { icon: "🐠", name: "Under the sea", deco: ["🫧", "🫧", "🐟", "🪸", "🐙", "🐠", "🐳", "🐡"],
    notes: [67, 71, 74, 0, 72, 0, 71, 69, 67, 0, 64, 67, 69, 0, 0, 0], bass: [43, 48, 45, 50] },
  candy: { icon: "🍭", name: "Candy land", deco: ["🌈", "☁️", "🍬", "🍩", "🍭", "🧁", "🍦", "🍰"],
    notes: [79, 76, 79, 84, 0, 79, 81, 0, 79, 76, 72, 0, 74, 76, 72, 0], bass: [48, 52, 53, 55] },
};

function openShop() {
  renderShop();
  $("#shop-msg").textContent = "";
  $("#shop").showModal();
}
function renderShop() {
  $("#shop-coins").textContent = `🪙 ${P.coins}`;
  $("#shop-preview").innerHTML = me();
  $("#shop-items").innerHTML = Object.entries(SHOP).map(([kind, { title, items }]) => `<h3>${title}</h3><div class="shelf">`
    + Object.entries(items).map(([id, price]) => {
      const have = !price || P.owned.includes(id), on = P.wear[kind] === id, t = THEMES[id];
      return `<button class="item${on ? " on" : ""}" data-kind="${kind}" data-id="${id}" aria-pressed="${on}">`
        + `<b>${t ? t.icon : id}</b>${t ? `<small>${t.name}</small>` : ""}<span>${on ? "✓ On" : have ? "Wear" : `🪙 ${price}`}</span></button>`;
    }).join("") + "</div>").join("");
}
$("#shop-items").onclick = (e) => {
  const b = e.target.closest(".item");
  if (!b) return;
  const { kind, id } = b.dataset, price = SHOP[kind].items[id], have = !price || P.owned.includes(id);
  if (!have) {
    if (P.coins < price) return ($("#shop-msg").textContent = `You need ${price - P.coins} more 🪙. Win levels to earn coins!`);
    P.coins -= price;
    P.owned.push(id);
    sfx("coin");
    $("#shop-msg").textContent = `New! ${THEMES[id]?.name || id} is yours 🎉`;
  }
  // tapping the hat or pet you already wear takes it off
  P.wear[kind] = have && P.wear[kind] === id && (kind === "hat" || kind === "pet") ? "" : id;
  save();
  applyTheme();
  updateHeader();
  renderShop();
};
$("#shop-btn").onclick = openShop;
$("#shop-close").onclick = () => $("#shop").close();
$("#shop").onclose = () => (level ? renderStage() : renderMap());

function applyTheme() {
  const t = THEMES[P.wear.theme] || THEMES.beach;
  if (document.body.dataset.theme === P.wear.theme) return;
  document.body.dataset.theme = P.wear.theme;
  $("#scenery").innerHTML = t.deco.map((d) => `<span>${d}</span>`).join("");
  if (musicTimer) music(true); // switch to the new background's tune
}

// ---------- music & sounds ----------
let ac, musicTimer, beat = 0, nextNote = 0;
const hz = (n) => 440 * 2 ** ((n - 69) / 12);
function tone(n, t, len, type = "triangle", vol = 0.035) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.value = hz(n);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + len);
}
function music(on) {
  clearInterval(musicTimer);
  musicTimer = null;
  $("#music").textContent = P.music === false ? "🔇" : "🎵";
  if (!on) return;
  try { (ac ||= new AudioContext()).resume(); } catch { return; } // no Web Audio: play without music
  const { notes, bass } = THEMES[P.wear.theme] || THEMES.beach;
  nextNote = ac.currentTime + 0.1;
  musicTimer = setInterval(() => {
    nextNote = Math.max(nextNote, ac.currentTime); // after the tab was in the background, don't play the missed notes
    while (nextNote < ac.currentTime + 0.3) { // schedule a little ahead so it never stutters
      const n = notes[beat % notes.length];
      if (n) tone(n, nextNote, 0.28);
      if (beat % 4 === 0) tone(bass[(beat / 4) % bass.length], nextNote, 0.9, "sine", 0.05);
      beat++;
      nextNote += 0.22;
    }
  }, 100);
}
function sfx(kind) {
  if (P.music === false || !ac) return;
  const t = ac.currentTime, play = (ns, step, type = "square") => ns.forEach((n, i) => tone(n, t + i * step, 0.25, type, 0.06));
  if (kind === "win") play([72, 76, 79, 84], 0.11);
  else if (kind === "coin") play([88, 93], 0.08);
  else if (kind === "bump") play([45, 41], 0.09, "sawtooth");
}
$("#music").onclick = () => {
  P.music = P.music === false;
  save();
  music(P.music);
};
// Browsers only allow sound after the first tap, so the music starts then.
addEventListener("pointerdown", () => { if (P.music !== false && !musicTimer) music(true); }, { once: true });
document.addEventListener("visibilitychange", () => { if (ac) document.hidden ? ac.suspend() : ac.resume(); });

// ---------- parent panel ----------
function openParent() {
  flushTime();
  $("#skip").disabled = !level;
  $("#ask").innerHTML = level?.ask ? `<b>Ask your child:</b> ${esc(fill(level.ask))}` : "";
  $("#report").innerHTML = "<tr><th>#</th><th>Part</th><th>Level</th><th>Stars</th><th>Minutes</th></tr>"
    + LEVELS.map((l, i) => {
      const r = P.levels[l.id] || {};
      return `<tr data-i="${i}" class="${i === cur ? "current" : ""}"><td>${i + 1}</td><td>${PARTS[l.part]}</td><td>${esc(fill(l.title))}</td>`
        + `<td>${r.done ? (l.type === "card" ? "✓" : "⭐".repeat(r.stars || 0) || "skipped") : ""}</td><td>${r.time ? Math.round(r.time / 60) : ""}</td></tr>`;
    }).join("");
  $("#parent").showModal();
}
$("#report").onclick = (e) => {
  const tr = e.target.closest("tr[data-i]");
  if (!tr) return;
  $("#parent").close();
  openLevel(+tr.dataset.i);
};
$("#parent-btn").onclick = openParent;
$("#parent-close").onclick = () => $("#parent").close();
$("#skip").onclick = () => { if (level) { rec(level.id).done = true; save(); } $("#parent").close(); showMap(); };
$("#unlock").onclick = () => { P.unlockAll = true; save(); if (!level) renderMap(); openParent(); };
$("#rename").onclick = () => {
  const n = prompt("New name:", P.name)?.trim().slice(0, 20);
  if (!n) return;
  P.name = n;
  save();
  updateHeader();
  $("#parent").close();
  level ? openLevel(cur) : showMap();
};
async function resetProgress() {
  if (!confirm(`Start the whole game again from the beginning? All of Captain ${P.name}'s stars, code and drawings will be deleted.`)) return;
  level = null; // so no level time gets added back
  P = upgrade({ prevName: P.name }); // asks for the name again, with the old one filled in
  save();
  await flushCloud();
  location.reload();
}
$("#wipe").onclick = resetProgress;
$("#reset-all").onclick = resetProgress;
$("#sign-out").hidden = !cloudEnabled;
$("#sign-out").onclick = async () => {
  if (!confirm("Sign out? Progress is saved to the Google account.")) return;
  await signOut();
  try { localStorage.removeItem(KEY); } catch {} // the next child on this device starts clean
  location.reload();
};

// ---------- wiring ----------
$("#run").onclick = () => run();
$("#step").onclick = stepButton;
$("#reset").onclick = () => { resetWorld(); msg(""); };
$("#hint").onclick = showHint;
$("#fresh").onclick = () => {
  if (!confirm("Start this level over? Your code for this level will be cleared.")) return;
  cm.setValue(fill(level.starter));
  resetWorld();
  msg("");
};
$("#speak").onclick = () => speak(`${level.title}. ${level.text}`);
$("#card-speak").onclick = () => speak(`${level.title}. ${level.text}`);
$("#card-btn").onclick = () => { rec(level.id).done = true; save(); showMap(); };
$("#map-btn").onclick = showMap;
$("#win-next").onclick = () => { nextAfterWin = true; $("#win").close(); };
$("#win-again").onclick = () => { $("#win").close(); resetWorld(); };
$("#win").onclose = () => {
  if (level.type === "endless") openLevel(cur);
  else if (nextAfterWin) showMap();
  nextAfterWin = false;
};
window.addEventListener("resize", () => {
  if (!$("#map").hidden) renderMap();
  else if (map && !timer && !$("#play").hidden) renderStage();
});

$("#name-form").onsubmit = (e) => {
  e.preventDefault();
  P.name = $("#name-input").value.trim().slice(0, 20);
  if (!P.name) return;
  save();
  start();
};

function start() {
  $("#google").hidden = true;
  if (!P.name) {
    $("#welcome").hidden = false;
    $("#game").hidden = true;
    $("#name-form").hidden = false;
    $("#welcome-msg").textContent = "What's your name, Captain?";
    $("#name-input").value ||= P.prevName || "";
    $("#name-input").focus();
    return;
  }
  $("#welcome").hidden = true;
  $("#game").hidden = false;
  applyTheme();
  updateHeader();
  showMap();
}

// Without a Firebase config the game runs locally; with one, the child signs in with Google first.
async function boot() {
  startWorker();
  applyTheme();
  music(false);
  if (!cloudEnabled) return start();
  $("#name-form").hidden = true;
  $("#welcome-msg").textContent = "Loading…";
  try {
    await initCloud((u) => {
      if (!u) {
        $("#welcome").hidden = false;
        $("#game").hidden = true;
        $("#google").hidden = false;
        $("#welcome-msg").textContent = "Sign in so your progress is saved on any computer.";
        return;
      }
      // Saved progress in the account wins; on the first sign-in, this device's progress is uploaded.
      if (u.data) P = upgrade(JSON.parse(u.data));
      if (!P.name) $("#name-input").value = P.prevName || u.name.split(" ")[0].slice(0, 20);
      save();
      P.name ? welcomeBack() : start();
    });
  } catch (e) {
    console.warn("Sign-in unavailable, playing without cloud save", e);
    start();
  }
}
function welcomeBack() {
  $("#welcome").hidden = false;
  $("#game").hidden = true;
  $("#google").hidden = $("#name-form").hidden = true;
  $("#continue").hidden = false;
  $("#welcome-msg").innerHTML = `<b class="welcome-back">Welcome back, Captain ${esc(P.name)}! 👋</b><br>`
    + `You have ⭐ ${totalStars()} stars. Pip missed you!`;
  $("#continue").focus();
}
$("#continue").onclick = () => { $("#continue").hidden = true; start(); };

$("#google").onclick = async () => {
  try { await signIn(); }
  catch (e) { $("#welcome-msg").textContent = "Sign-in didn't work. Please try again. 🙏"; console.warn(e); }
};

boot();

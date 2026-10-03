// Runs every level's solution (and every debug level's broken starter) through pipbot.py.
// Usage: node test.mjs
import { execFileSync } from "node:child_process";
import { LEVELS, check, makeHuntMap } from "./levels.js";

const ctx = { name: "Sam" };
const fill = (s) => s.replaceAll("{name}", ctx.name);
const cases = [];
for (const l of LEVELS) {
  if (l.type === "card" || l.type === "endless") continue;
  const base = { map: l.map, dir: l.dir ?? 1, wood: l.wood };
  if (l.type === "predict") cases.push({ l, kind: "predict code", want: "no error", p: { ...base, code: l.starter } });
  else cases.push({ l, kind: "solution", want: true, p: { ...base, code: fill(l.solution) } });
  if (l.debug) cases.push({ l, kind: "broken starter", want: false, p: { ...base, code: l.starter } });
  if (l.par && l.solution) {
    const n = l.solution.split("\n").filter((s) => s.trim()).length;
    if (n > l.par) console.log(`✗ ${l.id}: solution has ${n} lines but par is ${l.par}`), (process.exitCode = 1);
  }
}
// Shell Hunt: rounds 1-30 must produce maps with shells and a flag
for (let round = 1; round <= 30; round++) {
  const { map } = makeHuntMap(round);
  if (!map.join("").includes("S") || !map.join("").includes("F")) console.log(`✗ hunt round ${round}`), (process.exitCode = 1);
}

const results = JSON.parse(execFileSync("python3", ["pipbot.py"], { input: JSON.stringify(cases.map((c) => c.p)) }));
cases.forEach((c, i) => {
  const r = results[i];
  const ok = c.want === "no error" ? !r.error : check(c.l, r, ctx) === c.want;
  if (!ok) {
    process.exitCode = 1;
    console.log(`✗ ${c.l.id} ${c.kind}: error=${JSON.stringify(r.error)} at (${r.x},${r.y}) shellsLeft=${r.shellsLeft} missing=${r.missing} said=${JSON.stringify(r.said)}`);
  }
});

// Friendly error messages
const errs = [
  ["mvoe()", /Did you mean move/], ["move", /forgot the brackets/], ['print("hi)', /quote/],
  ["move(", /never closed/], ["print(Hello)", /put it in quotes/], ["move(3)", /doesn't need anything/],
  ["  move()", /spaces at the start/], ["while True: pass", null],
];
const er = JSON.parse(execFileSync("python3", ["pipbot.py"], {
  input: JSON.stringify(errs.slice(0, -1).map(([code]) => ({ code, map: ["P.F"] }))),
}));
er.forEach((r, i) => {
  if (!errs[i][1].test(r.error?.msg ?? "")) console.log(`✗ error for ${errs[i][0]}: ${r.error?.msg}`), (process.exitCode = 1);
});

console.log(process.exitCode ? "FAILED" : `✓ ${cases.length} level checks + ${errs.length - 1} error messages passed`);

"""Pip's world: runs the child's code and records everything Pip does.

Used by worker.js (inside Pyodide in the browser) and by test.mjs (plain python3).
"""
import ast
import difflib
import json
import re
import sys

DIRS = [(0, -1), (1, 0), (0, 1), (-1, 0)]  # up, right, down, left
SENSORS = ["front_is_clear", "on_shell", "at_flag"]
COMMANDS = ["print", "move", "turn_left", "turn_right", "collect", "place"] + SENSORS
ITEMS = ["🪵", "🚪", "🪟", "🔺", "🌺", "⭐", "🌴", "🚩"]
TARGETS = {"B": "🪵", "D": "🚪", "O": "🪟", "R": "🔺"}  # see-through squares to build on
BLOCKED = {
    "#": "Ouch! Pip bumped into a rock 🪨",
    "~": "Splash! Pip can't swim 🌊",
    "C": "Ouch! A crab pinched Pip 🦀",
}
MAX_ACTIONS = 500
MAX_LOOKS = 3000


class Stop(Exception):
    """Pip can't continue (bumped, nothing to collect...). args = (message, line)."""


def _code_line():
    f = sys._getframe()
    while f and f.f_code.co_filename != "<pip>":
        f = f.f_back
    return f.f_lineno if f else 0


class World:
    def __init__(self, rows, d=1, wood=None):
        self.rows = [list(r) for r in rows]
        self.x = self.y = 0
        for y, r in enumerate(self.rows):
            for x, c in enumerate(r):
                if c == "P":
                    self.x, self.y = x, y
                    r[x] = "."
        self.d, self.wood = d, wood
        self.placed, self.actions, self.said, self.shells, self.looks = {}, [], [], 0, 0

    def _stop(self, msg):
        raise Stop(msg, _code_line())

    def _act(self, t, **kw):
        kw.update(t=t, line=_code_line())
        self.actions.append(kw)
        if len(self.actions) > MAX_ACTIONS:
            self._stop("Pip is tired! That's way too many steps 😴")

    def ahead(self):
        dx, dy = DIRS[self.d]
        nx, ny = self.x + dx, self.y + dy
        inside = 0 <= ny < len(self.rows) and 0 <= nx < len(self.rows[ny])
        return nx, ny, inside, self.rows[ny][nx] if inside else None

    def look(self, what):
        """Sensors for if/while. They don't move Pip, so they get their own limit for loops that never stop."""
        self.looks += 1
        if self.looks > MAX_LOOKS:
            self._stop("Pip got dizzy looking around! 😵‍💫 Does your loop ever stop?")
        if what == "front":
            _, _, inside, tile = self.ahead()
            return inside and tile not in BLOCKED
        here = self.rows[self.y][self.x] if self.rows else None
        return here == what

    def move(self):
        nx, ny, inside, tile = self.ahead()
        if not inside or tile in BLOCKED:
            self._act("bump")
            self._stop(BLOCKED[tile] if inside else "Whoa! That's the edge of the beach 🏝️")
        self.x, self.y = nx, ny
        self._act("move", x=nx, y=ny)

    def turn(self, by):
        self.d = (self.d + by) % 4
        self._act("turn", d=self.d)

    def collect(self):
        tile = self.rows[self.y][self.x] if self.rows else None
        if tile == "S":
            self.shells += 1
        elif tile == "W":
            self.wood = (self.wood or 0) + 1
        else:
            self._act("bump")
            self._stop("There's nothing to pick up here 🤔")
        self.rows[self.y][self.x] = "."
        self._act("collect", x=self.x, y=self.y)

    def place(self, item):
        if item not in ITEMS:
            self._stop(f"Pip doesn't have {item!r}. Use one of the buttons above the code: {' '.join(ITEMS)}")
        if item == "🪵" and self.wood is not None:
            if self.wood == 0:
                self._stop("Out of wood! Collect more 🪵 first")
            self.wood -= 1
        self.placed[(self.x, self.y)] = item
        self._act("place", x=self.x, y=self.y, item=item)

    def say(self, *args, sep=" ", end="\n"):
        text = sep.join(str(a) for a in args)
        self.said.append(text)
        self._act("say", text=text)

    def summary(self):
        cells = [(x, y, c) for y, r in enumerate(self.rows) for x, c in enumerate(r)]
        return {
            "x": self.x, "y": self.y, "d": self.d,
            "said": self.said, "shells": self.shells,
            "shellsLeft": sum(c == "S" for _, _, c in cells),
            "woodLeft": sum(c == "W" for _, _, c in cells),
            "missing": sum(c in TARGETS and self.placed.get((x, y)) != TARGETS[c] for x, y, c in cells),
            "hasFlag": any(c == "F" for _, _, c in cells),
            "onFlag": bool(self.rows) and self.rows[self.y][self.x] == "F",
            "placed": {f"{x},{y}": v for (x, y), v in self.placed.items()},
            "actions": self.actions,
        }


def make_env(w, ban=()):
    # Plain functions (not bound methods) so error messages say "move()" and not "World.move()".
    def move(): w.move()
    def turn_left(): w.turn(3)
    def turn_right(): w.turn(1)
    def collect(): w.collect()
    def place(item="🪵"): w.place(item)
    def front_is_clear(): return w.look("front")
    def on_shell(): return w.look("S")
    def at_flag(): return w.look("F")
    env = {"__name__": "__main__", "print": w.say, "move": move, "turn_left": turn_left,
           "turn_right": turn_right, "collect": collect, "place": place,
           "front_is_clear": front_is_clear, "on_shell": on_shell, "at_flag": at_flag}
    for name in ban:  # some levels take a command away, e.g. "make your own turn_right"
        env.pop(name, None)
    return env


def used(tree):
    """Which Python ideas the code uses, so a level can ask for a loop, an if, a function..."""
    u = set()
    kinds = {ast.For: "for", ast.While: "while", ast.FunctionDef: "def", ast.Return: "return",
             ast.JoinedStr: "fstring", ast.AugAssign: "+=", ast.Assign: "var"}
    for n in ast.walk(tree):
        for k, name in kinds.items():
            if isinstance(n, k):
                u.add(name)
        if isinstance(n, ast.If):
            u.add("if")
            if n.orelse:
                u.add("elif" if len(n.orelse) == 1 and isinstance(n.orelse[0], ast.If) else "else")
        if isinstance(n, ast.BoolOp):
            u.add("and" if isinstance(n.op, ast.And) else "or")
    return sorted(u)


def boxes(env, base):
    """The child's variables (simple values only), for levels that check them."""
    out = {}
    for k, v in env.items():
        if k in base or k.startswith("__") or callable(v):
            continue
        try:
            json.dumps(v)
            out[k] = v
        except (TypeError, ValueError):
            pass
    return out


SYNTAX_RULES = [
    (("unterminated string", "eol while scanning"),
     'You opened a quote " but didn\'t close it. Words need a " at the start AND the end.'),
    (("never closed", "unexpected eof"), "A bracket ( was opened but never closed. Add a ) at the end."),
    (("unmatched",), "There's an extra bracket ) here."),
    (("unexpected indent",), "This line has spaces at the start. Move it all the way to the left."),
    (("expected an indented block",), "The lines inside need to be pushed in with the Tab key ➡️"),
    (("maybe you meant '=='",), "To compare two things, use == (two equals signs). One = puts a value in a box."),
    (("expected ':'",), "Don't forget the : at the end of this line."),
    (("invalid character",), 'There\'s a strange character here. Use plain quotes " " and brackets ( ).'),
    (("forgot a comma",), 'Pip can\'t read this. Did you forget quotes " " around words?'),
]


def friendly_syntax(e):
    msg = (e.msg or "").lower()
    for keys, text in SYNTAX_RULES:
        if any(k in msg for k in keys):
            return text
    return 'Pip can\'t read this line. Check the spelling, the quotes " " and the brackets ( ).'


def friendly_error(e, names):
    text = str(e)
    if isinstance(e, NameError):
        m = re.search(r"'(.+?)'", text)
        name = getattr(e, "name", None) or (m and m.group(1)) or "?"
        close = difflib.get_close_matches(name, COMMANDS + names, 1, 0.6)
        if close:
            return f"Pip doesn't know the word “{name}”. Did you mean {close[0]}?"
        return (f"Pip doesn't know the word “{name}”. To make Pip say it, put it in quotes: print(\"{name}\"). "
                f"If it's a box (a variable), put something in it first: {name} = ...")
    m = re.search(r"(\w+)\(\) takes 0 positional arguments", text)
    if isinstance(e, TypeError) and m:
        return f"{m.group(1)}() doesn't need anything inside its brackets. Just write {m.group(1)}()"
    m = re.search(r"(\w+)\(\) missing \d+ required positional argument", text)
    if isinstance(e, TypeError) and m:
        return f"{m.group(1)}() needs something inside its brackets, like {m.group(1)}(3)"
    if isinstance(e, TypeError) and ("concatenate" in text or "unsupported operand" in text):
        return "You can't glue words and numbers together with +. Try str(number), commas in print, or an f-string: f\"I have {x} shells\""
    if isinstance(e, ZeroDivisionError):
        return "You can't divide by zero! Not even Pip can 🤯"
    return f"Something went wrong: {type(e).__name__}: {text}"


def error_line(e):
    line, tb = 0, e.__traceback__
    while tb:
        if tb.tb_frame.f_code.co_filename == "<pip>":
            line = tb.tb_lineno
        tb = tb.tb_next
    return line


def forgot_brackets(tree):
    """`move` or `if at_flag:` without () does nothing (or is always true), so catch it."""
    called = {id(n.func) for n in ast.walk(tree) if isinstance(n, ast.Call)}
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and node.id in COMMANDS and id(node) not in called:
            return node.id, node.lineno
    return None


def run(code, rows=(), d=1, wood=None, ban=()):
    w = World(rows, d, wood)
    env = make_env(w, ban)
    base = set(env)
    err, tree = None, None
    try:
        tree = ast.parse(code, "<pip>")
        bare = forgot_brackets(tree)
        if bare:
            err = {"msg": f"You wrote {bare[0]} but forgot the brackets. Try {bare[0]}()", "line": bare[1]}
        else:
            exec(compile(tree, "<pip>", "exec"), env)
    except Stop as e:
        err = {"msg": e.args[0], "line": e.args[1]}
    except SyntaxError as e:
        err = {"msg": friendly_syntax(e), "line": e.lineno or 0}
    except Exception as e:  # anything the child's code can raise
        err = {"msg": friendly_error(e, [k for k in env if not k.startswith("__")]), "line": error_line(e)}
    out = w.summary()
    out["error"] = err
    out["used"] = used(tree) if tree else []
    out["vars"] = boxes(env, base)
    out["lines"] = sum(1 for l in code.splitlines() if l.strip() and not l.strip().startswith("#"))
    return out


def run_json(payload):
    a = json.loads(payload)
    return json.dumps(run(a["code"], a.get("map") or [], a.get("dir", 1), a.get("wood"), a.get("ban") or ()), ensure_ascii=False)


if __name__ == "__main__" and sys.platform != "emscripten":  # used by test.mjs, never in the browser: JSON list of payloads on stdin -> JSON list of results
    print(json.dumps([json.loads(run_json(json.dumps(p))) for p in json.load(sys.stdin)], ensure_ascii=False))

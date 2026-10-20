#!/usr/bin/env python3
"""Independent readiness assessment of one game by two reviewer models
(Claude Opus 5.5 + Codex Astra). Used ONLY for scoring, never for building.
Usage: assess.py <slug>   -> writes games/<slug>/assessment.json"""
import json, re, subprocess, sys, pathlib, datetime, tempfile, concurrent.futures as cf

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATS = {"gameplay": 20, "content_difficulty": 15, "art": 15, "audio": 8, "ux_onboarding": 10,
        "mobile": 10, "stability": 12, "store": 10}

PROMPT = """You are a strict, independent mobile-game publishing reviewer. Assess the game in {dir}.
Read the code, assets (look at PNGs), GAME.md, ASSET_PROMPTS.md, and run its tests (e.g. `node test.js`) if present.
Do NOT modify any file. Do NOT trust self-reported scores in game.json or GAME.md — judge the actual code and assets.

Score each category 0-100 for readiness to ship on the App Store / Google Play TODAY:
- gameplay: core loop feel, controls, fun, game feel/juice
- content_difficulty: amount of content, level design, difficulty curve that gets genuinely challenging
- art: real, coherent, professional art (runtime-drawn shapes / programmer art scores <= 25)
- audio: music + SFX quality
- ux_onboarding: menus, tutorial, clarity, settings
- mobile: touch controls, responsive layout, performance, Capacitor packaging readiness
- stability: bugs, edge cases, tests, saves
- store: icon, screenshots, monetization integration (stubs score low), privacy/analytics, store listing readiness

Calibration: 90+ = could be featured by Apple today. 70 = shippable but unpolished. 40 = solid prototype.
20 = rough prototype. Be harsh; most indie prototypes are 15-40.

Also estimate market_potential 0-100 (commercial potential if fully polished, given genre saturation).

Reply with ONLY one JSON object, no markdown:
{{"scores":{{"gameplay":0,"content_difficulty":0,"art":0,"audio":0,"ux_onboarding":0,"mobile":0,"stability":0,"store":0}},
"market_potential":0,"market_notes":"1-2 sentences","summary":"2-3 sentences overall verdict",
"blockers":["top 5 concrete things blocking release, most important first"]}}"""

SCHEMA = {"type": "object", "required": ["scores", "market_potential", "market_notes", "summary", "blockers"],
          "properties": {"scores": {"type": "object", "required": list(CATS),
                                    "properties": {k: {"type": "integer"} for k in CATS}},
                         "market_potential": {"type": "integer"}, "market_notes": {"type": "string"},
                         "summary": {"type": "string"}, "blockers": {"type": "array", "items": {"type": "string"}}}}

def parse(text):
    m = re.search(r"\{.*\}", text or "", re.S)
    if not m: raise ValueError("no JSON in reply")
    d = json.loads(m.group(0))
    d["scores"] = {k: max(0, min(100, int(d["scores"].get(k, 0)))) for k in CATS}
    d["readiness"] = round(sum(d["scores"][k] * w for k, w in CATS.items()) / sum(CATS.values()))
    return d

def opus(gdir):
    r = subprocess.run(["claude", "-p", PROMPT.format(dir=gdir), "--model", "claude-opus-5-5",
                        "--effort", "high", "--dangerously-skip-permissions",
                        "--disallowedTools", "Edit", "Write", "NotebookEdit", "--output-format", "json",
                        "--json-schema", json.dumps(SCHEMA)],
                       capture_output=True, text=True, timeout=1800, cwd=gdir)
    out = json.loads(r.stdout) if r.stdout.strip().startswith("{") else {}
    if out.get("is_error") or r.returncode: raise RuntimeError((out.get("result") or r.stderr or r.stdout)[-300:])
    if out.get("structured_output"): return parse(json.dumps(out["structured_output"]))
    return parse(out.get("result", ""))

def astra(gdir):
    with tempfile.NamedTemporaryFile(suffix=".txt") as f:
        r = subprocess.run(["codex", "exec", "-m", "gpt-6-astra", "-c", "model_reasoning_effort=high",
                            "-s", "read-only", "--skip-git-repo-check", "--ephemeral", "-C", str(gdir),
                            "-o", f.name, PROMPT.format(dir=gdir)],
                           capture_output=True, text=True, timeout=1800)
        txt = pathlib.Path(f.name).read_text()
    if r.returncode and not txt: raise RuntimeError((r.stderr or r.stdout)[-300:])
    return parse(txt)

STALE_SESSIONS, STALE_HOURS = 5, 6

def is_stale(gdir):
    a = gdir / "assessment.json"
    if not a.exists(): return True
    a = json.loads(a.read_text())
    sess = json.loads((gdir / "game.json").read_text()).get("sessions", 0)
    age = (datetime.datetime.now() - datetime.datetime.fromisoformat(a["date"])).total_seconds() / 3600
    return sess - a.get("sessions_at_assessment", 0) >= STALE_SESSIONS or (age >= STALE_HOURS and sess > a.get("sessions_at_assessment", 0))

def main(slug, if_stale=False):
    gdir = ROOT / "games" / slug
    if not (gdir / "game.json").exists(): sys.exit(f"no game {slug}")
    if if_stale and not is_stale(gdir): return 0
    lock = gdir / ".assessing"; lock.touch()
    try:
        with cf.ThreadPoolExecutor(2) as ex:
            futs = {"opus": ex.submit(opus, gdir), "astra": ex.submit(astra, gdir)}
        res, errors = {}, {}
        for k, f in futs.items():
            try: res[k] = f.result()
            except Exception as e: errors[k] = str(e)[-300:]
    finally: lock.unlink(missing_ok=True)
    if not res:
        print("assessment failed:", errors); return 1
    avg = lambda key: round(sum(r[key] for r in res.values()) / len(res))
    out = {"date": datetime.datetime.now().isoformat(timespec="minutes"),
           "readiness": avg("readiness"), "market_potential": avg("market_potential"),
           "scores": {k: round(sum(r["scores"][k] for r in res.values()) / len(res)) for k in CATS},
           "weights": CATS, "assessors": res, "errors": errors,
           "sessions_at_assessment": json.loads((gdir / "game.json").read_text()).get("sessions", 0)}
    (gdir / "assessment.json").write_text(json.dumps(out, indent=1))
    print(f"{slug}: readiness {out['readiness']} market {out['market_potential']} ({', '.join(res)})")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--if-stale"]
    sys.exit(main(args[0], "--if-stale" in sys.argv))

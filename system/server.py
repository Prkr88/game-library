#!/usr/bin/env python3
"""Live dashboard server: system/game status API + pause/resume/run controls.
Serves the project root, so games are playable at /games/<slug>/."""
import json, os, re, subprocess, time, pathlib, http.server, socketserver

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCK, PAUSED = ROOT / "system/.lock", ROOT / "system/PAUSED"
PORT = int(os.environ.get("GAMELIB_PORT", 8765))

def pid_alive(pid):
    try: os.kill(pid, 0); return True
    except Exception: return False

def system_status():
    running, pid, elapsed, agent = False, None, None, None
    if LOCK.exists():
        try:
            pid = int(LOCK.read_text().strip()); running = pid_alive(pid)
            if running: elapsed = int(time.time() - LOCK.stat().st_mtime)
        except ValueError: pass
    if running:
        ps = subprocess.run(["ps", "-axo", "command"], capture_output=True, text=True).stdout
        agent = "codex" if "codex exec" in ps else "claude" if "claude --dangerously" in ps else None
    logs = sorted((ROOT / "logs").glob("2*-*.log"), key=lambda p: p.stat().st_mtime)
    last = logs[-1] if logs else None
    state = (ROOT / "STATE.md").read_text() if (ROOT / "STATE.md").exists() else ""
    task = re.search(r"## Current task\n(.*?)\n## ", state, re.S)
    sessions = re.findall(r"^- \d{4}-.*$", state.split("## Session log")[-1], re.M)
    return {"running": running, "pid": pid, "elapsed_s": elapsed, "agent": agent,
            "paused": PAUSED.exists(), "now": int(time.time()),
            "last_log": last.name if last else None,
            "last_log_time": int(last.stat().st_mtime) if last else None,
            "last_log_tail": last.read_text(errors="replace")[-3000:] if last else "",
            "current_task": task.group(1).strip() if task else "", "sessions": sessions[-15:][::-1],
            "total_sessions": len(sessions)}

def asset_names(md):
    """Expand filenames from ASSET_PROMPTS.md table rows: `a-1..4.png`, `a.png / b.png`."""
    names = []
    for cell in re.findall(r"^\| `([^`]+)`", md, re.M):
        for part in re.split(r"\s*/\s*", cell):
            m = re.match(r"(.*?)(\d+)\.\.(\d+)(\.png)$", part.strip())
            if m: names += [f"{m[1]}{i}{m[4]}" for i in range(int(m[2]), int(m[3]) + 1)]
            elif part.strip().endswith(".png"): names.append(part.strip())
    return names

def games():
    out = []
    for f in sorted(ROOT.glob("games/*/game.json")):
        d = f.parent
        try: g = json.loads(f.read_text())
        except Exception as e: g = {"name": d.name, "description": f"bad game.json: {e}"}
        g["_dir"] = d.name
        g["self_readiness"] = g.get("readiness")
        a = d / "assessment.json"
        g["assessment"] = json.loads(a.read_text()) if a.exists() else None
        if g["assessment"]:
            g["readiness"] = g["assessment"]["readiness"]; g["market_potential"] = g["assessment"]["market_potential"]
        g["assessing"] = (d / ".assessing").exists()
        p = d / "ASSET_PROMPTS.md"
        names = asset_names(p.read_text()) if p.exists() else []
        g["assets_total"] = len(names)
        g["assets_owner"] = sum((d / "assets" / n).exists() for n in names)
        g["missing_assets"] = [n for n in names if not (d / "assets" / n).exists()][:12]
        g["changelog"] = (g.get("changelog") or [])[-4:][::-1]
        g["levels"] = g.get("levels") or None
        g.pop("next_steps_full", None)
        out.append(g)
    return sorted(out, key=lambda g: -((g.get("market_potential") or 0) * (100 - (g.get("readiness") or 0))))

def events():
    f = ROOT / "logs/events.log"
    lines = f.read_text().splitlines() if f.exists() else []
    today = time.strftime("%Y-%m-%d")
    t = [l for l in lines if l.startswith(today)]
    return {"recent": lines[-25:][::-1],
            "today": {"claude": sum("claude session" in l and "ended" in l for l in t),
                      "codex": sum("codex session" in l and "ended" in l for l in t),
                      "limits": sum("exhausted" in l for l in t)}}

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def log_message(self, *a): pass
    def send_json(self, obj, code=200):
        b = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(302); self.send_header("Location", "/dashboard/"); self.end_headers()
        elif self.path == "/api/status":
            self.send_json({"system": system_status(), "games": games(), "events": events()})
        else: super().do_GET()
    def do_POST(self):
        if self.path == "/api/pause": PAUSED.touch()
        elif self.path == "/api/resume": PAUSED.unlink(missing_ok=True)
        elif self.path == "/api/run":
            if PAUSED.exists(): return self.send_json({"error": "system is paused"}, 409)
            subprocess.Popen(["bash", str(ROOT / "system/run.sh")], start_new_session=True)
        elif self.path.startswith("/api/assess/"):
            slug = self.path.rsplit("/", 1)[1]
            if not re.fullmatch(r"[\w-]+", slug) or not (ROOT / "games" / slug).is_dir():
                return self.send_json({"error": "unknown game"}, 404)
            subprocess.Popen(["python3", str(ROOT / "system/assess.py"), slug], start_new_session=True,
                             stdout=open(ROOT / "logs/events.log", "a"), stderr=subprocess.STDOUT)
        elif self.path == "/api/stop":
            st = system_status()
            if st["running"]:
                subprocess.run(["pkill", "-f", "claude --dangerously-skip-permissions"])
                subprocess.run(["pkill", "-f", "codex exec .*--dangerously"])
                try: os.killpg(os.getpgid(st["pid"]), 15)
                except Exception: pass
        else: return self.send_json({"error": "not found"}, 404)
        self.send_json({"ok": True, "system": system_status()})

socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), H) as s:
    print(f"Dashboard: http://localhost:{PORT}/"); s.serve_forever()

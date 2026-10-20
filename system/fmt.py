#!/usr/bin/env python3
"""Turns claude stream-json into a live human-readable log (one line per action)."""
import json, sys
for line in sys.stdin:
    try: ev = json.loads(line)
    except ValueError: print(line, end="", flush=True); continue
    t = ev.get("type")
    if t == "assistant":
        for c in ev.get("message", {}).get("content", []):
            if c.get("type") == "text" and c["text"].strip():
                print("💬 " + c["text"].strip(), flush=True)
            elif c.get("type") == "tool_use":
                i = c.get("input", {})
                s = i.get("description") or i.get("command") or i.get("file_path") or i.get("pattern") or i.get("prompt") or ""
                print(f"▶ {c['name']}: {str(s).splitlines()[0][:160] if s else ''}", flush=True)
    elif t == "result":
        print(f"\n=== {ev.get('subtype')} (error={ev.get('is_error')}) ===\n{ev.get('result','')}", flush=True)
    elif t == "system" and ev.get("subtype") == "init":
        print(f"🚀 started (model {ev.get('model')})", flush=True)

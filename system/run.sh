#!/usr/bin/env bash
# Hourly entry point: opens a new terminal window running the agent session.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGENT="$ROOT/system/agent.sh"
[ -e "$ROOT/system/PAUSED" ] && exit 0  # paused from dashboard
if [ "$(uname)" = "Darwin" ]; then
  osascript -e "tell application \"Terminal\" to do script \"bash '$AGENT'\""
elif [ -n "$DISPLAY" ] && command -v gnome-terminal >/dev/null; then
  gnome-terminal -- bash "$AGENT"
elif [ -n "$DISPLAY" ] && command -v x-terminal-emulator >/dev/null; then
  x-terminal-emulator -e bash "$AGENT"
elif command -v tmux >/dev/null; then
  # Headless: run in a detached tmux window (attach with: tmux attach -t gamelib)
  tmux has-session -t gamelib 2>/dev/null || tmux new-session -d -s gamelib
  tmux new-window -t gamelib -n "$(date +%H%M)" "bash '$AGENT'"
else
  bash "$AGENT" >> "$ROOT/logs/headless.log" 2>&1
fi

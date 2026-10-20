#!/usr/bin/env bash
# Shows whether an agent session is running, the current task, and the latest log.
ROOT="$(cd "$(dirname "$0")" && pwd)"
LOCK="$ROOT/system/.lock"
if [ -e "$LOCK" ] && kill -0 "$(cat "$LOCK")" 2>/dev/null; then
  echo "RUNNING (pid $(cat "$LOCK"), for $(ps -p "$(cat "$LOCK")" -o etime= | xargs))"
  pgrep -fl "claude --dangerously|codex exec" | sed 's/ .*\(claude\|codex\).*/ \1/' | head -2
else
  echo "IDLE (no session running)"
fi
echo; sed -n '/## Current task/,/## Session log/p' "$ROOT/STATE.md" | sed '$d'
echo "## Last sessions"; sed -n '/## Session log/,$p' "$ROOT/STATE.md" | grep '^- ' | tail -5
LAST=$(ls -t "$ROOT"/logs/*-*.log 2>/dev/null | head -1)
[ -n "$LAST" ] && echo && echo "## Latest log: $LAST" && tail -5 "$LAST"

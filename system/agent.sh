#!/usr/bin/env bash
# One agent session: Claude first, falls back to Codex if Claude is out of tokens/fails.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# cron/launchd have a minimal PATH; add common node/nvm locations
NVM_BIN=$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | tail -1)
export PATH="$ROOT/system/.venv/bin:$NVM_BIN:$HOME/.local/bin:$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$ROOT" || exit 1
mkdir -p logs
if [ -e "$ROOT/system/PAUSED" ]; then echo "System paused (dashboard). Skipping."; exit 0; fi
LOCK="$ROOT/system/.lock"
if [ -e "$LOCK" ] && kill -0 "$(cat "$LOCK")" 2>/dev/null; then echo "Session already running"; exit 0; fi
echo $$ > "$LOCK"; trap 'rm -f "$LOCK"' EXIT

LIMIT_RE="usage limit|rate limit|limit reached|out of (credits|tokens)|credit balance|quota|hit your limit|overloaded"
paused() { [ -e "$ROOT/system/PAUSED" ]; }
# Health check of every game: real-browser smoke test + unused owner assets. Result is fed to the next session.
health() {
  { echo "Health check $(date '+%F %T')"
    for d in "$ROOT"/games/*/; do g=$(basename "$d")
      echo "$g: $(node "$ROOT/system/browser/smoke.js" "$g" 2>&1 | grep -v '^- ' | head -6 | tr '\n' ' ')"; done
    python3 "$ROOT/system/check_assets.py"; } > "$ROOT/logs/health.txt" 2>&1
}
prompt() { printf '%s\nProject root: %s\nToday is %s.\nYour agent name: %s.\n%s\n\n## Latest health check (fix any FAIL or UNUSED first!)\n%s' "$(cat system/PROMPT.md)" "$ROOT" "$(date +%F)" "$1" "$2" "$(cat "$ROOT/logs/health.txt" 2>/dev/null)"; }

event() { echo "$(date '+%F %T') $*" >> "$ROOT/logs/events.log"; }
# Independent readiness review (Opus + Astra) of the game the last session worked on
assess_current() {
  local g; g=$(sed -n 's/^[[:space:]*-]*game:[[:space:]*]*\([a-z0-9-]*\).*/\1/p' "$ROOT/STATE.md" | head -1)
  [ -n "$g" ] && [ -d "$ROOT/games/$g" ] || return 0
  echo "=== assessing $g (fable + astra) ==="
  python3 "$ROOT/system/assess.py" --if-stale "$g" 2>&1 | tail -3 | tee -a "$ROOT/logs/events.log"
}

# Run back-to-back sessions until the agent is out of tokens (or fails fast), then return.
# A session counts as exhausted if it hit a limit message, or errored within 2 minutes.
run_until_exhausted() {
  local agent=$1 n=0
  while ! paused; do
    n=$((n+1)); local LOG="$ROOT/logs/$(date +%Y%m%d-%H%M%S)-$agent.log" start=$(date +%s)
    echo "=== $agent session #$n ==="; event "$agent session #$n started"
    if [ "$agent" = claude ]; then
      claude --dangerously-skip-permissions --model sonnet --effort medium -p "$(prompt claude)" \
        --output-format stream-json --verbose 2>&1 | python3 -u system/fmt.py | tee "$LOG"
    else
      codex exec -m gpt-5.6-luna -c model_reasoning_effort=medium --dangerously-bypass-approvals-and-sandbox \
        --skip-git-repo-check -C "$ROOT" "$(prompt codex 'If STATE.md shows an IN_PROGRESS task, continue it from where it stopped.')" 2>&1 | tee "$LOG"
    fi
    local rc=${PIPESTATUS[0]}
    event "$agent session #$n ended rc=$rc ($(( $(date +%s) - start ))s)"
    health; assess_current
    if grep -qiE "$LIMIT_RE" "$LOG" || { [ "$rc" -ne 0 ] && [ $(( $(date +%s) - start )) -lt 120 ]; }; then
      event "$agent exhausted after $n session(s)"
      echo "=== $agent exhausted (rc=$rc) after $n session(s) ==="; return
    fi
    sleep 5
  done
}

health
run_until_exhausted claude
run_until_exhausted codex
echo "All tokens used (or paused). Idle until next hourly wake. Window closes in 60s."; sleep 60

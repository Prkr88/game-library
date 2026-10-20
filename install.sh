#!/usr/bin/env bash
# Installs the hourly scheduler + live dashboard (http://localhost:8765). macOS: launchd. Linux: cron.
# Prereqs: node, python3 (+python3-venv on Ubuntu), `npm i -g @anthropic-ai/claude-code @openai/codex`, then run `claude` and `codex` once to log in.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$ROOT"/system/*.sh
# Browser smoke test (headless Chrome via puppeteer-core)
( cd "$ROOT/system/browser" && npm install --silent )
if [ "$(uname)" != "Darwin" ]; then command -v google-chrome >/dev/null || command -v chromium >/dev/null || sudo apt-get install -y chromium-browser || sudo snap install chromium; fi
# Asset pipeline: Python venv with Pillow/numpy + SVG rasterizer (agents use these to make PNGs)
[ -d "$ROOT/system/.venv" ] || python3 -m venv "$ROOT/system/.venv"
"$ROOT/system/.venv/bin/pip" -q install pillow numpy
if [ "$(uname)" = "Darwin" ]; then command -v rsvg-convert >/dev/null || brew install librsvg
else command -v rsvg-convert >/dev/null || sudo apt-get install -y librsvg2-bin imagemagick; fi
mkdir -p "$ROOT/logs" "$ROOT/games" "$ROOT/dashboard"
if [ "$(uname)" = "Darwin" ]; then
  PL="$HOME/Library/LaunchAgents/com.gamelibrary.agent.plist"
  cat > "$PL" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.gamelibrary.agent</string>
<key>ProgramArguments</key><array><string>/bin/bash</string><string>$ROOT/system/run.sh</string></array>
<key>StartCalendarInterval</key><dict><key>Minute</key><integer>0</integer></dict>
<key>StandardErrorPath</key><string>$ROOT/logs/launchd.err</string>
</dict></plist>
PLIST
  launchctl unload "$PL" 2>/dev/null || true
  launchctl load "$PL"
  SPL="$HOME/Library/LaunchAgents/com.gamelibrary.dashboard.plist"
  cat > "$SPL" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.gamelibrary.dashboard</string>
<key>ProgramArguments</key><array><string>$(command -v python3)</string><string>$ROOT/system/server.py</string></array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>StandardErrorPath</key><string>$ROOT/logs/dashboard.err</string>
</dict></plist>
PLIST
  launchctl unload "$SPL" 2>/dev/null || true
  launchctl load "$SPL"
  echo "Installed launchd job. Run now: launchctl start com.gamelibrary.agent"
else
  # DISPLAY/DBUS let cron open a terminal on the desktop session if one exists; otherwise tmux is used
  ENVV="DISPLAY=${DISPLAY:-:0} DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus"
  LINE="0 * * * * $ENVV /bin/bash $ROOT/system/run.sh >> $ROOT/logs/cron.log 2>&1"
  (crontab -l 2>/dev/null | grep -v "game-library\|gamelibrary\|$ROOT/system/run.sh"; echo "$LINE") | crontab -
  # Dashboard server: started at boot and kept alive by a cron watchdog
  SRV="pgrep -f $ROOT/system/server.py >/dev/null || $ENVV nohup python3 $ROOT/system/server.py >> $ROOT/logs/dashboard.log 2>&1 &"
  (crontab -l 2>/dev/null | grep -v "server.py"; echo "@reboot $SRV"; echo "* * * * * $SRV") | crontab -
  eval "$SRV"
  echo "Installed cron job (hourly). Run now: bash $ROOT/system/run.sh"
  echo "Headless? sessions run in tmux: tmux attach -t gamelib"
fi

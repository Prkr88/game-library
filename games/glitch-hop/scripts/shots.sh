#!/bin/bash
# Capture landscape store screenshots via headless Chrome. Usage: scripts/shots.sh
set -e
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p assets/store
shot() { # name, js, [virtual-time ms]
  T=$(mktemp -d); cp -R index.html src assets "$T/"
  echo "var _fr=CanvasRenderingContext2D.prototype.fillRect;CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(String(this.fillStyle).indexOf('rgba(255,255,255')===0)return;return _fr.call(this,x,y,w,h)};setTimeout(function(){ $2 }, 400);" > "$T/src/shot.js"
  sed -i '' 's#</body>#<script src="src/shot.js"></script></body>#; s#<script src="src/register-sw.js"></script>##' "$T/index.html"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=960,540 --force-device-scale-factor=2 \
    --virtual-time-budget=${3:-9000} --screenshot="$PWD/assets/store/$1.png" "file://$T/index.html" >/dev/null 2>&1
  rm -rf "$T"
}
shot shot-menu ""
shot shot-levels "document.getElementById('play').click();"
shot shot-run "document.getElementById('play').click();setTimeout(function(){var b=document.querySelector('#grid button');if(b)b.click();},300);" 16000

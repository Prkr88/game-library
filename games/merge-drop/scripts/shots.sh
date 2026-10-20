#!/bin/bash
# Capture store screenshots via headless Chrome. Usage: scripts/shots.sh
set -e
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
T=$(mktemp -d)
shot() { # name, js-to-run
  rm -rf "$T/g"; mkdir "$T/g"; cp -R index.html src assets "$T/g/"
  cat > "$T/g/src/shot.js" <<JS
setTimeout(function(){ $2 }, 300);
JS
  echo "localStorage.setItem('mergedrop',JSON.stringify({seen:true,puzzle:{},best:0,bestTile:${3:-0},theme:${4:-0}}));" > "$T/g/src/seen.js"
  sed -i '' 's#<script src="src/ads.js">#<script src="src/seen.js"></script><script src="src/ads.js">#; s#</body>#<script src="src/shot.js"></script></body>#' "$T/g/index.html"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=500,1084 --force-device-scale-factor=2.58 \
    --virtual-time-budget=14000 --screenshot="$PWD/assets/store/$1.png" "file://$T/g/index.html" >/dev/null 2>&1
}
B_RISE='[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,16,0],[0,4,0,32,0],[2,8,4,64,8],[-1,16,8,128,4]]'
B_BLITZ='[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,8,0,0],[0,4,16,0,0],[2,32,64,8,0],[4,16,32,64,2]]'
shot shot-rise "document.getElementById('rise').click();setTimeout(function(){__merge.setBoard($B_RISE,2840)},200);"
shot shot-blitz "document.getElementById('blitz').click();setTimeout(function(){__merge.setBoard($B_BLITZ,1260)},200);"
shot shot-puzzle "document.getElementById('puzzle').click();"
shot shot-achievements "document.getElementById('achbtn').click();"
shot shot-ocean "document.getElementById('rise').click();setTimeout(function(){__merge.setBoard($B_RISE,2840)},200);" 512 2
rm -rf "$T"

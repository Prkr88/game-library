import json
d=json.load(open('/tmp/gh/levels.json'))
open('/Users/matanparker/IdeaProjects/game-library/games/glitch-hop/src/levels.js','w').write("/* generated from hand-designed maps */\n(function(r){var L="+json.dumps(d,indent=0)+";if(typeof module!=='undefined')module.exports=L;else r.GH_LEVELS=L})(this);\n")

// Copies only shippable web files into www/ so Capacitor does not bundle tests, art sources or docs.
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const out=path.join(root,'www');
const files=['index.html','game.js','style.css','manifest.json','sw.js'];
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const f of files)fs.copyFileSync(path.join(root,f),path.join(out,f));
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
console.log(`www built: ${files.length} files + assets`);

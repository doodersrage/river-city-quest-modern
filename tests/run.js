// Runs every test file and fails if any check fails.
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');let bad=0;
for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js')).sort()){const r=spawnSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8'}),out=(r.stdout||'')+(r.stderr||'');
  const pass=(out.match(/^PASS /gm)||[]).length,fail=out.split('\n').filter(l=>/^FAIL |Error/.test(l));
  if(r.status||fail.length){bad++;console.log('x '+f+'\n'+(fail.length?fail:[out.slice(-1500)]).map(l=>'   '+l).join('\n'));}else console.log('ok '+f+' ('+pass+' checks)');}
process.exit(bad?1:0);

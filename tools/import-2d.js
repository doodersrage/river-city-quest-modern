// Pulls the Richmond places, people, stories and the Belle Isle Quarry out of the 2D game
// (doodersrage/river-city-quest) and writes js/data.js for the 3D build.
// Usage: node tools/import-2d.js ../river-city-quest
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=path.resolve(process.argv[2]||'../river-city-quest');
const sb={console,Math,JSON,Object,Array,String,Number,Set,Map,Error};vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(src,'js/world.js'),'utf8')+';this.SC=SC;this.LORE=LORE;this.CHAL=CHAL;this.AST=AST;this.READX=READX;this.AREAN=AREAN;',sb);
const SLICE=Object.keys(sb.SC).filter(k=>k.startsWith('ow:')),ROOMS=Object.keys(sb.SC).filter(k=>!k.startsWith('ow:'));
const out={maps:{},rooms:{},lore:{},chal:{},names:{},readx:sb.READX,areas:sb.AREAN};
for(const id in sb.SC)if(id.startsWith('ow:'))out.names[id]=sb.SC[id].name;const used=new Set();
const pick=s=>({id:s.id,name:s.name,area:s.area,ax:s.ax,ay:s.ay,w:s.w,h:s.h,base:s.base,rows:s.g0.map(r=>r.join('')),
  npcs:(s.npcs||[]).map(n=>({who:n.who,tx:n.tx,ty:n.ty,talk:n.talk,lines:n.lines||null,chal:n.chal||null,hat:n.hat,shirt:n.shirt,wander:!!n.wander})),
  reads:s.reads,doors:(s.doors||[]).map(d=>({tx:d.tx,ty:d.ty,to:d.to,need:d.need||null})),chests:(s.chests||[]).map(c=>({id:c.id,tx:c.tx,ty:c.ty,item:c.item,appear:!!c.appear})),
  en:s.en,lamps:s.lamps||[],lm:(s.lm||[]).map(L=>({art:L.art,x:L.x,y:L.y,w:L.w,h:L.h})),items:(s.items||[]).map(i=>({id:i.id,kind:i.kind,tx:i.tx!=null?i.tx:Math.floor(i.px/16),ty:i.ty!=null?i.ty:Math.floor(i.py/16)})),
  opens:s.opens||[],spots:s.spots||[],birds:s.birds||[],murals:s.murals||[],braz:s.braz||[],readsT:s.readsT||null,statue:s.statue||null,style:s.interior?Object.assign({},sb.AST[s.style||s.area]||{}):null,entry:!!s.entry,dyn:(s.dyn||[]).map(d=>({cells:d.cells,closed:d.closed,open:d.open,solved:d.solved||null})),solveOf:s.solve||null,bossT:s.bossT||null,reward:s.reward||null,solve:s.solve||null,interior:!!s.interior});
for(const id of SLICE){out.maps[id]=pick(sb.SC[id]);Object.values(sb.SC[id].reads).forEach(r=>used.add(r));}
for(const id of ROOMS){out.rooms[id]=pick(sb.SC[id]);Object.values(sb.SC[id].reads).forEach(r=>used.add(r));}
for(const [id,t,s] of sb.LORE)out.lore[id]={t,s};
out.chal=sb.CHAL;
fs.writeFileSync(path.join(__dirname,'..','js','data.js'),'"use strict";\n/* Imported from the 2D River City Quest by tools/import-2d.js. Do not edit by hand. */\nconst RCQ='+JSON.stringify(out)+';\n');
console.log('maps',Object.keys(out.maps).length,'rooms',Object.keys(out.rooms).length,'lore',Object.keys(out.lore).length);


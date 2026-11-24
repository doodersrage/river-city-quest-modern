// Every dungeon hangs together, and a bot beats every boss with the item it's weak to.
const G=require('./harness.js'),T=G.TS;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const I=G.inp,clr=()=>{I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;I.x=I.z=0;};
const step=(o,n)=>{for(let i=0;i<(n||1);i++){clr();Object.assign(I,o||{});G.update();}clr();};
const talkThrough=()=>{for(let k=0;k<200&&G.dlg;k++){G.dlg.n=999;step({a:1});step({},2);}};
const face=(x,z)=>{G.p.yaw=Math.atan2(x-G.p.x,z-G.p.z);};
const R=G.RCQ.rooms,M=G.RCQ.maps,all=Object.assign({},M,R);

// every door goes somewhere real
let bad=[];for(const id in all)for(const k in all[id].doors||{}){const d=all[id].doors[k];if(!all[d.to||d])bad.push(id+' '+k+' -> '+(d.to||d));}
ok(!bad.length,'every door leads to a real place'+(bad.length?': '+bad.join(', '):''));

// every room of every dungeon can be reached from its front door
for(const dg of G.DUNGEONS){const rooms=Object.keys(R).filter(k=>k.split(':')[0]==dg);if(!rooms.length)continue;
  const entries=new Set();for(const id in all)if(!id.startsWith(dg+':'))for(const k in all[id].doors||{}){const d=all[id].doors[k];const to=d.to||d;if(to.startsWith(dg+':'))entries.add(to);}
  const seen=new Set(entries),q=[...entries];
  while(q.length){const id=q.shift(),d=R[id];if(!d)continue;const [x,y]=id.split(':')[1].split(',').map(Number),g=d.rows;
    const edges=[[0,-1,g[0].split('')],[0,1,g[g.length-1].split('')],[-1,0,g.map(r=>r[0])],[1,0,g.map(r=>r[r.length-1])]];
    for(const [dx,dy,cells] of edges){if(!cells.some(c=>c!='W'&&c!=' '))continue;const n=dg+':'+(x+dx)+','+(y+dy);if(R[n]&&!seen.has(n)){seen.add(n);q.push(n);}}
    for(const k in d.doors||{}){const to=d.doors[k].to||d.doors[k];if(R[to]&&!seen.has(to)){seen.add(to);q.push(to);}}}
  const miss=rooms.filter(r=>!seen.has(r));ok(entries.size&&!miss.length,dg+': all '+rooms.length+' rooms connect to the entrance'+(miss.length?' (missing '+miss.join(' ')+')':''));}

// inside each room, every way out can reach every other once its puzzle is solved
const FULL=()=>{const s=G.st;for(const k of G.ITEMORDER)s.items[k]=1;s.items.kayak=1;s.ammo.balls=30;s.ammo.powder=16;s.max=20;};
G.startGame(null);
for(const id of Object.keys(R)){FULL();G.loadScene(id,8*T,8.6*T,Math.PI);const lv=G.lv,g=lv.g,h=g.length,w=g[0].length;
  const pass=c=>c!=null&&(G.passable(c)||'LH%#zj_+1|bD'.includes(c));
  const outs=[];for(let x=0;x<w;x++){if(pass(g[0][x]))outs.push([x,0]);if(pass(g[h-1][x]))outs.push([x,h-1]);}for(let y=1;y<h-1;y++){if(pass(g[y][0]))outs.push([0,y]);if(pass(g[y][w-1]))outs.push([w-1,y]);}
  if(outs.length<2)continue;const seen=new Set([outs[0]+'']),q=[outs[0]];
  while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h||seen.has(nx+','+ny)||!pass(g[ny][nx]))continue;seen.add(nx+','+ny);q.push([nx,ny]);}}
  const lost=outs.filter(o=>!seen.has(o+''));if(lost.length)ok(false,id+': exits cut off '+JSON.stringify(lost));}
ok(true,'room exits checked in '+Object.keys(R).length+' rooms');

// the bosses
const fight=(room,type,tactic,max)=>{G.startGame(null);FULL();G.st.max=40;G.loadScene(room,8*T,9*T,Math.PI);step({},3);talkThrough();
  const b=G.enemies.find(e=>e.type==type);if(!b){ok(false,type+' is in '+room);return;}
  const f0=G.frame;let f=0;for(;f<(max||9000)&&!b.dead;f++){G.p.hp=G.st.max;G.p.inv=Math.max(G.p.inv,5);tactic(b);if(G.dlg)talkThrough();}
  ok(b.dead,G.lv.d.name+': '+type+' goes down ('+Math.round((G.frame-f0)/60)+'s)');talkThrough();ok(G.lv.g[8][7]=='E','  and the way out opens');
  const pk=G.picks.filter(k=>k.kind=='keystone'||k.kind=='container');for(const k of pk){G.p.x=k.x;G.p.z=k.z;step({},12);talkThrough();}
  return b;};
const near=(b,d)=>{const a=Math.atan2(G.p.x-b.x,G.p.z-b.z)||0;G.p.x=b.x+Math.sin(a)*(d||1.8);G.p.z=b.z+Math.cos(a)*(d||1.8);face(b.x,b.z);};
const swingAt=b=>{near(b);step({a:1});step({},16);};
// Old Snapper: get it to charge into a wall, then hit the soft belly
fight('quarry:1,0','turtle',b=>{if(b.state=='stun')swingAt(b);else{G.p.x=8*T;G.p.z=2*T;step();}});ok(G.st.got.granite,'the granite keystone');
// the wraith: bat its orbs back, then hit it while it shows
fight('pyramid:1,1','wraith',b=>{const o=G.shots.find(s=>s.k=='orb'&&!s.refl);if(b.vis>0)swingAt(b);else if(o&&Math.hypot(o.x-G.p.x,o.z-G.p.z)<1.8){face(o.x,o.z);step({a:1});step({},3);}else step();});ok(G.st.got.iron,'the iron keystone');
// the raven: baseballs when it's up high, the paddle when it dives
fight('poe:1,0','raven',b=>{G.st.eq='balls';G.st.ammo.balls=30;if(b.y<2)swingAt(b);else if(G.frame%20==0){face(b.x,b.z);step({b:1});}else step();});ok(G.st.got.brick,'the brick keystone');
// the bell: wait for it to slam down, then hit it
fight('carillon:1,0','bell',b=>{if(b.state=='stun')swingAt(b);else{G.p.x=b.x+3;G.p.z=b.z;step();}});ok(G.st.got.bronze,'the bronze keystone');
// the Iron Foreman: hook the chest plate off, then hit him
fight('tredegar:0,0','foreman',b=>{if(b.state=='stun')swingAt(b);else if(!G.hook){near(b,5);G.st.eq='hook';step({b:1});}else step();});
// the Titan Arum: water it so it blooms, then hit it
fight('conserv:0,0','arum',b=>{if(b.state=='bloom')swingAt(b);else{near(b,2.6);G.st.eq='can';step({b:1});step({},4);}});
// the vampire in the Church Hill tunnel: hit it when it shows, clear the bats when it splits
const v=fight('tunnel:0,0','vampire',b=>{const bat=G.enemies.find(e=>e.type=='bat'&&!e.dead);if(b.gone&&bat){bat.x=G.p.x+1;bat.z=G.p.z;bat.y=1;swingAt(bat);}else if(!b.gone)swingAt(b);else step();},20000);
talkThrough();ok(G.st.f.won&&G.mode=='credits','beating the vampire rolls the credits');

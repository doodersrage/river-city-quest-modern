// Stepping out of any building leaves the camera with a clear view of you.
const G=require('./harness.js'),T=G.TS;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const step=n=>{for(let i=0;i<n;i++){G.inp.a=G.inp.b=0;G.inp.x=G.inp.z=0;G.update();}};
G.startGame(null);G.dlg=null;let n=0,bad=[];
for(const id in G.RCQ.maps)for(const d of G.RCQ.maps[id].doors||[]){if(!G.RCQ.rooms[d.to]||d.need)continue;
  G.loadScene(id,d.tx*T+T/2,(d.ty+1)*T+T/2,0);G.dlg=null;G.enterDoor(d.tx,d.ty);step(40);G.dlg=null;if(!G.lv.room)continue;
  const g=G.lv.g;let e=null;for(let y=0;y<g.length&&!e;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]=='E'){e=[x,y];break;}if(!e)continue;
  G.p.x=e[0]*T+T/2;G.p.z=e[1]*T+T/2;step(45);G.dlg=null;if(G.lv.id!=id)continue;n++;
  const clear=G.camClear(G.cam.yaw,.42,8.2);if(clear<5)bad.push(id+' door '+d.tx+','+d.ty+' ('+clear.toFixed(1)+')');}
ok(n>20&&!bad.length,'the camera can see you after leaving '+n+' buildings'+(bad.length?': blocked at '+bad.join(', '):''));

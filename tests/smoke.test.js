const G=require('./harness.js');const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
for(const id of Object.keys(G.RCQ.maps).concat(Object.keys(G.RCQ.rooms))){const lv=G.buildLevel(id),m=G.buildMesh(lv);ok(m.main.count>1000,id+' builds '+m.main.count+' vertices');}
G.startGame(null);ok(G.mode=='play'&&G.lv.id=='ow:2,1','a new game starts in Capitol Square');
for(const id of Object.keys(G.RCQ.maps)){const m=G.buildMesh(G.buildLevel(id));ok(m.main.sw.length==m.main.count&&m.froth.sw.length==m.froth.count,id+': every vertex knows how much it sways');}
{const l=G.buildLevel('ow:3,1'),cars=l.props.filter(p=>p.kind=='car');ok(cars.length>=2,'parked cars in Shockoe ('+cars.length+')');}

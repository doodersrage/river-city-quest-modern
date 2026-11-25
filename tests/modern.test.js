// The modern renderer's CPU side: normals on every vertex, contact shading, and automatic quality.
const G=require('./harness.js');const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
let bad=0,total=0;
for(const id of Object.keys(G.RCQ.maps).concat(Object.keys(G.RCQ.rooms))){const m=G.buildMesh(G.buildLevel(id)).main;total+=m.count;
  if(m.nrm.length!=m.pos.length){bad++;continue;}for(let i=0;i<m.count;i+=7){const l=Math.hypot(m.nrm[i*3],m.nrm[i*3+1],m.nrm[i*3+2]);if(Math.abs(l-1)>.01){bad++;break;}}}
ok(!bad,'every place has a unit normal on every vertex ('+(total/1e6).toFixed(2)+'M vertices)');
const P=[G.humanoid({}),G.lifeModel('dog'),G.lifeModel('racecar')];ok(P.every(parts=>parts.every(pt=>pt.mesh.nrm.length==pt.mesh.pos.length)),'people, the dog and the race car have normals too');
const s=new G.Mesh();s.sphere(0,0,0,1,8,4,'white');let up=0;for(let i=0;i<s.count;i++){const d=Math.hypot(s.pos[i*3],s.pos[i*3+1],s.pos[i*3+2]),dot=(s.pos[i*3]*s.nrm[i*3]+s.pos[i*3+1]*s.nrm[i*3+1]+s.pos[i*3+2]*s.nrm[i*3+2])/(d||1);if(dot>.95)up++;}
ok(up/s.count>.95,'a sphere is smooth: its normals point straight out');
const lv=G.buildLevel('ow:3,1'),m=G.buildMesh(lv).main,before=m.col.slice();G.bakeAO(lv,m);let darker=0;for(let i=0;i<m.col.length;i++)if(m.col[i]<before[i]-1e-6)darker++;
ok(darker>500,'contact shading darkens '+Math.round(darker/3)+' vertices where the ground meets walls in Shockoe');
G.QUAL.auto=true;G.QUAL.lvl=2;G.QUAL.dropped=false;G.QUAL.cool=0;G.QUAL.ft=[];for(let i=0;i<90;i++)G.qualityTick(40);ok(G.QUAL.lvl==1,'slow frames drop the quality a step (to '+G.QL[G.QUAL.lvl].name+')');
G.QUAL.cool=0;for(let i=0;i<90;i++)G.qualityTick(5);ok(G.QUAL.lvl==1,'and it doesn\'t bounce back up after dropping');
G.QUAL.auto=false;G.QUAL.lvl=0;G.QUAL.cool=0;for(let i=0;i<200;i++)G.qualityTick(40);ok(G.QUAL.lvl==0,'a quality you pick yourself stays put');
const kinds=['rat','squirrel','goose','crab','bat','ghost','turtle','raven','scooter','wraith','bell','foreman','arum','vampire'];
const broken=kinds.filter(k=>{try{const P=G.enemyModel(k);return!P.length||P.some(pt=>!pt.mesh.count||pt.mesh.nrm.length!=pt.mesh.pos.length||pt.mesh.pos.some(v=>!isFinite(v)));}catch(e){return true;}});
ok(!broken.length,'every creature and boss builds a clean model'+(broken.length?': '+broken.join(','):''));
const pg=G.pigeonModel();ok(pg.length==3&&pg[1].name=='wingL','pigeons keep their flapping wings');
// the flagship landmarks are real buildings that stay inside the ground the map gives them
{const ok2=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const sizes={capitol:[10,6,10],station:[12,6,20],church:[6,5,14],carillon:[3,7,24],byrd:[7,3,10]};
for(const [k,[w,h,tall]] of Object.entries(sizes)){const M=new G.Mesh();G.LMK[k](M,10,10,10+w*2,10+h*2);let bad=0,out=0,top=0;for(let i=0;i<M.pos.length;i+=3){const x=M.pos[i],y=M.pos[i+1],z=M.pos[i+2];if(!isFinite(x+y+z+M.nrm[i]+M.nrm[i+1]+M.nrm[i+2]))bad++;if(x<9.99||x>10.01+w*2||z<9.99||z>10.01+h*2||y<-.01)out++;top=Math.max(top,y);}
  ok2(!bad&&!out&&top>tall&&M.count>3000,'the '+k+' is built in detail ('+M.count/3+' triangles, '+top.toFixed(1)+' m tall) and stays on its own ground');}}
// the enlarged maps: twice the size, everything still where it belongs, and neighbors still join
// the polygon world: every neighborhood is the real place, and everything from the original game stands on ground you can reach
{const ok2=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const M=G.RCQ.maps,ids=Object.keys(M).filter(k=>k.indexOf('ow:')==0);
let noData=0,size=0,doors=0,stuck=[],lmBad=0,nb=0,nr=0,cars=0,carBad=0,named=0;
for(const id of ids){const W=G.WORLD[id];if(!W||W.roads.length<5){noData++;continue;}const lv=G.buildLevel(id),w=lv.world,m=lv.d;if(lv.w!=200||lv.h!=150||w.w!=400||w.h!=300)size++;nb+=w.bld.length;nr+=w.roads.length;named+=new Set(w.roads.filter(r=>r.n).map(r=>r.n)).size;
  const free=(x,z,r)=>!G.worldBlocked(w,x,z,r);
  // walk outward from the middle on a half-metre grid; everything that matters must be on ground the walk reached
  const N=800,H=600,seen=new Uint8Array(N*H),q=[];let s0=null;for(let r=0;r<70&&!s0;r++)for(let a=0;a<12&&!s0;a++){const x=200+Math.sin(a/2)*r*2,z=150+Math.cos(a/2)*r*2;if(free(x,z,.42)&&G.onMain(w,x,z))s0=[Math.round(x*2),Math.round(z*2)];}
  if(s0){seen[s0[1]*N+s0[0]]=1;q.push(s0);}while(q.length){const [x,z]=q.pop();for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz;if(a<1||b<1||a>=N-1||b>=H-1||seen[b*N+a])continue;if(!free(a/2,b/2,.42))continue;seen[b*N+a]=1;q.push([a,b]);}}
  const reach=(x,z,r)=>{const R=Math.ceil((r||1.6)*2);for(let dz=-R;dz<=R;dz++)for(let dx=-R;dx<=R;dx++){const a=Math.round(x*2)+dx,b=Math.round(z*2)+dz;if(a>=0&&b>=0&&a<N&&b<H&&seen[b*N+a])return true;}return false;};
  for(const d of m.doors||[]){if(d.x==null||G.worldBlocked(w,d.x-d.nx*.2,d.z-d.nz*.2,.3)!='D'){doors++;console.log('door',id,d.to,d.x,d.z,d.x!=null&&G.worldBlocked(w,d.x-d.nx*.2,d.z-d.nz*.2,.3));continue;}if(!reach(d.x+d.nx*1.2,d.z+d.nz*1.2,1.2))stuck.push(id+' door '+d.to);}
  for(const n of (m.npcs||[]).concat(G.EXTRA_NPCS.filter(n=>n.scene==id)))if(!reach(n.tx*2+1,n.ty*2+1,2.2))stuck.push(id+' '+(n.who||n.talk));
  for(const c of m.chests||[])if(!reach(c.tx*2+1,c.ty*2+1,2.4))stuck.push(id+' chest '+c.id);for(const c of m.items||[])if(!reach(c.tx*2+1,c.ty*2+1,1.4))stuck.push(id+' item '+c.id);
  for(const k in m.reads){const [x,y]=k.split(',').map(Number);if(!reach(x*2+1,y*2+1,2.4))stuck.push(id+' plaque '+k);}
  for(const e of m.en||[])if(!reach(e[1]*2+1,e[2]*2+1,2))stuck.push(id+' enemy '+e[0]);
  if(G.SECRETS[id]&&!reach(G.SECRETS[id][0]*2+1,G.SECRETS[id][1]*2+1,1.2))stuck.push(id+' stash');
  for(const L of w.landmarks){if(!L.b||!L.b.pp||L.b.pp.length<4)lmBad++;}
  for(const c of lv.props.filter(p=>p.kind=='car')){cars++;const cs=Math.cos(c.yaw),sn=Math.sin(c.yaw);for(const [u,v] of [[-2.1,-.85],[2.1,-.85],[-2.1,.85],[2.1,.85]]){const x=c.x+u*cs+v*sn,z=c.z-u*sn+v*cs,rn=G.roadNear(w,x,z,16,r=>r===c.rd);if(!rn||rn.d>c.rd.wm/2+.15||G.buildingAt(w,x,z)){carBad++;console.log('car',id,c.x,c.z,rn&&rn.d,c.rd.wm,!!G.buildingAt(w,x,z));break;}}}}
ok2(!noData&&!size,'all '+ids.length+' neighborhoods are real map data, 400 by 300 metres ('+nb+' buildings, '+nr+' streets and paths, '+named+' street names)');
ok2(!doors,'every door is set in a real wall');ok2(!stuck.length,'every person, door, chest, item, plaque, enemy and stash can be walked to'+(stuck.length?' (cut off: '+stuck.slice(0,12).join('; ')+(stuck.length>12?' and '+(stuck.length-12)+' more':'')+')':''));
ok2(!lmBad,'every landmark stands on a building footprint');ok2(cars>=200&&!carBad,cars+' parked cars, every wheel on the roadway and none in a building ('+carBad+' wrong)');
const has=(id,rx)=>G.WORLD[id].roads.some(r=>r.n&&rx.test(r.n)),want={'ow:2,1':[/Broad St/,/9th St/,/Governor St/,/Bank St/],'ow:3,1':[/Main St/,/17th St/,/Cary St/],'ow:3,0':[/Broad St/,/Grace St/,/24th St/,/25th St/],'ow:0,1':[/Cary St/,/Sheppard St/],'ow:1,1':[/Monument Ave|Park Ave|Franklin St|Grace St/],'ow:2,0':[/2nd St/,/Leigh St/,/Clay St/]};
const miss=[];for(const id in want)for(const rx of want[id])if(!has(id,rx))miss.push(id+' '+rx);ok2(!miss.length,'the districts carry their real street names'+(miss.length?' (missing '+miss.join(', ')+')':''));
ok2(M['ow:2,1'].lm.some(L=>L.art=='cityhall')&&M['ow:2,1'].lm.some(L=>L.art=='temple')&&G.WORLD['ow:2,1'].bld.some(b=>b.lm=='capitol'&&/Capitol/.test(b.n||'')),"the Capitol stands on the real Capitol's footprint, with Old City Hall and St. Paul's beside it");
// collision follows the real shapes: inside a footprint is solid at any angle, the street beside it is not
{const lv=G.buildLevel('ow:1,1'),w=lv.world;let wrong=0,n=0;for(const b of w.bld){if(b.gone||b.t=='roof'||b.ar<60)continue;n++;if(G.worldBlocked(w,b.c[0],b.c[1],.4)==null&&G.buildingAt(w,b.c[0],b.c[1]))wrong++;}
  let onRoad=0,rb=0;for(const r of w.roads){if(!r.car||r.b)continue;for(let i=0;i<r.pp.length-1;i++){const a=r.pp[i],b=r.pp[i+1],x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;if(x<5||z<5||x>395||z>295)continue;onRoad++;if(G.buildingAt(w,x,z))rb++;}}
  ok2(n>100&&!wrong&&onRoad>50&&rb<onRoad*.03,'in the Fan, '+n+' buildings are solid and '+onRoad+' stretches of street are open ('+rb+' under a roof)');}}

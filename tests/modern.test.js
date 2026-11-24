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

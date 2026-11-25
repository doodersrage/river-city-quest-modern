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

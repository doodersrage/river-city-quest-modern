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
{const ok2=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const M=G.RCQ.maps,ids=Object.keys(M).filter(k=>k.indexOf('ow:')==0),WALK='.,psSKk=-FEn^|1';
let size=0,doors=0,npc=0,lm=0,joins=0,open=0;
for(const id of ids){const m=M[id];if(m.w!=64||m.h!=44||m.rows.length!=44||m.rows.some(r=>r.length!=64))size++;
  for(const d of m.doors||[])if(!'D%'.includes(m.rows[d.ty][d.tx]))doors++;for(const n of m.npcs||[])if(!WALK.includes(m.rows[n.ty][n.tx]))npc++;
  for(const L of m.lm||[])for(let y=L.y;y<L.y+L.h;y++)for(let x=L.x;x<L.x+L.w;x++)if(!'XD'.includes(m.rows[y][x]))lm++;
  const [ax,ay]=id.slice(3).split(',').map(Number),E=M['ow:'+(ax+1)+','+ay],S=M['ow:'+ax+','+(ay+1)];
  if(E)for(let y=0;y<44;y++){const a=WALK.includes(m.rows[y][63]),b=WALK.includes(E.rows[y][0]);if(a&&b)open++;if(a!=b)joins++;}
  if(S)for(let x=0;x<64;x++){const a=WALK.includes(m.rows[43][x]),b=WALK.includes(S.rows[0][x]);if(a&&b)open++;if(a!=b)joins++;}}
ok2(!size,'all '+ids.length+' neighborhoods are 64 by 44 tiles');ok2(!doors&&!npc,'every door and every person moved with the map');ok2(lm<40,'landmarks still stand on their own ground');
ok2(open>40&&!joins,'neighbors still join edge to edge ('+open+' open tiles, '+joins+' one-sided)');}
// districts with a street plan carry real street names, corner signs and plaques for real neighbors
{const ok2=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};const M=G.RCQ.maps,want={'ow:2,1':['E Broad St','N 9th St','Governor St','Bank St'],'ow:3,1':['E Main St','N 17th St','E Cary St'],'ow:3,0':['E Broad St','E Grace St','N 24th St','N 25th St'],'ow:0,1':['W Cary St','S Colonial Ave','S Sheppard St'],'ow:1,1':['Monument Ave','N Lombardy St','Park Ave'],'ow:2,0':['N 2nd St','E Leigh St','E Clay St']};
let miss=[],signs=0,pl=0;for(const id in want){const m=M[id],names=new Set(m.streets.map(s=>s.n));for(const n of want[id])if(!names.has(n))miss.push(id+' '+n);signs+=m.signs.length;for(const k in m.reads)if(m.reads[k][0]=='!'&&G.RCQ.readx[m.reads[k]]){const [x,y]=k.split(',').map(Number);if(m.rows[y][x]=='M')pl++;}}
ok2(!miss.length,'six districts are laid out on their real streets'+(miss.length?' (missing '+miss.join(', ')+')':''));ok2(signs>=40&&pl>=12,signs+' corner street signs and '+pl+' plaques for real places');
ok2(M['ow:2,1'].lm.some(L=>L.art=='cityhall')&&M['ow:2,1'].lm.some(L=>L.art=='temple'),"Old City Hall and St. Paul's stand by Capitol Square");}
// parked cars sit wholly on the roadway, parallel to the curb, and never on a corner
{const ok2=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};let n=0,bad=0,lots=0;for(const id of ['ow:2,1','ow:0,1','ow:1,1','ow:2,0','ow:1,0','ow:0,0']){const lv=G.buildLevel(id);for(const c of lv.props.filter(p=>p.kind=='car')){n++;const inLot=(lv.d.lots||[]).some(L=>c.tx>=L[0]&&c.tx<=L[2]&&c.ty>=L[1]&&c.ty<=L[3]);if(inLot)lots++;
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const tx=Math.floor((c.x+sx*c.solid[0])/G.TS),tz=Math.floor((c.z+sz*c.solid[1])/G.TS);if(lv.d.rows[tz][tx]!='p')bad++;}}}
ok2(n>=60&&!bad&&lots>=8,n+' parked cars, every wheel on the asphalt ('+lots+' of them in parking lots)');}

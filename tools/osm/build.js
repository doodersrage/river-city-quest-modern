// Turns the raw OpenStreetMap downloads into the game's maps: js/worlddata.js.
//   node tools/osm/build.js <dir with the raw *.json or *.json.gz files>
// Every neighborhood becomes a 400 m by 300 m place at true scale, with 60 m (east-west) and 50 m (north-south)
// of the real city kept around it as a backdrop. Positions are metres from the north-west corner of the
// playable area: x runs east, z runs south. They are stored in decimetres as whole numbers.
// Map data (c) OpenStreetMap contributors, ODbL 1.0.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const W=400,H=300,MX=60,MZ=50,src=process.argv[2]||'osm-raw',outFile=process.argv[3]||path.join(__dirname,'..','..','js','worlddata.js');
const R1=v=>Math.round(v*10);
const area2=p=>{let a=0;for(let i=0,n=p.length;i<n;i++){const q=p[(i+1)%n];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;};
const inPoly=(p,x,z)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
function simplify(p,eps,closed){if(p.length<4)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
  while(st.length){const [a,b]=st.pop();let md=0,mi=-1;const ax=p[a][0],az=p[a][1],dx=p[b][0]-ax,dz=p[b][1]-az,l=Math.hypot(dx,dz)||1;for(let i=a+1;i<b;i++){const d=Math.abs((p[i][0]-ax)*dz-(p[i][1]-az)*dx)/l;if(d>md){md=d;mi=i;}}if(md>eps){keep[mi]=1;st.push([a,mi],[mi,b]);}}
  return p.filter((_,i)=>keep[i]);}
// a closed outline: simplify the two halves between its first corner and the corner farthest from it
function simplifyRing(r,eps){if(r.length<5)return r;let far=1,fd=0;for(let i=1;i<r.length;i++){const d=Math.hypot(r[i][0]-r[0][0],r[i][1]-r[0][1]);if(d>fd){fd=d;far=i;}}const a=simplify(r.slice(0,far+1),eps),b=simplify(r.slice(far).concat([r[0]]),eps);return a.concat(b.slice(1,-1));}
const dedupe=p=>p.filter((q,i)=>i==0||Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1])>.12);
// join loose pieces of outline end to end into rings
function joinRings(segs){const rings=[],open=[];let pool=segs.map(s=>s.slice()).filter(s=>s.length>1);const same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.25;
  while(pool.length){let cur=pool.pop(),grew=true;while(grew&&!same(cur[0],cur[cur.length-1])){grew=false;for(let i=0;i<pool.length;i++){const s=pool[i];
        if(same(cur[cur.length-1],s[0])){cur=cur.concat(s.slice(1));}else if(same(cur[cur.length-1],s[s.length-1])){cur=cur.concat(s.slice().reverse().slice(1));}else if(same(cur[0],s[s.length-1])){cur=s.concat(cur.slice(1));}else if(same(cur[0],s[0])){cur=s.slice().reverse().concat(cur.slice(1));}else continue;pool.splice(i,1);grew=true;break;}}
    if(same(cur[0],cur[cur.length-1])&&cur.length>3)rings.push(cur.slice(0,-1));else open.push(cur);}
  return{rings,open};}
const num=v=>{const f=parseFloat(String(v||'').replace(',','.'));return isFinite(f)?f:null;};
const ROADK={motorway:'m',trunk:'m',motorway_link:'m',trunk_link:'m',primary:'p',primary_link:'p',secondary:'s',secondary_link:'s',tertiary:'t',tertiary_link:'t',residential:'r',unclassified:'r',living_street:'r',road:'r',service:'v',footway:'f',path:'f',pedestrian:'d',steps:'x',cycleway:'c',track:'f',bridleway:'f'};
const ROADW={m:11,p:15,s:12.5,t:10.5,r:9,v:5,a:3.6,f:2,c:2.6,d:6,x:2.2};
function build(raw){const d=raw,cosl=Math.cos(d.lat*Math.PI/180),P=(g)=>[(g.lon-d.lon)*cosl*111320+W/2,(d.lat-g.lat)*111320+H/2];
  const out={name:d.name,lat:d.lat,lon:d.lon,w:W,h:H,mx:MX,mz:MZ,roads:[],rails:[],bld:[],areas:[],lines:[],pts:[]};
  const GW=W+2*MX,GH=H+2*MZ,bar=new Uint8Array(GW*GH),land=new Uint8Array(GW*GH),wat=new Uint8Array(GW*GH);let anyWater=false,openWater=false;
  const cell=(x,z)=>{const i=Math.floor(x+MX),j=Math.floor(z+MZ);return i<0||j<0||i>=GW||j>=GH?-1:j*GW+i;};
  const mark=(grid,p,rad)=>{for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2));for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n;
        for(let u=-rad;u<=rad;u++)for(let v=-rad;v<=rad;v++){const c=cell(x+u,z+v);if(c>=0)grid[c]=1;}}}};
  const fill=(grid,p)=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of p){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);}
    for(let z=Math.floor(z0);z<=z1;z++)for(let x=Math.floor(x0);x<=x1;x++)if(inPoly(p,x+.5,z+.5)){const c=cell(x+.5,z+.5);if(c>=0)grid[c]=1;}};
  // the pieces of a way that came through: nodes outside the downloaded box arrive as gaps
  const runs=g=>{const R=[];let cur=[];for(const q of g||[]){if(q&&q.lat!=null)cur.push(P(q));else if(cur.length){R.push(cur);cur=[];}}if(cur.length)R.push(cur);return R.map(dedupe).filter(r=>r.length>1);};
  const whole=g=>g&&g.length>3&&g.every(q=>q&&q.lat!=null)&&g[0].lat==g[g.length-1].lat&&g[0].lon==g[g.length-1].lon;
  const ringOf=g=>dedupe(g.map(P)).slice(0,-1);
  const isWater=t=>t.natural=='water'||t.waterway=='riverbank'||t.waterway=='dock'||t.landuse=='reservoir'||t.landuse=='basin'||t.natural=='bay';
  const areaKind=t=>{if(isWater(t))return'water';if(t.leisure=='park'||t.leisure=='garden'||t.leisure=='playground'||t.leisure=='common'||t.leisure=='dog_park'||t.leisure=='nature_reserve')return'park';if(t.landuse=='cemetery'||t.amenity=='grave_yard')return'cemetery';
    if(t.natural=='wood'||t.landuse=='forest')return'wood';if(t.landuse=='grass'||t.landuse=='meadow'||t.landuse=='village_green'||t.landuse=='recreation_ground'||t.natural=='grassland'||t.leisure=='golf_course')return'grass';if(t.natural=='scrub'||t.natural=='heath'||t.natural=='wetland')return'scrub';
    if(t.amenity=='parking'&&t.parking!='underground'&&t.parking!='multi-storey')return'parking';if(t.leisure=='pitch'||t.leisure=='track'||t.leisure=='stadium'&&!t.building)return'pitch';if(t.natural=='sand'||t.natural=='beach'||t.natural=='shingle'||t.natural=='bare_rock')return'sand';
    if(t.highway=='pedestrian'&&t.area=='yes'||t.place=='square'||t['area:highway'])return'plaza';if(t.landuse=='commercial'||t.landuse=='retail'||t.landuse=='industrial'||t.landuse=='railway'||t.landuse=='construction')return'paved';if(t.landuse=='residential')return'yard';return null;};
  const bHeight=(t,a)=>{const h=num(t.height)||num(t['building:height']),lv=num(t['building:levels']);if(h)return h;if(lv)return lv*3.3+1.2;const b=t.building;
    if(['house','detached','residential','terrace','semidetached_house','bungalow'].includes(b))return a>260?10:7.4;if(b=='apartments'||b=='dormitory'||b=='hotel')return 14;if(b=='office')return 20;if(['commercial','retail','supermarket'].includes(b))return a>900?9:8;
    if(['industrial','warehouse','manufacture'].includes(b))return 9.5;if(['church','cathedral','chapel','synagogue','mosque','temple'].includes(b)||t.amenity=='place_of_worship')return 13;if(['garage','garages','shed','carport','hut','kiosk'].includes(b))return 3.2;if(b=='roof')return 4.5;
    if(['school','university','college','hospital','civic','government','public','train_station','museum'].includes(b))return 15;return a<90?6.5:a<500?9.5:a<2500?13:17;};
  const addBld=(ring,t)=>{let p=simplifyRing(ring,.2);if(p.length<3)return;let a=area2(p);if(Math.abs(a)<8)return;if(a<0){p=p.reverse();a=-a;}// kept clockwise as seen from above (z runs south)
    fill(land,p);out.bld.push({p:p.flatMap(q=>[R1(q[0]),R1(q[1])]),h:R1(bHeight(t,a)),t:t.building=='yes'?undefined:t.building,n:t.name,a:t.amenity||t.shop||t.tourism||t.office||t.leisure||t.historic||undefined,lv:num(t['building:levels'])||undefined,rf:t['roof:shape'],c:t['building:colour']||t['building:material'],ad:t['addr:housenumber']&&t['addr:street']?t['addr:housenumber']+' '+t['addr:street']:undefined});};
  const addArea=(ring,k,t)=>{let p=simplifyRing(ring,.4);if(p.length<3||Math.abs(area2(p))<12)return;if(area2(p)<0)p=p.reverse();out.areas.push({k,p:p.flatMap(q=>[R1(q[0]),R1(q[1])]),n:t.name,s:t.sport||t.surface});};
  for(const e of d.elements){const t=e.tags||{};
    if(e.type=='node'){const [x,z]=P(e);let k=null;
      if(t.natural=='tree')k='tree';else if(t.highway=='traffic_signals')k='signal';else if(t.highway=='street_lamp')k='lamp';else if(t.highway=='stop')k='stop';else if(t.highway=='bus_stop')k='bus';else if(t.highway=='crossing')k=t.crossing=='traffic_signals'||t['crossing:signals']=='yes'?'xsig':'cross';
      else if(t.amenity=='bench')k='bench';else if(t.amenity=='fountain')k='fountain';else if(t.amenity=='waste_basket')k='bin';else if(t.amenity=='post_box')k='post';else if(t.amenity=='bicycle_parking')k='bikes';else if(t.emergency=='fire_hydrant')k='hydrant';
      else if(t.historic=='memorial'||t.historic=='monument'||t.tourism=='artwork')k='statue';else if(t.man_made=='flagpole')k='flag';else if(t.power=='pole')k='pole';else if(t.barrier=='bollard')k='bollard';else if(t.tourism=='information')k='info';else if(t.man_made=='water_tower'||t.man_made=='tower')k='tower';
      else if(t.name&&(t.amenity||t.shop||t.tourism||t.historic||t.leisure))k='poi';
      if(k){out.pts.push({k,x:R1(x),z:R1(z),n:t.name,a:k=='poi'?(t.amenity||t.shop||t.tourism||t.historic||t.leisure):undefined});const c=cell(x,z);if(c>=0&&k!='poi'&&k!='signal'&&k!='cross'&&k!='xsig')land[c]=1;}continue;}
    const ak=areaKind(t);
    if(e.type=='way'){const g=e.geometry||[];
      if(t.building&&t.building!='no'){if(whole(g))addBld(ringOf(g),t);continue;}
      if(t.highway&&ROADK[t.highway]&&!(t.area=='yes')){if(t.tunnel&&t.tunnel!='no'&&t.tunnel!='building_passage')continue;let k=ROADK[t.highway];if(k=='v'&&(t.service=='alley'||t.service=='driveway'||t.service=='parking_aisle'))k='a';
        const lanes=num(t.lanes),one=t.oneway=='yes'||t.oneway=='1'||t.junction=='roundabout',br=t.bridge&&t.bridge!='no';let w=num(t.width);if(!w||w>40)w=lanes&&'mpstr'.includes(k)?Math.max(ROADW[k]*.55,lanes*3.3+(k=='m'?1.5:one?2.5:4.4)):ROADW[k]*(one&&'pst'.includes(k)?.72:1);
        for(const r of runs(g)){const p=simplify(r,.25);out.roads.push({k,n:t.name,w:R1(w),p:p.flatMap(q=>[R1(q[0]),R1(q[1])]),o:one?1:undefined,b:br?1:undefined,ly:br?(num(t.layer)||1):undefined,c:/cobble|sett|paving_stones|brick/.test(t.surface||'')?1:undefined,sw:t.footway=='sidewalk'?1:t.footway=='crossing'?2:undefined,ln:lanes||undefined});if(!br)mark(land,p,0);}continue;}
      if(t.railway&&['rail','light_rail','tram','disused','abandoned','preserved'].includes(t.railway)){if(t.tunnel&&t.tunnel!='no')continue;for(const r of runs(g))out.rails.push({p:simplify(r,.3).flatMap(q=>[R1(q[0]),R1(q[1])]),b:t.bridge&&t.bridge!='no'?1:undefined,x:t.railway!='rail'&&t.railway!='light_rail'&&t.railway!='tram'?1:undefined});continue;}
      if(t.waterway&&['stream','canal','ditch','drain'].includes(t.waterway)&&!(t.tunnel&&t.tunnel!='no')){const wd=num(t.width)||(t.waterway=='canal'?9:t.waterway=='stream'?3.5:2);for(const r of runs(g)){mark(wat,r,Math.max(1,Math.round(wd/2)));anyWater=true;}continue;}
      if(ak=='water'){anyWater=true;if(whole(g))fill(wat,ringOf(g));else{for(const r of runs(g))mark(bar,r,1);openWater=true;}continue;}
      if(ak){if(whole(g))addArea(ringOf(g),ak,t);else{const r=runs(g);if(r.length==1&&r[0].length>3)addArea(r[0],ak,t);}continue;}
      if(t.barrier&&['fence','wall','retaining_wall','hedge','city_wall','guard_rail','handrail'].includes(t.barrier)){for(const r of runs(g)){const p=simplify(r,.2);out.lines.push({k:t.barrier=='hedge'?'hedge':t.barrier=='fence'||t.barrier=='guard_rail'||t.barrier=='handrail'?'fence':'wall',p:p.flatMap(q=>[R1(q[0]),R1(q[1])]),h:num(t.height)?R1(num(t.height)):undefined});mark(land,p,0);}continue;}
      if(t.man_made=='pier'||t.man_made=='bridge'){if(whole(g))addArea(ringOf(g),'deck',t);else for(const r of runs(g))out.roads.push({k:'f',w:R1(num(t.width)||3),p:simplify(r,.25).flatMap(q=>[R1(q[0]),R1(q[1])]),b:1,n:t.name});continue;}
      continue;}
    if(e.type=='relation'){const mem=(e.members||[]).filter(m=>m.type=='way'&&m.geometry),outer=mem.filter(m=>m.role!='inner'),inner=mem.filter(m=>m.role=='inner');
      if(t.building&&t.building!='no'){const J=joinRings(outer.flatMap(m=>runs(m.geometry)));for(const r of J.rings)addBld(r,t);continue;}
      if(ak=='water'){anyWater=true;const allWhole=mem.every(m=>m.geometry.every(q=>q&&q.lat!=null));const J=joinRings(outer.flatMap(m=>runs(m.geometry)));
        if(allWhole&&!J.open.length){for(const r of J.rings)fill(wat,r);const JI=joinRings(inner.flatMap(m=>runs(m.geometry)));const isl=new Uint8Array(GW*GH);for(const r of JI.rings)fill(isl,r);for(let i=0;i<isl.length;i++)if(isl[i])wat[i]=0;}
        else{for(const m of mem)for(const r of runs(m.geometry))mark(bar,r,1);openWater=true;}continue;}
      if(ak){const J=joinRings(outer.flatMap(m=>runs(m.geometry)));for(const r of J.rings)addArea(r,ak,t);for(const r of J.open)if(r.length>3)addArea(r,ak,t);continue;}}}
  // water whose outline runs off the edge of the download: flood the ground between the bank lines, and call a piece water if nothing on it says it is land
  if(openWater){const lab=new Int32Array(GW*GH).fill(-1),ev=[];let n=0;const st=[];
    for(let s=0;s<GW*GH;s++){if(bar[s]||lab[s]>=0)continue;let e=0,size=0;lab[s]=n;st.push(s);while(st.length){const c=st.pop();size++;if(land[c])e++;const x=c%GW,z=(c/GW)|0;
        if(x>0&&!bar[c-1]&&lab[c-1]<0){lab[c-1]=n;st.push(c-1);}if(x<GW-1&&!bar[c+1]&&lab[c+1]<0){lab[c+1]=n;st.push(c+1);}if(z>0&&!bar[c-GW]&&lab[c-GW]<0){lab[c-GW]=n;st.push(c-GW);}if(z<GH-1&&!bar[c+GW]&&lab[c+GW]<0){lab[c+GW]=n;st.push(c+GW);}}
      ev.push(e/Math.max(1,size));n++;}
    for(let i=0;i<GW*GH;i++)if(lab[i]>=0&&ev[lab[i]]<.0006&&!land[i])wat[i]=1;
    for(let pass=0;pass<2;pass++){const add=[];for(let i=0;i<GW*GH;i++)if(bar[i]&&!wat[i]){const x=i%GW;if((x>0&&wat[i-1])||(x<GW-1&&wat[i+1])||(i>=GW&&wat[i-GW])||(i<GW*(GH-1)&&wat[i+GW]))add.push(i);}for(const i of add)wat[i]=1;}}
  // the water as a grid of 2 m cells, packed to bits; the game smooths it back into curved banks
  if(anyWater){const cw=GW/2,ch=GH/2,bits=new Uint8Array(Math.ceil(cw*ch/8));let cnt=0;for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){const s=wat[(2*j)*GW+2*i]+wat[(2*j)*GW+2*i+1]+wat[(2*j+1)*GW+2*i]+wat[(2*j+1)*GW+2*i+1];if(s>=2){bits[(j*cw+i)>>3]|=1<<((j*cw+i)&7);cnt++;}}
    if(cnt)out.water={cw,ch,bits:Buffer.from(bits).toString('base64')};}
  out.areas.sort((a,b)=>{const A=k=>({yard:0,paved:1,grass:2,park:3,cemetery:3,wood:4,scrub:4,sand:5,parking:6,plaza:6,pitch:7,deck:8}[k]||0);return A(a.k)-A(b.k);});
  const clean=o=>{for(const k in o)if(o[k]===undefined||o[k]===null)delete o[k];return o;};for(const k of ['roads','rails','bld','areas','lines','pts'])out[k]=out[k].map(clean);
  return out;}
const files=fs.readdirSync(src).filter(f=>/^ow_.*\.json(\.gz)?$/.test(f)&&(!fs.readdirSync(src).some(q=>/\.v2\.json/.test(q))||/\.v2\.json/.test(f))),world={};
for(const f of files){const buf=fs.readFileSync(path.join(src,f)),raw=JSON.parse(f.endsWith('.gz')?zlib.gunzipSync(buf):buf),w=build(raw);world[raw.id]=w;
  console.log(raw.id.padEnd(8),w.name.padEnd(30),w.bld.length+' buildings',w.roads.length+' ways',w.areas.length+' areas',w.pts.length+' points',w.lines.length+' fences',w.water?'water':'');}
fs.writeFileSync(outFile,'"use strict";\n/* The real city: streets, building footprints, parks and water for each neighborhood, from OpenStreetMap.\n   Map data (c) OpenStreetMap contributors, licensed under the Open Database License (ODbL) 1.0. https://www.openstreetmap.org/copyright\n   Built by tools/osm/build.js. Positions are decimetres from the north-west corner of the 400 m by 300 m playable area. */\nconst WORLD='+JSON.stringify(world)+';\n');
console.log(Object.keys(world).length+' neighborhoods, '+(fs.statSync(outFile).size/1e6).toFixed(2)+' MB');

"use strict";
/* River City Quest Modern: materials. Every texture cell becomes one layer of a texture array at
   S x S pixels (128 on most devices). The common surfaces (brick, stone, cobbles, grass, wood, roofs
   and so on) are painted fresh at full resolution with a height map; everything else is the PS1 cell,
   scaled up. Each layer also gets a second texture holding its normal (from the height), roughness,
   and a mask for what glows at night (lit windows, the open door). */
const MAT={// roughness, metalness, bump strength
  glass:[.06,0,0],gold:[.28,1,.6],copper:[.35,1,.6],tin:[.4,1,1],marble:[.25,0,.5],white:[.6,0,.2],black:[.5,0,.2],water:[.05,0,0],keystone:[.4,0,1.2],
  brick:[.85,0,2.2],brickwin:[.8,0,2.2],brickwin2:[.8,0,2.2],storefront:[.75,0,1.6],cobble:[.75,0,2.8],stone:[.85,0,2.4],stonewall:[.85,0,2.4],qwall:[.9,0,2.4],floor:[.8,0,2],
  roof:[.7,0,2],planks:[.75,0,1.6],wood:[.7,0,1.2],woodfl:[.45,0,1],tilefl:[.3,0,1.2],grass:[.95,0,1.4],grass2:[.95,0,1.4],flowers:[.9,0,1.4],dirt:[.95,0,1.6],sand:[.95,0,1.2],
  sidewalk:[.85,0,1.2],concrete:[.88,0,1],rock:[.8,0,2.4],bark:[.9,0,2.4],leaves:[.7,0,1.6],leaves2:[.7,0,1.6],plaster:[.85,0,.6],steps:[.8,0,1.6],rubble:[.9,0,2.4],
  rails:[.85,0,1.6],cloth:[.85,0,.18],knit:[.9,0,.3],denim:[.8,0,.25],leather:[.45,0,.3],skin:[.55,0,.08],hairs:[.55,0,1.3],brass:[.3,1,.4],asphalt:[.85,0,1.3],gravel:[.9,0,2.6],bricksw:[.85,0,2],curb:[.7,0,1.4],leafcard:[.6,0,1.4],needles:[.7,0,1.4],pane:[.05,0,.2],fur:[.8,0,1.2],feather:[.6,0,1],carapace:[.4,0,1.6],paint:[.22,.15,.1],tire:[.85,0,1.4],chrome:[.12,1,.2],panelit:[.12,0,.2],mulch:[.95,0,2],granite:[.55,0,.8],column:[.45,0,.8],clock:[.4,0,.5],case:[.2,0,.3],arcade:[.4,0,.4],engine:[.55,.6,1.2],hair:[.6,0,.8],shell:[.5,0,1.6]};
const matOf=n=>MAT[n]||[.7,0,.8];
function makeLayers(S){
  const legacy=makeAtlas(),N=CELLS.length,alb=new Uint8Array(S*S*4*N),nrm=new Uint8Array(S*S*4*N);
  const cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d',{willReadFrequently:true});
  for(let i=0;i<N;i++){const name=CELLS[i],H=new Float32Array(S*S),E=new Float32Array(S*S);let img;
    if(name.indexOf('text')==0&&typeof paintText=='function'){img=g.createImageData(S,S);paintText(img.data,H,E,S,+name.slice(4)-1);}
    else if(HI[name]){img=g.createImageData(S,S);HI[name](img.data,H,E,S,i);}
    else{g.clearRect(0,0,S,S);g.imageSmoothingEnabled=SOFT.has(name);g.drawImage(legacy,(i%ATLAS_N)*ATLAS_PX,((i/ATLAS_N)|0)*ATLAS_PX,ATLAS_PX,ATLAS_PX,0,0,S,S);img=g.getImageData(0,0,S,S);
      const d=img.data;for(let k=0;k<S*S;k++){H[k]=(d[k*4]*.3+d[k*4+1]*.55+d[k*4+2]*.15)/255;if(name=='doorlit'&&d[k*4]>200&&d[k*4+1]>150)E[k]=1;}
      if(GLASSY.has(name))for(let k=0;k<S*S;k++){const r=d[k*4],gg=d[k*4+1],b=d[k*4+2];if(b>r+25&&b>gg)E[k]=1;}}
    alb.set(img.data,i*S*S*4);const [rough,,bump]=matOf(name),st=bump*S/64;
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=y*S+x,hx=H[y*S+(x+1)%S]-H[y*S+(x+S-1)%S],hy=H[((y+1)%S)*S+x]-H[((y+S-1)%S)*S+x];
      let nx=-hx*st,ny=hy*st;const l=Math.hypot(nx,ny,1);nx/=l;ny/=l;const o=(i*S*S+k)*4;
      nrm[o]=(nx*.5+.5)*255;nrm[o+1]=(ny*.5+.5)*255;nrm[o+2]=Math.min(255,Math.max(0,(rough+(H[k]-.5)*.15)*255));nrm[o+3]=E[k]*255;}}
  return{alb,nrm,S,N};}
const SOFT=new Set(['leaves','leaves2','grass','grass2','dirt','sand','rock','bark','hair','water']);
const GLASSY=new Set(['marquee']);

/* ---------- tileable noise ---------- */
function vnoise(x,y,f,seed){const xi=Math.floor(x*f),yi=Math.floor(y*f),xf=x*f-xi,yf=y*f-yi,h=(a,b)=>hash(((a%f)+f)%f,((b%f)+f)%f,seed)/4294967296,
  s=t=>t*t*(3-2*t),u=s(xf),v=s(yf);return(h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v;}
function fbm(x,y,f,oct,seed){let a=.5,t=0,n=0;for(let o=0;o<oct;o++){t+=vnoise(x,y,f<<o,seed+o*17)*a;n+=a;a*=.5;}return t/n;}
// distance to the nearest and second-nearest jittered point on an n x n tiling grid
function cells(x,y,n,seed){let d1=9,d2=9,id=0;const gx=Math.floor(x*n),gy=Math.floor(y*n);
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=gx+i,cy=gy+j,w=hash(((cx%n)+n)%n,((cy%n)+n)%n,seed),px=(cx+.2+.6*((w&1023)/1023))/n,py=(cy+.2+.6*(((w>>10)&1023)/1023))/n,d=Math.hypot(x-px,y-py);
    if(d<d1){d2=d1;d1=d;id=w;}else if(d<d2)d2=d;}return[d1*n,d2*n,id];}
const hex=h=>rgb(h).map(v=>v*255);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const put=(D,k,c,a)=>{D[k*4]=c[0];D[k*4+1]=c[1];D[k*4+2]=c[2];D[k*4+3]=a==null?255:a;};
function each(D,H,S,fn){for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=y*S+x,r=fn(x/S,y/S,k);put(D,k,r[0],r[2]);H[k]=r[1];}}
function brickPat(u,v,rows,cols,mort,seed){const r=Math.floor(v*rows),off=r&1?.5/cols:0,c=Math.floor((u+off)*cols),fu=(u+off)*cols-c,fv=v*rows-r;
  const m=Math.min(fu,1-fu)/cols*rows*.5,e=Math.min(m,Math.min(fv,1-fv));return{e,id:hash(((c%cols)+cols)%cols,r,seed),edge:e<mort};}
function windowArt(D,H,E,S,lit,x0,y0,x1,y1){for(let y=Math.floor(y0*S);y<y1*S;y++)for(let x=Math.floor(x0*S);x<x1*S;x++){const k=y*S+x,u=(x/S-x0)/(x1-x0),v=(y/S-y0)/(y1-y0);
  const frame=u<.08||u>.92||v<.06||v>.94,mull=Math.abs(u-.5)<.035||Math.abs(v-.5)<.03,sill=v>.94;
  if(frame||mull){put(D,k,sill?hex('#d8ccb0'):hex('#e8e0cc'));H[k]=.75;continue;}
  const gl=lit?mix(hex('#ffd890'),hex('#f8a848'),v):mix(hex('#5a7ab0'),hex('#1a2440'),v*.8+fbm(u,v,4,2,9)*.3);const refl=lit?0:Math.max(0,1-Math.abs(u+v*.6-.55)*6)*.25;
  put(D,k,mix(gl,[255,255,255],refl));H[k]=.3;if(lit)E[k]=1;}}
const HI={
  grass(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,4,3),b=fbm(u,v,32,2,5),blade=Math.pow(Math.abs(Math.sin((u*37+fbm(u,v,8,2,8)*3)*6.283)),12)*.4,dry=Math.max(0,fbm(u,v,2,3,6)-.55)*1.6;
    return[mix(mix(mix(hex('#34502a'),hex('#566e38'),n),hex('#6e7e44'),blade*b),hex('#80784c'),dry),n*.6+blade*.4];});},
  grass2(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,4,13),b=Math.pow(Math.abs(Math.sin((v*41+fbm(u,v,8,2,14)*3)*6.283)),12)*.35;return[mix(mix(hex('#384e2c'),hex('#5a7038'),n),hex('#6e8040'),b),n*.6+b];});},
  flowers(D,H,E,S){HI.grass(D,H,E,S);for(let i=0;i<22;i++){const h=hash(i,3,77),cx=(h&255)/255,cy=((h>>8)&255)/255,c=hex(['#f0e060','#ffffff','#e86890','#c890f0'][i%4]),r=S*.028;
      for(let y=-r*2;y<=r*2;y++)for(let x=-r*2;x<=r*2;x++){const d=Math.hypot(x,y);if(d>r*1.6)continue;const px=((Math.round(cx*S+x)%S)+S)%S,py=((Math.round(cy*S+y)%S)+S)%S,k=py*S+px;put(D,k,d<r*.5?hex('#f8d040'):c);H[k]=1;}}},
  dirt(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,5,21),c=cells(u,v,10,6),peb=c[0]<.28?(.28-c[0])*3:0;return[mix(mix(hex('#5e4428'),hex('#8a6a44'),n),hex('#a0927e'),peb),n*.6+peb];});},
  sand(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,8,4,31),rip=Math.sin((v*7+fbm(u,v,2,2,32)*1.5)*6.283)*.5+.5;return[mix(hex('#c8ac74'),hex('#ead6a4'),n*.6+rip*.4),rip*.5+n*.5];});},
  cobble(D,H,E,S){each(D,H,S,(u,v)=>{const [d1,d2,id]=cells(u,v,10,41),e=d2-d1,stone=Math.min(1,e*4),n=fbm(u,v,16,3,42);
    const c=mix(hex(['#86808a','#7a7480','#948e98','#6e6874','#8a8070'][id%5]),hex('#5a5660'),n*.4);return[e<.08?hex('#3a363e'):mix(c,[200,195,200],Math.max(0,.3-d1)*.4),e<.08?0:Math.sqrt(stone)*.8+n*.2];});},
  sidewalk(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,16,4,51),seam=Math.min(u,1-u,v,1-v,Math.abs(u-.5),Math.abs(v-.5))<.012;return[seam?hex('#8a8478'):mix(hex('#a8a296'),hex('#c8c2b8'),n),seam?0:.6+n*.4];});},
  concrete(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,16,4,61),crack=Math.abs(fbm(u,v,3,3,62)-.5)<.006;return[crack?hex('#6a6a6a'):mix(hex('#9a9a9c'),hex('#bcbcbe'),n),crack?.2:.6+n*.4];});},
  brick(D,H,E,S,i,lit){each(D,H,S,(u,v)=>{const b=brickPat(u,v,24,6,.07,71),n=fbm(u,v,16,3,72);if(b.edge)return[mix(hex('#8a8278'),hex('#a8a096'),n),.1];
    const base=mix(hex(['#a24a38','#8e4030','#b05442','#9a4636','#a85040'][b.id%5]),hex('#6a2a20'),fbm(u,v,8,3,b.id%97)*.4);return[mix(base,hex('#c8907a'),Math.max(0,n-.65)),.55+Math.min(.4,b.e*12)*.6+n*.15];});},
  brickwin(D,H,E,S,i){HI.brick(D,H,E,S,i);windowArt(D,H,E,S,false,.25,.18,.75,.82);},
  brickwin2(D,H,E,S,i){HI.brick(D,H,E,S,i);windowArt(D,H,E,S,true,.25,.18,.75,.82);},
  storefront(D,H,E,S,i){HI.brick(D,H,E,S,i);for(let y=0;y<S*.25;y++)for(let x=0;x<S;x++){const k=y*S+x;put(D,k,(Math.floor(x/S*8)&1)?hex('#f4f0e8'):hex('#c82840'));H[k]=.8-y/S;}windowArt(D,H,E,S,false,.08,.32,.92,.98);},
  stone(D,H,E,S){each(D,H,S,(u,v)=>{const b=brickPat(u,v,4,2,.03,81),n=fbm(u,v,16,4,82);if(b.edge)return[hex('#4e4844'),.1];return[mix(hex(['#8a8480','#7e7874','#968e88','#86807c'][b.id%4]),hex('#5a5450'),n*.5),.5+Math.min(.3,b.e*6)+n*.25];});},
  stonewall(D,H,E,S,i){HI.stone(D,H,E,S,i);each2(D,H,S,(u,v,k)=>{const m=fbm(u,v,8,3,83);if(v<.08+m*.1){put(D,k,mix(hex('#3e7a32'),hex('#5e9a44'),m));H[k]=.9;}});},
  qwall(D,H,E,S){each(D,H,S,(u,v)=>{const b=brickPat(u,v,3,2,.03,91),n=fbm(u,v,16,4,92),moss=Math.max(0,fbm(u,v,4,3,93)-.6)*2;if(b.edge)return[hex('#2e2a28'),0];
    return[mix(mix(hex('#6e6660'),hex('#4a4440'),n),hex('#3a5030'),moss),.45+Math.min(.35,b.e*6)+n*.25];});},
  floor(D,H,E,S){each(D,H,S,(u,v)=>{const b=brickPat(u,v,2,2,.02,101),n=fbm(u,v,16,4,102);if(b.edge)return[hex('#3a3632'),0];return[mix(hex(['#7a726a','#6e665e','#847c72'][b.id%3]),hex('#4e4840'),n*.5),.5+Math.min(.3,b.e*5)+n*.2];});},
  roof(D,H,E,S){each(D,H,S,(u,v)=>{const r=Math.floor(v*6),off=r&1?.08:0,c=Math.floor((u+off)*7),fv=v*6-r,n=fbm(u,v,16,3,111),id=hash(c,r,112);
    const edge=fv>.9||((u+off)*7-c)<.05;return[edge?hex('#24202a'):mix(hex(['#4a4450','#423c48','#524c58'][id%3]),hex('#2e2a36'),fv*.4+n*.3),edge?0:.4+fv*.5+n*.1];});},
  planks(D,H,E,S){each(D,H,S,(u,v)=>{const r=Math.floor(v*4),fv=v*4-r,gr=fbm(u*.25,v*4,8,4,121+r),knot=cells(u,v,3,122+r)[0]<.08;const gap=fv<.05;
    return[gap?hex('#3a2410'):mix(mix(hex('#7a5428'),hex('#a07a4a'),gr),hex('#4e3418'),knot?.6:0),gap?0:.5+gr*.4];});},
  wood(D,H,E,S){each(D,H,S,(u,v)=>{const gr=fbm(u*4,v*.5,8,4,131);return[mix(hex('#6a4420'),hex('#9a6e3e'),gr),gr];});},
  woodfl(D,H,E,S){each(D,H,S,(u,v)=>{const c=Math.floor(u*5),fu=u*5-c,off=(hash(c,1,141)%100)/100,gr=fbm(u*5,v+off,8,4,142+c),gap=fu<.04||Math.abs(((v+off)%1)-.5)<.01;
    return[gap?hex('#3a2414'):mix(hex(['#8a5a30','#7a4e28','#946438'][c%3]),hex('#5a3a1c'),gr*.6),gap?0:.6+gr*.3];});},
  tilefl(D,H,E,S){each(D,H,S,(u,v)=>{const c=Math.floor(u*4),r=Math.floor(v*4),fu=u*4-c,fv=v*4-r,gr=Math.min(fu,1-fu,fv,1-fv)<.05,n=fbm(u,v,16,3,151);
    return[gr?hex('#8a8478'):((c+r)&1?mix(hex('#e8e4dc'),hex('#d8d2c6'),n):mix(hex('#3a3a44'),hex('#2a2a32'),n)),gr?.1:.7];});},
  marble(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,5,161),vein=Math.pow(1-Math.abs(Math.sin((u*2+v+n*2.5)*6.283)),18);return[mix(mix(hex('#ece8de'),hex('#d4d0c6'),n),hex('#9a968c'),vein*.7),.5+n*.2-vein*.2];});},
  plaster(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,8,5,171);return[mix(hex('#d8ccb4'),hex('#e8dcc4'),n),n];});},
  bark(D,H,E,S){each(D,H,S,(u,v)=>{const ridge=Math.pow(Math.abs(Math.sin((u*6+fbm(u,v,4,3,181)*1.5)*6.283)),.6),n=fbm(u,v,16,3,182);return[mix(hex('#3a2818'),hex('#6a4e34'),ridge*.7+n*.3),ridge*.8+n*.2];});},
  leaves(D,H,E,S){const fall=[8,9,10].includes(new Date().getMonth()),spring=[2,3,4].includes(new Date().getMonth());
    each(D,H,S,(u,v)=>{const [d1,,id]=cells(u,v,9,191),lf=Math.max(0,1-d1*2.2),n=fbm(u,v,8,3,192);
      const pal=fall?['#c86a28','#a8442a','#d8a038','#8a5a20','#b88a30']:['#3e8a3a','#2f6a2e','#4e9a44','#245426','#58a046'];let c=mix(hex(pal[id%5]),hex(fall?'#5a2a10':'#14321a'),(1-lf)*.7);
      if(spring&&id%11==0)c=mix(c,hex('#f8c0d8'),lf);return[mix(c,[255,255,220],Math.max(0,lf-.8)*.6*n),lf*.8+n*.2];});},
  leaves2(D,H,E,S){each(D,H,S,(u,v)=>{const [d1,,id]=cells(u,v,11,201),lf=Math.max(0,1-d1*2.2),n=fbm(u,v,8,3,202);return[mix(hex(['#58a046','#3a7a30','#6ab052','#2a5e24'][id%4]),hex('#183c18'),(1-lf)*.6),lf*.8+n*.2];});},
  rock(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,5,211),c=cells(u,v,4,212),crack=c[1]-c[0]<.06;return[crack?hex('#3e3a3e'):mix(hex('#6e6a70'),hex('#a09ca0'),n),crack?.1:n];});},
  rubble(D,H,E,S){each(D,H,S,(u,v)=>{const [d1,d2,id]=cells(u,v,7,221),e=d2-d1,n=fbm(u,v,16,3,222);return[e<.06?hex('#3a3430'):mix(hex(['#8a8078','#7a7068','#a09486'][id%3]),hex('#5a524a'),n*.5),e<.06?0:Math.min(1,e*3)];});},
  steps(D,H,E,S){each(D,H,S,(u,v)=>{const r=Math.floor(v*4),fv=v*4-r,n=fbm(u,v,16,3,231);return[mix(fv<.15?hex('#c4bec2'):fv>.88?hex('#5a5458'):hex('#9a9498'),hex('#7a7478'),n*.3),fv<.15?1:fv>.88?.2:.7];});},
  column(D,H,E,S){each(D,H,S,(u,v)=>{const fl=Math.pow(Math.abs(Math.sin(u*8*Math.PI)),.5),n=fbm(u,v,8,4,241);return[mix(hex('#d8d2c4'),hex('#f2eee4'),fl*.6+n*.4),fl];});},
};
Object.assign(HI,{
  cloth(D,H,E,S){each(D,H,S,(u,v)=>{const w=(Math.sin(u*S*2.9)*.5+.5)*(Math.sin(v*S*2.9+1.5)*.5+.5),n=fbm(u,v,4,4,301),fold=fbm(u*.5,v*2,4,3,303);return[mix([206,206,204],[238,238,234],n*.5+w*.15+fold*.35),fold*.7+w*.3];});},
  knit(D,H,E,S){each(D,H,S,(u,v)=>{const row=v*S/4,col=u*S/3,k=Math.abs(Math.sin(col*Math.PI+(Math.floor(row)&1)*1.5))*Math.abs(Math.sin(row*Math.PI)),n=fbm(u,v,8,3,311);return[mix([170,170,168],[232,232,228],k*.7+n*.3),k];});},
  denim(D,H,E,S){each(D,H,S,(u,v)=>{const tw=Math.sin((u+v)*S*1.1)*.5+.5,n=fbm(u,v,4,4,321),fade=fbm(u,v,2,3,322);return[mix([150,160,178],[220,226,236],tw*.35+n*.35+fade*.3),tw*.5+n*.5];});},
  leather(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,16,4,331),c=cells(u,v,10,332),cr=c[1]-c[0]<.05?.3:0;return[mix([150,146,142],[210,206,200],n-cr),n-cr];});},
  skin(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,8,4,341),pore=vnoise(u,v,64,342);return[mix([226,222,220],[250,246,244],n*.7+pore*.3),pore*.6+n*.4];});},
  hairs(D,H,E,S){each(D,H,S,(u,v)=>{const st=fbm(u*8,v*.6,8,3,351),fine=Math.sin((u*S*.9+fbm(u,v,4,2,352)*8))*.5+.5;return[mix([130,128,126],[235,232,228],st*.6+fine*.4),st*.5+fine*.5];});},
  brass(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,8,4,361);return[mix(hex('#8a6a28'),hex('#d8b060'),n),n];});},
  asphalt(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,8,4,371),agg=vnoise(u,v,96,372),sp=agg>.82?.25:0,crack=Math.abs(fbm(u,v,3,3,373)-.5)<.005,stain=Math.max(0,fbm(u,v,2,3,374)-.6)*1.5;
    return[crack?[30,30,32]:mix(mix([58,58,62],[92,92,96],n*.6+agg*.4),[150,150,150],sp).map(x=>x*(1-stain*.5)),crack?0:agg*.6+n*.4];});},
  gravel(D,H,E,S){each(D,H,S,(u,v)=>{const [d1,d2,id]=cells(u,v,14,381),e=d2-d1,n=fbm(u,v,8,3,382);return[e<.1?mix(hex('#6a5e50'),hex('#4a4036'),n):mix(hex(['#b8ad9c','#9c9284','#c8bfae','#8a8070'][id%4]),hex('#7a7060'),n*.4),Math.min(1,e*2.5)];});},
  bricksw(D,H,E,S){each(D,H,S,(u,v)=>{// worn brick paving in running bond, like the old sidewalks in the Fan
    const b=brickPat(u,v,18,5,.06,391),n=fbm(u,v,16,3,392),moss=Math.max(0,fbm(u,v,4,3,393)-.62)*1.5;if(b.edge)return[mix(hex('#7a7068'),hex('#4a5a3a'),moss),.1];
    return[mix(mix(hex(['#8e4a38','#a05a44','#7e4234','#965240','#86503e'][b.id%5]),hex('#5a3226'),n*.35),hex('#8a8478'),fbm(u,v,8,2,394)*.2),.6+Math.min(.3,b.e*8)+n*.1];});},
  rails(D,H,E,S){HI.asphalt(D,H,E,S);each2(D,H,S,(u,v,k)=>{for(const r of [.27,.73]){const d=Math.abs(u-r);if(d<.018){put(D,k,mix([120,118,116],[190,188,186],1-d/.018));H[k]=.9;}else if(d<.03){put(D,k,[40,40,42]);H[k]=.1;}}});},
  curb(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,16,4,401),sp=vnoise(u,v,64,402);return[mix([120,120,124],[178,176,172],n*.5+sp*.5),n];});},
  granite(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,16,4,411),sp=vnoise(u,v,96,412);return[mix(mix([150,146,142],[196,192,188],n),[60,58,60],sp>.8?.6:0),n*.5+sp*.5];});},
  mulch(D,H,E,S){each(D,H,S,(u,v)=>{const ch=Math.pow(Math.abs(Math.sin((u*9+fbm(u,v,8,3,421)*2)*6.283)),3),n=fbm(u,v,16,3,422);return[mix(hex('#3a2416'),hex('#7a5034'),ch*.6+n*.4),ch];});},
  leafcard(D,H,E,S){// a cluster of leaves on a clear background, for tree crowns built from cards
    for(let k=0;k<S*S;k++){D[k*4+3]=0;}const fall=[8,9,10].includes(new Date().getMonth());
    for(let i=0;i<90;i++){const h=hash(i,7,431),cx=.08+((h&1023)/1023)*.84,cy=.08+(((h>>10)&1023)/1023)*.84,ang=((h>>20)%628)/100,L=.07+((h>>4)%40)/800,W=L*.45,
      pal=fall?['#b85a24','#a8442a','#c8902c','#8a5a20','#9a7a2a']:['#3e7a30','#2f6228','#4c8a38','#2a5424','#58903e'],c=hex(pal[i%5]);
      for(let y=Math.floor((cy-L)*S);y<(cy+L)*S;y++)for(let x=Math.floor((cx-L)*S);x<(cx+L)*S;x++){if(x<0||y<0||x>=S||y>=S)continue;const dx=x/S-cx,dy=y/S-cy,a=dx*Math.cos(ang)+dy*Math.sin(ang),b=-dx*Math.sin(ang)+dy*Math.cos(ang);
        const t=a/L;if(Math.abs(t)>1)continue;const half=W*Math.sqrt(Math.max(0,1-t*t))*(1-t*.2);if(Math.abs(b)>half)continue;const k=y*S+x,vein=Math.abs(b)<half*.12?.85:1,sh=.75+.25*(1-Math.abs(b)/half);
        put(D,k,c.map(q=>Math.min(255,q*sh*vein*(1+(t+1)*.1))),255);H[k]=.5+.5*(1-Math.abs(b)/half);}}},
  needles(D,H,E,S){for(let k=0;k<S*S;k++)D[k*4+3]=0;for(let i=0;i<260;i++){const h=hash(i,9,441),x0=((h&1023)/1023)*S,y0=(((h>>10)&1023)/1023)*S,a=((h>>20)%628)/100,L=S*.08,c=hex(['#24482a','#2e5630','#1e3e24'][i%3]);
    for(let t=0;t<L;t++){const x=Math.round(x0+Math.cos(a)*t),y=Math.round(y0+Math.sin(a)*t);if(x<0||y<0||x>=S||y>=S)continue;const k=y*S+x;put(D,k,c,255);H[k]=1;if(x+1<S){put(D,k+1,c,255);}}}}
});
Object.assign(HI,{
  pane(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,3,451),cur=Math.abs(u-.5)>.36?.35:0;return[mix(mix([22,28,40],[44,54,72],v*.6+n*.4),[120,110,96],cur*.5),.5];});},
  panelit(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,3,461),cur=Math.abs(u-.5)>.33?.55:0;return[mix(mix([255,206,140],[220,150,80],v*.7+n*.3),[150,90,50],cur),.5];});for(let k=0;k<S*S;k++)E[k]=1;}
});
Object.assign(HI,{
  fur(D,H,E,S){each(D,H,S,(u,v)=>{const st=fbm(u*2,v*10,8,4,471),n=fbm(u,v,4,3,472);return[mix([150,146,140],[232,228,222],st*.7+n*.3),st];});},
  feather(D,H,E,S){each(D,H,S,(u,v)=>{const [d1,d2]=cells(u*2%1,v,14,481),e=Math.min(1,(d2-d1)*3),n=fbm(u,v,8,3,482);return[mix([186,182,176],[236,232,226],e*.45+n*.55),e*.6+n*.4];});},
  carapace(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,6,5,491),c=cells(u,v,5,492),pit=Math.max(0,.15-c[0])*4;return[mix([170,174,170],[230,232,226],n-pit*.5),n-pit];});},
  paint(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,3,501);return[mix([228,228,228],[245,245,245],n),.5];});},
  tire(D,H,E,S){each(D,H,S,(u,v)=>{const tr=Math.abs(Math.sin(u*S*.35))>.6&&Math.abs(v-.5)<.38?1:0,n=fbm(u,v,16,2,511);return[mix([30,30,32],[52,52,54],n+tr*.3),.4+tr*.4];});},
  chrome(D,H,E,S){each(D,H,S,(u,v)=>{const n=fbm(u,v,4,3,521);return[mix([200,204,210],[240,242,246],n),.5];});}
});
function each2(D,H,S,fn){for(let y=0;y<S;y++)for(let x=0;x<S;x++)fn(x/S,y/S,y*S+x);}

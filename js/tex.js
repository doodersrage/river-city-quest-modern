"use strict";
/* River City Quest 3D: hand-painted 32x32 texture cells, generated at startup into one atlas,
   plus a separate tiling water texture. Small, noisy and a little dirty, like PS1 textures. */
function makeAtlas(){
  const P=ATLAS_PX,cv=document.createElement('canvas');cv.width=cv.height=ATLAS_N*P;const g=cv.getContext('2d');
  let seed=1;const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const noise=(x,y,cols,n)=>{for(let i=0;i<n;i++)R(x+(rnd()*P|0),y+(rnd()*P|0),1+(rnd()*2|0),1,cols[rnd()*cols.length|0]);};
  const bricks=(x,y,base,mort,hi,rows)=>{R(x,y,P,P,mort);const rh=P/rows;for(let r=0;r<rows;r++)for(let i=-1;i<4;i++){const bx=i*11+(r&1?5:0),c=[base,hi,base][(rnd()*3)|0];R(x+bx+1,y+r*rh+1,10,rh-2,c);R(x+bx+1,y+r*rh+1,10,1,hi);}};
  const window=(x,y,wx,wy,ww,wh,lit)=>{R(x+wx-1,y+wy-1,ww+2,wh+2,'#e8dcc0');R(x+wx,y+wy,ww,wh,lit?'#f8d060':'#26385c');R(x+wx+(ww>>1),y+wy,1,wh,'#e8dcc0');R(x+wx,y+wy+(wh>>1),ww,1,'#e8dcc0');if(!lit)R(x+wx+1,y+wy+1,2,1,'#7a98c8');};
  const D={
    grass(x,y){R(x,y,P,P,'#4f8a3a');noise(x,y,['#3f7a30','#5e9a44','#6aa84c','#386a2a'],140);},
    grass2(x,y){R(x,y,P,P,'#548e3c');noise(x,y,['#447e32','#62a046','#3c702c'],120);for(let i=0;i<6;i++)R(x+(rnd()*30|0),y+(rnd()*30|0),1,3,'#7ab858');},
    flowers(x,y){D.grass(x,y);for(let i=0;i<10;i++){const c=['#f0e060','#ffffff','#e86890','#c890f0'][i%4],a=rnd()*28|0,b=rnd()*28|0;R(x+a,y+b,2,2,c);R(x+a,y+b+2,1,1,'#2e6a28');}},
    dirt(x,y){R(x,y,P,P,'#7a5a3a');noise(x,y,['#6a4a2e','#8a6a44','#5e4428'],160);},
    sand(x,y){R(x,y,P,P,'#d8c08a');noise(x,y,['#c8ac74','#e8d4a0','#b89c66'],160);},
    cobble(x,y){R(x,y,P,P,'#4e4a52');for(let r=0;r<5;r++)for(let i=0;i<5;i++){const c=['#86808a','#7a7480','#948e98','#6e6874'][(rnd()*4)|0];R(x+i*7-(r&1?3:0)+1,y+r*7-1+1,6,5,c);R(x+i*7-(r&1?3:0)+1,y+r*7,6,1,'#a8a2aa');}},
    sidewalk(x,y){R(x,y,P,P,'#b4aea2');noise(x,y,['#a8a296','#c0bab0','#9c968a'],90);R(x,y+15,P,1,'#8a8478');R(x+15,y,1,P,'#8a8478');R(x,y,P,1,'#8a8478');R(x,y,1,P,'#8a8478');},
    steps(x,y){for(let i=0;i<4;i++){R(x,y+i*8,P,8,'#9a9498');R(x,y+i*8,P,2,'#c4bec2');R(x,y+i*8+7,P,1,'#5a5458');}},
    rails(x,y){D.dirt(x,y);for(let i=0;i<4;i++)R(x+1,y+i*8+2,30,3,'#5a3e26');R(x+7,y,2,P,'#9a9aa4');R(x+23,y,2,P,'#9a9aa4');},
    planks(x,y){R(x,y,P,P,'#8a6234');for(let i=0;i<4;i++){R(x,y+i*8,P,1,'#4e341a');R(x+((i*13)%28),y+i*8+3,1,1,'#3a2410');}noise(x,y,['#9a7244','#7a5428'],60);},
    brick(x,y){bricks(x,y,'#a24a38','#6e3226','#b85c48',8);},
    brickwin(x,y){D.brick(x,y);window(x,y,8,6,16,20,false);},
    brickwin2(x,y){D.brick(x,y);window(x,y,8,6,16,20,true);},
    storefront(x,y){D.brick(x,y);R(x+1,y+2,30,6,'#6c1c2c');for(let i=1;i<31;i+=4)R(x+i,y+2,2,6,i%8<4?'#e83048':'#f4f0e8');R(x+3,y+11,26,20,'#26385c');R(x+3,y+11,26,2,'#f4f0e8');R(x+15,y+11,2,20,'#f4f0e8');R(x+5,y+14,6,4,'#5a78a8');},
    roof(x,y){R(x,y,P,P,'#4a4450');noise(x,y,['#3c3644','#58525e','#2e2a36'],180);for(let i=0;i<P;i+=8)R(x,y+i,P,1,'#2e2a36');},
    tin(x,y){R(x,y,P,P,'#7a8a96');for(let i=0;i<P;i+=4){R(x+i,y,1,P,'#9aaab6');R(x+i+2,y,1,P,'#5a6a76');}},
    stone(x,y){R(x,y,P,P,'#6a6460');for(let r=0;r<4;r++)for(let i=-1;i<3;i++){const bx=i*14+(r&1?7:0);R(x+bx+1,y+r*8+1,12,6,['#8a8480','#7e7874','#968e88'][(rnd()*3)|0]);}},
    stonewall(x,y){D.stone(x,y);R(x,y,P,3,'#4c8a3c');R(x,y+3,P,1,'#2e5a24');},
    marble(x,y){R(x,y,P,P,'#e4e0d6');noise(x,y,['#d4d0c6','#f4f2ea','#c8c4ba'],80);R(x+3,y+5,10,1,'#bcb8ae');R(x+18,y+20,9,1,'#bcb8ae');},
    column(x,y){R(x,y,P,P,'#d8d4ca');for(let i=2;i<P;i+=6){R(x+i,y,3,P,'#f4f2ec');R(x+i+3,y,1,P,'#a8a49a');}},
    white(x,y){R(x,y,P,P,'#ffffff');},
    door(x,y){R(x,y,P,P,'#2a1a14');R(x+3,y+3,26,29,'#5e3a1e');R(x+5,y+5,10,12,'#4a2c14');R(x+17,y+5,10,12,'#4a2c14');R(x+5,y+19,10,12,'#4a2c14');R(x+17,y+19,10,12,'#4a2c14');R(x+24,y+18,2,2,'#f2c14e');},
    doorlit(x,y){R(x,y,P,P,'#2a1a14');R(x+3,y+3,26,29,'#14100c');R(x+5,y+8,22,24,'#f8d060');R(x+5,y+8,22,2,'#fff2a8');},
    bark(x,y){R(x,y,P,P,'#5a3e26');for(let i=0;i<P;i+=3)R(x+i,y,1,P,'#3e2a18');noise(x,y,['#6e4e30','#4a321e'],40);},
    leaves(x,y){const m=new Date().getMonth();if(m>=8&&m<=10){R(x,y,P,P,'#a8542a');noise(x,y,['#d07a2a','#8a3a1a','#e0a040','#6a3a18','#c8b040'],260);}
      else if(m>=2&&m<=4){R(x,y,P,P,'#3a7a32');noise(x,y,['#58a046','#2f6a2e','#f8b8d0','#ffffff'],240);}else{R(x,y,P,P,'#2f6a2e');noise(x,y,['#3e8a3a','#245426','#4e9a44','#1e4420'],260);}},
    leaves2(x,y){R(x,y,P,P,'#3a7a30');noise(x,y,['#58a046','#2a5e24','#6ab052'],240);},
    rock(x,y){R(x,y,P,P,'#7a7a80');noise(x,y,['#8e8e96','#66666e','#a0a0a8','#5a5a62'],220);},
    fence(x,y){g.clearRect(x,y,P,P);R(x,y+2,P,2,'#1e1c24');R(x,y+24,P,2,'#1e1c24');for(let i=1;i<P;i+=5){R(x+i,y,2,P,'#1e1c24');R(x+i,y,2,2,'#5a5662');}},
    floor(x,y){R(x,y,P,P,'#5a5650');for(let r=0;r<2;r++)for(let i=0;i<2;i++){R(x+i*16+1,y+r*16+1,14,14,['#6e6a62','#66625a','#76726a'][(rnd()*3)|0]);}noise(x,y,['#4a4640','#807c74'],60);},
    qwall(x,y){R(x,y,P,P,'#6a6670');noise(x,y,['#7e7a84','#56525c','#8a8690','#4a4650'],300);for(let i=0;i<3;i++)R(x,y+(rnd()*P|0),P,1,'#4a4650');},
    rubble(x,y){D.qwall(x,y);for(let i=0;i<8;i++)R(x+(rnd()*24|0),y+(rnd()*24|0),6,5,['#8e8e96','#5a5a62'][i&1]);},
    crack(x,y){D.qwall(x,y);g.strokeStyle='#1a1820';g.lineWidth=2;g.beginPath();g.moveTo(x+16,y+2);g.lineTo(x+12,y+12);g.lineTo(x+19,y+18);g.lineTo(x+13,y+30);g.stroke();},
    sign(x,y){R(x,y,P,P,'#1e1c24');R(x+1,y+1,30,30,'#2a4a3a');R(x+3,y+3,26,26,'#356a4e');R(x+6,y+5,20,2,'#f2c14e');for(let i=0;i<5;i++)R(x+5,y+10+i*4,22-(i*3)%7,1,'#e8e0b8');},
    gold(x,y){R(x,y,P,P,'#d8a830');noise(x,y,['#f2c14e','#b8882a','#fff0a0'],80);},
    glass(x,y){R(x,y,P,P,'#88b8d8');R(x+4,y+4,8,2,'#e8f8ff');R(x+6,y+8,4,2,'#e8f8ff');},
    wood(x,y){R(x,y,P,P,'#7a5230');for(let i=0;i<P;i+=6)R(x,y+i,P,1,'#5a3a1e');noise(x,y,['#8a6240','#6a4428'],50);},
    black(x,y){R(x,y,P,P,'#14121a');},
    clock(x,y){R(x,y,P,P,'#b05a40');g.fillStyle='#f4f2ec';g.beginPath();g.arc(x+16,y+16,13,0,6.283);g.fill();R(x+15,y+6,2,11,'#1a1423');R(x+15,y+15,8,2,'#1a1423');},
    copper(x,y){R(x,y,P,P,'#6aa08e');noise(x,y,['#7ab8a2','#4e8a78','#8acab2'],120);},
    chest(x,y){R(x,y,P,P,'#6a4220');R(x,y+12,P,3,'#d8a830');R(x+13,y+10,6,8,'#d8a830');R(x+15,y+13,2,3,'#3a2410');for(let i=0;i<P;i+=8)R(x+i,y,1,P,'#4a2c14');},
    face(x,y){R(x,y,P,P,'#e8b890');R(x+7,y+12,5,6,'#1a1423');R(x+20,y+12,5,6,'#1a1423');R(x+8,y+13,2,2,'#ffffff');R(x+21,y+13,2,2,'#ffffff');R(x+12,y+23,8,2,'#a85a48');R(x+5,y+19,4,2,'#f0a088');R(x+23,y+19,4,2,'#f0a088');},
    eyes(x,y){g.clearRect(x,y,P,P);R(x+5,y+7,8,2,'#3a2414');R(x+19,y+7,8,2,'#3a2414');R(x+6,y+11,7,9,'#ffffff');R(x+19,y+11,7,9,'#ffffff');R(x+8,y+12,5,8,'#2a1a14');R(x+19,y+12,5,8,'#2a1a14');
      R(x+9,y+13,2,2,'#ffffff');R(x+20,y+13,2,2,'#ffffff');R(x+12,y+26,8,1,'#b0605a');R(x+11,y+25,1,1,'#b0605a');R(x+20,y+25,1,1,'#b0605a');},
    awning(x,y){for(let i=0;i<P;i+=8){R(x+i,y,4,P,'#d83040');R(x+i+4,y,4,P,'#f4f0e8');}R(x,y+P-3,P,3,'#8a1424');},
    awning2(x,y){for(let i=0;i<P;i+=8){R(x+i,y,4,P,'#2e7d4f');R(x+i+4,y,4,P,'#f4f0e8');}R(x,y+P-3,P,3,'#1c4a2e');},
    sign2(x,y){R(x,y,P,P,'#1e6a3a');R(x+1,y+1,30,30,'#2e8a4e');R(x+3,y+12,26,8,'#2e8a4e');for(let i=0;i<5;i++)R(x+5+i*5,y+13,3,6,'#f4f4f0');R(x+1,y+1,30,1,'#f4f4f0');R(x+1,y+30,30,1,'#f4f4f0');},
    grille(x,y){R(x,y,P,P,'#2a2a30');for(let i=2;i<P;i+=4)R(x+i,y+4,2,24,'#8a8a94');R(x,y+2,P,2,'#c8c8d0');R(x,y+28,P,2,'#c8c8d0');R(x+2,y+12,6,6,'#fff2a8');R(x+24,y+12,6,6,'#fff2a8');},
    tuft(x,y){g.clearRect(x,y,P,P);for(let i=0;i<14;i++){const bx=2+(rnd()*28|0),h=10+(rnd()*20|0),c=['#5e9a44','#4f8a3a','#7ab858','#3f7a30'][i%4];for(let k=0;k<h;k++)R(x+bx+Math.round((k/h)*(i%3-1)*3),y+P-1-k,2,1,c);}},
    bloom(x,y){D.tuft(x,y);for(let i=0;i<6;i++){const c=['#f0e060','#ffffff','#e86890','#c890f0','#f08a30'][(rnd()*5)|0],bx=3+(rnd()*24|0),by=3+(rnd()*14|0);R(x+bx-1,y+by,4,2,c);R(x+bx,y+by-1,2,4,c);R(x+bx,y+by,2,2,'#f8e070');}},
    worn(x,y){g.clearRect(x,y,P,P);for(let i=0;i<260;i++){const a=rnd()*6.283,r=Math.sqrt(rnd())*14;if(rnd()<.85)R(x+16+Math.cos(a)*r|0,y+16+Math.sin(a)*r|0,2,1,['#8a6a44','#7a5a3a','#9a7a54','#6a4a2e'][(rnd()*4)|0]);}},
    pigeon(x,y){R(x,y,P,P,'#8a8a96');noise(x,y,['#9a9aa6','#7a7a86','#6a6a76'],80);R(x,y+18,P,6,'#5a8a7a');},
    tilefl(x,y){R(x,y,P,P,'#d8d8d8');for(let r=0;r<2;r++)for(let i=0;i<2;i++){R(x+i*16+1,y+r*16+1,14,14,['#eeeeee','#e4e4e4','#f4f4f4'][(rnd()*3)|0]);}noise(x,y,['#cccccc','#f8f8f8'],40);},
    woodfl(x,y){R(x,y,P,P,'#d8d0c8');for(let i=0;i<4;i++){R(x,y+i*8,P,1,'#a8a098');R(x+((i*11)%28),y+i*8+1,1,7,'#b8b0a8');}noise(x,y,['#e4dcd4','#ccc4bc'],60);},
    plaster(x,y){R(x,y,P,P,'#ececec');noise(x,y,['#e0e0e0','#f6f6f6'],50);R(x,y+P-9,P,9,'#c8c8c8');R(x,y+P-10,P,1,'#ffffff');R(x,y+P-2,P,2,'#a8a8a8');},
    mural(x,y){R(x,y,P,P,'#f4f0e8');const cs=['#e83048','#f2c14e','#3ac2e8','#34c8b0','#b890f8','#f08030','#58a850'];for(let i=0;i<9;i++){g.fillStyle=cs[i%cs.length];g.beginPath();g.arc(x+rnd()*P,y+rnd()*P,4+rnd()*8,0,6.283);g.fill();}for(let i=0;i<4;i++)R(x+(rnd()*24|0),y+(rnd()*28|0),8,3,cs[(rnd()*7)|0]);},
    bars(x,y){g.clearRect(x,y,P,P);for(let i=2;i<P;i+=6)R(x+i,y,3,P,'#3a3a44');R(x,y+3,P,3,'#3a3a44');R(x,y+26,P,3,'#3a3a44');for(let i=2;i<P;i+=6)R(x+i,y,1,P,'#7a7a84');},
    vine(x,y){R(x,y,P,P,'#3a6a2a');for(let i=0;i<5;i++)R(x,y+i*7,P,3,'#58a046');noise(x,y,['#6ab052','#2a5420','#84cc68'],120);},
    marquee(x,y){R(x,y,P,P,'#1a1423');R(x+1,y+3,30,26,'#e8e4dc');for(let i=1;i<P;i+=4){R(x+i,y+1,2,2,'#fff2a8');R(x+i,y+29,2,2,'#fff2a8');}for(let i=0;i<3;i++)R(x+4,y+8+i*6,24-(i*5)%9,3,'#6c1c2c');},
    seat(x,y){R(x,y,P,P,'#8a1c2c');for(let i=0;i<P;i+=8){R(x+i,y,7,P,'#a83040');R(x+i,y,1,P,'#5a1020');}},
    arcade(x,y){R(x,y,P,P,'#2a1a4a');R(x+4,y+4,24,16,'#1a1423');R(x+6,y+6,20,12,['#3ac2e8','#e83048','#58c868'][(rnd()*3)|0]);for(let i=0;i<4;i++)R(x+8+i*4,y+9,2,2,'#fff2a8');R(x+8,y+23,4,4,'#e83048');R(x+18,y+23,4,4,'#f2c14e');},
    engine(x,y){R(x,y,P,P,'#2a2a30');noise(x,y,['#3a3a44','#1e1e24','#4a3a30','#6a4a30'],200);for(let i=0;i<P;i+=10)R(x,y+i,P,2,'#5a5a64');},
    concrete(x,y){R(x,y,P,P,'#9a9a9e');noise(x,y,['#8a8a8e','#aaaaae','#b4b4b8'],120);R(x,y,P,2,'#c8c8cc');R(x+15,y,1,P,'#7a7a80');},
    case(x,y){g.clearRect(x,y,P,P);R(x,y,P,2,'#d8c890');R(x,y+P-2,P,2,'#d8c890');R(x,y,2,P,'#d8c890');R(x+P-2,y,2,P,'#d8c890');g.fillStyle='rgba(180,220,240,.35)';g.fillRect(x+2,y+2,P-4,P-4);R(x+5,y+5,6,2,'#ffffff');},
    hair(x,y){R(x,y,P,P,'#ffffff');noise(x,y,['#dddddd','#c8c8c8'],80);},
    shell(x,y){R(x,y,P,P,'#3a6a34');for(let i=0;i<2;i++)for(let j=0;j<2;j++){R(x+i*16+2,y+j*16+2,12,12,'#5a8a44');R(x+i*16+4,y+j*16+4,8,8,'#6e9e52');}},
    lock(x,y){D.wood(x,y);R(x+10,y+10,12,12,'#d8a830');R(x+14,y+14,4,5,'#1a1423');R(x+12,y+5,8,6,'#9a9aa4');R(x+14,y+7,4,4,'#5e3a1e');},
    clap(x,y){R(x,y,P,P,'#e8d48a');for(let i=0;i<P;i+=4){R(x,y+i,P,1,'#b8a45a');}},
    clap2(x,y){R(x,y,P,P,'#9ab8a0');for(let i=0;i<P;i+=4){R(x,y+i,P,1,'#6c8c74');}window(x,y,9,6,14,18,false);},
    keystone(x,y){R(x,y,P,P,'#9a9aa4');noise(x,y,['#b0b0ba','#7e7e88','#c8c8d0'],160);R(x+8,y+8,16,16,'#f2c14e');R(x+10,y+10,12,12,'#fff2a8');},
    paper(x,y){R(x,y,P,P,'#e8e4d8');noise(x,y,['#d0ccc0','#f8f4ea'],60);},
    lampglow(x,y){const gr=g.createRadialGradient(x+16,y+16,0,x+16,y+16,16);gr.addColorStop(0,'rgba(255,240,170,1)');gr.addColorStop(.35,'rgba(255,210,110,.55)');gr.addColorStop(1,'rgba(255,190,90,0)');g.clearRect(x,y,P,P);g.fillStyle=gr;g.fillRect(x,y,P,P);},
    sky(x,y){R(x,y,P,P,'#ffffff');},
    water(x,y){R(x,y,P,P,'#2a5a7a');},foam(x,y){R(x,y,P,P,'#e8f4f8');}
  };
  CELLS.forEach((n,i)=>{const x=(i%ATLAS_N)*P,y=((i/ATLAS_N)|0)*P;g.save();g.beginPath();g.rect(x,y,P,P);g.clip();if(D[n])D[n](x,y);else R(x,y,P,P,'#ff00ff');g.restore();});
  return cv;}
function makeWaterTex(){const P=64,cv=document.createElement('canvas');cv.width=cv.height=P;const g=cv.getContext('2d');let seed=7;const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);
  g.fillStyle='#2e6488';g.fillRect(0,0,P,P);for(let i=0;i<260;i++){g.fillStyle=['#3a76a0','#245478','#4a88b0','#1e4a6a'][i%4];g.fillRect(rnd()*P|0,rnd()*P|0,3+(rnd()*5|0),1);}
  for(let i=0;i<26;i++){g.fillStyle='#a8d4ec';g.fillRect(rnd()*P|0,rnd()*P|0,2+(rnd()*4|0),1);}return cv;}
function makeFoamTex(){const P=64,cv=document.createElement('canvas');cv.width=cv.height=P;const g=cv.getContext('2d');let seed=11;const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);
  g.fillStyle='#5a98b8';g.fillRect(0,0,P,P);for(let i=0;i<300;i++){g.fillStyle=['#e8f4f8','#ffffff','#a8d0e4','#7ab4d0'][i%4];g.fillRect(rnd()*P|0,rnd()*P|0,2+(rnd()*6|0),1+(rnd()*2|0));}return cv;}

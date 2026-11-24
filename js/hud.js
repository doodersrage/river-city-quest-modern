"use strict";
/* River City Quest 3D: everything drawn on top of the 3D view. Blue gradient windows with a
   bevelled border, the way late-90s RPG menus looked. Drawn at 640x480 over the 320x240 scene. */
const HW=640,HH=480;let hc=null,hx=null;
function initHud(canvas){hc=canvas;hc.width=HW*2;hc.height=HH*2;hx=hc.getContext('2d');hx.setTransform(2,0,0,2,0,0);}
function T(s,x,y,o){o=o||{};hx.font=(o.b===false?'':'bold ')+(o.size||18)+'px "Segoe UI", "Helvetica Neue", Roboto, Arial, sans-serif';hx.textAlign=o.align||'left';hx.textBaseline='top';
  if(o.sh!==false){hx.fillStyle='rgba(0,0,0,.55)';hx.fillText(s,x+1,y+1.5);}hx.fillStyle=o.c||'#ffffff';hx.fillText(s,x,y);}
function win(x,y,w,h){hx.save();hx.shadowColor='rgba(0,0,0,.35)';hx.shadowBlur=10;hx.shadowOffsetY=3;const g=hx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'rgba(28,34,50,.82)');g.addColorStop(1,'rgba(12,16,26,.86)');hx.fillStyle=g;rr(x,y,w,h,10);hx.fill();hx.restore();
  hx.lineWidth=1;hx.strokeStyle='rgba(255,255,255,.22)';rr(x+.5,y+.5,w-1,h-1,10);hx.stroke();hx.fillStyle='rgba(255,255,255,.06)';rr(x+1,y+1,w-2,Math.min(h*.45,22),9);hx.fill();}
function rr(x,y,w,h,r){hx.beginPath();hx.moveTo(x+r,y);hx.arcTo(x+w,y,x+w,y+h,r);hx.arcTo(x+w,y+h,x,y+h,r);hx.arcTo(x,y+h,x,y,r);hx.arcTo(x,y,x+w,y,r);hx.closePath();}
function wrapText(s,maxW,size){hx.font='bold '+(size||18)+'px "Segoe UI", "Helvetica Neue", Roboto, Arial, sans-serif';const out=[];let line='';for(const w of s.split(' ')){const t=line?line+' '+w:w;if(hx.measureText(t).width>maxW&&line){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;}
function heart(x,y,fill){const path=()=>{hx.beginPath();hx.moveTo(x+10.5,y+18);hx.bezierCurveTo(x-2,y+10,x+1,y-1,x+10.5,y+4.5);hx.bezierCurveTo(x+20,y-1,x+23,y+10,x+10.5,y+18);hx.closePath();};
  hx.save();path();hx.fillStyle='rgba(0,0,0,.45)';hx.lineWidth=3;hx.strokeStyle='rgba(0,0,0,.45)';hx.stroke();hx.fillStyle='rgba(60,20,30,.7)';hx.fill();if(fill>0){hx.clip();const g=hx.createLinearGradient(x,y,x,y+18);g.addColorStop(0,'#ff6a7e');g.addColorStop(1,'#c81c3a');hx.fillStyle=g;hx.fillRect(x-2,y-2,fill>=1?26:12.5,24);hx.fillStyle='rgba(255,255,255,.35)';hx.beginPath();hx.ellipse(x+6.5,y+6,2.6,1.8,-.6,0,6.3);hx.fill();}hx.restore();}
function drawHud(){hx.clearRect(0,0,HW,HH);
  if(mode=='title'){drawTitle();return;}
  if(mode=='mini'){if(typeof drawMiniHud=='function')drawMiniHud();return;}
  if(!st)return;
  if(mode=='end'||mode=='credits'){mode=='end'?drawEnd():drawCredits();return;}
  // hearts, coins, item
  for(let i=0;i<st.max/2;i++)heart(16+(i%10)*26,14+Math.floor(i/10)*24,Math.max(0,Math.min(1,(p.hp-i*2)/2)));
  win(HW-150,10,136,42);T('$ '+st.coins,HW-136,21,{c:'#f2c14e'});const ar=lv.id.split(':')[0];if(lv.room)T('KEY '+(st.keys[ar]||0),HW-62,21,{size:15,c:'#e8ecf8'});
  win(16,HH-74,170,58);T('B',28,HH-66,{size:14,c:'#9aa4d8'});T(st.eq&&st.items[st.eq]?itemLabel(st.eq):'-',28,HH-46,{size:17});
  if(chal&&chal.t!=null){win(HW/2-110,10,220,40);T(chal.d.name.toUpperCase().slice(0,18)+'  '+Math.ceil(chal.t/60),HW/2,20,{align:'center',size:16,c:chal.t<600&&(frame>>4)&1?'#ff8a8a':'#ffffff'});}
  if(boss&&!boss.dead&&Math.hypot(boss.x-p.x,boss.z-p.z)<26){win(HW/2-128,HH-70,256,54);T((BOSSNAME[boss.type]||'BOSS').toUpperCase(),HW/2,HH-64,{align:'center',size:14,c:'#f2c14e'});hx.fillStyle='#1a0a10';hx.fillRect(HW/2-112,HH-42,224,14);hx.fillStyle='#e83048';hx.fillRect(HW/2-110,HH-40,220*Math.max(0,boss.hp)/(boss.max||EDEF[boss.type].hp),10);}
  if(bannerT>0&&!dlg){hx.globalAlpha=Math.min(1,bannerT/30);win(HW/2-180,64,360,48);T(banner,HW/2,77,{align:'center',size:22,c:'#fff2a8'});hx.globalAlpha=1;}
  if(toastT>0&&!dlg){hx.globalAlpha=Math.min(1,toastT/20);const L=wrapText(toastMsg,520,17);win(HW/2-280,HH-100-L.length*22,560,24+L.length*22);L.forEach((l,i)=>T(l,HW/2,HH-88-L.length*22+i*22,{align:'center',size:17}));hx.globalAlpha=1;}
  // a prompt over whoever or whatever A would use
  if(!dlg&&!menu&&!trans&&mode=='play'){const t=promptTarget();if(t){const s=project(t[0],t[1],t[2]);if(s){const x=s[0]*2,y=s[1]*2;win(x-38,y-30,76,28);T('A '+t[3],x,y-25,{align:'center',size:14,c:'#fff2a8'});}}}
  if(dlg)drawDialog();
  if(typeof drawLifeHud=='function'&&mode=='play')drawLifeHud();
  if(menu)drawMenu();
  if(shop)drawShop();
  if(deathT>0){hx.fillStyle='rgba(60,0,10,'+Math.min(.7,(90-deathT)/60)+')';hx.fillRect(0,0,HW,HH);}}
function promptTarget(){for(const n of npcs){const d=Math.hypot(n.x-p.x,n.z-p.z),a=Math.abs(ang(p.yaw,Math.atan2(n.x-p.x,n.z-p.z)));if(d<2.1&&a<1.3)return[n.x,2.5,n.z,'Talk'];}
  for(const d of [1.2,2]){const [fx,fz]=front(d),[tx,tz]=tileXZ(fx,fz),c=tileAt(lv,tx,tz);
    const ch=chests.find(q=>q.tx==tx&&q.ty==tz);if(ch&&!ch.open&&chestVisible(ch))return[ch.x,1.4,ch.z,'Open'];
    if((c=='M'||c=='Y')&&lv.markers[tx+','+tz])return[tx*TS+TS/2,2.5,tz*TS+TS/2,'Read'];if(c=='D'||c=='X'&&lv.doors[tx+','+tz])return[tx*TS+TS/2,2.8,tz*TS+TS/2,'Enter'];if(c=='e'&&!lv.room)return[tx*TS+TS/2,2.4,tz*TS+TS/2,'Look'];}return null;}
function drawDialog(){const d=dlg,L=d.lines[d.i].slice(0,d.n),last=d.i==d.lines.length-1,lines=wrapText(L,560,19),h=Math.max(130,40+lines.length*26+(last&&d.choices&&d.n>=d.lines[d.i].length?d.choices.length*26+6:0));
  const y=HH-h-14;win(20,y,HW-40,h);if(d.who){win(30,y-30,Math.max(120,d.who.length*11+30),36);T(d.who,44,y-22,{size:16,c:'#fff2a8'});}
  lines.forEach((l,i)=>T(l,44,y+20+i*26,{size:19}));
  if(last&&d.choices&&d.n>=d.lines[d.i].length)d.choices.forEach((c,i)=>{const yy=y+26+lines.length*26+i*26;if(i==d.sel){hx.fillStyle='#f2c14e';hx.beginPath();hx.moveTo(48,yy+4);hx.lineTo(60,yy+11);hx.lineTo(48,yy+18);hx.fill();}T(c,68,yy,{size:18,c:i==d.sel?'#fff2a8':'#c8d0f0'});});
  else if(d.n>=d.lines[d.i].length&&(frame>>4)&1){hx.fillStyle='#f2c14e';hx.beginPath();hx.moveTo(HW-56,y+h-26);hx.lineTo(HW-44,y+h-26);hx.lineTo(HW-50,y+h-18);hx.fill();}}
function drawMenu(){const m=menu;hx.fillStyle='rgba(0,0,20,.45)';hx.fillRect(0,0,HW,HH);win(20,16,HW-40,HH-32);
  MTABS.forEach((t,i)=>{const x=36+i*114;if(i==m.tab){hx.fillStyle='rgba(242,193,78,.25)';hx.fillRect(x-4,30,108,30);}T(t,x+50,36,{align:'center',size:17,c:i==m.tab?'#fff2a8':'#9aa4d8'});});
  hx.fillStyle='#6a74a8';hx.fillRect(36,66,HW-72,2);
  if(m.tab==0){T('GOAL',44,84,{size:14,c:'#9aa4d8'});wrapText(goalText(),540,18).forEach((l,i)=>T(l,44,104+i*24,{size:18,c:'#fff2a8'}));
    const own=ownItems();T('ITEMS  (A: set to B)',44,150,{size:14,c:'#9aa4d8'});
    own.forEach((k,i)=>{const y=172+(i>>1)*34,x=44+(i&1)*280,sel=i==(m.ic||0)%own.length;if(sel){hx.fillStyle='rgba(242,193,78,.22)';hx.fillRect(x-6,y-4,268,30);}T((st.eq==k?'B ':'  ')+itemLabel(k),x,y,{size:18,c:sel?'#fff2a8':'#ffffff'});});
    if(!own.length)T('Nothing yet. Keep exploring.',60,176,{size:17,c:'#5a64a0'});
    const ky=172+Math.ceil(own.length/2)*34+10;T('KEYSTONES',44,ky,{size:14,c:'#9aa4d8'});
    KEYS4.forEach((k,i)=>{const has=st.got[k];hx.fillStyle=has?['#9a9a9e','#5a6070','#a8543a','#c08a3a'][i]:'#1e2650';hx.beginPath();hx.moveTo(150+i*44,ky+2);hx.lineTo(166+i*44,ky+10);hx.lineTo(150+i*44,ky+22);hx.lineTo(134+i*44,ky+10);hx.fill();});
    const ex=[st.items.kayak&&'Kayak',st.shield&&'Iron Shield',st.gold&&'Gold Paddle',st.pieces%4&&('Heart pieces '+st.pieces%4+'/4')].filter(Boolean);T(ex.join('   '),340,ky+2,{size:15,c:'#c8d0f0'});
    T('Coins '+st.coins+'    Stories '+Object.keys(st.lore).length+'/'+Object.keys(RCQ.lore).length+'    Pins '+Object.keys(st.pins).length+'/'+Object.keys(RCQ.chal).length,HW/2,HH-70,{align:'center',size:16,c:'#c8d0f0'});}
  if(m.tab==1){if(m.rd){T(m.rd.t,HW/2,84,{align:'center',size:20,c:'#fff2a8'});wrapText(m.rd.pages[m.rd.pg],540,18).forEach((l,i)=>T(l,50,124+i*25,{size:18}));T('A: next',HW/2,HH-62,{align:'center',size:15,c:'#9aa4d8'});return;}
    const ids=Object.keys(RCQ.lore),top=Math.max(0,Math.min(m.jc-5,ids.length-11));for(let i=0;i<11&&top+i<ids.length;i++){const id=ids[top+i],y=82+i*30,got=st.lore[id];
      if(top+i==m.jc){hx.fillStyle='rgba(242,193,78,.2)';hx.fillRect(40,y-3,HW-80,28);}T(got?RCQ.lore[id].t:'- - - - - -',56,y,{size:18,c:got?'#ffffff':'#5a64a0'});}
    T('Stories you find on markers and statues are kept here.  A: read',HW/2,HH-58,{align:'center',size:14,c:'#9aa4d8'});}
  if(m.tab==2){const ids=Object.keys(RCQ.names).filter(k=>k.startsWith('ow:')),xs=ids.map(k=>+k.slice(3).split(',')[0]),ys=ids.map(k=>+k.slice(3).split(',')[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const cw=Math.min(66,380/(x1-x0+1)),chh=Math.min(56,330/(y1-y0+1)),L=busList(),sel=L[m.bi||0],cur=lv.room?(st.ret&&st.ret.scene)||lv.id:lv.id;
    for(const id of ids){const [x,y]=id.slice(3).split(',').map(Number),bx=36+(x-x0)*cw,by=78+(y-y0)*chh,v=st.vis[id];
      hx.fillStyle=id==sel?'#6a5a20':v?'#2e6a48':'#1e2a5a';hx.fillRect(bx,by,cw-4,chh-4);hx.strokeStyle=id==cur&&(frame>>4)&1?'#fff2a8':'#3a447a';hx.lineWidth=2;hx.strokeRect(bx,by,cw-4,chh-4);
      if(v)wrapText(RCQ.names[id],cw-8,11).slice(0,3).forEach((l,i)=>T(l,bx+(cw-4)/2,by+4+i*13,{align:'center',size:11,c:'#ffffff',sh:false}));
      if(id==goalScene()&&(frame>>3)&1){hx.fillStyle='#f2c14e';hx.font='bold 20px sans-serif';hx.fillText('*',bx+cw-18,by+chh-12);}}
    const lx=36+(x1-x0+1)*cw+14;T('GRTC BUS',lx,78,{size:14,c:'#9aa4d8'});const top=Math.max(0,Math.min((m.bi||0)-6,L.length-13));
    for(let i=0;i<13&&top+i<L.length;i++){const id=L[top+i],y=100+i*25;if(top+i==(m.bi||0)){hx.fillStyle='rgba(242,193,78,.22)';hx.fillRect(lx-6,y-3,HW-lx-30,24);}T(RCQ.names[id].slice(0,22),lx,y,{size:15,c:top+i==(m.bi||0)?'#fff2a8':'#ffffff'});}
    T('Up/Down pick a stop, A ride the bus. The star marks your goal.',HW/2,HH-58,{align:'center',size:14,c:'#9aa4d8'});}
  if(m.tab==3&&typeof drawAlbum=='function')drawAlbum(m);
  if(m.tab==4){['SAVE','SAVE AND QUIT TO TITLE','GRAPHICS:  '+(typeof QUAL!='undefined'?(QUAL.auto?'AUTO ('+QL[QUAL.lvl].name+')':QL[QUAL.lvl].name.toUpperCase()):'-')].forEach((o,i)=>T((m.sel==i?'> ':'  ')+o,80,110+i*40,{size:20,c:m.sel==i?'#fff2a8':'#c8d0f0'}));
    T('Time played '+fmtTime(st.time),80,220,{size:17,c:'#c8d0f0'});
    ['Move: left stick, WASD or arrows','A: talk, read, swing (J, Space)','B: use item (K, Shift)','ITEM: switch item (L, Tab)','Camera: drag, right stick, Q / E','MENU: Enter or Esc'].forEach((t,i)=>T(t,80,264+i*24,{size:15,c:'#9aa4d8'}));}
  T('< > change tab    B close',HW/2,HH-36,{align:'center',size:13,c:'#6a74a8'});}
function drawShop(){const S=SHOPS[shop.k];hx.fillStyle='rgba(0,0,20,.4)';hx.fillRect(0,0,HW,HH);win(HW/2-230,60,460,90+S.items.length*36);
  T(S.title||'SHOP',HW/2,74,{align:'center',size:20,c:'#fff2a8'});
  S.items.forEach((it,i)=>{const y=112+i*36,w=it.why(),sel=i==shop.cur;if(sel){hx.fillStyle='rgba(242,193,78,.22)';hx.fillRect(HW/2-216,y-4,432,32);}
    T(it.name,HW/2-200,y,{size:18,c:w?'#6a74a8':sel?'#fff2a8':'#ffffff'});T(w||('$ '+it.price),HW/2+200,y,{align:'right',size:17,c:w?'#6a74a8':'#f2c14e'});});
  const y=112+S.items.length*36+4;T(shop.msg+'   ($ '+st.coins+')',HW/2,y,{align:'center',size:15,c:'#c8d0f0'});T('A buy    B leave',HW/2,HH-40,{align:'center',size:14,c:'#9aa4d8'});}
function drawCredits(){hx.fillStyle='rgba(0,0,10,'+Math.min(.9,endT/60)+')';hx.fillRect(0,0,HW,HH);if(endT<40)return;
  const L=['RIVER CITY QUEST','The Fog over the James','','The fog is gone and every lamp is lit.','','Keystones '+KEYS4.filter(k=>st.got[k]).length+' / 4','Stories '+Object.keys(st.lore).length+' / '+Object.keys(RCQ.lore).length,'Pins '+Object.keys(st.pins).length+' / '+Object.keys(RCQ.chal).length,'Time '+fmtTime(st.time),'','Made for Richmond, Virginia.','Thanks for playing.'];
  const off=Math.max(0,(endT-40)*.6);L.forEach((l,i)=>{const y=HH-off+i*34;if(y>-30&&y<HH)T(l,HW/2,Math.max(60+i*34,y),{align:'center',size:i==0?36:i==1?20:18,c:i<2?'#f2c14e':'#e8ecf8'});});
  if(endT>240&&(frame>>5)&1)T('Press A to keep exploring',HW/2,HH-44,{align:'center',size:18,c:'#fff2a8'});}
function fmtTime(f){const s=Math.floor(f/60),m=Math.floor(s/60);return(m>=60?Math.floor(m/60)+':'+String(m%60).padStart(2,'0'):m)+':'+String(s%60).padStart(2,'0');}
function drawTitle(){const t=frame;hx.fillStyle='rgba(0,0,0,.25)';hx.fillRect(0,0,HW,HH);
  hx.save();hx.translate(HW/2,120);hx.font='bold 58px "Segoe UI", "Helvetica Neue", Roboto, Arial, sans-serif';hx.textAlign='center';hx.textBaseline='middle';
  for(let i=6;i>0;i--){hx.fillStyle='rgba(10,12,40,.5)';hx.fillText('RIVER CITY QUEST',i,i);}const g=hx.createLinearGradient(0,-30,0,30);g.addColorStop(0,'#fff2a8');g.addColorStop(.55,'#f2c14e');g.addColorStop(1,'#c07a20');hx.fillStyle=g;hx.fillText('RIVER CITY QUEST',0,0);
  hx.font='bold 22px "Trebuchet MS", sans-serif';hx.fillStyle='#e8ecf8';hx.fillText('T H E   F O G   O V E R   T H E   J A M E S',0,48);hx.restore();
  const o=titleOpts();o.forEach((s,i)=>{const sel=i==titleSel%o.length;T((sel?'> ':'')+s,HW/2,290+i*38,{align:'center',size:24,c:sel?'#fff2a8':'#c8d0f0'});});
  if((t>>5)&1)T('PRESS START',HW/2,400,{align:'center',size:18,c:'#ffffff'});T('A Richmond, Virginia adventure',HW/2,HH-36,{align:'center',size:14,c:'#9aa4d8'});}
function drawEnd(){hx.fillStyle='rgba(0,0,10,'+Math.min(.85,endT/60)+')';hx.fillRect(0,0,HW,HH);if(endT<40)return;
  T('TO BE CONTINUED',HW/2,130,{align:'center',size:40,c:'#f2c14e'});T('Keystones 1 / 4',HW/2,210,{align:'center',size:22});T('Stories '+Object.keys(st.lore).length+'/'+Object.keys(RCQ.lore).length+'   Pins '+Object.keys(st.pins).length+'/'+Object.keys(RCQ.chal).length+'   Time '+fmtTime(st.time),HW/2,250,{align:'center',size:18,c:'#c8d0f0'});
  T('More of Richmond is on the way.',HW/2,310,{align:'center',size:20,c:'#e8ecf8'});if(endT>90&&(frame>>5)&1)T('Press A to keep exploring',HW/2,380,{align:'center',size:18,c:'#fff2a8'});}

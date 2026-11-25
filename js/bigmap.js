"use strict";
/* River City Quest Modern: bigger neighborhoods. Each outdoor map from the original game is set in the middle
   of one twice as wide and twice as deep, and the new ground around it is laid out to match the district:
   in town, a street rings the old blocks and new blocks of buildings fill out to the edge, cut by alleys;
   in parks and on the river, the grass, trees and water carry on outward. Every road that used to leave the
   map still does, in the same place, so neighborhoods still join edge to edge. */
const BIG={ox:16,oy:11};
(function(){const OX=BIG.ox,OY=BIG.oy,hs=(a,b,c)=>{let h=(a*374761393+b*668265263+(c||0)*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0);};
  const WATERY='w~',ROAD='p';
  for(const id in RCQ.maps){if(id.indexOf('ow:')!=0)continue;const m=RCQ.maps[id],w=m.w,h=m.h,W=w+2*OX,H=h+2*OY,old=m.rows,seed=m.ax*7+m.ay*13+5;
    const plan=typeof STREETPLAN!='undefined'&&STREETPLAN[id],urban=old.join('').split('B').length-1>=30,g=[];
    for(let Y=0;Y<H;Y++){const row=[];for(let X=0;X<W;X++){const x=X-OX,y=Y-OY;
        if(x>=0&&y>=0&&x<w&&y<h){let c=old[y][x];// in open country the old tree line thins out, so the new ground is part of the same park
          if(!urban&&c=='T'&&(x==0||y==0||x==w-1||y==h-1)&&hs(X,Y,seed)%3)c=m.base&&'.,'.includes(m.base)?m.base:'.';row.push(c);continue;}
        const e=old[Math.max(0,Math.min(h-1,y))][Math.max(0,Math.min(w-1,x))],dx=x<0?-x:x>=w?x-w+1:0,dy=y<0?-y:y>=h?y-h+1:0,d=Math.max(dx,dy),edge=X==0||Y==0||X==W-1||Y==H-1,side=dx>0!=dy>0,along=dx>=dy?Y:X;
        let c;
        if(side&&e==ROAD||WATERY.includes(e))c=e;// roads and the river run straight on to the new edge
        else if(side&&'.,sSKkn'.includes(e))c=edge&&!'.,sn'.includes(e)?'.':e;
        else if((urban||plan&&plan.town)&&(e=='B'||e=='X'||e=='D'||!side||plan)){
          if(edge||plan)c='B';else if(d==1||d==4)c=(d==4&&along%6==2)?'t':'s';else if(d==2||d==3)c='p';else c=along%9==4?'s':'B';}
        else{const r=hs(X,Y,seed)%100;c=edge?'T':r<9?'T':r<13?'t':r<17?',':'.';}
        row.push(c);}g.push(row);}
    // sidewalks beside the roads that now run out through the new blocks
    if(urban||plan)for(let Y=1;Y<H-1;Y++)for(let X=1;X<W-1;X++){const x=X-OX,y=Y-OY;if(x>=0&&y>=0&&x<w&&y<h)continue;if(g[Y][X]!='B')continue;
      const dx=x<0?-x:x>=w?x-w+1:0,dy=y<0?-y:y>=h?y-h+1:0;if(Math.max(dx,dy)<(plan?1:5))continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const q=g[Y+b][X+a],x2=X+a-OX,y2=Y+b-OY,band=!(x2>=0&&y2>=0&&x2<w&&y2<h);return q=='p'&&band&&Math.max(x2<0?-x2:x2>=w?x2-w+1:0,y2<0?-y2:y2>=h?y2-h+1:0)>=(plan?1:5);}))g[Y][X]='s';}
    m.rows=g.map(r=>r.join(''));m.w=W;m.h=H;
    // everything that was placed on the old map moves with it
    const sh=o=>{if(o&&o.tx!=null){o.tx+=OX;o.ty+=OY;}if(o&&o.fx!=null){o.fx+=OX;o.fy+=OY;}if(o&&o.cells)o.cells=o.cells.map(([a,b])=>[a+OX,b+OY]);},pair=a=>Array.isArray(a)&&a.length>=2&&typeof a[0]=='number'?[a[0]+OX,a[1]+OY].concat(a.slice(2)):a;
    for(const k of ['npcs','doors','chests','items','dyn'])(m[k]||[]).forEach(sh);for(const k of ['lamps','spots','birds','murals','braz','opens'])if(Array.isArray(m[k]))m[k]=m[k].map(pair);
    for(const L of m.lm||[]){L.x+=OX;L.y+=OY;}m.en=(m.en||[]).map(e=>[e[0],e[1]+OX,e[2]+OY].concat(e.slice(3)));
    const rd={};for(const k in m.reads||{}){const [a,b]=k.split(',').map(Number);rd[(a+OX)+','+(b+OY)]=m.reads[k];}m.reads=rd;
    for(const k of ['readsT','statue','bossT','reward','solve'])if(Array.isArray(m[k]))m[k]=pair(m[k]);else sh(m[k]);
    // a district with a street plan is laid out by hand after the real streets around its landmarks
    m.streets=[];m.signs=[];m.lots=[];
    if(plan){const core=(x,y)=>x>=OX&&y>=OY&&x<OX+w&&y<OY+h,inb=(x,y)=>x>0&&y>0&&x<W-1&&y<H-1,put=(x,y,c)=>{if(inb(x,y)&&!core(x,y))g[y][x]=c;};
      const api={W,H,g,put,core,
        // a street: roadway, a sidewalk each side, and its name for the street signs
        street(name,x0,y0,x1,y1,o){o=o||{};const horiz=x1-x0>=y1-y0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let c='p';if(o.median){const k=horiz?y-y0:x-x0,n=horiz?y1-y0:x1-x0,a=horiz?x:y;if(k==(n>>1))c=a%5==2?'t':'.';}put(x,y,c);}
          if(!o.bare)for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++){if(x>=x0&&x<=x1&&y>=y0&&y<=y1)continue;if(inb(x,y)&&!core(x,y)&&(g[y][x]=='B'||(o.over&&o.over.includes(g[y][x]))))g[y][x]=o.trees&&(horiz?x:y)%6==3&&(horiz?(y<y0||y>y1):(x<x0||x>x1))?'t':'s';}
          m.streets.push({n:name,x0:x0-1,y0:y0-1,x1:x1+1,y1:y1+1});},
        name(n,x0,y0,x1,y1){m.streets.push({n,x0,y0,x1,y1});},
        lot(x0,y0,x1,y1){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)put(x,y,'p');m.lots.push([x0,y0,x1,y1]);},
        fill(x0,y0,x1,y1,c,every,alt){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)put(x,y,every&&hs(x,y,seed+9)%every==0?alt:c);},
        // a real place: its ground, and a plaque on the sidewalk that tells you what it is
        plaque(key,title,text,x,y){put(x,y,'M');m.reads[x+','+y]='!'+key;RCQ.readx['!'+key]=[title,text];},
        landmark(art,x,y,ww,hh,read){for(let b=y;b<y+hh;b++)for(let a=x;a<x+ww;a++)put(a,b,'X');m.lm.push({art,x,y,w:ww,h:hh,read:read||null});}};
      plan(api);
      // a signpost at each corner where two named streets cross
      for(let i=0;i<m.streets.length;i++)for(let j=i+1;j<m.streets.length;j++){const A=m.streets[i],B=m.streets[j];if(A.n==B.n||A.n=='alley'||B.n=='alley'||A.n.indexOf('St. John')==0||B.n.indexOf('St. John')==0||A.n=='Capitol Square'||B.n=='Capitol Square')continue;const x0=Math.max(A.x0,B.x0),x1=Math.min(A.x1,B.x1),y0=Math.max(A.y0,B.y0),y1=Math.min(A.y1,B.y1);if(x0>x1||y0>y1)continue;
        for(const [x,y] of [[x0,y0],[x1,y1]])if(g[y]&&g[y][x]=='s'&&!m.signs.some(q=>Math.abs(q[0]-x)+Math.abs(q[1]-y)<3)){m.signs.push([x,y,A.n,B.n,A.x1-A.x0>A.y1-A.y0?1:0,B.x1-B.x0>B.y1-B.y0?1:0]);break;}}
      m.rows=g.map(r=>r.join(''));}
    // street lamps along the new sidewalks
    if(urban||plan)for(let Y=2;Y<H-2;Y++)for(let X=2;X<W-2;X++){const x=X-OX,y=Y-OY;if(x>=-1&&y>=-1&&x<=w&&y<=h)continue;if(g[Y][X]=='s'&&hs(X,Y,seed+3)%23==0)m.lamps.push([X,Y]);}
  }
  // the new ground is lived in: neighbors out on the named streets, trouble in the back streets, and a stash or two worth the walk
  const TALK={'ow:2,1':['Session days, you can\'t get a seat at any lunch counter near the Capitol.','They ring the Bell Tower to call the General Assembly in.'],'ow:3,1':['When the James floods, the Bottom floods first.','You can hear the trains over on the viaduct all night.'],'ow:3,0':['Patrick Henry gave the liberty-or-death speech in that church in 1775.','Gas lamps and brick sidewalks. Church Hill hasn\'t changed much.'],
    'ow:0,1':['A movie at the Byrd, then ice cream. That\'s a Carytown Saturday.','Nine blocks of shops and not a chain store I can think of.'],'ow:1,1':['They call it the Fan because the streets spread out like one, heading west.','Every porch on this block is somebody\'s living room come spring.'],'ow:2,0':['They called Second Street the Deuce. Ellington played here. Ella too.','Look up at the ironwork on these porches. Nobody makes it like that now.']};
  const COL=[['#6a4020','#3d63c8'],['#2e2e3a','#b84a3a'],['#8a5a30','#58a850'],['#3a2414','#d8b03a'],['#4a2c14','#7a5ab8'],['#20242c','#d8692a']];
  for(const id in RCQ.maps){if(id.indexOf('ow:')!=0)continue;const m=RCQ.maps[id],W=m.w,H=m.h,seed=m.ax*7+m.ay*13+5,band=(x,y)=>!(x>=OX-1&&y>=OY-1&&x<=W-OX&&y<=H-OY)&&x>2&&y>2&&x<W-3&&y<H-3,used=[],far=(x,y,r)=>used.every(q=>Math.abs(q[0]-x)+Math.abs(q[1]-y)>=r),at=(x,y)=>m.rows[y][x];
    const pick=(ok,n,r,salt)=>{const out=[],c=[];for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++)if(band(x,y)&&ok(x,y))c.push([hs(x,y,seed+salt),x,y]);c.sort((a,b)=>a[0]-b[0]);for(const [,x,y] of c){if(out.length>=n)break;if(far(x,y,r)){out.push([x,y]);used.push([x,y]);}}return out;};
    const town=m.streets&&m.streets.length>0,open=(x,y)=>'s.'.includes(at(x,y));
    if(town){let i=0;const seen={};for(const s of m.streets){if(seen[s.n]||s.n=='alley'||i>=6)continue;seen[s.n]=1;const sp=pick((x,y)=>at(x,y)=='s'&&x>=s.x0&&x<=s.x1&&y>=s.y0&&y<=s.y1,1,6,11+i)[0];if(!sp)continue;const c=COL[(i+m.ax+m.ay*2+6)%6],t=TALK[id]||[];
        m.npcs.push({who:'Neighbor',tx:sp[0],ty:sp[1],talk:'folk',lines:['This is '+s.n+'.',t[i%Math.max(1,t.length)]||'Nice day for a walk.'],chal:null,hat:[c[0]],shirt:[c[1]]});i++;}}
    const kinds=(m.en||[]).map(e=>e[0]);if(kinds.length)for(const [x,y] of pick((x,y)=>open(x,y)||at(x,y)=='p',town?5:4,9,31))m.en.push([kinds[hs(x,y,seed)%kinds.length],x,y]);
    pick((x,y)=>open(x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>'BTX'.includes(at(x+a,y+b))).length>=(town?1:2),2,14,53).forEach(([x,y],n)=>m.chests.push({id:'ch:big:'+id+':'+n,tx:x,ty:y,item:n?'coins20':'coins50',appear:false}));}
  // where a road reaches the edge but the map next door has trees there, clear a way through them
  const WK='.,psSKk=-FEn^|1',set=(m,x,y,c)=>{m.rows[y]=m.rows[y].slice(0,x)+c+m.rows[y].slice(x+1);},carve=(m,x,y,sx,sy)=>{for(let k=0;k<14&&m.rows[y]&&m.rows[y][x]=='T';k++,x+=sx,y+=sy)set(m,x,y,'.');};
  for(const id in RCQ.maps){if(id.indexOf('ow:')!=0)continue;const m=RCQ.maps[id],[ax,ay]=id.slice(3).split(',').map(Number),E=RCQ.maps['ow:'+(ax+1)+','+ay],S=RCQ.maps['ow:'+ax+','+(ay+1)];
    if(E)for(let y=0;y<m.h;y++){const a=WK.includes(m.rows[y][m.w-1]),b=WK.includes(E.rows[y][0]);if(a&&!b)carve(E,0,y,1,0);if(b&&!a)carve(m,m.w-1,y,-1,0);}
    if(S)for(let x=0;x<m.w;x++){const a=WK.includes(m.rows[m.h-1][x]),b=WK.includes(S.rows[0][x]);if(a&&!b)carve(S,x,0,0,1);if(b&&!a)carve(m,x,m.h-1,0,-1);}}
})();

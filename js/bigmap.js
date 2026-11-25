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
    const urban=old.join('').split('B').length-1>=30,g=[];
    for(let Y=0;Y<H;Y++){const row=[];for(let X=0;X<W;X++){const x=X-OX,y=Y-OY;
        if(x>=0&&y>=0&&x<w&&y<h){let c=old[y][x];// in open country the old tree line thins out, so the new ground is part of the same park
          if(!urban&&c=='T'&&(x==0||y==0||x==w-1||y==h-1)&&hs(X,Y,seed)%3)c=m.base&&'.,'.includes(m.base)?m.base:'.';row.push(c);continue;}
        const e=old[Math.max(0,Math.min(h-1,y))][Math.max(0,Math.min(w-1,x))],dx=x<0?-x:x>=w?x-w+1:0,dy=y<0?-y:y>=h?y-h+1:0,d=Math.max(dx,dy),edge=X==0||Y==0||X==W-1||Y==H-1,side=dx>0!=dy>0,along=dx>=dy?Y:X;
        let c;
        if(side&&(e==ROAD||WATERY.includes(e)))c=e;// roads and the river run straight on to the new edge
        else if(side&&'.,sSKkn'.includes(e))c=edge&&!'.,sn'.includes(e)?'.':e;
        else if(urban&&(e=='B'||e=='X'||e=='D'||!side)){
          if(edge)c='B';else if(d==1||d==4)c=(d==4&&along%6==2)?'t':'s';else if(d==2||d==3)c='p';else c=along%9==4?'s':'B';}
        else{const r=hs(X,Y,seed)%100;c=edge?'T':r<9?'T':r<13?'t':r<17?',':'.';}
        row.push(c);}g.push(row);}
    // sidewalks beside the roads that now run out through the new blocks
    if(urban)for(let Y=1;Y<H-1;Y++)for(let X=1;X<W-1;X++){const x=X-OX,y=Y-OY;if(x>=0&&y>=0&&x<w&&y<h)continue;if(g[Y][X]!='B')continue;
      const dx=x<0?-x:x>=w?x-w+1:0,dy=y<0?-y:y>=h?y-h+1:0;if(Math.max(dx,dy)<5)continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const q=g[Y+b][X+a],x2=X+a-OX,y2=Y+b-OY,band=!(x2>=0&&y2>=0&&x2<w&&y2<h);return q=='p'&&band&&Math.max(x2<0?-x2:x2>=w?x2-w+1:0,y2<0?-y2:y2>=h?y2-h+1:0)>=5;}))g[Y][X]='s';}
    m.rows=g.map(r=>r.join(''));m.w=W;m.h=H;
    // everything that was placed on the old map moves with it
    const sh=o=>{if(o&&o.tx!=null){o.tx+=OX;o.ty+=OY;}if(o&&o.fx!=null){o.fx+=OX;o.fy+=OY;}if(o&&o.cells)o.cells=o.cells.map(([a,b])=>[a+OX,b+OY]);},pair=a=>Array.isArray(a)&&a.length>=2&&typeof a[0]=='number'?[a[0]+OX,a[1]+OY].concat(a.slice(2)):a;
    for(const k of ['npcs','doors','chests','items','dyn'])(m[k]||[]).forEach(sh);for(const k of ['lamps','spots','birds','murals','braz','opens'])if(Array.isArray(m[k]))m[k]=m[k].map(pair);
    for(const L of m.lm||[]){L.x+=OX;L.y+=OY;}m.en=(m.en||[]).map(e=>[e[0],e[1]+OX,e[2]+OY].concat(e.slice(3)));
    const rd={};for(const k in m.reads||{}){const [a,b]=k.split(',').map(Number);rd[(a+OX)+','+(b+OY)]=m.reads[k];}m.reads=rd;
    for(const k of ['readsT','statue','bossT','reward','solve'])if(Array.isArray(m[k]))m[k]=pair(m[k]);else sh(m[k]);
    // street lamps along the new sidewalks
    if(urban)for(let Y=2;Y<H-2;Y++)for(let X=2;X<W-2;X++){const x=X-OX,y=Y-OY;if(x>=-1&&y>=-1&&x<=w&&y<=h)continue;if(g[Y][X]=='s'&&hs(X,Y,seed+3)%23==0)m.lamps.push([X,Y]);}
  }
  // where a road reaches the edge but the map next door has trees there, clear a way through them
  const WK='.,psSKk=-FEn^|1',set=(m,x,y,c)=>{m.rows[y]=m.rows[y].slice(0,x)+c+m.rows[y].slice(x+1);},carve=(m,x,y,sx,sy)=>{for(let k=0;k<14&&m.rows[y]&&m.rows[y][x]=='T';k++,x+=sx,y+=sy)set(m,x,y,'.');};
  for(const id in RCQ.maps){if(id.indexOf('ow:')!=0)continue;const m=RCQ.maps[id],[ax,ay]=id.slice(3).split(',').map(Number),E=RCQ.maps['ow:'+(ax+1)+','+ay],S=RCQ.maps['ow:'+ax+','+(ay+1)];
    if(E)for(let y=0;y<m.h;y++){const a=WK.includes(m.rows[y][m.w-1]),b=WK.includes(E.rows[y][0]);if(a&&!b)carve(E,0,y,1,0);if(b&&!a)carve(m,m.w-1,y,-1,0);}
    if(S)for(let x=0;x<m.w;x++){const a=WK.includes(m.rows[m.h-1][x]),b=WK.includes(S.rows[0][x]);if(a&&!b)carve(S,x,0,0,1);if(b&&!a)carve(m,x,m.h-1,0,-1);}}
})();

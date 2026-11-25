"use strict";
/* River City Quest Modern: lettering. Street names, shop signs and the Byrd's marquee are drawn as real text
   into a few texture layers, sixteen labels to a layer, and signs in the world show the piece that is theirs. */
const SHOPSIGNS=['BAKERY','RECORDS','BOOKS','DINER','HARDWARE','PHARMACY','BARBER','CAFE','FLORIST','THRIFT','TAILOR','BIKE SHOP','MARKET','LAUNDRY','PIZZA','ANTIQUES'];
const TEXT_LAYERS=5,TEXT_PER=16;let TEXTS=null;
function textList(){if(TEXTS)return TEXTS;const L=[],seen={},add=(s,style)=>{if(!seen[s]&&L.length<TEXT_LAYERS*TEXT_PER){seen[s]=1;L.push({s,style});}};
  add('BYRD THEATRE','marq');add('BYRD','blade');for(const s of SHOPSIGNS)add(s,'shop');
  for(const id in RCQ.maps)for(const st of RCQ.maps[id].streets||[])if(st.n!='alley'&&st.n!='Capitol Square'&&st.n.indexOf('Churchyard')<0)add(st.n,'st');
  TEXTS=L;TEXTS.idx={};L.forEach((t,i)=>TEXTS.idx[t.s]=i);return L;}
// where a label sits: [u0,v0,u1,v1] with the layer folded into u, or null if there is no such label
function textUV(s){const L=textList(),i=L.idx[s];if(i==null)return null;const [c0]=cellUV('text'+(1+Math.floor(i/TEXT_PER))),layer=Math.floor(c0),k=i%TEXT_PER,col=k%2,row=k>>1,p=.006;
  return[layer+col/2+p,row/8+p,layer+(col+1)/2-p,(row+1)/8-p];}
// a flat sign showing a label: corners are bottom-left, bottom-right, top-right, top-left as you read it; turn=1 stands the text on end
function textQuad(M,a,b,c,d,s,turn){const uv=textUV(s);if(!uv)return false;const [u0,v0,u1,v1]=uv,k=[1,1,1],T=turn?[[u0,v0],[u0,v1],[u1,v1],[u1,v0]]:[[u0,v1],[u1,v1],[u1,v0],[u0,v0]];
  M.tri(a,b,c,T[0],T[1],T[2],k,k,k);M.tri(a,c,d,T[0],T[2],T[3],k,k,k);return true;}
function paintText(D,H,E,S,layer){const cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d'),L=textList(),w=S/2,h=S/8,
    PAL=[['#f2ead8','#3a2a20'],['#1e2a44','#f4e8c8'],['#7a1f1a','#f6e6c0'],['#e8e0d0','#1f4a3a'],['#222222','#f0c040'],['#2c4a3c','#f2ead8']];
  for(let k=0;k<TEXT_PER;k++){const t=L[layer*TEXT_PER+k],x=(k%2)*w,y=(k>>1)*h;let bg='#0f5a37',fg='#ffffff';if(t&&t.style=='shop')[bg,fg]=PAL[(layer*TEXT_PER+k)%PAL.length];if(t&&t.style=='marq'){bg='#fff6dc';fg='#b01818';}if(t&&t.style=='blade'){bg='#b01818';fg='#ffe9a0';}
    g.fillStyle=bg;g.fillRect(x,y,w,h);if(!t)continue;if(t.style=='st'){g.strokeStyle='#ffffff';g.lineWidth=Math.max(1,S/256);g.strokeRect(x+S/128,y+S/128,w-S/64,h-S/64);}
    g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';let px=h*.62;g.font='bold '+px+'px "Helvetica Neue", Arial, sans-serif';const tw=g.measureText(t.s).width;if(tw>w*.86){px*=w*.86/tw;g.font='bold '+px+'px "Helvetica Neue", Arial, sans-serif';}
    g.fillText(t.s,x+w/2,y+h/2+px*.06);}
  const d=g.getImageData(0,0,S,S).data;for(let i=0;i<S*S*4;i++)D[i]=d[i];for(let i=0;i<S*S;i++){D[i*4+3]=255;H[i]=.5;const t=L[layer*TEXT_PER+(Math.floor((i/S|0)/h)*2+Math.floor((i%S)/w))];E[i]=t&&(t.style=='marq'||t.style=='blade')?.55:0;}}

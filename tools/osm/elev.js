#!/usr/bin/env node
// Ground heights for each neighborhood, from the Terrain Tiles open data set on AWS (Mapzen/Tilezen "terrarium" tiles).
// For every district this samples the height every 10 metres over the same area the map data covers and writes
// them all to <out>/elev.json. Heights are in decimetres above sea level, rows running north to south.
// Usage: node tools/osm/elev.js <output folder>
const fs=require('fs'),path=require('path'),zlib=require('zlib'),https=require('https');
const out=process.argv[2]||'osm-raw',cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'districts.json'),'utf8')),Z=15,STEP=10,MX=60,MZ=50,W=400,H=300;
const get=url=>new Promise((res,rej)=>{const rq=https.get(url,{timeout:30000},r=>{if(r.statusCode!=200){r.resume();return rej(new Error(url+' '+r.statusCode));}const b=[];r.on('data',d=>b.push(d));r.on('end',()=>res(Buffer.concat(b)));});rq.on('error',rej);rq.on('timeout',()=>rq.destroy(new Error('timeout')));});
// a plain PNG reader: 8-bit RGB or RGBA, not interlaced, which is what these tiles are
function png(buf){let p=8,w=0,h=0,ct=0;const idat=[];while(p<buf.length){const len=buf.readUInt32BE(p),type=buf.toString('ascii',p+4,p+8),d=buf.subarray(p+8,p+8+len);if(type=='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);ct=d[9];if(d[8]!=8||(ct!=2&&ct!=6)||d[12])throw new Error('unexpected PNG kind');}else if(type=='IDAT')idat.push(d);p+=12+len;}
  const bpp=ct==6?4:3,raw=zlib.inflateSync(Buffer.concat(idat)),st=w*bpp,px=Buffer.alloc(st*h);
  for(let y=0;y<h;y++){const f=raw[y*(st+1)],o=y*(st+1)+1;for(let x=0;x<st;x++){const a=x>=bpp?px[y*st+x-bpp]:0,b=y?px[(y-1)*st+x]:0,c=x>=bpp&&y?px[(y-1)*st+x-bpp]:0;let v=raw[o+x];
      if(f==1)v+=a;else if(f==2)v+=b;else if(f==3)v+=(a+b)>>1;else if(f==4){const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}px[y*st+x]=v&255;}}
  return{w,h,bpp,px};}
const tiles={};async function tile(x,y){const k=x+'/'+y;if(!tiles[k]){let err;for(let a=0;a<4&&!tiles[k];a++){try{tiles[k]=png(await get(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`));}catch(e){err=e;await new Promise(r=>setTimeout(r,1500*(a+1)));}}if(!tiles[k])throw err;}return tiles[k];}
async function height(lat,lon){const n=2**Z,fx=(lon+180)/360*n,s=Math.sin(lat*Math.PI/180),fy=(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*n,at=async(X,Y)=>{const t=await tile(Math.floor(X/256),Math.floor(Y/256)),i=((Y%256)*t.w+(X%256))*t.bpp;return t.px[i]*256+t.px[i+1]+t.px[i+2]/256-32768;};
  const X=fx*256-.5,Y=fy*256-.5,x0=Math.floor(X),y0=Math.floor(Y),u=X-x0,v=Y-y0;return(await at(x0,y0))*(1-u)*(1-v)+(await at(x0+1,y0))*u*(1-v)+(await at(x0,y0+1))*(1-u)*v+(await at(x0+1,y0+1))*u*v;}
(async()=>{const res={note:'Ground heights in decimetres above sea level, every '+STEP+' m, rows north to south. Terrain Tiles (Mapzen/Tilezen) from the Registry of Open Data on AWS; in the US the source is USGS 3DEP.',step:STEP,x0:-MX,z0:-MZ,d:{}};
  for(const id in cfg.districts){const d=cfg.districts[id],cosl=Math.cos(d.lat*Math.PI/180),nx=Math.floor((W+2*MX)/STEP)+1,nz=Math.floor((H+2*MZ)/STEP)+1,h=[];
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=-MX+i*STEP,z=-MZ+j*STEP;h.push(Math.round(10*await height(d.lat-(z-H/2)/111320,d.lon+(x-W/2)/(cosl*111320))));}
    res.d[id]={nx,nz,h};console.log(id,d.name,'low',Math.min(...h)/10,'high',Math.max(...h)/10);}
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'elev.json'),JSON.stringify(res));console.log('wrote elev.json,',Object.keys(tiles).length,'tiles');})().catch(e=>{console.error(e);process.exit(1);});

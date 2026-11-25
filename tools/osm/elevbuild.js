#!/usr/bin/env node
// Turns the downloaded ground heights (elev.json, from tools/osm/elev.js) into js/worldelev.js for the game.
// Each district's heights are stored relative to its own lowest point, in quarter-metres, one byte a sample.
// Usage: node tools/osm/elevbuild.js <folder holding elev.json>
const fs=require('fs'),path=require('path'),src=process.argv[2]||'osm-raw',e=JSON.parse(fs.readFileSync(path.join(src,'elev.json'),'utf8')),out={step:e.step,x0:e.x0,z0:e.z0,q:.25,d:{}};
for(const id in e.d){const d=e.d[id],lo=Math.min(...d.h),b=Buffer.alloc(d.h.length);d.h.forEach((v,i)=>b[i]=Math.max(0,Math.min(255,Math.round((v-lo)/2.5))));out.d[id]={nx:d.nx,nz:d.nz,lo:lo/10,h:b.toString('base64')};}
fs.writeFileSync(path.join(__dirname,'../../js/worldelev.js'),'"use strict";\n/* River City Quest Modern: the lie of the land. Ground heights for each neighborhood every '+e.step+' metres, relative to its lowest\n   point, in quarter-metres. Built by tools/osm/elevbuild.js from the Terrain Tiles open data set (Mapzen/Tilezen on AWS;\n   in the United States the source is the USGS 3D Elevation Program). Do not edit by hand. */\nconst WELEV='+JSON.stringify(out)+';\n');
console.log('wrote js/worldelev.js',Object.keys(out.d).length,'districts');

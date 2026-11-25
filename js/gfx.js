"use strict";
/* River City Quest Modern: the renderer. Physically based shading (GGX specular, metal and roughness
   per material, normal maps), a sun or moon with soft shadow maps, a hemisphere sky light, up to 16
   point lights for lamps, braziers and the lantern, height fog that glows toward the sun, a procedural
   sky with clouds and stars, the James with moving waves and reflections, and an HDR pipeline with
   bloom and filmic tone mapping. Quality steps down on its own when frames run slow.
   The rest of the game talks to it through the same calls the PS1 renderer had: setCommon, drawVAO,
   drawModel, upload, meshGL, and the uniforms in U. */
const RW=320,RH=240;// the HUD's idea of the screen: project() returns points in this space
let gl=null,prog=null,U={},US={},sprog=null,skyProg=null,postProgs={},dynBuf=null,quadVAO=null,sceneGL=null,atlasTex=null,nrmTex=null,waterTex=null,foamTex=null,shadowTex=null,shadowFB=null;
let FW=0,FH=0,hdr=null,bloomT=[],extCBF=null,aniso=null,PASS='main',LVP=M4id(),SUN={dir:[0,1,0],col:[0,0,0],sky:[.5,.6,.7],gnd:[.2,.2,.2],up:true};
function M4id(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}

/* ---------- quality ---------- */
const QL=[{name:'Low',scale:.6,shadow:0,msaa:0,bloom:0,tex:64,grass:0},{name:'Medium',scale:.85,shadow:1024,msaa:0,bloom:1,tex:128,grass:0},{name:'High',scale:1,shadow:2048,msaa:4,bloom:1,tex:128,grass:1}];
const QUAL={auto:true,lvl:2,ft:[],dropped:false,cool:0};
try{const s=JSON.parse(localStorage.getItem('rcqm-quality')||'null');if(s){QUAL.auto=s.auto;QUAL.lvl=s.lvl;}}catch(e){}
if(QUAL.auto&&typeof navigator!='undefined'&&(navigator.maxTouchPoints>0||/Mobi|Android/i.test(navigator.userAgent||'')))QUAL.lvl=Math.min(QUAL.lvl,1);
const Q=()=>QL[QUAL.lvl];
function setQuality(auto,lvl){QUAL.auto=auto;if(lvl!=null)QUAL.lvl=lvl;QUAL.ft=[];QUAL.cool=180;try{localStorage.setItem('rcqm-quality',JSON.stringify({auto:QUAL.auto,lvl:QUAL.lvl}));}catch(e){}if(gl)resizeTargets(true);}
// called once per drawn frame with how long the frame took
function qualityTick(ms){if(!QUAL.auto)return;if(QUAL.cool>0){QUAL.cool--;return;}QUAL.ft.push(ms);if(QUAL.ft.length<90)return;
  const a=QUAL.ft.slice().sort((x,y)=>x-y)[45];QUAL.ft=[];
  if(a>24&&QUAL.lvl>0){QUAL.lvl--;QUAL.dropped=true;QUAL.cool=240;if(gl)resizeTargets(true);}else if(a<11&&QUAL.lvl<2&&!QUAL.dropped){QUAL.lvl++;QUAL.cool=240;if(gl)resizeTargets(true);}}

/* ---------- shaders ---------- */
const VS=`#version 300 es
precision highp float;
in vec3 aPos;in vec2 aUV;in vec3 aCol;in float aSway;in vec3 aNrm;in vec3 aBW;
uniform mat4 uPV,uModel,uLVP;uniform float uTime,uWave,uSkin,uPalOn;uniform mat4 uBones[13];uniform vec3 uPal[12];
out vec3 vW;out vec3 vN;out vec2 vUV;out vec3 vCol;out vec4 vL;
void main(){vec4 lp=vec4(aPos,1.);vec3 ln=aNrm;
  if(uSkin>.5){mat4 A=uBones[int(aBW.x+.5)],Bm=uBones[int(aBW.y+.5)];lp=mix(A*lp,Bm*lp,aBW.z);ln=mix(mat3(A)*ln,mat3(Bm)*ln,aBW.z);}
  vec4 wp=uModel*lp;
  wp.xz+=aSway*vec2(sin(uTime*1.3+wp.x*.35+wp.z*.2),cos(uTime*1.05+wp.z*.3+wp.x*.1));
  if(uWave>0.)wp.y+=uWave*(sin(wp.x*1.1+uTime*1.4)+cos(wp.z*.9+uTime*1.1))*.035;
  vW=wp.xyz;vN=mat3(uModel)*ln;vUV=aUV;vCol=uPalOn>.5?uPal[int(aCol.x+.5)]:aCol;vL=uLVP*wp;gl_Position=uPV*wp;}`;
const SKYFN=`
uniform vec3 uSunDir,uSunCol,uSkyCol,uHorCol;uniform float uNight,uTime,uCloud;
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm2(vec2 p){float a=.5,t=0.;for(int i=0;i<5;i++){t+=vn(p)*a;p=p*2.03+vec2(1.7,9.2);a*=.5;}return t;}
vec3 sky(vec3 d,bool full){float y=max(d.y,0.);vec3 c=mix(uHorCol,uSkyCol,pow(y,.45));
  float s=max(dot(d,uSunDir),0.);c+=uSunCol*(pow(s,8.)*.25+pow(s,64.)*.6);if(full)c+=uSunCol*smoothstep(.9994,.9997,s)*(uNight>.5?2.:30.);
  if(full&&d.y>0.){vec2 cp=d.xz/(d.y+.12)*1.6+vec2(uTime*.01,0.);float cl=smoothstep(.45+.25*(1.-uCloud),.85,fbm2(cp));vec3 cc=mix(vec3(.95),uHorCol*1.1,.3)*(uNight>.5?.12:1.)+uSunCol*pow(s,4.)*.3;c=mix(c,cc,cl*smoothstep(0.,.15,d.y)*.85);
    if(uNight>.2){vec2 sp=floor(d.xz/(d.y+.3)*220.);float st=step(.9975,h21(sp))*uNight*smoothstep(0.,.2,d.y)*(1.-cl);c+=vec3(st*1.5);}}
  if(d.y<0.)c=mix(uHorCol,uHorCol*.45,min(1.,-d.y*3.));return c;}`;
const FS=`#version 300 es
precision highp float;precision highp sampler2DArray;precision highp sampler2DShadow;
in vec3 vW;in vec3 vN;in vec2 vUV;in vec3 vCol;in vec4 vL;
uniform sampler2DArray uAlb,uNrm;uniform sampler2D uTex2;uniform sampler2DShadow uShadow;
uniform int uMode;uniform vec3 uTint,uGndCol,uFogCol,uCam;uniform float uAlpha,uFlash,uAdd,uFogD,uShadowOn,uAmb,uIndoor;uniform vec2 uOff;
uniform vec4 uL[16];uniform vec3 uLC[16];uniform int uNL;uniform float uMetal[96];
${SKYFN}
out vec4 o;
const float PI=3.14159265;
vec3 lin(vec3 c){return pow(c,vec3(2.2));}
vec3 perturb(vec3 N,vec3 p,vec2 uv,vec3 tn){vec3 dp1=dFdx(p),dp2=dFdy(p);vec2 du1=dFdx(uv),du2=dFdy(uv);vec3 a=cross(dp2,N),b=cross(N,dp1);vec3 T=a*du1.x+b*du2.x,B=a*du1.y+b*du2.y;
  float inv=inversesqrt(max(1e-12,max(dot(T,T),dot(B,B))));vec3 r=mat3(T*inv,-B*inv,N)*tn;return dot(r,r)>1e-8?normalize(r):N;}
float shadowAt(vec3 N){if(uShadowOn<.5)return 1.;vec3 p=vL.xyz/vL.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;
  float b=.0015+.003*(1.-abs(dot(N,uSunDir)));vec2 t=1./vec2(textureSize(uShadow,0));float s=0.;
  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)s+=texture(uShadow,vec3(p.xy+vec2(i,j)*t*1.2,p.z-b));return s/9.;}
float D_GGX(float nh,float a){float a2=a*a,d=nh*nh*(a2-1.)+1.;return a2/(PI*d*d);}
float G_S(float nv,float nl,float r){float k=(r+1.)*(r+1.)/8.;return nv/(nv*(1.-k)+k)*nl/(nl*(1.-k)+k);}
vec3 brdf(vec3 N,vec3 V,vec3 L,vec3 alb,float rough,float metal,vec3 rad){vec3 H=normalize(V+L);float nl=max(dot(N,L),0.),nv=max(dot(N,V),1e-3),nh=max(dot(N,H),0.),vh=max(dot(V,H),0.);
  vec3 F0=mix(vec3(.04),alb,metal),F=F0+(1.-F0)*pow(1.-vh,5.);vec3 spec=D_GGX(nh,rough*rough)*G_S(nv,nl,rough)*F/(4.*nv*max(nl,1e-3)+1e-4);
  return((1.-F)*(1.-metal)*alb/PI+spec)*rad*nl;}
vec3 fog(vec3 c){float d=distance(vW,uCam);vec3 V=normalize(vW-uCam);float f=1.-exp(-d*uFogD*exp(-max(vW.y,0.)*.04));
  vec3 fc=uFogCol+uSunCol*pow(max(dot(V,uSunDir),0.),6.)*.35*(1.-uIndoor);return mix(c,fc,f);}
void main(){float layer=floor(vUV.x);vec2 uv=vec2(vUV.x-layer,vUV.y);
  if(uMode==2){// the river
    vec3 V=normalize(uCam-vW);vec2 p=vW.xz;float t=uTime;vec2 g=vec2(0.);
    g+=vec2(.8,.6)*1.1*.05*cos(dot(vec2(.8,.6),p)*1.1+t*1.5);g+=vec2(-.5,.86)*1.7*.03*cos(dot(vec2(-.5,.86),p)*1.7+t*1.9);g+=vec2(.2,-.98)*2.9*.015*cos(dot(vec2(.2,-.98),p)*2.9+t*2.6);
    vec2 dn=texture(uTex2,p*.11+uOff*3.).rg-.5+texture(uTex2,p*.27-uOff*4.).rg-.5;vec3 N=normalize(vec3(-g.x-dn.x*.12,1.,-g.y-dn.y*.12));
    vec3 R=reflect(-V,N);R.y=abs(R.y);float fr=.02+.98*pow(1.-max(dot(N,V),0.),5.);vec3 deep=lin(vec3(.06,.16,.19))*(uAmb*.8+.1);
    vec3 col=mix(deep,sky(R,false)*.9,fr);float sh=shadowAt(vec3(0,1,0));col+=uSunCol*pow(max(dot(R,uSunDir),0.),280.)*6.*sh;
    for(int i=0;i<16;i++){if(i>=uNL)break;vec3 Lv=uL[i].xyz-vW;float d=length(Lv);float a=clamp(1.-d/uL[i].w,0.,1.);col+=uLC[i]*pow(max(dot(R,Lv/d),0.),60.)*a*a*2.;}
    o=vec4(fog(col),1.);return;}
  vec4 t=uMode==3?texture(uTex2,vUV+uOff):texture(uAlb,vec3(uv,layer));
  if(uAdd>.5){o=vec4(lin(t.rgb)*vCol*uTint*t.a*.7,1.);return;}
  if(t.a<.5)discard;
  vec3 alb=lin(t.rgb)*lin(vCol)*uTint;
  vec3 N=dot(vN,vN)>1e-8?normalize(vN):vec3(0,1,0);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.)N=-N;
  float rough=.6,metal=0.,emis=0.;
  if(uMode!=3){vec4 nt=texture(uNrm,vec3(uv,layer));vec3 tn=vec3(nt.rg*2.-1.,0.);tn.z=sqrt(max(0.,1.-dot(tn.xy,tn.xy)));N=perturb(N,vW,uv,tn);rough=clamp(nt.b,.04,1.);metal=uMetal[int(layer)];emis=nt.a;}
  vec3 c=vec3(0.);
  if(uSunCol.r+uSunCol.g+uSunCol.b>.001)c+=brdf(N,V,uSunDir,alb,rough,metal,uSunCol)*shadowAt(N);
  for(int i=0;i<16;i++){if(i>=uNL)break;vec3 Lv=uL[i].xyz-vW;float d=length(Lv);float a=clamp(1.-pow(d/uL[i].w,2.),0.,1.);if(a<=0.)continue;c+=brdf(N,V,Lv/d,alb,rough,metal,uLC[i]*a*a*3.2/(1.+d*d*.06));}
  vec3 amb=mix(uGndCol,uSkyCol*.9+uHorCol*.1,N.y*.5+.5)*uAmb;vec3 F0=mix(vec3(.04),alb,metal);
  c+=amb*alb*(1.-metal)*.6+amb*F0*(1.-rough)*.6+sky(reflect(-V,N),false)*F0*metal*(1.-rough)*.4*uAmb;
  c+=emis*uNight*lin(vec3(1.,.72,.38))*2.2*(1.-uIndoor*.5);
  c=fog(c);c=mix(c,vec3(1.),uFlash);o=vec4(c,uAlpha);}`;
const SVS=`#version 300 es
precision highp float;in vec3 aPos;in vec2 aUV;in float aSway;in vec3 aBW;uniform mat4 uPV,uModel;uniform float uTime,uWave,uSkin;uniform mat4 uBones[13];out vec2 vUV;
void main(){vec4 lp=vec4(aPos,1.);if(uSkin>.5){lp=mix(uBones[int(aBW.x+.5)]*lp,uBones[int(aBW.y+.5)]*lp,aBW.z);}vec4 wp=uModel*lp;wp.xz+=aSway*vec2(sin(uTime*1.3+wp.x*.35+wp.z*.2),cos(uTime*1.05+wp.z*.3+wp.x*.1));vUV=aUV;gl_Position=uPV*wp;}`;
const SFS=`#version 300 es
precision mediump float;precision mediump sampler2DArray;in vec2 vUV;uniform sampler2DArray uAlb;void main(){float l=floor(vUV.x);if(texture(uAlb,vec3(vUV.x-l,vUV.y,l)).a<.5)discard;}`;
const QVS=`#version 300 es
in vec2 aP;out vec2 vU;void main(){vU=aP*.5+.5;gl_Position=vec4(aP,0.,1.);}`;
const SKYFS=`#version 300 es
precision highp float;in vec2 vU;uniform mat4 uInvPV;uniform vec3 uCam;${SKYFN}out vec4 o;
void main(){vec4 a=uInvPV*vec4(vU*2.-1.,1.,1.);vec3 d=normalize(a.xyz/a.w-uCam);o=vec4(sky(d,true),1.);}`;
const DOWNFS=`#version 300 es
precision highp float;in vec2 vU;uniform sampler2D uTex;uniform vec2 uPx;uniform float uThresh;out vec4 o;
void main(){vec3 c=(texture(uTex,vU+uPx*vec2(-1,-1)).rgb+texture(uTex,vU+uPx*vec2(1,-1)).rgb+texture(uTex,vU+uPx*vec2(-1,1)).rgb+texture(uTex,vU+uPx*vec2(1,1)).rgb)*.25;
  if(uThresh>0.){float l=max(c.r,max(c.g,c.b));c*=max(0.,l-uThresh)/max(l,1e-4);}if(any(isnan(c)))c=vec3(0.);o=vec4(min(c,vec3(60.)),1.);}`;
const UPFS=`#version 300 es
precision highp float;in vec2 vU;uniform sampler2D uTex;uniform vec2 uPx;out vec4 o;
void main(){vec3 c=texture(uTex,vU).rgb*4.;c+=texture(uTex,vU+uPx*vec2(1,0)).rgb*2.+texture(uTex,vU-uPx*vec2(1,0)).rgb*2.+texture(uTex,vU+uPx*vec2(0,1)).rgb*2.+texture(uTex,vU-uPx*vec2(0,1)).rgb*2.;
  c+=texture(uTex,vU+uPx).rgb+texture(uTex,vU-uPx).rgb+texture(uTex,vU+uPx*vec2(1,-1)).rgb+texture(uTex,vU+uPx*vec2(-1,1)).rgb;o=vec4(c/16.,1.);}`;
const FINFS=`#version 300 es
precision highp float;in vec2 vU;uniform sampler2D uTex,uBloom;uniform float uFade,uBloomK,uExpo,uFxaa;uniform vec2 uPx;out vec4 o;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec3 tone(vec3 c){return pow(aces(c*uExpo),vec3(1./2.2));}
float lu(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){vec3 c=texture(uTex,vU).rgb;if(any(isnan(c))||any(isinf(c)))c=vec3(0.);
  if(uFxaa>.5){vec3 n=texture(uTex,vU+vec2(0,uPx.y)).rgb,s=texture(uTex,vU-vec2(0,uPx.y)).rgb,e=texture(uTex,vU+vec2(uPx.x,0)).rgb,w=texture(uTex,vU-vec2(uPx.x,0)).rgb;
    float ln=lu(n),ls=lu(s),le=lu(e),lw=lu(w),lc=lu(c),mn=min(lc,min(min(ln,ls),min(le,lw))),mx=max(lc,max(max(ln,ls),max(le,lw)));
    if(mx-mn>max(.04,mx*.12)){vec2 dir=vec2(-((ln)-(ls)),(le)-(lw));dir=dir/(min(abs(dir.x),abs(dir.y))+.05)*uPx;dir=clamp(dir,-uPx*3.,uPx*3.);
      c=(texture(uTex,vU+dir*.17).rgb+texture(uTex,vU-dir*.17).rgb+texture(uTex,vU+dir*.5).rgb+texture(uTex,vU-dir*.5).rgb)*.25;}}
  c+=texture(uBloom,vU).rgb*uBloomK;vec3 r=tone(c);float L=dot(r,vec3(.2126,.7152,.0722));r=mix(vec3(L),r,1.06);r=r*r*(3.-2.*r)*.18+r*.82;r*=mix(vec3(.98,1.,1.03),vec3(1.03,1.,.96),smoothstep(.2,.8,L));vec2 q=vU-.5;r*=1.-dot(q,q)*.35;o=vec4(mix(r,vec3(0.),uFade),1.);}`;

/* ---------- set-up ---------- */
function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function mkProg(v,f){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));ATTR.forEach(([n],i)=>gl.bindAttribLocation(p,i,n));gl.bindAttribLocation(p,0,'aP');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function uniforms(p,names){const o={};for(const n of names)o[n]=gl.getUniformLocation(p,n);return o;}
function texFrom(cv,repeat){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  const w=repeat?gl.REPEAT:gl.CLAMP_TO_EDGE;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,w);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,w);return t;}
function texArray(data,S,N){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,t);gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,gl.RGBA8,S,S,N,0,gl.RGBA,gl.UNSIGNED_BYTE,data);gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(aniso)gl.texParameterf(gl.TEXTURE_2D_ARRAY,aniso.TEXTURE_MAX_ANISOTROPY_EXT,8);return t;}
function colorTex(w,h,hdrOK){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,hdrOK?gl.RGBA16F:gl.RGBA8,w,h,0,gl.RGBA,hdrOK?gl.HALF_FLOAT:gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function fbFor(tex){const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);return f;}
function initGL(canvas){gl=canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});if(!gl)return false;
  extCBF=gl.getExtension('EXT_color_buffer_float');aniso=gl.getExtension('EXT_texture_filter_anisotropic');
  const ALLU=['uPV','uModel','uLVP','uTime','uWave','uAlb','uNrm','uTex2','uShadow','uMode','uTint','uGndCol','uFogCol','uCam','uAlpha','uFlash','uAdd','uFogD','uShadowOn','uAmb','uIndoor','uOff','uL','uLC','uNL','uMetal','uSunDir','uSunCol','uSkyCol','uHorCol','uNight','uCloud','uRes','uFog','uSnap','uTex','uSkin','uBones','uPal','uPalOn'];prog=mkProg(VS,FS);U=uniforms(prog,ALLU);
  sprog=mkProg(SVS,SFS);US=uniforms(sprog,ALLU);
  skyProg=mkProg(QVS,SKYFS);postProgs.sky=uniforms(skyProg,['uInvPV','uCam','uSunDir','uSunCol','uSkyCol','uHorCol','uNight','uTime','uCloud']);
  for(const [k,f] of [['down',DOWNFS],['up',UPFS],['fin',FINFS]]){const p=mkProg(QVS,f);postProgs[k]={p,u:uniforms(p,['uTex','uBloom','uPx','uThresh','uFade','uBloomK','uExpo','uFxaa'])};}
  if(typeof BODY_RES!='undefined')BODY_RES=[1.8,1.3,1][QUAL.lvl];
  const L=makeLayers(Q().tex);atlasTex=texArray(L.alb,L.S,L.N);nrmTex=texArray(L.nrm,L.S,L.N);waterTex=texFrom(makeWaterTex(),true);foamTex=texFrom(makeFoamTex(),true);
  gl.useProgram(prog);gl.uniform1i(U.uAlb,0);gl.uniform1i(U.uNrm,1);gl.uniform1i(U.uTex2,2);gl.uniform1i(U.uShadow,3);
  gl.uniform1fv(U.uMetal,new Float32Array(96).map((_,i)=>CELLS[i]?matOf(CELLS[i])[1]:0));
  quadVAO=gl.createVertexArray();gl.bindVertexArray(quadVAO);const qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
  dynBuf=mkVAO(null,true);resizeTargets(true);return true;}
function resizeTargets(force){const c=gl.canvas,s=Q().scale,w=Math.max(160,Math.round(c.width*s)),h=Math.max(120,Math.round(c.height*s));if(!force&&w==FW&&h==FH)return;FW=w;FH=h;
  const H=!!extCBF;if(hdr){for(const k of ['tex'])gl.deleteTexture(hdr[k]);}
  const tex=colorTex(w,h,H),fb=fbFor(tex);let msFB=null,msC=null,msD=null;const samples=Math.min(Q().msaa,gl.getParameter(gl.MAX_SAMPLES)||0);
  if(samples>0&&(H||true)){msFB=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,msFB);msC=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,msC);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,samples,H?gl.RGBA16F:gl.RGBA8,w,h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,msC);msD=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,msD);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,samples,gl.DEPTH_COMPONENT24,w,h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,msD);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!=gl.FRAMEBUFFER_COMPLETE)msFB=null;}
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb);const d=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,d);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,d);
  hdr={tex,fb,msFB,w,h,H};
  bloomT=[];let bw=w>>1,bh=h>>1;for(let i=0;i<5&&bw>8&&bh>8;i++){const t=colorTex(bw,bh,H);bloomT.push({t,f:fbFor(t),w:bw,h:bh});bw>>=1;bh>>=1;}
  const ss=Q().shadow;if(shadowTex){gl.deleteTexture(shadowTex);shadowTex=null;}
  if(ss){shadowTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,ss,ss,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    shadowFB=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFB);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowTex,0);}
  else{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1,1,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);shadowTex=t;}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);}

/* ---------- meshes ---------- */
const ATTR=[['aPos',3,'pos'],['aUV',2,'uv'],['aCol',3,'col'],['aSway',1,'sw'],['aNrm',3,'nrm'],['aBW',3,'bw']];
function attrData(m,key,size){const a=m[key];if(a&&a.length>=m.count*size)return new Float32Array(a);const o=new Float32Array(m.count*size);if(key=='nrm')for(let i=0;i<m.count;i++)o[i*3+1]=1;return o;}
function mkVAO(m,dynamic){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const bufs=[];
  for(const [name,size,key] of ATTR){if(key=='bw'&&!(m&&m.bw&&m.bw.length)){bufs.push(null);continue;}const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);if(m)gl.bufferData(gl.ARRAY_BUFFER,attrData(m,key,size),gl.STATIC_DRAW);
    const l=ATTR.findIndex(a=>a[0]==name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);bufs.push(b);}
  let idx=false;if(m&&m.idx){const e=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,e);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.idx,gl.STATIC_DRAW);idx=true;}
  gl.bindVertexArray(null);return{vao,bufs,idx,n:m?(idx?m.idx.length:m.count):0};}
function upload(o,m){gl.bindVertexArray(o.vao);ATTR.forEach(([,size,key],i)=>{if(!o.bufs[i])return;gl.bindBuffer(gl.ARRAY_BUFFER,o.bufs[i]);gl.bufferData(gl.ARRAY_BUFFER,attrData(m,key,size),gl.DYNAMIC_DRAW);});o.n=m.count;gl.bindVertexArray(null);}
function meshGL(m){return m.gl||(m.gl=mkVAO(m));}
let curSceneId=null;
function sceneMeshes(){if(curSceneId!==lv.id||!sceneGL||sceneGL.lv!==lv){const b=buildMesh(lv);bakeAO(lv,b.main);if(!lv.room)skirt(lv,b);sceneGL={lv,main:{chunks:splitMesh(b.main,16).map(c=>({vao:mkVAO(c.m),lo:c.lo,hi:c.hi}))},water:mkVAO(b.water),foam:mkVAO(b.foam),froth:mkVAO(b.froth),grass:typeof buildGrass=='function'?buildGrass(lv):null};curSceneId=lv.id;}return sceneGL;}

/* ---------- drawing calls the game uses ---------- */
// the level is cut into pieces about 16 m square so only the ones in view (or casting shadows into view) are drawn
function splitMesh(m,size){const C=new Map(),n=m.count,A=ATTR.filter(a=>m[a[2]]&&m[a[2]].length);for(let t=0;t<n;t+=3){const cx=(m.pos[t*3]+m.pos[t*3+3]+m.pos[t*3+6])/3,cz=(m.pos[t*3+2]+m.pos[t*3+5]+m.pos[t*3+8])/3,key=Math.floor(cx/size)+','+Math.floor(cz/size);
    let c=C.get(key);if(!c){c={m:new Mesh(),lo:[1e9,1e9,1e9],hi:[-1e9,-1e9,-1e9]};C.set(key,c);}
    for(const [,sz,k] of A){const src=m[k],dst=c.m[k];for(let i=t*sz;i<(t+3)*sz;i++)dst.push(src[i]);}
    for(let v=t*3;v<t*3+9;v+=3)for(let k=0;k<3;k++){const q=m.pos[v+k];if(q<c.lo[k])c.lo[k]=q;if(q>c.hi[k])c.hi[k]=q;}}
  return[...C.values()];}
function boxVisible(M,lo,hi,flat){let l=0,r=0,b=0,t=0,nr=0;for(let i=0;i<8;i++){const x=i&1?hi[0]:lo[0],y=i&2?hi[1]:lo[1],z=i&4?hi[2]:lo[2],cx=M[0]*x+M[4]*y+M[8]*z+M[12],cy=M[1]*x+M[5]*y+M[9]*z+M[13],cw=M[3]*x+M[7]*y+M[11]*z+M[15];
    if(cx<-cw)l++;if(cx>cw)r++;if(cy<-cw)b++;if(cy>cw)t++;if(!flat&&cw<0)nr++;}return!(l==8||r==8||b==8||t==8||nr==8);}
let chunkStat=[0,0];
function drawChunks(S){const sh=PASS=='shadow',M=sh?LVP:PV;let d=0;for(const c of S.chunks)if(boxVisible(M,c.lo,c.hi,sh)){drawVAO(c.vao);d++;}if(!sh)chunkStat=[d,S.chunks.length];}
function drawVAO(o,model,tex,opt){if(!o.n)return;gl.uniformMatrix4fv(U.uModel,false,model||M4id());
  if(PASS=='shadow'){if(tex===waterTex||tex===foamTex)return;gl.bindVertexArray(o.vao);if(o.idx)gl.drawElements(gl.TRIANGLES,o.n,gl.UNSIGNED_SHORT,0);else gl.drawArrays(gl.TRIANGLES,0,o.n);gl.bindVertexArray(null);return;}
  const mode=tex===waterTex?2:tex===foamTex?3:0;gl.uniform1i(U.uMode,mode);if(mode){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,tex);gl.activeTexture(gl.TEXTURE0);}
  if(opt&&opt.tint)gl.uniform3fv(U.uTint,opt.tint);if(opt&&opt.flash)gl.uniform1f(U.uFlash,opt.flash);if(opt&&opt.off)gl.uniform2fv(U.uOff,opt.off);
  gl.bindVertexArray(o.vao);if(o.idx)gl.drawElements(gl.TRIANGLES,o.n,gl.UNSIGNED_SHORT,0);else gl.drawArrays(gl.TRIANGLES,0,o.n);gl.bindVertexArray(null);
  if(opt){if(opt.tint)gl.uniform3f(U.uTint,1,1,1);if(opt.flash)gl.uniform1f(U.uFlash,0);if(opt.off)gl.uniform2f(U.uOff,0,0);}if(mode)gl.uniform1i(U.uMode,0);}
// fog, ambient and point lights for the main pass. lights are [x,y,z,radius,[r,g,b]]
function setCommon(fogCol,fog,amb,lights){const lfc=fogCol.map(v=>Math.pow(v,2.2));gl.uniform3fv(U.uFogCol,lfc);gl.uniform1f(U.uFogD,1.15/Math.max(8,fog[1])/(lv&&lv.room&&mode!='mini'?3.5:3.4));
  gl.uniform1f(U.uAmb,amb);gl.uniform1f(U.uAlpha,1);gl.uniform1f(U.uFlash,0);gl.uniform1f(U.uAdd,0);gl.uniform1f(U.uTime,frame/60);gl.uniform1f(U.uWave,0);gl.uniform2f(U.uOff,0,0);gl.uniform3f(U.uTint,1,1,1);gl.uniform1i(U.uMode,0);
  const L=new Float32Array(64),LC=new Float32Array(48);lights.slice(0,16).forEach((l,i)=>{L.set([l[0],l[1],l[2],l[3]*1.25],i*4);LC.set(l[4].map(v=>v*1.6),i*3);});
  gl.uniform4fv(U.uL,L);gl.uniform3fv(U.uLC,LC);gl.uniform1i(U.uNL,Math.min(16,lights.length));sunUniforms(U);}
function sunUniforms(u){gl.uniform3fv(u.uSunDir,SUN.dir);gl.uniform3fv(u.uSunCol,SUN.col);gl.uniform3fv(u.uSkyCol,SUN.sky);gl.uniform3fv(u.uHorCol,SUN.hor);gl.uniform1f(u.uNight,SUN.night);gl.uniform1f(u.uTime,frame/60);gl.uniform1f(u.uCloud,SUN.cloud);
  if(u.uGndCol)gl.uniform3fv(u.uGndCol,SUN.gnd);if(u.uIndoor!=null)gl.uniform1f(u.uIndoor,SUN.indoor);}

/* ---------- the sun, moon and sky for the time of day and weather ---------- */
function updateSun(indoor){const h=typeof hour=='function'&&st?hour():12,dk=typeof dark=='function'&&st&&!indoor?dark():0,wx=typeof wxNow=='function'&&lv?wxNow():0,wet=wx&&st&&st.wx!='clear'?wx:0;
  const day=h>=5.5&&h<19.5,t=day?(h-5.5)/14:((h-19.5+24)%24)/10,elev=Math.max(.12,Math.sin(t*Math.PI))*(day?1:.8),az=(day?-1:1)*(t-.5)*2.6+.6;
  const dir=[Math.cos(az)*Math.cos(Math.asin(elev)),elev,Math.sin(az)*Math.cos(Math.asin(elev))],l=Math.hypot(...dir);SUN.dir=dir.map(v=>v/l);
  const low=1-Math.min(1,elev*2.2),cl=Math.min(1,wet*1.2);let col=day?[3.2,2.95,2.6].map((v,i)=>v*(1-low*[.1,.4,.7][i])):[.42,.5,.75];col=col.map(v=>v*(1-cl*.85));
  const skyD=[.25,.45,.85],skyN=[.025,.035,.075],horD=[.62,.72,.85],horS=[.95,.55,.35],horN=[.03,.04,.08],gray=[.45,.48,.52];
  let sky=day?skyD.map((v,i)=>v*(1-low*.5)+[.2,.15,.25][i]*low*.5):skyN,hor=day?horD.map((v,i)=>v*(1-low)+horS[i]*low):horN;
  if(cl){sky=sky.map((v,i)=>v*(1-cl*.7)+gray[i]*(day?1:.08)*cl*.7);hor=hor.map((v,i)=>v*(1-cl*.7)+gray[i]*(day?1.1:.1)*cl*.7);}
  SUN.col=indoor?[0,0,0]:col;SUN.sky=indoor?[1.5,1.32,1.12]:sky.map(v=>v*.9);SUN.hor=indoor?[.5,.44,.38]:hor;SUN.gnd=indoor?[.55,.45,.36]:[.22,.2,.16].map(v=>v*(day?1:.15));SUN.night=indoor?0:Math.max(dk,day?0:1);SUN.cloud=Math.min(1,.35+cl);SUN.indoor=indoor?1:0;SUN.up=day;}
function lightVP(cx,cz){const R=QUAL.lvl==2?34:28,d=SUN.dir,ss=Q().shadow||1024,texel=2*R/ss;
  const up=Math.abs(d[1])>.99?[1,0,0]:[0,1,0];let V=M4.look([cx+d[0]*60,d[1]*60,cz+d[2]*60],[cx,0,cz],up);
  // keep the shadow from shimmering as you walk: snap the light's view to whole shadow texels
  const ox=V[12],oy=V[13];V[12]=Math.round(ox/texel)*texel;V[13]=Math.round(oy/texel)*texel;
  const P=[1/R,0,0,0,0,1/R,0,0,0,0,-2/150,0,0,0,-(150+1)/150,1];return M4.mul(P,V);}
function invert(m){const a=m,inv=new Array(16);
  inv[0]=a[5]*a[10]*a[15]-a[5]*a[11]*a[14]-a[9]*a[6]*a[15]+a[9]*a[7]*a[14]+a[13]*a[6]*a[11]-a[13]*a[7]*a[10];inv[4]=-a[4]*a[10]*a[15]+a[4]*a[11]*a[14]+a[8]*a[6]*a[15]-a[8]*a[7]*a[14]-a[12]*a[6]*a[11]+a[12]*a[7]*a[10];
  inv[8]=a[4]*a[9]*a[15]-a[4]*a[11]*a[13]-a[8]*a[5]*a[15]+a[8]*a[7]*a[13]+a[12]*a[5]*a[11]-a[12]*a[7]*a[9];inv[12]=-a[4]*a[9]*a[14]+a[4]*a[10]*a[13]+a[8]*a[5]*a[14]-a[8]*a[6]*a[13]-a[12]*a[5]*a[10]+a[12]*a[6]*a[9];
  inv[1]=-a[1]*a[10]*a[15]+a[1]*a[11]*a[14]+a[9]*a[2]*a[15]-a[9]*a[3]*a[14]-a[13]*a[2]*a[11]+a[13]*a[3]*a[10];inv[5]=a[0]*a[10]*a[15]-a[0]*a[11]*a[14]-a[8]*a[2]*a[15]+a[8]*a[3]*a[14]+a[12]*a[2]*a[11]-a[12]*a[3]*a[10];
  inv[9]=-a[0]*a[9]*a[15]+a[0]*a[11]*a[13]+a[8]*a[1]*a[15]-a[8]*a[3]*a[13]-a[12]*a[1]*a[11]+a[12]*a[3]*a[9];inv[13]=a[0]*a[9]*a[14]-a[0]*a[10]*a[13]-a[8]*a[1]*a[14]+a[8]*a[2]*a[13]+a[12]*a[1]*a[10]-a[12]*a[2]*a[9];
  inv[2]=a[1]*a[6]*a[15]-a[1]*a[7]*a[14]-a[5]*a[2]*a[15]+a[5]*a[3]*a[14]+a[13]*a[2]*a[7]-a[13]*a[3]*a[6];inv[6]=-a[0]*a[6]*a[15]+a[0]*a[7]*a[14]+a[4]*a[2]*a[15]-a[4]*a[3]*a[14]-a[12]*a[2]*a[7]+a[12]*a[3]*a[6];
  inv[10]=a[0]*a[5]*a[15]-a[0]*a[7]*a[13]-a[4]*a[1]*a[15]+a[4]*a[3]*a[13]+a[12]*a[1]*a[7]-a[12]*a[3]*a[5];inv[14]=-a[0]*a[5]*a[14]+a[0]*a[6]*a[13]+a[4]*a[1]*a[14]-a[4]*a[2]*a[13]-a[12]*a[1]*a[6]+a[12]*a[2]*a[5];
  inv[3]=-a[1]*a[6]*a[11]+a[1]*a[7]*a[10]+a[5]*a[2]*a[11]-a[5]*a[3]*a[10]-a[9]*a[2]*a[7]+a[9]*a[3]*a[6];inv[7]=a[0]*a[6]*a[11]-a[0]*a[7]*a[10]-a[4]*a[2]*a[11]+a[4]*a[3]*a[10]+a[8]*a[2]*a[7]-a[8]*a[3]*a[6];
  inv[11]=-a[0]*a[5]*a[11]+a[0]*a[7]*a[9]+a[4]*a[1]*a[11]-a[4]*a[3]*a[9]-a[8]*a[1]*a[7]+a[8]*a[3]*a[5];inv[15]=a[0]*a[5]*a[10]-a[0]*a[6]*a[9]-a[4]*a[1]*a[10]+a[4]*a[2]*a[9]+a[8]*a[1]*a[6]-a[8]*a[2]*a[5];
  let det=a[0]*inv[0]+a[1]*inv[4]+a[2]*inv[8]+a[3]*inv[12];det=det?1/det:0;return inv.map(v=>v*det);}

/* ---------- a frame ---------- */
let PV=null,camPos=[0,0,0],frameMS=16;
function drawSky(){gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.useProgram(skyProg);const u=postProgs.sky;gl.uniformMatrix4fv(u.uInvPV,false,invert(PV));gl.uniform3fv(u.uCam,camPos);sunUniforms(u);
  gl.bindVertexArray(quadVAO);gl.drawArrays(gl.TRIANGLES,0,6);gl.bindVertexArray(null);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.useProgram(prog);}
function worldPass(sceneFn,shadowFocus){
  // shadows first, from the sun's side
  const useSh=Q().shadow&&shadowFocus&&SUN.col[0]+SUN.col[1]+SUN.col[2]>.05;
  if(useSh){LVP=lightVP(shadowFocus[0],shadowFocus[1]);gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFB);gl.viewport(0,0,Q().shadow,Q().shadow);gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.useProgram(sprog);const saveU=U;U=US;PASS='shadow';gl.uniformMatrix4fv(US.uPV,false,LVP);gl.uniform1i(US.uAlb,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,atlasTex);gl.uniform1f(US.uTime,frame/60);gl.uniform1f(US.uWave,0);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,2);
    try{sceneFn(true);}finally{gl.disable(gl.POLYGON_OFFSET_FILL);PASS='main';U=saveU;}}
  // then the scene into the HDR buffer
  gl.bindFramebuffer(gl.FRAMEBUFFER,hdr.msFB||hdr.fb);gl.viewport(0,0,hdr.w,hdr.h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  drawSky();gl.useProgram(prog);gl.uniformMatrix4fv(U.uPV,false,PV);gl.uniformMatrix4fv(U.uLVP,false,LVP);gl.uniform3fv(U.uCam,camPos);gl.uniform1f(U.uShadowOn,useSh?1:0);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,atlasTex);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D_ARRAY,nrmTex);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.activeTexture(gl.TEXTURE0);
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);sceneFn(false);
  if(hdr.msFB){gl.bindFramebuffer(gl.READ_FRAMEBUFFER,hdr.msFB);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,hdr.fb);gl.blitFramebuffer(0,0,hdr.w,hdr.h,0,0,hdr.w,hdr.h,gl.COLOR_BUFFER_BIT,gl.NEAREST);}}
function post(fade){gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.bindVertexArray(quadVAO);const B=Q().bloom&&bloomT.length;
  if(B){let src=hdr.tex,sw=hdr.w,shh=hdr.h;const D=postProgs.down;gl.useProgram(D.p);gl.uniform1i(D.u.uTex,0);gl.activeTexture(gl.TEXTURE0);
    bloomT.forEach((b,i)=>{gl.bindFramebuffer(gl.FRAMEBUFFER,b.f);gl.viewport(0,0,b.w,b.h);gl.bindTexture(gl.TEXTURE_2D,src);gl.uniform2f(D.u.uPx,1/sw,1/shh);gl.uniform1f(D.u.uThresh,i==0?1.1:0);gl.drawArrays(gl.TRIANGLES,0,6);src=b.t;sw=b.w;shh=b.h;});
    const Up=postProgs.up;gl.useProgram(Up.p);gl.uniform1i(Up.u.uTex,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
    for(let i=bloomT.length-1;i>0;i--){const s=bloomT[i],d=bloomT[i-1];gl.bindFramebuffer(gl.FRAMEBUFFER,d.f);gl.viewport(0,0,d.w,d.h);gl.bindTexture(gl.TEXTURE_2D,s.t);gl.uniform2f(Up.u.uPx,1/s.w,1/s.h);gl.drawArrays(gl.TRIANGLES,0,6);}
    gl.disable(gl.BLEND);}
  const F=postProgs.fin;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.canvas.width,gl.canvas.height);gl.useProgram(F.p);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,hdr.tex);gl.uniform1i(F.u.uTex,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,B?bloomT[0].t:hdr.tex);gl.uniform1i(F.u.uBloom,1);gl.activeTexture(gl.TEXTURE0);
  gl.uniform1f(F.u.uBloomK,B?.055:0);gl.uniform1f(F.u.uExpo,.9);gl.uniform1f(F.u.uFade,fade||0);gl.uniform1f(F.u.uFxaa,hdr.msFB?0:1);gl.uniform2f(F.u.uPx,1/hdr.w,1/hdr.h);
  gl.drawArrays(gl.TRIANGLES,0,6);gl.bindVertexArray(null);}
let lastT=0;
function render(fade){const now=performance.now();if(lastT)qualityTick(now-lastT);lastT=now;resizeTargets(false);
  gl.useProgram(prog);
  if(mode=='mini'&&typeof mini!='undefined'&&mini){const indoor=mini.kind=='hoops'||mini.kind=='pin';updateSun(indoor);if(!indoor){SUN.dir=[.45,.75,.35];const l=Math.hypot(...SUN.dir);SUN.dir=SUN.dir.map(v=>v/l);SUN.col=[3.1,2.9,2.6];SUN.sky=[.28,.5,.9];SUN.hor=[.65,.75,.88];SUN.gnd=[.22,.2,.16];SUN.night=0;}
    const [eye,tg]=miniCam(mini);camPos=eye;PV=M4.mul(M4.persp(1.0,gl.canvas.width/gl.canvas.height,.3,160),M4.look(eye,tg,[0,1,0]));
    worldPass(sh=>{if(!sh){gl.uniformMatrix4fv(U.uPV,false,PV);}renderMini(sh);},indoor?null:[ (eye[0]+tg[0])/2,(eye[2]+tg[2])/2 ]);}
  else if(lv&&st&&cam){updateSun(!!lv.room);const env=envLook(),sx=shake>0?(Math.random()-.5)*shake*.03:0,sy=shake>0?(Math.random()-.5)*shake*.03:0;camPos=[cam.x+sx,cam.y+sy,cam.z];
    PV=M4.mul(M4.persp(.9,gl.canvas.width/gl.canvas.height,.2,220),M4.look(camPos,[cam.tx,cam.ty,cam.tz],[0,1,0]));
    worldPass(shp=>{if(!shp){setCommon(env.fogCol,env.fog,env.amb,lightsNow());if(flash>0)gl.uniform1f(U.uFlash,flash/12);}
      const S=sceneMeshes();drawChunks(S.main);gl.uniform1f(U.uWave,1);drawVAO(S.water,null,waterTex,{off:[frame*.0012,frame*.0007]});drawVAO(S.foam,null,foamTex,{off:[0,-frame*.012]});if(S.froth)drawVAO(S.froth);gl.uniform1f(U.uWave,0);
      if(!shp&&S.grass&&Q().grass&&typeof drawGrass=='function')drawGrass(S.grass);
      drawEntities();if(!shp)drawBillboards(env);},lv.room?null:[p.x,p.z]);}
  post(fade);}

/* ---------- the world past the map's edge: ground and river carry on into the haze ---------- */
function skirt(lv,b){const M=20,wy=b.water.count?b.water.pos[1]:-.3,cl=(v,n)=>Math.max(0,Math.min(n-1,v));
  for(let z=-M;z<lv.h+M;z++)for(let x=-M;x<lv.w+M;x++){if(x>=0&&z>=0&&x<lv.w&&z<lv.h)continue;const c=lv.d.rows[cl(z,lv.h)][cl(x,lv.w)],X0=x*TS,Z0=z*TS;
    if(WATER.includes(c)){b.water.quad([X0,wy,Z0+TS],[X0+TS,wy,Z0+TS],[X0+TS,wy,Z0],[X0,wy,Z0],'water');continue;}
    const far=Math.max(-x,-z,x-lv.w+1,z-lv.h+1),cell=GROUND[c]&&c!='F'?GROUND[c]:'grass',flat='psnSK=-'.includes(c);
    // rolling hills that start a few tiles out, continuous from tile to tile
    const Y=(vx,vz)=>{if(flat)return 0;const d=Math.max(-vx,-vz,vx-lv.w,vz-lv.h);return d<3?0:Math.min(6,(d-3)*.35)*(.6+.4*Math.sin(vx*.31)*Math.cos(vz*.27));};
    b.main.quad([X0,Y(x,z+1),Z0+TS],[X0+TS,Y(x+1,z+1),Z0+TS],[X0+TS,Y(x+1,z),Z0],[X0,Y(x,z),Z0],far>3&&cell!='sand'?'grass':cell);
    if(far>1&&hash(x,z,9)%3==0&&!flat){const r=1+hash(x,z,2)%10/10,tx=X0+1,tz=Z0+1,y=Y(x+.5,z+.5);if(hash(x,z,4)%3==0)conifer(b.main,tx,tz,hash(x,z,7),r,y);else deciduous(b.main,tx,tz,hash(x,z,7),r,y);}}}
/* ---------- contact shading: darken the ground where it meets walls, and the feet of walls ---------- */
function bakeAO(lv,m){const tall=c=>c!=null&&'BXDWe'.includes(c),T=(x,z)=>tall(tileAt(lv,x,z));
  for(let i=0;i<m.count;i++){const x=m.pos[i*3],y=m.pos[i*3+1],z=m.pos[i*3+2],ny=m.nrm[i*3+1];let ao=1;
    if(ny>.9&&y<.35){const gx=x/TS,gz=z/TS,tx=Math.round(gx),tz=Math.round(gz);
      if(Math.abs(gx-tx)<.02&&Math.abs(gz-tz)<.02){const n=(T(tx-1,tz-1)?1:0)+(T(tx,tz-1)?1:0)+(T(tx-1,tz)?1:0)+(T(tx,tz)?1:0);ao=n?1-.16*n:1;}}
    else if(Math.abs(ny)<.3&&y<2.5)ao=.62+.38*Math.min(1,y/2.2);
    if(ao<1){m.col[i*3]*=ao;m.col[i*3+1]*=ao;m.col[i*3+2]*=ao;}}}
/* ---------- grass: thousands of instanced blades near you, swaying in the wind ---------- */
let gprog=null,GU={},bladeBuf=null;
const GVS=`#version 300 es
precision highp float;layout(location=0) in vec3 aB;layout(location=1) in vec4 aI;layout(location=2) in float aV;
uniform mat4 uPV;uniform float uTime;uniform vec3 uCam,uFocus;out vec3 vC;out vec3 vW;out float vH;
void main(){float s=sin(aI.z),c=cos(aI.z);vec3 b=vec3(aB.x*c,aB.y,aB.x*s)*vec3(1.,aI.w,1.);float d=distance(aI.xy,uFocus.xz);b.y*=smoothstep(30.,18.,d);
  float w=sin(uTime*1.7+aI.x*.45+aI.y*.3)*.5+sin(uTime*3.1+aI.x*1.3)*.2;vec3 p=vec3(aI.x,0.,aI.y)+b+vec3(w*.18,0.,w*.08)*aB.y*aB.y;
  vW=p;vH=aB.y;vC=mix(vec3(.2,.34,.1),vec3(.36,.48,.16),aV)*(.45+aB.y*.8);gl_Position=uPV*vec4(p,1.);}`;
const GFS=`#version 300 es
precision highp float;in vec3 vC;in vec3 vW;in float vH;uniform vec3 uSunCol,uSkyCol,uFogCol,uCam;uniform float uFogD,uAmb;out vec4 o;
void main(){vec3 c=vC*vC*(uSunCol*.35+uSkyCol*uAmb*.5);float d=distance(vW,uCam);float f=1.-exp(-d*uFogD);o=vec4(mix(c,uFogCol,f),1.);}`;
function buildGrass(lv){if(lv.room)return null;const inst=[];
  for(let z=0;z<lv.h;z++)for(let x=0;x<lv.w;x++){const c=lv.d.rows[z][x];if(c!='.'&&c!=',')continue;const n=c==','?10:44;
    for(let k=0;k<n;k++){const h=hash(x*7+k,z*13,91);inst.push((x+(h%1000)/1000)*TS,(z+((h>>10)%1000)/1000)*TS,((h>>4)%628)/100,.24+((h>>12)%30)/100,((h>>20)%100)/100);}}
  if(!inst.length)return null;if(!gprog){gprog=mkProg(GVS,GFS);GU=uniforms(gprog,['uPV','uTime','uCam','uFocus','uSunCol','uSkyCol','uFogCol','uFogD','uAmb']);
    bladeBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bladeBuf);const w=.032;gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-w,0,0,w,0,0,-w*.7,.4,0, w,0,0,w*.7,.4,0,-w*.7,.4,0, -w*.7,.4,0,w*.7,.4,0,0,.8,0]),gl.STATIC_DRAW);}
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,bladeBuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ib);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inst),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,20,0);gl.vertexAttribDivisor(1,1);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,20,16);gl.vertexAttribDivisor(2,1);
  gl.bindVertexArray(null);return{vao,n:inst.length/5};}
function drawGrass(G){gl.useProgram(gprog);gl.uniformMatrix4fv(GU.uPV,false,PV);gl.uniform1f(GU.uTime,frame/60);gl.uniform3fv(GU.uCam,camPos);gl.uniform3f(GU.uFocus,p.x,0,p.z);
  gl.uniform3fv(GU.uSunCol,SUN.col);gl.uniform3fv(GU.uSkyCol,SUN.sky);const e=envLook();gl.uniform3fv(GU.uFogCol,e.fogCol.map(v=>Math.pow(v,2.2)));gl.uniform1f(GU.uFogD,1.15/Math.max(8,e.fog[1])/3.4);gl.uniform1f(GU.uAmb,e.amb);
  gl.bindVertexArray(G.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,9,G.n);gl.bindVertexArray(null);gl.useProgram(prog);}

// SPDX-License-Identifier: GPL-3.0-or-later
import { ORIGINAL } from '../core/config.js';
import { deg, identity, multiply, perspective, rotationX, rotationY, rotationZ, scale, translation } from './math.js';
import { makeBox, makeCylinderZ, makePlaneXZ, makeSphere } from './meshes.js';

const VS=`attribute vec3 aPos; attribute vec3 aNormal; uniform mat4 uMvp; uniform mat4 uModel; varying vec3 vN; varying vec3 vP; varying vec3 vLocal; void main(){ vec4 wp=uModel*vec4(aPos,1.0); vP=wp.xyz; vLocal=aPos; vN=mat3(uModel)*aNormal; gl_Position=uMvp*vec4(aPos,1.0); }`;
const FS=`precision mediump float; uniform vec4 uColor; uniform float uUseTexture; uniform sampler2D uTexture; varying vec3 vN; varying vec3 vP; varying vec3 vLocal; void main(){ vec3 c=uColor.rgb; if(uUseTexture>0.5){ vec2 uv=vLocal.xz*0.5+0.5; c*=texture2D(uTexture,uv).rgb; } float l=0.35+0.65*max(dot(normalize(vN),normalize(vec3(0.25,0.9,0.45))),0.0); gl_FragColor=vec4(c*l,uColor.a); }`;

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function program(gl){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VS));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function upload(gl,m){const vao={};vao.v=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vao.v);gl.bufferData(gl.ARRAY_BUFFER,m.vertices,gl.STATIC_DRAW);vao.n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vao.n);gl.bufferData(gl.ARRAY_BUFFER,m.normals,gl.STATIC_DRAW);vao.i=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,vao.i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.indices,gl.STATIC_DRAW);vao.count=m.indices.length;return vao;}
function imageTexture(gl,url){
  const t=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  const img=new Image();
  img.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);};
  img.src=url;
  return t;
}

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas=canvas; this.gl=canvas.getContext('webgl',{alpha:true,antialias:true}); if(!this.gl) throw new Error('WebGL unavailable');
    const gl=this.gl; this.p=program(gl); this.loc={pos:gl.getAttribLocation(this.p,'aPos'),normal:gl.getAttribLocation(this.p,'aNormal'),mvp:gl.getUniformLocation(this.p,'uMvp'),model:gl.getUniformLocation(this.p,'uModel'),color:gl.getUniformLocation(this.p,'uColor'),useTexture:gl.getUniformLocation(this.p,'uUseTexture'),texture:gl.getUniformLocation(this.p,'uTexture')};
    this.mesh={box:upload(gl,makeBox()),sphere:upload(gl,makeSphere()),cyl:upload(gl,makeCylinderZ()),plane:upload(gl,makePlaneXZ())};
    this.floorTexture=imageTexture(gl,'assets/floor-vortex.png');
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  }
  resize(){const d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.floor(this.canvas.clientWidth*d)),h=Math.max(1,Math.floor(this.canvas.clientHeight*d));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);}
  bind(m){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,m.v);gl.enableVertexAttribArray(this.loc.pos);gl.vertexAttribPointer(this.loc.pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,m.n);gl.enableVertexAttribArray(this.loc.normal);gl.vertexAttribPointer(this.loc.normal,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.i);}
  draw(m,model,color,vp,useTexture=0){const gl=this.gl;this.bind(m);gl.uniformMatrix4fv(this.loc.model,false,model);gl.uniformMatrix4fv(this.loc.mvp,false,multiply(vp,model));gl.uniform4fv(this.loc.color,color);gl.uniform1f(this.loc.useTexture,useTexture);if(useTexture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.floorTexture);gl.uniform1i(this.loc.texture,0);}gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);}
  render(s){this.resize();const gl=this.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.p);const aspect=this.canvas.width/this.canvas.height;let view=identity();view=multiply(view,translation(s.camera.x,s.camera.y,s.camera.z));view=multiply(view,rotationX(deg(s.camera.rx)));view=multiply(view,rotationY(deg(s.camera.ry)));view=multiply(view,rotationZ(deg(s.camera.rz)));const vp=multiply(perspective(deg(ORIGINAL.cameraFovY),aspect,1,2048),view);
    // The historical BMP media are not redistributed. The floor uses a new replacement texture created for this restoration.
    this.draw(this.mesh.box,multiply(translation(0,-0.45,0),scale(ORIGINAL.floorWidth/2,0.28,ORIGINAL.floorDepth/2)),[0.12,0.12,0.42,0.82],vp);
    this.draw(this.mesh.plane,multiply(translation(0,-0.16,0),scale(ORIGINAL.floorWidth/2,1,ORIGINAL.floorDepth/2)),[0.72,0.78,1,0.92],vp,1);
    this.draw(this.mesh.box,multiply(translation(0,0,-ORIGINAL.floorDepth/2-0.45),scale(ORIGINAL.floorWidth/2,0.6,0.45)),[0.2,0.28,1,1],vp);
    this.draw(this.mesh.box,multiply(translation(0,0,ORIGINAL.floorDepth/2+0.45),scale(ORIGINAL.floorWidth/2,0.6,0.45)),[0.2,0.28,1,1],vp);
    s.players.forEach((p,idx)=>{const c=idx===0?ORIGINAL.colors.player1:ORIGINAL.colors.player2;const center=p.z+p.width/2;this.draw(this.mesh.cyl,multiply(translation(p.x,0,center),scale(p.radius,p.radius,p.width/2)),c,vp);this.draw(this.mesh.sphere,multiply(translation(p.x,0,p.z),scale(p.radius,p.radius,p.radius)),c,vp);this.draw(this.mesh.sphere,multiply(translation(p.x,0,p.z+p.width),scale(p.radius,p.radius,p.radius)),c,vp);});
    this.draw(this.mesh.sphere,multiply(translation(s.ball.x,0,s.ball.z),scale(s.ball.radius,s.ball.radius,s.ball.radius)),ORIGINAL.colors.ball,vp);
  }
}

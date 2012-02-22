attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

varying vec3 vVertexNormal;

void main() {
  vVertexNormal = aVertexNormal;
  gl_Position = vec4(aVertexPosition,1);
}
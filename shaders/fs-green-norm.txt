precision mediump float;

varying vec3 vVertexNormal;

void main() {
	vec4 col = vec4(0,1,0,1);
	vec3 lightDir = normalize(vec3(0.5,0,-1));
	float diffuse = dot(vVertexNormal,lightDir);
 	gl_FragColor = vec4(col.r*diffuse, col.g*diffuse, col.b*diffuse, col.a);
}
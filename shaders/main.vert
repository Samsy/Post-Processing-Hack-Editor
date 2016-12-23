attribute vec2 position;

uniform vec2 resolution;

varying vec2 uv;

void main(){
	
	uv = (position + 1.0) / 2.0;

	gl_Position = vec4(position,1.0,1.0);
}
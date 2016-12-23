precision highp float;

uniform float iGlobalTime;

uniform vec2 mouse;

uniform sampler2D tInput;

uniform vec2 iResolution;

varying vec2 uv;

void main(){

	vec4 color = texture2D( tInput, uv );

	gl_FragColor = color;

}
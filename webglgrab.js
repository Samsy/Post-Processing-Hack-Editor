
(function() {

// guard and increment to loop through canvas


if (window.hasThisRun) {

	window.currentWebglExt.increment()

	return;
};

window.hasThisRun = true;

// Rest of code


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-89389770-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

/**
 * Initialialize the webgl component
 *
 * @param {canvasSource} canvas - Canvas source
 * @param {fragsource} text - Fragment shader content
 * @return {number}
 */

function WebglFrag(canvasSource, fragsource) {

	this.canvasIncrement = 0

	this.fragsource = 0 || fragsource

	this.canvas = null

	this.canvasSource = canvasSource

	this.initVariablesWebgl()

	this.afterloadEvent = this.afterload.bind(this)

	// this.afterloadEvent : callback of shaderloader

	this.createShaderLoader(this.afterloadEvent)

}

/**
 * Initialialize variables
 *
 */

WebglFrag.prototype.initVariablesWebgl = function() {

	this.canvas = document.createElement('canvas');

	this.canvas.id = 'webglpost'

	this.canvas.style.pointerEvents = 'none'

	this.canvas.width = this.canvasSource.width;

	this.canvas.height = this.canvasSource.height;

	this.canvas.style.position = 'absolute';

	var rect = this.canvasSource.getBoundingClientRect();

	this.canvas.style.left = rect.left + 'px'

	this.canvas.style.top = rect.top + 'px'

	this.originalFragmentShader = null

	this.currentFragmentShader = null

	this.animateEvent = this.animate.bind(this)

	document.body.appendChild(this.canvas);

	this.start_time = Date.now();

	this.GL = this.canvas.getContext('webgl', { 
		antialias: false,

		depth: false,

		stencil: false,

		alpha: true
	});

	this.w = 0;

	this.h = 0;

}

/**
 * Function callback after the shader content are loaded
 * Initialise all attributes, variables, and functions required to run a webgl program
 *
 */

WebglFrag.prototype.afterload = function() { 

	this.canvasSource.style.opacity = 0
	
	this.compileShader()

	this.createProgram();

	this.createTexture()

	this.createBuffer();

	this.createAttributes();

	this.createUniforms();

	this.addEvents();

	this.onResize();

	this.animate();

	shaderEditor();
}


/**
 * Manage a new shader compilation
 *
 */


WebglFrag.prototype.onChangeShader = function() {

	// recompile shader

	this.GL.shaderSource(this.fragmentShader,  this.editor.getValue());

	this.GL.compileShader(this.fragmentShader);

	// test if there is no compile shading error

	// if error log the error and return

	if (!this.GL.getShaderParameter(this.fragmentShader , this.GL.COMPILE_STATUS)) {

	    console.log(this.GL.getShaderInfoLog(this.fragmentShader ));

	    return null;
	}

	else {

		// else recompile successfully with the new shader

		this.currentFragmentShader = this.editor.getValue()

		this.textShaders.shaders['mainfrag'].content = this.currentFragmentShader

		this.createProgram();
	
		this.createBuffer();

		this.createAttributes();

		this.createUniforms();

		this.onResize();
	}

}

/**
 * Create a webgl texture
 *
 */


WebglFrag.prototype.createTexture = function() { 

    this.tInput = this.generateTexture(2048.0, this.GL.RGBA, this.GL.LINEAR, this.GL.LINEAR, this.GL.UNSIGNED_BYTE, this.canvasSource);
	
}

/**
 * Create a buffer quad to display the texture on
 *
 */

WebglFrag.prototype.createBuffer = function() { 

	if(this.buffer) {

		this.GL.deleteBuffer(this.buffer);
		
	}

	// quad in full screen with triangle strip 
	// https://en.wikipedia.org/wiki/Triangle_strip

	this.vertices = new Float32Array([

		-1,   1,
		 1,   1,
		-1,  -1,
		 1,  -1

	]);

	this.buffer = this.GL.createBuffer();

	this.GL.bindBuffer(this.GL.ARRAY_BUFFER,this.buffer);

	this.GL.bufferData(this.GL.ARRAY_BUFFER,this.vertices,this.GL.STATIC_DRAW);

	this.GL.useProgram(this.program);
}


/**
 * Attachs position attributes to the program
 *
 */


WebglFrag.prototype.createAttributes = function() { 

	this.attributes = {};

	this.attributes.position = this.GL.getAttribLocation(this.program,'position');

	this.GL.enableVertexAttribArray(this.attributes.position);

	this.GL.vertexAttribPointer(this.attributes.position,2,this.GL.FLOAT,false,0,0);

}

/**
 * Attachs shader to programs
 *
 */

WebglFrag.prototype.createProgram = function() { 

	this.program = this.GL.createProgram();

	this.GL.attachShader(this.program,this.vertexShader);

	this.GL.attachShader(this.program,this.fragmentShader);

	this.GL.linkProgram(this.program);
}

/**
 * Attachs uniforms that are injected into the shader
 *
 */


WebglFrag.prototype.createUniforms = function() {

	this.uniforms = {};

	this.program.iGlobalTime = this.GL.getUniformLocation(this.program,'iGlobalTime');

	this.uniforms.iGlobalTime = 0;

	this.GL.uniform1f(this.program.iGlobalTime,this.uniforms.iGlobalTime)

	this.program.iResolution = this.GL.getUniformLocation(this.program,'iResolution');

	this.uniforms.iResolution = {x:window.innerWidth,y:window.innerHeight};

	this.GL.uniform2f(this.program.iResolution,this.uniforms.iResolution.x,this.uniforms.iResolution.y);

	// set to center
	this.program.mouse = this.GL.getUniformLocation(this.program,'mouse');

	this.uniforms.mouse = {x:0,y:0};

	this.GL.uniform2f(this.program.mouse,this.uniforms.mouse.x,this.uniforms.mouse.y);

	this.program.inputtexture = this.GL.getUniformLocation(this.program, "tInput");

	this.GL.uniform1i(this.program.inputtexture, 0);


}

WebglFrag.prototype.addEvents = function() {


	this.onMouseMoveEvent = this.onMouseMove.bind(this)

	this.onResizeEvent = this.onResize.bind(this)

	this.onLostContextEvent = this.onLostContext.bind(this)

	this.onRestoredContextEvent = this.onRestoredContext.bind(this)

	window.addEventListener('resize', this.onResizeEvent)

	window.addEventListener('mousemove', this.onMouseMoveEvent )
	
	this.canvas.addEventListener("webglcontextlost", this.onLostContextEvent);
	
	this.canvas.addEventListener("webglcontextrestored", this.onRestoredContextEvent);

	this.eventsActive = true

}


WebglFrag.prototype.removeEvents = function() {

	window.removeEventListener('resize', this.onResizeEvent)

	window.removeEventListener('mousemove', this.onMouseMoveEvent )

	this.canvas.removeEventListener("webglcontextlost", this.onLostContextEvent);
	
	this.canvas.removeEventListener("webglcontextrestored", this.onRestoredContextEvent);

	this.eventsActive = false

}

WebglFrag.prototype.onLostContext = function() {

	cancelAnimationFrame(this.RAF);

}

WebglFrag.prototype.onRestoredContext = function() {

	this.RAF = requestAnimationFrame(this.animateEvent)
}


/**
 * Increment count number of canvas
 *
 */

WebglFrag.prototype.increment = function() {

	this.canvasIncrement++

	this.allCanvas = document.querySelectorAll('canvas')

	this.canvasSource = this.allCanvas[this.canvasIncrement % (this.allCanvas.length - 1)]

	this.onResize();

}

/**
 * On click editor button back
 *
 */

WebglFrag.prototype.onBack = function() {

	this.editor.setValue(this.originalFragmentShader);

	this.onChangeShader()

	this.editor.clearSelection();

}

/**
 * On click editor button close
 *
 */

WebglFrag.prototype.onClose = function() {

	document.querySelector('.editor-wrapper').style.display = 'none'

	// this.removeEditorEvents()

	// this.onBack()
}


// update mouse uniforms on move ( with a ratio )

WebglFrag.prototype.onMouseMove = function(e) {

	var x = (e.clientX / this.w - 0.5) * 2;

	var y = -(e.clientY/ this.h - 0.5) * 2;

	this.uniforms.mouse = {x:x,y:y};

	this.GL.uniform2f(this.program.mouse,this.uniforms.mouse.x,this.uniforms.mouse.y);

}

// Render loop

WebglFrag.prototype.draw = function() {

	// update uniforms
	this.uniforms.iGlobalTime  = 0.0016 * (Date.now() - this.start_time);

	this.GL.uniform1f(this.program.iGlobalTime,this.uniforms.iGlobalTime);

	// clear

	this.GL.clear(this.GL.COLOR_BUFFER_BIT);

	// update texture

	this.updateTexture()

	// draw quad with the texture

	// https://en.wikipedia.org/wiki/Triangle_strip

	this.GL.drawArrays(this.GL.TRIANGLE_STRIP, 0, this.vertices.length / 2);

	// clean up

	this.GL.bindBuffer(this.GL.ARRAY_BUFFER, null);

}


WebglFrag.prototype.updateTexture = function() {

	this.GL.bindTexture(this.GL.TEXTURE_2D,  this.tInput);

	this.GL.pixelStorei(this.GL.UNPACK_FLIP_Y_WEBGL, true);

	this.GL.texImage2D(this.GL.TEXTURE_2D, 0, this.GL.RGBA, this.GL.RGBA, this.GL.UNSIGNED_BYTE, this.canvasSource);

}

WebglFrag.prototype.animate = function() {

	this.RAF = requestAnimationFrame(this.animateEvent)

	this.draw();

}


//  generate a webgl texture 2D

WebglFrag.prototype.generateTexture = function(textureSize, format, maxFilter, minFilter, type, canvasSource) {
    
    var texture = this.GL.createTexture();

    texture.size = textureSize;

    this.GL.bindTexture(this.GL.TEXTURE_2D, texture);

    this.GL.texImage2D(this.GL.TEXTURE_2D, 0, format, format, type, canvasSource);

    this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_MAG_FILTER, maxFilter);

    this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_MIN_FILTER, minFilter);

    this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_WRAP_S, this.GL.CLAMP_TO_EDGE);

    this.GL.texParameteri(this.GL.TEXTURE_2D, this.GL.TEXTURE_WRAP_T, this.GL.CLAMP_TO_EDGE);

    return texture;
}

WebglFrag.prototype.onResize = function() {

	this.w = parseInt(this.canvasSource.style.width,10)

	this.h = parseInt(this.canvasSource.style.height, 10)

	this.wp = this.canvasSource.style.width;

	this.hp = this.canvasSource.style.height;

	this.canvas.width =  this.canvasSource.width;

	this.canvas.height =  this.canvasSource.height;

	this.canvas.style.width =  this.wp;

	this.canvas.style.height =  this.hp;

	this.uniforms.iResolution = {x: this.w , y:this.h};

	// update viewport
	this.GL.viewport(0, 0, this.canvasSource.width, this.canvasSource.height);

	// update iResolution
	this.GL.uniform2f(this.program.iResolution,this.uniforms.iResolution.x,this.uniforms.iResolution.y);

	var rect = this.canvasSource.getBoundingClientRect();

	this.canvas.style.left = rect.left + 'px'

	this.canvas.style.top = rect.top + 'px'
}


WebglFrag.prototype.destroy = function() {

	if (this.eventsActive) {

		this.removeEvents()

	}

	if (this.RAF) {

		cancelAnimationFrame(this.RAF);

	}

	if (this.GL) {

		if (this.texture) {

			this.GL.deleteTexture(this.texture);

		}

		if (this.buffer) {

			this.GL.deleteBuffer(this.buffer);

		}

		this.GL.getExtension('WEBGL_lose_context').loseContext();
		
	}

	document.body.removeChild(this.canvas);

	this.canvas = null

	this.GL = null

	this.canvasSource.style.opacity = 1

}


// --------------------- EDITOR ------------------------

/**
 * Init the shader editor
 *
 */

WebglFrag.prototype.initEditor = function() {

	this.initVariablesEditor()

	this.initEditorTheme();

	var editor = document.querySelector('#editor')
	
	editor.style.position = 'absolute'
	
	editor.style.left = '0px'
	
	editor.style.top = '0px'
	
	editor.style.backgroundColor ='rgba(255,255,255,0.5)'

	//this.initEditorEvents()

}

WebglFrag.prototype.initVariablesEditor = function() {

	this.onChangeShaderEvent = this.onChangeShader.bind(this)

	this.onBackEvent = this.onBack.bind(this)

	this.onCloseEvent = this.onClose.bind(this)

	this.playButton = document.querySelector('.editor-play')

	this.backButton = document.querySelector('.editor-back')

	this.closeButton = document.querySelector('.editor-close')

}

// WebglFrag.prototype.initEditorEvents = function() {

// 	this.editorEventsActive = true

// 	this.playButton.addEventListener('click', this.onChangeShaderEvent)

// 	this.backButton.addEventListener('click', this.onBackEvent)

// 	this.closeButton.addEventListener('click', this.onCloseEvent)
// }

// WebglFrag.prototype.removeEditorEvents = function() {

// 	this.editorEventsActive = false

// 	this.playButton.removeEventListener('click', this.onChangeShaderEvent)

// 	this.backButton.removeEventListener('click', this.onBackEvent)

// 	this.closeButton.removeEventListener('click', this.onCloseEvent)
// }

WebglFrag.prototype.initEditorTheme = function() {
	
	this.editor = ace.edit("editor");

	this.editor.setTheme("ace/theme/chrome");

	this.editor.getSession().setMode("ace/mode/glsl");

	this.editor.getSession().setUseWrapMode(true);

	this.editor.setOptions({
	    maxLines: 40
	});

	this.editor.setHighlightGutterLine(false);

	this.editor.setShowPrintMargin(false);

	this.editor.$blockScrolling = Infinity

	this.editor.splitLine();

	this.editor.setValue( this.fragsource ? this.fragsource : this.originalFragmentShader );

	this.editor.clearSelection();

	this.editor.getSession().on('change', this.onChangeShader.bind(this));

}

// --------------------- /EDITOR ------------------------





// --------------------- Shader Loader and utils ------------------------

WebglFrag.prototype.createShaderLoader = function(func) { 
	
	// load classic shaders content with ajax

	this.textShaders = new ShaderLoader();

	this.textShaders.add('mainvert', 'shaders/main.vert')

	this.textShaders.add('mainfrag', 'shaders/main.frag')

    this.textShaders.onLoaded(func);

    this.textShaders.load();

	
}

WebglFrag.prototype.compileShader = function() {

	this.originalFragmentShader = this.textShaders.shaders['mainfrag'].content

	this.currentFragmentShader =  this.fragsource ? this.fragsource : this.textShaders.shaders['mainfrag'].content

	//vertex shader

	this.vertexShader = this.GL.createShader(this.GL.VERTEX_SHADER);

	this.GL.shaderSource(this.vertexShader, this.textShaders.shaders['mainvert'].content);

	this.GL.compileShader(this.vertexShader);

	if (!this.GL.getShaderParameter(this.vertexShader , this.GL.COMPILE_STATUS)) {

	    console.log(this.GL.getShaderInfoLog(this.vertexShader ));

	    return null;
	}


	//fragment shader
	this.fragmentShader = this.GL.createShader(this.GL.FRAGMENT_SHADER);

	this.GL.shaderSource(this.fragmentShader, this.currentFragmentShader );

	this.GL.compileShader(this.fragmentShader);

	if (!this.GL.getShaderParameter(this.fragmentShader , this.GL.COMPILE_STATUS)) {

		console.log(this.textShaders.shaders['mainfrag'].content)

	    console.log(this.GL.getShaderInfoLog(this.fragmentShader ));

	    return null;
	}

}


var ShaderLoader = function() {

	this.loaded = 0;

	this.toLoad = 0;

	this.shaders = {};

	this.queue = [];

	this.onLoadedCallback = function(){};

}

ShaderLoader.prototype.add = function( id, name ) {
	
	this.toLoad++;

	this.shaders[ id ] = {

		id: id,

		name: name,

		content: '',

		loaded: false

	}

	this.queue.push( this.shaders[id]);

}

ShaderLoader.prototype.processQueue = function() {

	var shader = this.queue.pop();

	var oReq = new XMLHttpRequest();

	oReq.onload = function() {

		this.loaded++;

		shader.content = oReq.responseText;

		if( this.loaded != this.toLoad ) {

			this.processQueue();

		} else {

			this.onLoadedCallback();

		}

	}.bind( this );

	oReq.open( 'get', chrome.extension.getURL(shader.name), true );

	oReq.send();

}

ShaderLoader.prototype.load = function() {

	this.processQueue();

}

ShaderLoader.prototype.onLoaded = function( callback ) {

	if( this.loaded == this.toLoad ) callback();

	else this.onLoadedCallback = callback;

}

ShaderLoader.prototype.get = function( id ) {

	function ShaderLoaderGetException( message ) {

		this.message = 'Cannot find shader "' + id + '".';

		this.name = "ShaderLoaderGetException";

		this.toString = function() {

			return this.message

		};

	}

	var s = this.shaders[id];

	if( !s ) {

		throw new ShaderLoaderGetException( id );

		return;

	} 

	return s.content;

}

// --------------------- /Shader Loader and utils ------------------------


// launch the shader editor from the console

function shaderEditor() {

	div = document.createElement('div')

	div.className = 'editor-wrapper'

	document.body.appendChild(div)

	document.querySelector('.editor-wrapper').style.display = 'block'

	div = document.createElement('div')

	div.id = 'editor'

	div.style.textTransform = 'initial'

	div.style.position = 'absolute'

	div.style.zIndex = '1000000000'

	div.style.position.left = 0

	div.style.position.top = 0

	div.style.width = "600px"

	div.style.height = "1200px"

	document.body.appendChild(div)
	
    webgl.initEditor()
}


// function to grab the current fragment shader ( in order to save it ? )

function exportCurrentShader() {

	return webgl.currentFragmentShader

}


var webgl = new WebglFrag( document.querySelectorAll('canvas')[0] )

window.currentWebglExt = webgl;

})();
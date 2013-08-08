function Mesh() {

	this.programLoaded = function(program) {
		program.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition');
		program.vertexNormalAttribute = gl.getAttribLocation(program, 'aVertexNormal');
		program.vertexTextureCoordAttribute = gl.getAttribLocation(program, 'aVertexTextureCoord');
		program.mMatrixUniform = gl.getUniformLocation(program, 'uMMatrix');
		program.pMatrixUniform = gl.getUniformLocation(program, 'uPMatrix');
		program.vMatrixUniform = gl.getUniformLocation(program, 'uVMatrix');
		program.uDiffuseSampler = gl.getUniformLocation(program, 'uDiffuseSampler');
		program.uEmissiveSampler = gl.getUniformLocation(program, 'uEmissiveSampler');
		if (--this.materialsToLoad == 0) {
			this.callback();
		}
	};

	this.loadTex = function(filename) {
		var tex = gl.createTexture();
		var img = new Image();
		img.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.bindTexture(gl.TEXTURE0, null);
		};
		img.src = filename;
		return tex;
	}

	this.init = function(jsonstring) {
		var mesh = JSON.parse(jsonstring);
		this.vertexPosBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexPositions), gl.STATIC_DRAW);

		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

		if (mesh.vertexNormals) {
			this.vertexNormalBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormals), gl.STATIC_DRAW);
		}

		if (mesh.vertexTextureCoords) {
			this.vertexTextureCoordBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexTextureCoords), gl.STATIC_DRAW);
		}

		this.materialsToLoad = mesh.materials.length;
		this.programs = [];
		var that = this;
		for (var m in mesh.materials) {
			var material = mesh.materials[m];
			var prog = loadProgram(material.vertexshader, material.fragmentshader, function(prog) { that.programLoaded(prog); });
			prog.numindices = material.numindices;
			if (material.diffuse) {
				prog.diffuseTexture = this.loadTex(material.diffuse);
			}
			if (material.emissive) {
				prog.emissiveTexture = this.loadTex(material.emissive);
			}
			this.programs.push(prog);
		}
	};

	this.load = function(file, callback) {
		this.callback = callback;
		var that = this;
		loadFile(file, function(x) { that.init(x); }, false, true);
	};

	this.setMatrixUniforms = function(program) {
		gl.uniformMatrix4fv(program.mMatrixUniform, false, modelMatrix().d);
		gl.uniformMatrix4fv(program.pMatrixUniform, false, projectionMatrix().d);
		gl.uniformMatrix4fv(program.vMatrixUniform, false, viewMatrix().d);
	}

	this.draw = function() {
		var start = 0;
		for (var p in this.programs) {
			var program = this.programs[p];
			gl.useProgram(program);
			gl.enableVertexAttribArray(program.vertexPositionAttribute);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
			gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
			if (program.vertexNormalAttribute !== -1) {
				gl.enableVertexAttribArray(program.vertexNormalAttribute);
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
				gl.vertexAttribPointer(program.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
			}
			if (program.vertexTextureCoordAttribute !== -1) {
				gl.enableVertexAttribArray(program.vertexTextureCoordAttribute);
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
				gl.vertexAttribPointer(program.vertexTextureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
			}
			if (program.diffuseTexture) {
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, program.diffuseTexture);
				gl.uniform1i(program.uDiffuseSampler, 0);
			}
			if (program.emissiveTexture) {
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, program.emissiveTexture);
				gl.uniform1i(program.uEmissiveSampler, 1);
			}
			this.setMatrixUniforms(program);
			gl.drawElements(gl.TRIANGLES, program.numindices, gl.UNSIGNED_SHORT, start * 2);
			start += program.numindices;
		}
	};
}
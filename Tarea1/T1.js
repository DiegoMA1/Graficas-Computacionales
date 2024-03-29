let mat4 = glMatrix.mat4;

let projectionMatrix;

let shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute, shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

let duration = 10000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
let vertexShaderSource =    
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +

    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +

    "    varying vec4 vColor;\n" +

    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor * 0.8;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
let fragmentShaderSource = 
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    let gl = null;
    let msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try 
    {
        gl = canvas.getContext("experimental-webgl");
    } 
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;        
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 100);
    mat4.translate(projectionMatrix, projectionMatrix, [0, 0, -5]);
}

// Create the vertex, color and index data for a multi-colored cube
function createCube(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let verts = [
       // Front face
       -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
       -1.0,  1.0,  1.0,

       // Back face
       -1.0, -1.0, -1.0,
       -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

       // Top face
       -1.0,  1.0, -1.0,
       -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

       // Bottom face
       -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
       -1.0, -1.0,  1.0,

       // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

       // Left face
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0,
       -1.0,  1.0,  1.0,
       -1.0,  1.0, -1.0
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Front face
        [0.0, 1.0, 0.0, 1.0], // Back face
        [0.0, 0.0, 1.0, 1.0], // Top face
        [1.0, 1.0, 0.0, 1.0], // Bottom face
        [1.0, 0.0, 1.0, 1.0], // Right face
        [0.0, 1.0, 1.0, 1.0]  // Left face
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach(color =>{
        for (let j=0; j < 4; j++)
            vertexColors.push(...color);
    });

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

    let cubeIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
    
    let cube = {
            buffer: vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:24, colorSize:4, nColors: 24, nIndices:36,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()
        };

    mat4.translate(cube.modelViewMatrix, cube.modelViewMatrix, translation);

    cube.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return cube;
}
// Create the vertex, color and index data for a multi-colored cube

//Función para crear la piramide
function createPiramide(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //Primero definimos los 5 triangulos y después la base
    let verts = [
       //T1
        0.0, 3.0, 0.0,
        2.0,  -1.0, 0.5,
        0.0,  -1.0, 2.0,

       //T2
        0.0, 3.0, 0.0,
        0.0,  -1.0,  2.0,
        -2.0,  -1.0,  0.5,

       //T3
        0.0, 3.0, 0.0,
        -2.0, -1.0, 0.5,
        -1.0, -1.0,  -2.0,

       //T4
        0.0, 3.0, 0.0,
        -1.0,  -1.0, -2.0,
        1.0,  -1.0,  -2.0,

       //T5
        0.0, 3.0, 0.0,
       1.0, -1.0,  -2.0,
       2.0,  -1.0,  0.5,

        //Base
        2.0, -1.0,  0.5,
        0.0, -1.0,  2.0,
        -2.0,  -1.0,  0.5,
        -1.0, -1.0, -2.0,
        1.0,  -1.0,  -2.0,
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], //T1
        [0.0, 1.0, 0.0, 1.0], //T2
        [0.0, 0.0, 1.0, 1.0], // T3
        [1.0, 1.0, 0.0, 1.0], //T4
        [1.0, 0.0, 1.0, 1.0], //T5
        [0.0, 1.0, 1.0, 1.0]  //Base
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach((color,index) =>{
        //Checamos si estamos en la base para hacer el push de los colores a los 5 puntos
        if (index == faceColors.length - 1){
            console.log(index);
            for(let j=0; j < 5; j++){
                vertexColors.push(...color);
            }
        }
        //Asignando color a cada triangulo
        else{
            for (let j=0; j < 3; j++)
            vertexColors.push(...color);
        }
    });

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let piramideIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, piramideIndexBuffer);

    let piramideIndices = [
        0, 1, 2, //T1
        3, 4, 5, //T2
        6, 7, 8, //T3
        9, 10, 11, //T3
        12, 13, 14, //T4
        15, 16, 17,     15, 17, 18,     15, 18, 19 //Base
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(piramideIndices), gl.STATIC_DRAW);
    
    let piramide = {
            buffer: vertexBuffer, colorBuffer:colorBuffer, indices:piramideIndexBuffer,
            vertSize:3, nVerts:20, colorSize:4, nColors: 20, nIndices:24, //
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()
        };

    mat4.translate(piramide.modelViewMatrix, piramide.modelViewMatrix, translation);

    piramide.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return piramide;
}
//Funcion para crear un Octaedro
function createOctaedro(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    let verts = [
       //Face 1
        1.5, 0.0, 0.0,
        0.0,  -1.5, 0.0,
        0.0,  0.0, 1.5,

       //Face 2
        1.5, 0.0, 0.0,
        0.0,  -1.5,  0.0,
        0.0,  0.0,  -1.5,

       // Face 3
        1.5, 0.0, 0.0,
        0.0,  1.5, 0.0,
        0.0,  0.0, -1.5,

       // Face 4
       1.5, 0.0, 0.0,
       0.0,  1.5,  0.0,
       0,  0.0,  1.5,

       // Face 5
       -1.5, 0.0, 0.0,
       0.0,  1.5, 0.0,
       0.0,  0.0, 1.5,

       //Face 6
       -1.5, 0.0, 0.0,
       0.0,  1.5,  0.0,
       0,  0.0,  -1.5,

       //Face 7
       -1.5, 0.0, 0.0,
       0.0,  -1.5, 0.0,
       0.0,  0.0, 1.5,

       //Face 8
       -1.5, 0.0, 0.0,
       0.0,  -1.5,  0.0,
       0,  0.0,  -1.5,
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // F1
        [0.0, 1.0, 0.0, 1.0], // F2
        [0.0, 0.0, 1.0, 1.0], // F3
        [1.0, 1.0, 0.0, 1.0], // F4
        [1.0, 0.0, 1.0, 1.0], // F5
        [0.0, 1.0, 1.0, 1.0],  // F6
        [1.0, 1.0, 1.0, 1.0],  // F7
        [0.0, 0.5, 0.0, 1.0],  // F8
    ];
    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach(color => {
        console.log(color);
        for (let j=0; j < 3; j++)
            vertexColors.push(...color);
    });

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let octaedroIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, octaedroIndexBuffer);
    //Se necesitan 24 indices para dibujar todas las caras
    let octaedroIndices = [
        0, 1, 2,
        3, 4, 5,
        6, 7, 8,
        9, 10, 11,
        12, 13, 14,
        15, 16, 17,
        18, 19, 20,
        21, 22, 23
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(octaedroIndices), gl.STATIC_DRAW);
    
    let octaedro = {
            buffer: vertexBuffer, colorBuffer:colorBuffer, indices:octaedroIndexBuffer,
            vertSize:3, nVerts:24, colorSize:4, nColors: 24, nIndices:24,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()
        };

    mat4.translate(octaedro.modelViewMatrix, octaedro.modelViewMatrix, translation);
    let bottom = false;
    let top = true;
    octaedro.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;
        //console.log(this.modelViewMatrix[13]);
        if(bottom==true){
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, 0.025, 0]);
            if(this.modelViewMatrix[13] > 1.25){ //checking current position to change behavior
                bottom=false;
                top=true;
            }
        }
        if(top==true){
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0, -0.025, 0]);
            if(this.modelViewMatrix[13] < -1.25){ //checking current position to change behavior
                bottom=true;
                top=false;
            }
        }
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return octaedro;
}
//Función para crear un Dodecaedro
function createDodecaedro(gl, translation, rotationAxis)
{    
    // Vertex Data
    let vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    let verts = [
       //Face 1
        0.8, 0.8,  0.8,
        0.5,  1.3,  0,
        0.8, 0.8,  -0.8,
        1.3,  0,  -0.5,
        1.3, 0, 0.5,
        
       //Face 2
        0.8, -0.8, 0.8,
        1.3,  0,  0.5,
        1.3,  0,  -0.5,
        0.8,  -0.8,  -0.8,
        0.5,  -1.3,  0,
        
       // Face 3
       0.8, 0.8,  0.8,
       1.3,  0,  0.5,
       0.8, -0.8, 0.8,
       0,  -0.5,  1.3,
       0,  0.5,  1.3,
       
       // Face 4
       0.8, 0.8,  0.8,
       0, 0.5, 1.3,
       -0.8, 0.8, 0.8,
       -0.5,  1.3,  0,
       0.5,  1.3,  0,
       

       // Face 5
       0.5,  1.3,  0,
       -0.5,  1.3,  0,
       -0.8, 0.8, -0.8,
       0, 0.5, -1.3,
       0.8, 0.8,  -0.8,
       

       //Face 6
       0.8, 0.8,  -0.8,
       0, 0.5, -1.3,
       0, -0.5, -1.3,
       0.8, -0.8, -0.8,
       1.3,  0,  -0.5,
       
       
       //Face 7
       0.8, -0.8, -0.8,
       0.5,  -1.3,  0,
       -0.5,  -1.3,  0,
       -0.8, -0.8,  -0.8,
       0, -0.5, -1.3,
       
       

       //Face 8
       0.8, -0.8,  0.8,
       0, -0.5, 1.3,
       -0.8, -0.8, 0.8,
       -0.5,  -1.3,  0,
       0.5,  -1.3,  0,
       
       //Face 9
       0, 0.5, 1.3,
       -0.8, 0.8, 0.8,
       -1.3,  0,  0.5,
       -0.8, -0.8, 0.8,
       0, -0.5, 1.3,
        
       //Face 10
       -0.5,  1.3,  0,
       -0.8, 0.8, -0.8,
       -1.3,  0,  -0.5,
       -1.3,  0,  0.5,
       -0.8, 0.8,  0.8,
       
       //Face 11
       0, 0.5, -1.3,
       0, -0.5, -1.3,
       -0.8, -0.8, -0.8,
       -1.3,  0,  -0.5,
       -0.8, 0.8,  -0.8,
       
       //Face 12
       -0.8, -0.8,  0.8,
       -1.3,  0,  0.5,
       -1.3,  0,  -0.5,
       -0.8, -0.8, -0.8,
       -0.5, -1.3, 0,
      

       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0], // F1
        [0.0, 1.0, 0.0, 1.0], // F2
        [0.0, 0.0, 1.0, 1.0], // F3
        [1.0, 1.0, 0.0, 1.0], // F4
        [1.0, 0.0, 1.0, 1.0], // F5
        [0.0, 1.0, 1.0, 1.0], // F6
        [1.0, 1.0, 1.0, 1.0], // F7
        [0.5, 0.0, 0.0, 1.0], // F8
        [0.0, 0.0, 0.5, 1.0],  // F9
        [0.0, 0.5, 0.0, 1.0],  // F10
        [0.0, 1.0, 0.5, 1.0],  // F11
        [0.5, 1.0, 0.0, 1.0],  // F12
    ];
    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
    let vertexColors = [];
    // for (const color of faceColors) 
    // {
    //     for (let j=0; j < 4; j++)
    //         vertexColors.push(...color);
    // }
    faceColors.forEach(color => {
        console.log(color);
        for (let j=0; j < 5; j++)
            vertexColors.push(...color);
    });

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let dodecaedroIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dodecaedroIndexBuffer);
    //Se necesitan 108 indices ya que son 3 triangulos por cada cara del dodecaedro =D
    let dodecaedroIndices = [
        0, 1, 2,        0, 2, 3,        0, 3, 4,
        5, 6, 7,        5, 7, 8,        5, 8, 9,
        10, 11, 12,     10, 12, 13,     10, 13, 14,
        15, 16, 17,     15, 17, 18,     15, 18, 19,
        20, 21, 22,     20, 22, 23,     20, 23, 24,
        25, 26, 27,     25, 27, 28,     25, 28, 29,
        30, 31, 32,     30, 32, 33,     30, 33, 34,
        35, 36, 37,     35, 37, 38,     35, 38, 39,
        40, 41, 42,     40, 42, 43,     40, 43, 44,
        45, 46, 47,     45, 47, 48,     45, 48, 49,
        50, 51, 52,     50, 52, 53,     50, 53, 54,
        55, 56, 57,     55, 57, 58,     55, 58, 59    
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dodecaedroIndices), gl.STATIC_DRAW);
    
    let dodecaedro = {
            buffer: vertexBuffer, colorBuffer:colorBuffer, indices:dodecaedroIndexBuffer,
            vertSize:3, nVerts:60, colorSize:4, nColors: 60, nIndices:108,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()
        };

    mat4.translate(dodecaedro.modelViewMatrix, dodecaedro.modelViewMatrix, translation);

    dodecaedro.update = function()
    {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return dodecaedro;
}
function createShader(gl, str, type)
{
    let shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    let fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    let vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);
    
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs) 
{
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i< objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs) 
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });

    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}
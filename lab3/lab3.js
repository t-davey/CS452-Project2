"use strict";

var canvas;
var gl;

var numVertices  = 24;

var axis = 0;
var xAxis = 0;
var yAxis =1;
var zAxis = 2;
var theta = [ 0, 0, 0 ];
var thetaLoc;

var scaleX = 1.0;
var scaleY = 1.0;

var scaleXLoc;
var scaleYLoc;

var transX = 0.0;
var transY = 0.0;

var transXLoc;
var transYLoc;

var rotFlag = 0.0;

    var vertices = [
        //vec3( -0.5, -0.5,  0.5 ),
        //vec3( -0.5,  0.5,  0.5 ),
        //vec3(  0.5,  0.5,  0.5 ),
        //vec3(  0.5, -0.5,  0.5 ),
        //vec3( -0.5, -0.5, -0.5 ),
        //vec3( -0.5,  0.5, -0.5 ),
        //vec3(  0.5,  0.5, -0.5 ),
        //vec3(  0.5, -0.5, -0.5 )
        vec4( -0.5, -0.433,  0.5, 1.0 ), // 1 is 0
        vec4( 0.5,  -0.433,  0.5, 1.0 ), // 2 is 1
        vec4(  0.0,  0.433,  0.5, 1.0 ), // 3 is 2
        vec4(  0.0, 0.433,  -0.5, 1.0 ), // 4 is 3
        vec4( -0.5, -0.433, -0.5, 1.0 ), // 5 is 4
        vec4( 0.5,  -0.433, -0.5, 1.0 ), // 6 is 5
    ];

    var vertexColors = [
        vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
        vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
        vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
        vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];

// indices of the 8 triangles that compise the cube

var indices = [
    0, 1, 2,
    1, 3, 2,
    1, 5, 3,
    2, 3, 4,
    4, 0, 2,
    5, 1, 3,
    5, 1, 0,
    4, 5, 0
];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram(program);

    // array element buffer

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    // color array atrribute buffer

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    // vertex array attribute buffer

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );



    scaleXLoc = gl.getUniformLocation(program, "scaleX");
    //gl.uniform1f(scaleXLoc, scaleX);

    scaleYLoc = gl.getUniformLocation(program, "scaleY");

    //gl.uniform1f(scaleYLoc, scaleY);

    thetaLoc = gl.getUniformLocation(program, "theta");

    transXLoc = gl.getUniformLocation(program, "transX");

    transYLoc = gl.getUniformLocation(program, "transY");
    //event listeners for buttons
    /*
    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };

    document.getElementById("scaleX").onclick = function () {
        scaleX += 0.1;
    };

    document.getElementById("scaleY").onclick = function () {
        scaleY += 0.1;
    };
    */
    render();
}

function arrowKeys(event)
{
    //gl.useProgram(program);
    console.log("keypress detected");

    var keyCode = event.keyCode;

    if (keyCode == 88) // x key press
    {
        //thetaLoc = gl.getUniformLocation(program, "theta");
        axis = xAxis;
        rotFlag = 1.0;
        //theta[axis] += 2.0;
        //gl.uniform3fv(thetaLoc, theta);
        //render();
    }

    else if (keyCode == 89) // y key press
    {
        axis = yAxis;
        rotFlag = 1.0;
        //theta[axis] += 2.0;
        //gl.uniform3fv(thetaLoc, theta);
    }

    else if (keyCode == 90) // z key press
    {
        axis = zAxis;
        rotFlag = 1.0;
        //theta[axis] += 2.0;
        //gl.uniform3fv(thetaLoc, theta);
    }

    else
    {
        rotFlag = 0.0;
    }

    if (keyCode == 37) //Left Arrow Key
    {
        scaleX += 0.2;
    }

    if (keyCode == 40) //Down Arrow Key
    {
        scaleY += 0.2;
    }

    if (keyCode == 39) //Right Arrow Key
    {
        transX += 0.1;
    }

    if (keyCode == 38) //Up Arrow Key
    {
        transY += 0.1;
    }

}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta[axis] += 2.0 * rotFlag;
    gl.uniform3fv(thetaLoc, theta);

    gl.uniform1f(scaleXLoc, scaleX);
    gl.uniform1f(scaleYLoc, scaleY);

    gl.uniform1f(transXLoc, transX);
    gl.uniform1f(transYLoc, transY);

    gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0 );
    rotFlag = 0.0;
    requestAnimFrame( render );
}

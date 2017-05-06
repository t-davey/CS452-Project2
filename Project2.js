var canvas;
var gl;
var myMouseShaderProgram;
var myLaptopShaderProgram;
var myDeskShaderProgram;

var bufferMouse;
var bufferLaptop;
var bufferDesk;
var py;

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

// As of right now all objects use these globals and add to the same buffer.
// I really don't know how working with multiple objects works.
// I assume it involves using multiple buffers but I'm not 100% sure how
// and all of my experiments have gone poorly.
var numVertices;
var indexList = [];
var vertices=[];
var vertexNormals = [];
var textureCoordinates = [];



function init() {
  var canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.enable(gl.DEPTH_TEST);
  gl.viewport( 0, 0, 768, 768 );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

  py = 0.0;

  
  myLaptopShaderProgram = initShaders( gl, "laptop-vertex-shader", "laptop-fragment-shader" );
  gl.useProgram( myLaptopShaderProgram );

  setupLaptop();

  myDeskShaderProgram = initShaders( gl, "desk-vertex-shader", "desk-fragment-shader" );
  gl.useProgram( myDeskShaderProgram );

  setupDesk();
  //gl.useProgram( myMouseShaderProgram );

  //Only getting info for mouse as it's the only part being moved.
  myMouseShaderProgram = initShaders( gl, "mouse-vertex-shader", "mouse-fragment-shader" );
  gl.useProgram( myMouseShaderProgram );

  scaleXLoc = gl.getUniformLocation(myMouseShaderProgram, "scaleX");
  gl.uniform1f(scaleXLoc, scaleX);

  scaleYLoc = gl.getUniformLocation(myMouseShaderProgram, "scaleY");
  gl.uniform1f(scaleYLoc, scaleY);

  thetaLoc = gl.getUniformLocation(myMouseShaderProgram, "theta");
  gl.uniform1f(thetaLoc, theta);

  transXLoc = gl.getUniformLocation(myMouseShaderProgram, "transX");
  gl.uniform1f(transXLoc, transX);

  transYLoc = gl.getUniformLocation(myMouseShaderProgram, "transY");
  gl.uniform1f(transYLoc, transY);

  setupMouse();


  //Camera setup
  var e = vec3( 20.0, 160.0, 300.0 ); //eye
  var a = vec3( 20.0, 0.0, 0.0 ); //at point
  var vUp = vec3( 0.0, 1.0, 0.0 ); //up vector

  look_at(e, a, vUp);

  //modelviewMatrix
  var modelviewMatrix =
    [ u[0], v[0], n[0], 0.0,
     u[1], v[1], n[1], 0.0,
     u[2], v[2], n[2], 0.0,
     -u[0]*e[0]-u[1]*e[1]-u[2]*e[2],
     -v[0]*e[0]-v[1]*e[1]-v[2]*e[2],
     -n[0]*e[0]-n[1]*e[1]-n[2]*e[2], 1.0]

  //modelview inverse transpose
  var modelviewMatrixInverseTranspose =
    [ u[0], v[0], n[0], e[0],
     u[1], v[1], n[1], e[1],
     u[2], v[2], n[2], e[2],
     0.0, 0.0, 0.0, 1.0 ];

  var modelviewMatrixLocation = gl.getUniformLocation( myMouseShaderProgram, "M" );
  gl.uniformMatrix4fv( modelviewMatrixLocation, false, modelviewMatrix );
  var modelviewMatrixInverseTransposeLocation = gl.getUniformLocation( myMouseShaderProgram,
    "M_inversetranspose" );
  gl.uniformMatrix4fv( modelviewMatrixInverseTransposeLocation, false, modelviewMatrixInverseTranspose );

  //Projection Matrix
  var left = -60.0;
  var right = 60.0;
  var top_ = 60.0;
  var bottom = -60.0;
  var near = 75.0;
  var far = 1000.0;


  //Perspective projection Matrix
  var perspectiveProjectionMatrix =
    [2.0*near/(right-left), 0.0, 0.0, 0.0,
     0.0, 2.0*near/(top_-bottom), 0.0, 0.0,
     (right+left)/(right-left), (top_+bottom)/(top_-bottom), -(far+near)/(far-near), -1.0,
     0.0, 0.0, -2.0*far*near/(far-near), 0.0];

  var perspectiveProjectionMatrixLocation = gl.getUniformLocation( myMouseShaderProgram, "P_persp" );
  gl.uniformMatrix4fv( perspectiveProjectionMatrixLocation, false, perspectiveProjectionMatrix );

  //light1 location
  var light1loc = gl.getUniformLocation( myMouseShaderProgram, "light1" );
  gl.uniform3f( light1loc, 0.0, 0.0, 0.0 );

  //light2 location
  var light1loc = gl.getUniformLocation( myMouseShaderProgram, "light2" );
  gl.uniform3f( light1loc, 80.0, 60.0, 20.0 );

  //values for light1 components
  var Ia1loc = gl.getUniformLocation( myMouseShaderProgram, "Ia1" );
  var Id1loc = gl.getUniformLocation( myMouseShaderProgram, "Id1" );
  var Is1loc = gl.getUniformLocation( myMouseShaderProgram, "Is1" );
  gl.uniform3f( Ia1loc, 0.0, 0.0, 1.0 ); //ambient part of incident light
  gl.uniform3f( Id1loc, 0.8, 0.8, 0.5 ); //diffuse part of incident light
  gl.uniform3f( Is1loc, 0.8, 0.8, 0.8 ); //specular part of incident light

  //values for light2 components
  var Ia2loc = gl.getUniformLocation( myMouseShaderProgram, "Ia2" );
  var Id2loc = gl.getUniformLocation( myMouseShaderProgram, "Id2" );
  var Is2loc = gl.getUniformLocation( myMouseShaderProgram, "Is2" );
  gl.uniform3f( Ia2loc, 1.0, 0.0, 0.0 ); //ambient part of incident light
  gl.uniform3f( Id2loc, 1.0, 0.0, 0.0 ); //diffuse part of incident light
  gl.uniform3f( Is2loc, 0.8, 0.8, 0.8 ); //specular part of incident light

  var kaloc = gl.getUniformLocation( myMouseShaderProgram, "ka" );
  var kdloc = gl.getUniformLocation( myMouseShaderProgram, "kd" );
  var ksloc = gl.getUniformLocation( myMouseShaderProgram, "ks" );
  gl.uniform3f( kaloc, 0.8, 0.8, 0.8 ); //ambient coeffs
  gl.uniform3f( kdloc, 0.8, 0.8, 0.8 ); //diffuse coeffs
  gl.uniform3f( ksloc, 1.0, 1.0, 1.0 ); //specular coeffs
  var alphaloc = gl.getUniformLocation( myMouseShaderProgram, "alpha" );
  gl.uniform1f( alphaloc, alpha); //shininess coeff

  alpha = 4.0;

  console.log("Setting up mouse...");
  gl.useProgram(myMouseShaderProgram);
  setupMouse();
  console.log("Mouse setup complete!")

  // console.log("Setting up laptop...");
  // gl.useProgram(myLaptopShaderProgram);
  // setupLaptop();
  // console.log("Laptop setup complete!")

  // console.log("Setting up desk...");
  // gl.useProgram(myDeskShaderProgram);
  // setupDesk();
  // console.log("Desk setup complete!")

  drawObjects();

}


function arrowKeys(event)
{
    //gl.useProgram(program);
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
        transX -= 0.1; //TranslateX negative
    }

    if (keyCode == 40) //Down Arrow Key
    {
        transY -= 0.1; //TranslateY negative
    }

    if (keyCode == 39) //Right Arrow Key
    {
        transX += 0.1; //TranslateX positive
    }

    if (keyCode == 38) //Up Arrow Key
    {
        transY += 0.1; //TranslateY positive
    }

    if (keyCode == 65) //a key
    {
      scaleX -= 0.1; //ScaleX negative
    }

    if (keyCode == 83) //s key
    {
      scaleY -= 0.1; //ScaleX negative
    }

    if (keyCode == 68) //d key
    {
      scaleX += 0.1; //ScaleX positive
    }

    if (keyCode == 87) //w key
    {
      scaleY += 0.1; //ScaleY positive
    }

}

function drawObjects() {

  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

  theta[axis] += 2.0 * rotFlag;
  gl.uniform3fv(thetaLoc, theta);

  var scaleXLoc = gl.getUniformLocation( myMouseShaderProgram, "scaleX");
  gl.uniform1f(scaleXLoc, scaleX);

  var scaleYLoc = gl.getUniformLocation( myMouseShaderProgram, "scaleY");
  gl.uniform1f(scaleYLoc, scaleY);

  var transXLoc = gl.getUniformLocation( myMouseShaderProgram, "transX");
  gl.uniform1f(transXLoc, transX);

  var transYLoc = gl.getUniformLocation( myMouseShaderProgram, "transY");
  gl.uniform1f(transYLoc, transY);

  // Render the mouse

  gl.useProgram(myMouseShaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferMouse);

  DeskLoc = gl.getUniformLocation(myMouseShaderProgram, "displacement");
  gl.uniform1f(DeskLoc, py);

  var myPosition = gl.getAttribLocation(myMouseShaderProgram, "vertexPosition");
  gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(myPosition);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Render the laptop

  gl.useProgram(myLaptopShaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferLaptop);

  var LaptopLoc = gl.getUniformLocation(myLaptopShaderProgram, "displacement");
  gl.uniform1f(LaptopLoc, py);

  var myPosition = gl.getAttribLocation(myLaptopShaderProgram, "vertexPosition");
  gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(myPosition);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Render the desk

  gl.useProgram(myDeskShaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferDesk);

  LaptopLoc = gl.getUniformLocation(myDeskShaderProgram, "displacement");
  gl.uniform1f(LaptopLoc, py);

  var myPosition = gl.getAttribLocation(myDeskShaderProgram, "vertexPosition");
  gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(myPosition);

  //Logic

  gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_SHORT, 0 );
  rotFlag = 0.0;

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  requestAnimFrame(drawObjects);
}

function setupMouse() {
  // var indexList = [];
  // var vertices=[];
  // var vertexNormals = [];
  // var textureCoordinates = [];


  var objLoader = new THREE.OBJLoader();// load the geometry of mouse.obj

  objLoader.load( "mouse.obj ", function ( object ) {
  var len = object.children.length;  //get the number of children if your object contains
  for(var i=0; i<len; i++){

      // access the information related to geometry
      var geometry = object.children[i].geometry;

      // access the vertices
      var vertices_array = geometry.attributes.position.array;

      var l = vertices_array.length/3;//get the number of faces because each face is a triangle
      for(var j=0; j<l; j++){
        // 'vertices' stores the coordinates of vertieces of the object
        vertices.push( vec4(vertices_array[3*j],vertices_array[3*j+1],vertices_array[3*j+2],1));

        indexList.push( 3*j );
        indexList.push( 3*j+1 );
        indexList.push( 3*j+2 );

        // Normals And Texture Coordinates:
        // VERSION 1: calculate the face normal here from vertices_array[3*j], vertices_array[3*j+1], vertices_array[3*j+2]
        // in this case you will not have an averaged vertex normal,
        // instead you will assign the face normal to vertices_array[3*j], vertices_array[3*j+1], and vertices_array[3*j+2]
        // This is because each face is created separately, and vertices get replicated for every face.
        // this will give you FLAT SHADING, not Gouraud or Phong shading. That is okay for the project, if you are okay with it.
        // You will have to set up your own texture coordinates.

        // VERSION 2: sometimes (but not always) obj files come with their own texture coordinates
        // (which should get stored in geometry.attributes.uv.array)
        // and/or normals (which should get stored in geometry.attributes.normals.array). If you do have normals, then all you have
        // to do is to extract those normals, and you will likely end up getting interpolated shading (Gouraud or Phong depending
        // on your choice of shader implementation). The following two lines commented out, will help you access the normals and
        // the texture coordinates (and in this case, you do not need to do the calculations in the previous comments):
        vertexNormals.push( vec3( geometry.attributes.normal.array[3*j], geometry.attributes.normal.array[3*j+1], geometry.attributes.normal.array[3*j+2]) );

        textureCoordinates.push( vec2( geometry.attributes.uv.array[2*j],
                                   geometry.attributes.uv.array[2*j+1] ));

      }
      numVertices = vertexNormals.length;

      var indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexList), gl.STATIC_DRAW);

      var verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

      var vertexPosition = gl.getAttribLocation(myMouseShaderProgram,"vertexPosition");
      gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vertexPosition );

      var normalsbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW);

      var vertexNormalPointer = gl.getAttribLocation(myMouseShaderProgram, "nv");
      gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexNormalPointer);

      bufferMouse = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferMouse);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW); // We flatten the array of vertices

      var myPosition = gl.getAttribLocation(myMouseShaderProgram, "vertexPosition");
      gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(myPosition);
    }

  });


}

function setupLaptop() {
  // var indexList = [];
  // var vertices=[];
  // var vertexNormals = [];
  // var textureCoordinates = [];

  var objLoader1 = new THREE.OBJLoader();// load the geometry of laptop.obj

  objLoader1.load( "laptop.obj ", function ( object ) {
  var len = object.children.length;  //get the number of children if your object contains
  for(var i=0; i<len; i++){

      // access the information related to geometry
      var geometry = object.children[i].geometry;

      // access the vertices
      var vertices_array = geometry.attributes.position.array;

      var l = vertices_array.length/3;//get the number of faces because each face is a triangle
      for(var j=0; j<l; j++){
        // 'vertices' stores the coordinates of vertieces of the object
        vertices.push( vec4(vertices_array[3*j],vertices_array[3*j+1],vertices_array[3*j+2],1));

        indexList.push( 3*j );
        indexList.push( 3*j+1 );
        indexList.push( 3*j+2 );

        vertexNormals.push( vec3( geometry.attributes.normal.array[3*j], geometry.attributes.normal.array[3*j+1], geometry.attributes.normal.array[3*j+2]) );

        textureCoordinates.push( vec2( geometry.attributes.uv.array[2*j],
                                   geometry.attributes.uv.array[2*j+1] ));

      }
      numVertices = vertexNormals.length;

      var indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexList), gl.STATIC_DRAW);

      var verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

      var vertexPosition = gl.getAttribLocation(myLaptopShaderProgram,"vertexPosition");
      gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vertexPosition );

      var normalsbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW);

      var vertexNormalPointer = gl.getAttribLocation(myLaptopShaderProgram, "nv");
      gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexNormalPointer);

      bufferLaptop = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferLaptop);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW); // We flatten the array of vertices

      var myPosition = gl.getAttribLocation(myLaptopShaderProgram, vertexPosition);
      gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(myPosition);

    }

  });
}

function setupDesk() {
  var objLoader2 = new THREE.OBJLoader();// load the geometry of Desk.obj


  objLoader2.load( "Desk.obj ", function ( object ) {
  var len = object.children.length;  //get the number of children if your object contains
  for(var i=0; i<len; i++){

      // access the information related to geometry
      var geometry = object.children[i].geometry;

      // access the vertices
      var vertices_array = geometry.attributes.position.array;

      var l = vertices_array.length/3;//get the number of faces because each face is a triangle
      for(var j=0; j<l; j++){
        // 'vertices' stores the coordinates of vertieces of the object
        vertices.push( vec4(vertices_array[3*j],vertices_array[3*j+1],vertices_array[3*j+2],1));

        indexList.push( 3*j );
        indexList.push( 3*j+1 );
        indexList.push( 3*j+2 );

        vertexNormals.push( vec3( geometry.attributes.normal.array[3*j], geometry.attributes.normal.array[3*j+1], geometry.attributes.normal.array[3*j+2]) );

        textureCoordinates.push( vec2( geometry.attributes.uv.array[2*j],
                                   geometry.attributes.uv.array[2*j+1] ));

      }
      numVertices = vertexNormals.length;

      var indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexList), gl.STATIC_DRAW);

      var verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

      var vertexPosition = gl.getAttribLocation(myDeskShaderProgram,"vertexPosition");
      gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vertexPosition );

      var normalsbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW);

      var vertexNormalPointer = gl.getAttribLocation(myDeskShaderProgram, "nv");
      gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexNormalPointer);

      bufferDesk = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferDesk);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW); // We flatten the array of vertices

      var myPosition = gl.getAttribLocation(myDeskShaderProgram, vertexPosition);
      gl.vertexAttribPointer(myPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(myPosition);
    }

  });
}

function look_at( e, a, vUp){
  n = normalize( vec3( e[0]-a[0], e[1]-a[1], e[2]-a[2] ) );
  u = normalize( cross( vUp, n ) );
  v = normalize( cross( n, u ) );
}

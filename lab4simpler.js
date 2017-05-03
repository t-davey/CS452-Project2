//Travis Davey

var gl;
var numVertices;
var numTriangles;
var orthographicIsOn;
var directionalLightIsOn;
var pointLightIsOn;
var specularIsOn;
var myShaderProgram;
var n;
var u;
var v;

function initGL(){
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.enable(gl.DEPTH_TEST);
    gl.viewport( 0, 0, 512, 512 );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    myShaderProgram = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( myShaderProgram );


    numVertices = 2440;
    numTriangles = 4871;
    vertices = getVertices(); // vertices and faces are defined in object.js
    indexList = getFaces();

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexList), gl.STATIC_DRAW);

    var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vertexPosition = gl.getAttribLocation(myShaderProgram,"vertexPosition");
    gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

    //compute vertex normals
    var faceNormals = getFaceNormals( vertices, indexList, numTriangles );
    //get normals for each vertex
    var vertexNormals = getVertexNormals( vertices, indexList, faceNormals, numVertices, numTriangles );


    var normalsbuffer = gl.createBuffer(); //create buffer for normals
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsbuffer); //bind buffer to ARRAY_BUFFER
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW); //send data to GPU

    var vertexNormalPointer = gl.getAttribLocation(myShaderProgram, "nv");

    gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexNormalPointer);

    //Camera setup
    var e = vec3( 60.0, 40.0, 120.0 ); //eye
    var a = vec3( 0.0, 0.0, 0.0 ); //at point
    var vUp = vec3( 0.0, 1.0, 0.0 ); //up vector

    look_at(e, a, vUp);

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

    var modelviewMatrixLocation = gl.getUniformLocation( myShaderProgram, "M" );
    gl.uniformMatrix4fv( modelviewMatrixLocation, false, modelviewMatrix );
    var modelviewMatrixInverseTransposeLocation = gl.getUniformLocation( myShaderProgram,
      "M_inversetranspose" );
    gl.uniformMatrix4fv( modelviewMatrixInverseTransposeLocation, false, modelviewMatrixInverseTranspose );

    //Projection Matrix
    var left = -60.0;
    var right = 60.0;
    var top_ = 60.0;
    var bottom = -60.0;
    var near = 100.0;
    var far = 200;

    //Orthographic projection matrix
    var orthographicProjectionMatrix =
      [ 2.0/(right-left), 0.0, 0.0, 0.0,
      0.0, 2.0/(top_-bottom), 0.0, 0.0,
      0.0, 0.0, -2.0/(far-near), 0.0,
      -(left+right)/(right-left), -(top_+bottom)/(top_-bottom), -(far+near)/(far-near), 1.0];

    //Perspective projection Matrix
    var perspectiveProjectionMatrix =
      [2.0*near/(right-left), 0.0, 0.0, 0.0,
       0.0, 2.0*near/(top_-bottom), 0.0, 0.0,
       (right+left)/(right-left), (top_+bottom)/(top_-bottom), -(far+near)/(far-near), -1.0,
       0.0, 0.0, -2.0*far*near/(far-near), 0.0];

    var orthographicProjectionMatrixLocation = gl.getUniformLocation( myShaderProgram, "P_orth" );
    gl.uniformMatrix4fv( orthographicProjectionMatrixLocation, false, orthographicProjectionMatrix );

    var perspectiveProjectionMatrixLocation = gl.getUniformLocation( myShaderProgram, "P_persp" );
    gl.uniformMatrix4fv( perspectiveProjectionMatrixLocation, false, perspectiveProjectionMatrix );

    //used to determine which matrix should be shown
    //ortho or perspective
    orthographicIsOn = 1;
    var orthographicIsOnLocation = gl.getUniformLocation( myShaderProgram, "orthIsOn" );
    gl.uniform1f( orthographicIsOnLocation, orthographicIsOn );

    //point light or spotlight
    pointLightIsOn = 1;
    var pointLightIsOnLocation = gl.getUniformLocation( myShaderProgram, "pointIsOn" );
    gl.uniform1f( pointLightIsOnLocation, pointLightIsOn );

    //specular
    specularIsOn = 1;
    var specularIsOnLocation = gl.getUniformLocation( myShaderProgram, "specIsOn" );
    gl.uniform1f( specularIsOnLocation, specularIsOn );

    var kaloc = gl.getUniformLocation( myShaderProgram, "ka" );
    var kdloc = gl.getUniformLocation( myShaderProgram, "kd" );
    var ksloc = gl.getUniformLocation( myShaderProgram, "ks" );
    gl.uniform3f( kaloc, 0.5, 0.5, 0.5 ); //ambient coeffs
    gl.uniform3f( kdloc, 0.5, 0.5, 0.5 ); //diffuse coeffs
    gl.uniform3f( ksloc, 1.0, 1.0, 1.0 ); //specular coeffs
    var alphaloc = gl.getUniformLocation( myShaderProgram, "alpha" );
    gl.uniform1f( alphaloc, 4.0 ); //shininess coeff



    //point light location
    var p0loc = gl.getUniformLocation( myShaderProgram, "p0" );
    gl.uniform3f( p0loc, -30.0, 0.0, 30.0 );

    //spotlight location
    var sp0loc = gl.getUniformLocation( myShaderProgram, "sp0" );
    gl.uniform3f( sp0loc, -35.0, 50.0, 15.0 );

    //values for light components
    var Ia0loc = gl.getUniformLocation( myShaderProgram, "Ia0" );
    var Id0loc = gl.getUniformLocation( myShaderProgram, "Id0" );
    var Is0loc = gl.getUniformLocation( myShaderProgram, "Is0" );
    gl.uniform3f( Ia0loc, 0.1, 0.1, 0.1 ); //ambient part of incident light
    gl.uniform3f( Id0loc, 0.8, 0.8, 0.5 ); //diffuse part of incident light
    gl.uniform3f( Id0loc, 0.8, 0.8, 0.8 ); //specular part of incident light



    //render object
    drawObject();

};


function drawObject() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.drawElements( gl.TRIANGLES, 3 * numTriangles, gl.UNSIGNED_SHORT, 0 )
    requestAnimFrame(drawObject);
}

function look_at( e, a, vUp){
  n = normalize( vec3( e[0]-a[0], e[1]-a[1], e[2]-a[2] ) );
  u = normalize( cross( vUp, n ) );
  v = normalize( cross( n, u ) );
}

function getFaceNormals( vertices, indexList, numTriangles ) {
  var faceNormals = [];

  for (var i = 0; i < numTriangles; i++){

    var p0 = vec3( vertices[indexList[3*i]][0], vertices[indexList[3*i]][1],
      vertices[indexList[3*i]][2] );

    var p1 = vec3( vertices[indexList[3*i+1]][0], vertices[indexList[3*i+1]][1],
      vertices[indexList[3*i+1]][2] );

    var p2 = vec3( vertices[indexList[3*i+2]][0], vertices[indexList[3*i+2]][1],
      vertices[indexList[3*i+2]][2] );

    var p1minusp0 = vec3( p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2] );
    var p2minusp0 = vec3( p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2] );

    var faceNormal = cross( p1minusp0, p2minusp0 );

    faceNormals.push( faceNormal );

  }

  return faceNormals;
}


function getVertexNormals( vertices, indexList, faceNormals, numVertices, numTriangles ) {
  var vertexNormals = [];

  for (var j = 0; j < numVertices; j++){
    var vertexNormal = vec3( 0, 0, 0 );

    for (var i = 0; i < numTriangles; i++){
      if (indexList[3*i]==j | indexList[3*i+1]==j | indexList[3*i+2]==j) {
        vertexNormal[0] = vertexNormal[0] + faceNormals[i][0];
        vertexNormal[1] = vertexNormal[1] + faceNormals[i][1];
        vertexNormal[2] = vertexNormal[2] + faceNormals[i][2];
      }
    }
    vertexNormal = normalize(vertexNormal);
    vertexNormals.push(vertexNormal);
  }

  return vertexNormals;
}


function showOrthographic() {
  gl.useProgram( myShaderProgram );

  orthographicIsOn = 1;
  orthographicIsOnLocation = gl.getUniformLocation( myShaderProgram, "orthIsOn" );
  gl.uniform1f( orthographicIsOnLocation, orthographicIsOn );
  console.log("orth");
}


function showPerspective() {
  gl.useProgram( myShaderProgram );

  orthographicIsOn = 0;
  orthographicIsOnLocation = gl.getUniformLocation( myShaderProgram, "orthIsOn" );
  gl.uniform1f( orthographicIsOnLocation, orthographicIsOn );
  console.log("persp");
}

function usePointLight() {
  gl.useProgram( myShaderProgram );

  var pointLightIsOnLocation = gl.getUniformLocation( myShaderProgram, "pointIsOn" );
  if (pointLightIsOn == 1){
    pointLightIsOn = 0;
  } else {
    pointLightIsOn = 1;
  }
  gl.uniform1f( pointLightIsOnLocation, pointLightIsOn );

  var Ia0loc = gl.getUniformLocation( myShaderProgram, "Ia0" );
  var Id0loc = gl.getUniformLocation( myShaderProgram, "Id0" );
  var Is0loc = gl.getUniformLocation( myShaderProgram, "Is0" );
  gl.uniform3f( Ia0loc, 0.1, 0.1, 0.1 ); //ambient part of incident light
  gl.uniform3f( Id0loc, 0.8, 0.8, 0.5 ); //diffuse part of incident light
  gl.uniform3f( Id0loc, 0.8, 0.8, 0.8 ); //specular part of incident light

  console.log("light1");

}


function useDirectionalLight() {
  gl.useProgram( myShaderProgram );

  var directionalLightIsOnLocation = gl.getUniformLocation( myShaderProgram, "dirIsOn" );
  if (directionalLightIsOn == 1){
    directionalLightIsOn = 0;
  } else {
    directionalLightIsOn = 1;
  }
  gl.uniform1f( directionalLightIsOnLocation, directionalLightIsOn );

  var Ia1loc = gl.getUniformLocation( myShaderProgram, "Ia1" );
  var Id1loc = gl.getUniformLocation( myShaderProgram, "Id1" );
  var Is1loc = gl.getUniformLocation( myShaderProgram, "Is1" );
  gl.uniform3f( Ia1loc, 0.5, 1.0, 0.5 ); //ambient part of incident light
  gl.uniform3f( Id1loc, 0.8, 0.8, 0.5 ); //diffuse part of incident light
  gl.uniform3f( Id1loc, 1.0, 1.0, 1.0 ); //specular part of incident light
  console.log("light2");

}


function specular() {
  gl.useProgram( myShaderProgram );

  var specularIsOnLocation = gl.getUniformLocation( myShaderProgram, "specIsOn" );
  if (specularIsOn == 1) {
    specularIsOn = 0;
  } else {
    specularIsOn = 1;
  }
  gl.uniform1f( specularIsOnLocation, specularIsOn );
  console.log("spec");
}

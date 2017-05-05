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
  gl.viewport( 0, 0, 512, 512 );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

  myShaderProgram = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( myShaderProgram );

  //Camera setup
  var e = vec3( 60.0, 40.0, 120.0 ); //eye
  var a = vec3( 0.0, 0.0, 0.0 ); //at point
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

  var modelviewMatrixLocation = gl.getUniformLocation( myShaderProgram, "M" );
  gl.uniformMatrix4fv( modelviewMatrixLocation, false, modelviewMatrix );
  var modelviewMatrixInverseTransposeLocation = gl.getUniformLocation( myShaderProgram,
    "M_inversetranspose" );
  gl.uniformMatrix4fv( modelviewMatrixInverseTransposeLocation, false, modelviewMatrixInverseTranspose );

  //Projection Matrix
  var left = -30.0;
  var right = 30.0;
  var top_ = 30.0;
  var bottom = -30.0;
  var near = 75.0;
  var far = 150.0;


  //Perspective projection Matrix
  var perspectiveProjectionMatrix =
    [2.0*near/(right-left), 0.0, 0.0, 0.0,
     0.0, 2.0*near/(top_-bottom), 0.0, 0.0,
     (right+left)/(right-left), (top_+bottom)/(top_-bottom), -(far+near)/(far-near), -1.0,
     0.0, 0.0, -2.0*far*near/(far-near), 0.0];

  var perspectiveProjectionMatrixLocation = gl.getUniformLocation( myShaderProgram, "P_persp" );
  gl.uniformMatrix4fv( perspectiveProjectionMatrixLocation, false, perspectiveProjectionMatrix );

  //point light location
  var light1loc = gl.getUniformLocation( myShaderProgram, "light1" );
  gl.uniform3f( light1loc, -30.0, 0.0, 30.0 );

  //values for light components
  var Ialoc = gl.getUniformLocation( myShaderProgram, "Ia" );
  var Idloc = gl.getUniformLocation( myShaderProgram, "Id" );
  var Isloc = gl.getUniformLocation( myShaderProgram, "Is" );
  gl.uniform3f( Ialoc, 0.1, 0.1, 0.1 ); //ambient part of incident light
  gl.uniform3f( Idloc, 0.8, 0.8, 0.5 ); //diffuse part of incident light
  gl.uniform3f( Isloc, 0.8, 0.8, 0.8 ); //specular part of incident light

  console.log("Setting up mouse...");
  setupMouse();
  console.log("Mouse setup complete!")

  console.log("Setting up laptop...");
  setupLaptop();
  console.log("Laptop setup complete!")

  console.log("Setting up desk...");
  setupDesk();
  console.log("Desk setup complete!")

  drawObjects();

}

function drawObjects() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
  gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_SHORT, 0 );

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

      var vertexPosition = gl.getAttribLocation(myShaderProgram,"vertexPosition");
      gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vertexPosition );

      var normalsbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW);

      var vertexNormalPointer = gl.getAttribLocation(myShaderProgram, "nv");
      gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexNormalPointer);

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

      var vertexPosition = gl.getAttribLocation(myShaderProgram,"vertexPosition");
      gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vertexPosition );

      var normalsbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW);

      var vertexNormalPointer = gl.getAttribLocation(myShaderProgram, "nv");
      gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexNormalPointer);
    }

  });
}

function setupDesk() {
  var objLoader2 = new THREE.OBJLoader();// load the geometry of computer+desk+final.obj



  objLoader2.load( "computer+desk+final.obj ", function ( object ) {
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

      var vertexPosition = gl.getAttribLocation(myShaderProgram,"vertexPosition");
      gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vertexPosition );

      var normalsbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexNormals), gl.STATIC_DRAW);

      var vertexNormalPointer = gl.getAttribLocation(myShaderProgram, "nv");
      gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexNormalPointer);

    }

  });
}

function look_at( e, a, vUp){
  n = normalize( vec3( e[0]-a[0], e[1]-a[1], e[2]-a[2] ) );
  u = normalize( cross( vUp, n ) );
  v = normalize( cross( n, u ) );
}

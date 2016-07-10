var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var controls = new THREE.FirstPersonControls( camera );

controls.movementSpeed = 0.1;
controls.lookSpeed = 0.01;
controls.noFly = true;
controls.lookVertical = false;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.z = 5;
camera.position.y = 2;

var sampleMap = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
];

var createMap = function(matrix) {
  window.arr = matrix.map(function(arr, yIdx) {
    return arr.map(function(coord, xIdx) {
      if (coord === 1) {
        var geometry = new THREE.BoxGeometry(10, 10, 10);
        var material = new THREE.MeshNormalMaterial();
        var segment = new THREE.Mesh(geometry, material);
        segment.position.set(xIdx*10, 0, yIdx*10);
        scene.add(segment);
        return segment;
      }
    });
  });
};

var createPlayer = function() {
  var geometry = new THREE.BoxGeometry(2, 2, 5);
  var material = new THREE.MeshNormalMaterial();
  var playerCube = new THREE.Mesh(geometry, material);
  return playerCube;
};

var checkCollision = function() {

  cameraBBox.update();
  var walls = scene.children.slice();
  walls.pop();
  walls.pop();
  for (var i = 0; i < walls.length; i++) {
    var mesh = walls[i];
    var meshBBox = new THREE.BoundingBoxHelper(mesh);
    meshBBox.update();
    if (cameraBBox.box.intersectsBox(meshBBox.box)) {
      return true;
    }
  }
  return false;
};

var player = createPlayer();
createMap(sampleMap);
scene.add(camera);
camera.add(player);

var cameraBBox = new THREE.BoundingBoxHelper(camera);
var axisHelper = new THREE.AxisHelper( 5 );
scene.add( axisHelper );

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
  if (checkCollision()) {
    console.log('collision');
  } else {
    console.log('no collision');
    controls.update(1);
  }
}
render();

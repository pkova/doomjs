var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var controls = new THREE.FirstPersonControls( camera );

controls.movementSpeed = 0.1;
controls.lookSpeed = 0.01;
controls.noFly = true;
controls.lookVertical = false;

camera.position.z = 5;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var raycaster = new THREE.Raycaster();

var sampleMap = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1],
];

var createMap = function(matrix) {
  window.arr = matrix.map(function(arr, yIdx) {
    return arr.map(function(coord, xIdx) {
      if (coord === 1) {
        var geometry = new THREE.BoxGeometry(10, 3, 10);
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
  var geometry = new THREE.BoxGeometry(1, 1, 1);
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

var createEnemy = function() {
  var map = new THREE.TextureLoader().load( "formerhuman.png" );
  var material = new THREE.SpriteMaterial( { map: map } );
  var sprite = new THREE.Sprite( material );
  scene.add( sprite );;
};

window.shoot = function() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  var intersects = raycaster.intersectObjects(scene.children);
  console.log(intersects);
};

var player = createPlayer();
createMap(sampleMap);
camera.add(player);

createEnemy();

var cameraBBox = new THREE.BoundingBoxHelper(camera);

function render() {
  // This boolean is for mitigating getting stuck on walls
  var collided = false;
	requestAnimationFrame(render);
	renderer.render(scene, camera);
  if (checkCollision() && !collided) {
    console.log('collision');
    collided = true;

    controls.moveForward = false;
    controls.moveLeft = false;
    controls.moveRight = false;
    controls.moveBackward = false;

    controls.update(1);
  } else {
    // console.log('no collision');
    controls.update(1);
  }
}
render();

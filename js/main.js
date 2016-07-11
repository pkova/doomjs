var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var controls = new THREE.FirstPersonControls( camera );

controls.movementSpeed = 0.1;
controls.lookSpeed = 0.01;
controls.noFly = true;
controls.lookVertical = false;

camera.position.z = 5;

var pistolSound = new Howl({
  urls: ['pistol.m4a']
});

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var raycaster = new THREE.Raycaster();

var sampleMap = [
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 'X', 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 'X', 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 'X', 'X', 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

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

var createEnemy = function(x, y, z) {
  var map = new THREE.TextureLoader().load( "formerhuman.png" );
  var material = new THREE.SpriteMaterial( { map: map } );
  var sprite = new THREE.Sprite( material );
  sprite.position.set(x, y, z);
  scene.add( sprite );;
};

window.shoot = function() {
  pistolSound.play();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  var intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length !== 0 && intersects[0].object.type === "Sprite") {
    console.log('Enemy hit!');
    scene.remove(intersects[0].object);
  }
  console.log(intersects);
};

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
      } else if (coord === 'X') {
        createEnemy(xIdx*10, 0, yIdx*10);
      }
    });
  });
};

var player = createPlayer();
createMap(sampleMap);
camera.add(player);

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
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

var hurtSound1 = new Howl({
  urls: ['hurtsound1.m4a']
});

var hurtSound2 = new Howl({
  urls: ['hurtsound2.m4a']
});

var hurtSound3 = new Howl({
  urls: ['hurtsound3.m4a']
});

var hurtSounds = [hurtSound1, hurtSound2, hurtSound3];

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var raycaster = new THREE.Raycaster();

var enemies = [];
var walls = [];

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
  enemies.push(sprite);
  scene.add( sprite );;
};

window.shoot = function() {
  pistolSound.play();

  document.querySelector('.gun').style.display = 'none';
  document.querySelector('.muzzle').style.display = '';

  window.setTimeout(function() {
    document.querySelector('.muzzle').style.display = 'none';
    document.querySelector('.gun').style.display = '';
  }, 100);

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  var intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length !== 0 && intersects[0].object.type === "Sprite") {
    console.log('Enemy hit!');
    hurtSounds[Math.floor(Math.random()*hurtSounds.length)].play();
    intersects[0].object.material.map = new THREE.TextureLoader().load( "deadv2.png" );
    intersects[0].object.translateY(-0.8);
    enemies = enemies.filter(function(e) {
      return e.uuid !== intersects[0].object.uuid;
    });
  }
  console.log(intersects);
};

var enemyAI = function() {
  enemies.forEach(function(enemy) {
    enemy.lookAt(camera.position);
    enemy.translateZ(0.01);
  });
};

var createMap = function(matrix) {
  // Walls
  window.arr = matrix.map(function(arr, yIdx) {
    return arr.map(function(coord, xIdx) {
      if (coord === 1) {
        var geometry = new THREE.BoxGeometry(10, 3, 10);
        var material = new THREE.MeshNormalMaterial();
        var segment = new THREE.Mesh(geometry, material);
        segment.position.set(xIdx*10, 0, yIdx*10);
        scene.add(segment);
        walls.push(segment);
      } else if (coord === 'X') {
        createEnemy(xIdx*10, 0, yIdx*10);
      }
    });
  });

  var createPlane = function(color, height) {
    var geometry = new THREE.PlaneGeometry( 1000, 1000, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: color } );
    var floor = new THREE.Mesh( geometry, material );
    floor.material.side = THREE.DoubleSide;
    floor.position.setY(height);
    floor.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI);
    scene.add( floor );
  };

  // Floor
  createPlane(0x0000ff, -3);
  //Ceiling
  createPlane(0xff0000, 3);
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
  enemyAI();
}
render();

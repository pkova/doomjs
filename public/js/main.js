var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var controls = new THREE.FirstPersonControls( camera );
var clock = new THREE.Clock();
clock.start();
var frustum = new THREE.Frustum();

controls.movementSpeed = 0.1;
controls.lookSpeed = 0.01;
controls.noFly = true;
controls.lookVertical = false;
controls.mouseLook = true;

var theme = new Howl({
  urls: ['theme.m4a'],
  loop: true,
  volume: 0.8
});

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

var enemyShootSound = new Howl({
  urls: ['enemyshot.m4a']
});

var heroHurtSound = new Howl({
  urls: ['injured.wav']
});

var hurtSounds = [hurtSound1, hurtSound2, hurtSound3];

var alreadyPlayed = false;
var gameOver = false;
var UNITSIZE = 5;
var gameStarted = false;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var raycaster = new THREE.Raycaster();

var enemies = [];
var walls = [];

var mapGenerator = function(width, height) {
  width = Math.floor(width / 2);
  height = Math.floor(height / 2);
  var level = display(maze(width, height));

  loop1:
  for (var i = 1; i < level[0].length; i++) {
    for (var j = 0; j < level.length; j++) {
      if (level[i][j] === 0) {
        level[i][j] = 'H';
        break loop1;
      }
    }
  }

  var enemySpawnRate = 0.5;

  for (var i = 0; i < level.length; i++) {
    for (var j = 0; j < level[0].length; j++) {
      console.log(i, j);
      if (level[i][j] === 0) {
        if (Math.random() > enemySpawnRate) {
          level[i][j] = 'X';
        }
      }
    }
  }

  return level;
};

var sampleMap = mapGenerator(10, 10);

var mapWidth = sampleMap.length;
var mapHeight = sampleMap[0].length;

var createPlayer = function() {
  var geometry = new THREE.BoxGeometry(1, 1, 1);
  var material = new THREE.MeshNormalMaterial();
  var playerCube = new THREE.Mesh(geometry, material);
  return playerCube;
};

window.checkCollision = function() {

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
  intersects = intersects.map(function(e) {
    var result = e;
    if (e.object.type === "Sprite") {
      // Distance is calculated from ray center by default for sprites
      result.distance = raycaster.ray.origin.distanceTo(e.point);
    }
    return result;
  });

  intersects.sort(function(a, b) {
    return a.distance - b.distance;
  });

  if (intersects.length !== 0 && intersects[0].object.type === "Sprite") {
    console.log('Enemy hit!');
    hurtSounds[Math.floor(Math.random()*hurtSounds.length)].play();
    intersects[0].object.material.map = new THREE.TextureLoader().load( "deadv2.png" );
    intersects[0].object.translateY(-0.5);
    enemies = enemies.filter(function(e) {
      return e.id !== intersects[0].object.id;
    });
  }
};

var enemyAI = function() {
  if (Math.floor(clock.getElapsedTime()) % 5 === 1) {
    alreadyPlayed = false;
  }
  if (Math.floor(clock.getElapsedTime()) % 5 === 0 && !alreadyPlayed) {
    alreadyPlayed = true;
    enemyShot();
  }
  enemies.forEach(function(enemy) {
    enemy.lookAt(camera.position);
    if (camera.position.distanceTo(enemy.position) < 20) {
      enemy.translateZ(0.03);
    }
  });
};

var enemyShot = function() {
  var seenEnemies = checkFrustum();
  console.log(seenEnemies);
  seenEnemies.forEach(function(enemy) {
    enemyShootSound.play();
    var chanceToHit = 0.5;
    if (Math.random() > chanceToHit) {
      heroHurtSound.play();
      decrementHealth(getRandomInt(5, 16));
    }
  });
};

var decrementHealth = function(amount) {
  var health = parseInt(document.querySelector('span').innerText, 10);
  health = health - amount;
  if (health <= 0) {
    gameOver = true;
  }
  document.querySelector('span').innerText = health;
};

var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

var checkFrustum = function() {
  frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
  return enemies.filter(function(enemy) {
    return frustum.intersectsSprite(enemy) && camera.position.distanceTo(enemy.position) < 10;
  });
};

var createMap = function(matrix) {
  // Walls
  window.arr = matrix.map(function(arr, yIdx) {
    return arr.map(function(coord, xIdx) {
      if (coord === 1) {
        var geometry = new THREE.BoxGeometry(UNITSIZE, 3, UNITSIZE);
        var material = new THREE.MeshNormalMaterial();
        var segment = new THREE.Mesh(geometry, material);
        segment.position.set(xIdx*UNITSIZE, 0, yIdx*UNITSIZE);
        scene.add(segment);
        walls.push(segment);
      } else if (coord === 'X') {
        // Enemies
        createEnemy(xIdx*UNITSIZE, 0, yIdx*UNITSIZE);
      } else if (coord === 'H') {
        // Hero
        camera.position.set(xIdx*UNITSIZE, 0, yIdx*UNITSIZE);
      }
    });
  });

  var createPlane = function(color, height) {
    var texture = THREE.ImageUtils.loadTexture('floortexture.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(750, 750);

    var geometry = new THREE.PlaneGeometry( 1000, 1000, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { map: texture } );
    var floor = new THREE.Mesh( geometry, material );
    floor.material.side = THREE.DoubleSide;
    floor.position.setY(height);
    floor.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI);
    scene.add( floor );
  };

  // Floor
  createPlane(0x0000ff, -0.5);
  //Ceiling
  createPlane(0xff0000, 3);
};

var player = createPlayer();
createMap(sampleMap);
camera.add(player);
var cameraBBox = new THREE.BoundingBoxHelper(camera);


function render() {
  if (!gameOver) {
	  requestAnimationFrame(render);
	  renderer.render(scene, camera);
    controls.update(1);
    enemyAI();
    scene.updateMatrixWorld();
  } else {
    // Show game over screen
    document.querySelector('.dead').style.display = '';
    document.querySelector('h2').style.display = '';
  }
}

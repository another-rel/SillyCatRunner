import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const directLight = new THREE.DirectionalLight(0xffffff, 1);
directLight.castShadow = true;
directLight.position.z = 1;
directLight.position.y = 3;
scene.add(directLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

class Box extends THREE.Mesh {
  constructor({ width, height, depth, color = "#00ff00", velocity = {
    x: 0,
    y: 0,
    z: 0
  },
  position = {
    x: 0,
    y: 0,
    z: 0
  },
  zAcceleration = false,
  texture = ''
}) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: color, map: texture })
    );
    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.top = this.position.y + this.height / 2;
    this.bottom = this.position.y - this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = -0.002;

    this.zAcceleration = zAcceleration;
  }

  updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.top = this.position.y + this.height / 2;
    this.bottom = this.position.y - this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  update(ground) {
    this.updateSides();

    if (this.zAcceleration) { this.velocity.z += 0.0003; }

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    if (detectBoxCollision ( { 
        box1: this,
        box2: ground
        })
    ) {
        const friction = 0.5;
        this.velocity.y *= friction;
        this.velocity.y = -this.velocity.y;
    } else {
        this.position.y += this.velocity.y;
    }
  }
}

function detectBoxCollision ({ box1, box2 }) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;
    const yCollision = box1.top >= box2.bottom && box1.bottom + box1.velocity.y <= box2.top;
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;

    return xCollision && yCollision && zCollision;
  }

function detectGround ({ box1, box2 }) {
    const yCollision = box1.top >= box2.bottom && box1.bottom - box1.velocity.y * 10  <= box2.top;

    return yCollision;
}

const cubeTexture = new THREE.TextureLoader().load('textures/player.jpg' );
const video = document.getElementById('video');
const enemyTexture = new THREE.VideoTexture( video );
const audioBgm = document.getElementById("bgm");
const audioDeath = document.getElementById("death");

function deathAudio(audio1, audio2) {
  audio1.pause();
  audio2.play();
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  color: "#ffffff",
  velocity: {
    x: 0,
    y: -0.001,
    z: 0
  },
  texture: cubeTexture
});
cube.castShadow = true;
scene.add(cube);

const ground = new Box({
  width: 10,
  height: 0.5,
  depth: 50,
  position: {
    x: 0,
    y: -2,
    z: 0
  },
  color: '#0369a1'
});
ground.receiveShadow = true;
scene.add(ground);

camera.position.set(4.61, 3.74, 6);
camera.rotateY(0.5);
camera.rotateX(-0.25);

window.addEventListener("resize", function () {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    },
    space: {
        pressed: false
    }
};

window.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'KeyW':
            keys.w.pressed = true;
            break;
        case 'KeyA':
            keys.a.pressed = true;
            break;
        case 'KeyS':
            keys.s.pressed = true;
            break;
        case 'KeyD':
            keys.d.pressed = true;
            break;
        case 'Space':
            keys.space.pressed = true;
            break;
    }

});

window.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'KeyW':
            keys.w.pressed = false;
            break;
        case 'KeyA':
            keys.a.pressed = false;
            break;
        case 'KeyS':
            keys.s.pressed = false;
            break;
        case 'KeyD':
            keys.d.pressed = false;
            break;
        case 'Space':
            keys.space.pressed = false;
            break;
    }

});

const enemies = [];

let frameCount = 0;
let spawnRate = 200;

function animate() {
  const animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);
  
  cube.velocity.x = 0;
  cube.velocity.z = 0;

  if (keys.a.pressed) {
    cube.velocity.x = -0.05;
  } else if (keys.d.pressed) {
    cube.velocity.x = 0.05;
  }

  if (keys.w.pressed) {
    cube.velocity.z = -0.05;
  } else if (keys.s.pressed) {
    cube.velocity.z = 0.05;
  }

  cube.update(ground);
  enemies.forEach(enemy => {
    enemy.update(ground);
    if (detectBoxCollision({
        box1: cube,
        box2: enemy
    })) {
        window.cancelAnimationFrame(animationId);
        deathAudio(audioBgm, audioDeath);
        alert('GAME OVER!');
    }
  });

    if (detectGround ( { 
        box1: cube,
        box2: ground
        })
    ) {
        if (keys.space.pressed) {
        cube.velocity.y = 0.1; 
        }
    }

  if (frameCount % spawnRate === 0) {
    if (spawnRate > 20) { spawnRate -= 15;}
    const enemy = new Box({
        width: 1,
        height: 1,
        depth: 1,
        color: "#ffffff",
        position: {
            x: (Math.random() - 0.5) * 10,
            y: 0,
            z: -20
        },
        velocity: {
          x: 0,
          y: 0,
          z: 0.005
        },
        zAcceleration: true,
        texture: enemyTexture});
    
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }

  frameCount++;
}

animate();
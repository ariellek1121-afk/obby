// Global variables and main initialization

let scene, camera, renderer;
let player;
let velocityY = 0;
let canJump = false;
let keys = {};
let yaw = 0;
let pitch = 0;
let rotating = false;
let platforms = [];
let gameWon = false;
let balloons = [];
let flyEnabled = false;
let flySpeed = 60;
let head, torso, leftArm, rightArm, leftLeg, rightLeg;
let ledges = [];
let walls = [];
let raycaster, mouse;
let walkTarget = null;
let firstPerson = false;
let fpArms = null;
let levelIndex = 1;
let prevTime = performance.now();
let cameraDistance = 8;
let level5StartTime = null;
let level5JumpscareTriggered = false;
let jumpscareCat = null;
let jumpscareSoundPlayed = false;
let jumpscareCatStartTime = null;
let spinningCatsSpawned = false;
let fullScreenCatsSpawned = false;
let jumpscareSoundEnded = false;
let secretCodeSequence = '';
let secretCodeMatched = false;

// Setup UI and initialize on DOM ready
window.addEventListener('DOMContentLoaded', setupUI);
setupUI();

function animate(){
  requestAnimationFrame(animate);
  const time = performance.now();
  const delta = (time - prevTime)/1000;
  if(gameWon){
    renderer.render(scene,camera);
    prevTime = time;
    return;
  }
  let inputX = 0;
  let inputZ = 0;
  if(keys["KeyW"]) inputZ += 1;
  if(keys["KeyS"]) inputZ -= 1;
  if(keys["KeyA"]) inputX -= 1;
  if(keys["KeyD"]) inputX += 1;
  const length = Math.hypot(inputX,inputZ);
  if(length>0){
    inputX/=length;
    inputZ/=length;
  }
  const forward = new THREE.Vector3(
    -Math.sin(yaw),
    0,
    -Math.cos(yaw)
  );
  const right = new THREE.Vector3(
    Math.cos(yaw),
    0,
    -Math.sin(yaw)
  );
  const moveX = forward.x*inputZ + right.x*inputX;
  const moveZ = forward.z*inputZ + right.z*inputX;
  const horizontalSpeed = flyEnabled ? (MOVE_SPEED + flySpeed * 0.1) : MOVE_SPEED;
  const proposedX = player.position.x + moveX * horizontalSpeed * delta;
  const proposedZ = player.position.z + moveZ * horizontalSpeed * delta;
  let allowX = true;
  for(const w of walls){
    const hx = w.position.x;
    const hz = w.position.z;
    const halfX = w.userData && w.userData.halfX ? w.userData.halfX : 0.5;
    const halfZ = w.userData && w.userData.halfZ ? w.userData.halfZ : 3.0;
    if(Math.abs(proposedX - hx) < (halfX + PLAYER_RADIUS) && Math.abs(player.position.z - hz) < (halfZ + PLAYER_RADIUS)){
      const wallTop = w.position.y + (w.userData && w.userData.halfY ? w.userData.halfY : (w.geometry.parameters.height/2 || 3));
      if(player.position.y < wallTop + 0.5){ allowX = false; break; }
    }
  }
  if(allowX) {
     player.position.x = proposedX;
  } else {
    if(player.userData) player.userData.onLedge = null;
    if(player.userData && player.userData.onLedge){
      const ol = player.userData.onLedge;
      if(ol && ol.userData && ol.userData.parentWall){
        const w = ol.userData.parentWall;
        const side = (player.position.z < w.position.z) ? -1 : 1;
        player.position.z += side * 0.28;
      }
      player.userData.onLedge = null;
    }
    velocityY = JUMP_FORCE;
  }
  let allowZ = true;
  for(const w of walls){
    const hx = w.position.x;
    const hz = w.position.z;
    const halfX = w.userData && w.userData.halfX ? w.userData.halfX : 0.5;
    const halfZ = w.userData && w.userData.halfZ ? w.userData.halfZ : 3.0;
    if(Math.abs(player.position.x - hx) < (halfX + PLAYER_RADIUS) && Math.abs(proposedZ - hz) < (halfZ + PLAYER_RADIUS)){
      const wallTop = w.position.y + (w.userData && w.userData.halfY ? w.userData.halfY : (w.geometry.parameters.height/2 || 3));
      if(player.position.y < wallTop + 0.5){ allowZ = false; break; }
    }
  }
  if(allowZ) {player.position.z = proposedZ; }
  else {
    if(player.userData) player.userData.onLedge = null;
  }
  if(length>0){
    player.rotation.y = Math.atan2(moveX, moveZ);
  }
  const t = performance.now() / 1000;
  const speedFactor = Math.min(1, length);
  if(leftLeg && rightLeg && leftArm && rightArm){
    const walkSpeed = 6;
    const swing = Math.sin(t * walkSpeed) * 0.8 * speedFactor;
    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;
    leftArm.rotation.x = -swing * 0.8;
    rightArm.rotation.x = swing * 0.8;
  }
  if(fpArms && fpArms.visible){
    const fleft = fpArms.userData.left;
    const fright = fpArms.userData.right;
    if(fleft && fright){
      fleft.rotation.x = -Math.sin(t * 6) * 0.8 * speedFactor - 0.2;
      fright.rotation.x = Math.sin(t * 6) * 0.8 * speedFactor - 0.2;
    }
  }
  if(walkTarget && walkTarget.state === 'approach'){
    const tp = walkTarget.pos;
    const dir = new THREE.Vector3(tp.x - player.position.x, 0, tp.z - player.position.z);
    const dist = dir.length();
    if(dist > 0.05){
      dir.normalize();
      player.position.x += dir.x * WALK_TO_SPEED * delta;
      player.position.z += dir.z * WALK_TO_SPEED * delta;
      player.rotation.y = Math.atan2(dir.x, dir.z);
    }
    const flatDist = Math.hypot(tp.x - player.position.x, tp.z - player.position.z);
    const now = performance.now();
    if(flatDist < 1.0){
      player.position.x = tp.x;
      player.position.z = tp.z;
      player.position.y = Math.max(player.position.y, tp.y - 0.2);
      if(leftArm && rightArm){
        leftArm.rotation.x = -1.2;
        rightArm.rotation.x = -1.2;
        leftArm.rotation.z = Math.PI/10;
        rightArm.rotation.z = -Math.PI/10;
      }
      walkTarget.state = 'grabbing';
      walkTarget.reachTime = now;
    } else if(now - (walkTarget.started || 0) > 1500){
      player.position.x = tp.x;
      player.position.z = tp.z;
      player.position.y = tp.y - 0.2;
      if(leftArm && rightArm){
        leftArm.rotation.x = -1.2;
        rightArm.rotation.x = -1.2;
        leftArm.rotation.z = Math.PI/10;
        rightArm.rotation.z = -Math.PI/10;
      }
      walkTarget.state = 'grabbing';
      walkTarget.reachTime = now;
    }
  }
  if(walkTarget && walkTarget.state === 'grabbing'){
    const now = performance.now();
    if(now - walkTarget.reachTime > 450){
      const ledge = walkTarget.ledge;
      if(ledge){
        const stand = (ledge.userData && ledge.userData.standOffset) || 1.2;
        player.position.x = ledge.position.x;
        player.position.z = ledge.position.z;
        player.position.y = ledge.position.y + stand;
        velocityY = 0;
        player.userData = player.userData || {};
        player.userData.onLedge = ledge;
        player.userData.onLedgeTime = now;
      } else {
        player.position.y = ledge.position.y + 1.2;
        if(player.userData) player.userData.onLedge = null;
      }
      if(leftArm && rightArm){
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        leftArm.rotation.z = Math.PI/12;
        rightArm.rotation.z = -Math.PI/12;
      }
      walkTarget = null;
      canJump = true;
    }
  }
  if(flyEnabled){
    if(keys["Space"]) velocityY += flySpeed * delta;
    if(keys["ShiftLeft"] || keys["ShiftRight"]) velocityY -= flySpeed * delta;
    velocityY *= 0.98;
  } else {
    if(canJump && keys["Space"]){
      velocityY = JUMP_FORCE;
    }
    velocityY -= GRAVITY * delta;
  }
  player.position.y += velocityY * delta;
  for(let i = balloons.length - 1; i >= 0; i--){
    const b = balloons[i];
    const ud = b.userData;
    if(ud.spawnMs && (time - ud.spawnMs) > 10000){
      if(b.parent) scene.remove(b);
      balloons.splice(i,1);
      continue;
    }
    b.position.y += ud.vy * delta;
    b.position.x += Math.sin(time * ud.freq + ud.offset) * ud.amp * delta;
    b.position.z += Math.cos(time * ud.freq + ud.offset) * ud.amp * delta * 0.6;
    b.rotation.z = Math.sin(time * ud.freq + ud.offset) * 0.25;
    if(b.position.y > player.position.y + 80){
      if(b.parent) scene.remove(b);
      balloons.splice(i,1);
    }
  }
  if(player.position.y < -20){
    player.position.set(0,5,0);
    velocityY=0;
  }
  checkCollisions();
  for(const w of walls){
    const dx = player.position.x - w.position.x;
    const dz = player.position.z - w.position.z;
    const halfX = w.userData && w.userData.halfX ? w.userData.halfX : 0.5;
    const halfZ = w.userData && w.userData.halfZ ? w.userData.halfZ : 3.0;
    const overlapX = (halfX + PLAYER_RADIUS) - Math.abs(dx);
    const overlapZ = (halfZ + PLAYER_RADIUS) - Math.abs(dz);
    const wallTop = w.position.y + (w.userData && w.userData.halfY ? w.userData.halfY : (w.geometry.parameters.height/2 || 3));
    if(overlapX > 0 && overlapZ > 0 && player.position.y < wallTop + 0.5){
      if(overlapX < overlapZ){
        const dir = dx > 0 ? 1 : -1;
        player.position.x += dir * (overlapX + 0.02);
      } else {
        const dir = dz > 0 ? 1 : -1;
        player.position.z += dir * (overlapZ + 0.02);
      }
    }
  }
  if(firstPerson){
    yaw = player.rotation.y;
    pitch = 0;
    const headOffset = new THREE.Vector3(0, 1.5, 0);
    camera.position.copy(player.position).add(headOffset);
    const forward = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
    camera.lookAt(camera.position.clone().add(forward));
  } else {
    const camOffset = new THREE.Vector3(
      Math.sin(yaw)*cameraDistance,
      5 + pitch*2,
      Math.cos(yaw)*cameraDistance
    );
    camera.position.copy(player.position).add(camOffset);
    camera.lookAt(player.position);
  }
  if(fpArms){
    fpArms.visible = firstPerson;
  }
  
  // Level 5 jumpscare trigger
  if(levelIndex === 5 && level5StartTime !== null){
    const elapsedTime = performance.now() - level5StartTime;
    if(elapsedTime > 10000 && !level5JumpscareTriggered){
      level5JumpscareTriggered = true;
      createJumpscareCat();
      // Play jumpscare sound
      if(!jumpscareSoundPlayed){
        playJumpscareSong();
        jumpscareSoundPlayed = true;
      }
    }
  }
  
  // Block movement during jumpscare
  if(level5JumpscareTriggered && levelIndex === 5){
    player.position.x = 0;
    player.position.z = 0;
  }
  if(jumpscareCat){
    // Increment rotation
    if(window.catCanvasRotation === undefined) window.catCanvasRotation = 0;
    window.catCanvasRotation += 0.1;
    
    // Check if 10 seconds have passed since cat appeared
    if(jumpscareCatStartTime !== null && !spinningCatsSpawned){
      const catElapsedTime = performance.now() - jumpscareCatStartTime;
      if(catElapsedTime > 10000){
        spinningCatsSpawned = true;
      }
    }
    
    // Check if 20 seconds have passed since cat appeared
    if(jumpscareCatStartTime !== null && !fullScreenCatsSpawned){
      const catElapsedTime = performance.now() - jumpscareCatStartTime;
      if(catElapsedTime > 20000){
        fullScreenCatsSpawned = true;
      }
    }
    
    // Draw based on stage
    if(secretCodeMatched){
      // Secret win screen already showing, don't redraw
    } else if(jumpscareSoundEnded){
      // Don't redraw - just let the you lose screen show
    } else if(fullScreenCatsSpawned){
      // Full screen cats
      drawFullScreenCats();
    } else if(spinningCatsSpawned){
      // Center cat + orbiting cats
      drawCatUI();
      drawSpinningCats();
    } else {
      // Just center cat
      drawCatUI();
    }
  }
  
  renderer.render(scene, camera);
  prevTime = time;
}

// Expose real handlers
window.realStartGame = startGame;
window.realShowHowTo = showHowTo;
window.realShowPickLevel = showPickLevel;

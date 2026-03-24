// Core game logic

function createPlatform(x,y,z,color,isKill){
  const matOpts = {color};
  if(isKill){
    matOpts.emissive = 0x660000;
    matOpts.emissiveIntensity = 0.6;
  }
  const sizeX = isKill ? 3 : 6;
  const sizeY = 1;
  const sizeZ = isKill ? 3 : 6;
  const geom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
  const p = new THREE.Mesh(
    geom,
    new THREE.MeshStandardMaterial(matOpts)
  );
  p.position.set(x,y,z);
  p.userData.isKill = !!isKill;
  p.userData.halfY = sizeY/2;
  p.userData.standOffset = 2;
  p.userData.halfX = (geom.parameters.width || sizeX) / 2;
  p.userData.halfZ = (geom.parameters.depth || sizeZ) / 2;
  scene.add(p);
  platforms.push(p);
}

function createLedge(x,y,z,color){
  const sizeX = 1.2, sizeY = 0.6, sizeZ = 3.2;
  const geom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
  const mat = new THREE.MeshStandardMaterial({color: color || 0xcccccc});
  const ledge = new THREE.Mesh(geom, mat);
  ledge.position.set(x, y, z);
  ledge.userData.isLedge = true;
  ledge.userData.halfX = sizeX/2;
  ledge.userData.halfZ = sizeZ/2;
  ledge.userData.halfY = sizeY/2;
  ledge.userData.standOffset = 1.2;
  scene.add(ledge);
  platforms.push(ledge);
  ledges.push(ledge);
  return ledge;
}

function createWall(x,y,z,width,height,depth,color, ledgeDefs){
  const geom = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshStandardMaterial({color: color || 0x444444});
  const wall = new THREE.Mesh(geom, mat);
  wall.position.set(x, y + height/2, z);
  wall.userData.isWall = true;
  scene.add(wall);
  walls.push(wall);
  if(Array.isArray(ledgeDefs)){
    const ledgeDepth = 3.2;
    const minLz = z - (depth/2) + (ledgeDepth/2);
    const maxLz = z + (depth/2) - (ledgeDepth/2);
    let maxLedgeY = -Infinity;
    ledgeDefs.forEach(ld=>{
      const lx = x + (ld.x || 0);
      const ly = (y || 0) + (ld.y || 1);
      let lz = z + (ld.z || 0);
      lz = Math.max(minLz, Math.min(maxLz, lz));
      const ledge = createLedge(lx, ly, lz, ld.color || 0xcccccc);
      ledge.userData.parentWall = wall;
      if(ly > maxLedgeY) maxLedgeY = ly;
    });
    if(maxLedgeY > -Infinity){
      const verticalCount = 2;
      const verticalStep = 1.6;
      ledges.filter(l => l.userData.parentWall === wall && l.position.y === maxLedgeY)
        .forEach(baseL => {
          for(let v=1; v<=verticalCount; v++){
            const vy = baseL.position.y + verticalStep * v;
            const vz = baseL.position.z;
            const lx = baseL.position.x;
            const newL = createLedge(lx, vy, vz, 0xcccccc);
            newL.userData.parentWall = wall;
          }
        });
    }
  }
  wall.userData.halfX = width/2;
  wall.userData.halfZ = depth/2;
  wall.userData.halfY = height/2;
  return wall;
}

function gotoLedge(ledge){
  if(!ledge) return;
  let targetX = ledge.position.x;
  let targetY = ledge.position.y + 0.6;
  let targetZ = ledge.position.z;
  if(ledge.userData && ledge.userData.parentWall){
    const w = ledge.userData.parentWall;
    const ledgeHalfZ = ledge.userData && ledge.userData.halfZ ? ledge.userData.halfZ : 1.6;
    const side = (player.position.z < w.position.z) ? -1 : 1;
    targetZ = ledge.position.z + side * (ledgeHalfZ + PLAYER_RADIUS + 0.18);
    targetX = ledge.position.x;
    targetY = ledge.position.y + 0.6;
  } else {
    targetZ = ledge.position.z + 1.25;
  }
  const target = new THREE.Vector3(targetX, targetY, targetZ);
  walkTarget = { pos: target, ledge: ledge, state: 'approach', started: performance.now() };
}

function clearPlatforms(){
  platforms.forEach(p=>{ if(p.parent) scene.remove(p); });
  platforms = [];
  ledges = [];
  walls.forEach(w=>{ if(w.parent) scene.remove(w); });
  walls = [];
  if(window.cryingFigure){
    if(window.cryingFigure.parent){
      scene.remove(window.cryingFigure);
    }
    window.cryingFigure = null;
  }
  if(window.helpingBoy){
    if(window.helpingBoy.parent){
      scene.remove(window.helpingBoy);
    }
    window.helpingBoy = null;
  }
}

function loadLevel(idx){
  removeRestartButton();
  clearPlatforms();
  window.cryingFigureClickCount = 0;
  const defs = levels[idx-1] || [];
  scene.background = new THREE.Color(0x87CEEB);
  if(idx === 3){
    createPlatform(0,0,0,0x222222);
    const floorGeom = new THREE.BoxGeometry(60, 1, 20);
    const floorMat = new THREE.MeshStandardMaterial({color:0x333333});
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(26, -1, 0);
    floor.userData.halfX = 60/2;
    floor.userData.halfZ = 20/2;
    floor.userData.isKill = false;
    floor.userData.halfY = 1/2;
    floor.userData.standOffset = 2;
    scene.add(floor);
    platforms.push(floor);
    const baseX = 10;
    const gap = 8;
    for(let i=0;i<4;i++){
      const wx = baseX + i*gap;
      const wallHeight = 10;
      const side = (i % 2 === 0) ? -1 : 1;
      const ledgeDefs = [
        {x: 0, y:1.4, z: -2 * side, color:0x88ccff},
        {x: 0, y:3.0, z: 0 * side, color:0x88ff88},
        {x: 0, y:4.6, z: 2 * side, color:0xffcc88}
      ];
      createWall(wx, 0, 0, 1, wallHeight, 20, 0x555555, ledgeDefs);
    }
    const exitPlatform3 = new THREE.Mesh(new THREE.BoxGeometry(6,1,6), new THREE.MeshStandardMaterial({color:0x4444ff}));
    exitPlatform3.position.set(50, 3, 0);
    exitPlatform3.castShadow = true;
    exitPlatform3.receiveShadow = true;
    exitPlatform3.userData.halfX = 3;
    exitPlatform3.userData.halfZ = 3;
    exitPlatform3.userData.halfY = 0.5;
    exitPlatform3.userData.standOffset = 2;
    scene.add(exitPlatform3);
    platforms.push(exitPlatform3);
  } else if(idx === 4){
    scene.background = new THREE.Color(0xff0000);
    createPlatform(0,0,0,0xff0000);
    const floorGeom = new THREE.BoxGeometry(200, 1, 200);
    const floorMat = new THREE.MeshStandardMaterial({color:0xcc0000});
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, -5, 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    floor.userData.halfX = 200/2;
    floor.userData.halfZ = 200/2;
    floor.userData.isKill = false;
    floor.userData.halfY = 1/2;
    floor.userData.standOffset = 2;
    scene.add(floor);
    platforms.push(floor);
    const exitPlatform = new THREE.Mesh(new THREE.BoxGeometry(6,1,6), new THREE.MeshStandardMaterial({color:0xff0000}));
    exitPlatform.position.set(50, 0, 50);
    exitPlatform.castShadow = true;
    exitPlatform.receiveShadow = true;
    exitPlatform.userData.halfX = 3;
    exitPlatform.userData.halfZ = 3;
    exitPlatform.userData.halfY = 0.5;
    exitPlatform.userData.standOffset = 2;
    scene.add(exitPlatform);
    platforms.push(exitPlatform);
    const brickGeom = new THREE.BoxGeometry(8, 12, 6);
    const brickMat = new THREE.MeshStandardMaterial({color:0x8b0000, roughness:0.8, metalness:0.2});
    const brick = new THREE.Mesh(brickGeom, brickMat);
    brick.position.set(-80, 0, -80);
    brick.castShadow = true;
    brick.receiveShadow = true;
    scene.add(brick);
    createVHSEffect();
    // Crying figure disabled - using only helping boy
    createHelpingBoy();
  } else if(idx === 5){
    // Level 5 - Jumpscare level
    scene.background = new THREE.Color(0x000000); // Pure black
    const floorGeom = new THREE.BoxGeometry(50, 1, 50);
    const floorMat = new THREE.MeshStandardMaterial({color:0x1a1a1a});
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, -5, 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    floor.userData.halfX = 50/2;
    floor.userData.halfZ = 50/2;
    floor.userData.isKill = false;
    floor.userData.halfY = 1/2;
    floor.userData.standOffset = 2;
    scene.add(floor);
    platforms.push(floor);
    // Reset jumpscare timer
    level5StartTime = performance.now();
    level5JumpscareTriggered = false;
    jumpscareSoundPlayed = false;
    jumpscareCatStartTime = null;
    spinningCatsSpawned = false;
    fullScreenCatsSpawned = false;
    jumpscareSoundEnded = false;
    secretCodeSequence = '';
    secretCodeMatched = false;
    removeRestartButton();
    // Stop any playing audio
    if(window.jumpscarAudio){
      window.jumpscarAudio.pause();
      window.jumpscarAudio.currentTime = 0;
    }
    const catCanvas = document.getElementById('jumpscareCatCanvas');
    if(catCanvas) catCanvas.remove();
  } else {
    defs.forEach(d=> createPlatform(d.x,d.y,d.z,d.color,d.isKill));
  }
  const spawn = defs[0] || {x:0,y:0,z:0};
  if(player){
    player.position.set(spawn.x, (spawn.y || 0) + 5, spawn.z);
    velocityY = 0;
    canJump = false;
  }
  balloons.forEach(b=>{ if(b.parent) scene.remove(b); });
  balloons = [];
  gameWon = false;
  jumpscareSoundPlayed = false;
  jumpscareSoundEnded = false;
  secretCodeSequence = '';
  secretCodeMatched = false;
  const v = document.getElementById('victory'); if(v) v.style.display = 'none';
}

function checkCollisions(){
  canJump=false;
  for(let i=0;i<platforms.length;i++){
    const p = platforms[i];
    const dx=Math.abs(player.position.x-p.position.x);
    const dz=Math.abs(player.position.z-p.position.z);
    const dy=player.position.y-p.position.y;
    const halfX = p.userData && p.userData.halfX ? p.userData.halfX : 3;
    const halfZ = p.userData && p.userData.halfZ ? p.userData.halfZ : 3;
    const standOffset = p.userData && p.userData.standOffset ? p.userData.standOffset : 2;
    if(dx < halfX && dz < halfZ && dy<= (standOffset + 0.1) && dy>0 && velocityY<=0){
      player.position.y = p.position.y + standOffset;
      velocityY = 0;
      if(p.userData && p.userData.isKill){
        player.position.set(0,5,0);
        velocityY = 0;
        canJump = false;
        break;
      }
      canJump = true;
      player.userData = player.userData || {};
      player.userData.onLedge = p.userData && p.userData.isLedge ? p : null;
      if(platforms.length>0 && p===platforms[platforms.length-1] && !gameWon && levelIndex !== 4 && levelIndex !== 5){
        showVictory();
      }
      break;
    }
  }
}

function showVictory(){
  gameWon = true;
  const v = document.getElementById("victory");
  if(v) v.style.display = "flex";
  const nextBtn = document.getElementById('nextLevelBtn');
  if(levelIndex === 4){
    if(nextBtn) nextBtn.style.display = 'none';
    const buttonContainer = v.querySelector('.victory-card div[style*="display:flex"]');
    if(buttonContainer) buttonContainer.style.display = 'none';
  } else {
    if(nextBtn) nextBtn.style.display = 'block';
  }
}

function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 12);
  fpArms = new THREE.Group();
  const fpArmGeo = new THREE.CylinderGeometry(0.07,0.07,0.7,12);
  const fpMat = new THREE.MeshStandardMaterial({color:0xffd1b3});
  const fpLeft = new THREE.Mesh(fpArmGeo, fpMat);
  const fpRight = new THREE.Mesh(fpArmGeo, fpMat);
  fpLeft.position.set(-0.35,-0.45,-0.6);
  fpLeft.rotation.z = Math.PI/2;
  fpRight.position.set(0.35,-0.45,-0.6);
  fpRight.rotation.z = Math.PI/2;
  fpArms.add(fpLeft);
  fpArms.add(fpRight);
  fpArms.userData.left = fpLeft;
  fpArms.userData.right = fpRight;
  camera.add(fpArms);
  fpArms.visible = firstPerson;
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  renderer.setClearColor(0x87CEEB, 1);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.zIndex = '0';
  renderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(renderer.domElement);
  renderer.render(scene, camera);
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  const light = new THREE.HemisphereLight(0xffffff,0x444444,1);
  scene.add(light);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(50, 50, 50);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -100;
  dirLight.shadow.camera.right = 100;
  dirLight.shadow.camera.top = 100;
  dirLight.shadow.camera.bottom = -100;
  scene.add(dirLight);
  player = new THREE.Group();
  
  // Determine player colors based on gender
  let bodyColor = 0x3366ff; // default boy blue
  let legColor = 0x3366ff;  // default boy blue
  let hairColor = 0x332211; // default brown
  
  if(window.playerGender === 'girl'){
    bodyColor = 0xff69b4;   // pink
    legColor = 0xff1493;    // deep pink
    hairColor = 0x8b4513;   // brown (longer)
  }
  
  const skinMat = new THREE.MeshStandardMaterial({color:0xffd1b3});
  const clothMat = new THREE.MeshStandardMaterial({color:bodyColor});
  const legMat = new THREE.MeshStandardMaterial({color:legColor});
  const hairMat = new THREE.MeshStandardMaterial({color:hairColor});
  head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    skinMat
  );
  head.position.set(0, 0.9, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  player.add(head);
  torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.0, 0.4),
    clothMat
  );
  torso.position.set(0, 0.2, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  player.add(torso);
  const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 12);
  leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.6, 0.2, 0);
  leftArm.rotation.z = Math.PI / 12;
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  player.add(leftArm);
  rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.6, 0.2, 0);
  rightArm.rotation.z = -Math.PI / 12;
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  player.add(rightArm);
  const legGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.9, 12);
  leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.18, -0.55, 0);
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  player.add(leftLeg);
  rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.18, -0.55, 0);
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  player.add(rightLeg);
  
  // Hair on head
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.8),
    hairMat
  );
  hair.position.set(0, 1.05, 0);
  hair.castShadow = true;
  hair.receiveShadow = true;
  player.add(hair);
  
  // Long flowing hair on back for girl
  if(window.playerGender === 'girl'){
    const longHair = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 1.2, 12),
      hairMat
    );
    longHair.position.set(0, 0.5, -0.38);
    longHair.castShadow = true;
    longHair.receiveShadow = true;
    player.add(longHair);
  }
  player.position.set(0,5,0);
  scene.add(player);
  if(firstPerson){
    head.visible = false;
    torso.visible = false;
    leftArm.visible = false;
    rightArm.visible = false;
    leftLeg.visible = false;
    rightLeg.visible = false;
  }
  loadLevel(levelIndex);
  document.addEventListener("keydown", e=>{
    keys[e.code]=true;
    
    // Secret code detection for Level 5 jumpscare
    if(level5JumpscareTriggered && !secretCodeMatched && jumpscareCat){
      const key = e.key.toLowerCase();
      if(key === 'c' || key === 'a' || key === 't'){
        secretCodeSequence += key;
        if(secretCodeSequence.length > 3){
          secretCodeSequence = secretCodeSequence.slice(-3);
        }
        
        if(secretCodeSequence === 'cat'){
          console.log('SECRET CODE UNLOCKED!');
          secretCodeMatched = true;
          showSecretWinScreen();
          secretCodeSequence = '';
        }
      } else {
        secretCodeSequence = '';
      }
    }
  });
  document.addEventListener("keyup", e=>keys[e.code]=false);
  renderer.domElement.addEventListener("mousedown", e=>{
    if(e.button===2){
      rotating=true;
      renderer.domElement.requestPointerLock();
    } else if(e.button===0){
      if(!rotating && raycaster){
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(ledges);
        if(hits.length){
          const ledge = hits[0].object;
          gotoLedge(ledge);
        }
        if(window.helpingBoy){
          const boyHits = raycaster.intersectObject(window.helpingBoy, true);
          console.log('Boy click check:', window.helpingBoy, 'hits:', boyHits.length);
          if(boyHits.length){
            console.log('Boy clicked!');
            window.nextLevel();
          }
        }
      }
    }
  });
  document.addEventListener("mouseup", e=>{
    if(e.button===2){
      rotating=false;
      document.exitPointerLock();
    }
  });
  document.addEventListener("mousemove", e=>{
    if(rotating && document.pointerLockElement===renderer.domElement){
      yaw -= e.movementX * 0.0025;
      pitch -= e.movementY * 0.002;
      pitch = Math.max(-0.8, Math.min(0.8,pitch));
    }
  });
  document.addEventListener("wheel", e=>{
    e.preventDefault();
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(2, Math.min(20, cameraDistance));
  }, {passive: false});
  window.addEventListener("contextmenu", e=>e.preventDefault());
}

function createVHSEffect(){
  let vhsOverlay = document.getElementById('vhsOverlay');
  if(vhsOverlay) vhsOverlay.remove();
  
  const canvas = document.createElement('canvas');
  canvas.id = 'vhsOverlay';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1';
  canvas.style.opacity = '0.15';
  canvas.style.mixBlendMode = 'multiply';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  function drawVHS(){
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const scanlineSpacing = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for(let i = 0; i < canvas.height; i += scanlineSpacing){
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    for(let i = 0; i < 100; i++){
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.5})`;
      ctx.fillRect(x, y, size, size);
    }
  }
  
  function animateVHS(){
    drawVHS();
    requestAnimationFrame(animateVHS);
  }
  
  animateVHS();
}

function createCryingFigure(){
  // Don't create if already exists in scene
  if(window.cryingFigure && window.cryingFigure.parent === scene){
    console.log('Crying figure already in scene, skipping creation');
    return;
  }
  
  console.log('Creating crying figure');
  const skinMat = new THREE.MeshStandardMaterial({color:0xffd1b3});
  const clothMat = new THREE.MeshStandardMaterial({color:0x3366ff});
  const hairMat = new THREE.MeshStandardMaterial({color:0x332211});
  
  const group = new THREE.Group();
  group.position.set(-35, -3, 35);
  group.userData.isCryingFigure = true;
  window.cryingFigure = group;
  
  // Head
  const headClone = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), skinMat);
  headClone.position.set(0, 0.5, 0);
  headClone.castShadow = true;
  headClone.receiveShadow = true;
  group.add(headClone);
  
  // Torso (slouched)
  const torsoClone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.4), clothMat);
  torsoClone.position.set(0, -0.3, 0);
  torsoClone.rotation.z = -0.4;
  torsoClone.castShadow = true;
  torsoClone.receiveShadow = true;
  group.add(torsoClone);
  
  // Left arm (up to face)
  const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 12);
  const leftArmClone = new THREE.Mesh(armGeo, skinMat);
  leftArmClone.position.set(-0.5, 0.1, 0);
  leftArmClone.rotation.z = Math.PI / 2 + 0.5;
  leftArmClone.castShadow = true;
  leftArmClone.receiveShadow = true;
  group.add(leftArmClone);
  
  // Right arm (up to face)
  const rightArmClone = new THREE.Mesh(armGeo, skinMat);
  rightArmClone.position.set(0.5, 0.1, 0);
  rightArmClone.rotation.z = Math.PI / 2 - 0.5;
  rightArmClone.castShadow = true;
  rightArmClone.receiveShadow = true;
  group.add(rightArmClone);
  
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.9, 12);
  const leftLegClone = new THREE.Mesh(legGeo, clothMat);
  leftLegClone.position.set(-0.18, -0.8, 0);
  leftLegClone.castShadow = true;
  leftLegClone.receiveShadow = true;
  group.add(leftLegClone);
  
  const rightLegClone = new THREE.Mesh(legGeo, clothMat);
  rightLegClone.position.set(0.18, -0.8, 0);
  rightLegClone.castShadow = true;
  rightLegClone.receiveShadow = true;
  group.add(rightLegClone);
  
  // Hair
  const hairClone = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.8),
    hairMat
  );
  hairClone.position.set(0, 0.67, 0);
  hairClone.castShadow = true;
  hairClone.receiveShadow = true;
  group.add(hairClone);
  
  scene.add(group);
  
  // Create and play crying sound
  let audio = document.getElementById('cryingSound');
  if(!audio){
    audio = document.createElement('audio');
    audio.id = 'cryingSound';
    audio.loop = true;
    audio.volume = 0.3;
    // For demo, create a simple audio context tone, or use a data URL
    // You can replace with actual crying sound file
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 200;
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e){}
  }
}

function showDialogue(){
  const dialogueSequence = [
    "hi....",
    "what do you want?",
    "leave me alone...",
    "sure i probably need help leaving this place too anyways",
    "okay ill take us to the next level"
  ];
  
  window.cryingFigureClickCount = (window.cryingFigureClickCount || 0) + 1;
  const index = Math.min(window.cryingFigureClickCount - 1, dialogueSequence.length - 1);
  const dialogue = dialogueSequence[index];
  
  const dialogueBox = document.getElementById('dialogueBox');
  const dialogueText = document.getElementById('dialogueText');
  dialogueText.innerHTML = dialogue;
  
  // Remove old button if exists
  const oldBtn = dialogueBox.querySelector('.dialogue-btn');
  if(oldBtn) oldBtn.remove();
  
  dialogueBox.style.display = 'block';
  
  if(window.cryingFigureClickCount === 3){
    // Show button after "leave me alone..."
    const btn = document.createElement('button');
    btn.className = 'dialogue-btn';
    btn.textContent = 'Ask for help';
    btn.style.marginTop = '10px';
    btn.style.padding = '8px 16px';
    btn.style.background = '#fff';
    btn.style.color = '#000';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.onclick = (e) => {
      e.stopPropagation();
      showDialogue();
    };
    dialogueBox.appendChild(btn);
  }
  
  dialogueBox.onclick = (e) => {
    e.stopPropagation();
    if(window.cryingFigureClickCount < dialogueSequence.length){
      showDialogue();
    } else {
      dialogueBox.style.display = 'none';
    }
  };
}

function createHelpingBoy(){
  // Remove existing helping boy if it exists
  if(window.helpingBoy){
    if(window.helpingBoy.parent){
      scene.remove(window.helpingBoy);
    }
    window.helpingBoy = null;
  }
  
  console.log('Creating helping boy...');
  const skinMat = new THREE.MeshStandardMaterial({color:0xffd1b3});
  const clothMat = new THREE.MeshStandardMaterial({color:0x3366ff});
  const hairMat = new THREE.MeshStandardMaterial({color:0x332211});
  
  const group = new THREE.Group();
  group.position.set(35, -3, 35);
  group.userData.isHelpingBoy = true;
  window.helpingBoy = group;
  console.log('window.helpingBoy set:', window.helpingBoy);
  
  // Head
  const headClone = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), skinMat);
  headClone.position.set(0, 0.5, 0);
  headClone.castShadow = true;
  headClone.receiveShadow = true;
  group.add(headClone);
  
  // Torso
  const torsoClone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.4), clothMat);
  torsoClone.position.set(0, -0.3, 0);
  torsoClone.castShadow = true;
  torsoClone.receiveShadow = true;
  group.add(torsoClone);
  
  // Left arm
  const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 12);
  const leftArmClone = new THREE.Mesh(armGeo, skinMat);
  leftArmClone.position.set(-0.5, 0.1, 0);
  leftArmClone.rotation.z = Math.PI / 12;
  leftArmClone.castShadow = true;
  leftArmClone.receiveShadow = true;
  group.add(leftArmClone);
  
  // Right arm
  const rightArmClone = new THREE.Mesh(armGeo, skinMat);
  rightArmClone.position.set(0.5, 0.1, 0);
  rightArmClone.rotation.z = -Math.PI / 12;
  rightArmClone.castShadow = true;
  rightArmClone.receiveShadow = true;
  group.add(rightArmClone);
  
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.9, 12);
  const leftLegClone = new THREE.Mesh(legGeo, clothMat);
  leftLegClone.position.set(-0.18, -0.8, 0);
  leftLegClone.castShadow = true;
  leftLegClone.receiveShadow = true;
  group.add(leftLegClone);
  
  const rightLegClone = new THREE.Mesh(legGeo, clothMat);
  rightLegClone.position.set(0.18, -0.8, 0);
  rightLegClone.castShadow = true;
  rightLegClone.receiveShadow = true;
  group.add(rightLegClone);
  
  // Hair
  const hairClone = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.8),
    hairMat
  );
  hairClone.position.set(0, 0.67, 0);
  hairClone.castShadow = true;
  hairClone.receiveShadow = true;
  group.add(hairClone);
  
  // Add invisible clickable sphere around the boy
  const clickSphereGeom = new THREE.SphereGeometry(0.7, 8, 8);
  const clickSphereMat = new THREE.MeshStandardMaterial({transparent: true, opacity: 0});
  const clickSphere = new THREE.Mesh(clickSphereGeom, clickSphereMat);
  clickSphere.position.set(0, 0, 0);
  group.add(clickSphere);
  
  scene.add(group);
  window.helpingBoy = group;
  console.log('Helping boy created and added to scene');
  window.helpingBoyClickCount = 0;
}

function showBoyDialogue(){
  console.log('showBoyDialogue called');
  const dialogueBox = document.getElementById('dialogueBox');
  const dialogueText = document.getElementById('dialogueText');
  
  console.log('dialogueBox:', dialogueBox, 'dialogueText:', dialogueText);
  
  // Clear everything
  dialogueBox.innerHTML = '';
  dialogueText.innerHTML = "ill take us to the next level HEHREHRE";
  dialogueBox.appendChild(dialogueText);
  
  // Create button
  const btn = document.createElement('button');
  btn.className = 'dialogue-btn';
  btn.textContent = 'ok';
  btn.style.marginTop = '10px';
  btn.style.padding = '8px 16px';
  btn.style.background = '#fff';
  btn.style.color = '#000';
  btn.style.border = 'none';
  btn.style.borderRadius = '5px';
  btn.style.cursor = 'pointer';
  btn.onclick = (e) => {
    e.stopPropagation();
    console.log('Boy dialogue button clicked');
    dialogueBox.style.display = 'none';
    window.nextLevel();
  };
  dialogueBox.appendChild(btn);
  dialogueBox.style.display = 'block';
  console.log('Dialogue box displayed');
}

function createJumpscareCat(){
  // Create a 2D canvas UI overlay for the cat
  let catCanvas = document.getElementById('jumpscareCatCanvas');
  
  if(!catCanvas){
    catCanvas = document.createElement('canvas');
    catCanvas.id = 'jumpscareCatCanvas';
    catCanvas.width = window.innerWidth;
    catCanvas.height = window.innerHeight;
    catCanvas.style.position = 'fixed';
    catCanvas.style.top = '0';
    catCanvas.style.left = '0';
    catCanvas.style.zIndex = '1000';
    catCanvas.style.pointerEvents = 'none';
    document.body.appendChild(catCanvas);
  }
  
  jumpscareCat = catCanvas; // Store reference
  window.catCanvasRotation = 0;
  jumpscareCatStartTime = performance.now();
  spinningCatsSpawned = false;
  fullScreenCatsSpawned = false;
}

function drawCatUI(){
  const canvas = document.getElementById('jumpscareCatCanvas');
  if(!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, w, h);
  
  // Center position
  const centerX = w / 2;
  const centerY = h / 2;
  
  // Save context for rotation
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(window.catCanvasRotation);
  ctx.translate(-centerX, -centerY);
  
  // Draw cat head (bigger)
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(centerX, centerY - 30, 50, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw ears (bigger)
  ctx.beginPath();
  ctx.arc(centerX - 35, centerY - 85, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + 35, centerY - 85, 22, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw eyes (bigger)
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(centerX - 20, centerY - 35, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + 20, centerY - 35, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw torso (bigger)
  ctx.fillStyle = '#ff8833';
  ctx.fillRect(centerX - 45, centerY, 90, 70);
  
  // Draw legs (bigger)
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(centerX - 35, centerY + 70, 20, 35);
  ctx.fillRect(centerX + 15, centerY + 70, 20, 35);
  
  // Draw tail (bigger)
  ctx.beginPath();
  ctx.arc(centerX + 50, centerY + 30, 18, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function showSecretWinScreen(){
  const canvas = document.getElementById('jumpscareCatCanvas');
  if(!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  // Clear and fill with black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  
  // Draw text
  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw "YOU WIN"
  ctx.fillText('YOU WIN', w / 2, h / 2 - 80);
  
  // Draw "*how did you know!*" in green
  ctx.font = 'bold 60px Arial';
  ctx.fillStyle = '#00ff00';
  ctx.fillText('*how did you know!*', w / 2, h / 2 + 80);
  
  // Stop audio if it's playing
  if(window.jumpscarAudio){
    window.jumpscarAudio.pause();
  }
  
  // Show restart button
  showRestartButton();
}

function showYouLoseScreen(){
  const canvas = document.getElementById('jumpscareCatCanvas');
  if(!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  // Clear and fill with black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  
  // Draw text
  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw "YOU LOSE"
  ctx.fillText('YOU LOSE', w / 2, h / 2 - 80);
  
  // Draw "*cats gotcha*" in smaller font
  ctx.font = 'bold 60px Arial';
  ctx.fillStyle = '#ffaa00';
  ctx.fillText('*cats gotcha*', w / 2, h / 2 + 80);
  
  // Show restart button
  showRestartButton();
}

function showRestartButton(){
  // Remove existing button if any
  const existingBtn = document.getElementById('jumpscarRestartBtn');
  if(existingBtn) existingBtn.remove();
  
  const btn = document.createElement('button');
  btn.id = 'jumpscarRestartBtn';
  btn.textContent = 'Restart Level';
  btn.style.position = 'fixed';
  btn.style.bottom = '50px';
  btn.style.left = '50%';
  btn.style.transform = 'translateX(-50%)';
  btn.style.zIndex = '1001';
  btn.style.padding = '15px 40px';
  btn.style.fontSize = '24px';
  btn.style.backgroundColor = '#fff';
  btn.style.color = '#000';
  btn.style.border = 'none';
  btn.style.borderRadius = '10px';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = 'bold';
  
  btn.onmouseover = () => {
    btn.style.backgroundColor = '#ccc';
  };
  btn.onmouseout = () => {
    btn.style.backgroundColor = '#fff';
  };
  
  btn.onclick = () => {
    removeRestartButton();
    loadLevel(5);
  };
  
  document.body.appendChild(btn);
}

function removeRestartButton(){
  const btn = document.getElementById('jumpscarRestartBtn');
  if(btn) btn.remove();
}

function drawFullScreenCats(){
  const canvas = document.getElementById('jumpscareCatCanvas');
  if(!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  // Fill screen with red
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, w, h);
  
  // Draw cats all over the screen in a grid pattern
  const catSize = 40;
  const cols = Math.ceil(w / (catSize * 1.5));
  const rows = Math.ceil(h / (catSize * 1.5));
  
  for(let row = 0; row < rows; row++){
    for(let col = 0; col < cols; col++){
      const x = col * catSize * 1.5 + catSize;
      const y = row * catSize * 1.5 + catSize;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(window.catCanvasRotation + row + col);
      
      // Draw mini cat
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(0, -8, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Tiny ears
      ctx.beginPath();
      ctx.arc(-6, -16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6, -16, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-4, -10, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -10, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Tiny torso
      ctx.fillStyle = '#ff8833';
      ctx.fillRect(-9, 0, 18, 14);
      
      // Tiny legs
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(-7, 14, 4, 8);
      ctx.fillRect(3, 14, 4, 8);
      
      ctx.restore();
    }
  }
}

function drawSpinningCats(){
  const canvas = document.getElementById('jumpscareCatCanvas');
  if(!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const centerX = w / 2;
  const centerY = h / 2;
  
  // Draw 4 spinning cats around the corners/edges
  const numCats = 4;
  const radius = 120;
  
  for(let i = 0; i < numCats; i++){
    const angle = (window.catCanvasRotation * 2 + (i * Math.PI * 2 / numCats));
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(window.catCanvasRotation + i);
    
    // Draw small spinning cat
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(0, -15, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Small ears
    ctx.beginPath();
    ctx.arc(-12, -30, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -30, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-8, -18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -18, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Small torso
    ctx.fillStyle = '#ff8833';
    ctx.fillRect(-18, 0, 36, 28);
    
    // Small legs
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(-14, 28, 8, 15);
    ctx.fillRect(6, 28, 8, 15);
    
    ctx.restore();
  }
}

function playJumpscareSong(){
  try {
    // Try to play the audio file
    const audio = new Audio('./sounds/jumpscare.mp3');
    audio.volume = 1.0;
    audio.muted = false;
    audio.currentTime = 0;
    
    // Store reference globally
    window.jumpscarAudio = audio;
    
    // Track when audio ends
    audio.addEventListener('ended', () => {
      console.log('Jumpscare audio ended');
      jumpscareSoundEnded = true;
      showYouLoseScreen();
    });
    
    const playPromise = audio.play();
    
    if(playPromise !== undefined){
      playPromise.then(() => {
        console.log('Jumpscare audio playing');
      }).catch(err => {
        console.error('Audio playback error:', err);
        // Fallback: create a loud beep sound
        createJumpscareBeep();
      });
    }
  } catch(err){
    console.error('Error creating audio:', err);
    createJumpscareBeep();
  }
}

function createJumpscareBeep(){
  // Fallback: generate a scary beep sound with Web Audio API
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Create multiple beeps for jumpscare effect
    for(let i = 0; i < 3; i++){
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 800 + (i * 200);
      gain.gain.setValueAtTime(0.3, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.1);
      
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.1);
    }
  } catch(err){
    console.error('Beep creation error:', err);
  }
}

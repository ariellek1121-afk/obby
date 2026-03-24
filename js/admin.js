// Admin functions

function spawnBalloonsFromUI(){
  const n = parseInt(document.getElementById('balloonCount')?.value || 6, 10);
  spawnBalloons(Math.max(1, Math.min(50, n)));
}

function spawnBalloons(n){
  for(let i=0;i<n;i++) createBalloon();
}

function createBalloon(){
  const colorPool = [0xff4b4b,0xffb84b,0xffd84b,0x4bff7a,0x4bd3ff,0x7a4bff,0xff4bd5];
  const col = colorPool[Math.floor(Math.random()*colorPool.length)];
  const balloon = new THREE.Group();
  const sph = new THREE.Mesh(new THREE.SphereGeometry(0.25,12,12), new THREE.MeshStandardMaterial({color:col, emissive:col, emissiveIntensity:0.25}));
  sph.position.set(0,0,0);
  balloon.add(sph);
  const stringGeo = new THREE.CylinderGeometry(0.01,0.01,0.6,6);
  const string = new THREE.Mesh(stringGeo, new THREE.MeshStandardMaterial({color:0x222222}));
  string.position.set(0,-0.45,0);
  balloon.add(string);
  const px = player.position.x + (Math.random()-0.5)*4;
  const pz = player.position.z + (Math.random()-0.5)*4;
  const py = Math.max(player.position.y+1.5, 2 + Math.random()*1.5);
  balloon.position.set(px, py, pz);
  balloon.userData.vy = 0.2 + Math.random()*0.6;
  balloon.userData.freq = 0.8 + Math.random()*1.2;
  balloon.userData.amp = 0.2 + Math.random()*0.4;
  balloon.userData.offset = Math.random()*10;
  balloon.userData.spawnMs = performance.now();
  scene.add(balloon);
  balloons.push(balloon);
}

function toggleFly(){
  flyEnabled = !flyEnabled;
  const btn = document.getElementById('flyBtn');
  if(btn) btn.textContent = flyEnabled ? 'Disable Fly' : 'Enable Fly';
}

function setFlySpeed(v){
  flySpeed = Math.max(1, Math.min(600, Number(v) || 12));
  const el = document.getElementById('flySpeedVal');
  if(el) el.textContent = flySpeed;
}

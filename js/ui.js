// UI handlers

function setupUI(){
  const menu = document.getElementById('menu');
  if(menu){
    try { document.body.appendChild(menu); } catch(e){}
    menu.style.zIndex = 2147483647;
    menu.style.pointerEvents = 'auto';
    menu.style.position = 'absolute';
  }
  const genderModal = document.getElementById('genderSelect');
  if(genderModal){ 
    try { document.body.appendChild(genderModal); } catch(e){}
    genderModal.style.zIndex = 2147483650;
  }
  const play = document.getElementById('playBtn');
  if(play){ 
    play.style.pointerEvents = 'auto'; 
    play.addEventListener('click', (e)=>{ 
      e.preventDefault();
      e.stopPropagation();
      startGame(); 
    }); 
  }
  const how = document.getElementById('howtoBtn');
  if(how){ how.style.pointerEvents = 'auto'; how.addEventListener('click', ()=>{ showHowTo(); }); }
  const pick = document.getElementById('pickBtn');
  if(pick){ pick.style.pointerEvents = 'auto'; pick.addEventListener('click', ()=>{ showPickLevel(); }); }
  const pickModal = document.getElementById('pickLevel'); if(pickModal) { try{ document.body.appendChild(pickModal); }catch(e){}; pickModal.style.zIndex = 2147483650; }
  const howModal = document.getElementById('howto'); if(howModal) { try{ document.body.appendChild(howModal); }catch(e){}; howModal.style.zIndex = 2147483650; }
}

function startGame(){
  const genderModal = document.getElementById('genderSelect');
  const menuEl = document.getElementById('menu');
  if(genderModal && !window.playerGender){
    genderModal.style.display = 'flex';
  } else {
    completeStartGame();
  }
}

function selectGender(gender){
  window.playerGender = gender;
  const genderModal = document.getElementById('genderSelect');
  if(genderModal) genderModal.style.display = 'none';
  completeStartGame();
}

function completeStartGame(){
  const menuEl = document.getElementById('menu');
  if(menuEl) menuEl.style.display='none';
  if(!scene){
    init();
    animate();
    if(renderer && renderer.domElement) renderer.domElement.style.pointerEvents = 'auto';
  } else {
    loadLevel(levelIndex);
    if(renderer && renderer.domElement) renderer.domElement.style.pointerEvents = 'auto';
  }
}

function showPickLevel(){
  const el = document.getElementById('pickLevel');
  const sel = document.getElementById('levelSelect');
  if(!el || !sel) return;
  sel.innerHTML = '';
  for(let i=1;i<=levels.length;i++){
    const opt = document.createElement('option');
    opt.value = i; opt.text = 'Level ' + i;
    sel.appendChild(opt);
  }
  sel.value = levelIndex;
  el.style.display = 'flex';
}

function hidePickLevel(){ 
  const el = document.getElementById('pickLevel'); 
  if(el) el.style.display = 'none'; 
}

function setStartLevel(){
  const sel = document.getElementById('levelSelect');
  if(!sel) return;
  const v = Number(sel.value) || 1;
  levelIndex = v;
  hidePickLevel();
  const menu = document.getElementById('menu'); if(menu){ const h = menu.querySelector('h1'); if(h) h.textContent = '3D OBBY - Start Level ' + levelIndex; }
}

function goToLevel(){
  const sel = document.getElementById('levelSelect');
  if(!sel) return;
  const v = Number(sel.value) || 1;
  levelIndex = v;
  hidePickLevel();
  if(!scene){
    startGame();
    return;
  }
  loadLevel(levelIndex);
  const menu = document.getElementById('menu'); if(menu) menu.style.display = 'none';
}

function restartGame(){
  const v = document.getElementById("victory");
  if(v) v.style.display = "none";
  gameWon = false;
  player.position.set(0,5,0);
  velocityY = 0;
  canJump = false;
  balloons.forEach(b=>{ if(b.parent) scene.remove(b); });
  balloons = [];
  flyEnabled = false;
  const fb = document.getElementById('flyBtn'); if(fb) fb.textContent = 'Enable Fly';
}

function nextLevel(){
  const v = document.getElementById('victory'); if(v) v.style.display = 'none';
  gameWon = false;
  levelIndex++;
  if(levelIndex > levels.length){
    levelIndex = 1;
    setMenuForLevel(0, 'All Levels Complete!', 'Restart', 'restartToHome');
    return;
  }
  
  // Show warning before level 5
  if(levelIndex === 5){
    const warningModal = document.getElementById('level5Warning');
    if(warningModal) warningModal.style.display = 'flex';
    return;
  }
  
  loadLevel(levelIndex);
  const menu = document.getElementById('menu'); if(menu) menu.style.display = 'none';
}

function setMenuForLevel(idx, heading, btnText, btnHandlerName){
  const menu = document.getElementById('menu');
  if(!menu) return;
  const h = menu.querySelector('h1');
  if(h) h.textContent = heading || `Play Level ${idx}`;
  const btn = menu.querySelector('button');
  if(btn){
    if(btnText){
      btn.textContent = btnText;
    } else {
      btn.textContent = 'PLAY';
    }
    if(btnHandlerName){
      btn.setAttribute('onclick', btnHandlerName + '()');
    } else {
      btn.setAttribute('onclick', 'startGame()');
    }
  }
  menu.style.display = 'flex';
}

function restartToHome(){
  levelIndex = 1;
  window.playerGender = null;
  clearPlatforms();
  balloons.forEach(b=>{ if(b.parent) scene.remove(b); });
  balloons = [];
  gameWon = false;
  velocityY = 0;
  canJump = false;
  const v = document.getElementById('victory'); if(v) v.style.display = 'none';
  const menu = document.getElementById('menu');
  if(menu){
    const h = menu.querySelector('h1'); if(h) h.textContent = '3D OBBY';
    const btn = menu.querySelector('button'); if(btn){ btn.textContent = 'PLAY'; btn.setAttribute('onclick','startGame()'); }
    menu.style.display = 'flex';
  }
  if(renderer && renderer.domElement) renderer.domElement.style.pointerEvents = 'none';
}

function showHowTo(){
  const h = document.getElementById('howto');
  if(h){ h.style.display = 'flex'; h.setAttribute('aria-hidden','false'); }
}

function hideHowTo(){
  const h = document.getElementById('howto');
  if(h){ h.style.display = 'none'; h.setAttribute('aria-hidden','true'); }
}

function leaveGame(){
  restartToHome();
}

function skipLevel(){
  levelIndex = Math.min(levels.length, levelIndex + 1);
  loadLevel(levelIndex);
  const menu = document.getElementById('menu'); if(menu) menu.style.display = 'none';
}

// Expose handlers to window
window.startGame = startGame;
window.selectGender = selectGender;
window.completeStartGame = completeStartGame;
window.goBackFromWarning = goBackFromWarning;
window.proceedToLevel5 = proceedToLevel5;
window.nextLevel = nextLevel;

function goBackFromWarning(){
  const warningModal = document.getElementById('level5Warning');
  if(warningModal) warningModal.style.display = 'none';
  levelIndex = 4;
  loadLevel(levelIndex);
}

function proceedToLevel5(){
  const warningModal = document.getElementById('level5Warning');
  if(warningModal) warningModal.style.display = 'none';
  const menu = document.getElementById('menu');
  if(menu) menu.style.display = 'none';
  loadLevel(5);
}

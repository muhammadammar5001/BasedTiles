// --- 🟣 FARCASTER SDK INTEGRATION ---
// 🎯 Critical: Correct CDN import as a module
import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';

// 🎯 Critical: Farcaster Splash screen ko hatane ke liye (App display ready)
sdk.actions.ready();


// Game constants
const COLUMNS = 4;
const TILE_HEIGHT = 120;
const SPAWN_RATE = 400; 
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.04;

// Game variables
let gameState = 'menu';
let score = 0, combo = 0, lives = 3, tileId = 0, speed = 3, spawnTimer = 0, lastTime = Date.now();
let tiles = [];
let currentBlastSound = null; 

// DOM elements
const container = document.getElementById('game-container');
const menu = document.getElementById('menu');
const gameOver = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const playAgain = document.getElementById('play-again');
const shareBtn = document.getElementById('share-btn'); 
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('final-score');
const finalComboEl = document.getElementById('final-combo'); 
const bestScoreOverEl = document.getElementById('best-score-over');
const statsEl = document.getElementById('stats');

// Load Best Score
let bestScore = localStorage.getItem('basedTilesBestScore') || 0;
bestScore = parseInt(bestScore, 10); 

// --- AUDIO SETUP (UNCHANGED) ---
const audioUrls = [];
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        let noteName = note + octave;
        if (octave === 2 && notes.indexOf(note) < notes.indexOf('f')) continue; 
        if (octave === 7 && note !== 'c') break;
        
        let encodedName = noteName.replace('#', '%23');

        audioUrls.push({
            name: noteName,
            url: `https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${encodedName}.mp3`
        });
    }
}

const pianoSoundTemplates = audioUrls.map(item => {
    const audio = new Audio(item.url);
    audio.addEventListener('error', () => console.error(`Failed to load audio: ${item.name}`));
    return audio;
});

const blastSoundTemplate = new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/blast.mp3');

// --- HELPER FUNCTIONS (UNCHANGED) ---
function updateStats() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
  livesEl.innerText = '❤️'.repeat(lives);
}

function randomColor(){
  const colors = ['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316','#ef4444'];
  return colors[Math.floor(Math.random()*colors.length)];
}

function removeTile(id){
  const index = tiles.findIndex(t=>t.id===id);
  if(index>-1){
    if(container.contains(tiles[index].div)){
        container.removeChild(tiles[index].div);
    }
    tiles.splice(index,1);
  }
}

function handleTileTap(tile){
  if(gameState !== 'playing') return;

  if(tile.type === 'bomb'){
    gameOverScreen();
    return;
  }

  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
  speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
  updateStats();

  if(pianoSoundTemplates.length > 0) {
      const randomIndex = Math.floor(Math.random() * pianoSoundTemplates.length);
      const baseSound = pianoSoundTemplates[randomIndex];
      const soundToPlay = baseSound.cloneNode(); 
      soundToPlay.volume = 1.0;
      soundToPlay.play().catch(e => {});
  }
}

function createTile(col,type){
  const id = tileId++;
  const div = document.createElement('div');
  div.classList.add('tile');
  // 🎯 Note: Width/Height calculation will use the new container size
  div.style.width = container.clientWidth / COLUMNS + 'px';
  div.style.height = TILE_HEIGHT + 'px';
  div.style.left = col * (container.clientWidth / COLUMNS) + 'px';
  div.style.top = -TILE_HEIGHT + 'px';
  div.style.background = `linear-gradient(to bottom, ${randomColor()}, ${randomColor()})`;
  div.innerText = type==='bomb'?'💣':'♪';
  
  const triggerTap = (e) => {
      e.preventDefault(); 
      e.stopPropagation();
      handleTileTap({id,type,div});
  };

  div.addEventListener('mousedown', triggerTap);
  div.addEventListener('touchstart', triggerTap);

  container.appendChild(div);
  tiles.push({id,col,y:-TILE_HEIGHT,type,div});
}

// --- GAME STATE (UNCHANGED) ---
function startGame(){
  if (currentBlastSound) {
      currentBlastSound.pause();
      currentBlastSound.currentTime = 0;
      currentBlastSound = null; 
  }

  container.innerHTML = ''; 
  tiles=[];
  
  gameState='playing';
  score=0; combo=0; lives=3; tileId=0; speed = 3; spawnTimer=0; lastTime=Date.now(); 
  
  statsEl.style.display='flex';
  menu.style.display='none'; 
  gameOver.style.display='none'; 
  
  if(container.querySelectorAll('.column-line').length === 0){
      for(let i=1;i<COLUMNS;i++){
        const line = document.createElement('div');
        line.classList.add('column-line');
        line.style.left = (i*(container.clientWidth/COLUMNS))+'px';
        container.appendChild(line);
      }
  }

  updateStats();
  requestAnimationFrame(gameLoop);
}

function gameOverScreen(){
  gameState='gameOver';
  
  const blastInstance = blastSoundTemplate.cloneNode();
  currentBlastSound = blastInstance; 
  blastInstance.play().catch(e => {});

  statsEl.style.display='none';
  container.innerHTML = ''; 
  tiles=[];
  
  if(score > bestScore) {
      bestScore = score;
      localStorage.setItem('basedTilesBestScore', bestScore);
  }

  gameOver.style.display='flex'; 
  menu.style.display='none'; 
  
  finalScoreEl.innerText=score;
  finalComboEl.innerText=combo;
  bestScoreOverEl.innerText='Best Score: '+bestScore; 
}

function gameLoop(){
  if(gameState!=='playing') return;
  const now = Date.now();
  const dt = (now-lastTime)/1000;
  lastTime=now;

  spawnTimer += dt*1000;
  while(spawnTimer>=SPAWN_RATE){ 
    spawnTimer-=SPAWN_RATE; 
    const col = Math.floor(Math.random()*COLUMNS);
    const type = Math.random()>0.8?'bomb':'normal'; 
    createTile(col,type);
  }

  tiles.forEach(t=>{
    t.y += speed*100*dt;
    t.div.style.top = t.y+'px';
  });

  const missed = tiles.filter(t=>t.y > container.clientHeight && t.type==='normal');
  missed.forEach(t=>{
    lives--;
    combo=0;
    removeTile(t.id);
    if(lives<=0) gameOverScreen();
  });

  updateStats();
  requestAnimationFrame(gameLoop);
}


// --- 🟣 FARCASTER SDK SHARE (Simple Text) ---
if (shareBtn) {
    shareBtn.addEventListener('click', () => { 
        if (gameState !== 'gameOver') {
            alert("Please finish the game first to share your score!");
            return;
        }

        const gameLink = 'https://muhammadammar5001.github.io/BasedTiles/'; 
        
        // Sirf Text Content (Koi Embeds nahi)
        const text = `I just scored ${score} on BASED TILES! 🎵\n\n⭐ Best Score: ${bestScore}\n🔥 Combo: ${combo}\n\nCan you beat me? Play here: ${gameLink}`;
        
        // Compose URL Create Karo (Only text)
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
        
        // 🎯 Critical: SDK method for reliable opening in Farcaster client
        sdk.actions.openUrl(warpcastUrl);
    });
}


// --- Initial Setup and Event Listeners (UNCHANGED) ---
startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
  if(gameState!=='playing') return;
  const map={'1':0,'2':1,'3':2,'4':3,'q':0,'w':1,'e':2,'r':3};
  const col = map[e.key.toLowerCase()];
  if(col!==undefined){
      const colTiles = tiles.filter(t => t.col === col).sort((a,b) => b.y - a.y);
      if(colTiles.length > 0) handleTileTap(colTiles[0]);
  }
});

window.addEventListener('touchstart', () => {
    if(pianoSoundTemplates.length > 0) {
        const dummy = pianoSoundTemplates[0].cloneNode();
        dummy.play().then(() => dummy.pause()).catch(()=>{});
    }
}, { once:true });

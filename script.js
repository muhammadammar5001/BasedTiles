// --- FARCASTER SDK SETUP ---
import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';

// App Ready Signal
try { sdk.actions.ready(); } catch(e) {}

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

// 🎯 NEW: Session ka maximum combo track karne ke liye variable
let maxComboSession = 0;

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
const bestScoreOverEl = document.getElementById('best-score-over');
const statsEl = document.getElementById('stats');
const bestComboOverEl = document.getElementById('best-combo-over');

// Load Best Score
let bestScore = localStorage.getItem('basedTilesBestScore') || 0;
bestScore = parseInt(bestScore, 10); 

// Load Best Combo
let bestCombo = localStorage.getItem('basedTilesBestCombo') || 0;
bestCombo = parseInt(bestCombo, 10);

// --- AUDIO SETUP ---
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

// --- HELPER FUNCTIONS ---
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
  
  // 🎯 FIX: Har tap pe check karo ki kya ye is session ka highest combo hai
  if(combo > maxComboSession) {
      maxComboSession = combo;
  }

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

// --- GAME STATE ---
function startGame(){
  if (currentBlastSound) {
      currentBlastSound.pause();
      currentBlastSound.currentTime = 0;
      currentBlastSound = null; 
  }

  container.innerHTML = ''; 
  tiles=[];
  
  gameState='playing';
  score=0; 
  combo=0; 
  maxComboSession=0; // 🎯 Reset session max combo
  lives=3; 
  tileId=0; 
  speed = 3; 
  spawnTimer=0; 
  lastTime=Date.now(); 
  
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
  
  // Save Best Score
  if(score > bestScore) {
      bestScore = score;
      localStorage.setItem('basedTilesBestScore', bestScore);
  }

  // 🎯 FIX: Compare with 'maxComboSession' instead of current 'combo' (which might be 0)
  if(maxComboSession > bestCombo) {
      bestCombo = maxComboSession;
      localStorage.setItem('basedTilesBestCombo', bestCombo);
  }

  gameOver.style.display='flex'; 
  menu.style.display='none'; 
  
  // Update UI Texts
  finalScoreEl.innerText = score;
  bestScoreOverEl.innerText = bestScore; 
  bestComboOverEl.innerText = bestCombo;
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
    combo=0; // Ye reset kar deta tha, isliye humne maxComboSession banaya
    removeTile(t.id);
    if(lives<=0) gameOverScreen();
  });

  updateStats();
  requestAnimationFrame(gameLoop);
}

// --- SHARE ON BASE APP ONLY (Client Check) ---
if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        if (gameState !== 'gameOver') {
            alert("Please finish the game first to share your score!");
            return;
        }

        // 1. Client Ka Naam Check Karein
        const clientName = sdk.context?.client?.name; // Safely check client name

        if (clientName === 'base' || clientName === 'farcaster') {
            // Agar client 'base' ya 'farcaster' hai, tab hi aage badhein
            
            const gameLink = 'https://based-tiles.vercel.app'; 
            const shareText = `I scored ${score} in Based Tiles! My Max Combo: ${maxComboSession}. Can you beat me?`;
            
            const encodedText = encodeURIComponent(shareText);
            const encodedEmbed = encodeURIComponent(gameLink);

            // Farcaster Deep Link (Base App isay samjhega)
            const farcasterDeepLink = `farcaster://casts/create?text=${encodedText}&embeds[]=${encodedEmbed}`;

            // window.location.href se Base App mein Deep Link trigger karein
            try {
                window.location.href = farcasterDeepLink;
            } catch (e) {
                console.error("Failed to open deep link", e);
            }
        } else {
            // Agar koi aur client hai ya client ka naam nahi mila:
            alert("This sharing feature is currently only supported in the Base App or Warpcast.");
        }
    });
}
// Note: clientName 'farcaster' (Warpcast) aur 'base' (Base App) dono ho sakta hai.
// Isliye dono ko allow karna behtar hai. Agar aap sirf 'base' chahte hain toh 'farcaster' hata dein.


// --- Initial Setup ---
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

// Sound unlock for mobile browsers
window.addEventListener('touchstart', () => {
    if(pianoSoundTemplates.length > 0) {
        const dummy = pianoSoundTemplates[0].cloneNode();
        dummy.play().then(() => dummy.pause()).catch(()=>{});
    }
}, { once:true });

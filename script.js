// Game constants
const COLUMNS = 4;
const TILE_HEIGHT = 100;
const SPAWN_RATE = 400;
const MAX_SPEED = 8;
const SPEED_INCREMENT = 0.03;

// Game variables
let gameState = 'menu';
let score = 0, combo = 0, lives = 3, tileId = 0, speed = 2.5, spawnTimer = 0, lastTime = Date.now();
let tiles = [];

// --- AUDIO GLOBAL VARIABLES ---
let activePianoSound = null; // Jo abhi baj raha hai usko track karne ke liye
let activeBlastSound = null; // Blast sound track karne ke liye

// DOM elements
const container = document.getElementById('game-container');
const menu = document.getElementById('menu');
const gameOver = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const playAgain = document.getElementById('play-again');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('final-score');
const finalComboEl = document.getElementById('final-combo');
const bestScoreOverEl = document.getElementById('best-score-over');
const statsEl = document.getElementById('stats');

let bestScore = 0;

// --- 1. AUDIO LOADING SETUP ---
const audioUrls = [];
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

// URL Generation (F2 to C7)
for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        let noteName = note + octave;
        if (octave === 2 && notes.indexOf(note) < notes.indexOf('f')) continue; 
        if (octave === 7 && note !== 'c') break;
        audioUrls.push(`https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${noteName}.mp3`);
    }
}

// Pre-load Audio Objects
// Note: Hum 'clone' nahi karenge, hum directly inhi objects ko use karenge taaki control rahe
const pianoSounds = audioUrls.map(url => {
    const audio = new Audio(url);
    audio.preload = 'auto'; // Browser ko force karo ki download kare
    return audio;
});

const blastSound = new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/blast.mp3');

// Update stats
function updateStats() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
  livesEl.innerText = '❤️'.repeat(lives);
}

// Remove tile from DOM and array
function removeTile(id){
  const index = tiles.findIndex(t=>t.id===id);
  if(index>-1){
    if(container.contains(tiles[index].div)){
        container.removeChild(tiles[index].div);
    }
    tiles.splice(index,1);
  }
}

// --- 2. HANDLE TAP (CORE LOGIC) ---
function handleTileTap(tile){
  if(gameState !== 'playing') return;

  // BOMB LOGIC
  if(tile.type === 'bomb'){
    gameOverScreen();
    return;
  }

  // GAME LOGIC (Visuals pehle update karo taaki lag feel na ho)
  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
  speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
  updateStats();

  // SOUND LOGIC (The Fix)
  // Step 1: Agar koi purana piano sound baj raha hai, use turant roko (Interruption)
  if (activePianoSound) {
      activePianoSound.pause();
      activePianoSound.currentTime = 0;
  }

  // Step 2: Random naya sound chuno
  if(pianoSounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * pianoSounds.length);
      const nextSound = pianoSounds[randomIndex];
      
      // Step 3: Naye sound ko play karo aur active set karo
      activePianoSound = nextSound;
      
      // Promise handling taaki agar sound load na hua ho to error na aye
      const playPromise = nextSound.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              console.log("Sound play failed (Network/Interaction):", error);
              // Agar fail hua, to active null kar do taaki agla tap atak na jaye
              activePianoSound = null;
          });
      }
  }
}

// Create a tile
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
  
  // Events for Desktop & Mobile
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

// Random gradient color
function randomColor(){
  const colors = ['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316','#ef4444'];
  return colors[Math.floor(Math.random()*colors.length)];
}

// --- 3. START GAME (BLAST FIX) ---
function startGame(){
  // Fix: Agar purana blast sound chal raha hai to use roko
  if (activeBlastSound) {
      activeBlastSound.pause();
      activeBlastSound.currentTime = 0;
      activeBlastSound = null;
  }

  // Reset visuals
  tiles.forEach(t => {
      if(container.contains(t.div)) container.removeChild(t.div);
  });
  tiles=[];
  
  gameState='playing';
  score=0; combo=0; lives=3; tileId=0; speed=2.5; spawnTimer=0; lastTime=Date.now();
  
  statsEl.style.display='flex';
  menu.style.display='none';
  gameOver.style.display='none';
  
  updateStats();
  
  // Re-draw lines if needed
  drawColumnLines();
  
  requestAnimationFrame(gameLoop);
}

// --- 4. GAME OVER (BLAST PLAY) ---
function gameOverScreen(){
  gameState='gameOver';
  
  // Play Blast Sound
  activeBlastSound = blastSound;
  activeBlastSound.currentTime = 0;
  activeBlastSound.play().catch(e => console.log(e));

  statsEl.style.display='none';
  tiles.forEach(t => {
      if(container.contains(t.div)) container.removeChild(t.div);
  });
  tiles=[];
  
  gameOver.style.display='flex';
  finalScoreEl.innerText=score;
  finalComboEl.innerText=combo;
  if(score>bestScore) bestScore=score;
  bestScoreOverEl.innerText='Best Score: '+bestScore;
}

// Game loop
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

  const missed = tiles.filter(t=>t.y > container.clientHeight+20 && t.type==='normal');
  missed.forEach(t=>{
    lives--;
    combo=0;
    removeTile(t.id);
    if(lives<=0) gameOverScreen();
  });

  updateStats();
  requestAnimationFrame(gameLoop);
}

function drawColumnLines(){
  container.innerHTML = ''; // Clear container to avoid duplicates
  for(let i=1;i<COLUMNS;i++){
    const line = document.createElement('div');
    line.classList.add('column-line');
    line.style.left = (i*(container.clientWidth/COLUMNS))+'px';
    container.appendChild(line);
  }
}

// Setup
drawColumnLines();

startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

// Keydown Support
window.addEventListener('keydown', e=>{
  if(gameState!=='playing') return;
  const map={'1':0,'2':1,'3':2,'4':3,'q':0,'w':1,'e':2,'r':3};
  const col = map[e.key.toLowerCase()];
  if(col===undefined) return;
  
  const colTiles = tiles.filter(t => t.col === col).sort((a,b) => b.y - a.y);
  if(colTiles.length > 0) {
      handleTileTap(colTiles[0]);
  }
});

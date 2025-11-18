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
let currentBlastSound = null; // Variable to control blast sound

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

// --- AUDIO SETUP (SIMPLE & ROBUST) ---

const audioUrls = [];
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

// URL Generation Logic
for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        let noteName = note + octave;
        // Filter valid range (F2 to C7)
        if (octave === 2 && notes.indexOf(note) < notes.indexOf('f')) continue; 
        if (octave === 7 && note !== 'c') break;
        
        // URL creation
        audioUrls.push(`https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${noteName}.mp3`);
    }
}

// Pre-load Audio Objects (Simple Method)
const pianoSoundTemplates = audioUrls.map(url => new Audio(url));
const blastSoundTemplate = new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/blast.mp3');

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

// Handle tile tap
function handleTileTap(tile){
  // Game playing check
  if(gameState !== 'playing') return;

  // 1. LOGIC PEHLE (Taaki tap kabhi miss na ho)
  if(tile.type === 'bomb'){
    gameOverScreen();
    return;
  }

  // Tile remove aur score update pehle karo
  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
  speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
  updateStats();

  // 2. AUDIO BAAD MEIN (Try-Catch taaki error se game na ruke)
  try {
      if(pianoSoundTemplates.length > 0) {
          const randomIndex = Math.floor(Math.random() * pianoSoundTemplates.length);
          const baseSound = pianoSoundTemplates[randomIndex];
          
          // Cloning se interruption hoti hai (Purana sound wait nahi karega)
          const soundToPlay = baseSound.cloneNode(); 
          soundToPlay.volume = 1.0;
          soundToPlay.play().catch(e => console.log("Audio play prevented by browser"));
      }
  } catch(e) {
      console.error("Sound error:", e);
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
  
  // Click event (Mouse/Touch)
  div.addEventListener('mousedown', (e) => {
      e.stopPropagation(); // Event bubble na ho
      handleTileTap({id,type,div});
  });
  
  // Touch event support for mobile responsiveness
  div.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Double tap zoom rokne ke liye
      e.stopPropagation();
      handleTileTap({id,type,div});
  });

  container.appendChild(div);
  tiles.push({id,col,y:-TILE_HEIGHT,type,div});
}

// Random gradient color
function randomColor(){
  const colors = ['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316','#ef4444'];
  return colors[Math.floor(Math.random()*colors.length)];
}

// Start game
function startGame(){
  // STOP OLD SOUNDS (Fix for annoying game over sound)
  if (currentBlastSound) {
      currentBlastSound.pause();
      currentBlastSound.currentTime = 0;
      currentBlastSound = null; 
  }

  // Remove leftover tiles
  tiles.forEach(t => {
      if(container.contains(t.div)) container.removeChild(t.div);
  });
  tiles=[];
  
  gameState='playing';
  score=0; combo=0; lives=3; tileId=0; speed=2.5; spawnTimer=0; lastTime=Date.now();
  
  statsEl.style.display='flex';
  menu.style.display='none';
  gameOver.style.display='none';
  
  // Force redraw columns if they are missing
  const existingLines = document.querySelectorAll('.column-line');
  if(existingLines.length === 0) drawColumnLines();

  updateStats();
  requestAnimationFrame(gameLoop);
}

// Game over
function gameOverScreen(){
  gameState='gameOver';
  
  // Play Blast Sound
  try {
      const blastInstance = blastSoundTemplate.cloneNode();
      currentBlastSound = blastInstance; // Store globally to stop later
      blastInstance.play().catch(e => console.log(e));
  } catch(e) { console.log(e); }

  statsEl.style.display='none';
  
  // Clear tiles visually
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

  // Move tiles
  tiles.forEach(t=>{
    t.y += speed*100*dt;
    t.div.style.top = t.y+'px';
  });

  // Check missed normal tiles
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

// Column lines overlay
function drawColumnLines(){
  // Pehle purani lines hatao taaki duplicate na ho
  const oldLines = document.querySelectorAll('.column-line');
  oldLines.forEach(line => line.remove());

  for(let i=1;i<COLUMNS;i++){
    const line = document.createElement('div');
    line.classList.add('column-line');
    line.style.left = (i*(container.clientWidth/COLUMNS))+'px';
    container.appendChild(line);
  }
}

// Initial Setup
drawColumnLines();

// Event listeners
startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
  if(gameState!=='playing') return;
  const map={'1':0,'2':1,'3':2,'4':3,'q':0,'w':1,'e':2,'r':3};
  const col = map[e.key.toLowerCase()];
  if(col===undefined) return;
  
  // Find lowest tile in that column
  const colTiles = tiles.filter(t => t.col === col).sort((a,b) => b.y - a.y);
  if(colTiles.length > 0) {
      handleTileTap(colTiles[0]); // Tap the lowest tile
  }
});

// Unlock audio on first touch (Mobile fix)
window.addEventListener('touchstart', () => {
    if(pianoSoundTemplates.length > 0) {
        pianoSoundTemplates[0].play().then(() => {
            pianoSoundTemplates[0].pause();
            pianoSoundTemplates[0].currentTime = 0;
        }).catch(()=>{});
    }
}, { once:true });

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

// --- AUDIO SYSTEM: WEB AUDIOCONTEXT ---
let audioContext = null;
let pianoBuffers = []; // To hold all piano note audio data
let blastBuffer = null;
let currentBlastSource = null; // To control the playing blast sound

// 1. Audio URLs generation (Same as before)
const audioFileUrls = [];
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        let noteName = note + octave;
        if (octave === 2 && notes.indexOf(note) < notes.indexOf('f')) continue; 
        if (octave === 7 && note !== 'c') break;
        audioFileUrls.push(`https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${noteName}.mp3`);
    }
}
const blastFileUrl = 'https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/blast.mp3';


// Function to fetch audio and decode it into a Buffer
async function loadSound(url) {
    if (!audioContext) return null;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

// Function to load all sounds on startup
async function loadAllSounds() {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load piano notes
        const pianoPromises = audioFileUrls.map(loadSound);
        pianoBuffers = await Promise.all(pianoPromises);
        
        // Load blast sound
        blastBuffer = await loadSound(blastFileUrl);

        console.log("All 60 piano sounds and blast sound loaded successfully!");
        // Unlock start button if needed
        startBtn.disabled = false;
        startBtn.innerText = "Start Game";

    } catch (e) {
        console.error("Error loading audio files:", e);
        // Fallback for security/browser restrictions
        startBtn.innerText = "Start (Audio Loading Failed)";
    }
}

// Function to play a sound instantly using AudioContext (ZERO DELAY)
function playBuffer(buffer) {
    if (!buffer || !audioContext) return null;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    return source;
}

// Update stats (Same)
function updateStats() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
  livesEl.innerText = '❤️'.repeat(lives);
}

// Remove tile from DOM and array (Same)
function removeTile(id){
  const index = tiles.findIndex(t=>t.id===id);
  if(index>-1){
    container.removeChild(tiles[index].div);
    tiles.splice(index,1);
  }
}

// Handle tile tap (Now using playBuffer)
function handleTileTap(tile){
  if(gameState!=='playing' || pianoBuffers.length === 0) return;

  if(tile.type==='bomb'){
    gameOverScreen();
    return;
  }

  // **ZERO DELAY FIX:** Directly play the audio buffer
  const randomIndex = Math.floor(Math.random() * pianoBuffers.length);
  playBuffer(pianoBuffers[randomIndex]);
  
  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
  speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
  updateStats();
}

// Create a tile (Same)
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
  div.addEventListener('click',()=>handleTileTap({id,type,div}));
  container.appendChild(div);
  tiles.push({id,col,y:-TILE_HEIGHT,type,div});
}

// Random gradient color (Same)
function randomColor(){
  const colors = ['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316','#ef4444'];
  return colors[Math.floor(Math.random()*colors.length)];
}

// Start game (Added Blast Sound Stop)
function startGame(){
    // **GAME OVER SOUND FIX:** Stop the blast sound instantly
    if (currentBlastSource) {
        try { currentBlastSource.stop(); } catch (e) {}
        currentBlastSource = null;
    }

  // Remove leftover tiles
  tiles.forEach(t=>container.removeChild(t.div));
  tiles=[];
  gameState='playing';
  score=0; combo=0; lives=3; tileId=0; speed=2.5; spawnTimer=0; lastTime=Date.now();
  statsEl.style.display='flex';
  menu.style.display='none';
  gameOver.style.display='none';
  updateStats();
  requestAnimationFrame(gameLoop);
}

// Game over screen (Uses Web Audio API)
function gameOverScreen(){
    // **BLAST SOUND FIX:** Play blast sound and store the source to stop it later
    currentBlastSource = playBuffer(blastBuffer);
    
    gameState='gameOver';
    statsEl.style.display='none';
    tiles.forEach(t=>container.removeChild(t.div));
    tiles=[];
    gameOver.style.display='flex';
    finalScoreEl.innerText=score;
    finalComboEl.innerText=combo;
    if(score>bestScore) bestScore=score;
    bestScoreOverEl.innerText='Best Score: '+bestScore;
}

// Game loop (Same)
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
  const missed = tiles.filter(t=>t.y>container.clientHeight+20 && t.type==='normal');
  missed.forEach(t=>{
    lives--;
    combo=0;
    removeTile(t.id);
    if(lives<=0) gameOverScreen(); 
  });

  updateStats();
  requestAnimationFrame(gameLoop);
}

// Column lines overlay (Same)
function drawColumnLines(){
  for(let i=1;i<COLUMNS;i++){
    const line = document.createElement('div');
    line.classList.add('column-line');
    line.style.left = (i*(container.clientWidth/COLUMNS))+'px';
    container.appendChild(line);
  }
}
drawColumnLines();

// Event listeners
startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
  if(gameState!=='playing') return;
  const map={'1':0,'2':1,'3':2,'4':3,'q':0,'w':1,'e':2,'r':3};
  const col = map[e.key.toLowerCase()];
  if(col===undefined) return;
  const tile = tiles.find(t=>t.col===col);
  if(tile) handleTileTap(tile);
});

// **Zaroori Fix:** Load sounds when user interacts (Browser security)
startBtn.addEventListener('click', () => {
    if (!audioContext) {
        loadAllSounds();
    }
});

// Load sounds on first user interaction for better compatibility
window.addEventListener('touchstart', loadAllSounds, { once: true });
window.addEventListener('keydown', loadAllSounds, { once: true });

// Start audio loading on page load attempt (but it needs user interaction to fully unlock)
loadAllSounds();

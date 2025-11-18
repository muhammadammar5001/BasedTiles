// Game constants (Same)
const COLUMNS = 4;
const TILE_HEIGHT = 100;
const SPAWN_RATE = 400;
const MAX_SPEED = 8;
const SPEED_INCREMENT = 0.03;

// Game variables (Same)
let gameState = 'menu';
let score = 0, combo = 0, lives = 3, tileId = 0, speed = 2.5, spawnTimer = 0, lastTime = Date.now();
let currentBlastSound = null; // To store the currently playing blast sound
let tiles = [];

// DOM elements (Same)
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
// **NEW GLOBAL VARIABLE**
let currentBlastSound = null; // To store the currently playing blast sound for stopping it later

// --- AUDIO SETUP FOR 60 CHROMATIC NOTES (F2 to C7) ---

const audioUrls = [];
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

// Loop to generate URLs (Same)
for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        let noteName = note + octave;
        if (octave === 2 && notes.indexOf(note) < notes.indexOf('f')) continue; 
        if (octave === 7 && note !== 'c') break;
        audioUrls.push(`https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${noteName}.mp3`);
    }
}

// **BADLAV 1:** Templates use kar rahe hain
const pianoSoundTemplates = audioUrls.map(url => new Audio(url));
const blastSoundTemplate = new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/blast.mp3');


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

// **BADLAV 2:** Handle tile tap function (Cloning logic for sound fix)
function handleTileTap(tile){
  if(gameState!=='playing') return;

  if(tile.type==='bomb'){
    gameOverScreen();
    return;
  }

  // Random sound select
  const randomIndex = Math.floor(Math.random() * pianoSoundTemplates.length);
  const baseSound = pianoSoundTemplates[randomIndex];
  
  // **CLONING LOGIC:** Har tap ke liye naya audio object banayega
  const soundToPlay = baseSound.cloneNode(); 
  
  // Sound interruption: Play sound from the start
  soundToPlay.currentTime = 0; 
  soundToPlay.play();
  
  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
  speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
  updateStats();
}

// Create a tile (Same)
function createTile(col,type){
// ... (Same)
}

// Random gradient color (Same)
function randomColor(){
// ... (Same)
}

// **BADLAV 3:** Start game (Blast sound ko rokna)
function startGame(){
    // **FIX 2:** Agar koi blast sound chal raha ho to use turant rok do (Play Again fix)
    if (currentBlastSound) {
        currentBlastSound.pause();
        currentBlastSound.currentTime = 0;
        currentBlastSound = null; 
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

// **BADLAV 4:** Game over screen (Blast sound ko record karna)
function gameOverScreen(){
    // Blast sound ka naya instance banao aur global variable mein store karo
    const blastSoundInstance = blastSoundTemplate.cloneNode();
    currentBlastSound = blastSoundInstance; // Store the instance
    
    blastSoundInstance.currentTime = 0;
    blastSoundInstance.play(); 
    
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
// ... (Same)
}

// Column lines overlay (Same)
function drawColumnLines(){
// ... (Same)
}
drawColumnLines();

// Event listeners (Same)
startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
// ... (Same)
});

// Unlock audio for mobile (Same)
window.addEventListener('touchstart', ()=>{}, { once:true });

// Game constants (Same)
const COLUMNS = 4;
const TILE_HEIGHT = 100;
const SPAWN_RATE = 400;
const MAX_SPEED = 8;
const SPEED_INCREMENT = 0.03;

// Game variables (Same)
let gameState = 'menu';
let score = 0, combo = 0, lives = 3, tileId = 0, speed = 2.5, spawnTimer = 0, lastTime = Date.now();
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

// --- AUDIO SETUP FOR 60 CHROMATIC NOTES (F2 to C7) ---

// Sharps (#) ko JS mein '#' se denote karte hain
const audioUrls = [];
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

// Loop to generate URLs (Same as before)
for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        let noteName = note + octave;
        if (octave === 2 && notes.indexOf(note) < notes.indexOf('f')) continue; 
        if (octave === 7 && note !== 'c') break;
        audioUrls.push(`https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${noteName}.mp3`);
    }
}

// **BADLAV 1:** Pre-load all sound objects
// Hum yeh object clone karke use karenge taaki interruption sahi ho.
const basePianoSounds = audioUrls.map(url => new Audio(url));
const baseBlastSound = new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/blast.mp3');


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

// **BADLAV 2:** Handle tile tap function for proper interruption
function handleTileTap(tile){
  if(gameState!=='playing') return;

  if(tile.type==='bomb'){
    // Blast sound yahan se remove kar diya gaya hai, yeh ab sirf gameOverScreen mein bajega
    gameOverScreen();
    return;
  }

  // Random sound select
  const randomIndex = Math.floor(Math.random() * basePianoSounds.length);
  const baseSound = basePianoSounds[randomIndex];
  
  // **CLONING LOGIC:** Har tap ke liye naya audio object banayega
  const soundToPlay = baseSound.cloneNode(); 
  
  // Sound interruption: currentTime = 0 (zaroori, kyunki cloneNode() current time ko bhi copy karta hai)
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
  const id = tileId++;
// ... (rest of the createTile function remains the same)
}

// Random gradient color (Same)
function randomColor(){
// ... (rest of the randomColor function remains the same)
}

// Start game (Same)
function startGame(){
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

// **BADLAV 3:** Game over sound ko start hone se rokna
function gameOverScreen(){
    // **Fix:** Blast sound ko har naye game mein bajne se rokne ke liye
    // Hum use play karne se pehle reset karenge.
    baseBlastSound.currentTime = 0;
    baseBlastSound.play(); 
    // Sound ko thoda bajne ka time dete hain (e.g., 1 second)
    
    gameState='gameOver';
// ... (rest of the gameOverScreen function remains the same)

    statsEl.style.display='none';
    tiles.forEach(t=>container.removeChild(t.div));
    tiles=[];
    gameOver.style.display='flex';
    finalScoreEl.innerText=score;
    finalComboEl.innerText=combo;
    if(score>bestScore) bestScore=score;
    bestScoreOverEl.innerText='Best Score: '+bestScore;

    // **IMPORTANT FIX:** Agar sound लंबा है, तो उसे 1 सेकंड बाद pause कर दो
    setTimeout(() => {
        baseBlastSound.pause();
        baseBlastSound.currentTime = 0;
    }, 1000); 
}

// Game loop (Same)
function gameLoop(){
// ... (rest of the gameLoop function remains the same)
}

// Column lines overlay (Same)
function drawColumnLines(){
// ... (rest of the drawColumnLines function remains the same)
}
drawColumnLines();

// Event listeners (Same)
startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
// ... (rest of the keydown function remains the same)
});

// Unlock audio for mobile (Same)
window.addEventListener('touchstart', ()=>{}, { once:true });

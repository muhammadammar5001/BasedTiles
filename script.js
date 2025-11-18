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

// --- AUDIO SETUP FOR 60 CHROMATIC NOTES (F2 to C7) ---

// Sharps (#) ko JS mein '#' se denote karte hain, jisko URL mein '%23' banana padta hai.
// Lekin GitHub Raw URLs automatically '#' ko handle kar lete hain, isliye hum seedha '#' use karenge.

const audioUrls = [];
// Saare notes (including sharps)
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

// Loop to generate URLs from Octave 2 to Octave 7
for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        
        let noteName = note + octave;

        // Octave 2 mein sirf F2 se B2 tak ke notes chahiye
        if (octave === 2) {
            if (notes.indexOf(note) < notes.indexOf('f')) continue; 
        }

        // Octave 7 mein sirf C7 tak chahiye
        if (octave === 7) {
            if (note !== 'c') break;
        }
        
        // Final URL ko array mein add karein
        // Hum maan rahe hain ki file ka naam 'c#3.mp3' format mein hai.
        audioUrls.push(`https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${noteName}.mp3`);
    }
}

// Saare 60 notes ko Audio objects mein load karna
const pianoSounds = audioUrls.map(url => new Audio(url));
// Blast sound load karna
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
    container.removeChild(tiles[index].div);
    tiles.splice(index,1);
  }
}

// Handle tile tap
function handleTileTap(tile){
  if(gameState!=='playing') return;

  if(tile.type==='bomb'){
    blastSound.play(); 
    gameOverScreen();
    return;
  }

  // Random sound select (ab yeh 60 files mein se chunege)
  const randomIndex = Math.floor(Math.random() * pianoSounds.length);
  const soundToPlay = pianoSounds[randomIndex];
  
  // Sound interruption: Play sound from the start
  soundToPlay.currentTime = 0; 
  soundToPlay.play();
  
  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
  speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
  updateStats();
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
  div.addEventListener('click',()=>handleTileTap({id,type,div}));
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

// Game over
function gameOverScreen(){
    // Blast sound plays when game ends (lives = 0 or bomb tapped)
    blastSound.play(); 
    
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

// Column lines overlay
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

// Unlock audio for mobile
window.addEventListener('touchstart', ()=>{}, { once:true });

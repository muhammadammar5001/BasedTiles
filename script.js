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

// Audio
const tileSounds = [
  new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/refs/heads/main/sounds/kick.wav'),
  new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/refs/heads/main/sounds/snare.wav'),
  new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/refs/heads/main/sounds/hihat.wav')
];
const bombSound = new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/refs/heads/main/sounds/blast.mp3');

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
    bombSound.play();
    gameOverScreen();
    return;
  }

  tileSounds[Math.floor(Math.random()*tileSounds.length)].play();
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
  div.style.background = ['cyan','blue','purple','pink','red','orange'][Math.floor(Math.random()*6)];
  div.innerText = type==='bomb'?'💣':'♪';
  div.addEventListener('click',()=>handleTileTap({id,type,div}));
  container.appendChild(div);
  tiles.push({id,col,y:-TILE_HEIGHT,type,div});
}

// Start game

function unlockAudio() {
  tileSounds.forEach(sound => sound.play().then(()=>sound.pause()));
  bombSound.play().then(()=>bombSound.pause());
}

startBtn.addEventListener('click', () => {
  unlockAudio();  // unlock audio on first interaction
  startGame();
});

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

  tiles.forEach(t=>{
    t.y += speed*100*dt;
    t.div.style.top = t.y+'px';
  });

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

// Optional: touchstart to unlock mobile audio
window.addEventListener('touchstart', ()=>{}, { once:true });

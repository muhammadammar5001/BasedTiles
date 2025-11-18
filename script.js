const COLUMNS = 4;
const TILE_HEIGHT = 100;
const SPAWN_RATE = 400;
const MAX_SPEED = 8;
const SPEED_INCREMENT = 0.03;

let gameState = 'menu';
let score = 0;
let bestScore = 0;
let combo = 0;
let lives = 3;
let tiles = [];
let tileId = 0;
let speed = 2.5;
let spawnTimer = 0;
let lastTime = Date.now();
let synth;

const container = document.getElementById('game-container');
const menu = document.getElementById('menu');
const gameOver = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const playAgain = document.getElementById('play-again');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const livesEl = document.getElementById('lives');
const statsEl = document.getElementById('stats');
const finalScoreEl = document.getElementById('final-score');
const finalComboEl = document.getElementById('final-combo');
const bestScoreEl = document.getElementById('best-score');
const bestScoreOverEl = document.getElementById('best-score-over');

async function initAudio() {
  await Tone.start();
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack:0.005, decay:0.15, sustain:0.1, release:0.1 }
  }).toDestination();
}
initAudio();

function playRandomNote() {
  if(!synth) return;
  const notes = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5'];
  const note = notes[Math.floor(Math.random()*notes.length)];
  synth.triggerAttackRelease(note, '0.1');
}

function createTile(col, type) {
  const id = tileId++;
  const colors = ['cyan','blue','purple','pink','red','orange'];
  const color = colors[Math.floor(Math.random()*colors.length)];
  const div = document.createElement('div');
  div.classList.add('tile');
  div.style.background = color;
  div.style.left = (col * container.clientWidth / COLUMNS) + 'px';
  div.style.width = (container.clientWidth / COLUMNS) + 'px';
  div.style.height = TILE_HEIGHT + 'px';
  div.style.top = -TILE_HEIGHT + 'px';
  div.dataset.id = id;
  div.dataset.type = type;
  div.innerText = type==='bomb' ? '💣':'♪';
  div.addEventListener('click', ()=> handleTileTap(id,type));
  container.appendChild(div);
  tiles.push({id,col,y:-TILE_HEIGHT,type,div});
}

function handleTileTap(id,type) {
  if(gameState!=='playing') return;
  const tileIndex = tiles.findIndex(t=>t.id===id);
  if(tileIndex===-1) return;

  if(type==='bomb'){
    gameOverScreen();
    playRandomNote();
    return;
  }

  container.removeChild(tiles[tileIndex].div);
  tiles.splice(tileIndex,1);

  const points = 10;
  const comboBonus = Math.floor(combo/3)*5;
  score += points + comboBonus;
  combo++;
  speed = Math.min(MAX_SPEED,speed+SPEED_INCREMENT);
  updateStats();
  playRandomNote();
}

function updateStats() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
  livesEl.innerText = '❤️'.repeat(lives);
}

function startGame() {
  // Remove leftover tiles
  tiles.forEach(t => {
      if(t.div && t.div.parentNode === container) container.removeChild(t.div);
  });
  tiles = [];

  gameState='playing';
  score=0; combo=0; lives=3;
  tileId=0; speed=2.5; spawnTimer=0; lastTime=Date.now();
  statsEl.style.display='flex';
  menu.style.display='none';
  gameOver.style.display='none';
  updateStats();
  requestAnimationFrame(gameLoop);
}

function gameOverScreen() {
  gameState='gameOver';
  statsEl.style.display='none';

  // Remove leftover tiles
  tiles.forEach(t => {
      if(t.div && t.div.parentNode === container) container.removeChild(t.div);
  });
  tiles = [];

  gameOver.style.display='flex';
  finalScoreEl.innerText=score;
  finalComboEl.innerText=combo;
  if(score>bestScore) bestScore=score;
  bestScoreEl.innerText='Best Score: '+bestScore;
  bestScoreOverEl.innerText='Best Score: '+bestScore;
}

function gameLoop(){
  if(gameState!=='playing') return;
  const now = Date.now();
  const dt = (now-lastTime)/1000;
  lastTime=now;

  spawnTimer += dt*1000;
  while(spawnTimer>=SPAWN_RATE){
    spawnTimer -= SPAWN_RATE;
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
    container.removeChild(t.div);
    tiles=tiles.filter(tile=>tile.id!==t.id);
    if(lives<=0){
      gameOverScreen();
    }
  });

  updateStats();
  requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
  if(gameState!=='playing') return;
  const map={'1':0,'2':1,'3':2,'4':3,'q':0,'w':1,'e':2,'r':3};
  const col = map[e.key.toLowerCase()];
  if(col===undefined) return;
  const tile = tiles.find(t=>t.col===col);
  if(tile) handleTileTap(tile.id,tile.type);
});

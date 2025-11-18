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

// --- SOUND VARIABLES ---
let currentBlastSound = null; // Sirf Blast sound ko control karne k liye

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

// --- 1. AUDIO LOAD SYSTEM (FIXED URL ENCODING) ---
const audioUrls = [];
const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']; 

// URL Generation Logic
for (let octave = 2; octave <= 7; octave++) {
    for (let note of notes) {
        let noteName = note + octave;
        if (octave === 2 && notes.indexOf(note) < notes.indexOf('f')) continue; 
        if (octave === 7 && note !== 'c') break;
        
        // ⚠️ YAHAN FIX KIYA HAI: '#' ko '%23' se badal diya
        // Isse browser ko pata chalega ki ye file ka naam hai, anchor nahi.
        let encodedName = noteName.replace('#', '%23');

        audioUrls.push({
            name: noteName, // Ye display/debug ke liye normal rahega
            url: `https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/${encodedName}.mp3`
        });
    }
}

// Templates Load Karo
const pianoSoundTemplates = audioUrls.map(item => {
    const audio = new Audio(item.url);
    // Error Listener: Ye batayega konsi file missing hai
    audio.addEventListener('error', (e) => {
        console.error(`❌ Sound Load Fail: ${item.name}.mp3 (Check GitHub filename)`);
    });
    return audio;
});

const blastSoundTemplate = new Audio('https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/sounds/blast.mp3');

// Update stats
function updateStats() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
  livesEl.innerText = '❤️'.repeat(lives);
}

// Remove tile
function removeTile(id){
  const index = tiles.findIndex(t=>t.id===id);
  if(index>-1){
    if(container.contains(tiles[index].div)){
        container.removeChild(tiles[index].div);
    }
    tiles.splice(index,1);
  }
}

// --- 2. HANDLE TAP (OVERLAPPING SOUND) ---
function handleTileTap(tile){
  if(gameState !== 'playing') return;

  if(tile.type === 'bomb'){
    gameOverScreen();
    return;
  }

  // Logic pehle
  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
  speed = Math.min(MAX_SPEED, speed + SPEED_INCREMENT);
  updateStats();

  // Sound baad mein (Overlapping Enabled)
  if(pianoSoundTemplates.length > 0) {
      // Random template pick karo
      const randomIndex = Math.floor(Math.random() * pianoSoundTemplates.length);
      const baseSound = pianoSoundTemplates[randomIndex];
      
      // Clone banao taaki pichla sound na kate (Rich Piano Effect)
      const soundToPlay = baseSound.cloneNode(); 
      soundToPlay.volume = 1.0;
      
      // Play karo (Error handle k sath)
      const playPromise = soundToPlay.play();
      if (playPromise !== undefined) {
          playPromise.catch(e => {
              console.warn("Audio play blocked or file missing. Check Console for red errors.");
          });
      }
  }
}

// Create Tile
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
  
  // Touch/Click Events
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

function randomColor(){
  const colors = ['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316','#ef4444'];
  return colors[Math.floor(Math.random()*colors.length)];
}

// --- 3. START GAME (STOP BLAST ONLY) ---
function startGame(){
  // Sirf Blast sound ko roko, piano sounds ko gunjne do
  if (currentBlastSound) {
      currentBlastSound.pause();
      currentBlastSound.currentTime = 0;
      currentBlastSound = null; 
  }

  tiles.forEach(t => {
      if(container.contains(t.div)) container.removeChild(t.div);
  });
  tiles=[];
  
  gameState='playing';
  score=0; combo=0; lives=3; tileId=0; speed=2.5; spawnTimer=0; lastTime=Date.now();
  
  statsEl.style.display='flex';
  menu.style.display='none';
  gameOver.style.display='none';
  
  const existingLines = document.querySelectorAll('.column-line');
  if(existingLines.length === 0) drawColumnLines();

  updateStats();
  requestAnimationFrame(gameLoop);
}

// --- 4. GAME OVER ---
function gameOverScreen(){
  gameState='gameOver';
  
  // Blast sound chalao aur store karo
  const blastInstance = blastSoundTemplate.cloneNode();
  currentBlastSound = blastInstance; 
  blastInstance.play().catch(e => console.log(e));

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
  container.innerHTML = ''; 
  for(let i=1;i<COLUMNS;i++){
    const line = document.createElement('div');
    line.classList.add('column-line');
    line.style.left = (i*(container.clientWidth/COLUMNS))+'px';
    container.appendChild(line);
  }
}

drawColumnLines();

startBtn.addEventListener('click', startGame);
playAgain.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
  if(gameState!=='playing') return;
  const map={'1':0,'2':1,'3':2,'4':3,'q':0,'w':1,'e':2,'r':3};
  const col = map[e.key.toLowerCase()];
  if(col===undefined) return;
  const colTiles = tiles.filter(t => t.col === col).sort((a,b) => b.y - a.y);
  if(colTiles.length > 0) handleTileTap(colTiles[0]);
});

// First touch unlock
window.addEventListener('touchstart', () => {
    if(pianoSoundTemplates.length > 0) {
        const dummy = pianoSoundTemplates[0].cloneNode();
        dummy.play().then(() => { dummy.pause(); }).catch(()=>{});
    }
}, { once:true });

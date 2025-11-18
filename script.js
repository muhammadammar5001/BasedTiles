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
const finalComboEl = document.getElementById('final-combo'); // Fix: Removed double assignment
const bestScoreOverEl = document.getElementById('best-score-over');
const statsEl = document.getElementById('stats');

let bestScore = localStorage.getItem('basedTilesBestScore') || 0;
bestScore = parseInt(bestScore, 10); 

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

// --- HANDLE TAP ---
function handleTileTap(tile){
  if(gameState !== 'playing') return;

  if(tile.type === 'bomb'){
    gameOverScreen();
    return;
  }

  removeTile(tile.id);
  score += 10 + Math.floor(combo/3)*5;
  combo++;
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

// --- START GAME ---
function startGame(){
  if (currentBlastSound) {
      currentBlastSound.pause();
      currentBlastSound.currentTime = 0;
      currentBlastSound = null; 
  }

  container.innerHTML = ''; 
  tiles=[];
  
  gameState='playing';
  score=0; combo=0; lives=3; tileId=0; speed = 3; spawnTimer=0; lastTime=Date.now(); 
  
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

// --- GAME OVER ---
function gameOverScreen(){
  gameState='gameOver';
  
  const blastInstance = blastSoundTemplate.cloneNode();
  currentBlastSound = blastInstance; 
  blastInstance.play().catch(e => {});

  statsEl.style.display='none';
  container.innerHTML = ''; 
  tiles=[];
  
  if(score > bestScore) {
      bestScore = score;
      localStorage.setItem('basedTilesBestScore', bestScore);
  }

  gameOver.style.display='flex';
  finalScoreEl.innerText=score;
  finalComboEl.innerText=combo;
  bestScoreOverEl.innerText='Best Score: '+bestScore; 
}

// --- SHARE ON FARCASTER (using your created image as background) ---
if(shareBtn) {
    shareBtn.addEventListener('click', async () => {
        const gameLink = 'https://yourusername.github.io/BasedTiles/'; // **REPLACE WITH YOUR ACTUAL GAME URL**

        // **YOUR CUSTOM BACKGROUND IMAGE URL**
        // Ensure this image is available publicly (e.g., in your GitHub repo)
        const backgroundImageURL = 'https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/share_bg.png'; 

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 800; 
        canvas.height = 450;

        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Important for images from different domains (like GitHub raw)
        img.src = backgroundImageURL;

        await new Promise(resolve => {
            img.onload = resolve;
            img.onerror = () => {
                console.error("Failed to load background image for share. Using fallback blue background.");
                resolve(); // Proceed even if image fails to load
            };
        });

        // Draw background image or fallback color
        if (img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#0000ff'; // Fallback to solid blue if image fails
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // --- Text Overlays (using Press Start 2P font) ---
        // Load font for canvas (this is a separate step for Canvas, CSS doesn't apply here)
        // This might take a moment, so ideally pre-load if possible
        const fontFace = new FontFace('Press Start 2P', 'url(https://fonts.gstatic.com/s/pressstart2p/v15/PFDZzYBfbfayzGWSDIZog_e_kqchbkkx0Yd6.woff2)');
        await fontFace.load();
        document.fonts.add(fontFace);


        ctx.font = '36px "Press Start 2P"'; // Game Title
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('BASED TILES', canvas.width / 2, 80);

        ctx.font = '24px "Press Start 2P"'; // Game Over
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('GAME OVER', canvas.width / 2, 150);

        ctx.textAlign = 'left';
        const startX = canvas.width / 2 - 180; 
        let startY = 220;
        const lineHeight = 70; 
        
        // SCORE
        ctx.font = '20px "Press Start 2P"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('SCORE', startX, startY);
        ctx.fillText(score, startX + 250, startY);
        // ctx.fillRect(startX, startY + 5, 400, 2); // Uncomment if you want lines below stats
        startY += lineHeight;

        // COMBO
        ctx.font = '20px "Press Start 2P"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('COMBO', startX, startY);
        ctx.fillText(combo, startX + 250, startY);
        // ctx.fillRect(startX, startY + 5, 400, 2); 
        startY += lineHeight;

        // BEST SCORE
        ctx.font = '20px "Press Start 2P"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('BEST SCORE', startX, startY);
        ctx.fillText(bestScore, startX + 250, startY);
        // ctx.fillRect(startX, startY + 5, 400, 2); 
        
        // Canvas to Image URL
        const farcasterImageUrl = canvas.toDataURL('image/png'); 

        const text = `I just scored ${score} on BASED TILES! 🎵\nCan you beat my combo of ${combo}?\n\nPlay here: ${gameLink}`;
        
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(farcasterImageUrl)}`;
        
        window.open(warpcastUrl, '_blank');
    });
}

// Game Loop
function gameLoop(){
  if(gameState!=='playing') return;
  const now = Date.now();
  const dt = (now-lastTime)/1000;
  lastTime=now;

  spawnTimer += dt*1000;
  // ** CRITICAL FIX: SPASPAWN_RATE to SPAWN_RATE **
  while(spawnTimer>=SPAWN_RATE){ 
    spawnTimer-=SPAWN_RATE; 
    const col = Math.floor(Math.random()*COLUMNS);
    const type = Math.random()>0.8?'bomb':'normal'; // 20% chance of bomb
    createTile(col,type);
  }

  tiles.forEach(t=>{
    t.y += speed*100*dt;
    t.div.style.top = t.y+'px';
  });

  const missed = tiles.filter(t=>t.y > container.clientHeight && t.type==='normal');
  missed.forEach(t=>{
    lives--;
    combo=0;
    removeTile(t.id);
    if(lives<=0) gameOverScreen();
  });

  updateStats();
  requestAnimationFrame(gameLoop);
}

// Initial Setup
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

window.addEventListener('touchstart', () => {
    if(pianoSoundTemplates.length > 0) {
        const dummy = pianoSoundTemplates[0].cloneNode();
        dummy.play().then(() => dummy.pause()).catch(()=>{});
    }
}, { once:true });

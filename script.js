// Game constants (UNCHANGED)
const COLUMNS = 4;
const TILE_HEIGHT = 120;
const SPAWN_RATE = 400;
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.04;

// Game variables (UNCHANGED)
let gameState = 'menu';
let score = 0, combo = 0, lives = 3, tileId = 0, speed = 3, spawnTimer = 0, lastTime = Date.now();
let tiles = [];
let currentBlastSound = null; 

// DOM elements (UNCHANGED)
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
const finalComboEl = document.getElementById('final-combo'); 
const bestScoreOverEl = document.getElementById('best-score-over');
const statsEl = document.getElementById('stats');

let bestScore = localStorage.getItem('basedTilesBestScore') || 0;
bestScore = parseInt(bestScore, 10); 

// --- AUDIO SETUP (UNCHANGED) ---
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

// Update stats (UNCHANGED)
function updateStats() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
  livesEl.innerText = '❤️'.repeat(lives);
}

// Remove tile (UNCHANGED)
function removeTile(id){
  const index = tiles.findIndex(t=>t.id===id);
  if(index>-1){
    if(container.contains(tiles[index].div)){
        container.removeChild(tiles[index].div);
    }
    tiles.splice(index,1);
  }
}

// --- HANDLE TAP (UNCHANGED) ---
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

// Create Tile (UNCHANGED)
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

// --- START GAME (UNCHANGED) ---
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

// --- GAME OVER (UNCHANGED) ---
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

// --- SHARE ON FARCASTER (CUSTOM IMAGE - SVG Implementation) ---
if(shareBtn) {
    shareBtn.addEventListener('click', async () => {
        const gameLink = 'https://yourusername.github.io/BasedTiles/'; // **REPLACE WITH YOUR ACTUAL GAME URL**

        // ⚠️ STEP 1: APNE UPLOAD KIYE GAYE SVG FILE KA RAW URL YAHAN PASTE KAREIN
        const svgImageUrl = 'https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/share_scorecard.svg'; // <--- **PASTE YOUR RAW URL HERE**

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 800; 
        canvas.height = 450;

        const img = new Image();
        img.crossOrigin = 'Anonymous'; 
        img.src = svgImageUrl; // SVG ko as an Image load kiya

        let imageLoaded = false;
        await new Promise(resolve => {
            img.onload = () => {
                imageLoaded = true;
                resolve();
            };
            img.onerror = (e) => {
                console.error("Failed to load SVG background image:", e);
                // Fallback: Agar SVG fail ho jaye, toh plain blue background
                ctx.fillStyle = '#0000ff'; 
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                resolve(); 
            };
        });

        // SVG (Background) Draw karein
        if (imageLoaded) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        // --- STEP 2: DYNAMIC TEXT (SCORE, COMBO) DRAW KAREIN ---
        
        // Font Load Karein (Canvas ke liye)
        const fontUrl = 'https://fonts.gstatic.com/s/pressstart2p/v15/PFDZzYBfbfayzGWSDIZog_e_kqchbkkx0Yd6.woff2';
        const fontFace = new FontFace('Press Start 2P', `url(${fontUrl})`);
        try {
            await fontFace.load();
            document.fonts.add(fontFace);
        } catch (e) {
            console.error('Failed to load Press Start 2P font for Canvas:', e);
        }

        ctx.fillStyle = '#FFFFFF'; // White text

        // **COORDINATES FOR DYNAMIC VALUES (Adjust if necessary)**
        // Assuming your static headings are aligned to the left/center, 
        // we'll align the scores to the right for a clean look.
        
        const SCORE_X_POS = 600; // X position for score values (Right side)
        
        // Score value - Yahan Game Over Screen ka Title nahi likh rahe hain, bas Stats.
        ctx.font = '28px "Press Start 2P"'; 
        ctx.textAlign = 'right'; // Right align kiya values ko

        // SCORE VALUE (Yahan Y-coordinate adjust karein)
        ctx.fillText(score, SCORE_X_POS, 220); 

        // COMBO VALUE
        ctx.fillText(combo, SCORE_X_POS, 290); 
        
        // BEST SCORE VALUE
        ctx.fillText(bestScore, SCORE_X_POS, 360); 
        
        // --- STEP 3: SHARE ---
        const farcasterImageUrl = canvas.toDataURL('image/png'); 
        
        const text = `I just scored ${score} on BASED TILES! 🎵\nCan you beat my combo of ${combo}?\n\nPlay here: ${gameLink}`;
        
        const encodedEmbedUrl = encodeURIComponent(farcasterImageUrl);
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodedEmbedUrl}`;
        
        console.log("Warpcast URL generated.");
        window.open(warpcastUrl, '_blank');
    });
}

        // Draw background image if loaded, else use fallback already set
        if (imageLoaded) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        // --- Load Font for Canvas ---
        // We need to ensure the font is loaded BEFORE drawing text
        const fontUrl = 'https://fonts.gstatic.com/s/pressstart2p/v15/PFDZzYBfbfayzGWSDIZog_e_kqchbkkx0Yd6.woff2';
        const fontFace = new FontFace('Press Start 2P', `url(${fontUrl})`);
        try {
            await fontFace.load();
            document.fonts.add(fontFace);
            console.log('Press Start 2P font loaded for Canvas.');
        } catch (e) {
            console.error('Failed to load Press Start 2P font for Canvas:', e);
            // Fallback font if Press Start 2P fails to load
            ctx.font = 'bold 30px Arial'; 
        }

        // --- Text Overlays (using Press Start 2P font) ---
        ctx.fillStyle = '#FFFFFF'; // White color for all text

        // Game Title
        ctx.font = '36px "Press Start 2P"'; 
        ctx.textAlign = 'center';
        ctx.fillText('BASED TILES', canvas.width / 2, 80);

        // Game Over
        ctx.font = '24px "Press Start 2P"';
        ctx.fillText('GAME OVER', canvas.width / 2, 150);

        // Stats
        ctx.textAlign = 'left';
        const startX = canvas.width / 2 - 180; 
        let startY = 220;
        const lineHeight = 70; 
        
        ctx.font = '20px "Press Start 2P"';

        // SCORE
        ctx.fillText('SCORE', startX, startY);
        ctx.fillText(score, startX + 250, startY);
        // ctx.fillRect(startX, startY + 5, 400, 2); // Uncomment if you want lines
        startY += lineHeight;

        // COMBO
        ctx.fillText('COMBO', startX, startY);
        ctx.fillText(combo, startX + 250, startY);
        // ctx.fillRect(startX, startY + 5, 400, 2); 
        startY += lineHeight;

        // BEST SCORE
        ctx.fillText('BEST SCORE', startX, startY);
        ctx.fillText(bestScore, startX + 250, startY);
        // ctx.fillRect(startX, startY + 5, 400, 2); 
        
        // Convert Canvas to Image URL
        const farcasterImageUrl = canvas.toDataURL('image/png'); 
        
        // Construct Warpcast URL
        const text = `I just scored ${score} on BASED TILES! 🎵\nCan you beat my combo of ${combo}?\n\nPlay here: ${gameLink}`;
        
        // Crucial for embeds - the URL must be encoded separately from the text
        const encodedEmbedUrl = encodeURIComponent(farcasterImageUrl);
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodedEmbedUrl}`;
        
        console.log("Warpcast URL:", warpcastUrl); // For debugging
        window.open(warpcastUrl, '_blank');
    });
}

// Game Loop (UNCHANGED, TILE SPAWN FIX ALREADY APPLIED HERE)
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

// Initial Setup (UNCHANGED)
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

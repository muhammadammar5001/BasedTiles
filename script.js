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


// --- Game Core Logic Functions (UNCHANGED) ---

function updateStats() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
  livesEl.innerText = '❤️'.repeat(lives);
}

function randomColor(){
  const colors = ['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316','#ef4444'];
  return colors[Math.floor(Math.random()*colors.length)];
}

function removeTile(id){
  const index = tiles.findIndex(t=>t.id===id);
  if(index>-1){
    if(container.contains(tiles[index].div)){
        container.removeChild(tiles[index].div);
    }
    tiles.splice(index,1);
  }
}

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
  menu.style.display='none'; 
  
  finalScoreEl.innerText=score;
  finalComboEl.innerText=combo;
  bestScoreOverEl.innerText='Best Score: '+bestScore; 
}


// --- GAME LOOP (UNCHANGED) ---
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


// --- SHARE ON FARCASTER (SVG Debugging & Reliable Fallback) ---
if (shareBtn) {
    shareBtn.addEventListener('click', async () => { 
        if (gameState !== 'gameOver') {
            alert("Please finish the game first to share your score!");
            return;
        }

        const gameLink = 'https://yourusername.github.io/BasedTiles/'; 
        const svgImageUrl = 'https://raw.githubusercontent.com/muhammadammar5001/BasedTiles/main/share_scorecard.svg'; 

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Canvas size: 600x338
        canvas.width = 600; 
        canvas.height = 338; 

        const img = new Image();
        img.crossOrigin = 'Anonymous'; 
        img.src = svgImageUrl; 

        let imageLoaded = false;
        
        // Image Load Promise with Timeout
        const imageLoadPromise = new Promise(resolve => {
            const timeoutId = setTimeout(() => resolve(false), 5000); 

            img.onload = () => {
                clearTimeout(timeoutId);
                imageLoaded = true;
                resolve(true); 
            };
            // 🎯 CRITICAL DEBUGGING: Log image loading error
            img.onerror = () => {
                clearTimeout(timeoutId);
                console.error("SVG Image Load FAILED. Using fallback canvas.");
                resolve(false); 
            };
        });

        const success = await imageLoadPromise;

        // --- BACKGROUND DRAWING ---
        if (success && imageLoaded) {
            // Success: Draw SVG
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log("SVG loaded successfully and drawn.");
        } else {
            // Failure: Draw reliable fallback background
            ctx.fillStyle = '#1e3a8a'; // Dark Blue background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw Fallback Title/Heading
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('BASED TILES', canvas.width / 2, 40);
            
            // Draw a red line as a visual cue that fallback was used
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, 50, canvas.width, 5);
        }

        // --- Load Press Start 2P Font for Canvas ---
        const fontUrl = 'https://fonts.gstatic.com/s/pressstart2p/v15/PFDZzYBfbfayzGWSDIZog_e_kqchbkkx0Yd6.woff2';
        const fontFace = new FontFace('Press Start 2P', `url(${fontUrl})`);
        try {
            await fontFace.load();
            document.fonts.add(fontFace);
        } catch (e) {
            console.error('Failed to load Press Start 2P font for Canvas.');
        }

        ctx.fillStyle = '#FFFFFF'; 
        
        // --- Dynamic Stats Drawing ---
        // Coordinates for 600x338 canvas
        const X_HEAD_POS = 150; 
        const X_VALUE_POS = 450; 
        const Y_START = 160; 
        const Y_STEP = 50;
        
        ctx.font = '16px "Press Start 2P", monospace'; 

        // SCORE
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', X_HEAD_POS, Y_START);
        ctx.textAlign = 'right';
        ctx.fillText(score, X_VALUE_POS, Y_START);

        // COMBO
        ctx.textAlign = 'left';
        ctx.fillText('COMBO', X_HEAD_POS, Y_START + Y_STEP);
        ctx.textAlign = 'right';
        ctx.fillText(combo, X_VALUE_POS, Y_START + Y_STEP);
        
        // BEST SCORE
        ctx.textAlign = 'left';
        ctx.fillText('BEST SCORE', X_HEAD_POS, Y_START + 2 * Y_STEP);
        ctx.textAlign = 'right';
        ctx.fillText(bestScore, X_VALUE_POS, Y_START + 2 * Y_STEP);
        
        
                // --- 4. SHARE ---
        // Final Base64 Image URL (Smallest possible size)
        const farcasterImageUrl = canvas.toDataURL('image/png'); 
        
        // 🎯 FIX: Best Score added to the plain text post
        const text = `I just scored ${score} on BASED TILES! 🎵\nMy Best Score is ${bestScore}.\nCan you beat my combo of ${combo}?\n\nPlay here: ${gameLink}`;
        
        const encodedEmbedUrl = encodeURIComponent(farcasterImageUrl);
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodedEmbedUrl}`;
        
        window.open(warpcastUrl, '_blank');
    });
}



// --- Initial Setup and Event Listeners (UNCHANGED) ---
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

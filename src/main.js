import sdk from 'https://esm.sh/@farcaster/frame-sdk';

let score = 0;
const scoreEl = document.getElementById('score');
const clickBtn = document.getElementById('clickBtn');
const shareBtn = document.getElementById('shareBtn');

// SDK Initialize
const init = async () => {
    try {
        await sdk.actions.ready();
        shareBtn.style.display = 'inline-block'; // SDK load hone par hi button dikhao
    } catch (e) {
        console.log("Running outside Farcaster");
        shareBtn.style.display = 'inline-block'; // Browser testing ke liye bhi dikha do
    }
};

// Game Logic
clickBtn.addEventListener('click', () => {
    score++;
    scoreEl.innerText = score;
});

// Share Logic
shareBtn.addEventListener('click', () => {
    // Tumhara deployed domain (Deployment ke baad ye automaticaly pakad lega)
    const baseUrl = window.location.origin; 
    
    // API URL jisme score aur background image ka logic hai
    const embedUrl = `${baseUrl}/api/og?score=${score}`;
    
    const shareText = `Check out my score: ${score}!`;
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(embedUrl)}`;

    sdk.actions.openUrl(warpcastUrl);
});

init();

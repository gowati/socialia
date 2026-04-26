// 1. CONNECTION SETUP
const SB_URL = 'https://jxpldlzqyfisbqwlqyck.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cGxkbHpxeWZpc2Jxd2xxeWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzMwMjUsImV4cCI6MjA5Mjc0OTAyNX0.l26_1B70WsPnrK5F1LQjXDbjor4_BwInAW3yBEJXQJc'; // The eyJ... key from your screenshot

// Use 'db' instead of 'supabase' to avoid naming conflicts
const db = window.supabase.createClient(SB_URL, SB_KEY);

const container = document.getElementById('game-container');
const chatInput = document.getElementById('chat-input');
const messages = document.getElementById('messages');

// Unique ID for this session
const myId = 'player-' + Math.random().toString(36).substr(2, 4);
let myPos = { x: 100, y: 100 };
const players = {};

// 2. MULTIPLAYER CHANNEL
const channel = db.channel('socialia-room', {
    config: { presence: { key: myId } }
});

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    updateAvatars(state);
  })
  .on('broadcast', { event: 'chat' }, (payload) => {
    addMessage(payload.payload.msg);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ x: myPos.x, y: myPos.y });
    }
  });

// 3. MOVEMENT
window.addEventListener('keydown', (e) => {
    const speed = 20;
    if (e.key === 'ArrowUp') myPos.y -= speed;
    if (e.key === 'ArrowDown') myPos.y += speed;
    if (e.key === 'ArrowLeft') myPos.x -= speed;
    if (e.key === 'ArrowRight') myPos.x += speed;
    
    // Update local and broadcast to others
    moveMyCircle();
    channel.track({ x: myPos.x, y: myPos.y });
});

// 4. CHAT
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value !== '') {
        const fullMsg = `${myId}: ${chatInput.value}`;
        channel.send({
            type: 'broadcast',
            event: 'chat',
            payload: { msg: fullMsg }
        });
        addMessage(`Me: ${chatInput.value}`);
        chatInput.value = '';
    }
});

// FUNCTIONS
function updateAvatars(state) {
    // Remove players who left
    Object.keys(players).forEach(id => {
        if (!state[id]) {
            players[id].remove();
            delete players[id];
        }
    });

    // Create/Move players
    for (const id in state) {
        const data = state[id][0];
        if (!players[id]) {
            const div = document.createElement('div');
            div.className = 'player';
            if (id === myId) div.style.backgroundColor = "#ff00ff"; // You are Purple
            container.appendChild(div);
            players[id] = div;
        }
        players[id].style.left = data.x + 'px';
        players[id].style.top = data.y + 'px';
    }
}

function moveMyCircle() {
    if (players[myId]) {
        players[myId].style.left = myPos.x + 'px';
        players[myId].style.top = myPos.y + 'px';
    }
}

function addMessage(text) {
    const div = document.createElement('div');
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

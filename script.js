// CANVAS BACKGROUND DE ESTRELAS
const canvas = document.getElementById('space-bg');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.2; this.speedY = -(Math.random() * 0.15 + 0.05);
        this.alpha = Math.random() * 0.4 + 0.2;
    }
    update() { this.y += this.speedY; if (this.y < 0) { this.reset(); this.y = canvas.height; } }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = '#00f2fe';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
}
for (let i = 0; i < 60; i++) particles.push(new Particle());
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}
animate();

// SINTETIZADOR DE ÁUDIO WEB AUDIO API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === 'click') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'error') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'success') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    }
}

// LOGICA E MOTORES DO MINIGAME
let gameInterval;
let indicatorPos = 0;
let indicatorDirection = 1;
let speedModifier = 2.5; // Velocidade inicial do cursor móvel
const indicatorEl = document.getElementById('wave-indicator');

function goToMinigame(event) {
    event.preventDefault();
    playSound('click');

    document.getElementById('step-credentials').classList.add('hidden');
    document.getElementById('step-minigame').classList.remove('hidden');

    const statusText = document.getElementById('status-text');
    statusText.textContent = "CONEXÃO PARCIAL: SINCRONIZE O SINAL DE REDE.";

    // Inicializa o loop de movimento do cursor branco
    startGameLoop();
}

function startGameLoop() {
    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        indicatorPos += speedModifier * indicatorDirection;
        
        // Bate nas bordas e volta
        if (indicatorPos >= 98 || indicatorPos <= 0) {
            indicatorDirection *= -1;
        }
        indicatorEl.style.left = `${indicatorPos}%`;
    }, 16);
}

function checkSync() {
    // A Zona Alvo verde fica entre 42% e 58% da barra (definida via CSS)
    const isInTargetZone = indicatorPos >= 42 && indicatorPos <= 58;
    const statusBox = document.getElementById('status-box');
    const statusText = document.getElementById('status-text');

    if (isInTargetZone) {
        // GANHOU!
        clearInterval(gameInterval);
        playSound('success');
        statusBox.className = "auth-status-box status-success";
        statusText.textContent = "SINCRO_NIZAÇÃO COMPLETA! IDENTIDADE VALIDADA.";

        setTimeout(() => {
            document.getElementById('login-container').classList.add('panel-disintegrate');
            setTimeout(() => {
                alert("Acesso total concedido. Bem-vindo de volta ao Nexus Space Command!");
            }, 600);
        }, 1000);
    } else {
        // ERROU! O jogo acelera e pune o jogador
        playSound('error');
        statusBox.className = "auth-status-box status-error";
        statusText.textContent = "FALHA NA SINCRO: DESALINHAMENTO DE ONDA DETECTADO!";
        
        // Reseta o estado de erro após um tempo e aumenta a velocidade pra ficar mais difícil
        speedModifier += 1.5; 
        setTimeout(() => {
            if (statusBox.classList.contains('status-error')) {
                statusBox.className = "auth-status-box";
                statusText.textContent = "TENTANDO NOVAMENTE: ANTENA MAIS INSTÁVEL.";
            }
        }, 1200);
    }
}

// Desbloqueia contexto de áudio do navegador
document.body.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });
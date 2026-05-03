const assets = {
    sky: new Image(), ground: new Image(), brick: new Image(), brick_web1: new Image(), brick_web2: new Image(),
    p_idle: new Image(), p_walk: new Image(), p_run1: new Image(), p_run2: new Image(), p_jump: new Image(), p_drink: new Image(),
    coke_idle: new Image(), coke_grab: new Image(),
    b_idle: new Image(), b_left: new Image(), b_right: new Image(), b_bite: new Image(), b_hurt: new Image(), b_dead: new Image(),
    s_idle: new Image(), s_move1: new Image(), s_move2: new Image(), s_move3: new Image(),
    s_prep_web: new Image(), s_web: new Image(), s_prep_bite: new Image(), s_bite: new Image(), s_hurt: new Image(), s_angry: new Image(), s_dead: new Image(),
    gum_item: new Image(), p_gum_chew: new Image(), p_gum_inflate: new Image(), p_gum_float_idle: new Image(), p_gum_float_move: new Image(), p_gum_pop: new Image(),
    
    // --- SPRITES DEL JEFE FINAL AÑADIDOS ---
    bg_boss_dark: new Image(), bg_boss_sunrise: new Image(),
    plat_hero: new Image(), plat_boss: new Image(), plat_evade: new Image(), plat_victory: new Image(),
    p_crouch: new Image(), p_throw_start: new Image(), p_throw_end: new Image(), p_win: new Image(),
    boss_idle: new Image(), boss_float: new Image(), boss_charge: new Image(), boss_throw: new Image(),
    boss_hurt1: new Image(), boss_hurt2: new Image(), boss_angry_start: new Image(), boss_angry_loop: new Image(),
    boss_die1: new Image(), boss_die2: new Image(), boss_dead: new Image(),
    b_heart_broken1: new Image(), b_heart_broken2: new Image(), b_heart_broken3: new Image(),
    p_heart_lvl1: new Image(), p_heart_lvl2: new Image(), p_heart_mythic: new Image(),
    u_captured_idle: new Image(), u_captured_scared: new Image(), key_item: new Image(),
    u_walk1: new Image(), u_walk2: new Image(), u_walk3: new Image(), u_win: new Image()
};

let loadedCount = 0;
const totalAssets = Object.keys(assets).length;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// CONTROL DE ESTADOS Y FASES
let gameActive = false, scrollX = 0, frameCounter = 0;
let currentStage = 1; // 1 = Nido (Bacterias y Arañas), 2 = Jefe (La Distancia)
let animationId = null; 
const keys = {};

const player = { x: 100, y: 250, w: 60, h: 90, dy: 0, gravity: 0.5, grounded: false, groundY: 250, facing: 1, lives: 1, hitTimer: 0, currentImg: null, isDrinking: false, drinkTimer: 0 };
const powerUp = { active: false, timer: 0 };
const gumPower = { active: false, state: 'none', timer: 0, countdown: 0 };

const solidObjects = [
    { x: 450, y: 225, w: 120, h: 35, type: 'brick' }, { x: 850, y: 195, w: 100, h: 35, type: 'brick' },
    { x: 1100, y: 175, w: 100, h: 35, type: 'brick' }, { x: 1300, y: 225, w: 120, h: 35, type: 'brick' },
    { x: 1950, y: 220, w: 80, h: 35, type: 'brick' }, 
    { x: 2150, y: 150, w: 120, h: 35, type: 'brick_web1' }, 
    { x: 2270, y: 150, w: 120, h: 35, type: 'brick_web2' }, 
    { x: 2390, y: 150, w: 120, h: 35, type: 'brick_web1' }, 
    { x: 2700, y: 100, w: 150, h: 35, type: 'brick_web2' },
    { x: 3100, y: 200, w: 200, h: 35, type: 'brick_web1' }
];

const items = [
    { x: 2180, y: 110, type: 'gum', collected: false }, 
    { x: 4500, y: 250, type: 'coke', collected: false } 
];

const maxProgresoDistancia = 6000;

// ── Halagos: secuencia de 5 pantallas ──────────────────────────────────────
const halagosLista = [
    "Este es un regalo para mi...",
    "Hermoso...",
    "Precioso...",
    "Increíble...",
    "¡NOVIO!"
];
let halagoCursor = 0;   // índice dentro de halagosLista
let halagoAfterCallback = null; // función a llamar al terminar la secuencia

// Muestra el halago en la posición 'idx' de la lista
function mostrarHalago(idx) {
    const halagoText = document.getElementById('halago-text');
    const halagoSub  = document.getElementById('halago-sub');
    const screen     = document.getElementById('screen-halagos');

    halagoText.classList.remove('grow-and-glow');
    screen.classList.remove('fade-out-light');

    halagoText.textContent = halagosLista[idx];

    if (idx === halagosLista.length - 1) {
        // Último halago → animación crecer/brillar, ocultar "clic"
        halagoSub.style.display = 'none';
        // pequeño delay para que el texto aparezca antes de la animación
        requestAnimationFrame(() => halagoText.classList.add('grow-and-glow'));
    } else {
        halagoSub.style.display = 'block';
    }
}

// Inicia la secuencia de halagos y al terminar ejecuta 'callback'
function iniciarHalagos(callback) {
    halagoCursor = 0;
    halagoAfterCallback = callback || null;
    document.getElementById('screen-halagos').style.display = 'flex';
    mostrarHalago(0);
}

// Avanza al siguiente halago o cierra la pantalla al terminar
function avanzarHalago() {
    const screen = document.getElementById('screen-halagos');
    const halagoText = document.getElementById('halago-text');
    const halagoSub  = document.getElementById('halago-sub');

    halagoCursor++;

    if (halagoCursor < halagosLista.length) {
        mostrarHalago(halagoCursor);
    } else {
        // Fin → fade out y ejecutar callback
        screen.classList.add('fade-out-light');
        setTimeout(() => {
            screen.style.display = 'none';
            screen.classList.remove('fade-out-light');
            halagoText.classList.remove('grow-and-glow');
            halagoSub.style.display = 'block';
            if (typeof halagoAfterCallback === 'function') halagoAfterCallback();
        }, 1000);
    }
}

// ── Carga de assets ────────────────────────────────────────────────────────
Object.keys(assets).forEach(key => {
    assets[key].onload = () => { 
        if (++loadedCount === totalAssets) { 
            document.getElementById('loading-status').innerText = "▶ LISTO"; 
            document.getElementById('start-btn').style.display = "inline-block"; 
        } 
    };
    assets[key].src = 'assets/' + key + '.png';
});

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// ── Botón START GAME ───────────────────────────────────────────────────────
document.getElementById('start-btn').onclick = () => { 
    document.getElementById('screen-start').style.display = 'none';
    iniciarHalagos(initJuego);
};

// ── Clic en pantalla de halagos → avanzar ─────────────────────────────────
document.getElementById('screen-halagos').onclick = avanzarHalago;

function initJuego() { 
    document.getElementById('screen-halagos').style.display = 'none'; 
    canvas.style.display = 'block'; 
    gameActive = true; 
    gameLoop(); 
}

// LÓGICA DE TRANSICIÓN AL JEFE
window.startBossLevel = function() {
    currentStage = 2; // Cambia el estado interno al Nivel del Jefe
    document.getElementById('screen-level1-complete').style.display = 'none';
    document.getElementById('boss-ui').style.display = 'flex'; // Muestra las barras de vida
    window.resetLevel(false); 
};

// ========================================================
// FUNCIÓN REPLAY MASTER (Capaz de reiniciar el juego entero)
// ========================================================
window.resetLevel = function(fullReset = false) {
    if (animationId) cancelAnimationFrame(animationId);
    
    for (let key in keys) keys[key] = false;

    scrollX = 0; frameCounter = 0; halagoCursor = 0;
    player.lives = 1; player.y = 250; player.hitTimer = 0; player.dy = 0; player.facing = 1; player.grounded = false;
    gumPower.active = false; gumPower.state = 'none'; powerUp.active = false;
    
    // Si dimos click en "Repetir Todo", volvemos a la Fase 1
    if (fullReset) {
        currentStage = 1;
        document.getElementById('boss-ui').style.display = 'none';
    }

    items.forEach(it => it.collected = false);
    
    // Reinicia los módulos según la fase actual
    if (currentStage === 1) {
        if (typeof resetBacteria === 'function') resetBacteria();
        if (typeof resetSpider === 'function') resetSpider();
    } else if (currentStage === 2) {
        if (typeof resetBoss === 'function') resetBoss(); 
    }
    
    // Ocultar todas las pantallas
    const screens = ['screen-gameover', 'screen-level1-complete', 'love-letter'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    gameActive = true;
    gameLoop();
};

function gameLoop() {
    if (!gameActive) return;
    frameCounter++;

    if (currentStage === 1) {
        updateEngine();
        if (typeof updateBacteria === 'function') updateBacteria();
        if (typeof updateSpider === 'function') updateSpider();
    } else if (currentStage === 2) {
        // AQUÍ CORRERÁ LA LÓGICA DEL JEFE (La haremos en level_boss.js)
        if (typeof updateBossEngine === 'function') updateBossEngine();
        if (typeof updateBossLogic === 'function') updateBossLogic();
    }

    drawGame();
    animationId = requestAnimationFrame(gameLoop);
}

function updateEngine() {
    let isRunning = (keys['ShiftLeft'] || keys['ShiftRight']);
    let speed = isRunning ? 6 : 2.5; 
    let jumpPower = isRunning ? -12 : -7.5; 

    let isMoving = false; let oldScrollX = scrollX;

    if (keys['ArrowRight'] || keys['KeyD']) { scrollX -= speed; player.facing = 1; isMoving = true; }
    if ((keys['ArrowLeft'] || keys['KeyA']) && scrollX < 0) { scrollX += speed; player.facing = -1; isMoving = true; }
    if (scrollX > 0) scrollX = 0;

    let applyGravity = true;

    if (gumPower.active) {
        if (gumPower.state === 'chewing') {
            if (--gumPower.timer <= 0) { gumPower.state = 'inflating'; gumPower.timer = 60; }
        } else if (gumPower.state === 'inflating') {
            if (--gumPower.timer <= 0) { gumPower.state = 'floating'; gumPower.countdown = 450; } 
        } else if (gumPower.state === 'floating') {
            applyGravity = false;
            if (keys['Space']) player.dy = -3.2; else player.dy += 0.35; 
            if (--gumPower.countdown <= 0 || player.hitTimer > 0) { gumPower.state = 'pop'; gumPower.timer = 25; }
        } else if (gumPower.state === 'pop' && --gumPower.timer <= 0) {
            gumPower.active = false; gumPower.state = 'none';
        }
    }

    if (applyGravity) {
        player.dy += player.gravity;
        if (keys['Space'] && player.grounded) {
            player.dy = jumpPower;
            player.grounded = false; 
        }
    }

    let nextY = player.y + player.dy;
    player.grounded = false;

    solidObjects.forEach(obj => {
        let ox = obj.x + scrollX;
        if (player.x + player.w > ox && player.x < ox + obj.w) {
            if (player.dy >= 0 && player.y + player.h <= obj.y + 15 && nextY + player.h >= obj.y) {
                nextY = obj.y - player.h; player.dy = 0; player.grounded = true;
            } else if (player.dy < 0 && player.y >= obj.y + obj.h - 15) {
                if (nextY <= obj.y + obj.h) { nextY = obj.y + obj.h; player.dy = 0; }
            } else if (player.y + player.h > obj.y + 5 && player.y < obj.y + obj.h - 5) {
                scrollX = oldScrollX;
            }
        }
    });

    if (nextY > player.groundY) { nextY = player.groundY; player.dy = 0; player.grounded = true; }
    player.y = nextY;
    if (player.hitTimer > 0) player.hitTimer--;

    items.forEach(it => {
        if (!it.collected && Math.abs((it.x + scrollX) - player.x) < 40 && Math.abs(it.y - player.y) < 80) {
            it.collected = true;
            if (it.type === 'gum') { gumPower.active = true; gumPower.state = 'chewing'; gumPower.timer = 50; }
            if (it.type === 'coke') { player.isDrinking = true; player.drinkTimer = 50; }
        }
    });
    
    if (player.isDrinking && --player.drinkTimer <= 0) { player.isDrinking = false; powerUp.active = true; powerUp.timer = 600; }

    if (player.isDrinking) player.currentImg = assets.p_drink;
    else if (gumPower.state === 'chewing') player.currentImg = assets.p_gum_chew;
    else if (gumPower.state === 'inflating') player.currentImg = assets.p_gum_inflate;
    else if (gumPower.state === 'floating') player.currentImg = isMoving ? assets.p_gum_float_move : assets.p_gum_float_idle;
    else if (gumPower.state === 'pop') player.currentImg = assets.p_gum_pop;
    else if (!player.grounded) player.currentImg = assets.p_jump;
    else if (isMoving) {
        player.currentImg = isRunning ? 
            ((frameCounter % 12 < 6) ? assets.p_run1 : assets.p_run2) : 
            ((frameCounter % 16 < 8) ? assets.p_idle : assets.p_walk);
    } 
    else player.currentImg = assets.p_idle;

    if (player.lives <= 0) { 
        gameActive = false; 
        const goScreen = document.getElementById('screen-gameover');
        if (goScreen) goScreen.style.display = 'flex'; 
    }
    
    // TRANSICIÓN AL JEFE: Cuando llegas al final del Nivel 1
    if (Math.abs(scrollX) >= maxProgresoDistancia) {
        gameActive = false;
        const completeScreen = document.getElementById('screen-level1-complete');
        if (completeScreen) completeScreen.style.display = 'flex';
    }
}

function drawGame() {
    ctx.clearRect(0, 0, 800, 400);

    if (currentStage === 1) {
        ctx.drawImage(assets.sky, 0, 0, 800, 400);
        solidObjects.forEach(obj => { if (assets[obj.type]) ctx.drawImage(assets[obj.type], obj.x + scrollX, obj.y, obj.w, obj.h); });
        
        let gX = scrollX % 800;
        ctx.drawImage(assets.ground, gX, 340, 800, 60); ctx.drawImage(assets.ground, gX + 800, 340, 800, 60);

        if (typeof drawBacteria === 'function') drawBacteria();
        if (typeof drawSpider === 'function') drawSpider();

        items.forEach(it => { if (!it.collected) ctx.drawImage(assets[it.type === 'gum' ? 'gum_item' : 'coke_idle'], it.x + scrollX, it.y, 30, 40); });

        ctx.save();
        if (player.hitTimer > 0 && frameCounter % 10 < 5) ctx.globalAlpha = 0.3;
        if (powerUp.active) { ctx.shadowBlur = 20; ctx.shadowColor = "red"; }
        
        ctx.translate(player.x + (player.facing === -1 ? player.w : 0), player.y);
        if (player.facing === -1) ctx.scale(-1, 1);
        ctx.drawImage(player.currentImg, 0, 0, player.w, player.h);
        ctx.restore();

        // UI Nivel 1 (Vidas)
        ctx.fillStyle = "white"; ctx.font = "16px Courier New";
        ctx.fillText("Vidas: " + player.lives, 20, 30);
        if (gumPower.active && gumPower.state === 'floating') ctx.fillText("Aire: " + Math.ceil(gumPower.countdown/60), 20, 50);

    } else if (currentStage === 2) {
        // DIBUJADO DEL JEFE (Delegado a level_boss.js)
        if (typeof drawBossLevel === 'function') drawBossLevel();
    }
}
// ==========================================
// ⚙️ PANEL DE CONTROL DEFINITIVO
// ==========================================
const CONFIG = {
    // EL SUELO: Nivel base de la plataforma
    SUELO_BASE: 280, 

    // KOBY (Tú) - TAMAÑOS INTACTOS
    KOBY: {
        jaula_ancho: 90,  jaula_alto: 90,   
        camina_ancho: 75, camina_alto: 95,  
        gana_ancho: 95,   gana_alto: 95,    
        // ⬇️ AJUSTE DE ALTURA FINAL: Aumenta este número si Koby sigue hundido, redúcelo si flota.
        elevar_al_final: 17 
    },

    // DORIAN (Héroe)
    DORIAN: {
        // ⬇️ AJUSTE DE ALTURA FINAL: Aumenta este número si Dorian sigue hundido, redúcelo si flota.
        elevar_al_final: 17 
    },

    // JEFE
    JEFE: {
        ancho: 230, alto: 200, posicionX: 495, alturaY: 70      
    }
};
// ==========================================

// VARIABLES DE LA BATALLA
const bossArena = {
    dorianHP: 100,
    dorianMaxHP: 100,
    bossHP: 600, 
    bossMaxHP: 600,
    weaponLevel: 1, 
    state: 'playing', 
    cinematicTimer: 0,
    winTimer: 0
};

// Jefe
const boss = { 
    x: CONFIG.JEFE.posicionX, y: CONFIG.JEFE.alturaY, 
    w: CONFIG.JEFE.ancho, h: CONFIG.JEFE.alto, 
    state: 'idle', timer: 0, phase: 1, hitTimer: 0 
};

// Koby (Tú) - Jaula intocable en Y: 190
const you = { 
    x: 710, 
    y: 190, 
    w: CONFIG.KOBY.jaula_ancho, 
    h: CONFIG.KOBY.jaula_alto, 
    state: 'captured_idle', 
    timer: 0 
};

const itemsOnFloor = []; 
const b_projectiles = []; 
const p_projectiles = []; 

let p_throwTimer = 0;
let isCrouching = false;
let platSlideOffset = 0; 

function resetBoss() {
    bossArena.dorianHP = 100; bossArena.bossHP = 600;
    bossArena.weaponLevel = 1; bossArena.state = 'playing'; 
    bossArena.cinematicTimer = 0; bossArena.winTimer = 0;

    boss.x = CONFIG.JEFE.posicionX; boss.y = CONFIG.JEFE.alturaY;
    boss.w = CONFIG.JEFE.ancho; boss.h = CONFIG.JEFE.alto;
    boss.state = 'idle'; boss.timer = 0; boss.phase = 1; boss.hitTimer = 0;
    
    // Reseteo asegurado en la jaula
    you.x = 710; you.y = 190; 
    you.w = CONFIG.KOBY.jaula_ancho; you.h = CONFIG.KOBY.jaula_alto;
    you.state = 'captured_idle'; you.timer = 0;

    b_projectiles.length = 0; p_projectiles.length = 0; itemsOnFloor.length = 0;
    
    player.x = 100; player.y = 190; player.h = 90; player.w = 60; player.facing = 1; player.hitTimer = 0; player.dy = 0; player.wasCrouching = false;
    platSlideOffset = 0;
    
    let btn = document.getElementById('btn-shoot');
    if(btn) btn.style.display = 'block'; 
    
    updateHPBars();
    checkWeaponEvolution(); 
}

function updateHPBars() {
    document.getElementById('dorian-hp').style.width = Math.max(0, (bossArena.dorianHP / bossArena.dorianMaxHP) * 100) + "%";
    document.getElementById('boss-hp').style.width = Math.max(0, (bossArena.bossHP / bossArena.bossMaxHP) * 100) + "%";
}

function checkWeaponEvolution() {
    let icon = document.getElementById('current-weapon-icon');
    if (bossArena.bossHP <= 200 && boss.phase < 3) {
        bossArena.weaponLevel = 3; boss.phase = 3; boss.state = 'angry_start'; boss.timer = 0; 
        if(icon) icon.src = 'assets/p_heart_mythic.png';
    } else if (bossArena.bossHP <= 400 && boss.phase < 2) {
        bossArena.weaponLevel = 2; boss.phase = 2; boss.state = 'angry_start'; boss.timer = 0; 
        if(icon) icon.src = 'assets/p_heart_lvl2.png';
    } else if (boss.phase === 1) {
        bossArena.weaponLevel = 1;
        if(icon) icon.src = 'assets/p_heart_lvl1.png';
    }
}

// LÓGICA DE MOVIMIENTO DE DORIAN
function updateBossEngine() {
    if (bossArena.state === 'cinematic' || bossArena.state === 'finished_waiting' || bossArena.state === 'finished') return;

    let speed = 4.5; let isMoving = false; isCrouching = keys['ArrowDown'];
    
    let groundY = CONFIG.SUELO_BASE; 
    if (player.x < 110 && player.dy >= 0 && (player.y + player.h) <= 160 + 15) groundY = 160; 

    if (isCrouching && !player.wasCrouching) {
        player.h = 45; player.y += 45; player.wasCrouching = true;
    } else if (!isCrouching && player.wasCrouching) {
        player.h = 90; player.y -= 45; player.wasCrouching = false;
    }

    if (!isCrouching) {
        if (keys['ArrowRight'] || keys['KeyD']) { player.x += speed; player.facing = 1; isMoving = true; }
        if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= speed; player.facing = -1; isMoving = true; }
        if (player.x < 10) player.x = 10; 
        if (player.x > 260) player.x = 260; 
        if (keys['Space'] && (player.y + player.h) >= groundY - 5) { player.dy = -10.5; }
    } 
    
    player.dy += player.gravity; player.y += player.dy;
    if (player.y + player.h > groundY) { player.y = groundY - player.h; player.dy = 0; } 

    if (p_throwTimer > 0) {
        player.currentImg = p_throwTimer > 10 ? assets.p_throw_start : assets.p_throw_end;
        p_throwTimer--;
    } else if (isCrouching) {
        player.currentImg = assets.p_crouch;
    } else if (player.y + player.h < groundY - 5) {
        player.currentImg = assets.p_jump;
    } else if (isMoving) {
        player.currentImg = (frameCounter % 16 < 8) ? assets.p_run1 : assets.p_run2;
    } else {
        player.currentImg = assets.p_idle;
    }

    if (keys['KeyZ'] && bossArena.weaponLevel > 0 && p_throwTimer === 0 && !isCrouching && bossArena.state === 'playing') {
        p_throwTimer = 20;
        p_projectiles.push({ x: player.x + 40, y: player.y + 15, level: bossArena.weaponLevel });
    }
    if (player.hitTimer > 0) player.hitTimer--;
}

// LÓGICA DEL JEFE Y SECUENCIAS
function updateBossLogic() {
    if (bossArena.state === 'playing') {
        boss.timer++;
        if (boss.hitTimer > 0) boss.hitTimer--; 
        
        let attackRate = boss.phase === 1 ? 120 : (boss.phase === 2 ? 80 : 55);
        let baseIdleState = boss.phase === 3 ? 'angry_loop' : 'idle'; 

        if (boss.state === 'idle' || boss.state === 'angry_loop') {
            boss.y = CONFIG.JEFE.alturaY + Math.sin(frameCounter * 0.05) * 10; 
            if (boss.timer > attackRate) { boss.state = 'charge'; boss.timer = 0; }
        } else if (boss.state === 'angry_start') {
            if (boss.timer > 40) { boss.state = baseIdleState; boss.timer = 0; }
        } else if (boss.state === 'charge') {
            if (boss.timer > 30) { 
                boss.state = 'throw'; boss.timer = 0;
                let spritesCorazones = ['b_heart_broken1', 'b_heart_broken2', 'b_heart_broken3'];
                let chosenSprite = spritesCorazones[Math.floor(Math.random() * spritesCorazones.length)];
                let speed = boss.phase === 1 ? 4.5 : (boss.phase === 2 ? 6.5 : 8.5);
                
                let startX = boss.x + 40; let startY = boss.y + (boss.h / 2); 
                let targetX = player.x + (player.w / 2); let targetY = player.y + (player.h / 2);
                let dx = targetX - startX; let dy = targetY - startY;
                let distance = Math.sqrt(dx*dx + dy*dy);
                
                b_projectiles.push({ x: startX, y: startY, vx: (dx / distance) * speed, vy: (dy / distance) * speed, img: chosenSprite });
            }
        } else if (boss.state === 'throw') {
            if (boss.timer > 20) { boss.state = baseIdleState; boss.timer = 0; }
        }

        b_projectiles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; 
            if (Math.abs(p.x - player.x) < 35 && Math.abs(p.y - (player.y + player.h/2)) < (player.h/2 + 5)) {
                if (player.hitTimer === 0) {
                    bossArena.dorianHP -= 10; player.hitTimer = 60;
                    you.state = 'captured_scared'; you.timer = 100; 
                    updateHPBars();
                    if (bossArena.dorianHP <= 0) {
                        gameActive = false;
                        let btn = document.getElementById('btn-shoot');
                        if(btn) btn.style.display = 'none';
                        document.getElementById('screen-gameover').style.display = 'flex';
                    }
                }
                b_projectiles.splice(i, 1);
            }
            if (p.x < -100 || p.y > 500 || p.y < -100) b_projectiles.splice(i, 1);
        });

        if (you.state === 'captured_scared' && --you.timer <= 0) {
            you.state = 'captured_idle';
        }

    } else if (bossArena.state === 'dying') {
        bossArena.cinematicTimer++;
        if (bossArena.cinematicTimer === 1) boss.state = 'die1';
        if (bossArena.cinematicTimer === 40) boss.state = 'die2';
        if (bossArena.cinematicTimer === 80) {
            boss.state = 'dead';
            boss.w = 60; boss.h = 60; boss.x = you.x - 60; boss.y = 220; 
            // La llave ahora cae en X: 50 (centro de la plataforma) y frena en Y: 120 (justo encima de ella)
            itemsOnFloor.push({ x: 50, y: -50, targetY: 120, type: 'key', img: 'key_item' });
            bossArena.state = 'waiting_for_key';
        }
        
    } else if (bossArena.state === 'cinematic') {
        bossArena.cinematicTimer++;
        if (platSlideOffset < 200 && bossArena.cinematicTimer % 2 === 0) platSlideOffset += 1; 
        
        if (bossArena.cinematicTimer > 100) {
            let dorianLlego = false;
            let kobyLlego = false;

            // 1. DORIAN CAMINA AL CENTRO (X: 340)
            if (player.x < 335) {
                player.x += 1.5;
                player.facing = 1;
                player.currentImg = (frameCounter % 16 < 8) ? assets.p_run1 : assets.p_run2;
            } else if (player.x > 345) {
                player.x -= 1.5;
                player.facing = -1;
                player.currentImg = (frameCounter % 16 < 8) ? assets.p_run1 : assets.p_run2;
            } else {
                dorianLlego = true;
                player.facing = 1; 
                player.currentImg = assets.p_idle;
                player.x = 340; 
            }
            // Dorian es elevado con su variable especial
            player.y = CONFIG.SUELO_BASE - player.h - CONFIG.DORIAN.elevar_al_final; 

            // 2. KOBY CAMINA AL CENTRO (X: 405)
            let kobyScreenX = you.x + platSlideOffset;
            if (kobyScreenX > 410) {
                you.x -= 1.5; 
                you.w = CONFIG.KOBY.camina_ancho; 
                you.h = CONFIG.KOBY.camina_alto;
                you.state = (frameCounter % 16 < 8) ? 'walk1' : 'walk2'; 
            } else {
                kobyLlego = true;
                you.x = 405 - platSlideOffset; 
            }
            // Koby es elevado con su variable especial
            you.y = CONFIG.SUELO_BASE - you.h - CONFIG.KOBY.elevar_al_final; 

            // 3. AMBOS LLEGAN Y CELEBRAN
            if (dorianLlego && kobyLlego) {
                you.state = 'win';
                you.w = CONFIG.KOBY.gana_ancho; 
                you.h = CONFIG.KOBY.gana_alto;
                
                // Mantiene la elevación en la pose de victoria
                you.y = CONFIG.SUELO_BASE - you.h - CONFIG.KOBY.elevar_al_final; 
                
                player.currentImg = assets.p_win;
                
                bossArena.winTimer++;
                
                if (bossArena.winTimer > 150) {
                    bossArena.state = 'finished_waiting';
                }
            }
        }
        
    } else if (bossArena.state === 'finished_waiting') {
        if (keys['Enter'] || keys['KeyZ']) {
            bossArena.state = 'finished';
            gameActive = false;
            document.getElementById('love-letter').style.display = 'flex';
        }
    }

    p_projectiles.forEach((p, i) => {
        p.x += 8;
        if (bossArena.state === 'playing' && Math.abs(p.x - (boss.x + boss.w/2)) < (boss.w/2) && Math.abs(p.y - (boss.y + boss.h/2)) < (boss.h/2)) {
            if (boss.hitTimer === 0) {
                let dmg = p.level === 1 ? 10 : (p.level === 2 ? 20 : 40);
                bossArena.bossHP -= dmg;
                boss.hitTimer = 15; 
                updateHPBars();
                checkWeaponEvolution(); 
                if (bossArena.bossHP <= 0) startDeathSequence();
            }
            p_projectiles.splice(i, 1);
        }
        if (p.x > 800) p_projectiles.splice(i, 1);
    });

    itemsOnFloor.forEach((it, i) => {
        if (it.y < it.targetY) it.y += 3; 
        if (Math.abs(it.x - player.x) < 50 && Math.abs(it.y - player.y) < 80) {
            if (it.type === 'key') startCinematic();
            itemsOnFloor.splice(i, 1);
        }
    });
}

function startDeathSequence() {
    bossArena.state = 'dying';
    bossArena.cinematicTimer = 0;
    b_projectiles.length = 0; 
    let btn = document.getElementById('btn-shoot');
    if(btn) btn.style.display = 'none'; 
}

function startCinematic() {
    bossArena.state = 'cinematic';
    bossArena.cinematicTimer = 0;
    document.getElementById('boss-ui').style.display = 'none'; 
    you.state = 'walk1'; 
}

// RENDERIZADO VISUAL
function drawBossLevel() {
    let esCine = bossArena.state === 'cinematic' || bossArena.state === 'finished_waiting' || bossArena.state === 'finished';
    let bg = esCine ? assets.bg_boss_sunrise : assets.bg_boss_dark;
    
    if (bg && bg.width) ctx.drawImage(bg, 0, 0, 800, 400);

    if (bossArena.state === 'playing' || bossArena.state === 'dying' || bossArena.state === 'waiting_for_key') {
        ctx.fillStyle = "rgba(15, 5, 25, 0.45)"; 
        ctx.fillRect(0, 0, 800, 400);
    }

    if (esCine) {
        if (assets.plat_victory && assets.plat_victory.width) {
            ctx.drawImage(assets.plat_victory, 0, 240, 800, 160);
        }
    }
    
    if (assets.plat_hero && assets.plat_hero.width) ctx.drawImage(assets.plat_hero, -platSlideOffset, 280, 300, 120);
    if (assets.plat_evade && assets.plat_evade.width) ctx.drawImage(assets.plat_evade, 10 - platSlideOffset, 160, 120, 40);
    if (assets.plat_boss && assets.plat_boss.width) ctx.drawImage(assets.plat_boss, 500 + platSlideOffset, 280, 300, 120);

    ctx.save();
    ctx.translate(boss.x + platSlideOffset + boss.w, boss.y);
    ctx.scale(-1, 1); 
    
    let bossImg;
    // Solo muestra el parpadeo de daño si seguimos en la fase de pelea
    if (boss.hitTimer > 0 && bossArena.state === 'playing') {
        bossImg = assets.boss_hurt1; 
    } else {
        bossImg = assets['boss_' + boss.state];
    }
    
    if (!bossImg || !bossImg.width) bossImg = boss.phase === 3 ? assets.boss_angry_loop : assets.boss_idle; 
    if (bossImg) ctx.drawImage(bossImg, 0, 0, boss.w, boss.h);
    ctx.restore();

    let youImg = assets['u_' + you.state];
    if (youImg) {
        ctx.save();
        ctx.translate(you.x + platSlideOffset + you.w, you.y);
        ctx.scale(-1, 1); 
        ctx.drawImage(youImg, 0, 0, you.w, you.h);
        ctx.restore();
    }

    b_projectiles.forEach(p => { 
        if (assets[p.img]) ctx.drawImage(assets[p.img], p.x, p.y, 40, 40); 
    });

    p_projectiles.forEach(p => { 
        let imgName = p.level === 1 ? 'p_heart_lvl1' : (p.level === 2 ? 'p_heart_lvl2' : 'p_heart_mythic');
        if (assets[imgName]) ctx.drawImage(assets[imgName], p.x, p.y, 40, 40); 
    });

    itemsOnFloor.forEach(it => { if (assets[it.img]) ctx.drawImage(assets[it.img], it.x, it.y, 40, 40); });

    ctx.save();
    if (player.hitTimer > 0 && frameCounter % 10 < 5) ctx.globalAlpha = 0.3;
    ctx.translate(player.x + (player.facing === -1 ? player.w : 0), player.y);
    if (player.facing === -1) ctx.scale(-1, 1);
    if (player.currentImg) ctx.drawImage(player.currentImg, 0, 0, player.w, player.h);
    ctx.restore();

    if (bossArena.state === 'finished_waiting') {
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Courier New";
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText("PRESIONA 'Z' o 'ENTER' PARA CONTINUAR", 400, 100);
        ctx.shadowBlur = 0; 
    }
}
const spiders = [
    // Araña 1 (SUELO - Bloquea el atajo, te obliga a subir)
    { x: 2150, y: 260, w: 100, h: 80, startX: 2150, range: 100, state: 'idle', timer: 0, facing: -1, active: true, webs: [] }, 
    // Araña 2 (PLATAFORMA 1 - Te ataca mientras preparas el chicle)
    { x: 2400, y: 70, w: 100, h: 80, startX: 2400, range: 60, state: 'idle', timer: 0, facing: -1, active: true, webs: [] },  
    // Araña 3 (PLATAFORMA 2 - Plataforma alta, custodia el aire)
    { x: 2750, y: 20, w: 100, h: 80, startX: 2750, range: 50, state: 'idle', timer: 0, facing: -1, active: true, webs: [] },
    // Araña 4 (PLATAFORMA 3 - Aterrizaje)
    { x: 3150, y: 120, w: 100, h: 80, startX: 3150, range: 60, state: 'idle', timer: 0, facing: -1, active: true, webs: [] }
];

function resetSpider() {
    spiders.forEach(s => { s.active = true; s.state = 'idle'; s.x = s.startX; s.webs = []; });
}

function updateSpider() {
    spiders.forEach(s => {
        if (!s.active) return;
        
        let distToP = (s.x + scrollX) - player.x;
        let vertDist = Math.abs(s.y - player.y); 

        // PATRULLA Y DETECCIÓN
        if (s.state === 'idle' || s.state.includes('move')) {
            s.x += s.facing * 1.5;
            
            if (frameCounter % 30 < 10) s.state = 'move1';
            else if (frameCounter % 30 < 20) s.state = 'move2';
            else s.state = 'move3';

            if (s.x < s.startX - s.range) s.facing = 1;
            if (s.x > s.startX + s.range) s.facing = -1;

            if (Math.abs(distToP) < 500) { 
                s.timer++;
                if (s.timer > 80) { // Un poco más rápidas en reaccionar
                    s.timer = 0;
                    s.facing = distToP > 0 ? -1 : 1;
                    
                    if (Math.abs(distToP) < 110 && vertDist < 60) s.state = 'prep_bite';
                    else s.state = 'prep_web';
                }
            } else {
                s.timer = 0;
            }

        } else if (s.state === 'prep_web') {
            if (++s.timer > 30) {
                s.webs.push({ x: s.x, y: s.y + 25, vx: s.facing * 7, facing: s.facing });
                s.state = 'cooldown'; s.timer = 0; 
            }
        } else if (s.state === 'cooldown') {
            if (++s.timer > 20) { s.state = 'idle'; s.timer = 0; }
        } else if (s.state === 'prep_bite') {
            if (++s.timer > 20) { s.state = 'bite'; s.timer = 0; }
        } else if (s.state === 'bite') {
            if (Math.abs(distToP) < 90 && vertDist < 60 && player.hitTimer === 0) {
                player.lives--; player.hitTimer = 100;
            }
            if (++s.timer > 30) { s.state = 'idle'; s.timer = 0; }
        }

        s.webs.forEach((w, i) => {
            w.x += w.vx;
            let wScreenX = w.x + scrollX;
            if (Math.abs(wScreenX - player.x) < 40 && Math.abs(w.y - player.y) < 50) {
                if (player.hitTimer === 0 && !powerUp.active) {
                    player.lives--; player.hitTimer = 100;
                    if (gumPower.active && gumPower.state === 'floating') { gumPower.state = 'pop'; gumPower.timer = 20; }
                }
                s.webs.splice(i, 1);
            }
            if (wScreenX < -200 || wScreenX > 1000) s.webs.splice(i, 1);
        });
    });
}

function drawSpider() {
    spiders.forEach(s => {
        if (!s.active) return;
        
        let sImg = assets['s_' + s.state];
        if (!sImg || !sImg.width) sImg = assets.s_idle;
        
        ctx.save();
        let drawX = s.x + scrollX;
        
        if (s.facing === -1) { 
            ctx.translate(drawX + s.w, s.y);
            ctx.scale(-1, 1); 
            ctx.drawImage(sImg, 0, 0, s.w, s.h);
        } else {
            ctx.translate(drawX, s.y);
            ctx.drawImage(sImg, 0, 0, s.w, s.h);
        }
        ctx.restore();

        s.webs.forEach(w => {
            ctx.save();
            let webDrawX = w.x + scrollX;
            if (w.facing === -1) { 
                ctx.translate(webDrawX + 40, w.y);
                ctx.scale(-1, 1); 
                ctx.drawImage(assets.s_web, 0, 0, 40, 30);
            } else { 
                ctx.translate(webDrawX, w.y);
                ctx.drawImage(assets.s_web, 0, 0, 40, 30);
            }
            ctx.restore();
        });
    });
}
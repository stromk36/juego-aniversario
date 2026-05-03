const bacteriaEnemies = [
    { x: 550, y: 260, w: 50, h: 50, startX: 550, range: 150, state: 'left', dir: -1, active: true },
    { x: 1300, y: 260, w: 50, h: 50, startX: 1300, range: 200, state: 'left', dir: -1, active: true }
];

function resetBacteria() {
    bacteriaEnemies.forEach(en => { en.active = true; en.x = en.startX; en.state = 'left'; });
}

function updateBacteria() {
    bacteriaEnemies.forEach(en => {
        if (!en.active) return;
        en.x += en.dir * 1.8;
        if (en.x < en.startX - en.range) { en.dir = 1; en.state = 'right'; }
        if (en.x > en.startX) { en.dir = -1; en.state = 'left'; }
        
        let ex = en.x + scrollX;
        if (Math.abs(ex - player.x) < 35 && Math.abs(en.y - player.y) < 60) {
            if (powerUp.active) {
                en.active = false;
            } else if (player.hitTimer === 0) {
                player.lives--;
                player.hitTimer = 100;
            }
        }
    });
}

function drawBacteria() {
    bacteriaEnemies.forEach(en => {
        if (en.active) {
            let img = assets['b_' + en.state] || assets.b_idle;
            if (img.width) ctx.drawImage(img, en.x + scrollX, en.y, en.w, en.h);
        }
    });
}
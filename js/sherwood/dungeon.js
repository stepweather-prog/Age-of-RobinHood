Sherwood.Dungeon = {
    TILE: { WALL: 0, EMPTY: 1, MONSTER: 2, CHEST: 3, BOSS: 4, SPAWN: 5, EXIT: 6, ALTAR: 7, CAULDRON: 8, POTION: 9 },
    _dungeon: null,
    _progress: null,

    init: function() {
        var saved = localStorage.getItem('sherwood_dungeon_progress');
        this._progress = saved ? JSON.parse(saved) : { forest: { level: 1 }, swamp: { level: 1 }, cave: { level: 1 } };
    },

    getAvailable: function() {
        var list = {};
        var duns = {
            forest: { name: 'Проклятая чаща', icon: '🌲', bg: 'assets/backgrounds/underground_1_floor_1.jpg', tiles: 'dungeon1', ext: '.jpeg' },
            swamp: { name: 'Первородное болото', icon: '🌿', bg: 'assets/backgrounds/underground_2_floor_1.jpeg', tiles: 'dungeon2', ext: '.png' },
            cave: { name: 'Базальтовые шахты', icon: '🪨', bg: 'assets/backgrounds/underground_3_floor_1.jpeg', tiles: 'dungeon3', ext: '.png' }
        };
        for (var id in duns) {
            var dd = duns[id];
            var prog = this._progress[id] || { level: 1 };
            list[id] = { id: id, name: dd.name, icon: dd.icon, bg: dd.bg, tiles: dd.tiles, ext: dd.ext, level: prog.level };
        }
        return list;
    },

    generate: function(dungeonId, level) {
        var p = Sherwood.getPlayer();
        if (p.dungeon.tickets <= 0) return null;
        p.dungeon.tickets--;
        var w = 6 + Math.floor(level / 3);
        if (w > 10) w = 10;
        var h = w;
        var grid = [];
        for (var y = 0; y < h; y++) {
            grid[y] = [];
            for (var x = 0; x < w; x++) {
                grid[y][x] = { type: this.TILE.WALL, open: false, monster: false, chest: false, altar: false, cauldron: false, potion: false, exit: false, boss: false };
            }
        }
        var cx = Math.floor(Math.random() * w);
        var cy = Math.floor(Math.random() * h);
        grid[cy][cx].type = this.TILE.EMPTY; grid[cy][cx].open = true;
        var emptyCount = 1;
        var target = Math.floor(w * h * 0.6);
        var dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        while (emptyCount < target) {
            var dir = dirs[Math.floor(Math.random() * 4)];
            var nx = cx + dir[0], ny = cy + dir[1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (grid[ny][nx].type === this.TILE.WALL) {
                    grid[ny][nx].type = this.TILE.EMPTY;
                    emptyCount++;
                }
                cx = nx; cy = ny;
            }
        }
        var spawnX = Math.floor(Math.random() * w);
        var spawnY = Math.floor(Math.random() * h);
        while (grid[spawnY][spawnX].type !== this.TILE.EMPTY) {
            spawnX = Math.floor(Math.random() * w); spawnY = Math.floor(Math.random() * h);
        }
        grid[spawnY][spawnX].type = this.TILE.SPAWN; grid[spawnY][spawnX].open = true;
        var empties = [];
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                if (grid[y][x].type === this.TILE.EMPTY && !(x === spawnX && y === spawnY)) {
                    empties.push({x:x, y:y});
                }
            }
        }
        empties.sort(function() { return Math.random() - 0.5; });
        // Босс на 7 этаже
        if (level === 7 && empties.length > 0) {
            var bc = empties.pop();
            grid[bc.y][bc.x].type = this.TILE.BOSS; grid[bc.y][bc.x].boss = true;
        }
        // Монстры
        var monCount = Math.floor(empties.length * 0.25) + 1;
        for (var i = 0; i < monCount; i++) {
            if (empties.length === 0) break;
            var mc = empties.pop();
            grid[mc.y][mc.x].type = this.TILE.MONSTER; grid[mc.y][mc.x].monster = true;
        }
        // Алтарь (1 шт)
        if (empties.length > 0) {
            var ac = empties.pop();
            grid[ac.y][ac.x].type = this.TILE.ALTAR; grid[ac.y][ac.x].altar = true;
        }
        // Котёл (1 шт)
        if (empties.length > 0) {
            var cc = empties.pop();
            grid[cc.y][cc.x].type = this.TILE.CAULDRON; grid[cc.y][cc.x].cauldron = true;
        }
        // Банки лечения (5 шт)
        var potionCount = Math.min(5, empties.length);
        for (var i = 0; i < potionCount; i++) {
            if (empties.length === 0) break;
            var pc = empties.pop();
            grid[pc.y][pc.x].type = this.TILE.POTION; grid[pc.y][pc.x].potion = true;
        }
        // Выход
        var bestDist = -1, exitX = spawnX, exitY = spawnY;
        for (var i = 0; i < empties.length; i++) {
            var dist = Math.abs(empties[i].x - spawnX) + Math.abs(empties[i].y - spawnY);
            if (dist > bestDist) { bestDist = dist; exitX = empties[i].x; exitY = empties[i].y; }
        }
        if (bestDist >= 0) { grid[exitY][exitX].type = this.TILE.EXIT; grid[exitY][exitX].exit = true; }
        // Монстры для подземки
        var monsters = {
            forest: { easy: ['image (1).png','image (3).png','image (74).png'], medium: ['image (9).png','image (29).png','image (75).png'], boss: 'image (15).png' },
            swamp: { easy: ['image (12).png','image (13).png','image (59).png'], medium: ['image (14).png','image (16).png','image (52).png'], boss: 'image (54).png' },
            cave: { easy: ['image (32).png','image (35).png','image (10).png'], medium: ['image (33).png','image (36).png','image (49).png'], boss: 'image (34).png' }
        };
        var pool = monsters[dungeonId] || monsters['forest'];
        var monList = level <= 3 ? pool.easy : pool.medium;
        var bossImg = pool.boss;

        this._dungeon = {
            id: dungeonId, level: level, size: w,
            grid: grid,
            px: spawnX, py: spawnY,
            movesLeft: 10 + level * 2,
            monstersKilled: 0, totalMonsters: monCount,
            chestsOpened: 0,
            monsterPool: monList, bossImg: bossImg,
            isBossLevel: level === 7
        };
        return this._dungeon;
    },

    getDungeon: function() { return this._dungeon; },

    move: function(dx, dy) {
        var d = this._dungeon;
        if (!d || d.movesLeft <= 0) return { ok: false, reason: 'Нет ходов' };
        var nx = d.px + dx, ny = d.py + dy;
        if (nx < 0 || nx >= d.size || ny < 0 || ny >= d.size) return { ok: false, reason: 'Стена' };
        if (d.grid[ny][nx].type === this.TILE.WALL) return { ok: false, reason: 'Стена' };
        d.px = nx; d.py = ny;
        d.movesLeft--;
        d.grid[ny][nx].open = true;
        var tile = d.grid[ny][nx];
        if (tile.type === this.TILE.MONSTER) {
            tile.type = this.TILE.EMPTY; tile.monster = false;
            var mid = d.monsterPool[Math.floor(Math.random() * d.monsterPool.length)];
            return { ok: true, type: 'battle', monsterId: mid, boss: false };
        }
        if (tile.type === this.TILE.BOSS) {
            tile.type = this.TILE.EMPTY; tile.boss = false;
            return { ok: true, type: 'battle', monsterId: d.bossImg, boss: true };
        }
        if (tile.type === this.TILE.CHEST) {
            tile.type = this.TILE.EMPTY; tile.chest = false;
            d.chestsOpened++;
            var g = 25 + Math.floor(Math.random() * 80);
            var s = 100 + Math.floor(Math.random() * 400);
            Sherwood.addResource('gold', g);
            Sherwood.addResource('silver', s);
            return { ok: true, type: 'chest', gold: g, silver: s };
        }
        if (tile.type === this.TILE.ALTAR) {
            tile.type = this.TILE.EMPTY; tile.altar = false;
            return { ok: true, type: 'altar' };
        }
        if (tile.type === this.TILE.CAULDRON) {
            tile.type = this.TILE.EMPTY; tile.cauldron = false;
            return { ok: true, type: 'cauldron' };
        }
        if (tile.type === this.TILE.POTION) {
            tile.type = this.TILE.EMPTY; tile.potion = false;
            return { ok: true, type: 'potion' };
        }
        if (tile.type === this.TILE.EXIT) {
            return { ok: true, type: 'exit' };
        }
        return { ok: true, type: 'move' };
    },

    killMonster: function() { if (this._dungeon) this._dungeon.monstersKilled++; },

    complete: function() {
        var d = this._dungeon; if (!d) return;
        var gold = d.monstersKilled * 35 + d.chestsOpened * 55 + 30;
        var exp = d.monstersKilled * 30 + d.chestsOpened * 40 + 20;
        Sherwood.addResource('gold', gold);
        Sherwood.addExp(exp);
        if (d.isBossLevel) {
            var prog = this._progress[d.id] || { level: 1 };
            if (d.level >= prog.level) prog.level = Math.min(8, d.level + 1);
            this._progress[d.id] = prog;
            localStorage.setItem('sherwood_dungeon_progress', JSON.stringify(this._progress));
        }
        this._dungeon = null;
        return { gold: gold, exp: exp };
    },

    leave: function() { this._dungeon = null; }
};

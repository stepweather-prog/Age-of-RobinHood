/**
 * Sherwood Dungeon — Генерация лабиринта + Туман войны
 */

Sherwood.Dungeon = {
    TILE: { WALL: 0, EMPTY: 1, MONSTER: 2, CHEST: 3, BOSS: 4, SPAWN: 5, EXIT: 6 },
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
        var fog = [];
        for (var y = 0; y < h; y++) {
            grid[y] = [];
            fog[y] = [];
            for (var x = 0; x < w; x++) {
                grid[y][x] = this.TILE.WALL;
                fog[y][x] = true;
            }
        }
        // Генерация лабиринта (бурильщик)
        var cx = Math.floor(Math.random() * w);
        var cy = Math.floor(Math.random() * h);
        grid[cy][cx] = this.TILE.SPAWN;
        var emptyCount = 1;
        var target = Math.floor(w * h * 0.6);
        var dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        while (emptyCount < target) {
            var d = dirs[Math.floor(Math.random() * 4)];
            var nx = cx + d[0], ny = cy + d[1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (grid[ny][nx] === this.TILE.WALL) {
                    grid[ny][nx] = this.TILE.EMPTY;
                    emptyCount++;
                }
                cx = nx; cy = ny;
            }
        }
        // Спавн
        var spawnX = Math.floor(Math.random() * w);
        var spawnY = Math.floor(Math.random() * h);
        while (grid[spawnY][spawnX] !== this.TILE.EMPTY) {
            spawnX = Math.floor(Math.random() * w);
            spawnY = Math.floor(Math.random() * h);
        }
        grid[spawnY][spawnX] = this.TILE.SPAWN;
        // Расстановка объектов
        var empties = [];
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                if (grid[y][x] === this.TILE.EMPTY && !(x === spawnX && y === spawnY)) {
                    empties.push({x:x, y:y});
                }
            }
        }
        empties.sort(function() { return Math.random() - 0.5; });
        // Босс на 7 этаже
        if (level === 7 && empties.length > 0) {
            var bossCell = empties.pop();
            grid[bossCell.y][bossCell.x] = this.TILE.BOSS;
        }
        // Монстры (~25%)
        var monCount = Math.floor(empties.length * 0.25) + 1;
        for (var i = 0; i < monCount; i++) {
            if (empties.length === 0) break;
            var mc = empties.pop();
            grid[mc.y][mc.x] = this.TILE.MONSTER;
        }
        // Сундуки (~12%)
        var chestCount = Math.floor(empties.length * 0.12) + 1;
        for (var i = 0; i < chestCount; i++) {
            if (empties.length === 0) break;
            var cc = empties.pop();
            grid[cc.y][cc.x] = this.TILE.CHEST;
        }
        // Выход — самая дальняя от спавна
        var bestDist = -1, exitX = spawnX, exitY = spawnY;
        for (var i = 0; i < empties.length; i++) {
            var dist = Math.abs(empties[i].x - spawnX) + Math.abs(empties[i].y - spawnY);
            if (dist > bestDist) { bestDist = dist; exitX = empties[i].x; exitY = empties[i].y; }
        }
        if (bestDist >= 0) grid[exitY][exitX] = this.TILE.EXIT;
        // Туман
        fog[spawnY][spawnX] = false;
        var adj = [[0,-1],[0,1],[-1,0],[1,0]];
        for (var i = 0; i < 4; i++) {
            var ax = spawnX + adj[i][0], ay = spawnY + adj[i][1];
            if (ax >= 0 && ax < w && ay >= 0 && ay < h) fog[ay][ax] = false;
        }
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
            grid: grid, fog: fog,
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
        if (d.grid[ny][nx] === this.TILE.WALL) return { ok: false, reason: 'Стена' };
        d.px = nx; d.py = ny;
        d.movesLeft--;
        // Туман
        d.fog[ny][nx] = false;
        d.grid[ny][nx].open = true;
        var adj = [[0,-1],[0,1],[-1,0],[1,0]];
        for (var i = 0; i < 4; i++) {
            var ax = nx + adj[i][0], ay = ny + adj[i][1];
            if (ax >= 0 && ax < d.size && ay >= 0 && ay < d.size) d.fog[ay][ax] = false;
        }
        var tile = d.grid[ny][nx];
        if (tile === this.TILE.MONSTER) {
            d.grid[ny][nx] = this.TILE.EMPTY;
            var mid = d.monsterPool[Math.floor(Math.random() * d.monsterPool.length)];
            return { ok: true, type: 'battle', monsterId: mid, boss: false };
        }
        if (tile === this.TILE.BOSS) {
            d.grid[ny][nx] = this.TILE.EMPTY;
            return { ok: true, type: 'battle', monsterId: d.bossImg, boss: true };
        }
        if (tile === this.TILE.CHEST) {
            d.grid[ny][nx] = this.TILE.EMPTY;
            d.chestsOpened++;
            var g = 25 + Math.floor(Math.random() * 80);
            var s = 100 + Math.floor(Math.random() * 400);
            Sherwood.addResource('gold', g);
            Sherwood.addResource('silver', s);
            return { ok: true, type: 'chest', gold: g, silver: s };
        }
        if (tile === this.TILE.EXIT) {
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

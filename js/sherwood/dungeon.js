Sherwood.Dungeon = {
    _dungeon: null,
    _playerProgress: null,
    
    DUNGEONS: {
        forest: {
            name: 'Шервудский лес',
            icon: '🌲',
            monsters: {
                1: 'Forest Likho1.png',
                2: 'Forest Likho2.png',
                3: 'Forest Likho3.png'
            },
            boss: 'Leshy (Forest Spirit)3.png',
            monstersList: ['Forest Likho1.png', 'Forest Likho2.png', 'Forest Likho3.png']
        },
        swamp: {
            name: 'Болото',
            icon: '🌿',
            monsters: {
                1: 'Swamp Ghoul1.png',
                2: 'Swamp Ghoul2.png',
                3: 'Swamp Ghoul3.png'
            },
            boss: 'Insatiable Triton3.png',
            monstersList: ['Swamp Ghoul1.png', 'Swamp Ghoul2.png', 'Swamp Ghoul3.png']
        },
        cave: {
            name: 'Пещера',
            icon: '🪨',
            monsters: {
                1: 'Bark-Beetle Troglodyte1.png',
                2: 'Bark-Beetle Troglodyte2.png',
                3: 'Bark-Beetle Troglodyte3.png'
            },
            boss: 'The_Sherwood_Abomination.png',
            monstersList: ['Bark-Beetle Troglodyte1.png', 'Bark-Beetle Troglodyte2.png', 'Bark-Beetle Troglodyte3.png']
        }
    },
    
    init() {
        this._loadProgress();
    },
    
    _loadProgress() {
        const saved = localStorage.getItem('sherwood_dungeon_progress');
        if (saved) {
            this._playerProgress = JSON.parse(saved);
        } else {
            this._playerProgress = {
                forest: { level: 1, skulls: 0 },
                swamp: { level: 1, skulls: 0 },
                cave: { level: 1, skulls: 0 }
            };
            this._saveProgress();
        }
    },
    
    _saveProgress() {
        localStorage.setItem('sherwood_dungeon_progress', JSON.stringify(this._playerProgress));
    },
    
    getAvailableDungeons() {
        const result = {};
        for (const [id, data] of Object.entries(this.DUNGEONS)) {
            const progress = this._playerProgress[id];
            result[id] = {
                ...data,
                level: progress.level,
                skulls: progress.skulls,
                maxLevel: 10
            };
        }
        return result;
    },
    
    getDungeonLevel(dungeonId, level) {
        const dungeon = this.DUNGEONS[dungeonId];
        if (!dungeon) return null;
        const progress = this._playerProgress[dungeonId];
        if (level > progress.level + 1) return null;
        
        const monsterCount = 3 + Math.floor(level / 3);
        const monsters = [];
        const pool = dungeon.monstersList;
        for (let i = 0; i < monsterCount; i++) {
            const m = pool[Math.floor(Math.random() * pool.length)];
            monsters.push(m);
        }
        
        return {
            dungeonId,
            level,
            monsters,
            boss: dungeon.boss,
            skulls: progress.skulls,
            isBossLevel: level === 10
        };
    },
    
    completeLevel(dungeonId, level, skullsEarned) {
        const progress = this._playerProgress[dungeonId];
        if (!progress) return;
        
        if (skullsEarned > progress.skulls) {
            progress.skulls = skullsEarned;
        }
        
        if (skullsEarned >= 2 && level >= progress.level) {
            progress.level = Math.min(level + 1, 10);
        }
        
        this._saveProgress();
    },
    
    getSkullConfig(skulls) {
        return {
            1: { enemyMultiplier: 0.8, rewardMultiplier: 0.6, label: '⭐' },
            2: { enemyMultiplier: 1.0, rewardMultiplier: 1.0, label: '⭐⭐' },
            3: { enemyMultiplier: 1.3, rewardMultiplier: 1.5, label: '⭐⭐⭐' },
            4: { enemyMultiplier: 1.7, rewardMultiplier: 2.0, label: '⭐⭐⭐⭐' },
            5: { enemyMultiplier: 2.2, rewardMultiplier: 3.0, label: '⭐⭐⭐⭐⭐' }
        };
    },
    
    generateDungeon(dungeonId, level, skulls) {
        const player = Sherwood.getPlayer();
        if (!player || player.dungeon.tickets <= 0) return null;
        player.dungeon.tickets--;
        
        const config = this.getSkullConfig(skulls);
        if (!config) return null;
        
        const levelData = this.getDungeonLevel(dungeonId, level);
        if (!levelData) return null;
        
        const size = 8;
        const grid = [];
        for (let y = 0; y < size; y++) {
            grid[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = {
                    type: 'wall',
                    explored: false,
                    visible: false,
                    walkable: false,
                    tile: 'assets/icons/Dungeon tiles1.jpeg'
                };
            }
        }
        
        const rooms = this._generateRooms(size);
        rooms.forEach(room => {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (x < size && y < size) {
                        grid[y][x].type = 'floor';
                        grid[y][x].walkable = true;
                        grid[y][x].tile = 'assets/lor/level_seamless_horizontal_loop_1.jpg';
                    }
                }
            }
        });
        
        for (let i = 0; i < rooms.length - 1; i++) {
            const a = rooms[i], b = rooms[i + 1];
            this._carveCorridor(grid, 
                a.x + Math.floor(a.w/2), a.y + Math.floor(a.h/2),
                b.x + Math.floor(b.w/2), b.y + Math.floor(b.h/2)
            );
        }
        
        const startRoom = rooms[0];
        const startX = startRoom.x + Math.floor(startRoom.w/2);
        const startY = startRoom.y + Math.floor(startRoom.h/2);
        grid[startY][startX].type = 'start';
        grid[startY][startX].explored = true;
        grid[startY][startX].visible = true;
        
        const exitRoom = rooms[rooms.length - 1];
        const exitX = exitRoom.x + Math.floor(exitRoom.w/2);
        const exitY = exitRoom.y + Math.floor(exitRoom.h/2);
        grid[exitY][exitX].type = 'exit';
        grid[exitY][exitX].walkable = true;
        
        const enemyCount = Math.floor((3 + level) * config.enemyMultiplier);
        this._placeEnemies(grid, rooms, enemyCount, levelData.monsters);
        
        if (level === 10) {
            const bossRoom = rooms[rooms.length - 2] || rooms[0];
            const bx = bossRoom.x + Math.floor(bossRoom.w/2);
            const by = bossRoom.y + Math.floor(bossRoom.h/2);
            grid[by][bx].type = 'enemy';
            grid[by][bx].monsterId = levelData.boss;
            grid[by][bx].monsterIcon = 'assets/monsters/' + levelData.boss;
            grid[by][bx].monsterName = levelData.boss.replace('.png', '').replace(/_/g, ' ');
            grid[by][bx].walkable = false;
            grid[by][bx].isBoss = true;
        }
        
        const chestCount = Math.floor((2 + level/3) * config.rewardMultiplier);
        this._placeChests(grid, rooms, Math.min(chestCount, 5));
        
        this._dungeon = {
            grid, size,
            playerPos: { x: startX, y: startY },
            dungeonId, level, skulls,
            status: 'active',
            monstersKilled: 0,
            chestsOpened: 0,
            totalEnemies: enemyCount,
            totalChests: chestCount,
            isBossLevel: level === 10,
            bossDefeated: false,
            steps: 0
        };
        
        this._updateVisibility(startX, startY);
        return this._dungeon;
    },
    
    _generateRooms(size) {
        const rooms = [];
        const count = 4 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const w = 2 + Math.floor(Math.random() * 2);
            const h = 2 + Math.floor(Math.random() * 2);
            const x = 1 + Math.floor(Math.random() * (size - w - 1));
            const y = 1 + Math.floor(Math.random() * (size - h - 1));
            let overlap = false;
            for (const r of rooms) {
                if (x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) rooms.push({ x, y, w, h });
        }
        if (rooms.length === 0) rooms.push({ x: 2, y: 2, w: 3, h: 3 });
        return rooms;
    },
    
    _carveCorridor(grid, x1, y1, x2, y2) {
        let x = x1, y = y1;
        while (x !== x2) {
            if (grid[y] && grid[y][x] && grid[y][x].type === 'wall') {
                grid[y][x].type = 'floor';
                grid[y][x].walkable = true;
                grid[y][x].tile = 'assets/lor/level_seamless_horizontal_loop_1.jpg';
            }
            x += (x < x2) ? 1 : -1;
        }
        while (y !== y2) {
            if (grid[y] && grid[y][x] && grid[y][x].type === 'wall') {
                grid[y][x].type = 'floor';
                grid[y][x].walkable = true;
                grid[y][x].tile = 'assets/lor/level_seamless_horizontal_loop_1.jpg';
            }
            y += (y < y2) ? 1 : -1;
        }
    },
    
    _placeEnemies(grid, rooms, count, monsterPool) {
        let placed = 0;
        const cells = [];
        for (const room of rooms) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (grid[y] && grid[y][x] && grid[y][x].walkable && grid[y][x].type === 'floor') {
                        cells.push({ x, y });
                    }
                }
            }
        }
        while (placed < count && cells.length > 0) {
            const idx = Math.floor(Math.random() * cells.length);
            const cell = cells.splice(idx, 1)[0];
            const monsterId = monsterPool[Math.floor(Math.random() * monsterPool.length)];
            if (grid[cell.y] && grid[cell.y][cell.x]) {
                grid[cell.y][cell.x].type = 'enemy';
                grid[cell.y][cell.x].monsterId = monsterId;
                grid[cell.y][cell.x].monsterIcon = 'assets/monsters/' + monsterId;
                grid[cell.y][cell.x].monsterName = monsterId.replace('.png', '').replace(/_/g, ' ');
                grid[cell.y][cell.x].walkable = false;
                placed++;
            }
        }
    },
    
    _placeChests(grid, rooms, count) {
        let placed = 0;
        const cells = [];
        for (const room of rooms) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (grid[y] && grid[y][x] && grid[y][x].walkable && grid[y][x].type === 'floor') {
                        cells.push({ x, y });
                    }
                }
            }
        }
        while (placed < count && cells.length > 0) {
            const idx = Math.floor(Math.random() * cells.length);
            const cell = cells.splice(idx, 1)[0];
            if (grid[cell.y] && grid[cell.y][cell.x]) {
                grid[cell.y][cell.x].type = 'chest';
                grid[cell.y][cell.x].looted = false;
                grid[cell.y][cell.x].reward = {
                    gold: 20 + Math.floor(Math.random() * 60),
                    silver: 80 + Math.floor(Math.random() * 300)
                };
                placed++;
            }
        }
    },
    
    _updateVisibility(x, y) {
        const d = this._dungeon;
        if (!d) return;
        const radius = 2;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < d.size && ny >= 0 && ny < d.size) {
                    if (Math.abs(dx) + Math.abs(dy) <= radius) {
                        d.grid[ny][nx].visible = true;
                        if (d.grid[ny][nx].walkable) d.grid[ny][nx].explored = true;
                    }
                }
            }
        }
    },
    
    moveToTile(x, y) {
        const d = this._dungeon;
        if (!d || d.status !== 'active') return null;
        if (Math.abs(x - d.playerPos.x) + Math.abs(y - d.playerPos.y) !== 1) {
            return { success: false, reason: 'too_far' };
        }
        const cell = d.grid[y][x];
        if (!cell || !cell.walkable) return { success: false, reason: 'wall' };
        if (cell.type === 'enemy') return { success: false, reason: 'enemy' };
        
        d.playerPos = { x, y };
        d.steps++;
        this._updateVisibility(x, y);
        
        if (cell.type === 'chest' && !cell.looted) {
            cell.looted = true;
            d.chestsOpened++;
            Sherwood.addResource('gold', cell.reward.gold);
            Sherwood.addResource('silver', cell.reward.silver);
            return { type: 'chest', reward: cell.reward };
        }
        if (cell.type === 'exit') {
            d.status = 'completed';
            this._calculateReward();
            return { type: 'exit' };
        }
        return { type: 'empty' };
    },
    
    attackEnemy(x, y) {
        const d = this._dungeon;
        if (!d || d.status !== 'active') return null;
        if (Math.abs(x - d.playerPos.x) + Math.abs(y - d.playerPos.y) !== 1) {
            return { success: false, reason: 'too_far' };
        }
        const cell = d.grid[y][x];
        if (!cell || cell.type !== 'enemy') return { success: false, reason: 'no_enemy' };
        return { success: true, tile: cell };
    },
    
    fightMonster(tile) {
        if (!tile || !tile.monsterId) return null;
        const battle = Sherwood.Combat.startPvE(tile.monsterId);
        if (battle) {
            battle.dungeonTile = tile;
            Sherwood.once('BATTLE_VICTORY', () => {
                if (this._dungeon && tile) {
                    this._dungeon.monstersKilled++;
                    tile.type = 'floor';
                    tile.walkable = true;
                    tile.monsterId = null;
                    tile.monsterIcon = null;
                    tile.monsterName = null;
                }
            });
        }
        return battle;
    },
    
    _calculateReward() {
        const d = this._dungeon;
        if (!d) return;
        const config = this.getSkullConfig(d.skulls);
        const mult = config ? config.rewardMultiplier : 1;
        
        const baseGold = d.monstersKilled * 35 + d.chestsOpened * 55;
        const baseExp = d.monstersKilled * 30 + d.chestsOpened * 40;
        
        const gold = Math.floor(baseGold * mult);
        const exp = Math.floor(baseExp * mult);
        
        Sherwood.addResource('gold', gold);
        Sherwood.addExp(exp);
        
        if (d.isBossLevel && d.monstersKilled > 0) {
            Sherwood.addResource('trophies', 5);
            this.completeLevel(d.dungeonId, d.level, d.skulls);
        }
    },
    
    getDungeon() { return this._dungeon; },
    
    leaveDungeon() {
        if (this._dungeon) this._dungeon.status = 'abandoned';
        this._dungeon = null;
    }
};

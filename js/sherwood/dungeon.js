/**
 * Sherwood Dungeon System
 * Полностью исправленная версия
 */

Sherwood.Dungeon = {
    _dungeon: null,
    _playerProgress: null,
    
    DUNGEONS: {
        forest: {
            name: 'Шервудский лес',
            icon: '🌲',
            monsters: ['Forest Likho1.png', 'Forest Likho2.png', 'Forest Likho3.png'],
            boss: 'Leshy (Forest Spirit)3.png'
        },
        swamp: {
            name: 'Болото',
            icon: '🌿',
            monsters: ['Swamp Ghoul1.png', 'Swamp Ghoul2.png', 'Swamp Ghoul3.png'],
            boss: 'Insatiable Triton3.png'
        },
        cave: {
            name: 'Пещера',
            icon: '🪨',
            monsters: ['Bark-Beetle Troglodyte1.png', 'Bark-Beetle Troglodyte2.png', 'Bark-Beetle Troglodyte3.png'],
            boss: 'The_Sherwood_Abomination.png'
        }
    },
    
    init() {
        this._loadProgress();
    },
    
    _loadProgress() {
        const saved = localStorage.getItem('sherwood_dungeon_progress');
        if (saved) {
            try {
                this._playerProgress = JSON.parse(saved);
                return;
            } catch(e) {}
        }
        this._playerProgress = {
            forest: { level: 1, skulls: 0 },
            swamp: { level: 1, skulls: 0 },
            cave: { level: 1, skulls: 0 }
        };
        this._saveProgress();
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
        
        const monsterCount = 9;
        const monsters = [];
        const pool = dungeon.monsters;
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
            isBossLevel: true
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
        const floorTile = 'assets/icons/level_seamless_horizontal_loop_1.jpg';
        const closedTiles = [];
        for (let i = 1; i <= 14; i++) {
            closedTiles.push('assets/icons/Dungeon tiles' + i + '.jpeg');
        }
        
        for (let y = 0; y < size; y++) {
            grid[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = {
                    type: 'wall',
                    explored: false,
                    visible: false,
                    walkable: false,
                    tile: closedTiles[Math.floor(Math.random() * closedTiles.length)]
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
                        grid[y][x].tile = floorTile;
                    }
                }
            }
        });
        
        for (let i = 0; i < rooms.length - 1; i++) {
            const a = rooms[i], b = rooms[i + 1];
            this._carveCorridor(grid, 
                a.x + Math.floor(a.w/2), a.y + Math.floor(a.h/2),
                b.x + Math.floor(b.w/2), b.y + Math.floor(b.h/2),
                floorTile
            );
        }
        
        const startRoom = rooms[0];
        const startX = startRoom.x + Math.floor(startRoom.w/2);
        const startY = startRoom.y + Math.floor(startRoom.h/2);
        grid[startY][startX].type = 'start';
        grid[startY][startX].explored = true;
        grid[startY][startX].visible = true;
        grid[startY][startX].tile = floorTile;
        
        const exitRoom = rooms[rooms.length - 1];
        const exitX = exitRoom.x + Math.floor(exitRoom.w/2);
        const exitY = exitRoom.y + Math.floor(exitRoom.h/2);
        grid[exitY][exitX].type = 'exit';
        grid[exitY][exitX].walkable = true;
        grid[exitY][exitX].tile = floorTile;
        
        this._placeEnemies(grid, rooms, 9, levelData.monsters);
        
        // Босс — в последней комнате
        const bossRoom = rooms[rooms.length - 1];
        const bx = bossRoom.x + Math.floor(bossRoom.w/2);
        const by = bossRoom.y + Math.floor(bossRoom.h/2);
        grid[by][bx].type = 'enemy';
        grid[by][bx].monsterId = levelData.boss;
        grid[by][bx].monsterIcon = 'assets/monsters/' + levelData.boss;
        grid[by][bx].monsterName = levelData.boss.replace('.png', '').replace(/_/g, ' ');
        grid[by][bx].walkable = false;
        grid[by][bx].isBoss = true;
        grid[by][bx].isBossCell = true;
        
        const chestCount = Math.floor((2 + level/3) * config.rewardMultiplier);
        this._placeChests(grid, rooms, Math.min(chestCount, 5));
        this._placeSpecialObjects(grid, rooms, 2);
        
        this._dungeon = {
            grid, size,
            playerPos: { x: startX, y: startY },
            dungeonId, level, skulls,
            status: 'active',
            monstersKilled: 0,
            chestsOpened: 0,
            totalEnemies: 10,
            totalChests: chestCount,
            isBossLevel: true,
            bossDefeated: false,
            steps: 0,
            hitCount: 0,
            skillCharge: 0,
            bossX: bx,
            bossY: by
        };
        
        this._updateVisibility(startX, startY);
        return this._dungeon;
    },
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Гарантирует правильный спавн изолированных комнат
    _generateRooms(size) {
        const rooms = [];
        const count = 3;
        let attempts = 0;
        
        while (rooms.length < count && attempts < 150) {
            attempts++;
            const w = 2;
            const h = 2;
            const x = Math.floor(Math.random() * (size - w - 1)) + 1;
            const y = Math.floor(Math.random() * (size - h - 1)) + 1;
            
            let overlap = false;
            for (const r of rooms) {
                if (x <= r.x + r.w && x + w >= r.x && y <= r.y + r.h && y + h >= r.y) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) {
                rooms.push({ x, y, w, h });
            }
        }
        
        if (rooms.length < 3) {
            return [
                { x: 1, y: 1, w: 2, h: 2 },
                { x: 4, y: 3, w: 2, h: 2 },
                { x: 5, y: 5, w: 2, h: 2 }
            ];
        }
        return rooms;
    },
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Прокладывает коридоры, СТИРАЯ стены
    _carveCorridor(grid, x1, y1, x2, y2, floorTile) {
        let cx = x1;
        while (cx !== x2) {
            grid[y1][cx].type = 'floor';
            grid[y1][cx].walkable = true;
            grid[y1][cx].tile = floorTile;
            cx += (x2 > x1) ? 1 : -1;
        }
        let cy = y1;
        while (cy !== y2) {
            grid[cy][x2].type = 'floor';
            grid[cy][x2].walkable = true;
            grid[cy][x2].tile = floorTile;
            cy += (y2 > y1) ? 1 : -1;
        }
    },
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Никаких мобов на стартовой позиции
    _placeEnemies(grid, rooms, count, monsterPool) {
        let placed = 0;
        let attempts = 0;
        const startRoom = rooms[0];
        
        while (placed < count && attempts < 200) {
            attempts++;
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            
            if (room === startRoom) continue;
            
            const rx = room.x + Math.floor(Math.random() * room.w);
            const ry = room.y + Math.floor(Math.random() * room.h);
            
            if (grid[ry][rx].type === 'floor' && grid[ry][rx].walkable) {
                const monsterFile = monsterPool[Math.floor(Math.random() * monsterPool.length)];
                grid[ry][rx].type = 'enemy';
                grid[ry][rx].monsterId = monsterFile;
                grid[ry][rx].monsterIcon = 'assets/monsters/' + monsterFile;
                grid[ry][rx].monsterName = monsterFile.replace('.png', '').replace(/\d+/g, '').replace(/_/g, ' ');
                grid[ry][rx].walkable = false;
                grid[ry][rx].isBoss = false;
                placed++;
            }
        }
    },
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Сундуки на свободных клетках
    _placeChests(grid, rooms, count) {
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < 100) {
            attempts++;
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const rx = room.x + Math.floor(Math.random() * room.w);
            const ry = room.y + Math.floor(Math.random() * room.h);
            
            if (grid[ry][rx].type === 'floor' && grid[ry][rx].walkable) {
                grid[ry][rx].type = 'chest';
                grid[ry][rx].tile = 'assets/icons/Sherwood_chest_closed.jpeg';
                grid[ry][rx].walkable = true;
                grid[ry][rx].looted = false;
                grid[ry][rx].reward = {
                    gold: 20 + Math.floor(Math.random() * 60),
                    silver: 80 + Math.floor(Math.random() * 300)
                };
                placed++;
            }
        }
    },
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Спецобъекты
    _placeSpecialObjects(grid, rooms, count) {
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < 50) {
            attempts++;
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const rx = room.x + Math.floor(Math.random() * room.w);
            const ry = room.y + Math.floor(Math.random() * room.h);
            
            if (grid[ry][rx].type === 'floor' && grid[ry][rx].walkable) {
                grid[ry][rx].type = 'shrine';
                grid[ry][rx].walkable = true;
                placed++;
            }
        }
    },
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Открывает 5 клеток (центр + 4 стороны)
    _updateVisibility(px, py) {
        if (!this._dungeon) return;
        const size = this._dungeon.size;
        const grid = this._dungeon.grid;
        
        const directions = [
            { x: 0, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
        
        directions.forEach(dir => {
            const nx = px + dir.x;
            const ny = py + dir.y;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                grid[ny][nx].visible = true;
                grid[ny][nx].explored = true;
            }
        });
    },
    
    movePlayer(dx, dy) {
        if (!this._dungeon || this._dungeon.status !== 'active') return false;
        
        const nextX = this._dungeon.playerPos.x + dx;
        const nextY = this._dungeon.playerPos.y + dy;
        const size = this._dungeon.size;
        
        if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size) return false;
        
        const cell = this._dungeon.grid[nextY][nextX];
        if (cell.type === 'wall') return false;
        
        this._dungeon.steps++;
        
        if (cell.type === 'enemy') {
            this._updateVisibility(nextX, nextY);
            if (typeof Sherwood.Battle !== 'undefined') {
                Sherwood.Battle.start(cell);
            }
            return 'battle_started';
        }
        
        this._dungeon.playerPos.x = nextX;
        this._dungeon.playerPos.y = nextY;
        
        if (cell.type === 'chest') {
            this._dungeon.chestsOpened++;
            cell.type = 'floor';
            cell.tile = 'assets/icons/Sherwood_chest_opened.jpeg';
        }
        
        if (cell.type === 'exit') {
            this._dungeon.status = 'completed';
            this._calculateReward();
            return 'exit';
        }
        
        this._updateVisibility(nextX, nextY);
        return true;
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
    },
    
    getDungeon() { return this._dungeon; },
    
    leaveDungeon() {
        if (this._dungeon) this._dungeon.status = 'abandoned';
        this._dungeon = null;
    },
    
    moveToTile(x, y) {
        const d = this._dungeon;
        if (!d || d.status !== 'active') return null;
        if (Math.abs(x - d.playerPos.x) + Math.abs(y - d.playerPos.y) !== 1) {
            return { success: false, reason: 'too_far' };
        }
        const cell = d.grid[y][x];
        if (!cell || !cell.walkable) return { success: false, reason: 'wall' };
        if (cell.type === 'enemy') return { success: false, reason: 'enemy', tile: cell };
        
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
        
        const specialResult = this._processSpecial(cell);
        if (specialResult) return specialResult;
        
        if (cell.type === 'exit') {
            d.status = 'completed';
            this._calculateReward();
            return { type: 'exit' };
        }
        return { type: 'empty' };
    },
    
    _processSpecial(cell) {
        if (cell.used) return null;
        switch(cell.type) {
            case 'portal':
                cell.used = true;
                Sherwood.addResource('gold', cell.reward.gold);
                Sherwood.addExp(cell.reward.exp);
                return { type: 'portal', reward: cell.reward };
            case 'altar':
            case 'shrine':
                cell.used = true;
                const player = Sherwood.getPlayer();
                const healed = Math.min(cell.reward?.hp || 30, player.stats.maxHp - player.stats.hp);
                player.stats.hp += healed;
                return { type: 'altar', heal: healed };
            case 'heal_spring':
                cell.used = true;
                const p2 = Sherwood.getPlayer();
                const h2 = Math.min(cell.reward?.hp || 50, p2.stats.maxHp - p2.stats.hp);
                p2.stats.hp += h2;
                return { type: 'heal_spring', heal: h2 };
            case 'trap_chest':
                cell.used = true;
                return { type: 'trap_chest', monsterId: cell.monsterId };
            default:
                return null;
        }
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
                    tile.tile = 'assets/icons/level_seamless_horizontal_loop_1.jpg';
                    
                    if (tile.isBoss) {
                        this._dungeon.bossDefeated = true;
                        this.completeLevel(this._dungeon.dungeonId, this._dungeon.level, this._dungeon.skulls + 1);
                    }
                    
                    if (Math.random() < 0.2) {
                        const items = Sherwood.EquipmentDB?.items || [];
                        const item = items[Math.floor(Math.random() * items.length)];
                        if (item) {
                            const player = Sherwood.getPlayer();
                            if (player) {
                                player.inventory.push({...item});
                                Sherwood.dispatch({ type: 'ITEM_ACQUIRED', payload: { item } });
                            }
                        }
                    }
                }
            });
            Sherwood.once('BATTLE_DEFEAT', () => {
                if (this._dungeon) {
                    this._dungeon.status = 'failed';
                }
            });
        }
        return battle;
    }
};

if (typeof Sherwood === 'undefined') {
    var Sherwood = {
        getPlayer() {
            return { dungeon: { tickets: 5 } };
        }
    };
}

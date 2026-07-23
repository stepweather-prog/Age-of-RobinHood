/**
 * Sherwood Dungeon — Система подземелий
 * 3 подземки × 7 этажей, скрытые клетки, случайные бои, босс на 7-м этаже
 */

Sherwood.Dungeon = {
    // ============================================================
    //  ДАННЫЕ
    // ============================================================

    _dungeon: null,
    _playerProgress: null,

    DUNGEONS: {
        forest: {
            id: 'forest',
            name: 'Проклятая чаща',
            icon: '🌲',
            tileFolder: 'dungeon1',
            tileExt: '.jpeg',
            tilePrefix: 'tiles',
            monsters: {
                easy: ['image (1).png', 'image (3).png', 'image (74).png'],
                medium: ['image (9).png', 'image (29).png', 'image (75).png'],
                boss: 'image (15).png'
            },
            bossName: 'Проклятый титан Леший',
            floors: 7,
            bg: 'underground_1_floor_'
        },
        swamp: {
            id: 'swamp',
            name: 'Первородное болото',
            icon: '🌿',
            tileFolder: 'dungeon2',
            tileExt: '.png',
            tilePrefix: 'tiles2.',
            monsters: {
                easy: ['image (12).png', 'image (13).png', 'image (17).png', 'image (59).png', 'image (62).png'],
                medium: ['image (14).png', 'image (16).png', 'image (52).png', 'image (53).png', 'image (60).png', 'image (61).png', 'image (63).png'],
                boss: 'image (54).png'
            },
            bossName: 'Кикимора багровой ярости',
            floors: 7,
            bg: 'underground_2_floor_'
        },
        cave: {
            id: 'cave',
            name: 'Базальтовые шахты',
            icon: '🪨',
            tileFolder: 'dungeon3',
            tileExt: '.png',
            tilePrefix: 'tiles3.',
            monsters: {
                easy: ['image (10).png', 'image (11).png', 'image (32).png', 'image (35).png'],
                medium: ['image (33).png', 'image (36).png', 'image (49).png', 'image (50).png'],
                boss: 'image (34).png'
            },
            bossName: 'Волк-оборотень',
            floors: 7,
            bg: 'underground_3_floor_'
        }
    },

    // ============================================================
    //  ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    init: function() {
        this._loadProgress();
    },

    _loadProgress: function() {
        const saved = localStorage.getItem('sherwood_dungeon_progress');
        if (saved) {
            try {
                this._playerProgress = JSON.parse(saved);
                return;
            } catch (e) {}
        }
        this._playerProgress = {
            forest: { level: 1, stars: 0 },
            swamp: { level: 1, stars: 0 },
            cave: { level: 1, stars: 0 }
        };
        this._saveProgress();
    },

    _saveProgress: function() {
        localStorage.setItem('sherwood_dungeon_progress', JSON.stringify(this._playerProgress));
    },

    // ============================================================
    //  ПОЛУЧЕНИЕ ДАННЫХ
    // ============================================================

    getAvailableDungeons: function() {
        const result = {};
        for (const [id, data] of Object.entries(this.DUNGEONS)) {
            const progress = this._playerProgress[id] || { level: 1, stars: 0 };
            result[id] = {
                ...data,
                level: progress.level,
                stars: progress.stars,
                maxLevel: data.floors
            };
        }
        return result;
    },

    getDungeonLevel: function(dungeonId, level) {
        const dungeon = this.DUNGEONS[dungeonId];
        if (!dungeon) return null;
        const progress = this._playerProgress[dungeonId];
        if (!progress) return null;
        if (level > progress.level) return null;

        const isBossLevel = level === dungeon.floors;
        let monsterPool;

        if (isBossLevel) {
            monsterPool = [dungeon.monsters.boss];
        } else if (level <= 3) {
            monsterPool = dungeon.monsters.easy;
        } else {
            monsterPool = dungeon.monsters.medium;
        }

        return {
            dungeonId: dungeonId,
            level: level,
            monsterPool: monsterPool,
            isBossLevel: isBossLevel,
            bossName: isBossLevel ? dungeon.bossName : null,
            stars: progress.stars,
            tileFolder: dungeon.tileFolder,
            tileExt: dungeon.tileExt,
            tilePrefix: dungeon.tilePrefix
        };
    },

    completeLevel: function(dungeonId, level) {
        const progress = this._playerProgress[dungeonId];
        if (!progress) return;

        progress.stars += 2;
        if (progress.stars >= 2 && level >= progress.level) {
            progress.level = Math.min(level + 1, this.DUNGEONS[dungeonId].floors);
            progress.stars = 0;
        }

        this._saveProgress();
    },

    // ============================================================
    //  ГЕНЕРАЦИЯ ПОДЗЕМКИ
    // ============================================================

    generateDungeon: function(dungeonId, level) {
        const player = Sherwood.getPlayer();
        if (!player) return null;
        if (player.dungeon.tickets <= 0) {
            Sherwood.dispatch({ type: 'DUNGEON_ERROR', payload: { message: 'Нет билетов!' } });
            return null;
        }
        player.dungeon.tickets--;

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
                    hasMonster: false,
                    monsterId: null,
                    isBoss: false,
                    looted: false
                };
            }
        }

        const rooms = this._generateRooms(size);
        rooms.forEach(function(room) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (x < size && y < size) {
                        grid[y][x].type = 'floor';
                        grid[y][x].walkable = true;
                    }
                }
            }
        });

        for (let i = 0; i < rooms.length - 1; i++) {
            const a = rooms[i];
            const b = rooms[i + 1];
            this._carveCorridor(grid,
                a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2),
                b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2)
            );
        }

        const startRoom = rooms[0];
        const startX = startRoom.x + Math.floor(startRoom.w / 2);
        const startY = startRoom.y + Math.floor(startRoom.h / 2);
        grid[startY][startX].type = 'start';
        grid[startY][startX].explored = true;
        grid[startY][startX].visible = true;

        const exitRoom = rooms[rooms.length - 1];
        const exitX = exitRoom.x + Math.floor(exitRoom.w / 2);
        const exitY = exitRoom.y + Math.floor(exitRoom.h / 2);
        grid[exitY][exitX].type = 'exit';
        grid[exitY][exitX].walkable = true;

        this._placeMonsters(grid, rooms, levelData);
        this._placeChests(grid, rooms, 3);

        this._dungeon = {
            grid: grid,
            size: size,
            playerPos: { x: startX, y: startY },
            dungeonId: dungeonId,
            level: level,
            status: 'active',
            monstersKilled: 0,
            chestsOpened: 0,
            totalMonsters: this._countMonsters(grid),
            steps: 0,
            isBossLevel: levelData.isBossLevel,
            tileFolder: levelData.tileFolder,
            tileExt: levelData.tileExt,
            tilePrefix: levelData.tilePrefix
        };

        this._updateVisibility(startX, startY);
        return this._dungeon;
    },

    // ============================================================
    //  ГЕНЕРАЦИЯ КОМНАТ
    // ============================================================

    _generateRooms: function(size) {
        const rooms = [];
        const count = 3;
        let attempts = 0;

        while (rooms.length < count && attempts < 150) {
            attempts++;
            const w = 2 + Math.floor(Math.random() * 2);
            const h = 2 + Math.floor(Math.random() * 2);
            const x = Math.floor(Math.random() * (size - w - 1)) + 1;
            const y = Math.floor(Math.random() * (size - h - 1)) + 1;

            let overlap = false;
            for (let r = 0; r < rooms.length; r++) {
                const room = rooms[r];
                if (x <= room.x + room.w && x + w >= room.x && y <= room.y + room.h && y + h >= room.y) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) {
                rooms.push({ x: x, y: y, w: w, h: h });
            }
        }

        if (rooms.length < 3) {
            return [
                { x: 1, y: 1, w: 2, h: 2 },
                { x: 4, y: 2, w: 2, h: 2 },
                { x: 5, y: 5, w: 2, h: 2 }
            ];
        }
        return rooms;
    },

    _carveCorridor: function(grid, x1, y1, x2, y2) {
        let cx = x1;
        while (cx !== x2) {
            if (grid[y1] && grid[y1][cx]) {
                grid[y1][cx].type = 'floor';
                grid[y1][cx].walkable = true;
            }
            cx += (x2 > x1) ? 1 : -1;
        }
        let cy = y1;
        while (cy !== y2) {
            if (grid[cy] && grid[cy][x2]) {
                grid[cy][x2].type = 'floor';
                grid[cy][x2].walkable = true;
            }
            cy += (y2 > y1) ? 1 : -1;
        }
    },

    // ============================================================
    //  МОНСТРЫ И СУНДУКИ
    // ============================================================

    _placeMonsters: function(grid, rooms, levelData) {
        const startRoom = rooms[0];
        const exitRoom = rooms[rooms.length - 1];
        const maxMonsters = levelData.isBossLevel ? 8 : 6;

        const cells = [];
        for (let r = 0; r < rooms.length; r++) {
            const room = rooms[r];
            if (room === startRoom || room === exitRoom) continue;
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (grid[y] && grid[y][x] && grid[y][x].walkable && grid[y][x].type === 'floor') {
                        cells.push({ x: x, y: y });
                    }
                }
            }
        }

        // Фишер-Йетс
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = cells[i];
            cells[i] = cells[j];
            cells[j] = temp;
        }

        const count = Math.min(maxMonsters, cells.length);

        for (let i = 0; i < count; i++) {
            const cell = cells[i];
            const monsterFile = levelData.monsterPool[Math.floor(Math.random() * levelData.monsterPool.length)];
            const isBoss = levelData.isBossLevel && i === count - 1;

            grid[cell.y][cell.x].hasMonster = true;
            grid[cell.y][cell.x].monsterId = monsterFile;
            grid[cell.y][cell.x].isBoss = isBoss;
        }
    },

    _placeChests: function(grid, rooms, count) {
        const cells = [];
        for (let r = 0; r < rooms.length; r++) {
            const room = rooms[r];
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (grid[y] && grid[y][x] && grid[y][x].walkable && grid[y][x].type === 'floor' && !grid[y][x].hasMonster) {
                        cells.push({ x: x, y: y });
                    }
                }
            }
        }

        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = cells[i];
            cells[i] = cells[j];
            cells[j] = temp;
        }

        const toPlace = Math.min(count, cells.length);
        for (let i = 0; i < toPlace; i++) {
            const cell = cells[i];
            grid[cell.y][cell.x].type = 'chest';
            grid[cell.y][cell.x].looted = false;
            grid[cell.y][cell.x].reward = {
                gold: 20 + Math.floor(Math.random() * 60),
                silver: 80 + Math.floor(Math.random() * 300)
            };
        }
    },

    _countMonsters: function(grid) {
        let count = 0;
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].hasMonster) count++;
            }
        }
        return count;
    },

    // ============================================================
    //  ВИДИМОСТЬ
    // ============================================================

    _updateVisibility: function(px, py) {
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

        for (let d = 0; d < directions.length; d++) {
            const dir = directions[d];
            const nx = px + dir.x;
            const ny = py + dir.y;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                grid[ny][nx].visible = true;
                grid[ny][nx].explored = true;
            }
        }
    },

    // ============================================================
    //  ДВИЖЕНИЕ
    // ============================================================

    movePlayer: function(dx, dy) {
        if (!this._dungeon || this._dungeon.status !== 'active') {
            return { success: false, reason: 'inactive' };
        }

        const nextX = this._dungeon.playerPos.x + dx;
        const nextY = this._dungeon.playerPos.y + dy;
        const size = this._dungeon.size;

        if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size) {
            return { success: false, reason: 'wall' };
        }

        const cell = this._dungeon.grid[nextY][nextX];
        if (!cell.walkable) {
            return { success: false, reason: 'wall' };
        }

        this._dungeon.playerPos.x = nextX;
        this._dungeon.playerPos.y = nextY;
        this._dungeon.steps++;

        this._updateVisibility(nextX, nextY);

        if (cell.hasMonster) {
            return {
                success: true,
                type: 'battle',
                monsterId: cell.monsterId,
                isBoss: cell.isBoss,
                tile: cell
            };
        }

        if (cell.type === 'chest' && !cell.looted) {
            cell.looted = true;
            this._dungeon.chestsOpened++;
            Sherwood.addResource('gold', cell.reward.gold);
            Sherwood.addResource('silver', cell.reward.silver);

            // Шанс на предмет (25%)
            if (Math.random() < 0.25) {
                const items = Sherwood.EquipmentDB && Sherwood.EquipmentDB.items ? Sherwood.EquipmentDB.items : [];
                if (items.length > 0) {
                    const item = items[Math.floor(Math.random() * items.length)];
                    if (item && Sherwood.Bag && Sherwood.Bag.addItem) {
                        Sherwood.Bag.addItem({ ...item });
                    }
                }
            }

            return {
                success: true,
                type: 'chest',
                reward: cell.reward
            };
        }

        if (cell.type === 'exit') {
            this._dungeon.status = 'completed';
            this._calculateReward();
            return {
                success: true,
                type: 'exit'
            };
        }

        return { success: true, type: 'move' };
    },

    // ============================================================
    //  НАГРАДЫ
    // ============================================================

    _calculateReward: function() {
        const d = this._dungeon;
        if (!d) return;

        const baseGold = d.monstersKilled * 35 + d.chestsOpened * 55 + 20;
        const baseExp = d.monstersKilled * 30 + d.chestsOpened * 40 + 15;

        Sherwood.addResource('gold', baseGold);
        Sherwood.addExp(baseExp);

        if (d.isBossLevel && d.monstersKilled > 0) {
            this.completeLevel(d.dungeonId, d.level);
        }
    },

    // ============================================================
    //  API
    // ============================================================

    getDungeon: function() {
        return this._dungeon;
    },

    leaveDungeon: function() {
        if (this._dungeon) {
            this._dungeon.status = 'abandoned';
        }
        this._dungeon = null;
    },

    onMonsterDefeated: function(tile) {
        if (!this._dungeon || !tile) return;
        tile.hasMonster = false;
        tile.monsterId = null;
        tile.isBoss = false;
        this._dungeon.monstersKilled++;
    }
};

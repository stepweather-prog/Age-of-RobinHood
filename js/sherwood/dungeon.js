/**
 * Sherwood Dungeon — Полная система подземелий
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
            monsters: {
                easy: ['image (10).png', 'image (11).png', 'image (32).png', 'image (35).png'],
                medium: ['image (33).png', 'image (36).png', 'image (49).png', 'image (50).png'],
                boss: 'image (34).png'
            },
            bossName: 'Волк-оборотень (Кадр удара)',
            floors: 7,
            bg: 'underground_3_floor_'
        }
    },

    // ============================================================
    //  ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    init() {
        this._loadProgress();
    },

    _loadProgress() {
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

    _saveProgress() {
        localStorage.setItem('sherwood_dungeon_progress', JSON.stringify(this._playerProgress));
    },

    // ============================================================
    //  ПОЛУЧЕНИЕ ДАННЫХ
    // ============================================================

    getAvailableDungeons() {
        const result = {};
        for (const [id, data] of Object.entries(this.DUNGEONS)) {
            const progress = this._playerProgress[id];
            result[id] = {
                ...data,
                level: progress.level,
                stars: progress.stars,
                maxLevel: data.floors
            };
        }
        return result;
    },

    getDungeonLevel(dungeonId, level) {
        const dungeon = this.DUNGEONS[dungeonId];
        if (!dungeon) return null;
        const progress = this._playerProgress[dungeonId];
        if (level > progress.level + 1) return null;

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
            dungeonId,
            level,
            monsterPool,
            isBossLevel,
            bossName: isBossLevel ? dungeon.bossName : null,
            stars: progress.stars
        };
    },

    completeLevel(dungeonId, level) {
        const progress = this._playerProgress[dungeonId];
        if (!progress) return;

        progress.stars += 1;
        if (progress.stars >= 2 && level >= progress.level) {
            progress.level = Math.min(level + 1, this.DUNGEONS[dungeonId].floors);
            progress.stars = 0;
        }

        this._saveProgress();
    },

    // ============================================================
    //  ГЕНЕРАЦИЯ ПОДЗЕМКИ
    // ============================================================

    generateDungeon(dungeonId, level) {
        const player = Sherwood.getPlayer();
        if (!player) return null;
        if (player.dungeon?.tickets <= 0) {
            Sherwood.dispatch({ type: 'DUNGEON_ERROR', payload: { message: 'Нет билетов!' } });
            return null;
        }
        if (player.dungeon) player.dungeon.tickets--;

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
                    tile: closedTiles[Math.floor(Math.random() * closedTiles.length)],
                    hasMonster: false,
                    monsterId: null,
                    isBoss: false,
                    looted: false
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
            const a = rooms[i],
                b = rooms[i + 1];
            this._carveCorridor(grid,
                a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2),
                b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2),
                floorTile
            );
        }

        const startRoom = rooms[0];
        const startX = startRoom.x + Math.floor(startRoom.w / 2);
        const startY = startRoom.y + Math.floor(startRoom.h / 2);
        grid[startY][startX].type = 'start';
        grid[startY][startX].explored = true;
        grid[startY][startX].visible = true;
        grid[startY][startX].tile = floorTile;

        const exitRoom = rooms[rooms.length - 1];
        const exitX = exitRoom.x + Math.floor(exitRoom.w / 2);
        const exitY = exitRoom.y + Math.floor(exitRoom.h / 2);
        grid[exitY][exitX].type = 'exit';
        grid[exitY][exitX].walkable = true;
        grid[exitY][exitX].tile = floorTile;

        this._placeMonsters(grid, rooms, levelData);

        this._placeChests(grid, rooms, 3);

        this._dungeon = {
            grid,
            size,
            playerPos: { x: startX, y: startY },
            dungeonId,
            level,
            status: 'active',
            monstersKilled: 0,
            chestsOpened: 0,
            totalMonsters: this._countMonsters(grid),
            steps: 0,
            isBossLevel: levelData.isBossLevel
        };

        this._updateVisibility(startX, startY);
        return this._dungeon;
    },

    // ============================================================
    //  ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================

    _generateRooms(size) {
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
                { x: 4, y: 2, w: 2, h: 2 },
                { x: 5, y: 5, w: 2, h: 2 }
            ];
        }
        return rooms;
    },

    _carveCorridor(grid, x1, y1, x2, y2, floorTile) {
        let cx = x1;
        while (cx !== x2) {
            if (grid[y1] && grid[y1][cx]) {
                grid[y1][cx].type = 'floor';
                grid[y1][cx].walkable = true;
                grid[y1][cx].tile = floorTile;
            }
            cx += (x2 > x1) ? 1 : -1;
        }
        let cy = y1;
        while (cy !== y2) {
            if (grid[cy] && grid[cy][x2]) {
                grid[cy][x2].type = 'floor';
                grid[cy][x2].walkable = true;
                grid[cy][x2].tile = floorTile;
            }
            cy += (y2 > y1) ? 1 : -1;
        }
    },

    _placeMonsters(grid, rooms, levelData) {
        const startRoom = rooms[0];
        const exitRoom = rooms[rooms.length - 1];
        let placed = 0;
        const maxMonsters = levelData.isBossLevel ? 8 : 6;

        const cells = [];
        for (const room of rooms) {
            if (room === startRoom || room === exitRoom) continue;
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (grid[y] && grid[y][x] && grid[y][x].walkable && grid[y][x].type === 'floor') {
                        cells.push({ x, y });
                    }
                }
            }
        }

        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
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

    _placeChests(grid, rooms, count) {
        const cells = [];
        for (const room of rooms) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (grid[y] && grid[y][x] && grid[y][x].walkable && grid[y][x].type === 'floor' && !grid[y][x].hasMonster) {
                        cells.push({ x, y });
                    }
                }
            }
        }

        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
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

    _countMonsters(grid) {
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

    // ============================================================
    //  ДВИЖЕНИЕ
    // ============================================================

    movePlayer(dx, dy) {
        if (!this._dungeon || this._dungeon.status !== 'active') return { success: false, reason: 'inactive' };

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

            // Шанс на предмет
            if (Math.random() < 0.25) {
                const items = Sherwood.EquipmentDB?.items || [];
                const item = items[Math.floor(Math.random() * items.length)];
                if (item) {
                    Sherwood.Bag?.addItem?.({ ...item });
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

    _calculateReward() {
        const d = this._dungeon;
        if (!d) return;

        const baseGold = d.monstersKilled * 35 + d.chestsOpened * 55;
        const baseExp = d.monstersKilled * 30 + d.chestsOpened * 40;

        Sherwood.addResource('gold', baseGold);
        Sherwood.addExp(baseExp);

        if (d.isBossLevel && d.monstersKilled > 0) {
            this.completeLevel(d.dungeonId, d.level);
        }
    },

    // ============================================================
    //  API
    // ============================================================

    getDungeon() {
        return this._dungeon;
    },

    leaveDungeon() {
        if (this._dungeon) {
            this._dungeon.status = 'abandoned';
        }
        this._dungeon = null;
    },

    onMonsterDefeated(tile) {
        if (!this._dungeon || !tile) return;
        tile.hasMonster = false;
        tile.monsterId = null;
        tile.isBoss = false;
        this._dungeon.monstersKilled++;
    }
};

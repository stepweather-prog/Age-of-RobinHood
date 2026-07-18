/**
 * Sherwood Dungeon System — Age of Revenge 2 стиль
 * Карта с открытыми областями, врагами, сундуками и выходом
 * Пошаговое перемещение по сетке
 */

Sherwood.Dungeon = {
    _dungeon: null,
    _gridSize: 8,
    
    // Тайлы
    _tiles: {
        floor: 'assets/lor/level_seamless_horizontal_loop_1.jpg',
        wall: 'assets/icons/Dungeon tiles1.jpeg',
        grass: 'assets/lor/grass_tile.jpg',
        stone: 'assets/lor/stone_floor.jpg'
    },
    
    // Цвета для разных типов клеток (для отладки/стиля)
    _colors: {
        floor: 'rgba(40,60,30,0.3)',
        explored: 'rgba(60,80,50,0.2)',
        player: 'rgba(255,215,0,0.3)',
        enemy: 'rgba(244,67,54,0.3)',
        chest: 'rgba(255,193,7,0.3)',
        exit: 'rgba(76,175,80,0.3)'
    },
    
    init() {
        // Предзагрузка тайлов
        Object.values(this._tiles).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    },
    
    generateDungeon(difficulty = 'normal') {
        const player = Sherwood.getPlayer();
        if (player.dungeon.tickets <= 0) {
            Sherwood.dispatch({ type: 'DUNGEON_ERROR', payload: { message: 'Нет билетов!' } });
            return null;
        }
        player.dungeon.tickets--;
        
        const size = this._gridSize;
        const grid = [];
        const rooms = [];
        
        // 1. Создаём пустую карту
        for (let y = 0; y < size; y++) {
            grid[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = {
                    type: 'wall',
                    explored: false,
                    visible: false,
                    walkable: false,
                    tile: this._tiles.wall
                };
            }
        }
        
        // 2. Генерируем комнаты
        const roomCount = difficulty === 'hard' ? 5 : difficulty === 'easy' ? 3 : 4;
        const roomsList = this._generateRooms(size, roomCount);
        
        // 3. Размещаем комнаты на карте
        roomsList.forEach(room => {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (x < size && y < size) {
                        grid[y][x].type = 'floor';
                        grid[y][x].walkable = true;
                        grid[y][x].tile = this._tiles.floor;
                        grid[y][x].roomId = room.id;
                    }
                }
            }
        });
        
        // 4. Соединяем комнаты коридорами
        this._connectRooms(grid, roomsList, size);
        
        // 5. Выбираем стартовую комнату
        const startRoom = roomsList[0];
        const startX = startRoom.x + Math.floor(startRoom.w / 2);
        const startY = startRoom.y + Math.floor(startRoom.h / 2);
        grid[startY][startX].type = 'start';
        grid[startY][startX].explored = true;
        grid[startY][startX].visible = true;
        
        // 6. Выбираем выход (в последней комнате)
        const exitRoom = roomsList[roomsList.length - 1];
        const exitX = exitRoom.x + Math.floor(exitRoom.w / 2);
        const exitY = exitRoom.y + Math.floor(exitRoom.h / 2);
        grid[exitY][exitX].type = 'exit';
        grid[exitY][exitX].walkable = true;
        
        // 7. Размещаем врагов
        const enemyCount = difficulty === 'hard' ? 8 : difficulty === 'easy' ? 4 : 6;
        this._placeEnemies(grid, roomsList, enemyCount, difficulty, startRoom, exitRoom);
        
        // 8. Размещаем сундуки
        const chestCount = difficulty === 'hard' ? 4 : difficulty === 'easy' ? 2 : 3;
        this._placeChests(grid, roomsList, chestCount, startRoom, exitRoom);
        
        // 9. Подсчитываем общее количество клеток
        let totalWalkable = 0;
        let exploredWalkable = 0;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (grid[y][x].walkable) {
                    totalWalkable++;
                    if (grid[y][x].explored) exploredWalkable++;
                }
            }
        }
        
        this._dungeon = {
            grid,
            size,
            playerPos: { x: startX, y: startY },
            difficulty,
            status: 'active',
            monstersKilled: 0,
            chestsOpened: 0,
            totalEnemies: enemyCount,
            totalChests: chestCount,
            totalWalkable,
            exploredWalkable,
            steps: 0,
            rooms: roomsList,
            startRoom,
            exitRoom
        };
        
        // 10. Открываем видимость вокруг старта
        this._updateVisibility(startX, startY);
        
        return this._dungeon;
    },
    
    _generateRooms(size, count) {
        const rooms = [];
        const minSize = 2;
        const maxSize = 4;
        let attempts = 0;
        const maxAttempts = 100;
        
        for (let i = 0; i < count && attempts < maxAttempts; i++) {
            const w = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
            const h = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
            const x = 1 + Math.floor(Math.random() * (size - w - 1));
            const y = 1 + Math.floor(Math.random() * (size - h - 1));
            
            const room = { x, y, w, h, id: i };
            
            // Проверка пересечений
            let overlap = false;
            for (const existing of rooms) {
                if (x < existing.x + existing.w + 1 && x + w + 1 > existing.x &&
                    y < existing.y + existing.h + 1 && y + h + 1 > existing.y) {
                    overlap = true;
                    break;
                }
            }
            
            if (!overlap) {
                rooms.push(room);
            } else {
                i--;
                attempts++;
            }
        }
        
        // Если не удалось создать все комнаты, добавляем простые
        while (rooms.length < Math.min(count, 3)) {
            const x = 1 + Math.floor(Math.random() * (size - 3));
            const y = 1 + Math.floor(Math.random() * (size - 3));
            const room = { x, y, w: 3, h: 3, id: rooms.length };
            let overlap = false;
            for (const existing of rooms) {
                if (x < existing.x + existing.w + 1 && x + 3 + 1 > existing.x &&
                    y < existing.y + existing.h + 1 && y + 3 + 1 > existing.y) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) rooms.push(room);
        }
        
        return rooms;
    },
    
    _connectRooms(grid, rooms, size) {
        // Соединяем комнаты по порядку
        for (let i = 0; i < rooms.length - 1; i++) {
            const roomA = rooms[i];
            const roomB = rooms[i + 1];
            
            const ax = roomA.x + Math.floor(roomA.w / 2);
            const ay = roomA.y + Math.floor(roomA.h / 2);
            const bx = roomB.x + Math.floor(roomB.w / 2);
            const by = roomB.y + Math.floor(roomB.h / 2);
            
            this._carveCorridor(grid, ax, ay, bx, by);
        }
        
        // Добавляем дополнительные соединения (для цикличности)
        if (rooms.length > 3) {
            for (let i = 0; i < rooms.length - 2; i += 2) {
                const roomA = rooms[i];
                const roomB = rooms[i + 2];
                if (roomA && roomB) {
                    const ax = roomA.x + Math.floor(roomA.w / 2);
                    const ay = roomA.y + Math.floor(roomA.h / 2);
                    const bx = roomB.x + Math.floor(roomB.w / 2);
                    const by = roomB.y + Math.floor(roomB.h / 2);
                    if (Math.random() < 0.4) {
                        this._carveCorridor(grid, ax, ay, bx, by);
                    }
                }
            }
        }
    },
    
    _carveCorridor(grid, x1, y1, x2, y2) {
        let x = x1;
        let y = y1;
        
        // Горизонтальный коридор
        while (x !== x2) {
            if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
                if (grid[y][x].type === 'wall') {
                    grid[y][x].type = 'floor';
                    grid[y][x].walkable = true;
                    grid[y][x].tile = this._tiles.floor;
                }
                if (y + 1 < grid.length && grid[y + 1][x].type === 'wall') {
                    grid[y + 1][x].type = 'floor';
                    grid[y + 1][x].walkable = true;
                    grid[y + 1][x].tile = this._tiles.floor;
                }
                if (y - 1 >= 0 && grid[y - 1][x].type === 'wall') {
                    grid[y - 1][x].type = 'floor';
                    grid[y - 1][x].walkable = true;
                    grid[y - 1][x].tile = this._tiles.floor;
                }
            }
            x += (x < x2) ? 1 : -1;
        }
        
        // Вертикальный коридор
        while (y !== y2) {
            if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
                if (grid[y][x].type === 'wall') {
                    grid[y][x].type = 'floor';
                    grid[y][x].walkable = true;
                    grid[y][x].tile = this._tiles.floor;
                }
                if (x + 1 < grid[0].length && grid[y][x + 1].type === 'wall') {
                    grid[y][x + 1].type = 'floor';
                    grid[y][x + 1].walkable = true;
                    grid[y][x + 1].tile = this._tiles.floor;
                }
                if (x - 1 >= 0 && grid[y][x - 1].type === 'wall') {
                    grid[y][x - 1].type = 'floor';
                    grid[y][x - 1].walkable = true;
                    grid[y][x - 1].tile = this._tiles.floor;
                }
            }
            y += (y < y2) ? 1 : -1;
        }
    },
    
    _placeEnemies(grid, rooms, count, difficulty, startRoom, exitRoom) {
        let placed = 0;
        const availableRooms = rooms.filter(r => r.id !== startRoom.id && r.id !== exitRoom.id);
        
        // Сначала размещаем в комнатах
        for (const room of availableRooms) {
            if (placed >= count) break;
            const cells = this._getRoomCells(grid, room);
            const walkableCells = cells.filter(c => 
                grid[c.y][c.x].walkable && 
                grid[c.y][c.x].type !== 'start' && 
                grid[c.y][c.x].type !== 'exit'
            );
            
            // 1-2 врага на комнату
            const enemiesInRoom = Math.min(
                Math.floor(Math.random() * 2) + 1,
                walkableCells.length,
                count - placed
            );
            
            for (let i = 0; i < enemiesInRoom && i < walkableCells.length; i++) {
                const idx = Math.floor(Math.random() * walkableCells.length);
                const cell = walkableCells.splice(idx, 1)[0];
                const tier = difficulty === 'hard' ? 2 : (difficulty === 'easy' ? 0 : 1);
                const monster = this._getRandomMonster(tier);
                grid[cell.y][cell.x].type = 'enemy';
                grid[cell.y][cell.x].monsterId = monster.id;
                grid[cell.y][cell.x].monsterIcon = monster.icon;
                grid[cell.y][cell.x].monsterName = monster.name;
                grid[cell.y][cell.x].walkable = false;
                placed++;
            }
        }
        
        // Если не хватило, размещаем в коридорах
        if (placed < count) {
            const corridorCells = [];
            for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x < grid[0].length; x++) {
                    if (grid[y][x].walkable && grid[y][x].type === 'floor' && 
                        !grid[y][x].roomId && grid[y][x].type !== 'start' && grid[y][x].type !== 'exit') {
                        corridorCells.push({ x, y });
                    }
                }
            }
            
            while (placed < count && corridorCells.length > 0) {
                const idx = Math.floor(Math.random() * corridorCells.length);
                const cell = corridorCells.splice(idx, 1)[0];
                const tier = difficulty === 'hard' ? 2 : 1;
                const monster = this._getRandomMonster(tier);
                grid[cell.y][cell.x].type = 'enemy';
                grid[cell.y][cell.x].monsterId = monster.id;
                grid[cell.y][cell.x].monsterIcon = monster.icon;
                grid[cell.y][cell.x].monsterName = monster.name;
                grid[cell.y][cell.x].walkable = false;
                placed++;
            }
        }
    },
    
    _placeChests(grid, rooms, count, startRoom, exitRoom) {
        let placed = 0;
        const availableRooms = rooms.filter(r => r.id !== startRoom.id && r.id !== exitRoom.id);
        
        for (const room of availableRooms) {
            if (placed >= count) break;
            const cells = this._getRoomCells(grid, room);
            const walkableCells = cells.filter(c => 
                grid[c.y][c.x].walkable && 
                grid[c.y][c.x].type !== 'start' && 
                grid[c.y][c.x].type !== 'exit' &&
                grid[c.y][c.x].type !== 'enemy'
            );
            
            if (walkableCells.length > 0 && Math.random() < 0.5) {
                const idx = Math.floor(Math.random() * walkableCells.length);
                const cell = walkableCells[idx];
                grid[cell.y][cell.x].type = 'chest';
                grid[cell.y][cell.x].looted = false;
                grid[cell.y][cell.x].reward = {
                    gold: 20 + Math.floor(Math.random() * 60),
                    silver: 80 + Math.floor(Math.random() * 300)
                };
                placed++;
            }
        }
        
        // Добавляем ещё сундуков в коридоры
        while (placed < count) {
            const corridorCells = [];
            for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x < grid[0].length; x++) {
                    if (grid[y][x].walkable && grid[y][x].type === 'floor' && 
                        !grid[y][x].roomId && grid[y][x].type !== 'start' && 
                        grid[y][x].type !== 'exit' && grid[y][x].type !== 'enemy' &&
                        grid[y][x].type !== 'chest') {
                        corridorCells.push({ x, y });
                    }
                }
            }
            
            if (corridorCells.length === 0) break;
            const idx = Math.floor(Math.random() * corridorCells.length);
            const cell = corridorCells[idx];
            grid[cell.y][cell.x].type = 'chest';
            grid[cell.y][cell.x].looted = false;
            grid[cell.y][cell.x].reward = {
                gold: 20 + Math.floor(Math.random() * 60),
                silver: 80 + Math.floor(Math.random() * 300)
            };
            placed++;
        }
    },
    
    _getRoomCells(grid, room) {
        const cells = [];
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (x < grid[0].length && y < grid.length) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    },
    
    _getRandomMonster(tier) {
        const dungeonMonsters = Object.values(Sherwood.Monsters).filter(m => 
            (m.tier === tier || m.tier === tier + 1) && !m.isBoss
        );
        
        if (dungeonMonsters.length === 0) {
            return { id: 'swamp_ghoul_1', name: 'Монстр', icon: 'assets/monsters/Swamp Ghoul1.png' };
        }
        
        return dungeonMonsters[Math.floor(Math.random() * dungeonMonsters.length)];
    },
    
    _updateVisibility(x, y) {
        const d = this._dungeon;
        const size = d.size;
        const radius = 2; // Радиус видимости
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist <= radius) {
                        const cell = d.grid[ny][nx];
                        cell.visible = true;
                        if (cell.walkable) {
                            cell.explored = true;
                        }
                    }
                }
            }
        }
    },
    
    moveToTile(x, y) {
        if (!this._dungeon || this._dungeon.status !== 'active') return null;
        
        const d = this._dungeon;
        const dx = Math.abs(x - d.playerPos.x);
        const dy = Math.abs(y - d.playerPos.y);
        
        // Можно ходить только на соседние клетки (вверх/вниз/влево/вправо)
        if (dx + dy !== 1) {
            return { success: false, reason: 'too_far' };
        }
        
        const cell = d.grid[y][x];
        if (!cell.walkable) {
            return { success: false, reason: 'wall' };
        }
        
        // Нельзя наступать на врага (нужно атаковать)
        if (cell.type === 'enemy') {
            return { success: false, reason: 'enemy', monsterId: cell.monsterId };
        }
        
        // Перемещаем игрока
        d.playerPos = { x, y };
        d.steps++;
        
        // Открываем видимость
        this._updateVisibility(x, y);
        
        // Обновляем исследованные клетки
        let explored = 0;
        for (let gy = 0; gy < d.size; gy++) {
            for (let gx = 0; gx < d.size; gx++) {
                if (d.grid[gy][gx].explored) explored++;
            }
        }
        d.exploredWalkable = explored;
        
        // Обрабатываем клетку
        return this._processTile(cell, x, y);
    },
    
    attackEnemy(x, y) {
        if (!this._dungeon || this._dungeon.status !== 'active') return null;
        
        const d = this._dungeon;
        const dx = Math.abs(x - d.playerPos.x);
        const dy = Math.abs(y - d.playerPos.y);
        
        // Можно атаковать только соседнюю клетку
        if (dx + dy !== 1) {
            return { success: false, reason: 'too_far' };
        }
        
        const cell = d.grid[y][x];
        if (cell.type !== 'enemy') {
            return { success: false, reason: 'no_enemy' };
        }
        
        return { success: true, type: 'enemy', monsterId: cell.monsterId, tile: cell };
    },
    
    _processTile(cell, x, y) {
        const d = this._dungeon;
        
        switch (cell.type) {
            case 'floor':
            case 'start':
                return { type: 'empty' };
                
            case 'chest':
                if (!cell.looted) {
                    cell.looted = true;
                    d.chestsOpened++;
                    Sherwood.addResource('gold', cell.reward.gold);
                    Sherwood.addResource('silver', cell.reward.silver);
                    
                    let item = null;
                    if (Math.random() < 0.2) {
                        const items = Sherwood.EquipmentDB.items.filter(it => it.grade === 'common');
                        if (items.length > 0) {
                            item = items[Math.floor(Math.random() * items.length)];
                            Sherwood.getPlayer().inventory.push({...item});
                        }
                    }
                    return { type: 'chest', reward: cell.reward, item };
                }
                return { type: 'chest', looted: true };
                
            case 'exit':
                d.status = 'completed';
                this._calculateReward();
                return { type: 'exit' };
                
            default:
                return { type: 'empty' };
        }
    },
    
    fightMonster(tile) {
        if (!tile.monsterId) return null;
        const battle = Sherwood.Combat.startPvE(tile.monsterId);
        if (battle) {
            battle.dungeonTile = tile;
            Sherwood.once('BATTLE_VICTORY', () => {
                this._dungeon.monstersKilled++;
                tile.type = 'floor';
                tile.walkable = true;
                tile.monsterId = null;
                tile.monsterIcon = null;
                tile.monsterName = null;
                // После победы обновляем видимость
                this._updateVisibility(this._dungeon.playerPos.x, this._dungeon.playerPos.y);
            });
            Sherwood.once('BATTLE_DEFEAT', () => {});
        }
        return battle;
    },
    
    _calculateReward() {
        const d = this._dungeon;
        const exploredPercent = d.exploredWalkable / d.totalWalkable;
        
        const killBonus = d.monstersKilled * 35;
        const chestBonus = d.chestsOpened * 55;
        const exploreBonus = Math.floor(exploredPercent * 200);
        
        const reward = {
            gold: killBonus + chestBonus + Math.floor(exploreBonus * 0.8),
            silver: (killBonus + chestBonus) * 2 + exploreBonus,
            exp: killBonus + chestBonus + exploreBonus
        };
        
        Sherwood.addResource('gold', reward.gold);
        Sherwood.addResource('silver', reward.silver);
        Sherwood.addExp(reward.exp);
        
        // Бонус за полное исследование
        if (exploredPercent >= 0.85) {
            Sherwood.addResource('trophies', 5);
            reward.trophies = 5;
            reward.bonus = 'Полное исследование! +5 трофеев';
        }
        
        return reward;
    },
    
    getDungeon() { return this._dungeon; },
    
    leaveDungeon() {
        if (this._dungeon?.status === 'active') {
            this._dungeon.status = 'abandoned';
            // Штраф за выход
            const player = Sherwood.getPlayer();
            player.stats.hp = Math.floor(player.stats.maxHp * 0.7);
        }
        this._dungeon = null;
    }
};

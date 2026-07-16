/**
 * Sherwood Game Core
 * Flux-подобное ядро для игры «Шервуд»
 * Работает поверх RobinHood P2P мессенджера
 */

const Sherwood = {
    // ===== DISPATCHER =====
    _listeners: {},
    _onceListeners: {},
    _state: null,
    _initialized: false,
    _saveTimer: null,
    
    // Регистрация обработчиков действий
    on(actionType, callback) {
        if (!this._listeners[actionType]) this._listeners[actionType] = [];
        this._listeners[actionType].push(callback);
        return { 
            remove: () => this.off(actionType, callback) 
        };
    },
    
    once(actionType, callback) {
        if (!this._onceListeners[actionType]) this._onceListeners[actionType] = [];
        this._onceListeners[actionType].push(callback);
    },
    
    off(actionType, callback) {
        if (this._listeners[actionType]) {
            this._listeners[actionType] = this._listeners[actionType].filter(cb => cb !== callback);
        }
    },
    
    // Диспатч действия (как в оригинальном Age of Revenge)
    dispatch(action) {
        const { type, payload } = action;
        
        // Выполняем once-обработчики
        if (this._onceListeners[type]) {
            const callbacks = this._onceListeners[type];
            this._onceListeners[type] = [];
            callbacks.forEach(cb => {
                try { cb(payload); } catch(e) { console.error('[Sherwood] once error:', e); }
            });
        }
        
        // Выполняем обычные обработчики
        if (this._listeners[type]) {
            this._listeners[type].forEach(cb => {
                try { cb(payload); } catch(e) { console.error('[Sherwood] handler error:', e); }
            });
        }
        
        // Автосохранение с дебаунсом
        this._scheduleSave();
    },
    
    // ===== PLAYER STATE =====
    getState() {
        return this._state;
    },
    
    getPlayer() {
        return this._state?.player;
    },
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    async init() {
        if (this._initialized) return;
        
        // Загружаем профиль из localStorage
        const saved = this._loadProfile();
        
        if (saved) {
            this._state = saved;
        } else {
            // Создаём нового персонажа
            this._state = this._createNewPlayer();
            this._saveProfile();
        }
        
        this._initialized = true;
        this.dispatch({ type: 'GAME_INITIALIZED', payload: this._state });
        
        return this._state;
    },
    
    _createNewPlayer() {
        return {
            player: {
                name: localStorage.getItem('robinhood_nick') || 'Вольный стрелок',
                avatar: localStorage.getItem('robinhood_avatar') || '001',
                level: 1,
                exp: 0,
                expToLevel: 100,
                stats: {
                    attack: 10,
                    defense: 5,
                    hp: 100,
                    maxHp: 100,
                    agility: 8,
                    critChance: 5,
                    dodgeChance: 3
                },
                equipment: {
                    head: null,
                    shoulders: null,
                    torso: null,
                    hands: null,
                    legs: null,
                    feet: null,
                    weapon1: null,
                    weapon2: null
                },
                inventory: [],
                bagSize: 20,
                resources: {
                    gold: 0,
                    silver: 50,
                    trophies: 0
                },
                bestiary: {},
                questProgress: {},
                arena: {
                    rank: 0,
                    rating: 1000,
                    league: 0,
                    tickets: 3,
                    maxTickets: 5
                },
                dungeon: {
                    tickets: 3,
                    maxTickets: 5
                },
                raid: {
                    tickets: 2,
                    maxTickets: 3
                },
                portal: {
                    unlocked: false,
                    phials: 0
                },
                completedQuests: [],
                activeQuests: [],
                trainingLevels: {
                    attack: 0,
                    defense: 0,
                    hp: 0
                },
                createdAt: Date.now(),
                lastLogin: Date.now()
            },
            settings: {
                soundEnabled: true,
                animationsEnabled: true,
                theme: 'forest'
            },
            version: 1
        };
    },
    
    // ===== ДЕЙСТВИЯ НАД ИГРОКОМ =====
    
    // Добавить опыт
    addExp(amount) {
        const player = this._state.player;
        player.exp += amount;
        
        // Проверка на повышение уровня
        while (player.exp >= player.expToLevel) {
            player.exp -= player.expToLevel;
            player.level++;
            player.expToLevel = this._calcExpToLevel(player.level);
            
            // Повышаем статы
            player.stats.attack += 3;
            player.stats.defense += 2;
            player.stats.hp += 15;
            player.stats.maxHp += 15;
            
            this.dispatch({ 
                type: 'PLAYER_LEVEL_UP', 
                payload: { level: player.level } 
            });
        }
        
        this.dispatch({ 
            type: 'EXP_ADDED', 
            payload: { amount, currentExp: player.exp, expToLevel: player.expToLevel } 
        });
    },
    
    // Добавить ресурсы
    addResource(type, amount) {
        const player = this._state.player;
        if (player.resources[type] !== undefined) {
            player.resources[type] += amount;
            this.dispatch({ 
                type: 'RESOURCE_CHANGED', 
                payload: { type, amount, total: player.resources[type] } 
            });
        }
    },
    
    // Экипировать предмет
    equipItem(item) {
        const player = this._state.player;
        const part = item.part;
        
        // Снимаем старый предмет
        if (player.equipment[part]) {
            this.unequipItem(part, false);
        }
        
        // Надеваем новый
        player.equipment[part] = item;
        this._recalcStats();
        
        this.dispatch({ 
            type: 'ITEM_EQUIPPED', 
            payload: { item, part } 
        });
    },
    
    // Снять предмет
    unequipItem(part, dispatchEvent = true) {
        const player = this._state.player;
        const item = player.equipment[part];
        
        if (item) {
            // Возвращаем в инвентарь
            if (player.inventory.length < player.bagSize) {
                player.inventory.push(item);
            }
            player.equipment[part] = null;
            this._recalcStats();
            
            if (dispatchEvent) {
                this.dispatch({ 
                    type: 'ITEM_UNEQUIPPED', 
                    payload: { item, part } 
                });
            }
        }
    },
    
    // Обновить статы монстра в бестиарии
    updateBestiary(monsterId, killed = 1) {
        const player = this._state.player;
        if (!player.bestiary[monsterId]) {
            player.bestiary[monsterId] = { killed: 0 };
        }
        player.bestiary[monsterId].killed += killed;
        
        // Проверяем бонусы бестиария
        this._checkBestiaryBonuses(monsterId);
        
        this.dispatch({ 
            type: 'BESTIARY_UPDATED', 
            payload: { monsterId, killed: player.bestiary[monsterId].killed } 
        });
    },
    
    // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
    
    _recalcStats() {
        const player = this._state.player;
        const baseStats = {
            attack: 10 + (player.level - 1) * 3,
            defense: 5 + (player.level - 1) * 2,
            hp: 100 + (player.level - 1) * 15,
            agility: 8 + Math.floor((player.level - 1) / 2),
            critChance: 5,
            dodgeChance: 3
        };
        
        // Добавляем бонусы от экипировки
        Object.values(player.equipment).forEach(item => {
            if (item?.stats) {
                Object.entries(item.stats).forEach(([stat, value]) => {
                    if (baseStats[stat] !== undefined) {
                        baseStats[stat] += value;
                    }
                });
            }
        });
        
        // Добавляем бонусы тренировок
        baseStats.attack += player.trainingLevels.attack * 2;
        baseStats.defense += player.trainingLevels.defense * 2;
        baseStats.hp += player.trainingLevels.hp * 10;
        
        // Добавляем бонусы бестиария
        Object.entries(player.bestiary).forEach(([monsterId, data]) => {
            const monster = this.Monsters?.[monsterId];
            if (monster?.bestiaryBonus && data.killed >= monster.bestiaryBonus.kills) {
                Object.entries(monster.bestiaryBonus.stats).forEach(([stat, value]) => {
                    if (baseStats[stat] !== undefined) {
                        baseStats[stat] += value;
                    }
                });
            }
        });
        
        player.stats = {
            ...baseStats,
            maxHp: baseStats.hp
        };
    },
    
    _checkBestiaryBonuses(monsterId) {
        const player = this._state.player;
        const monster = this.Monsters?.[monsterId];
        const data = player.bestiary[monsterId];
        
        if (monster?.bestiaryBonus && data.killed === monster.bestiaryBonus.kills) {
            this.addResource('gold', monster.bestiaryBonus.reward?.gold || 0);
            this._recalcStats();
            
            this.dispatch({
                type: 'BESTIARY_BONUS_UNLOCKED',
                payload: { monsterId, bonus: monster.bestiaryBonus }
            });
        }
    },
    
    _calcExpToLevel(level) {
        return Math.floor(100 * Math.pow(1.15, level - 1));
    },
    
    // ===== СОХРАНЕНИЕ =====
    _loadProfile() {
        try {
            const data = localStorage.getItem('sherwood_save');
            return data ? JSON.parse(data) : null;
        } catch(e) {
            return null;
        }
    },
    
    _saveProfile() {
        try {
            if (this._state) {
                this._state.player.lastLogin = Date.now();
                localStorage.setItem('sherwood_save', JSON.stringify(this._state));
            }
        } catch(e) {
            console.error('[Sherwood] Save failed:', e);
        }
    },
    
    _scheduleSave() {
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._saveProfile(), 1000);
    },
    
    // ===== СБРОС =====
    resetGame() {
        this._state = this._createNewPlayer();
        this._saveProfile();
        this.dispatch({ type: 'GAME_RESET', payload: null });
    },
    
    destroy() {
        this._saveProfile();
        this._listeners = {};
        this._onceListeners = {};
        if (this._saveTimer) clearTimeout(this._saveTimer);
    }
};

// Экспорт в глобальную область
window.Sherwood = Sherwood;

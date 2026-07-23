/**
 * Sherwood RPG — Core
 * Ядро игры, глобальные функции и события
 */

// ============================================================
//  ГЛОБАЛЬНЫЙ ОБЪЕКТ
// ============================================================

if (typeof Sherwood === 'undefined') {
    var Sherwood = {};
}

// ============================================================
//  ИГРОК
// ============================================================

Sherwood._player = null;

Sherwood.getPlayer = function() {
    if (!this._player) {
        this._loadGame();
    }
    return this._player;
};

Sherwood.setPlayer = function(player) {
    this._player = player;
    this.saveGame();
};

// ============================================================
//  СОХРАНЕНИЕ
// ============================================================

Sherwood._saveKey = 'sherwood_save_data';

Sherwood.saveGame = function() {
    if (!this._player) return;
    try {
        localStorage.setItem(this._saveKey, JSON.stringify(this._player));
    } catch(e) {
        console.warn('⚠️ Не удалось сохранить игру:', e);
    }
};

Sherwood._loadGame = function() {
    try {
        const data = localStorage.getItem(this._saveKey);
        if (data) {
            this._player = JSON.parse(data);
            // Проверка целостности
            if (!this._player.stats) this._player.stats = { attack: 10, defense: 5, agility: 3, hp: 100, maxHp: 100 };
            if (!this._player.resources) this._player.resources = { gold: 0, silver: 100, trophies: 0 };
            if (!this._player.inventory) this._player.inventory = [];
            if (!this._player.equipment) this._player.equipment = {};
            if (!this._player.dungeon) this._player.dungeon = { tickets: 5, maxTickets: 5 };
            if (!this._player.bagSize) this._player.bagSize = 10;
            if (!this._player.exp) this._player.exp = 0;
            if (!this._player.level) this._player.level = 1;
            if (!this._player.expToLevel) this._player.expToLevel = 100;
            if (!this._player.name) this._player.name = 'Охотник';
            return;
        }
    } catch(e) {
        console.warn('⚠️ Ошибка загрузки:', e);
    }

    // Создаём нового игрока
    this._player = {
        name: 'Охотник',
        level: 1,
        exp: 0,
        expToLevel: 100,
        stats: { attack: 10, defense: 5, agility: 3, hp: 100, maxHp: 100 },
        resources: { gold: 0, silver: 100, trophies: 0 },
        inventory: [],
        equipment: {},
        dungeon: { tickets: 5, maxTickets: 5 },
        bagSize: 10,
        bestiary: {},
        questProgress: {},
        trophies: [],
        trainingLevels: { attack: 0, defense: 0, hp: 0, agility: 0 }
    };
    this.saveGame();
};

// ============================================================
//  РЕСУРСЫ
// ============================================================

Sherwood.addResource = function(type, amount) {
    const player = this.getPlayer();
    if (!player) return;
    if (!player.resources) player.resources = {};
    player.resources[type] = (player.resources[type] || 0) + amount;
    this.dispatch({ type: 'RESOURCE_CHANGED', payload: { type, amount } });
    this.saveGame();
};

Sherwood.addExp = function(amount) {
    const player = this.getPlayer();
    if (!player) return;
    player.exp += amount;
    while (player.exp >= player.expToLevel) {
        player.exp -= player.expToLevel;
        player.level++;
        player.expToLevel = Math.floor(player.expToLevel * 1.3);
        this.dispatch({ type: 'PLAYER_LEVEL_UP', payload: { level: player.level } });
    }
    this.saveGame();
};

// ============================================================
//  СОБЫТИЯ
// ============================================================

Sherwood._events = {};

Sherwood.on = function(event, callback) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
};

Sherwood.once = function(event, callback) {
    const wrapper = function(data) {
        callback(data);
        this.off(event, wrapper);
    }.bind(this);
    this.on(event, wrapper);
};

Sherwood.off = function(event, callback) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(cb => cb !== callback);
};

Sherwood.dispatch = function(event) {
    const callbacks = this._events[event.type] || [];
    callbacks.forEach(cb => cb(event.payload));
};

// ============================================================
//  ПЕРЕСЧЁТ СТАТОВ
// ============================================================

Sherwood._recalcStats = function() {
    const player = this.getPlayer();
    if (!player) return;

    let bonusAttack = 0;
    let bonusDefense = 0;
    let bonusAgility = 0;
    let bonusHp = 0;

    // Экипировка
    for (const part of Object.values(player.equipment)) {
        if (part && part.stats) {
            bonusAttack += part.stats.attack || 0;
            bonusDefense += part.stats.defense || 0;
            bonusAgility += part.stats.agility || 0;
            bonusHp += part.stats.hp || 0;
        }
    }

    // Тренировки
    const tl = player.trainingLevels || {};
    bonusAttack += (tl.attack || 0) * 2;
    bonusDefense += (tl.defense || 0) * 2;
    bonusAgility += (tl.agility || 0) * 1;
    bonusHp += (tl.hp || 0) * 10;

    // Базовые статы
    const baseStats = {
        attack: 10 + (player.level - 1) * 2,
        defense: 5 + (player.level - 1) * 1,
        agility: 3 + (player.level - 1) * 0.5,
        maxHp: 100 + (player.level - 1) * 15
    };

    player.stats.attack = Math.floor(baseStats.attack + bonusAttack);
    player.stats.defense = Math.floor(baseStats.defense + bonusDefense);
    player.stats.agility = Math.floor(baseStats.agility + bonusAgility);
    player.stats.maxHp = Math.floor(baseStats.maxHp + bonusHp);
    player.stats.hp = Math.min(player.stats.hp || player.stats.maxHp, player.stats.maxHp);

    this.saveGame();
};

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================

Sherwood.init = function() {
    this.getPlayer();
    this._recalcStats();

    // Инициализация подсистем
    if (Sherwood.Dungeon) Sherwood.Dungeon.init();
    if (Sherwood.Bag) Sherwood.Bag.init();

    console.log('🏹 Sherwood RPG готов!');
    this.dispatch({ type: 'GAME_INITIALIZED' });
};

// ============================================================
//  АВТОЗАПУСК
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    Sherwood.init();
});

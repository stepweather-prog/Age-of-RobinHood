/**
 * Sherwood RPG — Core
 * Ядро игры: игрок, сохранение, ресурсы, статы, события, формулы
 */

if (typeof Sherwood === 'undefined') { var Sherwood = {}; }

Sherwood._player = null;
Sherwood._saveTimeout = null;

Sherwood.getPlayer = function() {
    if (!this._player) this._loadGame();
    return this._player;
};

Sherwood.setPlayer = function(p) { this._player = p; this.saveGame(); };

Sherwood._saveKey = 'sherwood_save_data';

Sherwood.saveGame = function() {
    if (!this._player) return;
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    var self = this;
    this._saveTimeout = setTimeout(function() {
        try { localStorage.setItem(self._saveKey, JSON.stringify(self._player)); } catch(e) {}
    }, 300);
};

Sherwood.saveGameNow = function() {
    if (this._saveTimeout) { clearTimeout(this._saveTimeout); this._saveTimeout = null; }
    if (!this._player) return;
    try { localStorage.setItem(this._saveKey, JSON.stringify(this._player)); } catch(e) {}
};

Sherwood._loadGame = function() {
    try {
        var data = localStorage.getItem(this._saveKey);
        if (data) { this._player = JSON.parse(data); this._ensureDefaults(); return; }
    } catch(e) {}
    this._createNewPlayer();
    this.saveGameNow();
};

Sherwood._ensureDefaults = function() {
    var p = this._player; if (!p) return;
    if (!p.name) p.name = 'Охотник';
    if (!p.level) p.level = 1;
    if (p.exp === undefined) p.exp = 0;
    if (!p.expToLevel) p.expToLevel = 100;
    if (!p.stats) p.stats = { attack: 10, defense: 5, agility: 3, hp: 100, maxHp: 100 };
    if (!p.resources) p.resources = { gold: 0, silver: 100, trophies: 0, scrolls: 0, ingots: 0, wood: 0, feathers: 0 };
    if (!p.inventory) p.inventory = [];
    if (!p.equipment) p.equipment = {};
    if (!p.dungeon) p.dungeon = { tickets: 5, maxTickets: 5 };
    if (!p.bagSize) p.bagSize = 10;
    if (!p.bestiary) p.bestiary = {};
    if (!p.questProgress) p.questProgress = { completed: [], currentChapter: 1 };
    if (!p.trophies) p.trophies = [];
    if (!p.trainingLevels) p.trainingLevels = { attack: 0, defense: 0, hp: 0, agility: 0 };
    if (!p.unlockedSkins) p.unlockedSkins = [];
    if (!p.activeSkin) p.activeSkin = 'skin_1_basic';
    if (!p.questEnergy) p.questEnergy = { current: 50, max: 50 };
    if (!p.portal) p.portal = { completed: [] };
    if (!p.arena) p.arena = { wins: 0, losses: 0, rank: 'Новичок' };
    if (!p.raid) p.raid = { raidsToday: 0, lastRaidDate: '' };
    if (!p.tavern) p.tavern = { questsCompleted: 0, dailyQuestsDone: 0 };
};

Sherwood._createNewPlayer = function() {
    this._player = {
        name: 'Охотник', level: 1, exp: 0, expToLevel: 100,
        stats: { attack: 10, defense: 5, agility: 3, hp: 100, maxHp: 100 },
        resources: { gold: 0, silver: 100, trophies: 0, scrolls: 0, ingots: 0, wood: 0, feathers: 0 },
        inventory: [], equipment: {},
        dungeon: { tickets: 5, maxTickets: 5 }, bagSize: 10,
        bestiary: {}, questProgress: { completed: [], currentChapter: 1 },
        trophies: [], trainingLevels: { attack: 0, defense: 0, hp: 0, agility: 0 },
        unlockedSkins: [], activeSkin: 'skin_1_basic',
        questEnergy: { current: 50, max: 50 },
        portal: { completed: [] }, arena: { wins: 0, losses: 0, rank: 'Новичок' },
        raid: { raidsToday: 0, lastRaidDate: '' },
        tavern: { questsCompleted: 0, dailyQuestsDone: 0 }
    };
};

Sherwood.addResource = function(type, amount) {
    var p = this.getPlayer(); if (!p) return;
    if (!p.resources) p.resources = {};
    p.resources[type] = (p.resources[type] || 0) + amount;
    this.dispatch({ type: 'RESOURCE_CHANGED', payload: { type: type, amount: amount } });
    this.saveGame();
};

Sherwood.hasResource = function(type, amount) {
    var p = this.getPlayer();
    return p && p.resources && (p.resources[type] || 0) >= amount;
};

Sherwood.spendResource = function(type, amount) {
    if (!this.hasResource(type, amount)) return false;
    var p = this.getPlayer();
    p.resources[type] -= amount;
    this.dispatch({ type: 'RESOURCE_CHANGED', payload: { type: type, amount: -amount } });
    this.saveGame();
    return true;
};

Sherwood.addExp = function(amount) {
    var p = this.getPlayer(); if (!p || p.level >= 100) return;
    p.exp += amount;
    while (p.exp >= p.expToLevel && p.level < 100) {
        p.exp -= p.expToLevel;
        p.level++;
        p.expToLevel = Math.min(Math.floor(p.expToLevel * 1.3), 999999);
        this.dispatch({ type: 'PLAYER_LEVEL_UP', payload: { level: p.level } });
    }
    if (p.level >= 100) { p.exp = 0; p.expToLevel = 0; }
    this._recalcStats();
    this.saveGame();
};

Sherwood._events = {};

Sherwood.on = function(event, cb) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(cb);
};

Sherwood.off = function(event, cb) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(function(f) { return f !== cb; });
};

Sherwood.dispatch = function(event) {
    var cbs = this._events[event.type] || [];
    cbs.forEach(function(cb) { try { cb(event.payload); } catch(e) {} });
};

// ========== ФОРМУЛЫ ==========

Sherwood.getJewelryBonus = function(level, baseMultiplier) {
    return Math.round(baseMultiplier * Math.pow(level, 1.8));
};

Sherwood.getMonsterHP = function(chapter, floor) {
    return Math.round(100 * Math.pow(chapter, 2.1) * (1 + floor * 0.15));
};

Sherwood.getStatUpgradeCost = function(currentLevel) {
    return Math.round(10 * Math.pow(currentLevel + 1, 1.15));
};

// ========== ПЕРЕСЧЁТ СТАТОВ ==========

Sherwood._recalcStats = function() {
    var p = this.getPlayer(); if (!p) return;
    var ba = 0, bd = 0, bag = 0, bh = 0;
    for (var k in p.equipment) {
        var eq = p.equipment[k];
        if (eq && eq.stats) {
            ba += eq.stats.attack || 0;
            bd += eq.stats.defense || 0;
            bag += eq.stats.agility || 0;
            bh += eq.stats.hp || 0;
        }
    }
    var tl = p.trainingLevels || {};
    ba += (tl.attack || 0) * 2;
    bd += (tl.defense || 0) * 2;
    bag += (tl.agility || 0) * 1;
    bh += (tl.hp || 0) * 10;
    for (var i = 0; i < (p.trophies || []).length; i++) {
        var t = p.trophies[i];
        if (t.bonus) {
            ba += t.bonus.attack || 0;
            bd += t.bonus.defense || 0;
            bag += t.bonus.agility || 0;
            bh += t.bonus.hp || 0;
        }
    }
    var MAX = 30000;
    p.stats.attack = Math.min(Math.floor(10 + (p.level-1)*2 + ba), MAX);
    p.stats.defense = Math.min(Math.floor(5 + (p.level-1)*1 + bd), MAX);
    p.stats.agility = Math.min(Math.floor(3 + (p.level-1)*0.5 + bag), MAX);
    p.stats.maxHp = Math.min(Math.floor(100 + (p.level-1)*15 + bh), MAX);
    if (!p.stats.hp || p.stats.hp > p.stats.maxHp) p.stats.hp = p.stats.maxHp;
    this.saveGame();
};

Sherwood.addTrophy = function(id, name, bonus, icon, category) {
    var p = this.getPlayer(); if (!p) return false;
    if (!p.trophies) p.trophies = [];
    if (p.trophies.some(function(t) { return t.id === id; })) return false;
    p.trophies.push({ id: id, name: name, bonus: bonus || {}, icon: icon || '', category: category || 'chapter', acquiredAt: Date.now() });
    this._recalcStats();
    this.saveGame();
    return true;
};

Sherwood.getTrophies = function() { var p = this.getPlayer(); return p ? (p.trophies || []) : []; };

Sherwood.init = function() {
    this.getPlayer();
    this._recalcStats();
    if (typeof Sherwood.Dungeon !== 'undefined' && Sherwood.Dungeon.init) Sherwood.Dungeon.init();
    if (typeof Sherwood.Bag !== 'undefined' && Sherwood.Bag.init) Sherwood.Bag.init();
    if (typeof Sherwood.Quests !== 'undefined' && Sherwood.Quests.init) Sherwood.Quests.init();
    if (typeof Sherwood.Tavern !== 'undefined' && Sherwood.Tavern.init) Sherwood.Tavern.init();
    if (typeof Sherwood.Daily !== 'undefined' && Sherwood.Daily.init) Sherwood.Daily.init();
    if (typeof Sherwood.Portal !== 'undefined' && Sherwood.Portal.init) Sherwood.Portal.init();
    if (typeof Sherwood.Forge !== 'undefined' && Sherwood.Forge.init) Sherwood.Forge.init();
    if (typeof Sherwood.Raid !== 'undefined' && Sherwood.Raid.init) Sherwood.Raid.init();
    if (typeof Sherwood.Arena !== 'undefined' && Sherwood.Arena.init) Sherwood.Arena.init();
    if (typeof Sherwood.BlackMarket !== 'undefined' && Sherwood.BlackMarket.init) Sherwood.BlackMarket.init();
    if (typeof Sherwood.Chat !== 'undefined' && Sherwood.Chat.init) Sherwood.Chat.init();
    if (typeof Sherwood.Bestiary !== 'undefined' && Sherwood.Bestiary.init) Sherwood.Bestiary.init();
    this.dispatch({ type: 'GAME_INITIALIZED' });
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof Sherwood !== 'undefined' && Sherwood.init) Sherwood.init();
});

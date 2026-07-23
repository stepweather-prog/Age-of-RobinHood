Sherwood.Combat = {
    _battle: null,
    _effects: [],
    _turn: 0,
    _hitCount: 0,
    _cooldowns: {},

    start: function(monsterId, isBoss, mode) {
        var p = Sherwood.getPlayer();
        var hp = isBoss ? 400 + Math.floor(Math.random() * 200) : 80 + Math.floor(Math.random() * 120);
        var atk = isBoss ? 30 + Math.floor(Math.random() * 20) : 10 + Math.floor(Math.random() * 15);
        var def = isBoss ? 15 + Math.floor(Math.random() * 10) : 2 + Math.floor(Math.random() * 10);
        this._battle = {
            id: monsterId, hp: hp, maxHp: hp, atk: atk, def: def,
            isBoss: !!isBoss, mode: mode || 'dungeon',
            pHp: p.stats.hp, pMaxHp: p.stats.maxHp,
            pAtk: p.stats.attack, pDef: p.stats.defense, pAgi: p.stats.agility
        };
        this._effects = [];
        this._turn = 1;
        this._hitCount = 0;
        this._cooldowns = {};
        return { success: true };
    },

    getState: function() { return this._battle ? {
        enemyHp: this._battle.hp, enemyMaxHp: this._battle.maxHp,
        playerHp: this._battle.pHp, playerMaxHp: this._battle.pMaxHp,
        isBoss: this._battle.isBoss, turn: this._turn, effects: this._effects.slice(),
        cooldowns: Object.assign({}, this._cooldowns)
    } : null; },

    isActive: function() { return !!this._battle; },

    _chargeRate: function() {
        var m = this._battle.mode;
        if (m === 'dungeon' || m === 'portal' || m === 'raid') return 2;
        return 3;
    },

    _canUseSkill: function(id) {
        return !this._cooldowns[id] && this._hitCount >= this._chargeRate();
    },

    attack: function() {
        var b = this._battle; if (!b) return null;
        var dmg = Math.max(1, Math.floor(b.pAtk - b.def * 0.3 + Math.floor(Math.random() * 8) - 2));
        var crit = Math.random() * 100 < 15;
        if (crit) dmg = Math.floor(dmg * 1.8);
        b.hp -= dmg;
        this._hitCount++;
        var r = { type: 'attack', damage: dmg, crit: crit, enemyHp: Math.max(0, b.hp), enemyMaxHp: b.maxHp };
        if (b.hp <= 0) { r.win = true; r.exp = b.isBoss ? 150 : 35; r.gold = b.isBoss ? 120 : 25; this._giveReward(r); this._battle = null; return r; }
        r.enemy = this._enemyTurn();
        if (b.pHp <= 0) { r.lose = true; this._battle = null; }
        return r;
    },

    skill: function(id) {
        var b = this._battle; if (!b) return null;
        if (!this._canUseSkill(id)) return { fail: true, reason: 'Навык недоступен' };
        var s = { power_shot: { mult: 1.8 }, triple_shot: { mult: 0.7, hits: 3 }, poison_arrow: { mult: 1.0, poison: { dmg: Math.floor(b.maxHp * 0.08) + 5, turns: 2 } }, stunning_shot: { mult: 0.5, stun: 1 } }[id];
        if (!s) return { fail: true };
        var dmg = Math.max(1, Math.floor(b.pAtk * s.mult - b.def * 0.3 + Math.floor(Math.random() * 8) - 2));
        if (s.hits) dmg *= s.hits;
        var crit = Math.random() * 100 < 20;
        if (crit) dmg = Math.floor(dmg * 1.8);
        b.hp -= dmg;
        this._hitCount = 0;
        this._cooldowns[id] = true;
        var r = { type: 'skill', skill: id, damage: dmg, crit: crit, enemyHp: Math.max(0, b.hp), enemyMaxHp: b.maxHp };
        if (s.poison) { this._effects.push({ target: 'enemy', type: 'poison', dmg: s.poison.dmg, turns: s.poison.turns }); r.poison = true; }
        if (s.stun) { this._effects.push({ target: 'enemy', type: 'stun', turns: s.stun }); r.stun = true; }
        if (b.hp <= 0) { r.win = true; r.exp = b.isBoss ? 150 : 35; r.gold = b.isBoss ? 120 : 25; this._giveReward(r); this._battle = null; return r; }
        r.enemy = this._enemyTurn();
        if (b.pHp <= 0) { r.lose = true; this._battle = null; }
        return r;
    },

    _enemyTurn: function() {
        var b = this._battle;
        for (var i = this._effects.length - 1; i >= 0; i--) {
            var e = this._effects[i];
            if (e.target === 'enemy' && e.type === 'stun') { e.turns--; if (e.turns <= 0) this._effects.splice(i, 1); return { stun: true }; }
            if (e.target === 'enemy' && e.type === 'poison') { b.hp -= e.dmg; e.turns--; if (e.turns <= 0) this._effects.splice(i, 1); return { poison: true, dmg: e.dmg }; }
        }
        var useSkill = Math.random() * 100 < 20;
        var dmg;
        if (useSkill) {
            dmg = Math.max(1, Math.floor(b.atk * 1.5 - b.pDef * 0.3 + Math.floor(Math.random() * 6) - 1));
            return { damage: dmg, skill: true, pHp: (b.pHp -= dmg) };
        }
        dmg = Math.max(1, Math.floor(b.atk - b.pDef * 0.3 + Math.floor(Math.random() * 6) - 1));
        b.pHp -= dmg;
        return { damage: dmg, pHp: b.pHp };
    },

    _giveReward: function(r) {
        Sherwood.addExp(r.exp);
        Sherwood.addResource('gold', r.gold);
        Sherwood.addResource('silver', Math.floor(r.gold * 1.5));
        Sherwood.saveGame();
    },

    flee: function() {
        if (!this._battle) return { fail: true };
        var b = this._battle;
        var chance = 40 + (b.pAgi || 0) * 0.5;
        if (Math.random() * 100 < chance) { this._battle = null; return { success: true }; }
        var dmg = Math.max(1, Math.floor(b.atk - b.pDef * 0.3));
        b.pHp -= dmg;
        if (b.pHp <= 0) { this._battle = null; return { fail: true, lose: true, damage: dmg }; }
        return { fail: true, damage: dmg, pHp: b.pHp };
    }
};

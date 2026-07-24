/**
 * Sherwood Combat — Боевое ядро с бронёй и формулами
 */

Sherwood.Combat = {
    _battle: null,
    _effects: [],
    _turn: 0,
    _hitCount: 0,
    _cooldowns: {},

    start: function(monsterId, isBoss, mode) {
        var p = Sherwood.getPlayer();
        var hp, atk, def, armor, name, img;
        img = monsterId || 'image (1).png';
        if (Sherwood.Bestiary && Sherwood.Bestiary.BEASTS && Sherwood.Bestiary.BEASTS[monsterId]) {
            var data = Sherwood.Bestiary.BEASTS[monsterId];
            name = data.name;
            hp = isBoss ? data.hp * 2 : data.hp;
            atk = data.attack || 15;
            def = data.defense || 5;
            armor = isBoss ? 40 : 15;
                } else {
            var monsterNames = {
                'image (1).png': 'Леший',
                'image (3).png': 'Проклятый олень',
                'image (74).png': 'Древесный голем',
                'image (9).png': 'Рогатый Леший',
                'image (29).png': 'Олень (Фаза тарана)',
                'image (75).png': 'Голем (Замах)',
                'image (18).png': 'Рогатый владыка Леший',
                'image (15).png': 'Проклятый титан Леший',
                'image (12).png': 'Болотный утопленник',
                'image (13).png': 'Кикимора болотная',
                'image (17).png': 'Болотный упырь',
                'image (59).png': 'Упырь (Когти)',
                'image (62).png': 'Утопленник (Мертвец недр)',
                'image (14).png': 'Костяной гигант',
                'image (16).png': 'Рогатая кикимора',
                'image (52).png': 'Кикимора (Выпад)',
                'image (53).png': 'Кикимора (Крик)',
                'image (60).png': 'Упырь (Удар)',
                'image (61).png': 'Упырь (Прыжок)',
                'image (63).png': 'Скелетный гигант',
                'image (54).png': 'Кикимора багровой ярости',
                'image (10).png': 'Трёхглавый пёс преисподней',
                'image (11).png': 'Заражённый секач',
                'image (32).png': 'Волк-оборотень',
                'image (35).png': 'Дьявольский ёж',
                'image (33).png': 'Оборотень (Ярость)',
                'image (36).png': 'Ёж (Ярость)',
                'image (49).png': 'Костяной ликантроп',
                'image (50).png': 'Ликантроп (Замах)',
                'image (37).png': 'Кристаллический ёж',
                'image (34).png': 'Волк-оборотень (Босс)'
            };
            name = monsterNames[monsterId] || 'Монстр';
            hp = isBoss ? 400 : 100 + Math.floor(Math.random() * 120);
            atk = isBoss ? 30 : 12 + Math.floor(Math.random() * 15);
            def = isBoss ? 15 : 3 + Math.floor(Math.random() * 10);
            armor = isBoss ? 40 : 10 + Math.floor(Math.random() * 20);
        }
        this._battle = {
            enemyImage: img, enemyName: name,
            enemyHp: hp, enemyMaxHp: hp,
            enemyAtk: atk, enemyDef: def,
            enemyArmor: armor, enemyMaxArmor: armor,
            isBoss: !!isBoss, mode: mode || 'dungeon',
            playerHp: p.stats.hp, playerMaxHp: p.stats.maxHp,
            playerAtk: p.stats.attack, playerDef: p.stats.defense,
            playerAgi: p.stats.agility,
            playerArmor: p.stats.defense, playerMaxArmor: p.stats.defense
        };
        this._effects = [];
        this._turn = 1;
        this._hitCount = 0;
        this._cooldowns = {};
        return { success: true };
    },

    getState: function() {
        var b = this._battle; if (!b) return null;
        return {
            enemyImage: b.enemyImage, enemyName: b.enemyName,
            enemyHp: b.enemyHp, enemyMaxHp: b.enemyMaxHp,
            enemyArmor: b.enemyArmor, enemyMaxArmor: b.enemyMaxArmor,
            playerHp: b.playerHp, playerMaxHp: b.playerMaxHp,
            playerArmor: b.playerArmor, playerMaxArmor: b.playerMaxArmor,
            isBoss: b.isBoss, turn: this._turn,
            cooldowns: Object.assign({}, this._cooldowns)
        };
    },

    isActive: function() { return !!this._battle; },

    _chargeRate: function() {
        var m = this._battle.mode;
        return (m === 'dungeon' || m === 'portal' || m === 'raid') ? 2 : 3;
    },

    _canUseSkill: function(id) { return !this._cooldowns[id] && this._hitCount >= this._chargeRate(); },

    _calcDamage: function(atk, def) {
        if (def <= 0) def = 1;
        return Math.max(1, Math.floor((atk * atk) / (atk + def)));
    },

    attack: function() {
        var b = this._battle; if (!b) return null;
        var raw = this._calcDamage(b.playerAtk, b.enemyDef);
        var crit = Math.random() * 100 < 15;
        if (crit) raw = Math.floor(raw * 1.8);
        var armDmg = Math.min(Math.floor(raw * 0.3), b.enemyArmor);
        var hpDmg = raw - armDmg;
        if (b.enemyArmor > 0) hpDmg = Math.floor(hpDmg * 0.5);
        hpDmg = Math.max(1, hpDmg);
        b.enemyArmor -= armDmg;
        b.enemyHp -= hpDmg;
        if (b.enemyHp < 0) b.enemyHp = 0;
        this._hitCount++;
        var r = { type: 'attack', damage: hpDmg, armorDmg: armDmg, crit: crit, enemyHp: b.enemyHp, enemyMaxHp: b.enemyMaxHp, enemyArmor: b.enemyArmor };
        if (b.enemyHp <= 0) { r.win = true; r.exp = b.isBoss ? 150 : 35; r.gold = b.isBoss ? 120 : 25; this._giveReward(r); this._battle = null; return r; }
        var er = this._enemyTurn(); r.enemy = er;
        if (b.playerHp <= 0) { r.lose = true; this._battle = null; }
        return r;
    },

    skill: function(id) {
        var b = this._battle; if (!b) return null;
        if (!this._canUseSkill(id)) return { fail: true };
        var skills = { power_shot: { mult: 1.8 }, triple_shot: { mult: 0.7, hits: 3 }, poison_arrow: { mult: 1.0, poison: { dmg: Math.floor(b.enemyMaxHp*0.08)+5, turns: 2 } }, stunning_shot: { mult: 0.5, stun: 1 } };
        var s = skills[id]; if (!s) return { fail: true };
        var raw = Math.floor(this._calcDamage(b.playerAtk, b.enemyDef) * s.mult);
        if (s.hits) raw = Math.floor(raw * s.hits);
        var crit = Math.random()*100 < 20; if (crit) raw = Math.floor(raw*1.8);
        var armDmg = Math.min(Math.floor(raw*0.3), b.enemyArmor);
        var hpDmg = raw - armDmg;
        if (b.enemyArmor > 0) hpDmg = Math.floor(hpDmg*0.5);
        hpDmg = Math.max(1, hpDmg);
        b.enemyArmor -= armDmg; b.enemyHp -= hpDmg;
        if (b.enemyHp < 0) b.enemyHp = 0;
        this._hitCount = 0; this._cooldowns[id] = true;
        var r = { type: 'skill', skill: id, damage: hpDmg, armorDmg: armDmg, crit: crit, enemyHp: b.enemyHp, enemyMaxHp: b.enemyMaxHp, enemyArmor: b.enemyArmor };
        if (s.poison) { this._effects.push({ target: 'enemy', type: 'poison', dmg: s.poison.dmg, turns: s.poison.turns }); r.poison = true; }
        if (s.stun) { this._effects.push({ target: 'enemy', type: 'stun', turns: s.stun }); r.stun = true; }
        if (b.enemyHp <= 0) { r.win = true; r.exp = b.isBoss?150:35; r.gold = b.isBoss?120:25; this._giveReward(r); this._battle = null; return r; }
        var er = this._enemyTurn(); r.enemy = er;
        if (b.playerHp <= 0) { r.lose = true; this._battle = null; }
        return r;
    },

    _enemyTurn: function() {
        var b = this._battle;
        for (var i = this._effects.length-1; i >= 0; i--) {
            var e = this._effects[i];
            if (e.target==='enemy' && e.type==='stun') { e.turns--; if (e.turns<=0) this._effects.splice(i,1); return { stun: true }; }
            if (e.target==='enemy' && e.type==='poison') { b.enemyHp -= e.dmg; if (b.enemyHp<0) b.enemyHp=0; e.turns--; if (e.turns<=0) this._effects.splice(i,1); return { poison: true, dmg: e.dmg }; }
        }
        var raw = this._calcDamage(b.enemyAtk, b.playerDef);
        var armDmg = Math.min(Math.floor(raw*0.3), b.playerArmor);
        var hpDmg = raw - armDmg;
        if (b.playerArmor > 0) hpDmg = Math.floor(hpDmg*0.5);
        hpDmg = Math.max(1, hpDmg);
        b.playerArmor -= armDmg; b.playerHp -= hpDmg;
        if (b.playerHp < 0) b.playerHp = 0;
        return { damage: hpDmg, armorDmg: armDmg, playerHp: b.playerHp, playerArmor: b.playerArmor };
    },

    _giveReward: function(r) {
        Sherwood.addExp(r.exp);
        Sherwood.addResource('gold', r.gold);
        Sherwood.addResource('silver', Math.floor(r.gold*1.5));
        if (Math.random() < 0.15) Sherwood.addResource('scrolls', 1 + Math.floor(Math.random()*3));
        if (Math.random() < 0.10) Sherwood.addResource('ingots', 1 + Math.floor(Math.random()*2));
        Sherwood.saveGame();
    },

    flee: function() {
        if (!this._battle) return { fail: true };
        var b = this._battle;
        if (Math.random()*100 < 40 + (b.playerAgi||0)*0.5) { this._battle = null; return { success: true }; }
        var raw = this._calcDamage(b.enemyAtk, b.playerDef);
        var armDmg = Math.min(Math.floor(raw*0.3), b.playerArmor);
        var hpDmg = raw - armDmg;
        if (b.playerArmor > 0) hpDmg = Math.floor(hpDmg*0.5);
        hpDmg = Math.max(1, hpDmg);
        b.playerArmor -= armDmg; b.playerHp -= hpDmg;
        if (b.playerHp <= 0) { this._battle = null; return { fail: true, lose: true, damage: hpDmg }; }
        return { fail: true, damage: hpDmg };
    }
};

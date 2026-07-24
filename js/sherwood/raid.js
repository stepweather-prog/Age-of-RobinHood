Sherwood.Raid = {
    _raidActive: false,
    _raidBoss: null,
    _participants: [],
    _maxParticipants: 10,
    _raidsToday: 0,
    _maxRaidsPerDay: 3,
    _currentStage: 0,
    _totalStages: 3,

    RAID_BOSSES: [
        {
            id: 'sherwood_abomination',
            name: 'Шервудское Отродье',
            image: 'image (2).png',
            hp: 15000, maxHp: 15000,
            attack: 200, defense: 100,
            exp: 2000, gold: 1500,
            stages: [
                { name: 'Элиты подземок', enemies: [
                    { name: 'Проклятый титан', image: 'image (15).png', hp: 2000, maxHp: 2000, attack: 80, defense: 40 },
                    { name: 'Костяной гигант', image: 'image (14).png', hp: 2200, maxHp: 2200, attack: 85, defense: 45 },
                    { name: 'Кристаллический ёж', image: 'image (37).png', hp: 2500, maxHp: 2500, attack: 90, defense: 50 }
                ]},
                { name: 'Боссы квестов', enemies: [
                    { name: 'Лесное Лихо', image: 'image (46).png', hp: 3500, maxHp: 3500, attack: 110, defense: 60 },
                    { name: 'Проклятый Король', image: 'image (44).png', hp: 4000, maxHp: 4000, attack: 130, defense: 70 }
                ]},
                { name: 'Мировой босс', enemies: [
                    { name: 'Шервудское Отродье', image: 'image (2).png', hp: 15000, maxHp: 15000, attack: 200, defense: 100, isRaidBoss: true }
                ]}
            ]
        }
    ],

    init: function() {
        var p = Sherwood.getPlayer();
        if (!p.raid) p.raid = { raidsToday: 0, lastRaidDate: new Date().toDateString() };
        var today = new Date().toDateString();
        if (p.raid.lastRaidDate !== today) { p.raid.raidsToday = 0; p.raid.lastRaidDate = today; }
        this._raidsToday = p.raid.raidsToday || 0;
    },

    getAvailableRaids: function() { return this.RAID_BOSSES; },

    canJoinRaid: function() {
        var p = Sherwood.getPlayer();
        var today = new Date().toDateString();
        if (p.raid.lastRaidDate !== today) { p.raid.raidsToday = 0; p.raid.lastRaidDate = today; }
        if ((p.raid.raidsToday || 0) >= this._maxRaidsPerDay) return { can: false, reason: 'Лимит рейдов на сегодня (3/3)' };
        return { can: true };
    },

    startRaid: function(bossIndex) {
        var check = this.canJoinRaid();
        if (!check.can) return check;
        var bossTemplate = this.RAID_BOSSES[bossIndex || 0];
        this._raidBoss = JSON.parse(JSON.stringify(bossTemplate));
        this._raidActive = true;
        this._participants = [Sherwood.getPlayer().name];
        this._currentStage = 0;
        var p = Sherwood.getPlayer();
        p.raid.raidsToday = (p.raid.raidsToday || 0) + 1;
        Sherwood.saveGame();
        return { success: true, boss: this._raidBoss, currentStage: this._raidBoss.stages[0], stageIndex: 1, totalStages: this._totalStages };
    },

    getRaidStatus: function() {
        if (!this._raidActive || !this._raidBoss) return null;
        return { boss: this._raidBoss, stage: this._raidBoss.stages[this._currentStage], stageIndex: this._currentStage + 1, totalStages: this._totalStages, participants: this._participants };
    },

    getCurrentEnemy: function() {
        if (!this._raidActive || !this._raidBoss) return null;
        var stage = this._raidBoss.stages[this._currentStage];
        for (var i = 0; i < stage.enemies.length; i++) { if (stage.enemies[i].hp > 0) return stage.enemies[i]; }
        return null;
    },

    raidAttack: function() {
        if (!this._raidActive || !this._raidBoss) return null;
        var enemy = this.getCurrentEnemy();
        if (!enemy) return { stageComplete: true };
        var p = Sherwood.getPlayer();
        var dmg = Math.max(1, Math.floor((p.stats.attack * p.stats.attack) / (p.stats.attack + (enemy.defense || 10))));
        var crit = Math.random() * 100 < 15; if (crit) dmg = Math.floor(dmg * 1.8);
        enemy.hp -= dmg; if (enemy.hp < 0) enemy.hp = 0;
        var result = { damage: dmg, crit: crit, enemyHp: enemy.hp, enemyMaxHp: enemy.maxHp, enemyName: enemy.name, enemyImage: enemy.image, enemyDead: enemy.hp <= 0 };
        if (enemy.hp <= 0) {
            var stage = this._raidBoss.stages[this._currentStage];
            var allDead = stage.enemies.every(function(e) { return e.hp <= 0; });
            if (allDead) {
                this._currentStage++;
                if (this._currentStage >= this._totalStages) {
                    var boss = this._raidBoss;
                    var totalExp = boss.exp + Math.floor(Math.random() * 500);
                    var totalGold = boss.gold + Math.floor(Math.random() * 300);
                    Sherwood.addExp(totalExp); Sherwood.addResource('gold', totalGold); Sherwood.addResource('silver', totalGold * 3);
                    this._raidActive = false; this._raidBoss = null;
                    result.raidComplete = true; result.rewards = { exp: totalExp, gold: totalGold, silver: totalGold * 3 };
                    return result;
                }
                result.stageComplete = true;
                result.nextStage = this._raidBoss.stages[this._currentStage];
            }
        } else {
            var edmg = Math.max(1, Math.floor((enemy.attack * enemy.attack) / (enemy.attack + p.stats.defense)));
            p.stats.hp = Math.max(0, p.stats.hp - edmg);
            result.enemyDamage = edmg; result.playerHp = p.stats.hp;
            if (p.stats.hp <= 0) { p.stats.hp = 1; result.playerDead = true; }
        }
        Sherwood.saveGame();
        return result;
    },

    fleeRaid: function() { this._raidActive = false; this._raidBoss = null; return { success: true }; },
    isRaidActive: function() { return this._raidActive; }
};

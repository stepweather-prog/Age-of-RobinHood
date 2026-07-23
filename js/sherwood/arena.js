/**
 * Sherwood Arena — PvP Арена
 */

Sherwood.Arena = {
    _opponents: [],
    _currentOpponent: null,
    _inMatch: false,
    _wins: 0,
    _losses: 0,
    _rank: 'Новичок',

    RANKS: ['Новичок', 'Боец', 'Ветеран', 'Мастер', 'Чемпион', 'Легенда'],
    RANK_THRESHOLDS: [0, 10, 30, 60, 100, 200],

    init: function() {
        const player = Sherwood.getPlayer();
        if (!player.arena) {
            player.arena = { wins: 0, losses: 0, rank: 'Новичок' };
        }
        this._wins = player.arena.wins || 0;
        this._losses = player.arena.losses || 0;
        this._rank = player.arena.rank || 'Новичок';
        this._generateOpponents();
    },

    _generateOpponents: function() {
        this._opponents = [];
        const player = Sherwood.getPlayer();
        for (let i = 0; i < 5; i++) {
            const diff = Math.floor(Math.random() * 20) - 10;
            const attack = Math.max(10, player.stats.attack + diff);
            const defense = Math.max(5, player.stats.defense + Math.floor(diff / 2));
            const hp = Math.max(50, player.stats.maxHp + diff * 5);
            
            this._opponents.push({
                id: i,
                name: 'Игрок_' + Math.floor(Math.random() * 1000),
                skin: 'assets/hero_skins/skin_' + Math.min(15, Math.floor(Math.random() * 15) + 1) + '.png',
                stats: { attack: attack, defense: defense, hp: hp, maxHp: hp },
                reward: { exp: 40 + Math.abs(diff) * 3, gold: 20 + Math.abs(diff) * 2 }
            });
        }
    },

    getOpponents: function() {
        return this._opponents;
    },

    getStats: function() {
        return {
            wins: this._wins,
            losses: this._losses,
            rank: this._rank,
            nextRank: this.RANKS[Math.min(this.RANKS.indexOf(this._rank) + 1, this.RANKS.length - 1)],
            progress: this._wins % 10
        };
    },

    startMatch: function(opponentIndex) {
        if (this._inMatch) return { success: false, reason: 'Уже в бою' };
        if (opponentIndex < 0 || opponentIndex >= this._opponents.length) return { success: false, reason: 'Противник не найден' };
        
        this._currentOpponent = { ...this._opponents[opponentIndex] };
        this._inMatch = true;
        
        return { success: true, opponent: this._currentOpponent };
    },

    getCurrentMatch: function() {
        if (!this._inMatch) return null;
        return {
            opponent: this._currentOpponent,
            player: Sherwood.getPlayer()
        };
    },

    arenaAttack: function() {
        if (!this._inMatch || !this._currentOpponent) return null;
        
        const player = Sherwood.getPlayer();
        const opp = this._currentOpponent;
        
        const playerDamage = Math.max(1, player.stats.attack - opp.stats.defense + Math.floor(Math.random() * 15));
        opp.stats.hp -= playerDamage;
        
        const result = {
            playerDamage: playerDamage,
            opponentHp: Math.max(0, opp.stats.hp),
            opponentMaxHp: opp.stats.maxHp,
            opponentDead: opp.stats.hp <= 0
        };
        
        if (opp.stats.hp <= 0) {
            return this._winMatch(result);
        }
        
        const oppDamage = Math.max(1, opp.stats.attack - player.stats.defense + Math.floor(Math.random() * 15));
        player.stats.hp = Math.max(0, player.stats.hp - oppDamage);
        result.opponentDamage = oppDamage;
        result.playerHp = player.stats.hp;
        result.playerDead = player.stats.hp <= 0;
        
        if (player.stats.hp <= 0) {
            return this._loseMatch(result);
        }
        
        Sherwood.saveGame();
        return result;
    },

    _winMatch: function(result) {
        this._wins++;
        const reward = this._currentOpponent.reward;
        Sherwood.addExp(reward.exp);
        Sherwood.addResource('gold', reward.gold);
        
        this._updateRank();
        this._inMatch = false;
        
        const player = Sherwood.getPlayer();
        player.arena.wins = this._wins;
        player.arena.rank = this._rank;
        player.stats.hp = player.stats.maxHp;
        Sherwood.saveGame();
        
        result.win = true;
        result.rewards = reward;
        result.newRank = this._rank;
        return result;
    },

    _loseMatch: function(result) {
        this._losses++;
        this._inMatch = false;
        
        const player = Sherwood.getPlayer();
        player.arena.losses = this._losses;
        player.stats.hp = Math.max(1, Math.floor(player.stats.maxHp * 0.2));
        Sherwood.saveGame();
        
        result.win = false;
        return result;
    },

    _updateRank: function() {
        for (let i = this.RANK_THRESHOLDS.length - 1; i >= 0; i--) {
            if (this._wins >= this.RANK_THRESHOLDS[i]) {
                this._rank = this.RANKS[i];
                break;
            }
        }
    },

    fleeMatch: function() {
        if (!this._inMatch) return { success: false };
        this._losses++;
        this._inMatch = false;
        this._currentOpponent = null;
        return this._loseMatch({});
    },

    refreshOpponents: function() {
        this._generateOpponents();
        return { success: true };
    },

    isInMatch: function() {
        return this._inMatch;
    }
};

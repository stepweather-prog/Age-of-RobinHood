/**
 * Sherwood Combat — Боевая система (заглушка)
 */

Sherwood.Combat = {
    _battle: null,

    startPvE(monsterId) {
        console.log('⚔️ Бой с монстром:', monsterId);
        this._battle = {
            monsterId: monsterId,
            status: 'active',
            turn: 'player'
        };
        return this._battle;
    },

    getBattle() {
        return this._battle;
    },

    endBattle() {
        this._battle = null;
    },

    playerAttack() {
        if (!this._battle) return null;
        const damage = Math.floor(Math.random() * 50) + 20;
        console.log('⚔️ Урон:', damage);
        return { damage, crit: Math.random() > 0.8 };
    },

    flee() {
        if (!this._battle) return false;
        console.log('🏃 Бегство');
        this._battle = null;
        return true;
    },

    _getPlayerSkills() {
        return {};
    },

    playerUseSkill(skillId) {
        console.log('🎯 Скилл:', skillId);
        return { damage: Math.floor(Math.random() * 80) + 40, crit: Math.random() > 0.7 };
    },

    on(event, callback) {
        // Заглушка для событий
    },

    once(event, callback) {
        // Заглушка для событий
    }
};

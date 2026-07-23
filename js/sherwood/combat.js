/**
 * Sherwood Combat — Боевая система
 * Пошаговые бои для подземок, порталов, рейдов
 */

Sherwood.Combat = {
    // ============================================================
    //  СОСТОЯНИЕ БОЯ
    // ============================================================

    _battle: null,
    _inBattle: false,
    _turn: 'player', // 'player' | 'enemy'
    _turnCount: 0,
    _battleLog: [],
    _skillCooldowns: {},

    // ============================================================
    //  КОНСТАНТЫ МОНСТРОВ ПО ТИПУ ПОДЗЕМКИ
    // ============================================================

    MONSTER_STATS: {
        // Лесные мобы
        'image (1).png': { name: 'Леший', hp: 120, attack: 18, defense: 6, exp: 35, gold: 25 },
        'image (3).png': { name: 'Проклятый олень', hp: 100, attack: 15, defense: 4, exp: 30, gold: 20 },
        'image (74).png': { name: 'Древесный голем', hp: 160, attack: 22, defense: 12, exp: 45, gold: 35 },
        'image (9).png': { name: 'Рогатый Леший', hp: 200, attack: 26, defense: 14, exp: 55, gold: 45 },
        'image (29).png': { name: 'Олень (Фаза тарана)', hp: 180, attack: 28, defense: 8, exp: 50, gold: 40 },
        'image (75).png': { name: 'Голем (Замах)', hp: 220, attack: 30, defense: 16, exp: 60, gold: 50 },
        'image (18).png': { name: 'Рогатый владыка Леший', hp: 280, attack: 35, defense: 18, exp: 75, gold: 60 },
        'image (15).png': { name: 'Проклятый титан Леший', hp: 400, attack: 45, defense: 22, exp: 150, gold: 120, isBoss: true },

        // Болотные мобы
        'image (12).png': { name: 'Болотный утопленник', hp: 140, attack: 20, defense: 8, exp: 40, gold: 30 },
        'image (13).png': { name: 'Кикимора болотная', hp: 160, attack: 24, defense: 10, exp: 50, gold: 40 },
        'image (17).png': { name: 'Болотный упырь', hp: 180, attack: 28, defense: 12, exp: 55, gold: 45 },
        'image (59).png': { name: 'Упырь (Когти)', hp: 200, attack: 32, defense: 14, exp: 65, gold: 50 },
        'image (62).png': { name: 'Утопленник (Мертвец недр)', hp: 240, attack: 34, defense: 16, exp: 70, gold: 55 },
        'image (14).png': { name: 'Костяной гигант', hp: 280, attack: 38, defense: 20, exp: 80, gold: 65 },
        'image (16).png': { name: 'Рогатая кикимора', hp: 260, attack: 36, defense: 18, exp: 75, gold: 60 },
        'image (52).png': { name: 'Кикимора (Выпад)', hp: 220, attack: 40, defense: 12, exp: 70, gold: 55 },
        'image (53).png': { name: 'Кикимора (Крик)', hp: 200, attack: 30, defense: 10, exp: 60, gold: 50 },
        'image (60).png': { name: 'Упырь (Удар)', hp: 240, attack: 36, defense: 14, exp: 75, gold: 60 },
        'image (61).png': { name: 'Упырь (Прыжок)', hp: 230, attack: 42, defense: 10, exp: 70, gold: 55 },
        'image (63).png': { name: 'Скелетный гигант', hp: 320, attack: 44, defense: 24, exp: 100, gold: 80 },
        'image (54).png': { name: 'Кикимора багровой ярости', hp: 500, attack: 52, defense: 26, exp: 200, gold: 160, isBoss: true },

        // Пещерные мобы
        'image (10).png': { name: 'Трёхглавый пёс', hp: 200, attack: 30, defense: 14, exp: 60, gold: 50 },
        'image (11).png': { name: 'Заражённый секач', hp: 240, attack: 34, defense: 16, exp: 70, gold: 55 },
        'image (32).png': { name: 'Волк-оборотень', hp: 180, attack: 26, defense: 10, exp: 50, gold: 40 },
        'image (35).png': { name: 'Дьявольский ёж', hp: 160, attack: 22, defense: 18, exp: 45, gold: 35 },
        'image (33).png': { name: 'Оборотень (Ярость)', hp: 260, attack: 38, defense: 14, exp: 75, gold: 60 },
        'image (36).png': { name: 'Ёж (Ярость)', hp: 240, attack: 32, defense: 22, exp: 70, gold: 55 },
        'image (49).png': { name: 'Костяной ликантроп', hp: 300, attack: 42, defense: 20, exp: 90, gold: 75 },
        'image (50).png': { name: 'Ликантроп (Замах)', hp: 320, attack: 46, defense: 22, exp: 100, gold: 80 },
        'image (37).png': { name: 'Кристаллический ёж', hp: 360, attack: 40, defense: 30, exp: 120, gold: 100 },
        'image (34).png': { name: 'Волк-оборотень (Босс)', hp: 600, attack: 58, defense: 28, exp: 250, gold: 200, isBoss: true }
    },

    // ============================================================
    //  НАЧАЛО БОЯ
    // ============================================================

    startBattle: function(monsterId, isBoss, dungeonId) {
        const monsterData = this.MONSTER_STATS[monsterId];
        if (!monsterData) {
            console.warn('⚠️ Монстр не найден в базе:', monsterId);
            return { success: false, reason: 'monster_not_found' };
        }

        const player = Sherwood.getPlayer();

        // Сбрасываем кулдауны навыков
        this._skillCooldowns = {};

        this._battle = {
            monsterId: monsterId,
            monsterImage: monsterId,
            monsterName: monsterData.name,
            monsterHp: monsterData.hp,
            monsterMaxHp: monsterData.hp,
            monsterAttack: monsterData.attack,
            monsterDefense: monsterData.defense,
            monsterExp: monsterData.exp,
            monsterGold: monsterData.gold,
            isBoss: isBoss || monsterData.isBoss || false,
            dungeonId: dungeonId || 'forest',
            playerHp: player.stats.hp,
            playerMaxHp: player.stats.maxHp,
            playerAttack: player.stats.attack,
            playerDefense: player.stats.defense,
            playerAgility: player.stats.agility
        };

        this._inBattle = true;
        this._turn = 'player';
        this._turnCount = 0;
        this._battleLog = [];

        return { success: true, battle: this._battle };
    },

    getBattle: function() {
        return this._inBattle ? this._battle : null;
    },

    isInBattle: function() {
        return this._inBattle;
    },

    // ============================================================
    //  АТАКА ИГРОКА
    // ============================================================

    playerAttack: function() {
        if (!this._inBattle || this._turn !== 'player') {
            return { success: false, reason: 'Не ваш ход' };
        }

        const b = this._battle;
        this._turnCount++;

        // Базовый урон
        let damage = b.playerAttack;

        // Шанс крита от ловкости
        const critChance = Math.min(b.playerAgility * 0.3, 50);
        const isCrit = Math.random() * 100 < critChance;
        if (isCrit) {
            damage = Math.floor(damage * 1.8);
        }

        // Пробитие брони
        const actualDamage = Math.max(1, damage - b.monsterDefense);
        b.monsterHp = Math.max(0, b.monsterHp - actualDamage);

        const logEntry = {
            turn: this._turnCount,
            action: 'attack',
            damage: actualDamage,
            isCrit: isCrit,
            monsterHp: b.monsterHp
        };
        this._battleLog.push(logEntry);

        const result = {
            success: true,
            damage: actualDamage,
            isCrit: isCrit,
            monsterName: b.monsterName,
            monsterHp: b.monsterHp,
            monsterMaxHp: b.monsterMaxHp,
            monsterDead: b.monsterHp <= 0
        };

        if (b.monsterHp <= 0) {
            return this._endBattle(true);
        }

        // Ход врага
        this._turn = 'enemy';
        const enemyResult = this._enemyTurn();
        this._turn = 'player';

        result.enemyDamage = enemyResult.damage;
        result.playerHp = b.playerHp;
        result.playerDead = enemyResult.playerDead;

        return result;
    },

    // ============================================================
    //  НАВЫКИ
    // ============================================================

    useSkill: function(skillId) {
        if (!this._inBattle || this._turn !== 'player') {
            return { success: false, reason: 'Не ваш ход' };
        }

        // Проверка кулдауна
        if (this._skillCooldowns[skillId] && this._skillCooldowns[skillId] > 0) {
            return { success: false, reason: 'Навык перезаряжается', cooldown: this._skillCooldowns[skillId] };
        }

        const skillConfig = Sherwood.SkillConfig && Sherwood.SkillConfig[skillId];
        if (!skillConfig) {
            return { success: false, reason: 'Навык не найден' };
        }

        const b = this._battle;
        this._turnCount++;

        // Урон навыка
        let damage = Math.floor(b.playerAttack * skillConfig.damageMultiplier);

        // Шанс крита
        const critChance = Math.min(b.playerAgility * 0.3, 50);
        const isCrit = Math.random() * 100 < critChance;
        if (isCrit) {
            damage = Math.floor(damage * 1.5);
        }

        const actualDamage = Math.max(1, damage - b.monsterDefense);
        b.monsterHp = Math.max(0, b.monsterHp - actualDamage);

        // Кулдаун
        this._skillCooldowns[skillId] = skillConfig.cooldown;

        const logEntry = {
            turn: this._turnCount,
            action: 'skill',
            skillId: skillId,
            skillName: skillConfig.name,
            damage: actualDamage,
            isCrit: isCrit,
            monsterHp: b.monsterHp
        };
        this._battleLog.push(logEntry);

        const result = {
            success: true,
            skillId: skillId,
            skillName: skillConfig.name,
            damage: actualDamage,
            isCrit: isCrit,
            monsterName: b.monsterName,
            monsterHp: b.monsterHp,
            monsterMaxHp: b.monsterMaxHp,
            monsterDead: b.monsterHp <= 0,
            cooldown: skillConfig.cooldown
        };

        if (b.monsterHp <= 0) {
            return this._endBattle(true);
        }

        // Ход врага
        this._turn = 'enemy';
        const enemyResult = this._enemyTurn();
        this._turn = 'player';

        result.enemyDamage = enemyResult.damage;
        result.playerHp = b.playerHp;
        result.playerDead = enemyResult.playerDead;

        // Уменьшаем кулдауны
        this._tickCooldowns();

        return result;
    },

    /**
     * Ход врага
     */
    _enemyTurn: function() {
        const b = this._battle;
        let damage = b.monsterAttack;

        // Шанс сильной атаки (15%)
        const isStrong = Math.random() < 0.15;
        if (isStrong) {
            damage = Math.floor(damage * 1.5);
        }

        const actualDamage = Math.max(1, damage - b.playerDefense);
        b.playerHp = Math.max(0, b.playerHp - actualDamage);

        return {
            damage: actualDamage,
            isStrong: isStrong,
            playerHp: b.playerHp,
            playerDead: b.playerHp <= 0
        };
    },

    /**
     * Уменьшение кулдаунов навыков
     */
    _tickCooldowns: function() {
        for (const key in this._skillCooldowns) {
            if (this._skillCooldowns[key] > 0) {
                this._skillCooldowns[key]--;
            }
        }
    },

    // ============================================================
    //  ЗАВЕРШЕНИЕ БОЯ
    // ============================================================

    _endBattle: function(victory) {
        const b = this._battle;
        const player = Sherwood.getPlayer();

        if (victory) {
            // Награды
            Sherwood.addExp(b.monsterExp);
            Sherwood.addResource('gold', b.monsterGold);
            Sherwood.addResource('silver', Math.floor(b.monsterGold * 1.5));

            // Шанс дропа предмета (20%)
            let droppedItem = null;
            if (Math.random() < 0.2) {
                droppedItem = this._generateLoot(b);
                if (droppedItem && Sherwood.Bag && Sherwood.Bag.addItem) {
                    Sherwood.Bag.addItem(droppedItem);
                }
            }

            player.stats.hp = b.playerHp;
            Sherwood.saveGame();

            this._inBattle = false;
            const battleData = { ...this._battle };
            this._battle = null;

            return {
                victory: true,
                exp: b.monsterExp,
                gold: b.monsterGold,
                silver: Math.floor(b.monsterGold * 1.5),
                playerHp: b.playerHp,
                droppedItem: droppedItem,
                battle: battleData
            };
        } else {
            // Поражение
            player.stats.hp = Math.max(1, Math.floor(player.stats.maxHp * 0.1));
            Sherwood.saveGame();

            this._inBattle = false;
            this._battle = null;

            return {
                victory: false,
                playerHp: player.stats.hp
            };
        }
    },

    /**
     * Генерация случайного лута
     */
    _generateLoot: function(battle) {
        const grades = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'epic'];
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const gradeColors = Sherwood.GradeColors || {};
        const gradeColor = gradeColors[grade] || '#9d9d9d';

        const prefixes = {
            common: 'Простой',
            uncommon: 'Усиленный',
            rare: 'Редкий',
            epic: 'Эпический',
            legendary: 'Легендарный'
        };

        const parts = ['weapon1', 'torso', 'head', 'hands', 'legs', 'feet', 'belt'];
        const part = parts[Math.floor(Math.random() * parts.length)];
        const partNames = {
            weapon1: 'Лук',
            torso: 'Нагрудник',
            head: 'Шлем',
            hands: 'Перчатки',
            legs: 'Поножи',
            feet: 'Сапоги',
            belt: 'Пояс'
        };

        const gradeMultiplier = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 };
        const mult = gradeMultiplier[grade] || 1;

        return {
            id: 'loot_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: prefixes[grade] + ' ' + partNames[part],
            icon: 'assets/interface/labyrinth_of_icons.png',
            part: part,
            grade: grade,
            type: 'equipment',
            stats: {
                attack: Math.floor(Math.random() * 5 * mult) + mult,
                defense: Math.floor(Math.random() * 3 * mult) + mult,
                hp: Math.floor(Math.random() * 10 * mult) + mult * 5
            },
            sellPrice: 5 * mult
        };
    },

    // ============================================================
    //  ИСПОЛЬЗОВАНИЕ ЗЕЛЬЯ
    // ============================================================

    usePotion: function() {
        if (!this._inBattle || this._turn !== 'player') {
            return { success: false, reason: 'Нельзя сейчас' };
        }

        const player = Sherwood.getPlayer();
        const healAmount = Math.floor(player.stats.maxHp * 0.3);
        this._battle.playerHp = Math.min(this._battle.playerMaxHp, this._battle.playerHp + healAmount);

        // Ход врага после зелья
        this._turn = 'enemy';
        const enemyResult = this._enemyTurn();
        this._turn = 'player';

        return {
            success: true,
            healAmount: healAmount,
            playerHp: this._battle.playerHp,
            enemyDamage: enemyResult.damage,
            playerDead: enemyResult.playerDead
        };
    },

    // ============================================================
    //  БЕГСТВО
    // ============================================================

    flee: function() {
        if (!this._inBattle) return { success: false, reason: 'Нет боя' };

        // Шанс побега 60%
        const fleeChance = 60;
        const success = Math.random() * 100 < fleeChance;

        if (success) {
            this._inBattle = false;
            this._battle = null;
            return { success: true, fled: true };
        } else {
            // Ход врага при провале
            this._turn = 'enemy';
            const enemyResult = this._enemyTurn();
            this._turn = 'player';

            return {
                success: false,
                fled: false,
                enemyDamage: enemyResult.damage,
                playerHp: this._battle.playerHp,
                playerDead: enemyResult.playerDead
            };
        }
    },

    // ============================================================
    //  КУЛДАУНЫ ДЛЯ UI
    // ============================================================

    getCooldowns: function() {
        return { ...this._skillCooldowns };
    },

    getBattleLog: function() {
        return [...this._battleLog];
    }
};

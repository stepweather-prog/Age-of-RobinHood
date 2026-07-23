Sherwood.Quests = {
    _currentChapter: null,
    _currentStage: 0,
    _currentEnemy: null,
    _inBattle: false,
    _attemptsToday: 0,
    _lastAttempt: 0,
    _freeAccelUsed: false,

    CHAPTERS: [
        {
            id: 1, name: 'Проклятие Зелёного Сердца',
            lore: 'Шервудский лес отравлен. Из расколотых недр хлынула сизая порча. Первыми жертвами стали рудокопы — их раздувшиеся тела намертво обвил неоновый мох.',
            boss: { name: 'Лесное Лихо', image: 'image (46).png', hp: 400, atk: 28, def: 15, exp: 150, gold: 100 },
            stages: 5,
            energyCost: 5
        },
        {
            id: 2, name: 'Чёрный орден',
            lore: 'Древний Орден Следопытов спустился под землю, чтобы сдержать безумие. На месте тектонического разлома они вымостили Базальтовую доску — но магия проклятия обратила их замысел против них самих.',
            boss: { name: 'Разъярённое Лихо', image: 'image (47).png', hp: 550, atk: 35, def: 18, exp: 200, gold: 130 },
            stages: 5,
            energyCost: 6
        },
        {
            id: 3, name: 'Рождение Охотника',
            lore: 'Шериф бросил войска и запечатал ворота подземки. Один из лучших стрелков Ордена потерял отряд, но поклялся не возвращаться на поверхность, пока Шервуд не будет очищен.',
            boss: { name: 'Хозяин чащи', image: 'image (19).png', hp: 700, atk: 42, def: 22, exp: 250, gold: 160 },
            stages: 5,
            energyCost: 7
        },
        {
            id: 4, name: 'Бестии Смертной Чащи',
            lore: 'Скверна перекинулась на фауну. Некогда благородные волки превратились в чудовищ с пульсирующими бирюзовыми венами. Из глубин поднялись рогатые жабы размером с быка.',
            boss: { name: 'Призрак Ордена', image: 'image (41).png', hp: 850, atk: 48, def: 25, exp: 300, gold: 200 },
            stages: 5,
            energyCost: 8
        },
        {
            id: 5, name: 'Шепот Тёмного Лешего',
            lore: 'Леший — вековой хранитель Шервуда — ослеп от ярости. Его тело срослось с чёрной корой и острыми камнями. Ему присягнуло Лесное Лихо — костлявое одноглазое существо с руками-серпами.',
            boss: { name: 'Фантомный дух', image: 'image (42).png', hp: 1000, atk: 55, def: 28, exp: 350, gold: 250 },
            stages: 5,
            energyCost: 9
        },
        {
            id: 6, name: 'Твари Искажённой Эволюции',
            lore: 'В кромешной тьме затопленных гротов зародились новые формы жизни. Ненасытный тритон — слепая саламандра-мутант с пастью, забитой игольчатыми зубами.',
            boss: { name: 'Химера корней', image: 'image (20).png', hp: 1200, atk: 62, def: 32, exp: 400, gold: 300 },
            stages: 5,
            energyCost: 10
        },
        {
            id: 7, name: 'Эхо Прошлых Сражений',
            lore: 'Подземка поглощала не только плоть, но и души. Погибшие карательные отряды Шерифа воплотились в Одичалых духов — агрессивные сгустки чёрного дыма и ярости.',
            boss: { name: 'Кислотный Кошмар', image: 'image (27).png', hp: 1400, atk: 70, def: 35, exp: 450, gold: 350 },
            stages: 5,
            energyCost: 11
        },
        {
            id: 8, name: 'Ужас Болотных Недр',
            lore: 'В покрытых слизью пещерах зародилась Кикимора болотная — длиннорукое паукообразное существо. А Шервудский падальщик — химера с разорванной пастью гиены — стал вершиной мерзости.',
            boss: { name: 'Очи Алтаря', image: 'image (5).png', hp: 1600, atk: 78, def: 38, exp: 500, gold: 400 },
            stages: 5,
            energyCost: 12
        },
        {
            id: 9, name: 'Первые Трофеи',
            lore: 'Охотник научился использовать остатки тварей. Из прочной кожи болотных бестий он создал Синий комплект Следопыта. В лагере разбойников появилась Тайная Таверна.',
            boss: { name: 'Пожиратель душ', image: 'image (38).png', hp: 1800, atk: 86, def: 42, exp: 550, gold: 450 },
            stages: 5,
            energyCost: 13
        },
        {
            id: 10, name: 'Открытие Порталов',
            lore: 'Скверна достигла критической точки и прожгла ткань реальности. Открылись три гигантских магических разлома. Мир игры разделился — обычные туннели стали детской сказкой.',
            boss: { name: 'Извергатель ярости', image: 'image (39).png', hp: 2000, atk: 95, def: 46, exp: 600, gold: 500 },
            stages: 5,
            energyCost: 14
        },
        {
            id: 11, name: 'Королева Короедов',
            lore: 'Из Портала Нашествия вышла Матка Лесных Короедов — колоссальная инсектоидная королева с панцирем, усыпанным сотнями моргающих глаз.',
            boss: { name: 'Топор Палача', image: 'image (31).png', hp: 2300, atk: 105, def: 50, exp: 700, gold: 600 },
            stages: 5,
            energyCost: 15
        },
        {
            id: 12, name: 'Призрачный Король',
            lore: 'Второй портал перенёс Охотника в проклятый склеп. В центре зала восседал Проклятый Король Разбойников — его тело заменил клубок из сотен склизких языков.',
            boss: { name: 'Проклятый Король', image: 'image (44).png', hp: 2600, atk: 115, def: 55, exp: 800, gold: 700 },
            stages: 5,
            energyCost: 16
        },
        {
            id: 13, name: 'Хранитель Склепа',
            lore: 'Третий портал вёл в хтоническое капище. Деревья кровоточили, из коры росли человеческие глаза. Древний Хранитель — титан из чёрного дуба с сердцем-опухолью.',
            boss: { name: 'Безумие Короны', image: 'image (45).png', hp: 3000, atk: 130, def: 60, exp: 900, gold: 800 },
            stages: 5,
            energyCost: 17
        },
        {
            id: 14, name: 'Пробуждение Отродья',
            lore: 'Три портала слились воедино. Из разлома поднялся ультимативный бог хаоса — Шервудское Отродье. Колоссальный многорукий титан в базальте и осквернённом золоте.',
            boss: { name: 'Мясной инсектоид', image: 'image (55).png', hp: 3500, atk: 145, def: 68, exp: 1000, gold: 900 },
            stages: 5,
            energyCost: 18
        },
        {
            id: 15, name: 'Доспех Вечности',
            lore: 'Финальная битва за Шервуд. Только объединившись, игроки смогут сокрушить Отродье. Из осколков его оружия создадут Доспех Вечности.',
            boss: { name: 'Джаггернаут', image: 'image (79).png', hp: 4500, atk: 170, def: 80, exp: 1500, gold: 1200 },
            stages: 5,
            energyCost: 20
        }
    ],

    init: function() {
        var p = Sherwood.getPlayer();
        if (!p.questProgress) p.questProgress = { completed: [], currentChapter: 1 };
        if (!p.questEnergy) p.questEnergy = { current: 50, max: 50 };
        if (!p.questAttempts) p.questAttempts = { today: 0, lastDate: '', freeAccel: false };
        var today = new Date().toDateString();
        if (p.questAttempts.lastDate !== today) { p.questAttempts.today = 0; p.questAttempts.lastDate = today; p.questAttempts.freeAccel = false; }
        this._attemptsToday = p.questAttempts.today || 0;
        this._freeAccelUsed = p.questAttempts.freeAccel || false;
    },

    getChapter: function(id) { return this.CHAPTERS.find(function(c) { return c.id === id; }) || null; },
    getAllChapters: function() { return this.CHAPTERS; },
    getProgress: function() { return Sherwood.getPlayer().questProgress; },
    isUnlocked: function(id) { if (id === 1) return true; var p = Sherwood.getPlayer(); return p.questProgress.completed.indexOf(id - 1) !== -1; },
    getEnergy: function() { return Sherwood.getPlayer().questEnergy || { current: 50, max: 50 }; },

    isOnCooldown: function() { return Date.now() - this._lastAttempt < 30 * 60 * 1000; },
    getCooldownRemaining: function() { var r = 30 * 60 * 1000 - (Date.now() - this._lastAttempt); return r <= 0 ? 0 : Math.ceil(r / 60000); },

    getAccelCost: function() {
        var p = Sherwood.getPlayer();
        var used = p.questAttempts ? (p.questAttempts.accelUsed || 0) : 0;
        if (used === 0 && !this._freeAccelUsed) return { cost: 0, currency: 'free' };
        var costs = [30, 60, 100, 150, 220, 300];
        var idx = Math.min(used - (this._freeAccelUsed ? 0 : 1), costs.length - 1);
        if (idx < 0) idx = 0;
        return { cost: costs[idx], currency: 'gold' };
    },

    accelerate: function() {
        if (!this.isOnCooldown()) return { success: false, reason: 'Нет перезарядки' };
        var info = this.getAccelCost();
        var p = Sherwood.getPlayer();
        if (info.currency === 'free') {
            this._freeAccelUsed = true;
            p.questAttempts.freeAccel = true;
        } else {
            if ((p.resources.gold || 0) < info.cost) return { success: false, reason: 'Недостаточно золота' };
            p.resources.gold -= info.cost;
            p.questAttempts.accelUsed = (p.questAttempts.accelUsed || 0) + 1;
        }
        this._lastAttempt = 0;
        p.questAttempts.lastAttempt = 0;
        Sherwood.saveGame();
        return { success: true };
    },

    startChapter: function(id) {
        var ch = this.getChapter(id);
        if (!ch) return { success: false, reason: 'Глава не найдена' };
        if (!this.isUnlocked(id)) return { success: false, reason: 'Глава заблокирована' };
        if (this.isOnCooldown()) return { success: false, reason: 'Перезарядка ' + this.getCooldownRemaining() + ' мин.', cooldown: true };
        var p = Sherwood.getPlayer();
        if ((p.questEnergy.current || 0) < ch.energyCost) return { success: false, reason: 'Недостаточно энергии' };
        p.questEnergy.current -= ch.energyCost;
        this._currentChapter = ch;
        this._currentStage = 0;
        var boss = ch.boss;
        this._currentEnemy = { name: boss.name, image: boss.image, hp: boss.hp, maxHp: boss.hp, atk: boss.atk, def: boss.def, exp: boss.exp, gold: boss.gold, isBoss: true };
        this._inBattle = true;
        this._lastAttempt = Date.now();
        p.questAttempts.today = (p.questAttempts.today || 0) + 1;
        p.questAttempts.lastAttempt = this._lastAttempt;
        this._attemptsToday = p.questAttempts.today;
        Sherwood.saveGame();
        return { success: true, chapter: ch, enemy: this._currentEnemy, stage: 1, total: ch.stages };
    },

    getBattle: function() {
        if (!this._inBattle) return null;
        return { chapter: this._currentChapter, stage: this._currentStage + 1, total: this._currentChapter.stages, enemy: this._currentEnemy };
    },

    getAttemptsToday: function() { return this._attemptsToday; },

    attack: function() {
        if (!this._inBattle) return null;
        var p = Sherwood.getPlayer();
        var e = this._currentEnemy;
        var dmg = Math.max(1, Math.floor((p.stats.attack * p.stats.attack) / (p.stats.attack + e.def)));
        var crit = Math.random() * 100 < 15;
        if (crit) dmg = Math.floor(dmg * 1.8);
        e.hp -= dmg;
        if (e.hp < 0) e.hp = 0;
        var r = { damage: dmg, crit: crit, enemyHp: e.hp, enemyMaxHp: e.maxHp, enemyDead: e.hp <= 0 };
        if (e.hp <= 0) {
            Sherwood.addExp(e.exp);
            if (this._attemptsToday <= 4) { Sherwood.addResource('gold', e.gold); }
            if (Math.random() < 0.1) Sherwood.addResource('ingots', 1);
            if (Math.random() < 0.15) Sherwood.addResource('scrolls', 1);
            this._currentStage++;
            var ch = this._currentChapter;
            if (this._currentStage >= ch.stages) {
                Sherwood.addExp(ch.boss.exp);
                if (this._attemptsToday <= 4) Sherwood.addResource('gold', ch.boss.gold);
                Sherwood.addResource('silver', ch.boss.gold * 2);
                var p2 = Sherwood.getPlayer();
                p2.questProgress.completed.push(ch.id);
                if (ch.id < 15) p2.questProgress.currentChapter = ch.id + 1;
                if (typeof Sherwood.addTrophy === 'function') {
                    var trophies = ['trophy_ch' + ch.id, 'Трофей главы ' + ch.id, { attack: ch.id * 3, defense: ch.id * 2, hp: ch.id * 10 }, 'assets/all_trophies/trophies_chapters/chapter_' + ch.id + '_' + ch.id + '.png', 'chapter'];
                    Sherwood.addTrophy(trophies[0], trophies[1], trophies[2], trophies[3], trophies[4]);
                }
                this._inBattle = false;
                r.chapterComplete = true;
                r.rewards = { exp: ch.boss.exp, gold: ch.boss.gold, silver: ch.boss.gold * 2 };
            } else {
                var boss = ch.boss;
                this._currentEnemy = { name: boss.name, image: boss.image, hp: boss.hp, maxHp: boss.hp, atk: boss.atk, def: boss.def, exp: boss.exp, gold: boss.gold, isBoss: true };
                r.nextEnemy = this._currentEnemy;
            }
        } else {
            var edmg = Math.max(1, Math.floor((e.atk * e.atk) / (e.atk + p.stats.defense)));
            p.stats.hp = Math.max(0, p.stats.hp - edmg);
            r.enemyDamage = edmg;
            r.playerHp = p.stats.hp;
            r.playerDead = p.stats.hp <= 0;
        }
        Sherwood.saveGame();
        return r;
    },

    flee: function() { this._inBattle = false; this._currentEnemy = null; return { success: true }; }
};

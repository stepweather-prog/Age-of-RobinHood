/**
 * Sherwood Tavern — Таверна (100 квестов, автобой)
 */

Sherwood.Tavern = {
    _quests: [],
    _dailyQuests: [],
    _currentQuest: null,
    _questsCompleted: 0,
    _autoMode: false,

    init: function() {
        this._generateQuestPool();
        this._loadDailyQuests();
        const player = Sherwood.getPlayer();
        if (!player.tavern) {
            player.tavern = { questsCompleted: 0, dailyQuestsDone: 0, lastRefresh: Date.now() };
        }
        this._questsCompleted = player.tavern.questsCompleted || 0;
    },

    _generateQuestPool: function() {
        const templates = [
            { name: 'Волчья охота', desc: 'Убить 5 волков', target: 5, reward: { gold: 50, exp: 30 } },
            { name: 'Сбор трав', desc: 'Найти 3 целебные травы', target: 3, reward: { gold: 40, exp: 25 } },
            { name: 'Зачистка логова', desc: 'Уничтожить логово упырей', target: 1, reward: { gold: 80, exp: 50 } },
            { name: 'Пропавший караван', desc: 'Найти следы каравана', target: 1, reward: { gold: 60, exp: 35 } },
            { name: 'Кости древних', desc: 'Собрать 4 кости', target: 4, reward: { gold: 45, exp: 28 } },
            { name: 'Грибная охота', desc: 'Собрать 6 грибов', target: 6, reward: { gold: 35, exp: 20 } },
            { name: 'Паучий шёлк', desc: 'Добыть 3 кокона', target: 3, reward: { gold: 55, exp: 32 } },
            { name: 'Руда гномов', desc: 'Найти 2 слитка', target: 2, reward: { gold: 70, exp: 40 } },
            { name: 'Призрачный шёпот', desc: 'Упокоить 3 духов', target: 3, reward: { gold: 65, exp: 38 } },
            { name: 'Крысиный король', desc: 'Убить крысиного короля', target: 1, reward: { gold: 90, exp: 55 } },
            { name: 'Ядовитые spores', desc: 'Собрать 5 спор', target: 5, reward: { gold: 42, exp: 26 } },
            { name: 'Бандитский лагерь', desc: 'Разгромить лагерь', target: 1, reward: { gold: 100, exp: 60 } },
            { name: 'Рыбный день', desc: 'Поймать 4 рыбы', target: 4, reward: { gold: 38, exp: 22 } },
            { name: 'Медвежья берлога', desc: 'Обследовать берлогу', target: 1, reward: { gold: 75, exp: 45 } },
            { name: 'Цветок папоротника', desc: 'Найти цветок', target: 1, reward: { gold: 120, exp: 70 } },
            { name: 'Следопыт', desc: 'Выследить 3 зверей', target: 3, reward: { gold: 48, exp: 30 } },
            { name: 'Кровавый след', desc: 'Найти источник крови', target: 1, reward: { gold: 55, exp: 33 } },
            { name: 'Лунный камень', desc: 'Добыть лунный камень', target: 1, reward: { gold: 85, exp: 50 } },
            { name: 'Стая воронов', desc: 'Разогнать стаю', target: 1, reward: { gold: 30, exp: 18 } },
            { name: 'Зельеварение', desc: 'Собрать ингредиенты', target: 3, reward: { gold: 52, exp: 31 } },
            { name: 'Троллий мост', desc: 'Пройти мост', target: 1, reward: { gold: 95, exp: 58 } },
            { name: 'Упырь на болоте', desc: 'Убить упыря', target: 1, reward: { gold: 72, exp: 42 } },
            { name: 'Светлячки', desc: 'Поймать 7 светлячков', target: 7, reward: { gold: 32, exp: 19 } },
            { name: 'Древний алтарь', desc: 'Активировать алтарь', target: 1, reward: { gold: 110, exp: 65 } },
            { name: 'Кожа носорога', desc: 'Добыть шкуру', target: 1, reward: { gold: 88, exp: 52 } },
            { name: 'Пыльца фей', desc: 'Собрать 4 пыльцы', target: 4, reward: { gold: 46, exp: 27 } },
            { name: 'Змеиное гнездо', desc: 'Зачистить гнездо', target: 1, reward: { gold: 68, exp: 40 } },
            { name: 'Эхо прошлого', desc: 'Найти 2 артефакта', target: 2, reward: { gold: 78, exp: 46 } },
            { name: 'Пещерный жук', desc: 'Убить 3 жуков', target: 3, reward: { gold: 44, exp: 26 } },
            { name: 'Ледяной осколок', desc: 'Найти осколок', target: 1, reward: { gold: 92, exp: 55 } },
            { name: 'Дым над лесом', desc: 'Исследовать дым', target: 1, reward: { gold: 58, exp: 34 } },
            { name: 'Коготь виверны', desc: 'Добыть коготь', target: 1, reward: { gold: 105, exp: 62 } },
            { name: 'Песчаный червь', desc: 'Убить червя', target: 1, reward: { gold: 82, exp: 48 } },
            { name: 'Целебный источник', desc: 'Найти источник', target: 1, reward: { gold: 40, exp: 24 } },
            { name: 'Статуя героя', desc: 'Обследовать статую', target: 1, reward: { gold: 65, exp: 38 } },
            { name: 'Вампирская пыль', desc: 'Собрать 3 порции', target: 3, reward: { gold: 56, exp: 33 } },
            { name: 'Гоблинский клад', desc: 'Найти клад', target: 1, reward: { gold: 115, exp: 68 } },
            { name: 'Теневой плащ', desc: 'Добыть плащ', target: 1, reward: { gold: 98, exp: 57 } },
            { name: 'Шипы розы', desc: 'Собрать 5 шипов', target: 5, reward: { gold: 36, exp: 21 } },
            { name: 'Огненный шар', desc: 'Найти шар', target: 1, reward: { gold: 125, exp: 75 } },
            { name: 'Ледяная корона', desc: 'Добыть корону', target: 1, reward: { gold: 130, exp: 78 } },
            { name: 'Крыло дракона', desc: 'Найти крыло', target: 1, reward: { gold: 150, exp: 90 } },
            { name: 'Слеза богини', desc: 'Найти слезу', target: 1, reward: { gold: 140, exp: 85 } },
            { name: 'Перо феникса', desc: 'Добыть перо', target: 1, reward: { gold: 160, exp: 95 } },
            { name: 'Рог единорога', desc: 'Найти рог', target: 1, reward: { gold: 145, exp: 88 } },
            { name: 'Чешуя змея', desc: 'Собрать 4 чешуи', target: 4, reward: { gold: 50, exp: 30 } },
            { name: 'Паутина', desc: 'Собрать 6 паутин', target: 6, reward: { gold: 34, exp: 20 } },
            { name: 'Кристалл маны', desc: 'Найти кристалл', target: 1, reward: { gold: 108, exp: 64 } },
            { name: 'Демонический глаз', desc: 'Добыть глаз', target: 1, reward: { gold: 135, exp: 80 } },
            { name: 'Сердце тьмы', desc: 'Уничтожить сердце', target: 1, reward: { gold: 170, exp: 100 } },
            { name: 'Янтарная смола', desc: 'Собрать 3 смолы', target: 3, reward: { gold: 54, exp: 32 } },
            { name: 'Горный цветок', desc: 'Найти цветок', target: 1, reward: { gold: 42, exp: 25 } },
            { name: 'Морской жемчуг', desc: 'Найти 2 жемчуга', target: 2, reward: { gold: 62, exp: 37 } },
            { name: 'Кость великана', desc: 'Найти кость', target: 1, reward: { gold: 75, exp: 44 } },
            { name: 'Язык пламени', desc: 'Собрать 4 языка', target: 4, reward: { gold: 48, exp: 28 } },
            { name: 'Зуб тролля', desc: 'Выбить зуб', target: 1, reward: { gold: 58, exp: 34 } },
            { name: 'Копыто демона', desc: 'Добыть копыто', target: 1, reward: { gold: 85, exp: 50 } },
            { name: 'Шкура медведя', desc: 'Добыть шкуру', target: 1, reward: { gold: 68, exp: 40 } },
            { name: 'Эльфийский лук', desc: 'Найти лук', target: 1, reward: { gold: 95, exp: 56 } },
            { name: 'Кинжал теней', desc: 'Найти кинжал', target: 1, reward: { gold: 88, exp: 52 } },
            { name: 'Амулет защиты', desc: 'Найти амулет', target: 1, reward: { gold: 72, exp: 42 } },
            { name: 'Кольцо силы', desc: 'Найти кольцо', target: 1, reward: { gold: 78, exp: 46 } },
            { name: 'Плащ невидимка', desc: 'Найти плащ', target: 1, reward: { gold: 110, exp: 65 } },
            { name: 'Сапоги скорости', desc: 'Найти сапоги', target: 1, reward: { gold: 65, exp: 38 } },
            { name: 'Шлем мудрости', desc: 'Найти шлем', target: 1, reward: { gold: 70, exp: 41 } },
            { name: 'Щит отражения', desc: 'Найти щит', target: 1, reward: { gold: 82, exp: 48 } },
            { name: 'Меч рассвета', desc: 'Найти меч', target: 1, reward: { gold: 120, exp: 72 } },
            { name: 'Посох мага', desc: 'Найти посох', target: 1, reward: { gold: 105, exp: 62 } },
            { name: 'Книга заклинаний', desc: 'Найти книгу', target: 1, reward: { gold: 90, exp: 54 } },
            { name: 'Зелье удачи', desc: 'Сварить зелье', target: 1, reward: { gold: 55, exp: 33 } },
            { name: 'Эликсир жизни', desc: 'Собрать ингредиенты', target: 3, reward: { gold: 60, exp: 36 } },
            { name: 'Яд скорпиона', desc: 'Добыть 2 порции', target: 2, reward: { gold: 48, exp: 28 } },
            { name: 'Слёзы русалки', desc: 'Найти слёзы', target: 1, reward: { gold: 100, exp: 60 } },
            { name: 'Песнь сирены', desc: 'Услышать песнь', target: 1, reward: { gold: 75, exp: 45 } },
            { name: 'Тень дракона', desc: 'Увидеть тень', target: 1, reward: { gold: 130, exp: 78 } },
            { name: 'Вздох ветра', desc: 'Поймать вздох', target: 1, reward: { gold: 45, exp: 27 } },
            { name: 'Капля дождя', desc: 'Собрать 5 капель', target: 5, reward: { gold: 30, exp: 18 } },
            { name: 'Луч солнца', desc: 'Поймать луч', target: 1, reward: { gold: 35, exp: 21 } },
            { name: 'Отражение луны', desc: 'Увидеть отражение', target: 1, reward: { gold: 40, exp: 24 } },
            { name: 'Звёздная пыль', desc: 'Собрать 3 пыли', target: 3, reward: { gold: 52, exp: 31 } },
            { name: 'Крыло бабочки', desc: 'Поймать 4 бабочек', target: 4, reward: { gold: 28, exp: 16 } },
            { name: 'Шёпот леса', desc: 'Услышать шёпот', target: 1, reward: { gold: 38, exp: 22 } },
            { name: 'Голос гор', desc: 'Услышать голос', target: 1, reward: { gold: 42, exp: 25 } },
            { name: 'Плач реки', desc: 'Услышать плач', target: 1, reward: { gold: 36, exp: 21 } },
            { name: 'Смех эха', desc: 'Услышать смех', target: 1, reward: { gold: 33, exp: 19 } },
            { name: 'Взгляд бездны', desc: 'Заглянуть в бездну', target: 1, reward: { gold: 150, exp: 90 } },
            { name: 'Крик ястреба', desc: 'Услышать крик', target: 1, reward: { gold: 28, exp: 16 } },
            { name: 'Вой волка', desc: 'Услышать вой', target: 1, reward: { gold: 32, exp: 18 } },
            { name: 'Рык медведя', desc: 'Услышать рык', target: 1, reward: { gold: 35, exp: 20 } },
            { name: 'Шипение змеи', desc: 'Услышать шипение', target: 1, reward: { gold: 30, exp: 17 } },
            { name: 'Треск костра', desc: 'Развести костёр', target: 1, reward: { gold: 25, exp: 15 } },
            { name: 'Запах дыма', desc: 'Найти источник', target: 1, reward: { gold: 40, exp: 24 } },
            { name: 'Вкус победы', desc: 'Победить в дуэли', target: 1, reward: { gold: 60, exp: 36 } },
            { name: 'Тяжесть доспеха', desc: 'Найти доспех', target: 1, reward: { gold: 85, exp: 50 } },
            { name: 'Лёгкость пера', desc: 'Найти перо', target: 1, reward: { gold: 55, exp: 32 } },
            { name: 'Горечь поражения', desc: 'Пережить поражение', target: 1, reward: { gold: 20, exp: 12 } },
            { name: 'Сладость мёда', desc: 'Найти 3 улья', target: 3, reward: { gold: 38, exp: 22 } },
            { name: 'Острота клинка', desc: 'Заточить клинок', target: 1, reward: { gold: 45, exp: 26 } },
            { name: 'Туман забвения', desc: 'Пройти через туман', target: 1, reward: { gold: 70, exp: 42 } }
        ];
        this._quests = templates;
    },

    _loadDailyQuests: function() {
        const saved = localStorage.getItem('sherwood_tavern_daily');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (Date.now() - data.date < 86400000) {
                    this._dailyQuests = data.quests;
                    return;
                }
            } catch(e) {}
        }
        this._refreshDailyQuests();
    },

    _refreshDailyQuests: function() {
        const pool = [...this._quests];
        this._dailyQuests = [];
        for (let i = 0; i < 10; i++) {
            if (pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            this._dailyQuests.push({ ...pool[idx], id: i, progress: 0, completed: false });
            pool.splice(idx, 1);
        }
        localStorage.setItem('sherwood_tavern_daily', JSON.stringify({ date: Date.now(), quests: this._dailyQuests }));
    },

    getDailyQuests: function() {
        return this._dailyQuests;
    },

    startQuest: function(index) {
        if (index < 0 || index >= this._dailyQuests.length) return { success: false, reason: 'Неверный индекс' };
        const quest = this._dailyQuests[index];
        if (quest.completed) return { success: false, reason: 'Уже выполнено' };
        this._currentQuest = { ...quest, index: index };
        return { success: true, quest: this._currentQuest };
    },

    getCurrentQuest: function() {
        return this._currentQuest;
    },

    autoBattle: function() {
        if (!this._currentQuest) return { success: false, reason: 'Нет активного квеста' };
        const player = Sherwood.getPlayer();
        const winChance = Math.min(90, 50 + player.stats.attack * 0.3 + player.stats.agility * 0.2);
        const success = Math.random() * 100 < winChance;
        
        if (success) {
            this._currentQuest.progress++;
            if (this._currentQuest.progress >= this._currentQuest.target) {
                this._currentQuest.completed = true;
                this._dailyQuests[this._currentQuest.index].completed = true;
                const quest = this._currentQuest;
                this._currentQuest = null;
                Sherwood.addExp(quest.reward.exp);
                Sherwood.addResource('gold', quest.reward.gold);
                Sherwood.addResource('silver', Math.floor(quest.reward.gold * 0.5));
                const player = Sherwood.getPlayer();
                player.tavern.questsCompleted++;
                player.tavern.dailyQuestsDone++;
                this._questsCompleted++;
                return { success: true, completed: true, quest: quest, progress: quest.progress, target: quest.target };
            }
            return { success: true, completed: false, quest: this._currentQuest, progress: this._currentQuest.progress, target: this._currentQuest.target };
        } else {
            return { success: true, failed: true, damage: Math.floor(Math.random() * 20) + 5 };
        }
    },

    manualBattle: function() {
        return this.autoBattle();
    },

    cancelQuest: function() {
        this._currentQuest = null;
        return { success: true };
    },

    getCompletedCount: function() {
        return this._questsCompleted;
    },

    getDailyQuestsDone: function() {
        const player = Sherwood.getPlayer();
        return player.tavern ? (player.tavern.dailyQuestsDone || 0) : 0;
    }
};

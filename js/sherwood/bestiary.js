/**
 * Sherwood Bestiary — Бестиарий
 */

Sherwood.Bestiary = {
    _beasts: {},

    init: function() {
        const player = Sherwood.getPlayer();
        this._beasts = player.bestiary || {};
        if (!player.bestiary) {
            player.bestiary = {};
        }
    },

    BEASTS: {
        // Подземка 1 — Лес
        'image (1).png': { name: 'Леший', zone: 'Проклятая чаща', floor: '1-3', type: 'Обычный', lore: 'Вековой хранитель Шервуда, ослепший от ярости.' },
        'image (3).png': { name: 'Проклятый олень', zone: 'Проклятая чаща', floor: '1-3', type: 'Обычный', lore: 'Лесной олень, чьи рога пропитаны порчей.' },
        'image (74).png': { name: 'Древесный голем', zone: 'Проклятая чаща', floor: '1-3', type: 'Обычный', lore: 'Ожившее дерево, питающееся гнилью подземных вод.' },
        'image (9).png': { name: 'Рогатый Леший', zone: 'Проклятая чаща', floor: '4-6', type: 'Элитный', lore: 'Леший, чьи рога проросли сквозь череп.' },
        'image (29).png': { name: 'Олень (Фаза тарана)', zone: 'Проклятая чаща', floor: '4-6', type: 'Элитный', lore: 'Олень в боевой стойке, готовый протаранить.' },
        'image (75).png': { name: 'Голем (Замах)', zone: 'Проклятая чаща', floor: '4-6', type: 'Элитный', lore: 'Голем, размахивающий каменными лапами.' },
        'image (18).png': { name: 'Рогатый владыка Леший', zone: 'Проклятая чаща', floor: '7', type: 'Босс', lore: 'Верховный леший, повелевающий корнями.' },
        'image (15).png': { name: 'Проклятый титан Леший', zone: 'Проклятая чаща', floor: '7', type: 'Босс', lore: 'Титан из чёрной коры и базальта.' },

        // Подземка 2 — Болото
        'image (12).png': { name: 'Болотный утопленник', zone: 'Первородное болото', floor: '1-3', type: 'Обычный', lore: 'Раздувшийся труп рудокопа, обвитый неоновым мхом.' },
        'image (13).png': { name: 'Кикимора болотная', zone: 'Первородное болото', floor: '1-3', type: 'Обычный', lore: 'Паукообразное существо, крадущееся в темноте.' },
        'image (17).png': { name: 'Болотный упырь', zone: 'Первородное болото', floor: '1-3', type: 'Обычный', lore: 'Склизкий трупоед с болотных топей.' },
        'image (59).png': { name: 'Упырь (Когти)', zone: 'Первородное болото', floor: '1-3', type: 'Обычный', lore: 'Упырь, обнаживший ядовитые когти.' },
        'image (62).png': { name: 'Утопленник (Мертвец недр)', zone: 'Первородное болото', floor: '1-3', type: 'Обычный', lore: 'Восставший мертвец из глубоких шахт.' },
        'image (14).png': { name: 'Костяной гигант', zone: 'Первородное болото', floor: '4-6', type: 'Элитный', lore: 'Гигант из костей павших воинов.' },
        'image (16).png': { name: 'Рогатая кикимора', zone: 'Первородное болото', floor: '4-6', type: 'Элитный', lore: 'Кикимора с костяными рогами.' },
        'image (52).png': { name: 'Кикимора (Выпад)', zone: 'Первородное болото', floor: '4-6', type: 'Элитный', lore: 'Кикимора в агрессивной стойке.' },
        'image (53).png': { name: 'Кикимора (Крик)', zone: 'Первородное болото', floor: '4-6', type: 'Элитный', lore: 'Кикимора, издающая леденящий крик.' },
        'image (60).png': { name: 'Упырь (Удар)', zone: 'Первородное болото', floor: '4-6', type: 'Элитный', lore: 'Упырь, заносящий когти для удара.' },
        'image (61).png': { name: 'Упырь (Прыжок)', zone: 'Первородное болото', floor: '4-6', type: 'Элитный', lore: 'Упырь в прыжке на жертву.' },
        'image (63).png': { name: 'Скелетный гигант', zone: 'Первородное болото', floor: '4-6', type: 'Элитный', lore: 'Огромный скелет неизвестного зверя.' },
        'image (54).png': { name: 'Кикимора багровой ярости', zone: 'Первородное болото', floor: '7', type: 'Босс', lore: 'Кикимора в состоянии кровавого безумия.' },

        // Подземка 3 — Пещеры
        'image (10).png': { name: 'Трёхглавый пёс', zone: 'Базальтовые шахты', floor: '1-3', type: 'Обычный', lore: 'Цербер из глубин базальтовых шахт.' },
        'image (11).png': { name: 'Заражённый секач', zone: 'Базальтовые шахты', floor: '1-3', type: 'Обычный', lore: 'Кабан, мутировавший от базальтовой пыли.' },
        'image (32).png': { name: 'Волк-оборотень', zone: 'Базальтовые шахты', floor: '1-3', type: 'Обычный', lore: 'Волк с неоново-бирюзовыми венами.' },
        'image (35).png': { name: 'Дьявольский ёж', zone: 'Базальтовые шахты', floor: '1-3', type: 'Обычный', lore: 'Ёж размером с кабана с ядовитыми иглами.' },
        'image (33).png': { name: 'Оборотень (Ярость)', zone: 'Базальтовые шахты', floor: '4-6', type: 'Элитный', lore: 'Оборотень в фазе ярости.' },
        'image (36).png': { name: 'Ёж (Ярость)', zone: 'Базальтовые шахты', floor: '4-6', type: 'Элитный', lore: 'Ёж с кристаллическими иглами.' },
        'image (49).png': { name: 'Костяной ликантроп', zone: 'Базальтовые шахты', floor: '4-6', type: 'Элитный', lore: 'Ликантроп с костяным гребнем.' },
        'image (50).png': { name: 'Ликантроп (Замах)', zone: 'Базальтовые шахты', floor: '4-6', type: 'Элитный', lore: 'Ликантроп, заносящий лапу.' },
        'image (37).png': { name: 'Кристаллический ёж', zone: 'Базальтовые шахты', floor: '7', type: 'Босс', lore: 'Ёж с иглами из чистого кристалла.' },
        'image (34).png': { name: 'Волк-оборотень (Босс)', zone: 'Базальтовые шахты', floor: '7', type: 'Босс', lore: 'Вожак стаи оборотней.' },

        // Квестовые боссы
        'image (46).png': { name: 'Лесное Лихо', zone: 'Квест', floor: 'Глава 1', type: 'Босс', lore: 'Костлявый гуманоид с гипнотизирующим глазом.' },
        'image (47).png': { name: 'Разъярённое Лихо', zone: 'Квест', floor: 'Глава 2', type: 'Босс', lore: 'Лихо в ярости, шипы удлиняются.' },
        'image (48).png': { name: 'Лихо (Атака)', zone: 'Квест', floor: 'Глава 2', type: 'Босс', lore: 'Лихо в фазе атаки.' },
        'image (19).png': { name: 'Лесная нимфа', zone: 'Квест', floor: 'Глава 3', type: 'Босс', lore: 'Дух чащи в маске-черепе.' },
        'image (41).png': { name: 'Призрак Чёрного Ордена', zone: 'Квест', floor: 'Глава 4', type: 'Босс', lore: 'Призрак вора из пепла и дыма.' },
        'image (42).png': { name: 'Фантомный дух', zone: 'Квест', floor: 'Глава 5', type: 'Босс', lore: 'Фантом с неоновыми глазами.' },
        'image (20).png': { name: 'Химера корней', zone: 'Квест', floor: 'Глава 6', type: 'Босс', lore: 'Чудовище с пастью-щитом.' },
        'image (27).png': { name: 'Кислотный Кошмар', zone: 'Квест', floor: 'Глава 7', type: 'Босс', lore: 'Багровая версия химеры с кислотой.' },
        'image (5).png': { name: 'Очи Алтаря Безумия', zone: 'Квест', floor: 'Глава 8', type: 'Босс', lore: 'Монстр, усеянный моргающими глазами.' },
        'image (38).png': { name: 'Пожиратель душ', zone: 'Квест', floor: 'Глава 9', type: 'Босс', lore: 'Чёрный силуэт с черепами.' },
        'image (39).png': { name: 'Извергатель ярости', zone: 'Квест', floor: 'Глава 10', type: 'Босс', lore: 'Тварь с рогами и чёрным дымом.' },
        'image (31).png': { name: 'Топор Палача', zone: 'Квест', floor: 'Глава 11', type: 'Босс', lore: 'Монстр со сшитой кожей и цепями.' },
        'image (44).png': { name: 'Проклятый Король', zone: 'Квест', floor: 'Глава 12', type: 'Босс', lore: 'Рыцарь с кишками вместо тела.' },
        'image (45).png': { name: 'Безумие Мёртвой Короны', zone: 'Квест', floor: 'Глава 13', type: 'Босс', lore: 'Король с 6 глазами и когтями.' },
        'image (55).png': { name: 'Мясной инсектоид', zone: 'Квест', floor: 'Глава 14', type: 'Босс', lore: 'Жук с мясными щупальцами.' },
        'image (79).png': { name: 'Рунический Джаггернаут', zone: 'Квест', floor: 'Глава 15', type: 'Босс', lore: 'Финальный страж с изумрудными рунами.' },
        'image (77).png': { name: 'Изумрудный призрак', zone: 'Квест', floor: 'Глава 15', type: 'Босс', lore: 'Парящий череп с зелёными глазами.' },
        'image (2).png': { name: 'Шервудское Отродье', zone: 'Рейд', floor: 'Мировой босс', type: 'Легендарный', lore: 'Многорукий титан в золотых латах.' }
    },

    registerKill: function(beastId) {
        if (!beastId) return;
        if (!this._beasts[beastId]) {
            const beastData = this.BEASTS[beastId] || { name: beastId, zone: 'Неизвестно', type: 'Обычный' };
            this._beasts[beastId] = { kills: 0, ...beastData };
        }
        this._beasts[beastId].kills++;
        
        const player = Sherwood.getPlayer();
        player.bestiary = this._beasts;
        Sherwood.saveGame();
    },

    getBeast: function(beastId) {
        return this._beasts[beastId] || null;
    },

    getAllBeasts: function() {
        return this._beasts;
    },

    getAllBeastEntries: function() {
        return this.BEASTS;
    },

    getKillCount: function(beastId) {
        return this._beasts[beastId] ? this._beasts[beastId].kills : 0;
    },

    getTotalKills: function() {
        let total = 0;
        for (const beast of Object.values(this._beasts)) {
            total += beast.kills || 0;
        }
        return total;
    },

    getDiscoveryProgress: function() {
        const totalBeasts = Object.keys(this.BEASTS).length;
        const discovered = Object.keys(this._beasts).length;
        return { discovered, total: totalBeasts, percent: Math.round((discovered / totalBeasts) * 100) };
    },

    getBeastsByZone: function(zone) {
        const result = [];
        for (const [id, data] of Object.entries(this.BEASTS)) {
            if (data.zone === zone) {
                result.push({ id, ...data, kills: this._beasts[id] ? this._beasts[id].kills : 0 });
            }
        }
        return result;
    }
};

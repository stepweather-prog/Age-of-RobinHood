/**
 * Sherwood Quests System
 * Система квестов и прогрессии с перезарядкой
 */

Sherwood.Quests = {
    _quests: {},
    _activeQuest: null,
    _lastBattleTime: 0,
    _cooldownMinutes: 30,
    
    // Дневные лимиты НА НАГРАДЫ (не на бои)
    _dailyGoldLimit: 100,
    _dailySilverLimit: 1000,
    _dailyGoldEarned: 0,
    _dailySilverEarned: 0,
    _dailyResetTime: null,
    
    _definitions: {
        chapter1_intro: {
            id: 'chapter1_intro',
            chapter: 1,
            name: 'Пробуждение леса',
            description: 'Шервудский лес пробудился. Докажи, что ты достоин звания вольного стрелка.',
            tasks: [
                {
                    id: 'kill_spiders',
                    type: 'kill',
                    description: 'Убить лесных пауков',
                    monsterId: 'forest_spider',
                    target: 5,
                    progress: 0,
                    reward: { gold: 25, silver: 100, exp: 50 }
                },
                {
                    id: 'collect_gold',
                    type: 'collect',
                    description: 'Накопить золотых монет',
                    resource: 'gold',
                    target: 50,
                    progress: 0,
                    reward: { gold: 15, silver: 50, exp: 30 }
                },
                {
                    id: 'equip_bow',
                    type: 'equip',
                    description: 'Экипировать лук',
                    part: 'weapon1',
                    completed: false,
                    reward: { item: 'longbow' }
                }
            ],
            chapterReward: {
                gold: 100,
                silver: 300,
                exp: 200,
                item: 'leather_hood'
            },
            requiredLevel: 1,
            isBossChapter: false,
            bossId: null,
            bossName: null
        },
        
        chapter2_swamp: {
            id: 'chapter2_swamp',
            chapter: 2,
            name: 'Болотные твари',
            description: 'Болота кишат нежитью. Очисти их от скверны.',
            tasks: [
                {
                    id: 'kill_ghouls',
                    type: 'kill',
                    description: 'Убить болотных упырей',
                    monsterId: 'swamp_ghoul',
                    target: 8,
                    progress: 0,
                    reward: { gold: 40, silver: 150, exp: 80 }
                },
                {
                    id: 'kill_kikimoras',
                    type: 'kill',
                    description: 'Изгнать болотных кикимор',
                    monsterId: 'swamp_kikimora',
                    target: 5,
                    progress: 0,
                    reward: { gold: 35, silver: 120, exp: 70 }
                }
            ],
            chapterReward: {
                gold: 200,
                silver: 500,
                exp: 400,
                item: 'leather_armor'
            },
            requiredLevel: 3,
            isBossChapter: false,
            bossId: null,
            bossName: null
        },
        
        chapter3_deep_forest: {
            id: 'chapter3_deep_forest',
            chapter: 3,
            name: 'Глубокий лес',
            description: 'В глубине леса обитают опасные твари.',
            tasks: [
                {
                    id: 'kill_wolves',
                    type: 'kill',
                    description: 'Убить гнилых волков',
                    monsterId: 'dire_wolf',
                    target: 10,
                    progress: 0,
                    reward: { gold: 60, silver: 200, exp: 120 }
                },
                {
                    id: 'kill_leshy',
                    type: 'kill',
                    description: 'Победить лешего',
                    monsterId: 'leshy',
                    target: 3,
                    progress: 0,
                    reward: { gold: 80, silver: 250, exp: 150 }
                }
            ],
            chapterReward: {
                gold: 350,
                silver: 800,
                exp: 600,
                item: 'ranger_hood'
            },
            requiredLevel: 6,
            isBossChapter: false,
            bossId: null,
            bossName: null
        },
        
        chapter4_roads: {
            id: 'chapter4_roads',
            chapter: 4,
            name: 'Дороги Шервуда',
            description: 'Люди шерифа перекрыли дороги. Прорвись через их заслоны.',
            tasks: [
                {
                    id: 'kill_guards',
                    type: 'kill',
                    description: 'Победить стражников',
                    monsterId: 'guard',
                    target: 12,
                    progress: 0,
                    reward: { gold: 80, silver: 300, exp: 180 }
                },
                {
                    id: 'kill_mercenaries',
                    type: 'kill',
                    description: 'Разобраться с наёмниками',
                    monsterId: 'mercenary',
                    target: 8,
                    progress: 0,
                    reward: { gold: 100, silver: 350, exp: 200 }
                }
            ],
            chapterReward: {
                gold: 500,
                silver: 1200,
                exp: 800,
                item: 'sherwood_bow'
            },
            requiredLevel: 10,
            isBossChapter: false,
            bossId: null,
            bossName: null
        },
        
        chapter5_castle: {
            id: 'chapter5_castle',
            chapter: 5,
            name: 'Замок шерифа',
            description: 'Пришло время бросить вызов самому шерифу Ноттингемскому.',
            tasks: [
                {
                    id: 'kill_knights',
                    type: 'kill',
                    description: 'Победить рыцарей-командоров',
                    monsterId: 'knight_commander',
                    target: 5,
                    progress: 0,
                    reward: { gold: 150, silver: 500, exp: 300 }
                },
                {
                    id: 'kill_sheriff',
                    type: 'kill',
                    description: 'Победить шерифа Ноттингемского',
                    monsterId: 'sheriff_nottingham',
                    target: 1,
                    progress: 0,
                    reward: { gold: 500, silver: 1500, exp: 1000 }
                }
            ],
            chapterReward: {
                gold: 2000,
                silver: 5000,
                exp: 3000,
                item: 'sherwood_armor',
                trophy: true
            },
            requiredLevel: 15,
            isBossChapter: true,
            bossId: 'sheriff_nottingham',
            bossName: 'Шериф Ноттингемский'
        }
    },
    
    init() {
        this._generateBossChapters();
        const player = Sherwood.getPlayer();
        if (!player) return;
        
        this._quests = player.questProgress || {};
        this._lastBattleTime = player.lastQuestBattle || 0;
        
        this._loadDailyLimits();
        
        Sherwood.on('BATTLE_VICTORY', (data) => {
            if (data.monster) {
                this._onMonsterKilled(data.monster);
                this._checkBossCooldown();
            }
        });
        
        Sherwood.on('ITEM_ACQUIRED', (data) => {
            this._checkCollectQuests();
        });
        
        Sherwood.on('ITEM_EQUIPPED', (data) => {
            this._checkEquipQuests(data.part);
        });
        
        this._checkDailyReset();
    },
    
    _loadDailyLimits() {
        const saved = localStorage.getItem('sherwood_daily_limits');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                const today = new Date().toDateString();
                if (data.date === today) {
                    this._dailyGoldEarned = data.goldEarned || 0;
                    this._dailySilverEarned = data.silverEarned || 0;
                    return;
                }
            } catch(e) {}
        }
        this._dailyGoldEarned = 0;
        this._dailySilverEarned = 0;
        this._saveDailyLimits();
    },
    
    _saveDailyLimits() {
        localStorage.setItem('sherwood_daily_limits', JSON.stringify({
            date: new Date().toDateString(),
            goldEarned: this._dailyGoldEarned,
            silverEarned: this._dailySilverEarned
        }));
    },
    
    _checkDailyReset() {
        const saved = localStorage.getItem('sherwood_daily_limits');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                const today = new Date().toDateString();
                if (data.date !== today) {
                    this._dailyGoldEarned = 0;
                    this._dailySilverEarned = 0;
                    this._saveDailyLimits();
                }
            } catch(e) {}
        }
    },
    
    _applyDailyLimits(gold, silver) {
        let actualGold = gold;
        let actualSilver = silver;
        
        if (this._dailyGoldEarned < this._dailyGoldLimit) {
            const available = this._dailyGoldLimit - this._dailyGoldEarned;
            actualGold = Math.min(gold, available);
        } else {
            actualGold = 0;
        }
        
        if (this._dailySilverEarned < this._dailySilverLimit) {
            const available = this._dailySilverLimit - this._dailySilverEarned;
            actualSilver = Math.min(silver, available);
        } else {
            actualSilver = 0;
        }
        
        this._dailyGoldEarned += actualGold;
        this._dailySilverEarned += actualSilver;
        this._saveDailyLimits();
        
        return { gold: actualGold, silver: actualSilver };
    },
    
    _generateBossChapters() {
        const bossNames = [
            { id: 'gray_wolf_leader', name: 'Серый волк-вожак', tier: 1 },
            { id: 'swamp_prince', name: 'Болотный князь', tier: 1 },
            { id: 'ancient_leshy', name: 'Древний леший', tier: 2 },
            { id: 'wendigo_mutant', name: 'Вендиго-мутант', tier: 2 },
            { id: 'shadow_stag', name: 'Теневой олень', tier: 2 },
            { id: 'triton_maneater', name: 'Тритон-людоед', tier: 3 },
            { id: 'beetle_giant', name: 'Короед-великан', tier: 3 },
            { id: 'chimera_horror', name: 'Химера-ужас', tier: 3 },
            { id: 'bloody_executioner', name: 'Кровавый палач', tier: 4 },
            { id: 'ancient_guardian', name: 'Древний хранитель', tier: 4 },
            { id: 'fire_elemental', name: 'Огненный элементаль', tier: 4 },
            { id: 'ice_giant', name: 'Ледяной великан', tier: 5 },
            { id: 'lich_king', name: 'Король-личи', tier: 5 },
            { id: 'darkness_spawn', name: 'Порождение тьмы', tier: 5 },
            { id: 'robin_shadow', name: 'Тень Робин Гуда', tier: 6 }
        ];
        
        bossNames.forEach((boss, index) => {
            const chapter = index + 1;
            const key = `boss_chapter_${chapter}`;
            if (!this._definitions[key]) {
                this._definitions[key] = {
                    id: key,
                    chapter: chapter,
                    name: boss.name,
                    description: `Победи босса ${boss.name}`,
                    tasks: [
                        {
                            id: `boss_fight_${chapter}`,
                            type: 'boss_kill',
                            description: `Победить ${boss.name}`,
                            monsterId: boss.id,
                            target: 1,
                            progress: 0,
                            reward: { gold: 0, silver: 0, exp: 200 }
                        }
                    ],
                    chapterReward: {
                        gold: 0,
                        silver: 0,
                        exp: 400 + chapter * 100,
                        trophy: true
                    },
                    requiredLevel: Math.max(1, chapter),
                    isBossChapter: true,
                    bossId: boss.id,
                    bossName: boss.name,
                    bossTier: boss.tier,
                    isDungeonBoss: true
                };
            }
        });
    },
    
    getAvailableChapters() {
        const player = Sherwood.getPlayer();
        const chapters = [];
        
        Object.values(this._definitions).forEach(def => {
            if (def.chapter && player.level >= def.requiredLevel) {
                const progress = this._quests[def.id];
                chapters.push({
                    ...def,
                    completed: progress?.completed || false,
                    tasksCompleted: progress?.tasksCompleted || 0,
                    totalTasks: def.tasks.length
                });
            }
        });
        
        return chapters.sort((a, b) => a.chapter - b.chapter);
    },
    
    getBossChapters() {
        return Object.values(this._definitions)
            .filter(def => def.isDungeonBoss)
            .sort((a, b) => a.chapter - b.chapter);
    },
    
    isBossAvailable(bossId) {
        const now = Date.now();
        const cooldownMs = this._cooldownMinutes * 60 * 1000;
        const elapsed = now - this._lastBattleTime;
        return elapsed >= cooldownMs;
    },
    
    getBossCooldownRemaining() {
        const now = Date.now();
        const cooldownMs = this._cooldownMinutes * 60 * 1000;
        const elapsed = now - this._lastBattleTime;
        return Math.max(0, cooldownMs - elapsed);
    },
    
    _checkBossCooldown() {
        this._lastBattleTime = Date.now();
        const player = Sherwood.getPlayer();
        if (player) {
            player.lastQuestBattle = this._lastBattleTime;
            Sherwood.saveGame();
        }
    },
    
    getBossReward(bossDef) {
        // Базовые награды (не зависят от лимитов)
        const baseGold = 100 + (bossDef.chapter || 0) * 10;
        const baseSilver = 300 + (bossDef.chapter || 0) * 20;
        const baseExp = 150 + (bossDef.chapter || 0) * 15;
        
        // Применяем дневные лимиты ТОЛЬКО к золоту и серебру
        const limited = this._applyDailyLimits(baseGold, baseSilver);
        
        // Опыт даётся всегда
        const exp = baseExp;
        
        // Шанс на предмет 15% (всегда)
        const hasItem = Math.random() < 0.15;
        let item = null;
        if (hasItem) {
            const items = Sherwood.EquipmentDB?.items || [];
            const randomItem = items[Math.floor(Math.random() * items.length)];
            if (randomItem) {
                item = randomItem;
            }
        }
        
        return {
            gold: limited.gold,
            silver: limited.silver,
            exp: exp,
            item: item,
            limited: (limited.gold < baseGold || limited.silver < baseSilver)
        };
    },
    
    startBossFight(bossId) {
        // Проверка КД (30 минут между боями)
        if (!this.isBossAvailable(bossId)) {
            return { error: 'cooldown', remaining: this.getBossCooldownRemaining() };
        }
        
        const def = Object.values(this._definitions).find(d => d.bossId === bossId && d.isDungeonBoss);
        if (!def) return { error: 'not_found' };
        
        const player = Sherwood.getPlayer();
        if (player.level < def.requiredLevel) {
            return { error: 'level_required', required: def.requiredLevel };
        }
        
        if (!this._quests[def.id]) {
            this._quests[def.id] = {
                started: true,
                completed: false,
                tasksCompleted: 0,
                tasks: {}
            };
            def.tasks.forEach(task => {
                if (!this._quests[def.id].tasks[task.id]) {
                    this._quests[def.id].tasks[task.id] = {
                        progress: 0,
                        completed: false
                    };
                }
            });
        }
        
        this._activeQuest = { ...def, questState: this._quests[def.id] };
        this._saveProgress();
        
        const battle = Sherwood.Combat.startPvE(bossId);
        if (battle) {
            battle.isBossFight = true;
            battle.questId = def.id;
            battle.bossDef = def;
            
            Sherwood.once('BATTLE_VICTORY', () => {
                this._onBossDefeated(def.id, def);
            });
        }
        
        return { success: true, battle };
    },
    
    _onBossDefeated(questId, def) {
        const state = this._quests[questId];
        if (!state) return;
        
        def.tasks.forEach(task => {
            const taskState = state.tasks[task.id];
            if (taskState) {
                taskState.progress = task.target;
                taskState.completed = true;
            }
        });
        
        state.tasksCompleted = def.tasks.length;
        state.completed = true;
        
        // Получаем награду с учётом лимитов
        const reward = this.getBossReward(def);
        
        // Добавляем награды
        if (reward.gold > 0) Sherwood.addResource('gold', reward.gold);
        if (reward.silver > 0) Sherwood.addResource('silver', reward.silver);
        if (reward.exp > 0) Sherwood.addExp(reward.exp);
        
        if (reward.item) {
            const player = Sherwood.getPlayer();
            player.inventory.push({...reward.item});
            Sherwood.dispatch({ type: 'ITEM_ACQUIRED', payload: { item: reward.item } });
        }
        
        // Запись в бестиарий
        if (def.bossName && def.bossId) {
            Sherwood.dispatch({
                type: 'BOSS_DEFEATED',
                payload: {
                    bossId: def.bossId,
                    bossName: def.bossName,
                    chapter: def.chapter,
                    tier: def.bossTier
                }
            });
            
            Sherwood.dispatch({
                type: 'TAVERN_CHAPTER_UNLOCKED',
                payload: { chapter: def.chapter }
            });
        }
        
        this._activeQuest = null;
        this._saveProgress();
        
        Sherwood.dispatch({
            type: 'BOSS_CHAPTER_COMPLETED',
            payload: { questId, chapter: def, reward }
        });
    },
    
    _onMonsterKilled(monsterData) {
        const monsterId = monsterData.monsterId || 
            Object.keys(Sherwood.Monsters).find(k => 
                Sherwood.Monsters[k]?.name === monsterData.name
            );
        
        if (!monsterId) return;
        
        const isBoss = Object.values(this._definitions).some(d => d.bossId === monsterId && d.isDungeonBoss);
        if (isBoss) return;
        
        Object.keys(this._quests).forEach(questId => {
            const def = this._definitions[questId];
            if (!def || def.isDungeonBoss) return;
            
            const state = this._quests[questId];
            if (!state || state.completed) return;
            
            def.tasks.forEach(task => {
                const taskState = state.tasks?.[task.id];
                if (!taskState || taskState.completed) return;
                
                if (task.type === 'kill' && task.monsterId === monsterId) {
                    taskState.progress++;
                    if (taskState.progress >= task.target) {
                        taskState.completed = true;
                        this._completeTask(questId, task);
                    }
                }
                
                if (task.type === 'kill_any') {
                    taskState.progress++;
                    if (taskState.progress >= task.target) {
                        taskState.completed = true;
                        this._completeTask(questId, task);
                    }
                }
            });
            
            state.tasksCompleted = Object.values(state.tasks || {}).filter(t => t.completed).length;
            if (state.tasksCompleted >= def.tasks.length) {
                this._completeChapter(questId, def);
            }
        });
        
        this._saveProgress();
    },
    
    _checkCollectQuests() {
        const player = Sherwood.getPlayer();
        
        Object.keys(this._quests).forEach(questId => {
            const def = this._definitions[questId];
            if (!def || def.isDungeonBoss) return;
            
            const state = this._quests[questId];
            if (!state || state.completed) return;
            
            def.tasks.forEach(task => {
                const taskState = state.tasks?.[task.id];
                if (!taskState || taskState.completed) return;
                
                if (task.type === 'collect') {
                    taskState.progress = player.resources[task.resource] || 0;
                    if (taskState.progress >= task.target) {
                        taskState.completed = true;
                        this._completeTask(questId, task);
                    }
                }
            });
            
            state.tasksCompleted = Object.values(state.tasks || {}).filter(t => t.completed).length;
            if (state.tasksCompleted >= def.tasks.length) {
                this._completeChapter(questId, def);
            }
        });
        
        this._saveProgress();
    },
    
    _checkEquipQuests(part) {
        Object.keys(this._quests).forEach(questId => {
            const def = this._definitions[questId];
            if (!def || def.isDungeonBoss) return;
            
            const state = this._quests[questId];
            if (!state || state.completed) return;
            
            def.tasks.forEach(task => {
                const taskState = state.tasks?.[task.id];
                if (!taskState || taskState.completed) return;
                
                if (task.type === 'equip' && task.part === part) {
                    taskState.completed = true;
                    this._completeTask(questId, task);
                }
            });
            
            state.tasksCompleted = Object.values(state.tasks || {}).filter(t => t.completed).length;
            if (state.tasksCompleted >= def.tasks.length) {
                this._completeChapter(questId, def);
            }
        });
        
        this._saveProgress();
    },
    
    _completeTask(questId, task) {
        if (task.reward) {
            // Для наград задач тоже применяем лимиты
            if (task.reward.gold || task.reward.silver) {
                const limited = this._applyDailyLimits(
                    task.reward.gold || 0, 
                    task.reward.silver || 0
                );
                if (limited.gold > 0) Sherwood.addResource('gold', limited.gold);
                if (limited.silver > 0) Sherwood.addResource('silver', limited.silver);
            }
            if (task.reward.exp) Sherwood.addExp(task.reward.exp);
            if (task.reward.trophies) Sherwood.addResource('trophies', task.reward.trophies);
            if (task.reward.item) {
                const item = Sherwood.EquipmentDB?.findById?.(task.reward.item);
                if (item) {
                    const player = Sherwood.getPlayer();
                    player.inventory.push({...item});
                    Sherwood.dispatch({ type: 'ITEM_ACQUIRED', payload: { item } });
                }
            }
        }
        
        Sherwood.dispatch({
            type: 'QUEST_TASK_COMPLETED',
            payload: { questId, taskId: task.id, task }
        });
    },
    
    _completeChapter(questId, def) {
        const state = this._quests[questId];
        state.completed = true;
        
        if (def.chapterReward) {
            const reward = def.chapterReward;
            if (reward.gold || reward.silver) {
                const limited = this._applyDailyLimits(reward.gold || 0, reward.silver || 0);
                if (limited.gold > 0) Sherwood.addResource('gold', limited.gold);
                if (limited.silver > 0) Sherwood.addResource('silver', limited.silver);
            }
            if (reward.exp) Sherwood.addExp(reward.exp);
            if (reward.item) {
                const item = Sherwood.EquipmentDB?.findById?.(reward.item);
                if (item) {
                    const player = Sherwood.getPlayer();
                    player.inventory.push({...item});
                }
            }
            if (reward.trophy) {
                Sherwood.addResource('trophies', 10);
            }
        }
        
        this._activeQuest = null;
        this._saveProgress();
        
        Sherwood.dispatch({
            type: 'QUEST_CHAPTER_COMPLETED',
            payload: { questId, chapter: def }
        });
    },
    
    _saveProgress() {
        const player = Sherwood.getPlayer();
        if (player) {
            player.questProgress = this._quests;
            player.lastQuestBattle = this._lastBattleTime;
            Sherwood.saveGame();
        }
    },
    
    getBossCooldownText() {
        const remaining = this.getBossCooldownRemaining();
        if (remaining <= 0) return 'Доступно!';
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    },
    
    canFightBoss(bossId) {
        const def = Object.values(this._definitions).find(d => d.bossId === bossId && d.isDungeonBoss);
        if (!def) return false;
        const player = Sherwood.getPlayer();
        if (!player || player.level < def.requiredLevel) return false;
        if (this._quests[def.id]?.completed) return false;
        if (!this.isBossAvailable(bossId)) return false;
        return true; // Бой доступен всегда, награда режется лимитами
    },
    
    getDailyLimits() {
        return {
            gold: {
                limit: this._dailyGoldLimit,
                earned: this._dailyGoldEarned,
                remaining: Math.max(0, this._dailyGoldLimit - this._dailyGoldEarned)
            },
            silver: {
                limit: this._dailySilverLimit,
                earned: this._dailySilverEarned,
                remaining: Math.max(0, this._dailySilverLimit - this._dailySilverEarned)
            }
        };
    }
};

// Инициализация босс-глав
Sherwood.Quests._generateBossChapters();

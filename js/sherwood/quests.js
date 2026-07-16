/**
 * Sherwood Quests System
 * Система квестов и прогрессии
 */

Sherwood.Quests = {
    _quests: {},
    _activeQuest: null,
    
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
            requiredLevel: 1
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
            requiredLevel: 3
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
            requiredLevel: 6
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
            requiredLevel: 10
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
            isFinalChapter: true
        },
        
        daily_patrol: {
            id: 'daily_patrol',
            type: 'daily',
            name: 'Лесной патруль',
            description: 'Ежедневный обход леса.',
            tasks: [
                {
                    id: 'daily_kills',
                    type: 'kill_any',
                    description: 'Убить любых монстров',
                    target: 10,
                    progress: 0,
                    reward: { gold: 30, silver: 100, exp: 60, trophies: 2 }
                }
            ],
            refreshTime: 'daily',
            requiredLevel: 2
        }
    },
    
    init() {
        const player = Sherwood.getPlayer();
        if (!player) return;
        
        this._quests = player.questProgress || {};
        
        Sherwood.on('BATTLE_VICTORY', (data) => {
            if (data.monster) {
                this._onMonsterKilled(data.monster);
            }
        });
        
        Sherwood.on('ITEM_ACQUIRED', (data) => {
            this._checkCollectQuests();
        });
        
        Sherwood.on('ITEM_EQUIPPED', (data) => {
            this._checkEquipQuests(data.part);
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
    
    getActiveQuest() {
        return this._activeQuest;
    },
    
    startChapter(chapterId) {
        const def = this._definitions[chapterId];
        if (!def) return null;
        
        const player = Sherwood.getPlayer();
        if (player.level < def.requiredLevel) return null;
        
        if (!this._quests[chapterId]) {
            this._quests[chapterId] = {
                started: true,
                completed: false,
                tasksCompleted: 0,
                tasks: {}
            };
        }
        
        def.tasks.forEach(task => {
            if (!this._quests[chapterId].tasks[task.id]) {
                this._quests[chapterId].tasks[task.id] = {
                    progress: 0,
                    completed: false
                };
            }
        });
        
        this._activeQuest = { ...def, questState: this._quests[chapterId] };
        this._saveProgress();
        
        return this._activeQuest;
    },
    
    _onMonsterKilled(monsterData) {
        const monsterId = monsterData.monsterId || 
            Object.keys(Sherwood.Monsters).find(k => 
                Sherwood.Monsters[k].name === monsterData.name
            );
        
        if (!monsterId) return;
        
        Object.keys(this._quests).forEach(questId => {
            const def = this._definitions[questId];
            if (!def) return;
            
            def.tasks.forEach(task => {
                const state = this._quests[questId]?.tasks?.[task.id];
                if (!state || state.completed) return;
                
                if (task.type === 'kill' && task.monsterId === monsterId) {
                    state.progress++;
                    if (state.progress >= task.target) {
                        state.completed = true;
                        this._completeTask(questId, task);
                    }
                }
                
                if (task.type === 'kill_any') {
                    state.progress++;
                    if (state.progress >= task.target) {
                        state.completed = true;
                        this._completeTask(questId, task);
                    }
                }
            });
        });
        
        this._saveProgress();
    },
    
    _checkCollectQuests() {
        const player = Sherwood.getPlayer();
        
        Object.keys(this._quests).forEach(questId => {
            const def = this._definitions[questId];
            if (!def) return;
            
            def.tasks.forEach(task => {
                const state = this._quests[questId]?.tasks?.[task.id];
                if (!state || state.completed) return;
                
                if (task.type === 'collect') {
                    state.progress = player.resources[task.resource] || 0;
                    if (state.progress >= task.target) {
                        state.completed = true;
                        this._completeTask(questId, task);
                    }
                }
            });
        });
        
        this._saveProgress();
    },
    
    _checkEquipQuests(part) {
        Object.keys(this._quests).forEach(questId => {
            const def = this._definitions[questId];
            if (!def) return;
            
            def.tasks.forEach(task => {
                const state = this._quests[questId]?.tasks?.[task.id];
                if (!state || state.completed) return;
                
                if (task.type === 'equip' && task.part === part) {
                    state.completed = true;
                    this._completeTask(questId, task);
                }
            });
        });
        
        this._saveProgress();
    },
    
    _completeTask(questId, task) {
        if (task.reward) {
            if (task.reward.gold) Sherwood.addResource('gold', task.reward.gold);
            if (task.reward.silver) Sherwood.addResource('silver', task.reward.silver);
            if (task.reward.exp) Sherwood.addExp(task.reward.exp);
            if (task.reward.trophies) Sherwood.addResource('trophies', task.reward.trophies);
            if (task.reward.item) {
                const item = Sherwood.EquipmentDB.findById(task.reward.item);
                if (item) {
                    const player = Sherwood.getPlayer();
                    player.inventory.push({...item});
                    Sherwood.dispatch({ type: 'ITEM_ACQUIRED', payload: { item } });
                }
            }
        }
        
        const def = this._definitions[questId];
        const state = this._quests[questId];
        state.tasksCompleted = Object.values(state.tasks).filter(t => t.completed).length;
        
        if (state.tasksCompleted >= def.tasks.length) {
            this._completeChapter(questId, def);
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
            if (def.chapterReward.gold) Sherwood.addResource('gold', def.chapterReward.gold);
            if (def.chapterReward.silver) Sherwood.addResource('silver', def.chapterReward.silver);
            if (def.chapterReward.exp) Sherwood.addExp(def.chapterReward.exp);
            if (def.chapterReward.item) {
                const item = Sherwood.EquipmentDB.findById(def.chapterReward.item);
                if (item) {
                    const player = Sherwood.getPlayer();
                    player.inventory.push({...item});
                }
            }
            if (def.chapterReward.trophy) {
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
            Sherwood.saveGame();
        }
    }
};

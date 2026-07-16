/**
 * Sherwood Tavern
 * Таверна «Весёлый Разбойник» — ежедневные задания от NPC
 */

Sherwood.Tavern = {
    _dailyQuests: [],
    _lastRefresh: null,
    
    init() {
        this._loadDailyQuests();
    },
    
    _loadDailyQuests() {
        const saved = localStorage.getItem('sherwood_tavern');
        
        if (saved) {
            const data = JSON.parse(saved);
            const today = new Date().toDateString();
            
            if (data.date === today) {
                this._dailyQuests = data.quests;
                this._lastRefresh = data.date;
                return;
            }
        }
        
        this._generateDailyQuests();
    },
    
    _generateDailyQuests() {
        const monsters = Object.values(Sherwood.Monsters).filter(m => !m.isBoss);
        const randomMonsters = monsters.sort(() => Math.random() - 0.5).slice(0, 3);
        
        this._dailyQuests = [
            {
                id: 'daily_patrol',
                name: 'Лесной патруль',
                description: 'Убить любых монстров в лесу',
                target: 8,
                progress: 0,
                reward: { gold: 25, silver: 100, exp: 60, trophies: 2 },
                completed: false,
                claimed: false
            },
            {
                id: 'daily_hunt',
                name: `Охота на ${randomMonsters[0]?.nameGenitive || 'монстров'}`,
                description: `Убить ${randomMonsters[0]?.nameGenitive || 'определённых монстров'}`,
                target: 4,
                monsterId: randomMonsters[0]?.id,
                progress: 0,
                reward: { gold: 35, silver: 150, exp: 80, trophies: 3 },
                completed: false,
                claimed: false
            },
            {
                id: 'daily_treasure',
                name: 'Богатая добыча',
                description: 'Накопить золотых монет',
                resource: 'gold',
                target: 100,
                progress: 0,
                reward: { gold: 20, silver: 80, exp: 50, trophies: 1 },
                completed: false,
                claimed: false
            }
        ];
        
        this._lastRefresh = new Date().toDateString();
        this._saveDailyQuests();
    },
    
    _saveDailyQuests() {
        try {
            localStorage.setItem('sherwood_tavern', JSON.stringify({
                date: this._lastRefresh,
                quests: this._dailyQuests
            }));
        } catch(e) {}
    },
    
    getDailyQuests() {
        return this._dailyQuests;
    },
    
    claimQuest(questId) {
        const quest = this._dailyQuests.find(q => q.id === questId);
        if (!quest || quest.claimed) return false;
        
        if (quest.completed) {
            quest.claimed = true;
            Sherwood.addResource('gold', quest.reward.gold);
            Sherwood.addResource('silver', quest.reward.silver);
            Sherwood.addExp(quest.reward.exp);
            if (quest.reward.trophies) Sherwood.addResource('trophies', quest.reward.trophies);
            
            this._saveDailyQuests();
            
            Sherwood.dispatch({
                type: 'TAVERN_QUEST_CLAIMED',
                payload: { questId, reward: quest.reward }
            });
            
            return true;
        }
        return false;
    },
    
    updateProgress(monsterId) {
        let updated = false;
        
        this._dailyQuests.forEach(quest => {
            if (quest.claimed) return;
            
            if (quest.monsterId && quest.monsterId === monsterId && quest.progress < quest.target) {
                quest.progress++;
                if (quest.progress >= quest.target) {
                    quest.completed = true;
                }
                updated = true;
            }
            
            if (!quest.monsterId && !quest.resource && quest.progress < quest.target) {
                quest.progress++;
                if (quest.progress >= quest.target) {
                    quest.completed = true;
                }
                updated = true;
            }
        });
        
        if (updated) this._saveDailyQuests();
    }
};

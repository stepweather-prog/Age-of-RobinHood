/**
 * Sherwood Events
 * Ивенты: Охота, Погоня за наградой, Зов огня
 */

Sherwood.Events = {
    _activeEvent: null,
    _eventProgress: {},
    
    EVENT_TYPES: {
        HUNT: 'hunt',
        CHASE: 'chase',
        FIRE_CALL: 'fire_call'
    },
    
    init() {
        this._loadEventState();
        this._checkActiveEvents();
    },
    
    _loadEventState() {
        const saved = localStorage.getItem('sherwood_events');
        if (saved) {
            const data = JSON.parse(saved);
            this._eventProgress = data.progress || {};
        }
    },
    
    _saveEventState() {
        try {
            localStorage.setItem('sherwood_events', JSON.stringify({
                progress: this._eventProgress,
                lastCheck: Date.now()
            }));
        } catch(e) {}
    },
    
    _checkActiveEvents() {
        // Проверяем, не истёк ли текущий ивент
        if (this._activeEvent && Date.now() > this._activeEvent.endTime) {
            this._activeEvent = null;
        }
        
        // Если нет активного — создаём новый
        if (!this._activeEvent) {
            this._generateRandomEvent();
        }
    },
    
    _generateRandomEvent() {
        const events = [
            {
                type: this.EVENT_TYPES.HUNT,
                name: 'Великая охота',
                description: 'Убей как можно больше гнилых волков!',
                monsterId: 'dire_wolf',
                duration: 86400000, // 24 часа
                rewards: {
                    1: { gold: 500, silver: 2000, item: 'sherwood_bow' },
                    2: { gold: 300, silver: 1000, item: 'ranger_hood' },
                    3: { gold: 150, silver: 500 },
                    5: { gold: 80, silver: 300 },
                    10: { gold: 40, silver: 150 }
                }
            },
            {
                type: this.EVENT_TYPES.CHASE,
                name: 'Погоня за наградой',
                description: 'Накопи как можно больше золота!',
                resource: 'gold',
                duration: 86400000,
                rewards: {
                    1: { gold: 1000, item: 'sherwood_armor' },
                    2: { gold: 500, item: 'elven_bow' },
                    3: { gold: 250, silver: 1000 }
                }
            },
            {
                type: this.EVENT_TYPES.FIRE_CALL,
                name: 'Зов огня',
                description: 'Победи как можно больше любых монстров!',
                duration: 43200000, // 12 часов
                rewards: {
                    1: { gold: 400, silver: 1500, trophies: 10 },
                    2: { gold: 200, silver: 800, trophies: 5 },
                    3: { gold: 100, silver: 400, trophies: 3 }
                }
            }
        ];
        
        this._activeEvent = {
            ...events[Math.floor(Math.random() * events.length)],
            startTime: Date.now(),
            endTime: Date.now() + events[0].duration
        };
        
        // Сбрасываем прогресс
        this._eventProgress[this._activeEvent.type] = {
            score: 0,
            started: Date.now()
        };
        
        this._saveEventState();
        
        Sherwood.dispatch({
            type: 'EVENT_STARTED',
            payload: this._activeEvent
        });
    },
    
    getActiveEvent() {
        this._checkActiveEvents();
        return this._activeEvent;
    },
    
    getProgress() {
        if (!this._activeEvent) return { score: 0 };
        return this._eventProgress[this._activeEvent.type] || { score: 0 };
    },
    
    addProgress(amount = 1) {
        if (!this._activeEvent) return;
        
        const type = this._activeEvent.type;
        if (!this._eventProgress[type]) {
            this._eventProgress[type] = { score: 0, started: Date.now() };
        }
        
        this._eventProgress[type].score += amount;
        this._saveEventState();
        
        Sherwood.dispatch({
            type: 'EVENT_PROGRESS',
            payload: { score: this._eventProgress[type].score }
        });
    },
    
    getRewardForPlace(place) {
        if (!this._activeEvent?.rewards) return null;
        return this._activeEvent.rewards[place] || null;
    }
};

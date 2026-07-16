/**
 * Sherwood Game UI
 * Игровой интерфейс для Шервудского леса
 */

function getAvatarUrl(avatarSrc) {
    if (!avatarSrc || avatarSrc === 'icons/01icon.png' || avatarSrc === '001') return 'assets/icons/01icon.png';
    if (typeof avatarSrc === 'string' && avatarSrc.startsWith('assets/')) return avatarSrc;
    if (typeof avatarSrc === 'string' && avatarSrc.match(/^\d+$/)) return 'assets/avatar/' + avatarSrc + 'ava.png';
    return 'assets/icons/01icon.png';
}

Sherwood.UI = {
    _currentScreen: null,
    _container: null,
    _battleInterval: null,
    
    init() {
        this._container = document.getElementById('sherwood-game');
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.id = 'sherwood-game';
            this._container.style.cssText = `
                position: fixed; top: 0; left: 0;
                width: 100%; height: 100%;
                background: var(--bg-primary);
                z-index: 500; overflow-y: auto;
                display: none;
            `;
            document.body.appendChild(this._container);
        }
        
        setTimeout(() => this._addGameButton(), 500);
        
        const gameBtn = document.getElementById('btn-game');
        const gameLabel = document.getElementById('label-game');
        if (gameBtn) gameBtn.onclick = () => this.toggle();
        if (gameLabel) gameLabel.onclick = () => this.toggle();
        
        Sherwood.on('BATTLE_VICTORY', (data) => this._onBattleVictory(data));
        Sherwood.on('BATTLE_DEFEAT', (data) => this._onBattleDefeat(data));
        Sherwood.on('PLAYER_LEVEL_UP', (data) => this._onLevelUp(data));
        Sherwood.on('QUEST_TASK_COMPLETED', (data) => this._onQuestTaskCompleted(data));
        Sherwood.on('QUEST_CHAPTER_COMPLETED', (data) => this._onChapterCompleted(data));
        
        this._initSounds();
    },
    
    _initSounds() {
        const sounds = {
            'shot': 'assets/sounds/shot.mp3',
            'arrow_hit': 'assets/sounds/arrow_hit.wav',
            'victory': 'assets/sounds/victory.wav',
            'defeat': 'assets/sounds/defeat.wav',
            'levelup': 'assets/sounds/levelup.wav',
            'chest_open': 'assets/sounds/chest_open.wav',
            'button_click': 'assets/sounds/button_click.ogg',
            'trap_trigger': 'assets/sounds/trap_trigger.wav',
            'dungeon_enter': 'assets/sounds/dungeon_enter.wav',
            'forest_ambient': 'assets/sounds/forest_ambient.ogg',
            'dungeon_ambient': 'assets/sounds/dungeon_ambient.wav',
            'tavern_ambient': 'assets/sounds/tavern_ambient.wav'
        };
        
        this._sounds = {};
        Object.entries(sounds).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.preload = 'auto';
            this._sounds[key] = audio;
        });
        
        this._currentMusic = null;
        this._soundEnabled = true;
    },
    
    _playSound(key, loop = false) {
        if (!this._soundEnabled) return;
        const sound = this._sounds[key];
        if (sound) {
            sound.loop = loop;
            sound.currentTime = 0;
            sound.volume = loop ? 0.3 : 0.5;
            sound.play().catch(() => {});
        }
    },
    
    _stopMusic() {
        if (this._currentMusic) {
            this._currentMusic.pause();
            this._currentMusic.currentTime = 0;
            this._currentMusic = null;
        }
    },
    
    _playMusic(key) {
        this._stopMusic();
        const music = this._sounds[key];
        if (music) {
            music.loop = true;
            music.volume = 0.3;
            music.play().catch(() => {});
            this._currentMusic = music;
        }
    },
    
    _addGameButton() {
        // Кнопка уже добавлена в HTML вручную
    },
    
    toggle() {
        if (!this._container) return;
        if (this._container.style.display === 'none' || !this._container.style.display) {
            this.show();
        } else {
            this.hide();
        }
    },
    
    show() {
        if (!this._container) return;
        this._container.style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
        this._playMusic('forest_ambient');
        this.showMainMenu();
    },
    
    hide() {
        if (!this._container) return;
        this._container.style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        this._stopMusic();
    },
    
    showScreen(screenName) {
        this._currentScreen = screenName;
    },
    
    // ===== ГЛАВНОЕ МЕНЮ (в стиле Age of Revenge) =====
    showMainMenu() {
        const player = Sherwood.getPlayer();
        if (!player) {
            this._container.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:40px;">Загрузка...</div>';
            setTimeout(() => this.showMainMenu(), 500);
            return;
        }
        
        this._playMusic('forest_ambient');
        const expPercent = (player.exp / player.expToLevel * 100).toFixed(0);
        
        this._container.style.background = "url('assets/icons/bg_main.png') center/cover no-repeat";
        
        this._container.innerHTML = `
            <div style="position:relative;min-height:100%;display:flex;flex-direction:column;align-items:center;
                        background:linear-gradient(180deg,rgba(0,0,0,0.4) 0%,rgba(0,0,0,0.6) 100%);padding:10px 16px 20px;">
                
                <!-- Шапка с ресурсами -->
                <div style="width:100%;max-width:500px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.6);border-radius:20px;padding:6px 14px;">
                        <img src="${getAvatarUrl(player.avatar)}" style="width:28px;height:28px;border-radius:50%;border:2px solid #c9a040;" onerror="this.src='assets/icons/01icon.png'">
                        <span style="color:#e0c080;font-weight:bold;font-size:0.9em;">Ур.${player.level}</span>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <div style="background:rgba(0,0,0,0.6);border-radius:16px;padding:4px 12px;display:flex;align-items:center;gap:4px;">
                            <span style="color:#ffd700;font-size:0.9em;">🪙${player.resources.gold}</span>
                        </div>
                        <div style="background:rgba(0,0,0,0.6);border-radius:16px;padding:4px 12px;display:flex;align-items:center;gap:4px;">
                            <span style="color:#c0c0c0;font-size:0.9em;">⚪${player.resources.silver}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Персонаж -->
                <div style="position:relative;width:220px;height:320px;margin:10px 0;display:flex;align-items:center;justify-content:center;">
                    <div style="position:absolute;bottom:0;width:180px;height:30px;background:radial-gradient(ellipse,rgba(0,0,0,0.7) 0%,transparent 70%);border-radius:50%;"></div>
                    <img src="assets/icons/Male Archer.png" style="position:relative;z-index:1;max-height:300px;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.5));" onerror="this.style.display='none'">
                    <!-- Опыт -->
                    <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:160px;text-align:center;">
                        <div style="background:rgba(0,0,0,0.7);border-radius:10px;height:6px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg,#c9a040,#ffd700);height:100%;width:${expPercent}%;transition:width 0.5s;"></div>
                        </div>
                        <div style="font-size:0.65em;color:#c9a040;margin-top:2px;">✨ ${player.exp}/${player.expToLevel}</div>
                    </div>
                </div>
                
                <!-- Статы -->
                <div style="display:flex;gap:12px;margin-bottom:12px;">
                    <span style="color:#f44336;font-size:0.85em;">⚔️${player.stats.attack}</span>
                    <span style="color:#2196f3;font-size:0.85em;">🛡️${player.stats.defense}</span>
                    <span style="color:#4caf50;font-size:0.85em;">❤️${player.stats.hp}/${player.stats.maxHp}</span>
                </div>
                
                <!-- Сферы (Квесты / Чащоба / Портал) -->
                <div style="display:flex;justify-content:center;align-items:center;gap:20px;width:100%;max-width:400px;margin-bottom:12px;">
                    <!-- Квесты -->
                    <div onclick="Sherwood.UI.showQuests()" style="cursor:pointer;text-align:center;">
                        <div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#c9a040,#8b6914);border:3px solid #ffd700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(201,160,64,0.4);margin:0 auto;">
                            <span style="font-size:2em;">⚔️</span>
                        </div>
                        <div style="color:#ffd700;font-size:0.7em;margin-top:4px;">Вылазки</div>
                    </div>
                    
                    <!-- Чащоба -->
                    <div onclick="Sherwood.UI.showDungeon()" style="cursor:pointer;text-align:center;">
                        <div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#4a7ac4,#1a3a6a);border:3px solid #70a0e0;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(74,122,196,0.4);margin:0 auto;">
                            <span style="font-size:2em;">🌲</span>
                        </div>
                        <div style="color:#70a0e0;font-size:0.7em;margin-top:4px;">Чащоба</div>
                    </div>
                    
                    <!-- Портал -->
                    <div onclick="Sherwood.UI.showPortal()" style="cursor:pointer;text-align:center;">
                        <div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#4ac470,#1a5a2a);border:3px solid #60e090;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(74,196,112,0.4);margin:0 auto;">
                            <span style="font-size:2em;">🌳</span>
                        </div>
                        <div style="color:#60e090;font-size:0.7em;margin-top:4px;">Дуб</div>
                    </div>
                </div>
                
                <!-- Меню-полоса -->
                <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:400px;">
                    ${this._menuIcon('👤', 'Профиль', 'Sherwood.UI.showProfile()')}
                    ${this._menuIcon('🎯', 'Турнир', 'Sherwood.UI.showArena()')}
                    ${this._menuIcon('👹', 'Логово', 'Sherwood.UI.showRaid()')}
                    ${this._menuIcon('🍺', 'Таверна', 'Sherwood.UI.showTavern()')}
                    ${this._menuIcon('📖', 'Дневник', 'Sherwood.UI.showBestiary()')}
                    ${this._menuIcon('💰', 'Схрон', 'Sherwood.UI.showBlackMarket()')}
                    ${this._menuIcon('🎪', 'Ивенты', 'Sherwood.UI.showEvents()')}
                </div>
                
                <!-- Кнопка выхода -->
                <button onclick="Sherwood.UI.hide()" style="margin-top:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:var(--text-dim);padding:6px 20px;border-radius:14px;cursor:pointer;font-size:0.8em;">✕ Выйти</button>
            </div>
        `;
        
        this.showScreen('main_menu');
    },
    
    _menuIcon(emoji, label, onclick) {
        return `
            <div onclick="${onclick}" style="cursor:pointer;text-align:center;width:60px;">
                <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto;transition:all 0.15s;">
                    <span style="font-size:1.3em;">${emoji}</span>
                </div>
                <div style="color:var(--text-dim);font-size:0.6em;margin-top:3px;">${label}</div>
            </div>
        `;
    },
    
    // ===== ПРОФИЛЬ =====
    showProfile() {
        const player = Sherwood.getPlayer();
        if (!player) return;
        
        this._container.style.background = "var(--bg-primary)";
        const expPercent = (player.exp / player.expToLevel * 100).toFixed(0);
        
        const parts = [
            { key: 'head', name: 'Голова', icon: '🎩' },
            { key: 'shoulders', name: 'Плечи', icon: '🧣' },
            { key: 'torso', name: 'Торс', icon: '👕' },
            { key: 'hands', name: 'Руки', icon: '🧤' },
            { key: 'legs', name: 'Ноги', icon: '👖' },
            { key: 'feet', name: 'Ступни', icon: '👢' },
            { key: 'weapon1', name: 'Оружие 1', icon: '🏹' },
            { key: 'weapon2', name: 'Оружие 2', icon: '🗡️' }
        ];
        
        let equipmentHtml = '';
        parts.forEach(part => {
            const item = player.equipment[part.key];
            const gradeColor = item ? (Sherwood.Models?.GradeColors?.[item.grade] || '#9d9d9d') : 'transparent';
            equipmentHtml += `
                <div style="background:var(--btn-bg);border:1px solid var(--btn-border);border-left:3px solid ${gradeColor};border-radius:10px;padding:12px;margin-bottom:6px;cursor:pointer;" onclick="Sherwood.UI._onEquipSlotClick('${part.key}')">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span>${part.icon}</span>
                        <div style="flex:1;"><div style="font-size:0.75em;color:var(--text-dim);">${part.name}</div><div style="color:${item ? 'var(--text-bright)' : 'var(--text-dim)'};">${item ? item.name : 'Пусто'}</div></div>
                        <span style="color:var(--text-dim);">→</span>
                    </div>
                </div>
            `;
        });
        
        let inventoryHtml = player.inventory.length === 0 
            ? '<div style="color:var(--text-dim);text-align:center;padding:20px;">Пусто</div>'
            : player.inventory.map((item, i) => {
                const gc = Sherwood.Models?.GradeColors?.[item.grade] || '#9d9d9d';
                return `<div style="background:var(--btn-bg);border:1px solid var(--btn-border);border-left:3px solid ${gc};border-radius:10px;padding:10px;margin-bottom:4px;display:flex;align-items:center;gap:8px;">
                    <span>📦</span><div style="flex:1;"><div style="color:var(--text-bright);">${item.name}</div><div style="font-size:0.7em;color:${gc};">${item.grade?.toUpperCase()}</div></div>
                    <button onclick="Sherwood.UI._onEquipItem(${i})" style="background:var(--btn-bg);border:1px solid var(--btn-border);color:var(--text);padding:4px 10px;border-radius:6px;cursor:pointer;">Надеть</button>
                </div>`;
            }).join('');
        
        this._container.innerHTML = `
            <div style="padding:16px;max-width:500px;margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" style="background:var(--btn-bg);border:1px solid var(--btn-border);color:var(--text);padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button>
                <div style="text-align:center;">
                    <img src="${getAvatarUrl(player.avatar)}" style="width:70px;height:70px;border-radius:50%;border:3px solid var(--accent);" onerror="this.src='assets/icons/01icon.png'">
                    <h3 style="color:var(--accent-light);margin:6px 0;">${player.name}</h3>
                    <div>Ур.${player.level} | ✨${player.exp}/${player.expToLevel}</div>
                    <div style="background:rgba(255,255,255,0.1);border-radius:6px;height:6px;margin:6px 0;"><div style="background:#4caf50;height:100%;width:${expPercent}%;border-radius:6px;"></div></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0;font-size:0.85em;">
                    <div>⚔️Атака: <b style="color:#f44336;">${player.stats.attack}</b></div>
                    <div>🛡️Защита: <b style="color:#2196f3;">${player.stats.defense}</b></div>
                    <div>❤️HP: <b style="color:#4caf50;">${player.stats.hp}/${player.stats.maxHp}</b></div>
                    <div>💨Ловкость: <b style="color:#ff9800;">${player.stats.agility}</b></div>
                </div>
                <h4 style="color:var(--accent-light);margin:12px 0 6px;">🎒 Экипировка</h4>
                ${equipmentHtml}
                <h4 style="color:var(--accent-light);margin:12px 0 6px;">📦 Инвентарь (${player.inventory.length}/${player.bagSize})</h4>
                ${inventoryHtml}
            </div>
        `;
    },
    
    _onEquipSlotClick(part) {
        const player = Sherwood.getPlayer();
        const item = player.equipment[part];
        if (item && confirm(`Снять "${item.name}"?`)) { Sherwood.unequipItem(part); this.showProfile(); }
    },
    
    _onEquipItem(index) {
        const player = Sherwood.getPlayer();
        const item = player.inventory[index];
        if (item) { Sherwood.equipItem(item); player.inventory.splice(index, 1); this.showProfile(); }
    },
    
    // ===== ВЫЛАЗКИ =====
    showQuests() {
        this._container.style.background = "url('assets/icons/bg_quest.png') center/cover no-repeat";
        const chapters = Sherwood.Quests.getAvailableChapters();
        
        let chaptersHtml = chapters.map(ch => {
            const pct = ch.totalTasks > 0 ? (ch.tasksCompleted / ch.totalTasks * 100) : 0;
            return `<div onclick="Sherwood.UI._startQuest('${ch.id}')" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:1.5em;">📜</span>
                    <div style="flex:1;"><b style="color:#ffd700;">Гл.${ch.chapter}: ${ch.name}</b><div style="font-size:0.75em;color:#aaa;">${ch.tasksCompleted}/${ch.totalTasks}</div></div>
                    ${ch.completed ? '✅' : '→'}
                </div>
                ${!ch.completed ? `<div style="background:rgba(255,255,255,0.1);border-radius:4px;height:4px;margin-top:6px;"><div style="background:#ffd700;height:100%;width:${pct}%;border-radius:4px;"></div></div>` : ''}
            </div>`;
        }).join('') || '<div style="color:#aaa;text-align:center;padding:20px;">Нет доступных глав. Повышай уровень!</div>';
        
        this._container.innerHTML = `
            <div style="background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));min-height:100%;padding:16px;max-width:500px;margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button>
                <h2 style="color:#ffd700;margin:0 0 12px;">⚔️ Вылазки</h2>
                ${chaptersHtml}
                <h3 style="color:#ffd700;margin:16px 0 8px;">⚡ Быстрый бой</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    ${this._quickFight('forest_spider','🕷️','Лесной паук')}
                    ${this._quickFight('dire_wolf','🐺','Гнилой волк')}
                    ${this._quickFight('swamp_ghoul','🧟','Болотный упырь')}
                    ${this._quickFight('guard','🛡️','Стражник')}
                </div>
            </div>
        `;
    },
    
    _quickFight(id, icon, name) {
        return `<button onclick="Sherwood.UI.startBattle('${id}')" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px;color:#fff;cursor:pointer;text-align:center;">
            <div style="font-size:1.8em;">${icon}</div><div style="font-size:0.8em;">${name}</div>
        </button>`;
    },
    
    _startQuest(questId) {
        const quest = Sherwood.Quests.startChapter(questId);
        if (!quest) return;
        
        let tasksHtml = quest.tasks.map(task => {
            const st = quest.questState.tasks[task.id];
            const pct = st ? (st.progress / task.target * 100) : 0;
            const done = st?.completed;
            return `<div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;"><span>${done ? '✅' : '⬜'}</span><span>${task.description}</span></div>
                ${!done ? `<div style="font-size:0.7em;color:#aaa;">${st?.progress||0}/${task.target}</div><div style="background:rgba(255,255,255,0.1);border-radius:3px;height:3px;margin-top:4px;"><div style="background:#4caf50;height:100%;width:${pct}%;border-radius:3px;"></div></div>` : ''}
            </div>`;
        }).join('');
        
        const done = quest.questState.completed;
        this._container.innerHTML = `
            <div style="background:var(--bg-primary);min-height:100%;padding:16px;max-width:500px;margin:0 auto;">
                <button onclick="Sherwood.UI.showQuests()" style="background:var(--btn-bg);border:1px solid var(--btn-border);color:var(--text);padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button>
                <h2 style="color:#ffd700;">Гл.${quest.chapter}: ${quest.name}</h2>
                <p style="color:var(--text-dim);">${quest.description}</p>
                ${tasksHtml}
                ${done ? `<div style="background:rgba(255,215,0,0.15);border:2px solid gold;border-radius:10px;padding:14px;text-align:center;margin-top:10px;"><div style="color:gold;font-size:1.1em;">🏆 Глава завершена!</div><div style="color:#fff;">🪙${quest.chapterReward.gold||0} ⚪${quest.chapterReward.silver||0} ✨${quest.chapterReward.exp||0}XP</div></div>` : ''}
            </div>
        `;
    },
    
    // ===== БОЙ =====
    startBattle(monsterId) {
        const battle = Sherwood.Combat.startPvE(monsterId);
        if (!battle) return;
        this._playSound('shot');
        this._playMusic('dungeon_ambient');
        this._container.style.background = "url('assets/icons/bg_battle.png') center/cover no-repeat";
        this._renderBattle();
    },
    
    _renderBattle() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle) return;
        
        const enemy = battle.monster;
        const player = battle.player;
        const monster = Sherwood.Monsters[battle.monsterId];
        const eHp = Math.max(0, (enemy.currentHp / enemy.stats.hp * 100)).toFixed(0);
        const pHp = Math.max(0, (player.currentHp / player.stats.hp * 100)).toFixed(0);
        
        const skills = Sherwood.Combat._getPlayerSkills();
        let skillsHtml = Object.values(skills).map(s => {
            const cd = battle.cooldowns[s.id] > 0;
            return `<button onclick="Sherwood.UI._onSkillClick('${s.id}')" style="flex:1;padding:10px;background:linear-gradient(135deg,#c9a040,#8b6914);border:none;border-radius:8px;color:#fff;font-weight:bold;cursor:pointer;${cd?'opacity:0.5':''}" ${cd?'disabled':''}>${s.name}${cd?' ('+battle.cooldowns[s.id]+')':''}</button>`;
        }).join('');
        
        this._container.innerHTML = `
            <div style="background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));min-height:100%;padding:16px;max-width:500px;margin:0 auto;">
                <button onclick="Sherwood.UI._fleeBattle()" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">🏃 Бежать</button>
                
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="font-size:4em;">${monster?.icon||'👹'}</div>
                    <div style="font-weight:bold;color:#fff;font-size:1.1em;">${enemy.name}</div>
                    <div style="font-size:0.75em;color:#aaa;">⚔️${enemy.stats.attack} 🛡️${enemy.stats.defense}</div>
                    <div style="background:rgba(255,0,0,0.3);border-radius:6px;height:8px;margin-top:6px;"><div style="background:#f44336;height:100%;width:${eHp}%;border-radius:6px;"></div></div>
                    <div style="font-size:0.7em;color:#f44336;">❤️${Math.max(0,enemy.currentHp)}/${enemy.stats.hp}</div>
                </div>
                
                <div style="text-align:center;font-size:1.3em;color:#ffd700;margin:10px 0;">⚡ VS ⚡</div>
                
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="color:#fff;">${player.name||'Вы'}</div>
                    <div style="background:rgba(76,175,80,0.3);border-radius:6px;height:8px;margin-top:4px;"><div style="background:#4caf50;height:100%;width:${pHp}%;border-radius:6px;"></div></div>
                    <div style="font-size:0.7em;color:#4caf50;">❤️${Math.max(0,player.currentHp)}/${player.stats.hp}</div>
                </div>
                
                <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <button onclick="Sherwood.UI._onAttackClick()" style="flex:1;padding:12px;background:linear-gradient(135deg,#c44050,#8b2030);border:none;border-radius:8px;color:#fff;font-weight:bold;cursor:pointer;" ${battle.turn!=='player'?'disabled':''}>⚔️ Атака</button>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">${skillsHtml}</div>
                <div id="battle-log" style="margin-top:12px;max-height:120px;overflow-y:auto;font-size:0.75em;color:#aaa;"></div>
            </div>
        `;
    },
    
    _onAttackClick() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle || battle.turn !== 'player') return;
        this._playSound('arrow_hit');
        const result = Sherwood.Combat.playerAttack();
        this._updateBattleUI();
        if (result) {
            this._addBattleLog('🗡️','Вы нанесли '+result.damage+' урона!','#4caf50');
            if (result.crit) this._addBattleLog('💥','Крит!','#ff9800');
        }
    },
    
    _onSkillClick(skillId) {
        const result = Sherwood.Combat.playerUseSkill(skillId);
        this._playSound('arrow_hit');
        this._updateBattleUI();
        if (result) {
            const skills = Sherwood.Combat._getPlayerSkills();
            this._addBattleLog('🎯',skills[skillId].name+': '+result.damage+' урона!','#ff9800');
            if (result.crit) this._addBattleLog('💥','Крит!','#ff9800');
        }
    },
    
    _fleeBattle() {
        if (Sherwood.Combat.flee()) { this._playMusic('forest_ambient'); this.showMainMenu(); }
        else { this._addBattleLog('🏃','Не вышло!','#f44336'); this._updateBattleUI(); }
    },
    
    _updateBattleUI() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle) { this._playMusic('forest_ambient'); this.showMainMenu(); return; }
        if (battle.status === 'active') {
            this._renderBattle();
            battle.log.slice(-2).forEach(log => {
                if (log.actor==='enemy'&&!log.displayed) {
                    log.displayed=true;
                    this._addBattleLog('💢',battle.monster.name+' нанёс '+log.damage+' урона!','#f44336');
                }
            });
        }
    },
    
    _addBattleLog(icon,text,color) {
        const log = document.getElementById('battle-log');
        if (!log) return;
        const d = document.createElement('div');
        d.textContent = icon+' '+text;
        d.style.cssText = `color:${color};margin-bottom:3px;`;
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
    },
    
    _onBattleVictory(data) {
        this._playSound('victory');
        setTimeout(() => {
            const battle = Sherwood.Combat.getBattle();
            if (battle?.dungeonTile) { Sherwood.Combat.endBattle(); this._playMusic('dungeon_ambient'); this._renderDungeon(); }
            else { Sherwood.Combat.endBattle(); this._playMusic('forest_ambient'); this.showQuests(); }
        }, 300);
    },
    
    _onBattleDefeat() {
        this._playSound('defeat');
        setTimeout(() => {
            Sherwood.Combat.endBattle();
            const p = Sherwood.getPlayer(); p.stats.hp = Math.floor(p.stats.maxHp/2);
            this._playMusic('forest_ambient'); this.showMainMenu();
        }, 300);
    },
    
    _onLevelUp(data) { this._playSound('levelup'); },
    _onQuestTaskCompleted() {
        if (this._currentScreen==='quest_detail') { const q = Sherwood.Quests.getActiveQuest(); if (q) this._startQuest(q.id); }
    },
    _onChapterCompleted() { this._playSound('victory'); },
    
    // ===== ЧАЩОБА =====
    showDungeon() {
        this._container.style.background = "url('assets/icons/bg_dungeon.png') center/cover no-repeat";
        const player = Sherwood.getPlayer();
        this._container.innerHTML = `
            <div style="background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));min-height:100%;padding:16px;max-width:500px;margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button>
                <h2 style="color:#70a0e0;">🌲 Чащоба</h2>
                <div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:14px;text-align:center;margin:10px 0;">
                    <div style="font-size:3em;">🌲</div>
                    <p style="color:#aaa;">Исследуй глубины леса. Открывай туман войны, сражайся с монстрами, находи сундуки.</p>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <div style="flex:1;background:rgba(0,0,0,0.5);border-radius:8px;padding:8px;text-align:center;"><span style="color:#70a0e0;">🎫 ${player.dungeon.tickets}/${player.dungeon.maxTickets}</span></div>
                    <div style="flex:1;background:rgba(0,0,0,0.5);border-radius:8px;padding:8px;text-align:center;"><span style="color:#4caf50;">❤️ ${player.stats.hp}/${player.stats.maxHp}</span></div>
                </div>
                ${this._dungeonBtn('easy','🌿','Лёгкая прогулка','3-5 монстров')}
                ${this._dungeonBtn('normal','🌲','Обычная чащоба','5-7 монстров')}
                ${this._dungeonBtn('hard','🌳','Гиблое место','7-9 монстров')}
            </div>
        `;
    },
    
    _dungeonBtn(diff, icon, name, desc) {
        const p = Sherwood.getPlayer();
        const disabled = p.dungeon.tickets <= 0;
        return `<button onclick="Sherwood.UI._startDungeon('${diff}')" style="width:100%;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px;margin-bottom:6px;color:#fff;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;" ${disabled?'disabled':''}>
            <span style="font-size:1.5em;">${icon}</span><div><div>${name}</div><div style="font-size:0.7em;color:#aaa;">${desc}</div></div><span style="margin-left:auto;">→</span>
        </button>`;
    },
    
    _startDungeon(difficulty) {
        const d = Sherwood.Dungeon.generateDungeon(difficulty);
        if (!d) { alert('Нет билетов!'); return; }
        this._playSound('dungeon_enter');
        this._playMusic('dungeon_ambient');
        this._renderDungeon();
    },
    
    _renderDungeon() {
        const d = Sherwood.Dungeon.getDungeon();
        if (!d) { this.showDungeon(); return; }
        
        let gridHtml = '';
        for (let y = 0; y < d.size; y++) {
            gridHtml += '<div style="display:flex;justify-content:center;gap:3px;margin-bottom:3px;">';
            for (let x = 0; x < d.size; x++) {
                const tile = d.grid[y][x];
                const isPlayer = d.playerPos.x === x && d.playerPos.y === y;
                const explored = tile.explored;
                let emoji = '⬛', bg = 'rgba(0,0,0,0.6)';
                if (explored || isPlayer) {
                    bg = 'rgba(255,255,255,0.08)';
                    switch(tile.type) {
                        case 'start': emoji='🏠'; break;
                        case 'empty': emoji='🌿'; break;
                        case 'monster': emoji=tile.monsterId?'💀':'👹'; break;
                        case 'chest': emoji=tile.looted?'📦':'🎁'; break;
                        case 'trap': emoji=tile.triggered?'💢':'⚠️'; break;
                        case 'heal': emoji=tile.used?'💚':'💊'; break;
                        case 'exit': emoji='🚪'; break;
                    }
                }
                if (isPlayer) { emoji='🏹'; bg='rgba(112,160,224,0.4)'; }
                gridHtml += `<div style="width:42px;height:42px;background:${bg};border:1px solid rgba(255,255,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2em;">${emoji}</div>`;
            }
            gridHtml += '</div>';
        }
        
        const player = Sherwood.getPlayer();
        this._container.innerHTML = `
            <div style="background:rgba(0,0,0,0.7);min-height:100%;padding:16px;max-width:500px;margin:0 auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <button onclick="Sherwood.UI._leaveDungeon()" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer;">← Выйти</button>
                    <div style="text-align:center;color:#70a0e0;">🌲 Чащоба<div style="font-size:0.7em;color:#aaa;">${d.tilesExplored}/${d.totalTiles}</div></div>
                    <div style="color:#4caf50;font-size:0.85em;">❤️${player.stats.hp}/${player.stats.maxHp}</div>
                </div>
                ${gridHtml}
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;max-width:160px;margin:10px auto;">
                    <div></div><button onclick="Sherwood.UI._dungeonMove('up')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;padding:10px;cursor:pointer;">⬆️</button><div></div>
                    <button onclick="Sherwood.UI._dungeonMove('left')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;padding:10px;cursor:pointer;">⬅️</button>
                    <div style="text-align:center;color:#aaa;">🚶</div>
                    <button onclick="Sherwood.UI._dungeonMove('right')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;padding:10px;cursor:pointer;">➡️</button>
                    <div></div><button onclick="Sherwood.UI._dungeonMove('down')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;padding:10px;cursor:pointer;">⬇️</button><div></div>
                </div>
                <div id="dungeon-log" style="text-align:center;font-size:0.75em;color:#aaa;min-height:18px;margin-top:6px;"></div>
            </div>
        `;
    },
    
    _dungeonMove(dir) {
        const result = Sherwood.Dungeon.movePlayer(dir);
        if (!result) return;
        const log = document.getElementById('dungeon-log');
        if (!result.success && result.reason==='edge') { if(log)log.textContent='🚫 Край'; return; }
        
        switch(result.type) {
            case 'monster': if(log)log.textContent='⚔️ Монстр!'; this._renderDungeon(); const b = Sherwood.Dungeon.fightMonster(result.tile); if(b) setTimeout(()=>this._renderBattle(),300); break;
            case 'chest': this._playSound('chest_open'); if(log){const g=result.reward?.gold||0;const s=result.reward?.silver||0;log.textContent=`🎁 +${g}🪙 +${s}⚪${result.item?' | Предмет!':''}`;} this._renderDungeon(); break;
            case 'trap': this._playSound('trap_trigger'); if(log)log.textContent=`⚠️ -${result.damage} HP`; this._renderDungeon(); break;
            case 'heal': if(log)log.textContent=`💚 +${result.healAmount} HP`; this._renderDungeon(); break;
            case 'exit': if(log)log.textContent='🏆 Пройдено!'; this._renderDungeon(); setTimeout(()=>{this._playMusic('forest_ambient');this.showDungeon();},1500); break;
            case 'empty': if(log)log.textContent=''; this._renderDungeon(); break;
        }
        
        const p = Sherwood.getPlayer();
        if (p.stats.hp<=0) { if(log)log.textContent='💀 Сознание потеряно...'; setTimeout(()=>{Sherwood.Dungeon.leaveDungeon();p.stats.hp=Math.floor(p.stats.maxHp/3);this._playMusic('forest_ambient');this.showDungeon();},1500); }
    },
    
    _leaveDungeon() { if(confirm('Выйти? Прогресс потеряется.')){Sherwood.Dungeon.leaveDungeon();this._playMusic('forest_ambient');this.showDungeon();} },
    
    // ===== ОСТАЛЬНЫЕ ЭКРАНЫ =====
    showArena() { this._placeholder('🎯 Турнир лучников','PvP Арена в разработке.'); },
    showRaid() { this._container.style.background="var(--bg-primary)";this._container.innerHTML=`<div style="padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:var(--btn-bg);border:1px solid var(--btn-border);color:var(--text);padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#f44336;">👹 Логово</h2><button onclick="Sherwood.UI.startBattle('sheriff_nottingham')" style="width:100%;background:var(--btn-bg);border:1px solid var(--btn-border);border-radius:10px;padding:14px;margin-bottom:8px;color:#fff;cursor:pointer;text-align:left;">🎯 Шериф Ноттингемский ⚔️30 🛡️22 ❤️500</button><button onclick="Sherwood.UI.startBattle('black_knight')" style="width:100%;background:var(--btn-bg);border:1px solid var(--btn-border);border-radius:10px;padding:14px;margin-bottom:8px;color:#fff;cursor:pointer;text-align:left;">⚫ Чёрный рыцарь ⚔️35 🛡️28 ❤️650</button><button onclick="Sherwood.UI.startBattle('ancient_ent')" style="width:100%;background:var(--btn-bg);border:1px solid var(--btn-border);border-radius:10px;padding:14px;color:#fff;cursor:pointer;text-align:left;">🌳 Древний энт ⚔️28 🛡️35 ❤️800</button></div>`; },
    showTavern() { this._playMusic('tavern_ambient'); this._placeholder('🍺 Таверна','Ежедневные задания в разработке.'); },
    showPortal() { const p=Sherwood.getPlayer(); this._container.style.background="var(--bg-primary)";this._container.innerHTML=`<div style="padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:var(--btn-bg);border:1px solid var(--btn-border);color:var(--text);padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#4caf50;">🌳 Древний дуб</h2><div style="background:var(--btn-bg);border:1px solid var(--btn-border);border-radius:10px;padding:20px;text-align:center;"><div style="font-size:4em;">🌳</div><p style="color:var(--text-dim);">Требуется: 🏆 50 трофеев</p><p style="color:var(--accent-light);">У вас: 🏆 ${p.resources.trophies}</p></div></div>`; },
    showBlackMarket() { this._placeholder('💰 Разбойничий схрон','Рынок в разработке.'); },
    showBestiary() { const p=Sherwood.getPlayer(); let h=''; Object.values(Sherwood.Monsters).forEach(m=>{const k=p.bestiary[m.id]?.killed||0;const b=m.bestiaryBonus&&k>=m.bestiaryBonus.kills;h+=`<div style="background:var(--btn-bg);border:1px solid var(--btn-border);border-left:3px solid ${b?'gold':'var(--btn-border)'};border-radius:10px;padding:10px;margin-bottom:6px;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.5em;">${m.icon}</span><div style="flex:1;"><b>${m.name}</b><div style="font-size:0.7em;color:#aaa;">${m.description}</div><div style="color:var(--accent-light);">Убито: ${k}</div>${b?'<span style="color:gold;">✅ Бонус</span>':''}</div>${m.isBoss?'👑':''}</div></div>`}); this._container.innerHTML=`<div style="padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:var(--btn-bg);border:1px solid var(--btn-border);color:var(--text);padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:var(--accent-light);">📖 Охотничий дневник</h2>${h}</div>`; },
    showEvents() { this._placeholder('🎪 Ивенты','Охота, Погоня, Зов огня — в разработке.'); },
    
    _placeholder(title,text) {
        this._container.style.background="var(--bg-primary)";
        this._container.innerHTML=`<div style="padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:var(--btn-bg);border:1px solid var(--btn-border);color:var(--text);padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:var(--accent-light);">${title}</h2><div style="background:var(--btn-bg);border:1px solid var(--btn-border);border-radius:12px;padding:30px;text-align:center;"><div style="font-size:4em;">🏗️</div><p style="color:var(--text-dim);white-space:pre-line;">${text}</p></div></div>`;
    }
};

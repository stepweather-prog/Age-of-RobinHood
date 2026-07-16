/**
 * Sherwood Game UI
 * Базовый игровой интерфейс для Шервудского леса
 * Интегрируется с RobinHood P2P мессенджером
 */

// Вспомогательная функция для получения URL аватара
function getAvatarUrl(avatarSrc) {
    if (!avatarSrc || avatarSrc === 'icons/01icon.png') return 'assets/icons/01icon.png';
    if (typeof avatarSrc === 'string' && avatarSrc.startsWith('assets/')) return avatarSrc;
    if (typeof avatarSrc === 'string' && avatarSrc.match(/^\d+$/)) return 'assets/avatar/' + avatarSrc + 'ava.png';
    return 'assets/icons/01icon.png';
}

Sherwood.UI = {
    _currentScreen: null,
    _container: null,
    _battleInterval: null,
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    init() {
        this._container = document.getElementById('sherwood-game');
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.id = 'sherwood-game';
            this._container.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: var(--bg-primary);
                z-index: 500;
                overflow-y: auto;
                display: none;
            `;
            document.body.appendChild(this._container);
        }
        
        setTimeout(() => this._addGameButton(), 500);
    
    // Привязываем кнопку и подпись Шервуда
    const gameBtn = document.getElementById('btn-game');
    const gameLabel = document.getElementById('label-game');
    if (gameBtn) gameBtn.onclick = () => this.toggle();
    if (gameLabel) gameLabel.onclick = () => this.toggle();
    
    Sherwood.on('BATTLE_VICTORY', (data) => this._onBattleVictory(data));
    Sherwood.on('BATTLE_DEFEAT', (data) => this._onBattleDefeat(data));
    Sherwood.on('PLAYER_LEVEL_UP', (data) => this._onLevelUp(data));
    Sherwood.on('QUEST_TASK_COMPLETED', (data) => this._onQuestTaskCompleted(data));
    Sherwood.on('QUEST_CHAPTER_COMPLETED', (data) => this._onChapterCompleted(data));
    
    // Загружаем звуки
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
        const headerRow = document.querySelector('.header-row-2');
        if (!headerRow || document.getElementById('btn-game')) return;
        
        const gameBtn = document.createElement('div');
        gameBtn.className = 'header-btn';
        gameBtn.id = 'btn-game';
        gameBtn.innerHTML = '<span style="font-size:24px;">🏹</span>';
        gameBtn.title = 'Шервудский лес';
        gameBtn.onclick = () => this.toggle();
        
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) {
            headerRow.insertBefore(gameBtn, settingsBtn);
        } else {
            headerRow.appendChild(gameBtn);
        }
        
        const headerLabels = document.querySelector('.header-row-3');
        if (headerLabels) {
            const label = document.createElement('span');
            label.textContent = 'Шервуд';
            label.style.cursor = 'pointer';
            label.onclick = () => this.toggle();
            
            const lastLabel = headerLabels.children[3];
            if (lastLabel) {
                headerLabels.insertBefore(label, lastLabel);
            } else {
                headerLabels.appendChild(label);
            }
        }
    },
    
    // ===== ПОКАЗ/СКРЫТИЕ =====
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
        Sherwood.dispatch({ type: 'SCREEN_CHANGED', payload: screenName });
    },
    
    // ===== ГЛАВНОЕ МЕНЮ =====
    showMainMenu() {
        const player = Sherwood.getPlayer();
        if (!player) {
            this._container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-dim);">Загрузка...</div>';
            setTimeout(() => this.showMainMenu(), 500);
            return;
        }
        
        this._playMusic('forest_ambient');
        const expPercent = (player.exp / player.expToLevel * 100).toFixed(0);
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="color:var(--accent-light); margin:0;">🏹 Шервудский лес</h2>
                    <button onclick="Sherwood.UI.hide()" 
                        style="background:var(--btn-bg); border:1px solid var(--btn-border); 
                               color:var(--text); padding:8px 16px; border-radius:8px; cursor:pointer;">
                        ✕
                    </button>
                </div>
                
                <div class="sherwood-card" style="cursor:pointer;" onclick="Sherwood.UI.showProfile()">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${getAvatarUrl(player.avatar)}" 
                             style="width:60px; height:60px; border-radius:50%; border:2px solid var(--accent);"
                             onerror="this.src='assets/icons/01icon.png'">
                        <div style="flex:1;">
                            <div style="font-weight:bold; font-size:1.2em; color:var(--text-bright);">${player.name}</div>
                            <div style="color:var(--accent-light);">Уровень ${player.level}</div>
                            <div style="font-size:0.8em; color:var(--text-dim);">
                                ⚔️ ${player.stats.attack} 🛡️ ${player.stats.defense} ❤️ ${player.stats.hp}/${player.stats.maxHp}
                            </div>
                        </div>
                        <span style="color:var(--text-dim);">→</span>
                    </div>
                    <div class="sherwood-hp-bar" style="margin-top:8px;">
                        <div class="sherwood-hp-fill player" style="width:${expPercent}%;"></div>
                    </div>
                    <div style="font-size:0.7em; color:var(--text-dim); text-align:right; margin-top:2px;">
                        ✨ ${player.exp}/${player.expToLevel} XP
                    </div>
                </div>
                
                <div style="display:flex; gap:8px; margin-bottom:16px;">
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;">
                        <div style="font-size:1.5em;">🪙</div>
                        <div style="font-weight:bold; color:gold;">${player.resources.gold}</div>
                        <div style="font-size:0.7em; color:var(--text-dim);">Золото</div>
                    </div>
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;">
                        <div style="font-size:1.5em;">⚪</div>
                        <div style="font-weight:bold; color:silver;">${player.resources.silver}</div>
                        <div style="font-size:0.7em; color:var(--text-dim);">Серебро</div>
                    </div>
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;">
                        <div style="font-size:1.5em;">🏆</div>
                        <div style="font-weight:bold; color:#c9b1ff;">${player.resources.trophies}</div>
                        <div style="font-size:0.7em; color:var(--text-dim);">Трофеи</div>
                    </div>
                </div>
                
                <button class="sherwood-btn" onclick="Sherwood.UI.showProfile()">
                    <span class="sherwood-btn-icon">👤</span><span>Профиль и экипировка</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showQuests()">
                    <span class="sherwood-btn-icon">⚔️</span><span>Вылазки (Квесты)</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showDungeon()">
                    <span class="sherwood-btn-icon">🌲</span><span>Чащоба (Подземелье)</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showArena()">
                    <span class="sherwood-btn-icon">🎯</span><span>Турнир лучников</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showRaid()">
                    <span class="sherwood-btn-icon">👹</span><span>Логово (Рейд)</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showTavern()">
                    <span class="sherwood-btn-icon">🍺</span><span>Таверна</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showPortal()">
                    <span class="sherwood-btn-icon">🌳</span><span>Древний дуб</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showBlackMarket()">
                    <span class="sherwood-btn-icon">💰</span><span>Разбойничий схрон</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showBestiary()">
                    <span class="sherwood-btn-icon">📖</span><span>Охотничий дневник</span><span class="sherwood-btn-arrow">→</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.showEvents()">
                    <span class="sherwood-btn-icon">🎪</span><span>Ивенты</span><span class="sherwood-btn-arrow">→</span>
                </button>
                
                <div style="margin-top:20px; text-align:center;">
                    <button onclick="Sherwood.resetGame()" 
                        style="background:transparent; border:1px solid #f44336; color:#f44336; 
                               padding:8px 16px; border-radius:8px; cursor:pointer; font-size:0.8em;">
                        🔄 Сбросить прогресс
                    </button>
                </div>
            </div>
        `;
        
        this.showScreen('main_menu');
    },
    
    // ===== ПРОФИЛЬ =====
    showProfile() {
        const player = Sherwood.getPlayer();
        if (!player) return;
        
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
            const gradeColor = item ? Sherwood.Models.GradeColors[item.grade] || '#9d9d9d' : 'transparent';
            
            equipmentHtml += `
                <div class="sherwood-card" style="cursor:pointer; border-left: 3px solid ${gradeColor};"
                     onclick="Sherwood.UI._onEquipSlotClick('${part.key}')">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.2em;">${part.icon}</span>
                        <div style="flex:1;">
                            <div style="color:var(--text-dim); font-size:0.8em;">${part.name}</div>
                            <div style="color:${item ? 'var(--text-bright)' : 'var(--text-dim)'};">${item ? item.name : 'Пусто'}</div>
                            ${item ? `<div style="font-size:0.7em; color:${gradeColor};">${item.grade.toUpperCase()}</div>` : ''}
                        </div>
                        <span style="color:var(--text-dim);">→</span>
                    </div>
                </div>
            `;
        });
        
        let inventoryHtml = '';
        if (player.inventory.length === 0) {
            inventoryHtml = '<div style="color:var(--text-dim); text-align:center; padding:20px;">Инвентарь пуст</div>';
        } else {
            player.inventory.forEach((item, index) => {
                const gradeColor = Sherwood.Models.GradeColors[item.grade] || '#9d9d9d';
                inventoryHtml += `
                    <div class="sherwood-card" style="border-left: 3px solid ${gradeColor};">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:1.2em;">📦</span>
                            <div style="flex:1;">
                                <div style="color:var(--text-bright);">${item.name}</div>
                                <div style="font-size:0.8em; color:${gradeColor};">${item.grade.toUpperCase()}</div>
                            </div>
                            <button class="sherwood-btn" style="width:auto; padding:6px 12px;" 
                                    onclick="Sherwood.UI._onEquipItem(${index})">Надеть</button>
                        </div>
                    </div>
                `;
            });
        }
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" class="sherwood-btn" style="width:auto; display:inline-block;">← Назад</button>
                
                <div style="text-align:center; margin:16px 0;">
                    <img src="${getAvatarUrl(player.avatar)}" 
                         style="width:80px; height:80px; border-radius:50%; border:3px solid var(--accent);"
                         onerror="this.src='assets/icons/01icon.png'">
                    <h2 style="color:var(--accent-light); margin:8px 0;">${player.name}</h2>
                    <div style="color:var(--text);">Уровень ${player.level}</div>
                    <div class="sherwood-hp-bar" style="margin:8px 0;">
                        <div class="sherwood-hp-fill player" style="width:${expPercent}%;"></div>
                    </div>
                    <div style="font-size:0.8em; color:var(--text-dim);">✨ ${player.exp}/${player.expToLevel} XP</div>
                </div>
                
                <div class="sherwood-card">
                    <h3 style="color:var(--accent-light); margin-bottom:8px;">📊 Характеристики</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div>⚔️ Атака: <b style="color:#f44336;">${player.stats.attack}</b></div>
                        <div>🛡️ Защита: <b style="color:#2196f3;">${player.stats.defense}</b></div>
                        <div>❤️ Здоровье: <b style="color:#4caf50;">${player.stats.hp}/${player.stats.maxHp}</b></div>
                        <div>💨 Ловкость: <b style="color:#ff9800;">${player.stats.agility}</b></div>
                        <div>🎯 Крит: <b style="color:#e91e63;">${player.stats.critChance}%</b></div>
                        <div>💨 Уклон: <b style="color:#9c27b0;">${player.stats.dodgeChance}%</b></div>
                    </div>
                </div>
                
                <div style="display:flex; gap:8px; margin:12px 0;">
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;"><div>🪙 <b style="color:gold;">${player.resources.gold}</b></div></div>
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;"><div>⚪ <b style="color:silver;">${player.resources.silver}</b></div></div>
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;"><div>🏆 <b style="color:#c9b1ff;">${player.resources.trophies}</b></div></div>
                </div>
                
                <div style="display:flex; gap:8px; margin-bottom:12px;">
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;"><div>🎫 Чащоба: <b>${player.dungeon.tickets}/${player.dungeon.maxTickets}</b></div></div>
                    <div class="sherwood-card" style="flex:1; text-align:center; padding:10px;"><div>⚔️ Арена: <b>${player.arena.tickets}/${player.arena.maxTickets}</b></div></div>
                </div>
                
                <h3 style="color:var(--accent-light); margin:16px 0 8px;">🎒 Экипировка</h3>
                ${equipmentHtml}
                
                <h3 style="color:var(--accent-light); margin:16px 0 8px;">📦 Инвентарь (${player.inventory.length}/${player.bagSize})</h3>
                ${inventoryHtml}
            </div>
        `;
        
        this.showScreen('profile');
    },
    
    _onEquipSlotClick(part) {
        const player = Sherwood.getPlayer();
        const item = player.equipment[part];
        if (item && confirm(`Снять "${item.name}"?`)) {
            Sherwood.unequipItem(part);
            this.showProfile();
        }
    },
    
    _onEquipItem(index) {
        const player = Sherwood.getPlayer();
        const item = player.inventory[index];
        if (item) {
            Sherwood.equipItem(item);
            player.inventory.splice(index, 1);
            this.showProfile();
        }
    },
    
    // ===== ВЫЛАЗКИ (КВЕСТЫ) =====
    showQuests() {
        const chapters = Sherwood.Quests.getAvailableChapters();
        
        let chaptersHtml = '';
        chapters.forEach(ch => {
            const progress = ch.totalTasks > 0 ? (ch.tasksCompleted / ch.totalTasks * 100) : 0;
            chaptersHtml += `
                <div onclick="Sherwood.UI._startQuest('${ch.id}')" class="sherwood-card" style="cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:2em;">📜</span>
                        <div style="flex:1;">
                            <div style="font-weight:bold; color:var(--text-bright);">Глава ${ch.chapter}: ${ch.name}</div>
                            <div style="font-size:0.8em; color:var(--text-dim);">${ch.description.substring(0, 60)}...</div>
                            <div style="font-size:0.8em; color:var(--accent-light);">${ch.tasksCompleted}/${ch.totalTasks} заданий</div>
                            ${ch.completed ? '<span style="color:#4caf50;">✅ Завершено</span>' : ''}
                        </div>
                        ${!ch.completed ? '<span style="color:var(--text-dim);">→</span>' : ''}
                    </div>
                    ${!ch.completed ? `<div class="sherwood-hp-bar" style="margin-top:8px;"><div class="sherwood-hp-fill player" style="width:${progress}%;"></div></div>` : ''}
                </div>
            `;
        });
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" class="sherwood-btn" style="width:auto; display:inline-block;">← Назад</button>
                <h2 style="color:var(--accent-light); margin:16px 0;">⚔️ Вылазки</h2>
                <p style="color:var(--text-dim); margin-bottom:16px;">Выполняй задания, чтобы получить награды и продвинуться по сюжету.</p>
                ${chaptersHtml || '<p style="color:var(--text-dim); text-align:center; padding:20px;">Нет доступных глав. Повышай уровень!</p>'}
                
                <h3 style="color:var(--accent-light); margin:16px 0;">⚡ Быстрый бой</h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <button onclick="Sherwood.UI.startBattle('forest_spider')" class="sherwood-btn" style="flex-direction:column; text-align:center;">
                        <span style="font-size:2em;">🕷️</span><span>Лесной паук</span><span style="font-size:0.7em; color:var(--text-dim);">⚔️6 🛡️2 ❤️30</span>
                    </button>
                    <button onclick="Sherwood.UI.startBattle('dire_wolf')" class="sherwood-btn" style="flex-direction:column; text-align:center;">
                        <span style="font-size:2em;">🐺</span><span>Гнилой волк</span><span style="font-size:0.7em; color:var(--text-dim);">⚔️12 🛡️5 ❤️55</span>
                    </button>
                    <button onclick="Sherwood.UI.startBattle('swamp_ghoul')" class="sherwood-btn" style="flex-direction:column; text-align:center;">
                        <span style="font-size:2em;">🧟</span><span>Болотный упырь</span><span style="font-size:0.7em; color:var(--text-dim);">⚔️8 🛡️3 ❤️40</span>
                    </button>
                    <button onclick="Sherwood.UI.startBattle('guard')" class="sherwood-btn" style="flex-direction:column; text-align:center;">
                        <span style="font-size:2em;">🛡️</span><span>Стражник</span><span style="font-size:0.7em; color:var(--text-dim);">⚔️10 🛡️8 ❤️60</span>
                    </button>
                </div>
            </div>
        `;
        
        this.showScreen('quests');
    },
    
    _startQuest(questId) {
        const quest = Sherwood.Quests.startChapter(questId);
        if (!quest) return;
        this._renderQuestDetail(quest);
    },
    
    _renderQuestDetail(quest) {
        let tasksHtml = '';
        const state = quest.questState;
        
        quest.tasks.forEach(task => {
            const taskState = state.tasks[task.id];
            const progress = taskState ? (taskState.progress / task.target * 100) : 0;
            const completed = taskState?.completed;
            
            tasksHtml += `
                <div class="sherwood-card">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.2em;">${completed ? '✅' : '⬜'}</span>
                        <div style="flex:1;">
                            <div style="color:var(--text);">${task.description}</div>
                            ${!completed ? `
                                <div style="font-size:0.8em; color:var(--text-dim);">${taskState?.progress || 0}/${task.target}</div>
                                <div class="sherwood-hp-bar"><div class="sherwood-hp-fill player" style="width:${progress}%;"></div></div>
                            ` : ''}
                        </div>
                    </div>
                    ${completed ? `<div style="font-size:0.8em; color:gold; margin-top:4px;">Награда: ${task.reward.gold ? '🪙'+task.reward.gold : ''} ${task.reward.silver ? '⚪'+task.reward.silver : ''} ${task.reward.exp ? '✨'+task.reward.exp+'XP' : ''}</div>` : ''}
                </div>
            `;
        });
        
        const chapterComplete = quest.questState.completed;
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showQuests()" class="sherwood-btn" style="width:auto; display:inline-block;">← К вылазкам</button>
                <h2 style="color:var(--accent-light); margin:16px 0;">Глава ${quest.chapter}: ${quest.name}</h2>
                <p style="color:var(--text-dim); margin-bottom:16px;">${quest.description}</p>
                ${tasksHtml}
                ${chapterComplete ? `
                    <div class="sherwood-card" style="text-align:center; border:2px solid gold;">
                        <div style="color:gold; font-size:1.2em;">🏆 Глава завершена!</div>
                        <div style="color:var(--text); margin-top:4px;">Награда: 🪙${quest.chapterReward.gold || 0} ⚪${quest.chapterReward.silver || 0} ✨${quest.chapterReward.exp || 0}XP</div>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.showScreen('quest_detail');
    },
    
    // ===== БОЕВАЯ СИСТЕМА =====
    startBattle(monsterId) {
        const battle = Sherwood.Combat.startPvE(monsterId);
        if (!battle) return;
        this._playSound('shot');
        this._playMusic('dungeon_ambient');
        this._renderBattle();
    },
    
    _renderBattle() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle) return;
        
        const enemy = battle.type === 'pve' ? battle.monster : battle.opponent;
        const player = battle.player;
        const monster = Sherwood.Monsters[battle.monsterId];
        
        const enemyHpPercent = Math.max(0, (enemy.currentHp / enemy.stats.hp * 100)).toFixed(0);
        const playerHpPercent = Math.max(0, (player.currentHp / player.stats.hp * 100)).toFixed(0);
        
        const skills = Sherwood.Combat._getPlayerSkills();
        let skillsHtml = '';
        Object.values(skills).forEach(skill => {
            const onCooldown = battle.cooldowns[skill.id] > 0;
            skillsHtml += `
                <button onclick="Sherwood.UI._onSkillClick('${skill.id}')"
                    class="sherwood-battle-btn"
                    style="background:linear-gradient(135deg,#c4a040,#a08030); ${onCooldown ? 'opacity:0.5;' : ''}"
                    ${onCooldown ? 'disabled' : ''}>
                    ${skill.name}${onCooldown ? ` (${battle.cooldowns[skill.id]})` : ''}
                </button>
            `;
        });
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI._fleeBattle()" class="sherwood-btn" style="width:auto; display:inline-block; margin-bottom:16px;">🏃 Сбежать</button>
                
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="font-size:4em;">${monster?.icon || '👹'}</div>
                    <div style="font-weight:bold; font-size:1.2em; color:var(--text-bright);">${enemy.name}</div>
                    <div style="font-size:0.8em; color:var(--text-dim);">⚔️${enemy.stats.attack} 🛡️${enemy.stats.defense}</div>
                    <div class="sherwood-hp-bar"><div class="sherwood-hp-fill" style="width:${enemyHpPercent}%;"></div></div>
                    <div style="font-size:0.8em; color:var(--text-dim);">❤️ ${Math.max(0, enemy.currentHp)} / ${enemy.stats.hp}</div>
                </div>
                
                <div style="text-align:center; font-size:1.5em; margin:12px 0; color:var(--accent-light);">⚡ VS ⚡</div>
                
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="font-weight:bold; color:var(--accent-light);">${player.name || 'Вы'}</div>
                    <div class="sherwood-hp-bar"><div class="sherwood-hp-fill player" style="width:${playerHpPercent}%;"></div></div>
                    <div style="font-size:0.8em; color:var(--text-dim);">❤️ ${Math.max(0, player.currentHp)} / ${player.stats.hp}</div>
                </div>
                
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                    <button id="btn-attack" onclick="Sherwood.UI._onAttackClick()"
                        class="sherwood-battle-btn" style="background:linear-gradient(135deg,#c44050,#a03040);"
                        ${battle.turn !== 'player' ? 'disabled' : ''}>⚔️ Атаковать</button>
                </div>
                
                <div style="display:flex; gap:8px; flex-wrap:wrap;">${skillsHtml}</div>
                
                <div id="battle-log" style="margin-top:16px; max-height:150px; overflow-y:auto; font-size:0.8em;"></div>
            </div>
        `;
        
        this.showScreen('battle');
    },
    
    _onAttackClick() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle || battle.turn !== 'player') return;
        
        this._playSound('arrow_hit');
        const result = Sherwood.Combat.playerAttack();
        this._updateBattleUI();
        
        if (result) {
            this._addBattleLog('🗡️', 'Вы нанесли ' + result.damage + ' урона!', '#4caf50');
            if (result.crit) this._addBattleLog('💥', 'Критический удар!', '#ff9800');
            if (result.dodge) this._addBattleLog('💨', 'Противник уклонился!', '#9c27b0');
        }
    },
    
    _onSkillClick(skillId) {
        const result = Sherwood.Combat.playerUseSkill(skillId);
        this._playSound('arrow_hit');
        this._updateBattleUI();
        
        if (result) {
            const skills = Sherwood.Combat._getPlayerSkills();
            const skill = skills[skillId];
            this._addBattleLog('🎯', `${skill.name}: ${result.damage} урона!`, '#ff9800');
            if (result.crit) this._addBattleLog('💥', 'Критический удар!', '#ff9800');
        }
    },
    
    _fleeBattle() {
        const fled = Sherwood.Combat.flee();
        if (fled) {
            this._playMusic('forest_ambient');
            this.showMainMenu();
        } else {
            this._addBattleLog('🏃', 'Не удалось сбежать!', '#f44336');
            this._updateBattleUI();
        }
    },
    
    _updateBattleUI() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle) {
            this._playMusic('forest_ambient');
            this.showMainMenu();
            return;
        }
        
        if (battle.status === 'active') {
            this._renderBattle();
            
            const lastLogs = battle.log.slice(-2);
            lastLogs.forEach(log => {
                if (log.actor === 'enemy' && !log.displayed) {
                    log.displayed = true;
                    this._addBattleLog('💢', `${battle.monster.name} нанёс ${log.damage} урона!`, '#f44336');
                    if (log.crit) this._addBattleLog('💥', 'Критический удар по вам!', '#ff9800');
                    if (log.dodge) this._addBattleLog('💨', 'Вы уклонились!', '#4caf50');
                }
            });
        }
    },
    
    _addBattleLog(icon, text, color) {
        const log = document.getElementById('battle-log');
        if (!log) return;
        const item = document.createElement('div');
        item.textContent = `${icon} ${text}`;
        item.style.cssText = `color:${color}; margin-bottom:4px; animation:msgIn 0.3s ease;`;
        log.appendChild(item);
        log.scrollTop = log.scrollHeight;
    },
    
    _onBattleVictory(data) {
        this._playSound('victory');
        if (this._currentScreen !== 'battle') return;
        
        setTimeout(() => {
            alert(`🏆 Победа!\n\n🪙 +${data.reward?.gold || 0} золота\n⚪ +${data.reward?.silver || 0} серебра\n✨ +${data.reward?.exp || 0} опыта`);
            
            const battle = Sherwood.Combat.getBattle();
            if (battle?.dungeonTile) {
                Sherwood.Combat.endBattle();
                this._playMusic('dungeon_ambient');
                this._renderDungeon();
            } else {
                Sherwood.Combat.endBattle();
                this._playMusic('forest_ambient');
                this.showQuests();
            }
        }, 300);
    },
    
    _onBattleDefeat(data) {
        this._playSound('defeat');
        if (this._currentScreen !== 'battle') return;
        
        setTimeout(() => {
            alert('💀 Поражение!\n\nВы потеряли сознание и очнулись у костра.');
            Sherwood.Combat.endBattle();
            const player = Sherwood.getPlayer();
            player.stats.hp = Math.floor(player.stats.maxHp / 2);
            this._playMusic('forest_ambient');
            this.showMainMenu();
        }, 300);
    },
    
    _onLevelUp(data) {
        this._playSound('levelup');
        if (this._container.style.display === 'none') return;
        alert(`🎉 Поздравляем!\n\nВы достигли уровня ${data.level}!`);
    },
    
    _onQuestTaskCompleted(data) {
        if (this._currentScreen === 'quest_detail') {
            const quest = Sherwood.Quests.getActiveQuest();
            if (quest) this._renderQuestDetail(quest);
        }
    },
    
    _onChapterCompleted(data) {
        this._playSound('victory');
        alert(`🏆 Глава завершена!\n\n"${data.chapter.name}"\n\nНаграда: 🪙${data.chapter.chapterReward.gold || 0} ⚪${data.chapter.chapterReward.silver || 0} ✨${data.chapter.chapterReward.exp || 0}XP`);
    },
    
    // ===== ЧАЩОБА (ПОДЗЕМЕЛЬЕ) =====
    showDungeon() {
        const player = Sherwood.getPlayer();
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" class="sherwood-btn" style="width:auto; display:inline-block;">← Назад</button>
                <h2 style="color:var(--accent-light); margin:16px 0;">🌲 Чащоба</h2>
                
                <div class="sherwood-card" style="text-align:center;">
                    <div style="font-size:4em; margin-bottom:8px;">🌲</div>
                    <p style="color:var(--text-dim);">Исследуй глубины Шервудского леса. Открывай туман войны, сражайся с монстрами, находи сундуки и лечебные источники.</p>
                </div>
                
                <div style="display:flex; gap:8px; margin-bottom:16px;">
                    <div class="sherwood-card" style="flex:1; text-align:center;"><div style="color:var(--text-dim); font-size:0.8em;">Билеты</div><div style="font-size:1.5em; color:var(--accent-light);">🎫 ${player.dungeon.tickets}/${player.dungeon.maxTickets}</div></div>
                    <div class="sherwood-card" style="flex:1; text-align:center;"><div style="color:var(--text-dim); font-size:0.8em;">❤️ Здоровье</div><div style="font-size:1.5em; color:${player.stats.hp < player.stats.maxHp * 0.3 ? '#f44336' : '#4caf50'};">${player.stats.hp}/${player.stats.maxHp}</div></div>
                </div>
                
                <button onclick="Sherwood.UI._startDungeon('easy')" class="sherwood-btn" ${player.dungeon.tickets <= 0 ? 'disabled style="opacity:0.5;"' : ''}>
                    <span class="sherwood-btn-icon">🌿</span><div><div>Лёгкая прогулка</div><div style="font-size:0.7em; color:var(--text-dim);">3-5 монстров</div></div><span class="sherwood-btn-arrow">→</span>
                </button>
                
                <button onclick="Sherwood.UI._startDungeon('normal')" class="sherwood-btn" ${player.dungeon.tickets <= 0 ? 'disabled style="opacity:0.5;"' : ''}>
                    <span class="sherwood-btn-icon">🌲</span><div><div>Обычная чащоба</div><div style="font-size:0.7em; color:var(--text-dim);">5-7 монстров</div></div><span class="sherwood-btn-arrow">→</span>
                </button>
                
                <button onclick="Sherwood.UI._startDungeon('hard')" class="sherwood-btn" ${player.dungeon.tickets <= 0 ? 'disabled style="opacity:0.5;"' : ''}>
                    <span class="sherwood-btn-icon">🌳</span><div><div>Гиблое место</div><div style="font-size:0.7em; color:var(--text-dim);">7-9 монстров</div></div><span class="sherwood-btn-arrow">→</span>
                </button>
            </div>
        `;
        
        this.showScreen('dungeon');
    },
    
    _startDungeon(difficulty) {
        const dungeon = Sherwood.Dungeon.generateDungeon(difficulty);
        if (!dungeon) {
            alert('Недостаточно билетов!');
            return;
        }
        this._playSound('dungeon_enter');
        this._playMusic('dungeon_ambient');
        this._renderDungeon();
    },
    
    _renderDungeon() {
        const dungeon = Sherwood.Dungeon.getDungeon();
        if (!dungeon) { this.showDungeon(); return; }
        
        let gridHtml = '';
        for (let y = 0; y < dungeon.size; y++) {
            gridHtml += '<div style="display:flex; justify-content:center; gap:3px; margin-bottom:3px;">';
            for (let x = 0; x < dungeon.size; x++) {
                const tile = dungeon.grid[y][x];
                const isPlayer = dungeon.playerPos.x === x && dungeon.playerPos.y === y;
                const isExplored = tile.explored;
                let emoji = '⬛', bg = 'rgba(0,0,0,0.6)';
                
                if (isExplored || isPlayer) {
                    bg = 'var(--btn-bg)';
                    switch (tile.type) {
                        case 'start': emoji = '🏠'; break;
                        case 'empty': emoji = '🌿'; break;
                        case 'monster': emoji = tile.monsterId ? '💀' : '👹'; break;
                        case 'chest': emoji = tile.looted ? '📦' : '🎁'; break;
                        case 'trap': emoji = tile.triggered ? '💢' : '⚠️'; break;
                        case 'heal': emoji = tile.used ? '💚' : '💊'; break;
                        case 'exit': emoji = '🚪'; break;
                    }
                }
                if (isPlayer) { emoji = '🏹'; bg = 'rgba(160,176,224,0.3)'; }
                
                gridHtml += `<div style="width:45px;height:45px;background:${bg};border:1px solid var(--btn-border);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.3em;">${emoji}</div>`;
            }
            gridHtml += '</div>';
        }
        
        const player = Sherwood.getPlayer();
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <button onclick="Sherwood.UI._leaveDungeon()" class="sherwood-btn" style="width:auto; display:inline-block; padding:8px 16px;">← Выйти</button>
                    <div style="text-align:center;"><span style="color:var(--accent-light);">🌲 Чащоба</span><div style="font-size:0.7em; color:var(--text-dim);">Открыто: ${dungeon.tilesExplored}/${dungeon.totalTiles}</div></div>
                    <div style="text-align:right; font-size:0.8em; color:${player.stats.hp < player.stats.maxHp * 0.3 ? '#f44336' : 'var(--text-dim)'};">❤️ ${player.stats.hp}/${player.stats.maxHp}</div>
                </div>
                
                <div style="margin-bottom:16px;">${gridHtml}</div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; max-width:180px; margin:0 auto 12px;">
                    <div></div><button onclick="Sherwood.UI._dungeonMove('up')" class="sherwood-btn" style="justify-content:center; padding:12px;">⬆️</button><div></div>
                    <button onclick="Sherwood.UI._dungeonMove('left')" class="sherwood-btn" style="justify-content:center; padding:12px;">⬅️</button>
                    <div style="display:flex;align-items:center;justify-content:center;color:var(--text-dim);">🚶</div>
                    <button onclick="Sherwood.UI._dungeonMove('right')" class="sherwood-btn" style="justify-content:center; padding:12px;">➡️</button>
                    <div></div><button onclick="Sherwood.UI._dungeonMove('down')" class="sherwood-btn" style="justify-content:center; padding:12px;">⬇️</button><div></div>
                </div>
                
                <div id="dungeon-log" style="text-align:center; font-size:0.8em; color:var(--text-dim); min-height:20px;"></div>
            </div>
        `;
        
        this.showScreen('dungeon_play');
    },
    
    _dungeonMove(direction) {
        const result = Sherwood.Dungeon.movePlayer(direction);
        if (!result) return;
        
        const log = document.getElementById('dungeon-log');
        
        if (!result.success && result.reason === 'edge') {
            if (log) log.textContent = '🚫 Край карты';
            return;
        }
        
        switch (result.type) {
            case 'monster':
                if (log) log.textContent = '⚔️ Монстр!';
                this._renderDungeon();
                const battle = Sherwood.Dungeon.fightMonster(result.tile);
                if (battle) setTimeout(() => this._renderBattle(), 300);
                break;
            case 'chest':
                this._playSound('chest_open');
                if (log) log.textContent = `🎁 Сундук: 🪙+${result.reward.gold} ⚪+${result.reward.silver}${result.item ? ' | Предмет!' : ''}`;
                this._renderDungeon();
                break;
            case 'trap':
                this._playSound('trap_trigger');
                if (log) log.textContent = `⚠️ Ловушка! -${result.damage} HP`;
                this._renderDungeon();
                break;
            case 'heal':
                if (log) log.textContent = `💚 +${result.healAmount} HP`;
                this._renderDungeon();
                break;
            case 'exit':
                if (log) log.textContent = '🏆 Чащоба пройдена!';
                this._renderDungeon();
                setTimeout(() => { this._playMusic('forest_ambient'); this.showDungeon(); }, 1500);
                break;
            case 'empty':
                if (log) log.textContent = '';
                this._renderDungeon();
                break;
        }
        
        const player = Sherwood.getPlayer();
        if (player.stats.hp <= 0) {
            if (log) log.textContent = '💀 Вы потеряли сознание...';
            setTimeout(() => {
                Sherwood.Dungeon.leaveDungeon();
                player.stats.hp = Math.floor(player.stats.maxHp / 3);
                this._playMusic('forest_ambient');
                this.showDungeon();
            }, 1500);
        }
    },
    
    _leaveDungeon() {
        if (confirm('Выйти из Чащобы? Прогресс будет потерян.')) {
            Sherwood.Dungeon.leaveDungeon();
            this._playMusic('forest_ambient');
            this.showDungeon();
        }
    },
    
    // ===== ОСТАЛЬНЫЕ ЭКРАНЫ =====
    showArena() { 
        this._placeholder('🎯 Турнир лучников', 'PvP Арена в разработке.\nЗдесь будут сражения между игроками через P2P соединение.'); 
    },
    showRaid() { 
        const player = Sherwood.getPlayer();
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" class="sherwood-btn" style="width:auto; display:inline-block;">← Назад</button>
                <h2 style="color:var(--accent-light); margin:16px 0;">👹 Логово</h2>
                <div class="sherwood-card" style="text-align:center;"><div style="font-size:4em;">👹</div><p style="color:var(--text-dim);">Билеты: ${player.raid.tickets}/${player.raid.maxTickets}</p></div>
                <button class="sherwood-btn" onclick="Sherwood.UI.startBattle('sheriff_nottingham')">
                    <span class="sherwood-btn-icon">🎯</span><span>Шериф Ноттингемский (Босс)</span><span style="font-size:0.7em; color:var(--text-dim);">⚔️30 🛡️22 ❤️500</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.startBattle('black_knight')">
                    <span class="sherwood-btn-icon">⚫</span><span>Чёрный рыцарь (Босс)</span><span style="font-size:0.7em; color:var(--text-dim);">⚔️35 🛡️28 ❤️650</span>
                </button>
                <button class="sherwood-btn" onclick="Sherwood.UI.startBattle('ancient_ent')">
                    <span class="sherwood-btn-icon">🌳</span><span>Древний энт (Босс)</span><span style="font-size:0.7em; color:var(--text-dim);">⚔️28 🛡️35 ❤️800</span>
                </button>
            </div>
        `;
    },
    showTavern() { 
        this._playMusic('tavern_ambient');
        this._placeholder('🍺 Таверна «Весёлый Разбойник»', 'Таверна в разработке.\nЗдесь будут ежедневные задания от персонажей Шервуда.'); 
    },
    showPortal() { 
        const player = Sherwood.getPlayer();
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" class="sherwood-btn" style="width:auto; display:inline-block;">← Назад</button>
                <h2 style="color:var(--accent-light); margin:16px 0;">🌳 Древний дуб</h2>
                <div class="sherwood-card" style="text-align:center;">
                    <div style="font-size:4em;">🌳</div>
                    <p style="color:var(--text-dim);">Портал в мир фей.</p>
                    <p style="color:var(--accent-light);">Требуется: 🏆 50 трофеев</p>
                    <p style="color:var(--text-dim);">У вас: 🏆 ${player.resources.trophies}</p>
                </div>
                <button class="sherwood-btn" ${player.resources.trophies < 50 ? 'disabled style="opacity:0.5;"' : ''}
                    onclick="alert('Портал откроется в следующем обновлении!')">
                    <span class="sherwood-btn-icon">🌟</span><span>Открыть портал</span>
                </button>
            </div>
        `;
    },
    showBlackMarket() { 
        this._placeholder('💰 Разбойничий схрон', 'Чёрный рынок в разработке.\nЗдесь можно будет покупать и продавать редкие предметы.'); 
    },
    showBestiary() {
        const player = Sherwood.getPlayer();
        let monstersHtml = '';
        
        Object.values(Sherwood.Monsters).forEach(monster => {
            const killed = player.bestiary[monster.id]?.killed || 0;
            const hasBonus = monster.bestiaryBonus && killed >= monster.bestiaryBonus.kills;
            
            monstersHtml += `
                <div class="sherwood-card" style="border-left: 3px solid ${hasBonus ? 'gold' : 'var(--btn-border)'};">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:2em;">${monster.icon}</span>
                        <div style="flex:1;">
                            <div style="color:var(--text-bright);">${monster.name}</div>
                            <div style="font-size:0.8em; color:var(--text-dim);">${monster.description}</div>
                            <div style="font-size:0.8em; color:var(--accent-light);">Убито: ${killed}${monster.bestiaryBonus ? ` (бонус: ${monster.bestiaryBonus.kills})` : ''}</div>
                            ${hasBonus ? '<span style="color:gold;">✅ Бонус активен</span>' : ''}
                        </div>
                        ${monster.isBoss ? '<span style="color:#f44336;">👑</span>' : ''}
                    </div>
                </div>
            `;
        });
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" class="sherwood-btn" style="width:auto; display:inline-block;">← Назад</button>
                <h2 style="color:var(--accent-light); margin:16px 0;">📖 Охотничий дневник</h2>
                <p style="color:var(--text-dim); margin-bottom:16px;">Убивай монстров, чтобы получать постоянные бонусы к характеристикам.</p>
                ${monstersHtml}
            </div>
        `;
    },
    showEvents() { 
        this._placeholder('🎪 Ивенты', 'Ивенты в разработке.\n\nПланируются:\n🏹 Охота на лис\n🎯 Погоня за наградой\n🔥 Зов огня'); 
    },
    
    _placeholder(title, text) {
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <button onclick="Sherwood.UI.showMainMenu()" class="sherwood-btn" style="width:auto; display:inline-block;">← Назад</button>
                <h2 style="color:var(--accent-light); margin:16px 0;">${title}</h2>
                <div class="sherwood-card" style="text-align:center; padding:40px;">
                    <div style="font-size:4em; margin-bottom:12px;">🏗️</div>
                    <p style="color:var(--text-dim); white-space:pre-line;">${text}</p>
                </div>
            </div>
        `;
    }
};

/**
 * Sherwood Game UI
 * Базовый игровой интерфейс
 */

Sherwood.UI = {
    _currentScreen: null,
    _container: null,
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    init() {
        // Создаём контейнер для игры
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
        
        // Кнопка входа в игру (в хедере)
        this._addGameButton();
    },
    
    _addGameButton() {
        const headerRow = document.querySelector('.header-row-2');
        if (!headerRow) return;
        
        const gameBtn = document.createElement('div');
        gameBtn.className = 'header-btn';
        gameBtn.id = 'btn-game';
        gameBtn.innerHTML = '<span style="font-size:24px;">🏹</span>';
        gameBtn.title = 'Шервудский лес';
        gameBtn.onclick = () => this.toggle();
        
        // Вставляем перед кнопкой настроек
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) {
            headerRow.insertBefore(gameBtn, settingsBtn);
        } else {
            headerRow.appendChild(gameBtn);
        }
        
        // Подпись
        const headerLabels = document.querySelector('.header-row-3');
        if (headerLabels) {
            const label = document.createElement('span');
            label.textContent = 'Шервуд';
            label.style.cursor = 'pointer';
            label.onclick = () => this.toggle();
            headerLabels.insertBefore(label, headerLabels.children[3]);
        }
    },
    
    // ===== ПОКАЗ/СКРЫТИЕ =====
    toggle() {
        if (this._container.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    },
    
    show() {
        this._container.style.display = 'block';
        this.showMainMenu();
    },
    
    hide() {
        this._container.style.display = 'none';
    },
    
    // ===== ЭКРАНЫ =====
    
    showScreen(screenName) {
        this._currentScreen = screenName;
        Sherwood.dispatch({ type: 'SCREEN_CHANGED', payload: screenName });
    },
    
    // Главное меню
    showMainMenu() {
        const player = Sherwood.getPlayer();
        if (!player) return;
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="color:var(--accent-light); margin:0;">🏹 Шервудский лес</h2>
                    <button onclick="Sherwood.UI.hide()" 
                        style="background:var(--btn-bg); border:1px solid var(--btn-border); 
                               color:var(--text); padding:8px 16px; border-radius:8px; cursor:pointer;">
                        ✕ Закрыть
                    </button>
                </div>
                
                <!-- Профиль -->
                <div style="background:var(--btn-bg); border:1px solid var(--btn-border); 
                            border-radius:12px; padding:16px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${getAvatarUrl(player.avatar)}" 
                             style="width:60px; height:60px; border-radius:50%; border:2px solid var(--accent);">
                        <div>
                            <div style="font-weight:bold; font-size:1.2em; color:var(--text-bright);">
                                ${player.name}
                            </div>
                            <div style="color:var(--accent-light);">
                                Уровень ${player.level}
                            </div>
                            <div style="font-size:0.8em; color:var(--text-dim);">
                                ⚔️ ${player.stats.attack} 🛡️ ${player.stats.defense} ❤️ ${player.stats.hp}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Ресурсы -->
                <div style="display:flex; gap:8px; margin-bottom:16px;">
                    <div style="flex:1; background:var(--btn-bg); border:1px solid var(--btn-border); 
                                border-radius:8px; padding:8px; text-align:center;">
                        <span style="color:gold;">🪙</span> ${player.resources.gold}
                    </div>
                    <div style="flex:1; background:var(--btn-bg); border:1px solid var(--btn-border); 
                                border-radius:8px; padding:8px; text-align:center;">
                        <span style="color:silver;">⚪</span> ${player.resources.silver}
                    </div>
                    <div style="flex:1; background:var(--btn-bg); border:1px solid var(--btn-border); 
                                border-radius:8px; padding:8px; text-align:center;">
                        <span style="color:#c0c0ff;">🏆</span> ${player.resources.trophies}
                    </div>
                </div>
                
                <!-- Меню -->
                ${this._menuButton('⚔️', 'Вылазки (Квесты)', () => this.showQuests())}
                ${this._menuButton('🌲', 'Чащоба (Подземелье)', () => this.showDungeon())}
                ${this._menuButton('🎯', 'Турнир лучников (Арена)', () => this.showArena())}
                ${this._menuButton('👹', 'Логово (Рейд)', () => this.showRaid())}
                ${this._menuButton('🍺', 'Таверна «Весёлый Разбойник»', () => this.showTavern())}
                ${this._menuButton('🌳', 'Древний дуб (Портал)', () => this.showPortal())}
                ${this._menuButton('💰', 'Разбойничий схрон (Рынок)', () => this.showBlackMarket())}
                ${this._menuButton('📖', 'Охотничий дневник (Бестиарий)', () => this.showBestiary())}
                ${this._menuButton('🎪', 'Ивенты', () => this.showEvents())}
            </div>
        `;
        
        this.showScreen('main_menu');
    },
    
    _menuButton(icon, text, onClick) {
        return `
            <div onclick="(${onClick.toString()})()" 
                 style="background:var(--btn-bg); border:1px solid var(--btn-border); 
                        border-radius:10px; padding:14px; margin-bottom:8px; cursor:pointer;
                        display:flex; align-items:center; gap:12px;
                        transition: all 0.15s;">
                <span style="font-size:1.5em;">${icon}</span>
                <span style="color:var(--text);">${text}</span>
                <span style="margin-left:auto; color:var(--text-dim);">→</span>
            </div>
        `;
    },
    
    // Заглушки для экранов (будут расширены)
    showQuests() {
        this._container.innerHTML = `
            <div style="padding:20px;">
                <button onclick="Sherwood.UI.showMainMenu()" 
                    style="background:var(--btn-bg); border:1px solid var(--btn-border); 
                           color:var(--text); padding:8px 16px; border-radius:8px; cursor:pointer; margin-bottom:16px;">
                    ← Назад
                </button>
                <h2 style="color:var(--accent-light);">⚔️ Вылазки</h2>
                <p style="color:var(--text-dim);">Здесь будут квесты и сражения с врагами Шервуда.</p>
                
                <div style="margin-top:16px;">
                    ${this._questButton('forest_spider', 'Лесной паук', 'forest')}
                    ${this._questButton('dire_wolf', 'Гнилой волк', 'deep_forest')}
                    ${this._questButton('swamp_ghoul', 'Болотный упырь', 'swamp')}
                    ${this._questButton('guard', 'Стражник шерифа', 'roads')}
                </div>
            </div>
        `;
    },
    
    _questButton(monsterId, name, location) {
        const monster = Sherwood.Monsters[monsterId];
        if (!monster) return '';
        
        return `
            <div onclick="Sherwood.UI.startBattle('${monsterId}')" 
                 style="background:var(--btn-bg); border:1px solid var(--btn-border); 
                        border-radius:10px; padding:14px; margin-bottom:8px; cursor:pointer;
                        display:flex; align-items:center; gap:12px;">
                <span style="font-size:1.5em;">${monster.icon}</span>
                <div style="flex:1;">
                    <div style="color:var(--text-bright);">${name}</div>
                    <div style="font-size:0.8em; color:var(--text-dim);">
                        ⚔️${monster.stats.attack} 🛡️${monster.stats.defense} ❤️${monster.stats.hp}
                    </div>
                </div>
                <span style="color:gold;">🪙${monster.reward.gold}</span>
            </div>
        `;
    },
    
    // Запуск боя
    startBattle(monsterId) {
        const battle = Sherwood.Combat.startPvE(monsterId);
        if (!battle) return;
        
        this._renderBattle();
    },
    
    _renderBattle() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle) return;
        
        const monster = battle.monster;
        const player = battle.player;
        
        const monsterHpPercent = (monster.currentHp / monster.stats.hp * 100).toFixed(0);
        const playerHpPercent = (player.currentHp / player.stats.hp * 100).toFixed(0);
        
        this._container.innerHTML = `
            <div style="padding:20px; max-width:500px; margin:0 auto;">
                <!-- Монстр -->
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="font-size:3em;">${Sherwood.Monsters[battle.monsterId]?.icon || '👹'}</div>
                    <div style="font-weight:bold; color:var(--text-bright);">${monster.name}</div>
                    <div style="background:rgba(255,0,0,0.2); border-radius:8px; height:12px; margin-top:8px;">
                        <div style="background:#f44336; border-radius:8px; height:100%; 
                                    width:${monsterHpPercent}%; transition:width 0.3s;"></div>
                    </div>
                    <div style="font-size:0.8em; color:var(--text-dim);">
                        ❤️ ${monster.currentHp} / ${monster.stats.hp}
                    </div>
                </div>
                
                <!-- VS -->
                <div style="text-align:center; font-size:1.5em; margin:16px 0;">⚡ VS ⚡</div>
                
                <!-- Игрок -->
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="font-weight:bold; color:var(--accent-light);">Вы</div>
                    <div style="background:rgba(76,175,80,0.2); border-radius:8px; height:12px; margin-top:8px;">
                        <div style="background:#4caf50; border-radius:8px; height:100%; 
                                    width:${playerHpPercent}%; transition:width 0.3s;"></div>
                    </div>
                    <div style="font-size:0.8em; color:var(--text-dim);">
                        ❤️ ${player.currentHp} / ${player.stats.hp}
                    </div>
                </div>
                
                <!-- Кнопки действий -->
                <div style="display:flex; gap:8px;">
                    <button id="btn-attack" onclick="Sherwood.UI._onAttackClick()"
                        style="flex:1; padding:16px; background:linear-gradient(135deg,#c44050,#a03040);
                               border:none; border-radius:10px; color:white; font-weight:bold; cursor:pointer;">
                        ⚔️ Атаковать
                    </button>
                    <button id="btn-skill" onclick="Sherwood.UI._onSkillClick()"
                        style="flex:1; padding:16px; background:linear-gradient(135deg,#c4a040,#a08030);
                               border:none; border-radius:10px; color:white; font-weight:bold; cursor:pointer;">
                        🎯 Навык
                    </button>
                </div>
                
                <!-- Лог боя -->
                <div id="battle-log" style="margin-top:16px; max-height:150px; overflow-y:auto; font-size:0.8em; color:var(--text-dim);"></div>
            </div>
        `;
    },
    
    _onAttackClick() {
        const btn = document.getElementById('btn-attack');
        if (btn) btn.disabled = true;
        
        Sherwood.Combat.playerAttack();
        this._updateBattleUI();
        
        setTimeout(() => {
            if (btn) btn.disabled = false;
        }, 500);
    },
    
    _onSkillClick() {
        Sherwood.Combat.playerUseSkill('power_shot');
        this._updateBattleUI();
    },
    
    _updateBattleUI() {
        const battle = Sherwood.Combat.getBattle();
        if (!battle) return;
        
        // Обновляем HP бары
        this._renderBattle();
        
        // Добавляем в лог
        const log = document.getElementById('battle-log');
        if (log && battle.log.length > 0) {
            const lastEntry = battle.log[battle.log.length - 1];
            const msg = lastEntry.actor === 'player' 
                ? `🗡️ Вы нанесли ${lastEntry.damage} урона!`
                : `💢 ${battle.monster.name} нанёс вам ${lastEntry.damage} урона!`;
            
            const logItem = document.createElement('div');
            logItem.textContent = msg;
            logItem.style.cssText = `color: ${lastEntry.actor === 'player' ? '#4caf50' : '#f44336'}; margin-bottom:4px;`;
            log.appendChild(logItem);
            log.scrollTop = log.scrollHeight;
        }
        
        // Проверка конца боя
        if (battle.status === 'victory') {
            setTimeout(() => {
                alert('🏆 Победа!');
                this.showMainMenu();
            }, 500);
        } else if (battle.status === 'defeat') {
            setTimeout(() => {
                alert('💀 Поражение!');
                this.showMainMenu();
            }, 500);
        }
    },
    
    showDungeon() { this._placeholder('🌲 Чащоба', 'Подземелье в разработке...'); },
    showArena() { this._placeholder('🎯 Турнир лучников', 'Арена в разработке...'); },
    showRaid() { this._placeholder('👹 Логово', 'Рейд в разработке...'); },
    showTavern() { this._placeholder('🍺 Таверна', 'Таверна в разработке...'); },
    showPortal() { this._placeholder('🌳 Древний дуб', 'Портал в разработке...'); },
    showBlackMarket() { this._placeholder('💰 Разбойничий схрон', 'Рынок в разработке...'); },
    showBestiary() { this._placeholder('📖 Охотничий дневник', 'Бестиарий в разработке...'); },
    showEvents() { this._placeholder('🎪 Ивенты', 'Ивенты в разработке...'); },
    
    _placeholder(title, text) {
        this._container.innerHTML = `
            <div style="padding:20px;">
                <button onclick="Sherwood.UI.showMainMenu()" 
                    style="background:var(--btn-bg); border:1px solid var(--btn-border); 
                           color:var(--text); padding:8px 16px; border-radius:8px; cursor:pointer; margin-bottom:16px;">
                    ← Назад
                </button>
                <h2 style="color:var(--accent-light);">${title}</h2>
                <p style="color:var(--text-dim);">${text}</p>
            </div>
        `;
    }
};

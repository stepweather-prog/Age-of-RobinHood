/**
 * Sherwood UI — Полный контроллер интерфейса
 * Включает: главное меню, подземку, сумку, аудио
 */

const SherwoodUI = {
    // ============================================================
    //  КОНСТАНТЫ
    // ============================================================

    _bg: {
        main: 'assets/backgrounds/homepage_screen.jpeg',
        dungeon_select: 'assets/backgrounds/thick.jpeg',
        dungeon_forest: 'assets/backgrounds/underground_1_floor_1.jpg',
        dungeon_swamp: 'assets/backgrounds/underground_2_floor_1.jpeg',
        dungeon_cave: 'assets/backgrounds/underground_3_floor_1.jpeg',
        dungeon_fight: 'assets/backgrounds/subway_battle2.jpeg',
        bag: 'assets/backgrounds/bag.jpeg',
        profile: 'assets/backgrounds/character_page.jpeg',
        bestiary: 'assets/backgrounds/bestiary.jpeg',
        quests: 'assets/backgrounds/background_of_skills.jpeg',
        training: 'assets/backgrounds/training_background.jpeg',
        blacksmith: 'assets/backgrounds/forge.jpeg',
        tavern: 'assets/backgrounds/tavern.jpeg',
        market: 'assets/backgrounds/market.jpeg',
        arena: 'assets/backgrounds/arena.jpeg',
        raid: 'assets/backgrounds/background_raid.png',
        settings: 'assets/backgrounds/settings_page.jpeg'
    },

    // ============================================================
    //  АУДИО
    // ============================================================

    _sounds: {},
    _currentMusic: null,
    _currentMusicKey: null,
    _soundEnabled: true,

    _audioFiles: {
        // Музыка
        'forest_ambient': 'assets/sounds/forest_ambient.ogg',
        'dungeon_ambient': 'assets/sounds/dungeon_ambient.wav',
        'tavern_ambient': 'assets/sounds/tavern_ambient.wav',
        'battle_theme': 'assets/sounds/battle_theme.wav',

        // Звуки
        'click': 'assets/sounds/button_click.ogg',
        'shot': 'assets/sounds/shot.mp3',
        'arrow_hit': 'assets/sounds/arrow_hit.wav',
        'victory': 'assets/sounds/victory.wav',
        'defeat': 'assets/sounds/defeat.wav',
        'levelup': 'assets/sounds/levelup.wav',
        'chest_open': 'assets/sounds/chest_open.wav',
        'trap': 'assets/sounds/trap_trigger.wav',
        'dungeon_enter': 'assets/sounds/dungeon_enter.wav'
    },

    // ============================================================
    //  ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    init() {
        this.container = document.getElementById('game-container');
        if (!this.container) {
            console.error('❌ Контейнер #game-container не найден!');
            return;
        }

        this._initSounds();
        this.bindButtons();
        this.bindPlayButton();
        this.updateDisplay();
        this.loadHome();

        console.log('🏹 Sherwood UI инициализирован!');
    },

    // ============================================================
    //  АУДИО
    // ============================================================

    _initSounds() {
        for (const [key, path] of Object.entries(this._audioFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this._sounds[key] = audio;
        }
    },

    _playSound(key) {
        if (!this._soundEnabled) return;
        const sound = this._sounds[key];
        if (sound) {
            sound.currentTime = 0;
            sound.volume = 0.5;
            sound.play().catch(() => {});
        }
    },

    _playMusic(key) {
        if (!this._soundEnabled) return;
        if (this._currentMusicKey === key && this._currentMusic && !this._currentMusic.paused) return;

        this._stopMusic();
        const music = this._sounds[key];
        if (music) {
            music.loop = true;
            music.volume = 0.3;
            music.currentTime = 0;
            music.play().catch(() => {});
            this._currentMusic = music;
            this._currentMusicKey = key;
        }
    },

    _stopMusic() {
        if (this._currentMusic) {
            this._currentMusic.pause();
            this._currentMusic.currentTime = 0;
            this._currentMusic = null;
            this._currentMusicKey = null;
        }
    },

    // ============================================================
    //  КНОПКИ
    // ============================================================

    bindButtons() {
        document.querySelectorAll('.btn, .top-btn, .settings-btn').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = el.dataset.action;
                if (action && this[action]) {
                    this._playSound('click');
                    this[action]();
                } else {
                    console.log('🔘 Кнопка:', action || 'без action');
                }
            });
        });
    },

    bindPlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this._playSound('click');
                document.getElementById('loadingScreen').classList.add('hidden');
                document.getElementById('mainInterface').classList.add('active');
                this._playMusic('forest_ambient');
                console.log('🎮 Игра запущена!');
            });
        }
    },

    // ============================================================
    //  ОБНОВЛЕНИЕ ДАННЫХ
    // ============================================================

    updateDisplay(data) {
        const d = data || {
            gold: 1234,
            silver: 5678,
            level: 5,
            exp: 350,
            expMax: 500,
            attack: 124,
            defense: 87,
            agility: 43,
            hp: 320
        };

        const goldEl = document.getElementById('gold-display');
        const silverEl = document.getElementById('silver-display');
        const expEl = document.getElementById('exp-display');
        const expMaxEl = document.getElementById('exp-max-display');

        if (goldEl) goldEl.textContent = this._formatNumber(d.gold);
        if (silverEl) silverEl.textContent = this._formatNumber(d.silver);
        if (expEl) expEl.textContent = this._formatNumber(d.exp);
        if (expMaxEl) expMaxEl.textContent = this._formatNumber(d.expMax);

        const attackEl = document.querySelector('.stat-values .attack');
        const defenseEl = document.querySelector('.stat-values .defense');
        const agilityEl = document.querySelector('.stat-values .agility');
        const hpEl = document.querySelector('.stat-values .hp');

        if (attackEl) attackEl.textContent = d.attack;
        if (defenseEl) defenseEl.textContent = d.defense;
        if (agilityEl) agilityEl.textContent = d.agility;
        if (hpEl) hpEl.textContent = d.hp;
    },

    _formatNumber(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },

    // ============================================================
    //  НАВИГАЦИЯ
    // ============================================================

    loadHome() {
        document.querySelectorAll('.bg-layer, .statue-left, .statue-right, .divider-left, .divider-right, .arch-layer, .hero-frame, .top-panel, .top-actions, .left-buttons, .right-buttons, .bottom-stats')
            .forEach(el => {
                if (el) el.style.display = '';
            });

        const placeholder = document.querySelector('.placeholder-screen');
        if (placeholder) placeholder.remove();

        this.container.style.background = "url('" + this._bg.main + "') center/cover no-repeat";
        this._playMusic('forest_ambient');

        console.log('🏠 Главный экран');
    },

    // ============================================================
    //  ПОДЗЕМКА
    // ============================================================

    showDungeon() {
        this._hideMainInterface();
        this.container.style.background = "url('" + this._bg.dungeon_select + "') center/cover no-repeat";
        this._playMusic('dungeon_ambient');

        const dungeons = Sherwood.Dungeon.getAvailableDungeons();
        let list = '';

        for (const [id, data] of Object.entries(dungeons)) {
            const progress = Sherwood.Dungeon._playerProgress[id];
            list += `
                <div class="dungeon-card" style="background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:10px;padding:12px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="color:#e0c080;font-size:1.1em;">${data.icon} ${data.name}</span>
                        <span style="color:#aaa;font-size:0.8em;">Уровень ${data.level}/7</span>
                    </div>
                    <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap;">
                        ${[1,2,3,4,5,6,7].map(level => `
                            <button onclick="SherwoodUI._startDungeon('${id}',${level})" 
                                    style="background:${level <= data.level ? '#c9a040' : '#444'};border:none;border-radius:4px;padding:4px 8px;color:${level <= data.level ? '#000' : '#888'};cursor:${level <= data.level ? 'pointer' : 'default'};font-size:0.8em;">
                                ${level <= data.level ? '⭐' : '🔒'} ${level}
                            </button>
                        `).join('')}
                    </div>
                    <div style="color:#666;font-size:0.7em;">${data.level >= 7 ? '✅ Пройдено' : `Следующий: ${data.level + 1}`}</div>
                </div>
            `;
        }

        this.container.innerHTML = `
            <div style="min-height:100%;background:rgba(0,0,0,0.7);padding:16px;max-width:500px;margin:0 auto;">
                <button onclick="SherwoodUI.loadHome()" style="background:rgba(255,255,255,0.1);border:1px solid #666;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;margin-bottom:12px;">← Назад</button>
                <h2 style="color:#70a0e0;">🏰 Подземелья</h2>
                <div style="color:#aaa;font-size:0.8em;margin-bottom:12px;">🎫 Билетов: ${Sherwood.getPlayer()?.dungeon?.tickets || 0}</div>
                ${list}
            </div>
        `;
    },

    _startDungeon(dungeonId, level) {
        const d = Sherwood.Dungeon.generateDungeon(dungeonId, level);
        if (!d) {
            alert('Нет билетов!');
            return;
        }
        this._playSound('dungeon_enter');
        this._playMusic('dungeon_ambient');
        this._renderDungeon();
    },

    _renderDungeon() {
        const d = Sherwood.Dungeon.getDungeon();
        if (!d) { this.showDungeon(); return; }

        const bgMap = {
            forest: this._bg.dungeon_forest,
            swamp: this._bg.dungeon_swamp,
            cave: this._bg.dungeon_cave
        };
        this.container.style.background = "url('" + (bgMap[d.dungeonId] || this._bg.dungeon_forest) + "') center/cover no-repeat";

        const size = d.size;
        const cellSize = Math.min(50, Math.floor((this.container.clientWidth - 32) / size));
        const grid = d.grid;

        let gridHtml = '';

        for (let y = 0; y < size; y++) {
            gridHtml += '<div style="display:flex;justify-content:center;gap:2px;margin-bottom:2px;">';
            for (let x = 0; x < size; x++) {
                const cell = grid[y][x];
                const isPlayer = d.playerPos.x === x && d.playerPos.y === y;
                const isVisible = cell.visible || cell.explored;

                let bgImage = 'assets/icons/Dungeon tiles1.jpeg';
                let content = '';
                let borderColor = 'rgba(255,255,255,0.05)';
                let extraStyle = '';
                let clickHandler = '';

                if (isVisible) {
                    bgImage = 'assets/icons/level_seamless_horizontal_loop_1.jpg';
                    borderColor = 'rgba(255,255,255,0.1)';

                    if (cell.type === 'start') { content = '🏠'; }
                    else if (cell.type === 'exit') { content = '🚪'; borderColor = '#4caf50'; }
                    else if (cell.type === 'chest') { content = cell.looted ? '📭' : '📦'; borderColor = '#ffc107'; }
                    else if (cell.hasMonster) {
                        content = cell.isBoss ? '👑' : '👹';
                        borderColor = cell.isBoss ? '#ff6a00' : '#f44336';
                    }

                    // Клик на соседнюю клетку
                    const isAdjacent = Math.abs(x - d.playerPos.x) + Math.abs(y - d.playerPos.y) === 1;
                    if (isAdjacent && !isPlayer && cell.walkable) {
                        clickHandler = `onclick="SherwoodUI._dungeonMove(${x},${y})"`;
                        extraStyle = 'cursor:pointer;';
                        if (!cell.hasMonster && cell.type !== 'exit') {
                            borderColor = '#4caf50';
                        }
                    }
                } else {
                    bgImage = 'assets/icons/Dungeon tiles1.jpeg';
                    content = '';
                }

                if (isPlayer) {
                    content = '🏹';
                    borderColor = '#ffd700';
                    extraStyle += 'box-shadow:0 0 16px rgba(255,215,0,0.5);';
                }

                gridHtml += `
                    <div ${clickHandler} style="
                        width:${cellSize}px;
                        height:${cellSize}px;
                        background-image:url('${bgImage}');
                        background-size:cover;
                        background-position:center;
                        border:2px solid ${borderColor};
                        border-radius:4px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:${cellSize * 0.4}px;
                        transition:0.15s;
                        ${extraStyle}
                        text-shadow:0 0 4px rgba(0,0,0,0.8);
                    ">
                        ${content}
                    </div>
                `;
            }
            gridHtml += '</div>';
        }

        this.container.innerHTML = `
            <div style="min-height:100%;background:rgba(0,0,0,0.5);padding:12px;display:flex;flex-direction:column;align-items:center;">
                <div style="width:100%;max-width:${cellSize * size + 20}px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <button onclick="SherwoodUI._leaveDungeon()" style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);color:#ccc;padding:6px 12px;border-radius:6px;cursor:pointer;">← Выйти</button>
                        <div style="color:#70a0e0;font-weight:bold;">${d.dungeonId} Ур.${d.level}</div>
                        <div style="color:#4caf50;">❤️${Sherwood.getPlayer()?.stats?.hp || 0}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.5);border-radius:6px;padding:6px;margin-bottom:8px;">
                        <div style="display:flex;justify-content:space-around;font-size:11px;color:#aaa;">
                            <span>👹 ${d.monstersKilled}/${d.totalMonsters}</span>
                            <span>📦 ${d.chestsOpened}</span>
                            <span>🚶 ${d.steps}</span>
                        </div>
                    </div>
                    ${gridHtml}
                    <div id="dungeon-log" style="text-align:center;font-size:12px;color:#aaa;min-height:20px;margin-top:8px;background:rgba(0,0,0,0.6);border-radius:6px;padding:6px;"></div>
                </div>
            </div>
        `;
    },

    _dungeonMove(x, y) {
        const dx = x - this._dungeon.playerPos.x;
        const dy = y - this._dungeon.playerPos.y;
        const result = Sherwood.Dungeon.movePlayer(dx, dy);

        const log = document.getElementById('dungeon-log');

        if (!result.success) {
            if (log) log.textContent = '🚫 ' + (result.reason || 'Нельзя');
            return;
        }

        if (result.type === 'battle') {
            if (log) log.textContent = '⚔️ Бой с ' + (result.isBoss ? 'БОССОМ!' : 'монстром!');
            this._playSound('shot');
            // Запускаем бой
            const battle = Sherwood.Combat.startPvE(result.monsterId);
            if (battle) {
                battle.dungeonTile = result.tile;
                Sherwood.once('BATTLE_VICTORY', () => {
                    Sherwood.Dungeon.onMonsterDefeated(result.tile);
                    this._playSound('victory');
                    this._renderDungeon();
                });
                Sherwood.once('BATTLE_DEFEAT', () => {
                    this._playSound('defeat');
                    this._leaveDungeon();
                });
                // Переключаемся на экран боя
                this._renderBattle();
            }
            return;
        }

        if (result.type === 'chest') {
            this._playSound('chest_open');
            if (log) log.textContent = '🎁 +' + result.reward.gold + '🪙 +' + result.reward.silver + '⚪';
            this._renderDungeon();
            return;
        }

        if (result.type === 'exit') {
            if (log) log.textContent = '🏆 Подземка пройдена!';
            this._playSound('victory');
            this._renderDungeon();
            setTimeout(() => {
                this._playMusic('forest_ambient');
                this.showDungeon();
            }, 2000);
            return;
        }

        if (log) log.textContent = '🚶 Шаг';
        this._renderDungeon();
    },

    _leaveDungeon() {
        Sherwood.Dungeon.leaveDungeon();
        this._playMusic('forest_ambient');
        this.showDungeon();
    },

    // ============================================================
    //  БОЙ
    // ============================================================

    _renderBattle() {
        // Здесь будет боевой интерфейс (пока заглушка)
        this.container.innerHTML = `
            <div style="min-height:100%;background:url('${this._bg.dungeon_fight}') center/cover no-repeat;position:relative;">
                <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);"></div>
                <div style="position:relative;z-index:1;padding:20px;text-align:center;color:#fff;">
                    <h2 style="color:#ffd700;">⚔️ БОЙ ⚔️</h2>
                    <div style="font-size:2em;margin:20px 0;">👹</div>
                    <div style="color:#aaa;">Боевая система в разработке</div>
                    <button onclick="SherwoodUI._dungeonMove(0,0)" style="margin-top:20px;background:#c9a040;border:none;padding:10px 30px;border-radius:8px;cursor:pointer;font-weight:bold;">Назад</button>
                </div>
            </div>
        `;
    },

    // ============================================================
    //  СУМКА
    // ============================================================

    bag() {
        this._hideMainInterface();
        this.container.style.background = "url('" + this._bg.bag + "') center/cover no-repeat";
        this._playSound('click');

        const bag = Sherwood.Bag;
        const items = bag.getItems();
        const equipment = bag.getEquipment();

        let itemsHtml = '';
        if (items.length === 0) {
            itemsHtml = '<div style="color:#aaa;text-align:center;padding:20px;">🎒 Сумка пуста</div>';
        } else {
            itemsHtml = items.map((item, index) => {
                const gradeColor = Sherwood.Models?.GradeColors?.[item.grade] || '#9d9d9d';
                return `
                    <div style="background:rgba(0,0,0,0.6);border:1px solid ${gradeColor};border-radius:8px;padding:8px;margin-bottom:6px;display:flex;align-items:center;gap:10px;">
                        <img src="${item.icon || 'assets/icons/default_item.png'}" style="width:40px;height:40px;object-fit:contain;">
                        <div style="flex:1;">
                            <div style="color:#fff;">${item.name}</div>
                            <div style="color:${gradeColor};font-size:0.7em;">${item.grade || 'обычный'}</div>
                            ${item.quantity > 1 ? `<div style="color:#aaa;font-size:0.6em;">×${item.quantity}</div>` : ''}
                        </div>
                        ${item.part ? `<button onclick="Sherwood.Bag.equipItem(${index});SherwoodUI.bag();" style="background:#4caf50;border:none;border-radius:4px;padding:4px 10px;color:#fff;cursor:pointer;">Надеть</button>` : ''}
                        <button onclick="Sherwood.Bag.sellItem(${index});SherwoodUI.bag();" style="background:#ff9800;border:none;border-radius:4px;padding:4px 10px;color:#fff;cursor:pointer;">💰</button>
                        <button onclick="Sherwood.Bag.dismantleItem(${index});SherwoodUI.bag();" style="background:#f44336;border:none;border-radius:4px;padding:4px 10px;color:#fff;cursor:pointer;">🔨</button>
                    </div>
                `;
            }).join('');
        }

        let equipmentHtml = '';
        const partNames = {
            head: 'Голова', torso: 'Тело', hands: 'Руки', legs: 'Ноги', feet: 'Ступни',
            weapon1: 'Оружие 1', weapon2: 'Оружие 2', belt: 'Пояс', amulet: 'Амулет', ring: 'Кольцо'
        };
        for (const [part, name] of Object.entries(partNames)) {
            const item = equipment[part];
            equipmentHtml += `
                <div style="background:rgba(0,0,0,0.4);border:1px solid #555;border-radius:6px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="color:#aaa;font-size:0.7em;">${name}</span>
                    ${item ? `<span style="color:#fff;font-size:0.8em;">${item.name}</span><button onclick="Sherwood.Bag.unequipItem('${part}');SherwoodUI.bag();" style="background:#f44336;border:none;border-radius:4px;padding:2px 8px;color:#fff;cursor:pointer;font-size:0.6em;">✕</span>` : '<span style="color:#666;font-size:0.7em;">пусто</span>'}
                </div>
            `;
        }

        this.container.innerHTML = `
            <div style="min-height:100%;background:rgba(0,0,0,0.7);padding:16px;max-width:500px;margin:0 auto;">
                <button onclick="SherwoodUI.loadHome()" style="background:rgba(255,255,255,0.1);border:1px solid #666;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;margin-bottom:12px;">← Назад</button>
                <h2 style="color:#e0c080;">🎒 Сумка</h2>
                <div style="color:#aaa;font-size:0.8em;margin-bottom:12px;">Свободно: ${bag.getFreeSlots()}/${bag.getMaxSlots()}</div>

                <h3 style="color:#c9a84c;font-size:0.9em;margin:12px 0 8px;">📦 Инвентарь</h3>
                <div style="max-height:300px;overflow-y:auto;">${itemsHtml}</div>

                <h3 style="color:#c9a84c;font-size:0.9em;margin:12px 0 8px;">⚔️ Экипировка</h3>
                <div>${equipmentHtml}</div>
            </div>
        `;
    },

    // ============================================================
    //  ВСПОМОГАТЕЛЬНЫЕ
    // ============================================================

    _hideMainInterface() {
        document.querySelectorAll('.bg-layer, .statue-left, .statue-right, .divider-left, .divider-right, .arch-layer, .hero-frame, .top-panel, .top-actions, .left-buttons, .right-buttons, .bottom-stats')
            .forEach(el => {
                if (el) el.style.display = 'none';
            });
        const placeholder = document.querySelector('.placeholder-screen');
        if (placeholder) placeholder.remove();
    },

    // ============================================================
    //  ПРОЧИЕ РЕЖИМЫ
    // ============================================================

    settings() { this._showPlaceholder('⚙️ Настройки', 'settings_page.jpeg'); },
    profile() { this._showPlaceholder('👤 Профиль', 'character_page.jpeg'); },
    quest() { this._showPlaceholder('📜 Квесты', 'quest_chapter_1.jpeg'); },
    raid() { this._showPlaceholder('⚔️ Рейд', 'background_raid.png'); },
    portal() { this._showPlaceholder('🌀 Порталы', 'portal_1.jpeg'); },
    arena() { this._showPlaceholder('🏟️ Арена', 'arena.jpeg'); },
    tavern() { this._showPlaceholder('🍺 Таверна', 'tavern.jpeg'); },
    daily() { this._showPlaceholder('📋 Ежедневные задания', 'tasks.jpeg'); },
    training() { this._showPlaceholder('💪 Тренировка', 'training.jpeg'); },
    forge() { this._showPlaceholder('⚒️ Кузница', 'forge.jpeg'); },
    market() { this._showPlaceholder('💰 Рынок', 'market.jpeg'); },
    bestiary() { this._showPlaceholder('📖 Бестиарий', 'bestiary.jpeg'); },

    _showPlaceholder(title, bg) {
        this._hideMainInterface();
        this.container.style.background = "url('assets/backgrounds/" + bg + "') center/cover no-repeat";

        const div = document.createElement('div');
        div.className = 'placeholder-screen';
        div.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.3);
            color: #e0c080;
            padding: 20px;
            z-index: 100;
        `;
        div.innerHTML = `
            <div style="font-size:3em;margin-bottom:16px;">🏗️</div>
            <div style="font-size:1.2em;margin-bottom:8px;">${title}</div>
            <div style="font-size:0.7em;color:#888;">В разработке</div>
            <button onclick="SherwoodUI.loadHome()" style="margin-top:20px;background:rgba(201,168,76,0.2);border:1px solid rgba(201,168,76,0.3);color:#e0c080;padding:8px 24px;border-radius:20px;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">← На главную</button>
        `;
        this.container.appendChild(div);
        console.log('📌 Плейсхолдер:', title);
    }
};

// ============================================================
//  ЗАПУСК
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    SherwoodUI.init();
});

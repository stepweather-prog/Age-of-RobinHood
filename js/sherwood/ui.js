/**
 * Sherwood UI — Контроллер интерфейса
 */

const SherwoodUI = {
    // ============================================================
    //  КОНСТАНТЫ ФОНОВ
    // ============================================================

    _bg: {
        main: 'assets/backgrounds/homepage_screen.jpeg',
        bag: 'assets/backgrounds/bag.jpeg',
        profile: 'assets/backgrounds/character_page.jpeg',
        bestiary: 'assets/backgrounds/character_page.jpeg',
        quests: 'assets/backgrounds/skill_page.jpeg',
        training: 'assets/backgrounds/training.jpeg',
        forge: 'assets/backgrounds/forge.jpeg',
        tavern: 'assets/backgrounds/tavern.jpeg',
        market: 'assets/backgrounds/market.jpeg',
        arena: 'assets/backgrounds/arena.jpeg',
        raid: 'assets/backgrounds/background_raid.png',
        settings: 'assets/backgrounds/settings_page.jpeg',
        daily: 'assets/backgrounds/tasks.jpeg',
        portal: 'assets/backgrounds/portal_1.jpeg',
        dungeon_select: 'assets/backgrounds/underground_1_floor_1.jpg',
        dungeon_forest: 'assets/backgrounds/underground_1_floor_1.jpg',
        dungeon_swamp: 'assets/backgrounds/underground_2_floor_1.jpeg',
        dungeon_cave: 'assets/backgrounds/underground_3_floor_1.jpeg',
        dungeon_fight: 'assets/backgrounds/underground_1_floor_1.jpg'
    },

    // ============================================================
    //  АУДИО
    // ============================================================

    _sounds: {},
    _currentMusic: null,
    _currentMusicKey: null,
    _soundEnabled: true,
    _musicEnabled: true,

    _audioFiles: {
        'forest_ambient': 'assets/sounds/main_topic.ogg',
        'dungeon_ambient': 'assets/sounds/subway_1.wav',
        'tavern_ambient': 'assets/sounds/tavern_ambient.wav',
        'click': 'assets/sounds/button_click.ogg',
        'shot': 'assets/sounds/normal_hit.flac',
        'arrow_hit': 'assets/sounds/normal_hit.flac',
        'victory': 'assets/sounds/level_completed.wav',
        'defeat': 'assets/sounds/defeat.wav',
        'levelup': 'assets/sounds/levelup.wav',
        'chest_open': 'assets/sounds/chest_opens.wav',
        'trap': 'assets/sounds/trap.wav',
        'dungeon_enter': 'assets/sounds/subway_1.wav'
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

        // Создаём слой для экранов
        this._screenLayer = document.createElement('div');
        this._screenLayer.id = 'screen-layer';
        this._screenLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;display:none;';
        this.container.appendChild(this._screenLayer);

        // Кешируем элементы главного экрана
        this._mainElements = [
            '.bg-layer', '.arch-layer', '.hero-frame',
            '.top-panel', '.top-actions', '.left-buttons',
            '.right-buttons', '.bottom-stats'
        ];

        this._initSounds();
        this.bindButtons();
        this.bindPlayButton();
        this.updateDisplay();

        // Подписываемся на события
        if (typeof Sherwood !== 'undefined') {
            Sherwood.on('RESOURCE_CHANGED', () => this.updateDisplay());
            Sherwood.on('PLAYER_LEVEL_UP', () => {
                this._playSound('levelup');
                this.updateDisplay();
            });
        }

        this._loadAudioSettings();
        console.log('🏹 Sherwood UI инициализирован!');
    },

    // ============================================================
    //  АУДИО
    // ============================================================

    _initSounds() {
        for (const [key, path] of Object.entries(this._audioFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = 0.5;
            this._sounds[key] = audio;
        }
    },

    _playSound(key) {
        if (!this._soundEnabled) return;
        const sound = this._sounds[key];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    },

    _playMusic(key) {
        if (!this._musicEnabled) return;
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

    _saveAudioSettings() {
        localStorage.setItem('sherwood_audio_settings', JSON.stringify({
            soundEnabled: this._soundEnabled,
            musicEnabled: this._musicEnabled
        }));
    },

    _loadAudioSettings() {
        const saved = localStorage.getItem('sherwood_audio_settings');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this._soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
                this._musicEnabled = data.musicEnabled !== undefined ? data.musicEnabled : true;
            } catch (e) {}
        }
    },

    // ============================================================
    //  КНОПКИ
    // ============================================================

    bindButtons() {
        document.querySelectorAll('#mainInterface .btn[data-action]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = el.dataset.action;
                if (action && typeof this[action] === 'function') {
                    this._playSound('click');
                    this[action]();
                }
            });
        });
    },

    bindPlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this._playSound('click');
                const loading = document.getElementById('loadingScreen');
                const main = document.getElementById('mainInterface');
                if (loading) loading.classList.add('hidden');
                if (main) main.classList.add('active');
                this._playMusic('forest_ambient');
                console.log('🎮 Игра запущена!');
            });
        }
    },

    // ============================================================
    //  ОБНОВЛЕНИЕ ДАННЫХ
    // ============================================================

    updateDisplay() {
        const p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        if (!p) return;

        const goldEl = document.getElementById('gold-display');
        const silverEl = document.getElementById('silver-display');
        const expEl = document.getElementById('exp-display');
        const expMaxEl = document.getElementById('exp-max-display');

        if (goldEl) goldEl.textContent = this._formatNumber(p.resources?.gold || 0);
        if (silverEl) silverEl.textContent = this._formatNumber(p.resources?.silver || 0);
        if (expEl) expEl.textContent = this._formatNumber(p.exp || 0);
        if (expMaxEl) expMaxEl.textContent = this._formatNumber(p.expToLevel || 100);

        const attackEl = document.querySelector('.stat-values .attack');
        const defenseEl = document.querySelector('.stat-values .defense');
        const agilityEl = document.querySelector('.stat-values .agility');
        const hpEl = document.querySelector('.stat-values .hp');

        if (attackEl) attackEl.textContent = p.stats?.attack || 0;
        if (defenseEl) defenseEl.textContent = p.stats?.defense || 0;
        if (agilityEl) agilityEl.textContent = p.stats?.agility || 0;
        if (hpEl) hpEl.textContent = p.stats?.hp || 0;
    },

    _formatNumber(n) {
        if (n === undefined || n === null) return '0';
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },

    // ============================================================
    //  НАВИГАЦИЯ (СЛОИ)
    // ============================================================

    loadHome() {
        if (this._screenLayer) {
            this._screenLayer.style.display = 'none';
            this._screenLayer.innerHTML = '';
        }

        this._mainElements.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = '';
            });
        });

        this.container.style.background = '';
        this._playMusic('forest_ambient');
        this.updateDisplay();
        console.log('🏠 Главный экран');
    },

    _openScreen(title, bgKey, contentHTML) {
        this._mainElements.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = 'none';
            });
        });

        let bgPath = this._bg[bgKey] || bgKey;
        this.container.style.background = `url('${bgPath}') center/cover no-repeat`;

        if (this._screenLayer) {
            this._screenLayer.innerHTML = `
                <div style="min-height:100%;background:rgba(0,0,0,0.7);padding:16px;display:flex;flex-direction:column;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                        <button onclick="SherwoodUI.loadHome()" style="background:rgba(255,255,255,0.1);border:1px solid #666;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:'Georgia',serif;">← Назад</button>
                        <span style="color:#e0c080;font-size:1.1em;">${title}</span>
                    </div>
                    <div style="flex:1;">${contentHTML}</div>
                </div>
            `;
            this._screenLayer.style.display = 'block';
        }
    },

    // ============================================================
    //  ПОДЗЕМКА
    // ============================================================

    subway() { this.showDungeon(); },

    showDungeon() {
        this._playSound('click');
        this._playMusic('dungeon_ambient');

        const dungeons = (typeof Sherwood !== 'undefined' && Sherwood.Dungeon && Sherwood.Dungeon.getAvailableDungeons)
            ? Sherwood.Dungeon.getAvailableDungeons()
            : {};

        let list = '';
        const entries = Object.entries(dungeons);

        if (entries.length === 0) {
            list = '<div style="color:#aaa;text-align:center;padding:20px;">Подземелья временно недоступны</div>';
        }

        for (const [id, data] of entries) {
            const progress = (Sherwood.Dungeon._playerProgress && Sherwood.Dungeon._playerProgress[id])
                ? Sherwood.Dungeon._playerProgress[id]
                : { level: 1, stars: 0 };

            list += `
                <div style="background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:10px;padding:12px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="color:#e0c080;font-size:1.1em;">${data.icon || '🏚️'} ${data.name || id}</span>
                        <span style="color:#aaa;font-size:0.8em;">Уровень ${progress.level || 1}/7</span>
                    </div>
                    <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap;">
                        ${[1,2,3,4,5,6,7].map(lvl => {
                            const unlocked = lvl <= (progress.level || 1);
                            return `<button onclick="SherwoodUI._startDungeon('${id}',${lvl})" 
                                style="background:${unlocked ? '#c9a040' : '#444'};border:none;border-radius:4px;padding:4px 8px;color:${unlocked ? '#000' : '#888'};cursor:${unlocked ? 'pointer' : 'default'};font-size:0.8em;">
                                ${unlocked ? '⭐' : '🔒'} ${lvl}
                            </button>`;
                        }).join('')}
                    </div>
                    <div style="color:#666;font-size:0.7em;">${(progress.level || 1) >= 7 ? '✅ Пройдено' : 'Следующий: ' + ((progress.level || 1) + 1)}</div>
                </div>
            `;
        }

        const tickets = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer)
            ? (Sherwood.getPlayer().dungeon?.tickets || 0)
            : 0;

        const contentHTML = `
            <div style="color:#aaa;font-size:0.8em;margin-bottom:12px;">🎫 Билетов: ${tickets}</div>
            ${list}
        `;

        this._openScreen('🏰 Подземелья', 'dungeon_select', contentHTML);
    },

    _startDungeon(dungeonId, level) {
        if (typeof Sherwood === 'undefined' || !Sherwood.Dungeon || !Sherwood.Dungeon.generateDungeon) {
            this._showNotification('❌ Система подземелий не загружена');
            return;
        }
        const d = Sherwood.Dungeon.generateDungeon(dungeonId, level);
        if (!d) {
            this._showNotification('❌ Нет билетов!');
            return;
        }
        this._playSound('dungeon_enter');
        this._playMusic('dungeon_ambient');
        this._dungeon = d;
        this._renderDungeon();
    },

    _showNotification(msg) {
        const log = document.getElementById('dungeon-log');
        if (log) {
            log.textContent = msg;
            log.style.color = '#f44336';
            setTimeout(() => { log.style.color = '#aaa'; }, 2000);
        }
    },

    _renderDungeon() {
        const d = this._dungeon || ((typeof Sherwood !== 'undefined' && Sherwood.Dungeon && Sherwood.Dungeon.getDungeon) ? Sherwood.Dungeon.getDungeon() : null);
        if (!d) { this.showDungeon(); return; }

        const bgMap = {
            forest: this._bg.dungeon_forest,
            swamp: this._bg.dungeon_swamp,
            cave: this._bg.dungeon_cave
        };
        this.container.style.background = `url('${bgMap[d.dungeonId] || this._bg.dungeon_forest}') center/cover no-repeat`;

        this._mainElements.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
        });

        const size = d.size || 8;
        const cellSize = Math.min(50, Math.floor((this.container.clientWidth - 32) / size));
        const grid = d.grid || [];

        const tileFolder = d.tileFolder || 'dungeon1';
        const tileExt = d.tileExt || '.jpeg';
        const tilePrefix = d.tilePrefix || 'tiles';
        const tileBasePath = `assets/dungeon_tiles/${tileFolder}`;

        let gridHtml = '';

        for (let y = 0; y < size; y++) {
            gridHtml += '<div style="display:flex;justify-content:center;gap:2px;margin-bottom:2px;">';
            for (let x = 0; x < size; x++) {
                const cell = (grid[y] && grid[y][x]) ? grid[y][x] : { type: 'wall', walkable: false, visible: false, explored: false };
                const isPlayer = d.playerPos && d.playerPos.x === x && d.playerPos.y === y;
                const isVisible = cell.visible || cell.explored;

                let bgImage = `${tileBasePath}/${tilePrefix}1${tileExt}`;
                let content = '';
                let borderColor = 'rgba(255,255,255,0.05)';
                let extraStyle = '';
                let clickHandler = '';

                if (isVisible) {
                    const tileNum = 1 + ((x * 7 + y * 3) % 14);
                    bgImage = `${tileBasePath}/${tilePrefix}${tileNum}${tileExt}`;

                    borderColor = 'rgba(255,255,255,0.1)';

                    if (cell.type === 'start') { content = '🏠'; }
                    else if (cell.type === 'exit') { content = '🚪'; borderColor = '#4caf50'; }
                    else if (cell.type === 'chest') { content = cell.looted ? '📭' : '📦'; borderColor = '#ffc107'; }
                    else if (cell.hasMonster) {
                        content = cell.isBoss ? '👑' : '👹';
                        borderColor = cell.isBoss ? '#ff6a00' : '#f44336';
                    }

                    const isAdjacent = d.playerPos && Math.abs(x - d.playerPos.x) + Math.abs(y - d.playerPos.y) === 1;
                    if (isAdjacent && !isPlayer && cell.walkable) {
                        clickHandler = `onclick="SherwoodUI._dungeonMove(${x},${y})"`;
                        extraStyle = 'cursor:pointer;';
                        if (!cell.hasMonster && cell.type !== 'exit') {
                            borderColor = '#4caf50';
                        }
                    }
                }

                if (isPlayer) {
                    content = '<img src="assets/interface/labyrinth_of_icons.png" style="width:80%;height:80%;object-fit:contain;">';
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
                    ">
                        ${content}
                    </div>
                `;
            }
            gridHtml += '</div>';
        }

        const hp = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? (Sherwood.getPlayer().stats?.hp || 0) : 0;

        if (this._screenLayer) {
            this._screenLayer.innerHTML = `
                <div style="min-height:100%;background:rgba(0,0,0,0.5);padding:12px;display:flex;flex-direction:column;align-items:center;">
                    <div style="width:100%;max-width:${cellSize * size + 20}px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <button onclick="SherwoodUI._leaveDungeon()" style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);color:#ccc;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:'Georgia',serif;">← Выйти</button>
                            <div style="color:#70a0e0;font-weight:bold;">${d.dungeonId || 'dungeon'} Ур.${d.level || 1}</div>
                            <div style="color:#4caf50;">❤️${hp}</div>
                        </div>
                        <div style="background:rgba(0,0,0,0.5);border-radius:6px;padding:6px;margin-bottom:8px;">
                            <div style="display:flex;justify-content:space-around;font-size:11px;color:#aaa;">
                                <span>👹 ${d.monstersKilled || 0}/${d.totalMonsters || 0}</span>
                                <span>📦 ${d.chestsOpened || 0}</span>
                                <span>🚶 ${d.steps || 0}</span>
                            </div>
                        </div>
                        ${gridHtml}
                        <div id="dungeon-log" style="text-align:center;font-size:12px;color:#aaa;min-height:20px;margin-top:8px;background:rgba(0,0,0,0.6);border-radius:6px;padding:6px;"></div>
                    </div>
                </div>
            `;
            this._screenLayer.style.display = 'block';
        }
    },

    _dungeonMove(x, y) {
        if (typeof Sherwood === 'undefined' || !Sherwood.Dungeon || !Sherwood.Dungeon.movePlayer) return;

        const d = this._dungeon || Sherwood.Dungeon.getDungeon();
        if (!d) return;

        const dx = x - d.playerPos.x;
        const dy = y - d.playerPos.y;
        const result = Sherwood.Dungeon.movePlayer(dx, dy);

        const log = document.getElementById('dungeon-log');

        if (!result || !result.success) {
            if (log) log.textContent = '🚫 ' + (result?.reason || 'Нельзя');
            return;
        }

        if (result.type === 'battle') {
            if (log) log.textContent = '⚔️ Бой с ' + (result.isBoss ? 'БОССОМ!' : 'монстром!');
            this._playSound('shot');
            this._renderBattle();
            return;
        }

        if (result.type === 'chest') {
            this._playSound('chest_open');
            if (log) log.textContent = '🎁 +' + (result.reward?.gold || 0) + '🪙 +' + (result.reward?.silver || 0) + '⚪';
            this.updateDisplay();
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
        if (typeof Sherwood !== 'undefined' && Sherwood.Dungeon && Sherwood.Dungeon.leaveDungeon) {
            Sherwood.Dungeon.leaveDungeon();
        }
        this._dungeon = null;
        this._playMusic('forest_ambient');
        this.showDungeon();
    },

    // ============================================================
    //  БОЙ (ЗАГЛУШКА)
    // ============================================================

    _renderBattle() {
        const contentHTML = `
            <div style="text-align:center;color:#fff;">
                <h2 style="color:#ffd700;">⚔️ БОЙ ⚔️</h2>
                <div style="font-size:2em;margin:20px 0;">👹</div>
                <div style="color:#aaa;">Боевая система в разработке</div>
                <button onclick="SherwoodUI._leaveDungeon()" style="margin-top:20px;background:#c9a040;border:none;padding:10px 30px;border-radius:8px;cursor:pointer;font-weight:bold;font-family:'Georgia',serif;">Назад</button>
            </div>
        `;
        this._openScreen('⚔️ Бой', 'dungeon_fight', contentHTML);
    },

    // ============================================================
    //  СУМКА
    // ============================================================

    bag() {
        this._playSound('click');

        const bag = (typeof Sherwood !== 'undefined' && Sherwood.Bag) ? Sherwood.Bag : null;
        const items = bag ? bag.getItems() : [];
        const maxSlots = bag ? bag.getMaxSlots() : 10;

        let itemsHtml = '';
        for (let i = 0; i < maxSlots; i++) {
            const item = items[i] || null;
            if (item) {
                const gradeColors = (typeof Sherwood !== 'undefined' && Sherwood.GradeColors) ? Sherwood.GradeColors : {};
                const gradeColor = gradeColors[item.grade] || '#9d9d9d';
                itemsHtml += `
                    <div onclick="SherwoodUI._bagAction(${i})" style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid ${gradeColor};border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;cursor:pointer;padding:4px;">
                        <img src="${item.icon || 'assets/interface/labyrinth_of_icons.png'}" style="width:32px;height:32px;object-fit:contain;">
                        ${item.quantity > 1 ? `<span style="position:absolute;bottom:2px;right:4px;color:#fff;font-size:0.6em;background:rgba(0,0,0,0.7);padding:0 4px;border-radius:4px;">${item.quantity}</span>` : ''}
                    </div>
                `;
            } else {
                itemsHtml += `
                    <div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid #333;border-radius:6px;display:flex;align-items:center;justify-content:center;opacity:0.4;">
                        <span style="color:#555;font-size:0.6em;">пусто</span>
                    </div>
                `;
            }
        }

        const contentHTML = `
            <div style="color:#aaa;font-size:0.8em;margin-bottom:12px;">${items.length}/${maxSlots}</div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-width:340px;margin:0 auto;">
                ${itemsHtml}
            </div>
            <div id="bag-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;min-height:20px;">Нажми на предмет для действий</div>
        `;

        this._openScreen('🎒 Сумка', 'bag', contentHTML);
    },

    _bagAction(index) {
        const bag = (typeof Sherwood !== 'undefined' && Sherwood.Bag) ? Sherwood.Bag : null;
        if (!bag) return;
        const items = bag.getItems();
        if (index >= items.length) return;
        const item = items[index];
        if (!item) return;

        const info = document.getElementById('bag-info');
        if (!info) return;

        let actions = '';
        if (item.part) {
            actions += `<button onclick="Sherwood.Bag.equipItem(${index});SherwoodUI.bag();" style="background:#4caf50;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:'Georgia',serif;">Надеть</button>`;
        }
        actions += `<button onclick="Sherwood.Bag.sellItem(${index});SherwoodUI.bag();" style="background:#ff9800;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:'Georgia',serif;">Продать</button>`;
        actions += `<button onclick="Sherwood.Bag.dismantleItem(${index});SherwoodUI.bag();" style="background:#f44336;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:'Georgia',serif;">Разобрать</button>`;

        info.innerHTML = `
            <div style="color:#fff;font-size:0.9em;">${item.name || 'Предмет'}</div>
            <div style="color:#aaa;font-size:0.7em;">${item.grade || 'обычный'}</div>
            <div style="margin-top:6px;">${actions}</div>
        `;
    },

    // ============================================================
    //  ПРОФИЛЬ
    // ============================================================

    profile() {
        this._playSound('click');

        const p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        const bag = (typeof Sherwood !== 'undefined' && Sherwood.Bag) ? Sherwood.Bag : null;
        const equipment = bag ? bag.getEquipment() : {};
        const ringItem = equipment.ring;
        const amuletItem = equipment.amulet;
        const trophies = p ? (p.trophies || []) : [];
        const lastTrophy = trophies.length > 0 ? (trophies[trophies.length - 1]?.name || 'Трофей') : 'Нет трофеев';

        const contentHTML = `
            <div style="text-align:center;margin-bottom:12px;">
                <img src="assets/hero_skins/skin_1_basic.png" style="width:80px;height:80px;border-radius:50%;border:2px solid #c9a040;display:inline-block;">
                <div style="color:#e0c080;font-weight:bold;font-size:1.1em;margin-top:4px;">${p ? p.name : 'Охотник'}</div>
                <div style="color:#aaa;font-size:0.8em;">Уровень ${p ? p.level : 1}</div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(0,0,0,0.4);border-radius:10px;padding:12px;margin-bottom:12px;">
                <div style="text-align:center;"><span style="color:#f44336;">⚔️ ${p ? p.stats.attack : 0}</span></div>
                <div style="text-align:center;"><span style="color:#2196f3;">🛡️ ${p ? p.stats.defense : 0}</span></div>
                <div style="text-align:center;"><span style="color:#ff9800;">💨 ${p ? p.stats.agility : 0}</span></div>
                <div style="text-align:center;"><span style="color:#4caf50;">❤️ ${p ? p.stats.hp : 0}</span></div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
                <div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;border:2px solid #c9a040;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo('trophies')">
                    <div style="font-size:1.2em;">🏆</div>
                    <div style="color:#aaa;font-size:0.55em;word-break:break-all;">${lastTrophy}</div>
                </div>
                <div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;border:2px solid #ffd700;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo('ring')">
                    <div style="font-size:1.2em;">💍</div>
                    <div style="color:#aaa;font-size:0.55em;word-break:break-all;">${ringItem ? ringItem.name : 'Пусто'}</div>
                </div>
                <div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;border:2px solid #9c27b0;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo('amulet')">
                    <div style="font-size:1.2em;">📿</div>
                    <div style="color:#aaa;font-size:0.55em;word-break:break-all;">${amuletItem ? amuletItem.name : 'Пусто'}</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                <button onclick="SherwoodUI.training()" style="background:rgba(255,152,0,0.2);border:1px solid #ff9800;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;font-family:'Georgia',serif;">💪 Тренировка</button>
                <button onclick="SherwoodUI.forge()" style="background:rgba(121,85,72,0.2);border:1px solid #795548;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;font-family:'Georgia',serif;">⚒️ Кузница</button>
                <button onclick="SherwoodUI.bestiary()" style="background:rgba(96,125,139,0.2);border:1px solid #607d8b;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;font-family:'Georgia',serif;">📖 Бестиарий</button>
            </div>

            <div id="profile-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;min-height:20px;">Нажми на иконку для информации</div>
        `;

        this._openScreen('👤 Профиль', 'profile', contentHTML);
    },

    _showProfileInfo(type) {
        const info = document.getElementById('profile-info');
        if (!info) return;

        if (type === 'trophies') {
            const trophies = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? (Sherwood.getPlayer().trophies || []) : [];
            if (trophies.length === 0) {
                info.innerHTML = '🏆 Трофеев пока нет';
                return;
            }
            info.innerHTML = trophies.map(t => `🏆 ${t.name || 'Трофей'}`).join(' | ');
        } else if (type === 'ring') {
            const ring = (typeof Sherwood !== 'undefined' && Sherwood.Bag) ? Sherwood.Bag.getEquipment().ring : null;
            info.innerHTML = ring ? `💍 ${ring.name} (Ур.${ring.level || 1})` : '💍 Кольцо не надето';
        } else if (type === 'amulet') {
            const amulet = (typeof Sherwood !== 'undefined' && Sherwood.Bag) ? Sherwood.Bag.getEquipment().amulet : null;
            info.innerHTML = amulet ? `📿 ${amulet.name} (Ур.${amulet.level || 1})` : '📿 Амулет не надет';
        }
    },

    // ============================================================
    //  ТРЕНИРОВКА, КУЗНИЦА, БЕСТИАРИЙ
    // ============================================================

    training() {
        this._playSound('click');
        const p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        const tl = p ? (p.trainingLevels || {}) : {};

        const contentHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                ${['attack','defense','hp','agility'].map(stat => {
                    const lvl = tl[stat] || 0;
                    return `
                        <div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:12px;text-align:center;">
                            <div style="color:#e0c080;">${stat === 'attack' ? '⚔️ Атака' : stat === 'defense' ? '🛡️ Защита' : stat === 'hp' ? '❤️ Здоровье' : '💨 Ловкость'}</div>
                            <div style="color:#aaa;">Ур. ${lvl}/200</div>
                            <button onclick="SherwoodUI._doTraining('${stat}')" style="margin-top:8px;background:#c9a040;border:none;border-radius:4px;padding:6px 16px;color:#000;cursor:pointer;font-family:'Georgia',serif;">Тренировать</button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div id="training-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;"></div>
        `;

        this._openScreen('💪 Тренировка', 'training', contentHTML);
    },

    _doTraining(stat) {
        const p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        if (!p) return;
        if (!p.trainingLevels) p.trainingLevels = { attack: 0, defense: 0, hp: 0, agility: 0 };

        const current = p.trainingLevels[stat] || 0;
        if (current >= 200) {
            const log = document.getElementById('training-log');
            if (log) log.textContent = '❌ Максимальный уровень!';
            return;
        }

        const cyclePos = (current + 1) % 5;
        const isGold = cyclePos === 0;
        const cost = isGold ? 5 : 200;
        const currency = isGold ? 'gold' : 'silver';

        if ((p.resources[currency] || 0) < cost) {
            const log = document.getElementById('training-log');
            if (log) log.textContent = `❌ Не хватает ${isGold ? 'золота' : 'серебра'}!`;
            return;
        }

        p.resources[currency] -= cost;
        p.trainingLevels[stat] = current + 1;

        if (typeof Sherwood._recalcStats === 'function') Sherwood._recalcStats();
        if (typeof Sherwood.saveGame === 'function') Sherwood.saveGame();

        this.updateDisplay();
        this.training();

        const log = document.getElementById('training-log');
        if (log) log.textContent = `✅ ${stat} улучшен до ${current + 1}!`;
    },

    forge() {
        this._showPlaceholder('⚒️ Кузница', 'forge');
    },

    bestiary() {
        this._showPlaceholder('📖 Бестиарий', 'bestiary');
    },

    // ============================================================
    //  НАСТРОЙКИ
    // ============================================================

    settings() {
        this._playSound('click');

        const p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        const currentName = p ? p.name : 'Охотник';

        const contentHTML = `
            <div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;">
                <div style="color:#fff;margin-bottom:8px;">👤 Имя персонажа</div>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="player-name-input" value="${currentName}" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:6px;padding:8px 12px;color:#fff;font-family:'Georgia',serif;font-size:0.9em;">
                    <button onclick="SherwoodUI._changePlayerName()" style="background:#c9a040;border:none;border-radius:6px;padding:8px 16px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">Сохранить</button>
                </div>
                <div id="name-change-status" style="color:#aaa;font-size:0.7em;margin-top:4px;"></div>
            </div>

            <div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <span style="color:#fff;">🔊 Звуки</span>
                    <label style="position:relative;width:50px;height:26px;background:${this._soundEnabled ? '#4caf50' : '#555'};border-radius:13px;cursor:pointer;transition:0.2s;">
                        <input type="checkbox" ${this._soundEnabled ? 'checked' : ''} onchange="SherwoodUI._toggleSound(this.checked)" style="display:none;">
                        <span style="position:absolute;top:2px;left:${this._soundEnabled ? '26px' : '2px'};width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                    </label>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#fff;">🎵 Музыка</span>
                    <label style="position:relative;width:50px;height:26px;background:${this._musicEnabled ? '#4caf50' : '#555'};border-radius:13px;cursor:pointer;transition:0.2s;">
                        <input type="checkbox" ${this._musicEnabled ? 'checked' : ''} onchange="SherwoodUI._toggleMusic(this.checked)" style="display:none;">
                        <span style="position:absolute;top:2px;left:${this._musicEnabled ? '26px' : '2px'};width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                    </label>
                </div>
            </div>

            <button onclick="SherwoodUI._exitGame()" style="width:100%;background:#f44336;border:none;border-radius:8px;padding:12px;color:#fff;font-weight:bold;font-size:1em;cursor:pointer;font-family:'Georgia',serif;">
                🚪 Выйти из игры
            </button>
        `;

        this._openScreen('⚙️ Настройки', 'settings', contentHTML);
    },

    _changePlayerName() {
        const input = document.getElementById('player-name-input');
        const status = document.getElementById('name-change-status');
        if (!input || !status) return;

        const newName = input.value.trim();
        if (!newName) {
            status.textContent = '❌ Имя не может быть пустым';
            status.style.color = '#f44336';
            return;
        }

        const p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        if (p) {
            p.name = newName;
            if (typeof Sherwood.saveGame === 'function') Sherwood.saveGame();
            status.textContent = '✅ Имя сохранено!';
            status.style.color = '#4caf50';
        } else {
            status.textContent = '❌ Ошибка сохранения';
            status.style.color = '#f44336';
        }
    },

    _toggleSound(enabled) {
        this._soundEnabled = enabled;
        this._saveAudioSettings();
        if (!enabled) {
            for (const sound of Object.values(this._sounds)) {
                sound.pause();
                sound.currentTime = 0;
            }
        }
        this.settings();
    },

    _toggleMusic(enabled) {
        this._musicEnabled = enabled;
        this._saveAudioSettings();
        if (!enabled) {
            this._stopMusic();
        } else {
            this._playMusic('forest_ambient');
        }
        this.settings();
    },

    _exitGame() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            if (typeof Sherwood !== 'undefined' && Sherwood.saveGameNow) {
                Sherwood.saveGameNow();
            } else if (typeof Sherwood !== 'undefined' && Sherwood.saveGame) {
                Sherwood.saveGame();
            }
            this._stopMusic();
            window.location.href = 'about:blank';
        }
    },

    // ============================================================
    //  ПРОЧИЕ РЕЖИМЫ (ПЛЕЙСХОЛДЕРЫ)
    // ============================================================

    quest() { this._showPlaceholder('📜 Квесты', 'quests'); },
    raid() { this._showPlaceholder('⚔️ Рейд', 'raid'); },
    portal() { this._showPlaceholder('🌀 Порталы', 'portal'); },
    arena() { this._showPlaceholder('🏟️ Арена', 'arena'); },
    tavern() { this._showPlaceholder('🍺 Таверна', 'tavern'); },
    daily() { this._showPlaceholder('📋 Ежедневные задания', 'daily'); },
    market() { this._showPlaceholder('💰 Рынок', 'market'); },

    // ============================================================
    //  ПЛЕЙСХОЛДЕР
    // ============================================================

    _showPlaceholder(title, bgKey) {
        this._playSound('click');
        const contentHTML = `
            <div style="text-align:center;padding:40px 0;">
                <div style="font-size:3em;margin-bottom:16px;">🏗️</div>
                <div style="font-size:1.2em;color:#e0c080;margin-bottom:8px;">${title}</div>
                <div style="font-size:0.7em;color:#888;">В разработке</div>
            </div>
        `;
        this._openScreen(title, bgKey, contentHTML);
    }
};

// ============================================================
//  ЗАПУСК
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (typeof SherwoodUI !== 'undefined' && SherwoodUI.init) {
        SherwoodUI.init();
    } else {
        console.error('❌ SherwoodUI не загружен!');
    }
});

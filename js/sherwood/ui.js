/**
 * Sherwood UI — Контроллер интерфейса
 */

const SherwoodUI = {
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
        chat: 'assets/backgrounds/chat_background.png',
        dungeon_select: 'assets/backgrounds/underground_1_floor_1.jpg',
        dungeon_forest: 'assets/backgrounds/underground_1_floor_1.jpg',
        dungeon_swamp: 'assets/backgrounds/underground_2_floor_1.jpeg',
        dungeon_cave: 'assets/backgrounds/underground_3_floor_1.jpeg',
        dungeon_fight: 'assets/backgrounds/underground_1_floor_1.jpg'
    },

    _statIcons: {
        attack: 'assets/interface/icon_power.png',
        defense: 'assets/interface/icon_defense.png',
        agility: 'assets/interface/icon_dexterity.png',
        hp: 'assets/interface/icon_health.png'
    },

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
        'dungeon_enter': 'assets/sounds/subway_1.wav',
        'altar': 'assets/sounds/altar_underground.mp3',
        'loot_drop': 'assets/sounds/loot_drop.wav',
        'bottle_health': 'assets/sounds/bottle_health.mp3',
        'forge': 'assets/sounds/forge.wav'
    },

    _previousScreen: null,
    _dungeon: null,

    init() {
        this.container = document.getElementById('game-container');
        if (!this.container) return;
        this._screenLayer = document.createElement('div');
        this._screenLayer.id = 'screen-layer';
        this._screenLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;display:none;';
        this.container.appendChild(this._screenLayer);
        this._mainElements = ['.bg-layer', '.arch-layer', '.hero-frame', '.top-panel', '.left-buttons', '.right-buttons', '.bottom-stats'];
        this._initSounds();
        this.bindButtons();
        this.bindPlayButton();
        this.updateDisplay();
        if (typeof Sherwood !== 'undefined') {
            Sherwood.on('RESOURCE_CHANGED', () => this.updateDisplay());
            Sherwood.on('PLAYER_LEVEL_UP', () => { this._playSound('levelup'); this.updateDisplay(); });
        }
        this._loadAudioSettings();
    },

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
        if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); }
    },

    _playMusic(key) {
        if (!this._musicEnabled) return;
        if (this._currentMusicKey === key && this._currentMusic && !this._currentMusic.paused) return;
        this._stopMusic();
        const music = this._sounds[key];
        if (music) { music.loop = true; music.volume = 0.3; music.currentTime = 0; music.play().catch(() => {}); this._currentMusic = music; this._currentMusicKey = key; }
    },

    _stopMusic() {
        if (this._currentMusic) { this._currentMusic.pause(); this._currentMusic.currentTime = 0; this._currentMusic = null; this._currentMusicKey = null; }
    },

    _saveAudioSettings() {
        localStorage.setItem('sherwood_audio_settings', JSON.stringify({ soundEnabled: this._soundEnabled, musicEnabled: this._musicEnabled }));
    },

    _loadAudioSettings() {
        const saved = localStorage.getItem('sherwood_audio_settings');
        if (saved) { try { const d = JSON.parse(saved); this._soundEnabled = d.soundEnabled !== undefined ? d.soundEnabled : true; this._musicEnabled = d.musicEnabled !== undefined ? d.musicEnabled : true; } catch(e) {} }
    },

    bindButtons() {
        document.querySelectorAll('#mainInterface .btn[data-action]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = el.dataset.action;
                if (action && typeof this[action] === 'function') { this._playSound('click'); this[action](); }
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
            });
        }
    },

    updateDisplay() {
        const p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        if (!p) return;
        document.getElementById('gold-display').textContent = this._formatNumber(p.resources?.gold || 0);
        document.getElementById('silver-display').textContent = this._formatNumber(p.resources?.silver || 0);
        document.getElementById('exp-display').textContent = this._formatNumber(p.exp || 0);
        document.getElementById('exp-max-display').textContent = this._formatNumber(p.expToLevel || 100);
        const ae = document.querySelector('.stat-value.attack');
        const de = document.querySelector('.stat-value.defense');
        const ge = document.querySelector('.stat-value.agility');
        const he = document.querySelector('.stat-value.hp');
        if (ae) ae.textContent = p.stats?.attack || 0;
        if (de) de.textContent = p.stats?.defense || 0;
        if (ge) ge.textContent = p.stats?.agility || 0;
        if (he) he.textContent = p.stats?.hp || 0;
    },

    _formatNumber(n) { return (n === undefined || n === null) ? '0' : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); },

    loadHome() {
        if (this._screenLayer) { this._screenLayer.style.display = 'none'; this._screenLayer.innerHTML = ''; }
        this._mainElements.forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = ''));
        this.container.style.background = '';
        this._playMusic('forest_ambient');
        this._previousScreen = null;
        this.updateDisplay();
    },

    _openScreen(title, bgKey, contentHTML, backAction) {
        this._mainElements.forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = 'none'));
        const bgPath = this._bg[bgKey] || bgKey;
        this.container.style.background = `url('${bgPath}') center/cover no-repeat`;
        const goBack = backAction || 'SherwoodUI.loadHome()';
        if (this._screenLayer) {
            this._screenLayer.innerHTML = `<div style="min-height:100%;background:rgba(0,0,0,0.7);padding:16px;display:flex;flex-direction:column;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button onclick="${goBack}" style="background:transparent;border:none;cursor:pointer;padding:0;width:50px;height:50px;"><img src="assets/all_buttons/back.png" style="width:100%;height:100%;object-fit:contain;"></button><span style="color:#e0c080;font-size:1.1em;">${title}</span></div><div style="flex:1;">${contentHTML}</div></div>`;
            this._screenLayer.style.display = 'block';
        }
    },

    // ========== ПОДЗЕМКА ==========
    subway() { this.showDungeon(); },

    showDungeon() {
        this._playSound('click'); this._playMusic('dungeon_ambient');
        const dungeons = (typeof Sherwood !== 'undefined' && Sherwood.Dungeon?.getAvailableDungeons) ? Sherwood.Dungeon.getAvailableDungeons() : {};
        let list = '';
        for (const [id, data] of Object.entries(dungeons)) {
            const progress = Sherwood.Dungeon._playerProgress?.[id] || { level: 1, stars: 0 };
            const bgMap = { forest: 'assets/backgrounds/underground_1_floor_1.jpg', swamp: 'assets/backgrounds/underground_2_floor_1.jpeg', cave: 'assets/backgrounds/underground_3_floor_1.jpeg' };
            const tfMap = { forest: 'dungeon1', swamp: 'dungeon2', cave: 'dungeon3' };
            const teMap = { forest: '.jpeg', swamp: '.png', cave: '.png' };
            const tpMap = { forest: 'tiles', swamp: 'tiles2.', cave: 'tiles3.' };
            const tf = tfMap[id] || 'dungeon1'; const te = teMap[id] || '.jpeg'; const tp = tpMap[id] || 'tiles';
            list += `<div style="background:url('assets/backgrounds/skill_page.jpeg') center/cover no-repeat;border:1px solid #555;border-radius:12px;padding:14px;margin-bottom:12px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:0;"></div><div style="position:relative;z-index:1;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:60px;height:60px;border-radius:10px;background:url('${bgMap[id] || bgMap['forest']}') center/cover no-repeat;border:2px solid #c9a040;flex-shrink:0;"></div><div><div style="color:#e0c080;font-size:1.1em;font-weight:bold;">${data.name || id}</div><div style="color:#aaa;font-size:0.75em;">${data.icon || ''} Уровень ${progress.level || 1}/7</div></div></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">${[1,2,3,4,5,6,7].map(lvl => { const u = lvl <= (progress.level || 1); return `<div onclick="${u ? `SherwoodUI._startDungeon('${id}',${lvl})` : ''}" style="width:48px;height:48px;background-image:url('${u ? `assets/dungeon_tiles/${tf}/${tp}${lvl}${te}` : 'assets/interface/closed_level_lock_icon.png'}');background-size:cover;background-position:center;border:2px solid ${u ? '#c9a040' : '#555'};border-radius:6px;cursor:${u ? 'pointer' : 'default'};display:flex;align-items:center;justify-content:center;position:relative;"><span style="position:absolute;bottom:1px;right:3px;font-size:0.6em;color:${u ? '#000' : '#888'};">${lvl}</span></div>`; }).join('')}</div><div style="text-align:center;color:#666;font-size:0.7em;margin-top:6px;">${(progress.level || 1) >= 7 ? '✅ Пройдено' : 'Следующий: ' + ((progress.level || 1) + 1)}</div></div></div>`;
        }
        const tickets = Sherwood.getPlayer?.()?.dungeon?.tickets || 0;
        this._mainElements.forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = 'none'));
        this.container.style.background = `url('${this._bg.dungeon_select}') center/cover no-repeat`;
        if (this._screenLayer) { this._screenLayer.innerHTML = `<div style="min-height:100%;background:rgba(0,0,0,0.7);padding:16px;display:flex;flex-direction:column;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button onclick="SherwoodUI.loadHome()" style="background:transparent;border:none;cursor:pointer;padding:0;width:50px;height:50px;"><img src="assets/all_buttons/back.png" style="width:100%;height:100%;object-fit:contain;"></button><span style="color:#e0c080;font-size:1.1em;">🏰 Подземелья</span></div><div style="flex:1;"><div style="color:#aaa;font-size:0.85em;margin-bottom:12px;text-align:center;">🎫 Билетов: ${tickets}</div>${list || '<div style="color:#aaa;text-align:center;">Нет доступных подземелий</div>'}</div></div>`; this._screenLayer.style.display = 'block'; }
    },

    _startDungeon(dungeonId, level) {
        if (!Sherwood.Dungeon?.generateDungeon) return;
        const d = Sherwood.Dungeon.generateDungeon(dungeonId, level);
        if (!d) { this._showNotification('❌ Нет билетов!'); return; }
        this._playSound('dungeon_enter'); this._playMusic('dungeon_ambient'); this._dungeon = d; this._renderDungeon();
    },

    _showNotification(msg) { const log = document.getElementById('dungeon-log'); if (log) { log.textContent = msg; log.style.color = '#f44336'; setTimeout(() => log.style.color = '#aaa', 2000); } },

            _renderDungeon() {
        const d = this._dungeon || Sherwood.Dungeon?.getDungeon?.();
        if (!d) { this.showDungeon(); return; }
        const bgMap = { forest: this._bg.dungeon_forest, swamp: this._bg.dungeon_swamp, cave: this._bg.dungeon_cave };
        this.container.style.background = `url('${bgMap[d.dungeonId] || this._bg.dungeon_forest}') center/cover no-repeat`;
        this._mainElements.forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = 'none'));
        const size = d.size || 8;
        const cellSize = Math.min(50, Math.floor((this.container.clientWidth - 32) / size));
        const tf = d.tileFolder || 'dungeon1';
        const te = d.tileExt || '.jpeg';
        const tp = d.tilePrefix || 'tiles';
        const tbp = `assets/dungeon_tiles/${tf}`;
        const openFloorBg = `assets/dungeon_tiles/${tf}/${tf}tiles.png`;
        const chestIcons = {
            forest: { closed: 'assets/interface/locked_chest_first_dungeon.png', open: 'assets/interface/open_chest_first_dungeon.png' },
            swamp: { closed: 'assets/interface/locked_chest_second_dungeon.png', open: 'assets/interface/open_chest_of_the_second_dungeon.png' },
            cave: { closed: 'assets/interface/locked_chest_third_dungeon.png', open: 'assets/interface/open_chest_third_dungeon.png' }
        };
        const altarIcons = { forest: 'assets/interface/altar_of_the_first_dungeon.png', swamp: 'assets/interface/altar_of_the_second_dungeon.png', cave: 'assets/interface/the_third_altar_of_the_dungeon.png' };
        const cauldronIcons = { forest: 'assets/interface/cauldron_first_dungeon.png', swamp: 'assets/interface/cauldron_of_the_second_dungeon.png', cave: 'assets/interface/the_third_cauldron_of_the_dungeon.png' };
        const ci = chestIcons[d.dungeonId] || chestIcons['forest'];
        const ai = altarIcons[d.dungeonId] || altarIcons['forest'];
        const cai = cauldronIcons[d.dungeonId] || cauldronIcons['forest'];

        // Собираем открытые клетки для фона
        let openCells = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = d.grid[y]?.[x];
                if (cell && cell.explored) {
                    openCells.push({ x, y });
                }
            }
        }

        let gridHtml = '';
        for (let y = 0; y < size; y++) {
            gridHtml += '<div style="display:flex;justify-content:center;gap:2px;margin-bottom:2px;">';
            for (let x = 0; x < size; x++) {
                const cell = d.grid[y]?.[x] || { type: 'wall', walkable: false, visible: false, explored: false };
                const isPlayer = d.playerPos?.x === x && d.playerPos?.y === y;
                const isExplored = cell.explored;
                const isVisible = cell.visible;

                // Закрытая клетка — тайл, открытая — прозрачная (фон снизу)
                let bgStyle;
                if (isExplored) {
                    bgStyle = 'background:transparent;';
                } else {
                    const tileNum = 1 + ((x * 7 + y * 3) % 14);
                    bgStyle = `background-image:url('${tbp}/${tp}${tileNum}${te}');background-size:cover;background-position:center;`;
                }

                let content = '';
                let bc = isExplored ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)';
                let es = '';
                let ch = '';

                if (isExplored && isVisible) {
                    if (cell.type === 'start') {
                        content = '<img src="assets/interface/labyrinth_of_icons.png" style="width:70%;height:70%;object-fit:contain;opacity:0.5;">';
                    } else if (cell.type === 'exit') {
                        content = '<img src="assets/interface/staircase_with_an_arch.png" style="width:80%;height:80%;object-fit:contain;">';
                        bc = '#4caf50';
                    } else if (cell.type === 'chest') {
                        content = `<img src="${cell.looted ? ci.open : ci.closed}" style="width:80%;height:80%;object-fit:contain;">`;
                        bc = '#ffc107';
                    } else if (cell.type === 'altar') {
                        content = `<img src="${ai}" style="width:80%;height:80%;object-fit:contain;">`;
                        bc = '#9c27b0';
                    } else if (cell.type === 'cauldron') {
                        content = `<img src="${cai}" style="width:80%;height:80%;object-fit:contain;">`;
                        bc = '#4caf50';
                    } else if (cell.hasMonster) {
                        if (cell.monsterId) {
                            content = `<img src="assets/all_beasts/${cell.monsterId}" style="width:80%;height:80%;object-fit:contain;" onerror="this.style.display='none';this.parentElement.innerHTML='👹';">`;
                        } else {
                            content = cell.isBoss ? '👑' : '👹';
                        }
                        bc = cell.isBoss ? '#ff6a00' : '#f44336';
                    }

                    if (!isPlayer && cell.walkable) {
                        const isAdjacent = d.playerPos && Math.abs(x - d.playerPos.x) + Math.abs(y - d.playerPos.y) === 1;
                        if (isAdjacent) {
                            ch = `onclick="SherwoodUI._dungeonMove(${x},${y})"`;
                            es = 'cursor:pointer;';
                            if (!cell.hasMonster && !['exit','chest','altar','cauldron'].includes(cell.type)) {
                                bc = '#4caf50';
                            }
                        }
                    }
                }

                if (isPlayer) {
                    content = '<img src="assets/interface/labyrinth_of_icons.png" style="width:80%;height:80%;object-fit:contain;">';
                    bc = '#ffd700';
                    es += 'box-shadow:0 0 16px rgba(255,215,0,0.5);';
                }

                gridHtml += `<div ${ch} style="width:${cellSize}px;height:${cellSize}px;${bgStyle}border:2px solid ${bc};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:${cellSize*0.4}px;transition:0.15s;${es}">${content}</div>`;
            }
            gridHtml += '</div>';
        }

        // Фон открытого пола — позиционируем под открытыми клетками
        let openFloorHtml = '';
        for (const oc of openCells) {
            const left = oc.x * (cellSize + 2) + 1;
            const top = oc.y * (cellSize + 2) + 1;
            openFloorHtml += `<div style="position:absolute;left:${left}px;top:${top}px;width:${cellSize}px;height:${cellSize}px;background-image:url('${openFloorBg}');background-size:cover;background-position:center;border-radius:4px;z-index:0;pointer-events:none;"></div>`;
        }

        const hp = Sherwood.getPlayer?.()?.stats?.hp || 0;
        const gridWidth = cellSize * size + (size - 1) * 2;

        if (this._screenLayer) {
            this._screenLayer.innerHTML = `<div style="min-height:100%;background:rgba(0,0,0,0.5);padding:12px;display:flex;flex-direction:column;align-items:center;"><div style="width:100%;max-width:${gridWidth + 20}px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><button onclick="SherwoodUI._leaveDungeon()" style="background:transparent;border:none;cursor:pointer;padding:0;width:44px;height:44px;"><img src="assets/all_buttons/back.png" style="width:100%;height:100%;object-fit:contain;"></button><div style="color:#70a0e0;font-weight:bold;">${d.dungeonId||'dungeon'} Ур.${d.level||1}</div><div style="color:#4caf50;">❤️${hp}</div></div><div style="background:rgba(0,0,0,0.5);border-radius:6px;padding:6px;margin-bottom:8px;"><div style="display:flex;justify-content:space-around;font-size:11px;color:#aaa;"><span>👹 ${d.monstersKilled||0}/${d.totalMonsters||0}</span><span>📦 ${d.chestsOpened||0}</span><span>🚶 ${d.steps||0}</span></div></div><div style="position:relative;width:${gridWidth}px;height:${gridWidth}px;margin:0 auto;">${openFloorHtml}<div style="position:relative;z-index:1;">${gridHtml}</div></div><div id="dungeon-log" style="text-align:center;font-size:12px;color:#aaa;min-height:20px;margin-top:8px;background:rgba(0,0,0,0.6);border-radius:6px;padding:6px;"></div></div></div>`;
            this._screenLayer.style.display = 'block';
        }
    },
    _dungeonMove(x, y) {
        if (!Sherwood.Dungeon?.movePlayer) return;
        const d = this._dungeon || Sherwood.Dungeon.getDungeon(); if (!d) return;
        const r = Sherwood.Dungeon.movePlayer(x - d.playerPos.x, y - d.playerPos.y);
        const log = document.getElementById('dungeon-log');
        if (!r?.success) { if (log) log.textContent = '🚫 ' + (r?.reason || 'Нельзя'); return; }
        if (r.type === 'battle') { if (log) log.textContent = '⚔️ Бой!'; this._playSound('shot'); this._renderBattle(); return; }
        if (r.type === 'chest') { this._playSound('chest_open'); this.updateDisplay(); this._renderDungeon(); return; }
        if (r.type === 'altar') { this._playSound('altar'); this.updateDisplay(); this._renderDungeon(); return; }
        if (r.type === 'cauldron') { this._playSound('bottle_health'); this.updateDisplay(); this._renderDungeon(); return; }
        if (r.type === 'exit') { this._playSound('victory'); this._renderDungeon(); setTimeout(() => { this._playMusic('forest_ambient'); this.showDungeon(); }, 2000); return; }
        this._renderDungeon();
    },

    _leaveDungeon() { Sherwood.Dungeon?.leaveDungeon?.(); this._dungeon = null; this._playMusic('forest_ambient'); this.showDungeon(); },
        // ========== БОЙ ==========
    _renderBattle() {
        if (Sherwood.Combat?.isInBattle()) { this._showCombatScreen(); return; }
        const d = this._dungeon || Sherwood.Dungeon?.getDungeon?.();
        if (!d?.playerPos) { this._leaveDungeon(); return; }
        const cell = d.grid[d.playerPos.y]?.[d.playerPos.x];
        if (!cell?.hasMonster) { this._renderDungeon(); return; }
        if (!Sherwood.Combat?.startBattle(cell.monsterId, cell.isBoss, d.dungeonId)?.success) { this._renderDungeon(); return; }
        this._showCombatScreen();
    },

    _showCombatScreen() {
        if (!Sherwood.Combat) return;
        const b = Sherwood.Combat.getBattle(); if (!b) { this._renderDungeon(); return; }
        const mhp = Math.round((b.monsterHp / b.monsterMaxHp) * 100);
        const php = Math.round((b.playerHp / b.playerMaxHp) * 100);
        const cd = Sherwood.Combat.getCooldowns();
        const h = `<div style="text-align:center;"><div style="color:#ff6a00;">${b.isBoss ? '👑 БОСС' : '👹 Монстр'}</div><div style="margin:12px 0;"><img src="assets/all_beasts/${b.monsterImage}" style="width:100px;height:100px;object-fit:contain;border:2px solid #f44336;border-radius:12px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="color:#f44336;font-weight:bold;">${b.monsterName}</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#f44336;height:100%;width:${mhp}%;transition:0.3s;"></div></div><div style="color:#aaa;font-size:0.7em;">❤️ ${b.monsterHp}/${b.monsterMaxHp}</div></div><div style="color:#ffd700;">⚔️ VS ⚔️</div><div style="margin:12px 0;"><img src="assets/hero_skins/skin_1_basic.png" style="width:70px;height:70px;object-fit:contain;border:2px solid #4caf50;border-radius:50%;"><div style="color:#4caf50;">❤️ ${b.playerHp}/${b.playerMaxHp}</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#4caf50;height:100%;width:${php}%;transition:0.3s;"></div></div></div><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;"><button onclick="SherwoodUI._combatAttack()" style="background:#c9a040;border:none;border-radius:8px;padding:8px 18px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">⚔️ Удар</button><button onclick="SherwoodUI._combatSkill('power_shot')" style="background:#ff5722;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.75em;">💥 Мощный${cd['power_shot']?' ('+cd['power_shot']+')':''}</button><button onclick="SherwoodUI._combatSkill('triple_shot')" style="background:#2196f3;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.75em;">🏹 Тройной${cd['triple_shot']?' ('+cd['triple_shot']+')':''}</button></div><div style="display:flex;gap:6px;justify-content:center;margin-top:6px;"><button onclick="SherwoodUI._combatSkill('poison_arrow')" style="background:#4caf50;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.75em;">☠️ Яд${cd['poison_arrow']?' ('+cd['poison_arrow']+')':''}</button><button onclick="SherwoodUI._combatSkill('stunning_shot')" style="background:#9c27b0;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.75em;">💫 Оглуш${cd['stunning_shot']?' ('+cd['stunning_shot']+')':''}</button></div><div style="display:flex;gap:8px;justify-content:center;margin-top:8px;"><button onclick="SherwoodUI._combatPotion()" style="background:rgba(76,175,80,0.2);border:1px solid #4caf50;border-radius:6px;padding:6px 14px;color:#4caf50;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🧪 Зелье</button><button onclick="SherwoodUI._combatFlee()" style="background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 14px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Бежать</button></div><div id="combat-log" style="text-align:center;color:#aaa;font-size:0.75em;margin-top:8px;min-height:18px;"></div></div>`;
        this._openScreen('⚔️ Бой', 'dungeon_fight', h);
    },

    _combatAttack() { this._handleCombatResult(Sherwood.Combat?.playerAttack()); },
    _combatSkill(sid) { this._handleCombatResult(Sherwood.Combat?.useSkill(sid)); },
    _combatPotion() {
        const r = Sherwood.Combat?.usePotion();
        const log = document.getElementById('combat-log');
        if (r?.success) { if (log) log.textContent = `🧪 +${r.healAmount} HP | Враг: -${r.enemyDamage}`; if (r.playerDead) setTimeout(() => this._handleCombatResult({ victory: false }), 1000); else this._showCombatScreen(); }
        else { if (log) log.textContent = '❌ ' + (r?.reason || 'Ошибка'); }
    },
    _combatFlee() {
        const r = Sherwood.Combat?.flee();
        const log = document.getElementById('combat-log');
        if (r?.fled) { if (log) log.textContent = '🏃 Сбежали!'; setTimeout(() => this._leaveDungeon(), 1000); }
        else { if (log) log.textContent = '❌ Не вышло! Враг: -' + r?.enemyDamage; if (r?.playerDead) setTimeout(() => this._handleCombatResult({ victory: false }), 1000); else this._showCombatScreen(); }
    },

    _handleCombatResult(r) {
        if (!r) return; const log = document.getElementById('combat-log');
        if (r.victory) {
            let msg = '🏆 Победа! +' + r.exp + 'XP +' + r.gold + '🪙'; if (r.droppedItem) msg += ' 📦 Предмет!'; if (log) log.textContent = msg;
            const d = this._dungeon || Sherwood.Dungeon?.getDungeon?.();
            if (d?.playerPos) { const c = d.grid[d.playerPos.y]?.[d.playerPos.x]; if (c) { if (c.monsterId && Sherwood.Bestiary) Sherwood.Bestiary.registerKill(c.monsterId); Sherwood.Dungeon?.onMonsterDefeated?.(c); } }
            this.updateDisplay(); setTimeout(() => this._renderDungeon(), 1500);
        } else if (r.victory === false) { if (log) log.textContent = '💀 Поражение...'; setTimeout(() => this._leaveDungeon(), 1500); }
        else { let msg = ''; if (r.isCrit) msg += '💥 КРИТ! '; msg += '-' + r.damage; if (r.enemyDamage) msg += ' | Враг: -' + r.enemyDamage; if (log) log.textContent = msg; this.updateDisplay(); this._showCombatScreen(); }
    },

    // ========== СУМКА ==========
    bag() {
        this._playSound('click');
        const bag = Sherwood.Bag; const items = bag?.getItems() || []; const max = bag?.getMaxSlots() || 10;
        let h = '';
        for (let i = 0; i < max; i++) {
            const item = items[i];
            if (item) {
                const gc = Sherwood.GradeColors?.[item.grade] || '#9d9d9d';
                h += `<div onclick="SherwoodUI._bagAction(${i})" style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid ${gc};border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;cursor:pointer;padding:4px;"><img src="${item.icon || 'assets/interface/labyrinth_of_icons.png'}" style="width:32px;height:32px;object-fit:contain;">${item.quantity > 1 ? `<span style="position:absolute;bottom:2px;right:4px;color:#fff;font-size:0.6em;background:rgba(0,0,0,0.7);padding:0 4px;border-radius:4px;">${item.quantity}</span>` : ''}</div>`;
            } else {
                h += `<div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid #333;border-radius:6px;display:flex;align-items:center;justify-content:center;opacity:0.4;"><span style="color:#555;font-size:0.6em;">пусто</span></div>`;
            }
        }
        const c = `<div style="color:#aaa;font-size:0.8em;margin-bottom:12px;">${items.length}/${max}</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-width:340px;margin:0 auto;">${h}</div><div id="bag-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;min-height:20px;">Нажми на предмет</div>`;
        this._openScreen('🎒 Сумка', 'bag', c);
    },

    _bagAction(i) {
        const bag = Sherwood.Bag; if (!bag) return; const items = bag.getItems(); if (i >= items.length) return; const item = items[i]; if (!item) return;
        const info = document.getElementById('bag-info'); if (!info) return;
        let a = '';
        if (item.part) a += `<button onclick="Sherwood.Bag.equipItem(${i});SherwoodUI.bag();" style="background:#4caf50;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:'Georgia',serif;">Надеть</button>`;
        a += `<button onclick="Sherwood.Bag.sellItem(${i});SherwoodUI.bag();" style="background:#ff9800;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:'Georgia',serif;">Продать</button>`;
        a += `<button onclick="Sherwood.Bag.dismantleItem(${i});SherwoodUI.bag();" style="background:#f44336;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:'Georgia',serif;">Разобрать</button>`;
        info.innerHTML = `<div style="color:#fff;font-size:0.9em;">${item.name||'Предмет'}</div><div style="color:#aaa;font-size:0.7em;">${item.grade||'обычный'}</div><div style="margin-top:6px;">${a}</div>`;
    },

    // ========== ПРОФИЛЬ ==========
    profile() {
        this._playSound('click');
        const p = Sherwood.getPlayer?.(); const bag = Sherwood.Bag; const eq = bag?.getEquipment() || {};
        const ring = eq.ring; const amulet = eq.amulet; const trophies = p?.trophies || [];
        const lastTrophy = trophies.length > 0 ? trophies[trophies.length-1]?.name || 'Трофей' : 'Нет трофеев';
        const h = `<div style="text-align:center;margin-bottom:12px;"><img src="assets/hero_skins/${Sherwood.Forge?.getActiveSkin?.() || 'skin_1_basic'}.png" style="width:80px;height:80px;border-radius:50%;border:2px solid #c9a040;display:inline-block;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="color:#e0c080;font-weight:bold;font-size:1.1em;margin-top:4px;">${p?.name||'Охотник'}</div><div style="color:#aaa;font-size:0.8em;">Уровень ${p?.level||1}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(0,0,0,0.4);border-radius:10px;padding:12px;margin-bottom:12px;">${['attack','defense','agility','hp'].map(s => `<div style="text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;"><img src="${this._statIcons[s]}" style="width:22px;height:22px;object-fit:contain;"><span style="color:${s==='attack'?'#f44336':s==='defense'?'#2196f3':s==='agility'?'#ff9800':'#4caf50'};">${p?.stats?.[s]||0}</span></div>`).join('')}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;"><div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;border:2px solid #c9a040;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo('trophies')"><img src="assets/all_trophies/trophies_chapters/chapter_1_broken_hunting_horn_of_the_league.png" style="width:32px;height:32px;object-fit:contain;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">${lastTrophy}</div></div><div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;border:2px solid #ffd700;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo('ring')"><img src="assets/interface/ring_first_level.png" style="width:32px;height:32px;object-fit:contain;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">${ring?ring.name:'Пусто'}</div></div><div style="background:url('assets/interface/bag_cell.jpeg') center/contain no-repeat;background-size:cover;border:2px solid #9c27b0;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo('amulet')"><img src="assets/interface/sherwood_amulet_level_one.png" style="width:32px;height:32px;object-fit:contain;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">${amulet?amulet.name:'Пусто'}</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;"><button onclick="SherwoodUI._previousScreen='profile';SherwoodUI.training();" style="background:rgba(255,152,0,0.2);border:1px solid #ff9800;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;font-family:'Georgia',serif;"><img src="assets/all_buttons/training.png" style="width:24px;height:24px;object-fit:contain;display:block;margin:0 auto 4px;">Тренировка</button><button onclick="SherwoodUI._previousScreen='profile';SherwoodUI.forge();" style="background:rgba(121,85,72,0.2);border:1px solid #795548;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;font-family:'Georgia',serif;"><img src="assets/all_buttons/forge.png" style="width:24px;height:24px;object-fit:contain;display:block;margin:0 auto 4px;">Кузница</button><button onclick="SherwoodUI._previousScreen='profile';SherwoodUI.bestiary();" style="background:rgba(96,125,139,0.2);border:1px solid #607d8b;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;font-family:'Georgia',serif;"><img src="assets/all_buttons/bestiary.png" style="width:24px;height:24px;object-fit:contain;display:block;margin:0 auto 4px;">Бестиарий</button></div><div id="profile-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;min-height:20px;"></div>`;
        this._openScreen('👤 Профиль', 'profile', h);
    },

    _showProfileInfo(type) {
        const info = document.getElementById('profile-info'); if (!info) return;
        if (type === 'trophies') { const t = Sherwood.getPlayer?.()?.trophies || []; info.innerHTML = t.length ? t.map(x => '🏆 '+x.name).join(' | ') : '🏆 Трофеев нет'; }
        else if (type === 'ring') { const r = Sherwood.Bag?.getEquipment?.()?.ring; info.innerHTML = r ? `💍 ${r.name} (Ур.${r.level||1})` : '💍 Кольцо не надето'; }
        else if (type === 'amulet') { const a = Sherwood.Bag?.getEquipment?.()?.amulet; info.innerHTML = a ? `📿 ${a.name} (Ур.${a.level||1})` : '📿 Амулет не надет'; }
    },

    // ========== ТРЕНИРОВКА ==========
    training() {
        const gb = this._previousScreen === 'profile' ? 'SherwoodUI.profile()' : 'SherwoodUI.loadHome()'; this._previousScreen = null;
        this._playSound('click');
        const p = Sherwood.getPlayer?.(); const tl = p?.trainingLevels || {};
        const stats = ['attack','defense','hp','agility']; const sn = { attack:'Атака',defense:'Защита',hp:'Здоровье',agility:'Ловкость' }; const sc = { attack:'#f44336',defense:'#2196f3',hp:'#4caf50',agility:'#ff9800' };
        const h = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${stats.map(s => `<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:12px;text-align:center;"><div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;"><img src="${this._statIcons[s]}" style="width:28px;height:28px;object-fit:contain;"><span style="color:#e0c080;">${sn[s]}</span></div><div style="color:#aaa;font-size:0.8em;">Ур. ${tl[s]||0}/200</div><div style="color:${sc[s]};font-size:0.7em;">+${s==='hp'?10:s==='agility'?1:2} за ур.</div><button onclick="SherwoodUI._doTraining('${s}')" style="margin-top:8px;background:#c9a040;border:none;border-radius:4px;padding:6px 16px;color:#000;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">Тренировать</button></div>`).join('')}</div><div id="training-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;"></div>`;
        this._openScreen('💪 Тренировка', 'training', h, gb);
    },

    _doTraining(stat) {
        const p = Sherwood.getPlayer?.(); if (!p) return; if (!p.trainingLevels) p.trainingLevels = { attack:0,defense:0,hp:0,agility:0 };
        const cur = p.trainingLevels[stat] || 0; if (cur >= 200) { const log = document.getElementById('training-log'); if (log) log.textContent = '❌ Макс. уровень!'; return; }
        const cp = (cur + 1) % 5; const isGold = cp === 0; const cost = isGold ? 5 : 200; const currency = isGold ? 'gold' : 'silver';
        if ((p.resources[currency]||0) < cost) { const log = document.getElementById('training-log'); if (log) log.textContent = `❌ Не хватает ${isGold?'золота':'серебра'}!`; return; }
        p.resources[currency] -= cost; p.trainingLevels[stat] = cur + 1;
        Sherwood._recalcStats?.(); Sherwood.saveGame?.(); this.updateDisplay(); this.training();
        const log = document.getElementById('training-log'); if (log) log.textContent = `✅ ${stat} улучшен до ${cur+1}!`;
    },

    // ========== КУЗНИЦА ==========
    forge() {
        const gb = this._previousScreen === 'profile' ? 'SherwoodUI.profile()' : 'SherwoodUI.loadHome()'; this._previousScreen = null;
        this._playSound('click'); this._playSound('forge');
        if (!Sherwood.Forge) { this._showPlaceholder('⚒️ Кузница', 'forge', gb); return; }
        const bag = Sherwood.Bag; const items = bag?.getItems() || [];
        const enhanceItems = items.filter(i => i.part || i.type === 'equipment');
        const skins = Sherwood.Forge.getCraftSkins();
        const player = Sherwood.getPlayer();
        const unlockedSkins = player?.unlockedSkins || [];
        const activeSkin = player?.activeSkin || 'skin_1_basic';

        let enhanceHtml = '';
        for (let i = 0; i < enhanceItems.length; i++) {
            const item = enhanceItems[i]; const idx = items.indexOf(item);
            const lvl = item.enhancement || 0;
            enhanceHtml += `<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:6px;padding:8px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;"><div><div style="color:#e0c080;font-size:0.8em;">${item.name}</div><div style="color:#aaa;font-size:0.6em;">Заточка: +${lvl}</div></div><button onclick="SherwoodUI._enhanceItem(${idx})" style="background:#c9a040;border:none;border-radius:4px;padding:4px 10px;color:#000;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">Точить</button></div>`;
        }

        let skinsHtml = '';
        for (const skin of skins) {
            const unlocked = unlockedSkins.includes(skin.id);
            const active = activeSkin === skin.id;
            skinsHtml += `<div style="background:rgba(0,0,0,0.5);border:2px solid ${active?'#ffd700':unlocked?'#4caf50':'#555'};border-radius:8px;padding:8px;text-align:center;"><img src="${skin.icon}" style="width:48px;height:48px;object-fit:contain;border-radius:4px;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="color:#e0c080;font-size:0.7em;">${skin.name}</div>${unlocked ? (active ? '<div style="color:#ffd700;font-size:0.6em;">Активен</div>' : `<button onclick="SherwoodUI._equipSkin('${skin.id}')" style="margin-top:4px;background:#4caf50;border:none;border-radius:4px;padding:3px 8px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.6em;">Надеть</button>`) : `<div style="color:#aaa;font-size:0.55em;">${skin.cost.ingots} сл. ${skin.cost.scrolls} скр. ${skin.cost.silver} сер.</div><button onclick="SherwoodUI._craftSkin('${skin.id}')" style="margin-top:4px;background:#ff9800;border:none;border-radius:4px;padding:3px 8px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.6em;">Создать</button>`}</div>`;
        }

        const h = `<div style="margin-bottom:12px;"><div style="color:#e0c080;margin-bottom:4px;">⚒️ Заточка</div>${enhanceHtml || '<div style="color:#aaa;font-size:0.7em;">Нет предметов для заточки</div>'}</div><div><div style="color:#e0c080;margin-bottom:4px;">🎨 Облики</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">${skinsHtml}</div></div><div id="forge-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>`;
        this._openScreen('⚒️ Кузница', 'forge', h, gb);
    },

    _enhanceItem(idx) {
        const r = Sherwood.Forge?.enhanceItem(idx);
        const log = document.getElementById('forge-log');
        if (r?.enhanced) { if (log) log.textContent = '✅ Улучшено! +' + r.newLevel; }
        else if (r?.broken) { if (log) log.textContent = '💔 Сломано!'; }
        else if (r?.failed) { if (log) log.textContent = '❌ Неудача'; }
        else { if (log) log.textContent = '❌ ' + (r?.reason || 'Ошибка'); }
        this.updateDisplay(); setTimeout(() => this.forge(), 800);
    },

    _craftSkin(sid) {
        const r = Sherwood.Forge?.craftSkin(sid);
        const log = document.getElementById('forge-log');
        if (r?.success) { if (log) log.textContent = '✅ Облик создан!'; }
        else { if (log) log.textContent = '❌ ' + (r?.reason || 'Ошибка'); }
        this.updateDisplay(); setTimeout(() => this.forge(), 800);
    },

    _equipSkin(sid) {
        Sherwood.Forge?.equipSkin(sid);
        const heroImg = document.querySelector('.hero-frame img');
        if (heroImg) heroImg.src = `assets/hero_skins/${sid}.png`;
        this.forge();
    },

    // ========== БЕСТИАРИЙ ==========
    bestiary() {
        const gb = this._previousScreen === 'profile' ? 'SherwoodUI.profile()' : 'SherwoodUI.loadHome()'; this._previousScreen = null;
        this._playSound('click');
        if (!Sherwood.Bestiary) { this._showPlaceholder('📖 Бестиарий', 'bestiary', gb); return; }
        const progress = Sherwood.Bestiary.getDiscoveryProgress();
        const zones = ['Проклятая чаща','Первородное болото','Базальтовые шахты','Квест','Рейд'];
        let list = '';
        for (const zone of zones) {
            const beasts = Sherwood.Bestiary.getBeastsByZone(zone); if (!beasts.length) continue;
            list += `<div style="color:#e0c080;font-weight:bold;margin:10px 0 6px;">📍 ${zone}</div>`;
            for (const b of beasts) {
                const d = b.kills > 0;
                list += `<div style="background:rgba(0,0,0,0.5);border:1px solid ${d?'#4caf50':'#555'};border-radius:8px;padding:8px;margin-bottom:4px;display:flex;align-items:center;gap:8px;"><img src="assets/all_beasts/${b.id}" style="width:40px;height:40px;object-fit:contain;border-radius:4px;${d?'':'filter:grayscale(1);opacity:0.5;'}" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="flex:1;"><div style="color:${d?'#fff':'#888'};">${d?b.name:'???'}</div><div style="color:#aaa;font-size:0.6em;">${b.floor} | ${b.type}</div></div><div style="color:#aaa;font-size:0.7em;">Убито: ${b.kills}</div></div>`;
            }
        }
        const h = `<div style="text-align:center;margin-bottom:8px;color:#aaa;">📖 Открыто: ${progress.discovered}/${progress.total} (${progress.percent}%)</div><div style="background:rgba(0,0,0,0.3);border-radius:6px;height:10px;margin-bottom:12px;overflow:hidden;"><div style="background:#c9a040;height:100%;width:${progress.percent}%;"></div></div>${list||'<div style="color:#aaa;text-align:center;">Бестиарий пуст</div>'}`;
        this._openScreen('📖 Бестиарий', 'bestiary', h, gb);
    },

    // ========== НАСТРОЙКИ ==========
    settings() {
        this._playSound('click');
        const p = Sherwood.getPlayer?.(); const nm = p?.name || 'Охотник';
        const h = `<div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;"><div style="color:#fff;margin-bottom:8px;">👤 Имя</div><div style="display:flex;gap:8px;"><input id="pni" value="${nm}" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:6px;padding:8px 12px;color:#fff;font-family:'Georgia',serif;font-size:0.9em;"><button onclick="SherwoodUI._changePlayerName()" style="background:#c9a040;border:none;border-radius:6px;padding:8px 16px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">Сохранить</button></div><div id="name-status" style="color:#aaa;font-size:0.7em;margin-top:4px;"></div></div><div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="color:#fff;">🔊 Звуки</span><label style="position:relative;width:50px;height:26px;background:${this._soundEnabled?'#4caf50':'#555'};border-radius:13px;cursor:pointer;"><input type="checkbox" ${this._soundEnabled?'checked':''} onchange="SherwoodUI._toggleSound(this.checked)" style="display:none;"><span style="position:absolute;top:2px;left:${this._soundEnabled?'26px':'2px'};width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span></label></div><div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#fff;">🎵 Музыка</span><label style="position:relative;width:50px;height:26px;background:${this._musicEnabled?'#4caf50':'#555'};border-radius:13px;cursor:pointer;"><input type="checkbox" ${this._musicEnabled?'checked':''} onchange="SherwoodUI._toggleMusic(this.checked)" style="display:none;"><span style="position:absolute;top:2px;left:${this._musicEnabled?'26px':'2px'};width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span></label></div></div><button onclick="SherwoodUI._exitGame()" style="width:100%;background:#f44336;border:none;border-radius:8px;padding:12px;color:#fff;font-weight:bold;font-size:1em;cursor:pointer;font-family:'Georgia',serif;">🚪 Выйти</button>`;
        this._openScreen('⚙️ Настройки', 'settings', h);
    },

    _changePlayerName() {
        const inp = document.getElementById('pni'); const st = document.getElementById('name-status'); if (!inp||!st) return;
        const nm = inp.value.trim(); if (!nm) { st.textContent = '❌ Пустое имя'; st.style.color = '#f44336'; return; }
        const p = Sherwood.getPlayer?.(); if (p) { p.name = nm; Sherwood.saveGame?.(); if (Sherwood.Chat) Sherwood.Chat.setUsername(nm); st.textContent = '✅ Сохранено!'; st.style.color = '#4caf50'; }
    },

    _toggleSound(en) { this._soundEnabled = en; this._saveAudioSettings(); if (!en) Object.values(this._sounds).forEach(s => { s.pause(); s.currentTime = 0; }); this.settings(); },
    _toggleMusic(en) { this._musicEnabled = en; this._saveAudioSettings(); if (!en) this._stopMusic(); else this._playMusic('forest_ambient'); this.settings(); },

    _exitGame() {
        if (confirm('Выйти?')) { Sherwood.saveGameNow?.() || Sherwood.saveGame?.(); this._stopMusic(); window.location.href = 'about:blank'; }
    },

    // ========== КВЕСТЫ ==========
    quest() {
        this._playSound('click');
        if (!Sherwood.Quests) { this._showPlaceholder('📜 Квесты', 'quests'); return; }
        const progress = Sherwood.Quests.getCurrentProgress();
        const chapters = Sherwood.Quests.getAllChapters();
        const energy = Sherwood.Quests.getEnergy();
        let h = '';
        for (const ch of chapters) {
            const completed = progress.completed.includes(ch.id);
            const unlocked = ch.id === 1 || progress.completed.includes(ch.id - 1);
            const current = !completed && unlocked;
            let badge = '', bo = '0.4', bc = '#555', ca = '';
            if (completed) { badge = '<span style="color:#4caf50;">✅</span>'; bo = '0.3'; bc = '#4caf50'; }
            else if (current) { badge = '<span style="color:#ffd700;">⚔️</span>'; bo = '0.6'; bc = '#c9a040'; ca = `onclick="SherwoodUI._startQuestChapter(${ch.id})" style="cursor:pointer;"`; }
            else { badge = '<span style="color:#f44336;">🔒</span>'; bo = '0.2'; bc = '#f44336'; }
            h += `<div ${ca} style="background:url('assets/backgrounds/skill_page.jpeg') center/cover no-repeat;border:2px solid ${bc};border-radius:10px;padding:12px;margin-bottom:8px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,${bo});z-index:0;"></div><div style="position:relative;z-index:1;display:flex;align-items:center;gap:10px;"><div style="width:50px;height:50px;border-radius:8px;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:1.3em;">${badge}</div><div style="flex:1;"><div style="color:#e0c080;font-weight:bold;">Глава ${ch.id}: ${ch.name}</div><div style="color:#aaa;font-size:0.7em;">${ch.description}</div><div style="display:flex;justify-content:space-between;margin-top:4px;"><span style="color:#aaa;font-size:0.7em;">👹 ${ch.stages} эт.</span><span style="color:#ff9800;font-size:0.7em;">⚡${ch.energyCost}</span></div></div></div></div>`;
        }
        const c = `<div style="text-align:center;margin-bottom:12px;"><span style="color:#ff9800;">⚡ ${energy.current}/${energy.max}</span></div>${h}<div id="quest-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>`;
        this._openScreen('📜 Квесты', 'quests', c);
    },

    _startQuestChapter(chId) {
        const r = Sherwood.Quests?.startChapter(chId); const info = document.getElementById('quest-info');
        if (!r?.success) { if (info) info.textContent = '❌ ' + (r?.reason || 'Ошибка'); return; }
        this._renderQuestBattle();
    },

    _renderQuestBattle() {
        const b = Sherwood.Quests?.getCurrentBattle(); if (!b) { this.quest(); return; }
        const e = b.enemy; const php = Math.round((Sherwood.getPlayer().stats.hp / Sherwood.getPlayer().stats.maxHp) * 100);
        const ehp = Math.round(((e.hp||e.maxHp||100) / (e.maxHp||100)) * 100);
        const h = `<div style="text-align:center;"><div style="color:#aaa;font-size:0.8em;">Глава ${b.chapter.id} — Этап ${b.stage}/${b.totalStages}</div><div style="margin:12px 0;"><img src="assets/all_beasts/${e.image}" style="width:100px;height:100px;object-fit:contain;border:2px solid #f44336;border-radius:12px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="color:#f44336;font-weight:bold;">${e.name}${e.isBoss?' 👑':''}</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#f44336;height:100%;width:${ehp}%;"></div></div><div style="color:#aaa;font-size:0.7em;">❤️ ${Math.max(0,e.hp||e.maxHp)}</div></div><div style="color:#ffd700;">⚔️ VS ⚔️</div><div style="margin:12px 0;"><div style="color:#4caf50;">❤️ ${Sherwood.getPlayer().stats.hp}/${Sherwood.getPlayer().stats.maxHp}</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#4caf50;height:100%;width:${php}%;"></div></div></div><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;"><button onclick="SherwoodUI._questAttack()" style="background:#c9a040;border:none;border-radius:8px;padding:10px 24px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">⚔️ Атака</button><button onclick="SherwoodUI._questSkill('power_shot')" style="background:#ff5722;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">💥 Мощный</button><button onclick="SherwoodUI._questSkill('triple_shot')" style="background:#2196f3;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">🏹 Тройной</button></div><button onclick="SherwoodUI._questFlee()" style="margin-top:10px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Сбежать</button><div id="battle-log" style="text-align:center;color:#aaa;font-size:0.8em;margin-top:8px;min-height:20px;"></div></div>`;
        this._openScreen('⚔️ Битва', 'quests', h);
    },

    _questAttack() { this._handleQuestResult(Sherwood.Quests?.playerAttack()); },
    _questSkill(sid) { this._handleQuestResult(Sherwood.Quests?.playerSkill(sid)); },

    _handleQuestResult(r) {
        if (!r) return; const log = document.getElementById('battle-log');
        if (r.enemyDead) {
            const b = Sherwood.Quests?.getCurrentBattle(); if (b?.enemy?.image && Sherwood.Bestiary) Sherwood.Bestiary.registerKill(b.enemy.image);
            if (log) log.textContent = '✅ Враг повержен!'; this.updateDisplay();
            if (r.chapterComplete) { setTimeout(() => { const info = document.getElementById('quest-info'); if (info) info.innerHTML = '🎉 Глава пройдена!'; this.updateDisplay(); this.quest(); }, 1500); }
            else setTimeout(() => this._renderQuestBattle(), 1000);
        } else if (r.playerDead) { if (log) log.textContent = '💀 Поражение...'; Sherwood.Quests?.fleeBattle(); setTimeout(() => this.quest(), 1500); }
        else { if (log) log.textContent = `-${r.damage} | Враг: -${r.enemyDamage||0}`; this._renderQuestBattle(); }
    },

    _questFlee() { Sherwood.Quests?.fleeBattle(); this.quest(); },

    // ========== ТАВЕРНА ==========
    tavern() {
        this._playSound('click'); this._playMusic('tavern_ambient');
        if (!Sherwood.Tavern) { this._showPlaceholder('🍺 Таверна', 'tavern'); return; }
        const quests = Sherwood.Tavern.getDailyQuests(); const active = Sherwood.Tavern.getCurrentQuest(); const done = Sherwood.Tavern.getDailyQuestsDone();
        let h = '';
        if (active) {
            h += `<div style="background:rgba(0,0,0,0.6);border:2px solid #c9a040;border-radius:10px;padding:14px;margin-bottom:12px;"><div style="color:#ffd700;font-weight:bold;">⚔️ Активный квест</div><div style="color:#fff;">${active.name}</div><div style="color:#aaa;font-size:0.8em;">${active.desc}</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:8px 0;overflow:hidden;"><div style="background:#c9a040;height:100%;width:${Math.round((active.progress||0)/active.target*100)}%;"></div></div><div style="color:#aaa;font-size:0.7em;">${active.progress||0}/${active.target}</div><div style="display:flex;gap:8px;margin-top:8px;"><button onclick="SherwoodUI._tavernAuto()" style="background:#c9a040;border:none;border-radius:6px;padding:8px 16px;color:#000;cursor:pointer;font-family:'Georgia',serif;">⚡ Автобой</button><button onclick="SherwoodUI._tavernCancel()" style="background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:8px 12px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;">Отменить</button></div></div>`;
        }
        for (let i = 0; i < quests.length; i++) {
            const q = quests[i]; if (q.completed) continue;
            h += `<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;"><div><div style="color:#e0c080;">${q.name}</div><div style="color:#aaa;font-size:0.7em;">${q.desc} (${q.target})</div><div style="color:#ffd700;font-size:0.6em;">🏆 +${q.reward.exp}XP +${q.reward.gold}🪙</div></div><button onclick="SherwoodUI._tavernStart(${i})" style="background:#c9a040;border:none;border-radius:4px;padding:6px 12px;color:#000;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">Взять</button></div>`;
        }
        const c = `<div style="color:#aaa;font-size:0.8em;margin-bottom:8px;">📋 Доступно: ${10-done}/10 | ✅ Всего: ${Sherwood.Tavern.getCompletedCount()}</div>${h||'<div style="color:#aaa;text-align:center;">Всё выполнено!</div>'}<div id="tavern-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>`;
        this._openScreen('🍺 Таверна', 'tavern', c);
    },

    _tavernStart(i) { const r = Sherwood.Tavern?.startQuest(i); if (!r?.success) { const log = document.getElementById('tavern-log'); if (log) log.textContent = '❌ '+r?.reason; return; } this.tavern(); },
    _tavernAuto() { const r = Sherwood.Tavern?.autoBattle(); const log = document.getElementById('tavern-log'); if (r?.completed) { if (log) log.textContent = '🎉 Выполнено!'; this.updateDisplay(); } else if (r?.failed) { if (log) log.textContent = '❌ Неудача!'; } else { if (log) log.textContent = '⚔️ ' + (r?.progress||0) + '/' + (r?.target||0); } setTimeout(() => this.tavern(), 800); },
    _tavernCancel() { Sherwood.Tavern?.cancelQuest(); this.tavern(); },

    // ========== ПОРТАЛЫ ==========
    portal() {
        this._playSound('click');
        if (!Sherwood.Portal) { this._showPlaceholder('🌀 Порталы', 'portal'); return; }
        if (Sherwood.Portal.isInPortal()) { this._showPortalBattle(); return; }
        const portals = Sherwood.Portal.getAllPortals(); const player = Sherwood.getPlayer();
        let h = '';
        for (const p of portals) {
            const check = Sherwood.Portal.canEnter(p.id); const unlocked = Sherwood.Portal.isPortalUnlocked(p.id); const completed = player?.portal?.completed?.includes(p.id);
            let badge = '', bo = '0.4', bc = '#555', ca = '';
            if (completed) { badge = '<span style="color:#4caf50;">✅</span>'; bo = '0.3'; bc = '#4caf50'; }
            else if (check.can) { badge = '<span style="color:#ffd700;">⚔️</span>'; bo = '0.6'; bc = '#c9a040'; ca = `onclick="SherwoodUI._enterPortal(${p.id})" style="cursor:pointer;"`; }
            else if (!unlocked) { badge = '<span style="color:#f44336;">🔒</span>'; bo = '0.2'; bc = '#f44336'; }
            else { badge = `<span style="color:#ff9800;">⚠️ АТК ${p.statRequirement.attack}+ ЗЩТ ${p.statRequirement.defense}+</span>`; bo = '0.4'; bc = '#ff9800'; }
            h += `<div ${ca} style="background:url('${p.bg}') center/cover no-repeat;border:2px solid ${bc};border-radius:10px;padding:12px;margin-bottom:8px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,${bo});z-index:0;"></div><div style="position:relative;z-index:1;display:flex;align-items:center;gap:10px;"><div style="font-size:2em;">${p.icon}</div><div style="flex:1;"><div style="color:#e0c080;font-weight:bold;">${p.name}</div><div style="color:#aaa;font-size:0.7em;">${p.enemies.length} врагов</div>${badge}</div></div></div>`;
        }
        this._openScreen('🌀 Порталы', 'portal', h||'<div style="color:#aaa;text-align:center;">Нет порталов</div>');
    },

    _enterPortal(id) { const r = Sherwood.Portal?.enterPortal(id); if (!r?.success) { const log = document.getElementById('portal-log'); if (log) log.textContent = '❌ '+r?.reason; return; } this._playSound('dungeon_enter'); this._showPortalBattle(); },

    _showPortalBattle() {
        const b = Sherwood.Portal?.getCurrentBattle(); if (!b) { this.portal(); return; }
        const e = b.enemy; const hp = Math.round(((e.hp||e.maxHp)/(e.maxHp||1))*100);
        const tm = Math.floor(b.timeRemaining/60); const ts = b.timeRemaining%60;
        const h = `<div style="text-align:center;"><div style="color:#aaa;font-size:0.7em;">⏱️ ${tm}:${ts.toString().padStart(2,'0')} | 💀 ${b.deathCount}</div><div style="color:#e0c080;">${b.portal.name} — ${b.level}/${b.totalLevels}</div><div style="margin:12px 0;"><img src="assets/portal_beasts/${e.image}" style="width:100px;height:100px;object-fit:contain;border:2px solid #f44336;border-radius:12px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="color:#f44336;font-weight:bold;">${e.name}${e.isBoss?' 👑':''}</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#f44336;height:100%;width:${hp}%;"></div></div><div style="color:#aaa;font-size:0.7em;">❤️ ${Math.max(0,e.hp||e.maxHp)}/${e.maxHp||'?'}</div></div><div style="color:#ffd700;">⚔️ VS ⚔️</div><div style="margin:8px 0;color:#4caf50;">❤️ ${Sherwood.getPlayer().stats.hp}/${Sherwood.getPlayer().stats.maxHp}</div><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;"><button onclick="SherwoodUI._portalAttack()" style="background:#c9a040;border:none;border-radius:8px;padding:10px 24px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">⚔️ Атака</button><button onclick="SherwoodUI._portalSkill('power_shot')" style="background:#ff5722;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">💥 Мощный</button><button onclick="SherwoodUI._portalSkill('triple_shot')" style="background:#2196f3;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">🏹 Тройной</button></div><button onclick="SherwoodUI._portalFlee()" style="margin-top:10px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Бежать</button><div id="portal-log" style="text-align:center;color:#aaa;font-size:0.75em;margin-top:8px;min-height:18px;"></div></div>`;
        this._openScreen('🌀 Портал', 'portal', h);
    },

    _portalAttack() { this._handlePortalResult(Sherwood.Portal?.portalAttack()); },
    _portalSkill(sid) { this._handlePortalResult(Sherwood.Portal?.portalSkill(sid)); },

    _handlePortalResult(r) {
        if (!r) return; const log = document.getElementById('portal-log');
        if (r.portalComplete) { if (log) log.textContent = '🎉 Портал пройден!'; this.updateDisplay(); setTimeout(() => this.portal(), 2000); return; }
        if (r.portalFailed) { if (log) log.textContent = '💀 Провал!'; setTimeout(() => this.portal(), 2000); return; }
        if (r.dead && r.resurrected) { if (log) log.textContent = `💀 Смерть #${r.deathCount}! Выкуп: ${r.cost.cost} ${r.cost.currency}`; this.updateDisplay(); this._showPortalBattle(); return; }
        if (r.enemyDead) { if (log) log.textContent = '✅ Враг повержен!'; this.updateDisplay(); if (r.nextEnemy) setTimeout(() => this._showPortalBattle(), 1000); }
        else { if (log) log.textContent = `-${r.damage} | Враг: -${r.enemyDamage||0}`; this.updateDisplay(); this._showPortalBattle(); }
    },

    _portalFlee() { Sherwood.Portal?.fleePortal(); this.portal(); },

    // ========== РЕЙД ==========
    raid() {
        this._playSound('click');
        if (!Sherwood.Raid) { this._showPlaceholder('⚔️ Рейд', 'raid'); return; }
        if (Sherwood.Raid.isRaidActive()) { this._showRaidBattle(); return; }
        const raids = Sherwood.Raid.getAvailableRaids(); const check = Sherwood.Raid.canJoinRaid();
        let h = '';
        for (let i = 0; i < raids.length; i++) {
            const r = raids[i];
            h += `<div style="background:rgba(0,0,0,0.5);border:2px solid ${check.can?'#c9a040':'#f44336'};border-radius:10px;padding:14px;margin-bottom:8px;text-align:center;"><div style="color:#e0c080;font-weight:bold;">${r.name}</div><div style="color:#aaa;font-size:0.8em;">❤️ ${r.maxHp} | ⚔️ ${r.attack}</div><div style="color:#aaa;font-size:0.7em;">3 этапа | До 10 чел.</div>${check.can ? `<button onclick="SherwoodUI._startRaid(${i})" style="margin-top:8px;background:#c9a040;border:none;border-radius:6px;padding:8px 20px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">В бой!</button>` : `<div style="color:#f44336;font-size:0.7em;margin-top:8px;">${check.reason}</div>`}</div>`;
        }
        this._openScreen('⚔️ Рейд', 'raid', h||'<div style="color:#aaa;text-align:center;">Нет рейдов</div>');
    },

    _startRaid(i) { const r = Sherwood.Raid?.startRaid(i); if (!r?.success) return; this._playSound('dungeon_enter'); this._showRaidBattle(); },

    _showRaidBattle() {
        const s = Sherwood.Raid?.getRaidStatus(); if (!s) { this.raid(); return; }
        const stage = s.stage; const boss = s.boss;
        let enemiesHtml = '';
        for (const e of stage.enemies) {
            const ehp = Math.round(((e.hp||e.maxHp||100)/(e.maxHp||100))*100);
            enemiesHtml += `<div style="margin:8px 0;"><img src="assets/all_beasts/${e.image}" style="width:60px;height:60px;object-fit:contain;border:1px solid #f44336;border-radius:8px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="color:#f44336;font-size:0.7em;">${e.name}</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;margin:2px 15%;overflow:hidden;"><div style="background:#f44336;height:100%;width:${ehp}%;"></div></div></div>`;
        }
        const h = `<div style="text-align:center;"><div style="color:#ff6a00;">${boss.name} — Этап ${s.stageIndex}/${s.totalStages}</div><div style="color:#aaa;font-size:0.7em;">Участников: ${s.participants.join(', ')}</div>${enemiesHtml}<div style="color:#4caf50;margin-top:8px;">❤️ ${Sherwood.getPlayer().stats.hp}</div><button onclick="SherwoodUI._raidAttack()" style="margin-top:12px;background:#c9a040;border:none;border-radius:8px;padding:10px 30px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">⚔️ Атака</button><button onclick="SherwoodUI._raidFlee()" style="margin-top:8px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Выйти</button><div id="raid-log" style="text-align:center;color:#aaa;font-size:0.75em;margin-top:8px;min-height:18px;"></div></div>`;
        this._openScreen('⚔️ Рейд', 'raid', h);
    },

    _raidAttack() { const r = Sherwood.Raid?.raidAttack(); const log = document.getElementById('raid-log'); if (r?.raidComplete) { if (log) log.textContent = '🎉 Рейд пройден!'; this.updateDisplay(); setTimeout(() => this.raid(), 2000); } else if (r?.stageComplete) { if (log) log.textContent = '✅ Этап пройден!'; setTimeout(() => this._showRaidBattle(), 1000); } else if (r?.playerDead) { if (log) log.textContent = '💀 Вы погибли!'; setTimeout(() => this.raid(), 1500); } else { if (log) log.textContent = `-${r.damage} | Враг: -${r.bossDamage||0}`; this.updateDisplay(); this._showRaidBattle(); } },
    _raidFlee() { Sherwood.Raid?.fleeRaid(); this.raid(); },

    // ========== АРЕНА ==========
    arena() {
        this._playSound('click');
        if (!Sherwood.Arena) { this._showPlaceholder('🏟️ Арена', 'arena'); return; }
        if (Sherwood.Arena.isInMatch()) { this._showArenaMatch(); return; }
        const opps = Sherwood.Arena.getOpponents(); const stats = Sherwood.Arena.getStats();
        let h = `<div style="text-align:center;margin-bottom:8px;color:#e0c080;">🏆 ${stats.rank} | 🏅 ${stats.wins} | 💀 ${stats.losses}</div>`;
        for (const o of opps) {
            h += `<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;"><img src="${o.skin}" style="width:40px;height:40px;object-fit:contain;border-radius:50%;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="flex:1;"><div style="color:#fff;">${o.name}</div><div style="color:#aaa;font-size:0.7em;">⚔️${o.stats.attack} 🛡️${o.stats.defense} ❤️${o.stats.maxHp}</div></div><button onclick="SherwoodUI._startArenaMatch(${o.id})" style="background:#c9a040;border:none;border-radius:4px;padding:6px 12px;color:#000;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">Бой</button></div>`;
        }
        h += `<button onclick="SherwoodUI._refreshArena()" style="width:100%;margin-top:8px;background:rgba(255,255,255,0.1);border:1px solid #666;border-radius:6px;padding:8px;color:#fff;cursor:pointer;font-family:'Georgia',serif;">🔄 Обновить</button>`;
        this._openScreen('🏟️ Арена', 'arena', h);
    },

    _startArenaMatch(i) { const r = Sherwood.Arena?.startMatch(i); if (!r?.success) return; this._showArenaMatch(); },
    _refreshArena() { Sherwood.Arena?.refreshOpponents(); this.arena(); },

    _showArenaMatch() {
        const m = Sherwood.Arena?.getCurrentMatch(); if (!m) { this.arena(); return; }
        const o = m.opponent; const p = m.player;
        const ohp = Math.round((o.stats.hp/o.stats.maxHp)*100); const php = Math.round((p.stats.hp/p.stats.maxHp)*100);
        const h = `<div style="text-align:center;"><div style="color:#ffd700;">⚔️ Арена ⚔️</div><div style="display:flex;justify-content:space-around;align-items:center;margin:16px 0;"><div style="text-align:center;"><img src="${o.skin}" style="width:60px;height:60px;object-fit:contain;border:2px solid #f44336;border-radius:50%;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="color:#f44336;">${o.name}</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#f44336;height:100%;width:${ohp}%;"></div></div><div style="color:#aaa;font-size:0.6em;">${Math.max(0,o.stats.hp)}/${o.stats.maxHp}</div></div><div style="font-size:1.5em;">VS</div><div style="text-align:center;"><img src="assets/hero_skins/${Sherwood.Forge?.getActiveSkin?.()||'skin_1_basic'}.png" style="width:60px;height:60px;object-fit:contain;border:2px solid #4caf50;border-radius:50%;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="color:#4caf50;">Вы</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#4caf50;height:100%;width:${php}%;"></div></div><div style="color:#aaa;font-size:0.6em;">${p.stats.hp}/${p.stats.maxHp}</div></div></div><button onclick="SherwoodUI._arenaAttack()" style="width:100%;background:#c9a040;border:none;border-radius:8px;padding:12px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;margin-bottom:8px;">⚔️ Атака</button><button onclick="SherwoodUI._arenaFlee()" style="width:100%;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:8px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Сдаться</button><div id="arena-log" style="text-align:center;color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>`;
        this._openScreen('🏟️ Арена', 'arena', h);
    },

    _arenaAttack() { const r = Sherwood.Arena?.arenaAttack(); const log = document.getElementById('arena-log'); if (r?.win) { if (log) log.textContent = `🏆 Победа! +${r.rewards?.exp||0}XP`; this.updateDisplay(); setTimeout(() => this.arena(), 1500); } else if (r?.win === false) { if (log) log.textContent = '💀 Поражение'; setTimeout(() => this.arena(), 1500); } else { if (log) log.textContent = `-${r.playerDamage} | Враг: -${r.opponentDamage||0}`; this._showArenaMatch(); } },
    _arenaFlee() { Sherwood.Arena?.fleeMatch(); this.arena(); },

    // ========== РЫНОК ==========
    market() {
        this._playSound('click');
        if (!Sherwood.BlackMarket) { this._showPlaceholder('💰 Рынок', 'market'); return; }
        const items = Sherwood.BlackMarket.getShopItems();
        let h = '';
        for (const item of items) {
            h += `<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;"><img src="${item.icon}" style="width:44px;height:44px;object-fit:contain;border-radius:4px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="flex:1;"><div style="color:#e0c080;">${item.name}</div><div style="color:#aaa;font-size:0.7em;">${item.type==='consumable'?'Расходник':item.type==='resource'?'Ресурс':'Экипировка'}</div></div><div style="text-align:right;"><div style="color:${item.currency==='gold'?'#ffd700':'#c0c0c0'};">${item.price} ${item.currency==='gold'?'🪙':'⚪'}</div><button onclick="SherwoodUI._buyItem(${item.shopIndex})" style="margin-top:4px;background:#c9a040;border:none;border-radius:4px;padding:4px 10px;color:#000;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">Купить</button></div></div>`;
        }
        const c = h || '<div style="color:#aaa;text-align:center;">Товаров нет</div>';
        this._openScreen('💰 Рынок', 'market', c + '<div id="market-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>');
    },

    _buyItem(i) { const r = Sherwood.BlackMarket?.buyItem(i); const log = document.getElementById('market-log'); if (r?.success) { if (log) log.textContent = '✅ Куплено!'; this.updateDisplay(); } else { if (log) log.textContent = '❌ ' + (r?.reason||'Ошибка'); } setTimeout(() => this.market(), 800); },

    // ========== ЧАТ ==========
    chat() {
        this._playSound('click');
        if (!Sherwood.Chat) { this._showPlaceholder('💬 Чат', 'chat'); return; }
        const msgs = Sherwood.Chat.getRecentMessages(50);
        let h = '';
        for (const m of msgs) {
            if (m.isSystem) h += `<div style="color:#888;font-size:0.75em;text-align:center;margin:4px 0;">[${m.time}] ${m.text}</div>`;
            else { const me = m.sender === Sherwood.Chat.getUsername(); h += `<div style="margin-bottom:6px;display:flex;flex-direction:column;align-items:${me?'flex-end':'flex-start'};"><div style="color:#c9a040;font-size:0.65em;">${m.sender} <span style="color:#666;">${m.time}</span></div><div style="background:${me?'rgba(201,168,76,0.2)':'rgba(255,255,255,0.08)'};border-radius:8px;padding:6px 10px;color:#ddd;font-size:0.8em;max-width:80%;word-break:break-word;">${m.text}</div></div>`; }
        }
        const c = `<div style="display:flex;flex-direction:column;height:100%;"><div id="chat-msgs" style="flex:1;background:rgba(0,0,0,0.5);border-radius:8px;padding:12px;margin-bottom:8px;overflow-y:auto;color:#ccc;font-size:0.85em;min-height:300px;">${h||'<div style="color:#666;text-align:center;">Пусто</div>'}</div><div style="display:flex;gap:8px;"><input id="chat-input" placeholder="Сообщение..." style="flex:1;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:8px;padding:10px;color:#fff;font-family:'Georgia',serif;font-size:0.85em;" onkeydown="if(event.key==='Enter')SherwoodUI._sendChat()"><button onclick="SherwoodUI._sendChat()" style="background:transparent;border:none;cursor:pointer;padding:0;width:44px;height:44px;"><img src="assets/all_buttons/send_text.png" style="width:100%;height:100%;object-fit:contain;"></button></div></div>`;
        this._openScreen('💬 Чат', 'chat', c);
        setTimeout(() => { const el = document.getElementById('chat-msgs'); if (el) el.scrollTop = el.scrollHeight; }, 100);
    },

    _sendChat() { const inp = document.getElementById('chat-input'); if (!inp) return; const t = inp.value.trim(); if (!t) return; inp.value = ''; Sherwood.Chat?.sendMessage(t); this.chat(); },

        // ========== РЕЙД ==========
    raid() {
        this._playSound('click');
        if (!Sherwood.Raid) { this._showPlaceholder('⚔️ Рейд', 'raid'); return; }
        if (Sherwood.Raid.isRaidActive()) { this._showRaidBattle(); return; }
        const raids = Sherwood.Raid.getAvailableRaids(); const check = Sherwood.Raid.canJoinRaid();
        let h = '';
        for (let i = 0; i < raids.length; i++) {
            const r = raids[i];
            h += `<div style="background:rgba(0,0,0,0.5);border:2px solid ${check.can?'#c9a040':'#f44336'};border-radius:10px;padding:14px;margin-bottom:8px;text-align:center;"><div style="color:#e0c080;font-weight:bold;">${r.name}</div><div style="color:#aaa;font-size:0.8em;">❤️ ${r.maxHp} | ⚔️ ${r.attack}</div><div style="color:#aaa;font-size:0.7em;">3 этапа | До 10 чел.</div>${check.can ? `<button onclick="SherwoodUI._startRaid(${i})" style="margin-top:8px;background:#c9a040;border:none;border-radius:6px;padding:8px 20px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">В бой!</button>` : `<div style="color:#f44336;font-size:0.7em;margin-top:8px;">${check.reason}</div>`}</div>`;
        }
        this._openScreen('⚔️ Рейд', 'raid', h||'<div style="color:#aaa;text-align:center;">Нет рейдов</div>');
    },
    _startRaid(i) { const r = Sherwood.Raid?.startRaid(i); if (!r?.success) return; this._playSound('dungeon_enter'); this._showRaidBattle(); },
    _showRaidBattle() {
        const s = Sherwood.Raid?.getRaidStatus(); if (!s) { this.raid(); return; }
        const stage = s.stage; const boss = s.boss;
        let eh = '';
        for (const e of stage.enemies) {
            const ehp = Math.round(((e.hp||e.maxHp||100)/(e.maxHp||100))*100);
            eh += `<div style="margin:8px 0;"><img src="assets/all_beasts/${e.image}" style="width:60px;height:60px;object-fit:contain;border:1px solid #f44336;border-radius:8px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="color:#f44336;font-size:0.7em;">${e.name}</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;margin:2px 15%;overflow:hidden;"><div style="background:#f44336;height:100%;width:${ehp}%;"></div></div></div>`;
        }
        const h = `<div style="text-align:center;"><div style="color:#ff6a00;">${boss.name} — Этап ${s.stageIndex}/${s.totalStages}</div><div style="color:#aaa;font-size:0.7em;">Участников: ${s.participants.join(', ')}</div>${eh}<div style="color:#4caf50;margin-top:8px;">❤️ ${Sherwood.getPlayer().stats.hp}</div><button onclick="SherwoodUI._raidAttack()" style="margin-top:12px;background:#c9a040;border:none;border-radius:8px;padding:10px 30px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">⚔️ Атака</button><button onclick="SherwoodUI._raidFlee()" style="margin-top:8px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Выйти</button><div id="raid-log" style="text-align:center;color:#aaa;font-size:0.75em;margin-top:8px;min-height:18px;"></div></div>`;
        this._openScreen('⚔️ Рейд', 'raid', h);
    },
    _raidAttack() { const r = Sherwood.Raid?.raidAttack(); const log = document.getElementById('raid-log'); if (r?.raidComplete) { if (log) log.textContent = '🎉 Рейд пройден!'; this.updateDisplay(); setTimeout(() => this.raid(), 2000); } else if (r?.stageComplete) { if (log) log.textContent = '✅ Этап пройден!'; setTimeout(() => this._showRaidBattle(), 1000); } else if (r?.playerDead) { if (log) log.textContent = '💀 Вы погибли!'; setTimeout(() => this.raid(), 1500); } else { if (log) log.textContent = `-${r.damage} | Враг: -${r.bossDamage||0}`; this.updateDisplay(); this._showRaidBattle(); } },
    _raidFlee() { Sherwood.Raid?.fleeRaid(); this.raid(); },

    // ========== ПОРТАЛЫ ==========
    portal() {
        this._playSound('click');
        if (!Sherwood.Portal) { this._showPlaceholder('🌀 Порталы', 'portal'); return; }
        if (Sherwood.Portal.isInPortal()) { this._showPortalBattle(); return; }
        const portals = Sherwood.Portal.getAllPortals(); const player = Sherwood.getPlayer();
        let h = '';
        for (const p of portals) {
            const check = Sherwood.Portal.canEnter(p.id); const unlocked = Sherwood.Portal.isPortalUnlocked(p.id); const completed = player?.portal?.completed?.includes(p.id);
            let badge = '', bo = '0.4', bc = '#555', ca = '';
            if (completed) { badge = '<span style="color:#4caf50;">✅</span>'; bo = '0.3'; bc = '#4caf50'; }
            else if (check.can) { badge = '<span style="color:#ffd700;">⚔️</span>'; bo = '0.6'; bc = '#c9a040'; ca = `onclick="SherwoodUI._enterPortal(${p.id})" style="cursor:pointer;"`; }
            else if (!unlocked) { badge = '<span style="color:#f44336;">🔒</span>'; bo = '0.2'; bc = '#f44336'; }
            else { badge = `<span style="color:#ff9800;">⚠️ АТК ${p.statRequirement.attack}+ ЗЩТ ${p.statRequirement.defense}+</span>`; bo = '0.4'; bc = '#ff9800'; }
            h += `<div ${ca} style="background:url('${p.bg}') center/cover no-repeat;border:2px solid ${bc};border-radius:10px;padding:12px;margin-bottom:8px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,${bo});z-index:0;"></div><div style="position:relative;z-index:1;display:flex;align-items:center;gap:10px;"><div style="font-size:2em;">${p.icon}</div><div style="flex:1;"><div style="color:#e0c080;font-weight:bold;">${p.name}</div><div style="color:#aaa;font-size:0.7em;">${p.enemies.length} врагов</div>${badge}</div></div></div>`;
        }
        this._openScreen('🌀 Порталы', 'portal', h||'<div style="color:#aaa;text-align:center;">Нет порталов</div>');
    },
    _enterPortal(id) { const r = Sherwood.Portal?.enterPortal(id); if (!r?.success) { const log = document.getElementById('portal-log'); if (log) log.textContent = '❌ '+r?.reason; return; } this._playSound('dungeon_enter'); this._showPortalBattle(); },
    _showPortalBattle() {
        const b = Sherwood.Portal?.getCurrentBattle(); if (!b) { this.portal(); return; }
        const e = b.enemy; const hp = Math.round(((e.hp||e.maxHp)/(e.maxHp||1))*100);
        const tm = Math.floor(b.timeRemaining/60); const ts = b.timeRemaining%60;
        const h = `<div style="text-align:center;"><div style="color:#aaa;font-size:0.7em;">⏱️ ${tm}:${ts.toString().padStart(2,'0')} | 💀 ${b.deathCount}</div><div style="color:#e0c080;">${b.portal.name} — ${b.level}/${b.totalLevels}</div><div style="margin:12px 0;"><img src="assets/portal_beasts/${e.image}" style="width:100px;height:100px;object-fit:contain;border:2px solid #f44336;border-radius:12px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="color:#f44336;font-weight:bold;">${e.name}${e.isBoss?' 👑':''}</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#f44336;height:100%;width:${hp}%;"></div></div><div style="color:#aaa;font-size:0.7em;">❤️ ${Math.max(0,e.hp||e.maxHp)}/${e.maxHp||'?'}</div></div><div style="color:#ffd700;">⚔️ VS ⚔️</div><div style="margin:8px 0;color:#4caf50;">❤️ ${Sherwood.getPlayer().stats.hp}/${Sherwood.getPlayer().stats.maxHp}</div><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;"><button onclick="SherwoodUI._portalAttack()" style="background:#c9a040;border:none;border-radius:8px;padding:10px 24px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;">⚔️ Атака</button><button onclick="SherwoodUI._portalSkill('power_shot')" style="background:#ff5722;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">💥 Мощный</button><button onclick="SherwoodUI._portalSkill('triple_shot')" style="background:#2196f3;border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-family:'Georgia',serif;font-size:0.8em;">🏹 Тройной</button></div><button onclick="SherwoodUI._portalFlee()" style="margin-top:10px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Бежать</button><div id="portal-log" style="text-align:center;color:#aaa;font-size:0.75em;margin-top:8px;min-height:18px;"></div></div>`;
        this._openScreen('🌀 Портал', 'portal', h);
    },
    _portalAttack() { this._handlePortalResult(Sherwood.Portal?.portalAttack()); },
    _portalSkill(sid) { this._handlePortalResult(Sherwood.Portal?.portalSkill(sid)); },
    _handlePortalResult(r) {
        if (!r) return; const log = document.getElementById('portal-log');
        if (r.portalComplete) { if (log) log.textContent = '🎉 Портал пройден!'; this.updateDisplay(); setTimeout(() => this.portal(), 2000); return; }
        if (r.portalFailed) { if (log) log.textContent = '💀 Провал!'; setTimeout(() => this.portal(), 2000); return; }
        if (r.dead && r.resurrected) { if (log) log.textContent = `💀 Смерть #${r.deathCount}! Выкуп: ${r.cost.cost} ${r.cost.currency}`; this.updateDisplay(); this._showPortalBattle(); return; }
        if (r.enemyDead) { if (log) log.textContent = '✅ Враг повержен!'; this.updateDisplay(); if (r.nextEnemy) setTimeout(() => this._showPortalBattle(), 1000); }
        else { if (log) log.textContent = `-${r.damage} | Враг: -${r.enemyDamage||0}`; this.updateDisplay(); this._showPortalBattle(); }
    },
    _portalFlee() { Sherwood.Portal?.fleePortal(); this.portal(); },

    // ========== АРЕНА ==========
    arena() {
        this._playSound('click');
        if (!Sherwood.Arena) { this._showPlaceholder('🏟️ Арена', 'arena'); return; }
        if (Sherwood.Arena.isInMatch()) { this._showArenaMatch(); return; }
        const opps = Sherwood.Arena.getOpponents(); const stats = Sherwood.Arena.getStats();
        let h = `<div style="text-align:center;margin-bottom:8px;color:#e0c080;">🏆 ${stats.rank} | 🏅 ${stats.wins} | 💀 ${stats.losses}</div>`;
        for (const o of opps) {
            h += `<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;"><img src="${o.skin}" style="width:40px;height:40px;object-fit:contain;border-radius:50%;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="flex:1;"><div style="color:#fff;">${o.name}</div><div style="color:#aaa;font-size:0.7em;">⚔️${o.stats.attack} 🛡️${o.stats.defense} ❤️${o.stats.maxHp}</div></div><button onclick="SherwoodUI._startArenaMatch(${o.id})" style="background:#c9a040;border:none;border-radius:4px;padding:6px 12px;color:#000;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">Бой</button></div>`;
        }
        h += `<button onclick="SherwoodUI._refreshArena()" style="width:100%;margin-top:8px;background:rgba(255,255,255,0.1);border:1px solid #666;border-radius:6px;padding:8px;color:#fff;cursor:pointer;font-family:'Georgia',serif;">🔄 Обновить</button>`;
        this._openScreen('🏟️ Арена', 'arena', h);
    },
    _startArenaMatch(i) { const r = Sherwood.Arena?.startMatch(i); if (!r?.success) return; this._showArenaMatch(); },
    _refreshArena() { Sherwood.Arena?.refreshOpponents(); this.arena(); },
    _showArenaMatch() {
        const m = Sherwood.Arena?.getCurrentMatch(); if (!m) { this.arena(); return; }
        const o = m.opponent; const p = m.player;
        const ohp = Math.round((o.stats.hp/o.stats.maxHp)*100); const php = Math.round((p.stats.hp/p.stats.maxHp)*100);
        const h = `<div style="text-align:center;"><div style="color:#ffd700;">⚔️ Арена ⚔️</div><div style="display:flex;justify-content:space-around;align-items:center;margin:16px 0;"><div style="text-align:center;"><img src="${o.skin}" style="width:60px;height:60px;object-fit:contain;border:2px solid #f44336;border-radius:50%;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="color:#f44336;">${o.name}</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#f44336;height:100%;width:${ohp}%;"></div></div><div style="color:#aaa;font-size:0.6em;">${Math.max(0,o.stats.hp)}/${o.stats.maxHp}</div></div><div style="font-size:1.5em;">VS</div><div style="text-align:center;"><img src="assets/hero_skins/${Sherwood.Forge?.getActiveSkin?.()||'skin_1_basic'}.png" style="width:60px;height:60px;object-fit:contain;border:2px solid #4caf50;border-radius:50%;" onerror="this.src='assets/hero_skins/skin_1_basic.png'"><div style="color:#4caf50;">Вы</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#4caf50;height:100%;width:${php}%;"></div></div><div style="color:#aaa;font-size:0.6em;">${p.stats.hp}/${p.stats.maxHp}</div></div></div><button onclick="SherwoodUI._arenaAttack()" style="width:100%;background:#c9a040;border:none;border-radius:8px;padding:12px;color:#000;font-weight:bold;cursor:pointer;font-family:'Georgia',serif;margin-bottom:8px;">⚔️ Атака</button><button onclick="SherwoodUI._arenaFlee()" style="width:100%;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:8px;color:#f44336;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">🏃 Сдаться</button><div id="arena-log" style="text-align:center;color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>`;
        this._openScreen('🏟️ Арена', 'arena', h);
    },
    _arenaAttack() { const r = Sherwood.Arena?.arenaAttack(); const log = document.getElementById('arena-log'); if (r?.win) { if (log) log.textContent = `🏆 Победа! +${r.rewards?.exp||0}XP`; this.updateDisplay(); setTimeout(() => this.arena(), 1500); } else if (r?.win === false) { if (log) log.textContent = '💀 Поражение'; setTimeout(() => this.arena(), 1500); } else { if (log) log.textContent = `-${r.playerDamage} | Враг: -${r.opponentDamage||0}`; this._showArenaMatch(); } },
    _arenaFlee() { Sherwood.Arena?.fleeMatch(); this.arena(); },

    // ========== РЫНОК ==========
    market() {
        this._playSound('click');
        if (!Sherwood.BlackMarket) { this._showPlaceholder('💰 Рынок', 'market'); return; }
        const items = Sherwood.BlackMarket.getShopItems();
        let h = '';
        for (const item of items) {
            h += `<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;"><img src="${item.icon}" style="width:44px;height:44px;object-fit:contain;border-radius:4px;" onerror="this.src='assets/interface/labyrinth_of_icons.png'"><div style="flex:1;"><div style="color:#e0c080;">${item.name}</div><div style="color:#aaa;font-size:0.7em;">${item.type==='consumable'?'Расходник':item.type==='resource'?'Ресурс':'Экипировка'}</div></div><div style="text-align:right;"><div style="color:${item.currency==='gold'?'#ffd700':'#c0c0c0'};">${item.price} ${item.currency==='gold'?'🪙':'⚪'}</div><button onclick="SherwoodUI._buyItem(${item.shopIndex})" style="margin-top:4px;background:#c9a040;border:none;border-radius:4px;padding:4px 10px;color:#000;cursor:pointer;font-family:'Georgia',serif;font-size:0.7em;">Купить</button></div></div>`;
        }
        this._openScreen('💰 Рынок', 'market', (h||'<div style="color:#aaa;text-align:center;">Товаров нет</div>') + '<div id="market-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>');
    },
    _buyItem(i) { const r = Sherwood.BlackMarket?.buyItem(i); const log = document.getElementById('market-log'); if (r?.success) { if (log) log.textContent = '✅ Куплено!'; this.updateDisplay(); } else { if (log) log.textContent = '❌ ' + (r?.reason||'Ошибка'); } setTimeout(() => this.market(), 800); },

    // ========== ЕЖЕДНЕВНЫЕ ==========
    daily() { this._showPlaceholder('📋 Ежедневные задания', 'daily'); },

    // ========== ПЛЕЙСХОЛДЕР ==========
    _showPlaceholder(title, bgKey, backAction) {
        this._playSound('click');
        this._openScreen(title, bgKey, `<div style="text-align:center;padding:40px 0;"><div style="font-size:3em;margin-bottom:16px;">🏗️</div><div style="font-size:1.2em;color:#e0c080;margin-bottom:8px;">${title}</div><div style="font-size:0.7em;color:#888;">В разработке</div></div>`, backAction);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof SherwoodUI !== 'undefined' && SherwoodUI.init) SherwoodUI.init();
});

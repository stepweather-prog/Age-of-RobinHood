const SherwoodUI = {
    _bg: {
        main: 'assets/backgrounds/homepage_screen.jpeg',
        bag: 'assets/backgrounds/bag.jpeg',
        profile: 'assets/backgrounds/character_page.jpeg',
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
        bestiary: 'assets/backgrounds/character_page.jpeg',
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
        'victory': 'assets/sounds/level_completed.wav',
        'defeat': 'assets/sounds/defeat.wav',
        'levelup': 'assets/sounds/levelup.wav',
        'chest_open': 'assets/sounds/chest_opens.wav',
        'dungeon_enter': 'assets/sounds/subway_1.wav'
    },
    _previousScreen: null,

    init: function() {
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

    _initSounds: function() {
        for (var key in this._audioFiles) {
            var a = new Audio(this._audioFiles[key]);
            a.preload = 'auto';
            a.volume = 0.5;
            this._sounds[key] = a;
        }
    },
    _playSound: function(key) {
        if (!this._soundEnabled) return;
        var s = this._sounds[key];
        if (s) { s.currentTime = 0; s.play().catch(function() {}); }
    },
    _playMusic: function(key) {
        if (!this._musicEnabled) return;
        if (this._currentMusicKey === key && this._currentMusic && !this._currentMusic.paused) return;
        this._stopMusic();
        var m = this._sounds[key];
        if (m) { m.loop = true; m.volume = 0.3; m.currentTime = 0; m.play().catch(function() {}); this._currentMusic = m; this._currentMusicKey = key; }
    },
    _stopMusic: function() {
        if (this._currentMusic) { this._currentMusic.pause(); this._currentMusic.currentTime = 0; this._currentMusic = null; this._currentMusicKey = null; }
    },
    _saveAudioSettings: function() {
        localStorage.setItem('sherwood_audio', JSON.stringify({ sound: this._soundEnabled, music: this._musicEnabled }));
    },
    _loadAudioSettings: function() {
        var s = localStorage.getItem('sherwood_audio');
        if (s) { try { var d = JSON.parse(s); this._soundEnabled = d.sound !== false; this._musicEnabled = d.music !== false; } catch(e) {} }
    },

    bindButtons: function() {
        var self = this;
        document.querySelectorAll('#mainInterface .btn[data-action]').forEach(function(el) {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                var action = el.dataset.action;
                if (action && typeof self[action] === 'function') { self._playSound('click'); self[action](); }
            });
        });
    },
    bindPlayButton: function() {
        var self = this;
        var btn = document.getElementById('playBtn');
        if (btn) {
            btn.addEventListener('click', function() {
                self._playSound('click');
                document.getElementById('loadingScreen').classList.add('hidden');
                document.getElementById('mainInterface').classList.add('active');
                self._playMusic('forest_ambient');
            });
        }
    },

    updateDisplay: function() {
        var p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        if (!p) return;
        var goldEl = document.getElementById('gold-display');
        var silverEl = document.getElementById('silver-display');
        var expEl = document.getElementById('exp-display');
        var expMaxEl = document.getElementById('exp-max-display');
        if (goldEl) goldEl.textContent = this._fmt(p.resources ? p.resources.gold || 0 : 0);
        if (silverEl) silverEl.textContent = this._fmt(p.resources ? p.resources.silver || 0 : 0);
        if (expEl) expEl.textContent = this._fmt(p.exp || 0);
        if (expMaxEl) expMaxEl.textContent = this._fmt(p.expToLevel || 100);
        var ae = document.querySelector('.stat-value.attack');
        var de = document.querySelector('.stat-value.defense');
        var ge = document.querySelector('.stat-value.agility');
        var he = document.querySelector('.stat-value.hp');
        if (ae) ae.textContent = p.stats ? p.stats.attack || 0 : 0;
        if (de) de.textContent = p.stats ? p.stats.defense || 0 : 0;
        if (ge) ge.textContent = p.stats ? p.stats.agility || 0 : 0;
        if (he) he.textContent = p.stats ? p.stats.hp || 0 : 0;
    },
    _fmt: function(n) { return (n === undefined || n === null) ? '0' : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); },

    loadHome: function() {
        if (this._screenLayer) { this._screenLayer.style.display = 'none'; this._screenLayer.innerHTML = ''; }
        this._mainElements.forEach(function(sel) { document.querySelectorAll(sel).forEach(function(el) { el.style.display = ''; }); });
        this.container.style.background = '';
        this._playMusic('forest_ambient');
        this._previousScreen = null;
        this.updateDisplay();
    },

    _openScreen: function(title, bgKey, html, backFn) {
        this._mainElements.forEach(function(sel) { document.querySelectorAll(sel).forEach(function(el) { el.style.display = 'none'; }); });
        var bg = this._bg[bgKey] || bgKey;
        this.container.style.background = "url('" + bg + "') center/cover no-repeat";
        var goBack = backFn || 'SherwoodUI.loadHome()';
        if (this._screenLayer) {
            this._screenLayer.innerHTML = '<div style="min-height:100%;background:rgba(0,0,0,0.7);padding:16px;display:flex;flex-direction:column;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button onclick="' + goBack + '" style="background:transparent;border:none;cursor:pointer;padding:0;width:50px;height:50px;"><img src="assets/all_buttons/back.png" style="width:100%;height:100%;object-fit:contain;"></button><span style="color:#e0c080;font-size:1.1em;">' + title + '</span></div><div style="flex:1;">' + html + '</div></div>';
            this._screenLayer.style.display = 'block';
        }
    },
        // ========== ПОДЗЕМКА ==========
    subway: function() { this.showDungeon(); },

    showDungeon: function() {
        this._playSound('click');
        this._playMusic('dungeon_ambient');
        var self = this;
        var dungeons = Sherwood.Dungeon ? Sherwood.Dungeon.getAvailable() : {};
        var list = '';
        for (var id in dungeons) {
            var d = dungeons[id];
            var progress = (Sherwood.Dungeon._progress && Sherwood.Dungeon._progress[id]) ? Sherwood.Dungeon._progress[id] : { level: 1 };
            var tilePath = 'assets/dungeon_tiles/' + d.tiles + '/tiles';
            if (d.tiles === 'dungeon2') tilePath = 'assets/dungeon_tiles/dungeon2/tiles2.';
            if (d.tiles === 'dungeon3') tilePath = 'assets/dungeon_tiles/dungeon3/tiles3.';
            var ext = d.ext || '.jpeg';
            list += '<div style="background:url(\'assets/backgrounds/skill_page.jpeg\') center/cover no-repeat;border:1px solid #555;border-radius:12px;padding:14px;margin-bottom:12px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:0;"></div><div style="position:relative;z-index:1;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:60px;height:60px;border-radius:10px;background:url(\'' + d.bg + '\') center/cover no-repeat;border:2px solid #c9a040;flex-shrink:0;"></div><div><div style="color:#e0c080;font-size:1.1em;font-weight:bold;">' + d.name + '</div><div style="color:#aaa;font-size:0.75em;">' + (d.icon||'') + ' Уровень ' + (progress.level||1) + '/7</div></div></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">';
            for (var lvl = 1; lvl <= 7; lvl++) {
                var unlocked = lvl <= (progress.level || 1);
                var tileImg = tilePath + lvl + ext;
                var lockImg = 'assets/interface/closed_level_lock_icon.png';
                list += '<div onclick="' + (unlocked ? 'SherwoodUI._startDungeon(\'' + id + '\',' + lvl + ')' : '') + '" style="width:48px;height:48px;background-image:url(\'' + (unlocked ? tileImg : lockImg) + '\');background-size:cover;background-position:center;border:2px solid ' + (unlocked ? '#c9a040' : '#555') + ';border-radius:6px;cursor:' + (unlocked ? 'pointer' : 'default') + ';display:flex;align-items:center;justify-content:center;position:relative;"><span style="position:absolute;bottom:1px;right:3px;font-size:0.6em;color:' + (unlocked ? '#000' : '#888') + ';">' + lvl + '</span></div>';
            }
            list += '</div><div style="text-align:center;color:#666;font-size:0.7em;margin-top:6px;">' + ((progress.level||1) >= 7 ? '✅ Пройдено' : 'Следующий: ' + ((progress.level||1) + 1)) + '</div></div></div>';
        }
        var tickets = Sherwood.getPlayer() ? Sherwood.getPlayer().dungeon.tickets : 0;
        var html = '<div style="color:#aaa;font-size:0.85em;margin-bottom:12px;text-align:center;">🎫 Билетов: ' + tickets + '</div>' + (list || '<div style="color:#aaa;text-align:center;">Нет подземелий</div>');
        this._mainElements.forEach(function(sel) { document.querySelectorAll(sel).forEach(function(el) { el.style.display = 'none'; }); });
        this.container.style.background = "url('" + this._bg.dungeon_select + "') center/cover no-repeat";
        if (this._screenLayer) {
            this._screenLayer.innerHTML = '<div style="min-height:100%;background:rgba(0,0,0,0.7);padding:16px;display:flex;flex-direction:column;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><button onclick="SherwoodUI.loadHome()" style="background:transparent;border:none;cursor:pointer;padding:0;width:50px;height:50px;"><img src="assets/all_buttons/back.png" style="width:100%;height:100%;object-fit:contain;"></button><span style="color:#e0c080;font-size:1.1em;">🏰 Подземелья</span></div><div style="flex:1;">' + html + '</div></div>';
            this._screenLayer.style.display = 'block';
        }
    },

    _startDungeon: function(id, level) {
        if (!Sherwood.Dungeon || !Sherwood.Dungeon.generate) return;
        var d = Sherwood.Dungeon.generate(id, level);
        if (!d) { this._showNotification('❌ Нет билетов!'); return; }
        this._playSound('dungeon_enter');
        this._playMusic('dungeon_ambient');
        this._renderDungeon();
    },

    _showNotification: function(msg) {
        var log = document.getElementById('dungeon-log');
        if (log) { log.textContent = msg; log.style.color = '#f44336'; setTimeout(function() { log.style.color = '#aaa'; }, 2000); }
    },

            _renderDungeon: function() {
        var d = Sherwood.Dungeon.getDungeon();
        if (!d) { this.showDungeon(); return; }
        var dungeons = Sherwood.Dungeon.getAvailable();
        var dd = dungeons[d.id] || { bg: this._bg.dungeon_forest, tiles: 'dungeon1', ext: '.jpeg' };
        this.container.style.background = "url('" + dd.bg + "') center/cover no-repeat";
        this._mainElements.forEach(function(sel) { document.querySelectorAll(sel).forEach(function(el) { el.style.display = 'none'; }); });
        var size = d.size;
        var cs = Math.min(50, Math.floor((this.container.clientWidth - 16) / size));
        var floorBg = "assets/dungeon_tiles/" + dd.tiles + "/" + dd.tiles + "tiles.png";
        var tilePath = "assets/dungeon_tiles/" + dd.tiles + "/tiles";
        if (dd.tiles === 'dungeon2') tilePath = "assets/dungeon_tiles/dungeon2/tiles2.";
        if (dd.tiles === 'dungeon3') tilePath = "assets/dungeon_tiles/dungeon3/tiles3.";
        var ext = dd.ext;
        // 6 вариантов полос по рядам со случайным зеркалированием
        var rowVariants = [];
        for (var r = 0; r < size; r++) {
            var flipH = Math.random() < 0.5;
            var flipV = Math.random() < 0.5;
            var t = '';
            if (flipH) t += ' scaleX(-1)';
            if (flipV) t += ' scaleY(-1)';
            rowVariants.push(t.trim() || 'none');
        }
        var gridW = cs * size;
        var html = '<div style="position:relative;width:' + gridW + 'px;height:' + gridW + 'px;margin:0 auto;">';
        // Фон открытых клеток — полоса для каждого ряда
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                var cell = d.grid[y][x];
                if (cell.open) {
                    html += '<div style="position:absolute;left:' + (x * cs) + 'px;top:' + (y * cs) + 'px;width:' + cs + 'px;height:' + cs + 'px;background-image:url(\'' + floorBg + '\');background-size:cover;background-position:center;transform:' + rowVariants[y] + ';z-index:0;"></div>';
                }
            }
        }
        // Сетка клеток
        html += '<div style="position:relative;z-index:1;">';
        for (var y = 0; y < size; y++) {
            html += '<div style="display:flex;gap:0;margin:0;">';
            for (var x = 0; x < size; x++) {
                var cell = d.grid[y][x];
                var isPlayer = (d.px === x && d.py === y);
                var bg, border = 'rgba(255,255,255,0.08)', content = '', cursor = '', onclick = '';
                if (cell.open) {
                    bg = 'transparent';
                    border = 'rgba(255,255,255,0.04)';
                    if (cell.monster) { content = '<img src="assets/all_beasts/' + (cell.monsterId || 'image (1).png') + '" style="width:90%;height:90%;object-fit:contain;" onerror="this.innerHTML=\'👹\'">'; border = cell.boss ? '#ff6a00' : '#f44336'; }
                    else if (cell.chest) { content = '<img src="assets/interface/locked_chest_first_dungeon.png" style="width:80%;height:80%;object-fit:contain;">'; border = '#ffc107'; }
                    else if (cell.exit) { content = '<img src="assets/interface/staircase_with_an_arch.png" style="width:80%;height:80%;object-fit:contain;">'; border = '#4caf50'; }
                    var adj = Math.abs(x - d.px) + Math.abs(y - d.py) === 1;
                    if (adj && !isPlayer && !cell.monster) { cursor = 'cursor:pointer;'; onclick = "onclick=\"SherwoodUI._dungeonMove(" + x + "," + y + ")\""; border = '#4caf50'; }
                } else {
                    var tn = 1 + ((x * 7 + y * 3) % 14);
                    bg = "url('" + tilePath + tn + ext + "')";
                    var adj = Math.abs(x - d.px) + Math.abs(y - d.py) === 1;
                    if (adj) { cursor = 'cursor:pointer;'; onclick = "onclick=\"SherwoodUI._dungeonMove(" + x + "," + y + ")\""; border = '#4caf50'; }
                }
                if (isPlayer) { content = '<img src="assets/interface/labyrinth_of_icons.png" style="width:80%;height:80%;object-fit:contain;">'; border = '#ffd700'; bg = 'transparent'; }
                html += '<div ' + onclick + ' style="width:' + cs + 'px;height:' + cs + 'px;' + (bg === 'transparent' ? '' : 'background-image:' + bg + ';background-size:cover;background-position:center;') + 'border:1px solid ' + border + ';display:flex;align-items:center;justify-content:center;font-size:' + (cs*0.35) + 'px;' + cursor + '">' + content + '</div>';
            }
            html += '</div>';
        }
        html += '</div></div>';
        var hp = Sherwood.getPlayer().stats.hp || 0;
        if (this._screenLayer) {
            this._screenLayer.innerHTML = "<div style=\"min-height:100%;background:rgba(0,0,0,0.5);padding:8px;display:flex;flex-direction:column;align-items:center;\"><div style=\"width:100%;max-width:" + (gridW+20) + "px;\"><div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;\"><button onclick=\"SherwoodUI._leaveDungeon()\" style=\"background:transparent;border:none;cursor:pointer;padding:0;width:40px;height:40px;\"><img src=\"assets/all_buttons/back.png\" style=\"width:100%;height:100%;object-fit:contain;\"></button><div style=\"color:#70a0e0;font-weight:bold;font-size:0.85em;\">" + (d.id||'') + " Ур." + (d.level||1) + "</div><div style=\"color:#4caf50;font-size:0.85em;\">❤️" + hp + "</div></div><div style=\"background:rgba(0,0,0,0.5);border-radius:6px;padding:4px;margin-bottom:6px;\"><div style=\"display:flex;justify-content:space-around;font-size:10px;color:#aaa;\"><span>👹 " + (d.monstersKilled||0) + "/" + (d.totalMonsters||0) + "</span><span>📦 " + (d.chestsOpened||0) + "</span><span>🚶 " + (d.steps||0) + "</span></div></div>" + html + "<div id=\"dungeon-log\" style=\"text-align:center;font-size:11px;color:#aaa;min-height:18px;margin-top:6px;background:rgba(0,0,0,0.6);border-radius:6px;padding:4px;\"></div></div></div>";
            this._screenLayer.style.display = 'block';
        }
    },

    _dungeonMove: function(x, y) {
        var d = Sherwood.Dungeon.getDungeon();
        if (!d) return;
        var r = Sherwood.Dungeon.move(x - d.px, y - d.py);
        if (!r || !r.ok) return;
        if (r.type === 'battle') {
            Sherwood.Combat.start(d.id + '_monster', r.boss, 'dungeon');
            this._showCombatScreen();
            return;
        }
        if (r.type === 'chest') {
            this._playSound('chest_open');
            this.updateDisplay();
        }
        if (r.type === 'exit') {
            var reward = Sherwood.Dungeon.complete();
            this.updateDisplay();
            this._playSound('victory');
            var self = this;
            setTimeout(function() { self.showDungeon(); }, 1500);
            return;
        }
        this._renderDungeon();
        this.updateDisplay();
    },

    _leaveDungeon: function() {
        if (Sherwood.Dungeon) Sherwood.Dungeon.leave();
        this._playMusic('forest_ambient');
        this.showDungeon();
    },
            // ========== БОЙ ==========
    _showCombatScreen: function() {
        var b = Sherwood.Combat.getState();
        if (!b) { this._renderDungeon(); return; }
        var cd = b.cooldowns || {};
        var ehp = b.enemyMaxHp > 0 ? Math.round((b.enemyHp / b.enemyMaxHp) * 100) : 0;
        var php = b.playerMaxHp > 0 ? Math.round((b.playerHp / b.playerMaxHp) * 100) : 0;
        var carp = b.enemyMaxArmor > 0 ? Math.round((b.enemyArmor / b.enemyMaxArmor) * 100) : 0;

        var html = '<div style="display:flex;flex-direction:column;height:100%;">';

        // === ВЕРХ: КАРТОЧКА ВРАГА ===
        html += '<div style="text-align:center;flex-shrink:0;">';
        html += '<div style="position:relative;display:inline-block;width:180px;height:180px;">';
html += '<img src="assets/interface/frame_of_beasts.png" style="width:180px;height:180px;position:absolute;top:0;left:0;z-index:0;pointer-events:none;">';
html += '<img src="assets/all_beasts/' + (b.enemyImage || 'image (1).png') + '" id="enemy-card" style="width:160px;height:160px;object-fit:contain;position:absolute;top:10px;left:10px;z-index:1;border-radius:12px;" onerror="this.src=\'assets/interface/labyrinth_of_icons.png\'">';
html += '</div>';
        html += '<div style="color:#f44336;font-weight:bold;font-size:1.1em;margin-top:4px;">' + (b.enemyName || 'Монстр') + (b.isBoss ? ' 👑' : '') + '</div>';
        // HP врага
        html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;">';
        html += '<img src="assets/interface/filling_the_beasts\'_health_bar.jpeg" style="width:120px;height:14px;object-fit:contain;">';
        html += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:12px;width:120px;overflow:hidden;position:relative;">';
        html += '<div id="enemy-hp-bar" class="hp-burn" style="background:#f44336;height:100%;width:' + ehp + '%;transition:0.3s;"></div>';
html += '<span id="enemy-hp-text" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:0.55em;text-shadow:0 0 4px #000;">' + b.enemyHp + '/' + b.enemyMaxHp + '</span>';
        // Броня врага
        if (b.enemyMaxArmor > 0) {
            html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:2px;">';
            html += '<span style="color:#2196f3;font-size:0.7em;">🛡️</span>';
            html += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:10px;width:120px;overflow:hidden;"><div style="background:#2196f3;height:100%;width:' + carp + '%;transition:0.3s;"></div></div>';
            html += '<span style="color:#2196f3;font-size:0.6em;">' + b.enemyArmor + '/' + b.enemyMaxArmor + '</span></div>';
        }
        html += '</div>';

        // === ЦЕНТР: ЛОГ ===
        html += '<div id="combat-log" style="flex:1;background:rgba(0,0,0,0.4);border-radius:8px;margin:8px 0;padding:8px;overflow-y:auto;color:#aaa;font-size:0.7em;min-height:80px;text-align:left;">';
        html += '<div style="color:#888;">⚔️ Бой начался!</div></div>';

        // === НИЗ: ПАНЕЛЬ ИГРОКА ===
        html += '<div style="flex-shrink:0;">';
        // HP игрока
        html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">';
        html += '<span style="color:#4caf50;font-size:0.8em;">❤️</span>';
        html += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;width:160px;overflow:hidden;position:relative;">';
        html += '<div style="background:#4caf50;height:100%;width:' + php + '%;transition:0.3s;"></div>';
        html += '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:0.6em;">' + b.playerHp + '/' + b.playerMaxHp + '</span></div></div>';

        // Кнопки навыков (иконки)
        html += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">';
        html += '<button onclick="SherwoodUI._combatSkill(\'power_shot\')" style="width:56px;height:56px;background:url(\'assets/skills/skill_critical_shot.gif\') center/contain no-repeat;border:2px solid ' + (cd.power_shot ? '#555' : '#ff5722') + ';border-radius:12px;cursor:pointer;opacity:' + (cd.power_shot ? '0.4' : '1') + ';position:relative;" title="Мощный выстрел">' + (cd.power_shot ? '<span style="position:absolute;bottom:-2px;right:-2px;background:#000;color:#fff;border-radius:50%;width:18px;height:18px;font-size:0.5em;line-height:18px;">' + cd.power_shot + '</span>' : '') + '</button>';
        html += '<button onclick="SherwoodUI._combatSkill(\'triple_shot\')" style="width:56px;height:56px;background:url(\'assets/skills/triple_shot_skill.png\') center/contain no-repeat;border:2px solid ' + (cd.triple_shot ? '#555' : '#2196f3') + ';border-radius:12px;cursor:pointer;opacity:' + (cd.triple_shot ? '0.4' : '1') + ';position:relative;" title="Тройной выстрел">' + (cd.triple_shot ? '<span style="position:absolute;bottom:-2px;right:-2px;background:#000;color:#fff;border-radius:50%;width:18px;height:18px;font-size:0.5em;line-height:18px;">' + cd.triple_shot + '</span>' : '') + '</button>';
        html += '<button onclick="SherwoodUI._combatAttack()" style="width:64px;height:64px;background:url(\'assets/interface/normal_hit_button.png\') center/contain no-repeat;border:3px solid #c9a040;border-radius:50%;cursor:pointer;" title="Атака"></button>';
        html += '<button onclick="SherwoodUI._combatSkill(\'poison_arrow\')" style="width:56px;height:56px;background:url(\'assets/skills/poison_shot_skill.gif\') center/contain no-repeat;border:2px solid ' + (cd.poison_arrow ? '#555' : '#4caf50') + ';border-radius:12px;cursor:pointer;opacity:' + (cd.poison_arrow ? '0.4' : '1') + ';position:relative;" title="Отравленная стрела">' + (cd.poison_arrow ? '<span style="position:absolute;bottom:-2px;right:-2px;background:#000;color:#fff;border-radius:50%;width:18px;height:18px;font-size:0.5em;line-height:18px;">' + cd.poison_arrow + '</span>' : '') + '</button>';
        html += '<button onclick="SherwoodUI._combatSkill(\'stunning_shot\')" style="width:56px;height:56px;background:url(\'assets/skills/control_skill.png\') center/contain no-repeat;border:2px solid ' + (cd.stunning_shot ? '#555' : '#9c27b0') + ';border-radius:12px;cursor:pointer;opacity:' + (cd.stunning_shot ? '0.4' : '1') + ';position:relative;" title="Оглушающий выстрел">' + (cd.stunning_shot ? '<span style="position:absolute;bottom:-2px;right:-2px;background:#000;color:#fff;border-radius:50%;width:18px;height:18px;font-size:0.5em;line-height:18px;">' + cd.stunning_shot + '</span>' : '') + '</button>';
        html += '</div>';
        html += '<div style="text-align:center;margin-top:6px;">';
        html += '<button onclick="SherwoodUI._combatFlee()" style="background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:4px 14px;color:#f44336;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.65em;">🏃 Бежать</button></div>';
        html += '</div></div>';

        this._openScreen('', 'dungeon_fight', html);
    },

    _combatAttack: function() {
        var r = Sherwood.Combat.attack();
        this._handleCombat(r);
    },
    _combatSkill: function(id) {
        var r = Sherwood.Combat.skill(id);
        if (r.fail) return;
        this._handleCombat(r);
    },
        _playHitAnimation: function() {
        var card = document.getElementById('enemy-card');
        if (!card) return;
        card.classList.remove('hit-epic-combo');
        void card.offsetWidth;
        card.classList.add('hit-epic-combo');
    },

    _updateEnemyHP: function(newHp, maxHp) {
        var bar = document.getElementById('enemy-hp-bar');
        var text = document.getElementById('enemy-hp-text');
        if (bar) {
            var pct = maxHp > 0 ? Math.round((newHp / maxHp) * 100) : 0;
            bar.classList.add('hp-burn-flash');
            bar.style.width = pct + '%';
            setTimeout(function() { bar.classList.remove('hp-burn-flash'); }, 300);
        }
        if (text) text.textContent = newHp + '/' + maxHp;
    },
    _combatFlee: function() {
        var r = Sherwood.Combat.flee();
        if (r.success) { this._leaveDungeon(); return; }
        var log = document.getElementById('combat-log');
        if (r.lose) { this._addCombatLog('💀 Поражение...', '#f44336'); var self = this; setTimeout(function() { self._leaveDungeon(); }, 1200); return; }
        this._addCombatLog('❌ Побег не удался! Враг атакует: -' + r.damage, '#ff9800');
        this._showCombatScreen();
    },

    _addCombatLog: function(msg, color) {
        var log = document.getElementById('combat-log');
        if (log) {
            log.innerHTML += '<div style="color:' + (color||'#aaa') + ';margin:2px 0;">' + msg + '</div>';
            log.scrollTop = log.scrollHeight;
        }
    },

    _handleCombat: function(r) {
        if (r.win) {
            this._addCombatLog('🏆 Победа! +' + r.exp + 'XP +' + r.gold + '🪙', '#ffd700');
            if (Sherwood.Dungeon && Sherwood.Dungeon.killMonster) Sherwood.Dungeon.killMonster();
            this.updateDisplay();
            var self = this;
            setTimeout(function() { self._renderDungeon(); }, 1500);
        } else if (r.lose) {
            this._addCombatLog('💀 Поражение...', '#f44336');
            var self = this;
            setTimeout(function() { self._leaveDungeon(); }, 1500);
        } else {
            this._playHitAnimation();
            this._updateEnemyHP(r.enemyHp, r.enemyMaxHp);
            var msg = (r.crit ? '💥 КРИТ! ' : '⚔️ ') + '-' + r.damage;
            if (r.armorDmg) msg += ' 🛡️-' + r.armorDmg + ' брони';
            this._addCombatLog(msg, r.crit ? '#ff6a00' : '#fff');
            if (r.poison) this._addCombatLog('🧪 Враг отравлен!', '#4caf50');
            if (r.stun) this._addCombatLog('💫 Враг оглушён!', '#ffd700');
            if (r.enemy && r.enemy.damage) this._addCombatLog('💢 Враг атакует: -' + r.enemy.damage, '#f44336');
            if (r.enemy && r.enemyArmorDmg) this._addCombatLog('🛡️ Ваша броня: -' + r.enemyArmorDmg, '#2196f3');
            this.updateDisplay();
            this._showCombatScreen();
        }
    },

    // ========== КВЕСТЫ ==========
    quest: function() {
        this._playSound('click');
        if (!Sherwood.Quests) { this._showPlaceholder('📜 Квесты', 'quests'); return; }
        var prog = Sherwood.Quests.getProgress();
        var chapters = Sherwood.Quests.getAllChapters();
        var energy = Sherwood.Quests.getEnergy();
        var h = '<div style="text-align:center;margin-bottom:12px;"><span style="color:#ff9800;">⚡ ' + energy.current + '/' + energy.max + '</span></div>';
        for (var i = 0; i < chapters.length; i++) {
            var ch = chapters[i];
            var done = prog.completed.indexOf(ch.id) !== -1;
            var unlocked = ch.id === 1 || prog.completed.indexOf(ch.id - 1) !== -1;
            var cur = !done && unlocked;
            var badge = done ? '✅' : (cur ? '⚔️' : '🔒');
            var bc = done ? '#4caf50' : (cur ? '#c9a040' : '#f44336');
            var onclick = cur ? 'onclick="SherwoodUI._startQuest(' + ch.id + ')" style="cursor:pointer;"' : '';
            h += '<div ' + onclick + ' style="background:url(\'assets/backgrounds/skill_page.jpeg\') center/cover no-repeat;border:2px solid ' + bc + ';border-radius:10px;padding:12px;margin-bottom:8px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,' + (done?0.3:cur?0.6:0.2) + ');z-index:0;"></div><div style="position:relative;z-index:1;display:flex;align-items:center;gap:10px;"><div style="font-size:1.5em;">' + badge + '</div><div><div style="color:#e0c080;font-weight:bold;">Глава ' + ch.id + ': ' + ch.name + '</div><div style="color:#aaa;font-size:0.7em;">' + ch.stages + ' этапов | ⚡' + ch.energyCost + '</div></div></div></div>';
        }
        h += '<div id="quest-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>';
        this._openScreen('📜 Квесты', 'quests', h);
    },

    _startQuest: function(id) {
        var r = Sherwood.Quests.startChapter(id);
        var info = document.getElementById('quest-info');
        if (!r.success) { if (info) info.textContent = '❌ ' + r.reason; return; }
        this._showQuestBattle();
    },

    _showQuestBattle: function() {
        var b = Sherwood.Quests.getBattle();
        if (!b) { this.quest(); return; }
        var e = b.enemy;
        var ehp = Math.round((e.hp / e.maxHp) * 100);
        var p = Sherwood.getPlayer();
        var php = Math.round((p.stats.hp / p.stats.maxHp) * 100);
        var h = '<div style="text-align:center;">';
        h += '<div style="color:#aaa;">Глава ' + b.chapter.id + ' — Этап ' + b.stage + '/' + b.total + '</div>';
        h += '<div style="margin:12px 0;"><div style="font-size:4em;">' + (e.isBoss ? '👑' : '👹') + '</div>';
        h += '<div style="color:#f44336;font-weight:bold;">' + e.name + '</div>';
        h += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#f44336;height:100%;width:' + ehp + '%;"></div></div>';
        h += '<div style="color:#aaa;">❤️ ' + Math.max(0,e.hp) + '/' + e.maxHp + '</div></div>';
        h += '<div style="color:#ffd700;">⚔️ VS ⚔️</div>';
        h += '<div style="margin:12px 0;"><div style="color:#4caf50;">❤️ ' + p.stats.hp + '/' + p.stats.maxHp + '</div>';
        h += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#4caf50;height:100%;width:' + php + '%;"></div></div></div>';
        h += '<button onclick="SherwoodUI._questAttack()" style="background:#c9a040;border:none;border-radius:8px;padding:10px 24px;color:#000;font-weight:bold;cursor:pointer;font-family:\'Georgia\',serif;">⚔️ Атака</button>';
        h += '<div style="margin-top:6px;"><button onclick="SherwoodUI._questFlee()" style="background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.7em;">🏃 Сбежать</button></div>';
        h += '<div id="quest-battle-log" style="color:#aaa;font-size:0.8em;margin-top:8px;"></div></div>';
        this._openScreen('⚔️ Битва', 'quests', h);
    },

    _questAttack: function() {
        var r = Sherwood.Quests.attack();
        this._handleQuestResult(r);
    },
    _questFlee: function() {
        Sherwood.Quests.flee();
        this.quest();
    },
    _handleQuestResult: function(r) {
        var log = document.getElementById('quest-battle-log');
        if (r.enemyDead) {
            if (log) log.textContent = '✅ Враг повержен!';
            this.updateDisplay();
            if (r.chapterComplete) {
                var self = this;
                setTimeout(function() { self.quest(); }, 1500);
            } else {
                var self = this;
                setTimeout(function() { self._showQuestBattle(); }, 1000);
            }
        } else if (r.playerDead) {
            if (log) log.textContent = '💀 Поражение...';
            Sherwood.Quests.flee();
            var self = this;
            setTimeout(function() { self.quest(); }, 1500);
        } else {
            if (log) log.textContent = '-' + r.damage + ' | Враг: -' + (r.enemyDamage||0);
            this._showQuestBattle();
        }
    },
        // ========== ТАВЕРНА ==========
    tavern: function() {
        this._playSound('click');
        this._playMusic('tavern_ambient');
        if (!Sherwood.Tavern) { this._showPlaceholder('🍺 Таверна', 'tavern'); return; }
        var quests = Sherwood.Tavern.getDailyQuests();
        var active = Sherwood.Tavern.getCurrentQuest();
        var done = Sherwood.Tavern.getDailyQuestsDone();
        var html = '';
        if (active) {
            html += '<div style="background:rgba(0,0,0,0.6);border:2px solid #c9a040;border-radius:10px;padding:14px;margin-bottom:12px;">';
            html += '<div style="color:#ffd700;font-weight:bold;">⚔️ Активный квест</div>';
            html += '<div style="color:#fff;">' + active.name + '</div>';
            html += '<div style="color:#aaa;font-size:0.8em;">' + active.desc + '</div>';
            html += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:8px 0;overflow:hidden;"><div style="background:#c9a040;height:100%;width:' + Math.round((active.progress||0)/active.target*100) + '%;"></div></div>';
            html += '<div style="color:#aaa;font-size:0.7em;">' + (active.progress||0) + '/' + active.target + '</div>';
            html += '<button onclick="SherwoodUI._tavernAuto()" style="background:#c9a040;border:none;border-radius:6px;padding:8px 16px;color:#000;cursor:pointer;font-family:\'Georgia\',serif;">⚡ Автобой</button> ';
            html += '<button onclick="SherwoodUI._tavernCancel()" style="background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:8px 12px;color:#f44336;cursor:pointer;font-family:\'Georgia\',serif;">Отменить</button>';
            html += '</div>';
        }
        for (var i = 0; i < quests.length; i++) {
            var q = quests[i]; if (q.completed) continue;
            html += '<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">';
            html += '<div><div style="color:#e0c080;">' + q.name + '</div><div style="color:#aaa;font-size:0.7em;">' + q.desc + ' (' + q.target + ')</div><div style="color:#ffd700;font-size:0.6em;">🏆 +' + q.reward.exp + 'XP +' + q.reward.gold + '🪙</div></div>';
            html += '<button onclick="SherwoodUI._tavernStart(' + i + ')" style="background:#c9a040;border:none;border-radius:4px;padding:6px 12px;color:#000;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.7em;">Взять</button></div>';
        }
        var content = '<div style="color:#aaa;font-size:0.8em;margin-bottom:8px;">📋 Доступно: ' + (10-done) + '/10 | ✅ Всего: ' + Sherwood.Tavern.getCompletedCount() + '</div>' + (html || '<div style="color:#aaa;text-align:center;">Всё выполнено!</div>') + '<div id="tavern-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>';
        this._openScreen('🍺 Таверна', 'tavern', content);
    },
    _tavernStart: function(i) { Sherwood.Tavern.startQuest(i); this.tavern(); },
    _tavernAuto: function() {
        var r = Sherwood.Tavern.autoBattle();
        var log = document.getElementById('tavern-log');
        if (r.completed) { if (log) log.textContent = '🎉 Выполнено!'; this.updateDisplay(); }
        else if (r.failed) { if (log) log.textContent = '❌ Неудача!'; }
        else { if (log) log.textContent = '⚔️ ' + (r.progress||0) + '/' + (r.target||0); }
        var self = this; setTimeout(function() { self.tavern(); }, 800);
    },
    _tavernCancel: function() { Sherwood.Tavern.cancelQuest(); this.tavern(); },

    // ========== ПОРТАЛЫ ==========
    portal: function() {
        this._playSound('click');
        if (!Sherwood.Portal) { this._showPlaceholder('🌀 Порталы', 'portal'); return; }
        if (Sherwood.Portal.isInPortal()) { this._showPortalBattle(); return; }
        var portals = Sherwood.Portal.getAllPortals();
        var player = Sherwood.getPlayer();
        var html = '';
        for (var i = 0; i < portals.length; i++) {
            var p = portals[i];
            var check = Sherwood.Portal.canEnter(p.id);
            var unlocked = Sherwood.Portal.isPortalUnlocked(p.id);
            var completed = player.portal && player.portal.completed && player.portal.completed.indexOf(p.id) !== -1;
            var badge = '', bo = '0.4', bc = '#555', ca = '';
            if (completed) { badge = '<span style="color:#4caf50;">✅</span>'; bo = '0.3'; bc = '#4caf50'; }
            else if (check.can) { badge = '<span style="color:#ffd700;">⚔️</span>'; bo = '0.6'; bc = '#c9a040'; ca = 'onclick="SherwoodUI._enterPortal(' + p.id + ')" style="cursor:pointer;"'; }
            else if (!unlocked) { badge = '<span style="color:#f44336;">🔒</span>'; bo = '0.2'; bc = '#f44336'; }
            else { badge = '<span style="color:#ff9800;">⚠️ АТК ' + p.statRequirement.attack + '+ ЗЩТ ' + p.statRequirement.defense + '+</span>'; }
            html += '<div ' + ca + ' style="background:url(\'' + p.bg + '\') center/cover no-repeat;border:2px solid ' + bc + ';border-radius:10px;padding:12px;margin-bottom:8px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,' + bo + ');z-index:0;"></div><div style="position:relative;z-index:1;display:flex;align-items:center;gap:10px;"><div style="font-size:2em;">' + p.icon + '</div><div style="flex:1;"><div style="color:#e0c080;font-weight:bold;">' + p.name + '</div><div style="color:#aaa;font-size:0.7em;">' + p.enemies.length + ' врагов | 3 часа</div>' + badge + '</div></div></div>';
        }
        this._openScreen('🌀 Порталы', 'portal', html || '<div style="color:#aaa;text-align:center;">Нет порталов</div>');
    },
    _enterPortal: function(id) {
        var r = Sherwood.Portal.enterPortal(id);
        if (!r.success) return;
        this._playSound('dungeon_enter');
        this._showPortalBattle();
    },
    _showPortalBattle: function() {
        var b = Sherwood.Portal.getCurrentBattle();
        if (!b) { this.portal(); return; }
        var e = b.enemy;
        var ehp = Math.round(((e.hp||e.maxHp)/(e.maxHp||1))*100);
        var tm = Math.floor(b.timeRemaining/60), ts = b.timeRemaining%60;
        var h = '<div style="text-align:center;"><div style="color:#aaa;font-size:0.7em;">⏱️ ' + tm + ':' + (ts<10?'0':'') + ts + ' | 💀 ' + b.deathCount + '</div>';
        h += '<div style="color:#e0c080;">' + b.portal.name + ' — ' + b.level + '/' + b.totalLevels + '</div>';
        h += '<div style="margin:12px 0;"><div style="font-size:4em;">' + (e.isBoss?'👑':'👹') + '</div>';
        h += '<div style="color:#f44336;font-weight:bold;">' + e.name + '</div>';
        h += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#f44336;height:100%;width:' + ehp + '%;"></div></div>';
        h += '<div style="color:#aaa;">❤️ ' + Math.max(0,e.hp||e.maxHp) + '/' + (e.maxHp||'?') + '</div></div>';
        h += '<div style="color:#4caf50;">❤️ ' + Sherwood.getPlayer().stats.hp + '</div>';
        h += '<button onclick="SherwoodUI._portalAttack()" style="background:#c9a040;border:none;border-radius:8px;padding:10px 24px;color:#000;font-weight:bold;cursor:pointer;font-family:\'Georgia\',serif;margin:4px;">⚔️ Атака</button>';
        h += '<button onclick="SherwoodUI._portalFlee()" style="margin-top:6px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.7em;">🏃 Бежать</button>';
        h += '<div id="portal-log" style="color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>';
        this._openScreen('🌀 Портал', 'portal', h);
    },
    _portalAttack: function() { this._handlePortalResult(Sherwood.Portal.portalAttack()); },
    _handlePortalResult: function(r) {
        if (!r) return; var log = document.getElementById('portal-log');
        if (r.portalComplete) { if (log) log.textContent = '🎉 Портал пройден!'; this.updateDisplay(); var self = this; setTimeout(function() { self.portal(); }, 2000); }
        else if (r.portalFailed) { if (log) log.textContent = '💀 Провал!'; var self = this; setTimeout(function() { self.portal(); }, 2000); }
        else if (r.dead && r.resurrected) { if (log) log.textContent = '💀 Смерть #' + r.deathCount + '! Выкуп: ' + r.cost.cost + ' ' + r.cost.currency; this.updateDisplay(); this._showPortalBattle(); }
        else if (r.enemyDead) { if (log) log.textContent = '✅ Враг повержен!'; this.updateDisplay(); if (r.nextEnemy) { var self = this; setTimeout(function() { self._showPortalBattle(); }, 1000); } }
        else { if (log) log.textContent = '-' + r.damage + ' | Враг: -' + (r.enemyDamage||0); this.updateDisplay(); this._showPortalBattle(); }
    },
    _portalFlee: function() { Sherwood.Portal.fleePortal(); this.portal(); },

    // ========== РЕЙД ==========
    raid: function() {
        this._playSound('click');
        if (!Sherwood.Raid) { this._showPlaceholder('⚔️ Рейд', 'raid'); return; }
        if (Sherwood.Raid.isRaidActive()) { this._showRaidBattle(); return; }
        var raids = Sherwood.Raid.getAvailableRaids();
        var check = Sherwood.Raid.canJoinRaid();
        var html = '';
        for (var i = 0; i < raids.length; i++) {
            var r = raids[i];
            html += '<div style="background:rgba(0,0,0,0.5);border:2px solid ' + (check.can?'#c9a040':'#f44336') + ';border-radius:10px;padding:14px;margin-bottom:8px;text-align:center;">';
            html += '<div style="color:#e0c080;font-weight:bold;">' + r.name + '</div>';
            html += '<div style="color:#aaa;">❤️ ' + r.maxHp + ' | ⚔️ ' + r.attack + ' | 3 этапа</div>';
            html += check.can ? '<button onclick="SherwoodUI._startRaid(' + i + ')" style="margin-top:8px;background:#c9a040;border:none;border-radius:6px;padding:8px 20px;color:#000;font-weight:bold;cursor:pointer;font-family:\'Georgia\',serif;">В бой!</button>' : '<div style="color:#f44336;">' + check.reason + '</div>';
            html += '</div>';
        }
        this._openScreen('⚔️ Рейд', 'raid', html || '<div style="color:#aaa;text-align:center;">Нет рейдов</div>');
    },
    _startRaid: function(i) { Sherwood.Raid.startRaid(i); this._playSound('dungeon_enter'); this._showRaidBattle(); },
    _showRaidBattle: function() {
        var s = Sherwood.Raid.getRaidStatus(); if (!s) { this.raid(); return; }
        var stage = s.stage; var html = '<div style="text-align:center;"><div style="color:#ff6a00;">' + s.boss.name + ' — Этап ' + s.stageIndex + '/' + s.totalStages + '</div>';
        html += '<div style="color:#aaa;font-size:0.7em;">Участников: ' + s.participants.join(', ') + '</div>';
        for (var i = 0; i < stage.enemies.length; i++) {
            var e = stage.enemies[i]; var ehp = Math.round(((e.hp||e.maxHp||100)/(e.maxHp||100))*100);
            html += '<div style="margin:8px 0;"><div style="color:#f44336;">' + e.name + '</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;margin:2px 15%;overflow:hidden;"><div style="background:#f44336;height:100%;width:' + ehp + '%;"></div></div></div>';
        }
        html += '<div style="color:#4caf50;margin-top:8px;">❤️ ' + Sherwood.getPlayer().stats.hp + '</div>';
        html += '<button onclick="SherwoodUI._raidAttack()" style="margin-top:12px;background:#c9a040;border:none;border-radius:8px;padding:10px 30px;color:#000;font-weight:bold;cursor:pointer;font-family:\'Georgia\',serif;">⚔️ Атака</button>';
        html += '<button onclick="SherwoodUI._raidFlee()" style="margin-top:8px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.7em;">🏃 Выйти</button>';
        html += '<div id="raid-log" style="color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>';
        this._openScreen('⚔️ Рейд', 'raid', html);
    },
    _raidAttack: function() {
        var r = Sherwood.Raid.raidAttack(); var log = document.getElementById('raid-log');
        if (r.raidComplete) { if (log) log.textContent = '🎉 Рейд пройден!'; this.updateDisplay(); var self = this; setTimeout(function() { self.raid(); }, 2000); }
        else if (r.stageComplete) { if (log) log.textContent = '✅ Этап пройден!'; var self = this; setTimeout(function() { self._showRaidBattle(); }, 1000); }
        else if (r.playerDead) { if (log) log.textContent = '💀 Вы погибли!'; var self = this; setTimeout(function() { self.raid(); }, 1500); }
        else { if (log) log.textContent = '-' + r.damage + ' | Враг: -' + (r.bossDamage||0); this.updateDisplay(); this._showRaidBattle(); }
    },
    _raidFlee: function() { Sherwood.Raid.fleeRaid(); this.raid(); },
        // ========== АРЕНА ==========
    arena: function() {
        this._playSound('click');
        if (!Sherwood.Arena) { this._showPlaceholder('🏟️ Арена', 'arena'); return; }
        if (Sherwood.Arena.isInMatch()) { this._showArenaMatch(); return; }
        var opps = Sherwood.Arena.getOpponents();
        var stats = Sherwood.Arena.getStats();
        var html = '<div style="text-align:center;margin-bottom:8px;color:#e0c080;">🏆 ' + stats.rank + ' | 🏅 ' + stats.wins + ' | 💀 ' + stats.losses + '</div>';
        for (var i = 0; i < opps.length; i++) {
            var o = opps[i];
            html += '<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;">';
            html += '<img src="' + o.skin + '" style="width:40px;height:40px;object-fit:contain;border-radius:50%;" onerror="this.src=\'assets/hero_skins/skin_1_basic.png\'">';
            html += '<div style="flex:1;"><div style="color:#fff;">' + o.name + '</div><div style="color:#aaa;font-size:0.7em;">⚔️' + o.stats.attack + ' 🛡️' + o.stats.defense + ' ❤️' + o.stats.maxHp + '</div></div>';
            html += '<button onclick="SherwoodUI._startArenaMatch(' + o.id + ')" style="background:#c9a040;border:none;border-radius:4px;padding:6px 12px;color:#000;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.7em;">Бой</button></div>';
        }
        html += '<button onclick="SherwoodUI._refreshArena()" style="width:100%;margin-top:8px;background:rgba(255,255,255,0.1);border:1px solid #666;border-radius:6px;padding:8px;color:#fff;cursor:pointer;font-family:\'Georgia\',serif;">🔄 Обновить</button>';
        this._openScreen('🏟️ Арена', 'arena', html);
    },
    _startArenaMatch: function(i) { Sherwood.Arena.startMatch(i); this._showArenaMatch(); },
    _refreshArena: function() { Sherwood.Arena.refreshOpponents(); this.arena(); },
    _showArenaMatch: function() {
        var m = Sherwood.Arena.getCurrentMatch(); if (!m) { this.arena(); return; }
        var o = m.opponent, p = m.player;
        var ohp = Math.round((o.stats.hp/o.stats.maxHp)*100), php = Math.round((p.stats.hp/p.stats.maxHp)*100);
        var h = '<div style="text-align:center;"><div style="color:#ffd700;">⚔️ Арена ⚔️</div>';
        h += '<div style="display:flex;justify-content:space-around;align-items:center;margin:16px 0;">';
        h += '<div style="text-align:center;"><img src="' + o.skin + '" style="width:60px;height:60px;object-fit:contain;border:2px solid #f44336;border-radius:50%;" onerror="this.src=\'assets/hero_skins/skin_1_basic.png\'"><div style="color:#f44336;">' + o.name + '</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#f44336;height:100%;width:' + ohp + '%;"></div></div><div style="color:#aaa;font-size:0.6em;">' + Math.max(0,o.stats.hp) + '/' + o.stats.maxHp + '</div></div>';
        h += '<div style="font-size:1.5em;">VS</div>';
        h += '<div style="text-align:center;"><img src="assets/hero_skins/skin_1_basic.png" style="width:60px;height:60px;object-fit:contain;border:2px solid #4caf50;border-radius:50%;"><div style="color:#4caf50;">Вы</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#4caf50;height:100%;width:' + php + '%;"></div></div><div style="color:#aaa;font-size:0.6em;">' + p.stats.hp + '/' + p.stats.maxHp + '</div></div></div>';
        h += '<button onclick="SherwoodUI._arenaAttack()" style="width:100%;background:#c9a040;border:none;border-radius:8px;padding:12px;color:#000;font-weight:bold;cursor:pointer;font-family:\'Georgia\',serif;margin-bottom:8px;">⚔️ Атака</button>';
        h += '<button onclick="SherwoodUI._arenaFlee()" style="width:100%;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:8px;color:#f44336;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.7em;">🏃 Сдаться</button>';
        h += '<div id="arena-log" style="color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>';
        this._openScreen('🏟️ Арена', 'arena', h);
    },
    _arenaAttack: function() {
        var r = Sherwood.Arena.arenaAttack(); var log = document.getElementById('arena-log');
        if (r.win) { if (log) log.textContent = '🏆 Победа! +' + (r.rewards?r.rewards.exp:0) + 'XP'; this.updateDisplay(); var self = this; setTimeout(function() { self.arena(); }, 1500); }
        else if (r.win === false) { if (log) log.textContent = '💀 Поражение'; var self = this; setTimeout(function() { self.arena(); }, 1500); }
        else { if (log) log.textContent = '-' + r.playerDamage + ' | Враг: -' + (r.opponentDamage||0); this._showArenaMatch(); }
    },
    _arenaFlee: function() { Sherwood.Arena.fleeMatch(); this.arena(); },

    // ========== РЫНОК ==========
    market: function() {
        this._playSound('click');
        if (!Sherwood.BlackMarket) { this._showPlaceholder('💰 Рынок', 'market'); return; }
        var items = Sherwood.BlackMarket.getShopItems();
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            html += '<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;">';
            html += '<img src="' + item.icon + '" style="width:44px;height:44px;object-fit:contain;border-radius:4px;" onerror="this.src=\'assets/interface/labyrinth_of_icons.png\'">';
            html += '<div style="flex:1;"><div style="color:#e0c080;">' + item.name + '</div><div style="color:#aaa;font-size:0.7em;">' + (item.type==='consumable'?'Расходник':item.type==='resource'?'Ресурс':'Экипировка') + '</div></div>';
            html += '<div style="text-align:right;"><div style="color:' + (item.currency==='gold'?'#ffd700':'#c0c0c0') + ';">' + item.price + ' ' + (item.currency==='gold'?'🪙':'⚪') + '</div><button onclick="SherwoodUI._buyItem(' + item.shopIndex + ')" style="margin-top:4px;background:#c9a040;border:none;border-radius:4px;padding:4px 10px;color:#000;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.7em;">Купить</button></div></div>';
        }
        this._openScreen('💰 Рынок', 'market', (html||'<div style="color:#aaa;text-align:center;">Товаров нет</div>') + '<div id="market-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>');
    },
    _buyItem: function(i) {
        var r = Sherwood.BlackMarket.buyItem(i); var log = document.getElementById('market-log');
        if (r.success) { if (log) log.textContent = '✅ Куплено!'; this.updateDisplay(); }
        else { if (log) log.textContent = '❌ ' + (r.reason||'Ошибка'); }
        var self = this; setTimeout(function() { self.market(); }, 800);
    },

    // ========== ЧАТ ==========
    chat: function() {
        this._playSound('click');
        if (!Sherwood.Chat) { this._showPlaceholder('💬 Чат', 'chat'); return; }
        var msgs = Sherwood.Chat.getRecentMessages(50);
        var html = '';
        for (var i = 0; i < msgs.length; i++) {
            var m = msgs[i];
            if (m.isSystem) html += '<div style="color:#888;font-size:0.75em;text-align:center;margin:4px 0;">[' + m.time + '] ' + m.text + '</div>';
            else {
                var me = m.sender === Sherwood.Chat.getUsername();
                html += '<div style="margin-bottom:6px;display:flex;flex-direction:column;align-items:' + (me?'flex-end':'flex-start') + ';">';
                html += '<div style="color:#c9a040;font-size:0.65em;">' + m.sender + ' <span style="color:#666;">' + m.time + '</span></div>';
                html += '<div style="background:' + (me?'rgba(201,168,76,0.2)':'rgba(255,255,255,0.08)') + ';border-radius:8px;padding:6px 10px;color:#ddd;font-size:0.8em;max-width:80%;word-break:break-word;">' + m.text + '</div></div>';
            }
        }
        var content = '<div style="display:flex;flex-direction:column;height:100%;"><div id="chat-msgs" style="flex:1;background:rgba(0,0,0,0.5);border-radius:8px;padding:12px;margin-bottom:8px;overflow-y:auto;color:#ccc;font-size:0.85em;min-height:300px;">' + (html||'<div style="color:#666;text-align:center;">Пусто</div>') + '</div><div style="display:flex;gap:8px;"><input id="chat-input" placeholder="Сообщение..." style="flex:1;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:8px;padding:10px;color:#fff;font-family:\'Georgia\',serif;font-size:0.85em;" onkeydown="if(event.key===\'Enter\')SherwoodUI._sendChat()"><button onclick="SherwoodUI._sendChat()" style="background:transparent;border:none;cursor:pointer;padding:0;width:44px;height:44px;"><img src="assets/all_buttons/send_text.png" style="width:100%;height:100%;object-fit:contain;"></button></div></div>';
        this._openScreen('💬 Чат', 'chat', content);
        var self = this;
        setTimeout(function() { var el = document.getElementById('chat-msgs'); if (el) el.scrollTop = el.scrollHeight; }, 100);
    },
    _sendChat: function() {
        var inp = document.getElementById('chat-input'); if (!inp) return;
        var t = inp.value.trim(); if (!t) return;
        inp.value = '';
        Sherwood.Chat.sendMessage(t);
        this.chat();
    },

    // ========== ПРОФИЛЬ ==========
    profile: function() {
        this._playSound('click');
        var p = Sherwood.getPlayer();
        var eq = Sherwood.Bag ? Sherwood.Bag.getEquipment() : {};
        var ring = eq.ring, amulet = eq.amulet;
        var trophies = p.trophies || [];
        var lastTrophy = trophies.length > 0 ? trophies[trophies.length-1].name : 'Нет трофеев';
        var h = '<div style="text-align:center;margin-bottom:12px;"><img src="assets/hero_skins/skin_1_basic.png" style="width:80px;height:80px;border-radius:50%;border:2px solid #c9a040;"><div style="color:#e0c080;font-weight:bold;margin-top:4px;">' + p.name + '</div><div style="color:#aaa;">Уровень ' + p.level + '</div></div>';
        h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(0,0,0,0.4);border-radius:10px;padding:12px;margin-bottom:12px;">';
        h += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="' + this._statIcons.attack + '" style="width:22px;height:22px;"><span style="color:#f44336;">' + p.stats.attack + '</span></div>';
        h += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="' + this._statIcons.defense + '" style="width:22px;height:22px;"><span style="color:#2196f3;">' + p.stats.defense + '</span></div>';
        h += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="' + this._statIcons.agility + '" style="width:22px;height:22px;"><span style="color:#ff9800;">' + p.stats.agility + '</span></div>';
        h += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="' + this._statIcons.hp + '" style="width:22px;height:22px;"><span style="color:#4caf50;">' + p.stats.hp + '</span></div></div>';
        h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">';
        h += '<div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;border:2px solid #c9a040;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo(\'trophies\')"><img src="assets/all_trophies/trophies_chapters/chapter_1_broken_hunting_horn_of_the_league.png" style="width:32px;height:32px;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">' + lastTrophy + '</div></div>';
        h += '<div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;border:2px solid #ffd700;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo(\'ring\')"><img src="assets/interface/ring_first_level.png" style="width:32px;height:32px;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">' + (ring?ring.name:'Пусто') + '</div></div>';
        h += '<div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;border:2px solid #9c27b0;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo(\'amulet\')"><img src="assets/interface/sherwood_amulet_level_one.png" style="width:32px;height:32px;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">' + (amulet?amulet.name:'Пусто') + '</div></div></div>';
        h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
        h += '<button onclick="SherwoodUI._previousScreen=\'profile\';SherwoodUI.training();" style="background:rgba(255,152,0,0.2);border:1px solid #ff9800;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;"><img src="assets/all_buttons/training.png" style="width:24px;height:24px;display:block;margin:0 auto 4px;">Тренировка</button>';
        h += '<button onclick="SherwoodUI._previousScreen=\'profile\';SherwoodUI.forge();" style="background:rgba(121,85,72,0.2);border:1px solid #795548;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;"><img src="assets/all_buttons/forge.png" style="width:24px;height:24px;display:block;margin:0 auto 4px;">Кузница</button>';
        h += '<button onclick="SherwoodUI._previousScreen=\'profile\';SherwoodUI.bestiary();" style="background:rgba(96,125,139,0.2);border:1px solid #607d8b;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;"><img src="assets/all_buttons/bestiary.png" style="width:24px;height:24px;display:block;margin:0 auto 4px;">Бестиарий</button></div>';
        h += '<div id="profile-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;"></div>';
        this._openScreen('👤 Профиль', 'profile', h);
    },
    _showProfileInfo: function(type) {
        var info = document.getElementById('profile-info'); if (!info) return;
        if (type === 'trophies') { var t = Sherwood.getPlayer().trophies || []; info.innerHTML = t.length ? t.map(function(x) { return '🏆 ' + x.name; }).join(' | ') : '🏆 Трофеев нет'; }
        else if (type === 'ring') { var r = Sherwood.Bag ? Sherwood.Bag.getEquipment().ring : null; info.innerHTML = r ? '💍 ' + r.name + ' (Ур.' + (r.level||1) + ')' : '💍 Кольцо не надето'; }
        else if (type === 'amulet') { var a = Sherwood.Bag ? Sherwood.Bag.getEquipment().amulet : null; info.innerHTML = a ? '📿 ' + a.name + ' (Ур.' + (a.level||1) + ')' : '📿 Амулет не надет'; }
    },
        // ========== ТРЕНИРОВКА ==========
    training: function() {
        var goBack = this._previousScreen === 'profile' ? 'SherwoodUI.profile()' : 'SherwoodUI.loadHome()';
        this._previousScreen = null;
        this._playSound('click');
        var p = Sherwood.getPlayer();
        var tl = p.trainingLevels || {};
        var stats = ['attack','defense','hp','agility'];
        var names = { attack:'Атака', defense:'Защита', hp:'Здоровье', agility:'Ловкость' };
        var colors = { attack:'#f44336', defense:'#2196f3', hp:'#4caf50', agility:'#ff9800' };
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
        for (var i = 0; i < stats.length; i++) {
            var s = stats[i]; var lvl = tl[s] || 0;
            html += '<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:12px;text-align:center;">';
            html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;"><img src="' + this._statIcons[s] + '" style="width:28px;height:28px;"><span style="color:#e0c080;">' + names[s] + '</span></div>';
            html += '<div style="color:#aaa;font-size:0.8em;">Ур. ' + lvl + '/200</div>';
            html += '<div style="color:' + colors[s] + ';font-size:0.7em;">+' + (s==='hp'?10:s==='agility'?1:2) + ' за ур.</div>';
            html += '<button onclick="SherwoodUI._doTraining(\'' + s + '\')" style="margin-top:8px;background:#c9a040;border:none;border-radius:4px;padding:6px 16px;color:#000;cursor:pointer;font-family:\'Georgia\',serif;font-size:0.8em;">Тренировать</button></div>';
        }
        html += '</div><div id="training-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;"></div>';
        this._openScreen('💪 Тренировка', 'training', html, goBack);
    },
        _doTraining: function(stat) {
        var p = Sherwood.getPlayer(); if (!p) return;
        if (!p.trainingLevels) p.trainingLevels = { attack:0, defense:0, hp:0, agility:0 };
        var cur = p.trainingLevels[stat] || 0;
        if (cur >= 200) { var log = document.getElementById('training-log'); if (log) log.textContent = '❌ Макс. уровень!'; return; }
        var cost = Math.round(10 * Math.pow(cur + 1, 1.15));
        var currency = 'silver';
        if ((p.resources.silver || 0) < cost) {
            var log = document.getElementById('training-log');
            if (log) log.textContent = '❌ Нужно ' + cost + ' серебра!';
            return;
        }
        p.resources.silver -= cost;
        p.trainingLevels[stat] = cur + 1;
        if (Sherwood._recalcStats) Sherwood._recalcStats();
        if (Sherwood.saveGame) Sherwood.saveGame();
        this.updateDisplay();
        this.training();
        var log = document.getElementById('training-log');
        if (log) log.textContent = '✅ ' + stat + ' → ' + (cur+1) + ' ( -' + cost + ' серебра)';
    },

    // ========== КУЗНИЦА ==========
    forge: function() {
        var goBack = this._previousScreen === 'profile' ? 'SherwoodUI.profile()' : 'SherwoodUI.loadHome()';
        this._previousScreen = null;
        this._playSound('click');
        if (!Sherwood.Forge) { this._showPlaceholder('⚒️ Кузница', 'forge', goBack); return; }
        var items = Sherwood.Bag ? Sherwood.Bag.getItems() : [];
        var enhanceItems = items.filter(function(i) { return i.part || i.type === 'equipment'; });
        var skins = Sherwood.Forge.getCraftSkins();
        var player = Sherwood.getPlayer();
        var unlocked = player.unlockedSkins || [];
        var active = player.activeSkin || 'skin_1_basic';
        var html = '<div style="margin-bottom:12px;"><div style="color:#e0c080;margin-bottom:4px;">⚒️ Заточка</div>';
        for (var i = 0; i < enhanceItems.length; i++) {
            var item = enhanceItems[i]; var idx = items.indexOf(item); var lvl = item.enhancement || 0;
            html += '<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:6px;padding:8px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;"><div><div style="color:#e0c080;font-size:0.8em;">' + item.name + '</div><div style="color:#aaa;font-size:0.6em;">Заточка: +' + lvl + '</div></div><button onclick="SherwoodUI._enhanceItem(' + idx + ')" style="background:#c9a040;border:none;border-radius:4px;padding:4px 10px;color:#000;cursor:pointer;font-size:0.7em;">Точить</button></div>';
        }
        html += enhanceItems.length === 0 ? '<div style="color:#aaa;font-size:0.7em;">Нет предметов</div>' : '';
        html += '</div><div><div style="color:#e0c080;margin-bottom:4px;">🎨 Облики</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">';
        for (var i = 0; i < skins.length; i++) {
            var skin = skins[i]; var owned = unlocked.indexOf(skin.id) !== -1; var isActive = active === skin.id;
            html += '<div style="background:rgba(0,0,0,0.5);border:2px solid ' + (isActive?'#ffd700':owned?'#4caf50':'#555') + ';border-radius:8px;padding:8px;text-align:center;">';
            html += '<img src="' + skin.icon + '" style="width:48px;height:48px;object-fit:contain;border-radius:4px;" onerror="this.src=\'assets/hero_skins/skin_1_basic.png\'">';
            html += '<div style="color:#e0c080;font-size:0.7em;">' + skin.name + '</div>';
            if (owned) {
                html += isActive ? '<div style="color:#ffd700;font-size:0.6em;">Активен</div>' : '<button onclick="SherwoodUI._equipSkin(\'' + skin.id + '\')" style="margin-top:4px;background:#4caf50;border:none;border-radius:4px;padding:3px 8px;color:#fff;cursor:pointer;font-size:0.6em;">Надеть</button>';
            } else {
                html += '<div style="color:#aaa;font-size:0.55em;">' + skin.cost.ingots + ' сл. ' + skin.cost.scrolls + ' скр. ' + skin.cost.silver + ' сер.</div>';
                html += '<button onclick="SherwoodUI._craftSkin(\'' + skin.id + '\')" style="margin-top:4px;background:#ff9800;border:none;border-radius:4px;padding:3px 8px;color:#fff;cursor:pointer;font-size:0.6em;">Создать</button>';
            }
            html += '</div>';
        }
        html += '</div></div><div id="forge-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>';
        this._openScreen('⚒️ Кузница', 'forge', html, goBack);
    },
    _enhanceItem: function(idx) {
        var r = Sherwood.Forge.enhanceItem(idx); var log = document.getElementById('forge-log');
        if (r.enhanced) { if (log) log.textContent = '✅ Улучшено! +' + r.newLevel; }
        else if (r.broken) { if (log) log.textContent = '💔 Сломано!'; }
        else if (r.failed) { if (log) log.textContent = '❌ Неудача'; }
        else { if (log) log.textContent = '❌ ' + (r.reason||'Ошибка'); }
        this.updateDisplay(); var self = this; setTimeout(function() { self.forge(); }, 800);
    },
    _craftSkin: function(sid) {
        var r = Sherwood.Forge.craftSkin(sid); var log = document.getElementById('forge-log');
        if (r.success) { if (log) log.textContent = '✅ Облик создан!'; }
        else { if (log) log.textContent = '❌ ' + (r.reason||'Ошибка'); }
        this.updateDisplay(); var self = this; setTimeout(function() { self.forge(); }, 800);
    },
    _equipSkin: function(sid) {
        Sherwood.Forge.equipSkin(sid);
        var heroImg = document.querySelector('.hero-frame img');
        if (heroImg) heroImg.src = 'assets/hero_skins/' + sid + '.png';
        this.forge();
    },

    // ========== БЕСТИАРИЙ ==========
    bestiary: function() {
        var goBack = this._previousScreen === 'profile' ? 'SherwoodUI.profile()' : 'SherwoodUI.loadHome()';
        this._previousScreen = null;
        this._playSound('click');
        if (!Sherwood.Bestiary) { this._showPlaceholder('📖 Бестиарий', 'bestiary', goBack); return; }
        var progress = Sherwood.Bestiary.getDiscoveryProgress();
        var zones = ['Проклятая чаща','Первородное болото','Базальтовые шахты','Квест','Рейд'];
        var html = '<div style="text-align:center;margin-bottom:8px;color:#aaa;">📖 Открыто: ' + progress.discovered + '/' + progress.total + ' (' + progress.percent + '%)</div>';
        html += '<div style="background:rgba(0,0,0,0.3);border-radius:6px;height:10px;margin-bottom:12px;overflow:hidden;"><div style="background:#c9a040;height:100%;width:' + progress.percent + '%;"></div></div>';
        for (var z = 0; z < zones.length; z++) {
            var beasts = Sherwood.Bestiary.getBeastsByZone(zones[z]);
            if (beasts.length === 0) continue;
            html += '<div style="color:#e0c080;font-weight:bold;margin:10px 0 6px;">📍 ' + zones[z] + '</div>';
            for (var i = 0; i < beasts.length; i++) {
                var b = beasts[i]; var disc = b.kills > 0;
                html += '<div style="background:rgba(0,0,0,0.5);border:1px solid ' + (disc?'#4caf50':'#555') + ';border-radius:8px;padding:8px;margin-bottom:4px;display:flex;align-items:center;gap:8px;">';
                html += '<img src="assets/all_beasts/' + b.id + '" style="width:40px;height:40px;object-fit:contain;border-radius:4px;' + (disc?'':'filter:grayscale(1);opacity:0.5;') + '" onerror="this.src=\'assets/interface/labyrinth_of_icons.png\'">';
                html += '<div style="flex:1;"><div style="color:' + (disc?'#fff':'#888') + ';">' + (disc?b.name:'???') + '</div><div style="color:#aaa;font-size:0.6em;">' + b.floor + ' | ' + b.type + '</div></div>';
                html += '<div style="color:#aaa;font-size:0.7em;">Убито: ' + b.kills + '</div></div>';
            }
        }
        this._openScreen('📖 Бестиарий', 'bestiary', html || '<div style="color:#aaa;text-align:center;">Бестиарий пуст</div>', goBack);
    },

    // ========== НАСТРОЙКИ ==========
    settings: function() {
        this._playSound('click');
        var p = Sherwood.getPlayer(); var nm = p ? p.name : 'Охотник';
        var h = '<div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;"><div style="color:#fff;margin-bottom:8px;">👤 Имя</div><div style="display:flex;gap:8px;"><input id="pni" value="' + nm + '" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:6px;padding:8px 12px;color:#fff;font-family:\'Georgia\',serif;font-size:0.9em;"><button onclick="SherwoodUI._changePlayerName()" style="background:#c9a040;border:none;border-radius:6px;padding:8px 16px;color:#000;font-weight:bold;cursor:pointer;font-family:\'Georgia\',serif;">Сохранить</button></div><div id="name-status" style="color:#aaa;font-size:0.7em;margin-top:4px;"></div></div>';
        h += '<div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="color:#fff;">🔊 Звуки</span><label style="position:relative;width:50px;height:26px;background:' + (this._soundEnabled?'#4caf50':'#555') + ';border-radius:13px;cursor:pointer;"><input type="checkbox" ' + (this._soundEnabled?'checked':'') + ' onchange="SherwoodUI._toggleSound(this.checked)" style="display:none;"><span style="position:absolute;top:2px;left:' + (this._soundEnabled?'26px':'2px') + ';width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span></label></div><div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#fff;">🎵 Музыка</span><label style="position:relative;width:50px;height:26px;background:' + (this._musicEnabled?'#4caf50':'#555') + ';border-radius:13px;cursor:pointer;"><input type="checkbox" ' + (this._musicEnabled?'checked':'') + ' onchange="SherwoodUI._toggleMusic(this.checked)" style="display:none;"><span style="position:absolute;top:2px;left:' + (this._musicEnabled?'26px':'2px') + ';width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span></label></div></div>';
        h += '<button onclick="SherwoodUI._exitGame()" style="width:100%;background:#f44336;border:none;border-radius:8px;padding:12px;color:#fff;font-weight:bold;font-size:1em;cursor:pointer;font-family:\'Georgia\',serif;">🚪 Выйти</button>';
        this._openScreen('⚙️ Настройки', 'settings', h);
    },
    _changePlayerName: function() {
        var inp = document.getElementById('pni'); var st = document.getElementById('name-status'); if (!inp||!st) return;
        var nm = inp.value.trim(); if (!nm) { st.textContent = '❌ Пустое имя'; st.style.color = '#f44336'; return; }
        var p = Sherwood.getPlayer(); if (p) { p.name = nm; Sherwood.saveGame(); if (Sherwood.Chat) Sherwood.Chat.setUsername(nm); st.textContent = '✅ Сохранено!'; st.style.color = '#4caf50'; }
    },
    _toggleSound: function(en) { this._soundEnabled = en; this._saveAudioSettings(); if (!en) { for (var k in this._sounds) { this._sounds[k].pause(); this._sounds[k].currentTime = 0; } } this.settings(); },
    _toggleMusic: function(en) { this._musicEnabled = en; this._saveAudioSettings(); if (!en) this._stopMusic(); else this._playMusic('forest_ambient'); this.settings(); },
    _exitGame: function() { if (confirm('Выйти?')) { if (Sherwood.saveGameNow) Sherwood.saveGameNow(); else if (Sherwood.saveGame) Sherwood.saveGame(); this._stopMusic(); window.location.href = 'about:blank'; } },

    // ========== СУМКА ==========
    bag: function() {
        this._playSound('click');
        var bag = Sherwood.Bag; var items = bag ? bag.getItems() : []; var max = bag ? bag.getMaxSlots() : 10;
        var h = '';
        for (var i = 0; i < max; i++) {
            var item = items[i];
            if (item) {
                var gc = Sherwood.GradeColors ? Sherwood.GradeColors[item.grade] : '#9d9d9d';
                h += '<div onclick="SherwoodUI._bagAction(' + i + ')" style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid ' + gc + ';border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;cursor:pointer;padding:4px;"><img src="' + (item.icon||'assets/interface/labyrinth_of_icons.png') + '" style="width:32px;height:32px;object-fit:contain;">' + (item.quantity > 1 ? '<span style="position:absolute;bottom:2px;right:4px;color:#fff;font-size:0.6em;background:rgba(0,0,0,0.7);padding:0 4px;border-radius:4px;">' + item.quantity + '</span>' : '') + '</div>';
            } else {
                h += '<div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid #333;border-radius:6px;display:flex;align-items:center;justify-content:center;opacity:0.4;"><span style="color:#555;font-size:0.6em;">пусто</span></div>';
            }
        }
        var c = '<div style="color:#aaa;font-size:0.8em;margin-bottom:12px;">' + items.length + '/' + max + '</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-width:340px;margin:0 auto;">' + h + '</div><div id="bag-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;min-height:20px;">Нажми на предмет</div>';
        this._openScreen('🎒 Сумка', 'bag', c);
    },
    _bagAction: function(i) {
        var bag = Sherwood.Bag; if (!bag) return; var items = bag.getItems(); if (i >= items.length) return; var item = items[i]; if (!item) return;
        var info = document.getElementById('bag-info'); if (!info) return;
        var a = '';
        if (item.part) a += '<button onclick="Sherwood.Bag.equipItem(' + i + ');SherwoodUI.bag();" style="background:#4caf50;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:\'Georgia\',serif;">Надеть</button>';
        a += '<button onclick="Sherwood.Bag.sellItem(' + i + ');SherwoodUI.bag();" style="background:#ff9800;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:\'Georgia\',serif;">Продать</button>';
        a += '<button onclick="Sherwood.Bag.dismantleItem(' + i + ');SherwoodUI.bag();" style="background:#f44336;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;font-family:\'Georgia\',serif;">Разобрать</button>';
        info.innerHTML = '<div style="color:#fff;font-size:0.9em;">' + (item.name||'Предмет') + '</div><div style="color:#aaa;font-size:0.7em;">' + (item.grade||'обычный') + '</div><div style="margin-top:6px;">' + a + '</div>';
    },

    // ========== ПЛЕЙСХОЛДЕРЫ ==========
    daily: function() { this._showPlaceholder('📋 Ежедневные задания', 'daily'); },

    _showPlaceholder: function(title, bgKey, backAction) {
        this._playSound('click');
        this._openScreen(title, bgKey, '<div style="text-align:center;padding:40px 0;"><div style="font-size:3em;margin-bottom:16px;">🏗️</div><div style="font-size:1.2em;color:#e0c080;margin-bottom:8px;">' + title + '</div><div style="font-size:0.7em;color:#888;">В разработке</div></div>', backAction);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof SherwoodUI !== 'undefined' && SherwoodUI.init) SherwoodUI.init();
});

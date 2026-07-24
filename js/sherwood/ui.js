const SherwoodUI = {
    _bg: {
        main: 'assets/backgrounds/homepage_screen.jpeg', bag: 'assets/backgrounds/bag.jpeg', profile: 'assets/backgrounds/character_page.jpeg',
        bestiary: 'assets/backgrounds/character_page.jpeg', quests: 'assets/backgrounds/skill_page.jpeg', training: 'assets/backgrounds/training.jpeg',
        forge: 'assets/backgrounds/forge.jpeg', tavern: 'assets/backgrounds/tavern.jpeg', market: 'assets/backgrounds/market.jpeg',
        arena: 'assets/backgrounds/arena.jpeg', raid: 'assets/backgrounds/background_raid.png', settings: 'assets/backgrounds/settings_page.jpeg',
        daily: 'assets/backgrounds/tasks.jpeg', portal: 'assets/backgrounds/portal_1.jpeg', chat: 'assets/backgrounds/chat_background.png',
        dungeon_select: 'assets/backgrounds/underground_1_floor_1.jpg', dungeon_forest: 'assets/backgrounds/underground_1_floor_1.jpg',
        dungeon_swamp: 'assets/backgrounds/underground_2_floor_1.jpeg', dungeon_cave: 'assets/backgrounds/underground_3_floor_1.jpeg',
        dungeon_fight: 'assets/backgrounds/underground_1_floor_1.jpg'
    },
    _statIcons: { attack: 'assets/interface/icon_power.png', defense: 'assets/interface/icon_defense.png', agility: 'assets/interface/icon_dexterity.png', hp: 'assets/interface/icon_health.png' },
    _sounds: {}, _currentMusic: null, _currentMusicKey: null, _soundEnabled: true, _musicEnabled: true,
    _audioFiles: {
        'forest_ambient': 'assets/sounds/main_topic.ogg', 'dungeon_ambient': 'assets/sounds/subway_1.wav', 'tavern_ambient': 'assets/sounds/tavern_ambient.wav',
        'click': 'assets/sounds/button_click.ogg', 'shot': 'assets/sounds/normal_hit.flac', 'arrow_hit': 'assets/sounds/normal_hit.flac',
        'victory': 'assets/sounds/level_completed.wav', 'defeat': 'assets/sounds/defeat.wav', 'levelup': 'assets/sounds/levelup.wav',
        'chest_open': 'assets/sounds/chest_opens.wav', 'trap': 'assets/sounds/trap.wav', 'dungeon_enter': 'assets/sounds/subway_1.wav',
        'altar': 'assets/sounds/altar_underground.mp3', 'loot_drop': 'assets/sounds/loot_drop.wav', 'bottle_health': 'assets/sounds/bottle_health.mp3', 'forge': 'assets/sounds/forge.wav'
    },
    _previousScreen: null, _dungeon: null, _dailyTab: 1,

    init: function() {
        this.container = document.getElementById('game-container'); if (!this.container) return;
        this._screenLayer = document.createElement('div'); this._screenLayer.id = 'screen-layer';
        this._screenLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;display:none;';
        this.container.appendChild(this._screenLayer);
        this._mainElements = ['.bg-layer', '.arch-layer', '.hero-frame', '.top-panel', '.left-buttons', '.right-buttons', '.bottom-stats'];
        this._initSounds(); this.bindButtons(); this.bindPlayButton(); this.updateDisplay();
        if (typeof Sherwood !== 'undefined') {
            Sherwood.on('RESOURCE_CHANGED', function() { SherwoodUI.updateDisplay(); });
            Sherwood.on('PLAYER_LEVEL_UP', function() { SherwoodUI._playSound('levelup'); SherwoodUI.updateDisplay(); });
        }
        this._loadAudioSettings();
    },

    _initSounds: function() { for (var k in this._audioFiles) { var a = new Audio(this._audioFiles[k]); a.preload = 'auto'; a.volume = 0.5; this._sounds[k] = a; } },
    _playSound: function(k) { if (!this._soundEnabled) return; var s = this._sounds[k]; if (s) { s.currentTime = 0; s.play().catch(function() {}); } },
    _playMusic: function(k) { if (!this._musicEnabled) return; if (this._currentMusicKey === k && this._currentMusic && !this._currentMusic.paused) return; this._stopMusic(); var m = this._sounds[k]; if (m) { m.loop = true; m.volume = 0.3; m.currentTime = 0; m.play().catch(function() {}); this._currentMusic = m; this._currentMusicKey = k; } },
    _stopMusic: function() { if (this._currentMusic) { this._currentMusic.pause(); this._currentMusic.currentTime = 0; this._currentMusic = null; this._currentMusicKey = null; } },
    _saveAudioSettings: function() { localStorage.setItem('sherwood_audio', JSON.stringify({ sound: this._soundEnabled, music: this._musicEnabled })); },
    _loadAudioSettings: function() { var s = localStorage.getItem('sherwood_audio'); if (s) { try { var d = JSON.parse(s); this._soundEnabled = d.sound !== false; this._musicEnabled = d.music !== false; } catch(e) {} } },

    bindButtons: function() {
        var self = this;
        document.querySelectorAll('#mainInterface .btn[data-action]').forEach(function(el) {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                var a = el.dataset.action;
                if (a && typeof self[a] === 'function') { self._playSound('click'); self[a](); }
            });
        });
    },
    bindPlayButton: function() {
        var self = this;
        var btn = document.getElementById('playBtn');
        if (btn) btn.addEventListener('click', function() {
            self._playSound('click');
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('mainInterface').classList.add('active');
            self._playMusic('forest_ambient');
        });
    },

    updateDisplay: function() {
        var p = (typeof Sherwood !== 'undefined' && Sherwood.getPlayer) ? Sherwood.getPlayer() : null;
        if (!p) return;
        var g = document.getElementById('gold-display'), s = document.getElementById('silver-display'), e = document.getElementById('exp-display'), em = document.getElementById('exp-max-display');
        if (g) g.textContent = this._fmt(p.resources ? p.resources.gold || 0 : 0);
        if (s) s.textContent = this._fmt(p.resources ? p.resources.silver || 0 : 0);
        if (e) e.textContent = this._fmt(p.exp || 0);
        if (em) em.textContent = this._fmt(p.expToLevel || 100);
        var ae = document.querySelector('.stat-value.attack'), de = document.querySelector('.stat-value.defense'), ge = document.querySelector('.stat-value.agility'), he = document.querySelector('.stat-value.hp');
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
        this._playSound('click'); this._playMusic('dungeon_ambient');
        var dungeons = Sherwood.Dungeon ? Sherwood.Dungeon.getAvailable() : {};
        var list = '';
        for (var id in dungeons) {
            var d = dungeons[id];
            var progress = (Sherwood.Dungeon._progress && Sherwood.Dungeon._progress[id]) ? Sherwood.Dungeon._progress[id] : { level: 1 };
            var tp = 'assets/dungeon_tiles/' + d.tiles + '/tiles', te = d.ext || '.jpeg';
            if (d.tiles === 'dungeon2') tp = 'assets/dungeon_tiles/dungeon2/tiles2.';
            if (d.tiles === 'dungeon3') tp = 'assets/dungeon_tiles/dungeon3/tiles3.';
            list += '<div style="background:url(\'assets/backgrounds/skill_page.jpeg\') center/cover no-repeat;border:1px solid #555;border-radius:12px;padding:14px;margin-bottom:12px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:0;"></div><div style="position:relative;z-index:1;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:60px;height:60px;border-radius:10px;background:url(\'' + d.bg + '\') center/cover no-repeat;border:2px solid #c9a040;flex-shrink:0;"></div><div><div style="color:#e0c080;font-size:1.1em;font-weight:bold;">' + d.name + '</div><div style="color:#aaa;font-size:0.75em;">' + (d.icon||'') + ' Уровень ' + (progress.level||1) + '/7</div></div></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">';
            for (var lvl = 1; lvl <= 7; lvl++) {
                var unlocked = lvl <= (progress.level || 1);
                var img = unlocked ? (tp + lvl + te) : 'assets/interface/closed_level_lock_icon.png';
                list += '<div onclick="' + (unlocked ? 'SherwoodUI._startDungeon(\'' + id + '\',' + lvl + ')' : '') + '" style="width:48px;height:48px;background-image:url(\'' + img + '\');background-size:cover;background-position:center;border:2px solid ' + (unlocked ? '#c9a040' : '#555') + ';border-radius:6px;cursor:' + (unlocked ? 'pointer' : 'default') + ';display:flex;align-items:center;justify-content:center;position:relative;"><span style="position:absolute;bottom:1px;right:3px;font-size:0.6em;color:' + (unlocked ? '#000' : '#888') + ';">' + lvl + '</span></div>';
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
        this._playSound('dungeon_enter'); this._playMusic('dungeon_ambient');
        this._renderDungeon();
    },

    _showNotification: function(msg) { var log = document.getElementById('dungeon-log'); if (log) { log.textContent = msg; log.style.color = '#f44336'; setTimeout(function() { log.style.color = '#aaa'; }, 2000); } },

    _renderDungeon: function() {
        var d = Sherwood.Dungeon.getDungeon();
        if (!d) { this.showDungeon(); return; }
        var dungeons = Sherwood.Dungeon.getAvailable();
        var dd = dungeons[d.id] || { bg: this._bg.dungeon_forest, tiles: 'dungeon1', ext: '.jpeg' };
        this.container.style.background = "url('" + dd.bg + "') center/cover no-repeat";
        this._mainElements.forEach(function(sel) { document.querySelectorAll(sel).forEach(function(el) { el.style.display = 'none'; }); });
        var size = d.size, cs = Math.min(50, Math.floor((this.container.clientWidth - 16) / size));
        var floorBg = "assets/dungeon_tiles/" + dd.tiles + "/" + dd.tiles + "tiles.png";
        var tp = "assets/dungeon_tiles/" + dd.tiles + "/tiles", te = dd.ext;
        if (dd.tiles === 'dungeon2') tp = "assets/dungeon_tiles/dungeon2/tiles2.";
        if (dd.tiles === 'dungeon3') tp = "assets/dungeon_tiles/dungeon3/tiles3.";
        var chestIcons = {
            forest: { closed: 'assets/interface/locked_chest_first_dungeon.png', open: 'assets/interface/open_chest_first_dungeon.png' },
            swamp: { closed: 'assets/interface/locked_chest_second_dungeon.png', open: 'assets/interface/open_chest_of_the_second_dungeon.png' },
            cave: { closed: 'assets/interface/locked_chest_third_dungeon.png', open: 'assets/interface/open_chest_third_dungeon.png' }
        };
        var altarIcons = { forest: 'assets/interface/altar_of_the_first_dungeon.png', swamp: 'assets/interface/altar_of_the_second_dungeon.png', cave: 'assets/interface/the_third_altar_of_the_dungeon.png' };
        var cauldronIcons = { forest: 'assets/interface/cauldron_first_dungeon.png', swamp: 'assets/interface/cauldron_of_the_second_dungeon.png', cave: 'assets/interface/the_third_cauldron_of_the_dungeon.png' };
        var completeIcons = { forest: 'assets/interface/exit_completion_dungeon.png', swamp: 'assets/interface/completion_of_the_second_underground_level.png', cave: 'assets/interface/completion_of_level_three_subway.png' };
        var ci = chestIcons[d.id] || chestIcons['forest'];
        var ai = altarIcons[d.id] || altarIcons['forest'];
        var cai = cauldronIcons[d.id] || cauldronIcons['forest'];
        var compi = completeIcons[d.id] || completeIcons['forest'];
        var rowVariants = [];
        for (var r = 0; r < size; r++) { rowVariants.push(Math.random() < 0.5 ? ' scaleX(-1)' : (Math.random() < 0.5 ? ' scaleY(-1)' : 'none')); }
        var gridW = cs * size;
        var html = '<div style="position:relative;width:' + gridW + 'px;height:' + gridW + 'px;margin:0 auto;">';
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                var cell = d.grid[y][x];
                if (cell.open) html += '<div style="position:absolute;left:' + (x*cs) + 'px;top:' + (y*cs) + 'px;width:' + cs + 'px;height:' + cs + 'px;background-image:url(\'' + floorBg + '\');background-size:cover;background-position:center;transform:' + rowVariants[y] + ';z-index:0;"></div>';
            }
        }
        html += '<div style="position:relative;z-index:1;">';
        for (var y = 0; y < size; y++) {
            html += '<div style="display:flex;gap:0;margin:0;">';
            for (var x = 0; x < size; x++) {
                var cell = d.grid[y][x], isPlayer = (d.px === x && d.py === y);
                var bg = '', border = 'rgba(255,255,255,0.08)', content = '', cursor = '', onclick = '';
                if (cell.open) {
                    bg = 'transparent'; border = 'rgba(255,255,255,0.04)';
                    if (cell.monster) { content = '<img src="assets/all_beasts/' + (cell.monsterId || 'image (1).png') + '" style="width:90%;height:90%;object-fit:contain;" onerror="this.style.display=\'none\'">'; border = cell.boss ? '#ff6a00' : '#f44336'; }
                    else if (cell.chest) { content = '<img src="' + (cell.looted ? ci.open : ci.closed) + '" style="width:80%;height:80%;object-fit:contain;">'; border = '#ffc107'; }
                    else if (cell.altar) { content = '<img src="' + ai + '" style="width:80%;height:80%;object-fit:contain;">'; border = '#9c27b0'; }
                    else if (cell.cauldron) { content = '<img src="' + cai + '" style="width:80%;height:80%;object-fit:contain;">'; border = '#4caf50'; }
                    else if (cell.exit) { content = '<img src="' + compi + '" style="width:80%;height:80%;object-fit:contain;">'; border = '#4caf50'; }
                    var adj = Math.abs(x-d.px)+Math.abs(y-d.py)===1;
                    if (adj && !isPlayer && !cell.monster) { cursor = 'cursor:pointer;'; onclick = 'onclick="SherwoodUI._dungeonMove(' + x + ',' + y + ')"'; border = '#4caf50'; }
                } else {
                    var tn = 1 + ((x*7+y*3)%14);
                    bg = "url('" + tp + tn + te + "')";
                    var adj = Math.abs(x-d.px)+Math.abs(y-d.py)===1;
                    if (adj) { cursor = 'cursor:pointer;'; onclick = 'onclick="SherwoodUI._dungeonMove(' + x + ',' + y + ')"'; border = '#4caf50'; }
                }
                if (isPlayer) { content = '<img src="assets/hero_skins/skin_1_basic.png" style="width:80%;height:80%;object-fit:contain;">'; border = '#ffd700'; bg = 'transparent'; }
                html += '<div ' + onclick + ' style="width:' + cs + 'px;height:' + cs + 'px;' + (bg==='transparent'?'':'background-image:'+bg+';background-size:cover;background-position:center;') + 'border:1px solid ' + border + ';display:flex;align-items:center;justify-content:center;font-size:' + (cs*0.35) + 'px;' + cursor + '">' + content + '</div>';
            }
            html += '</div>';
        }
        html += '</div></div>';
        var hp = Sherwood.getPlayer().stats.hp || 0;
        if (this._screenLayer) {
            this._screenLayer.innerHTML = '<div style="min-height:100%;background:rgba(0,0,0,0.5);padding:8px;display:flex;flex-direction:column;align-items:center;"><div style="width:100%;max-width:' + (gridW+20) + 'px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><button onclick="SherwoodUI._leaveDungeon()" style="background:transparent;border:none;cursor:pointer;padding:0;width:40px;height:40px;"><img src="assets/all_buttons/back.png" style="width:100%;height:100%;object-fit:contain;"></button><div style="color:#70a0e0;font-weight:bold;font-size:0.85em;">' + (d.id||'') + ' Ур.' + (d.level||1) + '</div><div style="color:#4caf50;font-size:0.85em;">❤️' + hp + '</div></div><div style="background:rgba(0,0,0,0.5);border-radius:6px;padding:4px;margin-bottom:6px;"><div style="display:flex;justify-content:space-around;font-size:10px;color:#aaa;"><span>👹 ' + (d.monstersKilled||0) + '/' + (d.totalMonsters||0) + '</span><span>📦 ' + (d.chestsOpened||0) + '</span><span>🚶 ' + (d.steps||0) + '</span></div></div>' + html + '<div id="dungeon-log" style="text-align:center;font-size:11px;color:#aaa;min-height:18px;margin-top:6px;background:rgba(0,0,0,0.6);border-radius:6px;padding:4px;"></div></div></div>';
            this._screenLayer.style.display = 'block';
        }
    },

    _dungeonMove: function(x, y) {
        var d = Sherwood.Dungeon.getDungeon(); if (!d) return;
        var r = Sherwood.Dungeon.move(x - d.px, y - d.py);
        if (!r || !r.ok) return;
        if (r.type === 'battle') { Sherwood.Combat.start(r.monsterId, r.boss, 'dungeon'); this._showCombatScreen(); return; }
        if (r.type === 'chest') { this._playSound('chest_open'); this.updateDisplay(); }
        if (r.type === 'altar') { this._playSound('altar'); var p = Sherwood.getPlayer(); p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + Math.floor(p.stats.maxHp * 0.2)); this.updateDisplay(); }
        if (r.type === 'cauldron') { this._playSound('bottle_health'); var p = Sherwood.getPlayer(); p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + Math.floor(p.stats.maxHp * 0.15)); this.updateDisplay(); }
        if (r.type === 'exit') { var reward = Sherwood.Dungeon.complete(); this.updateDisplay(); this._playSound('victory'); var self = this; setTimeout(function() { self.showDungeon(); }, 1500); return; }
        this._renderDungeon(); this.updateDisplay();
    },

    _leaveDungeon: function() { if (Sherwood.Dungeon) Sherwood.Dungeon.leave(); this._playMusic('forest_ambient'); this.showDungeon(); },

            // ========== БОЙ (ЕДИНЫЙ ДЛЯ ВСЕХ РЕЖИМОВ) ==========
    _showBattleScreen: function(enemyData, mode, modeTitle, extraInfo, onAttack, onFlee) {
        var e = enemyData, p = Sherwood.getPlayer();
        var ehp = Math.round((e.hp / e.maxHp) * 100), php = Math.round((p.stats.hp / p.stats.maxHp) * 100);
        var h = '<div style="text-align:center;">';
        h += '<div style="color:#e0c080;font-size:0.85em;margin-bottom:4px;">' + modeTitle + '</div>';
        // Рамка HP бестии
        h += '<div style="position:relative;width:280px;height:28px;margin:4px auto;">';
        h += '<img src="assets/interface/life_scale.png" style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:0;">';
        h += '<div style="position:absolute;top:3px;left:3px;right:3px;bottom:3px;overflow:hidden;z-index:1;">';
        h += '<div id="enemy-hp-bar" class="hp-burn" style="background:url(\'assets/interface/filling_the_beasts\'_health_bar.jpeg\') center/cover;height:100%;width:' + ehp + '%;transition:width 0.5s cubic-bezier(0.4,0,0.2,1);"></div>';
        h += '</div><span id="enemy-hp-text" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:0.7em;z-index:2;text-shadow:0 0 4px #000;font-weight:bold;">' + e.hp + '/' + e.maxHp + '</span></div>';
        // Название бестии
        h += '<div style="color:#f44336;font-weight:bold;font-size:1.1em;">' + e.name + '</div>';
        // Карта бестии
        h += '<div style="margin:8px 0;position:relative;display:inline-block;">';
        h += '<img src="assets/interface/frame_of_beasts.png" style="width:280px;height:280px;position:absolute;top:-14px;left:-14px;z-index:0;pointer-events:none;">';
        h += '<img src="assets/all_beasts/' + e.image + '" id="enemy-card" style="width:250px;height:250px;object-fit:contain;position:relative;z-index:1;border-radius:16px;transition:filter 0.15s;" onerror="this.style.display=\'none\'">';
        h += '</div>';
        // Кнопка атаки
        h += '<button onclick="' + onAttack + '" style="margin:6px auto;background:url(\'assets/skills/skill_shot_normal.png\') center/contain no-repeat;width:72px;height:72px;border:3px solid #c9a040;border-radius:50%;cursor:pointer;display:block;"></button>';
        // Рамка HP героя
        h += '<div style="position:relative;width:240px;height:22px;margin:6px auto;">';
        h += '<img src="assets/interface/life_scale.png" style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:0;">';
        h += '<div style="position:absolute;top:3px;left:3px;right:3px;bottom:3px;overflow:hidden;z-index:1;">';
        h += '<div style="background:url(\'assets/interface/life_interface_asset_horizontal_progress_bar.jpeg\') center/cover;height:100%;width:' + php + '%;transition:width 0.5s cubic-bezier(0.4,0,0.2,1);"></div>';
        h += '</div><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:0.6em;z-index:2;text-shadow:0 0 4px #000;">❤️ ' + p.stats.hp + '/' + p.stats.maxHp + '</span></div>';
        // Статы + иконка героя
        h += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:4px 0;color:#aaa;font-size:0.7em;">';
        h += '<span style="color:#f44336;">⚔️' + p.stats.attack + '</span> <span style="color:#2196f3;">🛡️' + p.stats.defense + '</span> <span style="color:#ff9800;">💨' + p.stats.agility + '</span>';
        h += '<img src="assets/hero_skins/skin_1_basic.png" style="width:40px;height:40px;border-radius:50%;border:2px solid #c9a040;">';
        h += '</div>';
        // Окно боя (7 строк)
        h += '<div id="battle-dialog" style="background:rgba(0,0,0,0.75);border:1px solid #555;border-radius:8px;padding:8px;margin:4px 8%;min-height:90px;max-height:90px;overflow-y:auto;color:#aaa;font-size:0.7em;text-align:left;line-height:1.4;"></div>';
        h += '</div>';
        this._openScreen('⚔️ Бой', 'dungeon_fight', h);
    },

    _showDialog: function(msg, color) {
        var dlg = document.getElementById('battle-dialog');
        if (dlg) { dlg.innerHTML += '<div style="color:' + (color || '#fff') + ';margin:1px 0;">' + msg + '</div>'; dlg.scrollTop = dlg.scrollHeight; }
    },

    _flashEnemyCard: function() {
        var card = document.getElementById('enemy-card'); if (!card) return;
        card.style.filter = 'brightness(1.5) saturate(2)';
        setTimeout(function() { card.style.filter = ''; }, 200);
    },

    _updateEnemyHP: function(hp, max) {
        var bar = document.getElementById('enemy-hp-bar'), txt = document.getElementById('enemy-hp-text');
        if (bar) { var pct = max > 0 ? Math.round((hp / max) * 100) : 0; bar.style.width = pct + '%'; }
        if (txt) txt.textContent = hp + '/' + max;
    },

    // ===== ПОДЗЕМКА =====
    _showCombatScreen: function() {
        var b = Sherwood.Combat.getState(); if (!b) { this._renderDungeon(); return; }
        this._showBattleScreen(
            { name: b.enemyName, image: b.enemyImage, hp: b.enemyHp, maxHp: b.enemyMaxHp },
            'dungeon', (b.isBoss ? '👑 БОСС' : '👹 Монстр'), '',
            'SherwoodUI._combatAttack()', 'SherwoodUI._combatFlee()'
        );
    },
    _combatAttack: function() { this._handleCombat(Sherwood.Combat.attack()); },
    _combatFlee: function() { var r = Sherwood.Combat.flee(); if (r.success) { this._leaveDungeon(); return; } if (r.lose) { this._showDialog('💀 Поражение...', '#f44336'); var self = this; setTimeout(function() { self._leaveDungeon(); }, 1200); return; } this._showDialog('❌ Побег не удался! Враг: -' + r.damage, '#ff9800'); this._showCombatScreen(); },

    _handleCombat: function(r) {
        if (!r) return;
        if (r.win) {
            this._showDialog('🏆 Победа! +' + r.exp + 'XP +' + r.gold + '🪙', '#ffd700');
            if (Sherwood.Dungeon && Sherwood.Dungeon.killMonster) Sherwood.Dungeon.killMonster();
            this.updateDisplay(); var self = this; setTimeout(function() { self._renderDungeon(); }, 1500);
        } else if (r.lose) {
            this._showDialog('💀 Поражение...', '#f44336');
            var self = this; setTimeout(function() { self._leaveDungeon(); }, 1500);
        } else {
            this._flashEnemyCard(); this._updateEnemyHP(r.enemyHp, r.enemyMaxHp);
            this._showDialog((r.crit ? '💥 КРИТ! ' : '⚔️ ') + 'Вы нанесли ' + r.damage + ' урона', r.crit ? '#ff6a00' : '#fff');
            if (r.armorDmg) this._showDialog('🛡️ Снято брони: ' + r.armorDmg, '#2196f3');
            if (r.enemy && r.enemy.damage) {
                var self = this;
                setTimeout(function() { self._showDialog('💢 ' + (r.enemyName || 'Враг') + ' нанёс ' + r.enemy.damage + ' урона', '#f44336'); }, 700);
            }
            this.updateDisplay(); var self = this; setTimeout(function() { self._showCombatScreen(); }, 1000);
        }
    },

    // ===== КВЕСТЫ =====
    _showQuestBattle: function() {
        var b = Sherwood.Quests.getBattle(); if (!b) { this.quest(); return; }
        var e = b.enemy;
        this._playSound('shot');
        this._showBattleScreen(
            { name: e.name, image: e.image, hp: e.hp, maxHp: e.maxHp },
            'quest', '📜 Глава ' + b.chapter.id + ' — Этап ' + b.stage + '/' + b.total, '',
            'SherwoodUI._questAttack()', 'SherwoodUI._questFlee()'
        );
    },
    _questAttack: function() { this._handleQuestResult(Sherwood.Quests.attack()); },
    _questFlee: function() { Sherwood.Quests.flee(); this.quest(); },

    _handleQuestResult: function(r) {
        if (!r) return;
        if (r.enemyDead) {
            this._showDialog('✅ Враг повержен!', '#4caf50'); this.updateDisplay();
            if (r.chapterComplete) {
                this._showDialog('🎉 Глава пройдена! +' + r.rewards.exp + 'XP +' + r.rewards.gold + '🪙', '#ffd700');
                this._playSound('victory'); var self = this; setTimeout(function() { self.quest(); }, 2000);
            } else { var self = this; setTimeout(function() { self._showQuestBattle(); }, 1200); }
        } else if (r.playerDead) {
            this._showDialog('💀 Поражение...', '#f44336'); this._playSound('defeat');
            Sherwood.Quests.flee(); var self = this; setTimeout(function() { self.quest(); }, 1500);
        } else {
            this._flashEnemyCard(); this._updateEnemyHP(r.enemyHp, r.enemyMaxHp);
            this._showDialog((r.crit ? '💥 КРИТ! ' : '⚔️ ') + 'Вы нанесли ' + r.damage + ' урона', r.crit ? '#ff6a00' : '#fff');
            if (r.enemyDamage) { var self = this; setTimeout(function() { self._showDialog('💢 Враг нанёс ' + r.enemyDamage + ' урона', '#f44336'); }, 700); }
            this._playSound('arrow_hit'); var self = this; setTimeout(function() { self._showQuestBattle(); }, 1000);
        }
    },

    // ===== ТАВЕРНА =====
    _showTavernBattle: function() {
        var active = Sherwood.Tavern.getCurrentQuest(); if (!active) { this.tavern(); return; }
        var e = active.quest.enemy; if (!e.maxHp) e.maxHp = e.hp || 100;
        this._showBattleScreen(
            { name: e.name, image: e.image, hp: e.hp || 100, maxHp: e.maxHp },
            'tavern', '🍺 ' + active.row.npc + ' — ' + active.quest.name, '',
            'SherwoodUI._tavernBattleAttack()', 'SherwoodUI._tavernCancel()'
        );
    },
    _tavernBattleAttack: function() {
        var active = Sherwood.Tavern.getCurrentQuest(); if (!active) { this.tavern(); return; }
        var p = Sherwood.getPlayer(), e = active.quest.enemy;
        if (!e.maxHp) e.maxHp = e.hp || 100;
        var dmg = Math.max(1, Math.floor((p.stats.attack * p.stats.attack) / (p.stats.attack + (e.def || 5))));
        var crit = Math.random() * 100 < 15; if (crit) dmg = Math.floor(dmg * 1.8);
        e.hp -= dmg;
        if (e.hp <= 0) {
            var r = Sherwood.Tavern.completeQuest();
            this._showDialog('🏆 Победа! +' + r.reward.exp + 'XP +' + r.reward.gold + '🪙', '#ffd700');
            this.updateDisplay(); var self = this; setTimeout(function() { self.tavern(); }, 1500);
        } else {
            var edmg = Math.max(1, Math.floor((e.atk * e.atk) / (e.atk + p.stats.defense)));
            p.stats.hp = Math.max(0, p.stats.hp - edmg);
            this._flashEnemyCard(); this._updateEnemyHP(e.hp, e.maxHp);
            this._showDialog((crit ? '💥 КРИТ! ' : '⚔️ ') + 'Вы нанесли ' + dmg + ' урона', crit ? '#ff6a00' : '#fff');
            if (p.stats.hp <= 0) {
                var self = this; setTimeout(function() { self._showDialog('💀 Поражение...', '#f44336'); }, 700);
                Sherwood.Tavern.failQuest(); p.stats.hp = 1;
                setTimeout(function() { self.tavern(); }, 1500);
            } else {
                var self = this;
                setTimeout(function() { self._showDialog('💢 Враг нанёс ' + edmg + ' урона', '#f44336'); }, 700);
                setTimeout(function() { self._showTavernBattle(); }, 1200);
            }
        }
        this.updateDisplay();
    },

    // ========== ЕЖЕДНЕВНЫЕ ==========
    daily: function() {
        this._playSound('click'); if (!Sherwood.Daily) { this._showPlaceholder('📋 Ежедневные задания','daily'); return; }
        var dailyQuests=Sherwood.Daily.getDailyQuests(),dailyCompleted=Sherwood.Daily.getDailyCompleted(),p=Sherwood.getPlayer(),currentChapter=p.questProgress?(p.questProgress.currentChapter||1):1,chapterQuests=Sherwood.Daily.getChapterQuests(currentChapter),chapterCompleted=p.daily?(p.daily.chapterCompleted||[]):[],html='';
        var t1b=(!SherwoodUI._dailyTab||SherwoodUI._dailyTab===1)?'#c9a040':'rgba(255,255,255,0.1)',t1c=(!SherwoodUI._dailyTab||SherwoodUI._dailyTab===1)?'#000':'#fff',t2b=(SherwoodUI._dailyTab===2)?'#c9a040':'rgba(255,255,255,0.1)',t2c=(SherwoodUI._dailyTab===2)?'#000':'#fff';
        html+='<div style="display:flex;gap:4px;margin-bottom:12px;"><button onclick="SherwoodUI._dailyTab=1;SherwoodUI.daily();" style="flex:1;background:'+t1b+';border:1px solid #555;border-radius:6px;padding:8px;color:'+t1c+';cursor:pointer;font-size:0.8em;">📋 Ежедневные</button><button onclick="SherwoodUI._dailyTab=2;SherwoodUI.daily();" style="flex:1;background:'+t2b+';border:1px solid #555;border-radius:6px;padding:8px;color:'+t2c+';cursor:pointer;font-size:0.8em;">📜 Глава '+currentChapter+'</button></div>';
        if (!SherwoodUI._dailyTab||SherwoodUI._dailyTab===1) { for (var i=0;i<dailyQuests.length;i++) { var q=dailyQuests[i],claimed=dailyCompleted.indexOf(q.id)!==-1; html+='<div style="background:rgba(0,0,0,0.5);border:1px solid '+(q.completed?(claimed?'#4caf50':'#ffd700'):'#555')+';border-radius:8px;padding:10px;margin-bottom:6px;"><div style="color:#e0c080;font-size:0.85em;">'+q.name+'</div><div style="color:#aaa;font-size:0.65em;">'+q.desc+'</div><div style="background:rgba(0,0,0,0.3);border-radius:4px;height:8px;margin:6px 0;overflow:hidden;"><div style="background:'+(q.completed?'#4caf50':'#c9a040')+';height:100%;width:'+Math.round((q.progress||0)/q.target*100)+'%;"></div></div><div style="color:#aaa;font-size:0.6em;">'+(q.progress||0)+'/'+q.target+' | 🏆 +'+q.reward.gold+'🪙 +'+q.reward.exp+'XP</div>'; if(q.completed&&!claimed) html+='<button onclick="SherwoodUI._claimDaily('+i+')" style="margin-top:4px;background:#4caf50;border:none;border-radius:4px;padding:4px 10px;color:#fff;cursor:pointer;font-size:0.6em;">Забрать</button>'; if(claimed) html+='<span style="color:#4caf50;font-size:0.6em;">✅ Получено</span>'; html+='</div>'; } }
        else { for (var j=0;j<chapterQuests.length;j++) { var q=chapterQuests[j],claimed=chapterCompleted.indexOf(q.id)!==-1; html+='<div style="background:rgba(0,0,0,0.5);border:1px solid '+(q.completed?(claimed?'#4caf50':'#ffd700'):'#555')+';border-radius:8px;padding:10px;margin-bottom:6px;"><div style="color:#e0c080;font-size:0.85em;">'+q.name+'</div><div style="color:#aaa;font-size:0.65em;">'+q.desc+'</div><div style="background:rgba(0,0,0,0.3);border-radius:4px;height:8px;margin:6px 0;overflow:hidden;"><div style="background:'+(q.completed?'#4caf50':'#c9a040')+';height:100%;width:'+Math.round((q.progress||0)/q.target*100)+'%;"></div></div><div style="color:#aaa;font-size:0.6em;">'+(q.progress||0)+'/'+q.target+' | 🏆 +'+q.reward.gold+'🪙 +'+q.reward.exp+'XP</div>'; if(q.completed&&!claimed) html+='<button onclick="SherwoodUI._claimChapter('+currentChapter+','+j+')" style="margin-top:4px;background:#4caf50;border:none;border-radius:4px;padding:4px 10px;color:#fff;cursor:pointer;font-size:0.6em;">Забрать</button>'; if(claimed) html+='<span style="color:#4caf50;font-size:0.6em;">✅ Получено</span>'; html+='</div>'; } }
        html+='<div id="daily-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:4px;"></div>'; this._openScreen('📋 Задания','daily',html);
    },
    _claimDaily: function(i) { var r=Sherwood.Daily.claimDailyReward(i),log=document.getElementById('daily-log'); if(r.success) { if(log) log.textContent='✅ Награда получена!'; this.updateDisplay(); } else { if(log) log.textContent='❌ '+r.reason; } var self=this; setTimeout(function(){self.daily();},800); },
    _claimChapter: function(ch,i) { var r=Sherwood.Daily.claimChapterReward(ch,i),log=document.getElementById('daily-log'); if(r.success) { if(log) log.textContent='✅ Награда получена!'; this.updateDisplay(); } else { if(log) log.textContent='❌ '+r.reason; } var self=this; setTimeout(function(){self.daily();},800); },

    // ========== ОСТАЛЬНЫЕ РЕЖИМЫ ==========
    bag: function() {
        this._playSound('click'); var bag=Sherwood.Bag,items=bag?bag.getItems():[],max=bag?bag.getMaxSlots():10,h='';
        for (var i=0;i<max;i++) { var item=items[i]; if(item) { var gc=Sherwood.GradeColors?Sherwood.GradeColors[item.grade]:'#9d9d9d'; h+='<div onclick="SherwoodUI._bagAction('+i+')" style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid '+gc+';border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;cursor:pointer;padding:4px;"><img src="'+(item.icon||'assets/interface/labyrinth_of_icons.png')+'" style="width:32px;height:32px;object-fit:contain;">'+(item.quantity>1?'<span style="position:absolute;bottom:2px;right:4px;color:#fff;font-size:0.6em;background:rgba(0,0,0,0.7);padding:0 4px;border-radius:4px;">'+item.quantity+'</span>':'')+'</div>'; } else { h+='<div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;width:60px;height:60px;border:2px solid #333;border-radius:6px;display:flex;align-items:center;justify-content:center;opacity:0.4;"><span style="color:#555;font-size:0.6em;">пусто</span></div>'; } }
        var expInfo=Sherwood.Bag.getExpansionInfo(),expBtn=expInfo.canExpand?'<button onclick="SherwoodUI._expandBag()" style="margin-top:8px;background:#c9a040;border:none;border-radius:6px;padding:6px 14px;color:#000;cursor:pointer;font-size:0.7em;">Расширить +5 ('+expInfo.cost+' 🪙)</button>':'<span style="color:#666;font-size:0.6em;">Максимум для вашего уровня</span>';
        var c='<div style="color:#aaa;font-size:0.8em;margin-bottom:4px;">'+items.length+'/'+max+'</div>'+expBtn+'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-width:340px;margin:12px auto 0;">'+h+'</div><div id="bag-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;min-height:20px;">Нажми на предмет</div>';
        this._openScreen('🎒 Сумка','bag',c);
    },
    _expandBag: function() { var r=Sherwood.Bag.expandBag(),info=document.getElementById('bag-info'); if(r.success) { if(info) info.textContent='✅ Сумка расширена до '+r.newSlots+' ячеек!'; this.updateDisplay(); } else { if(info) info.textContent='❌ '+(r.reason||'Ошибка'); } var self=this; setTimeout(function(){self.bag();},800); },
    _bagAction: function(i) { var bag=Sherwood.Bag; if(!bag) return; var items=bag.getItems(); if(i>=items.length) return; var item=items[i]; if(!item) return; var info=document.getElementById('bag-info'); if(!info) return; var a=''; if(item.part) a+='<button onclick="Sherwood.Bag.equipItem('+i+');SherwoodUI.bag();" style="background:#4caf50;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;">Надеть</button>'; a+='<button onclick="Sherwood.Bag.sellItem('+i+');SherwoodUI.bag();" style="background:#ff9800;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;">Продать</button>'; a+='<button onclick="Sherwood.Bag.dismantleItem('+i+');SherwoodUI.bag();" style="background:#f44336;border:none;border-radius:4px;padding:4px 12px;color:#fff;cursor:pointer;margin:0 4px;">Разобрать</button>'; info.innerHTML='<div style="color:#fff;font-size:0.9em;">'+(item.name||'Предмет')+'</div><div style="color:#aaa;font-size:0.7em;">'+(item.grade||'обычный')+'</div><div style="margin-top:6px;">'+a+'</div>'; },

    profile: function() {
        this._playSound('click'); var p=Sherwood.getPlayer(),eq=Sherwood.Bag?Sherwood.Bag.getEquipment():{},ring=eq.ring,amulet=eq.amulet,trophies=p.trophies||[],lastTrophy=trophies.length>0?trophies[trophies.length-1].name:'Нет трофеев';
        var h='<div style="text-align:center;margin-bottom:12px;"><img src="assets/hero_skins/'+(Sherwood.Forge?Sherwood.Forge.getActiveSkin():'skin_1_basic')+'.png" style="width:80px;height:80px;border-radius:50%;border:2px solid #c9a040;" onerror="this.src=\'assets/hero_skins/skin_1_basic.png\'"><div style="color:#e0c080;font-weight:bold;margin-top:4px;">'+p.name+'</div><div style="color:#aaa;">Уровень '+p.level+'</div></div>';
        h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(0,0,0,0.4);border-radius:10px;padding:12px;margin-bottom:12px;"><div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="'+this._statIcons.attack+'" style="width:22px;height:22px;"><span style="color:#f44336;">'+p.stats.attack+'</span></div><div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="'+this._statIcons.defense+'" style="width:22px;height:22px;"><span style="color:#2196f3;">'+p.stats.defense+'</span></div><div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="'+this._statIcons.agility+'" style="width:22px;height:22px;"><span style="color:#ff9800;">'+p.stats.agility+'</span></div><div style="display:flex;align-items:center;justify-content:center;gap:6px;"><img src="'+this._statIcons.hp+'" style="width:22px;height:22px;"><span style="color:#4caf50;">'+p.stats.hp+'</span></div></div>';
        h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;"><div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;border:2px solid #c9a040;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo(\'trophies\')"><img src="assets/all_trophies/trophies_chapters/chapter_1_broken_hunting_horn_of_the_league.png" style="width:32px;height:32px;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">'+lastTrophy+'</div></div><div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;border:2px solid #ffd700;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo(\'ring\')"><img src="assets/interface/ring_first_level.png" style="width:32px;height:32px;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">'+(ring?ring.name:'Пусто')+'</div></div><div style="background:url(\'assets/interface/bag_cell.jpeg\') center/contain no-repeat;background-size:cover;border:2px solid #9c27b0;border-radius:8px;padding:8px;text-align:center;cursor:pointer;" onclick="SherwoodUI._showProfileInfo(\'amulet\')"><img src="assets/interface/sherwood_amulet_level_one.png" style="width:32px;height:32px;margin:0 auto;"><div style="color:#aaa;font-size:0.5em;margin-top:4px;">'+(amulet?amulet.name:'Пусто')+'</div></div></div>';
        h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;"><button onclick="SherwoodUI._previousScreen=\'profile\';SherwoodUI.training();" style="background:rgba(255,152,0,0.2);border:1px solid #ff9800;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;"><img src="assets/all_buttons/training.png" style="width:24px;height:24px;display:block;margin:0 auto 4px;">Тренировка</button><button onclick="SherwoodUI._previousScreen=\'profile\';SherwoodUI.forge();" style="background:rgba(121,85,72,0.2);border:1px solid #795548;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;"><img src="assets/all_buttons/forge.png" style="width:24px;height:24px;display:block;margin:0 auto 4px;">Кузница</button><button onclick="SherwoodUI._previousScreen=\'profile\';SherwoodUI.bestiary();" style="background:rgba(96,125,139,0.2);border:1px solid #607d8b;border-radius:8px;padding:12px;color:#fff;cursor:pointer;font-size:0.8em;"><img src="assets/all_buttons/bestiary.png" style="width:24px;height:24px;display:block;margin:0 auto 4px;">Бестиарий</button></div><div id="profile-info" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;"></div>';
        this._openScreen('👤 Профиль','profile',h);
    },
    _showProfileInfo: function(type) { var info=document.getElementById('profile-info'); if(!info) return; if(type==='trophies') { var t=Sherwood.getPlayer().trophies||[]; info.innerHTML=t.length?t.map(function(x){return'🏆 '+x.name;}).join(' | '):'🏆 Трофеев нет'; } else if(type==='ring') { var r=Sherwood.Bag?Sherwood.Bag.getEquipment().ring:null; info.innerHTML=r?'💍 '+r.name+' (Ур.'+(r.level||1)+')':'💍 Кольцо не надето'; } else if(type==='amulet') { var a=Sherwood.Bag?Sherwood.Bag.getEquipment().amulet:null; info.innerHTML=a?'📿 '+a.name+' (Ур.'+(a.level||1)+')':'📿 Амулет не надет'; } },

    training: function() { var gb=this._previousScreen==='profile'?'SherwoodUI.profile()':'SherwoodUI.loadHome()'; this._previousScreen=null; this._playSound('click'); var p=Sherwood.getPlayer(),tl=p.trainingLevels||{},stats=['attack','defense','hp','agility'],names={attack:'Атака',defense:'Защита',hp:'Здоровье',agility:'Ловкость'},colors={attack:'#f44336',defense:'#2196f3',hp:'#4caf50',agility:'#ff9800'},h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'; for (var i=0;i<stats.length;i++) { var s=stats[i],lvl=tl[s]||0; h+='<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:12px;text-align:center;"><div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;"><img src="'+this._statIcons[s]+'" style="width:28px;height:28px;"><span style="color:#e0c080;">'+names[s]+'</span></div><div style="color:#aaa;font-size:0.8em;">Ур. '+lvl+'/200</div><div style="color:'+colors[s]+';font-size:0.7em;">+'+(s==='hp'?10:s==='agility'?1:2)+' за ур.</div><button onclick="SherwoodUI._doTraining(\''+s+'\')" style="margin-top:8px;background:#c9a040;border:none;border-radius:4px;padding:6px 16px;color:#000;cursor:pointer;font-size:0.8em;">Тренировать</button></div>'; } h+='</div><div id="training-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:12px;"></div>'; this._openScreen('💪 Тренировка','training',h,gb); },
    _doTraining: function(stat) { var p=Sherwood.getPlayer(); if(!p) return; if(!p.trainingLevels) p.trainingLevels={attack:0,defense:0,hp:0,agility:0}; var cur=p.trainingLevels[stat]||0; if(cur>=200) { var log=document.getElementById('training-log'); if(log) log.textContent='❌ Макс. уровень!'; return; } var cost=Math.round(10*Math.pow(cur+1,1.15)); if((p.resources.silver||0)<cost) { var log=document.getElementById('training-log'); if(log) log.textContent='❌ Нужно '+cost+' серебра!'; return; } p.resources.silver-=cost; p.trainingLevels[stat]=cur+1; if(Sherwood._recalcStats) Sherwood._recalcStats(); if(Sherwood.saveGame) Sherwood.saveGame(); this.updateDisplay(); this.training(); var log=document.getElementById('training-log'); if(log) log.textContent='✅ '+stat+' → '+(cur+1)+' (-'+cost+' сер.)'; },

    forge: function() { var gb=this._previousScreen==='profile'?'SherwoodUI.profile()':'SherwoodUI.loadHome()'; this._previousScreen=null; this._playSound('click'); if(!Sherwood.Forge) { this._showPlaceholder('⚒️ Кузница','forge',gb); return; } var items=Sherwood.Bag?Sherwood.Bag.getItems():[],enhanceItems=items.filter(function(i){return i.part||i.type==='equipment';}),skins=Sherwood.Forge.getCraftSkins(),player=Sherwood.getPlayer(),unlocked=player.unlockedSkins||[],active=player.activeSkin||'skin_1_basic',h='<div style="margin-bottom:12px;"><div style="color:#e0c080;margin-bottom:4px;">⚒️ Заточка</div>'; for (var i=0;i<enhanceItems.length;i++) { var item=enhanceItems[i],idx=items.indexOf(item),lvl=item.enhancement||0; h+='<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:6px;padding:8px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;"><div><div style="color:#e0c080;font-size:0.8em;">'+item.name+'</div><div style="color:#aaa;font-size:0.6em;">Заточка: +'+lvl+'</div></div><button onclick="SherwoodUI._enhanceItem('+idx+')" style="background:#c9a040;border:none;border-radius:4px;padding:4px 10px;color:#000;cursor:pointer;font-size:0.7em;">Точить</button></div>'; } h+=enhanceItems.length===0?'<div style="color:#aaa;font-size:0.7em;">Нет предметов</div>':''; h+='</div><div><div style="color:#e0c080;margin-bottom:4px;">🎨 Облики</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">'; for (var i=0;i<skins.length;i++) { var skin=skins[i],owned=unlocked.indexOf(skin.id)!==-1,isActive=active===skin.id; h+='<div style="background:rgba(0,0,0,0.5);border:2px solid '+(isActive?'#ffd700':owned?'#4caf50':'#555')+';border-radius:8px;padding:8px;text-align:center;"><img src="'+skin.icon+'" style="width:48px;height:48px;object-fit:contain;border-radius:4px;" onerror="this.src=\'assets/hero_skins/skin_1_basic.png\'"><div style="color:#e0c080;font-size:0.7em;">'+skin.name+'</div>'; if(owned) { h+=isActive?'<div style="color:#ffd700;font-size:0.6em;">Активен</div>':'<button onclick="SherwoodUI._equipSkin(\''+skin.id+'\')" style="margin-top:4px;background:#4caf50;border:none;border-radius:4px;padding:3px 8px;color:#fff;cursor:pointer;font-size:0.6em;">Надеть</button>'; } else { h+='<div style="color:#aaa;font-size:0.55em;">'+skin.cost.ingots+' сл. '+skin.cost.scrolls+' скр. '+skin.cost.silver+' сер.</div><button onclick="SherwoodUI._craftSkin(\''+skin.id+'\')" style="margin-top:4px;background:#ff9800;border:none;border-radius:4px;padding:3px 8px;color:#fff;cursor:pointer;font-size:0.6em;">Создать</button>'; } h+='</div>'; } h+='</div></div><div id="forge-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>'; this._openScreen('⚒️ Кузница','forge',h,gb); },
    _enhanceItem: function(idx) { var r=Sherwood.Forge.enhanceItem(idx),log=document.getElementById('forge-log'); if(r.enhanced) { if(log) log.textContent='✅ Улучшено! +'+r.newLevel; } else if(r.broken) { if(log) log.textContent='💔 Сломано!'; } else if(r.failed) { if(log) log.textContent='❌ Неудача'; } else { if(log) log.textContent='❌ '+(r.reason||'Ошибка'); } this.updateDisplay(); var self=this; setTimeout(function(){self.forge();},800); },
    _craftSkin: function(sid) { var r=Sherwood.Forge.craftSkin(sid),log=document.getElementById('forge-log'); if(r.success) { if(log) log.textContent='✅ Облик создан!'; } else { if(log) log.textContent='❌ '+(r.reason||'Ошибка'); } this.updateDisplay(); var self=this; setTimeout(function(){self.forge();},800); },
    _equipSkin: function(sid) { Sherwood.Forge.equipSkin(sid); var heroImg=document.querySelector('.hero-frame img'); if(heroImg) heroImg.src='assets/hero_skins/'+sid+'.png'; this.forge(); },

    bestiary: function() { var gb=this._previousScreen==='profile'?'SherwoodUI.profile()':'SherwoodUI.loadHome()'; this._previousScreen=null; this._playSound('click'); if(!Sherwood.Bestiary) { this._showPlaceholder('📖 Бестиарий','bestiary',gb); return; } var progress=Sherwood.Bestiary.getDiscoveryProgress(),zones=['Проклятая чаща','Первородное болото','Базальтовые шахты','Квест','Рейд'],h='<div style="text-align:center;margin-bottom:8px;color:#aaa;">📖 Открыто: '+progress.discovered+'/'+progress.total+' ('+progress.percent+'%)</div><div style="background:rgba(0,0,0,0.3);border-radius:6px;height:10px;margin-bottom:12px;overflow:hidden;"><div style="background:#c9a040;height:100%;width:'+progress.percent+'%;"></div></div>'; for (var z=0;z<zones.length;z++) { var beasts=Sherwood.Bestiary.getBeastsByZone(zones[z]); if(beasts.length===0) continue; h+='<div style="color:#e0c080;font-weight:bold;margin:10px 0 6px;">📍 '+zones[z]+'</div>'; for (var i=0;i<beasts.length;i++) { var b=beasts[i],disc=b.kills>0; h+='<div style="background:rgba(0,0,0,0.5);border:1px solid '+(disc?'#4caf50':'#555')+';border-radius:8px;padding:8px;margin-bottom:4px;display:flex;align-items:center;gap:8px;"><img src="assets/all_beasts/'+b.id+'" style="width:40px;height:40px;object-fit:contain;border-radius:4px;'+(disc?'':'filter:grayscale(1);opacity:0.5;')+'" onerror="this.src=\'assets/interface/labyrinth_of_icons.png\'"><div style="flex:1;"><div style="color:'+(disc?'#fff':'#888')+';">'+(disc?b.name:'???')+'</div><div style="color:#aaa;font-size:0.6em;">'+b.floor+' | '+b.type+'</div></div><div style="color:#aaa;font-size:0.7em;">Убито: '+b.kills+'</div></div>'; } } this._openScreen('📖 Бестиарий','bestiary',h||'<div style="color:#aaa;text-align:center;">Бестиарий пуст</div>',gb); },

    settings: function() { this._playSound('click'); var p=Sherwood.getPlayer(),nm=p?p.name:'Охотник',h='<div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;"><div style="color:#fff;margin-bottom:8px;">👤 Имя</div><div style="display:flex;gap:8px;"><input id="pni" value="'+nm+'" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:6px;padding:8px 12px;color:#fff;font-family:\'Georgia\',serif;font-size:0.9em;"><button onclick="SherwoodUI._changePlayerName()" style="background:#c9a040;border:none;border-radius:6px;padding:8px 16px;color:#000;font-weight:bold;cursor:pointer;">Сохранить</button></div><div id="name-status" style="color:#aaa;font-size:0.7em;margin-top:4px;"></div></div><div style="background:rgba(0,0,0,0.5);border-radius:10px;padding:16px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="color:#fff;">🔊 Звуки</span><label style="position:relative;width:50px;height:26px;background:'+(this._soundEnabled?'#4caf50':'#555')+';border-radius:13px;cursor:pointer;"><input type="checkbox" '+(this._soundEnabled?'checked':'')+' onchange="SherwoodUI._toggleSound(this.checked)" style="display:none;"><span style="position:absolute;top:2px;left:'+(this._soundEnabled?'26px':'2px')+';width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span></label></div><div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#fff;">🎵 Музыка</span><label style="position:relative;width:50px;height:26px;background:'+(this._musicEnabled?'#4caf50':'#555')+';border-radius:13px;cursor:pointer;"><input type="checkbox" '+(this._musicEnabled?'checked':'')+' onchange="SherwoodUI._toggleMusic(this.checked)" style="display:none;"><span style="position:absolute;top:2px;left:'+(this._musicEnabled?'26px':'2px')+';width:22px;height:22px;background:#fff;border-radius:50%;transition:0.2s;"></span></label></div></div><button onclick="SherwoodUI._exitGame()" style="width:100%;background:#f44336;border:none;border-radius:8px;padding:12px;color:#fff;font-weight:bold;font-size:1em;cursor:pointer;">🚪 Выйти</button>'; this._openScreen('⚙️ Настройки','settings',h); },
    _changePlayerName: function() { var inp=document.getElementById('pni'),st=document.getElementById('name-status'); if(!inp||!st) return; var nm=inp.value.trim(); if(!nm) { st.textContent='❌ Пустое имя'; st.style.color='#f44336'; return; } var p=Sherwood.getPlayer(); if(p) { p.name=nm; Sherwood.saveGame(); if(Sherwood.Chat) Sherwood.Chat.setUsername(nm); st.textContent='✅ Сохранено!'; st.style.color='#4caf50'; } },
    _toggleSound: function(en) { this._soundEnabled=en; this._saveAudioSettings(); if(!en) for(var k in this._sounds) { this._sounds[k].pause(); this._sounds[k].currentTime=0; } this.settings(); },
    _toggleMusic: function(en) { this._musicEnabled=en; this._saveAudioSettings(); if(!en) this._stopMusic(); else this._playMusic('forest_ambient'); this.settings(); },
    _exitGame: function() { if(confirm('Выйти?')) { if(Sherwood.saveGameNow) Sherwood.saveGameNow(); else if(Sherwood.saveGame) Sherwood.saveGame(); this._stopMusic(); window.location.href='about:blank'; } },

    chat: function() { this._playSound('click'); if(!Sherwood.Chat) { this._showPlaceholder('💬 Чат','chat'); return; } var msgs=Sherwood.Chat.getRecentMessages(50),h=''; for (var i=0;i<msgs.length;i++) { var m=msgs[i]; if(m.isSystem) h+='<div style="color:#888;font-size:0.75em;text-align:center;margin:4px 0;">['+m.time+'] '+m.text+'</div>'; else { var me=m.sender===Sherwood.Chat.getUsername(); h+='<div style="margin-bottom:6px;display:flex;flex-direction:column;align-items:'+(me?'flex-end':'flex-start')+';"><div style="color:#c9a040;font-size:0.65em;">'+m.sender+' <span style="color:#666;">'+m.time+'</span></div><div style="background:'+(me?'rgba(201,168,76,0.2)':'rgba(255,255,255,0.08)')+';border-radius:8px;padding:6px 10px;color:#ddd;font-size:0.8em;max-width:80%;word-break:break-word;">'+m.text+'</div></div>'; } } var c='<div style="display:flex;flex-direction:column;height:100%;"><div id="chat-msgs" style="flex:1;background:rgba(0,0,0,0.5);border-radius:8px;padding:12px;margin-bottom:8px;overflow-y:auto;color:#ccc;font-size:0.85em;min-height:300px;">'+(h||'<div style="color:#666;text-align:center;">Пусто</div>')+'</div><div style="display:flex;gap:8px;"><input id="chat-input" placeholder="Сообщение..." style="flex:1;background:rgba(255,255,255,0.1);border:1px solid #555;border-radius:8px;padding:10px;color:#fff;font-family:\'Georgia\',serif;font-size:0.85em;" onkeydown="if(event.key===\'Enter\')SherwoodUI._sendChat()"><button onclick="SherwoodUI._sendChat()" style="background:transparent;border:none;cursor:pointer;padding:0;width:44px;height:44px;"><img src="assets/all_buttons/send_text.png" style="width:100%;height:100%;object-fit:contain;"></button></div></div>'; this._openScreen('💬 Чат','chat',c); setTimeout(function(){var el=document.getElementById('chat-msgs');if(el)el.scrollTop=el.scrollHeight;},100); },
    _sendChat: function() { var inp=document.getElementById('chat-input'); if(!inp) return; var t=inp.value.trim(); if(!t) return; inp.value=''; Sherwood.Chat.sendMessage(t); this.chat(); },

    portal: function() { this._playSound('click'); if(!Sherwood.Portal) { this._showPlaceholder('🌀 Порталы','portal'); return; } if(Sherwood.Portal.isInPortal()) { this._showPortalBattle(); return; } var portals=Sherwood.Portal.getAllPortals(),player=Sherwood.getPlayer(),h=''; for (var i=0;i<portals.length;i++) { var p=portals[i],check=Sherwood.Portal.canEnter(p.id),unlocked=Sherwood.Portal.isPortalUnlocked(p.id),completed=player.portal&&player.portal.completed&&player.portal.completed.indexOf(p.id)!==-1,badge='',bo='0.4',bc='#555',ca=''; if(completed) { badge='<span style="color:#4caf50;">✅</span>'; bo='0.3'; bc='#4caf50'; } else if(check.can) { badge='<span style="color:#ffd700;">⚔️</span>'; bo='0.6'; bc='#c9a040'; ca='onclick="SherwoodUI._enterPortal('+p.id+')" style="cursor:pointer;"'; } else if(!unlocked) { badge='<span style="color:#f44336;">🔒</span>'; bo='0.2'; bc='#f44336'; } else { badge='<span style="color:#ff9800;">⚠️ АТК '+p.statRequirement.attack+'+ ЗЩТ '+p.statRequirement.defense+'+</span>'; } h+='<div '+ca+' style="background:url(\''+p.bg+'\') center/cover no-repeat;border:2px solid '+bc+';border-radius:10px;padding:12px;margin-bottom:8px;position:relative;overflow:hidden;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,'+bo+');z-index:0;"></div><div style="position:relative;z-index:1;display:flex;align-items:center;gap:10px;"><div style="font-size:2em;">'+p.icon+'</div><div style="flex:1;"><div style="color:#e0c080;font-weight:bold;">'+p.name+'</div><div style="color:#aaa;font-size:0.7em;">'+p.enemies.length+' врагов | 3 часа</div>'+badge+'</div></div></div>'; } this._openScreen('🌀 Порталы','portal',h||'<div style="color:#aaa;text-align:center;">Нет порталов</div>'); },
    _enterPortal: function(id) { var r=Sherwood.Portal.enterPortal(id); if(!r.success) return; this._playSound('dungeon_enter'); this._showPortalBattle(); },
    _showPortalBattle: function() { var b=Sherwood.Portal.getCurrentBattle(); if(!b) { this.portal(); return; } var e=b.enemy,ehp=Math.round(((e.hp||e.maxHp)/(e.maxHp||1))*100),tm=Math.floor(b.timeRemaining/60),ts=b.timeRemaining%60,h='<div style="text-align:center;"><div style="color:#aaa;font-size:0.7em;">⏱️ '+tm+':'+(ts<10?'0':'')+ts+' | 💀 '+b.deathCount+'</div><div style="color:#e0c080;">'+b.portal.name+' — '+b.level+'/'+b.totalLevels+'</div><div style="margin:12px 0;"><div style="font-size:4em;">'+(e.isBoss?'👑':'👹')+'</div><div style="color:#f44336;font-weight:bold;">'+e.name+'</div><div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;margin:4px 20%;overflow:hidden;"><div style="background:#f44336;height:100%;width:'+ehp+'%;"></div></div><div style="color:#aaa;">❤️ '+Math.max(0,e.hp||e.maxHp)+'/'+(e.maxHp||'?')+'</div></div><div style="color:#4caf50;">❤️ '+Sherwood.getPlayer().stats.hp+'</div><button onclick="SherwoodUI._portalAttack()" style="background:#c9a040;border:none;border-radius:8px;padding:10px 24px;color:#000;font-weight:bold;cursor:pointer;margin:4px;">⚔️ Атака</button><button onclick="SherwoodUI._portalFlee()" style="margin-top:6px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-size:0.7em;">🏃 Бежать</button><div id="portal-log" style="color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>'; this._openScreen('🌀 Портал','portal',h); },
    _portalAttack: function() { this._handlePortalResult(Sherwood.Portal.portalAttack()); },
    _handlePortalResult: function(r) { if(!r) return; var log=document.getElementById('portal-log'); if(r.portalComplete) { if(log) log.textContent='🎉 Портал пройден!'; this.updateDisplay(); var self=this; setTimeout(function(){self.portal();},2000); } else if(r.portalFailed) { if(log) log.textContent='💀 Провал!'; var self=this; setTimeout(function(){self.portal();},2000); } else if(r.dead&&r.resurrected) { if(log) log.textContent='💀 Смерть #'+r.deathCount+'! Выкуп: '+r.cost.cost+' '+r.cost.currency; this.updateDisplay(); this._showPortalBattle(); } else if(r.enemyDead) { if(log) log.textContent='✅ Враг повержен!'; this.updateDisplay(); if(r.nextEnemy) { var self=this; setTimeout(function(){self._showPortalBattle();},1000); } } else { if(log) log.textContent='-'+r.damage+' | Враг: -'+(r.enemyDamage||0); this.updateDisplay(); this._showPortalBattle(); } },
    _portalFlee: function() { Sherwood.Portal.fleePortal(); this.portal(); },

    raid: function() { this._playSound('click'); if(!Sherwood.Raid) { this._showPlaceholder('⚔️ Рейд','raid'); return; } if(Sherwood.Raid.isRaidActive()) { this._showRaidBattle(); return; } var raids=Sherwood.Raid.getAvailableRaids(),check=Sherwood.Raid.canJoinRaid(),h=''; for (var i=0;i<raids.length;i++) { var r=raids[i]; h+='<div style="background:rgba(0,0,0,0.5);border:2px solid '+(check.can?'#c9a040':'#f44336')+';border-radius:10px;padding:14px;margin-bottom:8px;text-align:center;"><div style="color:#e0c080;font-weight:bold;">'+r.name+'</div><div style="color:#aaa;">❤️ '+r.maxHp+' | ⚔️ '+r.attack+' | 3 этапа</div>'+(check.can?'<button onclick="SherwoodUI._startRaid('+i+')" style="margin-top:8px;background:#c9a040;border:none;border-radius:6px;padding:8px 20px;color:#000;font-weight:bold;cursor:pointer;">В бой!</button>':'<div style="color:#f44336;">'+check.reason+'</div>')+'</div>'; } this._openScreen('⚔️ Рейд','raid',h||'<div style="color:#aaa;text-align:center;">Нет рейдов</div>'); },
    _startRaid: function(i) { Sherwood.Raid.startRaid(i); this._playSound('dungeon_enter'); this._showRaidBattle(); },
    _showRaidBattle: function() { var s=Sherwood.Raid.getRaidStatus(); if(!s) { this.raid(); return; } var stage=s.stage,h='<div style="text-align:center;"><div style="color:#ff6a00;">'+s.boss.name+' — Этап '+s.stageIndex+'/'+s.totalStages+'</div><div style="color:#aaa;font-size:0.7em;">Участников: '+s.participants.join(', ')+'</div>'; for (var i=0;i<stage.enemies.length;i++) { var e=stage.enemies[i],ehp=Math.round(((e.hp||e.maxHp||100)/(e.maxHp||100))*100); h+='<div style="margin:8px 0;"><div style="color:#f44336;">'+e.name+'</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;margin:2px 15%;overflow:hidden;"><div style="background:#f44336;height:100%;width:'+ehp+'%;"></div></div></div>'; } h+='<div style="color:#4caf50;margin-top:8px;">❤️ '+Sherwood.getPlayer().stats.hp+'</div><button onclick="SherwoodUI._raidAttack()" style="margin-top:12px;background:#c9a040;border:none;border-radius:8px;padding:10px 30px;color:#000;font-weight:bold;cursor:pointer;">⚔️ Атака</button><button onclick="SherwoodUI._raidFlee()" style="margin-top:8px;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:6px 16px;color:#f44336;cursor:pointer;font-size:0.7em;">🏃 Выйти</button><div id="raid-log" style="color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>'; this._openScreen('⚔️ Рейд','raid',h); },
    _raidAttack: function() { var r=Sherwood.Raid.raidAttack(),log=document.getElementById('raid-log'); if(r.raidComplete) { if(log) log.textContent='🎉 Рейд пройден!'; this.updateDisplay(); var self=this; setTimeout(function(){self.raid();},2000); } else if(r.stageComplete) { if(log) log.textContent='✅ Этап пройден!'; var self=this; setTimeout(function(){self._showRaidBattle();},1000); } else if(r.playerDead) { if(log) log.textContent='💀 Вы погибли!'; var self=this; setTimeout(function(){self.raid();},1500); } else { if(log) log.textContent='-'+r.damage+' | Враг: -'+(r.bossDamage||0); this.updateDisplay(); this._showRaidBattle(); } },
    _raidFlee: function() { Sherwood.Raid.fleeRaid(); this.raid(); },

    arena: function() { this._playSound('click'); if(!Sherwood.Arena) { this._showPlaceholder('🏟️ Арена','arena'); return; } if(Sherwood.Arena.isInMatch()) { this._showArenaMatch(); return; } var opps=Sherwood.Arena.getOpponents(),stats=Sherwood.Arena.getStats(),h='<div style="text-align:center;margin-bottom:8px;color:#e0c080;">🏆 '+stats.rank+' | 🏅 '+stats.wins+' | 💀 '+stats.losses+'</div>'; for (var i=0;i<opps.length;i++) { var o=opps[i]; h+='<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;"><img src="'+o.skin+'" style="width:40px;height:40px;border-radius:50%;" onerror="this.src=\'assets/hero_skins/skin_1_basic.png\'"><div style="flex:1;"><div style="color:#fff;">'+o.name+'</div><div style="color:#aaa;font-size:0.7em;">⚔️'+o.stats.attack+' 🛡️'+o.stats.defense+' ❤️'+o.stats.maxHp+'</div></div><button onclick="SherwoodUI._startArenaMatch('+o.id+')" style="background:#c9a040;border:none;border-radius:4px;padding:6px 12px;color:#000;cursor:pointer;font-size:0.7em;">Бой</button></div>'; } h+='<button onclick="SherwoodUI._refreshArena()" style="width:100%;margin-top:8px;background:rgba(255,255,255,0.1);border:1px solid #666;border-radius:6px;padding:8px;color:#fff;cursor:pointer;">🔄 Обновить</button>'; this._openScreen('🏟️ Арена','arena',h); },
    _startArenaMatch: function(i) { Sherwood.Arena.startMatch(i); this._showArenaMatch(); },
    _refreshArena: function() { Sherwood.Arena.refreshOpponents(); this.arena(); },
    _showArenaMatch: function() { var m=Sherwood.Arena.getCurrentMatch(); if(!m) { this.arena(); return; } var o=m.opponent,p=m.player,ohp=Math.round((o.stats.hp/o.stats.maxHp)*100),php=Math.round((p.stats.hp/p.stats.maxHp)*100),h='<div style="text-align:center;"><div style="color:#ffd700;">⚔️ Арена ⚔️</div><div style="display:flex;justify-content:space-around;align-items:center;margin:16px 0;"><div style="text-align:center;"><img src="'+o.skin+'" style="width:60px;height:60px;border-radius:50%;border:2px solid #f44336;" onerror="this.src=\'assets/hero_skins/skin_1_basic.png\'"><div style="color:#f44336;">'+o.name+'</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#f44336;height:100%;width:'+ohp+'%;"></div></div><div style="color:#aaa;font-size:0.6em;">'+Math.max(0,o.stats.hp)+'/'+o.stats.maxHp+'</div></div><div style="font-size:1.5em;">VS</div><div style="text-align:center;"><img src="assets/hero_skins/skin_1_basic.png" style="width:60px;height:60px;border-radius:50%;border:2px solid #4caf50;"><div style="color:#4caf50;">Вы</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:10px;width:100px;overflow:hidden;"><div style="background:#4caf50;height:100%;width:'+php+'%;"></div></div><div style="color:#aaa;font-size:0.6em;">'+p.stats.hp+'/'+p.stats.maxHp+'</div></div></div><button onclick="SherwoodUI._arenaAttack()" style="width:100%;background:#c9a040;border:none;border-radius:8px;padding:12px;color:#000;font-weight:bold;cursor:pointer;margin-bottom:8px;">⚔️ Атака</button><button onclick="SherwoodUI._arenaFlee()" style="width:100%;background:rgba(244,67,54,0.2);border:1px solid #f44336;border-radius:6px;padding:8px;color:#f44336;cursor:pointer;font-size:0.7em;">🏃 Сдаться</button><div id="arena-log" style="color:#aaa;font-size:0.75em;margin-top:8px;"></div></div>'; this._openScreen('🏟️ Арена','arena',h); },
    _arenaAttack: function() { var r=Sherwood.Arena.arenaAttack(),log=document.getElementById('arena-log'); if(r.win) { if(log) log.textContent='🏆 Победа! +'+(r.rewards?r.rewards.exp:0)+'XP'; this.updateDisplay(); var self=this; setTimeout(function(){self.arena();},1500); } else if(r.win===false) { if(log) log.textContent='💀 Поражение'; var self=this; setTimeout(function(){self.arena();},1500); } else { if(log) log.textContent='-'+r.playerDamage+' | Враг: -'+(r.opponentDamage||0); this._showArenaMatch(); } },
    _arenaFlee: function() { Sherwood.Arena.fleeMatch(); this.arena(); },

    market: function() { this._playSound('click'); if(!Sherwood.BlackMarket) { this._showPlaceholder('💰 Рынок','market'); return; } var items=Sherwood.BlackMarket.getShopItems(),h=''; for (var i=0;i<items.length;i++) { var item=items[i]; h+='<div style="background:rgba(0,0,0,0.5);border:1px solid #555;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;"><img src="'+item.icon+'" style="width:44px;height:44px;border-radius:4px;" onerror="this.src=\'assets/interface/labyrinth_of_icons.png\'"><div style="flex:1;"><div style="color:#e0c080;">'+item.name+'</div><div style="color:#aaa;font-size:0.7em;">'+(item.type==='consumable'?'Расходник':item.type==='resource'?'Ресурс':'Экипировка')+'</div></div><div style="text-align:right;"><div style="color:'+(item.currency==='gold'?'#ffd700':'#c0c0c0')+';">'+item.price+' '+(item.currency==='gold'?'🪙':'⚪')+'</div><button onclick="SherwoodUI._buyItem('+item.shopIndex+')" style="margin-top:4px;background:#c9a040;border:none;border-radius:4px;padding:4px 10px;color:#000;cursor:pointer;font-size:0.7em;">Купить</button></div></div>'; } this._openScreen('💰 Рынок','market',(h||'<div style="color:#aaa;text-align:center;">Товаров нет</div>')+'<div id="market-log" style="text-align:center;color:#aaa;font-size:0.7em;margin-top:8px;"></div>'); },
    _buyItem: function(i) { var r=Sherwood.BlackMarket.buyItem(i),log=document.getElementById('market-log'); if(r.success) { if(log) log.textContent='✅ Куплено!'; this.updateDisplay(); } else { if(log) log.textContent='❌ '+(r.reason||'Ошибка'); } var self=this; setTimeout(function(){self.market();},800); },

    _showPlaceholder: function(title, bgKey, backAction) { this._playSound('click'); this._openScreen(title, bgKey, '<div style="text-align:center;padding:40px 0;"><div style="font-size:3em;margin-bottom:16px;">🏗️</div><div style="font-size:1.2em;color:#e0c080;margin-bottom:8px;">'+title+'</div><div style="font-size:0.7em;color:#888;">В разработке</div></div>', backAction); }
};

document.addEventListener('DOMContentLoaded', function() { if (typeof SherwoodUI !== 'undefined' && SherwoodUI.init) SherwoodUI.init(); });

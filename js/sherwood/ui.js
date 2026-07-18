function getAvatarUrl(avatarSrc) {
    if (!avatarSrc || avatarSrc === 'icons/01icon.png' || avatarSrc === '001') return 'assets/icons/01icon.png';
    if (typeof avatarSrc === 'string' && avatarSrc.startsWith('assets/')) return avatarSrc;
    if (typeof avatarSrc === 'string' && avatarSrc.match(/^\d+$/)) return 'assets/avatar/' + avatarSrc + 'ava.png';
    return 'assets/icons/01icon.png';
}

Sherwood.UI = {
    _currentScreen: null, _container: null, _currentMusic: null, _currentMusicKey: null, _sounds: {}, _soundEnabled: true, _upgradeData: [],
    
    _bg: {
        main: 'assets/icons/bg_main.png',
        tavern: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_outlaw_tavern_hidden_in_551664901.jpeg',
        blackmarket: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_outlaw_black_market_sho_2924495327.jpeg',
        profile: 'assets/lor/Concept_art_of_an_empty_ambient_medieval_rogues_armory_workshop__711067792.jpeg',
        bestiary: 'assets/lor/Concept_art_of_an_empty_medieval_monster_hunters_study_desk_insi_4116191878.jpeg',
        quests: 'assets/lor/Concept_art_of_a_medieval_fantasy_game_quest_log_user_interface__2570654912.jpeg',
        training: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_game_attributes_upgrade_3888850448.jpeg',
        blacksmith: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_game_blacksmith_upgrade_1828056045.jpeg',
        skills: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_game_spellbook_menu_bac_2764741742.jpeg',
        dungeon: 'assets/icons/bg_dungeon.png',
        battle: 'assets/icons/bg_battle.png',
        dungeon_arena: 'assets/lor/Concept_art_of_an_empty_combat_arena_inside_a_dark_medieval_fant_1895741054.jpeg',
        pvp_arena: 'assets/lor/Concept_art_of_an_empty_medieval_PvP_battle_arena_hidden_deep_un_1634296726.jpeg',
        raid: 'assets/lor/Concept_art_of_an_empty_apocalyptic_raid_battle_arena_hidden_dee_1709694810.jpeg'
    },
    
    init() {
    // Берём существующий контейнер из HTML
    this._container = document.getElementById('game-container');
    if (!this._container) {
        this._container = document.getElementById('sherwood-game');
    }
    if (!this._container) {
        this._container = document.createElement('div');
        this._container.id = 'sherwood-game';
        document.body.appendChild(this._container);
    }
    // Стили для контейнера — БЕЗ display:none
    this._container.style.cssText = 'width:100%;height:100%;overflow-y:auto;background:var(--bg-primary);';
    
    // Звуки и события
    this._initSounds();
    Sherwood.on('BATTLE_VICTORY', (d) => this._onBattleVictory(d));
    Sherwood.on('BATTLE_DEFEAT', () => this._onBattleDefeat());
    Sherwood.on('PLAYER_LEVEL_UP', () => this._playSound('levelup'));
},
    
    _initSounds() {
        const s = {
            'shot':'assets/sounds/shot.mp3','arrow_hit':'assets/sounds/arrow_hit.wav','victory':'assets/sounds/victory.wav',
            'defeat':'assets/sounds/defeat.wav','levelup':'assets/sounds/levelup.wav','chest_open':'assets/sounds/chest_open.wav',
            'button_click':'assets/sounds/button_click.ogg','trap_trigger':'assets/sounds/trap_trigger.wav',
            'dungeon_enter':'assets/sounds/dungeon_enter.wav','forest_ambient':'assets/sounds/forest_ambient.ogg',
            'dungeon_ambient':'assets/sounds/dungeon_ambient.wav','tavern_ambient':'assets/sounds/tavern_ambient.wav'
        };
        Object.entries(s).forEach(([k,u]) => { const a = new Audio(u); a.preload='auto'; this._sounds[k]=a; });
    },
    
    _playSound(key) { if(!this._soundEnabled)return; const s=this._sounds[key]; if(s){s.currentTime=0;s.volume=0.5;s.play().catch(()=>{});} },
    _playMusic(key) {
        if(this._currentMusicKey===key&&this._currentMusic&&!this._currentMusic.paused)return;
        this._stopMusic();
        const m=this._sounds[key]; if(m){m.loop=true;m.volume=0.3;m.currentTime=0;m.play().catch(()=>{});this._currentMusic=m;this._currentMusicKey=key;}
    },
    _stopMusic() { if(this._currentMusic){this._currentMusic.pause();this._currentMusic.currentTime=0;this._currentMusic=null;this._currentMusicKey=null;} },
    _addGameButton(){},
    
    toggle() { if(!this._container)return; if(this._container.style.display==='none'||!this._container.style.display){this.show();}else{this.hide();} },
    show() { if(!this._container)return; this._container.style.display='block'; document.getElementById('app-container').style.display='none'; this._playMusic('forest_ambient'); this.showMainMenu(); },
    hide() { this._container.style.display='none'; document.getElementById('app-container').style.display='flex'; this._stopMusic(); },
    
    showMainMenu() {
        const p = Sherwood.getPlayer();
        if (!p) { this._container.innerHTML = '<div style="color:#fff;text-align:center;padding:40px;">Загрузка...</div>'; setTimeout(() => this.showMainMenu(), 500); return; }
        this._container.style.background = "url('" + this._bg.main + "') center/cover no-repeat";
        const ep = Math.min(100, (p.exp / p.expToLevel * 100)).toFixed(0);
        
        const menuButtons = [
            { icon: '⚔️', label: 'Вылазки', action: 'showQuests', color: '#c9a040', glow: 'rgba(201,160,64,0.5)' },
            { icon: '🌲', label: 'Чащоба', action: 'showDungeon', color: '#4a7ac4', glow: 'rgba(74,122,196,0.5)' },
            { icon: '🌳', label: 'Дуб', action: 'showPortal', color: '#4ac470', glow: 'rgba(74,196,112,0.5)' },
            { icon: '👤', label: 'Профиль', action: 'showProfile', color: '#e0c080', glow: 'rgba(224,192,128,0.4)' },
            { icon: '👹', label: 'Логово', action: 'showRaid', color: '#f44336', glow: 'rgba(244,67,54,0.4)' },
            { icon: '💪', label: 'Тренировка', action: 'showTraining', color: '#ff9800', glow: 'rgba(255,152,0,0.4)' },
            { icon: '⚒️', label: 'Кузница', action: 'showBlacksmith', color: '#795548', glow: 'rgba(121,85,72,0.4)' },
            { icon: '🎯', label: 'Турнир', action: 'showArena', color: '#9c27b0', glow: 'rgba(156,39,176,0.4)' },
            { icon: '🍺', label: 'Таверна', action: 'showTavern', color: '#8d6e63', glow: 'rgba(141,110,99,0.4)' },
            { icon: '📖', label: 'Дневник', action: 'showBestiary', color: '#607d8b', glow: 'rgba(96,125,139,0.4)' },
            { icon: '💰', label: 'Схрон', action: 'showBlackMarket', color: '#ffc107', glow: 'rgba(255,193,7,0.4)' },
            { icon: '🎪', label: 'Ивенты', action: 'showEvents', color: '#00bcd4', glow: 'rgba(0,188,212,0.4)' }
        ];
        
        const spheres = menuButtons.slice(0, 3);
        const smallBtns = menuButtons.slice(3);
        
        let spheresHtml = '';
        spheres.forEach(s => {
            spheresHtml += `<div onclick="Sherwood.UI.${s.action}()" style="cursor:pointer;text-align:center;"><div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${s.color},${s.glow});border:3px solid ${s.color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px ${s.glow},inset 0 2px 4px rgba(255,255,255,0.2);margin:0 auto;transition:all 0.2s;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'" ontouchstart="this.style.transform='scale(0.9)'" ontouchend="this.style.transform='scale(1)'"><span style="font-size:2em;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${s.icon}</span></div><div style="color:${s.color};font-size:0.7em;margin-top:6px;font-weight:bold;text-shadow:0 1px 3px rgba(0,0,0,0.8)">${s.label}</div></div>`;
        });
        
        let smallHtml = '';
        smallBtns.forEach(s => {
            smallHtml += `<div onclick="Sherwood.UI.${s.action}()" style="cursor:pointer;text-align:center;width:62px;"><div style="width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.12),rgba(255,255,255,0.03));border:2px solid ${s.color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px ${s.glow};margin:0 auto;transition:all 0.15s;" onmousedown="this.style.transform='scale(0.85)'" onmouseup="this.style.transform='scale(1)'" ontouchstart="this.style.transform='scale(0.85)'" ontouchend="this.style.transform='scale(1)'"><span style="font-size:1.3em;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">${s.icon}</span></div><div style="color:#aaa;font-size:0.55em;margin-top:3px">${s.label}</div></div>`;
        });
        
        this._container.innerHTML = `<div style="position:relative;min-height:100%;display:flex;flex-direction:column;align-items:center;background:linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0.7));padding:10px 16px 20px"><div style="width:100%;max-width:500px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.7);border-radius:20px;padding:6px 14px"><img src="${getAvatarUrl(p.avatar)}" style="width:28px;height:28px;border-radius:50%;border:2px solid #c9a040" onerror="this.src='assets/icons/01icon.png'"><span style="color:#e0c080;font-weight:bold;font-size:0.9em">Ур.${p.level}</span></div><div style="display:flex;gap:8px"><div style="background:rgba(0,0,0,0.7);border-radius:16px;padding:4px 10px"><span style="color:#ffd700;font-size:0.85em">🪙${p.resources.gold}</span></div><div style="background:rgba(0,0,0,0.7);border-radius:16px;padding:4px 10px"><span style="color:#c0c0c0;font-size:0.85em">⚪${p.resources.silver}</span></div></div></div><div style="position:relative;width:200px;height:280px;margin:8px 0;display:flex;align-items:center;justify-content:center"><div style="position:absolute;bottom:0;width:160px;height:30px;background:radial-gradient(ellipse,rgba(0,0,0,0.7),transparent 70%);border-radius:50%"></div><img src="assets/icons/Male Archer.png" style="position:relative;z-index:1;max-height:260px;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.5))" onerror="this.style.display='none'"><div style="position:absolute;bottom:-5px;width:140px;text-align:center"><div style="background:rgba(0,0,0,0.7);border-radius:8px;height:5px;overflow:hidden"><div style="background:linear-gradient(90deg,#c9a040,#ffd700);height:100%;width:${ep}%;border-radius:8px;transition:width 0.5s"></div></div><div style="font-size:0.6em;color:#c9a040;margin-top:2px">✨ ${p.exp}/${p.expToLevel}</div></div></div><div style="display:flex;gap:14px;margin-bottom:12px"><span style="color:#f44336;font-size:0.8em;text-shadow:0 1px 2px rgba(0,0,0,0.8)">⚔️${p.stats.attack}</span><span style="color:#2196f3;font-size:0.8em">🛡️${p.stats.defense}</span><span style="color:#4caf50;font-size:0.8em">❤️${p.stats.hp}/${p.stats.maxHp}</span><span style="color:#ff9800;font-size:0.8em">💨${p.stats.agility}</span></div><div style="display:flex;justify-content:center;gap:24px;width:100%;max-width:400px;margin-bottom:14px">${spheresHtml}</div><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:400px">${smallHtml}</div><button onclick="Sherwood.UI.hide()" style="margin-top:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#888;padding:6px 24px;border-radius:14px;cursor:pointer;font-size:0.75em">✕ Выйти</button></div>`;
    },
        showProfile() {
        const p = Sherwood.getPlayer(); if (!p) return;
        this._container.style.background = "url('" + this._bg.profile + "') center/cover no-repeat";
        const ep = Math.min(100, (p.exp / p.expToLevel * 100)).toFixed(0);
        
        const slotFrames = {
            head: 'assets/lor/Square_video_game_UI_asset_of_an_empty_head_equipment_slot_icon__4227602892.jpeg',
            torso: 'assets/lor/Square_video_game_UI_asset_of_an_empty_chest_equipment_slot_icon_1310839105.jpeg',
            hands: 'assets/lor/Square_video_game_UI_asset_of_an_empty_gloves_equipment_slot_ico_3891505067.jpeg',
            legs: 'assets/lor/Square_video_game_UI_asset_of_an_empty_legs_equipment_slot_icon__40563327.jpeg',
            feet: 'assets/lor/Square_video_game_UI_asset_of_an_empty_boots_equipment_slot_icon_414026543.jpeg',
            weapon1: 'assets/lor/Square_video_game_UI_asset_of_an_empty_weapon_equipment_slot_ico_2932871728.jpeg',
            weapon2: 'assets/lor/Square_video_game_UI_asset_of_an_empty_quiver_equipment_slot_ico_256303001.jpeg',
            belt: 'assets/lor/Square_video_game_UI_asset_of_an_empty_belt_equipment_slot_icon__1141964295.jpeg',
            amulet: 'assets/lor/Square_video_game_UI_asset_of_an_empty_amulet_equipment_slot_ico_1520680383.jpeg',
            ring: 'assets/lor/Square_video_game_UI_asset_of_an_empty_ring_equipment_slot_icon__853117714.jpeg'
        };
        
        const leftSlots = ['weapon1', 'hands', 'legs'];
        const rightSlots = ['weapon2', 'torso', 'feet'];
        const topSlots = ['head'];
        const bottomSlots = ['belt', 'amulet', 'ring'];
        
        function renderSlot(key, top, left) {
            const item = p.equipment[key];
            const hasItem = item !== null;
            const gradeColor = hasItem ? ((Sherwood.Models && Sherwood.Models.GradeColors && Sherwood.Models.GradeColors[item.grade]) || '#9d9d9d') : '#444';
            return `<div onclick="Sherwood.UI._onEquipSlotClick('${key}')" style="position:absolute;top:${top}%;left:${left}%;transform:translate(-50%,-50%);cursor:pointer;text-align:center;width:50px;height:50px"><div style="width:50px;height:50px;border-radius:8px;background-image:url('${slotFrames[key]||''}');background-size:cover;background-position:center;border:2px solid ${gradeColor};box-shadow:0 0 6px ${hasItem?gradeColor:'transparent'}">${hasItem?`<div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;font-size:0.55em;padding:1px 4px;border-radius:3px;white-space:nowrap">${item.name.substring(0,8)}</div>`:''}</div></div>`;
        }
        
        let slotsHtml = '';
        leftSlots.forEach((key, i) => { slotsHtml += renderSlot(key, 35 + i * 18, 12); });
        rightSlots.forEach((key, i) => { slotsHtml += renderSlot(key, 35 + i * 18, 88); });
        topSlots.forEach((key) => { slotsHtml += renderSlot(key, 12, 50); });
        bottomSlots.forEach((key) => { slotsHtml += renderSlot(key, 82, 50); });
        
        let inventoryHtml = p.inventory.length === 0 
            ? '<div style="color:#aaa;text-align:center;padding:10px;">Пусто</div>'
            : p.inventory.map((it, i) => {
                const gc = (Sherwood.Models && Sherwood.Models.GradeColors && Sherwood.Models.GradeColors[it.grade]) || '#9d9d9d';
                return `<div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-left:3px solid ${gc};border-radius:8px;padding:8px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
                    <span style="font-size:1em">📦</span>
                    <div style="flex:1"><div style="color:#fff;font-size:0.8em">${it.name}</div><div style="font-size:0.6em;color:${gc}">${it.grade?.toUpperCase()} | Ур.${it.level||1}</div></div>
                    <button onclick="Sherwood.UI._onEquipItem(${i})" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:0.7em">Надеть</button>
                    <button onclick="Sherwood.UI._dismantleItem(${i})" style="background:rgba(244,67,54,0.2);border:1px solid #f44336;color:#f44336;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:0.7em">Разобрать</button>
                </div>`;
            }).join('');
        
        this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:12px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;margin-bottom:10px">← Назад</button><div style="text-align:center;margin-bottom:10px"><img src="${getAvatarUrl(p.avatar)}" style="width:50px;height:50px;border-radius:50%;border:2px solid #c9a040" onerror="this.src='assets/icons/01icon.png'"><div style="color:#e0c080;font-weight:bold">${p.name}</div><div style="color:#fff;font-size:0.8em">Ур.${p.level} | ✨${p.exp}/${p.expToLevel}</div><div style="background:rgba(255,255,255,0.1);border-radius:4px;height:4px;margin:4px 0"><div style="background:#4caf50;height:100%;width:${ep}%;border-radius:4px"></div></div><div style="display:flex;gap:10px;justify-content:center;font-size:0.8em;color:#fff"><span style="color:#f44336">⚔️${p.stats.attack}</span><span style="color:#2196f3">🛡️${p.stats.defense}</span><span style="color:#4caf50">❤️${p.stats.hp}/${p.stats.maxHp}</span><span style="color:#ff9800">💨${p.stats.agility}</span></div></div><div style="position:relative;width:100%;max-width:300px;height:380px;margin:0 auto 12px;background:rgba(0,0,0,0.5);border-radius:12px;overflow:hidden"><img src="assets/lor/Character_Body_Outline.png" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:70%;max-height:70%;opacity:0.6" onerror="this.style.display='none'">${slotsHtml}</div><h4 style="color:#e0c080;margin:8px 0 4px">📦 Инвентарь (${p.inventory.length}/${p.bagSize})</h4><div style="max-height:180px;overflow-y:auto">${inventoryHtml}</div></div>`;
    },
    
    _onEquipSlotClick(pt) { const p = Sherwood.getPlayer(); const it = p.equipment[pt]; if (it && confirm('Снять "' + it.name + '"?')) { Sherwood.unequipItem(pt); this.showProfile(); } },
    _onEquipItem(i) { const p = Sherwood.getPlayer(); const it = p.inventory[i]; if (it) { Sherwood.equipItem(it); p.inventory.splice(i, 1); this.showProfile(); } },
    _dismantleItem(index) {
        const p = Sherwood.getPlayer();
        const item = p.inventory[index];
        if (!item) return;
        const equippedItem = p.equipment[item.part];
        const itemLevel = item.level || 1;
        if (equippedItem && itemLevel > 1) {
            equippedItem.level = (equippedItem.level || 1) + Math.floor((itemLevel - 1) * 0.7);
            if (!equippedItem.stats) equippedItem.stats = {};
            Object.keys(equippedItem.stats).forEach(stat => { equippedItem.stats[stat] += Math.floor(itemLevel * 0.5); });
        }
        p.inventory.splice(index, 1);
        Sherwood._recalcStats();
        Sherwood.saveGame();
        this._playSound('arrow_hit');
        this.showProfile();
    },
    
    showQuests() {
        this._container.style.background = "url('" + this._bg.quests + "') center/cover no-repeat";
        const chapters = Sherwood.Quests.getAvailableChapters();
        let ch = chapters.map(c => { const pct = c.totalTasks > 0 ? (c.tasksCompleted / c.totalTasks * 100) : 0; return `<div onclick="Sherwood.UI._startQuest('${c.id}')" style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.5em">📜</span><div style="flex:1"><b style="color:#ffd700">Гл.${c.chapter}: ${c.name}</b><div style="font-size:0.75em;color:#aaa">${c.tasksCompleted}/${c.totalTasks}</div></div>${c.completed?'✅':'→'}</div>${!c.completed?`<div style="background:rgba(255,255,255,0.1);border-radius:4px;height:4px;margin-top:6px"><div style="background:#ffd700;height:100%;width:${pct}%;border-radius:4px"></div></div>`:''}</div>`; }).join('') || '<div style="color:#aaa;text-align:center;padding:20px">Нет доступных глав.</div>';
        this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#ffd700;margin:0 0 12px">⚔️ Вылазки</h2>${ch}<h3 style="color:#ffd700;margin:16px 0 8px">⚡ Быстрый бой</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${['swamp_ghoul_1|Болотный упырь','cursed_wolf_1|Проклятый волк','swamp_kikimora_1|Кикимора','devil_toad_1|Дьявольская жаба'].map(x=>{const[a,b]=x.split('|');const m=Sherwood.Monsters[a];return`<button onclick="Sherwood.UI.startBattle('${a}')" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px;color:#fff;cursor:pointer;text-align:center"><img src="${m?.icon||''}" style="width:50px;height:50px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'"><div style="font-size:0.8em">${b}</div></button>`}).join('')}</div></div>`;
    },
    
    _startQuest(qid) { const q = Sherwood.Quests.startChapter(qid); if (!q) return; let th = q.tasks.map(t => { const st = q.questState.tasks[t.id]; const pct = st ? (st.progress / t.target * 100) : 0; const dn = st?.completed; return `<div style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;margin-bottom:6px"><div style="display:flex;align-items:center;gap:6px"><span>${dn?'✅':'⬜'}</span><span style="color:#fff">${t.description}</span></div>${!dn?`<div style="font-size:0.7em;color:#aaa">${st?.progress||0}/${t.target}</div><div style="background:rgba(255,255,255,0.1);border-radius:3px;height:3px;margin-top:4px"><div style="background:#4caf50;height:100%;width:${pct}%;border-radius:3px"></div></div>`:''}</div>`; }).join(''); const dn = q.questState.completed; this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.6),rgba(0,0,0,0.9));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showQuests()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#ffd700">Гл.${q.chapter}: ${q.name}</h2><p style="color:#aaa">${q.description}</p>${th}${dn?`<div style="background:rgba(255,215,0,0.15);border:2px solid gold;border-radius:10px;padding:14px;text-align:center;margin-top:10px"><div style="color:gold;font-size:1.1em">🏆 Глава завершена!</div><div style="color:#fff">🪙${q.chapterReward.gold||0} ⚪${q.chapterReward.silver||0} ✨${q.chapterReward.exp||0}XP</div></div>`:''}</div>`; },
    
    startBattle(mid, bgKey) {
        const b = Sherwood.Combat.startPvE(mid); if (!b) return;
        this._playSound('shot'); this._playMusic('dungeon_ambient');
        this._container.style.background = "url('" + (this._bg[bgKey] || this._bg.dungeon_arena) + "') center/cover no-repeat";
        this._renderBattle();
    },
    
    _renderBattle() {
        const b = Sherwood.Combat.getBattle(); if (!b) return;
        const e = b.monster; const p = b.player; const m = Sherwood.Monsters[b.monsterId];
        const eh = Math.max(0, (e.currentHp / e.stats.hp * 100)).toFixed(0);
        const ph = Math.max(0, (p.currentHp / p.stats.hp * 100)).toFixed(0);
        const skills = Sherwood.Combat._getPlayerSkills();
        const skillIcons = {
            power_shot: 'assets/lor/Square_video_game_skill_icon_for_a_frenzy_shot_ultimate_ability__2353915414.jpeg',
            triple_shot: 'assets/lor/Square_video_game_skill_icon_for_a_triple_shot_archery_ability_d_136792180.jpeg',
            poison_arrow: 'assets/lor/Square_video_game_skill_icon_for_a_stunning_arrow_ability_dark_f_1812747185.jpeg',
            stunning_shot: 'assets/lor/Square_video_game_skill_icon_for_a_passive_blocking_defense_abil_3147809944.jpeg'
        };
        let skillsHtml = '';
        const skillKeys = Object.keys(skills);
        for (let i = 0; i < 5; i++) {
            const sk = skills[skillKeys[i]];
            if (sk) {
                const cd = b.cooldowns[sk.id] > 0;
                skillsHtml += `<div onclick="Sherwood.UI._onSkillClick('${sk.id}')" style="width:48px;height:48px;cursor:pointer;position:relative;border:2px solid ${cd?'#555':'#c9a040'};border-radius:8px;opacity:${cd?'0.5':'1'};overflow:hidden"><img src="${skillIcons[sk.id]||''}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);color:#fff;font-size:0.5em;text-align:center;padding:1px">${sk.name.substring(0,6)}</div>${cd?`<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:1em">${b.cooldowns[sk.id]}</div>`:''}</div>`;
            } else {
                skillsHtml += `<div style="width:48px;height:48px;border:2px solid #333;border-radius:8px;background:rgba(0,0,0,0.3)"></div>`;
            }
        }
        this._container.innerHTML = `<div style="min-height:100%;background:url('${this._bg.dungeon_arena}') center/cover no-repeat;position:relative"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.6),rgba(0,0,0,0.8))"></div><div style="position:relative;z-index:1;padding:12px;max-width:500px;margin:0 auto"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><img src="${m?.icon||''}" style="width:60px;height:60px;object-fit:cover;border-radius:10px;border:2px solid #f44336" onerror="this.style.display='none'"><div style="flex:1"><div style="color:#fff;font-weight:bold">${e.name}</div><div style="font-size:0.7em;color:#aaa">⚔️${e.stats.attack} 🛡️${e.stats.defense}</div><div style="position:relative;height:14px;background:rgba(0,0,0,0.5);border-radius:7px;margin-top:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.2)"><div style="background:linear-gradient(180deg,#f44336,#8b0000);height:100%;width:${eh}%;border-radius:7px;transition:width 0.3s"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:0.55em;color:#fff;text-shadow:0 0 3px #000">${Math.max(0,e.currentHp)}/${e.stats.hp}</div></div></div></div><div style="text-align:center;font-size:1.2em;color:#ffd700;margin:8px 0">⚡ VS ⚡</div><div style="display:flex;gap:10px;margin-bottom:10px"><div style="width:60px;height:60px;position:relative;flex-shrink:0"><img src="assets/lor/Square_video_game_UI_asset_of_an_empty_character_portrait_frame__3713702714.jpeg" style="width:60px;height:60px;object-fit:cover;border-radius:50%" onerror="this.style.display='none'"><img src="${getAvatarUrl(p.avatar)}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%" onerror="this.src='assets/icons/01icon.png'"></div><div style="flex:1"><div style="color:#fff;font-weight:bold">${p.name||'Вы'}</div><div style="position:relative;height:18px;background:rgba(0,0,0,0.5);border-radius:9px;margin-top:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.2)"><div style="background:linear-gradient(180deg,#4caf50,#1a5a1a);height:100%;width:${ph}%;border-radius:9px;transition:width 0.3s"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:0.6em;color:#fff;text-shadow:0 0 3px #000">${Math.max(0,p.currentHp)}/${p.stats.hp}</div></div></div></div><div style="display:flex;gap:4px;margin-bottom:8px;height:24px"><img src="assets/lor/UI_asset_of_four_empty_buff_and_debuff_status_slots_horizontal_r_2896392101.jpeg" style="height:24px;opacity:0.5" onerror="this.style.display='none'"></div><button onclick="Sherwood.UI._onAttackClick()" style="width:100%;padding:12px;margin-bottom:8px;background:linear-gradient(135deg,#c44050,#8b2030);border:none;border-radius:8px;color:#fff;font-weight:bold;cursor:pointer;font-size:1em" ${b.turn!=='player'?'disabled':''}>⚔️ Атаковать</button><div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">${skillsHtml}</div><button onclick="Sherwood.UI._fleeBattle()" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.2);color:#aaa;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.8em">🏃 Бежать</button><div id="battle-log" style="margin-top:8px;max-height:80px;overflow-y:auto;font-size:0.7em;color:#aaa"></div></div></div>`;
    },
    
    _onAttackClick() { const b = Sherwood.Combat.getBattle(); if (!b || b.turn !== 'player') return; this._playSound('arrow_hit'); const r = Sherwood.Combat.playerAttack(); this._updateBattleUI(); if (r) { this._addBattleLog('🗡️', 'Вы нанесли ' + r.damage + ' урона!', '#4caf50'); if (r.crit) this._addBattleLog('💥', 'Крит!', '#ff9800'); } },
    _onSkillClick(sid) { const r = Sherwood.Combat.playerUseSkill(sid); this._playSound('arrow_hit'); this._updateBattleUI(); if (r) { const sk = Sherwood.Combat._getPlayerSkills(); this._addBattleLog('🎯', sk[sid].name + ': ' + r.damage + ' урона!', '#ff9800'); if (r.crit) this._addBattleLog('💥', 'Крит!', '#ff9800'); } },
    _fleeBattle() { if (Sherwood.Combat.flee()) { this._playMusic('forest_ambient'); this.showMainMenu(); } else { this._addBattleLog('🏃', 'Не вышло!', '#f44336'); this._updateBattleUI(); } },
    _updateBattleUI() { const b = Sherwood.Combat.getBattle(); if (!b) { this._playMusic('forest_ambient'); this.showMainMenu(); return; } if (b.status === 'active') { this._renderBattle(); b.log.slice(-2).forEach(l => { if (l.actor === 'enemy' && !l.displayed) { l.displayed = true; this._addBattleLog('💢', b.monster.name + ' нанёс ' + l.damage + ' урона!', '#f44336'); } }); } },
    _addBattleLog(icon, text, color) { const log = document.getElementById('battle-log'); if (!log) return; const d = document.createElement('div'); d.textContent = icon + ' ' + text; d.style.cssText = 'color:' + color + ';margin-bottom:3px'; log.appendChild(d); log.scrollTop = log.scrollHeight; },
    _onBattleVictory() { const b = Sherwood.Combat.getBattle(); if (b?.dungeonTile) { Sherwood.Combat.endBattle(); this._playMusic('dungeon_ambient'); this._renderDungeon(); } else { this._playSound('victory'); setTimeout(() => { Sherwood.Combat.endBattle(); this._playMusic('forest_ambient'); this.showQuests(); }, 300); } },
    _onBattleDefeat() { this._playSound('defeat'); setTimeout(() => { Sherwood.Combat.endBattle(); const p = Sherwood.getPlayer(); p.stats.hp = Math.floor(p.stats.maxHp / 2); this._playMusic('forest_ambient'); this.showMainMenu(); }, 300); },
        showDungeon() {
        this._container.style.background = "url('assets/icons/bg_dungeon.png') center/cover no-repeat";
        const p = Sherwood.getPlayer();
        this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#70a0e0">🌲 Чащоба</h2><div style="background:rgba(0,0,0,0.6);border-radius:10px;padding:14px;text-align:center;margin:10px 0"><div style="font-size:3em">🌲</div><p style="color:#aaa">Исследуй глубины леса.</p></div><div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center"><span style="color:#70a0e0">🎫 ${p.dungeon.tickets}/${p.dungeon.maxTickets}</span></div><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center"><span style="color:#4caf50">❤️ ${p.stats.hp}/${p.stats.maxHp}</span></div></div>
        ${this._dungeonBtn('easy','🌿','Лёгкая прогулка','3-4 монстров')}
        ${this._dungeonBtn('normal','🌲','Обычная чащоба','4-6 монстров')}
        ${this._dungeonBtn('hard','🌳','Гиблое место','5-7 монстров')}</div>`;
    },
    
    _dungeonBtn(diff, icon, name, desc) { const p = Sherwood.getPlayer(); const dis = p.dungeon.tickets <= 0; return `<button onclick="Sherwood.UI._startDungeon('${diff}')" style="width:100%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px;margin-bottom:6px;color:#fff;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px" ${dis?'disabled':''}><span style="font-size:1.5em">${icon}</span><div><div>${name}</div><div style="font-size:0.7em;color:#aaa">${desc}</div></div><span style="margin-left:auto">→</span></button>`; },
    _startDungeon(diff) { const d = Sherwood.Dungeon.generateDungeon(diff); if (!d) { alert('Нет билетов!'); return; } this._playSound('dungeon_enter'); this._playMusic('dungeon_ambient'); this._renderDungeon(); },
    
    _renderDungeon() {
        const d = Sherwood.Dungeon.getDungeon(); if (!d) { this.showDungeon(); return; }
        let gh = ''; const cs = Math.min(80, Math.floor((window.innerWidth - 32) / d.size));
        for (let y = 0; y < d.size; y++) { gh += '<div style="display:flex;justify-content:center;gap:2px;margin-bottom:2px">';
            for (let x = 0; x < d.size; x++) { const t = d.grid[y][x]; const ip = d.playerPos.x === x && d.playerPos.y === y; const ex = t.explored; const it = d.pathSet.has(`${x},${y}`); const ia = Math.abs(x - d.playerPos.x) + Math.abs(y - d.playerPos.y) === 1; const cl = it && ia && !ip && d.status === 'active';
                let is = t.closedTile || 'assets/icons/Dungeon tiles1.jpeg'; if (ex || ip) is = t.pathTile || 'assets/icons/level_seamless_horizontal_loop_1.jpg';
                let ov = ''; if (ex && t.type === 'chest' && !t.looted) ov = '🎁'; else if (ex && t.type === 'trap' && t.triggered) ov = '💢'; else if (ex && t.type === 'heal' && !t.used) ov = '💊'; else if (ex && t.type === 'exit') ov = '🪜';
                const bc = ip ? '#ffd700' : ex ? 'rgba(255,255,255,0.4)' : '#444'; const cu = cl ? 'pointer' : 'default'; const op = (!ex && !ip && !it) ? '0.5' : '1';
                gh += `<div onclick="${cl ? `Sherwood.UI._dungeonClick(${x},${y})` : ''}" style="width:${cs}px;height:${cs}px;position:relative;background-image:url('${is}');background-size:cover;background-position:center;border:2px solid ${bc};border-radius:4px;cursor:${cu};opacity:${op};${ip ? 'box-shadow:0 0 12px rgba(255,215,0,0.8)' : ''}"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-shadow:0 0 3px rgba(0,0,0,0.9);pointer-events:none;font-size:${cs * 0.4}px">${ov}</div>${ip ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${cs * 0.5}px;pointer-events:none">🏹</div>` : ''}</div>`; }
            gh += '</div>'; }
        const p = Sherwood.getPlayer(); const ep = d.tunnelLength > 0 ? Math.min(100, (d.tilesExplored / d.tunnelLength * 100)).toFixed(0) : 0;
        this._container.innerHTML = `<div style="background:#0d0d1a;min-height:100%;padding:12px;display:flex;flex-direction:column;align-items:center"><div style="width:100%;max-width:${cs * d.size + 20}px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><button onclick="Sherwood.UI._leaveDungeon()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#ccc;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px">← Выйти</button><div style="text-align:center;color:#70a0e0;font-weight:bold">🌲 Чащоба</div><div style="text-align:right;color:#4caf50;font-size:13px">❤️${p.stats.hp}</div></div><div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 10px;margin-bottom:8px"><div style="display:flex;justify-content:space-around;font-size:11px;color:#aaa"><span>🗡️${d.monstersKilled}</span><span>🎁${d.chestsOpened}</span><span>⚠️${d.trapsTriggered}</span><span>💚${d.hpHealed}</span></div><div style="background:rgba(255,255,255,0.08);border-radius:3px;height:4px;margin-top:4px"><div style="background:#70a0e0;height:100%;width:${ep}%;border-radius:3px;transition:width 0.3s"></div></div><div style="font-size:10px;color:#70a0e0;text-align:right">${ep}%</div></div><div style="margin:8px 0">${gh}</div><div id="dungeon-log" style="text-align:center;font-size:12px;color:#aaa;min-height:16px;margin-top:4px"></div><div style="text-align:center;font-size:10px;color:#555;margin-top:2px">Нажимай на соседние клетки</div></div></div>`;
    },
    
    _dungeonClick(x, y) { const d = Sherwood.Dungeon.getDungeon(); if (!d || d.status !== 'active') return; const r = Sherwood.Dungeon.moveToTile(x, y); if (!r) return; const log = document.getElementById('dungeon-log'); if (!r.success) { if (log) log.textContent = r.reason === 'wall' ? '🚫 Стена' : '🚫 Далеко'; return; } switch (r.type) { case 'monster': if (log) log.textContent = '⚔️ Монстр!'; this._renderDungeon(); const b = Sherwood.Dungeon.fightMonster(r.tile); if (b) setTimeout(() => this._renderBattle(), 300); break; case 'chest': this._playSound('chest_open'); if (log) { const g = r.reward?.gold || 0; const s = r.reward?.silver || 0; log.textContent = '🎁 +' + g + '🪙 +' + s + '⚪' + (r.item ? ' | Предмет!' : ''); } this._renderDungeon(); break; case 'trap': this._playSound('trap_trigger'); if (log) log.textContent = '⚠️ -' + r.damage + ' HP'; this._renderDungeon(); break; case 'heal': if (log) log.textContent = '💚 +' + r.healAmount + ' HP'; this._renderDungeon(); break; case 'exit': if (log) log.textContent = '🏆 Чащоба пройдена!'; this._renderDungeon(); setTimeout(() => { this._playMusic('forest_ambient'); this.showDungeon(); }, 2000); break; case 'empty': if (log) log.textContent = ''; this._renderDungeon(); break; } const p = Sherwood.getPlayer(); if (p.stats.hp <= 0) { if (log) log.textContent = '💀 Ранение...'; setTimeout(() => { Sherwood.Dungeon.leaveDungeon(); p.stats.hp = Math.floor(p.stats.maxHp / 3); this._playMusic('forest_ambient'); this.showDungeon(); }, 2000); } },
    _leaveDungeon() { if (confirm('Выйти? Прогресс потеряется.')) { Sherwood.Dungeon.leaveDungeon(); this._playMusic('forest_ambient'); this.showDungeon(); } },
    
    showPortal() {
        const p = Sherwood.getPlayer();
        this._container.style.background = "url('" + this._bg.raid + "') center/cover no-repeat";
        const portals = [
            { id: 'hive', name: 'Портал Нашествия', boss: 'hive_mother', bossName: 'Матка Лесных Короедов', guards: ['chitinous_swarm_guard_1', 'chitinous_swarm_guard_2', 'chitinous_swarm_guard_3'], guardName: 'Хитиновые стражи', icon: '🕷️', cost: 30 },
            { id: 'outlaw', name: 'Портал Искажения', boss: 'cursed_outlaw_king', bossName: 'Проклятый Король Разбойников', guards: ['flesh_warped_executioner_1', 'flesh_warped_executioner_2'], guardName: 'Искажённые палачи', icon: '👑', cost: 50 },
            { id: 'crypt', name: 'Портал Безумия', boss: 'ancient_crypt_warden', bossName: 'Древний Хранитель Склепа', guards: ['blighted_root_monstrosity_1', 'blighted_root_monstrosity_2', 'blighted_root_monstrosity_3'], guardName: 'Осквернённые корни', icon: '🪦', cost: 80 }
        ];
        let portalsHtml = '';
        portals.forEach(portal => {
            const boss = Sherwood.Monsters[portal.boss];
            const canAfford = p.resources.trophies >= portal.cost;
            portalsHtml += `<div style="background:rgba(0,0,0,0.7);border:2px solid ${canAfford?'#4ac470':'#555'};border-radius:14px;padding:16px;margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="font-size:2.5em">${portal.icon}</span><div><div style="color:#60e090;font-weight:bold;font-size:1.1em">${portal.name}</div><div style="color:#aaa;font-size:0.75em">Босс: ${portal.bossName}</div><div style="color:#c9a040;font-size:0.75em">Охрана: ${portal.guardName}</div></div></div><div style="display:flex;align-items:center;gap:8px;background:rgba(244,67,54,0.15);border-radius:10px;padding:10px;margin-bottom:8px"><img src="${boss?.icon||''}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:2px solid #f44336" onerror="this.style.display='none'"><div style="flex:1"><div style="color:#f44336;font-weight:bold">${portal.bossName}</div><div style="font-size:0.7em;color:#aaa">⚔️${boss?.stats?.attack||'?'} 🛡️${boss?.stats?.defense||'?'} ❤️${boss?.stats?.hp||'?'}</div></div><button onclick="Sherwood.UI.startBattle('${portal.boss}','raid')" style="background:${canAfford?'linear-gradient(135deg,#c44050,#8b2030)':'#444'};border:none;border-radius:8px;color:#fff;padding:10px 16px;cursor:${canAfford?'pointer':'not-allowed'};font-weight:bold" ${canAfford?'':'disabled'}>${canAfford?'⚔️ В бой':'🔒'}</button></div><div style="display:flex;gap:6px;flex-wrap:wrap">${portal.guards.map(gid=>{const guard=Sherwood.Monsters[gid];return guard?`<button onclick="Sherwood.UI.startBattle('${gid}','raid')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px;cursor:pointer;text-align:center;flex:1;min-width:70px"><img src="${guard.icon}" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'"><div style="font-size:0.55em;color:#aaa;margin-top:2px">${guard.name}</div></button>`:''}).join('')}</div><div style="text-align:right;margin-top:8px;font-size:0.8em;color:${canAfford?'#ffd700':'#f44336'}">🏆 ${portal.cost} трофеев</div></div>`;
        });
        this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:12px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#4caf50;margin:0 0 4px">🌳 Древний дуб</h2><p style="color:#aaa;font-size:0.8em;margin-bottom:4px">Открывай порталы в мир фей.</p><div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;background:rgba(0,0,0,0.6);border-radius:10px;padding:10px"><span style="font-size:1.5em">🏆</span><div><div style="color:#c9b1ff;font-weight:bold">${p.resources.trophies} трофеев</div><div style="font-size:0.7em;color:#aaa">Зарабатывай в Чащобе и Вылазках</div></div></div>${portalsHtml}</div>`;
    },
    
    showRaid() {
        this._container.style.background = "url('" + this._bg.raid + "') center/cover no-repeat";
        const p = Sherwood.getPlayer();
        let bh = '';
        ['leshy_3|Древний леший','insatiable_triton_3|Древний тритон','devil_toad_3|Жаба-демон','cursed_stag_3|Вендиго','eldritch_essence_3|Пугающая сущность','sherwood_scavenger_3|Химера-мутант','sherwood_abomination|Шервудская Мерзость'].forEach(x => { const [a, b] = x.split('|'); const m = Sherwood.Monsters[a]; if (m) bh += `<button onclick="Sherwood.UI.startBattle('${a}','raid')" style="width:100%;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:14px;margin-bottom:8px;color:#fff;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px"><img src="${m.icon}" style="width:50px;height:50px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'"><div><div>${b}</div><div style="font-size:0.7em;color:#aaa">⚔️${m.stats.attack} 🛡️${m.stats.defense} ❤️${m.stats.hp}</div></div></button>`; });
        this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#f44336">👹 Логово</h2><p style="color:#aaa">Билеты: ${p.raid.tickets}/${p.raid.maxTickets}</p>${bh}</div>`;
    },
    
    showTraining() {
        const p = Sherwood.getPlayer(); if (!p) return;
        this._container.style.background = "url('" + this._bg.training + "') center/cover no-repeat";
        const stats = [
            { key: 'attack', name: 'Атака', icon: '⚔️', color: '#f44336', current: p.stats.attack, level: (p.trainingLevels?.attack || 0), nextBonus: 2 },
            { key: 'defense', name: 'Защита', icon: '🛡️', color: '#2196f3', current: p.stats.defense, level: (p.trainingLevels?.defense || 0), nextBonus: 2 },
            { key: 'hp', name: 'Здоровье', icon: '❤️', color: '#4caf50', current: p.stats.maxHp, level: (p.trainingLevels?.hp || 0), nextBonus: 10 },
            { key: 'agility', name: 'Ловкость', icon: '💨', color: '#ff9800', current: p.stats.agility, level: (p.trainingLevels?.agility || 0), nextBonus: 1 }
        ];
        let statsHtml = '';
        stats.forEach(s => {
            const lvl = s.level || 0;
            let cost;
            if (lvl % 2 === 0) { cost = { gold: Math.floor(50 * Math.pow(1.2, lvl)), silver: 0 }; }
            else { cost = { gold: 0, silver: Math.floor(300 * Math.pow(1.2, lvl - 1)) }; }
            const canAfford = cost.gold > 0 ? p.resources.gold >= cost.gold : p.resources.silver >= cost.silver;
            statsHtml += `<div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-left:3px solid ${s.color};border-radius:10px;padding:14px;margin-bottom:10px"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:1.5em">${s.icon}</span><div style="flex:1"><div style="color:#fff;font-weight:bold">${s.name}</div><div style="font-size:0.8em;color:${s.color}">Уровень ${s.level} | +${s.current}</div><div style="font-size:0.7em;color:#aaa">Следующий: +${s.nextBonus}</div></div><div style="text-align:right"><div style="font-size:0.8em;color:${canAfford?'#ffd700':'#f44336'}">${cost.gold>0?'🪙'+cost.gold:'⚪'+cost.silver}</div><button onclick="Sherwood.UI._trainStat('${s.key}')" style="background:${canAfford?'linear-gradient(135deg,#c9a040,#8b6914)':'#444'};border:none;border-radius:6px;color:${canAfford?'#000':'#888'};padding:6px 14px;cursor:${canAfford?'pointer':'not-allowed'};font-weight:bold;margin-top:4px" ${canAfford?'':'disabled'}>Тренировать</button></div></div></div>`;
        });
        this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:12px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#e0c080;margin:0 0 4px">💪 Тренировка</h2><p style="color:#aaa;font-size:0.8em;margin-bottom:12px">Улучшай базовые характеристики.</p><div style="display:flex;gap:8px;margin-bottom:14px"><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center"><div style="color:#ffd700">🪙 ${p.resources.gold}</div></div><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center"><div style="color:#c0c0c0">⚪ ${p.resources.silver}</div></div></div>${statsHtml}</div>`;
    },
    
    _trainStat(key) {
        const p = Sherwood.getPlayer();
        const config = { attack: { gold: 50, bonus: 2, statKey: 'attack' }, defense: { gold: 50, bonus: 2, statKey: 'defense' }, hp: { gold: 75, bonus: 10, statKey: 'maxHp' }, agility: { gold: 60, bonus: 1, statKey: 'agility' } };
        const cfg = config[key]; if (!cfg) return;
        const lvl = (p.trainingLevels?.[key] || 0);
        let cost;
        if (lvl % 2 === 0) { cost = { gold: Math.floor(cfg.gold * Math.pow(1.2, lvl)), silver: 0 }; }
        else { cost = { gold: 0, silver: Math.floor(300 * Math.pow(1.2, lvl - 1)) }; }
        const canAfford = cost.gold > 0 ? p.resources.gold >= cost.gold : p.resources.silver >= cost.silver;
        if (!canAfford) return;
        if (cost.gold > 0) p.resources.gold -= cost.gold; else p.resources.silver -= cost.silver;
        if (!p.trainingLevels) p.trainingLevels = { attack: 0, defense: 0, hp: 0, agility: 0 };
        p.trainingLevels[key] = (p.trainingLevels[key] || 0) + 1;
        p.stats[cfg.statKey] += cfg.bonus;
        if (key === 'hp') p.stats.hp = Math.min(p.stats.hp + cfg.bonus, p.stats.maxHp);
        Sherwood.saveGame();
        this.showTraining();
        this._playSound('levelup');
    },
    
    showBlacksmith() {
        const p = Sherwood.getPlayer(); if (!p) return;
        this._container.style.background = "url('" + this._bg.blacksmith + "') center/cover no-repeat";
        const parts = ['head', 'shoulders', 'torso', 'hands', 'legs', 'feet', 'weapon1', 'weapon2'];
        const upgradeableItems = [];
        parts.forEach(part => {
            const item = p.equipment[part];
            if (item) {
                const level = item.level || 1;
                if (level < 10) {
                    let cost;
                    if (level % 2 === 1) { cost = { gold: Math.floor(50 * Math.pow(1.15, level)), silver: 0 }; }
                    else { cost = { gold: 0, silver: Math.floor(250 * Math.pow(1.15, level - 1)) }; }
                    upgradeableItems.push({ part, item, level, maxLevel: 10, cost });
                }
            }
        });
        let itemsHtml = '';
        if (upgradeableItems.length === 0) { itemsHtml = '<div style="color:#aaa;text-align:center;padding:20px">Нет предметов для улучшения</div>'; }
        else {
            upgradeableItems.forEach((data, i) => {
                const gc = Sherwood.Models?.GradeColors?.[data.item.grade] || '#9d9d9d';
                const canAfford = data.cost.gold > 0 ? p.resources.gold >= data.cost.gold : p.resources.silver >= data.cost.silver;
                itemsHtml += `<div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-left:3px solid ${gc};border-radius:10px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px"><img src="assets/lor/Square_video_game_icon_of_a_heavy_medieval_blacksmith_anvil_flat_2573787088.jpeg" style="width:36px;height:36px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.display='none'"><span style="font-size:1.2em;flex-shrink:0">⚒️</span><div style="flex:1;min-width:0"><div style="color:#fff;font-size:0.85em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${data.item.name}</div><div style="font-size:0.65em"><span style="color:${gc}">${data.item.grade?.toUpperCase()}</span><span style="color:#aaa"> | Ур.${data.level} → ${data.level+1}</span></div></div><div style="text-align:right;flex-shrink:0"><div style="font-size:0.75em;color:${canAfford?'#ffd700':'#f44336'}">${data.cost.gold>0?'🪙'+data.cost.gold:'⚪'+data.cost.silver}</div><button onclick="Sherwood.UI._upgradeItem(${i})" style="background:${canAfford?'linear-gradient(135deg,#c9a040,#8b6914)':'#444'};border:none;border-radius:5px;color:${canAfford?'#000':'#888'};padding:5px 12px;cursor:${canAfford?'pointer':'not-allowed'};font-weight:bold;font-size:0.75em;margin-top:3px" ${canAfford?'':'disabled'}>Улучшить</button></div></div>`;
            });
        }
        this._upgradeData = upgradeableItems;
        this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:12px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><img src="assets/lor/Square_video_game_icon_of_a_heavy_medieval_blacksmith_anvil_flat_2573787088.jpeg" style="width:40px;height:40px;object-fit:cover;border-radius:8px" onerror="this.style.display='none'"><h2 style="color:#e0c080;margin:0">⚒️ Кузница</h2></div><p style="color:#aaa;font-size:0.8em;margin-bottom:4px">Улучшай уровень предметов. Статы растут с каждым уровнем.</p><div style="display:flex;gap:8px;margin-bottom:14px"><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center"><div style="color:#ffd700">🪙 ${p.resources.gold}</div></div><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center"><div style="color:#c0c0c0">⚪ ${p.resources.silver}</div></div></div>${itemsHtml}</div>`;
    },
    
    _upgradeItem(index) {
        const p = Sherwood.getPlayer();
        const data = this._upgradeData[index]; if (!data) return;
        const canAfford = data.cost.gold > 0 ? p.resources.gold >= data.cost.gold : p.resources.silver >= data.cost.silver;
        if (!canAfford) return;
        if (data.cost.gold > 0) p.resources.gold -= data.cost.gold; else p.resources.silver -= data.cost.silver;
        data.item.level = (data.item.level || 1) + 1;
        if (!data.item.stats) data.item.stats = {};
        Object.keys(data.item.stats).forEach(stat => { data.item.stats[stat] += 1; });
        Sherwood._recalcStats();
        Sherwood.saveGame();
        this._playSound('levelup');
        this.showBlacksmith();
    },
    
    showTavern() { this._playMusic('tavern_ambient'); this._container.style.background = "url('" + this._bg.tavern + "') center/cover no-repeat"; this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#e0c080">🍺 Таверна «Весёлый Разбойник»</h2><p style="color:#aaa">Ежедневные задания в разработке.</p></div>`; },
    showBestiary() { this._container.style.background = "url('" + this._bg.bestiary + "') center/cover no-repeat"; const p = Sherwood.getPlayer(); let h = ''; Object.values(Sherwood.Monsters).forEach(m => { const k = p.bestiary[m.id]?.killed || 0; h += `<div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-left:3px solid ${m.isBoss?'#f44336':'rgba(255,255,255,0.2)'};border-radius:10px;padding:10px;margin-bottom:6px"><div style="display:flex;align-items:center;gap:8px"><img src="${m.icon}" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'"><div style="flex:1"><b style="color:#fff">${m.name}</b><div style="color:#e0c080">Убито: ${k}</div></div>${m.isBoss?'<span style="color:#f44336">👑</span>':''}</div></div>`; }); this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#e0c080">📖 Охотничий дневник</h2>${h}</div>`; },
    showArena() { this._container.style.background = "url('" + this._bg.pvp_arena + "') center/cover no-repeat"; this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#e0c080">🎯 Турнир лучников</h2><p style="color:#aaa">PvP Арена в разработке.</p></div>`; },
    showBlackMarket() { this._container.style.background = "url('" + this._bg.blackmarket + "') center/cover no-repeat"; this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#e0c080">💰 Разбойничий схрон</h2><p style="color:#aaa">Рынок в разработке.</p></div>`; },
    showEvents() { this._ph('🎪 Ивенты', 'Охота, Погоня, Зов огня — в разработке.'); },
    _ph(title, text) { this._container.innerHTML = `<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.6),rgba(0,0,0,0.9));padding:16px;max-width:500px;margin:0 auto"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px">← Назад</button><h2 style="color:#e0c080">${title}</h2><div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:30px;text-align:center"><div style="font-size:4em">🏗️</div><p style="color:#aaa;white-space:pre-line">${text}</p></div></div>`; }
};

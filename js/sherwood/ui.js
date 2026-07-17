function getAvatarUrl(avatarSrc) {
    if (!avatarSrc || avatarSrc === 'icons/01icon.png' || avatarSrc === '001') return 'assets/icons/01icon.png';
    if (typeof avatarSrc === 'string' && avatarSrc.startsWith('assets/')) return avatarSrc;
    if (typeof avatarSrc === 'string' && avatarSrc.match(/^\d+$/)) return 'assets/avatar/' + avatarSrc + 'ava.png';
    return 'assets/icons/01icon.png';
}

Sherwood.UI = {
    _currentScreen: null, _container: null, _currentMusic: null, _currentMusicKey: null, _sounds: {}, _soundEnabled: true,
    
    // Пути к фонам
    _bg: {
        main: 'assets/icons/bg_main.png',
        tavern: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_outlaw_tavern_hidden_in_551664901.jpeg',
        blackmarket: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_outlaw_black_market_sho_2924495327.jpeg',
        profile: 'assets/lor/Concept_art_of_an_empty_ambient_medieval_rogues_armory_workshop__711067792.jpeg',
        inventory: 'assets/lor/Concept_art_of_a_medieval_rogues_leather_inventory_bag_open_wide_3426009160.jpeg',
        bestiary: 'assets/lor/Concept_art_of_an_empty_medieval_monster_hunters_study_desk_insi_4116191878.jpeg',
        quests: 'assets/lor/Concept_art_of_a_medieval_fantasy_game_quest_log_user_interface__2570654912.jpeg',
        training: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_game_attributes_upgrade_3888850448.jpeg',
        skills: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_game_spellbook_menu_bac_2764741742.jpeg',
        blacksmith: 'assets/lor/Concept_art_of_an_empty_medieval_fantasy_game_blacksmith_upgrade_1828056045.jpeg',
        loading: 'assets/lor/Concept_art_of_a_dark_fantasy_video_game_loading_screen_backgrou_3972307865.jpeg',
        dungeon: 'assets/icons/bg_dungeon.png',
        battle: 'assets/icons/bg_battle.png',
        dungeon_arena: 'assets/lor/Concept_art_of_an_empty_combat_arena_inside_a_dark_medieval_fant_1895741054.jpeg',
        pvp_arena: 'assets/lor/Concept_art_of_an_empty_medieval_PvP_battle_arena_hidden_deep_un_1634296726.jpeg',
        quest_arena: 'assets/lor/Concept_art_of_an_empty_mysterious_medieval_quest_battle_arena_h_155216645.jpeg',
        world_boss: 'assets/lor/Concept_art_of_an_empty_apocalyptic_raid_battle_arena_hidden_dee_1709694810.jpeg',
        raid: 'assets/lor/Concept_art_of_an_empty_apocalyptic_raid_battle_arena_hidden_dee_1709694810.jpeg',
        victory: 'assets/lor/Concept_art_of_a_medieval_fantasy_game_victory_reward_popup_scre_3942935428.jpeg',
        defeat: 'assets/lor/Concept_art_of_a_medieval_dark_fantasy_game_defeat_popup_screen__2497010453.jpeg'
    },
    
    init() {
        this._container = document.getElementById('sherwood-game');
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.id = 'sherwood-game';
            this._container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg-primary);z-index:9999;overflow-y:auto;display:none;';
            document.body.appendChild(this._container);
        }
        setTimeout(() => this._addGameButton(), 500);
        const gb = document.getElementById('btn-game'), gl = document.getElementById('label-game');
        if (gb) gb.onclick = () => this.toggle();
        if (gl) gl.onclick = () => this.toggle();
        Sherwood.on('BATTLE_VICTORY', (d) => this._onBattleVictory(d));
        Sherwood.on('BATTLE_DEFEAT', () => this._onBattleDefeat());
        Sherwood.on('PLAYER_LEVEL_UP', () => this._playSound('levelup'));
        this._initSounds();
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
        this._container.innerHTML = 
            '<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0.7));display:flex;flex-direction:column;align-items:center;padding:16px;">' +
            '<div style="width:100%;max-width:500px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<div style="background:rgba(0,0,0,0.7);border-radius:20px;padding:6px 14px;display:flex;align-items:center;gap:6px;">' +
            '<img src="' + getAvatarUrl(p.avatar) + '" style="width:28px;height:28px;border-radius:50%;border:2px solid #c9a040;" onerror="this.src=\'assets/icons/01icon.png\'">' +
            '<span style="color:#e0c080;font-weight:bold;font-size:0.9em;">Ур.' + p.level + '</span></div>' +
            '<div style="display:flex;gap:8px;">' +
            '<div style="background:rgba(0,0,0,0.7);border-radius:16px;padding:4px 10px;"><span style="color:#ffd700;">🪙' + p.resources.gold + '</span></div>' +
            '<div style="background:rgba(0,0,0,0.7);border-radius:16px;padding:4px 10px;"><span style="color:#c0c0c0;">⚪' + p.resources.silver + '</span></div></div></div>' +
            '<div style="position:relative;width:200px;height:280px;margin:10px 0;display:flex;align-items:center;justify-content:center;">' +
            '<div style="position:absolute;bottom:0;width:160px;height:30px;background:radial-gradient(ellipse,rgba(0,0,0,0.7),transparent 70%);border-radius:50%;"></div>' +
            '<img src="assets/icons/Male Archer.png" style="position:relative;z-index:1;max-height:260px;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.5));" onerror="this.style.display=\'none\'">' +
            '<div style="position:absolute;bottom:-5px;width:140px;text-align:center;"><div style="background:rgba(0,0,0,0.7);border-radius:8px;height:5px;overflow:hidden;"><div style="background:linear-gradient(90deg,#c9a040,#ffd700);height:100%;width:' + Math.min(100,(p.exp/p.expToLevel*100)).toFixed(0) + '%;"></div></div><div style="font-size:0.6em;color:#c9a040;margin-top:2px;">✨' + p.exp + '/' + p.expToLevel + '</div></div></div>' +
            '<div style="display:flex;gap:12px;margin-bottom:10px;"><span style="color:#f44336;">⚔️' + p.stats.attack + '</span><span style="color:#2196f3;">🛡️' + p.stats.defense + '</span><span style="color:#4caf50;">❤️' + p.stats.hp + '/' + p.stats.maxHp + '</span></div>' +
            '<div style="display:flex;gap:16px;margin-bottom:12px;">' +
            '<div onclick="Sherwood.UI.showQuests()" style="cursor:pointer;text-align:center;"><div style="width:72px;height:72px;border-radius:50%;background:radial-gradient(circle,#c9a040,#8b6914);border:3px solid #ffd700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(201,160,64,0.4);margin:0 auto;"><span style="font-size:1.8em;">⚔️</span></div><div style="color:#ffd700;font-size:0.65em;margin-top:3px;">Вылазки</div></div>' +
            '<div onclick="Sherwood.UI.showDungeon()" style="cursor:pointer;text-align:center;"><div style="width:72px;height:72px;border-radius:50%;background:radial-gradient(circle,#4a7ac4,#1a3a6a);border:3px solid #70a0e0;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(74,122,196,0.4);margin:0 auto;"><span style="font-size:1.8em;">🌲</span></div><div style="color:#70a0e0;font-size:0.65em;margin-top:3px;">Чащоба</div></div>' +
            '<div onclick="Sherwood.UI.showPortal()" style="cursor:pointer;text-align:center;"><div style="width:72px;height:72px;border-radius:50%;background:radial-gradient(circle,#4ac470,#1a5a2a);border:3px solid #60e090;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(74,196,112,0.4);margin:0 auto;"><span style="font-size:1.8em;">🌳</span></div><div style="color:#60e090;font-size:0.65em;margin-top:3px;">Дуб</div></div></div>' +
            '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:400px;">' +
            ['👤|Профиль|showProfile','🎯|Турнир|showArena','👹|Логово|showRaid','🍺|Таверна|showTavern','📖|Дневник|showBestiary','💰|Схрон|showBlackMarket','🎪|Ивенты|showEvents'].map(x=>{const[a,b,c]=x.split('|');return'<div onclick="Sherwood.UI.'+c+'()" style="cursor:pointer;text-align:center;width:56px;"><div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto;"><span style="font-size:1.2em;">'+a+'</span></div><div style="color:var(--text-dim);font-size:0.55em;margin-top:2px;">'+b+'</div></div>';}).join('') +
            '</div>' +
            '<button onclick="Sherwood.UI.hide()" style="margin-top:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:var(--text-dim);padding:5px 16px;border-radius:12px;cursor:pointer;font-size:0.75em;">✕ Выйти</button></div>';
    },
    
    showProfile() {
        const p=Sherwood.getPlayer(); if(!p)return;
        this._container.style.background="url('"+this._bg.profile+"') center/cover no-repeat";
        const ep=Math.min(100,(p.exp/p.expToLevel*100)).toFixed(0);
        const parts=[{k:'head',n:'Голова',i:'🎩'},{k:'shoulders',n:'Плечи',i:'🧣'},{k:'torso',n:'Торс',i:'👕'},{k:'hands',n:'Руки',i:'🧤'},{k:'legs',n:'Ноги',i:'👖'},{k:'feet',n:'Ступни',i:'👢'},{k:'weapon1',n:'Оружие 1',i:'🏹'},{k:'weapon2',n:'Оружие 2',i:'🗡️'}];
        let eh=''; parts.forEach(pt=>{const it=p.equipment[pt.k];const gc=it?(Sherwood.Models?.GradeColors?.[it.grade]||'#9d9d9d'):'transparent';eh+=`<div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-left:3px solid ${gc};border-radius:10px;padding:12px;margin-bottom:6px;cursor:pointer;" onclick="Sherwood.UI._onEquipSlotClick('${pt.k}')"><div style="display:flex;align-items:center;gap:8px;"><span>${pt.i}</span><div style="flex:1;"><div style="font-size:0.75em;color:#aaa;">${pt.n}</div><div style="color:${it?'#fff':'#aaa'};">${it?it.name:'Пусто'}</div></div><span style="color:#aaa;">→</span></div></div>`;});
        let ih=p.inventory.length===0?'<div style="color:#aaa;text-align:center;padding:20px;">Пусто</div>':p.inventory.map((it,i)=>{const gc=Sherwood.Models?.GradeColors?.[it.grade]||'#9d9d9d';return`<div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-left:3px solid ${gc};border-radius:10px;padding:10px;margin-bottom:4px;display:flex;align-items:center;gap:8px;"><span>📦</span><div style="flex:1;"><div style="color:#fff;">${it.name}</div><div style="font-size:0.7em;color:${gc};">${it.grade?.toUpperCase()}</div></div><button onclick="Sherwood.UI._onEquipItem(${i})" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;">Надеть</button></div>`;}).join('');
        this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button>
        <div style="text-align:center;"><img src="${getAvatarUrl(p.avatar)}" style="width:70px;height:70px;border-radius:50%;border:3px solid #c9a040;" onerror="this.src='assets/icons/01icon.png'"><h3 style="color:#e0c080;margin:6px 0;">${p.name}</h3><div style="color:#fff;">Ур.${p.level} | ✨${p.exp}/${p.expToLevel}</div><div style="background:rgba(255,255,255,0.1);border-radius:6px;height:6px;margin:6px 0;"><div style="background:#4caf50;height:100%;width:${ep}%;border-radius:6px;"></div></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0;font-size:0.85em;color:#fff;"><div>⚔️Атака: <b style="color:#f44336;">${p.stats.attack}</b></div><div>🛡️Защита: <b style="color:#2196f3;">${p.stats.defense}</b></div><div>❤️HP: <b style="color:#4caf50;">${p.stats.hp}/${p.stats.maxHp}</b></div><div>💨Ловкость: <b style="color:#ff9800;">${p.stats.agility}</b></div></div>
        <h4 style="color:#e0c080;margin:12px 0 6px;">🎒 Экипировка</h4>${eh}
        <h4 style="color:#e0c080;margin:12px 0 6px;">📦 Инвентарь (${p.inventory.length}/${p.bagSize})</h4>${ih}</div>`;
    },
    
    _onEquipSlotClick(pt){const p=Sherwood.getPlayer();const it=p.equipment[pt];if(it&&confirm('Снять "'+it.name+'"?')){Sherwood.unequipItem(pt);this.showProfile();}},
    _onEquipItem(i){const p=Sherwood.getPlayer();const it=p.inventory[i];if(it){Sherwood.equipItem(it);p.inventory.splice(i,1);this.showProfile();}},
    
    showQuests() {
        this._container.style.background="url('"+this._bg.quests+"') center/cover no-repeat";
        const chapters=Sherwood.Quests.getAvailableChapters();
        let ch=chapters.map(c=>{const pct=c.totalTasks>0?(c.tasksCompleted/c.totalTasks*100):0;return`<div onclick="Sherwood.UI._startQuest('${c.id}')" style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.5em;">📜</span><div style="flex:1;"><b style="color:#ffd700;">Гл.${c.chapter}: ${c.name}</b><div style="font-size:0.75em;color:#aaa;">${c.tasksCompleted}/${c.totalTasks}</div></div>${c.completed?'✅':'→'}</div>${!c.completed?`<div style="background:rgba(255,255,255,0.1);border-radius:4px;height:4px;margin-top:6px;"><div style="background:#ffd700;height:100%;width:${pct}%;border-radius:4px;"></div></div>`:''}</div>`;}).join('')||'<div style="color:#aaa;text-align:center;padding:20px;">Нет доступных глав.</div>';
        this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#ffd700;margin:0 0 12px;">⚔️ Вылазки</h2>${ch}<h3 style="color:#ffd700;margin:16px 0 8px;">⚡ Быстрый бой</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">${['swamp_ghoul_1|Болотный упырь','cursed_wolf_1|Проклятый волк','swamp_kikimora_1|Кикимора','devil_toad_1|Дьявольская жаба'].map(x=>{const[a,b]=x.split('|');const m=Sherwood.Monsters[a];return`<button onclick="Sherwood.UI.startBattle('${a}')" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px;color:#fff;cursor:pointer;text-align:center;"><img src="${m?.icon||''}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'"><div style="font-size:0.8em;">${b}</div></button>`;}).join('')}</div></div>`;
    },
    
    _startQuest(qid){const q=Sherwood.Quests.startChapter(qid);if(!q)return;let th=q.tasks.map(t=>{const st=q.questState.tasks[t.id];const pct=st?(st.progress/t.target*100):0;const dn=st?.completed;return`<div style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;margin-bottom:6px;"><div style="display:flex;align-items:center;gap:6px;"><span>${dn?'✅':'⬜'}</span><span style="color:#fff;">${t.description}</span></div>${!dn?`<div style="font-size:0.7em;color:#aaa;">${st?.progress||0}/${t.target}</div><div style="background:rgba(255,255,255,0.1);border-radius:3px;height:3px;margin-top:4px;"><div style="background:#4caf50;height:100%;width:${pct}%;border-radius:3px;"></div></div>`:''}</div>`;}).join('');const dn=q.questState.completed;this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.6),rgba(0,0,0,0.9));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showQuests()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#ffd700;">Гл.${q.chapter}: ${q.name}</h2><p style="color:#aaa;">${q.description}</p>${th}${dn?`<div style="background:rgba(255,215,0,0.15);border:2px solid gold;border-radius:10px;padding:14px;text-align:center;margin-top:10px;"><div style="color:gold;font-size:1.1em;">🏆 Глава завершена!</div><div style="color:#fff;">🪙${q.chapterReward.gold||0} ⚪${q.chapterReward.silver||0} ✨${q.chapterReward.exp||0}XP</div></div>`:''}</div>`;},
    
    startBattle(mid, bgKey = 'battle') {
        const b=Sherwood.Combat.startPvE(mid); if(!b)return;
        this._playSound('shot'); this._playMusic('dungeon_ambient');
        this._container.style.background = "url('" + (this._bg[bgKey] || this._bg.battle) + "') center/cover no-repeat";
        this._renderBattle();
    },
    
    _renderBattle(){
        const b=Sherwood.Combat.getBattle();if(!b)return;const e=b.monster;const p=b.player;const m=Sherwood.Monsters[b.monsterId];const eh=Math.max(0,(e.currentHp/e.stats.hp*100)).toFixed(0);const ph=Math.max(0,(p.currentHp/p.stats.hp*100)).toFixed(0);const sk=Sherwood.Combat._getPlayerSkills();let sh=Object.values(sk).map(s=>{const cd=b.cooldowns[s.id]>0;return`<button onclick="Sherwood.UI._onSkillClick('${s.id}')" style="flex:1;padding:10px;background:linear-gradient(135deg,#c9a040,#8b6914);border:none;border-radius:8px;color:#fff;font-weight:bold;cursor:pointer;${cd?'opacity:0.5':''}" ${cd?'disabled':''}>${s.name}${cd?' ('+b.cooldowns[s.id]+')':''}</button>`;}).join('');
        this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto;">
        <button onclick="Sherwood.UI._fleeBattle()" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">🏃 Бежать</button>
        <div style="text-align:center;margin-bottom:16px;"><img src="${m?.icon||''}" style="width:100px;height:100px;object-fit:cover;border-radius:10px;border:2px solid #f44336;" onerror="this.style.display='none'"><div style="font-weight:bold;color:#fff;font-size:1.1em;">${e.name}</div><div style="font-size:0.75em;color:#aaa;">⚔️${e.stats.attack} 🛡️${e.stats.defense}</div><div style="background:rgba(255,0,0,0.3);border-radius:6px;height:8px;margin-top:6px;"><div style="background:#f44336;height:100%;width:${eh}%;border-radius:6px;"></div></div><div style="font-size:0.7em;color:#f44336;">❤️${Math.max(0,e.currentHp)}/${e.stats.hp}</div></div>
        <div style="text-align:center;font-size:1.3em;color:#ffd700;margin:10px 0;">⚡ VS ⚡</div>
        <div style="text-align:center;margin-bottom:16px;"><div style="color:#fff;">${p.name||'Вы'}</div><div style="background:rgba(76,175,80,0.3);border-radius:6px;height:8px;margin-top:4px;"><div style="background:#4caf50;height:100%;width:${ph}%;border-radius:6px;"></div></div><div style="font-size:0.7em;color:#4caf50;">❤️${Math.max(0,p.currentHp)}/${p.stats.hp}</div></div>
        <div style="display:flex;gap:6px;margin-bottom:6px;"><button onclick="Sherwood.UI._onAttackClick()" style="flex:1;padding:12px;background:linear-gradient(135deg,#c44050,#8b2030);border:none;border-radius:8px;color:#fff;font-weight:bold;cursor:pointer;" ${b.turn!=='player'?'disabled':''}>⚔️ Атака</button></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${sh}</div>
        <div id="battle-log" style="margin-top:12px;max-height:120px;overflow-y:auto;font-size:0.75em;color:#aaa;"></div></div>`;
    },
    
    _onAttackClick(){const b=Sherwood.Combat.getBattle();if(!b||b.turn!=='player')return;this._playSound('arrow_hit');const r=Sherwood.Combat.playerAttack();this._updateBattleUI();if(r){this._addBattleLog('🗡️','Вы нанесли '+r.damage+' урона!','#4caf50');if(r.crit)this._addBattleLog('💥','Крит!','#ff9800');}},
    _onSkillClick(sid){const r=Sherwood.Combat.playerUseSkill(sid);this._playSound('arrow_hit');this._updateBattleUI();if(r){const sk=Sherwood.Combat._getPlayerSkills();this._addBattleLog('🎯',sk[sid].name+': '+r.damage+' урона!','#ff9800');if(r.crit)this._addBattleLog('💥','Крит!','#ff9800');}},
    _fleeBattle(){if(Sherwood.Combat.flee()){this._playMusic('forest_ambient');this.showMainMenu();}else{this._addBattleLog('🏃','Не вышло!','#f44336');this._updateBattleUI();}},
    _updateBattleUI(){const b=Sherwood.Combat.getBattle();if(!b){this._playMusic('forest_ambient');this.showMainMenu();return;}if(b.status==='active'){this._renderBattle();b.log.slice(-2).forEach(l=>{if(l.actor==='enemy'&&!l.displayed){l.displayed=true;this._addBattleLog('💢',b.monster.name+' нанёс '+l.damage+' урона!','#f44336');}});}},
    _addBattleLog(icon,text,color){const log=document.getElementById('battle-log');if(!log)return;const d=document.createElement('div');d.textContent=icon+' '+text;d.style.cssText=`color:${color};margin-bottom:3px;`;log.appendChild(d);log.scrollTop=log.scrollHeight;},
    _onBattleVictory(){const b=Sherwood.Combat.getBattle();if(b?.dungeonTile){Sherwood.Combat.endBattle();this._playMusic('dungeon_ambient');this._renderDungeon();}else{this._playSound('victory');setTimeout(()=>{Sherwood.Combat.endBattle();this._playMusic('forest_ambient');this.showQuests();},300);}},
    _onBattleDefeat(){this._playSound('defeat');setTimeout(()=>{Sherwood.Combat.endBattle();const p=Sherwood.getPlayer();p.stats.hp=Math.floor(p.stats.maxHp/2);this._playMusic('forest_ambient');this.showMainMenu();},300);},
    
    showDungeon() {
        this._container.style.background="url('assets/icons/bg_dungeon.png') center/cover no-repeat";
        const p=Sherwood.getPlayer();
        this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto;">
        <button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button>
        <h2 style="color:#70a0e0;">🌲 Чащоба</h2>
        <div style="background:rgba(0,0,0,0.6);border-radius:10px;padding:14px;text-align:center;margin:10px 0;"><div style="font-size:3em;">🌲</div><p style="color:#aaa;">Исследуй глубины леса.</p></div>
        <div style="display:flex;gap:8px;margin-bottom:12px;"><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center;"><span style="color:#70a0e0;">🎫 ${p.dungeon.tickets}/${p.dungeon.maxTickets}</span></div><div style="flex:1;background:rgba(0,0,0,0.6);border-radius:8px;padding:8px;text-align:center;"><span style="color:#4caf50;">❤️ ${p.stats.hp}/${p.stats.maxHp}</span></div></div>
        ${this._dungeonBtn('easy','🌿','Лёгкая прогулка','3-4 монстров')}
        ${this._dungeonBtn('normal','🌲','Обычная чащоба','4-6 монстров')}
        ${this._dungeonBtn('hard','🌳','Гиблое место','5-7 монстров')}</div>`;
    },
    
    _dungeonBtn(diff,icon,name,desc){const p=Sherwood.getPlayer();const dis=p.dungeon.tickets<=0;return`<button onclick="Sherwood.UI._startDungeon('${diff}')" style="width:100%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px;margin-bottom:6px;color:#fff;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;" ${dis?'disabled':''}><span style="font-size:1.5em;">${icon}</span><div><div>${name}</div><div style="font-size:0.7em;color:#aaa;">${desc}</div></div><span style="margin-left:auto;">→</span></button>`;},
    
    _startDungeon(diff){const d=Sherwood.Dungeon.generateDungeon(diff);if(!d){alert('Нет билетов!');return;}this._playSound('dungeon_enter');this._playMusic('dungeon_ambient');this._renderDungeon();},
    
    _renderDungeon() {
        const d=Sherwood.Dungeon.getDungeon();if(!d){this.showDungeon();return;}
        let gh='';const cs=Math.min(80,Math.floor((window.innerWidth-32)/d.size));
        for(let y=0;y<d.size;y++){gh+='<div style="display:flex;justify-content:center;gap:2px;margin-bottom:2px;">';
            for(let x=0;x<d.size;x++){const t=d.grid[y][x];const ip=d.playerPos.x===x&&d.playerPos.y===y;const ex=t.explored;const it=d.pathSet.has(`${x},${y}`);const ia=Math.abs(x-d.playerPos.x)+Math.abs(y-d.playerPos.y)===1;const cl=it&&ia&&!ip&&d.status==='active';
                let is=t.closedTile||'assets/icons/Dungeon tiles1.jpeg';if(ex||ip)is=t.pathTile||'assets/icons/Sherwood dungeon path1.jpeg';
                let ov='';if(ex&&t.type==='chest'&&!t.looted)ov='🎁';else if(ex&&t.type==='trap'&&t.triggered)ov='💢';else if(ex&&t.type==='heal'&&!t.used)ov='💊';else if(ex&&t.type==='exit')ov='🪜';
                const bc=ip?'#ffd700':ex?'rgba(255,255,255,0.4)':'#444';const cu=cl?'pointer':'default';const op=(!ex&&!ip&&!it)?'0.5':'1';
                gh+=`<div onclick="${cl?`Sherwood.UI._dungeonClick(${x},${y})`:''}" style="width:${cs}px;height:${cs}px;position:relative;background-image:url('${is}');background-size:cover;background-position:center;border:2px solid ${bc};border-radius:4px;cursor:${cu};opacity:${op};${ip?'box-shadow:0 0 12px rgba(255,215,0,0.8);':''}"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-shadow:0 0 3px rgba(0,0,0,0.9);pointer-events:none;font-size:${cs*0.4}px;">${ov}</div>${ip?`<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${cs*0.5}px;pointer-events:none;">🏹</div>`:''}</div>`;}
            gh+='</div>';}
        const p=Sherwood.getPlayer();const ep=d.tunnelLength>0?Math.min(100,(d.tilesExplored/d.tunnelLength*100)).toFixed(0):0;
        this._container.innerHTML=`<div style="background:#0d0d1a;min-height:100%;padding:12px;display:flex;flex-direction:column;align-items:center;"><div style="width:100%;max-width:${cs*d.size+20}px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><button onclick="Sherwood.UI._leaveDungeon()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#ccc;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;">← Выйти</button><div style="text-align:center;color:#70a0e0;font-weight:bold;">🌲 Чащоба</div><div style="text-align:right;color:#4caf50;font-size:13px;">❤️${p.stats.hp}</div></div>
        <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 10px;margin-bottom:8px;"><div style="display:flex;justify-content:space-around;font-size:11px;color:#aaa;"><span>🗡️${d.monstersKilled}</span><span>🎁${d.chestsOpened}</span><span>⚠️${d.trapsTriggered}</span><span>💚${d.hpHealed}</span></div><div style="background:rgba(255,255,255,0.08);border-radius:3px;height:4px;margin-top:4px;"><div style="background:#70a0e0;height:100%;width:${ep}%;border-radius:3px;transition:width 0.3s;"></div></div><div style="font-size:10px;color:#70a0e0;text-align:right;">${ep}%</div></div>
        <div style="margin:8px 0;">${gh}</div>
        <div id="dungeon-log" style="text-align:center;font-size:12px;color:#aaa;min-height:16px;margin-top:4px;"></div><div style="text-align:center;font-size:10px;color:#555;margin-top:2px;">Нажимай на соседние клетки</div></div></div>`;
    },
    
    _dungeonClick(x,y){const d=Sherwood.Dungeon.getDungeon();if(!d||d.status!=='active')return;const r=Sherwood.Dungeon.moveToTile(x,y);if(!r)return;const log=document.getElementById('dungeon-log');if(!r.success){if(log)log.textContent=r.reason==='wall'?'🚫 Стена':'🚫 Далеко';return;}
        switch(r.type){case'monster':if(log)log.textContent='⚔️ Монстр!';this._renderDungeon();const b=Sherwood.Dungeon.fightMonster(r.tile);if(b)setTimeout(()=>this._renderBattle(),300);break;
        case'chest':this._playSound('chest_open');if(log){const g=r.reward?.gold||0;const s=r.reward?.silver||0;log.textContent='🎁 +'+g+'🪙 +'+s+'⚪'+(r.item?' | Предмет!':'');}this._renderDungeon();break;
        case'trap':this._playSound('trap_trigger');if(log)log.textContent='⚠️ -'+r.damage+' HP';this._renderDungeon();break;
        case'heal':if(log)log.textContent='💚 +'+r.healAmount+' HP';this._renderDungeon();break;
        case'exit':if(log)log.textContent='🏆 Чащоба пройдена!';this._renderDungeon();setTimeout(()=>{this._playMusic('forest_ambient');this.showDungeon();},2000);break;
        case'empty':if(log)log.textContent='';this._renderDungeon();break;}
        const p=Sherwood.getPlayer();if(p.stats.hp<=0){if(log)log.textContent='💀 Ранение...';setTimeout(()=>{Sherwood.Dungeon.leaveDungeon();p.stats.hp=Math.floor(p.stats.maxHp/3);this._playMusic('forest_ambient');this.showDungeon();},2000);}},
    _leaveDungeon(){if(confirm('Выйти? Прогресс потеряется.')){Sherwood.Dungeon.leaveDungeon();this._playMusic('forest_ambient');this.showDungeon();}},
    
    showArena(){this._container.style.background="url('"+this._bg.pvp_arena+"') center/cover no-repeat";this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#e0c080;">🎯 Турнир лучников</h2><p style="color:#aaa;">PvP Арена в разработке.</p></div>`;},
    showRaid(){this._container.style.background="url('"+this._bg.raid+"') center/cover no-repeat";const p=Sherwood.getPlayer();let bh='';['leshy_3|Древний леший','insatiable_triton_3|Древний тритон','devil_toad_3|Жаба-демон','cursed_stag_3|Вендиго','eldritch_essence_3|Пугающая сущность','sherwood_scavenger_3|Химера-мутант'].forEach(x=>{const[a,b]=x.split('|');const m=Sherwood.Monsters[a];if(m)bh+=`<button onclick="Sherwood.UI.startBattle('${a}','raid')" style="width:100%;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:14px;margin-bottom:8px;color:#fff;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;"><img src="${m.icon}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'"><div><div>${b}</div><div style="font-size:0.7em;color:#aaa;">⚔️${m.stats.attack} 🛡️${m.stats.defense} ❤️${m.stats.hp}</div></div></button>`;});this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.8));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#f44336;">👹 Логово</h2><p style="color:#aaa;">Билеты: ${p.raid.tickets}/${p.raid.maxTickets}</p>${bh}</div>`;},
    showTavern(){this._playMusic('tavern_ambient');this._container.style.background="url('"+this._bg.tavern+"') center/cover no-repeat";this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#e0c080;">🍺 Таверна «Весёлый Разбойник»</h2><p style="color:#aaa;">Ежедневные задания в разработке.</p></div>`;},
    showPortal(){const p=Sherwood.getPlayer();this._container.style.background="url('assets/lor/2D_sidescroller_RPG_game_background_ultrawide_horizontal_panoram_1395681920.jpeg') center/cover no-repeat";this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#4caf50;">🌳 Древний дуб</h2><div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:20px;text-align:center;"><div style="font-size:4em;">🌳</div><p style="color:#aaa;">Требуется: 🏆 50 трофеев</p><p style="color:#e0c080;">У вас: 🏆 ${p.resources.trophies}</p></div></div>`;},
    showBlackMarket(){this._container.style.background="url('"+this._bg.blackmarket+"') center/cover no-repeat";this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#e0c080;">💰 Разбойничий схрон</h2><p style="color:#aaa;">Рынок в разработке.</p></div>`;},
    showBestiary(){this._container.style.background="url('"+this._bg.bestiary+"') center/cover no-repeat";const p=Sherwood.getPlayer();let h='';Object.values(Sherwood.Monsters).forEach(m=>{const k=p.bestiary[m.id]?.killed||0;h+=`<div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-left:3px solid ${m.isBoss?'#f44336':'rgba(255,255,255,0.2)'};border-radius:10px;padding:10px;margin-bottom:6px;"><div style="display:flex;align-items:center;gap:8px;"><img src="${m.icon}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'"><div style="flex:1;"><b style="color:#fff;">${m.name}</b><div style="color:#e0c080;">Убито: ${k}</div></div>${m.isBoss?'<span style="color:#f44336;">👑</span>':''}</div></div>`;});this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.7));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#e0c080;">📖 Охотничий дневник</h2>${h}</div>`;},
    showEvents(){this._ph('🎪 Ивенты','Охота, Погоня, Зов огня — в разработке.');},
    _ph(title,text){this._container.innerHTML=`<div style="min-height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.6),rgba(0,0,0,0.9));padding:16px;max-width:500px;margin:0 auto;"><button onclick="Sherwood.UI.showMainMenu()" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;margin-bottom:12px;">← Назад</button><h2 style="color:#e0c080;">${title}</h2><div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:30px;text-align:center;"><div style="font-size:4em;">🏗️</div><p style="color:#aaa;white-space:pre-line;">${text}</p></div></div>`;}
};

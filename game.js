// ============================================================
//  GAME.JS - Игровое ядро RobinHood P2P (интегрированная версия)
//  Использует существующий UI мессенджера
// ============================================================

class Game {
    constructor(p2p) {
        this.p2p = p2p;
        this.isRunning = false;
        this.phaser = null;
        this.currentScene = 'arena';
        this.gameContainer = null;
        
        // Игровые модули
        this.player = new GamePlayer();
        this.battle = new GameBattle(this.p2p);
        this.blackMarket = new GameBlackMarket(this.p2p);
        
        // Состояние игры
        this.state = {
            arena: null,
            dungeon: null,
            market: [],
            players: {}
        };
        
        // Подписка на события P2P
        this.p2p.on('game-action', (data) => {
            if (data.verified) this.handleGameAction(data);
        });
        
        this.p2p.on('game-started', () => {
            this.start();
        });
        
        this.p2p.on('game-stopped', () => {
            this.stop();
        });
        
        // Создаем контейнер игры внутри UI
        this.createGameContainer();
        
        // Добавляем обработчики для кнопок в UI
        this.setupUIHandlers();
    }
    
    createGameContainer() {
        // Проверяем, не существует ли уже контейнер
        if (document.getElementById('game-container')) return;
        
        const container = document.createElement('div');
        container.id = 'game-container';
        container.className = 'game-container';
        container.style.display = 'none';
        
        container.innerHTML = `
            <div class="game-header">
                <span class="game-title">🏹 Шервудская битва</span>
                <div class="game-stats">
                    <span id="game-hp">❤️ 100</span>
                    <span id="game-atk">⚔️ 5</span>
                    <span id="game-def">🛡️ 3</span>
                    <span id="game-gold">💰 50</span>
                    <span id="game-lvl">⭐ 1</span>
                </div>
                <button class="game-close" id="game-close-btn">✕</button>
            </div>
            <div class="game-canvas" id="phaser-canvas"></div>
            <div class="game-controls">
                <button class="game-btn active" data-scene="arena">⚔️ Арена</button>
                <button class="game-btn" data-scene="dungeon">🏰 Данж</button>
                <button class="game-btn" data-scene="shop">🛒 Магазин</button>
                <button class="game-btn" data-scene="market">🔄 Лавка</button>
            </div>
        `;
        
        document.body.appendChild(container);
        this.gameContainer = container;
        
        // Обработчики кнопок сцен
        container.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const scene = btn.dataset.scene;
                this.switchScene(scene);
            });
        });
        
        // Кнопка закрытия
        container.querySelector('#game-close-btn').addEventListener('click', () => {
            this.stop();
        });
    }
    
    setupUIHandlers() {
        // Находим кнопку "Игра" в хедере
        const gameBtn = document.getElementById('btn-game');
        if (gameBtn) {
            gameBtn.addEventListener('click', () => {
                if (this.isRunning) {
                    this.stop();
                } else {
                    this.start();
                }
            });
        }
        
        // Добавляем обработку игровых команд в чате
        // Сохраняем оригинальный обработчик отправки
        const originalSend = window.sendMessageHandler || function() {};
        
        // Переопределяем обработчик
        window.sendMessageHandler = (text) => {
            if (text.startsWith('!')) {
                return this.handleGameCommand(text);
            }
            // Если не команда, передаем дальше
            if (originalSend) originalSend(text);
        };
    }
    
    handleGameCommand(text) {
        const parts = text.slice(1).trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch(command) {
            case 'атака':
            case 'attack':
                if (args.length > 0) {
                    const target = args.join(' ');
                    this.battle.attack(target);
                    return true;
                }
                break;
                
            case 'статус':
            case 'status':
                this.showStatus();
                return true;
                
            case 'инвентарь':
            case 'inventory':
                this.showInventory();
                return true;
                
            case 'лечить':
            case 'heal':
                this.player.heal(20);
                this.updateStats();
                this.showMessage(`❤️ Вылечился! HP: ${this.player.hp}/${this.player.maxHp}`);
                return true;
                
            case 'помощь':
            case 'help':
                this.showHelp();
                return true;
                
            case 'торг':
            case 'trade':
                if (args.length > 0) {
                    const item = args[0];
                    const price = parseInt(args[1]) || 10;
                    this.blackMarket.listItem(item, price);
                    this.showMessage(`📦 Выставил на продажу: ${item} за ${price}💰`);
                    return true;
                }
                break;
                
            case 'купить':
            case 'buy':
                if (args.length > 0) {
                    const listingId = parseInt(args[0]);
                    this.blackMarket.buyItem(listingId);
                    return true;
                }
                break;
                
            default:
                this.showMessage(`❌ Неизвестная команда. Используйте !помощь`);
                return true;
        }
        return false;
    }
    
    showHelp() {
        const msg = `
🏹 **Команды RobinHood:**
!атака [имя] - атаковать игрока
!статус - показать свой статус
!инвентарь - показать инвентарь
!лечить - восстановить HP (20)
!торг [предмет] [цена] - выставить на продажу
!купить [ID] - купить предмет
!помощь - показать это сообщение
        `;
        this.showMessage(msg);
        appendMessage('Игра', msg, 'icons/01icon.png');
    }
    
    showStatus() {
        const msg = `
🏹 **Твой статус:**
❤️ HP: ${this.player.hp}/${this.player.maxHp}
⚔️ Атака: ${this.player.attack}
🛡️ Защита: ${this.player.defense}
💰 Золото: ${this.player.gold}
⭐ Уровень: ${this.player.level}
📊 Опыт: ${this.player.experience}/${this.player.getExpForLevel()}
        `;
        this.showMessage(msg);
        appendMessage('Игра', msg, 'icons/01icon.png');
    }
    
    showInventory() {
        const items = this.player.inventory.length > 0 
            ? this.player.inventory.join(', ') 
            : 'пусто';
        const msg = `🎒 **Инвентарь:** ${items}`;
        this.showMessage(msg);
        appendMessage('Игра', msg, 'icons/01icon.png');
    }
    
    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        // Показываем контейнер игры
        if (this.gameContainer) {
            this.gameContainer.style.display = 'flex';
        }
        
        // Загружаем игрока
        this.player.load();
        this.updateStats();
        
        // Инициализируем Phaser
        await this.initPhaser();
        
        // Рендерим сцену
        this.renderScene('arena');
        
        // Начинаем синхронизацию
        this.startSync();
        
        // Уведомляем P2P
        this.p2p._emit('game-started', { player: this.player });
        
        // Меняем иконку кнопки в хедере
        const gameBtn = document.getElementById('btn-game');
        if (gameBtn) {
            gameBtn.innerHTML = '<img src="assets/icons/06icon.png" alt="game" style="filter:drop-shadow(0 0 8px #4caf50)">';
        }
        
        this.showMessage('🏹 Игра началась!');
    }
    
    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        
        // Скрываем контейнер
        if (this.gameContainer) {
            this.gameContainer.style.display = 'none';
        }
        
        // Уничтожаем Phaser
        if (this.phaser) {
            this.phaser.destroy(true);
            this.phaser = null;
        }
        
        // Останавливаем синхронизацию
        this.stopSync();
        
        // Уведомляем P2P
        this.p2p._emit('game-stopped', {});
        
        // Возвращаем иконку
        const gameBtn = document.getElementById('btn-game');
        if (gameBtn) {
            gameBtn.innerHTML = '<img src="assets/icons/02icon.png" alt="game">';
        }
        
        this.showMessage('⏹️ Игра остановлена');
    }
    
    async initPhaser() {
        const canvasContainer = document.getElementById('phaser-canvas');
        if (!canvasContainer) return;
        
        // Очищаем старый Phaser
        if (this.phaser) {
            this.phaser.destroy(true);
            this.phaser = null;
        }
        
        const rect = canvasContainer.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || Math.max(400, window.innerHeight * 0.5);
        
        this.phaser = new Phaser.Game({
            type: Phaser.AUTO,
            parent: canvasContainer,
            width: width,
            height: height,
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-primary').trim() || '#1a1a2a',
            scene: {
                preload: () => this.preloadAssets(),
                create: () => this.createScene(),
                update: () => this.updateScene()
            },
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        });
    }
    
    preloadAssets() {
        // Загружаем ресурсы
        const assets = [
            ['arrow', 'assets/icons/02icon.png'],
            ['player', 'assets/icons/01icon.png'],
            ['enemy', 'assets/icons/08icon.png'],
            ['chest', 'assets/icons/09icon.png'],
            ['gold', 'assets/icons/06icon.png'],
            ['sword', 'assets/icons/04icon.png'],
            ['shield', 'assets/icons/05icon.png'],
            ['bg', 'assets/icons/background.webp']
        ];
        
        assets.forEach(([key, path]) => {
            this.phaser.load.image(key, path);
        });
    }
    
    createScene() {
        const { width, height } = this.phaser.scale;
        
        // Фон
        this.bg = this.phaser.add.image(width/2, height/2, 'bg');
        this.bg.setDisplaySize(width, height);
        this.bg.setAlpha(0.3);
        
        // Текст состояния
        this.statusText = this.phaser.add.text(width/2, 30, '🏹 Шервудская битва', {
            fontSize: '24px',
            fill: '#a0b0e0',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 3
        });
        this.statusText.setOrigin(0.5);
        
        // Создаем сцены
        this.createArenaScene();
        this.createDungeonScene();
        this.createShopScene();
        
        // Показываем текущую сцену
        this.showScene(this.currentScene);
        this.sceneReady = true;
    }
    
    createArenaScene() {
        const { width, height } = this.phaser.scale;
        const group = this.phaser.add.group();
        
        // Игрок
        this.playerSprite = this.phaser.add.image(width * 0.3, height * 0.6, 'player');
        this.playerSprite.setDisplaySize(80, 80);
        group.add(this.playerSprite);
        
        // Враг
        this.enemySprite = this.phaser.add.image(width * 0.7, height * 0.6, 'enemy');
        this.enemySprite.setDisplaySize(80, 80);
        this.enemySprite.setInteractive();
        this.enemySprite.on('pointerdown', () => this.onAttackClick());
        group.add(this.enemySprite);
        
        // HP-бары
        const hpBg = this.phaser.add.graphics();
        hpBg.fillStyle(0x333333, 0.8);
        hpBg.fillRoundedRect(width * 0.18, height * 0.45, 100, 10, 5);
        group.add(hpBg);
        
        this.hpPlayerBar = this.phaser.add.graphics();
        group.add(this.hpPlayerBar);
        
        const hpEnemyBg = this.phaser.add.graphics();
        hpEnemyBg.fillStyle(0x333333, 0.8);
        hpEnemyBg.fillRoundedRect(width * 0.58, height * 0.45, 100, 10, 5);
        group.add(hpEnemyBg);
        
        this.hpEnemyBar = this.phaser.add.graphics();
        group.add(this.hpEnemyBar);
        
        // Кнопка атаки
        const attackBtn = this.phaser.add.text(width * 0.45, height * 0.8, '⚔️ Атака', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#6b7db3',
            padding: { x: 20, y: 10 }
        });
        attackBtn.setInteractive();
        attackBtn.on('pointerdown', () => this.onAttackClick());
        group.add(attackBtn);
        
        this.arenaObjects = { group, player: this.playerSprite, enemy: this.enemySprite };
        
        // Обновляем HP
        this.updateArenaBars();
    }
    
    createDungeonScene() {
        const { width, height } = this.phaser.scale;
        const group = this.phaser.add.group();
        
        const wall = this.phaser.add.image(width/2, height/2, 'bg');
        wall.setDisplaySize(width * 0.8, height * 0.8);
        wall.setAlpha(0.2);
        group.add(wall);
        
        const text = this.phaser.add.text(width/2, height/2, '🏰 Данжи в разработке\nСкоро здесь появятся подземелья!', {
            fontSize: '20px',
            fill: '#8090b0',
            fontFamily: 'monospace',
            align: 'center'
        });
        text.setOrigin(0.5);
        group.add(text);
        
        this.dungeonObjects = { group, text };
    }
    
    createShopScene() {
        const { width, height } = this.phaser.scale;
        const group = this.phaser.add.group();
        
        const items = [
            { id: 'sword', name: 'Меч', price: 50, icon: 'sword' },
            { id: 'shield', name: 'Щит', price: 30, icon: 'shield' },
            { id: 'potion', name: 'Зелье', price: 10, icon: 'chest' }
        ];
        
        items.forEach((item, i) => {
            const x = width * (0.2 + i * 0.3);
            const y = height * 0.5;
            
            const icon = this.phaser.add.image(x, y - 30, item.icon);
            icon.setDisplaySize(50, 50);
            group.add(icon);
            
            const name = this.phaser.add.text(x, y + 30, item.name, {
                fontSize: '14px',
                fill: '#c8d0f0'
            });
            name.setOrigin(0.5);
            group.add(name);
            
            const price = this.phaser.add.text(x, y + 50, `💰 ${item.price}`, {
                fontSize: '12px',
                fill: '#a0b0e0'
            });
            price.setOrigin(0.5);
            group.add(price);
            
            const btn = this.phaser.add.text(x, y + 75, 'Купить', {
                fontSize: '14px',
                fill: '#ffffff',
                backgroundColor: '#4a7ac4',
                padding: { x: 10, y: 5 }
            });
            btn.setOrigin(0.5);
            btn.setInteractive();
            btn.on('pointerdown', () => this.onShopBuy(item.id));
            group.add(btn);
        });
        
        this.shopObjects = { group };
    }
    
    updateScene() {
        if (!this.sceneReady || !this.isRunning) return;
        if (this.currentScene === 'arena') {
            this.updateArenaBars();
        }
    }
    
    updateArenaBars() {
        if (!this.hpPlayerBar || !this.hpEnemyBar) return;
        
        const w = this.phaser.scale.width * 0.35;
        const hpPercent = Math.max(0, this.player.hp / this.player.maxHp);
        const enemyHp = this.battle.enemyHp || 100;
        const enemyMaxHp = this.battle.enemyMaxHp || 100;
        const enemyPercent = Math.max(0, enemyHp / enemyMaxHp);
        
        const baseX = this.phaser.scale.width * 0.18;
        const baseY = this.phaser.scale.height * 0.45;
        const enemyX = this.phaser.scale.width * 0.58;
        
        // Обновляем HP игрока
        this.hpPlayerBar.clear();
        const color = hpPercent > 0.5 ? 0x4caf50 : 0xff9800;
        this.hpPlayerBar.fillStyle(color);
        this.hpPlayerBar.fillRoundedRect(baseX, baseY, w * hpPercent, 10, 5);
        
        // Обновляем HP врага
        this.hpEnemyBar.clear();
        const enemyColor = enemyPercent > 0.5 ? 0x4caf50 : 0xf44336;
        this.hpEnemyBar.fillStyle(enemyColor);
        this.hpEnemyBar.fillRoundedRect(enemyX, baseY, w * enemyPercent, 10, 5);
    }
    
    showScene(sceneName) {
        const scenes = {
            arena: this.arenaObjects,
            dungeon: this.dungeonObjects,
            shop: this.shopObjects
        };
        
        Object.keys(scenes).forEach(key => {
            const group = scenes[key]?.group;
            if (group) group.setVisible(key === sceneName);
        });
    }
    
    switchScene(sceneName) {
        if (this.currentScene === sceneName) return;
        this.currentScene = sceneName;
        
        // Обновляем активные кнопки
        const container = this.gameContainer;
        if (container) {
            container.querySelectorAll('.game-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.scene === sceneName);
            });
        }
        
        this.showScene(sceneName);
        this.renderScene(sceneName);
    }
    
    renderScene(sceneName) {
        const titles = {
            arena: '⚔️ Арена',
            dungeon: '🏰 Данж',
            shop: '🛒 Магазин',
            market: '🔄 Лавка'
        };
        if (this.statusText) {
            this.statusText.setText(titles[sceneName] || '🏹 Шервудская битва');
        }
    }
    
    // ===== Игровые действия =====
    
    onAttackClick() {
        if (!this.isRunning) return;
        
        const damage = Math.floor(Math.random() * 10) + 5;
        const enemyHp = this.battle.enemyHp || 100;
        this.battle.enemyHp = Math.max(0, enemyHp - damage);
        
        // Анимация
        this.playerSprite.setTint(0xff4444);
        setTimeout(() => this.playerSprite.clearTint(), 200);
        
        // Урон
        this.showDamage(damage, this.enemySprite.x, this.enemySprite.y - 30);
        
        // Отправляем P2P
        this.p2p.sendGameAction(
            this.p2p._chId,
            'attack',
            {
                damage: damage,
                attacker: this.p2p._peerId,
                targetHp: this.battle.enemyHp
            }
        );
        
        // Проверяем победу
        if (this.battle.enemyHp <= 0) {
            this.battle.enemyHp = 0;
            this.onBattleWin();
        }
        
        this.updateArenaBars();
    }
    
    onShopBuy(itemId) {
        const items = {
            sword: { name: 'Меч', price: 50, attack: 5 },
            shield: { name: 'Щит', price: 30, defense: 3 },
            potion: { name: 'Зелье', price: 10, heal: 20 }
        };
        
        const item = items[itemId];
        if (!item) return;
        
        if (this.player.gold < item.price) {
            this.showMessage('❌ Недостаточно золота!');
            return;
        }
        
        this.player.gold -= item.price;
        if (item.attack) this.player.attack += item.attack;
        if (item.defense) this.player.defense += item.defense;
        if (item.heal) this.player.heal(item.heal);
        
        this.player.save();
        this.updateStats();
        this.showMessage(`✅ Куплено: ${item.name}!`);
        
        this.p2p.sendGameAction(
            this.p2p._chId,
            'trade',
            {
                item: itemId,
                buyer: this.p2p._peerId,
                price: item.price
            }
        );
    }
    
    onBattleWin() {
        const gold = Math.floor(Math.random() * 20) + 10;
        const exp = Math.floor(Math.random() * 15) + 5;
        
        this.player.addGold(gold);
        this.player.addExperience(exp);
        
        this.updateStats();
        this.showMessage(`🏆 Победа! +${gold}💰 +${exp}⭐`);
        
        // Восстанавливаем врага
        this.battle.enemyHp = 100;
        this.updateArenaBars();
        
        this.p2p.sendGameAction(
            this.p2p._chId,
            'victory',
            {
                winner: this.p2p._peerId,
                gold: gold,
                exp: exp
            }
        );
    }
    
    showDamage(damage, x, y) {
        const text = this.phaser.add.text(x, y, `-${damage}`, {
            fontSize: '32px',
            fill: '#ff4444',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 3
        });
        text.setOrigin(0.5);
        
        this.phaser.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
    
    showMessage(text) {
        const { width, height } = this.phaser.scale;
        const msg = this.phaser.add.text(width/2, height * 0.15, text, {
            fontSize: '18px',
            fill: '#a0b0e0',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 16, y: 8 }
        });
        msg.setOrigin(0.5);
        
        this.phaser.tweens.add({
            targets: msg,
            alpha: 0,
            delay: 1500,
            duration: 500,
            onComplete: () => msg.destroy()
        });
    }
    
    // ===== P2P Синхронизация =====
    
    startSync() {
        this.stopSync();
        this.syncInterval = setInterval(() => {
            if (this.isRunning && this.p2p._chId) {
                this.syncState();
            }
        }, 5000);
    }
    
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    syncState() {
        if (!this.p2p._chId) return;
        
        this.p2p.sendGameAction(
            this.p2p._chId,
            'state-sync',
            {
                player: {
                    hp: this.player.hp,
                    maxHp: this.player.maxHp,
                    attack: this.player.attack,
                    defense: this.player.defense,
                    gold: this.player.gold,
                    level: this.player.level
                },
                timestamp: Date.now()
            }
        );
    }
    
    handleGameAction(data) {
        switch(data.action) {
            case 'attack':
                this.battle.enemyHp = data.data.targetHp;
                this.updateArenaBars();
                break;
            case 'trade':
                this.showMessage(`🛒 Игрок ${data.nick || ''} купил предмет`);
                break;
            case 'victory':
                this.showMessage(`🏆 ${data.nick || 'Игрок'} одержал победу!`);
                break;
            case 'state-sync':
                // Обновляем данные о других игроках
                break;
        }
    }
    
    // ===== UI обновления =====
    
    updateStats() {
        const stats = {
            hp: document.getElementById('game-hp'),
            atk: document.getElementById('game-atk'),
            def: document.getElementById('game-def'),
            gold: document.getElementById('game-gold'),
            lvl: document.getElementById('game-lvl')
        };
        
        if (stats.hp) stats.hp.textContent = `❤️ ${this.player.hp}`;
        if (stats.atk) stats.atk.textContent = `⚔️ ${this.player.attack}`;
        if (stats.def) stats.def.textContent = `🛡️ ${this.player.defense}`;
        if (stats.gold) stats.gold.textContent = `💰 ${this.player.gold}`;
        if (stats.lvl) stats.lvl.textContent = `⭐ ${this.player.level}`;
    }
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================

let gameInstance = null;
let p2pInitAttempts = 0;
const MAX_P2P_ATTEMPTS = 20;

function initGame() {
    if (gameInstance) {
        console.log('🏹 Game already initialized');
        return;
    }
    
    // Проверяем наличие P2PPong
    if (typeof window.P2PPong === 'undefined' || !window.P2PPong._state) {
        p2pInitAttempts++;
        if (p2pInitAttempts < MAX_P2P_ATTEMPTS) {
            console.log(`🏹 P2PPong не инициализирован, попытка ${p2pInitAttempts}...`);
            setTimeout(initGame, 500);
        } else {
            console.error('🏹 P2PPong не инициализирован после ' + MAX_P2P_ATTEMPTS + ' попыток');
        }
        return;
    }
    
    // Проверяем состояние P2PPong
    if (window.P2PPong._state === 'idle' || window.P2PPong._state === 'connecting') {
        console.log('🏹 P2PPong в состоянии ' + window.P2PPong._state + ', ждем готовности...');
        // Подписываемся на событие ready
        window.P2PPong.on('ready', () => {
            console.log('🏹 P2PPong готов, инициализируем игру');
            
    createGameInstance();
}

function createGameInstance() {
    if (gameInstance) return;
    try {
        gameInstance = new Game(window.P2PPong);
        console.log('🏹 Game instance created successfully');
        window.gameInstance = gameInstance;
    } catch(e) {
        console.error('🏹 Error creating game instance:', e);
    }
}

// Экспортируем для использования
window.Game = Game;
window.gameInstance = gameInstance;
window.initGame = initGame;

// Запускаем инициализацию после загрузки страницы
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initGame, 1000);
} else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initGame, 1000));
}

console.log('🏹 Game module loaded');

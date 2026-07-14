// ============================================================
//  GAME.JS - Игровое ядро RobinHood P2P
//  Интеграция с P2PPong и UI мессенджера
// ============================================================

class Game {
    constructor(p2p, uiContainer) {
        this.p2p = p2p;
        this.container = uiContainer;
        this.isRunning = false;
        this.isPaused = false;
        this.phaser = null;
        this.currentScene = 'arena';
        
        // Игровые модули
        this.player = new GamePlayer();
        this.battle = new GameBattle(this.p2p);
        this.shop = new GameShop(this.p2p);
        this.blackMarket = new GameBlackMarket(this.p2p);
        
        // Состояние игры
        this.state = {
            arena: null,
            dungeon: null,
            shop: null,
            market: [],
            players: {}
        };
        
        // Подписка на события P2P
        this.p2p.on('game-action', (data) => {
            if (data.verified) {
                this.handleGameAction(data);
            }
        });
        
        this.p2p.on('game-state-sync', (data) => {
            if (data.verified) {
                this.handleStateSync(data);
            }
        });
        
        // Создаем контейнер игры в UI
        this.createContainer();
    }
    
    createContainer() {
        // Удаляем старый контейнер, если есть
        const old = document.getElementById('game-container');
        if (old) old.remove();
        
        const container = document.createElement('div');
        container.id = 'game-container';
        container.className = 'game-container';
        container.style.display = 'none';
        
        container.innerHTML = `
            <div class="game-header">
                <span class="game-title">🏹 Шервудская битва</span>
                <div class="game-stats">
                    <span id="game-hp">❤️ ${this.player.hp}</span>
                    <span id="game-atk">⚔️ ${this.player.attack}</span>
                    <span id="game-def">🛡️ ${this.player.defense}</span>
                    <span id="game-gold">💰 ${this.player.gold}</span>
                    <span id="game-lvl">⭐ ${this.player.level}</span>
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
        this.container = container;
        
        // Обработчики кнопок
        container.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const scene = btn.dataset.scene;
                this.switchScene(scene);
            });
        });
        
        container.querySelector('#game-close-btn').addEventListener('click', () => {
            this.stop();
        });
    }
    
    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        
        // Загружаем состояние игрока
        this.player.load();
        this.updateStats();
        
        // Инициализируем Phaser
        await this.initPhaser();
        
        // Рендерим текущую сцену
        this.renderScene('arena');
        
        // Начинаем синхронизацию с P2P
        this.startSync();
        
        this.p2p._emit('game-started', { player: this.player });
    }
    
    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.container.style.display = 'none';
        
        if (this.phaser) {
            this.phaser.destroy(true);
            this.phaser = null;
        }
        
        this.stopSync();
        this.p2p._emit('game-stopped', {});
    }
    
    async initPhaser() {
        const canvasContainer = this.container.querySelector('#phaser-canvas');
        const rect = canvasContainer.getBoundingClientRect();
        
        this.phaser = new Phaser.Game({
            type: Phaser.AUTO,
            parent: canvasContainer,
            width: rect.width || window.innerWidth,
            height: rect.height || window.innerHeight * 0.6,
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
        // Загружаем ресурсы для игры
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
        
        // Создаем простую анимацию для героя
        // (в реальной игре здесь будут спрайт-листы)
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
        
        // Игровые объекты
        this.arenaObjects = {};
        this.dungeonObjects = {};
        this.shopObjects = {};
        
        // Создаем сцены
        this.createArenaScene();
        this.createDungeonScene();
        this.createShopScene();
        
        // Скрываем все сцены кроме текущей
        this.showScene(this.currentScene);
        
        // Флаг для управления обновлением
        this.sceneReady = true;
    }
    
    createArenaScene() {
        const { width, height } = this.phaser.scale;
        const group = this.phaser.add.group();
        
        // Игрок
        const player = this.phaser.add.image(width * 0.3, height * 0.6, 'player');
        player.setDisplaySize(80, 80);
        player.setInteractive();
        group.add(player);
        
        // Враг
        const enemy = this.phaser.add.image(width * 0.7, height * 0.6, 'enemy');
        enemy.setDisplaySize(80, 80);
        enemy.setInteractive();
        enemy.on('pointerdown', () => this.onArenaClick());
        group.add(enemy);
        
        // HP-бары
        const hpBg = this.phaser.add.graphics();
        hpBg.fillStyle(0x333333, 0.8);
        hpBg.fillRoundedRect(width * 0.2, height * 0.45, 100, 10, 5);
        group.add(hpBg);
        
        const hpPlayer = this.phaser.add.graphics();
        hpPlayer.fillStyle(0x4caf50);
        hpPlayer.fillRoundedRect(width * 0.2, height * 0.45, 100, 10, 5);
        group.add(hpPlayer);
        
        const hpEnemyBg = this.phaser.add.graphics();
        hpEnemyBg.fillStyle(0x333333, 0.8);
        hpEnemyBg.fillRoundedRect(width * 0.6, height * 0.45, 100, 10, 5);
        group.add(hpEnemyBg);
        
        const hpEnemy = this.phaser.add.graphics();
        hpEnemy.fillStyle(0xf44336);
        hpEnemy.fillRoundedRect(width * 0.6, height * 0.45, 100, 10, 5);
        group.add(hpEnemy);
        
        // Кнопка атаки
        const attackBtn = this.phaser.add.text(width * 0.45, height * 0.8, '⚔️ Атака', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#6b7db3',
            padding: { x: 20, y: 10 },
            borderRadius: '8px'
        });
        attackBtn.setInteractive();
        attackBtn.on('pointerdown', () => this.onAttackClick());
        group.add(attackBtn);
        
        this.arenaObjects = {
            group,
            player,
            enemy,
            hpPlayer,
            hpEnemy,
            attackBtn
        };
    }
    
    createDungeonScene() {
        const { width, height } = this.phaser.scale;
        const group = this.phaser.add.group();
        
        // Стены
        const wall = this.phaser.add.image(width/2, height/2, 'bg');
        wall.setDisplaySize(width * 0.8, height * 0.8);
        wall.setAlpha(0.2);
        group.add(wall);
        
        // Сообщение
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
        
        // Товары
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
                padding: { x: 10, y: 5 },
                borderRadius: '5px'
            });
            btn.setOrigin(0.5);
            btn.setInteractive();
            btn.on('pointerdown', () => this.onShopBuy(item.id));
            group.add(btn);
        });
        
        this.shopObjects = { group };
    }
    
    updateScene() {
        if (!this.sceneReady) return;
        
        // Обновляем HP-бары на арене
        if (this.currentScene === 'arena') {
            const { hpPlayer, hpEnemy } = this.arenaObjects;
            const w = this.phaser.scale.width * 0.35;
            
            hpPlayer.clear();
            hpPlayer.fillStyle(0x4caf50);
            const hpPercent = Math.max(0, this.player.hp / this.player.maxHp);
            hpPlayer.fillRoundedRect(this.phaser.scale.width * 0.2, this.phaser.scale.height * 0.45, w * hpPercent, 10, 5);
            
            hpEnemy.clear();
            hpEnemy.fillStyle(0xf44336);
            const enemyHp = this.battle.enemyHp || 100;
            const enemyMaxHp = this.battle.enemyMaxHp || 100;
            const enemyPercent = Math.max(0, enemyHp / enemyMaxHp);
            hpEnemy.fillRoundedRect(this.phaser.scale.width * 0.6, this.phaser.scale.height * 0.45, w * enemyPercent, 10, 5);
        }
    }
    
    showScene(sceneName) {
        const scenes = {
            arena: this.arenaObjects,
            dungeon: this.dungeonObjects,
            shop: this.shopObjects
        };
        
        Object.keys(scenes).forEach(key => {
            const group = scenes[key].group;
            group.setVisible(key === sceneName);
        });
    }
    
    switchScene(sceneName) {
        if (this.currentScene === sceneName) return;
        this.currentScene = sceneName;
        
        // Обновляем активные кнопки
        this.container.querySelectorAll('.game-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scene === sceneName);
        });
        
        this.showScene(sceneName);
        this.renderScene(sceneName);
    }
    
    renderScene(sceneName) {
        switch(sceneName) {
            case 'arena':
                this.renderArena();
                break;
            case 'dungeon':
                this.renderDungeon();
                break;
            case 'shop':
                this.renderShop();
                break;
            case 'market':
                this.renderMarket();
                break;
        }
    }
    
    renderArena() {
        const { player, enemy } = this.arenaObjects;
        const { width, height } = this.phaser.scale;
        
        // Обновляем позиции
        player.setPosition(width * 0.3, height * 0.6);
        enemy.setPosition(width * 0.7, height * 0.6);
        
        this.statusText.setText('⚔️ Арена');
    }
    
    renderDungeon() {
        const { text } = this.dungeonObjects;
        const { width, height } = this.phaser.scale;
        text.setPosition(width/2, height/2);
        this.statusText.setText('🏰 Данж');
    }
    
    renderShop() {
        this.statusText.setText('🛒 Магазин');
    }
    
    renderMarket() {
        const { width, height } = this.phaser.scale;
        this.statusText.setText('🔄 Лавка Шервуда');
    }
    
    // ===== Игровые действия =====
    
    onAttackClick() {
        if (this.isPaused) return;
        
        const damage = Math.floor(Math.random() * 10) + 5;
        this.battle.enemyHp = (this.battle.enemyHp || 100) - damage;
        
        // Анимация атаки
        const { player, enemy } = this.arenaObjects;
        this.phaser.tweens.add({
            targets: player,
            x: player.x + 30,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Отправляем P2P-событие
        this.p2p.sendGameAction(
            this.p2p._chId,
            'attack',
            {
                damage: damage,
                attacker: this.p2p._peerId,
                targetHp: this.battle.enemyHp
            }
        );
        
        // Показываем урон
        this.showDamage(damage, enemy.x, enemy.y - 30);
        
        // Проверяем победу
        if (this.battle.enemyHp <= 0) {
            this.battle.enemyHp = 0;
            this.onBattleWin();
        }
    }
    
    onArenaClick() {
        // Клик по врагу = атака
        this.onAttackClick();
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
        if (item.heal) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.heal);
        }
        
        this.player.save();
        this.updateStats();
        this.showMessage(`✅ Куплено: ${item.name}!`);
        
        // Отправляем P2P-событие
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
        
        this.player.gold += gold;
        const leveledUp = this.player.addExperience(exp);
        
        this.updateStats();
        this.showMessage(`🏆 Победа! +${gold}💰 +${exp}⭐`);
        
        if (leveledUp) {
            this.showMessage(`🎉 УРОВЕНЬ ${this.player.level}!`);
        }
        
        // Восстанавливаем врага
        this.battle.enemyHp = 100;
        
        // Отправляем P2P-событие
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
        const { width, height } = this.phaser.scale;
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
            padding: { x: 16, y: 8 },
            borderRadius: '8px'
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
        this.syncInterval = setInterval(() => {
            this.syncState();
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
        
        const state = {
            player: {
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                attack: this.player.attack,
                defense: this.player.defense,
                gold: this.player.gold,
                level: this.player.level
            },
            arena: this.battle.enemyHp,
            timestamp: Date.now()
        };
        
        this.p2p.sendGameAction(
            this.p2p._chId,
            'state-sync',
            state
        );
    }
    
    handleGameAction(data) {
        switch(data.action) {
            case 'attack':
                this.battle.enemyHp = data.data.targetHp;
                this.updateStats();
                break;
            case 'trade':
                this.showMessage(`🛒 Игрок ${data.nick || ''} купил предмет`);
                break;
            case 'victory':
                this.showMessage(`🏆 ${data.nick || 'Игрок'} одержал победу!`);
                break;
            case 'state-sync':
                this.handleStateSync(data);
                break;
        }
    }
    
    handleStateSync(data) {
        if (!data.data) return;
        const state = data.data;
        
        if (state.player) {
            // Обновляем отображаемые данные
            this.updateStats();
        }
    }
    
    // ===== UI обновления =====
    
    updateStats() {
        const hp = document.getElementById('game-hp');
        const atk = document.getElementById('game-atk');
        const def = document.getElementById('game-def');
        const gold = document.getElementById('game-gold');
        const lvl = document.getElementById('game-lvl');
        
        if (hp) hp.textContent = `❤️ ${this.player.hp}`;
        if (atk) atk.textContent = `⚔️ ${this.player.attack}`;
        if (def) def.textContent = `🛡️ ${this.player.defense}`;
        if (gold) gold.textContent = `💰 ${this.player.gold}`;
        if (lvl) lvl.textContent = `⭐ ${this.player.level}`;
    }
}

// ============================================================
//  КЛАСС ИГРОКА
// ============================================================

class GamePlayer {
    constructor() {
        this.hp = 100;
        this.maxHp = 100;
        this.attack = 5;
        this.defense = 3;
        this.gold = 50;
        this.level = 1;
        this.experience = 0;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            shield: null
        };
    }
    
    load() {
        try {
            const saved = localStorage.getItem('robinhood_player');
            if (saved) {
                const data = JSON.parse(saved);
                Object.assign(this, data);
            }
        } catch(e) {}
    }
    
    save() {
        try {
            localStorage.setItem('robinhood_player', JSON.stringify(this));
        } catch(e) {}
    }
    
    addExperience(exp) {
        this.experience += exp;
        const needed = this.getExpNeeded();
        let leveledUp = false;
        
        while (this.experience >= needed) {
            this.experience -= needed;
            this.level++;
            this.maxHp += 10;
            this.hp = this.maxHp;
            this.attack += 1;
            this.defense += 1;
            this.gold += 10;
            leveledUp = true;
        }
        
        this.save();
        return leveledUp;
    }
    
    getExpNeeded() {
        return Math.floor(this.level * 20 + 10);
    }
}

// ============================================================
//  КЛАСС БИТВЫ
// ============================================================

class GameBattle {
    constructor(p2p) {
        this.p2p = p2p;
        this.enemyHp = 100;
        this.enemyMaxHp = 100;
        this.enemyAttack = 3;
        this.enemyDefense = 2;
    }
    
    reset() {
        this.enemyHp = this.enemyMaxHp;
    }
}

// ============================================================
//  КЛАСС МАГАЗИНА
// ============================================================

class GameShop {
    constructor(p2p) {
        this.p2p = p2p;
        this.items = [
            { id: 'sword', name: 'Меч', price: 50, type: 'weapon', attack: 5 },
            { id: 'shield', name: 'Щит', price: 30, type: 'armor', defense: 3 },
            { id: 'potion', name: 'Зелье', price: 10, type: 'consumable', heal: 20 },
            { id: 'bow', name: 'Лук', price: 75, type: 'weapon', attack: 8 },
            { id: 'armor', name: 'Кольчуга', price: 60, type: 'armor', defense: 5 }
        ];
    }
    
    getItems() {
        return this.items;
    }
}

// ============================================================
//  КЛАСС ЧЕРНОГО РЫНКА (ЛАВКА ШЕРВУДА)
// ============================================================

class GameBlackMarket {
    constructor(p2p) {
        this.p2p = p2p;
        this.listings = [];
        this.myListings = [];
        
        this.p2p.on('game-action', (data) => {
            if (data.action === 'market-listing' && data.verified) {
                this.addListing(data.data);
            }
            if (data.action === 'market-buy' && data.verified) {
                this.handleBuy(data.data);
            }
        });
    }
    
    listItem(item, price) {
        const listing = {
            id: Date.now() + Math.random(),
            item: item,
            price: price,
            seller: this.p2p._myNick,
            sellerId: this.p2p._peerId,
            timestamp: Date.now()
        };
        
        this.myListings.push(listing);
        this.p2p.sendGameAction(
            this.p2p._chId,
            'market-listing',
            listing
        );
        
        return listing;
    }
    
    addListing(data) {
        if (!this.listings.find(l => l.id === data.id)) {
            this.listings.push(data);
            this.p2p._emit('market-update', this.listings);
        }
    }
    
    buyItem(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) return false;
        
        this.p2p.sendGameAction(
            this.p2p._chId,
            'market-buy',
            {
                listingId: listingId,
                buyer: this.p2p._myNick,
                buyerId: this.p2p._peerId,
                price: listing.price
            }
        );
        
        return true;
    }
    
    handleBuy(data) {
        if (data.buyerId !== data.from) return;
        
        const listing = this.listings.find(l => l.id === data.listingId);
        if (listing) {
            this.listings = this.listings.filter(l => l.id !== data.listingId);
            this.p2p._emit('market-update', this.listings);
            this.p2p._emit('market-sold', {
                listing: listing,
                buyer: data.buyer,
                price: data.price
            });
        }
    }
    
    getListings() {
        return this.listings;
    }
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================

let gameInstance = null;

function initGame() {
    if (gameInstance) return;
    gameInstance = new Game(window.P2PPong || P2PPong);
    
    // Добавляем кнопку игры в хедер
    const headerRow2 = document.querySelector('.header-row-2');
    if (headerRow2 && !document.getElementById('btn-game')) {
        const gameBtn = document.createElement('div');
        gameBtn.className = 'header-btn';
        gameBtn.id = 'btn-game';
        gameBtn.innerHTML = '<img src="assets/icons/02icon.png" alt="game">';
        gameBtn.addEventListener('click', () => {
            if (gameInstance.isRunning) {
                gameInstance.stop();
            } else {
                gameInstance.start();
            }
        });
        
        // Вставляем перед кнопкой clear
        const clearBtn = document.getElementById('btn-clear');
        if (clearBtn) {
            headerRow2.insertBefore(gameBtn, clearBtn);
        } else {
            headerRow2.appendChild(gameBtn);
        }
    }
}

// Экспортируем для использования в других модулях
window.Game = Game;
window.gameInstance = gameInstance;
window.initGame = initGame;

// Автоматическая инициализация при готовности P2P
if (typeof P2PPong !== 'undefined') {
    P2PPong.on('ready', () => {
        setTimeout(initGame, 500);
    });
}

console.log('🏹 Game module loaded');

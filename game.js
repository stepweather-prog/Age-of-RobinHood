// ============================================================
//  GAME.JS - Игровое ядро RobinHood P2P
// ============================================================

class GamePlayer {
    constructor() {
        this.load();
    }

    load() {
        const saved = localStorage.getItem('robinhood_player');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(this, data);
            } catch(e) {
                this.setDefaults();
            }
        } else {
            this.setDefaults();
        }
    }

    setDefaults() {
        this.hp = 100;
        this.maxHp = 100;
        this.attack = 10;
        this.defense = 5;
        this.gold = 50;
        this.level = 1;
        this.experience = 0;
        this.inventory = [];
        this.save();
    }

    save() {
        try {
            localStorage.setItem('robinhood_player', JSON.stringify(this));
        } catch(e) {}
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.save();
    }

    addGold(amount) {
        this.gold += amount;
        this.save();
    }

    addExperience(amount) {
        this.experience += amount;
        const needed = this.getExpForLevel();
        if (this.experience >= needed) {
            this.experience -= needed;
            this.levelUp();
            return true;
        }
        this.save();
        return false;
    }

    levelUp() {
        this.level++;
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.attack += 3;
        this.defense += 2;
        this.save();
    }

    getExpForLevel() {
        return this.level * 50;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.hp -= actualDamage;
        if (this.hp < 0) this.hp = 0;
        this.save();
        return actualDamage;
    }
}

class GameBattle {
    constructor(p2p) {
        this.p2p = p2p;
        this.enemyHp = 100;
        this.enemyMaxHp = 100;
        this.enemyLevel = 1;
        this.enemyName = 'Разбойник';
    }

    attack() {
        const damage = Math.floor(Math.random() * 15) + 5;
        this.enemyHp = Math.max(0, this.enemyHp - damage);
        return { damage, enemyHp: this.enemyHp };
    }

    resetEnemy() {
        this.enemyLevel = Math.floor(Math.random() * 3) + 1;
        this.enemyMaxHp = 80 + this.enemyLevel * 30;
        this.enemyHp = this.enemyMaxHp;
        const names = ['Разбойник', 'Гоблин', 'Волк', 'Скелет', 'Тролль', 'Бандит'];
        this.enemyName = names[Math.floor(Math.random() * names.length)];
    }
}

class GameBlackMarket {
    constructor(p2p) {
        this.p2p = p2p;
        this.listings = [];
        this.myListings = [];

        this.p2p.on('game-action', (data) => {
            if (data.action === 'market-listing') {
                this.addListing(data.data);
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
        this.p2p.sendGameAction(this.p2p._chId, 'market-listing', listing);
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
        this.p2p.sendGameAction(this.p2p._chId, 'market-buy', {
            listingId: listingId,
            buyer: this.p2p._myNick
        });
        return true;
    }

    getListings() {
        return this.listings;
    }
}

class Game {
    constructor(p2p) {
        this.p2p = p2p;
        this.isRunning = false;
        this.phaser = null;
        this.sceneRef = null;
        this.currentScene = 'arena';
        this.gameContainer = null;

        this.player = new GamePlayer();
        this.battle = new GameBattle(this.p2p);
        this.blackMarket = new GameBlackMarket(this.p2p);

        this.state = {
            arena: null,
            dungeon: null,
            market: [],
            players: {}
        };

        this.p2p.on('game-action', (data) => {
            if (data.verified) this.handleGameAction(data);
        });

        this.p2p.on('game-started', () => {
            this.start();
        });

        this.p2p.on('game-stopped', () => {
            this.stop();
        });

        this.createGameContainer();
        this.setupUIHandlers();
    }

    createGameContainer() {
        if (document.getElementById('game-container')) return;

        const container = document.createElement('div');
        container.id = 'game-container';
        container.className = 'game-container';
        container.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;flex-direction:column;background:var(--bg-primary,#1a1a2a);';

        container.innerHTML = `
            <div class="game-header" style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-secondary,#111122);">
                <span class="game-title" style="font-size:18px;color:var(--accent-light,#a0b0e0);">🏹 Шервудская битва</span>
                <div class="game-stats" style="display:flex;gap:12px;font-size:13px;color:var(--text-dim,#8090b0);">
                    <span id="game-hp">❤️ 100</span>
                    <span id="game-atk">⚔️ 10</span>
                    <span id="game-def">🛡️ 5</span>
                    <span id="game-gold">💰 50</span>
                    <span id="game-lvl">⭐ 1</span>
                </div>
                <button class="game-close" id="game-close-btn" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">✕</button>
            </div>
            <div class="game-canvas" id="phaser-canvas" style="flex:1;min-height:300px;"></div>
            <div class="game-controls" style="display:flex;gap:8px;padding:10px 16px;background:var(--bg-secondary,#111122);justify-content:center;">
                <button class="game-btn active" data-scene="arena" style="padding:8px 16px;border:1px solid var(--accent,#6b7db3);background:var(--btn-bg,transparent);color:var(--text,#c8d0f0);border-radius:8px;cursor:pointer;">⚔️ Арена</button>
                <button class="game-btn" data-scene="dungeon" style="padding:8px 16px;border:1px solid var(--accent,#6b7db3);background:var(--btn-bg,transparent);color:var(--text,#c8d0f0);border-radius:8px;cursor:pointer;">🏰 Данж</button>
                <button class="game-btn" data-scene="shop" style="padding:8px 16px;border:1px solid var(--accent,#6b7db3);background:var(--btn-bg,transparent);color:var(--text,#c8d0f0);border-radius:8px;cursor:pointer;">🛒 Магазин</button>
            </div>
        `;

        document.body.appendChild(container);
        this.gameContainer = container;

        container.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchScene(btn.dataset.scene);
            });
        });

        container.querySelector('#game-close-btn').addEventListener('click', () => {
            this.stop();
        });
    }

    setupUIHandlers() {
        const gameBtn = document.getElementById('btn-game');
        if (gameBtn) {
            gameBtn.addEventListener('click', () => {
                if (this.isRunning) this.stop();
                else this.start();
            });
        }
    }

    handleGameCommand(text) {
        const parts = text.slice(1).trim().split(' ');
        const command = parts[0].toLowerCase();

        switch(command) {
            case 'атака':
            case 'attack':
                const result = this.battle.attack();
                this.updateArenaDisplay();
                this.showMessage(`⚔️ Атака! Урон: ${result.damage}. HP врага: ${result.enemyHp}/${this.battle.enemyMaxHp}`);
                if (result.enemyHp <= 0) this.onBattleWin();
                this.p2p.sendGameAction(this.p2p._chId, 'attack', {
                    damage: result.damage,
                    targetHp: result.enemyHp
                });
                return true;

            case 'статус':
            case 'status':
                this.showMessage(`🏹 HP: ${this.player.hp}/${this.player.maxHp} | ⚔️ ${this.player.attack} | 🛡️ ${this.player.defense} | 💰 ${this.player.gold} | ⭐ ${this.player.level}`);
                return true;

            case 'лечить':
            case 'heal':
                if (this.player.gold >= 10) {
                    this.player.gold -= 10;
                    this.player.heal(20);
                    this.updateStats();
                    this.showMessage(`❤️ Вылечился! HP: ${this.player.hp}/${this.player.maxHp}`);
                } else {
                    this.showMessage('❌ Недостаточно золота (нужно 10💰)');
                }
                return true;

            case 'помощь':
            case 'help':
                this.showMessage('🏹 Команды: !атака, !статус, !лечить, !помощь');
                return true;

            default:
                this.showMessage('❌ Неизвестная команда. !помощь');
                return true;
        }
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        if (this.gameContainer) this.gameContainer.style.display = 'flex';
        this.player.load();
        this.battle.resetEnemy();
        this.updateStats();

        await this.initPhaser();
        this.renderScene('arena');

        this.startSync();
        this.p2p._emit('game-started', { player: this.player });

        const gameBtn = document.getElementById('btn-game');
        if (gameBtn) gameBtn.style.background = 'rgba(76,175,80,0.3)';

        this.showMessage('🏹 Игра началась!');
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;

        if (this.gameContainer) this.gameContainer.style.display = 'none';
        if (this.phaser) { this.phaser.destroy(true); this.phaser = null; this.sceneRef = null; }
        this.stopSync();

        this.p2p._emit('game-stopped', {});

        const gameBtn = document.getElementById('btn-game');
        if (gameBtn) gameBtn.style.background = '';

        this.showMessage('⏹️ Игра остановлена');
    }

    async initPhaser() {
    const canvasContainer = document.getElementById('phaser-canvas');
    if (!canvasContainer) return;

    if (this.phaser) {
        this.phaser.destroy(true);
        this.phaser = null;
        this.sceneRef = null;
    }

    const rect = canvasContainer.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 400;

    const self = this;

    const gameScene = {
        preload: function() {
            const base = window.location.origin;
            this.load.image('bg', base + '/assets/icons/background.webp');
            this.load.image('player', base + '/assets/icons/01icon.png');
            this.load.image('enemy', base + '/assets/icons/08icon.png');
        },
        create: function() {
            self.sceneRef = this;
            self.createScene();
        },
        update: function() {
            self.updateScene();
        }
    };

    this.phaser = new Phaser.Game({
        type: Phaser.AUTO,
        parent: canvasContainer,
        width: width,
        height: height,
        backgroundColor: '#1a1a2a',
        scene: gameScene,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    });
}

    createScene() {
        const scene = this.sceneRef;
        if (!scene) return;

        const { width, height } = scene.scale;

        const bg = scene.add.image(width / 2, height / 2, 'bg');
        bg.setDisplaySize(width, height);
        bg.setAlpha(0.3);

        this.statusText = scene.add.text(width / 2, 30, '⚔️ Арена', {
            fontSize: '22px',
            fill: '#a0b0e0',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(10);

        this.playerSprite = scene.add.image(width * 0.3, height * 0.5, 'player');
        this.playerSprite.setDisplaySize(80, 80);
        this.playerSprite.setDepth(5);

        this.enemySprite = scene.add.image(width * 0.7, height * 0.5, 'enemy');
        this.enemySprite.setDisplaySize(80, 80);
        this.enemySprite.setInteractive();
        this.enemySprite.on('pointerdown', () => this.onAttackClick());
        this.enemySprite.setDepth(5);

        this.playerHpBar = scene.add.graphics().setDepth(10);
        this.enemyHpBar = scene.add.graphics().setDepth(10);

        this.attackBtn = scene.add.text(width / 2, height * 0.82, '⚔️ АТАКА', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#6b7db3',
            padding: { x: 24, y: 12 },
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive().setDepth(10);
        this.attackBtn.on('pointerdown', () => this.onAttackClick());

        this.messageText = scene.add.text(width / 2, height * 0.12, '', {
            fontSize: '16px',
            fill: '#ffcc00',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);

        this.updateArenaDisplay();
        this.sceneReady = true;
    }

    updateScene() {
        if (!this.sceneReady || !this.isRunning) return;
    }

    onAttackClick() {
        if (!this.isRunning) return;

        const result = this.battle.attack();

        if (this.enemySprite && this.sceneRef) {
            this.enemySprite.setTint(0xff0000);
            this.sceneRef.tweens.add({
                targets: this.enemySprite,
                x: this.enemySprite.x + 10,
                duration: 50,
                yoyo: true,
                onComplete: () => this.enemySprite.clearTint()
            });
        }

        if (this.playerSprite && this.sceneRef) {
            this.sceneRef.tweens.add({
                targets: this.playerSprite,
                x: this.playerSprite.x + 30,
                duration: 100,
                yoyo: true
            });
        }

        this.showMessage(`⚔️ -${result.damage} HP!`);

        this.p2p.sendGameAction(this.p2p._chId, 'attack', {
            damage: result.damage,
            targetHp: result.enemyHp
        });

        if (result.enemyHp <= 0) {
            this.onBattleWin();
        }

        this.updateArenaDisplay();
    }

    onBattleWin() {
        const gold = Math.floor(Math.random() * 20) + 10;
        const exp = Math.floor(Math.random() * 15) + 5;

        this.player.addGold(gold);
        this.player.addExperience(exp);
        this.player.save();
        this.updateStats();

        this.showMessage(`🏆 Победа! +${gold}💰 +${exp}⭐`);
        this.battle.resetEnemy();
        this.updateArenaDisplay();

        this.p2p.sendGameAction(this.p2p._chId, 'victory', {
            winner: this.p2p._peerId,
            gold: gold,
            exp: exp
        });
    }

    updateArenaDisplay() {
        const scene = this.sceneRef;
        if (!scene) return;
        const { width, height } = scene.scale;

        this.playerHpBar.clear();
        this.playerHpBar.fillStyle(0x333333);
        this.playerHpBar.fillRect(width * 0.08, height * 0.28, 130, 12);
        const playerPercent = Math.max(0, this.player.hp / this.player.maxHp);
        this.playerHpBar.fillStyle(playerPercent > 0.5 ? 0x4caf50 : 0xff9800);
        this.playerHpBar.fillRect(width * 0.08, height * 0.28, 130 * playerPercent, 12);

        this.enemyHpBar.clear();
        this.enemyHpBar.fillStyle(0x333333);
        this.enemyHpBar.fillRect(width * 0.52, height * 0.28, 130, 12);
        const enemyPercent = Math.max(0, this.battle.enemyHp / this.battle.enemyMaxHp);
        this.enemyHpBar.fillStyle(enemyPercent > 0.5 ? 0x4caf50 : 0xf44336);
        this.enemyHpBar.fillRect(width * 0.52, height * 0.28, 130 * enemyPercent, 12);

        if (this.statusText) {
            this.statusText.setText(`${this.p2p._myNick}  VS  ${this.battle.enemyName}`);
        }
    }

    switchScene(sceneName) {
        this.currentScene = sceneName;
        if (this.gameContainer) {
            this.gameContainer.querySelectorAll('.game-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.scene === sceneName);
            });
        }
        this.renderScene(sceneName);
    }

    renderScene(sceneName) {
        const titles = {
            arena: '⚔️ Арена',
            dungeon: '🏰 Данж (скоро)',
            shop: '🛒 Магазин (скоро)'
        };
        if (this.statusText) this.statusText.setText(titles[sceneName] || '🏹 Шервудская битва');
    }

    showMessage(text) {
        if (this.messageText && this.sceneRef) {
            this.messageText.setText(text);
            this.messageText.setAlpha(1);
            this.sceneRef.tweens.add({
                targets: this.messageText,
                alpha: 0,
                delay: 2000,
                duration: 500
            });
        }
    }

    startSync() {
        this.stopSync();
        this.syncInterval = setInterval(() => {
            if (this.isRunning && this.p2p._chId) {
                this.p2p.sendGameAction(this.p2p._chId, 'state-sync', {
                    player: {
                        hp: this.player.hp,
                        maxHp: this.player.maxHp,
                        attack: this.player.attack,
                        defense: this.player.defense,
                        gold: this.player.gold,
                        level: this.player.level
                    }
                });
            }
        }, 5000);
    }

    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    handleGameAction(data) {
        switch(data.action) {
            case 'attack':
                this.battle.enemyHp = data.data.targetHp || this.battle.enemyHp;
                this.updateArenaDisplay();
                this.showMessage(`⚔️ ${data.nick || 'Враг'} атакует! Урон: ${data.data.damage}`);
                break;
            case 'victory':
                this.showMessage(`🏆 ${data.nick || 'Игрок'} победил врага!`);
                break;
            case 'state-sync':
                break;
        }
    }

    updateStats() {
        const hpEl = document.getElementById('game-hp');
        const atkEl = document.getElementById('game-atk');
        const defEl = document.getElementById('game-def');
        const goldEl = document.getElementById('game-gold');
        const lvlEl = document.getElementById('game-lvl');

        if (hpEl) hpEl.textContent = `❤️ ${this.player.hp}`;
        if (atkEl) atkEl.textContent = `⚔️ ${this.player.attack}`;
        if (defEl) defEl.textContent = `🛡️ ${this.player.defense}`;
        if (goldEl) goldEl.textContent = `💰 ${this.player.gold}`;
        if (lvlEl) lvlEl.textContent = `⭐ ${this.player.level}`;
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
let gameInstance = null;
let p2pInitAttempts = 0;
const MAX_P2P_ATTEMPTS = 20;

function initGame() {
    if (gameInstance) return;

    if (typeof window.P2PPong === 'undefined' || !window.P2PPong._state) {
        p2pInitAttempts++;
        if (p2pInitAttempts < MAX_P2P_ATTEMPTS) {
            setTimeout(initGame, 500);
        }
        return;
    }

    if (window.P2PPong._state === 'idle' || window.P2PPong._state === 'connecting') {
        window.P2PPong.on('ready', () => {
            createGameInstance();
        });
        return;
    }

    createGameInstance();
}

function createGameInstance() {
    if (gameInstance) return;
    try {
        gameInstance = new Game(window.P2PPong);
        window.gameInstance = gameInstance;
        console.log('🏹 Game instance created');
    } catch(e) {
        console.error('Game init error:', e);
    }
}

window.Game = Game;
window.gameInstance = gameInstance;
window.initGame = initGame;

setTimeout(initGame, 1000);

console.log('🏹 Game module loaded');

// ============================================================
//  GAME.JS - Игровое ядро RobinHood P2P
// ============================================================

class GamePlayer {
    constructor() {
        this.hp = 100;
        this.maxHp = 100;
        this.attack = 10;
        this.defense = 5;
        this.gold = 50;
        this.level = 1;
        this.experience = 0;
        this.inventory = [];
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addGold(amount) {
        this.gold += amount;
    }

    addExperience(amount) {
        this.experience += amount;
        const needed = this.getExpForLevel();
        if (this.experience >= needed) {
            this.experience -= needed;
            this.level++;
            this.maxHp += 20;
            this.hp = this.maxHp;
            this.attack += 3;
            this.defense += 2;
        }
    }

    getExpForLevel() {
        return this.level * 50;
    }

    save() {
        try {
            localStorage.setItem('robinhood_player', JSON.stringify({
                hp: this.hp,
                maxHp: this.maxHp,
                attack: this.attack,
                defense: this.defense,
                gold: this.gold,
                level: this.level,
                experience: this.experience,
                inventory: this.inventory
            }));
        } catch(e) {}
    }

    load() {
        try {
            const data = JSON.parse(localStorage.getItem('robinhood_player'));
            if (data) {
                this.hp = data.hp || 100;
                this.maxHp = data.maxHp || 100;
                this.attack = data.attack || 10;
                this.defense = data.defense || 5;
                this.gold = data.gold || 50;
                this.level = data.level || 1;
                this.experience = data.experience || 0;
                this.inventory = data.inventory || [];
            }
        } catch(e) {}
    }
}

class GameBattle {
    constructor(p2p) {
        this.p2p = p2p;
        this.enemyHp = 100;
        this.enemyMaxHp = 100;
        this.enemyLevel = 1;
    }

    attack(target) {
        const damage = Math.floor(Math.random() * 15) + 5;
        this.enemyHp = Math.max(0, this.enemyHp - damage);
        return { damage, enemyHp: this.enemyHp };
    }

    resetEnemy() {
        this.enemyLevel = Math.floor(Math.random() * 3) + 1;
        this.enemyMaxHp = 80 + this.enemyLevel * 30;
        this.enemyHp = this.enemyMaxHp;
    }
}

class GameBlackMarket {
    constructor(p2p) {
        this.p2p = p2p;
        this.listings = [];
    }

    listItem(item, price) {
        this.listings.push({ id: Date.now(), item, price, seller: this.p2p._peerId });
    }

    buyItem(listingId) {
        const idx = this.listings.findIndex(l => l.id === listingId);
        if (idx >= 0) {
            const listing = this.listings[idx];
            this.listings.splice(idx, 1);
            return listing;
        }
        return null;
    }
}

class Game {
    constructor(p2p) {
        this.p2p = p2p;
        this.isRunning = false;
        this.phaser = null;
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
        if (this.phaser) { this.phaser.destroy(true); this.phaser = null; }
        this.stopSync();

        this.p2p._emit('game-stopped', {});

        const gameBtn = document.getElementById('btn-game');
        if (gameBtn) gameBtn.style.background = '';

        this.showMessage('⏹️ Игра остановлена');
    }

    async initPhaser() {
        const canvasContainer = document.getElementById('phaser-canvas');
        if (!canvasContainer) return;

        if (this.phaser) { this.phaser.destroy(true); this.phaser = null; }

        const rect = canvasContainer.getBoundingClientRect();
        const width = rect.width || 400;
        const height = rect.height || 400;

        this.phaser = new Phaser.Game({
            type: Phaser.AUTO,
            parent: canvasContainer,
            width: width,
            height: height,
            backgroundColor: '#1a1a2a',
            scene: {
                create: () => this.createScene(),
                update: () => this.updateScene()
            },
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        });
    }

    createScene() {
        const { width, height } = this.phaser.scale;

        this.statusText = this.phaser.add.text(width / 2, 30, '⚔️ Арена', {
            fontSize: '22px',
            fill: '#a0b0e0',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.playerRect = this.phaser.add.rectangle(width * 0.3, height * 0.5, 60, 60, 0x4caf50);
        this.enemyRect = this.phaser.add.rectangle(width * 0.7, height * 0.5, 60, 60, 0xf44336);
        this.enemyRect.setInteractive();
        this.enemyRect.on('pointerdown', () => this.onAttackClick());

        this.attackBtn = this.phaser.add.text(width / 2, height * 0.8, '⚔️ АТАКА', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#6b7db3',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        this.attackBtn.on('pointerdown', () => this.onAttackClick());

        this.messageText = this.phaser.add.text(width / 2, height * 0.15, '', {
            fontSize: '16px',
            fill: '#a0b0e0',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.sceneReady = true;
    }

    updateScene() {
        if (!this.sceneReady || !this.isRunning) return;
    }

    onAttackClick() {
        if (!this.isRunning) return;

        const damage = Math.floor(Math.random() * 15) + 5;
        this.battle.enemyHp = Math.max(0, this.battle.enemyHp - damage);

        if (this.enemyRect) {
            this.enemyRect.setFillStyle(0xff0000);
            setTimeout(() => this.enemyRect.setFillStyle(0xf44336), 200);
        }

        this.showMessage(`-${damage} HP врага!`);

        if (this.battle.enemyHp <= 0) {
            this.battle.enemyHp = 0;
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
    }

    updateArenaDisplay() {
        const hpText = `❤️ ${this.player.hp}/${this.player.maxHp}  VS  ❤️ ${this.battle.enemyHp}/${this.battle.enemyMaxHp}`;
        if (this.statusText) this.statusText.setText(hpText);
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
        if (this.messageText) {
            this.messageText.setText(text);
            this.messageText.setAlpha(1);
            this.phaser.tweens.add({
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
                break;
            case 'victory':
                this.showMessage(`🏆 ${data.nick || 'Игрок'} одержал победу!`);
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

// Age of RobinHood RPG - Game Core

const game = {
    gold: 0,
    gems: 0,
    heroLvl: 1,
    heroXP: 0,
    heroXPToNext: 100,
    wave: 1,
    
    // Статы героя
    damage: 10,
    critChance: 5,
    critMultiplier: 1.5,
    attackSpeed: 1,
    autoDamage: 0,
    
    // Враг
    enemy: {
        name: 'Стражник',
        lvl: 1,
        maxHP: 100,
        currentHP: 100,
        goldReward: 10,
        xpReward: 20,
        defeated: 0
    },
    
    // Способности (кулдаун в секундах)
    skills: {
        1: { name: 'Мощный выстрел', cd: 5, currentCD: 0, multiplier: 3 },
        2: { name: 'Град стрел', cd: 10, currentCD: 0, multiplier: 1.5, hits: 3 },
        3: { name: 'Ядовитая стрела', cd: 8, currentCD: 0, multiplier: 2, dot: true }
    },
    
    autoAttackInterval: null,
    cdInterval: null,
    
    init() {
        this.updateUI();
        this.startAutoAttack();
        this.startCDTimer();
        this.bindEvents();
    },
    
    bindEvents() {
        const enemyContainer = document.getElementById('enemy-container');
        enemyContainer.addEventListener('click', () => this.playerAttack());
        
        document.getElementById('skill-1').addEventListener('click', () => this.useSkill(1));
        document.getElementById('skill-2').addEventListener('click', () => this.useSkill(2));
        document.getElementById('skill-3').addEventListener('click', () => this.useSkill(3));
        document.getElementById('btn-upgrade').addEventListener('click', () => this.openUpgrade());
        document.getElementById('close-upgrade-modal').addEventListener('click', () => {
            document.getElementById('upgrade-modal').classList.remove('active');
        });
    },
    
    playerAttack() {
        const dmg = this.calcDamage();
        this.dealDamage(dmg);
        this.showDamageNumber(dmg);
    },
    
    calcDamage() {
        let dmg = this.damage;
        const critRoll = Math.random() * 100;
        if (critRoll < this.critChance) {
            dmg = Math.floor(dmg * this.critMultiplier);
        }
        return dmg + Math.floor(Math.random() * 5);
    },
    
    dealDamage(dmg) {
        this.enemy.currentHP -= dmg;
        if (this.enemy.currentHP <= 0) {
            this.enemy.currentHP = 0;
            this.defeatEnemy();
        }
        this.updateHPBar();
    },
    
    defeatEnemy() {
        this.gold += this.enemy.goldReward;
        this.gainXP(this.enemy.xpReward);
        this.showGoldGain(this.enemy.goldReward);
        this.enemy.defeated++;
        this.wave++;
        this.spawnEnemy();
        this.updateUI();
    },
    
    spawnEnemy() {
        const lvl = this.enemy.lvl + (this.wave % 5 === 0 ? 1 : 0);
        const hp = 100 + (this.wave - 1) * 15;
        const names = ['Стражник', 'Лесник', 'Разбойник', 'Шериф', 'Сэр Гай', 'Дракон'];
        const name = names[Math.min(this.wave - 1, names.length - 1)];
        
        this.enemy.name = name;
        this.enemy.lvl = lvl;
        this.enemy.maxHP = hp;
        this.enemy.currentHP = hp;
        this.enemy.goldReward = 10 + this.wave * 3;
        this.enemy.xpReward = 20 + this.wave * 5;
        
        document.getElementById('enemy-name').textContent = name;
        document.getElementById('enemy-level').textContent = 'Ур. ' + lvl;
        this.updateHPBar();
    },
    
    gainXP(amount) {
        this.heroXP += amount;
        while (this.heroXP >= this.heroXPToNext) {
            this.heroXP -= this.heroXPToNext;
            this.heroLvl++;
            this.heroXPToNext = Math.floor(this.heroXPToNext * 1.3);
            this.damage += 3;
        }
    },
    
    useSkill(id) {
        const skill = this.skills[id];
        if (skill.currentCD > 0) return;
        
        let totalDmg = 0;
        const hits = skill.hits || 1;
        for (let i = 0; i < hits; i++) {
            const dmg = Math.floor(this.calcDamage() * skill.multiplier);
            totalDmg += dmg;
        }
        this.dealDamage(totalDmg);
        this.showDamageNumber(totalDmg, '#ff6600');
        
        skill.currentCD = skill.cd;
        document.getElementById('cd-' + id).style.display = 'block';
        document.getElementById('skill-' + id).classList.add('on-cd');
    },
    
    startAutoAttack() {
        this.autoAttackInterval = setInterval(() => {
            if (this.autoDamage > 0) {
                this.dealDamage(this.autoDamage);
            }
        }, 1000);
    },
    
    startCDTimer() {
        this.cdInterval = setInterval(() => {
            for (const id in this.skills) {
                const skill = this.skills[id];
                if (skill.currentCD > 0) {
                    skill.currentCD--;
                    document.getElementById('cd-' + id).textContent = skill.currentCD;
                    if (skill.currentCD <= 0) {
                        document.getElementById('cd-' + id).style.display = 'none';
                        document.getElementById('skill-' + id).classList.remove('on-cd');
                    }
                }
            }
        }, 1000);
    },
    
    showDamageNumber(dmg, color = '#ffcc00') {
        const container = document.getElementById('damage-numbers');
        const el = document.createElement('div');
        el.className = 'damage-number';
        el.textContent = '-' + dmg;
        el.style.color = color;
        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    },
    
    showGoldGain(amount) {
        const area = document.getElementById('battle-area');
        const el = document.createElement('div');
        el.className = 'gold-gain';
        el.textContent = '+' + amount + ' 🪙';
        area.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    },
    
    updateHPBar() {
        const pct = (this.enemy.currentHP / this.enemy.maxHP) * 100;
        document.getElementById('hp-bar').style.width = pct + '%';
    },
    
    updateUI() {
        document.getElementById('gold-display').textContent = this.gold;
        document.getElementById('gem-display').textContent = this.gems;
        document.getElementById('hero-lvl-display').textContent = this.heroLvl;
        document.getElementById('wave-display').textContent = this.wave;
    },
    
    openUpgrade() {
        const list = document.getElementById('upgrade-list');
        list.innerHTML = `
            <button class="btn-dark" onclick="game.upgrade('damage')">⚔️ Сила атаки +5 — 50 🪙</button>
            <button class="btn-dark" onclick="game.upgrade('crit')">🎯 Крит-шанс +2% — 30 🪙</button>
            <button class="btn-dark" onclick="game.upgrade('auto')">🤖 Авто-атака +3 — 100 🪙</button>
        `;
        document.getElementById('upgrade-modal').classList.add('active');
    },
    
    upgrade(type) {
        if (type === 'damage' && this.gold >= 50) {
            this.gold -= 50;
            this.damage += 5;
        } else if (type === 'crit' && this.gold >= 30) {
            this.gold -= 30;
            this.critChance += 2;
        } else if (type === 'auto' && this.gold >= 100) {
            this.gold -= 100;
            this.autoDamage += 3;
        } else {
            return;
        }
        this.updateUI();
        this.openUpgrade();
    }
};

game.init();
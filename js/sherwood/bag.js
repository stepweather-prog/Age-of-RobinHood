/**
 * Sherwood Bag System — Инвентарь, лут, экипировка
 */

Sherwood.Bag = {
    // ============================================================
    //  ДАННЫЕ
    // ============================================================

    _inventory: [],
    _equipment: {
        head: null,
        torso: null,
        hands: null,
        legs: null,
        feet: null,
        weapon1: null,
        weapon2: null,
        belt: null,
        amulet: null,
        ring: null
    },
    _maxSlots: 10,

    // ============================================================
    //  ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    init() {
        const player = Sherwood.getPlayer();
        if (!player) return;

        this._inventory = player.inventory || [];
        this._equipment = player.equipment || this._equipment;
        this._maxSlots = player.bagSize || 10;

        // Стартовый предмет
        if (this._inventory.length === 0) {
            this._inventory.push({
                id: 'starter_bow',
                name: 'Лук новичка',
                icon: 'assets/icons/default_item.png',
                part: 'weapon1',
                grade: 'common',
                type: 'weapon',
                stats: { attack: 5 },
                sellPrice: 10
            });
            this._save();
        }

        console.log('🎒 Сумка инициализирована, предметов:', this._inventory.length);
    },

    // ============================================================
    //  ОСНОВНЫЕ МЕТОДЫ
    // ============================================================

    getItems() {
        return this._inventory;
    },

    getEquipment() {
        return this._equipment;
    },

    getMaxSlots() {
        return this._maxSlots;
    },

    getFreeSlots() {
        return this._maxSlots - this._inventory.length;
    },

    isFull() {
        return this._inventory.length >= this._maxSlots;
    },

    // ============================================================
    //  ДОБАВЛЕНИЕ ПРЕДМЕТОВ
    // ============================================================

    addItem(item) {
        if (!item) return false;
        if (this.isFull()) {
            Sherwood.dispatch({
                type: 'BAG_FULL',
                payload: { item }
            });
            return false;
        }

        if (item.stackable && item.quantity) {
            const existing = this._inventory.find(i =>
                i.id === item.id && i.stackable
            );
            if (existing) {
                existing.quantity += item.quantity;
                this._save();
                return true;
            }
        }

        this._inventory.push({ ...item });
        this._save();

        Sherwood.dispatch({
            type: 'ITEM_ACQUIRED',
            payload: { item }
        });

        return true;
    },

    // ============================================================
    //  УДАЛЕНИЕ ПРЕДМЕТОВ
    // ============================================================

    removeItem(index, quantity = 1) {
        if (index < 0 || index >= this._inventory.length) return false;

        const item = this._inventory[index];
        if (!item) return false;

        if (item.stackable && item.quantity > quantity) {
            item.quantity -= quantity;
            this._save();
            return true;
        }

        this._inventory.splice(index, 1);
        this._save();
        return true;
    },

    // ============================================================
    //  ЭКИПИРОВКА
    // ============================================================

    equipItem(index) {
        if (index < 0 || index >= this._inventory.length) return false;

        const item = this._inventory[index];
        if (!item || !item.part) return false;

        const part = item.part;
        const oldItem = this._equipment[part];

        if (oldItem) {
            this._inventory.push(oldItem);
        }

        this._equipment[part] = item;
        this._inventory.splice(index, 1);

        Sherwood._recalcStats?.();

        Sherwood.dispatch({
            type: 'ITEM_EQUIPPED',
            payload: { part, item }
        });

        this._save();
        return true;
    },

    unequipItem(part) {
        if (!part || !this._equipment[part]) return false;

        const item = this._equipment[part];
        if (this.isFull()) {
            Sherwood.dispatch({
                type: 'BAG_FULL',
                payload: { item }
            });
            return false;
        }

        this._inventory.push(item);
        this._equipment[part] = null;

        Sherwood._recalcStats?.();

        Sherwood.dispatch({
            type: 'ITEM_UNEQUIPPED',
            payload: { part, item }
        });

        this._save();
        return true;
    },

    // ============================================================
    //  ПРОДАЖА / РАЗБОР
    // ============================================================

    sellItem(index) {
        if (index < 0 || index >= this._inventory.length) return false;

        const item = this._inventory[index];
        if (!item) return false;

        const price = item.sellPrice || Math.floor((item.buyPrice || 10) * 0.4);
        Sherwood.addResource('silver', price);

        this._inventory.splice(index, 1);
        this._save();

        Sherwood.dispatch({
            type: 'ITEM_SOLD',
            payload: { item, price }
        });

        return true;
    },

    dismantleItem(index) {
        if (index < 0 || index >= this._inventory.length) return false;

        const item = this._inventory[index];
        if (!item) return false;

        const materials = {
            wood: 1 + Math.floor(Math.random() * 3),
            silver: 5 + Math.floor(Math.random() * 10),
            scraps: 1 + Math.floor(Math.random() * 2)
        };

        if (item.grade === 'rare' || item.grade === 'epic') {
            materials.gold = Math.floor(Math.random() * 5);
        }

        for (const [material, count] of Object.entries(materials)) {
            if (material === 'gold') {
                Sherwood.addResource('gold', count);
            } else if (material === 'silver') {
                Sherwood.addResource('silver', count);
            } else {
                // Другие ресурсы
                Sherwood.addResource(material, count);
            }
        }

        this._inventory.splice(index, 1);
        this._save();

        Sherwood.dispatch({
            type: 'ITEM_DISMANTLED',
            payload: { item, materials }
        });

        return true;
    },

    // ============================================================
    //  ПОЛУЧЕНИЕ ЛУТА
    // ============================================================

    addLoot(loot) {
        if (!loot) return;

        if (loot.gold) Sherwood.addResource('gold', loot.gold);
        if (loot.silver) Sherwood.addResource('silver', loot.silver);
        if (loot.exp) Sherwood.addExp(loot.exp);

        if (loot.items && loot.items.length > 0) {
            loot.items.forEach(item => {
                this.addItem(item);
            });
        }

        Sherwood.dispatch({
            type: 'LOOT_ACQUIRED',
            payload: { loot }
        });
    },

    // ============================================================
    //  СОХРАНЕНИЕ
    // ============================================================

    _save() {
        const player = Sherwood.getPlayer();
        if (!player) return;

        player.inventory = this._inventory;
        player.equipment = this._equipment;
        player.bagSize = this._maxSlots;
        Sherwood.saveGame();
    }
};

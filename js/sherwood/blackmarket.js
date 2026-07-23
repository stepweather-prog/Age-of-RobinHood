/**
 * Sherwood BlackMarket — Рынок
 */

Sherwood.BlackMarket = {
    _shopItems: [],
    _lastRefresh: null,

    SHOP_TEMPLATES: [
        { id: 'health_potion', name: 'Зелье здоровья', icon: 'assets/interface/resource_life_potion.png', price: 50, currency: 'gold', type: 'consumable', effect: { heal: 100 } },
        { id: 'high_health_potion', name: 'Большое зелье', icon: 'assets/interface/resource_high_level_health_potion.png', price: 120, currency: 'gold', type: 'consumable', effect: { heal: 300 } },
        { id: 'dungeon_key', name: 'Ключ подземки', icon: 'assets/interface/resource_key_to_locked_levels.png', price: 200, currency: 'gold', type: 'consumable', effect: { addTickets: 1 } },
        { id: 'portal_token_1', name: 'Жетон портала', icon: 'assets/interface/resource_token_on_entrance_portal_1.png', price: 300, currency: 'gold', type: 'consumable' },
        { id: 'ring_crafting', name: 'Скрижаль колец', icon: 'assets/interface/ring_crafting_tablet_resource.png', price: 150, currency: 'silver', type: 'resource', gives: { scrolls: 5 } },
        { id: 'amulet_crafting', name: 'Скрижаль амулетов', icon: 'assets/interface/amulet_crafting_tablet_resource.png', price: 150, currency: 'silver', type: 'resource', gives: { scrolls: 5 } },
        { id: 'appearance_tablet', name: 'Скрижаль обликов', icon: 'assets/interface/resource_appearance_crafting_tablet.png', price: 200, currency: 'silver', type: 'resource', gives: { scrolls: 8 } },
        { id: 'ingot_pack', name: 'Набор слитков', icon: 'assets/ingots resource crafting skin/ingot_chapter_1.png', price: 500, currency: 'silver', type: 'resource', gives: { ingots: 10 } },
        { id: 'wood_pack', name: 'Древесина', icon: 'assets/interface/resource_wood.png', price: 100, currency: 'silver', type: 'resource', gives: { wood: 20 } },
        { id: 'feather_pack', name: 'Перья', icon: 'assets/interface/resource_feathers.png', price: 80, currency: 'silver', type: 'resource', gives: { feathers: 15 } },
        { id: 'random_ring', name: 'Случайное кольцо', icon: 'assets/interface/ring_first_level.png', price: 400, currency: 'gold', type: 'equipment', grade: 'uncommon' },
        { id: 'random_amulet', name: 'Случайный амулет', icon: 'assets/interface/sherwood_amulet_level_one.png', price: 400, currency: 'gold', type: 'equipment', grade: 'uncommon' }
    ],

    init: function() {
        this._refreshShop();
    },

    _refreshShop: function() {
        const pool = [...this.SHOP_TEMPLATES];
        this._shopItems = [];
        for (let i = 0; i < 6; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            this._shopItems.push({ ...pool[idx], shopIndex: i });
            pool.splice(idx, 1);
            if (pool.length === 0) break;
        }
        this._lastRefresh = Date.now();
    },

    getShopItems: function() {
        return this._shopItems;
    },

    buyItem: function(shopIndex) {
        if (shopIndex < 0 || shopIndex >= this._shopItems.length) {
            return { success: false, reason: 'Товар не найден' };
        }
        
        const item = this._shopItems[shopIndex];
        const player = Sherwood.getPlayer();
        
        if ((player.resources[item.currency] || 0) < item.price) {
            return { success: false, reason: 'Недостаточно средств' };
        }
        
        player.resources[item.currency] -= item.price;
        
        if (item.type === 'consumable') {
            if (item.effect) {
                if (item.effect.heal) {
                    player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + item.effect.heal);
                }
                if (item.effect.addTickets) {
                    player.dungeon.tickets = Math.min(player.dungeon.maxTickets, player.dungeon.tickets + item.effect.addTickets);
                }
            }
        } else if (item.type === 'resource' && item.gives) {
            for (const [res, amount] of Object.entries(item.gives)) {
                player.resources[res] = (player.resources[res] || 0) + amount;
            }
        } else if (item.type === 'equipment') {
            const newItem = this._generateEquipment(item.grade || 'common');
            if (Sherwood.Bag && Sherwood.Bag.addItem) {
                Sherwood.Bag.addItem(newItem);
            }
        }
        
        Sherwood.saveGame();
        return { success: true, item: item };
    },

    _generateEquipment: function(grade) {
        const gradeMultiplier = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 };
        const mult = gradeMultiplier[grade] || 1;
        const parts = ['weapon1', 'torso', 'head', 'hands', 'legs', 'feet', 'belt', 'ring', 'amulet'];
        const part = parts[Math.floor(Math.random() * parts.length)];
        
        return {
            id: 'shop_' + Date.now(),
            name: grade.charAt(0).toUpperCase() + grade.slice(1) + ' предмет',
            icon: 'assets/interface/labyrinth_of_icons.png',
            part: part,
            grade: grade,
            type: 'equipment',
            stats: {
                attack: Math.floor(Math.random() * 8 * mult) + mult * 2,
                defense: Math.floor(Math.random() * 5 * mult) + mult,
                hp: Math.floor(Math.random() * 15 * mult) + mult * 5
            },
            sellPrice: 10 * mult
        };
    }
};

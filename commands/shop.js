const rewards = require('../systems/rewards');
const db = require('../external/database.js');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');
const errors = require('../data/errors');
const { delay } = require('../utils/delay.js');

const LIMIT_PER_PAGE = 6;

var showShop = async (weapons, armors, page, msg, channel, requester) => {
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle("The Shop");

    if (msg === null)
        msg = await channel.send(embed);

    let lineCount = 0;
    let i = page*LIMIT_PER_PAGE;

    for (; i < weapons.length && lineCount < LIMIT_PER_PAGE; i++, lineCount++) {
        embed = embed
        .addField(`${lineCount+1}. ${weapons[i].title}`,
            `Cost: ${weapons[i].cost_per_level}
            Damage: ${weapons[i].damage_per_level}
            Rate of Attack: ${weapons[i].rate}
            Effect: ${weapons[i].effect_title !== null ? weapons[i].effect_title : "None"}
            Min Level to buy: ${weapons[i].min_level}
            Your level with this: ${weapons[i].level !== null ? weapons[i].level : 0}`, true);
    }
    i -= weapons.length;

    for (; i < armors.length && lineCount < LIMIT_PER_PAGE; i++, lineCount++) {
        embed = embed
        .addField(`${lineCount+1}. ${armors[i].title}`, 
            `Cost: ${armors[i].cost_per_level}
            Health: ${armors[i].health}
            Shields: ${armors[i].shield}
            Plate: ${armors[i].plate}
            Regen: ${armors[i].regen}
            Evasion: ${armors[i].evasion}
            Resistance to Effect: ${armors[i].effect_title !== null ? armors[i].effect_title : "None"}
            Min Level to buy: ${armors[i].min_level}
            Your Level with this: ${armors[i].level !== null ? armors[i].level : 0}`, true);
    }

    saved_messages.add_message('showShop', msg.id, {weapons: weapons, armors: armors, page: page, msg: msg, requester: requester});
    msg.edit(embed);
    msg.react("◀️");
    msg.react("▶️");

    // Reactions
    const userReactions = msg.reactions.cache.filter(reaction => reaction.users.cache.has(requester));
    try {
        for (const reaction of userReactions.values()) {
            await reaction.users.remove(requester);
        }
    } catch (error) {
        console.error('Failed to remove reactions.');
    }

    await delay(1000);
    if (saved_messages.get_message('showShop', msg.id) !== null) {
        saved_messages.remove_message('showShop', msg.id);
        msg.reactions.removeAll();
    }
}


var checkShop = async (com_args, msg) => {
    let weapons = [];
    let armors = [];

    let weapon_promise = db.makeQuery(`SELECT weapons.title, cost_per_level, damage_per_level, rate, min_level, effects.title as effect_title, 
    playersWeapons.level
    FROM (weapons LEFT OUTER JOIN effects ON weapons.effect = effects.id) 
    LEFT OUTER JOIN playersWeapons ON weapons.id = playersWeapons.weapon_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true`, [msg.author.id]).then((result) => {
        weapons = result.rows;
    });

    let armor_promise = db.makeQuery(`SELECT armors.title, cost_per_level, health, shield, plate, regen, evasion, min_level, effects.title as effect_title, 
    playersArmors.level
    FROM (armors LEFT OUTER JOIN effects ON armors.effect = effects.id) 
    LEFT OUTER JOIN playersArmors ON armors.id = playersArmors.armor_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true`, [msg.author.id]).then((result) => {
        armors = result.rows;
    });

    await Promise.all([weapon_promise, armor_promise]);

    showShop(weapons, armors, 0, null, msg.channel, msg.author.id);
}

var buyFromShop = async (com_args, msg) => {
    // Get shop index
    let shopIndex = parseInt(com_args[0]);
    if (shopIndex === NaN) {
        msg.reply(errors.invalidArgs);
        return;
    }
    shopIndex -= 1;

    // Get purchase amount
    let purchaseAmount = 1;
    if (com_args.length > 1) {
        let p = parseInt(com_args[1]);
        if (p !== NaN)
            purchaseAmount = p;
    }

    let weapons = [];
    let armors = [];

    // Check if item exists
    let weapon_promise = db.makeQuery(`SELECT weapons.title, cost_per_level, level
    FROM weapons LEFT OUTER JOIN playersWeapons ON weapons.id = playersWeapons.weapon_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true`, [msg.author.id]).then((result) => {
        weapons = result.rows;
    });

    let armor_promise = db.makeQuery(`SELECT armors.title, cost_per_level, level
    FROM armors LEFT OUTER JOIN playersArmors ON armors.id = playersArmors.armor_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true`, [msg.author.id]).then((result) => {
        armors = result.rows;
    });

    await Promise.all([weapon_promise, armor_promise]);

    if (shopIndex >= weapons.length + armors.length) {
        msg.reply(errors.invalidArgs);
        return;
    }

    let item = shopIndex < weapons.length ? weapons[shopIndex] : armors[shopIndex];
    let cost = item.cost_per_level;
    let coins = 0;
    await db.makeQuery(`SELECT coins FROM players WHERE userid = $1`, [msg.author.id]).then(result => {
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }

        coins = result.rows[0].coins;
    });

    if (coins < cost*purchaseAmount) {
        msg.reply("You don't have enough coins for this item...");
        return;
    }
    
    let m = await msg.reply(`Confirm purchase of ${purchaseAmount} Level(s) of ${item.title}? This will cost ${item.cost_per_level*purchaseAmount} coins.`);
    m.react('✅');
    m.react('❌');
    saved_messages.add_message('confirmPurchase', m.id, {item: item, purchaseAmount: purchaseAmount, msg: msg});

    await delay(1000*30);
    if (saved_messages.get_message('confirmPurchase', m.id) !== null) {
        saved_messages.remove_message('confirmPurchase', m.id);
        m.reactions.removeAll();
    }
}



// Exports
module.exports = {
    name: "shop",
    category: "Shop",
    description: "Check the shop or buy/upgrade equipment.", 
    examples: ["#shop: Shows the list of all equipment available for purchase.",
    "#shop 10: buy/upgrade the 10th equipment in the shop.",
    "#shop 5 3: buy 3 levels of the 3th equipment in the shop."],
    min: 0, max: 1, cooldown: 2,
    execute: async (com_args, msg) => {
        if (com_args.length <= 0) {
            checkShop(com_args, msg);
        } else {
            buyFromShop(com_args, msg);
        }
    },
    buyFromShop: buyFromShop,
    reaction: async (reaction, user) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        // Turn pages
        let pkg = saved_messages.get_message('showShop', msg.id);
        if (pkg) {
            if (user.id !== pkg.msg.author.id)
                return;

            if (emoji === "◀️" && pkg.page > 0)
                pkg.page -= 1;

            else if (emoji === "▶️" && pkg.page < Math.floor((pkg.weapons.length + pkg.armors.length - 1)/LIMIT_PER_PAGE))
                pkg.page += 1;
            
            showShop(pkg.weapons, pkg.armors, pkg.page, pkg.msg, pkg.msg.channel, pkg.requester);
            return;
        }

        // Confirm Purchase
        pkg = saved_messages.get_message('confirmPurchase', msg.id);
        if (pkg) {
            if (user.id !== pkg.msg.author.id)
                return;
            
            msg.reactions.removeAll();
            saved_messages.remove_message('confirmPurchase', msg.id);
            msg.edit("Purchase confirmed!");

            if (emoji !== "✅") 
                return;
            
            db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE userid = $1`, [msg.author.id, pkg.cost]);
            if (pkg.item.damage_per_level !== null) {
                db.makeQuery(`SELECT buy_weapon($1, $2)`, [user.id, pkg.item.title]);
                console.log("Weapon bought!");
            } else
                db.makeQuery(`SELECT buy_armor($1, $2)`, [user.id, pkg.item.title]);
            return;
        }

    },
    permission: (msg) => true
};

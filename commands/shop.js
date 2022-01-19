const db = require('../external/database.js');
const { codeBlock } = require('@discordjs/builders');
const saved_messages = require('../utils/saved_messages');
const errors = require('../data/errors');
const { delay } = require('../utils/delay.js');

var showShop = async (weapons, armors, channel)  => {
    let weaponTuples = [];
    let armorTuples = [];

    let indexHeader = 'Nº ';
    let titleHeader = 'TITLE';
    let costHeader = 'COST';
    let levelHeader = 'MIN. LEVEL';

    let longestIndexLength = indexHeader.length;
    let longestTitleLength = titleHeader.length;
    let longestCostLength = costHeader.length;

    // Setup Tuples
    let i = 1;
    for (let weapon of weapons) {
        if (weapon.title.length > longestTitleLength)
            longestTitleLength = weapon.title.length;
        
        weaponTuples.push([i, weapon.title, weapon.cost_per_level, weapon.min_level]);
        i++;
    }

    for (let armor of armors) {
        if (armor.title.length > longestTitleLength) {
            longestTitleLength = armor.title.length;
        }
        armorTuples.push([i, armor.title, armor.cost_per_level, armor.min_level]);
        i++;
    }

    // Setup lines
    let setupLine = (index, titleStr, cost, min_level) => {
        let indexStr = `${index}.`;
        while (longestIndexLength > indexStr.length) {
            indexStr += ' ';
        }
        
        while (longestTitleLength > titleStr.length) {
            titleStr += ' ';
        }

        let costStr = `${cost}$`;
        while (longestCostLength > costStr.length) {
            costStr += ' ';
        }

        rowStrings.push(`${indexStr} ${titleStr}  ${costStr}   Level ${min_level}`);
    }

    while (longestTitleLength > titleHeader.length) {
        titleHeader += ' ';
    }
    let header = `${indexHeader} ${titleHeader}  ${costHeader}   ${levelHeader}`;

    let rowStrings = [];
    rowStrings.push("WEAPONS ---");
    rowStrings.push(header);
    weaponTuples.forEach(tuple => setupLine(...tuple));
    rowStrings.push("ARMORS ----");
    rowStrings.push(header);
    armorTuples.forEach(tuple => setupLine(...tuple));

    let message = `🪐 SHOP 🪐\n\n` + rowStrings.join("\n");
    channel.send(codeBlock('js', message));
}


/*var showShop = async (weapons, armors, channel) => {
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle("The Shop")
    .setDescription("*To read more information about an item, use #check <number>*");

    let total_i = 1;
    let text = '';
    for (let i = 0; i < weapons.length; i++, total_i++) {
        text += `**${total_i}. ${weapons[i].title}** ${weapons[i].cost_per_level}:coin: - **[Lvl ${weapons[i].min_level}]**\n`;
    }
    embed = embed.addField(`WEAPONS`, text, false);

    text = '';
    for (let i = 0; i < armors.length; i++, total_i++) {
        text += `**${total_i}. ${armors[i].title}** ${armors[i].cost_per_level}:coin: - **[Lvl ${armors[i].min_level}]**\n`;
    }
    embed = embed.addField(`ARMORS`, text, false);

    channel.send(embed);
}*/


var checkShop = async (com_args, msg) => {
    let weapons = [];
    let armors = [];
    
    let m = await msg.reply("Loading...");
    let result = await db.makeQuery(`SELECT title, cost_per_level, min_level FROM weapons WHERE in_shop = true ORDER BY cost_per_level, title`);
    weapons = result.rows;

    result = await db.makeQuery(`SELECT title, cost_per_level, min_level FROM armors WHERE in_shop = true ORDER BY cost_per_level, title`);
    armors = result.rows;

    await showShop(weapons, armors, msg.channel);
    m.delete().catch(err => console.log("Couldn't delete the message " + err));
}

var buyFromShop = async (com_args, msg) => {
    // Get shop index
    let shopIndex = parseInt(com_args[0]);
    if (shopIndex !== shopIndex) {
        msg.reply(errors.invalidArgs);
        return;
    }
    shopIndex -= 1;

    // Get purchase amount
    let purchaseAmount = 1;
    if (com_args.length > 1) {
        let p = parseInt(com_args[1]);
        if (p !== p) {
            msg.reply(errors.invalidArgs);
            return;
        }
        purchaseAmount = p;
    }

    let weapons = [];
    let armors = [];

    // Check if item exists
    let result = await db.makeQuery(`SELECT weapons.title, cost_per_level, level, min_level
    FROM weapons LEFT OUTER JOIN playersWeapons ON weapons.id = playersWeapons.weapon_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, weapons.title`, [msg.author.id]);
    weapons = result.rows;

    result = await db.makeQuery(`SELECT title, cost_per_level, level, min_level
    FROM armors LEFT OUTER JOIN playersArmors ON armors.id = playersArmors.armor_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, armors.title`, [msg.author.id]);
    armors = result.rows;

    //await Promise.all([weapon_promise, armor_promise]);

    if (shopIndex >= weapons.length + armors.length || shopIndex < 0 || purchaseAmount <= 0) {
        msg.reply(errors.invalidArgs);
        return;
    }

    let item = (shopIndex < weapons.length ? weapons[shopIndex] : armors[shopIndex-weapons.length]);
    let cost = item.cost_per_level;
    let coins = 0;

    if ((item.level != null ? item.level : 0) + purchaseAmount > 100) {
        msg.reply("Items can't go over Level 100!");
        return;
    }

    result = await db.makeQuery(`SELECT coins, level FROM players WHERE userid = $1`, [msg.author.id]);
    if (result.rowCount < 1) {
        msg.reply(errors.unregisteredPlayer);
        return;
    }

    if (result.rows[0].level < item.min_level) {
        msg.reply("Your level is not high enough for this item...");
        return;
    }

    coins = result.rows[0].coins;
    if (coins < cost*purchaseAmount) {
        msg.reply("You don't have enough coins for this item...");
        return;
    }
    
    let m = await msg.reply(`Confirm purchase of ${purchaseAmount} Level(s) of ${item.title}? This will cost ${item.cost_per_level*purchaseAmount} coins.`);
    m.react('✅');
    m.react('❌');
    saved_messages.add_message('confirmPurchase', m.id, {item: item, purchaseAmount: purchaseAmount, msg: msg, isWeapon: (shopIndex < weapons.length)});

    await delay(1000*900);
    if (saved_messages.get_message('confirmPurchase', m.id) != null) {
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
    "#shop 5 3: buy 3 levels of the 5th equipment in the shop."],
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

        // Confirm Purchase
        let pkg = saved_messages.get_message('confirmPurchase', msg.id);
        if (pkg) {
            if (user.id !== pkg.msg.author.id)
                return;
            
            msg.reactions.removeAll();
            saved_messages.remove_message('confirmPurchase', msg.id);

            if (emoji !== "✅") {
                msg.edit("Purchase cancelled.");
                return;
            }
            msg.edit("Purchase confirmed!");
            
            db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE userid = $1`, [user.id, pkg.item.cost_per_level*pkg.purchaseAmount]);
            if (pkg.isWeapon) {
                db.makeQuery(`SELECT buy_weapon($1, $2, $3)`, [user.id, pkg.item.title, pkg.purchaseAmount]);
                console.log("Weapon bought!");
            } else {
                db.makeQuery(`SELECT buy_armor($1, $2, $3)`, [user.id, pkg.item.title, pkg.purchaseAmount]);
                console.log("Armor bought!");
            }
            return;
        }

    },
    permission: (msg) => true
};

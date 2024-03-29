const db = require('../external/database.js');
const { codeBlock } = require('@discordjs/builders');
const saved_messages = require('../utils/saved_messages');
const errors = require('../data/errors');
const { delay } = require('../utils/delay.js');
const {deleteMessage} = require('../utils/deleteMessage');
const fixedMessage = require('../utils/fixedMessage');
const {updateIDs} = require('../systems/autoDeleter');
const {isValid} = require('../systems/autoDeleter');


var error = async (msg, errorText, waitTime = 5) => {
    let m = await msg.reply(errorText);
    await delay(1000*waitTime);
    msg.delete().catch();
    m.delete().catch();
} 


var showShop = (weapons, armors)  => {
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

        rowStrings.push(`${indexStr} ${titleStr} ${costStr} Lvl ${min_level}`);
    }

    while (longestTitleLength > titleHeader.length) {
        titleHeader += ' ';
    }
    let header = `${indexHeader} ${titleHeader} ${costHeader} ${levelHeader}`;

    let rowStrings = [];
    rowStrings.push("WEAPONS ---");
    rowStrings.push(header);
    weaponTuples.forEach(tuple => setupLine(...tuple));
    rowStrings.push("ARMORS ----");
    rowStrings.push(header);
    armorTuples.forEach(tuple => setupLine(...tuple));

    let message = `🪐 SHOP 🪐\n\n` + rowStrings.join("\n") + "\n\n//Items in the shop change each day, come back tomorrow to buy new items";
    return codeBlock('js', message);
}


var checkShop = async (com_args, msg) => {
    let m = await msg.reply("Loading...");

    // Delete old shop message
    let oldMsgExists = await fixedMessage.deleteOldMessage(msg, 'shop');

    // Obtain product list
    let weaponResult = db.makeQuery(`SELECT title, cost_per_level, min_level FROM weapons WHERE in_shop = true ORDER BY cost_per_level, title`);
    let armorResult = db.makeQuery(`SELECT title, cost_per_level, min_level FROM armors WHERE in_shop = true ORDER BY cost_per_level, title`);
    let weapons = (await weaponResult).rows;
    let armors = (await armorResult).rows;

    // Send new message
    let shopMsg = await msg.channel.send(showShop(weapons, armors));
    fixedMessage.updateFixedMessage(oldMsgExists, shopMsg, 'shop');
    updateIDs();

    msg.delete().catch(err => console.log("Couldn't delete the message " + err));
    m.delete().catch(err => console.log("Couldn't delete the message " + err));
}



var buyFromShop = async (com_args, msg) => {
    // Get shop index
    let shopIndex = parseInt(com_args[0]);
    if (shopIndex !== shopIndex) {
        error(msg, errors.helpFormatting(module.exports), 10);
        return;
    }
    shopIndex -= 1;

    // Get purchase amount
    let purchaseAmount = 1;
    if (com_args.length > 1) {
        let p = parseInt(com_args[1]);
        if (p !== p) {
            error(msg, errors.helpFormatting(module.exports), 10);
            return;
        }
        purchaseAmount = p;
    }

    let weapons = [];
    let armors = [];

    // Check if item exists
    let weaponResult = db.makeQuery(`SELECT weapons.title, cost_per_level, level, min_level
    FROM weapons LEFT OUTER JOIN playersWeapons ON weapons.id = playersWeapons.weapon_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, weapons.title`, [msg.author.id]);

    let armorResult = db.makeQuery(`SELECT title, cost_per_level, level, min_level
    FROM armors LEFT OUTER JOIN playersArmors ON armors.id = playersArmors.armor_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, armors.title`, [msg.author.id]);

    weapons = (await weaponResult).rows;
    armors = (await armorResult).rows;

    if (shopIndex >= weapons.length + armors.length || shopIndex < 0 || purchaseAmount <= 0) {
        error(msg, errors.helpFormatting(module.exports));
        return;
    }

    let item = (shopIndex < weapons.length ? weapons[shopIndex] : armors[shopIndex-weapons.length]);
    let cost = item.cost_per_level;
    let coins = 0;

    if ((item.level != null ? item.level : 0) + purchaseAmount > 100) {
        error(msg, "Items can't go over Level 100!");
        return;
    }

    result = await db.makeQuery(`SELECT coins, level FROM players WHERE userid = $1`, [msg.author.id]);
    if (result.rowCount < 1) {
        error(msg, errors.unregisteredPlayer);
        return;
    }

    if (result.rows[0].level < item.min_level) {
        error(msg, "Your level is not high enough for this item...");
        return;
    }

    coins = result.rows[0].coins;
    if (coins < cost*purchaseAmount) {
        error(msg, "You don't have enough coins for this item...");
        return;
    }
    
    let m = await msg.reply(`Confirm purchase of ${purchaseAmount} Level(s) of ${item.title}? This will cost ${item.cost_per_level*purchaseAmount} coins.`).catch(err => console.log(err));
    m.react('✅');
    m.react('❌');
    saved_messages.add_message('confirmPurchase', m.id, {item: item, purchaseAmount: purchaseAmount, msg: msg, isWeapon: (shopIndex < weapons.length)});

    // Cleanup
    await delay(1000*120);
    msg.delete().catch(err => console.log(err));
    if (saved_messages.get_message('confirmPurchase', m.id) != null)
        deleteMessage(m, 'confirmPurchase');
    
}


var acquireFromShop = async (shopIndex, purchaseAmount, userid, msg) => {
    // Check if item exists
    let weaponResult = db.makeQuery(`SELECT weapons.title, cost_per_level, level, min_level
    FROM weapons LEFT OUTER JOIN playersWeapons ON weapons.id = playersWeapons.weapon_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, weapons.title`, [userid]);
    let armorResult = db.makeQuery(`SELECT title, cost_per_level, level, min_level
    FROM armors LEFT OUTER JOIN playersArmors ON armors.id = playersArmors.armor_id AND player_id = 
    (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, armors.title`, [userid]);
    let weapons = (await weaponResult).rows;
    let armors = (await armorResult).rows;

    if (shopIndex >= weapons.length + armors.length || shopIndex < 0 || purchaseAmount <= 0) {
        error(msg, errors.helpFormatting(module.exports));
        return;
    }

    // Check item
    let item = (shopIndex < weapons.length ? weapons[shopIndex] : armors[shopIndex-weapons.length]);
    if ((item.level != null ? item.level : 0) + purchaseAmount > 100) {
        error(msg, "Items can't go over Level 100!");
        return;
    }

    // Check player
    result = await db.makeQuery(`SELECT title, level FROM players WHERE userid = $1`, [userid]);
    if (result.rowCount < 1) {
        error(msg, errors.unregisteredPlayer);
        return;
    }
    if (result.rows[0].level < item.min_level) {
        error(msg, "Their level is not high enough for this item...");
        return;
    }

    // Purchase item
    if (shopIndex < weapons.length) {
        db.makeQuery(`SELECT buy_weapon($1, $2, $3)`, [userid, item.title, purchaseAmount]);
        console.log("Weapon bought!");
    } else {
        db.makeQuery(`SELECT buy_armor($1, $2, $3)`, [userid, item.title, purchaseAmount]);
        console.log("Armor bought!");
    }
    msg.channel.send(`${purchaseAmount} Level(s) of ${item.title} added to ${result.rows[0].title}.`);
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
    acquireFromShop: acquireFromShop,
    showShop: showShop,

    reaction: async (reaction, user) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        // Confirm Purchase
        let pkg = saved_messages.get_message('confirmPurchase', msg.id);
        if (pkg) {
            if (user.id !== pkg.msg.author.id)
                return;

            if (emoji !== "✅" && emoji !== "❌")
                return;
            
            msg.reactions.removeAll();
            saved_messages.remove_message('confirmPurchase', msg.id);

            if (emoji === "❌") {
                msg.edit("Purchase cancelled.");
            } else {              
                await db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE userid = $1`, [user.id, pkg.item.cost_per_level*pkg.purchaseAmount]);
                db.makeQuery(`SELECT coins FROM players WHERE userid = $1`, [user.id]).then(result => {
                    if (result.rowCount < 1)
                        return;

                    msg.edit(`Purchase confirmed! You now have **${result.rows[0].coins} coins**.`);
                });

                if (pkg.isWeapon) {
                    db.makeQuery(`SELECT buy_weapon($1, $2, $3)`, [user.id, pkg.item.title, pkg.purchaseAmount]);
                    console.log("Weapon bought!");
                } else {
                    db.makeQuery(`SELECT buy_armor($1, $2, $3)`, [user.id, pkg.item.title, pkg.purchaseAmount]);
                    console.log("Armor bought!");
                }
            }

            await delay(1000 * 5);
            pkg.msg.delete().catch(err => console.log(err));
            msg.delete().catch(err => console.log(err));
        }

    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder") && isValid(msg, module.exports.name)
};

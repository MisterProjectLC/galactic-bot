const shop = require('./shop');
const db = require('../external/database.js');
const errors = require('../data/errors');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');

// Exports
module.exports = {
    name: "removeitem",
    nicknames: ["removeItem"],
    category: "Control",
    description: "Admin only. Removes items from a player.", 
    examples: ["#removeitem 10 @User: removes the 10th equipment in the shop to the mentioned user."],
    min: 3, max: 3, cooldown: 0,
    execute: async (com_args, msg) => {
        // Item
        let itemIndex = parseInt(com_args[0]);
        if (!(itemIndex === itemIndex && itemIndex > 0)) {
            msg.reply(errors.invalidArgs);
            return;
        }
        itemIndex -= 1;

        // Level
        let level = parseInt(com_args[1]);
        if (!(level === level && level > 0)) {
            msg.reply(errors.invalidArgs);
            return;
        }

        // Gifted
        let giftedID = getUserIDFromMention(com_args[2]);
        if (giftedID === null) {
            msg.reply("Couldn't find the mentioned player...");
            msg.reply(errors.helpFormatting(module.exports));
            return;
        }

        let gifted = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [giftedID]);
        if (gifted.rowCount < 1) {
            msg.reply("Couldn't find the mentioned player...");
            return;
        }

        // Check if item exists
        let weaponResult = db.makeQuery(`SELECT weapons.title, cost_per_level, level, min_level
        FROM weapons LEFT OUTER JOIN playersWeapons ON weapons.id = playersWeapons.weapon_id AND player_id = 
        (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, weapons.title`, [userid]);
        let armorResult = db.makeQuery(`SELECT title, cost_per_level, level, min_level
        FROM armors LEFT OUTER JOIN playersArmors ON armors.id = playersArmors.armor_id AND player_id = 
        (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true ORDER BY cost_per_level, armors.title`, [userid]);
        let weapons = (await weaponResult).rows;
        let armors = (await armorResult).rows;

        if (itemIndex >= weapons.length + armors.length || itemIndex < 0 || purchaseAmount <= 0) {
            error(msg, errors.helpFormatting(module.exports));
            return;
        }

        // Check item
        let item = (itemIndex < weapons.length ? weapons[itemIndex] : armors[itemIndex-weapons.length]);
        
        if (itemIndex < weapons.length) {
            db.makeQuery(`DELETE FROM playersWeapons WHERE weapon_id = (SELECT id FROM weapons WHERE title = $2)
            AND player_id = (SELECT id FROM players WHERE userid = $1)`,
            [userid, item.title]);
        }
        else {
            db.makeQuery(`DELETE FROM playersArmors WHERE armor_id = (SELECT id FROM armors WHERE title = $2)
            AND player_id = (SELECT id FROM players WHERE userid = $1)`,
            [userid, item.title]);
        }
    },

    reaction: async (reaction, user) => {
        shop.reaction(reaction, user);
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

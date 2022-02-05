const shop = require('./shop');
const db = require('../external/database.js');
const errors = require('../data/errors');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');

// Exports
module.exports = {
    name: "additem",
    nicknames: ["addItem"],
    category: "Control",
    description: "Admin only. Gives item levels to a player.", 
    examples: ["#additem 10 3 @User: gives 3 levels of the 10th equipment in the shop to the mentioned user."],
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

        shop.acquireFromShop(itemIndex, level, giftedID, msg);
    },
    reaction: async (reaction, user) => {
        shop.reaction(reaction, user);
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

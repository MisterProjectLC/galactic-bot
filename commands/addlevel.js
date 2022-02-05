const db = require('../external/database.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');


// Exports
module.exports = {
    name: "addlevel",
    category: "Control",
    description: "Admin only. Gives levels to a player.",
    examples: ["#addlevel @User 10: gives 10 levels to the mentioned user."],
    min: 2, max: 2, cooldown: 0,
    execute: async (com_args, msg) => {
        // Gifted
        let giftedID = getUserIDFromMention(com_args[0]);
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
        gifted = gifted.rows[0];
        
        // Coins
        let levels = parseInt(com_args[1]);
        if (!(levels === levels && levels > 0)) {
            msg.reply(errors.invalidArgs);
            return;
        }

        rewards.giveLevels(giftedID, levels, msg.channel, module.exports);

    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

const db = require('../external/database.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');


// Exports
module.exports = {
    name: "addcoins",
    category: "Control",
    description: "Admin only. Gives coins to a player.",
    examples: ["#addcoins @User 20: gives 20 coins to the mentioned user."],
    min: 2, max: 2, cooldown: 0,
    execute: async (com_args, msg) => {
        // Gifted
        let giftedID = getUserIDFromMention(com_args[0]);
        if (giftedID === null)
            giftedID = com_args[0];
        
        let gifted = await db.makeQuery(`SELECT userid FROM players WHERE $1 ILIKE userid`, [giftedID]);
        if (gifted.rowCount < 1) {
            msg.reply("Couldn't find the mentioned player...");
            return;
        }
        gifted = gifted.rows[0];
        
        // Coins
        let coins = parseInt(com_args[1]);
        if (!(coins === coins && coins > 0)) {
            msg.reply(errors.invalidArgs);
            return;
        }

        rewards.giveCoins(giftedID, coins, msg.channel, module.exports);

    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

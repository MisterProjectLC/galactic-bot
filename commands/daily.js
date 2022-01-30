const db = require('../external/database.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');

// Exports
module.exports = {
    name: "daily",
    category: "Rewards",
    description: "Reclaim your daily reward.", 
    min: 0, max: 0, cooldown: 86400, cooldownMessage: "You already collected for today.",
    execute: async (com_args, msg) => {
        let result = await db.makeQuery(`SELECT next_daily FROM players WHERE userid = $1`, [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }

        if (result.rows[0].next_daily !== null && result.rows[0].next_daily >= new Date()) {
            msg.reply("You already collected for today.");
            return;
        }


        rewards.giveCoins(msg.author.id, 100, msg.channel, module.exports);

        let time = new Date();
        time.setUTCHours(time.getUTCHours()+24);
        db.makeQuery(`UPDATE players SET title = $2, imageURL = $3, next_daily = $4 WHERE userid = $1`, 
        [msg.author.id, msg.member.displayName, msg.author.avatarURL(), time]);
    }, 
    permission: (msg) => true
};

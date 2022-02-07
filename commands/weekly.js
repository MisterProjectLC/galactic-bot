const db = require('../external/database.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');
const {isValid} = require('../systems/autoDeleter');
const {timeFormatter} = require('../utils/timeFormatter');

// Exports
module.exports = {
    name: "weekly",
    category: "Rewards",
    description: "Reclaim your weekly reward.", 
    min: 0, max: 0, cooldown: 0, cooldownMessage: "You already collected for this week.",
    execute: async (com_args, msg) => {
        let result = await db.makeQuery(`SELECT next_weekly FROM players WHERE userid = $1`, [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            return;
        }

        if (result.rows[0].next_weekly !== null && result.rows[0].next_weekly >= new Date()) {
            let timeLeft = ((result.rows[0].next_weekly - new Date())/ 1000).toFixed(1);
            msg.reply(`You already collected for this week. Collect again in ${timeFormatter(timeLeft)}`);
            return;
        }


        rewards.giveCoins(msg.author.id, 500, msg.channel, module.exports);

        let time = new Date();
        time.setUTCHours(time.getUTCHours()+ (24*7));
        db.makeQuery(`UPDATE players SET title = $2, imageURL = $3, next_weekly = $4 WHERE userid = $1`, 
        [msg.author.id, msg.member.displayName, msg.author.avatarURL(), time]);
    }, 
    permission:  async (msg) => await isValid(msg, module.exports.name)
};

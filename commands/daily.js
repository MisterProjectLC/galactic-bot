const db = require('../external/database.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');
const cooldownControl = require('../utils/cooldownControl');
const {isValid} = require('../systems/autoDeleter');
const {timeFormatter} = require('../utils/timeFormatter');

// Exports
module.exports = {
    name: "daily",
    category: "Rewards",
    description: "Reclaim your daily reward.", 
    min: 0, max: 0, cooldown: 0, cooldownMessage: "You already collected for today.",
    execute: async (com_args, msg) => {
        let result = await db.makeQuery(`SELECT next_daily FROM players WHERE userid = $1`, [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            return;
        }

        if (result.rows[0].next_daily !== null && result.rows[0].next_daily >= new Date()) {
            let timeLeft = ((result.rows[0].next_daily - new Date())/ 1000).toFixed(1);
            msg.reply(`You already collected for today. Collect again in ${timeFormatter(timeLeft)}`);
            return;
        }


        rewards.giveCoins(msg.author.id, 100, msg.channel, module.exports);

        let time = new Date();
        time.setUTCHours(time.getUTCHours()+24);
        db.makeQuery(`UPDATE players SET title = $2, imageURL = $3, next_daily = $4 WHERE userid = $1`, 
        [msg.author.id, msg.member.displayName, msg.author.avatarURL(), time]);
    }, 
    permission:  async (msg) => await isValid(msg, module.exports.name)
};

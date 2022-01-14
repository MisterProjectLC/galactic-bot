const db = require('../external/database.js');
const rewards = require('../systems/rewards');

// Exports
module.exports = {
    name: "daily",
    category: "Rewards",
    description: "Reclaim your daily reward.", 
    min: 0, max: 0, cooldown: 86400, cooldownMessage: "You already collected for today.",
    execute: async (com_args, msg) => {
        rewards.giveCoins(msg.author.id, 100, msg.channel, module.exports);
        db.makeQuery(`UPDATE players SET title = $2, imageURL = $3 WHERE userid = $1`, 
        [msg.author.id, msg.member.displayName, msg.author.avatarURL()]);
    }, 
    permission: (msg) => true
};

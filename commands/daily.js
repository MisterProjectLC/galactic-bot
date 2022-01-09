const rewards = require('../systems/rewards');

// Exports
module.exports = {
    name: "daily",
    category: "Rewards",
    description: "Reclaim your daily reward.", 
    min: 0, max: 0, cooldown: 86400, cooldownMessage: "You already collected for today.",
    execute: async (com_args, msg) => {
        rewards.giveCoins(msg.author.id, 100, msg, module.exports);
    }, 
    permission: (msg) => true
};

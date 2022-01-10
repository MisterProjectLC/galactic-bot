const rewards = require('../systems/rewards');

// Exports
module.exports = {
    name: "weekly",
    category: "Rewards",
    description: "Reclaim your weekly reward.", 
    min: 0, max: 0, cooldown: 604800, cooldownMessage: "You already collected for this week.",
    execute: async (com_args, msg) => {
        rewards.giveCoins(msg.author.id, 500, msg, module.exports);
    }, 
    permission: (msg) => true
};

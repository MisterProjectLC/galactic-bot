const rewards = require('../systems/rewards');

// Exports
module.exports = {
    name: "weekly",
    category: "Rewards",
    description: "Reclaim your weekly reward.", 
    min: 0, max: 0, cooldown: 604800,
    execute: async (com_args, msg) => {
        rewards.giveCoins(msg.author.id, 500, msg);
    }, 
    permission: (msg) => true
};

const rewards = require('../systems/rewards');

// Exports
module.exports = {
    name: "check",
    category: "General",
    description: "Check your stats, items and character.", 
    min: 0, max: 0, cooldown: 5,
    execute: async (com_args, msg) => {
        rewards.giveCoins(msg.author.id, 100, msg);
    }, 
    permission: (msg) => true
};

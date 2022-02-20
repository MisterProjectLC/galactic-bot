const {giftBox} = require('./spacebox');

// Exports
module.exports = {
    name: "coinbox",
    category: "Rewards",
    description: "Admin only. Gifts a box of coins to a player.",
    examples: ["#coinbox @User: gift a box of coins to the mentioned user.", 
    "#coinbox @User 3: gift 3 boxes of coins to the mentioned user."],
    min: 1, max: 2, cooldown: 0,
    execute: async (com_args, msg, quoted_list, Client) => {
        giftBox(com_args, msg, Client, 'Coinbox', `Contents:\nAssorted coins`);
    },

    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

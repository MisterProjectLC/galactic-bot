const shop = require('./shop');

// Exports
module.exports = {
    name: "buy",
    category: "Shop",
    description: "Check the shop or buy/upgrade equipment.", 
    examples: ["#buy 10: buy/upgrade the 10th equipment in the shop.",
    "#buy 5 3: buy 3 levels of the 3th equipment in the shop."],
    min: 0, max: 1, cooldown: 2,
    execute: async (com_args, msg) => {
        if (com_args.length > 0) {
            shop.buyFromShop(com_args, msg);
        }
    },
    reaction: async (reaction, user) => {
        shop.reaction(reaction, user);
    },
    permission: (msg) => true
};

const shop = require('./shop');
const {isValid} = require('../systems/autoDeleter');

// Exports
module.exports = {
    name: "buy",
    nicknames: ["purchase"],
    category: "Shop",
    description: "Buy/upgrade equipment.", 
    examples: ["#buy 10: buy/upgrade the 10th equipment in the shop.",
    "#buy 5 3: buy 3 levels of the 5th equipment in the shop."],
    min: 1, max: 2, cooldown: 2,
    execute: async (com_args, msg) => {
        shop.buyFromShop(com_args, msg);
    },
    reaction: async (reaction, user) => {
        shop.reaction(reaction, user);
    },
    permission:  async (msg) => true
};

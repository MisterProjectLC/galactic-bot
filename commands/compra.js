const shop = require('./shop');
const {isValid} = require('../systems/autoDeleter');

// Exports
module.exports = {
    name: "compra",
    nicknames: ["comprar"],
    category: "Loja",
    description: "Compra/aprimora equipamento.", 
    examples: ["#compra 10: compra/aprimora o décimo equipamento da loja.",
    "#compra 5 3: compra 3 níveis do quinto equipamento da loja."],
    min: 1, max: 2, cooldown: 2,
    execute: async (com_args, msg) => {
        shop.buyFromShop(com_args, msg);
    },
    reaction: async (reaction, user) => {
        shop.reaction(reaction, user);
    },
    permission:  async (msg) => true
};

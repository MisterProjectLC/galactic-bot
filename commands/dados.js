const { parse } = require("ws/lib/extension");
const errors = require('../data/errors');

const re = /(\d+)d(\d+)/;
const re_d = /\d+/;

const rollDice = (dice, sides) => {
    let total = 0;

    if (dice < 0 || sides < 0) {
        return "Desculpa, mas não sei ainda como rolar dados negativos...";
    }

    if (dice <= 0 || sides <= 0) {
        return "Desculpa, mas não sei ainda como rolar dados nulos...";
    }

    if (sides == 1) {
        return "Um lado?? V-Você tem certeza que sabe como um dado funciona?";
    }

    if (dice > 50) {
        return "Nossa, é muito dado! Pode tentar rolar menos..?";
    }

    let text = `Rolando ${dice} ${dice > 1 ? 'dados' : 'dado'} de ${sides} lados!\n`;

    for (let i = 0; i < dice; i++) {
        let resultado = 1 + Math.floor(Math.random() * sides);
        total += resultado;
        text += `Dado ${i+1}: ${resultado}\n`;
    }

    text += `Total: ${total}\n`;
    return "```\n" + text + "```";
};

// Exports
module.exports = {
    name: "dados",
    verb: "rolar", 
    category: "Geral",
    description: "Rola dados, duh :P", 
    examples: ["abra, dados 3d6: rola 3 dados de 6 lados", "abra, role 2 4: rola 2 dados de 4 lados", 
    "abra, dados 6: rola 1 dado de 6 lados"],
    min: 1, max: 2,
    execute: async (com_args, msg) => {
        let regex_found = null;
        let dice = null;

        for (let i = 0; i < com_args.length; i++) {
            // Testar XdY
            regex_found = com_args[i].match(re);
            if (regex_found != null)
                return msg.reply( rollDice(parseInt(regex_found[1]), parseInt(regex_found[2])) );

            // Testar X Y
            regex_found = com_args[i].match(re_d);
            if (regex_found != null)
                if (dice === null)
                    dice = parseInt(com_args[i]);
                else
                    return msg.reply( rollDice(dice, parseInt(com_args[i])) );
        }

        // Testar X
        if (dice !== null)
            return msg.reply( rollDice(1, dice) );

        msg.reply(errors.args_invalidos);
    }, 
    permission: (msg) => true
};

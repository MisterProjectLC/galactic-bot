const axios = require('axios');
const db = require('../external/database.js');
const time_adder = require('../utils/time_adder');
const errors = require('../data/errors');

// Exports
module.exports = {
    name: "lembretes", 
    verb: "listar",
    verb_complement: "lembretes",
    category: "Lembretes",
    description: "Lista lembretes marcados e ativos.", 
    examples: [`abra, liste os lembretes: lista lembretes`, `abra, lembretes: lista lembretes`],
    min: 0, max: 0,
    execute: async (com_args, msg) => {
        msg.reply("Buscando lembretes...").then(async m => {
            await db.makeQuery("SELECT * FROM lembretes ORDER BY tempo").then(response => {
                let reply = "Lembretes atuais:";
                if (response.rows.length > 0)
                    response.rows.forEach(element => {
                        let date = element.tempo;
                        reply += `\n${element.nome} - ${((date.getUTCHours()+21) % 24).toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}, na data ` + 
                        `${date.getDate().toString().padStart(2, '0')}/${(1+date.getMonth()).toString().padStart(2, '0')}/${date.getFullYear().toString()}.`;
                    });
                else
                    reply += "\nNenhum.";
                m.edit("```" + reply + "```");
            });
        });
    },
    permission: (msg) => true
};

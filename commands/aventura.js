const db = require('../external/database.js');
const errors = require('../data/errors');
const encounter = require('../systems/enemyEncounter');
const cooldownControl = require('../utils/cooldownControl');
const compareTwoStrings = require('string-similarity').compareTwoStrings;
const constants = require('../data/constants');
const {getTimeLeft} = require('../systems/periodicFunctions');
const {timeFormatter} = require('../utils/timeFormatter');

// Exports
module.exports = {
    name: "aventura", 
    nicknames: ["avt"],
    category: "Battle",
    description: "Participa em uma aventura.",
    examples: ["#aventura Aventura no Espaço: Participa na missão 'Aventura no Espaço'."],
    details: ['Veja a lista de aventuras com #aventuras.'],
    min: 0, max: 5, cooldown: 300, cooldownMessage: 'A espaçonave está enchendo o tanque, espere xxx antes de começar outra missão.',
    execute: async (com_args, msg) => {
        let bestMatch = [];
        let bestScore = 0;

        let m = await msg.reply("Carregando...");
        await db.makeQuery(`SELECT * FROM adventures`).then((result) => {
            result.rows.forEach(row => {
                let lowerArg = com_args.join(" ").toLowerCase();
                let lowerTitle = row.title.toLowerCase();
                let lowerFirst = row.title.toLowerCase().split(" ")[0];
                let score = Math.max(compareTwoStrings(lowerArg, lowerTitle), compareTwoStrings(lowerArg, lowerFirst));
                if (score > bestScore) {
                    bestMatch = row;
                    bestScore = score;
                }
            });
        });

        m.delete();
        if (bestScore < 0.72) {
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            msg.reply(errors.helpFormatting(module.exports));
            return;
        }

        let result = await db.makeQuery(`SELECT * FROM players WHERE userid = $1`, [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            return;
        }
        let player = result.rows[0];

        if (player.level < bestMatch.min_level) {
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            msg.reply("Você não tem níveis o suficiente para participar desta aventura...");
            return;
        }

        if (player.adventures_left < 1) {
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            msg.reply(`Você não tem mais cargas de aventura! Espere ${timeFormatter(await getTimeLeft("adventures"))} antes de ir em uma aventura.`);
            return;
        } else {
            msg.reply(`Adventuras sobrando: ${player.adventures_left-1}/${constants.adventuresMax}. Próxima regeneração em ${timeFormatter(await getTimeLeft("adventures"))}.`);
            db.makeQuery(`UPDATE players SET adventures_left = adventures_left - 1 WHERE userid = $1`, [msg.author.id]);
        }

        result = await db.makeQuery(`SELECT * FROM eEnemies JOIN enemiesAdventures ON eEnemies.id = enemiesAdventures.enemy_id 
        WHERE enemiesAdventures.adventure_id = $1`, [bestMatch.id]);

        encounter.generateEnemyEncounter(bestMatch.title, msg, module.exports, [msg.author.id], result.rows, true, 3);
    },

    reaction: async (reaction, user, added) => {
        encounter.onReaction(reaction, user, added, module.exports);
    },

    interaction: (interaction) => {
        encounter.onInteraction(interaction, module.exports);
    },

    permission:  async (msg) => true
};

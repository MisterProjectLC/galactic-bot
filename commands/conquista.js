const db = require('../external/database.js');
const errors = require('../data/errors');
const encounter = require('../systems/enemyEncounter');
const cooldownControl = require('../utils/cooldownControl');
const compareTwoStrings = require('string-similarity').compareTwoStrings;
const saved_messages = require('../utils/saved_messages');
const party = require('./party');
const constants = require('../data/constants');
const {getTimeLeft} = require('../systems/periodicFunctions');
const {asyncForEach} = require('../utils/asyncForEach');
const {timeFormatter} = require('../utils/timeFormatter');

// Exports
module.exports = {
    name: "conquista", 
    nickname: ["conq"],
    category: "Batalha",
    description: "Participa em uma conquista - uma aventura contra um chefão. Requer uma #equipe.",
    examples: ["#conquista Andor: Participa na missão 'Andor'."],
    details: ['Veja a lista de conquistas com #conquistas.'],
    min: 0, max: 5, cooldown: 30, cooldownMessage: 'A espaçonave está enchendo o tanque, espere xxx antes de começar outra missão.',
    execute: async (com_args, msg) => {
        let bestMatch = {};
        let bestScore = 0;

        let partyMsg = party.findPartyMessage(msg.author.id);
        if (partyMsg === null) {
            msg.reply("Você não está liderando uma equipe!");
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            return;
        }
        let partyMembers = saved_messages.get_message('party', partyMsg.id).members;


        let m = await msg.reply("Carregando...");
        await db.makeQuery(`SELECT * FROM conquests`).then((result) => {
            result.rows.forEach(row => {
                let lower_arg = com_args.join(" ").toLowerCase();
                let lower_title = row.title.toLowerCase();
                let score = compareTwoStrings(lower_arg, lower_title);
                if (score > bestScore) {
                    bestMatch = row;
                    bestScore = score;
                }
            });            
        });

        m.delete();
        if (bestScore < 0.5) {
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            msg.reply(errors.helpFormatting(module.exports));
            return;
        }

        if (partyMembers.length < bestMatch.min_size) {
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            msg.reply("Sua equipe não tem jogadores suficientes para esta conquista...");
            return;
        }

        let result = await db.makeQuery(`SELECT * FROM players WHERE userid = ANY($1)`, [partyMembers]);
        if (result.rowCount < partyMembers.length) {
            msg.reply(errors.unregisteredPlayer);
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            return;
        }

        let players = result.rows;

        for (let i = 0; i < result.rowCount; i++) {
            if (result.rows[i].userid != msg.author.id)
                continue;

            if (result.rows[i].level < bestMatch.min_level) {
                cooldownControl.resetCooldown(module.exports, msg.author.id);
                msg.reply(`Você não possui níveis suficientes para liderar esta conquista...`);
                return;
            }
        }

        let endit = false;
        await asyncForEach(players, async player => {
            if (player.bosses_left < 1) {
                msg.channel.send(`${player.title} não possui cargas de conquistas! Espere ${timeFormatter(await getTimeLeft("bosses"))} antes de ir em outra conquista.`);
                if (endit)
                    return;

                cooldownControl.resetCooldown(module.exports, msg.author.id);
                endit = true;
            }
        });

        if (endit)
            return;

        await asyncForEach(players, async player => {
            msg.channel.send(`<@${player.userid}>, Conquistas sobrando: ${player.bosses_left-1}/${constants.bossesMax}. Próxima regeneração em ${timeFormatter(await getTimeLeft("bosses"))}.`);
            db.makeQuery(`UPDATE players SET bosses_left = bosses_left - 1 WHERE userid = $1`, [player.userid]);
        });

        result = await db.makeQuery(`SELECT * FROM eEnemies JOIN enemiesConquests ON eEnemies.id = enemiesConquests.enemy_id 
        WHERE enemiesConquests.conquest_id = $1`, [bestMatch.id]);

        encounter.generateEnemyEncounter(bestMatch.title, msg, module.exports, partyMembers, result.rows, true);
    },

    reaction: async (reaction, user, added) => {
        encounter.onReaction(reaction, user, added, module.exports);
    },
    interaction: (interaction) => {
        encounter.onInteraction(interaction, module.exports);
    },

    permission:  async (msg) => true
};

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
    name: "conquest", 
    nickname: ["adv"],
    category: "Battle",
    description: "Take part in a conquest - basically a harder and more intensive adventure. Requires a #party.",
    examples: ["#conquest Andor: Take part in the 'Andor' mission."],
    details: ['Check the list of conquests with #conquests.'],
    min: 0, max: 5, cooldown: 300, cooldownMessage: 'The spacecraft is loading fuel, wait xxx before starting the mission again.',
    execute: async (com_args, msg) => {
        let bestMatch = {};
        let bestScore = 0;

        let partyMsg = party.findPartyMessage(msg.author.id);
        if (partyMsg === null) {
            msg.reply("You aren't hosting a party!");
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            return;
        }
        let partyMembers = saved_messages.get_message('party', partyMsg.id).members;


        let m = await msg.reply("Loading...");
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
            msg.reply("Your party doesn't have enough players for this conquest...");
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
                msg.reply(`You don't have enough levels to host this conquest...`);
                return;
            }
        }

        let endit = false;
        await asyncForEach(players, async player => {
            if (player.bosses_left < 1) {
                msg.channel.send(`${player.title} is out of conquests right now! Wait ${timeFormatter(await getTimeLeft("bosses"))} before going on a conquest again.`);
                if (endit)
                    return;

                cooldownControl.resetCooldown(module.exports, msg.author.id);
                endit = true;
            }
        });

        if (endit)
            return;

        await asyncForEach(players, async player => {
            msg.channel.send(`<@${player.userid}>, Conquests left: ${player.bosses_left-1}/${constants.bossesMax}. Next regeneration in ${timeFormatter(await getTimeLeft("bosses"))}.`);
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

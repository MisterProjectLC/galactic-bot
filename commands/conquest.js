const db = require('../external/database.js');
const errors = require('../data/errors');
const encounter = require('../systems/encounter');
const cooldownControl = require('../utils/cooldownControl');
const compareTwoStrings = require('string-similarity').compareTwoStrings;

// Exports
module.exports = {
    name: "conquest", 
    nickname: ["adv"],
    category: "Battle",
    description: "Take part in a conquest - basically a harder and more intensive adventure. Requires a #party.",
    examples: ["#conquest Space Adventure: Take part in the 'Andor' mission."],
    min: 0, max: 5, cooldown: 300, cooldownMessage: 'The spacecraft is loading fuel, wait xxx before starting the mission again.',
    execute: async (com_args, msg) => {
        let bestMatch = [];
        let bestScore = 0;

        let m = await msg.reply("Loading...");
        await db.makeQuery(`SELECT * FROM adventures`).then((result) => {
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
            msg.reply(errors.invalidArgs);
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
            msg.reply("You don't have enough levels to participate in this adventure...");
            return;
        }

        result = await db.makeQuery(`SELECT * FROM eEnemies JOIN enemiesAdventures ON eEnemies.id = enemiesAdventures.enemy_id 
        WHERE enemiesAdventures.adventure_id = $1`, [bestMatch.id]);

        encounter.generateEncounter(bestMatch.title, msg, result.rows, module.exports);
    },

    reaction: async (reaction, user) => {
        encounter.onReaction(reaction, user);
    },

    permission: (msg) => true
};

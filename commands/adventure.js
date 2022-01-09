const db = require('../external/database.js');
const errors = require('../data/errors');
const encounter = require('../systems/encounter');
const cooldownControl = require('../utils/cooldownControl');
const compareTwoStrings = require('string-similarity').compareTwoStrings;

// Exports
module.exports = {
    name: "adventure", 
    nickname: ["adv"],
    category: "Battle",
    description: "Take part in an adventure.",
    examples: ["#adventure Space Adventure: Take part in the 'Space Adventure' mission."],
    min: 0, max: 5, cooldown: 300, cooldownMessage: 'The spacecraft is loading fuel, wait xxx before starting the mission again.',
    execute: async (com_args, msg) => {
        let best_match = [];
        let best_score = 0;

        let m = await msg.reply("Loading...");
        await db.makeQuery(`SELECT * FROM adventures`).then((result) => {
            result.rows.forEach(row => {
                let lower_arg = com_args.join(" ").toLowerCase();
                let lower_title = row.title.toLowerCase();
                let score = compareTwoStrings(lower_arg, lower_title);
                if (score > best_score) {
                    best_match = row;
                    best_score = score;
                }
            });            
        });

        m.delete();
        if (best_score < 0.5) {
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
        if (player.level < best_match.min_level) {
            cooldownControl.resetCooldown(module.exports, msg.author.id);
            msg.reply("You don't have enough levels to participate in this adventure...");
            return;
        }

        result = await db.makeQuery(`SELECT * FROM eEnemies JOIN enemiesAdventures ON eEnemies.id = enemiesAdventures.enemy_id 
        WHERE enemiesAdventures.adventure_id = $1`, [best_match.id]);

        encounter.generateEncounter(best_match.title, msg, result.rows, module.exports);
    },

    reaction: async (reaction, user) => {
        encounter.onReaction(reaction, user);
    },

    permission: (msg) => true
};

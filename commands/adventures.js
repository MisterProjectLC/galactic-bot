const db = require('../external/database.js');
const Discord = require('discord.js');
const asyncForEach = require('../utils/asyncForEach').asyncForEach;

// Exports
module.exports = {
    name: "adventures", 
    nicknames: ["advs"],
    category: "Battle",
    description: "Check all available adventures.", 
    min: 0, max: 0, cooldown: 5,
    execute: async (com_args, msg) => {
        // Check all adventures
        await db.makeQuery(`SELECT * FROM adventures`).then(async (result) => {
            let embed = new Discord.MessageEmbed()
            .setColor(0x1d51cc)
            .setTitle("Adventures");

            await asyncForEach(result.rows, async (row) => {
                let minXP = 0, maxXP = 0, minCoins = 0, maxCoins = 0;
                await db.makeQuery(`SELECT MIN(given_xp) as minXP, MAX(given_xp) as maxXP, MIN(given_coins) as minCoins, MAX(given_coins) as maxCoins 
                FROM enemies INNER JOIN enemiesAdventures ON (enemies.id = enemiesAdventures.enemy_id)
                GROUP BY adventure_id HAVING (adventure_id = $1)`, [row.id]).then((xp_result) => {
                    if (xp_result.rowCount > 0) {
                        minXP = xp_result.rows[0].minxp;
                        maxXP = xp_result.rows[0].maxxp;
                        minCoins = xp_result.rows[0].mincoins;
                        maxCoins = xp_result.rows[0].maxcoins;
                        embed = embed.addField(`**${row.title}**`, `XP: ${minXP} per enemy\nCoins: ${minCoins} per enemy\nMinimum Level: ${row.min_level}`, true);
                    }
                });
            });

            msg.reply({embeds: [embed]});
        });
    }, 
    permission: (msg) => true
};

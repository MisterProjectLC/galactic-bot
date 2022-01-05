const db = require('../external/database.js');
const battle = require('../systems/battle');
const Discord = require('discord.js');

// Exports
module.exports = {
    name: "adventure", 
    nickname: ["adv"],
    category: "General",
    description: "Check all available adventures or take part in one of them.", 
    min: 0, max: 1, cooldown: 1200,
    execute: async (com_args, msg, quoted_list, client) => {
        // Check all adventures
        if (com_args.length == 0) {
            await db.makeQuery(`SELECT id, title FROM adventures`).then((result) => {
                let embed = new Discord.MessageEmbed()
                .setColor(0x1d51cc)
                .setAuthor(msg.member.displayName)
                .setTitle("Adventures");

                let list = "";
                result.rows.forEach(async (row) => {
                    let minXP = 0, maxXP = 0, minCoins = 0, maxCoins = 0;
                    await db.makeQuery(`SELECT MIN(given_xp) as minXP, MAX(given_xp) as maxXP, MIN(given_coins) as minCoins, MAX(given_coins) as maxCoins 
                    FROM enemies INNER JOIN enemiesAdventures ON (enemies.id = enemiesAdventures.enemy_id)
                    GROUP BY adventure_id HAVING (adventure_id = $1)`, [row.id]).then((xp_result) => {
                        if (xp_result.rowCount > 0) {
                            minXP = xp_result.rows[0].minXP;
                            maxXP = xp_result.rows[0].maxXP;
                            minCoins = xp_result.rows[0].minCoins;
                            maxCoins = xp_result.rows[0].maxCoins;
                        }
                    });
                    if (maxXP == 0)
                        return;

                    embed = embed.addField(row.title, `XP: ${minXP}-${maxXP}\nCoins: ${minCoins}-${maxCoins}`, true);
                });
                msg.edit(embed);
            });
        }




    }, 
    permission: (msg) => true
};

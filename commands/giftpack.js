const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');
const saved_messages = require('../utils/saved_messages');
const {deleteMessage} = require('../utils/deleteMessage');

const COUNT_ITEMS = 3;

function getUserIDFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}
	}

    return mention;
}


// Exports
module.exports = {
    name: "giftpack",
    nicknames: ["gift"],
    category: "Rewards",
    description: "Admin only. Gifts a pack to a player.",
    examples: ["#gift @User: gift a pack to the mentioned user."],
    min: 1, max: 1, cooldown: 10,
    execute: async (com_args, msg) => {
        let giftedID = getUserIDFromMention(com_args[0]);
        if (giftedID === null) {
            msg.reply("Couldn't find the mentioned player...");
            return;
        }

        let gifted = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [giftedID]);
        if (gifted.rowCount < 1) {
            msg.reply("Couldn't find the mentioned player...");
            return;
        }
        gifted = gifted.rows[0];
        let coins = (Math.floor(gifted.level/10)+1)*50;

        // Embed
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`${gifted.title}, you received a pack!`)
        .setDescription(`Contents:\n4-8 Levels of 3 random Items\n${coins} coins`)
        .setFooter("Press 🎁 to open");

        // Create summary message
        let m = await msg.channel.send(embed);
        m.react('🎁');

        saved_messages.add_message('packOpen', m.id, {giftedID: giftedID, coins: coins, gifted:gifted});
    },
    reaction: async (reaction, user, added) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        let pkg = saved_messages.get_message('packOpen', msg.id);
        if (!(pkg && (emoji === '🎁') && user.id === pkg.giftedID))
            return;

        deleteMessage(msg, 'packOpen');
            
        let itemLevel = Math.max(1, 10+ Math.floor((pkg.gifted.level- 10)/20)*20);
        console.log(itemLevel);
        let weapons = db.makeQuery(`SELECT * FROM weapons WHERE min_level = $1 AND enemy_weapon = false`, [itemLevel]); 
        let armors = db.makeQuery(`SELECT * FROM armors WHERE min_level = $1`, [itemLevel]);
        weapons = (await weapons).rows;
        armors = (await armors).rows;

        let text = "";
        for (let i = 0; i < COUNT_ITEMS; i++) {
            let rand = Math.floor(Math.random()*(weapons.length+armors.length));

            let amount = 4+Math.floor(Math.random()*4);
            let title = rand < weapons.length ? weapons[rand].title : armors[rand-weapons.length].title;
            if (rand < weapons.length) {
                weapons.splice(rand, 1);
                db.makeQuery(`SELECT buy_weapon($1, $2, $3)`, [user.id, title, amount]);
            } else {
                armors.splice(rand-weapons.length, 1);
                db.makeQuery(`SELECT buy_armor($1, $2, $3)`, [user.id, title, amount]);
            }

            text += `You received **${amount} Levels** of **${title}**!\n`;
        }

        msg.channel.send(`<@${pkg.giftedID}>, ${text}`);
        rewards.giveCoins(user.id, pkg.coins, msg.channel, module.exports);
    },
    permission: (msg) => msg.member.roles.cache.some(role => role.name == "Founder")
};

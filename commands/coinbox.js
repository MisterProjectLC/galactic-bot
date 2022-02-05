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
    name: "coinbox",
    nicknames: ["gift"],
    category: "Rewards",
    description: "Admin only. Gifts a pack of coins to a player.",
    examples: ["#coinbox @User: gift a pack of coins to the mentioned user."],
    min: 1, max: 1, cooldown: 0,
    execute: async (com_args, msg) => {
        let giftedID = getUserIDFromMention(com_args[0]);
        if (giftedID === null) {
            msg.reply("Couldn't find the mentioned player...");
            msg.reply(errors.helpFormatting(module.exports));
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
        .setDescription(`Contents:\n${coins} coins`)
        .setFooter("Press 🎁 to open");

        // Create summary message
        let m = await msg.channel.send({embeds: [embed]});
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
        rewards.giveCoins(user.id, pkg.coins, msg.channel, module.exports);
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

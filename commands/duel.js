const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const encounter = require('../systems/duelEncounter');
const saved_messages = require('../utils/saved_messages');
const {deleteMessage} = require('../utils/deleteMessage');

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
    name: "duel",
    category: "Battle",
    description: "Challenge another player to a duel.",
    examples: ["#duel @User: challenge the mentioned user to a duel.",
    "#duel @User 50: challenge the mentioned user to a duel with a bet of 50 coins."],
    min: 1, max: 2, cooldown: 10,
    execute: async (com_args, msg) => {
        let challengedID = getUserIDFromMention(com_args[0]);
        if (challengedID === null) {
            msg.reply("Couldn't find the challenged player...");
            return;
        }
        
        let bet = 0;
        if (com_args.length >= 2) {
            let parsed = parseInt(com_args[1]);
            if (parsed !== NaN && parsed > 0)
                bet = parsed;
        }

        let challenger = await db.makeQuery(`SELECT title, coins, userid FROM players WHERE $1 ILIKE userID`, [msg.author.id]);
        if (challenger.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }

        if (challenger.rows[0].coins < bet) {
            msg.reply("You don't have enough coins for this bet...");
            return;
        }

        let challenged = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [challengedID]);
        if (challenged.rowCount < 1) {
            msg.reply("Couldn't find the challenged player...");
            return;
        }

        if (challenged.rows[0].coins < bet) {
            msg.reply("The challenged player doesn't have enough coins for this bet...");
            return;
        }

        // Embed
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle("Duel Proposal - " + challenger.rows[0].title + " VS " + challenged.rows[0].title)
        .setDescription(`${challenged.rows[0].title}, do you accept this duel?`)
        .addField('Bet', `${bet} coins`, true)
        .setFooter("Press ✅ to accept\nPress ❌ to deny");

        // Create summary message
        let m = await msg.channel.send(embed);
        m.react('✅');
        m.react('❌');

        saved_messages.add_message('duelConfirmation', m.id, {msg: msg, confirmMsg: m, challengerID: msg.author.id, challengedID: challengedID, bet: bet});
    },
    reaction: async (reaction, user, added) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        let pkg = saved_messages.get_message('duelConfirmation', msg.id);
        if (pkg && (emoji === '✅' || emoji === '❌') && user.id === pkg.challengedID && msg.id === pkg.confirmMsg.id) {
            deleteMessage(msg, 'duelConfirmation');
            if (emoji === '✅') {
                db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE $1 ILIKE userID`, [pkg.challengerID, pkg.bet]);
                db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE $1 ILIKE userID`, [pkg.challengedID, pkg.bet]);
                await encounter.generateDuelEncounter(pkg.msg, module.exports, [pkg.challengerID], [pkg.challengedID], pkg.bet);
            }
            return;
        }

        encounter.onReaction(reaction, user, added);
    },
    permission: (msg) => true
};

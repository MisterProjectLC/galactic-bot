const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');
const saved_messages = require('../utils/saved_messages');
const {deleteMessage} = require('../utils/deleteMessage');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');
const {fetchMembers} = require('../utils/fetchMembers');
const {insertBox} = require('./openbox');

const COUNT_ITEMS = 3;


// Exports
module.exports = {
    name: "spacebox",
    category: "Rewards",
    description: "Admin only. Gifts a pack of items and coins to a player.",
    examples: ["#spacebox @User: gift a pack of items and coins to the mentioned user."],
    min: 1, max: 1, cooldown: 0,
    execute: async (com_args, msg, quoted_list, Client) => {
        let giftedID = getUserIDFromMention(com_args[0]);
        if (giftedID === null) {
            msg.reply("Couldn't find the mentioned player...");
            msg.reply(errors.helpFormatting(module.exports));
            return;
        }

        let memberList = await fetchMembers(Client);

        let gifted = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [giftedID]);
        if (gifted.rowCount < 1) {
            msg.reply("Couldn't find the mentioned player...");
            return;
        }
        gifted = gifted.rows[0];
        let coins = (Math.floor(gifted.level/10)+1)*50;

        let member = memberList.find(member => {return member.user.id == giftedID});

        // Embed
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`${gifted.title}, you received a pack!`)
        .setDescription(`Contents:\n4-8 Levels of 3 random Items\n${coins} coins`);

        // Create summary message
        await member.send({embeds: [embed]}).catch(err => console.log(err));
        insertBox('Spacebox', giftedID, msg);
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

        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`Contents`);

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

            embed.addField(`${title}`, `${amount} Levels`, true);
        }

        msg.channel.send({embeds: [embed]});
        rewards.giveCoins(user.id, pkg.coins, msg.channel, module.exports);
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

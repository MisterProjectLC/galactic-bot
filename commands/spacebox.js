const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');
const {fetchMembers} = require('../utils/fetchMembers');
const {insertBox} = require('./openbox');

const COUNT_ITEMS = 3;


// Exports
module.exports = {
    name: "spacebox",
    category: "Rewards",
    description: "Admin only. Gifts a box of items and coins to a player.",
    examples: ["#spacebox @User: gift a box of items and coins to the mentioned user."],
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
        .setTitle(`${gifted.title}, you received a box!`)
        .setDescription(`Contents:\n4-8 Levels of 3 random Items\nAssorted coins`);

        // Create summary message
        msg.reply("Box gifted.");
        await member.send({embeds: [embed]}).catch(err => console.log(err));
        insertBox('Spacebox', giftedID, msg);
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

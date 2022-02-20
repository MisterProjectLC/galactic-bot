const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');
const {fetchMembers} = require('../utils/fetchMembers');
const {insertBox} = require('./openbox');


var giftBox = async (com_args, msg, Client, boxName, boxDescription) => {
    let m = await msg.reply('Loading...');

    let giftedID = getUserIDFromMention(com_args[0]);
    if (giftedID === null) {
        msg.reply("Couldn't find the mentioned player...");
        msg.reply(errors.helpFormatting(module.exports));
        return;
    }

    let amount = 1;
    if (com_args.length > 1) {
        let parsed = parseInt(com_args[1]);
        if (parsed === parsed && parsed > 0)
            amount = parsed;
        else {
            msg.reply(errors.invalidArgs);
            return;
        }
    }

    let memberList = await fetchMembers(Client);

    let gifted = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [giftedID]);
    if (gifted.rowCount < 1) {
        msg.reply("Couldn't find the mentioned player...");
        return;
    }
    gifted = gifted.rows[0];

    let member = memberList.find(member => {return member.user.id == giftedID});

    // Embed
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`${gifted.title}, you received ` + (amount > 1 ? `${amount} boxes!` : 'a box!'))
    .setDescription(boxDescription)
    .setFooter("To open your boxes, go to the #SpaceBoxes channel and type #openbox");

    // Create summary message
    m.edit(amount > 1 ? "Boxes gifted." : "Box gifted.").catch(err => console.log(err));
    await member.send({embeds: [embed]}).catch(err => console.log(err));
    insertBox(boxName, giftedID, msg, amount);
}


// Exports
module.exports = {
    name: "spacebox",
    category: "Rewards",
    description: "Admin only. Gifts a box of items and coins to a player.",
    examples: ["#spacebox @User: gift a box of items and coins to the mentioned user.", 
    "#spacebox @User 3: gift 3 boxes of items and coins to the mentioned user."],
    min: 1, max: 2, cooldown: 0,
    execute: async (com_args, msg, quoted_list, Client) => {
        giftBox(com_args, msg, Client, 'Spacebox', `Contents:\n4-8 Levels of 3 random Items\nAssorted coins`);
    },
    giftBox: giftBox,
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

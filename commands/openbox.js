const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards')
const saved_messages = require('../utils/saved_messages');
const {deleteMessage} = require('../utils/deleteMessage');

const emojiNumbers = ['1️⃣','2️⃣','3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const COUNT_ITEMS = 3;

var boxes = {};


var openBox = async (gainItems, pkg, user) => {
    let itemLevel = Math.max(1, 10+ Math.floor((pkg.gifted.level- 10)/20)*20);
    console.log(itemLevel);
    let weapons = db.makeQuery(`SELECT * FROM weapons WHERE min_level = $1 AND enemy_weapon = false`, [itemLevel]); 
    let armors = db.makeQuery(`SELECT * FROM armors WHERE min_level = $1`, [itemLevel]);
    weapons = (await weapons).rows;
    armors = (await armors).rows;

    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`Contents`);

    if (gainItems) {
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
    }
    let coins = (Math.floor(pkg.gifted.level/10)+1)*50;
    embed.addField(`Coins`, `${coins} Coins`, true);

    pkg.msg.channel.send({embeds: [embed]});
    rewards.giveCoins(user.id, coins, pkg.msg.channel, module.exports);
}


var insertBox = (type, receiverID, msg) => {
    if (!boxes.hasOwnProperty(receiverID))
        boxes[receiverID] = [];

    if (boxes[receiverID].length >= 5) {
        if (msg)
            msg.reply("The receiver already has too many boxes!");
        return;
    }

    boxes[receiverID].push(type);
}

var createEmbed = (boxList) => {
    // Embed
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`List of Boxes`);

    let text = '';
    boxList.forEach((element, index) => {
        text += `${index+1}. ${element}\n`;
    });
    embed.addField('Lista', text, false);

    return embed;
}

var createRow = (boxList) => {
    let row = new Discord.MessageActionRow();
    for (let index = 0; index < emojiNumbers.length && index < boxList.length; index++)
        row.addComponents(
            new Discord.MessageButton()
            .setCustomId(index.toString())
            .setLabel(emojiNumbers[index])
            .setStyle('PRIMARY'),
        );

    return row;
}

// Exports
module.exports = {
    name: "openbox",
    category: "Rewards",
    description: "Opens a received box.",
    examples: ["#openbox: shows the list of boxes to open."],
    min: 0, max: 0, cooldown: 0,
    insertBox: insertBox,
    execute: async (com_args, msg) => {
        if (!boxes.hasOwnProperty(msg.author.id) || boxes[msg.author.id].length == 0) {
            msg.reply("You don't have any boxes...");
        }
        let theirBoxes = boxes[msg.author.id];

        let gifted = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [msg.author.id]);
        if (gifted.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }
        gifted = gifted.rows[0];

        let m = await msg.reply({embeds: [createEmbed(theirBoxes)], components: [createRow(theirBoxes)]});

        let pkg = saved_messages.get_message('boxList', msg.author.id);
        if (pkg)
            deleteMessage(pkg.msg, 'boxList');

        saved_messages.add_message('boxList', msg.author.id, {boxList: theirBoxes, msg: m, gifted: gifted});
    },

    interaction: (interaction) => {
        // Package
        if (!interaction || !interaction.member || !interaction.member.user || !interaction.member.user.id)
            return;

        let pkg = saved_messages.get_message('boxList', interaction.member.user.id);
        if (pkg == null)
            return;

        // Activate buttons
        let customId = interaction.customId;
        let objectNumber = parseInt(customId);
        if (pkg.boxList.length <= objectNumber)
            return;

        let selectedBox = pkg.boxList[objectNumber];
        openBox(selectedBox == "Spacebox", pkg, interaction.member.user);
        
        // Update embed
        pkg.boxList.splice(objectNumber, 1);
        if (pkg.boxList.length <= 0)
            pkg.msg.delete().catch(err => console.log(err));
        else
            pkg.msg.edit({embeds: [createEmbed(pkg.boxList)], components: [createRow(pkg.boxList)]}).catch(err => console.log(err));
        interaction.deferUpdate().catch(console.error);
    },

    permission: async (msg) => true
};

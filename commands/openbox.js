const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const saved_messages = require('../utils/saved_messages');
const {deleteMessage} = require('../utils/deleteMessage');

const emojiNumbers = ['1️⃣','2️⃣','3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const COUNT_ITEMS = 3;

var boxes = {};


var openBox = (gainItems, msg) => {
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

    msg.channel.send({embeds: [embed]});
    rewards.giveCoins(user.id, pkg.coins, msg.channel, module.exports);
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
        text += `${index}. ${element}\n`;
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
}

// Exports
module.exports = {
    name: "openbox",
    category: "Rewards",
    description: "Opens a received box.",
    examples: ["#openbox: shows the list of boxes to open."],
    min: 1, max: 1, cooldown: 0,
    insertBox: insertBox,
    execute: async (com_args, msg, quoted_list, Client) => {
        if (!boxes.hasOwnProperty(msg.author.id) || boxes[msg.author.id].length == 0) {
            msg.reply("You don't have any boxes...");
        }
        let theirBoxes = boxes[msg.author.id];

        let m = await msg.reply({embeds: [createEmbed(theirBoxes)], components: [createRow(theirBoxes)]});

        saved_messages.add_message('boxList', msg.author.id, {boxList: theirBoxes, msg: m});

        let pkg = saved_messages.get_message('boxList', interaction.member.user.id);
        if (pkg)
            deleteMessage(pkg.msg, 'boxList');
    },

    interaction: (interaction) => {
        // Package
        let pkg = saved_messages.get_message('boxList', interaction.member.user.id);
        if (pkg == null)
            return;

        // Activate buttons
        let customId = interaction.customId;
        let objectNumber = parseInt(customId);
        if (pkg.boxList.length <= objectNumber)
            return;

        let selectedBox = pkg.boxList[objectNumber];
        openBox(selectedBox == "Spacebox", pkg.msg);
        
        // Update embed
        pkg.msg.edit({embeds: [createEmbed(pkg.boxList)], components: [createRow(pkg.boxList)]});
        interaction.deferUpdate().catch(console.error);
    },

    permission: async (msg) => true
};

const db = require('../external/database.js');

// Exports
module.exports = {
    name: "party",
    category: "Battle",
    description: "Create a party.", 
    min: 0, max: 0, cooldown: 86400,
    execute: async (com_args, msg) => {
        let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`**${title}**`)
    .setDescription(`${description}`)
    .setFooter(`Press 🔼 to join the party.`);

        let m = await msg.channel.send(embed);
        m.react('🔼');
    }, 
    permission: (msg) => true,
    reaction: async (reaction, user) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        

    }
};

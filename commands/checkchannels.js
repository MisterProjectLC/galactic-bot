const db = require('../external/database.js');
const Discord = require('discord.js');

// Exports
module.exports = {
    name: "checkchannels",
    nicknames: ["checkChannels"],
    category: "Control",
    description: "Admin only. Checks the list of permitted channels for the specified command.",
    details: ["The command's name must be the same as its name shown in #help."],
    examples: ["#checkchannels adventure: lists the permitted channels for the command 'adventure'."],
    min: 1, max: 1, cooldown: 0,
    execute: async (com_args, msg) => {
        let result = await db.makeQuery(`SELECT channel_id FROM commandChannels WHERE title = $1 AND guild_id = $2`,
        [com_args[0], msg.guildId]).catch(err => console.log(err));

        if (result.rowCount < 1) {
            msg.reply("This command either doesn't exist or has no channels!");
            return;
        }

        // Embed
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`List for '${com_args[0]}'`);

        let channels = await msg.guild.channels.fetch();

        let text = "";
        result.rows.forEach((row, index) => {
            if (channels.has(row.channel_id))
            text += `${index}. ${channels.get(row.channel_id).name}\n`;
        });
        embed = embed.setDescription(text);

        msg.reply({embeds: [embed]});
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

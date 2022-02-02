const timeFormatter = require('../utils/timeFormatter').timeFormatter;
const Discord = require('discord.js');
const {isValid} = require('../systems/autoDeleter');

helpFormatting = (command) => {
    let embedResponse = new Discord.MessageEmbed()
	.setColor(0x1d51cc)
	.setAuthor("Bot")
	.setTitle(`Command details of '${command.name}'`)
	.addField(`Name:`, `\`\`\`${command.name}\`\`\``, true);
    //.setThumbnail(`https://cdn.discordapp.com/attachments/690872764072067074/905221825078902875/logo_bracajour.png`);

    if (command.nicknames != null)
	    embedResponse = embedResponse.addField(`Nicknames:`, `\`\`\`${command.nicknames.join(", ")}\`\`\``, true);

    if (command.cooldown != null)
        embedResponse = embedResponse.addField(`Cooldown:`, `\`\`\`${timeFormatter(command.cooldown)}\`\`\``, true);

    if (command.description != null)
	    embedResponse = embedResponse.addField(`Description:`, `\`\`\`${command.description}\`\`\``, false);

    if (command.examples != null)
	    embedResponse = embedResponse.addField(`Usage examples:`, `\`\`\`${command.examples.join("\n")}\`\`\``, false);

    if (command.details != null)
	    embedResponse = embedResponse.addField(`Usage details:`, `\`\`\`${command.details.join("\n")}\`\`\``, false);

	return embedResponse;
};

completeList = (command_list) => {
    let lists = {};
    for (let category in command_list) {
        let list = "";
        for (let command in command_list[category])
            list += command_list[category][command] + "\n";
        lists[category] = list;
    }

    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setAuthor("Bot")
	.setTitle(`Command help`)
    .setDescription(`For more details about a specific command, type \`#help <command-name>\`.`);
    //.setThumbnail(`https://cdn.discordapp.com/attachments/690872764072067074/905221825078902875/logo_bracajour.png`);

    for (let category in command_list) {
        embed.addField(`**${category.toUpperCase()}:**`, `${lists[category]}`, false);
    }

    return embed;
}

var name = "help";

// Exports
module.exports = {
    name: name,
    category: "General",
    description: "Provides a list of all available commands or details about a specific command.", 
    examples: ["#help: Provides a list of all available commands.", 
    "#help adventure: provides details about the command named 'adventure'."],
    min: 0, max: 1, cooldown: 1,
    execute: async (com_args, msg) => {
        let commandList = {"General":[]};
        let requested_command = null;
        const { commands } = msg.client;

        commands.forEach((command) => {
            if (!command.permission(msg))
                return;

            if (com_args[0] == command.name && requested_command === null)
                requested_command = command;
            
            if (command.category) {
                if (!Object.keys(commandList).includes(command.category))
                    commandList[command.category] = [];
                commandList[command.category].push("**" + command.name + "**: `" + command.description + "`");
            }
        });

        if (requested_command === null)
            msg.reply({embeds: [completeList(commandList)] });
        else
            msg.reply({embeds: [helpFormatting(requested_command)] });
    }, 
    permission:  async (msg) => await isValid(msg, module.exports.name),
    helpFormatting: helpFormatting
};
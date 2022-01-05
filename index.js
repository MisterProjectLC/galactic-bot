// Discord API
const fs = require('fs');
const Discord = require('discord.js');
const config = require('./data/config');

const Client = new Discord.Client({
    intents: [
        Discord.Intents.GUILDS,
        Discord.Intents.GUILD_MEMBERS,
        Discord.Intents.GUILD_BANS,
        Discord.Intents.GUILD_INTEGRATIONS,
        Discord.Intents.GUILD_INVITES,
        Discord.Intents.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.GUILD_VOICE_STATES,
        Discord.Intents.GUILD_PRESENCES,
        Discord.Intents.GUILD_MESSAGES,
        Discord.Intents.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.DIRECT_MESSAGES,
        Discord.Intents.DIRECT_MESSAGE_REACTIONS
    ],
    partials: [
        'CHANNEL',
    ]
});
const token = config.token;

const db = require('./external/database.js');
const argumentParser = require('./utils/argumentParser.js').argumentParser;
const checkCommand = require('./utils/checkCommand.js').checkCommand;
const checkArgs = require('./utils/checkArgs.js').checkArgs;
const errors = require('./data/errors.js');

// Comandos
const prefixes = config.prefixes;
Client.commands = new Discord.Collection();

const usageCooldowns = new Discord.Collection();

var channels = {};


const periodic_function = async () => {
    setTimeout(periodic_function, 60 * 1000);
};


// Gera os comandos - créditos para Marcus Vinicius Natrielli Garcia
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    Client.commands.set(command.name, command);
    if (command.command)
        log.addToList(command.name, command.command);
}

// Inicialization
Client.on("ready", () => {
	console.log("Bot online");
    db.connectDB();
});


// Mensagens
Client.on("message", msg => {
	if (msg.author === Client.user)
		return;
    
    let prefix = "";
    for (let i = 0; i < prefixes.length; i++)
        if (msg.content.startsWith(prefixes[i])) {
            prefix = prefixes[i];
            break;
        }
    
    if (prefix === "")
        return;

    if (msg.content.length > 2000) {
        msg.reply(errors.longMessage);
        return;
    }

    let [args, quoted_list] = argumentParser(msg.content.substring(prefix.length));
    if (args.length == 0)
        return;

    console.log(args);
    // Command
    const { commands } = msg.client;
    let found = false;
    commands.forEach(async (command) => {
        if (found || !checkCommand(command, args))
            return;
        
        found = true;
        if (!checkArgs(command, args, quoted_list, msg))
            return;

        command.execute(args, msg, quoted_list, Client);
    })

    if (found)
        return;

    msg.reply(errors.unidentifiedCommand);
});


Client.on("messageReactionAdd", (reaction, user) => {
    if (user === Client.user || reaction.message.author != Client.user)
        return;
    
    const { commands } = reaction.message.client;
    commands.forEach(async (command) => {
        if (command.reaction)
            command.reaction(reaction, user);
    });
})

Client.login(token);

setTimeout(periodic_function, 10 * 1000);
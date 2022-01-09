const timeFormatter = require('./timeFormatter').timeFormatter;
const Discord = require('discord.js');
var usageCooldowns = new Discord.Collection();

var checkCooldown = (command, msg) => {
    // Checa cooldown - créditos para Marcus Vinicius Natrielli Garcia
    if (!usageCooldowns.has(command.name))
        usageCooldowns.set(command.name, new Discord.Collection());

    const now = Date.now();
    const timestamps = usageCooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 0) * 1000;
    if (timestamps.has(msg.author.id)) {
        const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            if (command.cooldownMessage)
                try {
                    msg.reply(command.cooldownMessage.format(timeFormatter(timeLeft.toFixed(1))));
                } catch {
                    msg.reply(`Please wait ${timeFormatter(timeLeft.toFixed(1))} before using this command again`);
                }
            else
                msg.reply(`Please wait ${timeFormatter(timeLeft.toFixed(1))} before using this command again`);
            return false;
        }
    }
    console.log(`Set cooldown ${command.name} | ${msg.author.id}`);
    timestamps.set(msg.author.id, now);

    return true;
}


var resetCooldown = (command, authorID) => {
    // Checa cooldown - créditos para Marcus Vinicius Natrielli Garcia
    if (!usageCooldowns.has(command.name))
        return false;

    const timestamps = usageCooldowns.get(command.name);
    if (!timestamps.has(authorID))
        return false;

    return timestamps.delete(authorID);
}

module.exports = {
    usageCooldowns: usageCooldowns,
    checkCooldown: checkCooldown,
    resetCooldown: resetCooldown
}
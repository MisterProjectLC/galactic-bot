const {timeFormatter} = require('./timeFormatter');
const Discord = require('discord.js');
const delay = require('../utils/delay').delay;
var usageCooldowns = new Discord.Collection();

var checkCooldown = async (command, msg) => {
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
            let m;
            if (command.cooldownMessage)
                m = await msg.reply(command.cooldownMessage.replace( 'xxx', timeFormatter(timeLeft.toFixed(1)) ));
            else
                m = await msg.reply(`Please wait ${timeFormatter(timeLeft.toFixed(1))} before using this command again`);

            await delay(1000*5);
            msg.delete().catch(err => console.log(err));
            m.delete().catch(err => console.log(err));
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
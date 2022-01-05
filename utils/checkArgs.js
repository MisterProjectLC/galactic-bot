const errors = require('../data/errors');

const checkArgs = (command, args, msg, usageCooldowns) => {
    // Check args
    if (command.min && !(command.min <= args.length)) {
        msg.reply(errors.invalidArgs);
        return false;
    }

    if (!(command.permission(msg) || (msg.member.roles.cache.some(role => role.name == "Admin")))) {
        msg.reply(errors.invalidPerms);
        return false;
    }

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
            msg.reply(`Please wait ${timeLeft.toFixed(1)} seconds before using this command again`);
            return false;
        }
    }
    
    timestamps.set(msg.author.id, now);

    return true;
}

// Exports
module.exports.checkArgs = checkArgs;

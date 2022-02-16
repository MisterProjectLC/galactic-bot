const errors = require('../data/errors');
const {delay} = require('../utils/delay');
const autoDeleter = require('../systems/autoDeleter');

const checkArgs = async (command, args, msg) => {
    // Check args
    if (command.min && !(command.min < args.length)) {
        let m = await msg.reply(errors.invalidArgs);
        await delay(1000*5);
        if (m)
            m.delete().catch(err => console.log(err));
        return false;
    }

    /*if (!(await autoDeleter.isValid(msg, command.name))) {
        let channels = await msg.guild.channels.fetch();
        let channelName = channels.get(autoDeleter.getFromChannelCache(msg.guildId, command.name)[0]).name;
        let m = await msg.reply(`Sorry, you're not allowed to use this command in this channel.`+
        `${channelName ? ` I suggest using it in #${channelName}.` : ""}`);
        await delay(1000*5);
        msg.delete().catch(err => console.log(err));
        m.delete().catch(err => console.log(err));
        return false;
    }*/

    if (!((await command.permission(msg)) || (msg.member.roles.cache.some(role => role.name == "Founder")))) {
        let m = await msg.reply(errors.invalidPerms);
        await delay(1000*5);
        msg.delete().catch(err => console.log(err));
        m.delete().catch(err => console.log(err));
        return false;
    }

    return true;
}

// Exports
module.exports.checkArgs = checkArgs;

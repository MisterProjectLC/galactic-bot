const errors = require('../data/errors');
const delay = require('../utils/delay').delay;

const checkArgs = async (command, args, msg) => {
    // Check args
    if (command.min && !(command.min < args.length)) {
        let m = msg.reply(errors.invalidArgs);
        await delay(1000*5);
        m.delete().catch();
        return false;
    }

    if (!((await command.permission(msg)) || (msg.member.roles.cache.some(role => role.name == "Admin")))) {
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

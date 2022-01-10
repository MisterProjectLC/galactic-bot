const errors = require('../data/errors');

const checkArgs = (command, args, msg) => {
    // Check args
    if (command.min && !(command.min < args.length)) {
        msg.reply(errors.invalidArgs);
        return false;
    }

    if (!(command.permission(msg) || (msg.member.roles.cache.some(role => role.name == "Admin")))) {
        msg.reply(errors.invalidPerms);
        return false;
    }

    return true;
}

// Exports
module.exports.checkArgs = checkArgs;

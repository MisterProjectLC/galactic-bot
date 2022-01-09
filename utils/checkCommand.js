const errors = require('../data/errors');

const checkCommand = (command, args) => {
    let lowercaseArg = args[0];

    // Check command
    if (!(lowercaseArg == command.name))
        if (!command.nicknames || !command.nicknames.some(element => lowercaseArg == element))
            return false;
    

    console.log(args);
    return true;
}

// Exports
module.exports.checkCommand = checkCommand;

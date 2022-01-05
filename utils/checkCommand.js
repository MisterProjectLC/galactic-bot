const errors = require('../data/errors');

const checkCommand = (command, args) => {
    let lowercase_args = args.map(arg => {return arg.toLowerCase();});

    // Check command
    if (!lowercase_args.includes(command.name))
        if (!command.nicknames || !command.nicknames.some(element => lowercase_args.includes(element)))
            return false;
    

    console.log(args);
    return true;
}

// Exports
module.exports.checkCommand = checkCommand;

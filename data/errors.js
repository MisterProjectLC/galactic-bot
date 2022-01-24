// Exports
module.exports.invalidArgs = "Sorry, your arguments are invalid! I suggest checking #help...";
module.exports.invalidPerms = "Hey, I don't think you have permission to use this command!";
module.exports.longMessage = "Sorry, but your message is too long!";
module.exports.unidentifiedCommand = "This command doesn't exist...";
module.exports.unregisteredPlayer = "Hey, you must #register first!";
module.exports.helpFormatting = (command) => {return {embeds: [require('../commands/help').helpFormatting(command)]}};
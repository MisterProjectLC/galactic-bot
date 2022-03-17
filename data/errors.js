// Exports
module.exports.invalidArgs = "Desculpa, seus argumentos são inválidos! Sugiro checar #ajuda...";
module.exports.invalidPerms = "Ei, não acho que você tenha permissão para usar esse comando!";
module.exports.longMessage = "Desculpa, mas sua mensagem é muito longa!";
module.exports.unidentifiedCommand = "Esse comando não existe...";
module.exports.unregisteredPlayer = "Ei, você precisa #registrar primeiro!";
module.exports.helpFormatting = (command) => {return {embeds: [require('../commands/ajuda').helpFormatting(command)]}};
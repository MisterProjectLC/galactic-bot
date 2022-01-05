const quoteParser = require('./quoteParser.js').quoteParser;

const argumentParser = (message) => {
    // Args
    let args = message.split(" ");
    if (args.length == 0)
        return args;

    // Aspas
    let retorno = quoteParser(args);

    return retorno;
}

// Exports
module.exports.argumentParser = argumentParser;

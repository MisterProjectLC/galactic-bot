const banned = [/*'oi', 'eu', 'vc', 'você', 'a', 'o', 'e', 'ou', 'voce', 'te', 'tu', 'aí', 'ei', 'ow', 'viu'*/];
const punctuation = ['.', '!', '?', ',', ';'];

const languageParser = (package) => {
    let args = package[0];
    let quoted_list = package[1];

    let retorno = [];
    for (let i = 0, j = 0; i < args.length; i++) {
        if (quoted_list.includes(i)) {
            retorno[j] = args[i];
            j++;
            continue;
        }

        let this_arg = args[i];

        punctuation.forEach(element => {
            if (this_arg.endsWith(element))
            this_arg = this_arg.slice(0, this_arg.length-1);
        });

        if (!banned.includes(this_arg)) {
            retorno[j] = args[i];
            j++;
        }
    }

    return [retorno, quoted_list];
}

// Exports
module.exports.languageParser = languageParser;

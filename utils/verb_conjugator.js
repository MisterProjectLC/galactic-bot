
const imperative = {'a':['a','e'], 'e':['e','a'], 'i':['e','a'], 'o':['a'], 'ca':['ca', 'que']};

const verb_conjugator = (verb) => {
    let retorno = [verb];

    // TODO FIX THIS UGLY PIECE OF CODE

    imperative[verb.slice(verb.length-3, verb.length-1)]?.forEach(element => {
        retorno.push(verb.substring(0, verb.length-3) + element);
    });

    if (retorno.length > 1)
        return retorno;

    imperative[verb.charAt(verb.length-2)].forEach(element => {
        retorno.push(verb.substring(0, verb.length-2) + element);
    });

    return retorno;
}

// Exports
module.exports.verb_conjugator = verb_conjugator;

const quoteParser = (args) => {
    let j = 0;
    let quoted_list = [];

    for (let i = 0, open = false; i < args.length; i++) {
        if (open)
            args[j] += " " + args[i];
        else
            args[j] = args[i];

        // Open
        if (args[i][0] == '"' || args[i][0] == '“') {
            if (args[i][args[i].length-1] != '"' && args[i][args[i].length-1] != '“')
                if (!open) {
                    args[j] = args[i].slice(1, args[i].length);
                    open = true;
                } else {
                    msg.reply(aspas_invalidas);
                    return;
                }
            else {
                quoted_list.push(j);
                args[j] = args[i].slice(1, args[i].length-1);
            }
        // Closed
        } else if (args[i][args[i].length-1] == '"' || args[i][args[i].length-1] == '“')
            if (open) {
                quoted_list.push(j);
                args[j] = args[j].slice(0, args[j].length-1);
                open = false;
            } else {
                msg.reply(aspas_invalidas);
                return;
            }
        
        if (!open) {
            j++;
        }
    }

    return [args.slice(0, j), quoted_list];
}

// Exports
module.exports.quoteParser = quoteParser;

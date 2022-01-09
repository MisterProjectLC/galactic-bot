const messageBreak = (lines, error_msg) => {
    let messages = [];

    if (lines.length == 0)
        messages.push(error_msg);
    else {
        let j = 0, size = 0;
        for (let i = 0; i < lines.length; i++) {
            size += lines[i].length;
            if (size >= 1800) {
                messages.push(lines.slice(j, i).join("\n"));
                j = i;
                size = 0;
                i--;
            }
        }
        if (size > 0)
            messages.push(lines.slice(j, lines.length).join("\n"));
    }

    return messages;
}

// Exports
module.exports.messageBreak = messageBreak;

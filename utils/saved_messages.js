confirmationMessages = {};

const add_message = (index, package) => {
    if (confirmationMessages[index])
        confirmationMessages[index].push(package);
    else
        confirmationMessages[index] = [package];
}

const remove_message = (index) => {
    delete confirmationMessages[index];
}

const get_message = (index) => {
    return confirmationMessages[index];
}

module.exports.add_message = add_message;
module.exports.remove_message = remove_message;
module.exports.get_message = get_message;
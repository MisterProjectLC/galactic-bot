confirmationMessages = {};

const add_message = (category, index, pkg) => {
    if (!confirmationMessages[category])
        confirmationMessages[category] = {};

    confirmationMessages[category][index] = pkg;
}

const remove_message = (category, index) => {
    if (get_message(category, index) !== null)
        delete confirmationMessages[category][index];
}

const get_message = (category, index) => {
    return confirmationMessages[category] ? confirmationMessages[category][index] : null;
}

module.exports.add_message = add_message;
module.exports.remove_message = remove_message;
module.exports.get_message = get_message;
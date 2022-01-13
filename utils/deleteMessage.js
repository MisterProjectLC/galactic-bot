const saved_messages = require('../utils/saved_messages');

module.exports.deleteMessage = (msg, name) => {
    msg.delete().catch((err) => console.log('Could not delete the message', err));
    if (name)
        saved_messages.remove_message(name, msg.id);
}
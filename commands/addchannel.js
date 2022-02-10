const db = require('../external/database.js');
const {updateChannels} = require('../systems/autoDeleter');

// Exports
module.exports = {
    name: "addchannel",
    nicknames: ["addChannel"],
    category: "Control",
    description: "Admin only. Adds a channel to the list of permitted channels for the specified command.",
    details: ["The command's name must be the same as its name shown in #help."],
    examples: ["#addchannel adventure 928236736063111238: adds the channel with the ID 928236736063111238 to the list of permitted channels for the command 'adventure'."],
    min: 2, max: 2, cooldown: 0,
    execute: async (com_args, msg) => {
        let result = await db.makeQuery(`SELECT add_channel($1, $2, $3)`, [com_args[0], msg.guildId, com_args[1]]).catch(err => console.log(err));
        if (result.rowCount > 0 && result.rows[0].add_channel) {
            msg.reply("Channel added!");
            updateChannels();
            return;
        }
        msg.reply("This channel was already added to this command...");

    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

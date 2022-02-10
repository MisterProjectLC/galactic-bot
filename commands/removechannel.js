const db = require('../external/database.js');
const {updateChannels} = require('../systems/autoDeleter');

// Exports
module.exports = {
    name: "removechannel",
    nicknames: ["removeChannel"],
    category: "Control",
    description: "Admin only. Removes a channel from the list of permitted channels for the specified command.",
    details: ["The command's name must be the same as its name shown in #help."],
    examples: ["#removechannel adventure 928236736063111238: removes the channel with the ID 928236736063111238 from the list of permitted channels for the command 'adventure'."],
    min: 2, max: 2, cooldown: 0,
    execute: async (com_args, msg) => {
        await db.makeQuery(`DELETE FROM commandChannels WHERE title = $1 AND guild_id = $2 AND channel_id = $3`,
        [com_args[0], msg.guildId, com_args[1]]).catch(err => console.log(err));
        updateChannels();
        msg.reply("Alright, players may not send this command in this channel anymore.");
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

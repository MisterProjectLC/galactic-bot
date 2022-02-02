const db = require('../external/database.js');

module.exports.deleteOldMessage = async (msg, title) => {
    // Delete old shop message
    let oldShopResult = await db.makeQuery(`SELECT * FROM fixedMessages WHERE guild_id = $1 AND title = $2`, [msg.guild.id, title]);
    let oldMsgExists = (oldShopResult.rowCount >= 1);
    if (oldMsgExists) {
        let oldMsg = oldShopResult.rows[0];
        console.log('Found old shop message. Deleting...');

        msg.guild.channels.fetch(oldMsg.channel_id).then(channel => {
            channel.messages.fetch(oldMsg.message_id).then(message => {
                message.delete().catch(err => console.log(err));
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
    }
    return oldMsgExists;
}

module.exports.updateFixedMessage = (oldExists, msg, title) => {
    if (oldExists)
        db.makeQuery(`UPDATE fixedMessages SET message_id = $1, channel_id = $2 WHERE guild_id = $3 AND title = $4`, 
        [msg.id, msg.channel.id, msg.guild.id, title]);
    else
        db.makeQuery(`INSERT INTO fixedMessages(message_id, channel_id, guild_id, title) VALUES ($1, $2, $3, $4)`, 
        [msg.id, msg.channel.id, msg.guild.id, title]);
}
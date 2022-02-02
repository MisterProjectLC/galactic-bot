const db = require('../external/database.js');

var shopMessageIDs = [];

module.exports.autoDeleter = async (msg) => {
    if (shopMessageIDs.length == 0)
        await this.updateIDs();

    if (shopMessageIDs.includes(msg.channel.id))
        msg.delete().catch();
}

module.exports.isValid = async (msg, commandName) => {
    if (shopMessageIDs.length == 0)
        await this.updateIDs();

    if (shopMessageIDs.includes(msg.channel.id) && commandName != 'shop' && commandName != 'buy')
        return false;

    return true;
}


module.exports.updateIDs = async () => {
    let result = await db.makeQuery(`SELECT channel_id FROM fixedMessages WHERE title = 'shop'`);
    shopMessageIDs = result.rows.map(row => {return row.channel_id});
}
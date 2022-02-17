const db = require('../external/database.js');

const CACHE_LIMIT = 5000;

var shopMessageIDs = [];

var channelCache = {};
var channelCount = 0;
const channelCommands = ['addchannel', 'removechannel', 'checkchannels'];

var insertChannelIntoCache = (title, guild, channel) => {
    if (channelCount >= CACHE_LIMIT)
        return;

    if (!channelCache.hasOwnProperty(guild))
        channelCache[guild] = {};

    if (!channelCache[guild].hasOwnProperty(title))
        channelCache[guild][title] = [];

    channelCache[guild][title].push(channel);
    channelCount++;
}


module.exports.getFromChannelCache = (guild, title) => {
    return channelCache[guild][title];
}


module.exports.autoDeleter = async (msg) => {
    if (shopMessageIDs.length == 0)
        await this.updateIDs();

    if (shopMessageIDs.includes(msg.channel.id))
        msg.delete().catch();
}

module.exports.isValid = async (msg, commandName) => {
    if (shopMessageIDs.length == 0)
        await this.updateIDs();

    if (shopMessageIDs.includes(msg.channel.id) && commandName != 'shop' && commandName != 'buy' && commandName != 'check')
        return false;

    if (Object.keys(channelCache).length == 0) {
        console.log("channel cache size 0");
        await this.updateChannels();
        console.log(channelCache);
    }

    /*if (!(channelCache.hasOwnProperty(msg.guildId) && channelCache[msg.guildId].hasOwnProperty(commandName) 
        && channelCache[msg.guildId][commandName].includes(msg.channel.id)) && !channelCommands.includes(commandName))
        return false;*/

    return true;
}


module.exports.updateIDs = async () => {
    let result = await db.makeQuery(`SELECT channel_id FROM fixedMessages WHERE title = 'shop'`);
    shopMessageIDs = result.rows.map(row => {return row.channel_id});
}


module.exports.updateChannels = async () => {
    result = await db.makeQuery(`SELECT * FROM commandChannels`);
    channelCache = {};

    result.rows.forEach(row => {
        insertChannelIntoCache(row.title, row.guild_id, row.channel_id);
    })
}
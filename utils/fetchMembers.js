const {asyncForEach} = require('../utils/asyncForEach');


module.exports.fetchMembers = async (Client) => {
    let memberList = [];

    let guilds = await Client.guilds.fetch().catch(console.error);
    let guildArray = [];
    guilds.forEach((value, key) => {
        guildArray.push(value);
    })

    await asyncForEach(guildArray, async guild => {
        guild = await guild.fetch().catch(console.error);
        
        let members = await guild.members.fetch().catch(console.error);
        members.forEach(member => {
            if (!memberList.includes(member))
                memberList.push(member);
        });
    });

    return memberList;
}
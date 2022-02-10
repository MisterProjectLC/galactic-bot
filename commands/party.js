const db = require('../external/database.js');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');
const errors = require('../data/errors');
const {removeReactions} = require('../utils/removeReactions');
const {isValid} = require('../systems/autoDeleter');

const emojiNumbers = ['2️⃣', '3️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

var parties = {};

var createEmbed = async (members, unorderedRows, partySize) => {
    let titles = [];
    members.forEach(member => {
        titles.push(unorderedRows.find(row => {
            return row.userid == member;
        }).title);
    });
    
    let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`${titles[0]}'s Party`)
        .setFooter("Press ✅ to join the party.\nHost: Press 2️⃣-8️⃣ to kick members out\nHost: Press ❌ to end the party");

        let memberList = '';
        for (let i = 0; i < partySize; i++)
            memberList += `${i+1}. ${titles.length > i ? titles[i] : ""}\n`;
        
        embed = embed.addField('Members', memberList, false);

    return embed;
}

// Exports
module.exports = {
    name: "party",
    nicknames: ["team"],
    category: "Battle",
    description: "Build a party to go on a #conquest mission.", 
    examples: ["#party: create a party of up to 4 players.",
    "#party 8: create a party of up to 8 players. This is the maximum size of any party."],
    min: 0, max: 1, cooldown: 5,
    execute: async (com_args, msg) => {
        // Get party size
        let partySize = 4;
        if (com_args > 0) {
            partySize = parseInt(com_args[0]);
            if (partySize !== partySize || partySize < 2 || partySize > 8) {
                msg.reply(errors.helpFormatting(module.exports));
                return;
            }
        }

        let result = await db.makeQuery('SELECT title, userid FROM players WHERE userid = $1', [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }

        let members = [msg.author.id];
        let embed = await createEmbed(members, result.rows, partySize);

        let m = await msg.reply({embeds: [embed]});
        m.react('✅');
        m.react('❌');
        for (let i = 0; i < Math.min(emojiNumbers.length, partySize); i++)
            m.react(emojiNumbers[i]);

        if (parties[msg.author.id]) {
            parties[msg.author.id].delete().catch((err) => console.log('Could not delete the message', err));
            saved_messages.remove_message('party', parties[msg.author.id].id);
        }
        saved_messages.add_message('party', m.id, {callerID: msg.author.id, members: members, partySize: partySize, msg: m});
        parties[msg.author.id] = m;

    }, 
    reaction: async (reaction, user, added) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        let pkg = saved_messages.get_message('party', msg.id);
        if (!pkg)
            return;

        if (emoji === '✅') {
            // The host is automatically invited
            await removeReactions(msg, pkg.callerID);
            if (pkg.callerID === user.id)
                return;
            
            // Modify
            if (added) {
                if (pkg.members.length < pkg.partySize)
                    pkg.members.push(user.id);
                else
                    await removeReactions(msg, user.id);
            } else if (pkg.members.includes(user.id))
                pkg.members.splice(pkg.members.indexOf(user.id), 1);
            else
                return;
        }

        else if (emoji === '❌') {
            if (parties[user.id]) {
                parties[user.id].delete().catch((err) => console.log('Could not delete the message', err));
                saved_messages.remove_message('party', msg.id);
            }
            return;
        }
        
        else if (emojiNumbers.includes(emoji)) {
            if (pkg.callerID !== user.id || !added)
                return;
            
            await removeReactions(msg, pkg.callerID);
            
            // Modify
            let index = emojiNumbers.lastIndexOf(emoji)+1;

            if (pkg.members.length <= index)
                return;
            
            await removeReactions(msg, pkg.members[index]);
            pkg.members.splice(index, 1);
        }

        // Get titles
        let result = await db.makeQuery('SELECT title, userid FROM players WHERE userid = ANY($1)', [pkg.members]);
        if (result.rowCount < pkg.members.length)
            return;

        // Update
        msg.edit({embeds: [await createEmbed(pkg.members, result.rows, pkg.partySize)] });
        saved_messages.add_message('party', msg.id, {callerID: pkg.callerID, members: pkg.members, partySize: pkg.partySize, msg: msg});
    },
    permission: async (msg) => true,
    findPartyMessage: (hostID) => {return parties.hasOwnProperty(hostID) ? parties[hostID] : null}
};

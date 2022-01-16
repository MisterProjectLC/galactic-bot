const db = require('../external/database.js');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');
const errors = require('../data/errors');
const {removeReactions} = require('../utils/removeReactions');

const emojiNumbers = ['2️⃣', '3️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

var tournaments = {};

var createEmbed = async (members, unorderedRows, tournamentSize) => {
    let titles = [];
    members.forEach(member => {
        titles.push(unorderedRows.find(row => {
            return row.userid == member;
        }).title);
    });
    
    let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`${titles[0]}'s Tournament`)
        .setFooter("Press 🔼 to join the tournament.");

        let memberList = '';
        for (let i = 0; i < tournamentSize; i++)
            memberList += `${i+1}. ${titles.length > i ? titles[i] : ""}\n`;
        
        embed = embed.addField('Members', memberList, false);

    return embed;
}

// Exports
module.exports = {
    name: "tournament",
    category: "Battle",
    description: "Host a tournament between players.", 
    examples: ["#tournament: create a tournament of up to 4 players.",
    "#tournament 8: create a tournament of up to 8 players.",
    "#tournament 4 50: create a tournament of up to 4 players with an entry fee of 50 coins and a prize of 200 coins (4x50)."],
    details: ["Tournament sizes must be either 4, 8 or 16."],
    min: 0, max: 2, cooldown: 5,
    execute: async (com_args, msg) => {
        // Get tournament size
        let tournamentSize = 4;
        if (com_args > 0) {
            tournamentSize = parseInt(com_args[0]);
            if (tournamentSize !== tournamentSize || (tournamentSize != 4 && tournamentSize != 8 && tournamentSize != 16)) {
                msg.reply(errors.invalidArgs);
                return;
            }
        }

        let result = await db.makeQuery('SELECT title, userid FROM players WHERE userid = $1', [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }

        let members = [msg.author.id];
        let embed = await createEmbed(members, result.rows, tournamentSize);

        let m = await msg.reply(embed);
        m.react('🔼');
        for (let i = 0; i < Math.min(emojiNumbers.length, tournamentSize); i++)
            m.react(emojiNumbers[i]);

        if (tournaments[msg.author.id]) {
            tournaments[msg.author.id].delete().catch((err) => console.log('Could not delete the message', err));
            saved_messages.remove_message('tournament', tournaments[msg.author.id].id);
        }
        saved_messages.add_message('tournament', m.id, {callerID: msg.author.id, members: members, tournamentSize: tournamentSize, msg: m});
        tournaments[msg.author.id] = m;

    }, 
    reaction: async (reaction, user, added) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        let pkg = saved_messages.get_message('tournament', msg.id);
        if (!pkg)
            return;

        if (emoji === '🔼') {
            // The host is automatically invited
            await removeReactions(msg, pkg.callerID);
            if (pkg.callerID === user.id)
                return;
            
            // Modify
            if (added) {
                if (pkg.members.length < pkg.tournamentSize)
                    pkg.members.push(user.id);
                else
                    await removeReactions(msg, user.id);
            } else if (pkg.members.includes(user.id))
                pkg.members.splice(pkg.members.indexOf(user.id), 1);
            else
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
        msg.edit(await createEmbed(pkg.members, result.rows, pkg.tournamentSize));
        saved_messages.add_message('tournament', msg.id, {callerID: pkg.callerID, members: pkg.members, tournamentSize: pkg.tournamentSize, msg: msg});
    },
    permission: (msg) => true,
    findTournamentMessage: (hostID) => {return tournaments.hasOwnProperty(hostID) ? tournaments[hostID] : null}
};

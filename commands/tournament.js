const db = require('../external/database.js');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');
const errors = require('../data/errors');
const {removeReactions} = require('../utils/removeReactions');
const {deleteMessage} = require('../utils/deleteMessage');
const {shuffleArray} = require('../utils/shuffleArray');

const emojiNumbers = ['2️⃣', '3️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

var tournaments = {};


var resolveDuel = (endgame, pkg) => {
    
}


var confirmTournament = (pkg) => {    
    let participants = shuffleArray(pkg.participants);

    let titles = [];
    participants.forEach(participant => {
        titles.push(unorderedRows.find(row => {
            return row.userid == participant;
        }).title);
    });

    let duels = [];
    for (let i = 0; i < participants.length; i += 2) {
        let duel = [];
        duel.push({id: participants[i], title: titles[i]});
        duel.push({id: participants[i+1], title: titles[i+1]});
        duels.push(duel);
    }

    pkg.msg.channel.send(createBoard(duels));
};


var createBoard = (duels) => {
    let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`${titles[0]}'s Tournament`);

        let duelList = '';
        for (let i = 0; i < duels; i++) {
            if (duels[i].length >= 2)
                duelList += `**${duels[i][0].title}** VS **${duels[i][1].title}**\n`;
            else
                duelList += `Winner: **${duels[i][0].title}**\n`;
        }
        
        embed = embed.addField('Participants', duelList, false);

    return embed;
}


var createEmbed = async (participants, unorderedRows, tournamentSize) => {
    let titles = [];
    participants.forEach(participant => {
        titles.push(unorderedRows.find(row => {
            return row.userid == participant;
        }).title);
    });
    
    let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`${titles[0]}'s Tournament`)
        .setFooter("Press 🔼 to join the tournament.");

        let participantList = '';
        for (let i = 0; i < tournamentSize; i++)
            participantList += `${i+1}. ${titles.length > i ? titles[i] : ""}\n`;
        
        embed = embed.addField('Participants', participantList, false);

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

        // Check if host exists
        let result = await db.makeQuery('SELECT title, userid FROM players WHERE userid = $1', [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }

        let participants = [msg.author.id];
        let embed = await createEmbed(participants, result.rows, tournamentSize);

        let m = await msg.reply(embed);
        m.react('🔼');

        // Create tournament message
        if (tournaments[msg.author.id]) {
            tournaments[msg.author.id].delete().catch((err) => console.log('Could not delete the message', err));
            saved_messages.remove_message('prepareTournament', tournaments[msg.author.id].id);
        }
        saved_messages.add_message('prepareTournament', m.id, {callerID: msg.author.id, participants: participants, tournamentSize: tournamentSize, msg: m});
        tournaments[msg.author.id] = m;

    }, 
    reaction: async (reaction, user, added) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        let pkg = saved_messages.get_message('prepareTournament', msg.id);
        if (!pkg)
            return;

        if (emoji === '🔼') {
            // The host is automatically invited
            await removeReactions(msg, pkg.callerID);
            if (pkg.callerID === user.id)
                return;
            
            // Modify
            if (added) {
                if (pkg.participants.length < pkg.tournamentSize)
                    pkg.participants.push(user.id);
                else
                    await removeReactions(msg, user.id);
            } else if (pkg.participants.includes(user.id))
                pkg.participants.splice(pkg.participants.indexOf(user.id), 1);
            else
                return;
        }

        // Confirm reaction
        else if (emoji === '✅') {
            confirmTournament(pkg);
            deleteMessage(msg, 'prepareTournament');
            return;
        }

        // Get titles
        let result = await db.makeQuery('SELECT title, userid FROM players WHERE userid = ANY($1)', [pkg.participants]);
        if (result.rowCount < pkg.participants.length)
            return;

        // Update
        msg.edit(await createEmbed(pkg.participants, result.rows, pkg.tournamentSize));
        if (pkg.membrs.length == pkg.tournamentSize)
            msg.react('✅');
        else
            pkg.msg.reactions.cache.get('✅').remove().catch(error => console.error('Failed to remove reactions: ', error));
        saved_messages.add_message('prepareTournament', msg.id, {callerID: pkg.callerID, participants: pkg.participants, tournamentSize: pkg.tournamentSize, msg: msg});
    },
    permission: (msg) => true,
    findTournamentMessage: (hostID) => {return tournaments.hasOwnProperty(hostID) ? tournaments[hostID] : null}
};

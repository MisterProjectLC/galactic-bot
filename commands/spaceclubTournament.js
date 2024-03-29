const db = require('../external/database.js');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');
const errors = require('../data/errors');
const encounter = require('../systems/duelEncounter');
const rewards = require('../systems/rewards');
const {removeReactions} = require('../utils/removeReactions');
const {deleteMessage} = require('../utils/deleteMessage');
const {shuffleArray} = require('../utils/shuffleArray');
const {isValid} = require('../systems/autoDeleter');

var tournaments = {};

var generateDuel = (msg, command, leftPlayerID, rightPlayerID, pkg, resolveFunc) => {
    encounter.generateDuelEncounter(msg, command, leftPlayerID, rightPlayerID, pkg, resolveFunc);
}


var resolveDuel = async (endgame, pkg) => {
    let tournament = module.exports.findTournamentMessage(pkg.hostID);

    // Resolve this duel
    if (endgame == 1)
        tournament.duels[tournament.currentIndex].splice(1, 1);
    else
        tournament.duels[tournament.currentIndex].splice(0, 1);

    // Advance to the next duel
    if (tournament.duels.length >= 2) {
        tournament.currentIndex++;

        // Regenerate duels if necessary
        if (tournament.currentIndex >= tournament.duels.length) {
            console.log("Regenerating duels");
            tournament.currentIndex = 0;
            let newDuels = [];
            for (let i = 0; i < tournament.duels.length; i += 2)
                newDuels.push([tournament.duels[i][0], tournament.duels[i+1][0]]);
            tournament.duels = newDuels;
        }

        await tournament.boardMsg.edit({embeds: [createBoard(tournament.duels, tournament.pkg)] });

        // Update tournaments
        tournaments[pkg.hostID] = tournament;

        // Run next duel
        generateDuel(pkg.msg, module.exports, [tournament.duels[tournament.currentIndex][0].id], 
            [tournament.duels[tournament.currentIndex][1].id], pkg, resolveDuel);
        return;
    }

    // Found the winner - finalize the tournament
    let winner = tournament.duels[0][0];
    pkg.msg.channel.send("The tournament is over! THE WINNER IS **" + winner.title + "**!")
    await rewards.giveCoins(winner.id, tournament.pkg.entryFee*tournament.pkg.tournamentSize, tournament.pkg.msg.channel, module.exports);
    delete tournaments[pkg.hostID];
}


var confirmTournament = async (pkg) => {    
    let participants = shuffleArray(pkg.participants);

    // Generate duels
    let duels = [];
    for (let i = 0; i < participants.length; i += 2) {
        duels.push([participants[i], participants[i+1]]);
    }

    // Create board
    let boardMsg = await pkg.msg.channel.send({embeds: [createBoard(duels, pkg)] });
    // Create tournament
    tournaments[pkg.hostID] = {currentIndex: 0, duels: duels, pkg: pkg, boardMsg: boardMsg};
    console.log(tournaments);
    // Run first duel
    generateDuel(pkg.msg, module.exports, [duels[0][0].id], [duels[0][1].id], pkg, resolveDuel);
};


var createBoard = (duels, pkg) => {
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`Space Club Tournament`);

    let duelList = '';
    for (let i = 0; i < duels.length; i++) {
        if (duels[i].length >= 2)
            duelList += `**${duels[i][0].title}** VS **${duels[i][1].title}**\n`;
        else
            duelList += `Winner: **${duels[i][0].title}**\n`;
    }
        
    embed = embed.addField('Participants', duelList, false);
    return embed;
}


var createJoinEmbed = async (hostTitle, participants, entryFee, tournamentSize) => {   
    let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`Space Club Tournament`)
        .setDescription(`Entry Fee: ${entryFee} coins\nFinal Prize: ${entryFee*tournamentSize} coins`)
        .setFooter(`Host: Once the tournament is filled, press ✅ to start the tournament.
Other users: Press 🔼 to join the tournament. 
If you get rejected, check if you have enough coins for the entry fee.`);

        let participantList = '';
        for (let i = 0; i < tournamentSize; i++)
            participantList += `${i+1}. ${participants.length > i ? participants[i].title : ""}\n`;
        
        embed = embed.addField('Participants', participantList, false);

    return embed;
}

// Exports
module.exports = {
    name: "spaceclubTournament",
    nicknames: ["spaceClubTournament", "SpaceClubTournament", "ClubTournament"],
    category: "Battle",
    description: "Admin only. Host a tournament between players.", 
    examples: ["#spaceclubTournament: create a tournament of 4 players.",
    "#spaceclubTournament 8: create a tournament of 8 players.",
    "#spaceclubTournament 4 50: create a tournament of 4 players with an entry fee of 50 coins and a prize of 200 coins (4x50)."],
    details: ["Tournament sizes must be either 4, 8 or 16."],
    min: 0, max: 2, cooldown: 5,
    execute: async (com_args, msg) => {
        // Get tournament size
        let tournamentSize = 4;
        if (com_args.length > 0) {
            tournamentSize = parseInt(com_args[0]);
            if (tournamentSize !== tournamentSize || (tournamentSize != 4 && tournamentSize != 8 && tournamentSize != 16)) {
                msg.reply(errors.helpFormatting(module.exports));
                return;
            }
        }

        // Get fee
        let entryFee = 0;
        if (com_args.length > 1) {
            entryFee = parseInt(com_args[1]);
            if (entryFee !== entryFee) {
                msg.reply(errors.helpFormatting(module.exports));
                return;
            }
            if (entryFee < 0) {
                msg.reply("The entry fee can't be negative!");
                return;
            }
        }

        // Check if tournament already in progress
        if (module.exports.findTournamentMessage(msg.author.id) != null) {
            msg.reply("You already have a tournament in progress...");
            return;
        }


        // Check if host exists
        let result = await db.makeQuery('SELECT title, coins, userid as id FROM players WHERE userid = $1', [msg.author.id]);
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }

        let participants = [];
        let embed = await createJoinEmbed(result.rows[0].title, participants, entryFee, tournamentSize);

        let m = await msg.reply({embeds: [embed]});
        m.react('🔼');

        // Create tournament message
        if (saved_messages.get_message('prepareSCTournamentUser', msg.author.id) != null) {
            deleteMessage(saved_messages.get_message('prepareSCTournament', saved_messages.get_message('prepareSCTournamentUser', msg.author.id)).msg,
            'prepareSCTournament');
            saved_messages.remove_message('prepareSCTournamentUser');
        }
        
            saved_messages.add_message('prepareSCTournamentUser', msg.author.id, m.id);
        saved_messages.add_message('prepareSCTournament', m.id, {hostID: msg.author.id, hostTitle: result.rows[0].title, participants: participants, 
            tournamentSize: tournamentSize, entryFee: entryFee, msg: m});

    }, 

    reaction: async (reaction, user, added) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        let pkg = saved_messages.get_message('prepareSCTournament', msg.id);
        if (!pkg)
            return;

        if (emoji === '🔼') {           
            // Get title
            let result = await db.makeQuery('SELECT title, coins, userid as id FROM players WHERE userid = $1', [user.id]);
            if (result.rowCount < 1) {
                removeReactions(msg, user.id);
                return;
            }
            if (result.rows[0].coins < pkg.entryFee) {
                removeReactions(msg, user.id);
                return;
            }

            // Modify
            if (added) {
                if (pkg.participants.length < pkg.tournamentSize)
                    pkg.participants.push(result.rows[0]);
                else
                    await removeReactions(msg, user);
            } else if (pkg.participants.some(participant => {return participant.id == result.rows[0].id}))
                pkg.participants.splice(pkg.participants.findIndex(participant => {return participant.id == result.rows[0].id}), 1);
            else
                return;
        }

        // Confirm reaction
        else if (emoji === '✅' && pkg.participants.length >= pkg.tournamentSize && user.id == pkg.hostID) {
            let ids = pkg.participants.map(participant => {return participant.id});
            db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE userID ILIKE ANY($1)`, [ids, pkg.entryFee]);
            confirmTournament(pkg);
            deleteMessage(msg, 'prepareSCTournament');
            saved_messages.remove_message('prepareSCTournamentUser', pkg.hostID);
            return;
        }
        

        // Update
        msg.edit({embeds: [await createJoinEmbed(pkg.hostTitle, pkg.participants, pkg.entryFee, pkg.tournamentSize)]});
        if (pkg.participants.length == pkg.tournamentSize)
            msg.react('✅');
        else if (pkg.msg.reactions.cache.has('✅'))
            pkg.msg.reactions.cache.get('✅').remove().catch(error => console.error('Failed to remove reactions: ', error));

        saved_messages.add_message('prepareSCTournament', msg.id, pkg);
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder"),
    findTournamentMessage: (hostID) => {return tournaments.hasOwnProperty(hostID) ? tournaments[hostID] : null}
};

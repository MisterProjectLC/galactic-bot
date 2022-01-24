const db = require('../external/database.js');
const saved_messages = require('../utils/saved_messages');
const Discord = require('discord.js');
const { delay } = require('../utils/delay.js');
const {generatePlayers, generatePlayerInfos, generateBattle, updateInventory} = require('./encounterHelper');
const {deleteMessage} = require('../utils/deleteMessage');

var cleanup = (pkg) => {
    // Cleanup
    if (saved_messages.get_message('duelMain', pkg.msg.id) != null) {
        pkg.leftPlayers.forEach(player => {
            deleteMessage(player.weapons.msg, 'duelPlayer');
            deleteMessage(player.armors.msg, 'duelPlayer');
        });
        pkg.rightPlayers.forEach(player => {
            deleteMessage(player.weapons.msg, 'duelPlayer');
            deleteMessage(player.armors.msg, 'duelPlayer');
        });

        deleteMessage(pkg.msg, 'duelMain');
    }
}


var generateDuelEncounter = async (msg, command, leftPlayerIDs, rightPlayerIDs, outsidePkg, outsideFunction) => {
    // Players + Create weapons/armor messages
    let leftPlayers = await generatePlayerInfos(leftPlayerIDs, msg);
    let rightPlayers = await generatePlayerInfos(rightPlayerIDs, msg);

    // Embed
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle("Duel - " + leftPlayers[0].info.title + " VS " + rightPlayers[0].info.title)
    .setDescription("The challenger gets to attack first. However, if the fight reaches the 9th round, the challenged player wins automatically.")
    .setFooter("Choose your weapons/armors in my private messages\nCombatants: Press ✅ when ready");

    // Create summary message
    let mainMsg = await msg.channel.send({embeds: [embed]});
    mainMsg.react('✅').catch(err => console.log(err));

    // Register messages
    registerPlayer = (player) => {
        saved_messages.add_message('duelPlayer', player.weapons.msg.id, mainMsg.id);
        saved_messages.add_message('duelPlayer', player.armors.msg.id, mainMsg.id);
    }

    leftPlayers.forEach(registerPlayer);
    rightPlayers.forEach(registerPlayer);

    saved_messages.add_message('duelMain', mainMsg.id, {hostID: msg.author.id, originalCommand: command, originalMsg: msg,
        leftPlayers: leftPlayers, rightPlayers: rightPlayers, challengerIDs: leftPlayerIDs, challengedIDs: rightPlayerIDs, msg: mainMsg, 
        outsidePkg: outsidePkg, outsideFunction: outsideFunction});
    
    // Cleanup messages
    await delay(1000*60*30);
    if (saved_messages.get_message('duelMain', mainMsg.id) != null)
        cleanup(saved_messages.get_message('duelMain', mainMsg.id));
};



var confirmDuelEncounter = async (reaction, user, pkg, added) => {
    let msg = reaction.message;
    let emoji = reaction.emoji.toString();

    // Confirm encounter
    if (emoji !== '✅')
        return;
    
    let confirmed = true;
    var confirmCheck = (player) => {
        if (user.id == player.info.userid)
            player.confirmed = added;
            
        if (!player.confirmed)
            confirmed = false;
    }
    pkg.leftPlayers.forEach(confirmCheck);
    pkg.rightPlayers.forEach(confirmCheck);

    if (!confirmed)
        return;

    // Player
    db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE userID ILIKE ANY($1)`, [pkg.challengerIDs, pkg.bet]);
    db.makeQuery(`UPDATE players SET coins = coins - $2 WHERE userID ILIKE ANY($1)`, [pkg.challengedIDs, pkg.bet]);
    let leftInstances = generatePlayers(pkg.leftPlayers);
    let rightInstances = generatePlayers(pkg.rightPlayers);

    // Battle
    let endgame = await generateBattle(leftInstances, rightInstances, msg, true, true);

    console.log('FIM');
    await pkg.outsideFunction(endgame, pkg.outsidePkg);
    cleanup(pkg);
}


var onReaction = async (reaction, user, added) => {
    let msg = reaction.message;

    if (!added)
        return;

    // Main package - a single encounter
    let pkg = saved_messages.get_message('duelMain', msg.id);
    if (pkg) {
        let leftPlayerIdx = pkg.leftPlayers.findIndex(player => { return player.info.userid == user.id});
        let rightPlayerIdx = pkg.rightPlayers.findIndex(player => { return player.info.userid == user.id});

        if (leftPlayerIdx == -1 && rightPlayerIdx == -1)
            return;

        // Confirm reaction
        if (pkg.msg.id == msg.id) {
            confirmDuelEncounter(reaction, user, pkg, added);
            return;
        }
    }
}


var onInteraction = (interaction, command) => {
    let msg = interaction.message;
    let user = interaction.user;
    let confirmID = msg.id;

    // Secondary index to main package (player -> package)
    let index = saved_messages.get_message('duelPlayer', msg.id);
    if (index)
        confirmID = index;

    // Main package - a single encounter
    let pkg = saved_messages.get_message('duelMain', confirmID);
    if (pkg) {
        let leftPlayerIdx = pkg.leftPlayers.findIndex(player => { return player.info.userid == user.id});
        let rightPlayerIdx = pkg.rightPlayers.findIndex(player => { return player.info.userid == user.id});

        if (leftPlayerIdx == -1 && rightPlayerIdx == -1)
            return;

        // Weapon + Armor reaction
        let updatedPkg;
        if (leftPlayerIdx !== -1) {
            updatedPkg = updateInventory(interaction, pkg.leftPlayers[leftPlayerIdx]);
            if (updatedPkg !== null)
                pkg.leftPlayers[leftPlayerIdx] = updatedPkg;
            return;
        }

        if (rightPlayerIdx !== -1) {
            updatedPkg = updateInventory(reaction, user, pkg.rightPlayers[rightPlayerIdx]);
            if (updatedPkg !== null)
                pkg.rightPlayers[rightPlayerIdx] = updatedPkg;
            return;
        }
    }
}


module.exports = {
    generateDuelEncounter: generateDuelEncounter,
    onReaction: onReaction,
    onInteraction: onInteraction
}
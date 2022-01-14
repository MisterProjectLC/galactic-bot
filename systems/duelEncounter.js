const saved_messages = require('../utils/saved_messages');
const Discord = require('discord.js');
const rewards = require('../systems/rewards');
const cooldownControl = require('../utils/cooldownControl');
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


var generateDuelEncounter = async (msg, command, leftPlayerIDs, rightPlayerIDs, bet) => {
    // Players + Create weapons/armor messages
    let leftPlayers = await generatePlayerInfos(leftPlayerIDs, msg);
    let rightPlayers = await generatePlayerInfos(rightPlayerIDs, msg);

    // Embed
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle("Duel - " + leftPlayers[0].info.title + " VS " + rightPlayers[0].info.title)
    .setDescription("The challenger gets to attack first. However, if the fight reaches the 8th round, the challenged player wins automatically.")
    .setFooter("Combatants: Press ✅ when ready\nChallenger: Press ❌ to cancel");

    // Create summary message
    let mainMsg = await msg.channel.send(embed);
    mainMsg.react('✅');
    mainMsg.react('❌');

    // Register messages
    registerPlayer = (player) => {
        saved_messages.add_message('duelPlayer', player.weapons.msg.id, mainMsg.id);
        saved_messages.add_message('duelPlayer', player.armors.msg.id, mainMsg.id);
    }

    leftPlayers.forEach(registerPlayer);
    rightPlayers.forEach(registerPlayer);

    saved_messages.add_message('duelMain', mainMsg.id, {hostID: msg.author.id, originalCommand: command, originalMsg: msg,
        leftPlayers: leftPlayers, rightPlayers: rightPlayers, msg: mainMsg, bet: bet});
    
    // Cleanup messages
    await delay(1000*60*30);
    if (saved_messages.get_message('duelMain', mainMsg.id) != null)
        cleanup(saved_messages.get_message('duelMain', mainMsg.id));
    await delay(1000*60*30);
    if (saved_messages.get_message('duelMain', mainMsg.id) != null)
        cleanup(saved_messages.get_message('duelMain', mainMsg.id));
    await delay(1000*60*30);
    if (saved_messages.get_message('duelMain', mainMsg.id) != null)
        cleanup(saved_messages.get_message('duelMain', mainMsg.id));
};



var confirmDuelEncounter = async (reaction, user, pkg, added) => {
    let msg = reaction.message;
    let emoji = reaction.emoji.toString();

    // Cancel encounter
    if (emoji === '❌' && user.id === pkg.hostID) {
        cleanup(pkg);
        cooldownControl.resetCooldown(pkg.originalCommand, pkg.originalMsg.author.id);
        return;
    }

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

    cleanup(pkg, 'duel');

    // Player
    let leftInstances = generatePlayers(pkg.leftPlayers);
    let rightInstances = generatePlayers(pkg.rightPlayers);

    // Battle
    let endgame = await generateBattle(leftInstances, rightInstances, msg);

    if (endgame == 1)
        rewards.giveCoins(pkg.challengerID, pkg.bet*2, pkg.msg.channel, pkg.originalCommand);
    else if (endgame == 2)
        rewards.giveCoins(pkg.challengedID, pkg.bet*2, pkg.msg.channel, pkg.originalCommand);
}


var onReaction = async (reaction, user, added) => {
    let msg = reaction.message;
    let confirmID = msg.id;

    if (!added)
        return;

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

        // Confirm reaction
        if (pkg.msg.id == msg.id) {
            confirmDuelEncounter(reaction, user, pkg, added);
            return;
        }

        // Weapon + Armor reaction
        let updatedPkg;
        if (leftPlayerIdx !== -1) {
            updatedPkg = updateInventory(reaction, user, pkg.leftPlayers[leftPlayerIdx]);
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
    onReaction: onReaction
}
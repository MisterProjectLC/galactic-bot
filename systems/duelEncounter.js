const db = require('../external/database.js');
const saved_messages = require('../utils/saved_messages');
const Discord = require('discord.js');
const { delay } = require('../utils/delay.js');
const {generatePlayers, generatePlayerInfos, generateBattle, updateInventory} = require('./encounterHelper');
const {deleteMessage} = require('../utils/deleteMessage');

const LOADOUT_TIME = 90;
const TIME_INCREMENT = 5;

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

// Embed
var generateEmbed = (time, leftPlayers, rightPlayers) => {
    return new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle("Duel - " + leftPlayers[0].info.title + " VS " + rightPlayers[0].info.title)
    .setDescription("Choose your weapons/armors in my private messages.\nThe challenger gets to attack first. However, if the fight reaches the 9th round, the challenged player wins automatically.")
    .setFooter(`Choose your weapons/armors in your private messages\nCombatants: Press ✅ when ready\nTime left to decide: ${LOADOUT_TIME-time} seconds`);
}

var decisionTimer = async (mainMsg, leftPlayers, rightPlayers, pkg, outsideFunction) => {
    // Update timer
    let time = 0;
    while (time < LOADOUT_TIME) {
        await delay(1000*TIME_INCREMENT);
        time += TIME_INCREMENT;
        await mainMsg.edit({embeds: [generateEmbed(time, leftPlayers, rightPlayers)]}).catch(err => {});
    }

    // Left or right confirmed
    let leftConfirmed = true;
    leftPlayers.forEach(player => {
        if (!player.confirmed)
            leftConfirmed = false;
    });
    let rightConfirmed = true;
    rightPlayers.forEach(player => {
        if (!player.confirmed)
            rightConfirmed = false;
    });

    if (leftConfirmed && !rightConfirmed) {
        await mainMsg.channel.send("Combatant(s) B timed out! Combatant(s) A won.");
        outsideFunction(1, pkg.outsidePkg);
    } else if (!leftConfirmed && rightConfirmed) {
        await mainMsg.channel.send("Combatant(s) A timed out! Combatant(s) B won.");
        outsideFunction(2, pkg.outsidePkg);
    }
    else if (!leftConfirmed && !rightConfirmed) {
        await mainMsg.channel.send("Both timed out! Winner chosen at random...");
        outsideFunction(1 + Math.floor(Math.random() * 2), pkg.outsidePkg);
    }

    if (saved_messages.get_message('duelMain', mainMsg.id) != null)
        cleanup(saved_messages.get_message('duelMain', mainMsg.id));
}


var generateDuelEncounter = async (msg, command, leftPlayerIDs, rightPlayerIDs, outsidePkg, outsideFunction) => {
    // Players + Create weapons/armor messages
    let leftPlayers = await generatePlayerInfos(leftPlayerIDs, msg);
    let rightPlayers = await generatePlayerInfos(rightPlayerIDs, msg);

    // Create summary message
    let mainMsg = await msg.channel.send({embeds: [generateEmbed(0, leftPlayers, rightPlayers)]});
    mainMsg.react('✅').catch(err => console.log(err));

    // Register messages
    registerPlayer = (player) => {
        saved_messages.add_message('duelPlayer', player.weapons.msg.id, mainMsg.id);
        saved_messages.add_message('duelPlayer', player.armors.msg.id, mainMsg.id);
    }

    leftPlayers.forEach(registerPlayer);
    rightPlayers.forEach(registerPlayer);

    let pkg = {hostID: msg.author.id, originalCommand: command, originalMsg: msg,
        leftPlayers: leftPlayers, rightPlayers: rightPlayers, challengerIDs: leftPlayerIDs, challengedIDs: rightPlayerIDs, msg: mainMsg, 
        outsidePkg: outsidePkg, outsideFunction: outsideFunction};

    saved_messages.add_message('duelMain', mainMsg.id, {hostID: msg.author.id, originalCommand: command, originalMsg: msg,
        leftPlayers: leftPlayers, rightPlayers: rightPlayers, challengerIDs: leftPlayerIDs, challengedIDs: rightPlayerIDs, msg: mainMsg, 
        outsidePkg: outsidePkg, outsideFunction: outsideFunction});

    decisionTimer(mainMsg, leftPlayers, rightPlayers, pkg, outsideFunction);

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
    let leftInstances = generatePlayers(pkg.leftPlayers);
    let rightInstances = generatePlayers(pkg.rightPlayers);

    // Battle
    let endgame = await generateBattle(true, leftInstances, rightInstances, msg, true, true);

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
        if (pkg.msg.id == msg.id)
            confirmDuelEncounter(reaction, user, pkg, added);
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
            updatedPkg = updateInventory(interaction, pkg.rightPlayers[rightPlayerIdx]);
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
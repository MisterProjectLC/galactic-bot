const saved_messages = require('../utils/saved_messages');
const Discord = require('discord.js');
const rewards = require('../systems/rewards');
const cooldownControl = require('../utils/cooldownControl');
const { delay } = require('../utils/delay.js');
const {capitalize} = require('../utils/capitalize');
const {randomInt} = require('../utils/randomInt');
const {generatePlayers, generateEnemy, generatePlayerInfos, generateBattle, updateInventory} = require('./encounterHelper');
const {deleteMessage} = require('../utils/deleteMessage');

var cleanup = (pkg, name) => {
    // Cleanup
    if (saved_messages.get_message(name+'Main', pkg.msg.id) != null) {
        pkg.players.forEach(player => {
            deleteMessage(player.weapons.msg, name+'Player');
            deleteMessage(player.armors.msg, name+'Player');
        });

        deleteMessage(pkg.msg, name+'Main');
    }
}


var generateEnemyEncounter = async (title, msg, command, playerIDs, enemyInfos) => {
    // Players + Create weapons/armor messages
    let players = await generatePlayerInfos(playerIDs, msg);

    // Embed
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(title + " - Enemy List")
    .setDescription("If the battle reaches the 8th round, the enemies win automatically.")
    .setFooter("Combatants: Press ✅ when ready\nHost: Press ❌ to cancel");

    // Enemies
    let r = randomInt(enemyInfos.length);
    let enemyInfosInGame = [enemyInfos[r]];
    enemyInfos.splice(r, 1);

    enemyInfosInGame.forEach(enemy => {
        embed = embed.addField(`**${enemy.title}**`, `HP: ${enemy.health}\nShields: ${enemy.shield}\nPlate: ${enemy.plate}
        Regen: ${enemy.regen}\nEvasion: ${enemy.evasion}\nDamage: ${enemy.damage_per_level*enemy.weapon_level}
        Attack Rate: ${enemy.rate} per turn\nEffect: ${enemy.effect_title != null ? capitalize(enemy.effect_title) : "None"}`, false);
    });

    // Create summary message
    let mainMsg = await msg.channel.send(embed);
    mainMsg.react('✅');
    mainMsg.react('❌');

    // Register messages
    players.forEach(player => {
        saved_messages.add_message(command.name+'Player', player.weapons.msg.id, mainMsg.id);
        saved_messages.add_message(command.name+'Player', player.armors.msg.id, mainMsg.id);
    });

    console.log(players);
    saved_messages.add_message(command.name+'Main', mainMsg.id, {hostID: msg.author.id, originalCommand: command, originalMsg: msg,
        players: players, enemies: enemyInfosInGame, msg: mainMsg});
    
    // Cleanup messages
    await delay(1000*command.cooldown);
    if (saved_messages.get_message(command.name+'Main', mainMsg.id) != null)
        cleanup(saved_messages.get_message(command.name+'Main', mainMsg.id), command.name);
};



var confirmEnemyEncounter = async (reaction, user, pkg, added, command) => {
    let msg = reaction.message;
    let emoji = reaction.emoji.toString();

    // Cancel encounter
    if (emoji === '❌' && user.id === pkg.hostID) {
        cleanup(pkg, command.name);
        cooldownControl.resetCooldown(pkg.originalCommand, pkg.originalMsg.author.id);
        return;
    }

    // Confirm encounter
    if (emoji !== '✅')
        return;
    
    let confirmed = true;
    pkg.players.forEach(player => {
        if (user.id == player.info.userid)
            player.confirmed = added;
            
        if (!player.confirmed)
            confirmed = false;
    });

    if (!confirmed)
        return;

    cleanup(pkg, command.name);

    // Player
    let playerInstances = generatePlayers(pkg.players);

    // Enemy
    let enemies = [];
    for (let i = 0; i < pkg.enemies.length; i++)
        enemies[i] = generateEnemy(pkg.enemies[i]);

    // Battle
    let endgame = await generateBattle(playerInstances, enemies, msg);
    if (endgame == 1) {
        let xpGained = pkg.enemies.reduce((previousValue, enemy) => {
            return previousValue += enemy.given_xp;
        }, 0);

        pkg.players.forEach(player => {
            rewards.giveXP(player.info.userid, xpGained, msg.channel);
        });
    }
}


var onReaction = async (reaction, user, added, command) => {
    let msg = reaction.message;
    let confirmID = msg.id;

    if (added == false)
        return;


    // Secondary index to main package (player -> package)
    let index = saved_messages.get_message(command.name + 'Player', msg.id);
    if (index)
        confirmID = index;

    // Main package - a single encounter
    let pkg = saved_messages.get_message(command.name + 'Main', confirmID);
    if (pkg) {
        let playerIdx = pkg.players.findIndex(player => {return player.info.userid == user.id});
        if (playerIdx == -1)
            return;

        // Weapon + Armor reaction
        let updatedPkg = updateInventory(reaction, user, pkg.players[playerIdx]);
        if (updatedPkg) {
            pkg.players[playerIdx] = updatedPkg;
            return;
        }
        
        // Confirm reaction
        if (pkg.msg.id == msg.id) {
            confirmEnemyEncounter(reaction, user, pkg, added, command);
            return;
        }
    }
}


module.exports = {
    generateEnemyEncounter: generateEnemyEncounter,
    onReaction: onReaction
}
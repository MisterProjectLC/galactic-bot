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
            if (player.weapons.msg)
                deleteMessage(player.weapons.msg, name+'Player');
            if (player.armors.msg)
                deleteMessage(player.armors.msg, name+'Player');
        });

        deleteMessage(pkg.msg, name+'Main');
    }
}

var generateEnemyEmbed = (title, maxEnemies, cancellable, enemyInfos, enemyInfosInGame) => {
    // Embed
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(title + " - Enemy List")
    .setDescription("Choose your weapons/armors in my private messages.\nIf the battle reaches the 9th round, the enemies win automatically.");


    let footer = "Choose your weapons/armors in your private messages\nCombatant(s): Press ✅ when ready";
    if (cancellable)
        footer += "\nHost: Press ❌ to cancel (WARNING: You don't regain your visits!)";
    if (maxEnemies > enemyInfosInGame.length && enemyInfos.length >= 1)
        footer += "\nHost: Press 🆙 to add an enemy";
    embed = embed.setFooter(footer);

    // Enemies
    enemyInfosInGame.forEach(enemy => {
        embed = embed.addField(`**${enemy.title}**`, `HP: ${enemy.health}\nShields: ${enemy.shield}\nPlate: ${enemy.plate}
        Regen: ${enemy.regen}\nEvasion: ${enemy.evasion}\nDamage: ${enemy.damage_per_level*enemy.weapon_level}
        Attack Rate: ${enemy.rate} per turn\nEffect: ${enemy.effect_title != null ? capitalize(enemy.effect_title) : "None"}`, 
            enemyInfosInGame.length > 3);
    });

    return embed;
}


var generateEnemyEncounter = async (title, msg, command, playerIDs, enemyInfos, cancellable, maxEnemies = 1, initialEnemies = 1) => {
    // Players + Create weapons/armor messages
    let players = await generatePlayerInfos(playerIDs, msg);

    // Enemies
    let enemyInfosInGame = [];
    for (let i = 0; i < initialEnemies; i++) {
        let r = randomInt(enemyInfos.length);
        enemyInfosInGame.push(enemyInfos[r]);
        enemyInfos.splice(r, 1);
    }

    // Create summary message
    let erred = false;
    let mainMsg = await msg.channel.send({embeds: [generateEnemyEmbed(title, maxEnemies, cancellable, enemyInfos, enemyInfosInGame)]});

    mainMsg.react('✅').catch(err => console.log(err));
    if (cancellable)
        mainMsg.react('❌').catch(err => console.log(err));

    if (maxEnemies > enemyInfosInGame.length && enemyInfos.length >= 1)
        mainMsg.react('🆙').catch(err => console.log(err));

    // Register messages
    players.forEach(player => {
        if (player.weapons.msg)
            saved_messages.add_message(command.name+'Player', player.weapons.msg.id, mainMsg.id);
        if (player.armors.msg)
        saved_messages.add_message(command.name+'Player', player.armors.msg.id, mainMsg.id);
    });

    saved_messages.add_message(command.name+'Main', mainMsg.id, {hostID: msg.author.id, originalCommand: command, originalMsg: msg, title: title,
        players: players, enemies: enemyInfosInGame, enemiesInReserve: enemyInfos, maxEnemies: maxEnemies, cancellable: cancellable, msg: mainMsg});
    
    // Cleanup messages
    await delay(1000*command.cooldown);
    if (saved_messages.get_message(command.name+'Main', mainMsg.id) != null)
        cleanup(saved_messages.get_message(command.name+'Main', mainMsg.id), command.name);
};



var updateEncounter = async (reaction, user, pkg, added, command) => {
    let msg = reaction.message;
    let emoji = reaction.emoji.toString();

    if (user.id === pkg.hostID) {
        // Add an enemy
        if (emoji === '🆙' && pkg.maxEnemies > pkg.enemies.length && pkg.enemiesInReserve.length >= 1) {
            // Enemies
            let r = randomInt(pkg.enemiesInReserve.length);
            pkg.enemies.push(pkg.enemiesInReserve[r]);
            pkg.enemiesInReserve.splice(r, 1);
            await pkg.msg.edit({embeds: [generateEnemyEmbed(pkg.title, pkg.maxEnemies, pkg.cancellable, pkg.enemiesInReserve, pkg.enemies)]});
            saved_messages.add_message(command.name+'Main', msg.id, pkg);

            if (!(pkg.maxEnemies > pkg.enemies.length && pkg.enemiesInReserve.length >= 1))
                pkg.msg.reactions.cache.get('🆙').remove().catch(error => console.error('Failed to remove reactions: ', error));
            const userReactions = msg.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
            try {
                for (const reaction of userReactions.values())
                    await reaction.users.remove(user.id);
            } catch (error) {
                console.error('Failed to remove reactions.');
            }
            return;
        }

        // Cancel encounter
        else if (emoji === '❌') {
            cleanup(pkg, command.name);
            cooldownControl.resetCooldown(pkg.originalCommand, pkg.originalMsg.author.id);
            return;
        }
    }

    // Confirm encounter
    if (emoji !== '✅')
        return;
    
    let confirmed = true;
    console.log(pkg.players);
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
    let endgame = await generateBattle(false, playerInstances, enemies, msg);
    if (endgame == 1) {
        let xpGained = pkg.enemies.reduce((previousValue, enemy) => {
            return previousValue += enemy.given_xp;
        }, 0);

        let coinsGained = pkg.enemies.reduce((previousValue, enemy) => {
            return previousValue += enemy.given_coins;
        }, 0);

        pkg.players.forEach(player => {
            rewards.giveXP(player.info.userid, xpGained, msg.channel, command);
            rewards.giveCoins(player.info.userid, coinsGained, msg.channel, command);
        });
    }
}


var onReaction = async (reaction, user, added, command) => {
    let msg = reaction.message;

    if (added == false)
        return;

    // Main package - a single encounter
    let pkg = saved_messages.get_message(command.name + 'Main', msg.id);
    if (pkg) {
        let playerIdx = pkg.players.findIndex(player => {return player.info.userid == user.id});
        if (playerIdx == -1)
            return;
        
        // Confirm reaction
        if (pkg.msg.id == msg.id) {
            updateEncounter(reaction, user, pkg, added, command);
            return;
        }
    }
}



var onInteraction = (interaction, command) => {
    let msg = interaction.message;
    let user = interaction.user;
    let confirmID = msg.id;

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
        let updatedPkg = updateInventory(interaction, pkg.players[playerIdx]);
        if (updatedPkg) {
            pkg.players[playerIdx] = updatedPkg;
            return;
        }
    }
}


module.exports = {
    generateEnemyEncounter: generateEnemyEncounter,
    onReaction: onReaction,
    onInteraction: onInteraction
}
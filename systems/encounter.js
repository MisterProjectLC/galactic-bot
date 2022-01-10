const db = require('../external/database.js');
const battle = require('../systems/battle');
const saved_messages = require('../utils/saved_messages');
const Discord = require('discord.js');
const rewards = require('../systems/rewards');
const cooldownControl = require('../utils/cooldownControl');
const { delay } = require('../utils/delay.js');
const {asyncForEach} = require('../utils/asyncForEach');
const {capitalize} = require('../utils/capitalize');

const emojiNumbers = ['0️⃣', '1️⃣', '2️⃣', '3️⃣'];//, '4️⃣']; 
                    //'5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

var generatePlayer = (player) => {
    player.armors.list.forEach(armor => {
        player.info.health += armor.health*armor.level;
        player.info.shield += armor.shield*armor.level;
        player.info.plate += armor.plate*armor.level;
        player.info.regen += armor.regen*armor.level;
        player.info.evasion += armor.evasion*armor.level;
    });

    return new battle.Fighter(player.info.title, player.info.image, player.info.health, player.info.shield, player.info.plate, 
        player.info.regen, player.info.evasion, player.weapons.list.map(weapon => {
            return new battle.Weapon(weapon.title, weapon.level*weapon.damage_per_level, weapon.rate, 
                battle.effects.get_effect(weapon.effect_title, weapon.level))
        })
    );
};


var generateEnemy = (enemy) => {
    return new battle.Fighter(enemy.title, enemy.image_link, enemy.health, enemy.shield, enemy.plate, enemy.regen, enemy.evasion, 
        [new battle.Weapon(enemy.weapon_title, enemy.damage_per_level*enemy.weapon_level, 
            enemy.rate, battle.effects.get_effect(enemy.effect_title, enemy.weapon_level))
        ]);
};


var generateBattle = async (combatantsA, combatantsB, msg) => {
    let instance = new battle.Battle(combatantsA, combatantsB); 
    return await instance.battle(msg.channel);
}


var generateEncounter = async (title, msg, command, playerIDs, enemyInfos) => {
    // Players + Create weapons/armor messages
    let players = [];
    await asyncForEach(playerIDs, async playerID => {
        let playerInfo = db.makeQuery(`SELECT * FROM ePlayers WHERE userid ilike $1`, [playerID]);
        let playerWeapons = db.makeQuery(`SELECT * FROM playersWeapons, eWeapons 
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND weapon_id = eWeapons.id`, [playerID]);
        let playerArmors = db.makeQuery(`SELECT * FROM playersArmors, eArmors
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND armor_id = eArmors.id`, [playerID]);

        playerInfo = (await playerInfo).rows[0];
        playerWeapons = (await playerWeapons).rows;
        playerArmors = (await playerArmors).rows;

        let weaponMsg = await buildListMessage(null, msg.channel, playerID, "Weapon List", "Choose 2 weapons:",
        playerWeapons, buildWeaponLine, 0, emojiNumbers.length);
        
        let armorMsg = await buildListMessage(null, msg.channel, playerID, "Armor List", "Choose 2 armors:",
        playerArmors, buildArmorLine, 0, emojiNumbers.length);

        players.push({info:playerInfo, 
            weapons:{list: playerWeapons, selected: [], msg: weaponMsg, page: 0}, 
            armors:{list: playerArmors, selected: [], msg: armorMsg, page: 0}
        });
    });

    // Enemy
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(title + " - Enemy List")
    .setFooter("Press ✅ when ready\nPress ❌ to cancel");

    enemyInfos.forEach(enemy => {
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
        saved_messages.add_message('encounterPlayer', player.weapons.msg.id, mainMsg.id);    
    });
    players.forEach(player => {
        saved_messages.add_message('encounterPlayer', player.armors.msg.id, mainMsg.id);
    });

    saved_messages.add_message('encounterMain', mainMsg.id, {callerID: msg.author.id, originalCommand: command, originalMsg: msg,
        players: players, enemies: enemyInfos, msg: mainMsg});
    
    // Cleanup messages
    await delay(1000*command.cooldown);
    if (saved_messages.get_message('encounterMain', mainMsg.id) != null) {
        players.forEach(player => {
            saved_messages.remove_message('encounterPlayer', player.weapons.msg.id);    
        });
        players.forEach(player => {
            saved_messages.remove_message('encounterPlayer', player.armors.msg.id); 
        });

        saved_messages.remove_message('encounterMain', mainMsg.id);
    }
};


var buildWeaponLine = (weapon) => {
    return `${weapon.damage_per_level*weapon.level} DMG, ${weapon.rate} attack(s) per turn, Effect: ${weapon.effect_title !== null ? capitalize(weapon.effect_title) : "None"}`;
}

var buildArmorLine = (armor) => {
    return `${armor.health*armor.level} HP, ${armor.shield*armor.level} Shields, ${armor.plate*armor.level} Plate, ` +
    `${armor.regen*armor.level} Regen, ${armor.evasion*armor.level} Evasion, Resistant to Effect: ${armor.effect_title !== null ? capitalize(armor.effect_title) : "None"}`;
}


var buildListMessage = async (msg, channel, playerID, title, description, list, lineBuilder, min, max, selected = []) => {
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`**${title}**`)
    .setDescription(`${description}`);

    if (msg === null) {
        msg = await channel.send(embed);
        msg.react('◀️');
        msg.react('▶️');

        for (let index = 0; index < emojiNumbers.length; index++)
            msg.react(emojiNumbers[index]);
    }
    
    // Reactions
    const userReactions = msg.reactions.cache.filter(reaction => reaction.users.cache.has(playerID));
    try {
        for (const reaction of userReactions.values()) {
            await reaction.users.remove(playerID);
        }
    } catch (error) {
        console.error('Failed to remove reactions.');
    }

    for (let index = Math.max(min, 0); index < Math.min(max, list.length); index++) {
        let selected_text = selected.includes(index) ? 'SELECTED' : '';
        embed = embed.addField(`${index}- ${list[index].title} [${list[index].level}] ${selected_text}`, lineBuilder(list[index]), false);
    }

    // Add message
    msg.edit(embed);
    return msg;
}


var onListReaction = (reaction, user, info, objectName, lineBuilder) => {
    let listTitle = `${capitalize(objectName)} List`;
    let listDescription = `Choose 2 ${objectName}s:`;

    // Turn pages
    let emoji = reaction.emoji.toString();
    if (emoji === "◀️" && info.page > 0)
        info.page -= 1;

    else if (emoji === "▶️" && info.page < Math.floor((info.list.length - 1)/emojiNumbers.length))
        info.page += 1;

    // Toggle weapon
    else if (emojiNumbers.includes(emoji)) {
        let objectNumber = info.page*emojiNumbers.length + emojiNumbers.lastIndexOf(emoji);
        if (info.list.length <= objectNumber)
            return info;

        let selectedIndex = info.selected.lastIndexOf(info.page*emojiNumbers.length + objectNumber);
        if (selectedIndex == -1) {
            if (info.selected.length < 2)
                info.selected.push(info.page*emojiNumbers.length + objectNumber);
            else
                list_description = `You already have 2 ${objectName}s selected!`;
        } else
            info.selected.splice(selectedIndex, 1);
    }
     
    // Update embed
    buildListMessage(info.msg, info.msg.channel, user.id, listTitle, listDescription,
                    info.list, lineBuilder, info.page*emojiNumbers.length, info.page*emojiNumbers.length + emojiNumbers.length, info.selected);
    return info;
}


var confirmReaction = async (reaction, pkg) => {
    let msg = reaction.message;
    let emoji = reaction.emoji.toString();

    if (emoji !== '✅' && emoji !== '❌')
        return;

    // Cleanup
    if (saved_messages.get_message('encounterMain', pkg.msg.id) != null) {
        pkg.players.forEach(player => {
            player.weapons.msg.delete().catch((err) => console.log('Could not delete the message', err));
            saved_messages.remove_message('encounterPlayer', player.weapons.msg.id);
        });

        pkg.players.forEach(player => {
            player.armors.msg.delete().catch((err) => console.log('Could not delete the message', err));
            saved_messages.remove_message('encounterPlayer', player.armors.msg.id);
        });

        pkg.msg.delete().catch((err) => console.log('Could not delete the message', err));
        saved_messages.remove_message('encounterMain', pkg.msg.id);
    }

    // Cancel encounter
    if (emoji === '❌') {
        cooldownControl.resetCooldown(pkg.originalCommand, pkg.originalMsg.author.id);
        return;
    }

    // Player
    let playerInstances = [];
    pkg.players.forEach(player => {
        player.weapons.list = player.weapons.list.filter((element, index) => {
            return player.weapons.selected.includes(index);
        });
        player.armors.list = player.armors.list.filter((element, index) => {
            return player.armors.selected.includes(index);
        });
    
        playerInstances.push(generatePlayer(player));
    });

    // Enemy
    let enemies = [];
    for (let i = 0; i < pkg.enemies.length; i++)
        enemies[i] = generateEnemy(pkg.enemies[i]);

    // Battle
    let combatantA_won = await generateBattle(playerInstances, enemies, msg);
    if (combatantA_won) {
        let xpGained = pkg.enemies.reduce((previousValue, enemy) => {
            return previousValue += enemy.given_xp;
        }, 0);

        rewards.giveXP(pkg.callerID, xpGained, pkg.originalMsg);
    }
}


var onReaction = async (reaction, user, added) => {
    let msg = reaction.message;
    let confirm_id = msg.id;

    if (!added)
        return;

    // Secondary index to main package (player -> package)
    let index = saved_messages.get_message('encounterPlayer', msg.id);
    if (index) {
        confirm_id = index;
    }

    // Main package - a single encounter
    let pkg = saved_messages.get_message('encounterMain', confirm_id);
    if (pkg) {
        let playerIdx = pkg.players.findIndex(player => { return player.info.userid == user.id});
        if (playerIdx == -1)
            return;

        // Weapon reaction
        if (pkg.players[playerIdx].weapons.msg.id == msg.id) {
            pkg.players[playerIdx].weapons = onListReaction(reaction, user, pkg.players[playerIdx].weapons, 'weapon', buildWeaponLine);
            return;
        }

        // Armor reaction
        if (pkg.players[playerIdx].armors.msg.id == msg.id) {
            pkg.players[playerIdx].armors = onListReaction(reaction, user, pkg.players[playerIdx].armors, 'armor', buildArmorLine);
            return;
        }
        
        // Confirm reaction
        if (pkg.msg.id == msg.id) {
            confirmReaction(reaction, pkg);
            return;
        }
    }
}



module.exports = {
    generatePlayer: generatePlayer,
    generateEnemy: generateEnemy,
    generateBattle: generateBattle,
    generateEncounter: generateEncounter,
    onReaction: onReaction
}
const db = require('../external/database.js');
const Discord = require('discord.js');
const {asyncForEach} = require('../utils/asyncForEach');
const battle = require('../systems/battle');
const {capitalize} = require('../utils/capitalize');
//const saved_messages = require('../utils/saved_messages');

const emojiNumbers = ['🇦','🇧','🇨'];
const letters = ['A', 'B', 'C'];


let generatePlayer = (player) => {
    player.armors.list.forEach(armor => {
        player.info.health += armor.health*armor.level;
        player.info.shield += armor.shield*armor.level;
        player.info.plate += armor.plate*armor.level;
        player.info.regen += armor.regen*armor.level;
        player.info.evasion += armor.evasion*armor.level;
    });

    return new battle.Fighter(player.info.title, player.info.imageurl, player.info.health, player.info.shield, player.info.plate, 
        player.info.regen, player.info.evasion, player.weapons.list.map(weapon => {
            return new battle.Weapon(weapon.title, weapon.level*weapon.damage_per_level, weapon.rate, 
                battle.effects.get_effect(weapon.effect_title, weapon.level))
        })
    );
};


let buildWeaponLine = (weapon) => {
    return `${weapon.damage_per_level*weapon.level} DMG, ${weapon.rate} attack(s) per turn, Effect: ${weapon.effect_title !== null ? 
        capitalize(weapon.effect_title) : "None"}`;
};

let buildArmorLine = (armor) => {
    return `${armor.health*armor.level} HP, ${armor.shield*armor.level} Shields, ${armor.plate*armor.level} Plate, ` +
    `${armor.regen*armor.level} Regen, ${armor.evasion*armor.level} Evasion, Resistant to Effect: ${armor.effect_title !== null ? 
        capitalize(armor.effect_title) : "None"}`;
};

let buildListMessage = async (msg, channel, playerID, playerTitle, title, description, list, lineBuilder, min, max, selected = []) => {
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`**${playerTitle} - ${title}**`)
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
        for (const reaction of userReactions.values())
            await reaction.users.remove(playerID);
    } catch (error) {
        console.error('Failed to remove reactions.');
    }

    for (let index = Math.max(min, 0); index < Math.min(max, list.length); index++) {
        let selected_text = selected.includes(index) ? 'SELECTED' : '';
        embed = embed.addField(`${letters[index % letters.length]}${index+1}- ${list[index].title} [${list[index].level}] ${selected_text}`, 
        lineBuilder(list[index]), false);
    }

    // Add message
    msg.edit(embed);
    return msg;
};


let onListReaction = (reaction, user, info, playerTitle, objectName, lineBuilder) => {
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

        let selectedIndex = info.selected.lastIndexOf(objectNumber);
        if (selectedIndex == -1) {
            if (info.selected.length < 2)
                info.selected.push(objectNumber);
            else
                list_description = `You already have 2 ${objectName}s selected!`;
        } else
            info.selected.splice(selectedIndex, 1);
    }
     
    // Update embed
    buildListMessage(info.msg, info.msg.channel, user.id, playerTitle, listTitle, listDescription,
                    info.list, lineBuilder, info.page*emojiNumbers.length, info.page*emojiNumbers.length + emojiNumbers.length, info.selected);
    return info;
};


module.exports = {
    generatePlayers: (playerInfos) => {
        let instances = [];
        playerInfos.forEach(player => {
            player.weapons.list = player.weapons.list.filter((element, index) => {
                return player.weapons.selected.includes(index);
            });
            player.armors.list = player.armors.list.filter((element, index) => {
                return player.armors.selected.includes(index);
            });
        
            instances.push(generatePlayer(player));
        });
    
        return instances;
    },

    generatePlayerInfos: async (playerIDs, msg) => {
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
    
            let weaponMsg = await buildListMessage(null, msg.channel, playerID, playerInfo.title, "Weapon List", "Choose 2 weapons:",
            playerWeapons, buildWeaponLine, 0, emojiNumbers.length);
            
            let armorMsg = await buildListMessage(null, msg.channel, playerID, playerInfo.title, "Armor List", "Choose 2 armors:",
            playerArmors, buildArmorLine, 0, emojiNumbers.length);
    
            players.push({info:playerInfo, confirmed: false,
                weapons:{list: playerWeapons, selected: [], msg: weaponMsg, page: 0}, 
                armors:{list: playerArmors, selected: [], msg: armorMsg, page: 0}
            });
        });
    
        return players;
    },
    
    generateEnemy: (enemy) => {
        return new battle.Fighter(enemy.title, enemy.image_link, enemy.health, enemy.shield, enemy.plate, enemy.regen, enemy.evasion, 
            [new battle.Weapon(enemy.weapon_title, enemy.damage_per_level*enemy.weapon_level, 
                enemy.rate, battle.effects.get_effect(enemy.effect_title, enemy.weapon_level))
            ]);
    },
    
    generateBattle: async (combatantsA, combatantsB, msg, leftArePlayers = true, rightArePlayers = false) => {
        return await new battle.Battle(msg.channel, combatantsA, combatantsB, leftArePlayers, rightArePlayers).battle();
    },

    updateInventory: (reaction, user, playerRef) => {
        let msg = reaction.message;

        // Weapon + Armor reaction
        if (playerRef.weapons.msg.id == msg.id)
            playerRef.weapons = onListReaction(reaction, user, playerRef.weapons, playerRef.info.title, 'weapon', buildWeaponLine);
        else if (playerRef.armors.msg.id == msg.id)
            playerRef.armors = onListReaction(reaction, user, playerRef.armors, playerRef.info.title, 'armor', buildArmorLine);
        else
            return null;
    
        return playerRef;
    }
}
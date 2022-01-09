const db = require('../external/database.js');
const battle = require('../systems/battle');
const saved_messages = require('../utils/saved_messages');
const Discord = require('discord.js');
const rewards = require('../systems/rewards');
const cooldownControl = require('../utils/cooldownControl');
const { delay } = require('../utils/delay.js');


const emojiNumbers = ['0️⃣', '1️⃣', '2️⃣', '3️⃣'];//, '4️⃣']; 
                    //'5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

var generatePlayer = (player, player_weapons, player_armors) => {
    player_armors.forEach(armor => {
        player.health += armor.health*armor.level;
        player.shield += armor.shield*armor.level;
        player.plate += armor.plate*armor.level;
        player.regen += armor.regen*armor.level;
        player.evasion += armor.evasion*armor.level;
    });

    return new battle.Fighter(player.title, player.health, player.shield, player.plate, player.regen, player.evasion, 
        player_weapons.map(player_weapon => {
            return new battle.Weapon(player_weapon.title, player_weapon.level*player_weapon.damage_per_level, player_weapon.rate, 
                battle.effects.get_effect(player_weapon.effect_title, player_weapon.level))
        })
    );
};


var generateEnemy = (enemy) => {
    return new battle.Fighter(enemy.title, enemy.health, enemy.shield, enemy.plate, enemy.regen, enemy.evasion, 
        [new battle.Weapon(enemy.weapon_title, enemy.damage_per_level*enemy.weapon_level, 
            enemy.rate, battle.effects.get_effect(enemy.effect_title, enemy.weapon_level))
        ]);
};


var generateBattle = async (combatantsA, combatantsB, msg) => {
    let instance = new battle.Battle(combatantsA, combatantsB); 

    let battle_status = await msg.channel.send(instance.update_battle_status());
    let battle_log = await msg.channel.send(`**--BATTLE LOG--**`);
    return await instance.battle(battle_status, battle_log);
}


var buildWeaponLine = (weapon) => {
    return `${weapon.damage_per_level*weapon.level} DMG, ${weapon.rate} attack(s) per turn, Effect: ${weapon.effect_title !== null ? weapon.effect_title : "None"}`;
}

var buildArmorLine = (armor) => {
    return `${armor.health*armor.level} HP, ${armor.shield*armor.level} Shields, ${armor.plate*armor.level} Plate, ` +
    `${armor.regen*armor.level} Regen, ${armor.evasion*armor.level} Evasion, Resistant to Effect: ${armor.effect_title !== null ? armor.effect_title : "None"}`;
}


var buildListMessage = async (msg, channel, requester_id, title, description, list, lineBuilder, min, max, selected = []) => {
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
    const userReactions = msg.reactions.cache.filter(reaction => reaction.users.cache.has(requester_id));
    try {
        for (const reaction of userReactions.values()) {
            await reaction.users.remove(requester_id);
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


var generateEncounter = async (title, msg, enemy_infos, command) => {
    // Player
    let result = await db.makeQuery(`SELECT * FROM ePlayers WHERE userid ilike $1`, [msg.author.id]);
    let player = result.rows[0];
    player.title = msg.member.displayName;

    let weapon_result = db.makeQuery(`SELECT * FROM playersWeapons, eWeapons 
    WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND weapon_id = eWeapons.id`, [msg.author.id]);
    let armor_result = db.makeQuery(`SELECT * FROM playersArmors, eArmors
    WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND armor_id = eArmors.id`, [msg.author.id]);

    let player_weapons = (await weapon_result).rows;
    let player_armors = (await armor_result).rows;

    let weapon_msg = await buildListMessage(null, msg.channel, msg.author.id, "Weapon List", "Choose 2 weapons:", player_weapons, buildWeaponLine, 0, emojiNumbers.length);
    let armor_msg = await buildListMessage(null, msg.channel, msg.author.id, "Armor List", "Choose 2 armors:", player_armors, buildArmorLine, 0, emojiNumbers.length);
    await Promise.all([weapon_msg, armor_msg]);

    // Enemy
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(title + " - Enemy List")
    .setFooter("Press ✅ when ready\nPress ❌ to cancel");
    enemy_infos.forEach(enemy => {
        embed = embed.addField(`**${enemy.title}**`, `HP: ${enemy.health}\nShields: ${enemy.shield}\nPlate: ${enemy.plate}
        Regen: ${enemy.regen}\nEvasion: ${enemy.evasion}\nDamage: ${enemy.damage_per_level*enemy.weapon_level}
        Attack Rate: ${enemy.rate} per turn\nEffect: ${enemy.effect_title != null ? enemy.effect_title : "None"}`, false);
    });
    let main_msg = await msg.channel.send(embed);
    main_msg.react('✅');
    main_msg.react('❌');

    // Register messages
    saved_messages.add_message('encounterSetup', weapon_msg.id, main_msg.id);
    saved_messages.add_message('encounterSetup', armor_msg.id, main_msg.id);
    saved_messages.add_message('encounterConfirm', main_msg.id, {caller_id: msg.author.id, original_command: command, original_msg: msg, removed: false,
                                                    player: player, enemies: enemy_infos, msg: main_msg,
                                                    weapon_info: {list: player_weapons, selected: [], msg: weapon_msg, page: 0},
                                                    armor_info: {list:player_armors, selected: [], msg: armor_msg, page: 0}});
    
    //await delay(1000*command.cooldown);
    await delay(1000*command.cooldown);
    if (saved_messages.get_message('encounterConfirm', main_msg.id) != null || !saved_messages.get_message('encounterConfirm', main_msg.id).removed) {
        saved_messages.remove_message('encounterSetup', weapon_msg.id);
        weapon_msg.delete();
        saved_messages.remove_message('encounterSetup', armor_msg.id);
        armor_msg.delete();
        saved_messages.remove_message('encounterConfirm', main_msg.id);
        main_msg.delete();
    }
};


var onListReaction = (reaction, user, info, objectName, lineBuilder) => {
    let list_title = `${objectName.charAt(0).toUpperCase() + objectName.slice(1)} List`;
    let list_description = `Choose 2 ${objectName}s:`;

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
    buildListMessage(info.msg, info.msg.channel, user.id, list_title, list_description,
                    info.list, lineBuilder, info.page*emojiNumbers.length, info.page*emojiNumbers.length + emojiNumbers.length, info.selected);
    return info;
}


var confirmReaction = async (reaction, pkg) => {
    let msg = reaction.message;
    let emoji = reaction.emoji.toString();

    if (emoji !== '✅' && emoji !== '❌')
        return;

    if (emoji === '❌') {
        cooldownControl.resetCooldown(pkg.original_command, pkg.original_msg.author.id);
        return;
    }

    // Player
    let player_weapons = pkg.weapon_info.list.filter((element, index) => {
        return pkg.weapon_info.selected.includes(index);
    });
    let player_armors = pkg.armor_info.list.filter((element, index) => {
        return pkg.armor_info.selected.includes(index);
    });

    let player_instance = generatePlayer(pkg.player, player_weapons, player_armors);

    // Enemy
    let enemies = [];
    for (let i = 0; i < pkg.enemies.length; i++)
        enemies[i] = generateEnemy(pkg.enemies[i]);

    // Battle
    let combatantA_won = await generateBattle([player_instance], enemies, msg);
    if (combatantA_won) {
        let xp_gained = pkg.enemies.reduce((previousValue, enemy) => {
            return previousValue += enemy.given_xp;
        }, 0);

        rewards.giveXP(pkg.caller_id, xp_gained, pkg.original_msg);
    }

    // Cleanup
    pkg.removed = true;
    saved_messages.add_message('encounterConfirm', pkg.msg.id, pkg);
    saved_messages.remove_message('encounterSetup', pkg.weapon_info.msg.id);
    saved_messages.remove_message('encounterSetup', pkg.armor_info.msg.id);
    saved_messages.remove_message('encounterConfirm', pkg.msg.id);
}


var onReaction = async (reaction, user) => {
    let msg = reaction.message;
    let confirm_id = msg.id;

    let index = saved_messages.get_message('encounterSetup', msg.id);
    if (index) {
        confirm_id = index;
    }

    let pkg = saved_messages.get_message('encounterConfirm', confirm_id);
    if (pkg) {
        if (pkg.removed || user.id != pkg.caller_id)
            return;

        if (pkg.weapon_info.msg.id == msg.id)
            pkg.weapon_info = onListReaction(reaction, user, pkg.weapon_info, 'weapon', buildWeaponLine);
        else if (pkg.armor_info.msg.id == msg.id)
            pkg.armor_info = onListReaction(reaction, user, pkg.armor_info, 'armor', buildArmorLine);
        else if (pkg.msg.id == msg.id)
            confirmReaction(reaction, pkg);
    }
}



module.exports = {
    generatePlayer: generatePlayer,
    generateEnemy: generateEnemy,
    generateBattle: generateBattle,
    generateEncounter: generateEncounter,
    onReaction: onReaction
}
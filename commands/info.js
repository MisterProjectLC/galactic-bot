const db = require('../external/database.js');
const errors = require('../data/errors');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');
const {removeReactions} = require('../utils/removeReactions');

const ITENS_PER_VIEWING = 6;

var buildWeaponLine = (weapon) => {
    return `${weapon.damage_per_level*weapon.level} DMG, ${weapon.rate} attack(s) per turn, Effect: ${weapon.effect_title !== null ? weapon.effect_title : "None"}`;
}

var buildArmorLine = (armor) => {
    return `${armor.health*armor.level} HP, ${armor.shield*armor.level} Shields, ${armor.plate*armor.level} Plate, ` +
    `${armor.regen*armor.level} Regen, ${armor.evasion*armor.level} Evasion, Resistant to Effect: ${armor.effect_title !== null ? armor.effect_title : "None"}`;
}

var buildListMessage = async (msg, channel, requester_id, title, description, list, lineBuilder, min, max) => {
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`**${title}**`)
    .setDescription(`${description}`);

    if (msg === null) {
        msg = await channel.send(embed);
        msg.react('◀️');
        msg.react('▶️');
    }
    
    // Reactions
    await removeReactions(msg, requester_id);

    for (let index = Math.max(min, 0); index < Math.min(max, list.length); index++) {
        embed = embed.addField(`${list[index].title} [${list[index].level}]`, lineBuilder(list[index]), false);
    }

    // Add message
    msg.edit(embed);
    return msg;
}

var onListReaction = (reaction, user, info, objectName, lineBuilder) => {
    let list_title = `${objectName.charAt(0).toUpperCase() + objectName.slice(1)} List`;
    let list_description = `${ITENS_PER_VIEWING} per page`;

    // Turn pages
    let emoji = reaction.emoji.toString();
    if (emoji === "◀️" && info.page > 0)
        info.page -= 1;

    else if (emoji === "▶️" && info.page < Math.floor((info.list.length - 1)/ITENS_PER_VIEWING))
        info.page += 1;
     
    // Update embed
    buildListMessage(info.msg, info.msg.channel, user.id, list_title, list_description,
                    info.list, lineBuilder, info.page*ITENS_PER_VIEWING, info.page*ITENS_PER_VIEWING + ITENS_PER_VIEWING);
    return info;
}

// Exports
module.exports = {
    name: "info",
    category: "General",
    description: "Check your stats, items and character.", 
    min: 0, max: 0, cooldown: 5,
    execute: async (com_args, msg) => {
        let response = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [msg.author.id]);
        let player = response.rows[0];
        if (response.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }
        
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(player.title)
        .setThumbnail(msg.author.avatarURL())
        .addField('Level', player.level, true)
        .addField('XP', player.xp, true)
        .addField('Coins', player.coins, true);

        msg.reply(embed);

        let weapon_result = db.makeQuery(`SELECT * FROM playersWeapons, eWeapons 
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND weapon_id = eWeapons.id`, [msg.author.id]);
        let armor_result = db.makeQuery(`SELECT * FROM playersArmors, eArmors
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND armor_id = eArmors.id`, [msg.author.id]);

        let player_weapons = (await weapon_result).rows;
        let player_armors = (await armor_result).rows;

        console.log(player_weapons.length);
        console.log(player_armors.length);

        let weapon_msg = await buildListMessage(null, msg.channel, msg.author.id, "Weapon List", `${ITENS_PER_VIEWING} per page`, 
                                    player_weapons, buildWeaponLine, 0, ITENS_PER_VIEWING);
        let armor_msg = await buildListMessage(null, msg.channel, msg.author.id, "Armor List", `${ITENS_PER_VIEWING} per page`, 
                                    player_armors, buildArmorLine, 0, ITENS_PER_VIEWING);

        saved_messages.add_message('checkPageTurn', weapon_msg.id, {caller_id: msg.author.id,
            weapon_info: {list: player_weapons, msg: weapon_msg, page: 0}});
        saved_messages.add_message('checkPageTurn', armor_msg.id, {caller_id: msg.author.id,
            armor_info: {list:player_armors, selected: [], msg: armor_msg, page: 0}});
    },

    permission: (msg) => true,
    reaction: (reaction, user) => {
        let msg = reaction.message;

        let pkg = saved_messages.get_message('checkPageTurn', msg.id);
        if (pkg) {
            if (user.id != pkg.caller_id)
                return;

            if (pkg.weapon_info)
                pkg.weapon_info = onListReaction(reaction, user, pkg.weapon_info, 'weapon', buildWeaponLine);
            else if (pkg.armor_info)
                pkg.armor_info = onListReaction(reaction, user, pkg.armor_info, 'armor', buildArmorLine);
        }
    }
};

const db = require('../external/database.js');
const errors = require('../data/errors');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');
const {removeReactions} = require('../utils/removeReactions');
const {capitalize} = require('../utils/capitalize');
const {xpThreshold} = require('../systems/rewards');
const {isValid} = require('../systems/autoDeleter');
const {getUserIDFromMention} = require('../utils/getUserIDFromMention');

const ITENS_PER_VIEWING = 6;

var buildWeaponLine = (weapon) => {
    return `${weapon.damage_per_level*weapon.level} DMG, ${weapon.rate} attack(s) per turn, Effect: ${weapon.effect_title !== null ? capitalize(weapon.effect_title) : "None"}`;
}

var buildArmorLine = (armor) => {
    return `${armor.health*armor.level} HP, ${armor.shield*armor.level} Shields, ${armor.plate*armor.level} Plate, ` +
    `${armor.regen*armor.level} Regen, ${armor.evasion*armor.level} Evasion, Resistant to Effect: ${armor.effect_title !== null ? capitalize(armor.effect_title) : "None"}`;
}

var buildListMessage = async (msg, channel, requester_id, title, description, list, lineBuilder, min, max) => {
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`**${title}**`)
    .setDescription(`${description}`);

    if (msg === null) {
        msg = await channel.send({ embeds: [embed] });
        msg.react('◀️');
        msg.react('▶️');
    }
    
    // Reactions
    await removeReactions(msg, requester_id);

    for (let index = Math.max(min, 0); index < Math.min(max, list.length); index++) {
        embed = embed.addField(`${list[index].title} [${list[index].level}]`, lineBuilder(list[index]), false);
    }

    // Add message
    msg.edit({ embeds: [embed] });
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
    examples: ["#info: check your own stats and items.", "#info @User: check the mentioned user's stats and items."],
    min: 0, max: 1, cooldown: 5,
    execute: async (com_args, msg) => {
        let userid = msg.author.id;

        if (com_args.length > 0) {
            userid = getUserIDFromMention(com_args[0]);
            if (userid === null) {
                msg.reply("Couldn't find the mentioned player...");
                msg.reply(errors.helpFormatting(module.exports));
                return;
            }
        }

        let response = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [userid]);
        let player = response.rows[0];
        if (response.rowCount < 1) {
            if (com_args.length > 0) {
                msg.reply("Couldn't find the mentioned player...");
                msg.reply(errors.helpFormatting(module.exports));
            } else
                msg.reply(errors.unregisteredPlayer);
            return;
        }
        
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(player.title)
        .setThumbnail(player.imageurl)
        .addField('Level', `${player.level}`, true)
        .addField('XP', `${player.xp}/${xpThreshold(player.level)}`, true)
        .addField('Coins', `${player.coins}`, true)
        .addField('Coinboxes', `${player.coinboxes}`, true)
        .addField('Spaceboxes', `${player.spaceboxes}`, true);

        msg.reply({ embeds: [embed] });

        // REMOVE THIS ---------------------------------------------------
        //db.makeQuery(`UPDATE players SET victory_time = to_timestamp($2/1000.0) WHERE userid = $1`, [msg.author.id, (new Date().getTime())]);

        let weapon_result = db.makeQuery(`SELECT * FROM playersWeapons, eWeapons 
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND weapon_id = eWeapons.id`, [userid]);
        let armor_result = db.makeQuery(`SELECT * FROM playersArmors, eArmors
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND armor_id = eArmors.id`, [userid]);

        let player_weapons = (await weapon_result).rows;
        let player_armors = (await armor_result).rows;

        
        if (player_weapons.length > 0) {
        let weapon_msg = await buildListMessage(null, msg.channel, msg.author.id, "Weapon List", `${ITENS_PER_VIEWING} per page`, 
                                    player_weapons, buildWeaponLine, 0, ITENS_PER_VIEWING);
        saved_messages.add_message('checkPageTurn', weapon_msg.id, {caller_id: msg.author.id,
                                        weapon_info: {list: player_weapons, msg: weapon_msg, page: 0}});
        } else {
            let embed = new Discord.MessageEmbed()
            .setColor(0x1d51cc)
            .setTitle(`Weapon List`)
            .setDescription(`You don't have any weapons! Go to the shop and get some!`);
            msg.channel.send({ embeds: [embed] });
        }
        
        if (player_armors.length > 0) {
            let armor_msg = await buildListMessage(null, msg.channel, msg.author.id, "Armor List", `${ITENS_PER_VIEWING} per page`, 
                                        player_armors, buildArmorLine, 0, ITENS_PER_VIEWING);
            saved_messages.add_message('checkPageTurn', armor_msg.id, {caller_id: msg.author.id,
                armor_info: {list:player_armors, selected: [], msg: armor_msg, page: 0}});
        } else {
            let embed = new Discord.MessageEmbed()
            .setColor(0x1d51cc)
            .setTitle(`Armor List`)
            .setDescription(`You don't have any armors! Go to the shop and get some!`);
            msg.channel.send({ embeds: [embed] });
        }
    },

    permission: async (msg) => true,
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

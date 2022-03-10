const saved_messages = require('../utils/saved_messages');
const db = require('../external/database.js');
const encounter = require('../systems/enemyEncounter');
const {delay} = require('../utils/delay');
const {deleteMessage} = require('../utils/deleteMessage');
const Discord = require('discord.js');

const BATTLE_SIZE = 8;

var createPartyEmbed = async (members, unorderedRows, partySize, minLevel) => {
    let titles = [];
    members.forEach(member => {
        titles.push(unorderedRows.find(row => {
            return row.userid == member;
        }).title);
    });
    
    let embed = new Discord.MessageEmbed()
    .setColor(0x1d51cc)
    .setTitle(`Defense Party - Recommended Level: ${minLevel}`)
    .setDescription(`This team will only go when all ${BATTLE_SIZE} players join!`)
    .setFooter("Press ✅ to join the party. Press it again to leave.");

    let memberList = '';
    for (let i = 0; i < partySize; i++)
        memberList += `${i+1}. ${titles.length > i ? titles[i] : ""}\n`;
        
    embed = embed.addField('Members', memberList, false);

    return embed;
}


// Exports
module.exports = {
    name: "spaceshipAttack",
    nicknames: ["spaceship", "attack"],
    category: "Event",
    description: "Admin only. Begins a Spaceship Attack Event.", 
    details: ["Every 15 minutes, a new wave appears, increasing in difficulty.",
    `Waves consist of ${BATTLE_SIZE} players vs ${BATTLE_SIZE} enemies battles, and only start when all ${BATTLE_SIZE} slots are filled.`],
    min: 0, max: 0, cooldown: 900,
    execute: async (com_args, msg) => {
        let adventureList = (await db.makeQuery(`SELECT * FROM adventures`)).rows;

        // Introduction
        let introEmbed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`Attention, all travelers!`)
        .setDescription(`The spaceship hull HAS BEEN BREACHED. Today, every 15 minutes, a wave of increasingly stronger enemies will enter into the breach and try to attack us! Stop them!`);
        await msg.channel.send({embeds: [introEmbed]});

        // Each adventure
        for (let i = 0; i < adventureList.length; i++) {
            result = await db.makeQuery(`SELECT * FROM eEnemies JOIN enemiesAdventures ON eEnemies.id = enemiesAdventures.enemy_id 
            WHERE enemiesAdventures.adventure_id = $1`, [adventureList[i].id]);

            // Create party
            let partyEmbed = await createPartyEmbed([], result.rows, BATTLE_SIZE, adventureList[i].min_level);
            let m = await msg.channel.send({embeds: [partyEmbed]});
            let this_id = m.id;
            m.react('✅');
            saved_messages.add_message('defenseParty', this_id, {members: [], msg: m, adventure: adventureList[i]});

            await delay(1000 * 60 * 15);
            let time_awaiting = 2;
            while (saved_messages.get_message('defenseParty', this_id) != null) {
                let ms = await msg.channel.send("The next wave can't be fought until this one is dealt with!");
                await delay(1000 * 60 * time_awaiting);
                time_awaiting += 2;
                ms.delete().catch(err => console.log(err));
            }
        }


        let endingEmbed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`The invasion is over!`)
        .setDescription(`The breach has been closed! Thanks to all who helped defend it!`);
        await msg.channel.send({embeds: [endingEmbed]});
    },

    reaction: async (reaction, user, added) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        encounter.onReaction(reaction, user, added, module.exports);

        let pkg = saved_messages.get_message('defenseParty', msg.id);
        if (!pkg)
            return;

        if (emoji !== '✅')
            return;
        
        // Modify
        if (added) {
            if (pkg.members.length < BATTLE_SIZE)
                pkg.members.push(user.id);
            else
                await removeReactions(msg, user.id);
        } else if (pkg.members.includes(user.id))
            pkg.members.splice(pkg.members.indexOf(user.id), 1);
        else
            return;

        // Start battle
        if (pkg.members.length == BATTLE_SIZE) {
            deleteMessage(msg, 'defenseParty');
            let result = await db.makeQuery(`SELECT * FROM eEnemies JOIN enemiesAdventures ON eEnemies.id = enemiesAdventures.enemy_id 
            WHERE enemiesAdventures.adventure_id = $1`, [pkg.adventure.id]);
            let enemyList = [];
            for (let i = 0; i < (BATTLE_SIZE/3)+1; i++)
                result.rows.forEach(row => enemyList.push(row));
            await encounter.generateEnemyEncounter(pkg.adventure.title.substring(0, pkg.adventure.title.length-10) + " Invasion", msg, 
                module.exports, pkg.members, enemyList, false, BATTLE_SIZE, BATTLE_SIZE);
        }
        
        // Update
        else {
            console.log("Update");
            let result = await db.makeQuery('SELECT title, userid FROM players WHERE userid = ANY($1)', [pkg.members]);
            msg.edit({embeds: [await createPartyEmbed(pkg.members, result.rows, BATTLE_SIZE, pkg.adventure.min_level )] });
            saved_messages.add_message('defenseParty', msg.id, pkg);
        }
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder"),
    interaction: (interaction) => {
        encounter.onInteraction(interaction, module.exports);
    },
};
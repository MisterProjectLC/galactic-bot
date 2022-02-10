const db = require('../external/database.js');
const {timedReward} = require('../systems/timedReward');
const {isValid} = require('../systems/autoDeleter');
const fixedMessage = require('../utils/fixedMessage');
const Discord = require('discord.js');
const saved_messages = require('../utils/saved_messages');

// Exports
module.exports = {
    name: "rewardsMessage",
    category: "Rewards",
    description: "Admin only. Send a message with interactions to collect the daily or weekly reward.", 
    min: 0, max: 0, cooldown: 0,
    execute: async (com_args, msg) => {
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`Rewards`)
        .setDescription(`Gain timed rewards from the Space Club!`)
        .setFooter(`Press 🇩 to reclaim your daily reward\nPress 🇼 to reclaim your weekly reward`);
        let row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
            .setCustomId('daily')
            .setLabel('🇩')
            .setStyle('PRIMARY'),
        )
        .addComponents(
            new Discord.MessageButton()
            .setCustomId('weekly')
            .setLabel('🇼')
            .setStyle('PRIMARY'),
        );

        let oldMsgExists = await fixedMessage.deleteOldMessage(msg, 'rewardsMessage');
        let m = await msg.channel.send({embeds: [embed], components: [row]});
        msg.delete().catch(err => console.log(err));
        fixedMessage.updateFixedMessage(oldMsgExists, m, 'rewardsMessage');
        
        saved_messages.add_message('rewardsMessage', m.id, {msg: m});
    },

    interaction: (interaction) => {
        let msg = interaction.message;
        let user = interaction.user;
        let member = interaction.member;

        let customId = interaction.customId;
        if (customId === "daily") {
            timedReward('next_daily', 100, 24, user, member, msg.channel);
        }
        else if (customId === "weekly") {
            timedReward('next_weekly', 500, 24*7, user, member, msg.channel);
        }
        else
            return;

        interaction.deferUpdate().catch(console.error);
    },

    permission:  async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder")
};

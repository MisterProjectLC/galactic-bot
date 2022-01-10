const db = require('../external/database.js');
const Discord = require('discord.js');

const MAX_LINES = 10;

// Exports
module.exports = {
    name: "leaderboards",
    nicknames: ["ranking", "rankings", "rank"],
    category: "General",
    description: "Check the leaderboards.", 
    min: 0, max: 0,
    execute: async (com_args, msg) => {
        let achievers = db.makeQuery(`SELECT victory_time, title FROM players WHERE victory_time IS NOT NULL ORDER BY victory_time ASC`);
        let players = db.makeQuery(`SELECT level, xp, title FROM players ORDER BY level DESC, xp DESC`);
        achievers = (await achievers).rows;
        players = (await players).rows;

        let m = await msg.channel.send("Loading...");

        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle("Leaderboards");

        let lineCount = 0;
        for (let i = 0; i < achievers.length && lineCount < MAX_LINES; i++, lineCount++)
            embed = embed.addField(achievers[i].title, "Level: 100\nReached on: " + achievers[i].victory_time);

        for (let i = lineCount; i < players.length && lineCount < MAX_LINES; i++, lineCount++)
            embed = embed.addField(players[i].title, `Level: ${players[i].level}\nXP: ${players[i].xp}`);

        msg.reply(embed);
        m.delete();
    }, 
    permission: (msg) => true
};

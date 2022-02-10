const db = require('../external/database.js');
const { codeBlock } = require('@discordjs/builders');
const saved_messages = require('../utils/saved_messages');
const fixedMessage = require('../utils/fixedMessage');
const {removeReactions} = require('../utils/removeReactions');
const {isValid} = require('../systems/autoDeleter');

const LINES_PER_PAGE = 10;

var generatePage = async (rows, pageNumber, totalPages, userRank=null)  => {
    let tuples = [];

    let rankHeader = ' 🎖️';
    let usernameHeader = 'PLAYER';

    let longestUsernameLength = usernameHeader.length;

    let longestRankLength = `${rows[rows.length-1]['row_index']+1}`.length;
    if (rankHeader.length > longestRankLength) {
        longestRankLength = rankHeader.length;
    }

    // Setup Tuples
    let i = 1;
    for (let row of rows) {
        if (row.title.length > longestUsernameLength) {
            longestUsernameLength = row.title.length;
        }
        tuples.push([pageNumber*LINES_PER_PAGE+i, row.title, row.level, row.xp]);
        i++;
    }

    // Setup lines
    let rowStrings = [];
    for (let [rank, userStr, level, xp] of tuples) {
        while (longestUsernameLength > userStr.length) {
            userStr += ' ';
        }

        let rankStr = `${rank}`;
        while (longestRankLength > rankStr.length + 1) {
            rankStr = ' ' + rankStr;
        }

        rowStrings.push(`${rankStr}.  ${userStr}   • ${level}//${xp}`);
    }

    while (longestRankLength > rankHeader.length - 1) {
        rankHeader = ' ' + rankHeader;
    }

    while (longestUsernameLength > usernameHeader.length) {
        usernameHeader += ' ';
    }

    let header = `${rankHeader}  ${usernameHeader}   LEVEL/XP`;
    let message = (`🪐 Leaderboard 🪐\n\n${header}\n` +
        rowStrings.join("\n") +
        `\n\n// Page ${pageNumber+1}/${totalPages} ` +
        (userRank == null ? '' : ` • Your rank: #${userRank}`)
    );

    return codeBlock('js', message);
}


var fetchLeaderboard = async () => {
    let achievers = db.makeQuery(`SELECT victory_time, title FROM players WHERE victory_time IS NOT NULL AND is_founder = false ORDER BY victory_time ASC`);
    let players = db.makeQuery(`SELECT level, xp, title FROM players WHERE is_founder = false ORDER BY level DESC, xp DESC`);
    achievers = (await achievers).rows;
    players = (await players).rows;

    if (achievers.length + players.length <= 0) {
        return null;
    }

    let achieverCount = 0;
    let rows = [];
    for (let i = 0; i < achievers.length; i++, achieverCount++)
        rows.push({title: achievers[i].title, level: 100, xp: 0});

    for (let i = achieverCount; i < players.length; i++)
        rows.push({title: players[i].title, level: players[i].level, xp: players[i].xp});

    let maxPages = Math.ceil(rows.length/LINES_PER_PAGE);

    return {page: 0, maxPages: maxPages, rows: rows};
}


// Exports
module.exports = {
    name: "leaderboard",
    nicknames: ["ranking", "rankings", "rank", "leaderboards"],
    category: "General",
    description: "Check the leaderboards.", 
    min: 0, max: 0, cooldown: 10,
    execute: async (com_args, msg) => {
        // Get data
        let achievers = db.makeQuery(`SELECT victory_time, title FROM players WHERE victory_time IS NOT NULL AND is_founder = false ORDER BY victory_time ASC`);
        let players = db.makeQuery(`SELECT level, xp, title FROM players WHERE is_founder = false ORDER BY level DESC, xp DESC`);
        achievers = (await achievers).rows;
        players = (await players).rows;

        if (achievers.length + players.length <= 0) {
            msg.reply("The leaderboards are empty...")
            return;
        }

        let m = await msg.channel.send("Loading...");

        let achieverCount = 0;
        let rows = [];
        for (let i = 0; i < achievers.length; i++, achieverCount++)
            rows.push({title: achievers[i].title, level: 100, xp: 0});

        for (let i = achieverCount; i < players.length; i++)
            rows.push({title: players[i].title, level: players[i].level, xp: players[i].xp});

        let maxPages = Math.ceil(rows.length/LINES_PER_PAGE);

        let oldMsgExists = await fixedMessage.deleteOldMessage(msg, 'leaderboard');

        let table = await msg.channel.send(await generatePage(rows.slice(0, LINES_PER_PAGE), 0, maxPages));
        table.react("◀️");
        table.react("▶️");
        fixedMessage.updateFixedMessage(oldMsgExists, table, 'leaderboard');

        saved_messages.add_message('leaderboardsPageTurn', table.id, {page: 0, maxPages: maxPages, rows: rows});
        m.delete().catch(err => console.log(err));
        msg.delete().catch(err => console.log(err));
    }, 

    reaction: async (reaction, user, added) => {
        if (!added)
            return;
        
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        let pkg = saved_messages.get_message('leaderboardsPageTurn', msg.id);
        if (pkg) {
            if (emoji === "◀️" && pkg.page > 0)
                pkg.page -= 1;
        
            else if (emoji === "▶️" && pkg.page < pkg.maxPages-1)
                pkg.page += 1;
            
            removeReactions(msg, user.id);

            let page = await generatePage(pkg.rows.slice(pkg.page*LINES_PER_PAGE, (pkg.page+1)*LINES_PER_PAGE),
                            pkg.page, pkg.maxPages);
            msg.edit(page);
            saved_messages.add_message('leaderboardsPageTurn', msg.id, pkg);
        }
    },
    permission: async (msg) => msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder"),
    generatePage: generatePage,
    fetchLeaderboard: fetchLeaderboard,
    LINES_PER_PAGE: LINES_PER_PAGE
};

const db = require('../external/database.js');
const {spaceClubLevels} = require('../data/constants');

// Exports
module.exports = {
    name: "register",
    category: "General",
    description: "Register into the game.", 
    min: 0, max: 0,
    execute: async (com_args, msg) => {
        let response = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [msg.author.id]);
        let thisPlayer = response.rows[0];
        if (thisPlayer) {
            msg.reply("You are already registered!");
            return;
        }

        let isMember = msg.member.roles.cache.some(role => role.name.toLowerCase() == "spaceclub");
        let level = isMember ? spaceClubLevels : 1;
        
        await db.makeQuery(`INSERT INTO players(userID, title, imageURL, level, spaceClub) VALUES ($1, $2, $3, $4, $5)`, 
        [msg.author.id, msg.member.displayName, msg.author.avatarURL(), level, isMember]);

        msg.reply("You are now registered! Let's HOAG Adventure begins!");
    }, 
    permission: async (msg) => true
};

const db = require('../external/database.js');
const {isValid} = require('../systems/autoDeleter');

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
            
        await db.makeQuery(`INSERT INTO players(userID, title, imageURL) VALUES ($1, $2, $3)`, 
        [msg.author.id, msg.member.displayName, msg.author.avatarURL()]);

        msg.reply("You are now registered! Let's HOAG Adventure begins!");
    }, 
    permission: async (msg) => await isValid(msg, module.exports.name)
};

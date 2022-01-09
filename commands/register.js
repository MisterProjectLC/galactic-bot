const db = require('../external/database.js');

// Exports
module.exports = {
    name: "register",
    category: "General",
    description: "Register into the game.", 
    min: 0, max: 0,
    execute: async (com_args, msg) => {
        await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [msg.author.id]).then(async (response) => {
            let thisPlayer = response.rows[0];
            if (thisPlayer) {
                msg.reply("You are already registered!");
                return;
            }
            
            await db.makeQuery(`INSERT INTO players(userID) VALUES ($1)`, [msg.author.id]);
            msg.reply("Registered player!");
        });
    }, 
    permission: (msg) => true
};

const db = require('../external/database.js');

// Exports
module.exports = {
    name: "register",
    category: "General",
    description: "Register into the game.", 
    min: 0, max: 0,
    execute: async (com_args, msg, quoted_list, client) => {
        await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE user`, [msg.author.id]).then((response) => {
            let thisPlayer = response.rows[0];
            if (thisPlayer)
                msg.reply("You are already registered!");
            else {

                
                db.makeQuery(`INSERT INTO players() 
                VALUES ()`, [user])
                msg.reply("Registered player!");
            }
        });
    }, 
    permission: (msg) => true
};

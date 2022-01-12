const db = require('../external/database.js');
const errors = require('../data/errors');

// Exports
module.exports = {
    name: "duel",
    category: "Battle",
    description: "Challenge another player to a duel.", 
    min: 1, max: 1, cooldown: 10,
    execute: async (com_args, msg) => {
        let challenger = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [msg.author.id]);
        if (challenger.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            return;
        }
        challenger = challenger.rows[0];

        let challenged = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE title OR $1 ILIKE userID`, [com_args[0]]);
        if (challenged.rowCount < 1) {
            msg.reply("Couldn't find the challenged player...");
            return;
        }
        challenged = challenged.rows[0];
            
        await db.makeQuery(`INSERT INTO players(userID, title, imageURL) VALUES ($1, $2, $3)`, 
            [msg.author.id, msg.member.displayName, msg.author.avatarURL()]);

        msg.reply("Registered player!");
    }, 
    permission: (msg) => true
};

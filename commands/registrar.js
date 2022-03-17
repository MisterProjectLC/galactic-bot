const db = require('../external/database.js');
const {spaceClubLevels} = require('../data/constants');

// Exports
module.exports = {
    name: "registrar",
    category: "Geral",
    description: "Registra-se no jogo.", 
    min: 0, max: 0,
    execute: async (com_args, msg) => {
        let response = await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE userID`, [msg.author.id]);
        let thisPlayer = response.rows[0];
        if (thisPlayer) {
            msg.reply("Você já está registrado!");
            return;
        }

        let isMember = msg.member.roles.cache.some(role => role.name.toLowerCase() == "spaceclub");
        let isFounder = msg.member.roles.cache.some(role => role.name.toLowerCase() == "founder");
        let level = isMember ? spaceClubLevels : 1;
        
        await db.makeQuery(`INSERT INTO players(userID, title, imageURL, level, spaceClub, is_founder) VALUES ($1, $2, $3, $4, $5, $6)`, 
        [msg.author.id, msg.member.displayName, msg.author.avatarURL(), level, isMember, isFounder]);

        msg.reply("Você agora foi registrado!");
    }, 
    permission: async (msg) => true
};

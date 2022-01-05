const db = require('../external/database.js');
const errors = require('../data/errors');

var giveXP = (user, xp, msg) => {
    await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE user`, [user]).then((response) => {
        let thisPlayer = response.rows[0];
        if (!thisPlayer)
            msg.reply(errors.unregisteredPlayer);
        else {
            msg.reply(thisJogador.username + ": " + thisJogador.time_nome + ", " + thisJogador.cargo + ". Recursos: " + thisJogador.recursos);
        }
    });
}

var giveCoins = (user, coins, msg) => {
    await db.makeQuery(`SELECT * FROM players WHERE $1 ILIKE user`, [user]).then((response) => {
        let thisPlayer = response.rows[0];
        if (!thisPlayer)
            msg.reply(errors.unregisteredPlayer);
        else {
            await db.makeQuery(`UPDATE players SET coins = coins + $2 WHERE $1 ILIKE user`, [user, coins]);
            msg.reply(`You have gained ${coins} coins!`);
        }
    });
}

module.exports = {
    giveXP: giveXP,
    giveCoins: giveCoins
}
const db = require('../external/database.js');
const errors = require('../data/errors');
const cooldownControl = require('../utils/cooldownControl');

var xpThreshold = (level) => {
    return Math.round(1000 * Math.pow(1.03, level-1));
}

var giveXP = async (userID, xp, channel, command) => {
    await db.makeQuery(`SELECT xp, level FROM players WHERE userid = $1`, [userID]).then(async result => {
        if (result.rowCount < 1) {
            channel.send(`<@${userID}>, ` + errors.unregisteredPlayer);
            if (command)
                cooldownControl.resetCooldown(command, userID);
            return;
        }
        
        let newXP = result.rows[0].xp+xp;
        let level = result.rows[0].level;
        let threshold = xpThreshold(level);   
        let levelup = false;

        if (level >= 100) {
            return;
        }

        while (newXP > threshold) {
            newXP -= threshold;
            level += 1;
            levelup = true;
            console.log(`LEVEL UP ${level}`);
            if (level >= 100) {
                channel.send(`<@${userID}>, CONGRATULATIONS! You have achieved Level ${level}!`);
                db.makeQuery(`UPDATE players SET victory_time = to_timestamp($2/1000.0) WHERE userid = $1`, [userID, (new Date().getTime())]);
                break;

            } else {
                threshold = xpThreshold(level);
                channel.send(`<@${userID}>, you have leveled up! You are now at **Level ${level}** and have **${newXP}XP**.`);
            }
        }

        if (!levelup)
            channel.send(`<@${userID}>, you have received ${xp}XP! You now have ${newXP}XP.`);
        
        await db.makeQuery(`UPDATE players SET xp = $2, level = $3 WHERE userid = $1`, [userID, newXP, level]);
        await db.makeQuery(`UPDATE entities SET health = health + 4 WHERE id = (SELECT entity FROM players WHERE userid = $1)`, [userID]);
    });
}

var giveCoins = async (userID, coins, channel, command) => {
    if (coins == 0)
        return;

    await db.makeQuery(`SELECT coins FROM players WHERE userid = $1`, [userID]).then(async result => {
        if (result.rowCount < 1) {
            channel.send(`<@${userID}>, ` + errors.unregisteredPlayer);
            if (command)
                cooldownControl.resetCooldown(command, userID);
            return;
        }
        channel.send(`<@${userID}>, You have received **${coins} coins**! You now have **${result.rows[0].coins+coins} coins**.`);

        await db.makeQuery(`UPDATE players SET coins = coins + $2 WHERE userid = $1`, [userID, coins]);
    });
}

module.exports = {
    giveXP: giveXP,
    giveCoins: giveCoins,
    xpThreshold: xpThreshold
}
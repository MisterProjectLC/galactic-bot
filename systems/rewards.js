const db = require('../external/database.js');
const errors = require('../data/errors');
const cooldownControl = require('../utils/cooldownControl');

var xpThreshold = (level) => {
    return 1000 * Math.pow(1.03, level-1);
}

var giveXP = async (user, xp, channel, command) => {
    await db.makeQuery(`SELECT xp, level FROM players WHERE userid = $1`, [user]).then(async result => {
        if (result.rowCount < 1) {
            channel.send(`<@${user}>, ` + errors.unregisteredPlayer);
            if (command)
                cooldownControl.resetCooldown(command, user);
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
                channel.send(`<@${user}>, CONGRATULATIONS! You have achieved Level ${level}!`);
                db.makeQuery(`UPDATE players SET victory_time = to_timestamp($2/1000.0) WHERE userid = $1`, [user, (new Date().getTime())]);
                break;

            } else {
                threshold = xpThreshold(level);
                channel.send(`<@${user}>, you have leveled up! You are now at Level ${level}.`);
            }
        }

        if (!levelup)
            channel.send(`<@${user}>, you have received ${xp}XP! You now have ${newXP}XP.`);
        
        await db.makeQuery(`UPDATE players SET xp = $2, level = $3 WHERE userid = $1`, [user, newXP, level]);
        await db.makeQuery(`UPDATE entities SET health = health + 1 WHERE id = (SELECT entity FROM players WHERE userid = $1)`, [user]);
    });
}

var giveCoins = async (user, coins, channel, command) => {
    if (coins == 0)
        return;

    await db.makeQuery(`SELECT coins FROM players WHERE userid = $1`, [user]).then(async result => {
        if (result.rowCount < 1) {
            channel.send(`<@${user}>, ` + errors.unregisteredPlayer);
            if (command)
                cooldownControl.resetCooldown(command, user);
            return;
        }
        channel.send(`<@${user}>, You have received ${coins} coins! You now have ${result.rows[0].coins+coins} coins.`);

        await db.makeQuery(`UPDATE players SET coins = coins + $2 WHERE userid = $1`, [user, coins]);
    });
}

module.exports = {
    giveXP: giveXP,
    giveCoins: giveCoins
}
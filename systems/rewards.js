const db = require('../external/database.js');
const errors = require('../data/errors');
const cooldownControl = require('../utils/cooldownControl');

var xpThreshold = (level) => {
    return 1000 * Math.pow(1.03, level-1);
}

var giveXP = async (user, xp, msg, command) => {
    await db.makeQuery(`SELECT xp, level FROM players WHERE userid = $1`, [user]).then(async result => {
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            if (command)
                cooldownControl.resetCooldown(command, user.id);
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
                msg.reply(`CONGRATULATIONS! You have achieved Level ${level}!`);
                db.makeQuery(`UPDATE players SET victory_time = to_timestamp($2/1000.0) WHERE userid = $1`, [user, (new Date().getTime())]);
                break;

            } else {
                threshold = xpThreshold(level);
                msg.reply(`You have leveled up! You are now at Level ${level}.`);
            }
        }

        if (!levelup)
            msg.reply(`You have received ${xp}XP! You now have ${newXP}XP.`);
        
        await db.makeQuery(`UPDATE players SET xp = $2, level = $3, title = $4, imageURL = $5 WHERE userid = $1`, 
        [user, newXP, level, msg.member.displayName, msg.author.avatarURL()]);
    });
}

var giveCoins = async (user, coins, msg, command) => {
    await db.makeQuery(`SELECT coins FROM players WHERE userid = $1`, [user]).then(async result => {
        if (result.rowCount < 1) {
            msg.reply(errors.unregisteredPlayer);
            if (command)
                cooldownControl.resetCooldown(command, user.id);
            return;
        }
        msg.reply(`You have received ${coins} coins! You now have ${result.rows[0].coins+coins} coins.`);

        await db.makeQuery(`UPDATE players SET coins = coins + $2 WHERE userid = $1`, [user, coins]);
    });
}

module.exports = {
    giveXP: giveXP,
    giveCoins: giveCoins
}
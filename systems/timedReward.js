const db = require('../external/database.js');
const errors = require('../data/errors');
const rewards = require('../systems/rewards');
const cooldownControl = require('../utils/cooldownControl');
const {delay} = require('../utils/delay');
const {timeFormatter} = require('../utils/timeFormatter');

// Exports
module.exports.timedReward = async (name, reward, waitHours, user, member, channel) => {
    let next_what = "next_" + name;
    let what_notified = name + "_notified";

    let result = await db.makeQuery(`SELECT ${next_what} FROM players WHERE userid = $1`, [user.id]);
    if (result.rowCount < 1) {
        await user.send(errors.unregisteredPlayer).catch(async err => {
            let m = await channel.send("You must enable permissions for direct messages from members of the same channel...");
            await delay(1000*2);
            m.delete().catch(err => console.log(err));
        });
        cooldownControl.resetCooldown(module.exports, user.id);
        return;
    }

    if (result.rows[0][next_what] !== null && result.rows[0][next_what] >= new Date()) {
        let timeLeft = ((result.rows[0][next_what] - new Date())/ 1000).toFixed(1);
        await user.send(`You already collected this reward. Collect again in ${timeFormatter(timeLeft)}`).catch(async err => {
            let m = await channel.send("You must enable permissions for direct messages from members of the same channel...");
            await delay(1000*2);
            m.delete().catch(err => console.log(err));
        });
        return;
    }

    rewards.giveCoins(user.id, reward, user, module.exports);

    let time = new Date();
    time.setUTCHours(time.getUTCHours()+waitHours);
    db.makeQuery(`UPDATE players SET title = $2, imageURL = $3, ${next_what} = $4, ${what_notified} = false WHERE userid = $1`, 
        [user.id, member.displayName, user.avatarURL(), time]);
} 

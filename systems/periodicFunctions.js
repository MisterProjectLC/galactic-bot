const db = require('../external/database.js');
const {delay} = require('../utils/delay');
const constants = require('../data/constants');

var refresh = (name, callback) => {
    console.log("Try Refresh " + name);
    db.makeQuery('SELECT time FROM timers WHERE title = $1', [name]).then(result => {
        if (result.rowCount > 0 && result.rows[0].time >= new Date())
            return;
        
        callback();
        let time = new Date();
        time.setUTCHours(time.getUTCHours()+constants.adventuresCooldown);
        db.makeQuery('UPDATE timers SET time = $2 WHERE title = $1', [name, time]);
        console.log("Refresh " + name);
    })
}


var refreshAdventures = () => {
    refresh('adventures', async () => {
        db.makeQuery(`UPDATE players SET adventures_left = adventures_left + 1 WHERE adventures_left < $1`, [constants.adventuresMax]);
    });
    setTimeout(refreshAdventures, constants.adventuresCooldown * 60 * 60 * 1000);
}


var refreshBosses = () => {
    refresh('bosses', async () => {
        db.makeQuery(`UPDATE players SET bosses_left = bosses_left + 1 WHERE bosses_left < $1`, [constants.bossesMax]);
    });
    setTimeout(refreshAdventures, constants.bossesCooldown * 60 * 60 * 1000);
}


const AVAILABLE_ITEMS_PER_DAY = 3;
var makeAvailable = (items, tableName) => {
    // Separate items into tiers
    tiers = {};
    items.forEach(item => {
        if (!tiers[item.min_level])
            tiers[item.min_level] = [];
        
        tiers[item.min_level][tiers[item.min_level].length] = item.id;
    });

    // Make 3 available for each tier
    Object.values(tiers).forEach(tier => {
        while (tier.length > AVAILABLE_ITEMS_PER_DAY) {
            tier.splice(Math.floor(Math.random() * tier.length), 1);
        }

        console.log("tier");
        console.log(tier);
        try {
            db.makeQuery(`UPDATE ${tableName} SET in_shop = true WHERE id = ANY ($1)`, [tier]);
        } catch (e) {
            console.log(`Error ${e}: UPDATE ${tableName} SET in_shop = true WHERE id = ANY ($1)`);
        }
    });
}

var rotatingShop = async () => {
    refresh('shop', async () => {
        let w_promise = db.makeQuery('UPDATE weapons SET in_shop = false');
        let a_promise = db.makeQuery('UPDATE armors SET in_shop = false');
        await Promise.all([w_promise, a_promise]);

        let weapons = db.makeQuery('SELECT id, min_level FROM weapons WHERE enemy_weapon = false ORDER BY min_level');
        let armors = db.makeQuery('SELECT id, min_level FROM armors ORDER BY min_level');
        weapons = (await weapons).rows;
        armors = (await armors).rows;

        makeAvailable(weapons, 'weapons');
        makeAvailable(armors, 'armors');
    });
    setTimeout(rotatingShop, 24 * 60 * 60 * 1000);
}

var initializePeriodic = async () => {
    await delay(10*1000);
    setTimeout(refreshAdventures, constants.adventuresCooldown * 60 * 60 * 1000);
    setTimeout(refreshBosses, constants.bossesCooldown * 60 * 60 * 1000);
    setTimeout(rotatingShop, 24 * 60 * 60 * 1000);
}

module.exports.initializePeriodic = initializePeriodic;
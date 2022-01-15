const db = require('../external/database.js');
const {delay} = require('../utils/delay');
const constants = require('../data/constants');

var refreshAdventures = () => {
    console.log("Refresh Adventures");
    db.makeQuery('UPDATE players SET adventures_left = adventures_left + 1 WHERE adventures_left < $1', [constants.adventuresMax]);
    setTimeout(refreshAdventures, constants.adventuresCooldown * 60 * 60 * 1000);
}


var refreshBosses = () => {
    console.log("Refresh Bosses");
    db.makeQuery('UPDATE players SET bosses_left = bosses_left + 1 WHERE bosses_left < $1', [constants.bossesMax]);
    setTimeout(refreshBosses, constants.bossesCooldown * 60 * 60 * 1000);
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
    console.log("ROTATING SHOP");
    let w_promise = db.makeQuery('UPDATE weapons SET in_shop = false');
    let a_promise = db.makeQuery('UPDATE armors SET in_shop = false');
    await Promise.all([w_promise, a_promise]);

    let weapons = db.makeQuery('SELECT id, min_level FROM weapons WHERE enemy_weapon = false ORDER BY min_level');
    let armors = db.makeQuery('SELECT id, min_level FROM armors ORDER BY min_level');
    weapons = (await weapons).rows;
    armors = (await armors).rows;

    makeAvailable(weapons, 'weapons');
    makeAvailable(armors, 'armors');

    setTimeout(rotatingShop, 24 * 60 * 60 * 1000);
}

var initializePeriodic = async () => {
    await delay(10*1000);
    setTimeout(refreshAdventures, constants.adventuresCooldown * 60 * 60 * 1000);
    setTimeout(refreshBosses, constants.bossesCooldown * 60 * 60 * 1000);
    setTimeout(rotatingShop, 24 * 60 * 60 * 1000);
}

module.exports.initializePeriodic = initializePeriodic;
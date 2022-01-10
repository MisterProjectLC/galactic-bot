const db = require('../external/database.js');
const {delay} = require('../utils/delay');

var refreshFlasks = () => {
    console.log("Refresh Flasks");
    db.makeQuery('UPDATE players SET bosses_left = 1, parties_left = 3, adventures_left = 6');
    setTimeout(refreshFlasks, 24 * 60 * 60 * 1000);
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
    setTimeout(refreshFlasks, 24 * 60 * 60 * 1000);
    setTimeout(rotatingShop, 24 * 60 * 60 * 1000);
}

module.exports.refreshFlasks = refreshFlasks;
module.exports.initializePeriodic = initializePeriodic;
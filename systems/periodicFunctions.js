const db = require('../external/database.js');

var refreshFlasks = () => {
    db.makeQuery('UPDATE players SET bosses_left = 1, parties_left = 3, adventures_left = 6');
    setTimeout(refreshFlasks, 24 * 60 * 1000);
}

var initializePeriodic = () => {
    setTimeout(refreshFlasks, 24 * 60 * 1000);
}

module.exports.refreshFlasks = refreshFlasks;
module.exports.initializePeriodic = initializePeriodic;
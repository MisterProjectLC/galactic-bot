const db = require('../external/database.js');
const {delay} = require('../utils/delay');
const constants = require('../data/constants');
const rewards = require('../systems/rewards');
const {asyncForEach} = require('../utils/asyncForEach');
const {showShop} = require('../commands/shop');

var Client;

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
var makeAvailable = async (items, tableName) => {
    // Separate items into tiers
    tiers = {};
    items.forEach(item => {
        if (!tiers[item.min_level])
            tiers[item.min_level] = [];
        
        tiers[item.min_level][tiers[item.min_level].length] = item.id;
    });

    // Make 3 available for each tier
   await asyncForEach(Object.values(tiers), async tier => {
        while (tier.length > AVAILABLE_ITEMS_PER_DAY) {
            tier.splice(Math.floor(Math.random() * tier.length), 1);
        }

        console.log("tier");
        console.log(tier);
        
        await db.makeQuery(`UPDATE ${tableName} SET in_shop = true WHERE id = ANY ($1)`, [tier]).catch(err => console.log(err));
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

        await makeAvailable(weapons, 'weapons');
        await makeAvailable(armors, 'armors');

        // Edit old shop messages
        Client.guilds.fetch().then(guilds => guilds.forEach(guild => {
            guild.fetch().then(async guild => {
                let oldShopResult = await db.makeQuery(`SELECT * FROM fixedMessages WHERE guild_id = $1 AND title = 'shop'`, [guild.id]);
                if (oldShopResult.rowCount >= 1) {
                    let oldMsg = oldShopResult.rows[0];

                    weapons = db.makeQuery('SELECT title, cost_per_level, min_level FROM weapons WHERE in_shop = true ORDER BY cost_per_level, title');
                    armors = db.makeQuery('SELECT title, cost_per_level, min_level FROM armors WHERE in_shop = true ORDER BY cost_per_level, title');
                    weapons = (await weapons).rows;
                    armors = (await armors).rows;

                    guild.channels.fetch(oldMsg.channel_id).then(channel => {
                        channel.messages.fetch(oldMsg.message_id).then(message => {
                            message.edit(showShop(weapons, armors)).catch(err => console.log(err));
                        });
                    });
                }
            });
        }))
    });
    setTimeout(rotatingShop, 24 * 60 * 60 * 1000);
}

var updateLeaderboard = () => {
    // Edit old leaderboard messages
    Client.guilds.fetch().then(guilds => guilds.forEach(guild => {
        guild.fetch().then(async guild => {
            let oldShopResult = await db.makeQuery(`SELECT * FROM fixedMessages WHERE guild_id = $1 AND title = 'leaderboard'`, [guild.id]);
            if (oldShopResult.rowCount >= 1) {
                let oldMsg = oldShopResult.rows[0];

                weapons = db.makeQuery('SELECT title, cost_per_level, min_level FROM weapons WHERE in_shop = true ORDER BY cost_per_level, title');
                armors = db.makeQuery('SELECT title, cost_per_level, min_level FROM armors WHERE in_shop = true ORDER BY cost_per_level, title');
                weapons = (await weapons).rows;
                armors = (await armors).rows;

                guild.channels.fetch(oldMsg.channel_id).then(channel => {
                    channel.messages.fetch(oldMsg.message_id).then(message => {
                        message.edit(showShop(weapons, armors)).catch(err => console.log(err));
                    });
                });
            }
        });
    }))

    setTimeout(updateLeaderboard, 30 * 60 * 1000);
}


var spaceClubUpdate = async () => {
    console.log("spaceClubUpdate");
    let memberList = [];

    await Client.guilds.fetch().then(guilds => guilds.forEach(guild => {
        guild.fetch().then(guild => {
            if (!guild.available)
                return;
            guild.members.fetch().then(members => members.forEach(member => {
            if (!memberList.includes(member))
                memberList.push(member);
            }))
        })
    })).catch(console.error);

    //console.log(memberList);

    let newClubList = [];
    let kickList = [];

    let nonMembers = (await db.makeQuery('SELECT userid FROM players WHERE spaceClub = false')).rows;
    //console.log('nonMembers');
    //console.log(nonMembers);

    await asyncForEach(memberList, async member => {
        if (member.roles.cache.some(role => role.name == "SpaceClub") && nonMembers.some(row => row.userid == member.user.id)
                && !newClubList.includes(member.user.id)) {
            newClubList.push(member.user.id);
            await rewards.giveLevels(member.user.id, 20);
        
        } else if (!member.roles.cache.some(role => role.name == "SpaceClub") && !nonMembers.some(row => row.userid == member.user.id)
                && !kickList.includes(member.user.id))
            kickList.push(member.user.id);
    });

    //console.log('newClubList');
    //console.log(newClubList);
    //console.log('kickList');
    //console.log(kickList);

    db.makeQuery('UPDATE players SET spaceClub = true WHERE spaceClub = false AND userid = ANY($1)', [newClubList]);
    await db.makeQuery('UPDATE players SET spaceClub = false, level = GREATEST(1, level - 20) WHERE spaceClub = true AND userid = ANY($1)', [kickList]);
    db.makeQuery(`UPDATE entities SET health = 20 + 4*(SELECT level FROM players WHERE players.entity = entities.id) 
    WHERE id = ANY(SELECT entity FROM players);`);

    setTimeout(spaceClubUpdate, 60 * 60 * 1000);
}


var initializePeriodic = async (client) => {
    Client = client;
    await delay(10*1000);
    setTimeout(refreshAdventures, constants.adventuresCooldown * 60 * 60 * 1000);
    setTimeout(refreshBosses, constants.bossesCooldown * 60 * 60 * 1000);
    setTimeout(rotatingShop, 24 * 60 * 60 * 1000);
    setTimeout(updateLeaderboard, 30 * 60 * 1000);
    setTimeout(spaceClubUpdate, 1000);
}

module.exports.initializePeriodic = initializePeriodic;
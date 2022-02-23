const db = require('../external/database.js');
const {delay} = require('../utils/delay');
const config = require('../data/config');
const constants = require('../data/constants');
const rewards = require('../systems/rewards');
const {asyncForEach} = require('../utils/asyncForEach');
const {showShop} = require('../commands/shop');
const leaderboard = require('../commands/leaderboard');
const saved_messages = require('../utils/saved_messages');
const {fetchMembers} = require('../utils/fetchMembers');
const {spaceClubLevels} = require('../data/constants');

var Client;

var refresh = async (name, callback) => {
    console.log("Try Refresh " + name);
    let result = await db.makeQuery('SELECT time FROM timers WHERE title = $1', [name])
    if (result.rowCount > 0 && result.rows[0].time >= new Date())
        return;
        
    await callback();
    let time = new Date();
    time.setUTCHours(time.getUTCHours()+constants.adventuresCooldown);
    db.makeQuery('UPDATE timers SET time = $2 WHERE title = $1', [name, time]);
    console.log("Refresh " + name);
}


var getTimeLeft = async (name) => {
    let result = await db.makeQuery('SELECT time FROM timers WHERE title = $1', [name]);
    if (result.rowCount == 0)
        return;

    if (result.rows[0].time.getTime() > new Date().getTime())
        return (result.rows[0].time.getTime() - new Date().getTime())/1000;
    else
        return 3600;
}


var refreshAdventures = () => {
    refresh('adventures', async () => {
        let rows = (await db.makeQuery(`SELECT userid FROM players WHERE adventures_left = 0`)).rows;
        let memberList = await fetchMembers(Client);
        console.log(memberList);

        rows.forEach(row => {
            let member = memberList.find(member => {return member.user.id == row.userid});
            if (member != undefined)
                member.user.send(`You have just recharged an adventure!`).catch(err => console.log(err));
        });

        rows = (await db.makeQuery(`SELECT userid FROM players WHERE adventures_left = $1`, [constants.adventuresMax-1])).rows;

        rows.forEach(row => {
            let member = memberList.find(member => {return member.user.id == row.userid});
            if (member != undefined)
                member.user.send(`You have just recharged all of your adventures!`).catch(err => console.log(err));
        });
        
        db.makeQuery(`UPDATE players SET adventures_left = adventures_left + 1 WHERE adventures_left < $1`, [constants.adventuresMax]);
    });
    setTimeout(refreshAdventures, 60 * 60 * 1000);
}


var refreshBosses = () => {
    refresh('bosses', async () => {
        let rows = (await db.makeQuery(`SELECT userid FROM players WHERE bosses_left = 0`)).rows;
        let memberList = await fetchMembers(Client);
        console.log(memberList);

        rows.forEach(row => {
            let member = memberList.find(member => {return member.user.id == row.userid});
            if (member != undefined)
                member.user.send(`You have just recharged a conquest!`).catch(err => console.log(err));
        });

        rows = (await db.makeQuery(`SELECT userid FROM players WHERE bosses_left = $1`, [constants.bossesMax-1])).rows;

        rows.forEach(row => {
            let member = memberList.find(member => {return member.user.id == row.userid});
            if (member != undefined)
                member.user.send(`You have just recharged all of your conquests!`).catch(err => console.log(err));
        });

        db.makeQuery(`UPDATE players SET bosses_left = bosses_left + 1 WHERE bosses_left < $1`, [constants.bossesMax]);
    });
    setTimeout(refreshBosses, 60 * 60 * 1000);
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
    await refresh('shop', async () => {
        // Rotate
        let w_promise = db.makeQuery('UPDATE weapons SET in_shop = false');
        let a_promise = db.makeQuery('UPDATE armors SET in_shop = false');
        await Promise.all([w_promise, a_promise]);

        let weapons = db.makeQuery('SELECT id, min_level FROM weapons WHERE enemy_weapon = false ORDER BY min_level');
        let armors = db.makeQuery('SELECT id, min_level FROM armors ORDER BY min_level');
        weapons = (await weapons).rows;
        armors = (await armors).rows;

        await makeAvailable(weapons, 'weapons');
        await makeAvailable(armors, 'armors');
    });

    // Edit old shop messages
    weapons = db.makeQuery('SELECT title, cost_per_level, min_level FROM weapons WHERE in_shop = true ORDER BY cost_per_level, title');
    armors = db.makeQuery('SELECT title, cost_per_level, min_level FROM armors WHERE in_shop = true ORDER BY cost_per_level, title');
    weapons = (await weapons).rows;
    armors = (await armors).rows;

    Client.guilds.fetch().then(guilds => guilds.forEach(guild => {
        guild.fetch().then(async guild => {
            let oldShopResult = await db.makeQuery(`SELECT * FROM fixedMessages WHERE guild_id = $1 AND title = 'shop'`, [guild.id]);
            if (oldShopResult.rowCount >= 1) {
                let oldMsg = oldShopResult.rows[0];

                guild.channels.fetch(oldMsg.channel_id).then(channel => {
                    channel.messages.fetch(oldMsg.message_id).then(message => {
                        message.edit(showShop(weapons, armors)).catch(err => console.log(err));
                    });
                });
            }
        });
    }))


    setTimeout(rotatingShop, 60 * 60 * 1000);
}

var updateLeaderboard = async () => {
    // Edit old leaderboard messages
    let guilds = await Client.guilds.fetch().catch(err => console.log(err));
    let guildArray = [];
    guilds.forEach((value, key) => {
        guildArray.push(value);
    })

    await asyncForEach(guildArray, async guild => {
        guild = await guild.fetch().catch(err => console.log(err));
        
        let oldShopResult = await db.makeQuery(`SELECT * FROM fixedMessages WHERE guild_id = $1 AND title = 'leaderboard'`, [guild.id]);
        if (oldShopResult.rowCount < 1)
            return;
        let oldMsg = oldShopResult.rows[0];

        let channel = await guild.channels.fetch(oldMsg.channel_id);
        let message = await channel.messages.fetch(oldMsg.message_id);
        let pkg = await leaderboard.fetchLeaderboard();
        if (!pkg) {
            message.edit("The leaderboard is empty...").catch(err => console.log(err));
            return;
        }

        saved_messages.add_message('leaderboardsPageTurn', message.id, pkg);
        message.edit(await leaderboard.generatePage(pkg.rows.slice(0, leaderboard.LINES_PER_PAGE), 0, pkg.maxPages)).catch(err => console.log(err));
    });

    setTimeout(updateLeaderboard, 3 * 60 * 1000);
}


var spaceClubUpdate = async () => {
    let memberList = await fetchMembers(Client);

    let newClubList = [];
    let kickList = [];

    let nonMembers = (await db.makeQuery('SELECT userid FROM players WHERE spaceClub = false')).rows;

    await asyncForEach(memberList, async member => {
        if (member.roles.cache.some(role => role.name == "SpaceClub") && nonMembers.some(row => row.userid == member.user.id)
                && !newClubList.includes(member.user.id)) {
            newClubList.push(member.user.id);
            await rewards.giveLevels(member.user.id, spaceClubLevels);
        
        } else if (!member.roles.cache.some(role => role.name == "SpaceClub") && !nonMembers.some(row => row.userid == member.user.id)
                && !kickList.includes(member.user.id))
            kickList.push(member.user.id);
    });

    db.makeQuery('UPDATE players SET spaceClub = true WHERE spaceClub = false AND userid = ANY($1)', [newClubList]);
    await db.makeQuery(`UPDATE players SET spaceClub = false, level = GREATEST(1, level - ${spaceClubLevels}) WHERE spaceClub = true AND userid = ANY($1)`,
    [kickList]);
    db.makeQuery(`UPDATE entities SET health = 20 + 4*(SELECT level FROM players WHERE players.entity = entities.id) 
    WHERE id = ANY(SELECT entity FROM players);`);

    setTimeout(spaceClubUpdate, 60 * 60 * 1000);
}


var initializePeriodic = async (client) => {
    Client = client;
    await delay(10*1000);
    if (!config.teste) {
        setTimeout(refreshAdventures, 1000);
        setTimeout(refreshBosses, 1000);
        setTimeout(rotatingShop, 1000);
        setTimeout(updateLeaderboard, 1000);
        setTimeout(spaceClubUpdate, 1000);
    }
}

module.exports.initializePeriodic = initializePeriodic;
module.exports.getTimeLeft = getTimeLeft;
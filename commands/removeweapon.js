const db = require('../external/database.js');
const errors = require('../data/errors');
const { delay } = require('../utils/delay.js');
const saved_messages = require('../utils/saved_messages');

// Exports
module.exports = {
    name: "removeweapon",
    nicknames: ["removeWeapon"],
    category: "General",
    description: " Removes one of your weapons.", 
    examples: ["#removeweapon 10: removes your 10th weapon (according to your profile in #info)."],
    min: 1, max: 1, cooldown: 0,
    execute: async (com_args, msg) => {
        // Item
        let itemIndex = parseInt(com_args[0]);
        if (!(itemIndex === itemIndex && itemIndex > 0)) {
            msg.reply(errors.invalidArgs);
            return;
        }
        itemIndex -= 1;

        let weapon_result = db.makeQuery(`SELECT * FROM playersWeapons, eWeapons 
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND weapon_id = eWeapons.id`, [msg.author.id]);

        let weapons = (await weapon_result).rows;

        if (itemIndex >= weapons.length) {
            error(msg, errors.helpFormatting(module.exports));
            return;
        }

        let m = await msg.reply(`Are you sure you want to throw ${weapons[itemIndex].title} away?`);
        m.react('✅');
        m.react('❌');
        saved_messages.add_message('removeweapon', m.id, {originalMsg: msg, item: weapons[itemIndex]});

    },
    reaction: async (reaction, user) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        // Confirm Purchase
        let pkg = saved_messages.get_message('removeweapon', msg.id);
        if (!pkg || user.id != pkg.originalMsg.author.id)
            return;

        if (emoji == '✅') {
            db.makeQuery(`DELETE FROM playersWeapons WHERE weapon_id = (SELECT id FROM weapons WHERE title = $2)
            AND player_id = (SELECT id FROM players WHERE userid = $1)`, [user.id, pkg.item.title]);
            let m = await msg.reply(`Threw ${pkg.item.title} away.`);

            await delay(5000);
            m.delete().catch(err => console.log(err));
            msg.delete().catch(err => console.log(err));
            pkg.originalMsg.delete().catch(err => console.log(err));

        } else if (emoji == '❌') {
            msg.delete().catch(err => console.log(err));
            pkg.originalMsg.delete().catch(err => console.log(err));
        }

    },
    permission: async (msg) => true
};

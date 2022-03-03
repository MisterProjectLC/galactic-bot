const db = require('../external/database.js');
const errors = require('../data/errors');
const { delay } = require('../utils/delay.js');
const saved_messages = require('../utils/saved_messages');

// Exports
module.exports = {
    name: "removearmor",
    nicknames: ["removeArmor"],
    category: "General",
    description: " Removes one of your armors.", 
    examples: ["#removearmor 10: removes your 10th armor (according to your profile in #info)."],
    min: 1, max: 1, cooldown: 0,
    execute: async (com_args, msg) => {
        // Item
        let itemIndex = parseInt(com_args[0]);
        if (!(itemIndex === itemIndex && itemIndex > 0)) {
            msg.reply(errors.invalidArgs);
            return;
        }
        itemIndex -= 1;

        let armor_result = db.makeQuery(`SELECT * FROM playersArmors, eArmors
        WHERE player_id = (SELECT id FROM players WHERE userid = $1) AND armor_id = eArmors.id`, [msg.author.id]);

        let armors = (await armor_result).rows;

        if (itemIndex >= armors.length) {
            msg.reply(errors.invalidArgs);
            return;
        }

        let m = await msg.reply(`Are you sure you want to throw ${armors[itemIndex].title} away?`);
        m.react('✅');
        m.react('❌');
        saved_messages.add_message('removearmor', m.id, {originalMsg: msg, item: armors[itemIndex]});
        
    },
    reaction: async (reaction, user) => {
        let msg = reaction.message;
        let emoji = reaction.emoji.toString();

        // Confirm Purchase
        let pkg = saved_messages.get_message('removearmor', msg.id);
        if (!pkg || user.id != pkg.originalMsg.author.id)
            return;

        if (emoji == '✅') {
            db.makeQuery(`DELETE FROM playersArmors WHERE armor_id = (SELECT id FROM armors WHERE title = $2)
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

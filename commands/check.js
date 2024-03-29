const db = require('../external/database.js');
const Discord = require('discord.js');
const errors = require('../data/errors');
const {capitalize} = require('../utils/capitalize');
const {isValid} = require('../systems/autoDeleter');
const { delay } = require('../utils/delay.js');

// Exports
module.exports = {
    name: "check",
    category: "Shop",
    description: "Check an specific item from the Shop.", 
    examples: ["#check 4: check the 4th equipment in the shop."],
    min: 1, max: 1, cooldown: 2,
    execute: async (com_args, msg) => {
        let i = parseInt(com_args[0]);
        if (i !== i) {
            msg.reply(errors.invalidArgs);
            return;
        }
        i -= 1;

        let weapons = [];
        let armors = [];

        let weapon_promise = db.makeQuery(`SELECT weapons.title, cost_per_level, damage_per_level, rate, min_level, effects.title as effect_title, 
        playersWeapons.level
        FROM (weapons LEFT OUTER JOIN effects ON weapons.effect = effects.id) 
        LEFT OUTER JOIN playersWeapons ON weapons.id = playersWeapons.weapon_id AND player_id = 
        (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true
        ORDER BY cost_per_level, weapons.title`, [msg.author.id]).then((result) => {
            weapons = result.rows;
        });

        let armor_promise = db.makeQuery(`SELECT armors.title, cost_per_level, health, shield, plate, regen, evasion, min_level, effects.title as effect_title, 
        playersArmors.level
        FROM (armors LEFT OUTER JOIN effects ON armors.effect = effects.id) 
        LEFT OUTER JOIN playersArmors ON armors.id = playersArmors.armor_id AND player_id = 
        (SELECT id FROM players WHERE userid = $1) WHERE in_shop = true 
        ORDER BY cost_per_level, armors.title`, [msg.author.id]).then((result) => {
            armors = result.rows;
        });

        await Promise.all([weapon_promise, armor_promise]);

        if (i < 0 || i >= weapons.length + armors.length) {
            msg.reply(errors.helpFormatting(module.exports));
            return;
        }

        let item = (i < weapons.length ? weapons[i] : armors[i-weapons.length]);

        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(item.title);

        if (i < weapons.length) {
            embed = embed
            .addField(`Info`,
                `Cost: ${weapons[i].cost_per_level}
Min Level to buy: ${weapons[i].min_level}
Your level with this: ${weapons[i].level !== null ? weapons[i].level : 0}`, true)
            .addField(`Stats`,
                `Damage per Level: ${weapons[i].damage_per_level}
Rate of Attack: ${weapons[i].rate}
Effect: ${weapons[i].effect_title !== null ? capitalize(weapons[i].effect_title) : "None"}`, true);

        } else if (i < weapons.length + armors.length) {
            i -= weapons.length;
            embed = embed
            .addField(`Info`,
                `Cost: ${armors[i].cost_per_level}
Min Level to buy: ${armors[i].min_level}
Your level with this: ${armors[i].level !== null ? armors[i].level : 0}`, true)
            .addField(`Stats`,
                `Health: ${armors[i].health}
Shields: ${armors[i].shield}
Plate: ${armors[i].plate}
Regen: ${armors[i].regen}
Evasion: ${armors[i].evasion}`, true);
        }

        let m = await msg.reply({embeds: [embed]});

        await delay(1000 * 10);
        m.delete().catch(err => console.log(err));
        msg.delete().catch(err => console.log(err));

    },
    permission:  async (msg) => true
};

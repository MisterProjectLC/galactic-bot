const Discord = require('discord.js');

// Exports
module.exports = {
    name: "manual",
    category: "General",
    description: "Explains the battle systems, mechanics and rules.", 
    min: 0, max: 0, cooldown: 5,
    execute: async (com_args, msg) => {
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle("Battle Manual")
        .addField("Attacking and defending", `Battles occur in turns, with the Side A always going first. Battles may last up to 9 turns - if Turn 9 is reached, Side B immediately wins.
        Players can only attack an enemy once the previous enemy is defeated. Enemies, on the other hand, hits every player at once with every attack.`, false)
        .addField("Choosing your arsenal", `Before entering a battle, players must choose two weapons and two armors among their arsenal.`+
        `To help with this decision, the enemies you'll fight are always shown before combat. Examine your opponents carefully and pick your strategy!`, false)
        .addField("Attack stats", "Every weapon has two primary stats: damage and attack rate. Damage scales with the weapon's level - the higher the level, " +
        "the higher the damage. The attack rate, on the other hand, stays fixed. If the attack rate is lower than 1, the weapon must 'charge' before " +
        "attacking, and so may not attack until their charge adds up to 1.", false)
        .addField("Defense stats", "There are 5 defense stats in the game: ", false)
        .addField("Health", "If this hits 0, the player is out of combat. Health increases by 4 every level.", true)
        .addField("Shields", "Additional health that cannot be healed. They are plentiful, but also more vulnerable to certain effects.", true)
        .addField("Plate", "Reduces the damage taken from each attack. Also severely reduce the chance of Shock (explained later).", true)
        .addField("Regen", "Heals the player's health (not shields) every turn.", true)
        .addField("Evasion", "Chance of avoiding an attack completely. Evasion accumulates every turn, but is divided in half every time the player evades an attack.", true)
        .addField("Effects", "Some weapons have additional elemental effects with special properties: ", false)
        .addField("Fire", "Half of this attack's damage ignores Shields.", true)
        .addField("Plasma", "Deals double damage against Shields.", true)
        .addField("Acid", "The defender's Plate is reduced by 1/8 of this attack's damage.", true)
        .addField("Freeze", "The defender's Evasion is reduced by 1/4 of this attack's damage.", true)
        .addField("Shock", "This attack's damage divided by the defender's plate equals the chance of stunning the defender, making them lose their attacks (max. 30% chance). Stunned players can still dodge and charge uncharged weapons.", true)
        .addField("Chemical", "Half of this attack's damage heals back the attacker.", true)
        .addField("Virus", "All damage caused by this attack can't be healed back.", true);


        msg.reply(embed);
    }, 
    permission: (msg) => true
};

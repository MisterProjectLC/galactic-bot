
const {healthbar} = require('./battle_helper');
const Weapon = require('./weapon').Weapon;
const Fighter = require('./fighter').Fighter;
const effects = require('./effects');
const Discord = require('discord.js');
const delay = require('../utils/delay').delay;
const {asyncForEach} = require('../utils/asyncForEach');

// Exports
module.exports.healthbar = healthbar;
module.exports.Weapon = Weapon;
module.exports.Fighter = Fighter;
module.exports.effects = effects;
module.exports.Battle = class {
    constructor(left_fighters, right_fighters) {
        this.left_fighters = left_fighters;
        this.right_fighters = right_fighters;
        this.rounds = 0;
        this.log = "**---BATTLE LOG---**\n";
    }

    update_battle_status(fighter, side) {
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`**${fighter.title} - Side ${side}**`);

        if (fighter.image != null)
            embed = embed.setThumbnail(fighter.image);

        embed = embed
        .addField(`**Health**`, `${healthbar(fighter.health, fighter.max_health)} ${fighter.health}/${fighter.max_health}
        **Shields**\n${healthbar(fighter.shield, fighter.max_shield)} ${fighter.shield}/${fighter.max_shield}`, true)
        .addField(`**Stats**`, `Plate: ${fighter.plate}\nRegen: ${fighter.regen}\nEvasion: ${fighter.evasion}`, true);
        
        let weapon_list = "";
        fighter.weapons.forEach(weapon => {
            weapon_list += `**${weapon.title}**\nDamage: ${weapon.damage}\nRate of Attack: ${weapon.rate} per turn\nEffect: ${weapon.effect !== null ? weapon.effect.title : "None"}\n`;
        });
        embed = embed.addField(`**Weapons**`, weapon_list.length > 0 ? weapon_list : "-", true);
        
        return embed;
    }
    
    
    async battle(channel) {
        let left_battle_status = [];
        
        await asyncForEach(this.left_fighters, async (fighter) => {
            left_battle_status.push(await channel.send(this.update_battle_status(fighter, 'A')));
        });

        let right_battle_status = [];
        await asyncForEach(this.right_fighters, async (fighter) => {
            right_battle_status.push(await channel.send(this.update_battle_status(fighter, 'B')));
        });


        let battle_log = await channel.send(`**--BATTLE LOG--**`);

        let endgame = 0;
        while (true) {
            await delay(3000);
            this.rounds += 1;
            await this.round(left_battle_status, right_battle_status, battle_log);
    
            endgame = 2;
            this.left_fighters.forEach(fighter => {
                if (fighter.health > 0)
                    endgame = 0;
            });
            if (endgame == 2)
                break;
    
            endgame = 1;
            this.right_fighters.forEach(fighter => {
                if (fighter.health > 0)
                    endgame = 0;
            });
            if (endgame == 1)
                break;
        }

        await battle_log.channel.send("Battle ended! Combatant(s) " + (endgame == 1 ? "A" : "B") + " won!");
        return endgame == 1;
    }
    
    async round(left_battle_status, right_battle_status, battle_log) {
        console.log(`ROUND ${this.rounds}`);
        this.log += `**ROUND ${this.rounds}**\n`;
        this.side_round(this.left_fighters, this.right_fighters, battle_log);
        this.side_round(this.right_fighters, this.left_fighters, battle_log);
    
        
        for (let i = 0; i < left_battle_status.length; i++)
            await left_battle_status[i].edit(this.update_battle_status(this.left_fighters[i], 'A'));

        for (let i = 0; i < right_battle_status.length; i++)
            await right_battle_status[i].edit(this.update_battle_status(this.right_fighters[i], 'B'));

        await battle_log.edit(this.log);
    }
    
    side_round(actors, opponents, battle_log) {
        actors.forEach(actor => {
            if (actor.health > 0)
                this.individual_round(actor, opponents, battle_log);
        });
    }
    
    
    individual_round(individual, opponents, battle_log) {
        individual.weapons.forEach(weapon => {
            console.log("Carregando com " + weapon.title);
            if (weapon.charge < 1) {
                weapon.charge += weapon.rate;
            }
    
            if (individual.stunned)
                this.log += `**${individual.title}** is **stunned**!\n`;
            else
                opponents.forEach(opponent => {
                    this.attack(individual, weapon, opponent, battle_log);
                });
        });
    
        individual.stunned = false;
        individual.antihealed = false;
    }
    
    
    attack(attacker, weapon, defender, battle_log) {
        while (weapon.charge >= 1) {
            weapon.charge -= 1;
            console.log("Atacando com " + weapon.title);
    
            let rand = Math.random()*100;
            if (defender.evasion > rand) {
                if (defender.frozen)
                    defender.frozen = false;
                else {
                    this.log += `**${defender.title}** has evaded the attack! Chance: **${defender.evasion}%** > **${rand.toFixed(0)}%**\n`;
                    return;
                }
            }
    
            let effective_damage = defender.take_damage(weapon.damage);
            this.log += `**${attacker.title}** dealt **${effective_damage} damage** to **${defender.title}** using **${weapon.title}**!\n`;
    
            rand = Math.random()*100;
            if (weapon.effect !== null && weapon.effect.level > rand) {
                this.log += `**${attacker.title}** applied **${weapon.effect.title}** to **${defender.title}**! Chance: **${weapon.effect.level}%** > **${rand.toFixed(0)}%**\n`;
                weapon.effect.apply(weapon.damage, attacker, defender);
            }
        }
    }
}
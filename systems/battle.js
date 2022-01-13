const {healthbar} = require('./battleHelper');
const Weapon = require('./weapon').Weapon;
const Fighter = require('./fighter').Fighter;
const effects = require('./effects');
const Discord = require('discord.js');
const delay = require('../utils/delay').delay;
const {asyncForEach} = require('../utils/asyncForEach');

const TURN_DELAY = 6;
const MAXIMUM_TURN = 6;

// Exports
module.exports.healthbar = healthbar;
module.exports.Weapon = Weapon;
module.exports.Fighter = Fighter;
module.exports.effects = effects;
module.exports.Battle = class {
    constructor(leftFighters, rightFighters) {
        this.leftFighters = leftFighters;
        this.rightFighters = rightFighters;
        this.rounds = 0;
        this.log = "**---BATTLE LOG---**\n";
    }

    updateBattleStatus(fighter, side) {
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(`**${fighter.title} - Side ${side}**`)
        .setThumbnail(fighter.image);

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
        let leftBattleStatus = [];
        
        await asyncForEach(this.leftFighters, async (fighter) => {
            leftBattleStatus.push(await channel.send(this.updateBattleStatus(fighter, 'A')));
        });

        let rightBattleStatus = [];
        await asyncForEach(this.rightFighters, async (fighter) => {
            rightBattleStatus.push(await channel.send(this.updateBattleStatus(fighter, 'B')));
        });


        let battleLog = await channel.send(`**--BATTLE LOG--**`);

        let endgame = 0;
        while (true) {
            this.rounds += 1;
            if (this.rounds >= MAXIMUM_TURN) {
                endgame == 1;
                break;
            }
            await this.round(leftBattleStatus, rightBattleStatus, battleLog);
            await delay(TURN_DELAY*1000);
    
            endgame = 2;
            this.leftFighters.forEach(fighter => {
                if (fighter.health > 0)
                    endgame = 0;
            });
            if (endgame == 2)
                break;
    
            endgame = 1;
            this.rightFighters.forEach(fighter => {
                if (fighter.health > 0)
                    endgame = 0;
            });
            if (endgame == 1)
                break;
        }

        if (endgame != 0)
            await battleLog.channel.send("Battle ended! Combatant(s) " + (endgame == 1 ? "A" : "B") + " won!");
        else
            await battleLog.channel.send("Battle lasted too long! Called a stalemate.");
        return endgame;
    }
    
    async round(leftBattleStatus, rightBattleStatus, battleLog) {
        console.log(`ROUND ${this.rounds}`);
        this.log += `**ROUND ${this.rounds}**\n`;
        this.sideRound(this.leftFighters, this.rightFighters, battleLog);
        this.sideRound(this.rightFighters, this.leftFighters, battleLog);
    
        await battleLog.edit(this.log);
        
        for (let i = 0; i < leftBattleStatus.length; i++)
            await leftBattleStatus[i].edit(this.updateBattleStatus(this.leftFighters[i], 'A'));

        for (let i = 0; i < rightBattleStatus.length; i++)
            await rightBattleStatus[i].edit(this.updateBattleStatus(this.rightFighters[i], 'B'));
    }
    
    sideRound(actors, opponents, battleLog) {
        actors.forEach(actor => {
            if (actor.health > 0)
                this.individualRound(actor, opponents, battleLog);
        });
    }
    
    
    individualRound(individual, opponents, battleLog) {
        individual.weapons.forEach(weapon => {
            console.log("Carregando com " + weapon.title);
            if (weapon.charge < 1)
                weapon.charge += weapon.rate;
    
            if (individual.stunned)
                this.log += `**${individual.title}** is **stunned**!\n`;
            else {
                opponents.forEach(opponent => {
                    if (opponent.health > 0)
                        this.attack(individual, weapon, opponent, battleLog);
                });
            
                weapon.charge = weapon.charge % 1;
            }
        });
    
        individual.stunned = false;
        individual.antihealed = false;
    }
    
    
    attack(attacker, weapon, defender, battleLog) {
        let charge = weapon.charge;
        while (charge >= 1) {
            charge -= 1;
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
    
            let effective_damage = defender.takeDamage(weapon.damage);
            this.log += `**${attacker.title}** dealt **${effective_damage} damage** to **${defender.title}** using **${weapon.title}**!\n`;
    
            rand = Math.random()*100;
            if (weapon.effect !== null && weapon.effect.level > rand) {
                this.log += `**${attacker.title}** applied **${weapon.effect.title}** to **${defender.title}**! Chance: **${weapon.effect.level}%** > **${rand.toFixed(0)}%**\n`;
                weapon.effect.apply(weapon.damage, attacker, defender);
            }
        }
    }
}
const {healthbar} = require('./battleHelper');
const Weapon = require('./weapon').Weapon;
const Fighter = require('./fighter').Fighter;
const effects = require('./effects');
const Discord = require('discord.js');
const delay = require('../utils/delay').delay;
const {asyncForEach} = require('../utils/asyncForEach');

const TURN_DELAY = 6;
const MAXIMUM_TURN = 9;
const LINES_PER_LOG = 12;

// Exports
module.exports.healthbar = healthbar;
module.exports.Weapon = Weapon;
module.exports.Fighter = Fighter;
module.exports.effects = effects;
module.exports.Battle = class {
    constructor(channel, duel, leftFighters, rightFighters, leftArePlayers, rightArePlayers) {
        this.duel = duel;
        this.leftFighters = leftFighters;
        this.rightFighters = rightFighters;
        this.leftArePlayers = leftArePlayers;
        this.rightArePlayers = rightArePlayers;
        this.rounds = 0;
        this.channel = channel;
        this.logMsgs = [];
        this.log = ["**---BATTLE LOG---**"];
    }

    updateBattleStatus(fighter, side) {
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle(duel ? `**${fighter.title}**` : `**${fighter.title} - Side ${side}**`)
        .setThumbnail(fighter.image);

        if (fighter.image != null)
            embed = embed.setThumbnail(fighter.image);

        embed = embed
        .addField(`**Health**`, `${healthbar(fighter.health, fighter.maxHealth, fighter.necroHealth)} ${fighter.health}/${fighter.maxHealth-fighter.necroHealth}
        **Shields**\n${healthbar(fighter.shield, fighter.maxShield)} ${fighter.shield}/${fighter.maxShield}`, true)
        .addField(`**Stats**`, `Plate: ${fighter.plate}\nRegen: ${fighter.regen}\nEvasion: ${fighter.evasion}`, true);
        
        let weaponList = "";
        fighter.weapons.forEach(weapon => {
            weaponList += `**${weapon.title}**\nDamage: ${weapon.damage}\nRate of Attack: ${weapon.rate} per turn\nEffect: ${weapon.effect !== null ? weapon.effect.title : "None"}\n`;
        });
        embed = embed.addField(`**Weapons**`, weaponList.length > 0 ? weaponList : "-", true);
        
        return embed;
    }


    async logUpdate() {
        let index = 0;
        for (index = 0; index < this.log.length; index += LINES_PER_LOG) {
            let text = this.log.slice(index, index+LINES_PER_LOG).reduce((previousValue, current) => {return previousValue + current + "\n"}, "");
            if (index+LINES_PER_LOG >= this.log.length-1)
                text += "⚔️\n";
            if (this.logMsgs.length > index/LINES_PER_LOG)
                await this.logMsgs[index/LINES_PER_LOG].edit(text);
            else {
                let msg = await this.channel.send(text);
                this.logMsgs.push(msg);
            }
        }
    }
    
    
    async battle() {
        let leftBattleStatus = [];
        
        await asyncForEach(this.leftFighters, async (fighter) => {
            leftBattleStatus.push(this.updateBattleStatus(fighter, 'A'));
        });

        let rightBattleStatus = [];
        await asyncForEach(this.rightFighters, async (fighter) => {
            rightBattleStatus.push(this.updateBattleStatus(fighter, 'B'));
        });
        
        let statusEmbedMsg = await this.channel.send({embeds: leftBattleStatus.concat(rightBattleStatus)});

        let m = await this.channel.send(`**--BATTLE LOG--**`);
        this.logMsgs.push(m);
        m = await this.channel.send(`**----**`);
        this.logMsgs.push(m);
        m = await this.channel.send(`**----**`);
        this.logMsgs.push(m);
        m = await this.channel.send(`**----**`);
        this.logMsgs.push(m);
        m = await this.channel.send(`**----**`);
        this.logMsgs.push(m);
        m = await this.channel.send(`**----**`);
        this.logMsgs.push(m);
        m = await this.channel.send(`**----**`);
        this.logMsgs.push(m);
        m = await this.channel.send(`**----**`);
        this.logMsgs.push(m);

        let endgame = 0;
        while (true) {
            this.rounds += 1;
            if (this.rounds >= MAXIMUM_TURN) {
                endgame == 1;
                break;
            }
            await this.round(leftBattleStatus, rightBattleStatus, statusEmbedMsg);
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

        this.logMsgs.forEach(msg => {
            if (msg.content == `**----**`)
                msg.delete().catch((err) => console.log('Could not delete the message', err));
        });

        let leftName = (this.leftFighters.count >= 2) ? ("Combatants A") : (this.leftFighters[0].title);
        let rightName = (this.rightFighters.count >= 2) ? ("Combatants B") : (this.rightFighters[0].title);

        if (endgame != 0) {
            await this.channel.send("Battle ended! " + (endgame == 1 ? leftName : rightName) + " won!");
        } else {
            await this.channel.send("Battle lasted too long! " + rightName + " won by default.");
            endgame = 2;
        }
        return endgame;
    }
    
    async round(leftBattleStatus, rightBattleStatus, statusEmbedMsg) {
        if (this.log[this.log.length-1].startsWith("**Round"))
            this.log.push(`Nothing happened...`);
        this.log.push(`**ROUND ${this.rounds}**`);
        this.sideRound(this.leftFighters, this.rightFighters, !this.leftArePlayers);
        this.sideRound(this.rightFighters, this.leftFighters, !this.rightArePlayers);
    
        await this.logUpdate();
        
        for (let i = 0; i < leftBattleStatus.length; i++)
            leftBattleStatus[i] = this.updateBattleStatus(this.leftFighters[i], 'A');

        for (let i = 0; i < rightBattleStatus.length; i++)
            rightBattleStatus[i] = this.updateBattleStatus(this.rightFighters[i], 'B');
        
        statusEmbedMsg.edit({embeds : leftBattleStatus.concat(rightBattleStatus)});
    }
    
    sideRound(actors, opponents, attackAll) {
        actors.forEach(actor => {
            if (actor.health > 0)
                this.individualRound(actor, opponents, attackAll);
        });
    }
    
    
    individualRound(individual, opponents, attackAll) {
        individual.evasionSum += individual.evasion;
        if (individual.evasion > 0)
            this.log.push(`**${individual.title}**'s evasion chance increased by **${individual.evasion}%**. It is now at **${individual.evasionSum}%**.`);

        if (individual.shocked)
            this.log.push(`**${individual.title}** is **stunned**!`);

        individual.weapons.forEach(weapon => {
            console.log("Carregando com " + weapon.title);
            if (weapon.charge < 1)
                weapon.charge += weapon.rate;
    
            if (individual.shocked)
                return;
            
            let alreadyAttacked = false;
            opponents.forEach(opponent => {
                if (alreadyAttacked && !attackAll)
                    return;

                if (opponent.health > 0) {
                    this.attack(individual, weapon, opponent);
                    alreadyAttacked = true;
                }
            });
            
            weapon.charge = weapon.charge % 1;
        });

        individual.heal(individual.regen);
        individual.shocked = false;
    }
    
    
    attack(attacker, weapon, defender) {
        let charge = weapon.charge;
        while (charge >= 1) {
            charge -= 1;
            console.log("Atacando com " + weapon.title);
    
            let rand = Math.random()*100;
            if (defender.evasionSum > rand) {
                this.log.push(`**${defender.title}** has evaded (**${defender.evasionSum}%** evasion chance) **${attacker.title}**'s **${weapon.title}**! `
                + `Their evasion chance is now at **${defender.evasionSum/2}%**.`);
                defender.evasionSum /= 2;
                return;
            }
    
            if (weapon.effect === null || !weapon.effect.cancelDamage) {
                let effectiveDamage = defender.takeDamage(weapon.damage);
                this.log.push(`**${attacker.title}** dealt **${effectiveDamage} damage** to **${defender.title}** using **${weapon.title}**!`);
            }
    
            if (weapon.effect !== null) {
                let logMessage = weapon.effect.apply(weapon.damage, attacker, defender, weapon.title);
                if (logMessage !== null)
                    this.log.push(logMessage);
            }
        }
    }
}
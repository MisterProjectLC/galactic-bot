
const effectList = {
    fire: (damage, attacker, defender, weaponTitle) => {
        let halfDamage = Math.round(Math.max(1, (damage  - defender.plate)/2));
        let leftoverDamage = Math.max(0, halfDamage - defender.shield);
        let shieldDamage = halfDamage - leftoverDamage;
        defender.shield = defender.shield - shieldDamage;

        let healthDamage = leftoverDamage + Math.round(Math.max(1, damage/2));
        defender.health = Math.max(0, defender.health - healthDamage);

        let shieldMessage = `**${attacker.title}** dealt **${shieldDamage} damage** to **${defender.title}**'s Shields using **${weaponTitle}**!`;
        let healthMessage = `**${attacker.title}** dealt **${healthDamage} Fire damage** to **${defender.title}**'s Health using **${weaponTitle}**!`;
        return (shieldDamage > 0) ? shieldMessage + '\n' + healthMessage : healthMessage;
    },

    acid: (damage, attacker, defender) => {
        let log = defender.plate > 0;
        let acidDamage = Math.max(1, Math.round(damage/8));
        defender.plate = Math.max(0, defender.plate - acidDamage);
        return log ? `**${attacker.title}** dealt **${acidDamage} Acid damage** to **${defender.title}**'s **Plate**! It is now at **${defender.plate}**.` : null;
    },

    plasma: (damage, attacker, defender) => {
        let log = defender.shield > 0;
        let plasmaDamage = Math.max(1, damage - defender.plate);
        defender.shield = Math.max(0, defender.shield - plasmaDamage);
        return log ? `**${attacker.title}** dealt **${plasmaDamage} extra Plasma damage** to **${defender.title}**'s **Shield**!` : null;
    },

    freeze: (damage, attacker, defender) => {
        let log = defender.evasion > 0;
        let freezeDamage = Math.max(1, Math.round((damage - defender.plate)/4));
        defender.evasionSum = Math.max(0, defender.evasionSum - freezeDamage);
        return log ? `**${attacker.title}** dealt **${freezeDamage} Ice damage** to **${defender.title}**'s Evasion! It is now at **${defender.evasionSum}%**.` : null;
    },

    shock: (damage, attacker, defender) => {
        let rand = Math.random()*100;
        let chance = Math.min(30, damage/Math.max(1, defender.plate));
        if (rand < chance) {
            defender.shocked = true;
            return  `**${attacker.title}** stunned **${defender.title}** using Shock (${chance}% shock chance)!`;
        }
        return null;
    },

    void: (damage, attacker, defender) => {
        let necroDamage = Math.max(1, damage - defender.plate);
        necroDamage = Math.max(0, necroDamage - defender.shield);
        let log = necroDamage > 0;
        defender.necroHealth = Math.min(defender.maxHealth, defender.necroHealth + necroDamage);
        return  log ? `**${attacker.title}** necroed **${necroDamage} Health** ** from **${defender.title}**!` : null;
    },

    bio: (damage, attacker, defender) => {
        let chemicalHeal = Math.max(0, (damage - defender.plate)/2);
        let log = chemicalHeal > 0 && attacker.health < attacker.necroHealth;
        attacker.heal(chemicalHeal);
        return  log ? `**${attacker.title}** healed **${chemicalHeal} Health** to themselves using **Chemicals**!` : "";
    }
}

module.exports = {
    Effect: class {
        constructor(title, level, apply, cancelDamage) {
            this.title = title !== null ? title.charAt(0).toUpperCase() + title.slice(1) : "";
            this.level = level;
            this.apply = apply;
            this.cancelDamage = cancelDamage;
        }
    },

    effect_list: effectList,

    get_effect: (title, level) => {
        return effectList.hasOwnProperty(title) ? new module.exports.Effect(title, level, effectList[title], title === 'fire') : null;
    }
}
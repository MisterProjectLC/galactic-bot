
const effectList = {
    fire: (damage, attacker, defender) => {
        defender.health = Math.max(0, defender.health - damage);
        return `**${attacker.title}** dealt **${damage} Fire damage** to **${defender.title}**'s Health!`;
    },

    acid: (damage, attacker, defender) => {
        let log = defender.plate > 0;
        let acidDamage = Math.max(1, Math.round(damage/2));
        defender.plate = Math.max(0, defender.plate - acidDamage);
        return log ? `**${attacker.title}** dealt **${acidDamage} Acid damage** to **${defender.title}**'s Plate! It is now at ${defender.plate}.` : null;
    },

    plasma: (damage, attacker, defender) => {
        console.log("PLASMA");
        let log = defender.shield > 0;
        let plasmaDamage = Math.max(1, damage - defender.plate);
        defender.shield = Math.max(0, defender.shield - plasmaDamage);
        return log ? `**${attacker.title}** dealt **${plasmaDamage} extra Plasma damage** to **${defender.title}**'s Shield!` : null;
    },

    freeze: (damage, attacker, defender) => {
        let log = defender.evasion > 0;
        let freezeDamage = Math.max(1, (damage - defender.plate));
        defender.evasion = Math.max(0, defender.evasion - freezeDamage);
        return log ? `**${attacker.title}** dealt **${freezeDamage} Ice damage** to **${defender.title}**'s Evasion! It is now at **${defender.evasion}%**.` : null;
    },

    shock: (damage, attacker, defender) => {
        let rand = Math.random()*100;
        if (rand < Math.max(40, damage/Math.max(1, defender.plate))) {
            defender.shocked = true;
            return  `**${attacker.title}** stunned **${defender.title}** using Shock!`;
        }
        return null;
    },

    virus: (damage, attacker, defender) => {
        let necroDamage = Math.max(0, (damage - defender.shield) - defender.plate);
        let log = necroDamage > 0;
        defender.necroHealth = Math.min(defender.maxHealth, defender.necroHealth + necroDamage);
        return  log ? `**${attacker.title}** necroed **${necroDamage} Health** ** from **${defender.title}**!` : null;
    },

    chemical: (damage, attacker, defender) => {
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
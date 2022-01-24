
const effectList = {
    fire: (damage, attacker, defender, weaponTitle) => {
        let halfDamage = Math.round(Math.max(1, (damage  - defender.plate)/2));
        let leftoverDamage = Math.max(0, halfDamage - defender.shield);
        let shieldDamage = halfDamage - leftoverDamage;
        defender.shield -= shieldDamage;

        let healthDamage = leftoverDamage + Math.round(Math.max(1, damage/2));
        defender.health = Math.max(0, defender.health - healthDamage);

        let shieldMessage = `**${attacker.title}** dealt **${shieldDamage} damage** to **${defender.title}**'s Shields and **${attacker.title}** dealt **${healthDamage} Fire damage** to **${defender.title}**'s Health using **${weaponTitle}**!`;
        let healthMessage = `**${attacker.title}** dealt **${healthDamage} Fire damage** to **${defender.title}**'s Health using **${weaponTitle}**!`;
        return (shieldDamage > 0) ? shieldMessage : healthMessage;
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

    void: (damage, attacker, defender, weaponTitle) => {
        let effectiveDamage = Math.max(1, damage - defender.plate);
        let necroDamage = Math.max(0, effectiveDamage - defender.shield);
        defender.shield = Math.max(0, defender.shield - effectiveDamage);
        defender.health = Math.max(0, defender.health - necroDamage);
        let log = necroDamage > 0;

        defender.necroHealth = Math.min(defender.maxHealth, defender.necroHealth + necroDamage);
        console.log("NecroHealth " + defender.necroHealth);

        let shieldMessage = `**${attacker.title}** dealt **${effectiveDamage} damage** to **${defender.title}** using **${weaponTitle}**!`;
        let healthMessage = `**${attacker.title}** voided **${necroDamage} Health** from **${defender.title}**!`;
        return  shieldMessage + (log ? '\n' + healthMessage : '');
    },

    bio: (damage, attacker, defender) => {
        let chemicalHeal = Math.max(0, (damage - defender.plate)/2);
        let log = chemicalHeal > 0 && attacker.health < attacker.maxHealth - attacker.necroHealth;
        attacker.heal(chemicalHeal);
        return  log ? `**${attacker.title}** healed **${chemicalHeal} Health** using **Bio**!` : null;
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
        return effectList.hasOwnProperty(title) ? new module.exports.Effect(title, level, effectList[title], title === 'fire' || title === 'void') : null;
    }
}
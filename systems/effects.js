
const effect_list = {
    fire: (damage, attacker, defender) => {
        defender.health = Math.max(0, defender.health - Math.max(1, damage/2));
    },

    acid: (damage, attacker, defender) => {
        defender.plate -= Math.round(damage/10);
    },

    plasma: (damage, attacker, defender) => {
        defender.shield = Math.max(0, defender.shield - Math.max(1, damage - defender.plate));
    },

    freeze: (damage, attacker, defender) => {
        defender.evasion = Math.max(0, defender.evasion - Math.max(1, (damage - defender.plate)/10));
    },

    shock: (damage, attacker, defender) => {
        defender.shocked = true;
    },

    virus: (damage, attacker, defender) => {
        defender.antihealed = true;
    },

    chemical: (damage, attacker, defender) => {
        if (!attacker.antihealed)
            attacker.heal(damage);
    }
}

module.exports = {
    Effect: class {
        constructor(title, level, apply) {
            this.title = title !== null ? title.charAt(0).toUpperCase() + title.slice(1) : "";
            this.level = level;
            this.apply = apply;
        }
    },

    effect_list: effect_list,

    get_effect: (title, level) => {
        return effect_list.hasOwnProperty(title) ? new module.exports.Effect(title, level, effect_list[title]) : null;
    }
}
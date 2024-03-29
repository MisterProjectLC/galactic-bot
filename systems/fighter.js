module.exports.Fighter = class {
    constructor(title, image, health, shield, plate, regen, evasion, weapons) {
        this.title = title;
        this.image = image;
        this.maxHealth = health;
        this.necroHealth = 0;
        this.health = health;
        this.maxShield = shield;
        this.shield = shield;
        this.plate = plate;
        this.regen = regen;
        this.evasion = evasion;
        this.evasionSum = 0;
        this.weapons = weapons;

        this.shocked = false;
        this.antihealed = false;
    }

    takeDamage(damage) {
        let effectiveDamage = Math.max(1, damage - this.plate);
        let healthDamage = Math.max(0, effectiveDamage - this.shield);
        this.shield = Math.max(0, this.shield - effectiveDamage);
        this.health = Math.max(0, this.health - healthDamage);
        return effectiveDamage;
    }

    heal(heal) {
        this.health = Math.min(this.maxHealth - this.necroHealth, this.health + heal);
    }
}
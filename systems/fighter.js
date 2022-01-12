module.exports.Fighter = class {
    constructor(title, image, health, shield, plate, regen, evasion, weapons) {
        this.title = title;
        this.image = image;
        this.max_health = health;
        this.health = health;
        this.max_shield = shield;
        this.shield = shield;
        this.plate = plate;
        this.regen = regen;
        this.evasion = evasion;
        this.weapons = weapons;

        this.shocked = false;
        this.antihealed = false;
        this.frozen = false;
    }

    takeDamage(damage) {
        let effectiveDamage = Math.max(0, damage - this.plate);
        let healthDamage = Math.max(0, effectiveDamage - this.shield);
        this.shield = Math.max(0, this.shield - effectiveDamage);
        this.health = Math.max(0, this.health - healthDamage);
        return effectiveDamage;
    }
}
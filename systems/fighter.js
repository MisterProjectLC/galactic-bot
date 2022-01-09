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

    take_damage(damage) {
        let effective_damage = Math.max(0, damage - this.plate);
        let health_damage = Math.max(0, effective_damage - this.shield);
        this.shield = Math.max(0, this.shield - effective_damage);
        this.health = Math.max(0, this.health - health_damage);
        return effective_damage;
    }
}
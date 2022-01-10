module.exports.Weapon = class {
    constructor(title, damage, rate, effect) {
        this.title = title;
        this.damage = Math.round(damage);
        this.charge = 0;
        this.rate = rate;
        this.effect = effect;
    }
};
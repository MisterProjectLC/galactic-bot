
module.exports = {     
    healthbar: (health, maxHealth, necroHealth = 0) => {
        let effectiveMaxHealth = maxHealth-necroHealth;
        let healthbar = "";
        for (let i = 0; i < 10; i++)
            healthbar += maxHealth > 0 ? (i < 10*health/maxHealth ? (i < 10*health/effectiveMaxHealth ? "█" : "X") : "░") : "░";
        return healthbar;
    }
}
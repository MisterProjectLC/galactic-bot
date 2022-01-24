
module.exports = {     
    healthbar: (health, maxHealth, necroHealth = 0) => {
        let healthbar = "";
        for (let i = 0; i < 10; i++)
            healthbar += maxHealth > 0 ? (i < 10*health/maxHealth ? "█" : (10-i > 10*necroHealth/maxHealth ? "░" : "X")) : "░";
        return healthbar;
    }
}
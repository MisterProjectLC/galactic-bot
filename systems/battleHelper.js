
module.exports = {     
    healthbar: (health, maxhealth) => {
        let healthbar = "";
        for (let i = 0; i < 10; i++)
            healthbar += maxhealth > 0 ? ((i < 10*health/maxhealth) ? "█" : "░") : "░";
        return healthbar;
    }
}
const battle = require('../systems/battle');
const {capitalize} = require('../utils/capitalize');
const saved_messages = require('../utils/saved_messages');

module.exports = {
    generatePlayer: (player) => {
        player.armors.list.forEach(armor => {
            player.info.health += armor.health*armor.level;
            player.info.shield += armor.shield*armor.level;
            player.info.plate += armor.plate*armor.level;
            player.info.regen += armor.regen*armor.level;
            player.info.evasion += armor.evasion*armor.level;
        });
    
        return new battle.Fighter(player.info.title, player.info.imageurl, player.info.health, player.info.shield, player.info.plate, 
            player.info.regen, player.info.evasion, player.weapons.list.map(weapon => {
                return new battle.Weapon(weapon.title, weapon.level*weapon.damage_per_level, weapon.rate, 
                    battle.effects.get_effect(weapon.effect_title, weapon.level))
            })
        );
    },
    
    
    generateEnemy: (enemy) => {
        return new battle.Fighter(enemy.title, enemy.image_link, enemy.health, enemy.shield, enemy.plate, enemy.regen, enemy.evasion, 
            [new battle.Weapon(enemy.weapon_title, enemy.damage_per_level*enemy.weapon_level, 
                enemy.rate, battle.effects.get_effect(enemy.effect_title, enemy.weapon_level))
            ]);
    },
    
    
    generateBattle: async (combatantsA, combatantsB, msg) => {
        return await new battle.Battle(combatantsA, combatantsB).battle(msg.channel);
    },

    buildWeaponLine: (weapon) => {
        return `${weapon.damage_per_level*weapon.level} DMG, ${weapon.rate} attack(s) per turn, Effect: ${weapon.effect_title !== null ? 
            capitalize(weapon.effect_title) : "None"}`;
    },
    
    buildArmorLine: (armor) => {
        return `${armor.health*armor.level} HP, ${armor.shield*armor.level} Shields, ${armor.plate*armor.level} Plate, ` +
        `${armor.regen*armor.level} Regen, ${armor.evasion*armor.level} Evasion, Resistant to Effect: ${armor.effect_title !== null ? 
            capitalize(armor.effect_title) : "None"}`;
    },

    cleanup: (pkg) => {
        // Cleanup
        if (saved_messages.get_message('encounterMain', pkg.msg.id) != null) {
            pkg.players.forEach(player => {
                player.weapons.msg.delete().catch((err) => console.log('Could not delete the message', err));
                saved_messages.remove_message('encounterPlayer', player.weapons.msg.id);
            });
    
            pkg.players.forEach(player => {
                player.armors.msg.delete().catch((err) => console.log('Could not delete the message', err));
                saved_messages.remove_message('encounterPlayer', player.armors.msg.id);
            });
    
            pkg.msg.delete().catch((err) => console.log('Could not delete the message', err));
            saved_messages.remove_message('encounterMain', pkg.msg.id);
        }
    }
}
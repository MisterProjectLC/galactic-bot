const battle = require('./battle');

test('fighter construction test', () => {
  let player = {title: 'Chefinho', health: 5, shield: 0, plate: 0, regen: 0, evasion: 0};
  let player_weapons = [{title: 'Gun', level: 1, damage_per_level: 4, rate: 1, effect_title: null}];
  let player_armors = [];
  
  player_armors.forEach(armor => {
    player.health += armor.health;
    player.shield += armor.shield;
    player.plate += armor.plate;
    player.regen += armor.regen;
    player.evasion += armor.evasion;
  });

  expect(new battle.Fighter(player.title, player.health, player.shield, player.plate, player.regen, player.evasion, 
          player_weapons.map(player_weapon => {
                  return new battle.Weapon(player_weapon.title, player_weapon.level*player_weapon.damage_per_level, player_weapon.rate, 
                                          battle.effects.get_effect(player_weapon.effect_title, player_weapon.level))
          })
      ).weapons[0].title, 
  ).toEqual('Gun');
});
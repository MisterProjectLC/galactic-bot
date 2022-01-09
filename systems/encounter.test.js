const encounter = require('./encounter');

const emojiNumbers = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', 
                    '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

test('emoji numbers test', () => {
  expect(emojiNumbers.lastIndexOf('7️⃣')).toEqual(7);
});

test('player generation test', () => {
  let player = {title: 'Chefinho', health: 5, shield: 0, plate: 0, regen: 0, evasion: 0};
  let player_weapons = [{title: 'Gun', level: 1, damage_per_level: 4, rate: 1, effect_title: null}];

  expect(encounter.generatePlayer(player, player_weapons, []).title).toEqual('Chefinho');
});

test('player generation weapon test', () => {
  let player = {title: 'Chefinho', health: 5, shield: 0, plate: 0, regen: 0, evasion: 0};
  let player_weapons = [{title: 'Gun', level: 1, damage_per_level: 4, rate: 1, effect_title: null}];

  expect(encounter.generatePlayer(player, player_weapons, []).weapons[0].title).toEqual('Gun');
});
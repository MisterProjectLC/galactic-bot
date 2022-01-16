create_weapon('title', dmg, rate, level, cost);
create_weapon_effect('title', dmg, rate, 'effect_title', level, cost);
create_enemy_weapon('title', dmg, rate);
create_enemy_weapon_effect('title', dmg, rate, 'effect_title');
buy_weapon('ID DA PESSOA', 'Gun');
remove_weapon('ID DA PESSOA', 'Gun');

UPDATE weapons SET title = 'Pulse Pistol' WHERE title = 'Power Shot';

create_armor('title', health, shield, plate, regen, evasion, level, cost);
create_armor_effect('title', health, shield, plate, regen, evasion, effect_title, level, cost);
buy_armor('ID DA PESSOA', 'Gun');
remove_armor('ID DA PESSOA', 'Gun');

create_weapon('title', dmg, rate, level, cost);
create_weapon_effect('title', dmg, rate, 'effect_title', level, cost);


SELECT create_armor('Shield Armor', 0, 8, 0, 0, 0, 0, 50);

SELECT create_weapon_effect('Plasma Sword', 3, 2, 'plasma', 10, 75);
SELECT create_weapon_effect('Plasma Gun', 6, 1, 'plasma', 10, 75);
SELECT create_weapon_effect('Plasma Cannon', 15, 0.5, 'plasma', 10, 75);

SELECT create_armor('Combat Suit', 3, 12, 0, 0, 0, 10, 75);
SELECT create_armor('Biomodification', 0, 9, 0, 0, 0, 10, 75);
SELECT create_armor('Light Armor', 0, 0, 0, 0, 0.5, 10, 75);

SELECT create_weapon('Four Slices', 4, 4, 30, 125);
SELECT create_weapon('Power Shot', 16, 1, 30, 125);
SELECT create_weapon('Space Cannon', 40, 0.5, 30, 125);

SELECT create_armor('Plasma Shield', 0, 32, 0, 0, 0, 30, 125);
SELECT create_armor('Scale Skin', 16, 0, 0, 0, 0, 30, 125);
SELECT create_armor('Platinum', 0, 0, 3, 0, 0, 30, 125);

SELECT create_weapon_effect('Winter Sword', 4, 3, 'freeze', 30, 125);
SELECT create_weapon_effect('Thunder Sword', 4, 3, 'shock', 30, 125);
SELECT create_weapon_effect('Freeze Ray', 12, 1, 'freeze', 30, 125);
SELECT create_weapon_effect('The Shocker', 12, 1, 'shock', 30, 125);
SELECT create_weapon_effect('Ice Cannon', 30, 0.5, 'freeze', 30, 125);
SELECT create_weapon_effect('Tesla Cannon', 30, 0.5, 'shock', 30, 125);

SELECT create_weapon('Fifth Blade', 6, 5, 50, 200);
SELECT create_weapon('Deadlock Revolver', 30, 1, 50, 200);
SELECT create_weapon('Galaxy Cannon', 75, 0.5, 50, 200);

SELECT create_weapon_effect('Caustic Sword', 6, 4, 'acid', 50, 200);
SELECT create_weapon_effect('Caustic Shooter', 24, 1, 'acid', 50, 200);
SELECT create_weapon_effect('Caustic Cannon', 60, 0.5, 'acid', 50, 200);

SELECT create_armor('Battle Armor', 10, 40, 0, 0, 0, 50, 200);
SELECT create_armor('Solarhealer', 0, 0, 0, 15, 0, 50, 200);
SELECT create_armor('Phase Suit', 0, 0, 0, 0, 1, 50, 200);


LEVEL 50 (200 coins)
Battle Armor: 10 Health, 40 Shield -> 1000 Health, 4000 Shield
Solarhealer: 15 regen -> 1500 regen
Phase Suit: 1% Evasion -> 100% Evasion 
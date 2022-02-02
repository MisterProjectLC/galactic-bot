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

----

SELECT create_armor('Shield Armor', 0, 8, 0, 0, 0, 0, 50);

----

SELECT create_weapon_effect('Plasma Sword', 3, 2, 'plasma', 10, 75);
SELECT create_weapon_effect('Plasma Gun', 6, 1, 'plasma', 10, 75);
SELECT create_weapon_effect('Plasma Cannon', 15, 0.5, 'plasma', 10, 75);

SELECT create_armor('Combat Suit', 3, 12, 0, 0, 0, 10, 75);
SELECT create_armor('Biomodification', 0, 9, 0, 0, 0, 10, 75);
SELECT create_armor('Light Armor', 0, 0, 0, 0, 0.5, 10, 75);

----

SELECT create_weapon('Four Slices', 4, 4, 30, 125);
SELECT create_weapon('Power Shot', 16, 1, 30, 125);
SELECT create_weapon('Space Cannon', 40, 0.5, 30, 125);

SELECT create_weapon_effect('Winter Sword', 4, 3, 'freeze', 30, 125);
SELECT create_weapon_effect('Thunder Sword', 4, 3, 'shock', 30, 125);
SELECT create_weapon_effect('Freeze Ray', 12, 1, 'freeze', 30, 125);
SELECT create_weapon_effect('The Shocker', 12, 1, 'shock', 30, 125);
SELECT create_weapon_effect('Ice Cannon', 30, 0.5, 'freeze', 30, 125);
SELECT create_weapon_effect('Tesla Cannon', 30, 0.5, 'shock', 30, 125);

SELECT create_armor('Shield Mk II', 0, 32, 0, 0, 0, 30, 125);
SELECT create_armor('Scale Skin', 16, 0, 0, 0, 0, 30, 125);
SELECT create_armor('Platinum', 0, 0, 2, 0, 0, 30, 125);

----

SELECT create_weapon('Fifth Blade', 6, 5, 50, 200);
SELECT create_weapon('Deadlock Revolver', 30, 1, 50, 200);
SELECT create_weapon('Galaxy Cannon', 75, 0.5, 50, 200);

SELECT create_weapon_effect('Caustic Sword', 6, 4, 'acid', 50, 200);
SELECT create_weapon_effect('Caustic Shooter', 24, 1, 'acid', 50, 200);
SELECT create_weapon_effect('Caustic Cannon', 60, 0.5, 'acid', 50, 200);
SELECT create_weapon_effect('Crimson', 24, 1, 'fire', 50, 200);
SELECT create_weapon_effect('Chroma', 6, 4, 'plasma', 50, 200);

SELECT create_armor('Battle Armor', 10, 40, 0, 0, 0, 50, 200);
SELECT create_armor('Solarhealer', 0, 0, 0, 15, 0, 50, 200);
SELECT create_armor('Phase Suit', 0, 0, 0, 0, 1, 50, 200);

----

SELECT create_weapon('Hexasaber', 8, 6, 70, 300);
SELECT create_weapon('Laser Rifle', 48, 1, 70, 300);
SELECT create_weapon('Universe Cannon', 120, 0.5, 70, 300);

SELECT create_weapon_effect('Bio Blade', 8, 5, 'bio', 70, 300);
SELECT create_weapon_effect('Bio Rifle', 40, 1, 'bio', 70, 300);
SELECT create_weapon_effect('Bio Cannon', 100, 0.5, 'bio', 70, 300);
SELECT create_weapon_effect('Void Saber', 8, 5, 'void', 70, 300);
SELECT create_weapon_effect('Void Revolver', 40, 1, 'void', 70, 300);
SELECT create_weapon_effect('Void Cannon', 100, 0.5, 'void', 70, 300);
SELECT create_weapon_effect('Cryolauncher', 100, 0.5, 'freeze', 70, 300);
SELECT create_weapon_effect('Stormshot', 40, 1, 'shock', 70, 300);

SELECT create_armor('Shield Mk III', 0, 96, 0, 0, 0, 70, 300);
SELECT create_armor('Mutant Serum', 48, 0, 0, 0, 0, 70, 300);
SELECT create_armor('Titanium', 0, 0, 6, 0, 0, 70, 300);

----

SELECT create_weapon('Omnislash', 10, 7, 90, 450);
SELECT create_weapon('Blacktrigger', 70, 1, 90, 450);
SELECT create_weapon('Reality Cannon', 175, 0.5, 90, 450);

SELECT create_weapon('Wrath', 18, 4, 90, 450);
SELECT create_weapon('Darksisters', 35, 2, 90, 450);
SELECT create_weapon('Cataclysm', 450, 0.25, 90, 450);

SELECT create_weapon_effect('Scarlet', 10, 6, 'fire', 90, 450);
SELECT create_weapon_effect('Titanfall', 140, 0.5, 'fire', 90, 450);

SELECT create_weapon_effect('Lightstreak', 60, 1, 'plasma', 90, 450);
SELECT create_weapon_effect('Starfusion', 140, 0.5, 'plasma', 90, 450);

SELECT create_weapon_effect('Arctic', 10, 6, 'freeze', 90, 450);
SELECT create_weapon_effect('Borealis', 60, 1, 'freeze', 90, 450);

SELECT create_weapon_effect('Blitz', 10, 6, 'shock', 90, 450);
SELECT create_weapon_effect('Teslacannon', 140, 0.5, 'shock', 90, 450);

SELECT create_weapon_effect('Lazarus', 60, 1, 'acid', 90, 450);
SELECT create_weapon_effect('Blightbomb', 140, 0.5, 'acid', 90, 450);

SELECT create_weapon_effect('Dracula', 10, 6, 'bio', 90, 450);
SELECT create_weapon_effect('Lysissoma', 60, 1, 'bio', 90, 450);

SELECT create_weapon_effect('Obsidian', 10, 6, 'void', 90, 450);
SELECT create_weapon_effect('Voidmaker', 140, 0.5, 'void', 90, 450);

SELECT create_armor('Starforge Armor', 25, 95, 0, 0, 0, 90, 450);
SELECT create_armor('Overshield', 0, 140, 0, 0, 0, 90, 450);
SELECT create_armor('Cyborg Mod', 70, 0, 0, 0, 0, 90, 450);
SELECT create_armor('Darkplate', 0, 0, 9, 0, 0, 90, 450);
SELECT create_armor('Timewinder', 0, 0, 0, 35, 0, 90, 450);
SELECT create_armor('Quantum Suit', 0, 0, 0, 0, 2, 90, 450);




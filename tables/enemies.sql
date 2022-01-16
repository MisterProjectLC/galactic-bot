create_enemy('title', xp, coins, health, shield, plate, regen, evasion, 'weapon', damage, rate);
create_enemy('title', xp, coins, health, shield, plate, regen, evasion, 'weapon', damage, rate, effect);
alter_enemy_weapon('Teste', 'Sword');

UPDATE entities SET health = 60 WHERE id = (SELECT entity FROM enemies WHERE title = 'Trooper');

SELECT create_enemy('Giant Wasp', 400, 25, 8, 0, 0, 0, 0, 'Sting', 40, 1);
SELECT create_enemy('Trooper', 400, 25, 60, 0, 0, 0, 0, 'Blaster', 8, 1);
SELECT create_enemy('title', 400, 25, 45, 0, 0, 0, 0, 'Punch', 20, 0.5);

SELECT create_enemy('Shield Robot', 600, 40, 20, 220, 0, 0, 0, 'Robot Laser Ray', 60, 0.5);
SELECT create_enemy_effect('Blaze', 600, 40, 90, 0, 0, 0, 0, 'Firebolt', 30, 2, 'fire');
SELECT create_enemy_effect('Sun Alien', 600, 40, 75, 75, 0, 0, 0, 'Sun Wave', 50, 1, 'plasma');
SELECT create_enemy('Laser Soldier', 600, 40, 60, 120, 0, 0, 0, 'Laser Musket', 30, 1);

SELECT create_enemy_effect('Acid Driller', 2000, 100, 900, 0, 0, 0, 40, 'Acid Drill', 20, 6, 'acid');
SELECT create_enemy('Plate Guardian', 2000, 100, 500, 0, 50, 0, 0, 'Astrohammer', 200, 0.5);
SELECT create_enemy_effect('Ice Captain', 2000, 100, 400, 0, 25, 0, 0, 'Twin Glacial', 75, 2, 'freeze');
SELECT create_enemy_effect('Titan Follower', 2000, 100, 400, 0, 25, 0, 0, 'Firespear', 75, 1, 'fire');
SELECT create_enemy_effect('Shock Trooper', 2000, 100, 400, 800, 0, 0, 0, 'Stun Rifle', 60, 1, 'shock');

SELECT create_enemy_effect('The Warden', 6000, 400, 900, 1800, 0, 0, 0, 'Solar Railgun', 650, 0.25, 'plasma');
SELECT create_enemy_effect('Ion Viper', 9000, 750, 1600, 2400, 0, 0, 225, 'Shockstorm', 75, 5, 'shock');
SELECT create_enemy_effect('Red Titan', 20000, 1000, 8000, 0, 300, 0, 0, 'Titan Punch', 150, 1, 'fire');
SELECT create_enemy_effect('Doctor Science', 30000, 1500, 12000, 5000, 0, 1000, 0, 'Eureka Ray', 1600, 0.5, 'chemical');

INSERT INTO adventures(title, min_level) VALUES ('Planet Adventure', 0);
INSERT INTO adventures(title, min_level) VALUES ('Solar Adventure', 10);
INSERT INTO adventures(title, min_level) VALUES ('Space Adventure', 30);
INSERT INTO adventures(title, min_level) VALUES ('Galactic Adventure', 50);

INSERT INTO conquests(title, min_level, min_size) VALUES ('Andor', 10, 2);
INSERT INTO conquests(title, min_level, min_size) VALUES (E'Axs\'alis', 30, 4);
INSERT INTO conquests(title, min_level, min_size) VALUES ('Torqyl', 50, 6);

SELECT insert_enemy_into_adventure('Giant Wasp', 'Planet Adventure');
SELECT insert_enemy_into_adventure('Trooper', 'Planet Adventure');
SELECT insert_enemy_into_adventure('Blorger', 'Planet Adventure');

SELECT insert_enemy_into_adventure('Shield Robot', 'Solar Adventure');
SELECT insert_enemy_into_adventure('Blaze', 'Solar Adventure');
SELECT insert_enemy_into_adventure('Sun Alien', 'Solar Adventure');
SELECT insert_enemy_into_adventure('Laser Soldier', 'Solar Adventure');

SELECT insert_enemy_into_adventure('Shock Rock', 'Space Adventure');
SELECT insert_enemy_into_adventure('Shifter', 'Space Adventure');
SELECT insert_enemy_into_adventure('Snowtrooper', 'Space Adventure');
SELECT insert_enemy_into_adventure('Lavaspawn', 'Space Adventure');
SELECT insert_enemy_into_adventure('Machinegunner', 'Space Adventure');

SELECT insert_enemy_into_adventure('Acid Driller', 'Galactic Adventure');
SELECT insert_enemy_into_adventure('Plate Guardian', 'Galactic Adventure');
SELECT insert_enemy_into_adventure('Ice Captain', 'Galactic Adventure');
SELECT insert_enemy_into_adventure('Titan Follower', 'Galactic Adventure');
SELECT insert_enemy_into_adventure('Shock Trooper', 'Galactic Adventure');


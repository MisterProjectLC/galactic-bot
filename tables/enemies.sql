create_enemy('title', xp, coins, health, shield, plate, regen, evasion, 'weapon', damage, rate);
create_enemy('title', xp, coins, health, shield, plate, regen, evasion, 'weapon', damage, rate, effect);
alter_enemy_weapon('Teste', 'Sword');

UPDATE entities SET health = 60 WHERE id = (SELECT entity FROM enemies WHERE title = 'Trooper');

UPDATE weapons SET damage_per_level = 1250
WHERE id = (SELECT weapon FROM enemies 
			WHERE title = 'Doctor Science');

LEVEL 0
SELECT create_enemy('Giant Wasp', 400, 25, 8, 0, 0, 0, 0, 'Sting', 40, 1);
SELECT create_enemy('Trooper', 400, 25, 60, 0, 0, 0, 0, 'Blaster', 8, 1);
SELECT create_enemy('title', 400, 25, 45, 0, 0, 0, 0, 'Punch', 20, 0.5);
--------
LEVEL 10
SELECT create_enemy('Shield Robot', 600, 40, 20, 220, 0, 0, 0, 'Robot Laser Ray', 60, 0.5);
SELECT create_enemy_effect('Blaze', 600, 40, 90, 0, 0, 0, 0, 'Firebolt', 30, 2, 'fire');
SELECT create_enemy_effect('Sun Alien', 600, 40, 75, 75, 0, 0, 0, 'Sun Wave', 50, 1, 'plasma');
SELECT create_enemy('Laser Soldier', 600, 40, 60, 120, 0, 0, 0, 'Laser Musket', 30, 1);
-------------------
LEVEL 30
SELECT create_enemy_effect('Acid Driller', 2000, 100, 450, 0, 0, 0, 40, 'Acid Drill', 20, 6, 'acid');
SELECT create_enemy('Plate Guardian', 2000, 100, 500, 0, 50, 0, 0, 'Astrohammer', 200, 0.5);
SELECT create_enemy_effect('Ice Captain', 2000, 100, 400, 0, 25, 0, 0, 'Twin Glacial', 75, 2, 'freeze');
SELECT create_enemy_effect('Titan Follower', 2000, 100, 400, 0, 25, 0, 0, 'Firespear', 75, 1, 'fire');
SELECT create_enemy_effect('Plasma Trooper', 2000, 100, 400, 400, 0, 0, 0, 'Stun Rifle', 175, 0.5, 'plasma');
---------------------
LEVEL 90
SELECT create_enemy('Interloper', 6000, 225, 600, 750, 0, 0, 500, 'Twin Shifts', 800, 2);
SELECT create_enemy('Terminator', 6000, 225, 1200, 3000, 600, 0, 0, 'Terminate', 2000, 0.5);

SELECT create_enemy_effect('Scorched Core', 6000, 225, 1500, 0, 0, 500, 0, 'Fire Nova', 1000, 1, 'fire');
SELECT create_enemy_effect('Ice Overlord', 6000, 225, 1000, 2000, 500, 0, 0, 'Frigid Barrage', 750, 4, 'freeze');
SELECT create_enemy_effect('Siphon Mother', 6000, 225, 2000, 0, 0, 0, 100, 'Greater Siphon', 3000, 0.5, 'bio');
SELECT create_enemy_effect('Planet Purger', 6000, 225, 1000, 0, 200, 500, 0, 'Purge', 240, 5, 'acid');
SELECT create_enemy_effect('Primordial Void', 6000, 225, 2000, 0, 0, 100, 250, 'Antimatter', 2500, 0.5, 'void');
SELECT create_enemy_effect('Celestial', 6000, 225, 100, 1000, 0, 0, 0, 'Hundred Fusions', 1000, 4, 'plasma');
SELECT create_enemy_effect('Storm Incarnate', 6000, 225, 500, 500, 200, 0, 300, 'Stormcall', 3000, 0.5, 'shock');

----------------------
BOSS
SELECT create_enemy_effect('The Warden', 6000, 400, 900, 1800, 0, 0, 0, 'Solar Railgun', 650, 0.25, 'plasma');
SELECT create_enemy_effect('Ion Viper', 9000, 750, 1600, 2400, 0, 0, 225, 'Shockstorm', 75, 5, 'shock');
SELECT create_enemy_effect('Red Titan', 20000, 1000, 8000, 0, 300, 0, 0, 'Titan Punch', 150, 1, 'fire');
SELECT create_enemy_effect('Doctor Science', 30000, 1500, 12000, 5000, 0, 1000, 0, 'Eureka Ray', 1600, 0.5, 'chemical');
SELECT create_enemy_effect('Voidbringer', 80000, 3000, 10000, 20000, 1000, 5000, 1000, 'Black Hole', 2100, 3, 'void');

----------------
INSERT INTO adventures(title, min_level) VALUES ('Planet Adventure', 0);
INSERT INTO adventures(title, min_level) VALUES ('Solar Adventure', 10);
INSERT INTO adventures(title, min_level) VALUES ('Space Adventure', 30);
INSERT INTO adventures(title, min_level) VALUES ('Galactic Adventure', 50);
INSERT INTO adventures(title, min_level) VALUES ('Universe Adventure', 70);
INSERT INTO adventures(title, min_level) VALUES ('Ultimate Adventure', 90);

INSERT INTO conquests(title, min_level, min_size) VALUES ('Andor', 10, 2);
INSERT INTO conquests(title, min_level, min_size) VALUES (E'Axs\'alis', 30, 4);
INSERT INTO conquests(title, min_level, min_size) VALUES ('Torqyl', 50, 6);
----------------------

--------------------
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
SELECT insert_enemy_into_adventure('Plasma Trooper', 'Galactic Adventure');

SELECT insert_enemy_into_adventure('Flare Dame', 'Universe Adventure');
SELECT insert_enemy_into_adventure('Gray Titan', 'Universe Adventure');
SELECT insert_enemy_into_adventure('Void Shadow', 'Universe Adventure');
SELECT insert_enemy_into_adventure('Ice General', 'Universe Adventure');
SELECT insert_enemy_into_adventure('Thunder Assassin', 'Universe Adventure');
SELECT insert_enemy_into_adventure('Sideral Siphon', 'Universe Adventure');

SELECT insert_enemy_into_adventure('Interloper', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Terminator', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Scorched Core', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Ice Overlord', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Siphon Mother', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Planet Purger', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Primordial Void', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Celestial', 'Ultimate Adventure');
SELECT insert_enemy_into_adventure('Storm Incarnate', 'Ultimate Adventure');
--------------------------

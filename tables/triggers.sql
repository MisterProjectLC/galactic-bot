CREATE OR REPLACE FUNCTION player_entity() RETURNS trigger AS $$
BEGIN
	with rows as (
		INSERT INTO entities(health, shield, armor, regen, evasion) VALUES(10, 0, 0, 0, 0) RETURNING id
	)
	UPDATE players SET entity = rows.id FROM rows WHERE players.id = new.id;
	RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_player_entity AFTER INSERT ON players
	FOR EACH ROW
	EXECUTE PROCEDURE player_entity();



CREATE OR REPLACE FUNCTION enemy_entity() RETURNS trigger AS $$
BEGIN
	with rows as (
		INSERT INTO entities(health, shield, armor, regen, evasion) VALUES(10, 0, 0, 0, 0) RETURNING id
	)
	UPDATE enemies SET entity = rows.id FROM rows WHERE enemies.id = new.id;
	RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enemy_entity AFTER INSERT ON enemies
	FOR EACH ROW
	EXECUTE PROCEDURE enemy_entity();



CREATE OR REPLACE FUNCTION insert_enemy(ititle text, igiven_xp int, igiven_coins int, ihealth int, ishield int, iarmor int, iregen int, ievasion int, iweapon text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO enemies(title, given_xp, given_coins, weapon) SELECT ititle, igiven_xp, igiven_coins, weapons.id
	FROM weapons WHERE weapons.title = iweapon;
	UPDATE entities SET health = ihealth, shield = ishield, armor = iarmor, regen = iregen, evasion = ievasion;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION insert_enemy_into_adventure(enemy_title text, adventure_title text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO enemiesAdventures 
	SELECT enemies.id, adventures.id 
	FROM enemies, adventures 
	WHERE enemies.title = enemy_title AND adventures.title = adventure_title;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION buy_weapon(user_id text, weapon_title text) RETURNS BOOLEAN AS $$
BEGIN
	IF (NOT EXISTS (SELECT player_id FROM playersWeapons WHERE player_id = (SELECT id FROM players WHERE userid = user_id)
	AND weapon_id = (SELECT id FROM weapons WHERE title = weapon_title))) THEN
		INSERT INTO playersWeapons(player_id, weapon_id)
		SELECT players.id, weapons.id 
		FROM players, weapons
		WHERE players.userid = user_id AND weapons.title = weapon_title;
	ELSE
		UPDATE playersWeapons SET level = level + 1
		WHERE player_id = (SELECT id FROM players WHERE userid = user_id)
		AND weapon_id = (SELECT id FROM weapons WHERE title = weapon_title);
	END IF;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION remove_weapon(user_id text, weapon_title text) RETURNS BOOLEAN AS $$
BEGIN
	DELETE FROM playersWeapons WHERE player_id = (
		SELECT players.id FROM players WHERE players.userid = user_id)
		AND weapon_id = (SELECT weapons.id FROM weapons WHERE weapons.title = weapon_title);
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION alter_enemy_weapon(enemy_title text, weapon_title text) RETURNS BOOLEAN AS $$
BEGIN
	UPDATE enemy SET weapon = (SELECT id FROM weapons WHERE title ilike weapon_title)
	WHERE title ilike enemy_title;
	RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION alter_enemy_weapon_level(enemy_title text, enemy_level int) RETURNS BOOLEAN AS $$
BEGIN
	UPDATE enemies SET weapon_level = enemy_level
	WHERE title ilike enemy_title;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_weapon(ititle text, idamage int, icost int, irate float, ieffect text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO weapons(title, damage_per_level, cost_per_level, rate, effect)
	SELECT ititle, idamage, icost, irate, effects.id
	FROM effects WHERE effects.title ilike ieffect;
	RETURN true;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION buy_armor(user_id text, armor_title text) RETURNS BOOLEAN AS $$
BEGIN
	IF (NOT EXISTS (SELECT player_id FROM playersArmors WHERE player_id = (SELECT id FROM players WHERE userid = user_id)
	AND armor_id = (SELECT id FROM armors WHERE title = armor_title))) THEN
		INSERT INTO playersArmors(player_id, armor_id)
		SELECT players.id, armors.id 
		FROM players, armors
		WHERE players.userid = user_id AND armors.title = armor_title;
	ELSE
		UPDATE playersArmors SET level = level + 1
		WHERE player_id = (SELECT id FROM players WHERE userid = user_id)
		AND armor_id = (SELECT id FROM armors WHERE title = armor_title);
	END IF;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION remove_armor(user_id text, armor_title text) RETURNS BOOLEAN AS $$
BEGIN
	DELETE FROM playersArmors WHERE player_id = (
		SELECT players.id FROM players WHERE players.userid = user_id)
		AND armor_id = (SELECT armors.id FROM armors WHERE armors.title = armor_title);
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_armor(ititle text, ihealth int, ishield int, iplate int, iregen int, ievasion int, icost int) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO armors(title, health, shield, plate, regen, evasion, cost_per_level, effect)
	VALUES (ititle, ihealth, ishield, iplate, iregen, ievasion, icost, null);
	RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_armor_effect(ititle text, ihealth int, ishield int, iplate int, iregen int, ievasion int, icost int, ieffect text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO armors(title, health, shield, plate, regen, evasion, cost_per_level, effect)
	SELECT ititle, ihealth, ishield, iplate, iregen, ievasion, icost, effects.id
	FROM effects WHERE effects.title ilike ieffect;
	RETURN true;
END;
$$ LANGUAGE plpgsql;
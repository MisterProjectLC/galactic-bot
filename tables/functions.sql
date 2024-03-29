CREATE OR REPLACE FUNCTION create_enemy(ititle text, igiven_xp int, igiven_coins int, ihealth int, ishield int, iplate int, iregen int, ievasion int, iweapon text, idamage int, irate float) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO weapons(title, damage_per_level, rate, in_shop, enemy_weapon) VALUES (iweapon, idamage, irate, false, true);
	INSERT INTO enemies(title, given_xp, given_coins, weapon) SELECT ititle, igiven_xp, igiven_coins, weapons.id
	FROM weapons WHERE weapons.title = iweapon;
	UPDATE entities SET health = ihealth, shield = ishield, plate = iplate, regen = iregen, evasion = ievasion WHERE id = (SELECT entity FROM enemies WHERE title = ititle);
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_enemy_effect(ititle text, igiven_xp int, igiven_coins int, ihealth int, ishield int, iplate int, iregen int, ievasion int, iweapon text, idamage int, irate float, ieffect text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO weapons(title, damage_per_level, rate, in_shop, enemy_weapon, effect) SELECT iweapon, idamage, irate, false, true, effects.id FROM effects WHERE effects.title ilike ieffect;
	INSERT INTO enemies(title, given_xp, given_coins, weapon) SELECT ititle, igiven_xp, igiven_coins, weapons.id
	FROM weapons WHERE weapons.title = iweapon;
	UPDATE entities SET health = ihealth, shield = ishield, plate = iplate, regen = iregen, evasion = ievasion WHERE id = (SELECT entity FROM enemies WHERE title = ititle);
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION insert_enemy_into_adventure(enemy_title text, adventure_title text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO enemiesAdventures(enemy_id, adventure_id)
	SELECT enemies.id, adventures.id 
	FROM enemies, adventures 
	WHERE enemies.title = enemy_title AND adventures.title = adventure_title;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION insert_enemy_into_conquest(enemy_title text, conquest_title text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO enemiesConquests(enemy_id, conquest_id)
	SELECT enemies.id, conquests.id 
	FROM enemies, conquests
	WHERE enemies.title = enemy_title AND conquests.title = conquest_title;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION buy_weapon(user_id text, weapon_title text, amount int) RETURNS BOOLEAN AS $$
BEGIN
	IF (NOT EXISTS (SELECT player_id FROM playersWeapons WHERE player_id = (SELECT id FROM players WHERE userid = user_id)
	AND weapon_id = (SELECT id FROM weapons WHERE title = weapon_title))) THEN
		INSERT INTO playersWeapons(player_id, weapon_id, level)
		SELECT players.id, weapons.id, amount
		FROM players, weapons
		WHERE players.userid = user_id AND weapons.title = weapon_title;
	ELSE
		UPDATE playersWeapons SET level = level + amount
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


CREATE OR REPLACE FUNCTION create_weapon(ititle text, idamage int, irate float, ilevel int, icost int) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO weapons(title, damage_per_level, rate, min_level, cost_per_level)
	VALUES (ititle, idamage, irate, ilevel, icost);
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_weapon_effect(ititle text, idamage int, irate float, ieffect text, ilevel int, icost int) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO weapons(title, damage_per_level, rate, effect, min_level, cost_per_level)
	SELECT ititle, idamage, irate, effects.id, ilevel, icost
	FROM effects WHERE effects.title ilike ieffect;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION buy_armor(user_id text, armor_title text, amount int) RETURNS BOOLEAN AS $$
BEGIN
	IF (NOT EXISTS (SELECT player_id FROM playersArmors WHERE player_id = (SELECT id FROM players WHERE userid = user_id)
	AND armor_id = (SELECT id FROM armors WHERE title = armor_title))) THEN
		INSERT INTO playersArmors(player_id, armor_id, level)
		SELECT players.id, armors.id, amount
		FROM players, armors
		WHERE players.userid = user_id AND armors.title = armor_title;
	ELSE
		UPDATE playersArmors SET level = level + amount
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


CREATE OR REPLACE FUNCTION create_armor(ititle text, ihealth int, ishield int, iplate int, iregen int, ievasion float, ilevel int, icost int) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO armors(title, health, shield, plate, regen, evasion, min_level, cost_per_level)
	VALUES (ititle, ihealth, ishield, iplate, iregen, ievasion, ilevel, icost);
	RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_armor_effect(ititle text, ihealth int, ishield int, iplate int, iregen int, ievasion float, ieffect text, ilevel int, icost int) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO armors(title, health, shield, plate, regen, evasion, effect, min_level, cost_per_level)
	SELECT ititle, ihealth, ishield, iplate, iregen, ievasion, effects.id, ilevel, icost
	FROM effects WHERE effects.title ilike ieffect;
	RETURN true;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION create_enemy_weapon(ititle text, idamage int, irate float) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO weapons(title, damage_per_level, rate, enemy_weapon)
	VALUES (ititle, idamage, irate, true);
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_enemy_weapon_effect(ititle text, idamage int, irate float, ieffect text) RETURNS BOOLEAN AS $$
BEGIN
	INSERT INTO weapons(title, damage_per_level, rate, effect, enemy_weapon)
	SELECT ititle, idamage, irate, effects.id, true
	FROM effects WHERE effects.title ilike ieffect;
	RETURN true;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION add_channel(ititle text, iguild_id text, ichannel_id text) RETURNS BOOLEAN AS $$
BEGIN
	IF (NOT EXISTS (SELECT title FROM commandChannels WHERE title = ititle AND guild_id = iguild_id AND channel_id = ichannel_id)) THEN
		INSERT INTO commandChannels(title, guild_id, channel_id) VALUES (ititle, iguild_id, ichannel_id);
		RETURN true;
	END IF;
	RETURN false;
END;
$$ LANGUAGE plpgsql;
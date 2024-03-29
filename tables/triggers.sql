CREATE OR REPLACE FUNCTION player_entity() RETURNS trigger AS $$
BEGIN
	with rows as (
		INSERT INTO entities(health, shield, plate, regen, evasion) VALUES(20, 0, 0, 0, 0) RETURNING id
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
		INSERT INTO entities(health, shield, plate, regen, evasion) VALUES(10, 0, 0, 0, 0) RETURNING id
	)
	UPDATE enemies SET entity = rows.id FROM rows WHERE enemies.id = new.id;
	RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enemy_entity AFTER INSERT ON enemies
	FOR EACH ROW
	EXECUTE PROCEDURE enemy_entity();



CREATE OR REPLACE FUNCTION enemy_weapon() RETURNS trigger AS $$
BEGIN
	DELETE FROM weapons WHERE id = old.weapon;
	RETURN old;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enemy_weapon AFTER DELETE ON enemies
	FOR EACH ROW
	EXECUTE PROCEDURE enemy_weapon();
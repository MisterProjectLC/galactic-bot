CREATE TABLE endurance (
	id SERIAL PRIMARY KEY,
	health int,
	shield int,
	armor int,
	regen int,
	evasion int
);

CREATE TABLE effects (
	id SERIAL PRIMARY KEY,
	scaling int
);

CREATE TABLE players (
	id SERIAL PRIMARY KEY,
	coins int DEFAULT 0,
	xp int DEFAULT 0,
	level int DEFAULT 1,
	user text NOT NULL,
	endurance int,
	FOREIGN KEY (endurance) REFERENCES endurance(id)
);

CREATE VIEW ePlayers AS (
	SELECT * FROM endurance INNER JOIN players
	ON endurance.id = players.endurance
);

CREATE TABLE weapons (
	id SERIAL PRIMARY KEY,
	title text,
	damage int,
	cost_per_level int
);

CREATE TABLE playersWeapons (
	player_id int,
	weapon_id int,
	level int,
	PRIMARY KEY (player_id, weapon_id)
	FOREIGN KEY (player_id) REFERENCES players(id),
	FOREIGN KEY (weapon_id) REFERENCES weapons(id)
);

CREATE TABLE playersWeapons (
	player_id int,
	weapon_id int,
	level int,
	PRIMARY KEY (player_id, weapon_id)
	FOREIGN KEY (player_id) REFERENCES players(id),
	FOREIGN KEY (weapon_id) REFERENCES weapons(id)
);

CREATE TABLE weaponsEffects (
	weapon_id int,
	effect_id int,
	PRIMARY KEY (weapon_id, effect_id)
	FOREIGN KEY (weapon_id) REFERENCES weapons(id),
	FOREIGN KEY (effect_id) REFERENCES effects(id)
);

CREATE TABLE armors (
	id SERIAL PRIMARY KEY,
	title text,
	endurance int,
	cost_per_level int,
	FOREIGN KEY (endurance) REFERENCES endurance(id)
);

CREATE VIEW eArmors AS (
	SELECT * FROM endurance INNER JOIN armors
	ON endurance.id = armors.endurance
);

CREATE TABLE playersArmors (
	player_id int,
	armor_id int,
	level int,
	PRIMARY KEY (player_id, armor_id)
	FOREIGN KEY (player_id) REFERENCES players(id),
	FOREIGN KEY (armor_id) REFERENCES armors(id)
);

CREATE TABLE armorsEffects (
	armor_id int,
	effect_id int,
	PRIMARY KEY (armor_id, effect_id)
	FOREIGN KEY (armor_id) REFERENCES armors(id),
	FOREIGN KEY (effect_id) REFERENCES effects(id)
);

CREATE TABLE enemies (
	id SERIAL PRIMARY KEY,
	title text UNIQUE,
	image_link text,
	endurance int,
	FOREIGN KEY (endurance) REFERENCES endurance(id)
	given_xp int,
	given_coins int
);

CREATE VIEW eEnemies AS (
	SELECT * FROM endurance INNER JOIN enemies
	ON endurance.id = enemies.endurance
);


CREATE TABLE adventures (
	id SERIAL PRIMARY KEY,
	title text UNIQUE
);

CREATE TABLE enemiesAdventures (
	enemy_id int,
	adventure_id int,
	PRIMARY KEY (enemy_id, adventure_id)
	FOREIGN KEY (enemy_id) REFERENCES enemies(id),
	FOREIGN KEY (adventure_id) REFERENCES adventures(id)
);
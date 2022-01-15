CREATE TABLE entities (
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
	userID text NOT NULL,
	entity int,
	adventures_left int,
	bosses_left int,
	victory_time timestamp,
	title text,
	imageurl text,
	FOREIGN KEY (entity) REFERENCES entities(id)
);

CREATE VIEW ePlayers AS (
	SELECT health, plate, shield, regen, evasion, players.id, players.coins, players.xp,
	players.level, players.userid, players.title, players.imageURL
	FROM entities INNER JOIN players
	ON entities.id = players.entity
);

CREATE TABLE weapons (
	id SERIAL PRIMARY KEY,
	title text,
	rate int DEFAULT 1,
	damage_per_level int,
	cost_per_level int,
	effect int,
	FOREIGN KEY (effect) REFERENCES effects(id)
);

CREATE TABLE playersWeapons (
	player_id int,
	weapon_id int,
	level int,
	PRIMARY KEY (player_id, weapon_id),
	FOREIGN KEY (player_id) REFERENCES players(id),
	FOREIGN KEY (weapon_id) REFERENCES weapons(id)
);

CREATE VIEW eWeapons AS (
	SELECT weapons.id, weapons.title, rate, damage_per_level, cost_per_level,
	effects.title as effect_title, scaling as effect_scaling	
	FROM weapons LEFT OUTER JOIN effects ON
	weapons.effect = effects.id
)

CREATE TABLE armors (
	id SERIAL PRIMARY KEY,
	title text,
	health int,
	shield int,
	armor int,
	regen int,
	evasion int,
	cost_per_level int,
	effect int,
	FOREIGN KEY (effect) REFERENCES effects(id)
);

CREATE VIEW eArmors AS (
	SELECT armors.id, armors.title, health, shield, plate, regen, evasion,
	effects.title as effect_title, scaling as effect_scaling	
	FROM armors LEFT OUTER JOIN effects ON
	armors.effect = effects.id
)

CREATE TABLE playersArmors (
	player_id int,
	armor_id int,
	level int,
	PRIMARY KEY (player_id, armor_id),
	FOREIGN KEY (player_id) REFERENCES players(id),
	FOREIGN KEY (armor_id) REFERENCES armors(id)
);

CREATE TABLE enemies (
	id SERIAL PRIMARY KEY,
	title text UNIQUE,
	image_link text,
	weapon int,
	weapon_level int,
	entity int,
	given_xp int,
	given_coins int,
	FOREIGN KEY (entity) REFERENCES entities(id),
	FOREIGN KEY (weapon) REFERENCES weapons(id)
);

CREATE TABLE enemiesEffects (
	enemy_id int,
	effect_id int,
	level int,
	PRIMARY KEY (enemy_id, effect_id),
	FOREIGN KEY (enemy_id) REFERENCES enemies(id),
	FOREIGN KEY (effect_id) REFERENCES effects(id)
)

CREATE VIEW eEnemies AS (
	SELECT health, plate, shield, regen, evasion, enemies.id, enemies.given_coins, 
	enemies.given_xp, enemies.title, enemies.image_link, enemies.weapon_level,
	eWeapons.title as weapon_title, eWeapons.damage_per_level, eWeapons.rate,
	eWeapons.effect_title, eWeapons.effect_scaling
	FROM ((entities INNER JOIN enemies
	ON entities.id = enemies.entity) INNER JOIN eWeapons
	ON enemies.weapon = eWeapons.id)
)

CREATE TABLE adventures (
	id SERIAL PRIMARY KEY,
	title text UNIQUE,
	min_level int DEFAULT 0
);

CREATE TABLE enemiesAdventures (
	enemy_id int,
	adventure_id int,
	PRIMARY KEY (enemy_id, adventure_id),
	FOREIGN KEY (enemy_id) REFERENCES enemies(id),
	FOREIGN KEY (adventure_id) REFERENCES adventures(id)
);


CREATE TABLE conquests (
	id SERIAL PRIMARY KEY,
	title text UNIQUE,
	min_level int DEFAULT 0,
	min_size int DEFAULT 4
);

CREATE TABLE enemiesConquests (
	enemy_id int,
	conquest_id int,
	PRIMARY KEY (enemy_id, conquest_id),
	FOREIGN KEY (enemy_id) REFERENCES enemies(id),
	FOREIGN KEY (conquest_id) REFERENCES conquests(id)
);

CREATE TABLE timers (
	title text PRIMARY KEY,
	time timestamp
);
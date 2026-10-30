-- 01_foundation.sql
-- Create sizes / species / features / species_features and seed sizes + darkvision.
-- Idempotent. Run before 02_copy_species.sql on a fresh branch (e.g. production).

BEGIN;

CREATE TABLE IF NOT EXISTS sizes (
  id smallint PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  grid_squares numeric(3,1) NOT NULL
);

INSERT INTO sizes (id, key, name, grid_squares) VALUES
  (1, 'tiny', 'Tiny', 0.5),
  (2, 'small', 'Small', 1.0),
  (3, 'medium', 'Medium', 1.0),
  (4, 'large', 'Large', 2.0),
  (5, 'enormous', 'Enormous', 3.0),
  (6, 'titanic', 'Titanic', 4.0)
ON CONFLICT (id) DO UPDATE
  SET key = EXCLUDED.key, name = EXCLUDED.name, grid_squares = EXCLUDED.grid_squares;

CREATE TABLE IF NOT EXISTS features (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS species (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_id integer REFERENCES species(id) ON DELETE CASCADE,
  description text,
  size_id smallint NOT NULL DEFAULT 3 REFERENCES sizes(id),
  speed smallint NOT NULL DEFAULT 30,
  stat_bonuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  languages text[] NOT NULL DEFAULT '{}'::text[],
  image text,
  sort_order smallint
);

CREATE TABLE IF NOT EXISTS species_features (
  species_id integer NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  feature_id integer NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  level smallint NOT NULL DEFAULT 1,
  link_id integer,
  legacy_feature_id integer,
  action_type text,
  uses text,
  dice text,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (species_id, feature_id)
);

INSERT INTO features (key, name, type, description, data)
VALUES (
  'darkvision',
  'Darkvision',
  'passive',
  'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.',
  '{}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

COMMIT;



TABLE users
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,

TABLE characters 
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  race TEXT,
  class TEXT,
  sub_class TEXT,
  str INTEGER,
  dex INTEGER,
  con INTEGER,
  int INTEGER,
  wis INTEGER,
  cha INTEGER,
  luc INTEGER,
  spd INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()

  TABLE races 
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    creature_type TEXT NOT NULL,
    traits TEXT NOT NULL,
    size TEXT NOT NULL,
    base_speed INTEGER NOT NULL,
    resistances TEXT NOT NULL,
    darkvision BOOLEAN NOT NULL,

  TABLE classes
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    
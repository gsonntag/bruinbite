-- users table
CREATE TABLE users (
  id             SERIAL PRIMARY KEY,
  username       TEXT    NOT NULL UNIQUE,
  hashed_password TEXT   NOT NULL,
  email          TEXT    NOT NULL UNIQUE,
  is_admin       BOOLEAN    NOT NULL DEFAULT FALSE, -- options: user, admin
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- dining halls table
CREATE TABLE dining_halls (
  id       SERIAL PRIMARY KEY,
  name     TEXT   NOT NULL,
  location TEXT -- is this just going to say like "De Neve Plaza" or something
);

-- dishes table
CREATE TABLE dishes (
  id             SERIAL    PRIMARY KEY,
  hall_id        INT       NOT NULL REFERENCES dining_halls(id),
  name           TEXT      NOT NULL,
  description    TEXT,
  average_rating NUMERIC(7,5) NOT NULL DEFAULT 0.00000, -- NUMERIC(precision,scale) where precision is total numbers stored, scale is numbers after decimal 
  tags           TEXT[]    NOT NULL DEFAULT '{}' -- comma separated in json format ?
);

-- menus
CREATE TABLE menus (
  id          SERIAL    PRIMARY KEY,
  hall_id     INT       NOT NULL REFERENCES dining_halls(id),
  date        DATE      NOT NULL,
  meal_period TEXT      NOT NULL  -- Breakfast, Lunch, Dinner, Late Night
);

-- rating
CREATE TABLE ratings (
  id         SERIAL PRIMARY KEY,
  user_id    INT    NOT NULL REFERENCES users(id),
  dish_id    INT    NOT NULL REFERENCES dishes(id),
  score      SMALLINT NOT NULL CHECK (score >= 0 AND score <= 10),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

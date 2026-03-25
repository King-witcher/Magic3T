-- Migration generated on 2026-03-18 21:20:58

CREATE TYPE bot_id AS ENUM (
    'recruit',
    'soldier',
    'elite',
    'legend'
    );

CREATE TABLE bot_id_user
(
    bot_id  bot_id PRIMARY KEY,
    user_id uuid NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);
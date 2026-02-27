-- Migration generated on 2026-02-26 21:55:14

CREATE TYPE rarity AS ENUM (
    'common',
    'rare',
    'epic',
    'legendary',
    'mythic',
    'ultimate',
    'exalted',
    'transcendent'
    );

CREATE TABLE icon
(
    id            SMALLINT GENERATED ALWAYS AS IDENTITY,
    title         TEXT     NOT NULL,
    description   TEXT,
    year_released SMALLINT NOT NULL,
    content_id    uuid     NOT NULL,
    is_legacy     BOOLEAN  NOT NULL,
    image_path    TEXT,
    rarity        rarity   NOT NULL
);

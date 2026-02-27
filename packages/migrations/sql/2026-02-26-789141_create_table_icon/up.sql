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
    id            SMALLINT PRIMARY KEY,
    title         TEXT     NOT NULL,
    description   TEXT,
    year_released SMALLINT NOT NULL,
    content_id    UUID     NOT NULL,
    is_legacy     BOOLEAN  NOT NULL,
    rarity        rarity   NOT NULL
);

CREATE INDEX idx_icon_content_id ON icon (content_id);
CREATE INDEX idx_icon_rarity ON icon (rarity);
CREATE INDEX idx_icon_year_released ON icon (year_released);

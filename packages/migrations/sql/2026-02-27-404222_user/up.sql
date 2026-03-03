-- Migration generated on 2026-02-27 11:13:42

CREATE TYPE user_role AS ENUM (
    'bot',
    'player',
    'admin',
    'superuser'
    );

CREATE TYPE user_apex_flag AS ENUM (
    'challenger',
    'grandmaster'
    );

CREATE TABLE "user"
(
    id                    INTEGER GENERATED ALWAYS AS IDENTITY,
    uuid                  uuid UNIQUE        NOT NULL DEFAULT gen_random_uuid(),

    role                  user_role          NOT NULL DEFAULT 'player',
    credits               INTEGER            NOT NULL DEFAULT 0 CHECK ( credits >= 0 ),
    xp                    INTEGER            NOT NULL DEFAULT 0 CHECK ( xp >= 0 ),

    profile_nickname      VARCHAR(16)        NOT NULL,
    profile_nickname_slug VARCHAR(16) UNIQUE NOT NULL,
    profile_nickname_date TIMESTAMP          NOT NULL DEFAULT NOW(),
    profile_icon          SMALLINT           NOT NULL DEFAULT 29,

    rating_score          REAL               NOT NULL,
    rating_k_factor       REAL               NOT NULL CHECK ( rating_k_factor >= 0 ),
    rating_apex           user_apex_flag,
    rating_series_played  SMALLINT           NOT NULL DEFAULT 0,
    rating_date           DATE               NOT NULL DEFAULT NOW(),

    stats_victories       INTEGER            NOT NULL DEFAULT 0 CHECK ( stats_victories >= 0 ),
    stats_draws           INTEGER            NOT NULL DEFAULT 0 CHECK ( stats_draws >= 0 ),
    stats_defeats         INTEGER            NOT NULL DEFAULT 0 CHECK ( stats_defeats >= 0 ),

    PRIMARY KEY (id),
    FOREIGN KEY (profile_icon) REFERENCES icon (id) ON DELETE SET DEFAULT
);

COMMENT ON COLUMN "user".id IS 'User''s internal id';
COMMENT ON COLUMN "user".uuid IS 'User''s external id';
COMMENT ON COLUMN "user".rating_k_factor IS 'Dynamic K-Factor used in Elo rating calculation';
COMMENT ON COLUMN "user".rating_series_played IS 'Number of games played in the initial rating series';
COMMENT ON COLUMN "user".rating_apex IS 'A flag indicating if the user has reached Challenger or Grandmaster rank';

CREATE INDEX ON "user" (uuid);
CREATE INDEX ON "user" (profile_nickname_slug);
CREATE INDEX ON "user" (rating_score DESC, rating_date ASC);

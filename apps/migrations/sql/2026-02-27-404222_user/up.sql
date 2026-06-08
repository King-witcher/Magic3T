-- Migration generated on 2026-02-27 11:13:42

CREATE TYPE user_role AS ENUM (
    'bot',
    'player',
    'admin',
    'superuser'
    );

CREATE TYPE league AS ENUM (
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond',
    'master',
    'grandmaster',
    'challenger'
    );

CREATE TABLE "user"
(
    id                    uuid PRIMARY KEY         NOT NULL DEFAULT gen_random_uuid(),

    role                  user_role                NOT NULL DEFAULT 'player',
    credits               INTEGER                  NOT NULL DEFAULT 0 CHECK ( credits >= 0 ),
    xp                    INTEGER                  NOT NULL DEFAULT 0 CHECK ( xp >= 0 ),

    profile_nickname      VARCHAR(16)              NOT NULL,
    profile_nickname_slug VARCHAR(16) UNIQUE       NOT NULL,
    profile_nickname_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    profile_icon          SMALLINT                 NOT NULL DEFAULT 29 REFERENCES icon (id) ON DELETE SET DEFAULT,

    mmr_score             REAL                     NOT NULL,
    mmr_k_factor          REAL                     NOT NULL CHECK ( mmr_k_factor >= 0 ),

    rank_league           league                   NULL,
    rank_division         SMALLINT                 NULL CHECK ( rank_division IS NULL OR (rank_division BETWEEN 1 AND 4) ),
    rank_lp               SMALLINT                 NULL CHECK ( rank_lp IS NULL OR rank_lp >= 0 ),
    rank_matches          INTEGER                  NOT NULL DEFAULT 0 CHECK ( rank_matches >= 0 ),
    rank_date             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    stats_victories       INTEGER                  NOT NULL DEFAULT 0 CHECK ( stats_victories >= 0 ),
    stats_draws           INTEGER                  NOT NULL DEFAULT 0 CHECK ( stats_draws >= 0 ),
    stats_defeats         INTEGER                  NOT NULL DEFAULT 0 CHECK ( stats_defeats >= 0 ),

    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Rank columns are all-null (placement) OR apex league without division OR non-apex league with division
    CONSTRAINT rank_shape_consistency CHECK (
        (rank_league IS NULL AND rank_division IS NULL AND rank_lp IS NULL)
            OR
        (rank_league IN ('master', 'grandmaster', 'challenger')
            AND rank_division IS NULL
            AND rank_lp IS NOT NULL)
            OR
        (rank_league IS NOT NULL
            AND rank_league NOT IN ('master', 'grandmaster', 'challenger')
            AND rank_division IS NOT NULL
            AND rank_lp IS NOT NULL
            AND rank_lp BETWEEN 0 AND 99
            )
        )
);

COMMENT ON COLUMN "user".mmr_score IS 'Current MMR (Matchmaking Rating) of the user';
COMMENT ON COLUMN "user".mmr_k_factor IS 'Dynamic K-Factor used in Elo rating calculation';
COMMENT ON COLUMN "user".rank_division IS 'Division within the current league (1-4, 1 being best). NULL for apex leagues (master/grandmaster/challenger).';
COMMENT ON COLUMN "user".rank_lp IS 'LP within the current division (0-99 for non-apex; unbounded for apex).';
COMMENT ON COLUMN "user".rank_matches IS 'Total ranked matches played. First 5 are placement matches.';

CREATE INDEX ON "user" (profile_nickname_slug);
CREATE INDEX ON "user" (rank_league, rank_division, rank_lp DESC);

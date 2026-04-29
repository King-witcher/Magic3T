-- Migration generated on 2026-03-02 19:55:53

CREATE TABLE user_rating_snapshot
(
    id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
        START WITH -2147483648
        MINVALUE -2147483648
        ),
    user_id       uuid                     NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,

    league        league                   NULL,
    division      SMALLINT                 NULL CHECK ( division IS NULL OR (division BETWEEN 1 AND 4) ),
    lp            SMALLINT                 NULL CHECK ( lp IS NULL OR lp >= 0 ),
    matches       INTEGER                  NOT NULL DEFAULT 0 CHECK ( matches >= 0 ),

    mmr_score     REAL                     NOT NULL,
    mmr_k_factor  REAL                     NOT NULL CHECK ( mmr_k_factor >= 0 ),

    date          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT rank_shape_consistency CHECK (
        (league IS NULL AND division IS NULL AND lp IS NULL)
            OR
        (league IN ('master', 'grandmaster', 'challenger')
            AND division IS NULL
            AND lp IS NOT NULL)
            OR
        (league IS NOT NULL
            AND league NOT IN ('master', 'grandmaster', 'challenger')
            AND division IS NOT NULL
            AND lp IS NOT NULL)
        )
);

COMMENT ON TABLE user_rating_snapshot IS 'A snapshot of a user''s full rating state (rank + raw MMR) at a specific point in time.';
COMMENT ON COLUMN user_rating_snapshot.division IS 'Division within the league (1-4, 1 being best). NULL for apex leagues (master/grandmaster/challenger).';
COMMENT ON COLUMN user_rating_snapshot.lp IS 'LP within the division (0-99 for non-apex; unbounded for apex).';
COMMENT ON COLUMN user_rating_snapshot.matches IS 'Total ranked matches the user had played at the time of the snapshot.';

CREATE INDEX ON user_rating_snapshot (user_id, date DESC);
CREATE INDEX ON user_rating_snapshot (league DESC, division, lp DESC);

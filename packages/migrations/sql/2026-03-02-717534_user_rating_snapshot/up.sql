-- Migration generated on 2026-03-02 19:55:53

CREATE TABLE user_rating_snapshot
(
    id        INTEGER GENERATED ALWAYS AS IDENTITY (START WITH -2147483648),
    user_id   INTEGER                  NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    elo_score REAL                     NOT NULL,
    apex_flag user_apex_flag,
    hidden    BOOLEAN                  NOT NULL,
    date      TIMESTAMP WITH TIME ZONE NOT NULL
);

COMMENT ON TABLE user_rating_snapshot IS 'A snapshot of a user''s rating at a specific point in time.';

CREATE INDEX ON user_rating_snapshot (user_id, date DESC);
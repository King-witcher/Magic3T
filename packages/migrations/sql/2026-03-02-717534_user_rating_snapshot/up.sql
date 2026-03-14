-- Migration generated on 2026-03-02 19:55:53

CREATE TABLE user_rating_snapshot
(
    id        INTEGER GENERATED ALWAYS AS IDENTITY (
        START WITH -2147483648
        MINVALUE -2147483648
        ),
    user_id   INTEGER                  NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    score     REAL                     NOT NULL,
    apex_flag user_apex_flag,
    hidden    BOOLEAN                  NOT NULL,
    date      TIMESTAMP WITH TIME ZONE NOT NULL,

    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

COMMENT ON TABLE user_rating_snapshot IS 'A snapshot of a user''s rating at a specific point in time.';
COMMENT ON COLUMN user_rating_snapshot.hidden IS 'Indicates whether the snapshot is hidden from public view.';

CREATE INDEX ON user_rating_snapshot (user_id, date DESC);
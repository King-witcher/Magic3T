-- Migration generated on 2026-03-02 19:55:53

CREATE TABLE match
(
    id                INTEGER GENERATED ALWAYS AS IDENTITY,
    uuid              uuid         NOT NULL DEFAULT uuidv7(),

    order_id          INTEGER,
    order_nickname    VARCHAR(255) NOT NULL,
    chaos_id          INTEGER,
    chaos_nickname    VARCHAR(255) NOT NULL,

    winner            match_team,

    match_order_score FLOAT        NOT NULL CHECK (match_order_score >= 0.0 AND match_order_score <= 1.0),
    match_chaos_score FLOAT GENERATED ALWAYS AS (1.0 - match_order_score),

    prev_order_lp     SMALLINT,
    prev_chaos_lp     SMALLINT,
    new_order_lp      SMALLINT,
    new_chaos_lp      SMALLINT,

    order_time_spent  SMALLINT     NOT NULL,
    chaos_time_spent  SMALLINT     NOT NULL,

    total_time_spent  SMALLINT GENERATED ALWAYS AS (order_time_spent + chaos_time_spent),

    date              DATE         NOT NULL GENERATED ALWAYS AS (uuid_extract_timestamp(uuid)),

    FOREIGN KEY (order_id) REFERENCES "user" (id) ON DELETE SET NULL,
    FOREIGN KEY (chaos_id) REFERENCES "user" (id) ON DELETE SET NULL
);

CREATE TYPE match_event_type AS ENUM ('choice', 'forfeit', 'timeout');

CREATE TABLE match_event
(
    match_id   INTEGER          NOT NULL,
    sequence   SMALLINT         NOT NULL,
    time_ms    INTEGER          NOT NULL,
    event_type match_event_type NOT NULL,
    choice     SMALLINT,

    CONSTRAINT choice_is_1_to_9 CHECK (
        (choice >= 1 AND choice <= 9) OR
        (choice IS NULL)
        ),

    CONSTRAINT choice_for_choice_events CHECK (
        (event_type = 'choice' AND choice IS NOT NULL) OR
        (event_type IN ('forfeit', 'timeout') AND choice IS NULL)
        ),

    PRIMARY KEY (match_id, sequence),
    FOREIGN KEY (match_id) REFERENCES match (id) ON DELETE CASCADE
);

CREATE INDEX ON match (uuid);
CREATE INDEX ON match (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX ON match (chaos_id) WHERE chaos_id IS NOT NULL;
CREATE INDEX ON match_event (match_id);

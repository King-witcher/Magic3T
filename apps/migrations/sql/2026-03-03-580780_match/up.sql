-- Migration generated on 2026-03-03 16:7:57

CREATE TABLE match
(
    id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    uuid              uuid                     NOT NULL DEFAULT uuidv7(),

    order_uuid        uuid                     NULL,
    order_nickname    VARCHAR(255)             NOT NULL,
    order_match_score FLOAT                    NOT NULL CHECK (order_match_score >= 0.0 AND order_match_score <= 1.0),
    order_rating_id   INTEGER                  NULL,
    order_delta       SMALLINT                 NULL,
    order_time_spent  SMALLINT                 NOT NULL,

    chaos_uuid        uuid                     NULL,
    chaos_nickname    VARCHAR(255)             NOT NULL,
    chaos_match_score FLOAT GENERATED ALWAYS AS (1.0 - order_match_score),
    chaos_old_rating  INTEGER                  NULL,
    chaos_delta       SMALLINT                 NULL,
    chaos_time_spent  SMALLINT                 NOT NULL,

    winner            match_team               NULL,
    total_time_spent  SMALLINT                 NOT NULL GENERATED ALWAYS AS (order_time_spent + chaos_time_spent),
    date              TIMESTAMP WITH TIME ZONE NOT NULL GENERATED ALWAYS AS (uuid_extract_timestamp(uuid)),

    FOREIGN KEY (order_uuid) REFERENCES "user" (uuid) ON DELETE SET NULL,
    FOREIGN KEY (chaos_uuid) REFERENCES "user" (uuid) ON DELETE SET NULL,
    FOREIGN KEY (order_rating_id) REFERENCES "user_rating_snapshot" (id) ON DELETE SET NULL,
    FOREIGN KEY (chaos_old_rating) REFERENCES "user_rating_snapshot" (id) ON DELETE SET NULL
);

CREATE TYPE match_event_type AS ENUM ('choice', 'forfeit', 'timeout');

CREATE TABLE match_event
(
    match_id INTEGER          NOT NULL,
    sequence SMALLINT         NOT NULL,
    time_ms  INTEGER          NOT NULL,
    type     match_event_type NOT NULL,
    team     match_team       NOT NULL,
    choice   SMALLINT,

    CONSTRAINT choice_is_1_to_9 CHECK (
        (choice >= 1 AND choice <= 9) OR
        (choice IS NULL)
        ),

    CONSTRAINT choice_for_choice_events CHECK (
        (type = 'choice' AND choice IS NOT NULL) OR
        (type IN ('forfeit', 'timeout') AND choice IS NULL)
        ),

    PRIMARY KEY (match_id, sequence),
    FOREIGN KEY (match_id) REFERENCES match (id) ON DELETE CASCADE
);

CREATE INDEX ON match (uuid);
CREATE INDEX ON match (order_uuid) WHERE order_uuid IS NOT NULL;
CREATE INDEX ON match (chaos_uuid) WHERE order_uuid IS NOT NULL;
CREATE INDEX ON match_event (match_id);

-- Migration generated on 2026-03-02 13:48:8

CREATE TABLE legacy_user_identity
(
    firebase_id CHAR(28) PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    user_id     INTEGER UNIQUE      NOT NULL
);

CREATE INDEX ON legacy_user_identity (email);
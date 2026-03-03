-- Migration generated on 2026-03-02 13:48:8

CREATE TABLE legacy_user_identity
(
    firebase_id CHAR(28) PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    user_id     INTEGER UNIQUE      NOT NULL
);

CREATE INDEX ON legacy_user_identity (email);

COMMENT ON TABLE legacy_user_identity IS 'Since we are leaving Firebase, this table serves as a mapping between the old Firebase users the future Google OAuth2 identities.';
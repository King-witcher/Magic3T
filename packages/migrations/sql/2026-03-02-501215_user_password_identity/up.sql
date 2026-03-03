-- Migration generated on 2026-03-02 13:55:21

CREATE TABLE user_password_identity
(
    username_slug   VARCHAR(24) PRIMARY KEY,
    password_digest VARCHAR(60)    NOT NULL,
    user_id         INTEGER UNIQUE NOT NULL
);

CREATE INDEX ON user_password_identity (user_id);
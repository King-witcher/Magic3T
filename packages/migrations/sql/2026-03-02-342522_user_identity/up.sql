-- Migration generated on 2026-03-02 9:30:52

CREATE TYPE user_identity_provider AS ENUM ('firebase');

CREATE TABLE user_identity
(
    provider         user_identity_provider NOT NULL,
    provider_user_id TEXT                   NOT NULL,
    user_id          INTEGER                NOT NULL,

    PRIMARY KEY (provider, provider_user_id),
    UNIQUE (provider, user_id),
    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX ON user_identity (user_id);
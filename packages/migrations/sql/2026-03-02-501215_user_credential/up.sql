-- Migration generated on 2026-03-02 13:55:21

CREATE TABLE user_credential
(
    username_slug         VARCHAR(24) PRIMARY KEY,
    password_digest       VARCHAR(60)              NOT NULL,
    user_id               INTEGER UNIQUE           NOT NULL,
    password_last_changed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX ON user_credential (user_id);
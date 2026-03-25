-- Migration generated on 2026-03-02 13:55:21

CREATE TYPE password_algorithm AS ENUM ('bcrypt', 'argon2');

CREATE TABLE user_credential
(
    username_slug         VARCHAR(24) PRIMARY KEY,
    user_id               uuid UNIQUE              NOT NULL,
    algorithm             password_algorithm       NOT NULL,
    password_digest       TEXT                     NOT NULL,
    password_last_changed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX ON user_credential (user_id);
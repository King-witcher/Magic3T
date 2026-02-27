-- Migration generated on 2026-02-27 16:34:32

CREATE TABLE user_icon
(
    user_id    INTEGER   NOT NULL,
    icon_id    SMALLINT  NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, icon_id),
    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    FOREIGN KEY (icon_id) REFERENCES icon (id) ON DELETE CASCADE
);

CREATE INDEX ON user_icon (user_id, granted_at DESC);
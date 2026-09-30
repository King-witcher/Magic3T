-- Migration generated on 2026-09-29 16:45:29

CREATE TABLE _runtime_migration (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

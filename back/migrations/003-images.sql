--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    author_id TEXT,
    date TEXT,
    image TEXT,
    FOREIGN KEY(author_id) REFERENCES users(auth0_sub)
);

-- copy old data in new table
-- all previous contacts are for the first user
INSERT INTO contacts (contact_id, name, email, date, author_id) SELECT contact_id, name, email, date, author_id FROM old_contacts;

-- remove previous table
DROP TABLE old_contacts;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    author_id TEXT,
    date TEXT,
    FOREIGN KEY(author_id) REFERENCES users(auth0_sub)
);

-- delete new contacts:
DELETE FROM old_contacts WHERE author_id = "fakeId";

-- copy old data to previous table
INSERT INTO contacts (contact_id, name, email, date, author_id) SELECT contact_id, name, email, date, author_id FROM old_contacts;

DROP TABLE old_contacts;
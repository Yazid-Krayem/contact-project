--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    auth0_sub TEXT UNIQUE, -- this will store the id returned by Auth0
    nickname TEXT
);

INSERT INTO users (auth0_sub, nickname) VALUES ("auth0|5bfe6e775da66525bbede529","jad@codi.tech");
INSERT INTO users (auth0_sub, nickname) VALUES ("google-oauth2|104600149175848010526","jad@codi.tech");
INSERT INTO users (auth0_sub, nickname) VALUES ("facebook-thing|fakeId","fake@fake.com");

ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    author_id TEXT,
    date TEXT,
    FOREIGN KEY(author_id) REFERENCES users(auth0_sub)
);

-- copy old data in new table
-- all previous contacts are for the first user
INSERT INTO contacts (contact_id, name, email, date, author_id) SELECT contact_id, name, email, "2010-10-10 10:10:10.000","auth0|5bfe6e775da66525bbede529" FROM old_contacts;

-- remove previous table
DROP TABLE old_contacts;

INSERT INTO contacts (name, email, date, author_id) VALUES ("Patrick Bateman","pat@batman.io", "2009-10-10 10:10:10.000","facebook-thing|fakeId");
INSERT INTO contacts (name, email, date, author_id) VALUES ("Hannibal Lecter","hani@food.org", "2011-10-10 10:10:10.000","facebook-thing|fakeId");

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
DROP TABLE users;

ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);

-- delete new contacts:
DELETE FROM old_contacts WHERE author_id = "fakeId";

-- copy old data to previous table
INSERT INTO contacts (contact_id, name, email) SELECT contact_id, name, email FROM old_contacts;

DROP TABLE old_contacts;
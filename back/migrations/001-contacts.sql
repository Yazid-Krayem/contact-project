--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name text,
    email text
);
INSERT INTO contacts (name, email) VALUES ("Harry Potter","harry@potter.co.uk");
INSERT INTO contacts (name, email) VALUES ("Sherlock Holmes","sherlock@holmes.co.uk");
INSERT INTO contacts (name, email) VALUES ("Mary Poppins","mary@poppins.co.uk");
INSERT INTO contacts (name, email) VALUES ("Lady Macbeth","lady@beth.mc");
INSERT INTO contacts (name, email) VALUES ("Daenerys Targaryen","drago@lannis.tr");

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
DROP TABLE contacts;
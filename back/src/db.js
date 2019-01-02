import sqlite from "sqlite";
import SQL from "sql-template-strings";

/**
 * returns a date formatted like `YYYY-MM-DD HH:mm:ss.sss`, suitable for sqlite
 * @returns {string}
 **/
const nowForSQLite = () =>
  new Date()
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");

/**
 * 
 * Joins multiple statements. Useful for `WHERE x = 1 AND y = 2`, where the number of arguments is variable.
 * 
 * Usage:
 * ```js
 * joinSQLStatementKeys( ["name", "age", "email"], { email:"x@y.c", name="Z"}, ", ")
 * ```
 * 
 * Will return an SQL statement corresponding to the string:
 * ```js
 * name="Z", email="x@y.c"
 * ```
 * 
 * @param {Array} keys an array of strings representing the properties you want to join 
 * @param {Object} values an object containing the values 
 * @param {string} delimiter a string to join the parts with
 * @param {string} keyValueSeparator a string to join the parts with
 * @returns {Statement} an SQL Statement object
 */
const joinSQLStatementKeys = (keys, values, delimiter , keyValueSeparator='=') => {
  return keys
    .map(propName => {
      const value = values[propName];
      if (value !== null && typeof value !== "undefined") {
        return SQL``.append(propName).append(keyValueSeparator).append(SQL`${value}`);
      }
      return false;
    })
    .filter(Boolean)
    .reduce((prev, curr) => prev.append(delimiter).append(curr));
};

const initializeDatabase = async () => {
  const db = await sqlite.open("./db.sqlite");

  try {
    await db.migrate({ force: "last" });
  } catch (e) {
    console.error("could not migrate", e);
  }

  /**
   * creates a contact
   * @param {object} props an object with keys `name`, `email`, `image`, and `author_id`
   * @returns {number} the id of the created contact (or an error if things went wrong)
   */
  const createContact = async props => {
    if (!props || !props.name || !props.email || !props.author_id || !props.image) {
      throw new Error(`you must provide a name, an email, an author_id, and an image`);
    }
    const { name, email, author_id, image } = props;
    const date = nowForSQLite();
    try {
      const result = await db.run(
        SQL`INSERT INTO contacts (name,email, date, image, author_id) VALUES (${name}, ${email}, ${date}, ${image}, ${author_id})`
      );
      const id = result.stmt.lastID;
      return id;
    } catch (e) {
      throw new Error(`couldn't insert this combination: ` + e.message);
    }
  };

  /**
   * deletes a contact
   * @param {Object} props the id of the contact to delete, and the id of the author
   * @returns {boolean} `true` if the contact was deleted, an error otherwise
   */
  const deleteContact = async props => {
    const { id, author_id } = props
    try {
      const result = await db.run(
        SQL`DELETE FROM contacts WHERE contact_id = ${id} AND author_id = ${author_id}`
      );
      if (result.stmt.changes === 0) {
        throw new Error(`contact "${id}" does not exist or wrong author_id`);
      }
      return true;
    } catch (e) {
      throw new Error(`couldn't delete the contact "${id}": ` + e.message);
    }
  };

  /**
   * Edits a contact
   * @param {number} contact_id the id of the contact to edit
   * @param {object} props an object with at least one of `name`,`email` or `image`, and `author_id`
   */
  const updateContact = async (contact_id, props) => {
    if (
      (!props || !(props.name || props.email || props.image), !props.author_id)
    ) {
      throw new Error(
        `you must provide a name, or email, or image, and an author_id`
      );
    }
    try {
      const previousProps = await getContact(contact_id)
      const newProps = {...previousProps, ...props }
      const statement = SQL`UPDATE contacts SET `
        .append(
          joinSQLStatementKeys(
            ["name", "email", "image"],
            newProps,
            ", "
          )
        )
        .append(SQL` WHERE `)
        .append(
          joinSQLStatementKeys(
            ["contact_id", "author_id"],
            { contact_id:contact_id, author_id:props.author_id },
            " AND "
          )
        );
      const result = await db.run(statement);
      if (result.stmt.changes === 0) {
        throw new Error(`no changes were made`);
      }
      return true;
    } catch (e) {
      throw new Error(`couldn't update the contact ${contact_id}: ` + e.message);
    }
  };

  /**
   * Retrieves a contact
   * @param {number} id the id of the contact
   * @returns {object} an object with `name`, `email`, and `id`, representing a contact, or an error
   */
  const getContact = async id => {
    try {
      const contactsList = await db.all(
        SQL`SELECT contact_id AS id, name, email, image, author_id FROM contacts WHERE contact_id = ${id}`
      );
      const contact = contactsList[0];
      if (!contact) {
        throw new Error(`contact ${id} not found`);
      }
      return contact;
    } catch (e) {
      throw new Error(`couldn't get the contact ${id}: ` + e.message);
    }
  };

  /**
   * retrieves the contacts from the database
   * @param {Object}  props can contain:
   *  - `orderBy` an optional string that is either "name", "email", or "date"
   *  - `author_id` the auth0_sub property of a user
   *  - `desc` if true, direction will be `DESC` instead of `ASC`
   *  - `limit` limits the amount of rows returned (defaults to 100)
   *  - `start` which ID to begin looking from (defaults to 0)
   * @returns {array} the list of contacts
   */
  const getContactsList = async props => {
    const { orderBy, author_id, desc, limit, start } = props;
    const orderProperty = /name|email|date|contact_id/.test(orderBy)
      ? orderBy
      : "contact_id";
    const startingId = start 
      ? start // if start is provided, use that
      : orderProperty === "contact_id" // otherwise, if we're order by `contact_id`:
      ? 0 // default `startingId` is 0 
      : orderProperty === "date" // otherwise, if we're ordering by `date`
      ? "1970-01-01 00:00:00.000" // default property is an old date
      : "a"; // otherwise, default property is "a" (for `name` and `email`)
    try {
      const statement = SQL`SELECT contact_id AS id, name, email, date, image, author_id FROM contacts WHERE ${orderProperty} > ${startingId}`;
      if (author_id) {
        statement.append(SQL` AND author_id = ${author_id}`);
      }
      statement.append(
        desc
          ? SQL` ORDER BY ${orderProperty} DESC`
          : SQL` ORDER BY ${orderProperty} ASC`
      );
      statement.append(SQL` LIMIT ${limit || 100}`);
      const rows = await db.all(statement);
      return rows;
    } catch (e) {
      throw new Error(`couldn't retrieve contacts: ` + e.message);
    }
  };

  /**
   * Checks if a user with the provided auth0_sub exists. If yes, does nothing. If not, creates the user.
   * @param {Object} props an object containing the properties `auth0_sub` and `nickname`.
   */
  const createUserIfNotExists = async props => {
    const { auth0_sub, nickname } = props;
    const answer = await db.get(
      SQL`SELECT user_id FROM users WHERE auth0_sub = ${auth0_sub}`
    );
    if (!answer) {
      await createUser(props);
      return { ...props, firstTime: true };
    }
    return props;
  };

  /**
   * Creates a user
   * @param {Object} props an object containing the properties `auth0_sub` and `nickname`.
   */
  const createUser = async props => {
    const { auth0_sub, nickname } = props;
    const result = await db.run(
      SQL`INSERT INTO users (auth0_sub, nickname) VALUES (${auth0_sub},${nickname});`
    );
    return result.stmt.lastID;
  };

  /**
   * Returns all the different providers that match the same nickname (email)
   * Returns an array of `{name:"google", sub:"google-oauth2|832432473312"}`
   * @param {string} nickname
   */
  const getUserIdentities = async nickname => {
    const users = await db.all(
      SQL`SELECT * FROM users WHERE nickname = ${nickname}`
    );
    const providers = users.map(user => {
      const { auth0_sub } = user;
      const [providerType, _1] = auth0_sub.split("|");
      const [providerName, _2] = providerType.split("-");
      return {
        name: providerName,
        sub: auth0_sub
      };
    });
    return providers;
  };

  const controller = {
    createContact,
    deleteContact,
    updateContact,
    getContact,
    getContactsList,
    createUserIfNotExists,
    createUser,
    getUserIdentities
  };

  return controller;
};

export default initializeDatabase;

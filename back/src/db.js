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

/**
 * Makes sure all the properties passed to the function exist on the object
 * Throws an error if any property is missing.
 * For example:
 * 
 * ```js
 * const obj = { a:1, b:2 }
 * ensurePropertiesExist(obj,['a','c'])
 * ```
 * In the example above, the function will throw `property "c" is necessary`,
 * 
 * If no errors are thrown, then the object, untouched, is returned
 * @param {Object} obj an object to check
 * @param {Array} names an array of property names
 * @returns {Object} the object itself
 */
const ensurePropertiesExist = (obj, names) => {
  if(!obj){ 
    throw new Error(`the properties `+names.join(',')+' are necessary')
  }
  for(let i=0; i < names.length; i++){
    const propertyName = names[i]
    if(obj[propertyName] === null || typeof obj[propertyName] === 'undefined' ){
      throw new Error(`property "${propertyName}" is necessary`)
    }
  }
  return obj
}

const initializeDatabase = async () => {
  const db = await sqlite.open("./db.sqlite");

  try {
    await db.migrate({ force: "last" });
  } catch (e) {
    console.error("could not migrate", e);
  }

  const databaseCall = async ( method, query, error_message ) => {
    try {
      if(method === 'run'){
        const result = await db.run(query);
        return result.stmt;
      }
      if(method === 'all'){
        return await db.all(query)
      }
      if(method === 'get'){
        return await db.get(query)
      }
    } catch (e) {
        throw new Error(error_message+`: ` + e.message);
    }
  }

  /**
   * creates a contact
   * @param {object} props an object with keys `name`, `email`, `image`, and `author_id`
   * @returns {number} the id of the created contact (or an error if things went wrong)
   */
  const createContact = async props => {
    const { name, email, author_id, image } = ensurePropertiesExist(props,['name','email','author_id'])
    const date = nowForSQLite();
    const query = SQL`INSERT INTO contacts (name,email, date, image, author_id) VALUES (${name}, ${email}, ${date}, ${image}, ${author_id})`
    const statement = await databaseCall('run',query, `[C] failed to insert this contact`)
    return statement.lastID
  };

  /**
   * deletes a contact
   * @param {Object} props the id of the contact to delete, and the id of the author
   * @returns {boolean} `true` if the contact was deleted, an error otherwise
   */
  const deleteContact = async props => {
    const { contact_id, author_id } = ensurePropertiesExist(props,['contact_id','author_id'])
    const query = SQL`DELETE FROM contacts WHERE contact_id = ${contact_id} AND author_id = ${author_id}`
    const statement = await databaseCall('run',query, `[D] failed to delete this contact`)
    return statement.changes
  };

  /**
   * Edits a contact
   * @param {number} contact_id the id of the contact to edit
   * @param {object} props an object with at least one of `name`,`email` or `image`, and `author_id`
   */
  const updateContact = async (props) => {
    ensurePropertiesExist(props,['contact_id'])
    const previousProps = await getContact(props)
    const newProps = {...previousProps, ...props }
    ensurePropertiesExist(newProps,['name','email','author_id'])
    const query = SQL`UPDATE contacts SET `
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
          newProps,
          " AND "
        )
      );
    const statement = await databaseCall('run',query, `[U] failed to update this contact`)
    return statement.changes;
  };

  /**
   * Retrieves a contact
   * @param {Object} props an object with the id of the contact
   * @returns {object} an object with `name`, `email`, and `id`, representing a contact, or an error
   */
  const getContact = async props => {
    const { contact_id } = ensurePropertiesExist(props,['contact_id'])
    const query = SQL`SELECT contact_id AS id, name, email, image, author_id FROM contacts WHERE contact_id = ${contact_id}`
    return await databaseCall('get',query,`[R] could not get the contact ${contact_id}`)
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
    const query = SQL`SELECT contact_id AS id, name, email, date, image, author_id FROM contacts WHERE ${orderProperty} > ${startingId}`;
    if (author_id) {
      query.append(SQL` AND author_id = ${author_id}`);
    }
    query.append(
      desc
        ? SQL` ORDER BY ${orderProperty} DESC`
        : SQL` ORDER BY ${orderProperty} ASC`
    );
    query.append(SQL` LIMIT ${limit || 100}`);
    return await databaseCall('all',query,`[L] couldn't retrieve contacts`)
  };

  /**
   * Checks if a user with the provided auth0_sub exists. If yes, does nothing. If not, creates the user.
   * @param {Object} props an object containing the properties `auth0_sub` and `nickname`.
   */
  const createUserIfNotExists = async props => {
    const { auth0_sub, nickname } = props;
    const query  = SQL`SELECT user_id FROM users WHERE auth0_sub = ${auth0_sub}`
    const answer = await databaseCall('get',query)
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
    const { auth0_sub, nickname } = ensurePropertiesExist(props,['auth0_sub','nickname'])
    const query = SQL`INSERT INTO users (auth0_sub, nickname) VALUES (${auth0_sub},${nickname});`
    const statement = await databaseCall('run', query, `couldn't create the user`)
    return statement.lastID;
  };

  /**
   * Returns all the different providers that match the same nickname (email)
   * Returns an array of `{name:"google", sub:"google-oauth2|832432473312"}`
   * @param {string} nickname
   */
  const getUserIdentities = async nickname => {
    const query = SQL`SELECT * FROM users WHERE nickname = ${nickname}`
    const users = databaseCall('all',query,`couldn't find any user with this nickname`)
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

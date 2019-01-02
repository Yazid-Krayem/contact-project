import sqlite from 'sqlite'
import SQL from 'sql-template-strings';

const initializeDatabase = async () => {

  const db = await sqlite.open('./db.sqlite');
  
  /**
   * creates a contact
   * @param {object} props an object with keys `name` and `email`
   * @returns {number} the id of the created contact (or an error if things went wrong) 
   */
  const createContact = async (props) => {
    if(!props || !props.name || !props.email){
      throw new Error(`you must provide a name and an email`)
    }
    const { name, email } = props
    try{
      const result = await db.run(SQL`INSERT INTO contacts (name,email) VALUES (${name}, ${email})`);
      const id = result.stmt.lastID
      return id
    }catch(e){
      throw new Error(`couldn't insert this combination: `+e.message)
    }
  }
  
  /**
   * deletes a contact
   * @param {number} id the id of the contact to delete
   * @returns {boolean} `true` if the contact was deleted, an error otherwise 
   */
  const deleteContact = async (id) => {
    try{
      const result = await db.run(SQL`DELETE FROM contacts WHERE contact_id = ${id}`);
      if(result.stmt.changes === 0){
        throw new Error(`contact "${id}" does not exist`)
      }
      return true
    }catch(e){
      throw new Error(`couldn't delete the contact "${id}": `+e.message)
    }
  }
  
 /**
   * Edits a contact
   * @param {number} id the id of the contact to edit
   * @param {object} props an object with at least one of `name` or `email`
   */
  const updateContact = async (id, props) => {
    if (!props || !(props.name || props.email)) {
      throw new Error(`you must provide a name or an email`);
    }
    const { name, email } = props;
    try {
      let statement = "";
      if (name && email) {
        statement = SQL`UPDATE contacts SET email=${email}, name=${name} WHERE contact_id = ${id}`;
      } else if (name) {
        statement = SQL`UPDATE contacts SET name=${name} WHERE contact_id = ${id}`;
      } else if (email) {
        statement = SQL`UPDATE contacts SET email=${email} WHERE contact_id = ${id}`;
      }
      const result = await db.run(statement);
      if (result.stmt.changes === 0) {
        throw new Error(`no changes were made`);
      }
      return true;
    } catch (e) {
      throw new Error(`couldn't update the contact ${id}: ` + e.message);
    }
  }
  
  /**
   * Retrieves a contact
   * @param {number} id the id of the contact
   * @returns {object} an object with `name`, `email`, and `id`, representing a contact, or an error 
   */
  const getContact = async (id) => {
    try{
      const contactsList = await db.all(SQL`SELECT contact_id AS id, name, email FROM contacts WHERE contact_id = ${id}`);
      const contact = contactsList[0]
      if(!contact){
        throw new Error(`contact ${id} not found`)
      }
      return contact
    }catch(e){
      throw new Error(`couldn't get the contact ${id}: `+e.message)
    }
  }
  
  /**
   * retrieves the contacts from the database
   * @param {string} orderBy an optional string that is either "name" or "email"
   * @returns {array} the list of contacts
   */
  const getContactsList = async (orderBy) => {
    try{
      
      let statement = `SELECT contact_id AS id, name, email FROM contacts`
      switch(orderBy){
        case 'name': statement+= ` ORDER BY name`; break;
        case 'email': statement+= ` ORDER BY email`; break;
        default: break;
      }
      const rows = await db.all(statement)
      if(!rows.length){
        throw new Error(`no rows found`)
      }
      return rows
    }catch(e){
      throw new Error(`couldn't retrieve contacts: `+e.message)
    }
  }
  
  const controller = {
    createContact,
    deleteContact,
    updateContact,
    getContact,
    getContactsList
  }

  return controller
}

export default initializeDatabase

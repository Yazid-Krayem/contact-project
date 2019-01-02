import sqlite from 'sqlite'
import SQL from 'sql-template-strings';

const initializeDatabase = async () => {

  const db = await sqlite.open('./db.sqlite');
  
  /**
   * retrieves the contacts from the database
   */
  const getContactsList = async () => {
    const rows = await db.all("SELECT contact_id AS id, name, email FROM contacts")
    return rows
  }

  
  const controller = {
    getContactsList
  }

  return controller
}

export default initializeDatabase

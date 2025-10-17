/**
 * MySQL Adapter
 * Implements database-specific query execution for MySQL using mysql2
 */

/**
 * Execute raw query and return results
 * @param {Object} connection - MySQL connection object from mysql2
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array|Object>} Query results
 */
async function executeQuery(connection, sql, params) {
  try {
    // mysql2 returns [rows, fields] when using execute or query
    const [rows] = await connection.execute(sql, params)
    return rows
  } catch (error) {
    // Rethrow error to be handled by core wrapper
    throw error
  }
}

/**
 * Get single row from database
 * @param {Object} connection - MySQL connection object
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row object or null if not found
 */
async function getOne(connection, sql, params) {
  try {
    const [rows] = await connection.execute(sql, params)

    // Return first row or null
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0]
    }

    return null
  } catch (error) {
    throw error
  }
}

/**
 * Get multiple rows from database
 * @param {Object} connection - MySQL connection object
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of row objects (empty array if no results)
 */
async function get(connection, sql, params) {
  try {
    const [rows] = await connection.execute(sql, params)

    // Always return array (empty if no results)
    return Array.isArray(rows) ? rows : []
  } catch (error) {
    throw error
  }
}

/**
 * Execute INSERT/UPDATE/DELETE queries
 * @param {Object} connection - MySQL connection object
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Result object with insertId, affectedRows, etc.
 */
async function exec(connection, sql, params) {
  try {
    const [result] = await connection.execute(sql, params)

    // Return result object which contains:
    // - insertId: Last inserted ID (for INSERT)
    // - affectedRows: Number of affected rows
    // - changedRows: Number of changed rows (for UPDATE)
    // - warningCount: Number of warnings
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Begin transaction
 * @param {Object} connection - MySQL connection object
 * @returns {Promise<void>}
 */
async function beginTransaction(connection) {
  try {
    await connection.beginTransaction()
  } catch (error) {
    throw error
  }
}

/**
 * Commit transaction
 * @param {Object} connection - MySQL connection object
 * @returns {Promise<void>}
 */
async function commit(connection) {
  try {
    await connection.commit()
  } catch (error) {
    throw error
  }
}

/**
 * Rollback transaction
 * @param {Object} connection - MySQL connection object
 * @returns {Promise<void>}
 */
async function rollback(connection) {
  try {
    await connection.rollback()
  } catch (error) {
    throw error
  }
}

/**
 * Execute function within a transaction
 * Automatically handles begin, commit, and rollback
 * @param {Object} connection - MySQL connection object
 * @param {Function} callback - Async function to execute within transaction
 * @returns {Promise<any>} Result from callback function
 *
 * @example
 * await transaction(connection, async () => {
 *   await db.exec('INSERT INTO users (name) VALUES (?)', ['John'])
 *   await db.exec('INSERT INTO logs (message) VALUES (?)', ['User created'])
 * })
 */
async function transaction(connection, callback) {
  try {
    await connection.beginTransaction()

    const result = await callback()

    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  }
}

module.exports = {
  executeQuery,
  getOne,
  get,
  exec,
  beginTransaction,
  commit,
  rollback,
  transaction
}

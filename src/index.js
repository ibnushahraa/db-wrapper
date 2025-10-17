/**
 * Main entry point for @myname/db-wrapper
 * Exports wrap function that creates DB-agnostic wrapper instances
 */

const { DbWrapper } = require('./core')

/**
 * Wrap a database connection with the appropriate adapter
 * @param {Object} connection - Database connection object (from mysql2, better-sqlite3, pg, etc.)
 * @param {string} adapterType - Type of adapter to use ('mysql', 'sqlite', 'postgres')
 * @returns {DbWrapper} Wrapped database instance with helper methods
 *
 * @example
 * const mysql = require('mysql2/promise')
 * const { wrap } = require('@myname/db-wrapper')
 *
 * const connection = await mysql.createConnection({...})
 * const db = wrap(connection, 'mysql')
 *
 * // Now you can use:
 * // db.query(sql, params)
 * // db.getOne(sql, params)
 * // db.get(sql, params)
 * // db.exec(sql, params)
 */
function wrap(connection, adapterType) {
  if (!connection) {
    throw new Error('Connection object is required')
  }

  if (!adapterType) {
    throw new Error('Adapter type is required (e.g., "mysql", "sqlite", "postgres")')
  }

  // Load the appropriate adapter
  let adapter
  try {
    adapter = require(`./adapters/${adapterType}`)
  } catch (error) {
    throw new Error(`Adapter "${adapterType}" not found or not implemented. Available adapters: mysql`)
  }

  // Create DbWrapper instance with connection and adapter
  const wrapper = new DbWrapper(connection, adapter)

  // Create a proxy object that exposes both core methods and adapter helper methods
  const db = {
    // Core method from DbWrapper
    query: wrapper.query.bind(wrapper),

    // Adapter helper methods (if available)
    getOne: wrapper.getOne.bind(wrapper),
    get: wrapper.get.bind(wrapper),
    exec: wrapper.exec.bind(wrapper),

    // Transaction methods (if available in adapter)
    beginTransaction: adapter.beginTransaction ? () => adapter.beginTransaction(connection) : undefined,
    commit: adapter.commit ? () => adapter.commit(connection) : undefined,
    rollback: adapter.rollback ? () => adapter.rollback(connection) : undefined,
    transaction: adapter.transaction ? (callback) => adapter.transaction(connection, callback) : undefined,

    // Expose connection and adapter for advanced usage
    _connection: connection,
    _adapter: adapter,
    _wrapper: wrapper
  }

  return db
}

module.exports = {
  wrap
}

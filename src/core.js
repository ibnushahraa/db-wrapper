/**
 * Custom DatabaseError class that separates user-friendly messages from detailed logging
 *
 * @class DatabaseError
 * @extends Error
 *
 * @property {string} message - User-friendly error message safe to display to end users
 * @property {string} details - Detailed error information for developers (automatically logged)
 * @property {string} type - Error type classification
 *
 * @example
 * throw new DatabaseError(
 *   'This record already exists',
 *   'ER_DUP_ENTRY: Duplicate entry for key users.email',
 *   'DB_DUPLICATE'
 * )
 */
class DatabaseError extends Error {
  /**
   * Create a DatabaseError
   * @param {string} message - User-friendly message (safe to display to users)
   * @param {string} details - Detailed error information (for logging/debugging)
   * @param {string} type - Error type (e.g., 'DB_DUPLICATE', 'VALIDATION_EMPTY')
   */
  constructor(message, details, type) {
    super(message)
    this.name = 'DatabaseError'
    this.message = message // User-friendly message (safe)
    this.details = details // Detailed message for console logging
    this.type = type // Error type

    // Automatically log detailed error to console
    console.error('\n=== Database Error Details ===')
    console.error(`Timestamp: ${new Date().toISOString()}`)
    console.error(`Type: ${type}`)
    console.error(`User Message: ${message}`)
    console.error(`Details: ${details}`)
    console.error('===============================\n')
  }
}

/**
 * DB-agnostic core wrapper class
 * Handles validation and error wrapping without knowing database implementation details
 *
 * @class DbWrapper
 *
 * @property {Object} connection - Database connection object
 * @property {Object} adapter - Database adapter with executeQuery, getOne, get, exec methods
 */
class DbWrapper {
  /**
   * Create a DbWrapper instance
   * @param {Object} connection - Database connection object
   * @param {Object} adapter - Database adapter implementation
   */
  constructor(connection, adapter) {
    this.connection = connection
    this.adapter = adapter
  }

  /**
   * Count placeholders in SQL query
   * Supports ?, $1, and :name style placeholders
   *
   * @param {string} sql - SQL query string
   * @returns {number} Number of placeholders found
   *
   * @example
   * countPlaceholders('SELECT * FROM users WHERE id = ?') // returns 1
   * countPlaceholders('SELECT * FROM users WHERE id = $1 AND role = $2') // returns 2
   * countPlaceholders('SELECT * FROM users WHERE name = :name') // returns 1
   */
  countPlaceholders(sql) {
    // MySQL/SQLite style: ?
    const questionMarkMatches = sql.match(/\?/g)
    if (questionMarkMatches) {
      return questionMarkMatches.length
    }

    // PostgreSQL style: $1, $2, $3, etc.
    const dollarMatches = sql.match(/\$\d+/g)
    if (dollarMatches) {
      // Get unique numbered placeholders
      const uniqueNumbers = new Set(dollarMatches.map(m => parseInt(m.substring(1))))
      return uniqueNumbers.size
    }

    // Named placeholders: :name, :email, etc.
    const namedMatches = sql.match(/:\w+/g)
    if (namedMatches) {
      return namedMatches.length
    }

    return 0
  }

  /**
   * Validate parameters before executing query
   * Checks for:
   * 1. Placeholder count mismatch
   * 2. Empty/null/undefined values
   *
   * @param {string} sql - SQL query string
   * @param {Array|any} params - Query parameters (array or single value)
   * @returns {boolean} True if validation passes
   * @throws {DatabaseError} If validation fails
   *
   * @example
   * validateParams('SELECT * FROM users WHERE id = ?', [1]) // passes
   * validateParams('SELECT * FROM users WHERE id = ?', ['']) // throws VALIDATION_EMPTY
   * validateParams('SELECT * FROM users WHERE id = ? AND role = ?', [1]) // throws VALIDATION_MISMATCH
   */
  validateParams(sql, params) {
    const placeholderCount = this.countPlaceholders(sql)
    const paramArray = Array.isArray(params) ? params : (params ? [params] : [])

    // Check placeholder count mismatch
    if (placeholderCount !== paramArray.length) {
      const details = `Placeholder count mismatch. Expected ${placeholderCount} parameters but got ${paramArray.length}. SQL: ${sql}, Params: ${JSON.stringify(paramArray)}`
      throw new DatabaseError(
        'Invalid request parameters',
        details,
        'VALIDATION_MISMATCH'
      )
    }

    // Check for empty/null/undefined values
    for (let i = 0; i < paramArray.length; i++) {
      const value = paramArray[i]
      if (value === null || value === undefined || value === '') {
        const details = `Parameter at index ${i} is empty/null/undefined. SQL: ${sql}, Params: ${JSON.stringify(paramArray)}`
        throw new DatabaseError(
          'Invalid request parameters',
          details,
          'VALIDATION_EMPTY'
        )
      }
    }

    return true
  }

  /**
   * Map database-specific errors to user-friendly DatabaseError
   *
   * @param {Error} error - Original database error
   * @param {string} sql - SQL query that caused the error
   * @param {Array} params - Parameters used in the query
   * @returns {DatabaseError} Wrapped error with user-friendly message
   *
   * @example
   * wrapDatabaseError(new Error('ER_DUP_ENTRY'), 'INSERT INTO users...', [data])
   * // Returns DatabaseError with message: "This record already exists"
   */
  wrapDatabaseError(error, sql, params) {
    let userMessage = 'Something went wrong. Please try again.'
    let errorType = 'DB_UNKNOWN'

    // MySQL error codes
    if (error.code === 'ER_DUP_ENTRY') {
      userMessage = 'This record already exists'
      errorType = 'DB_DUPLICATE'
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      userMessage = 'Unable to process request'
      errorType = 'DB_TABLE_NOT_FOUND'
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      userMessage = 'Invalid request parameters'
      errorType = 'DB_FIELD_ERROR'
    }
    // SQLite error codes
    else if (error.code === 'SQLITE_CONSTRAINT' || error.message?.includes('UNIQUE constraint')) {
      userMessage = 'This record already exists'
      errorType = 'DB_DUPLICATE'
    }
    // PostgreSQL error codes
    else if (error.code === '23505') {
      userMessage = 'This record already exists'
      errorType = 'DB_DUPLICATE'
    } else if (error.code === '23503') {
      userMessage = 'Cannot perform this operation'
      errorType = 'DB_FOREIGN_KEY'
    }
    // Connection errors
    else if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('connect') ||
      error.message?.includes('connection')
    ) {
      userMessage = 'Unable to connect to database'
      errorType = 'DB_CONNECTION'
    }
    // Query errors
    else if (error.message?.includes('syntax') || error.message?.includes('SQL')) {
      userMessage = 'Unable to process request'
      errorType = 'DB_QUERY'
    }

    const details = `Original error: ${error.message}\nStack: ${error.stack}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}\nError code: ${error.code || 'N/A'}`

    return new DatabaseError(userMessage, details, errorType)
  }

  /**
   * Core query method
   * Validates params → executes via adapter → wraps errors
   *
   * @param {string} sql - SQL query string with placeholders
   * @param {Array} params - Query parameters to bind
   * @returns {Promise<Array|Object>} Query results (format depends on database)
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const results = await query('SELECT * FROM users WHERE id = ?', [1])
   */
  async query(sql, params = []) {
    try {
      // Validate parameters BEFORE hitting database
      this.validateParams(sql, params)

      // Execute query via adapter (adapter knows how to execute for specific DB)
      const result = await this.adapter.executeQuery(this.connection, sql, params)

      return result
    } catch (error) {
      // If it's already a DatabaseError (from validation), just rethrow
      if (error instanceof DatabaseError) {
        throw error
      }

      // Otherwise, wrap the database-specific error
      throw this.wrapDatabaseError(error, sql, params)
    }
  }

  /**
   * Helper method: Get single row
   * Delegates to adapter if available
   *
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} Single row object or null if not found
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const user = await getOne('SELECT * FROM users WHERE id = ?', [1])
   * // Returns: { id: 1, name: 'John' } or null
   */
  async getOne(sql, params = []) {
    if (this.adapter.getOne) {
      try {
        this.validateParams(sql, params)
        return await this.adapter.getOne(this.connection, sql, params)
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw error
        }
        throw this.wrapDatabaseError(error, sql, params)
      }
    }

    // Fallback to query method
    const result = await this.query(sql, params)
    return Array.isArray(result) ? (result[0] || null) : null
  }

  /**
   * Helper method: Get multiple rows
   * Delegates to adapter if available
   *
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Array of row objects (empty array if no results)
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const users = await get('SELECT * FROM users WHERE role = ?', ['admin'])
   * // Returns: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
   */
  async get(sql, params = []) {
    if (this.adapter.get) {
      try {
        this.validateParams(sql, params)
        return await this.adapter.get(this.connection, sql, params)
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw error
        }
        throw this.wrapDatabaseError(error, sql, params)
      }
    }

    // Fallback to query method
    const result = await this.query(sql, params)
    return Array.isArray(result) ? result : []
  }

  /**
   * Helper method: Execute INSERT/UPDATE/DELETE
   * Delegates to adapter if available
   *
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Result object with insertId, affectedRows, etc.
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const result = await exec('INSERT INTO users (name) VALUES (?)', ['John'])
   * // Returns: { insertId: 123, affectedRows: 1 }
   */
  async exec(sql, params = []) {
    if (this.adapter.exec) {
      try {
        this.validateParams(sql, params)
        return await this.adapter.exec(this.connection, sql, params)
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw error
        }
        throw this.wrapDatabaseError(error, sql, params)
      }
    }

    // Fallback to query method
    return await this.query(sql, params)
  }
}

module.exports = {
  DatabaseError,
  DbWrapper
}

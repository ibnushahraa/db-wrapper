/**
 * TypeScript definitions for @myname/db-wrapper
 */

/**
 * Error types returned by DatabaseError
 */
export type ErrorType =
  | 'VALIDATION_EMPTY'
  | 'VALIDATION_MISMATCH'
  | 'DB_DUPLICATE'
  | 'DB_FOREIGN_KEY'
  | 'DB_TABLE_NOT_FOUND'
  | 'DB_FIELD_ERROR'
  | 'DB_CONNECTION'
  | 'DB_QUERY'
  | 'DB_UNKNOWN'

/**
 * Custom error class with user-friendly messages and detailed logging
 */
export class DatabaseError extends Error {
  /**
   * User-friendly error message (safe to display to end users)
   */
  message: string

  /**
   * Detailed error information (for logging/debugging)
   */
  details: string

  /**
   * Error type classification
   */
  type: ErrorType

  /**
   * Create a DatabaseError
   * @param message - User-friendly message (safe to display to users)
   * @param details - Detailed error information (for logging/debugging)
   * @param type - Error type classification
   */
  constructor(message: string, details: string, type: ErrorType)
}

/**
 * Query result for INSERT operations
 */
export interface InsertResult {
  /**
   * Last inserted ID (for INSERT)
   */
  insertId: number

  /**
   * Number of affected rows
   */
  affectedRows: number

  /**
   * Number of changed rows (for UPDATE)
   */
  changedRows?: number

  /**
   * Number of warnings
   */
  warningCount?: number
}

/**
 * Generic row object returned from queries
 */
export interface Row {
  [key: string]: any
}

/**
 * Database adapter interface
 */
export interface Adapter {
  /**
   * Execute raw query and return results
   */
  executeQuery(connection: any, sql: string, params: any[]): Promise<any>

  /**
   * Get single row from database
   */
  getOne?(connection: any, sql: string, params: any[]): Promise<Row | null>

  /**
   * Get multiple rows from database
   */
  get?(connection: any, sql: string, params: any[]): Promise<Row[]>

  /**
   * Execute INSERT/UPDATE/DELETE queries
   */
  exec?(connection: any, sql: string, params: any[]): Promise<InsertResult>

  /**
   * Begin transaction
   */
  beginTransaction?(connection: any): Promise<void>

  /**
   * Commit transaction
   */
  commit?(connection: any): Promise<void>

  /**
   * Rollback transaction
   */
  rollback?(connection: any): Promise<void>

  /**
   * Execute function within a transaction
   */
  transaction?<T>(connection: any, callback: () => Promise<T>): Promise<T>
}

/**
 * Wrapped database instance
 */
export interface WrappedDatabase {
  /**
   * Execute a raw SQL query with parameter validation
   * @param sql - SQL query string with placeholders
   * @param params - Query parameters to bind
   * @returns Query results (format depends on database)
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const results = await db.query('SELECT * FROM users WHERE id = ?', [1])
   */
  query(sql: string, params?: any[]): Promise<any>

  /**
   * Get a single row from the database
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Single row object or null if not found
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const user = await db.getOne('SELECT * FROM users WHERE id = ?', [1])
   */
  getOne(sql: string, params?: any[]): Promise<Row | null>

  /**
   * Get multiple rows from the database
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Array of row objects (empty array if no results)
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const users = await db.get('SELECT * FROM users WHERE role = ?', ['admin'])
   */
  get(sql: string, params?: any[]): Promise<Row[]>

  /**
   * Execute INSERT, UPDATE, or DELETE queries
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Result object with insertId, affectedRows, etc.
   * @throws {DatabaseError} If validation fails or database error occurs
   *
   * @example
   * const result = await db.exec('INSERT INTO users (name) VALUES (?)', ['John'])
   * console.log(result.insertId)
   */
  exec(sql: string, params?: any[]): Promise<InsertResult>

  /**
   * Begin a transaction (if supported by adapter)
   * @throws {DatabaseError} If transaction fails
   *
   * @example
   * await db.beginTransaction()
   * await db.exec('INSERT INTO users...')
   * await db.commit()
   */
  beginTransaction?(): Promise<void>

  /**
   * Commit a transaction (if supported by adapter)
   * @throws {DatabaseError} If commit fails
   */
  commit?(): Promise<void>

  /**
   * Rollback a transaction (if supported by adapter)
   * @throws {DatabaseError} If rollback fails
   */
  rollback?(): Promise<void>

  /**
   * Execute function within a transaction with automatic commit/rollback
   * @param callback - Async function to execute within transaction
   * @returns Result from callback function
   * @throws {DatabaseError} If transaction fails (automatically rolls back)
   *
   * @example
   * await db.transaction(async () => {
   *   await db.exec('INSERT INTO users (name) VALUES (?)', ['John'])
   *   await db.exec('INSERT INTO logs (message) VALUES (?)', ['User created'])
   * })
   */
  transaction?<T>(callback: () => Promise<T>): Promise<T>

  /**
   * Internal: Original database connection object
   */
  _connection: any

  /**
   * Internal: Database adapter implementation
   */
  _adapter: Adapter

  /**
   * Internal: Core wrapper instance
   */
  _wrapper: any
}

/**
 * Adapter type options
 */
export type AdapterType = 'mysql' | 'sqlite' | 'postgres'

/**
 * Wrap a database connection with the appropriate adapter
 * @param connection - Database connection object (from mysql2, better-sqlite3, pg, etc.)
 * @param adapterType - Type of adapter to use ('mysql', 'sqlite', 'postgres')
 * @returns Wrapped database instance with helper methods
 * @throws {Error} If connection or adapter type is invalid
 *
 * @example
 * import mysql from 'mysql2/promise'
 * import { wrap } from '@myname/db-wrapper'
 *
 * const connection = await mysql.createConnection({
 *   host: 'localhost',
 *   user: 'root',
 *   password: '',
 *   database: 'test'
 * })
 *
 * const db = wrap(connection, 'mysql')
 *
 * // Now you can use:
 * const user = await db.getOne('SELECT * FROM users WHERE id = ?', [1])
 */
export function wrap(connection: any, adapterType: AdapterType): WrappedDatabase

/**
 * Re-export DatabaseError for convenience
 */
export { DatabaseError as default }

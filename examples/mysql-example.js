/**
 * MySQL Example
 * Demonstrates usage of @myname/db-wrapper with mysql2
 *
 * Prerequisites:
 * 1. Install mysql2: npm install mysql2
 * 2. Setup MySQL database with test table
 * 3. Update connection credentials below
 */

const mysql = require('mysql2/promise')
const { wrap } = require('../src/index')

async function main() {
  let connection

  try {
    // Create MySQL connection
    console.log('Connecting to MySQL...')
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Update with your password
      database: 'test' // Update with your database name
    })
    console.log('Connected successfully!\n')

    // Wrap connection with db-wrapper
    const db = wrap(connection, 'mysql')

    console.log('=== Example 1: getOne() - Get single user ===')
    try {
      const user = await db.getOne('SELECT * FROM users WHERE id = ?', [1])
      console.log('User:', user)
      console.log()
    } catch (error) {
      console.log('Error message for user:', error.message)
      // error.details already logged to console automatically
      console.log()
    }

    console.log('=== Example 2: get() - Get multiple users ===')
    try {
      const users = await db.get('SELECT * FROM users WHERE role = ?', ['admin'])
      console.log('Users count:', users.length)
      console.log('Users:', users)
      console.log()
    } catch (error) {
      console.log('Error message for user:', error.message)
      console.log()
    }

    console.log('=== Example 3: exec() - Insert new user ===')
    try {
      const result = await db.exec(
        'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        ['John Doe', 'john@example.com', 'user']
      )
      console.log('Insert successful!')
      console.log('Insert ID:', result.insertId)
      console.log('Affected rows:', result.affectedRows)
      console.log()
    } catch (error) {
      console.log('Error message for user:', error.message)
      // If duplicate entry, user sees: "This record already exists"
      console.log()
    }

    console.log('=== Example 4: exec() - Update user ===')
    try {
      const result = await db.exec(
        'UPDATE users SET name = ? WHERE id = ?',
        ['Jane Doe', 1]
      )
      console.log('Update successful!')
      console.log('Affected rows:', result.affectedRows)
      console.log('Changed rows:', result.changedRows)
      console.log()
    } catch (error) {
      console.log('Error message for user:', error.message)
      console.log()
    }

    console.log('=== Example 5: query() - Generic query ===')
    try {
      const results = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['admin'])
      console.log('Total admins:', results[0].total)
      console.log()
    } catch (error) {
      console.log('Error message for user:', error.message)
      console.log()
    }

    console.log('=== Example 6: Validation - Empty parameter ===')
    try {
      const user = await db.getOne('SELECT * FROM users WHERE id = ?', [''])
      console.log('User:', user)
    } catch (error) {
      console.log('Validation error caught!')
      console.log('User sees:', error.message)
      console.log('Error type:', error.type)
      console.log()
    }

    console.log('=== Example 7: Validation - Parameter count mismatch ===')
    try {
      const user = await db.getOne('SELECT * FROM users WHERE id = ? AND role = ?', [1])
      console.log('User:', user)
    } catch (error) {
      console.log('Validation error caught!')
      console.log('User sees:', error.message)
      console.log('Error type:', error.type)
      console.log()
    }

    console.log('=== Example 8: Database error - Duplicate entry ===')
    try {
      // Assuming email has UNIQUE constraint
      const result = await db.exec(
        'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        ['Duplicate User', 'john@example.com', 'user']
      )
      console.log('Insert ID:', result.insertId)
    } catch (error) {
      console.log('Database error caught!')
      console.log('User sees:', error.message) // "This record already exists"
      console.log('Error type:', error.type)
      console.log()
    }

    console.log('=== Example 9: Database error - Invalid table ===')
    try {
      const results = await db.get('SELECT * FROM non_existent_table', [])
      console.log('Results:', results)
    } catch (error) {
      console.log('Database error caught!')
      console.log('User sees:', error.message) // "Unable to process request"
      console.log('Error type:', error.type)
      console.log()
    }

    console.log('=== Example 10: Transaction - Manual control ===')
    try {
      await db.beginTransaction()

      await db.exec('INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        ['Transaction User 1', 'trans1@example.com', 'user'])

      await db.exec('INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        ['Transaction User 2', 'trans2@example.com', 'user'])

      await db.commit()
      console.log('Transaction committed successfully!')
      console.log()
    } catch (error) {
      await db.rollback()
      console.log('Transaction rolled back!')
      console.log('User sees:', error.message)
      console.log()
    }

    console.log('=== Example 11: Transaction - Auto rollback on error ===')
    try {
      await db.transaction(async () => {
        // First insert will succeed
        await db.exec('INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
          ['Auto Trans User 1', 'auto1@example.com', 'user'])

        // Second insert will fail due to duplicate email
        await db.exec('INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
          ['Auto Trans User 2', 'auto1@example.com', 'user'])
      })
      console.log('Transaction completed!')
    } catch (error) {
      console.log('Transaction auto-rolled back!')
      console.log('User sees:', error.message) // "This record already exists"
      console.log('Error type:', error.type)
      console.log('Note: First insert was also rolled back')
      console.log()
    }

    console.log('=== Example 12: Transaction - Success case ===')
    try {
      const result = await db.transaction(async () => {
        const user = await db.exec('INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
          ['Success Trans User', 'success@example.com', 'user'])

        await db.exec('INSERT INTO logs (user_id, message) VALUES (?, ?)',
          [user.insertId, 'User created successfully'])

        return user.insertId
      })
      console.log('Transaction successful! User ID:', result)
      console.log()
    } catch (error) {
      console.log('Transaction failed!')
      console.log('User sees:', error.message)
      console.log()
    }

  } catch (error) {
    console.error('Fatal error:', error.message)
  } finally {
    if (connection) {
      await connection.end()
      console.log('Connection closed.')
    }
  }
}

// Run the example
main().catch(console.error)

/**
 * Expected Database Schema:
 *
 * CREATE TABLE users (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   role ENUM('admin', 'user') DEFAULT 'user',
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * -- Sample data
 * INSERT INTO users (name, email, role) VALUES
 *   ('Alice Admin', 'alice@example.com', 'admin'),
 *   ('Bob User', 'bob@example.com', 'user');
 */

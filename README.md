# @myname/db-wrapper

A DB-agnostic database wrapper library with built-in error handling, parameter validation, and helper methods.

## Features

- **DB-Agnostic Core**: Works with multiple databases through adapters
- **Smart Error Handling**: Separates user-friendly messages from detailed logging
- **Parameter Validation**: Validates placeholder count and empty values before hitting database
- **Helper Methods**: Convenient `getOne()`, `get()`, and `exec()` methods via adapters
- **Auto Logging**: Detailed errors automatically logged to console
- **Type Safety**: Catches common mistakes like placeholder mismatches

## Supported Databases

- MySQL (via `mysql2`)
- SQLite (coming soon)
- PostgreSQL (coming soon)

## Installation

Since this is a private package, install it from the local directory:

```bash
npm install file:../db-wrapper
```

Or if using in a monorepo:

```bash
npm install @myname/db-wrapper
```

## Quick Start

### MySQL Example

```javascript
const mysql = require('mysql2/promise')
const { wrap } = require('@myname/db-wrapper')

async function main() {
  // Create connection
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
  })

  // Wrap connection
  const db = wrap(connection, 'mysql')

  try {
    // Get single row
    const user = await db.getOne('SELECT * FROM users WHERE id = ?', [1])
    console.log('User:', user)

    // Get multiple rows
    const users = await db.get('SELECT * FROM users WHERE role = ?', ['admin'])
    console.log('Users:', users)

    // Execute INSERT/UPDATE/DELETE
    const result = await db.exec(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['John Doe', 'john@example.com']
    )
    console.log('Insert ID:', result.insertId)

  } catch (error) {
    // error.message ’ user-friendly message
    // error.details ’ automatically logged to console
    console.log('Show to user:', error.message)
  }

  await connection.end()
}

main()
```

## API Documentation

### `wrap(connection, adapterType)`

Wraps a database connection with the appropriate adapter.

**Parameters:**
- `connection` (Object): Database connection object (from mysql2, better-sqlite3, pg, etc.)
- `adapterType` (String): Adapter type - `'mysql'`, `'sqlite'`, or `'postgres'`

**Returns:** Wrapped database instance with helper methods

**Example:**
```javascript
const db = wrap(connection, 'mysql')
```

---

### `db.query(sql, params)`

Execute a raw SQL query with parameter validation.

**Parameters:**
- `sql` (String): SQL query with placeholders (`?` for MySQL/SQLite, `$1` for PostgreSQL)
- `params` (Array): Array of parameters to bind to placeholders

**Returns:** Promise resolving to query results (format depends on database)

**Example:**
```javascript
const results = await db.query('SELECT * FROM users WHERE id = ?', [1])
```

---

### `db.getOne(sql, params)`

Get a single row from the database.

**Parameters:**
- `sql` (String): SQL query
- `params` (Array): Query parameters

**Returns:** Promise resolving to a single row object or `null` if not found

**Example:**
```javascript
const user = await db.getOne('SELECT * FROM users WHERE id = ?', [1])
// user = { id: 1, name: 'John', email: 'john@example.com' } or null
```

---

### `db.get(sql, params)`

Get multiple rows from the database.

**Parameters:**
- `sql` (String): SQL query
- `params` (Array): Query parameters

**Returns:** Promise resolving to an array of row objects (empty array if no results)

**Example:**
```javascript
const users = await db.get('SELECT * FROM users WHERE role = ?', ['admin'])
// users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
```

---

### `db.exec(sql, params)`

Execute INSERT, UPDATE, or DELETE queries.

**Parameters:**
- `sql` (String): SQL query
- `params` (Array): Query parameters

**Returns:** Promise resolving to result object with:
- `insertId`: Last inserted ID (for INSERT)
- `affectedRows`: Number of affected rows
- `changedRows`: Number of changed rows (for UPDATE)

**Example:**
```javascript
const result = await db.exec(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ['Jane', 'jane@example.com']
)
console.log('Insert ID:', result.insertId)
```

## Error Handling

The library provides two levels of error information:

### 1. User-Friendly Messages (`error.message`)

Safe to display to end users, never exposes technical details:

- `"This record already exists"` - Duplicate entry
- `"Unable to process request"` - Table not found or field error
- `"Invalid request parameters"` - Validation errors
- `"Unable to connect to database"` - Connection errors
- `"Something went wrong. Please try again."` - Default fallback

### 2. Detailed Logging (`error.details`)

Automatically logged to console for developers, includes:
- Timestamp
- Error type
- SQL query
- Parameters
- Stack trace
- Original database error

**Example:**
```javascript
try {
  await db.exec('INSERT INTO users (email) VALUES (?)', ['existing@example.com'])
} catch (error) {
  // User sees:
  console.log(error.message) // "This record already exists"

  // Console automatically shows:
  // === Database Error Details ===
  // Timestamp: 2025-10-17T10:30:45.123Z
  // Type: DB_DUPLICATE
  // User Message: This record already exists
  // Details: Original error: ER_DUP_ENTRY...
  // ===============================
}
```

## Parameter Validation

The library validates parameters **before** hitting the database:

### Placeholder Count Validation

```javascript
// L Error: Expected 2 parameters but got 1
await db.query('SELECT * FROM users WHERE id = ? AND role = ?', [1])

//  Correct
await db.query('SELECT * FROM users WHERE id = ? AND role = ?', [1, 'admin'])
```

### Empty Value Validation

```javascript
// L Error: Parameter is empty/null/undefined
await db.query('SELECT * FROM users WHERE id = ?', [''])
await db.query('SELECT * FROM users WHERE id = ?', [null])
await db.query('SELECT * FROM users WHERE id = ?', [undefined])

//  Correct
await db.query('SELECT * FROM users WHERE id = ?', [1])
```

## Error Types

The library categorizes errors for better handling:

- `VALIDATION_EMPTY` - Empty/null/undefined parameter
- `VALIDATION_MISMATCH` - Placeholder count mismatch
- `DB_DUPLICATE` - Duplicate entry constraint
- `DB_FOREIGN_KEY` - Foreign key constraint
- `DB_TABLE_NOT_FOUND` - Table doesn't exist
- `DB_FIELD_ERROR` - Invalid field name
- `DB_CONNECTION` - Connection error
- `DB_QUERY` - SQL syntax error
- `DB_UNKNOWN` - Unknown database error

**Example:**
```javascript
try {
  await db.getOne('SELECT * FROM users WHERE id = ?', [''])
} catch (error) {
  console.log(error.type) // "VALIDATION_EMPTY"
  console.log(error.message) // "Invalid request parameters"
}
```

## Database-Specific Notes

### MySQL

- Uses `mysql2` package (promise-based)
- Placeholder style: `?`
- Connection via `mysql.createConnection()` or `mysql.createPool()`

```javascript
const mysql = require('mysql2/promise')
const connection = await mysql.createConnection({...})
const db = wrap(connection, 'mysql')
```

### SQLite (Coming Soon)

- Will use `better-sqlite3` package
- Placeholder style: `?`
- Synchronous by default

### PostgreSQL (Coming Soon)

- Will use `pg` package
- Placeholder style: `$1`, `$2`, `$3`

## Advanced Usage

### Access Underlying Connection

```javascript
const db = wrap(connection, 'mysql')

// Access original connection
const rawConnection = db._connection

// Access adapter
const adapter = db._adapter

// Access wrapper instance
const wrapper = db._wrapper
```

### Custom Error Handling

```javascript
try {
  await db.exec('INSERT INTO users (email) VALUES (?)', ['test@example.com'])
} catch (error) {
  if (error.type === 'DB_DUPLICATE') {
    // Handle duplicate specifically
    console.log('User already exists')
  } else if (error.type.startsWith('VALIDATION_')) {
    // Handle validation errors
    console.log('Please check your input')
  } else {
    // Generic error handling
    console.log(error.message)
  }
}
```

## Project Structure

```
db-wrapper/
   package.json          # Package configuration
   src/
      index.js          # Main entry point, exports wrap()
      core.js           # Core validation & error handling (DB-agnostic)
      adapters/
          mysql.js      # MySQL adapter with helper methods
   examples/
      mysql-example.js  # Complete usage example
   README.md             # This file
```

## Development

### Adding a New Adapter

1. Create adapter file in `src/adapters/`
2. Implement required methods:
   - `executeQuery(connection, sql, params)`
   - `getOne(connection, sql, params)`
   - `get(connection, sql, params)`
   - `exec(connection, sql, params)`
3. Update `wrap()` function in `src/index.js`
4. Add example file in `examples/`

## Contributing

This is a private package. For issues or feature requests, contact the package maintainer.

## License

ISC

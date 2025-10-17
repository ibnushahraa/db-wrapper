# @myname/db-wrapper

DB-agnostic database wrapper with error handling, validation, and helper methods.

## Features

- User-friendly error messages with detailed logging
- Parameter validation before query execution
- Helper methods: getOne(), get(), exec()
- Transaction support with auto-rollback
- TypeScript definitions included

## Installation

```bash
npm install github:ibnushahraa/db-wrapper
```

## Quick Start

```javascript
const mysql = require("mysql2/promise");
const { wrap } = require("@myname/db-wrapper");

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "test",
});

const db = wrap(connection, "mysql");

// Get single row
const user = await db.getOne("SELECT * FROM users WHERE id = ?", [1]);

// Get multiple rows
const users = await db.get("SELECT * FROM users WHERE role = ?", ["admin"]);

// Execute INSERT/UPDATE/DELETE
const result = await db.exec("INSERT INTO users (name) VALUES (?)", ["John"]);
console.log(result.insertId);

// Transaction
await db.transaction(async () => {
  await db.exec("INSERT INTO users (name) VALUES (?)", ["Alice"]);
  await db.exec("INSERT INTO logs (message) VALUES (?)", ["User created"]);
});
```

## API

### query(sql, params)

Execute raw SQL query with validation.

### getOne(sql, params)

Get single row or null.

### get(sql, params)

Get array of rows.

### exec(sql, params)

Execute INSERT/UPDATE/DELETE, returns result with insertId.

### transaction(callback)

Execute queries in transaction with auto-rollback on error.

## Error Handling

All errors are wrapped with user-friendly messages:

- "This record already exists" - Duplicate entry
- "Unable to process request" - SQL/table errors
- "Invalid request parameters" - Validation errors

Detailed errors are automatically logged to console.

## Supported Databases

- MySQL (mysql2)
- SQLite (coming soon)
- PostgreSQL (coming soon)

## License

ISC

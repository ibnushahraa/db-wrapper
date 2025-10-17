# db-wrapper

[![npm version](https://img.shields.io/npm/v/@ibnushahraa/db-wrapper.svg?style=flat-square)](https://www.npmjs.com/package/@ibnushahraa/db-wrapper)
[![npm downloads](https://img.shields.io/npm/dm/@ibnushahraa/db-wrapper.svg?style=flat-square)](https://www.npmjs.com/package/@ibnushahraa/db-wrapper)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/ibnushahraa/db-wrapper/actions/workflows/test.yml/badge.svg)](https://github.com/ibnushahraa/db-wrapper/actions/workflows/test.yml)
[![coverage](https://img.shields.io/badge/coverage-89%25-brightgreen.svg?style=flat-square)](https://github.com/ibnushahraa/db-wrapper)

🗄️ A **database-agnostic wrapper** with built-in **error handling**, **validation**, and **helper methods** for MySQL, PostgreSQL, and SQLite.
Lightweight, production-ready, and developer-friendly.

---

## ✨ Features

- **Database-agnostic** - Works with MySQL, PostgreSQL, and SQLite
- **User-friendly error messages** - Separate messages for users and developers
- **Automatic validation** - Validates parameters before executing queries
- **Helper methods** - `getOne()`, `get()`, `exec()` for common operations
- **Transaction support** - Built-in transaction handling with auto-rollback
- **Dual package support** (CommonJS + ES Modules)
- **TypeScript** definitions included
- Zero dependencies (except database drivers)

---

## 📦 Installation

```bash
npm install @ibnushahraa/db-wrapper
```

Install your preferred database driver:

```bash
# For MySQL
npm install mysql2

# For PostgreSQL
npm install pg

# For SQLite
npm install better-sqlite3
```

---

## 🚀 Usage

### Basic Usage

```js
const mysql = require("mysql2/promise");
const { wrap } = require("@ibnushahraa/db-wrapper");

// Create connection
const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "mydb",
  password: "secret",
});

// Wrap the connection
const db = wrap(connection, "mysql");

// Now you can use helper methods
const user = await db.getOne("SELECT * FROM users WHERE id = ?", [1]);
console.log(user); // { id: 1, name: 'John', email: 'john@example.com' }
```

---

## 📖 API Reference

### `wrap(connection, adapterType)`

Wraps a database connection with helper methods.

**Parameters:**

- `connection` (object): Database connection object
- `adapterType` (string): Type of adapter - `"mysql"`, `"sqlite"`, or `"postgres"`

**Returns:** Wrapped database instance with helper methods

**Example:**

```js
const db = wrap(connection, "mysql");
```

---

### `query(sql, params)`

Execute a raw SQL query with parameter validation.

**Parameters:**

- `sql` (string): SQL query with placeholders (`?` for MySQL/SQLite, `$1, $2` for PostgreSQL)
- `params` (array): Parameters to bind to the query

**Returns:** `Promise<Array|Object>` - Query results (format depends on database)

**Example:**

```js
const results = await db.query("SELECT * FROM users WHERE role = ?", ["admin"]);
```

---

### `getOne(sql, params)`

Get a single row from the database.

**Parameters:**

- `sql` (string): SQL query with placeholders
- `params` (array): Parameters to bind to the query

**Returns:** `Promise<Object|null>` - Single row object or `null` if not found

**Example:**

```js
const user = await db.getOne("SELECT * FROM users WHERE id = ?", [1]);
// Returns: { id: 1, name: 'John', email: 'john@example.com' }
// Or null if not found
```

---

### `get(sql, params)`

Get multiple rows from the database.

**Parameters:**

- `sql` (string): SQL query with placeholders
- `params` (array): Parameters to bind to the query

**Returns:** `Promise<Array>` - Array of row objects (empty array if no results)

**Example:**

```js
const users = await db.get("SELECT * FROM users WHERE role = ?", ["admin"]);
// Returns: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
```

---

### `exec(sql, params)`

Execute INSERT, UPDATE, or DELETE queries.

**Parameters:**

- `sql` (string): SQL query with placeholders
- `params` (array): Parameters to bind to the query

**Returns:** `Promise<Object>` - Result object with `insertId`, `affectedRows`, etc.

**Example:**

```js
// INSERT
const result = await db.exec("INSERT INTO users (name, email) VALUES (?, ?)", [
  "John",
  "john@example.com",
]);
console.log(result.insertId); // 123
console.log(result.affectedRows); // 1

// UPDATE
const updateResult = await db.exec("UPDATE users SET name = ? WHERE id = ?", [
  "Jane",
  1,
]);
console.log(updateResult.affectedRows); // 1

// DELETE
const deleteResult = await db.exec("DELETE FROM users WHERE id = ?", [1]);
console.log(deleteResult.affectedRows); // 1
```

---

### `transaction(callback)`

Execute multiple queries within a transaction. Automatically commits on success and rolls back on error.

**Parameters:**

- `callback` (function): Async function containing queries to execute

**Returns:** `Promise<any>` - Result from the callback function

**Example:**

```js
await db.transaction(async () => {
  await db.exec("INSERT INTO users (name) VALUES (?)", ["Alice"]);
  await db.exec("INSERT INTO logs (message) VALUES (?)", ["User created"]);
  // Both queries will be committed together
  // If any query fails, all changes will be rolled back
});
```

---

## 🛡️ Error Handling

The wrapper automatically converts database-specific errors into user-friendly messages:

| Error Type       | User Message                    | Details (Logged)             |
| ---------------- | ------------------------------- | ---------------------------- |
| Duplicate Entry  | "This record already exists"    | Full SQL error with query    |
| Table Not Found  | "Unable to process request"     | Table name and SQL query     |
| Invalid Field    | "Invalid request parameters"    | Field name and SQL query     |
| Connection Error | "Unable to connect to database" | Connection details           |
| Validation Error | "Invalid request parameters"    | Parameter validation details |

**Example:**

```js
try {
  // This will throw validation error
  await db.query("SELECT * FROM users WHERE id = ?", []); // Missing parameter
} catch (error) {
  console.log(error.message);
  // "Invalid request parameters"

  console.log(error.type);
  // "VALIDATION_MISMATCH"

  console.log(error.details);
  // Detailed error information (automatically logged to console)
}
```

---

## 🧪 Testing

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Jest is used for testing with **89% code coverage** (63 tests passing).

---

## 📂 Project Structure

```
src/
  ├── core.js           → Core wrapper logic with validation & error handling
  ├── index.js          → Main entry point with wrap function
  └── adapters/
      └── mysql.js      → MySQL adapter implementation
test/
  ├── core.test.js      → Tests for core functionality
  ├── index.test.js     → Tests for wrap function
  └── adapters/
      └── mysql.test.js → Tests for MySQL adapter
```

---

## 🌐 Integration Examples

### Express.js API

```js
const express = require("express");
const mysql = require("mysql2/promise");
const { wrap } = require("@ibnushahraa/db-wrapper");

const app = express();
app.use(express.json());

let db;

// Initialize database connection
mysql
  .createConnection({
    host: "localhost",
    user: "root",
    database: "mydb",
  })
  .then((connection) => {
    db = wrap(connection, "mysql");
    console.log("Database connected");
  });

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await db.get("SELECT * FROM users", []);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await db.getOne("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user
// Note: No need to manually validate if name/email exist in req.body
// The wrapper automatically throws error if parameters are null/undefined/empty
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    // If name or email is missing/empty, db.exec will automatically throw
    // a validation error that will be caught in the catch block
    const result = await db.exec(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );
    res.json({ id: result.insertId, name, email });
  } catch (error) {
    // error.message will be user-friendly like "Invalid request parameters"
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("API running on http://localhost:3000"));
```

---

### TypeScript Usage

```typescript
import mysql from "mysql2/promise";
import { wrap } from "@ibnushahraa/db-wrapper";

interface User {
  id: number;
  name: string;
  email: string;
}

async function main() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "mydb",
  });

  const db = wrap(connection, "mysql");

  // Get single user
  const user = await db.getOne<User>("SELECT * FROM users WHERE id = ?", [1]);
  console.log(user?.name);

  // Get multiple users
  const users = await db.get<User[]>("SELECT * FROM users WHERE role = ?", [
    "admin",
  ]);
  users.forEach((u) => console.log(u.name));

  // Execute insert
  const result = await db.exec(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ["John", "john@example.com"]
  );
  console.log(`User created with ID: ${result.insertId}`);
}

main();
```

---

### Transaction Example - Reseller Sales Transaction (Real-world Scenario)

```js
const mysql = require("mysql2/promise");
const { wrap } = require("@ibnushahraa/db-wrapper");

/**
 * Process reseller sales transaction with balance deduction
 *
 * Flow:
 * 1. Lock reseller row and reserve balance in saldo_hold
 * 2. Process the transaction (e.g., call provider API, send product)
 * 3. If success: deduct from both saldo and saldo_hold
 * 4. If failed: release the hold (no deduction)
 *
 * This prevents race conditions when multiple transactions happen simultaneously
 */
async function processResellerSale(resellerId, productPrice, productId) {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "reseller_db",
  });
  const db = wrap(connection, "mysql");

  try {
    const result = await db.transaction(async () => {
      // Step 1: Lock row and check if reseller has enough balance
      // FOR UPDATE prevents other transactions from modifying this row
      const reseller = await db.getOne(
        "SELECT saldo, saldo_hold FROM masterreseller WHERE id = ? FOR UPDATE",
        [resellerId]
      );

      if (!reseller) {
        throw new Error("Reseller not found");
      }

      // Check if balance is sufficient (available balance = saldo - saldo_hold)
      const availableBalance = reseller.saldo - reseller.saldo_hold;
      if (availableBalance < productPrice) {
        throw new Error(`Insufficient balance. Available: ${availableBalance}, Required: ${productPrice}`);
      }

      // Step 2: Reserve balance by adding to saldo_hold (pending transaction)
      await db.exec(
        "UPDATE masterreseller SET saldo_hold = saldo_hold + ? WHERE id = ?",
        [productPrice, resellerId]
      );

      console.log(`Reserved ${productPrice} in saldo_hold for reseller ${resellerId}`);

      // Step 3: Process transaction (e.g., call provider API, send product to customer)
      // In real scenario: call external API, send SMS, top up phone number, etc.
      const transactionSuccess = await processProviderAPI(productId); // simulate API call

      if (!transactionSuccess) {
        throw new Error("Provider transaction failed");
      }

      // Step 4: Transaction successful - deduct from both saldo and saldo_hold
      // This confirms the transaction and removes the hold
      await db.exec(
        "UPDATE masterreseller SET saldo = saldo - ?, saldo_hold = saldo_hold - ? WHERE id = ?",
        [productPrice, productPrice, resellerId]
      );

      console.log(`Deducted ${productPrice} from saldo and released hold for reseller ${resellerId}`);
      console.log(`Previous balance: ${reseller.saldo}, New balance: ${reseller.saldo - productPrice}`);

      // Insert transaction log
      const logResult = await db.exec(
        "INSERT INTO transaction_logs (reseller_id, product_id, amount, status) VALUES (?, ?, ?, ?)",
        [resellerId, productId, productPrice, "success"]
      );

      return { transactionId: logResult.insertId, success: true };
    });

    console.log("Transaction successful!");
    return { success: true, transactionId: result.transactionId };
  } catch (error) {
    // Transaction automatically rolled back on error
    // If we reserved balance in saldo_hold, it will be reverted
    // If provider API failed, no money is deducted
    console.error("Transaction failed:", error.message);
    return { success: false, message: error.message };
  } finally {
    await connection.end();
  }
}

// Simulate provider API call
async function processProviderAPI(productId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Simulate success (90% success rate)
  return Math.random() > 0.1;
}

// Usage
processResellerSale(1, 50000, "PULSA_50K").then((result) => {
  console.log(result);
});
```

**Why use FOR UPDATE?**

- Prevents race conditions when reseller makes multiple sales simultaneously
- Locks the row so other transactions must wait
- Ensures accurate balance calculation during concurrent transactions

**Flow Explanation:**

1. **Lock & Validate**: Lock reseller row with `FOR UPDATE` and check if balance is sufficient
2. **Reserve Balance**: Add amount to `saldo_hold` (reserve balance for this transaction)
3. **Process Transaction**: Call provider API, send product to customer
4. **Confirm & Deduct**: If successful, deduct from both `saldo` and `saldo_hold` (confirm transaction)
5. **Log Transaction**: Insert transaction log for record keeping
6. **Auto Rollback**: If any step fails (insufficient balance, API error), entire transaction is rolled back

**Key Benefits:**

- No double-spending: Balance is reserved before processing
- Atomic operations: Either all steps succeed or all are rolled back
- Concurrent safety: Multiple transactions won't interfere with each other
- Accurate balance tracking: `saldo_hold` tracks pending transactions

---

## 🔒 Parameter Validation

The wrapper automatically validates parameters before executing queries:

### Validation Rules

1. **Placeholder Count Match** - Number of placeholders must match number of parameters
2. **No Empty Values** - Parameters cannot be `null`, `undefined`, or empty string

### Examples

```js
// ✅ Valid
await db.query("SELECT * FROM users WHERE id = ?", [1]);
await db.query("SELECT * FROM users WHERE id = ? AND role = ?", [1, "admin"]);

// ❌ Invalid - Placeholder count mismatch
await db.query("SELECT * FROM users WHERE id = ?", [1, 2]);
// Error: "Invalid request parameters" (VALIDATION_MISMATCH)

// ❌ Invalid - Empty parameter
await db.query("SELECT * FROM users WHERE name = ?", [""]);
// Error: "Invalid request parameters" (VALIDATION_EMPTY)

// ❌ Invalid - Null parameter
await db.query("SELECT * FROM users WHERE id = ?", [null]);
// Error: "Invalid request parameters" (VALIDATION_EMPTY)
```

---

## 🗃️ Supported Databases

| Database   | Adapter Type | Driver           | Status         |
| ---------- | ------------ | ---------------- | -------------- |
| MySQL      | `'mysql'`    | `mysql2`         | ✅ Available   |
| PostgreSQL | `'postgres'` | `pg`             | 🚧 Coming Soon |
| SQLite     | `'sqlite'`   | `better-sqlite3` | 🚧 Coming Soon |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Ways to contribute:**

- Report bugs and suggest features
- Submit pull requests
- Improve documentation
- Add support for more databases (PostgreSQL, SQLite)

---

## 📄 License

[MIT](LICENSE) © 2025

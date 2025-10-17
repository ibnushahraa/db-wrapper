# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-17

### Added
- Initial release of db-wrapper
- Database-agnostic wrapper for MySQL, PostgreSQL, and SQLite
- Core wrapper class (`DbWrapper`) with validation and error handling
- MySQL adapter with full support for query operations
- Helper methods:
  - `query()` - Execute raw SQL with parameter validation
  - `getOne()` - Get single row or null
  - `get()` - Get array of rows
  - `exec()` - Execute INSERT/UPDATE/DELETE operations
- Transaction support with auto-rollback on error:
  - `beginTransaction()`
  - `commit()`
  - `rollback()`
  - `transaction()` - Higher-level transaction wrapper
- Parameter validation before query execution:
  - Placeholder count matching
  - Empty/null/undefined value detection
  - Support for `?`, `$1`, and `:name` placeholder styles
- User-friendly error messages with detailed logging
- Custom `DatabaseError` class with error type classification
- Error mapping for common database errors:
  - Duplicate entry errors
  - Table not found errors
  - Invalid field errors
  - Connection errors
  - Query syntax errors
- TypeScript definitions (`.d.ts`)
- CommonJS and ES Modules support
- Comprehensive test suite with Jest:
  - 63 test cases
  - 89% code coverage
  - Tests for core functionality, MySQL adapter, and wrap function
- GitHub Actions CI/CD workflow:
  - Automated testing on push and pull requests
  - Multi-version Node.js testing (18.x, 20.x, 22.x)
  - Coverage reporting integration
- Complete documentation:
  - README with usage examples
  - API reference documentation
  - Integration examples (Express.js, TypeScript)
  - Parameter validation guide

### Dependencies
- Peer dependencies:
  - `mysql2` ^3.0.0 (optional)
  - `better-sqlite3` ^9.0.0 (optional)
  - `pg` ^8.0.0 (optional)
- Dev dependencies:
  - `jest` ^30.2.0
  - `@types/jest` ^30.0.0

### Notes
- This is the initial beta release
- Currently only MySQL adapter is fully implemented
- PostgreSQL and SQLite adapters are planned for future releases

[0.0.1]: https://github.com/ibnushahraa/db-wrapper/releases/tag/v0.0.1

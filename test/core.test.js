const { DatabaseError, DbWrapper } = require('../src/core')

describe('DatabaseError', () => {
  // Mock console.error to avoid cluttering test output
  let consoleErrorSpy

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('should create DatabaseError with correct properties', () => {
    const error = new DatabaseError(
      'User-friendly message',
      'Detailed error information',
      'ERROR_TYPE'
    )

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DatabaseError)
    expect(error.name).toBe('DatabaseError')
    expect(error.message).toBe('User-friendly message')
    expect(error.details).toBe('Detailed error information')
    expect(error.type).toBe('ERROR_TYPE')
  })

  test('should log error details to console', () => {
    const error = new DatabaseError(
      'Test message',
      'Test details',
      'TEST_TYPE'
    )

    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(consoleErrorSpy.mock.calls.some(call =>
      call[0].includes('Database Error Details')
    )).toBe(true)
  })
})

describe('DbWrapper - countPlaceholders', () => {
  let wrapper

  beforeEach(() => {
    const mockAdapter = {
      executeQuery: jest.fn()
    }
    wrapper = new DbWrapper({}, mockAdapter)
  })

  test('should count ? placeholders (MySQL/SQLite style)', () => {
    expect(wrapper.countPlaceholders('SELECT * FROM users WHERE id = ?')).toBe(1)
    expect(wrapper.countPlaceholders('SELECT * FROM users WHERE id = ? AND name = ?')).toBe(2)
    expect(wrapper.countPlaceholders('INSERT INTO users (name, email, age) VALUES (?, ?, ?)')).toBe(3)
  })

  test('should count $n placeholders (PostgreSQL style)', () => {
    expect(wrapper.countPlaceholders('SELECT * FROM users WHERE id = $1')).toBe(1)
    expect(wrapper.countPlaceholders('SELECT * FROM users WHERE id = $1 AND name = $2')).toBe(2)
    expect(wrapper.countPlaceholders('INSERT INTO users (name, email) VALUES ($1, $2)')).toBe(2)
  })

  test('should count unique $n placeholders when repeated', () => {
    expect(wrapper.countPlaceholders('SELECT * FROM users WHERE id = $1 OR parent_id = $1')).toBe(1)
    expect(wrapper.countPlaceholders('UPDATE users SET name = $1 WHERE id = $2 OR parent = $2')).toBe(2)
  })

  test('should count :name placeholders (named style)', () => {
    expect(wrapper.countPlaceholders('SELECT * FROM users WHERE id = :id')).toBe(1)
    expect(wrapper.countPlaceholders('SELECT * FROM users WHERE name = :name AND email = :email')).toBe(2)
  })

  test('should return 0 for queries without placeholders', () => {
    expect(wrapper.countPlaceholders('SELECT * FROM users')).toBe(0)
    expect(wrapper.countPlaceholders('DELETE FROM users WHERE 1=1')).toBe(0)
  })
})

describe('DbWrapper - validateParams', () => {
  let wrapper

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation()

    const mockAdapter = {
      executeQuery: jest.fn()
    }
    wrapper = new DbWrapper({}, mockAdapter)
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  test('should pass validation with correct parameters', () => {
    expect(() => {
      wrapper.validateParams('SELECT * FROM users WHERE id = ?', [1])
    }).not.toThrow()

    expect(() => {
      wrapper.validateParams('SELECT * FROM users WHERE id = ? AND name = ?', [1, 'John'])
    }).not.toThrow()
  })

  test('should throw VALIDATION_MISMATCH when placeholder count does not match', () => {
    expect(() => {
      wrapper.validateParams('SELECT * FROM users WHERE id = ? AND name = ?', [1])
    }).toThrow(DatabaseError)

    try {
      wrapper.validateParams('SELECT * FROM users WHERE id = ?', [1, 2])
    } catch (error) {
      expect(error.type).toBe('VALIDATION_MISMATCH')
      expect(error.message).toBe('Invalid request parameters')
    }
  })

  test('should throw VALIDATION_EMPTY for null values', () => {
    try {
      wrapper.validateParams('SELECT * FROM users WHERE id = ?', [null])
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.type).toBe('VALIDATION_EMPTY')
      expect(error.message).toBe('Invalid request parameters')
    }
  })

  test('should throw VALIDATION_EMPTY for undefined values', () => {
    try {
      wrapper.validateParams('SELECT * FROM users WHERE id = ?', [undefined])
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.type).toBe('VALIDATION_EMPTY')
    }
  })

  test('should throw VALIDATION_EMPTY for empty string values', () => {
    try {
      wrapper.validateParams('SELECT * FROM users WHERE name = ?', [''])
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.type).toBe('VALIDATION_EMPTY')
    }
  })

  test('should handle single non-array parameter', () => {
    expect(() => {
      wrapper.validateParams('SELECT * FROM users WHERE id = ?', 1)
    }).not.toThrow()
  })

  test('should handle query without placeholders and empty params', () => {
    expect(() => {
      wrapper.validateParams('SELECT * FROM users', [])
    }).not.toThrow()
  })
})

describe('DbWrapper - wrapDatabaseError', () => {
  let wrapper

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation()
    const mockAdapter = {
      executeQuery: jest.fn()
    }
    wrapper = new DbWrapper({}, mockAdapter)
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  test('should wrap MySQL duplicate entry error', () => {
    const originalError = new Error('ER_DUP_ENTRY: Duplicate entry')
    originalError.code = 'ER_DUP_ENTRY'

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'INSERT INTO users...', [])

    expect(wrappedError).toBeInstanceOf(DatabaseError)
    expect(wrappedError.type).toBe('DB_DUPLICATE')
    expect(wrappedError.message).toBe('This record already exists')
  })

  test('should wrap MySQL table not found error', () => {
    const originalError = new Error('ER_NO_SUCH_TABLE')
    originalError.code = 'ER_NO_SUCH_TABLE'

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'SELECT * FROM...', [])

    expect(wrappedError.type).toBe('DB_TABLE_NOT_FOUND')
    expect(wrappedError.message).toBe('Unable to process request')
  })

  test('should wrap MySQL bad field error', () => {
    const originalError = new Error('ER_BAD_FIELD_ERROR')
    originalError.code = 'ER_BAD_FIELD_ERROR'

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'SELECT * FROM...', [])

    expect(wrappedError.type).toBe('DB_FIELD_ERROR')
    expect(wrappedError.message).toBe('Invalid request parameters')
  })

  test('should wrap SQLite constraint error', () => {
    const originalError = new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed')
    originalError.code = 'SQLITE_CONSTRAINT'

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'INSERT INTO...', [])

    expect(wrappedError.type).toBe('DB_DUPLICATE')
    expect(wrappedError.message).toBe('This record already exists')
  })

  test('should wrap PostgreSQL duplicate error (23505)', () => {
    const originalError = new Error('duplicate key value violates unique constraint')
    originalError.code = '23505'

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'INSERT INTO...', [])

    expect(wrappedError.type).toBe('DB_DUPLICATE')
    expect(wrappedError.message).toBe('This record already exists')
  })

  test('should wrap PostgreSQL foreign key error (23503)', () => {
    const originalError = new Error('violates foreign key constraint')
    originalError.code = '23503'

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'DELETE FROM...', [])

    expect(wrappedError.type).toBe('DB_FOREIGN_KEY')
    expect(wrappedError.message).toBe('Cannot perform this operation')
  })

  test('should wrap connection errors', () => {
    const originalError = new Error('Connection refused')
    originalError.code = 'ECONNREFUSED'

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'SELECT...', [])

    expect(wrappedError.type).toBe('DB_CONNECTION')
    expect(wrappedError.message).toBe('Unable to connect to database')
  })

  test('should wrap query syntax errors', () => {
    const originalError = new Error('You have an error in your SQL syntax')

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'SELCT...', [])

    expect(wrappedError.type).toBe('DB_QUERY')
    expect(wrappedError.message).toBe('Unable to process request')
  })

  test('should wrap unknown errors', () => {
    const originalError = new Error('Some unknown error')

    const wrappedError = wrapper.wrapDatabaseError(originalError, 'SELECT...', [])

    expect(wrappedError.type).toBe('DB_UNKNOWN')
    expect(wrappedError.message).toBe('Something went wrong. Please try again.')
  })
})

describe('DbWrapper - query method', () => {
  let wrapper
  let mockAdapter
  let mockConnection

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation()
    mockConnection = {}
    mockAdapter = {
      executeQuery: jest.fn()
    }
    wrapper = new DbWrapper(mockConnection, mockAdapter)
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  test('should execute query successfully', async () => {
    const mockResult = [{ id: 1, name: 'John' }]
    mockAdapter.executeQuery.mockResolvedValue(mockResult)

    const result = await wrapper.query('SELECT * FROM users WHERE id = ?', [1])

    expect(result).toEqual(mockResult)
    expect(mockAdapter.executeQuery).toHaveBeenCalledWith(mockConnection, 'SELECT * FROM users WHERE id = ?', [1])
  })

  test('should validate params before executing', async () => {
    mockAdapter.executeQuery.mockResolvedValue([])

    await expect(
      wrapper.query('SELECT * FROM users WHERE id = ?', [])
    ).rejects.toThrow(DatabaseError)

    expect(mockAdapter.executeQuery).not.toHaveBeenCalled()
  })

  test('should wrap database errors', async () => {
    const dbError = new Error('ER_DUP_ENTRY')
    dbError.code = 'ER_DUP_ENTRY'
    mockAdapter.executeQuery.mockRejectedValue(dbError)

    try {
      await wrapper.query('INSERT INTO users (email) VALUES (?)', ['test@example.com'])
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.type).toBe('DB_DUPLICATE')
    }
  })

  test('should rethrow DatabaseError from validation', async () => {
    try {
      await wrapper.query('SELECT * FROM users WHERE id = ?', [null])
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.type).toBe('VALIDATION_EMPTY')
    }
  })
})

describe('DbWrapper - helper methods', () => {
  let wrapper
  let mockAdapter
  let mockConnection

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation()
    mockConnection = {}
    mockAdapter = {
      executeQuery: jest.fn(),
      getOne: jest.fn(),
      get: jest.fn(),
      exec: jest.fn()
    }
    wrapper = new DbWrapper(mockConnection, mockAdapter)
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  describe('getOne', () => {
    test('should call adapter.getOne when available', async () => {
      const mockUser = { id: 1, name: 'John' }
      mockAdapter.getOne.mockResolvedValue(mockUser)

      const result = await wrapper.getOne('SELECT * FROM users WHERE id = ?', [1])

      expect(result).toEqual(mockUser)
      expect(mockAdapter.getOne).toHaveBeenCalledWith(mockConnection, 'SELECT * FROM users WHERE id = ?', [1])
    })

    test('should return null when no result found', async () => {
      mockAdapter.getOne.mockResolvedValue(null)

      const result = await wrapper.getOne('SELECT * FROM users WHERE id = ?', [999])

      expect(result).toBeNull()
    })

    test('should fallback to query method when adapter.getOne not available', async () => {
      delete mockAdapter.getOne
      wrapper = new DbWrapper(mockConnection, mockAdapter)

      const mockResult = [{ id: 1, name: 'John' }]
      mockAdapter.executeQuery.mockResolvedValue(mockResult)

      const result = await wrapper.getOne('SELECT * FROM users WHERE id = ?', [1])

      expect(result).toEqual({ id: 1, name: 'John' })
    })
  })

  describe('get', () => {
    test('should call adapter.get when available', async () => {
      const mockUsers = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      mockAdapter.get.mockResolvedValue(mockUsers)

      const result = await wrapper.get('SELECT * FROM users', [])

      expect(result).toEqual(mockUsers)
      expect(mockAdapter.get).toHaveBeenCalledWith(mockConnection, 'SELECT * FROM users', [])
    })

    test('should return empty array when no results', async () => {
      mockAdapter.get.mockResolvedValue([])

      const result = await wrapper.get('SELECT * FROM users WHERE id = ?', [999])

      expect(result).toEqual([])
    })

    test('should fallback to query method when adapter.get not available', async () => {
      delete mockAdapter.get
      wrapper = new DbWrapper(mockConnection, mockAdapter)

      const mockResult = [{ id: 1, name: 'John' }]
      mockAdapter.executeQuery.mockResolvedValue(mockResult)

      const result = await wrapper.get('SELECT * FROM users', [])

      expect(result).toEqual(mockResult)
    })
  })

  describe('exec', () => {
    test('should call adapter.exec when available', async () => {
      const mockResult = { insertId: 123, affectedRows: 1 }
      mockAdapter.exec.mockResolvedValue(mockResult)

      const result = await wrapper.exec('INSERT INTO users (name) VALUES (?)', ['John'])

      expect(result).toEqual(mockResult)
      expect(mockAdapter.exec).toHaveBeenCalledWith(mockConnection, 'INSERT INTO users (name) VALUES (?)', ['John'])
    })

    test('should fallback to query method when adapter.exec not available', async () => {
      delete mockAdapter.exec
      wrapper = new DbWrapper(mockConnection, mockAdapter)

      const mockResult = { insertId: 123, affectedRows: 1 }
      mockAdapter.executeQuery.mockResolvedValue(mockResult)

      const result = await wrapper.exec('INSERT INTO users (name) VALUES (?)', ['John'])

      expect(result).toEqual(mockResult)
    })
  })
})

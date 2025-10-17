const { wrap } = require('../src/index')

describe('wrap function', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  test('should throw error when connection is not provided', () => {
    expect(() => {
      wrap(null, 'mysql')
    }).toThrow('Connection object is required')
  })

  test('should throw error when adapter type is not provided', () => {
    const mockConnection = {}

    expect(() => {
      wrap(mockConnection, null)
    }).toThrow('Adapter type is required')
  })

  test('should throw error for unsupported adapter type', () => {
    const mockConnection = {}

    expect(() => {
      wrap(mockConnection, 'mongodb')
    }).toThrow(/Adapter "mongodb" not found or not implemented/)
  })

  test('should create wrapper with mysql adapter', () => {
    const mockConnection = {
      execute: jest.fn()
    }

    const db = wrap(mockConnection, 'mysql')

    expect(db).toBeDefined()
    expect(typeof db.query).toBe('function')
    expect(typeof db.getOne).toBe('function')
    expect(typeof db.get).toBe('function')
    expect(typeof db.exec).toBe('function')
  })

  test('should expose transaction methods if adapter provides them', () => {
    const mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    }

    const db = wrap(mockConnection, 'mysql')

    expect(typeof db.beginTransaction).toBe('function')
    expect(typeof db.commit).toBe('function')
    expect(typeof db.rollback).toBe('function')
    expect(typeof db.transaction).toBe('function')
  })

  test('should expose connection and adapter for advanced usage', () => {
    const mockConnection = {
      execute: jest.fn()
    }

    const db = wrap(mockConnection, 'mysql')

    expect(db._connection).toBe(mockConnection)
    expect(db._adapter).toBeDefined()
    expect(db._wrapper).toBeDefined()
  })

  test('should bind methods correctly to wrapper instance', async () => {
    const mockConnection = {
      execute: jest.fn().mockResolvedValue([[{ id: 1 }], []])
    }

    const db = wrap(mockConnection, 'mysql')

    // Test that methods are bound correctly
    const queryFn = db.query
    await queryFn('SELECT * FROM users WHERE id = ?', [1])

    expect(mockConnection.execute).toHaveBeenCalled()
  })
})

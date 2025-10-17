const mysqlAdapter = require('../../src/adapters/mysql')

describe('MySQL Adapter', () => {
  let mockConnection

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    }
  })

  describe('executeQuery', () => {
    test('should execute query and return rows', async () => {
      const mockRows = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      const mockFields = []
      mockConnection.execute.mockResolvedValue([mockRows, mockFields])

      const result = await mysqlAdapter.executeQuery(
        mockConnection,
        'SELECT * FROM users',
        []
      )

      expect(result).toEqual(mockRows)
      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT * FROM users', [])
    })

    test('should pass parameters to execute', async () => {
      mockConnection.execute.mockResolvedValue([[{ id: 1 }], []])

      await mysqlAdapter.executeQuery(
        mockConnection,
        'SELECT * FROM users WHERE id = ?',
        [1]
      )

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1]
      )
    })

    test('should throw error when query fails', async () => {
      const dbError = new Error('Query failed')
      mockConnection.execute.mockRejectedValue(dbError)

      await expect(
        mysqlAdapter.executeQuery(mockConnection, 'INVALID SQL', [])
      ).rejects.toThrow('Query failed')
    })
  })

  describe('getOne', () => {
    test('should return first row when results exist', async () => {
      const mockRows = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      mockConnection.execute.mockResolvedValue([mockRows, []])

      const result = await mysqlAdapter.getOne(
        mockConnection,
        'SELECT * FROM users',
        []
      )

      expect(result).toEqual({ id: 1, name: 'John' })
    })

    test('should return null when no results', async () => {
      mockConnection.execute.mockResolvedValue([[], []])

      const result = await mysqlAdapter.getOne(
        mockConnection,
        'SELECT * FROM users WHERE id = ?',
        [999]
      )

      expect(result).toBeNull()
    })

    test('should handle non-array results', async () => {
      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }, []])

      const result = await mysqlAdapter.getOne(
        mockConnection,
        'SELECT * FROM users',
        []
      )

      expect(result).toBeNull()
    })

    test('should throw error when query fails', async () => {
      const dbError = new Error('Query failed')
      mockConnection.execute.mockRejectedValue(dbError)

      await expect(
        mysqlAdapter.getOne(mockConnection, 'INVALID SQL', [])
      ).rejects.toThrow('Query failed')
    })
  })

  describe('get', () => {
    test('should return all rows', async () => {
      const mockRows = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      mockConnection.execute.mockResolvedValue([mockRows, []])

      const result = await mysqlAdapter.get(
        mockConnection,
        'SELECT * FROM users',
        []
      )

      expect(result).toEqual(mockRows)
      expect(result).toHaveLength(2)
    })

    test('should return empty array when no results', async () => {
      mockConnection.execute.mockResolvedValue([[], []])

      const result = await mysqlAdapter.get(
        mockConnection,
        'SELECT * FROM users WHERE id = ?',
        [999]
      )

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })

    test('should handle non-array results', async () => {
      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }, []])

      const result = await mysqlAdapter.get(
        mockConnection,
        'SELECT * FROM users',
        []
      )

      expect(result).toEqual([])
    })

    test('should throw error when query fails', async () => {
      const dbError = new Error('Query failed')
      mockConnection.execute.mockRejectedValue(dbError)

      await expect(
        mysqlAdapter.get(mockConnection, 'INVALID SQL', [])
      ).rejects.toThrow('Query failed')
    })
  })

  describe('exec', () => {
    test('should execute INSERT and return result', async () => {
      const mockResult = {
        insertId: 123,
        affectedRows: 1,
        changedRows: 0,
        warningCount: 0
      }
      mockConnection.execute.mockResolvedValue([mockResult, []])

      const result = await mysqlAdapter.exec(
        mockConnection,
        'INSERT INTO users (name) VALUES (?)',
        ['John']
      )

      expect(result).toEqual(mockResult)
      expect(result.insertId).toBe(123)
      expect(result.affectedRows).toBe(1)
    })

    test('should execute UPDATE and return result', async () => {
      const mockResult = {
        insertId: 0,
        affectedRows: 1,
        changedRows: 1,
        warningCount: 0
      }
      mockConnection.execute.mockResolvedValue([mockResult, []])

      const result = await mysqlAdapter.exec(
        mockConnection,
        'UPDATE users SET name = ? WHERE id = ?',
        ['Jane', 1]
      )

      expect(result.affectedRows).toBe(1)
      expect(result.changedRows).toBe(1)
    })

    test('should execute DELETE and return result', async () => {
      const mockResult = {
        insertId: 0,
        affectedRows: 1,
        changedRows: 0,
        warningCount: 0
      }
      mockConnection.execute.mockResolvedValue([mockResult, []])

      const result = await mysqlAdapter.exec(
        mockConnection,
        'DELETE FROM users WHERE id = ?',
        [1]
      )

      expect(result.affectedRows).toBe(1)
    })

    test('should throw error when query fails', async () => {
      const dbError = new Error('Query failed')
      mockConnection.execute.mockRejectedValue(dbError)

      await expect(
        mysqlAdapter.exec(mockConnection, 'INVALID SQL', [])
      ).rejects.toThrow('Query failed')
    })
  })

  describe('Transaction methods', () => {
    test('beginTransaction should call connection.beginTransaction', async () => {
      mockConnection.beginTransaction.mockResolvedValue()

      await mysqlAdapter.beginTransaction(mockConnection)

      expect(mockConnection.beginTransaction).toHaveBeenCalled()
    })

    test('commit should call connection.commit', async () => {
      mockConnection.commit.mockResolvedValue()

      await mysqlAdapter.commit(mockConnection)

      expect(mockConnection.commit).toHaveBeenCalled()
    })

    test('rollback should call connection.rollback', async () => {
      mockConnection.rollback.mockResolvedValue()

      await mysqlAdapter.rollback(mockConnection)

      expect(mockConnection.rollback).toHaveBeenCalled()
    })

    test('transaction should commit on success', async () => {
      mockConnection.beginTransaction.mockResolvedValue()
      mockConnection.commit.mockResolvedValue()

      const callback = jest.fn().mockResolvedValue('success')

      const result = await mysqlAdapter.transaction(mockConnection, callback)

      expect(mockConnection.beginTransaction).toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(mockConnection.commit).toHaveBeenCalled()
      expect(mockConnection.rollback).not.toHaveBeenCalled()
      expect(result).toBe('success')
    })

    test('transaction should rollback on error', async () => {
      mockConnection.beginTransaction.mockResolvedValue()
      mockConnection.rollback.mockResolvedValue()

      const testError = new Error('Transaction failed')
      const callback = jest.fn().mockRejectedValue(testError)

      await expect(
        mysqlAdapter.transaction(mockConnection, callback)
      ).rejects.toThrow('Transaction failed')

      expect(mockConnection.beginTransaction).toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(mockConnection.rollback).toHaveBeenCalled()
      expect(mockConnection.commit).not.toHaveBeenCalled()
    })

    test('transaction should handle rollback errors gracefully', async () => {
      mockConnection.beginTransaction.mockResolvedValue()
      mockConnection.rollback.mockRejectedValue(new Error('Rollback failed'))

      const testError = new Error('Transaction failed')
      const callback = jest.fn().mockRejectedValue(testError)

      await expect(
        mysqlAdapter.transaction(mockConnection, callback)
      ).rejects.toThrow('Rollback failed')
    })
  })
})

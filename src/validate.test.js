/**
 * @file Test Validate Module
 * @see module:validate
 */

import assert from 'node:assert'

import { describe, expect, jest, it } from '@jest/globals'

import {
  runValidators,
  validateDirectory,
  validateFirebasercProjects,
  validateParsedFirebaserc,
  validateProjectKey,
  validateProjectName,
} from './validate.js'

/**
 * @section Tests
 * @desc Declare the test suite for the `validate` module.
 */

/**
 * @test validate
 * @desc Assert the `validate` module has a consistent API.
 */
describe('validate', () => {
  describe('runValidators', () => {
    it('should validate using an array of functions', async () => {
      // Arrange
      const functions = [
        jest.fn().mockReturnValue({ error: false }),
        jest.fn().mockReturnValue({ error: false }),
      ]
      const initialValue = { error: false, message: 'The object is valid.' }
      const expected = { error: false, message: 'The object is valid.' }

      // Run
      const result = runValidators(functions, initialValue)

      // Assert
      expect(functions[0]).toHaveBeenCalledTimes(1)
      expect(functions[1]).toHaveBeenCalledTimes(1)

      assert.deepStrictEqual(result, expected)
    })

    it('should return the first error message it encounters', async () => {
      // Arrange
      const functions = [
        jest.fn().mockReturnValue({ error: false }),
        jest.fn().mockReturnValue({ error: true, message: 'An error occurred.' }),
        jest.fn().mockReturnValue({ error: true, message: 'Another error occurred.' }),
      ]
      const initialValue = { error: false, message: 'The object is valid.' }
      const expected = { error: true, message: 'An error occurred.' }

      // Run
      const result = runValidators(functions, initialValue)

      // Assert
      expect(functions[0]).toHaveBeenCalledTimes(1)
      expect(functions[1]).toHaveBeenCalledTimes(1)
      expect(functions[2]).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test validateDirectory
   * @desc Assert the `validateDirectory` validates the directory path.
   */
  describe('validateDirectory', () => {
    it('should validate the value of the directory option', () => {
      // Arrange
      const directory = './example/dir'
      const expected = {
        error: false,
        message: 'The directory option is valid.',
      }

      // Run
      const result = validateDirectory(directory)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error message if given a falsey directory option', () => {
      // Arrange
      const directory = undefined
      const expected = {
        error: true,
        message: `The directory option is required.`,
      }

      // Run
      const result = validateDirectory(directory)

      // Assert
      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test validateProjectKey
   * @desc Assert the `validateProjectKey` validates the project key.
   */
  describe('validateProjectKey', () => {
    it('should validate the value of the projectKey option', () => {
      // Arrange
      const projectKey = 'default'
      const expected = {
        error: false,
        message: 'The projectKey option is valid.',
      }

      // Run
      const result = validateProjectKey(projectKey)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if given a falsey projectKey option', () => {
      // Arrange
      const projectKey = undefined
      const expected = {
        error: true,
        message: `The projectKey option is required.`,
      }

      // Run
      const result = validateProjectKey(projectKey)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if given an empty string projectKey option', () => {
      // Arrange
      const projectKey = ''
      const expected = {
        error: true,
        message: `The projectKey option is required.`,
      }

      // Run
      const result = validateProjectKey(projectKey)

      // Assert
      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test validateProjectName
   * @desc Assert the `validateProjectName` validates the project name.
   */
  describe('validateProjectName', () => {
    it('should validate the value of the project name', () => {
      // Arrange
      const projectName = 'default'
      const expected = {
        error: false,
        message: 'The project name is valid.',
      }

      // Run
      const result = validateProjectName(projectName)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if given a falsey project name', () => {
      // Arrange
      const projectName = undefined
      const expected = {
        error: true,
        message: `The project name is invalid.`,
      }

      // Run
      const result = validateProjectName(projectName)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if given an empty string as project name', () => {
      // Arrange
      const projectName = ''
      const expected = {
        error: true,
        message: `The project name is invalid.`,
      }

      // Run
      const result = validateProjectName(projectName)

      // Assert
      assert.deepStrictEqual(result, expected)
    })
  })

  describe('validateParsedFirebaserc', () => {
    it('should validate the .firebaserc file', () => {
      // Arrange
      const firebaserc = {
        projects: {
          default: 'default',
        },
      }
      const expected = {
        error: false,
        message: 'The .firebaserc file contains a valid object.',
      }

      // Run
      const result = validateParsedFirebaserc(firebaserc)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if the .firebaserc file is an empty object', () => {
      // Arrange
      const firebaserc = {}
      const expected = {
        error: true,
        message: 'The .firebaserc file contains an empty or invalid object.',
      }

      // Run
      const result = validateParsedFirebaserc(firebaserc)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if the .firebaserc file is not an object', () => {
      // Arrange
      const firebaserc = []
      const expected = {
        error: true,
        message: 'The .firebaserc file contains an empty or invalid object.',
      }

      // Run
      const result = validateParsedFirebaserc(firebaserc)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if the .firebaserc file is not defined', () => {
      // Arrange
      const firebaserc = undefined
      const expected = {
        error: true,
        message: 'The .firebaserc file contains an empty or invalid object.',
      }

      // Run
      const result = validateParsedFirebaserc(firebaserc)

      // Assert
      assert.deepStrictEqual(result, expected)
    })
  })

  describe('validateFirebasercProjects', () => {
    it('should validate a projects object', () => {
      // Arrange
      const projects = {
        default: 'default',
      }
      const expected = {
        error: false,
        message: 'The .firebaserc file contains a valid "projects" property.',
      }

      // Run
      const result = validateFirebasercProjects(projects)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if the projects property is a string', () => {
      // Arrange
      const projects = ''
      const expected = {
        error: true,
        message: 'The .firebaserc file does not contain a valid "projects" property.',
      }

      // Run
      const result = validateFirebasercProjects(projects)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if the projects property is an array', () => {
      // Arrange
      const projects = []
      const expected = {
        error: true,
        message: 'The .firebaserc file does not contain a valid "projects" property.',
      }

      // Run
      const result = validateFirebasercProjects(projects)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if the projects property is undefined', () => {
      // Arrange
      const projects = undefined
      const expected = {
        error: true,
        message: 'The .firebaserc file does not contain a valid "projects" property.',
      }

      // Run
      const result = validateFirebasercProjects(projects)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    it('should return an error response if the projects property is null', () => {
      // Arrange
      const projects = null
      const expected = {
        error: true,
        message: 'The .firebaserc file does not contain a valid "projects" property.',
      }

      // Run
      const result = validateFirebasercProjects(projects)

      // Assert
      assert.deepStrictEqual(result, expected)
    })
  })
})

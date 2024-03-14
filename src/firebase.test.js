/**
 * @file Test Firebase Module
 * @see module:firebase
 */

import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

import { generateRandomValue } from '../jest.utils.js'

import { logger } from './logger.js'
import { validate } from './validate.js'

import {
  configureFirebase,
  configureFirebaseLogin,
  configureFirebaseWebFrameworks,
  configureFirebaseProject,
  findProjectNameByKey,
  findProjectsInFirebaserc,
  firebase,
  getFirebaserc,
  getFirebasercProjects,
  getProjectName,
  parseFirebaserc,
  parseJson,
  readFirebaserc,
  readProjectNameFromFirebaserc,
  validateFirebaserc,
  validateOptions,
} from './firebase.js'

/**
 * @section Tests
 * @desc Declare the test suite for the `firebase` module.
 */

/**
 * @test firebase
 * @desc Assert the `firebase` module's API.
 */
describe('firebase', () => {
  /**
   * @test validateFirebaserc
   * @desc Assert the `validateFirebaserc` function validates the .firebaserc file
   * and its properties.
   * @see validateFirebaserc
   * @mock validateFirebasercProjects
   * @mock validateParsedFirebaserc
   */
  describe('validateFirebaserc', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should handle a valid .firebaserc file', () => {
      // Arrange
      const firebaserc = {
        projects: {
          default: 'project-name',
        },
      }

      const expected = { error: false, message: `The .firebaserc JSON is valid.` }

      jest.spyOn(validate, 'validateParsedFirebaserc').mockImplementation(() => {
        return {
          error: false,
          message: `The .firebaserc JSON is valid.`,
        }
      })

      jest.spyOn(validate, 'validateFirebasercProjects').mockImplementation(() => {
        return {
          error: false,
          message: `The .firebaserc JSON is valid.`,
        }
      })

      const validators = [
        jest.fn(() => validate.validateParsedFirebaserc(firebaserc)),
        jest.fn(() => validate.validateFirebasercProjects(firebaserc.projects)),
      ]

      // Run
      const result = validateFirebaserc(firebaserc, validators)

      // Assert
      expect(validators[0]).toHaveBeenCalledTimes(1)
      expect(validators[1]).toHaveBeenCalledTimes(1)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an invalid .firebaserc file', () => {
      // Arrange
      const firebaserc = {}

      const expected = {
        error: true,
        message: `The .firebaserc file contains an empty or invalid object.`,
      }

      jest.spyOn(validate, 'validateParsedFirebaserc').mockImplementation(() => {
        return {
          error: true,
          message: `The .firebaserc file contains an empty or invalid object.`,
        }
      })

      jest.spyOn(validate, 'validateFirebasercProjects').mockImplementation(() => {
        return { error: false }
      })

      const validators = [
        jest.fn(() => validate.validateParsedFirebaserc(firebaserc)),
        jest.fn(() => validate.validateFirebasercProjects(firebaserc.projects)),
      ]

      // Run
      const result = validateFirebaserc(firebaserc, validators)

      // Assert
      expect(validators[0]).toHaveBeenCalledTimes(1)
      expect(validators[1]).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })
  })

  describe('validateOptions', () => {
    it('should validate the options', () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const expected = { error: false, message: `The options are valid.` }

      jest.spyOn(validate, 'validateDirectory').mockImplementation(() => {
        return { error: false, message: `The directory option is valid.` }
      })

      jest.spyOn(validate, 'validateProjectKey').mockImplementation(() => {
        return { error: false, message: `The projectKey option is valid.` }
      })

      const validators = [
        jest.fn(() => validate.validateDirectory(options.directory)),
        jest.fn(() => validate.validateProjectKey(options.projectKey)),
      ]

      // Run
      const result = validateOptions(options, validators)

      // Assert
      expect(validators[0]).toHaveBeenCalledTimes(1)
      expect(validators[1]).toHaveBeenCalledTimes(1)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an invalid directory option', () => {
      // Arrange
      const options = {
        directory: '',
        projectKey: 'default',
      }

      const expected = { error: true, message: `The directory option is required.` }

      jest.spyOn(validate, 'validateDirectory').mockImplementation(() => {
        return { error: true, message: `The directory option is required.` }
      })

      jest.spyOn(validate, 'validateProjectKey').mockImplementation(() => {
        return { error: false, message: `The projectKey option is valid.` }
      })

      const validators = [
        jest.fn(() => validate.validateDirectory(options.directory)),
        jest.fn(() => validate.validateProjectKey(options.projectKey)),
      ]

      // Run
      const result = validateOptions(options, validators)

      // Assert
      expect(validators[0]).toHaveBeenCalledTimes(1)
      expect(validators[1]).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an invalid projectKey option', () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: '',
      }

      const expected = { error: true, message: `The projectKey option is required.` }

      jest.spyOn(validate, 'validateDirectory').mockImplementation(() => {
        return { error: false, message: `The directory option is valid.` }
      })

      jest.spyOn(validate, 'validateProjectKey').mockImplementation(() => {
        return { error: true, message: `The projectKey option is required.` }
      })

      const validators = [
        jest.fn(() => validate.validateDirectory(options.directory)),
        jest.fn(() => validate.validateProjectKey(options.projectKey)),
      ]

      // Run
      const result = validateOptions(options, validators)

      // Assert
      expect(validators[0]).toHaveBeenCalledTimes(1)
      expect(validators[1]).toHaveBeenCalledTimes(1)

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test readFirebaserc
   * @desc Assert the `readFirebaserc` function reads the .firebaserc file
   * at the given directory.
   * @see readFirebaserc
   * @mock fs/promises.readFile
   * @mock path.join
   */
  describe('readFirebaserc', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    /**
     * @assert The `readFirebaserc` function reads the .firebaserc file.
     */
    it('should read the .firebaserc file', async () => {
      // Arrange
      const expected = {
        error: false,
        firebaserc: '{ "projects": { "default": "project-name" } }',
      }

      const directory = './example/dir'

      jest.spyOn(path, 'join').mockReturnValue('example/dir/.firebaserc')

      jest.spyOn(fs, 'readFile').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve('{ "projects": { "default": "project-name" } }')
        })
      })

      // Run
      const result = await readFirebaserc(directory)

      // Assert
      assert.deepStrictEqual(result, expected)

      expect(path.join).toHaveBeenCalledWith(directory, '.firebaserc')
      expect(fs.readFile).toHaveBeenCalledWith('example/dir/.firebaserc', 'utf8')
    })

    /**
     * @assert The `readFirebaserc` function handles an error from
     * the `path.join` dependency.
     */
    it('should handle a .firebaserc path error', async () => {
      // Arrange
      const expected = {
        error: true,
        message: 'The .firebaserc file path could not be resolved.',
      }

      const directory = undefined

      jest.spyOn(path, 'join').mockImplementation(() => {
        throw new Error('The .firebaserc file path could not be resolved.')
      })

      jest.spyOn(fs, 'readFile').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve('{ "projects": { "default": "project-name" } }')
        })
      })

      // Run
      const promise = readFirebaserc(directory)
      const result = await promise

      // Assert
      assert.deepStrictEqual(result, expected)

      expect(path.join).toHaveBeenCalledWith(directory, '.firebaserc')
      expect(fs.readFile).not.toHaveBeenCalled()
    })

    /**
     * @assert The `readFirebaserc` function handles an error from
     * the `fs/promises.readFile` dependency.
     */
    it('should handle a .firebaserc read error', async () => {
      // Arrange
      const expected = {
        error: true,
        message: 'The .firebaserc file could not be read.',
      }

      const directory = './example/dir'

      jest.spyOn(path, 'join').mockReturnValue('example/dir/.firebaserc')

      jest.spyOn(fs, 'readFile').mockImplementation(() => {
        return new Promise((resolve, reject) => {
          reject(new Error('The .firebaserc file could not be read.'))
        })
      })

      // Run
      const result = await readFirebaserc(directory)

      // Assert
      assert.deepStrictEqual(result, expected)

      expect(path.join).toHaveBeenCalledWith(directory, '.firebaserc')
      expect(fs.readFile).toHaveBeenCalledWith('example/dir/.firebaserc', 'utf8')
    })
  })

  /**
   * @test parseJson
   * @desc Assert the `parseJson` function parses a JSON string.
   * @see parseJson
   * @mock JSON.parse
   */
  describe('parseJson', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    /**
     * @assert The `parseJson` function parses a JSON string. It returns
     * the parsed JSON alongside an error property set to `false`.
     */
    it('should parse a JSON string', async () => {
      // Arrange
      const jsonString = '{ "projects": { "default": "project-name" } }'
      const expected = {
        error: false,
        json: { projects: { default: 'project-name' } },
      }

      jest.spyOn(JSON, 'parse').mockReturnValue({ projects: { default: 'project-name' } })

      // Run
      const result = await parseJson(jsonString)

      // Assert
      assert.deepStrictEqual(result, expected)
    })

    /**
     * @assert The `parseJson` function handles an error from the
     * `JSON.parse` dependency.
     */
    it('should handle a JSON parsing error', async () => {
      // Arrange
      const jsonString = 'invalid-json'
      const expected = {
        error: true,
        message: 'Unexpected token i in JSON at position 0',
      }

      jest.spyOn(JSON, 'parse').mockImplementation(() => {
        throw new Error('Unexpected token i in JSON at position 0')
      })

      // Run
      const result = await parseJson(jsonString)

      // Assert
      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test parseFirebaserc
   * @desc Assert the `parseFirebaserc` function parses the .firebaserc file.
   * @see parseFirebaserc
   * @mock parseJson
   */
  describe('parseFirebaserc', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    /**
     * @assert The `parseFirebaserc` function parses the .firebaserc file.
     * It returns the parsed JSON alongside an error property set to `false`.
     */
    it('should parse the .firebaserc file', async () => {
      // Arrange
      const firebaserc = '{ "projects": { "default": "project-name" } }'
      const expected = {
        error: false,
        firebaserc: { projects: { default: 'project-name' } },
      }

      jest.spyOn(firebase, 'parseJson').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          json: { projects: { default: 'project-name' } },
        })
      })

      // Run
      const result = await parseFirebaserc(firebaserc, firebase.parseJson)

      // Assert
      assert.deepStrictEqual(result, expected)

      expect(firebase.parseJson).toHaveBeenCalledWith(firebaserc)
    })

    /**
     * @assert The `parseFirebaserc` function handles an error from the
     * `parseJson` dependency.
     */
    it('should handle a .firebaserc parsing error', async () => {
      // Arrange
      const firebaserc = 'invalid-json'
      const expected = {
        error: true,
        message: 'The .firebaserc file could not be parsed.',
      }

      jest.spyOn(firebase, 'parseJson').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: 'The .firebaserc file could not be parsed.',
        })
      })

      // Run
      const result = await parseFirebaserc(firebaserc, firebase.parseJson)

      // Assert
      assert.deepStrictEqual(result, expected)

      expect(firebase.parseJson).toHaveBeenCalledWith(firebaserc)
    })
  })

  /**
   * @test getFirebaserc
   * @desc Assert the `getFirebaserc` function reads and parses the
   * firebaserc file.
   * @see getFirebaserc
   * @mock readFirebaserc
   * @mock parseFirebaserc
   */
  describe('getFirebaserc', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should retrieve the .firebaserc file', async () => {
      // Arrange
      const directory = './example/dir'
      const firebaserc = {
        projects: {
          default: 'project-name',
        },
      }

      const firebasercFileContent = JSON.stringify(firebaserc, null, 2)

      const expected = {
        error: false,
        firebaserc,
      }

      jest.spyOn(firebase, 'readFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          firebaserc: firebasercFileContent,
        })
      })

      jest.spyOn(firebase, 'parseFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          firebaserc,
        })
      })

      const reader = firebase.readFirebaserc
      const parser = firebase.parseFirebaserc

      // Run
      const result = await getFirebaserc(directory, parser, reader)

      // Assert
      expect(firebase.readFirebaserc).toHaveBeenCalledWith(directory)
      expect(firebase.parseFirebaserc).toHaveBeenCalledWith(firebasercFileContent)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a .firebaserc retrieval error', async () => {
      // Arrange
      const directory = './example/dir'
      const expected = {
        error: true,
        message: `The .firebaserc file could not be retrieved.`,
      }

      jest.spyOn(firebase, 'readFirebaserc').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            error: true,
            message: `The .firebaserc file could not be retrieved.`,
          })
        })
      })

      jest.spyOn(firebase, 'parseFirebaserc').mockImplementation((arg) => arg)

      const parser = firebase.parseFirebaserc
      const reader = firebase.readFirebaserc

      // Run
      const result = await getFirebaserc(directory, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledWith(directory)
      expect(parser).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a .firebaserc parsing error', async () => {
      // Arrange
      const directory = './example/dir'
      const expected = {
        error: true,
        message: `The .firebaserc file could not be parsed.`,
      }
      const firebaserc = JSON.stringify({
        projects: {
          default: 'project-name',
        },
      })

      jest.spyOn(firebase, 'readFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          firebaserc,
        })
      })

      jest.spyOn(firebase, 'parseFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: 'The .firebaserc file could not be parsed.',
        })
      })

      const parser = firebase.parseFirebaserc
      const reader = firebase.readFirebaserc

      // Run
      const result = await getFirebaserc(directory, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledTimes(1)
      expect(reader).toHaveBeenCalledWith(directory)

      expect(parser).toHaveBeenCalledTimes(1)
      expect(parser).toHaveBeenCalledWith(firebaserc)

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test findProjectsInFirebaserc
   * @desc Assert the `findProjectsInFirebaserc` function retrieves
   * the Firebase projects from the .firebaserc file's parsed JSON.
   * @see findProjectsInFirebaserc
   * @requires validateParsedFirebaserc
   * @requires validateFirebasercProjects
   */
  describe('findProjectsInFirebaserc', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should retrieve the Firebase projects', async () => {
      // Arrange
      const projectKey = 'default'
      const projectName = 'project-name'
      const projects = { [projectKey]: projectName }
      const firebaserc = { projects }

      const expected = {
        error: false,
        projects,
      }

      jest.spyOn(firebase, 'validateFirebaserc').mockImplementation(() => {
        return { error: false, projects }
      })

      const validator = firebase.validateFirebaserc

      // Run
      const result = findProjectsInFirebaserc(firebaserc, validator)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(firebaserc)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an invalid .firebaserc file', async () => {
      // Arrange
      const projectKey = 'default'
      const projectName = 'project-name'
      const projects = { [projectKey]: projectName }
      const firebaserc = { projects }

      const expected = {
        error: true,
        message: `The .firebaserc file could not be validated.`,
      }

      jest.spyOn(firebase, 'validateFirebaserc').mockImplementation(() => {
        return { error: true, message: `The .firebaserc file could not be validated.` }
      })

      const validator = firebase.validateFirebaserc

      // Run
      const result = findProjectsInFirebaserc(firebaserc, validator)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(firebaserc)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an invalid project name', async () => {
      // Arrange
      const projectKey = 'default'
      const projectName = ''
      const projects = { [projectKey]: projectName }
      const firebaserc = { projects }

      const expected = {
        error: true,
        message: `The project name at the "${projectKey}" key is empty or could not be retrieved.`,
      }

      jest.spyOn(firebase, 'validateFirebaserc').mockImplementation(() => {
        return { error: true, message: `The project name at the "${projectKey}" key is empty or could not be retrieved.` }
      })

      const validator = firebase.validateFirebaserc

      // Run
      const result = findProjectsInFirebaserc(firebaserc, validator)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(firebaserc)

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test findProjectNameByKey
   * @desc Assert the `findProjectNameByKey` function retrieves the Firebase
   * project name from the .firebaserc file.
   * @see findProjectNameByKey
   * @mock validateProjectName
   */
  describe('findProjectNameByKey', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should retrieve the Firebase project name', async () => {
      // Arrange
      const projectKey = 'default'
      const projectName = 'project-name'
      const projects = { [projectKey]: projectName }

      const expected = {
        error: false,
        projectName,
      }

      jest.spyOn(validate, 'validateProjectName').mockImplementation(() => {
        return { error: false, projectName }
      })

      const validator = validate.validateProjectName

      // Run
      const result = findProjectNameByKey(projectKey, projects, validator)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(projectName)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an empty project name string', async () => {
      // Arrange
      const projectKey = 'default'
      const projectName = ''
      const projects = { [projectKey]: projectName }

      const expected = {
        error: true,
        message: `The project name at the "${projectKey}" key is empty or could not be retrieved.`,
      }

      jest.spyOn(validate, 'validateProjectName').mockImplementation(() => {
        return { error: true, message: `The project name at the "${projectKey}" key is empty or could not be retrieved.` }
      })

      const validator = validate.validateProjectName

      // Run
      const result = findProjectNameByKey(projectKey, projects, validator)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(projectName)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a null project name', async () => {
      // Arrange
      const projectKey = 'default'
      const projectName = null
      const projects = { [projectKey]: projectName }

      const expected = {
        error: true,
        message: `The project name at the "${projectKey}" key is empty or could not be retrieved.`,
      }

      jest.spyOn(validate, 'validateProjectName').mockImplementation(() => {
        return { error: true, message: `The project name at the "${projectKey}" key is empty or could not be retrieved.` }
      })

      const validator = validate.validateProjectName

      // Run
      const result = findProjectNameByKey(projectKey, projects, validator)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(projectName)

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test getFirebasercProjects
   * @desc Assert the `getFirebasercProjects` function retrieves the Firebase
   * projects from the .firebaserc file.
   * @see getFirebasercProjects
   * @mock getFirebaserc
   * @mock findProjectsInFirebaserc
   */
  describe('getFirebasercProjects', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should retrieve the Firebase projects', async () => {
      // Arrange
      const directory = './example/dir'
      const expected = {
        error: false,
        projects: { default: 'project-name' },
      }

      jest.spyOn(firebase, 'getFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          firebaserc: { projects: { default: 'project-name' } },
        })
      })

      jest.spyOn(firebase, 'findProjectsInFirebaserc').mockImplementation(() => {
        return {
          error: false,
          projects: { default: 'project-name' },
        }
      })

      const parser = firebase.findProjectsInFirebaserc
      const reader = firebase.getFirebaserc

      // Run
      const result = await getFirebasercProjects(directory, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledWith(directory)
      expect(parser).toHaveBeenCalledWith({ projects: { default: 'project-name' } })

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase projects retrieval error', async () => {
      // Arrange
      const directory = './example/dir'
      const expected = {
        error: true,
        message: `The .firebaserc file contains an empty or invalid object.`,
      }

      jest.spyOn(firebase, 'parseFirebaserc').mockImplementation(() => {
        return {
          error: false,
          projects: { default: 'project-name' },
        }
      })

      jest.spyOn(firebase, 'findProjectsInFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: `The .firebaserc file contains an empty or invalid object.`,
        })
      })

      const parser = firebase.parseFirebaserc
      const reader = firebase.findProjectsInFirebaserc

      // Run
      const result = await getFirebasercProjects(directory, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledWith(directory)
      expect(parser).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test readProjectNameFromFirebaserc
   * @desc Assert the `readProjectNameFromFirebaserc` function retrieves the Firebase
   * project name from the .firebaserc file.
   * @see readProjectNameFromFirebaserc
   * @mock getFirebasercProjects
   * @mock findProjectNameByKey
   */
  describe('readProjectNameFromFirebaserc', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should retrieve the Firebase project name', async () => {
      // Arrange
      const directory = './example/dir'
      const projectKey = 'default'
      const projectName = 'project-name'
      const projects = { [projectKey]: projectName }

      const options = {
        directory,
        projectKey,
      }

      const expected = {
        error: false,
        projectName,
      }

      jest.spyOn(firebase, 'getFirebasercProjects').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projects,
        })
      })

      jest.spyOn(firebase, 'findProjectNameByKey').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projectName,
        })
      })

      const parser = firebase.findProjectNameByKey
      const reader = firebase.getFirebasercProjects

      // Run
      const result = await readProjectNameFromFirebaserc(options, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledWith(directory)
      expect(parser).toHaveBeenCalledWith(projectKey, projects)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase projects retrieval error', async () => {
      // Arrange
      const directory = './example/dir'
      const projectKey = 'default'
      const projectName = 'project-name'

      const options = {
        directory,
        projectKey,
      }

      const expected = {
        error: true,
        message: `The .firebaserc file contains an empty or invalid object.`,
      }

      jest.spyOn(firebase, 'getFirebasercProjects').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: `The .firebaserc file contains an empty or invalid object.`,
        })
      })

      jest.spyOn(firebase, 'findProjectNameByKey').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projectName,
        })
      })

      const parser = firebase.findProjectNameByKey
      const reader = firebase.getFirebasercProjects

      // Run
      const result = await readProjectNameFromFirebaserc(options, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledWith(directory)
      expect(parser).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase project name retrieval error', async () => {
      // Arrange
      const directory = './example/dir'
      const projectKey = 'something-nonexistent'
      const projectName = 'project-name'
      const projects = { [projectKey]: projectName }

      const options = {
        directory,
        projectKey,
      }

      const expected = {
        error: true,
        message: `The project name could not be retrieved.`,
      }

      jest.spyOn(firebase, 'getFirebasercProjects').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projects,
        })
      })

      jest.spyOn(firebase, 'findProjectNameByKey').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: `The project name could not be retrieved.`,
        })
      })

      const parser = firebase.findProjectNameByKey
      const reader = firebase.getFirebasercProjects

      // Run
      const result = await readProjectNameFromFirebaserc(options, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledWith(directory)
      expect(parser).toHaveBeenCalledWith(projectKey, projects)

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test getProjectName
   * @desc Assert the `getProjectName` function retrieves the
   * Firebase project name from the .firebaserc file.
   * @see getProjectName
   * @mock validateOptions
   * @mock readProjectNameFromFirebaserc
   */
  describe('getProjectName', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should retrieve the Firebase project name', async () => {
      // Arrange
      const directory = './example/dir'
      const projectKey = 'default'
      const projectName = 'project-name'

      const options = {
        directory,
        projectKey,
      }

      const expected = {
        error: false,
        projectName,
      }

      jest.spyOn(firebase, 'validateOptions').mockImplementation(() => {
        return { error: false, message: `The options are valid.` }
      })

      jest.spyOn(firebase, 'readProjectNameFromFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projectName,
        })
      })

      const validator = firebase.validateOptions
      const runner = firebase.readProjectNameFromFirebaserc

      // Run
      const result = await getProjectName(options, validator, runner)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(options)

      expect(runner).toHaveBeenCalledTimes(1)
      expect(runner).toHaveBeenCalledWith(options)

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an invalid options object', async () => {
      // Arrange
      const directory = './example/dir'
      const projectKey = 'default'
      const projectName = 'project-name'

      const options = {
        directory,
        projectKey,
      }

      const expected = {
        error: true,
        message: `The options are invalid.`,
      }

      jest.spyOn(firebase, 'validateOptions').mockImplementation(() => {
        return { error: true, message: `The options are invalid.` }
      })

      jest.spyOn(firebase, 'readProjectNameFromFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projectName,
        })
      })

      const validator = firebase.validateOptions
      const runner = firebase.readProjectNameFromFirebaserc

      // Run
      const result = await getProjectName(options, validator, runner)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(options)

      expect(runner).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase project name retrieval error', async () => {
      // Arrange
      const directory = './example/dir'
      const projectKey = 'default'

      const options = {
        directory,
        projectKey,
      }

      const expected = {
        error: true,
        message: `The project name could not be retrieved.`,
      }

      jest.spyOn(firebase, 'validateOptions').mockImplementation(() => {
        return { error: false, message: `The options are valid.` }
      })

      jest.spyOn(firebase, 'readProjectNameFromFirebaserc').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: `The project name could not be retrieved.`,
        })
      })

      const validator = firebase.validateOptions
      const runner = firebase.readProjectNameFromFirebaserc

      // Run
      const result = await getProjectName(options, validator, runner)

      // Assert
      expect(validator).toHaveBeenCalledTimes(1)
      expect(validator).toHaveBeenCalledWith(options)

      expect(runner).toHaveBeenCalledTimes(1)
      expect(runner).toHaveBeenCalledWith(options)

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test configureFirebaseProject
   * @desc Assert the `configureFirebaseProject` function configures a Firebase project.
   */
  describe('configureFirebaseProject', () => {
    it('should configure a Firebase project', async () => {
      // Arrange
      const projectKey = generateRandomValue()
      const options = { projectKey }
      const executable = jest.fn().mockReturnValue(Promise.resolve({ code: 0 }))

      const expected = {
        error: false,
        message: `The Firebase project has been configured.`,
      }

      // Run
      const result = await configureFirebaseProject(options, executable)

      // Assert
      assert.deepStrictEqual(result, expected)

      expect(executable).toHaveBeenCalledWith(`firebase use ${projectKey}`)
    })

    it('should handle a Firebase project configuration error', async () => {
      // Arrange
      const projectKey = generateRandomValue()
      const options = { projectKey }
      const executable = jest.fn().mockReturnValue(Promise.resolve({ code: 1 }))

      const expected = {
        error: true,
        message: `The Firebase project could not be configured.`,
      }

      // Run
      const result = await configureFirebaseProject(options, executable)

      // Assert
      assert.deepStrictEqual(result, expected)

      expect(executable).toHaveBeenCalledWith(`firebase use ${projectKey}`)
    })
  })

  /**
   * @test configureFirebaseWebFrameworks
   * @desc Assert the `configureFirebaseWebFrameworks` function
   * configures Firebase web frameworks.
   */
  describe('configureFirebaseWebFrameworks', () => {
    it('should configure Firebase web frameworks', async () => {
      // Arrange
      const options = {}
      const executable = jest.fn().mockReturnValue(Promise.resolve({
        code: 0,
        stdout: '',
        stderr: '',
      }))

      const expected = {
        error: false,
        message: `The Firebase webframeworks feature has been enabled.`,
      }

      // Run
      const result = await configureFirebaseWebFrameworks(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledWith('firebase experiments:enable webframeworks')

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase web frameworks configuration error', async () => {
      // Arrange
      const options = {}
      const executable = jest.fn().mockReturnValue(Promise.resolve({
        code: 1,
        stdout: '',
        stderr: '',
      }))

      const expected = {
        error: true,
        message: `The Firebase webframeworks feature could not be enabled.`,
      }

      // Run
      const result = await configureFirebaseWebFrameworks(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledWith('firebase experiments:enable webframeworks')

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test configureFirebaseLogin
   * @desc Assert the `configureFirebaseLogin` function uses Firebase CLI
   * to log in a user.
   */
  describe('configureFirebaseLogin', () => {
    it('should execute the Firebase login command', async () => {
      // Arrange
      const options = { debug: false }
      const executable = jest.fn().mockReturnValue(Promise.resolve({
        email: 'test@example.com',
      }))

      const expected = {
        email: 'test@example.com',
        error: false,
        message: `The user has been logged in to Firebase.`,
      }

      jest.spyOn(logger, 'error').mockImplementation((command) => command)

      // Run
      const result = await configureFirebaseLogin(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(logger.error).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase login error', async () => {
      // Arrange
      const options = { debug: false }
      const executable = jest.fn().mockReturnValue(
        new Promise((resolve, reject) => reject((new Error('Fake Error from Firebase')))),
      )

      const expected = {
        error: true,
        message: `Fake Error from Firebase`,
      }

      jest.spyOn(logger, 'error').mockImplementation((command) => command)

      // Run
      const result = await configureFirebaseLogin(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(logger.error).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase login error without a message', async () => {
      // Arrange
      const options = { debug: false }
      const executable = jest.fn().mockReturnValue(
        new Promise((resolve, reject) => reject((new Error()))),
      )

      const expected = {
        error: true,
        message: `The Firebase login attempt failed.`,
      }

      jest.spyOn(logger, 'error').mockImplementation((command) => command)

      // Run
      const result = await configureFirebaseLogin(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(logger.error).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })

    it('should handle a Firebase login error with a debug option', async () => {
      // Arrange
      const options = { debug: true }
      const message = 'Fake Error from Firebase'
      const executable = jest.fn().mockRejectedValue(new Error(message))

      const expected = {
        error: true,
        message,
      }

      jest.spyOn(logger, 'error').mockImplementation((command) => command)

      // Run
      const result = await configureFirebaseLogin(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith([message])

      assert.deepStrictEqual(result, expected)
    })

    it('should handle an empty email in the Firebase response', async () => {
      // Arrange
      const options = { debug: false }
      const executable = jest.fn().mockReturnValue(Promise.resolve({
        email: '',
      }))

      const expected = {
        error: true,
        message: `The Firebase login attempt failed.`,
      }

      jest.spyOn(logger, 'error').mockImplementation((command) => command)

      // Run
      const result = await configureFirebaseLogin(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(logger.error).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })
  })

  /**
   * @test configureFirebase
   * @desc Assert the `configureFirebase` function configures Firebase.
   */
  describe('configureFirebase', () => {
    it('should configure Firebase', async () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const steps = [
        jest.fn(() => ({
          error: false,
          message: `The Firebase project has been configured.`,
        })),
        jest.fn(() => ({
          error: false,
          message: `The Firebase webframeworks feature has been enabled.`,
        })),
        jest.fn(() => ({
          error: false,
          message: `The Firebase user has been signed in.`,
        })),
      ]

      const expected = {
        error: false,
        message: `Firebase has been configured.`,
      }

      // Run
      const result = await configureFirebase(options, steps)

      // Assert
      expect(steps[0]).toHaveBeenCalledTimes(1)
      expect(steps[1]).toHaveBeenCalledTimes(1)
      expect(steps[2]).toHaveBeenCalledTimes(1)

      assert.deepStrictEqual(result, expected)
    })

    it('should return the first error response it encounters', async () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const steps = [
        jest.fn(() => Promise.resolve({
          error: false,
          message: `The Firebase project has been configured.`,
        })),
        jest.fn(() => Promise.resolve({
          error: true,
          message: `The Firebase webframeworks feature could not be enabled.`,
        })),
        jest.fn(() => Promise.resolve({
          error: true,
          message: `The Firebase user could not be signed in.`,
        })),
      ]

      const expected = {
        error: true,
        message: `The Firebase webframeworks feature could not be enabled.`,
      }

      // Run
      const result = await configureFirebase(options, steps)

      // Assert
      expect(steps[0]).toHaveBeenCalledTimes(1)
      expect(steps[1]).toHaveBeenCalledTimes(1)
      expect(steps[2]).not.toHaveBeenCalled()

      assert.deepStrictEqual(result, expected)
    })
  })
})

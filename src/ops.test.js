/**
 * @file Test Ops Module
 * @see module:ops
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import shelljs from 'shelljs'

import { generateRandomValue } from '../jest.utils.js'

import { firebase } from './firebase.js'
import { gcloud } from './gcloud.js'

import { logger } from './logger.js'
import {
  configureFontAwesome,
  configureNodeEnv,
  makeFontAwesomeConfigurationSteps,
  obtainFontAwesomeToken,
  setFontAwesomeRegistry,
  setFontAwesomeToken,
  stepConfigureFirebaseProject,
  stepConfigureFontAwesome,
  stepConfigureGoogle,
  stepConfigureNodeEnv,
} from './ops.js'

/**
 * @section Mocks and Stubs
 */

const INITIAL_PROCESS_ENV = process.env
const INITIAL_NODE_ENV = process.env.NODE_ENV

jest.spyOn(logger, 'error').mockImplementation((command) => command)
jest.spyOn(logger, 'info').mockImplementation((command) => command)
jest.spyOn(logger, 'log').mockImplementation((command) => command)
jest.spyOn(logger, 'print').mockImplementation((command) => command)
jest.spyOn(logger, 'success').mockImplementation((command) => command)
jest.spyOn(logger, 'warn').mockImplementation((command) => command)

/**
 * @section Tests
 * @desc Declare the test suite for the `ops` module.
 */

/**
 * @test ops
 * @desc Assert the `ops` module can set up a development environment.
 */
describe('ops', () => {
  /**
   * @test configureNodeEnv
   * @desc Assert the `configureNodeEnv` function sets the `NODE_ENV`
   * environment variable.
   * @see configureNodeEnv
   * @mock shelljs.env.NODE_ENV
   * @beforeEach Reset the module registry to clear the cache, thereby
   * isolating each test.
   * @beforeEach Set the `NODE_ENV` environment variable for the shelljs
   * environment. Use a random value to ensure the test is not dependent on
   * the initial value of the `NODE_ENV` environment variable.
   * @afterEach Restore the `NODE_ENV` environment variable for the shelljs
   * environment.
   */
  describe('configureNodeEnv', () => {
    const randomValue = generateRandomValue()
    const newValue = `__${INITIAL_NODE_ENV}__${randomValue}__`

    beforeEach(() => {
      jest.resetModules()

      shelljs.env = {
        NODE_ENV: randomValue,
      }
    })

    afterEach(() => {
      shelljs.env = INITIAL_PROCESS_ENV
    })

    /**
     * @assert The `configureNodeEnv` function uses the `shelljs` module
     * to set the `NODE_ENV` environment variable to the given value.
     */
    it('should configure NODE_ENV', () => {
      // Arrange
      const expected = { error: false }

      // Run
      const result = configureNodeEnv(newValue)
      const configuredNodeEnv = shelljs.env.NODE_ENV

      // Assert
      expect(result).toEqual(expected)
      expect(INITIAL_NODE_ENV).not.toEqual(configuredNodeEnv)
      expect(configuredNodeEnv).toEqual(newValue)
    })
  })

  describe('obtainFontAwesomeToken', () => {
    it('should obtain a token from the environment', async () => {
      // Arrange
      const token = generateRandomValue()
      const prompter = jest.fn().mockReturnValue(Promise.resolve({ token }))

      const expected = {
        error: false,
        message: `The Font Awesome token has been obtained.`,
        token,
      }

      // Run
      const result = await obtainFontAwesomeToken(prompter)

      // Assert
      expect(prompter).toHaveBeenCalledTimes(1)
      expect(prompter).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          default: expect.any(String),
          message: expect.stringContaining('Enter the Font Awesome token.'),
          type: 'input',
        }),
      ]))

      expect(result).toEqual(expected)
    })

    it('should return an error response if prompter throws error', async () => {
      // Arrange
      const prompter = jest.fn().mockRejectedValue(new Error('Test error'))

      const expected = {
        error: true,
        message: 'Test error',
        token: undefined,
      }

      // Run
      const result = await obtainFontAwesomeToken(prompter)

      // Assert
      expect(prompter).toHaveBeenCalledTimes(1)
      expect(prompter).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          default: expect.any(String),
          message: expect.stringMatching('Enter the Font Awesome token.'),
          name: expect.stringMatching('token'),
          type: expect.stringMatching('input'),
        }),
      ]))

      expect(result).toEqual(expected)
    })

    it('should return an error response if prompter returns no token', async () => {
      // Arrange
      const prompter = jest.fn().mockReturnValue(Promise.resolve({ token: '' }))

      const expected = {
        error: true,
        message: 'The Font Awesome token is invalid.',
        token: '',
      }

      // Run
      const result = await obtainFontAwesomeToken(prompter)

      // Assert
      expect(prompter).toHaveBeenCalledTimes(1)
      expect(prompter).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          default: expect.any(String),
          message: expect.stringContaining('Enter the Font Awesome token.'),
          type: 'input',
        }),
      ]))

      expect(result).toEqual(expected)
    })
  })

  describe('setFontAwesomeRegistry', () => {
    it('should set the Font Awesome registry', async () => {
      // Arrange
      const executable = jest.fn().mockReturnValue(Promise.resolve({ code: 0 }))

      const expected = {
        error: false,
        message: `The Font Awesome registry has been set.`,
      }

      // Run
      const result = await setFontAwesomeRegistry(executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(expect.stringMatching('npm config set "@fortawesome:registry" '))

      expect(result).toEqual(expected)
    })

    it('should return an error response if executable throws error', async () => {
      // Arrange
      const executable = jest.fn().mockReturnValue(Promise.resolve({ code: 1 }))

      const expected = {
        error: true,
        message: 'Failed to set the Font Awesome registry.',
      }

      // Run
      const result = await setFontAwesomeRegistry(executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(expect.stringMatching('npm config set "@fortawesome:registry" '))

      expect(result).toEqual(expected)
    })
  })

  describe('setFontAwesomeToken', () => {
    it('should set the Font Awesome token', async () => {
      // Arrange
      const token = 'test-token'
      const executable = jest.fn().mockReturnValue(Promise.resolve({ code: 0 }))

      const expected = {
        error: false,
        message: `The Font Awesome token has been set.`,
      }

      // Run
      const result = await setFontAwesomeToken({ token }, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(expect.stringMatching('npm config set "//npm.fontawesome.com/:_authToken" '))

      expect(result).toEqual(expected)
    })

    it('should return an error response if executable returns error code', async () => {
      // Arrange
      const token = 'test-token'
      const executable = jest.fn().mockReturnValue(Promise.resolve({ code: 1 }))

      const expected = {
        error: true,
        message: 'Failed to set the Font Awesome token.',
      }

      // Run
      const result = await setFontAwesomeToken({ token }, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(expect.stringMatching('npm config set "//npm.fontawesome.com/:_authToken" '))

      expect(result).toEqual(expected)
    })
  })

  describe('makeFontAwesomeConfigurationSteps', () => {
    it('should return a list of configuration steps', () => {
      // Arrange
      const token = 'test-token'
      const prompter = jest.fn().mockReturnValue(Promise.resolve({ token }))
      const executable = jest.fn().mockReturnValue(Promise.resolve({ code: 0 }))

      // Run
      const result = makeFontAwesomeConfigurationSteps(prompter, executable)

      // Assert
      expect(result[0]).toBeInstanceOf(Function)
      expect(result[1]).toBeInstanceOf(Function)
      expect(result[2]).toBeInstanceOf(Function)

      expect(result[0].name).toEqual('$obtainFontAwesomeToken')
      expect(result[1].name).toEqual('$setFontAwesomeRegistry')
      expect(result[2].name).toEqual('$setFontAwesomeToken')

      expect(result[0](prompter) instanceof Promise).toBeTruthy()
      expect(result[1](executable) instanceof Promise).toBeTruthy()
      expect(result[2]({ token }, executable) instanceof Promise).toBeTruthy()
    })
  })

  describe('configureFontAwesome', () => {
    it('should configure Font Awesome using given steps', async () => {
      // Arrange
      const token = 'test-token'
      const step1Result = {
        error: false,
        message: 'The Font Awesome token has been obtained.',
        token,
      }
      const step2Result = {
        error: false,
        message: 'The Font Awesome registry has been set.',
        token,
      }
      const step3Result = {
        error: false,
        message: 'The Font Awesome token has been set.',
        token,
      }
      const finalState = {
        error: false,
        message: 'Font Awesome is ready.',
        token,
      }

      const steps = [
        jest.fn().mockReturnValue(Promise.resolve(step1Result)),
        jest.fn().mockReturnValue(Promise.resolve(step2Result)),
        jest.fn().mockReturnValue(Promise.resolve(step3Result)),
      ]

      // Run
      const result = await configureFontAwesome(steps)

      // Assert calls.
      expect(steps[0]).toHaveBeenCalledTimes(1)
      expect(steps[1]).toHaveBeenCalledTimes(1)
      expect(steps[2]).toHaveBeenCalledTimes(1)

      /**
       * @assert Assert the `state` is passed through each
       * configuration step.
       *
       * State is altered by the time assertions are made,
       * so we test the state has been passed to each step using
       * the final value of `state`, which is not necessarily the
       * value at the time the step was called. This is a matter
       * we can address in a future version of the test suite.
       */
      expect(steps[0]).toHaveBeenCalledWith(finalState)
      expect(steps[1]).toHaveBeenCalledWith(finalState)
      expect(steps[2]).toHaveBeenCalledWith(finalState)

      // Assert final result.
      expect(result).toEqual(finalState)
    })

    it('should return the first error response it encounters', async () => {
      // Arrange
      const initialValue = {
        error: false,
        message: 'Font Awesome is ready.',
      }
      const step1Result = {
        error: true,
        message: 'Test error',
        token: undefined,
      }
      const step2Result = {
        error: true,
        message: 'Another error',
        token: undefined,
      }

      const steps = [
        jest.fn().mockReturnValue(Promise.resolve(initialValue)),
        jest.fn().mockReturnValue(Promise.resolve(step1Result)),
        jest.fn().mockReturnValue(Promise.resolve(step2Result)),
      ]

      // Run
      const result = await configureFontAwesome(steps)

      // Assert calls.
      expect(steps[0]).toHaveBeenCalledTimes(1)
      expect(steps[1]).toHaveBeenCalledTimes(1)
      expect(steps[2]).not.toHaveBeenCalled()

      // Assert state is passed through each step.
      expect(steps[0]).toHaveBeenCalledWith({
        error: false,
        message: 'Font Awesome is ready.',
      })

      expect(steps[1]).toHaveBeenCalledWith({
        error: false,
        message: 'Font Awesome is ready.',
      })

      // Assert final result.
      expect(result).toEqual(step1Result)
    })
  })

  describe('stepConfigureNodeEnv', () => {
    it('should execute and log a configuration step', async () => {
      // Arrange
      const env = 'test-value'
      const options = { env }
      const executable = jest.fn().mockReturnValue({ error: false })

      const expected = { error: false }

      // Run
      const result = await stepConfigureNodeEnv(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(env)

      expect(logger.log).toHaveBeenCalledTimes(1)
      expect(logger.success).toHaveBeenCalledTimes(1)

      expect(result).toEqual(expected)
    })

    it('should log an error if the configuration step fails', async () => {
      // Arrange
      const env = 'test-value'
      const options = { env }
      const executable = jest.fn().mockReturnValue({ error: true })

      // Run
      const result = await stepConfigureNodeEnv(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(env)

      expect(logger.log).not.toHaveBeenCalled()
      expect(logger.success).not.toHaveBeenCalled()

      expect(result).toEqual({
        error: true,
        messages: expect.arrayContaining([
          expect.stringContaining(`Failed to set the NODE_ENV environment variable to ${env}.`),
        ]),
      })
    })
  })

  /**
   * @test stepConfigureGoogle
   * @desc Assert the `stepConfigureGoogle` function configures gcloud
   * to use the desired Google Cloud project from the .firebaserc file
   * in the relevant directory.
   * @see stepConfigureGoogle
   * @mock firebase.getProjectName
   * @mock gcloud.configureGoogleProject
   */
  describe('stepConfigureGoogle', () => {
    it('should set the project on the gcloud CLI', async () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const expected = {
        error: false,
        message: 'The Google Cloud project has been set.',
      }

      jest.spyOn(firebase, 'getProjectName').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projectName: 'project-name',
        })
      })

      jest.spyOn(gcloud, 'configureGoogleProject').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          message: 'The Google Cloud project has been set.',
        })
      })

      const reader = firebase.getProjectName
      const parser = gcloud.configureGoogleProject

      // Run
      const result = await stepConfigureGoogle(options, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledTimes(1)
      expect(parser).toHaveBeenCalledTimes(1)

      expect(reader).toHaveBeenCalledWith(options)
      expect(parser).toHaveBeenCalledWith('project-name')

      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.success).toHaveBeenCalledTimes(1)

      expect(result).toEqual(expected)
    })

    it('should return an error response if the reader returns an error response', async () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const expected = {
        error: true,
        message: 'Test error',
        messages: expect.arrayContaining([
          expect.stringMatching('Failed to configure Google Cloud'),
        ]),
      }

      jest.spyOn(firebase, 'getProjectName').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: 'Test error',
        })
      })

      jest.spyOn(gcloud, 'configureGoogleProject').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          message: 'The Google Cloud project has been set.',
        })
      })

      const reader = firebase.getProjectName
      const parser = gcloud.configureGoogleProject

      // Run
      const result = await stepConfigureGoogle(options, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledTimes(1)
      expect(parser).not.toHaveBeenCalled()

      expect(reader).toHaveBeenCalledWith(options)

      expect(result).toEqual(expected)
    })

    it('should return an error response if the parser returns an error response', async () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const expected = {
        error: true,
        message: 'Test error',
        messages: expect.arrayContaining([
          expect.stringMatching('Failed to configure Google Cloud'),
        ]),
      }

      jest.spyOn(firebase, 'getProjectName').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          projectName: 'project-name',
        })
      })

      jest.spyOn(gcloud, 'configureGoogleProject').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: 'Test error',
        })
      })

      const reader = firebase.getProjectName
      const parser = gcloud.configureGoogleProject

      // Run
      const result = await stepConfigureGoogle(options, parser, reader)

      // Assert
      expect(reader).toHaveBeenCalledTimes(1)
      expect(parser).toHaveBeenCalledTimes(1)

      expect(reader).toHaveBeenCalledWith(options)
      expect(parser).toHaveBeenCalledWith('project-name')

      expect(result).toEqual(expected)
    })
  })

  describe('stepConfigureFirebaseProject', () => {
    it('should set the project using the Firebase CLI', async () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const expected = {
        error: false,
        message: 'The Firebase project has been set.',
      }

      jest.spyOn(firebase, 'configureFirebaseProject').mockImplementation(() => {
        return Promise.resolve({
          error: false,
          message: 'The Firebase project has been set.',
        })
      })

      const executable = firebase.configureFirebaseProject

      // Run
      const result = await stepConfigureFirebaseProject(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(options)

      expect(logger.success).toHaveBeenCalledTimes(1)

      expect(result).toEqual(expected)
    })

    it('should return an error response if the executable returns an error response', async () => {
      // Arrange
      const options = {
        directory: './example/dir',
        projectKey: 'default',
      }

      const expected = {
        error: true,
        message: 'Test error',
        messages: expect.arrayContaining([
          expect.stringMatching('Failed to configure Firebase'),
        ]),
      }

      jest.spyOn(firebase, 'configureFirebaseProject').mockImplementation(() => {
        return Promise.resolve({
          error: true,
          message: 'Test error',
        })
      })

      const executable = firebase.configureFirebaseProject

      // Run
      const result = await stepConfigureFirebaseProject(options, executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith(options)

      expect(result).toEqual(expected)
    })
  })

  describe('stepConfigureFontAwesome', () => {
    it('should configure Font Awesome using given setter', async () => {
      // Arrange
      const executable = jest.fn().mockReturnValue(Promise.resolve({
        error: false,
        message: 'Font Awesome is ready.',
      }))

      const expected = {
        error: false,
        message: 'Font Awesome is ready.',
      }

      // Run
      const result = await stepConfigureFontAwesome(executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith()

      expect(result).toEqual(expected)
    })

    it('should return an error response if the executable returns an error response', async () => {
      // Arrange
      const executable = jest.fn().mockReturnValue(Promise.resolve({
        error: true,
        message: 'Test error',
      }))

      const expected = {
        error: true,
        message: 'Test error',
        messages: expect.arrayContaining([
          expect.stringMatching('Failed to configure Font Awesome.'),
        ]),
      }

      // Run
      const result = await stepConfigureFontAwesome(executable)

      // Assert
      expect(executable).toHaveBeenCalledTimes(1)
      expect(executable).toHaveBeenCalledWith()

      expect(result).toEqual(expected)
    })
  })

  describe('stepFinish', () => {
  })

  describe('runSteps', () => {
  })

  describe('setup', () => {
  })
})

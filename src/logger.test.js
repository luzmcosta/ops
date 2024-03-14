/**
 * @file Test Logger Module
 * @see module:logger
 *
 * @example {@lang shell}
 * node --test logger.test.js
 */

import chalk from 'chalk'
import assert from 'node:assert'

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'

import { mockConsoleMethods, restoreConsoleMethods } from '../jest.utils.js'

import { getStyler, logger, print, styleOutput } from './logger.js'

/**
 * @test logger
 * @desc Test the logger module's API and functionality.'
 */
describe('logger', () => {
  const testMessage = 'Hello, world!'
  const expectedText = 'Hello, world!'

  const consoleMock = {}
  const consoleMethods = ['log', 'error', 'info', 'warn']

  beforeEach(() => {
    mockConsoleMethods(consoleMock, consoleMethods)
  })

  afterEach(() => {
    restoreConsoleMethods(consoleMock, consoleMethods)
  })

  describe('getStyler', () => {
    it('should return the styler function for the error style name', () => {
      // Arrange
      const input = 'some random error text'
      const expected = chalk.hex('d82727')(input)

      // Run
      const actual = getStyler('error')(input)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the styler function for the info style name', () => {
      // Arrange
      const input = 'some random info text'
      const expected = chalk.hex('0094ff')(input)

      // Run
      const actual = getStyler('info')(input)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the styler function for the log style name', () => {
      // Arrange
      const input = 'some random info text'
      const expected = chalk.reset(input)

      // Run
      const actual = getStyler('log')(input)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the styler function for the reset style name', () => {
      // Arrange
      const input = 'some random info text'
      const expected = chalk.reset(input)

      // Run
      const actual = getStyler('reset')(input)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the styler function for the success style name', () => {
      // Arrange
      const input = 'some random info text'
      const expected = chalk.hex('5bcf70')(input)

      // Run
      const actual = getStyler('success')(input)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the styler function for the warn style name', () => {
      // Arrange
      const input = 'some random info text'
      const expected = chalk.hex('ffef7f')(input)

      // Run
      const actual = getStyler('warn')(input)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })

    it('should return the log styler function for an unknown style name', () => {
      // Arrange
      const input = 'some random info text'
      const expected = chalk.reset(input)

      // Run
      const actual = getStyler('unknown')(input)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('styleOutput', () => {
    it('should style a string message with the given style', () => {
      // Arrange
      const message = 'some random info text'
      const expected = chalk.hex('0094ff')(message)

      // Run
      const actual = styleOutput('info', message)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })

    it('should style an array of messages with the given style', () => {
      // Arrange
      const firstMessage = 'some text\n'
      const remainingMessages = [
        'some more text\n',
        'and even more text.',
      ]
      const messages = [
        firstMessage,
        ...remainingMessages,
      ]
      const expectedHeaderText = chalk.hex('0094ff')(firstMessage)
      const expected = `${expectedHeaderText}${chalk.reset(remainingMessages.join(''))}`

      // Run
      const actual = styleOutput('info', messages)

      // Assert
      assert.deepStrictEqual(actual, expected)
    })
  })

  describe('print', () => {
    it('should print a string message', () => {
      // Arrange
      const expected = expectedText
      const expectedStyler = chalk.reset
      const expectedOutput = `${expectedStyler(expected)}`

      // Run
      const output = print('log', testMessage)

      // Assert
      assert.strictEqual(expectedOutput, output)

      expect(consoleMock.log).toHaveBeenCalledTimes(1)
      expect(consoleMock.log).toHaveBeenCalledWith(expectedOutput)
    })

    it('should print an array of messages', () => {
      // Arrange
      const expected = [expectedText]
      const expectedStyler = chalk.reset
      const expectedOutput = `${expectedStyler(expected)}`

      // Run
      const output = print('log', [testMessage])

      // Assert
      assert.strictEqual(expectedOutput, output)

      expect(consoleMock.log).toHaveBeenCalledTimes(1)
      expect(consoleMock.log).toHaveBeenCalledWith(expectedOutput)
    })
  })

  /**
   * @test logger.log
   * @desc Test the log method's ability to log messages of type string and array.
   */
  describe('log', () => {
    it('should log a string message', () => {
      // Arrange
      const logStyler = chalk.reset
      const expectedOutput = `${logStyler(expectedText)}`

      // Run
      const actualOutput = logger.log(testMessage)

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.log).toHaveBeenCalledTimes(1)
      expect(consoleMock.log).toHaveBeenCalledWith(expectedOutput)
    })

    it('should log an array of messages', () => {
      // Arrange
      const logStyler = chalk.reset
      const expectedOutput = `${logStyler([expectedText])}`

      // Run
      const actualOutput = logger.log([testMessage])

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.log).toHaveBeenCalledTimes(1)
      expect(consoleMock.log).toHaveBeenCalledWith(expectedOutput)
    })
  })

  /**
   * @test logger.error
   * @desc Test the error method's ability to log messages of type string and array.
   */
  describe('error', () => {
    it('should log a string error message', () => {
      // Arrange
      const errorStyler = chalk.hex('d82727')
      const expectedOutput = `${errorStyler(expectedText)}`

      // Run
      const actualOutput = logger.error(testMessage)

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.error).toHaveBeenCalledTimes(1)
      expect(consoleMock.error).toHaveBeenCalledWith(expectedOutput)
    })

    it('should log an array of error messages', () => {
      // Arrange
      const errorStyler = chalk.hex('d82727')
      const expectedOutput = `${errorStyler([expectedText])}`

      // Run
      const actualOutput = logger.error([testMessage])

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.error).toHaveBeenCalledTimes(1)
      expect(consoleMock.error).toHaveBeenCalledWith(expectedOutput)
    })
  })

  /**
   * @test logger.info
   * @desc Test the info method's ability to log messages of type string and array.
   */
  describe('info', () => {
    it('should log a string info message', () => {
      // Arrange
      const infoStyler = chalk.hex('0094ff')
      const expectedOutput = `${infoStyler(expectedText)}`

      // Run
      const actualOutput = logger.info(testMessage)

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.info).toHaveBeenCalledTimes(1)
      expect(consoleMock.info).toHaveBeenCalledWith(expectedOutput)
    })

    it('should log an array of info messages', () => {
      // Arrange
      const infoStyler = chalk.hex('0094ff')
      const expectedOutput = `${infoStyler([expectedText])}`

      // Run
      const actualOutput = logger.info([testMessage])

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.info).toHaveBeenCalledTimes(1)
      expect(consoleMock.info).toHaveBeenCalledWith(expectedOutput)
    })
  })

  /**
   * @test logger.success
   * @desc Test the success method's ability to log messages of type string and array.
   */
  describe('success', () => {
    it('should log a string success message', () => {
      // Arrange
      const successStyler = chalk.hex('5bcf70')
      const expectedOutput = `${successStyler(expectedText)}`

      // Run
      const actualOutput = logger.success(testMessage)

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.log).toHaveBeenCalledTimes(1)
      expect(consoleMock.log).toHaveBeenCalledWith(expectedOutput)
    })

    it('should log an array of success messages', () => {
      // Arrange
      const successStyler = chalk.hex('5bcf70')
      const expectedOutput = `${successStyler([expectedText])}`

      // Run
      const actualOutput = logger.success([testMessage])

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.log).toHaveBeenCalledTimes(1)
      expect(consoleMock.log).toHaveBeenCalledWith(expectedOutput)
    })
  })

  /**
   * @test logger.warn
   * @desc Test the warn method's ability to log messages of type string and array.
   */
  describe('warn', () => {
    it('should log a string warn message', () => {
      // Arrange
      const warnStyler = chalk.hex('ffef7f')
      const expectedOutput = `${warnStyler(expectedText)}`

      // Run
      const actualOutput = logger.warn(testMessage)

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.warn).toHaveBeenCalledTimes(1)
      expect(consoleMock.warn).toHaveBeenCalledWith(expectedOutput)
    })

    it('should log an array of warn messages', () => {
      // Arrange
      const warnStyler = chalk.hex('ffef7f')
      const expectedOutput = `${warnStyler([expectedText])}`

      // Run
      const actualOutput = logger.warn([testMessage])

      // Assert
      assert.strictEqual(expectedOutput, actualOutput)

      expect(consoleMock.warn).toHaveBeenCalledTimes(1)
      expect(consoleMock.warn).toHaveBeenCalledWith(expectedOutput)
    })
  })
})

/**
 * @file Test Logger Module
 * @see module:logger
 *
 * @example {@lang shell}
 * node --test logger.test.js
 */

import assert from 'node:assert'
import { describe, it } from 'node:test'

import chalk from 'chalk'

import { logger } from './logger.js'

/**
 * @test {logger}
 * @desc Test the logger module's API and functionality.'
 */
describe('logger', () => {
  const testMessage = 'Hello, world!'
  const expectedText = 'Hello, world!'

  /**
   * @test {logger.log}
   * @desc Test the log method's ability to log messages of type string and array.
   */
  describe('log', () => {
    it('should log a string message', () => {
      // Arrange
      const logStyler = chalk.reset
      const logExpected = `${logStyler(expectedText)}`

      // Run
      const logOutput = logger.log(testMessage)

      // Assert
      assert.strictEqual(logExpected, logOutput)
    })

    it('should log an array of messages', () => {
      // Arrange
      const logStyler = chalk.reset
      const logExpected = `${logStyler([expectedText])}`

      // Run
      const logOutput = logger.log([testMessage])

      // Assert
      assert.strictEqual(logExpected, logOutput)
    })
  })

  /**
   * @test {logger.error}
   * @desc Test the error method's ability to log messages of type string and array.
   */
  describe('error', () => {
    it('should log a string error message', () => {
      // Arrange
      const errorStyler = chalk.hex('d82727')
      const errorExpected = `${errorStyler(expectedText)}`

      // Run
      const errorOutput = logger.error(testMessage)

      // Assert
      assert.strictEqual(errorExpected, errorOutput)
    })

    it('should log an array of error messages', () => {
      // Arrange
      const errorStyler = chalk.hex('d82727')
      const errorExpected = `${errorStyler([expectedText])}`

      // Run
      const errorOutput = logger.error([testMessage])

      // Assert
      assert.strictEqual(errorExpected, errorOutput)
    })
  })

  /**
   * @test {logger.info}
   * @desc Test the info method's ability to log messages of type string and array.
   */
  describe('info', () => {
    it('should log a string info message', () => {
      // Arrange
      const infoStyler = chalk.hex('0094ff')
      const infoExpected = `${infoStyler(expectedText)}`

      // Run
      const infoOutput = logger.info(testMessage)

      // Assert
      assert.strictEqual(infoExpected, infoOutput)
    })

    it('should log an array of info messages', () => {
      // Arrange
      const infoStyler = chalk.hex('0094ff')
      const infoExpected = `${infoStyler([expectedText])}`

      // Run
      const infoOutput = logger.info([testMessage])

      // Assert
      assert.strictEqual(infoExpected, infoOutput)
    })
  })

  /**
   * @test {logger.success}
   * @desc Test the success method's ability to log messages of type string and array.
   */
  describe('success', () => {
    it('should log a string success message', () => {
      // Arrange
      const successStyler = chalk.hex('5bcf70')
      const successExpected = `${successStyler(expectedText)}`

      // Run
      const successOutput = logger.success(testMessage)

      // Assert
      assert.strictEqual(successExpected, successOutput)
    })

    it('should log an array of success messages', () => {
      // Arrange
      const successStyler = chalk.hex('5bcf70')
      const successExpected = `${successStyler([expectedText])}`

      // Run
      const successOutput = logger.success([testMessage])

      // Assert
      assert.strictEqual(successExpected, successOutput)
    })
  })

  /**
   * @test {logger.warn}
   * @desc Test the warn method's ability to log messages of type string and array.
   */
  describe('warn', () => {
    it('should log a string warn message', () => {
      // Arrange
      const warnStyler = chalk.hex('ffef7f')
      const warnExpected = `${warnStyler(expectedText)}`

      // Run
      const warnOutput = logger.warn(testMessage)

      // Assert
      assert.strictEqual(warnExpected, warnOutput)
    })

    it('should log an array of warn messages', () => {
      // Arrange
      const warnStyler = chalk.hex('ffef7f')
      const warnExpected = `${warnStyler([expectedText])}`

      // Run
      const warnOutput = logger.warn([testMessage])

      // Assert
      assert.strictEqual(warnExpected, warnOutput)
    })
  })
})

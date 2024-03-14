/**
 * @file Test Exec Module
 * @see module:exec
 */

import { EventEmitter } from 'node:events'

import { describe, expect, it, jest } from '@jest/globals'

import { generateRandomValue } from '../jest.utils.js'
import { exec } from './exec.js'
import { logger } from './logger.js'

/**
 * @section Mocks and Stubs
 */

// Mock child_process.spawn
jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}))

jest.spyOn(logger, 'error').mockImplementation((command) => command)
jest.spyOn(logger, 'info').mockImplementation((command) => command)
jest.spyOn(logger, 'log').mockImplementation((command) => command)
jest.spyOn(logger, 'print').mockImplementation((command) => command)
jest.spyOn(logger, 'success').mockImplementation((command) => command)
jest.spyOn(logger, 'warn').mockImplementation((command) => command)

/**
 * @section Tests
 */

/**
 * @test exec
 * @desc Assert the `exec` module can execute a command.
 * @see module:exec
 * @mock node:child_process.spawn
 * @mock module:logger
 */

describe('exec', () => {
  /**
   * @assert Assert the `exec` module can execute a valid command, meanwhile
   * suppressing debug information when the `debug` option is disabled.
   */
  it('should execute a valid command and resolve on exit', async () => {
    const randomValue = generateRandomValue()
    const command = `echo "${randomValue}"`

    const process = new EventEmitter()

    process.stdout = new EventEmitter()
    process.stderr = new EventEmitter()

    const options = {
      debug: false,
      spawn: jest.fn().mockImplementation(() => {
        return process
      }),
    }

    const promise = exec(command, options)

    process.stdout.emit('data', `${randomValue}\n`)
    process.emit('exit', 0)

    const result = await promise

    expect(result.stdout).toBe(`${randomValue}\n`)
    expect(result.stderr).toBe('')
    expect(result.code).toBe(0)

    expect(logger.log).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  /**
   * @assert Assert the `exec` module can execute a valid command, meanwhile
   * suppressing debug information when the `debug` option is disabled.
   */
  it('should execute a valid command and resolve on close', async () => {
    const randomValue = generateRandomValue()
    const command = `echo "${randomValue}"`

    const process = new EventEmitter()

    process.stdout = new EventEmitter()
    process.stderr = new EventEmitter()

    const options = {
      debug: false,
      spawn: jest.fn().mockImplementation(() => {
        return process
      }),
    }

    const promise = exec(command, options)

    process.stdout.emit('data', `${randomValue}\n`)
    process.emit('close', 0)

    const result = await promise

    expect(result.stdout).toBe(`${randomValue}\n`)
    expect(result.stderr).toBe('')
    expect(result.code).toBe(0)

    expect(logger.log).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  /**
   * @assert Assert the `exec` module can execute a command, meanwhile
   * outputting debug information when the `debug` option is enabled.
   */
  it('should log info if debug is enabled', async () => {
    const randomValue = generateRandomValue()
    const command = `echo "${randomValue}"`

    const process = new EventEmitter()

    process.stdout = new EventEmitter()
    process.stderr = new EventEmitter()

    const options = {
      debug: true,
      spawn: jest.fn().mockImplementation(() => {
        return process
      }),
    }

    const promise = exec(command, options)

    process.stdout.emit('data', `${randomValue}\n`)
    process.emit('close', 0)

    const result = await promise

    expect(result.stdout).toBe(`${randomValue}\n`)
    expect(result.stderr).toBe('')
    expect(result.code).toBe(0)

    expect(logger.error).not.toHaveBeenCalled()

    expect(logger.log).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledTimes(1)
  })

  /**
   * @assert Assert the `exec` module can return an error response, meanwhile
   * suppressing debug information when the `debug` option is disabled.
   */
  it('should return an error response if the command fails', async () => {
    const command = `invalid-command`

    const process = new EventEmitter()

    process.stdout = new EventEmitter()
    process.stderr = new EventEmitter()

    const options = {
      debug: false,
      spawn: jest.fn().mockImplementation(() => {
        return process
      }),
    }

    const promise = exec(command, options)

    process.stderr.emit('data', `${command}: command not found\n`)

    const result = await promise

    expect(result.stderr).toBe(`${command}: command not found\n`)
    expect(result.code).toBe(1)

    expect(logger.log).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  /**
   * @assert Assert the `exec` module can return an error response, meanwhile
   * outputting debug information when the `debug` option is enabled.
   */
  it('should log error if debug is enabled', async () => {
    const command = `invalid-command`

    const process = new EventEmitter()

    process.stdout = new EventEmitter()
    process.stderr = new EventEmitter()

    const options = {
      debug: true,
      spawn: jest.fn().mockImplementation(() => {
        return process
      }),
    }

    const promise = exec(command, options)

    process.stderr.emit('data', `${command}: command not found\n`)

    const result = await promise

    expect(result.stderr).toBe(`${command}: command not found\n`)
    expect(result.code).toBe(1)

    expect(logger.info).not.toHaveBeenCalled()

    expect(logger.log).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith([expect.stringMatching(new RegExp(`${command}(:)?( command)? not found`))])
  })
})

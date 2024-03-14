/**
 * @file Exec
 * @desc A module for executing shell commands.
 * @module dev/exec
 * @alias exec
 * @doc exec
 */

/**
 * @typedef {Object} ExecResponse
 * @property {number} code The exit code of the command.
 * @property {string} stderr The standard error output of the command.
 * @property {string} stdout The standard output of the command.
 */

import { spawn } from 'node:child_process'
import { logger } from './logger.js'

// Define utilities.
const controller = new AbortController()
const { signal } = controller

/**
 * @function exec
 * @desc Execute a streaming shell command. This function is a
 * wrapper for the `child_process.spawn` function, or any other
 * function that returns an event stream. The wrapper returns a
 * promise that resolves to an object containing the exit code,
 * standard error output, and standard output of the command.
 * The wrapper accepts an options object that can be used to
 * control the behavior of the command.
 * @param {string} command The command to execute.
 * @param {Object} [options] The options for the spawn command.
 * @param {boolean} [options.debug = false] A flag to print debug information.
 * @param {boolean} [options.verbose = false] An alias for the `debug` option.
 * @param {EventEmitter} [options.spawn = spawn] The spawn function
 * to use. Defaults to `child_process.spawn`.
 * @return {Promise<ExecResponse>} The result of the operation.
 */
export const exec = async (command, options = {}) => {
  return new Promise((resolve) => {
    const {
      debug = options.verbose,
      shell = true,
      spawn: spawner = spawn,
      stdio = 'overlapped',
    } = options

    const mergeOptions = () => {
      return {
        ...options,
        shell,
        signal,
        stdio,
      }
    }

    const getStdioOptions = () => {
      return { stdio: options.stdio }
    }

    const useStdioOptions = options.stdio === 'inherit'

    const spawnOptions = useStdioOptions ? getStdioOptions() : mergeOptions()

    const cmd = spawner(command, [], spawnOptions)

    let stderr = ''
    let stdout = ''

    if (debug) {
      logger.log([`Executing \`${command}\` ...`])
    }

    cmd.stdout.on('data', (data) => {
      if (debug) {
        logger.info(['STDOUT: ', data.toString()])
      }

      stdout += data
    })

    cmd.stderr.on('data', (data) => {
      if (debug) {
        logger.error([`STDERR: ${data}`])
      }

      stderr += data

      resolve({ code: 1, stderr, stdout })
    })

    cmd.on('exit', (code) => {
      resolve({ code, stderr, stdout })
    })

    cmd.on('close', (code) => {
      resolve({ code, stderr, stdout })
    })
  })
}

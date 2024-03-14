/**
 * @file Logger
 * @desc Log styled messages to the console.
 * @module logger
 */

/**
 * @section Dependencies
 *
 * @requires chalk A terminal string styling library.
 */
import chalk from 'chalk'

/**
 * @section Constants
 */

/**
 * @const Logger
 * @desc The console object.
 * @type {Console | console}
 */
export const Logger = console

/**
 * @const colors
 * @desc A map of colors to use for logging.
 */
export const colors = {
  brightblue: { hex: '0094ff' },
  coolgray: { hex: '5e6769' },
  green: { hex: '5bcf70' },
  red: { hex: 'd82727' },
  white: { hex: 'ffffff' },
  yellow: { hex: 'ffef7f' },
}

/**
 * @const styleMap
 * @desc A map of styles to use for logging.
 */
export const styleMap = {
  error: () => chalk.hex(colors.red.hex),
  info: () => chalk.hex(colors.brightblue.hex),
  log: () => chalk.reset,
  reset: () => chalk.reset,
  success: () => chalk.hex(colors.green.hex),
  warn: () => chalk.hex(colors.yellow.hex),
}

/**
 * @section Functions
 */

/**
 * @function getStyler
 * @desc Get a styler function from the styleMap.
 * @param {string} styleName A style name from the styleMap.
 * @return {Function} A styler function from the styleMap.
 */
export const getStyler = (styleName) => {
  const style = styleMap[styleName]

  return typeof style === 'function' ? style() : styleMap.log()
}

/**
 * @function styleOutput
 * @desc Style the given messages with the given style.
 * @param {string} styleName A style name from the styleMap.
 * @param {Array|String} messages A string or array of strings to log.
 * @return {String} The styled output.
 */
export const styleOutput = (styleName, messages) => {
  const styler = getStyler(styleName)

  const isMessageString = typeof messages === 'string'
  const [header, ...content] = isMessageString ? [messages, ''] : messages

  return `${styler(header)}${getStyler('reset')(content.join(''))}`
}

/**
 * Log styled messages to the console.
 * @param {String} logLevel A log level from the styleMap.
 * @param {Array | String} messages A string or array of strings to log.
 * @param {Console | console} logger The console object.
 * @return {String} The styled output.
 */
export const print = (logLevel, messages, logger = Logger) => {
  const printer = logger[logLevel] || logger.log
  const output = styleOutput(logLevel, messages)

  printer(output)

  return output
}

/**
 * @function log
 * @param {Array|String} messages A string or array of strings to log.
 * @return {String} The styled output.
 */
export const log = (messages) => {
  return print('log', messages)
}

/**
 * @function error
 * @param {Array|String} messages A string or array of strings to log.
 * @return {String} The styled output.
 */
export const error = (messages) => {
  return print('error', messages)
}

/**
 * @function info
 * @param {Array|String} messages A string or array of strings to log.
 * @return {String} The styled output.
 */
export const info = (messages) => {
  return print('info', messages)
}

/**
 * @function success
 * @param {Array|String} messages A string or array of strings to log.
 * @return {String} The styled output.
 */
export const success = (messages) => {
  return print('success', messages)
}

/**
 * @function warn
 * @param {Array|String} messages A string or array of strings to log.
 * @return {String} The styled output.
 */
export const warn = (messages) => {
  return print('warn', messages)
}

/**
 * @const logger
 * @desc Log styled messages to the console.
 * @type {{log: function, error: function, info: function, print: function, success: function, warn: function}}
 *
 * @example {@lang javascript}
 * import { logger } from './logger'
 * logger.log('Hello, world!')
 */
export const logger = {
  log,
  error,
  info,
  print,
  success,
  warn,
}

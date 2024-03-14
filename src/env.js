/**
 * @file Environment
 * @desc The Environment module provides access to environment variables.
 * @module env
 * @doc env
 */

/**
 * @constant {Object} PROCESS The global process object.
 */
export const PROCESS = typeof process === 'undefined' ? import.meta : process

export const TESTING = PROCESS.env.NODE_ENV === 'test'

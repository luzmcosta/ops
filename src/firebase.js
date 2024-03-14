/**
 * @file Firebase Utilities
 * @desc This module provides utilities for working with Firebase.
 * @module firebase
 *
 * @uses node:child_process
 * @uses node:fs/promises
 * @uses node:path
 * @uses module:errors
 * @uses module:exec
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import cli from 'firebase-tools'

import { exec } from './exec.js'
import { logger } from './logger.js'

import {
  runValidators,
  validateDirectory,
  validateParsedFirebaserc,
  validateProjectKey,
  validateProjectName,
  validateFirebasercProjects,
} from './validate.js'

/**
 * @section Validators
 */

/**
 * @function validateFirebaserc
 * @desc Validate the .firebaserc file.
 * @param {Object} firebaserc The parsed .firebaserc file.
 * @param {Object} firebaserc.projects The projects in the .firebaserc file.
 * @param {Function[]} [validators] The validation functions to run.
 * @return {{error: boolean, message: string}} The result of the validation.
 */
export const validateFirebaserc = (firebaserc, validators = [
  () => validateParsedFirebaserc(firebaserc),
  () => validateFirebasercProjects(firebaserc.projects),
]) => {
  const successResponse = {
    error: false,
    message: `The .firebaserc JSON is valid.`,
  }

  return runValidators(validators, successResponse)
}

/**
 * @function validateOptions
 * @desc Validate the options's directory and projectKey properties.
 * @param {Object} options The options passed by the dev-user.
 * @param {string} options.directory The project's root directory.
 * @param {string} options.projectKey The project key in the .firebaserc file.
 * @param {Function[]} [validators] The validation functions to run.
 * @return {{error: boolean, message: string}} The result of the validation.
 *
 * @uses validateDirectory
 * @uses validateProjectKey
 */
export const validateOptions = (options, validators = [
  () => validateDirectory(options.directory),
  () => validateProjectKey(options.projectKey),
]) => {
  const successResponse = {
    error: false,
    message: `The options are valid.`,
  }

  return runValidators(validators, successResponse)
}

/**
 * @section Service Handlers
 * @desc The service handlers are responsible for handling APIs and services
 * outside of our control, such as `fs.promises.readFile` and `JSON.parse`.
 */

/**
 * @function readFirebaserc
 * @desc Read the .firebaserc file from the given directory.
 * @param {string} directory The project's root directory.
 * @return {Promise<FirebasercResult>} A promise of the .firebaserc file's
 * contents and whether an error occurred during the reading process.
 *
 * @error {TypeError} If the `directory` is not a string, the `path.join`
 * method will throw a TypeError stating 'The "path" argument must be of type
 * string.'
 * @error {Error} If the file cannot be read, the `fs/promises.readFile`
 * method will throw an error stating 'ENOENT: no such file or directory.'
 *
 * @requires fs/promises.readFile
 * @requires path.join
 *
 * @typedef {Object} FirebasercResult
 * @property {boolean} error Whether an error occurred.
 * @property {string} [message] The error message.
 * @property {string} [firebaserc] The .firebaserc file's contents.
 *
 * @example An example .firebaserc file
 * {
 *   "projects": {
 *     "default": "project-name"
 *   }
 * }
 *
 * @example Success Reading File
 * const directory = './example/dir'
 * const { error, firebaserc } = await readFirebaserc(directory)
 *
 * console.log(error) // false
 * console.log(firebaserc) // '{ "projects": { "default": "project-name" } }'
 *
 * @example Failure Reading File
 * const directory = './missing/dir'
 * const { error, message } = await readFirebaserc(directory)
 *
 * console.log(error) // true
 * console.log(message) // 'ENOENT: no such file or directory'
 */
export const readFirebaserc = async (directory) => {
  try {
    const firebasercPath = path.join(directory, '.firebaserc')
    const firebaserc = await fs.readFile(firebasercPath, 'utf8')

    return { error: false, firebaserc }
  } catch (e) {
    // The stack trace tends to be noise here, so we only use the message.
    return { error: true, message: e.message }
  }
}

/**
 * @function parseJson
 * @desc Parse a JSON string.
 * @param {string} jsonString The JSON string to parse.
 * @return {Promise<JsonResult>} A promise of parsed JSON
 * and whether an error occurred during parsing.
 *
 * @requires JSON
 *
 * @typedef {Object} JsonResult
 * @property {boolean} error Whether an error occurred.
 * @property {string} [message] The error message.
 * @property {Object} [json] The parsed JSON.
 *
 * @example Success Parsing Input
 * const jsonString = `{"key": "value"}`
 * const { error, json } = await parseJson(jsonString)
 *
 * console.log(error) // false
 * console.log(json) // { key: 'value' }
 *
 * @example Failure Parsing Input
 * const jsonString = `{"key": "value"` // Missing the closing brace.
 * const { error, message } = await parseJson(jsonString)
 *
 * console.log(error) // true
 * console.log(message) // 'Unexpected end of JSON input'
 */
export const parseJson = (jsonString) => {
  try {
    const json = JSON.parse(jsonString)

    return { error: false, json }
  } catch (e) {
    // The stack trace tends to be noise here, so we only use the message.
    return { error: true, message: e.message }
  }
}

/**
 * @section Firebaserc File Operations
 * @desc These functions are responsible for reading and parsing the
 * .firebaserc file.
 */

/**
 * @function parseFirebaserc
 * @desc Parse the .firebaserc file.
 * @param {string} firebaserc The .firebaserc file's contents.
 * @param {Function} parser The function to parse the JSON.
 * @return {Promise<FirebasercResult>} A promise of the .firebaserc
 * JSON and whether an error occurred during parsing.
 *
 * @uses parseJson
 *
 * @example Success Parsing Input
 * const firebaserc = '{ "projects": { "default": "project-name" } }'
 * const { error, firebaserc } = await parseFirebaserc(firebaserc)
 *
 * console.log(error) // false
 * console.log(firebaserc) // { projects: { default: 'project-name' } }
 *
 * @example Failure Parsing Input
 * const firebaserc = '{ "projects": {'
 * const parser = (jsonString) => {
 *  throw new Error('Unexpected end of JSON input')
 * }
 * const { error, message } = await parseFirebaserc(firebaserc, parser)
 *
 * console.log(error) // true
 * console.log(message) // 'Unexpected end of JSON input'
 */
export const parseFirebaserc = async (firebaserc, parser = parseJson) => {
  const result = await parser(firebaserc)
  const { error, json } = result

  return error ? result : { error, firebaserc: json }
}

/**
 * @function getFirebaserc
 * @desc Retrieve and parse the .firebaserc file from the given directory.
 * @param {string} directory The project's root directory.
 * @param {Function} parser The function to parse the .firebaserc file.
 * @param {Function} reader The function to read the .firebaserc file.
 * @return {Promise<FirebasercResult>} A promise of the parsed .firebaserc
 * file and whether an error occurred during the reading and parsing process.
 *
 * @uses readFirebaserc
 * @uses parseFirebaserc
 *
 * @example Success Retrieving .firebaserc
 * const directory = './example/dir'
 * const { error, firebaserc } = await getFirebaserc(directory)
 *
 * console.log(error) // false
 * console.log(firebaserc) // { projects: { default: 'project-name' } }
 *
 * @example Failure Retrieving .firebaserc
 * const directory = './missing/dir'
 * const { error, message } = await getFirebaserc(directory)
 *
 * console.log(error) // true
 * console.log(message) // 'ENOENT: no such file or directory'
 */
export const getFirebaserc = async (
  directory,
  parser = parseFirebaserc,
  reader = readFirebaserc) => {
  const result = await reader(directory)
  const { error, firebaserc } = result

  return error ? result : parser(firebaserc)
}

/**
 * @function findProjectsInFirebaserc
 * @desc Find the projects in the .firebaserc file.
 * @param {Object} firebaserc The parsed .firebaserc file.
 * @param {Object} firebaserc.projects The projects in the .firebaserc file.
 * @param {Function} validator The function to validate the .firebaserc file.
 * @return {FirebasercProjectsResult} The result of the operation.
 *
 * @uses validateParsedFirebaserc
 * @uses validateFirebasercProjects
 */
export const findProjectsInFirebaserc = (
  firebaserc,
  validator = validateFirebaserc) => {
  const validationResult = validator(firebaserc)

  return validationResult?.error ? validationResult : { error: false, projects: firebaserc.projects }
}

/**
 * @function findProjectNameByKey
 * @desc Get the project name from the JSON of a .firebaserc file.
 * @param {string} projectKey The project key in the .firebaserc file.
 * @param {Object} projects The projects in the .firebaserc file.
 * @param {Function} validator The function to validate the project name.
 * @return {ProjectNameResult} The result of the attempt to retrieve the
 * project name from the .firebaserc file using the project key.
 *
 * @uses validateProjectName
 *
 * @typedef {Object} ProjectNameResult
 * @property {boolean} error Whether an error occurred.
 * @property {string} [message] The error message.
 * @property {string | undefined} [projectName] The project name.
 */
export const findProjectNameByKey = (
  projectKey,
  projects,
  validator = validateProjectName) => {
  const projectName = projects[projectKey]
  const result = validator(projectName)

  return result?.error ? result : { error: false, projectName }
}

/**
 * @function getFirebasercProjects
 * @desc Get the projects in the .firebaserc file.
 * @param {string} directory The project's root directory.
 * @param {Function} parser The function to parse the .firebaserc file.
 * @param {Function} reader The function to read the .firebaserc file.
 * @return {Promise<FirebasercProjectsResult>} The result of the operation.
 *
 * @uses getFirebaserc
 * @uses findProjectsInFirebaserc
 *
 * @typedef {Object} FirebasercProjectsResult
 * @property {boolean} error Whether an error occurred.
 * @property {string} [message] The error message, if applicable.
 * @property {Object} [projects] The projects in the .firebaserc file.
 */
export const getFirebasercProjects = async (
  directory,
  parser = findProjectsInFirebaserc,
  reader = getFirebaserc) => {
  const firebasercJson = await reader(directory)
  const { error, firebaserc } = firebasercJson

  return error ? firebasercJson : parser(firebaserc)
}

/**
 * @function readProjectNameFromFirebaserc
 * @desc Read the project name from the .firebaserc file.
 * @param {Object} options The options passed to configure Firebase.
 * @param {string} options.directory The project's root directory.
 * @param {string} options.projectKey The project key in the .firebaserc file.
 * @param {Function} parser The function to parse the .firebaserc file.
 * @param {Function} reader The function to read the .firebaserc file.
 * @return {Promise<ProjectNameResult>} The result of the operation.
 *
 * @uses getFirebasercProjects The function to read the .firebaserc file.
 * @uses findProjectNameByKey The function to parse the .firebaserc file.
 */
export const readProjectNameFromFirebaserc = async (
  options,
  parser = findProjectNameByKey,
  reader = getFirebasercProjects) => {
  const { directory, projectKey } = options
  const readerResult = await reader(directory)
  const { error, projects } = readerResult

  return error ? readerResult : parser(projectKey, projects)
}

/**
 * @function getProjectName
 * @param {Object} options
 * @param {string} options.directory The project's root directory.
 * @param {string} options.projectKey The project key in the .firebaserc file.
 * @param {Function} [validator] The function to validate the options.
 * @param {Function} [runner] The function to execute the command.
 * @return {Promise<ProjectNameResult>} The result of the operation.
 *
 * @uses validateOptions
 * @uses readProjectNameFromFirebaserc
 *
 * @example Success Retrieving Project Name
 * const options = { directory: './example/dir', projectKey: 'default' }
 * const { error, projectName } = await getProjectName(options)
 *
 * console.log(projectName) // 'the-project-name'
 * console.log(error) // false
 *
 * @example Failure Retrieving Project Name
 * const options = { directory: './example/dir', projectKey: 'missing' }
 * const { error, projectName } = await getProjectName(options)
 *
 * console.log(projectName) // undefined
 * console.log(error) // true
 */
export const getProjectName = async (
  options,
  validator = validateOptions,
  runner = readProjectNameFromFirebaserc) => {
  const validation = validator(options)

  return validation?.error ? Promise.resolve(validation) : runner(options)
}

/**
 * @function configureFirebaseProject
 * @param {Object} options
 * @param {string} options.projectKey The project key in the .firebaserc file.
 * @param {Function<Promise<ExecResponse>>} [executable] The function to execute the command.
 * @return {Promise<{error: boolean, message: string}>} The result of the operation.
 */
export const configureFirebaseProject = async (options, executable = exec) => {
  const { projectKey } = options
  const { code } = await executable(`firebase use ${projectKey}`)

  const error = code !== 0
  const message = error
    ? `The Firebase project could not be configured.`
    : `The Firebase project has been configured.`

  return { error, message }
}

/**
 * @function configureFirebaseWebFrameworks
 * @desc Enable Firebase's experimental webframeworks feature.
 * @param {Object} [options] The options passed to configure Firebase.
 * @param {Function<Promise<ExecResponse>>} [executable] The function to execute the command.
 * @return {Promise<{error: boolean, message: string}>} The result of the operation.
 */
export const configureFirebaseWebFrameworks = async (options = {}, executable = exec) => {
  const { code } = await executable(`firebase experiments:enable webframeworks`)

  const error = code !== 0
  const message = error
    ? `The Firebase webframeworks feature could not be enabled.`
    : `The Firebase webframeworks feature has been enabled.`

  return { error, message }
}

export const firebaseLogin = () => {}

/**
 * @function configureFirebaseLogin
 * @desc Sign in to Firebase using interactive shell script.
 * @param {Object} [options] The options passed to configure Firebase.
 * @param {Function<Promise<ExecResponse>>} [executable] The function to execute the command.
 * @return {Promise<{error: boolean, message: string}>} The result of the operation.
 */
export const configureFirebaseLogin = async (options = {}, executable = cli.login) => {
  const { debug = false } = options
  const result = await executable().catch((e) => {
    if (debug) {
      logger.error([`${e.message}`])
    }

    return { error: true, message: e.message }
  })

  /**
   * @todo Assert the email from the login event is equivalent to
   * an email passed via the `options` param.
   */
  const valid = typeof result === 'object' && result && result.email

  const success = () => ({ email: result.email, error: false, message: `The user has been logged in to Firebase.` })

  const error = () => ({ error: true, message: result?.message || 'The Firebase login attempt failed.' })

  return valid ? success() : error()
}

export const makeFirebaseConfigurationSteps = (options, executable) => {
  return [
    () => {
      logger.info([`Enabling Firebase's experimental webframeworks feature ...`])

      return configureFirebaseWebFrameworks(options, executable)
    },
    () => {
      logger.info([`Signing into Firebase ...`])

      return configureFirebaseLogin()
    },
    () => {
      logger.info([`Configuring the Firebase project ...`])

      return configureFirebaseProject(options, executable)
    },
  ]
}

export const configureFirebase = async (
  options,
  steps = makeFirebaseConfigurationSteps(options, exec)) => {
  const successResponse = Promise.resolve({
    error: false,
    message: `Firebase has been configured.`,
  })

  return steps.reduce(async (currentState, fnStep) => {
    const state = await currentState
    const result = state?.error ? state : await fnStep(state)

    return result.error ? result : currentState
  }, successResponse)
}

export const firebase = {
  configureFirebase,
  configureFirebaseLogin,
  configureFirebaseProject,
  configureFirebaseWebFrameworks,
  findProjectNameByKey,
  findProjectsInFirebaserc,
  getFirebaserc,
  getFirebasercProjects,
  getProjectName,
  makeFirebaseConfigurationSteps,
  parseFirebaserc,
  parseJson,
  readFirebaserc,
  readProjectNameFromFirebaserc,
  validateFirebaserc,
  validateOptions,
}

#!/usr/bin/env node

/**
 * @file OpsJS
 * @desc Manage complex development operations.
 * @module ops
 * @doc ops
 */

/**
 * @section Import dependencies
 * @desc Import dotenv, followed by Node dependencies, followed by third-party
 * dependencies, followed by local dependencies. Use alphabetical order for
 * each section.
 */
import dotenv from 'dotenv'

// Node dependencies
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Third-party dependencies
import { Command } from 'commander'
import inquirer from 'inquirer'
import shelljs from 'shelljs'

// Local utilities
import { PROCESS, TESTING } from './env.js'
import { exec } from './exec.js'
import { logger } from './logger.js'

// Local service configuration modules
import {
  configureFirebase,
  getProjectName,
} from './firebase.js'

import { configureGoogleProject } from './gcloud.js'

/**
 * @section Import environment variables
 * @desc Import environment variables defined in the .env file.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// @note Configure RELATIVE_ROOT_PATH to match the project's directory structure.
const RELATIVE_ROOT_PATH = '../'
const rootDir = path.join(__dirname, RELATIVE_ROOT_PATH)

dotenv.config({ path: path.resolve(rootDir, `.env`) })

/**
 * @section Define constants
 */

// Create an instance of the command line interface.
const commander = new Command()

// Get values for the command line options.
const FONT_AWESOME_ACCOUNT_URL = 'fontawesome.com/account'
const FONT_AWESOME_NPM_REGISTRY = 'npm.fontawesome.com/'

const {
  FONT_AWESOME_TOKEN,
  FONT_AWESOME_TOKEN_LOCATION = FONT_AWESOME_ACCOUNT_URL,
  OPS_NODE_ENV = 'development',
  OPS_PROJECT_KEY = 'default',
} = PROCESS.env

/**
 * @section Define API
 */

/**
 * @function setNodeEnv
 * @desc Set the NODE_ENV environment variable.
 * @param {string} env The desired NODE_ENV value.
 * @return {{error: boolean}}
 *
 * @requires shelljs.env
 */
export const configureNodeEnv = (env) => {
  shelljs.env['NODE_ENV'] = env

  const error = shelljs.env['NODE_ENV'] !== env

  return { error }
}

/**
 * @function obtainFontAwesomeToken
 * @desc Obtain the Font Awesome token from the user.
 * @param {Function} [prompter=inquirer.prompt] The prompter function.
 * @return {Promise<{error: boolean, message: string, token: string}>} The result of the token retrieval.
 */
export const obtainFontAwesomeToken = async (prompter = inquirer.prompt) => {
  logger.info([`Obtain the Font Awesome token from ${FONT_AWESOME_TOKEN_LOCATION}`])

  const response = await prompter([
    {
      type: 'input',
      name: 'token',
      message: 'Enter the Font Awesome token.',
      default: FONT_AWESOME_TOKEN || '',
    },
  ]).catch((error) => {
    return { error: true, message: error.message }
  })

  const { error: promptError, message: promptMessage, token } = response || {}
  const isValidToken = () => token && token.length > 0

  const error = promptError || !isValidToken()
  const message = error
    ? promptMessage || `The Font Awesome token is invalid.`
    : `The Font Awesome token has been obtained.`

  return { error, message, token }
}

/**
 * @function setFontAwesomeRegistry
 * @desc Set the Font Awesome registry in the npm configuration.
 * @param {Function} [executable=exec] The command line executable.
 */
export const setFontAwesomeRegistry = async (executable = exec) => {
  const result = await executable(`npm config set "@fortawesome:registry" ${FONT_AWESOME_NPM_REGISTRY}`)

  const { code } = result
  const error = code !== 0
  const message = error
    ? `Failed to set the Font Awesome registry.`
    : `The Font Awesome registry has been set.`

  return { error, message }
}

/**
 * @function setFontAwesomeToken
 * @desc Set the Font Awesome token in the npm configuration.
 * @param {{token: string}} options The options for the token configuration.
 * @param {Function} [executable=exec] The command line executable.
 * @return {Promise<{error: boolean, message: string}>} The result of the token configuration.
 */
export const setFontAwesomeToken = async (options, executable = exec) => {
  logger.info([`Configuring access to the Font Awesome registry ...`])

  const result = await executable(`npm config set "//${FONT_AWESOME_NPM_REGISTRY}:_authToken" ${options?.token}`)

  const { code } = result
  const error = code !== 0
  const message = error
    ? `Failed to set the Font Awesome token.`
    : `The Font Awesome token has been set.`

  return { error, message }
}

/**
 * @function makeFontAwesomeConfigurationSteps
 * @desc Configure the steps to configure Font Awesome.
 * @param {Function} [prompter=inquirer.prompt] The prompter function.
 * @param {Function} [executable=exec] The command line executable.
 * @return {Function[]} The steps to configure Font Awesome.
 *
 * @requires obtainFontAwesomeToken
 * @requires setFontAwesomeRegistry
 * @requires setFontAwesomeToken
 */
export const makeFontAwesomeConfigurationSteps = (
  prompter = inquirer.prompt,
  executable = exec) => {
  const $obtainFontAwesomeToken = () => obtainFontAwesomeToken(prompter)
  const $setFontAwesomeRegistry = () => setFontAwesomeRegistry(executable)
  const $setFontAwesomeToken = (state) => setFontAwesomeToken(state, executable)

  const steps = [
    $obtainFontAwesomeToken,
    $setFontAwesomeRegistry,
    $setFontAwesomeToken,
  ]

  return steps
}

/**
 * @function configureFontAwesome
 * @desc Configure Font Awesome.
 * @param {Function[]} [steps=makeFontAwesomeConfigurationSteps] The steps to configure Font Awesome.
 * @return {Promise<{error: boolean, message: string, token: string}>} The result of the Font Awesome configuration.
 */
export const configureFontAwesome = async (
  steps = makeFontAwesomeConfigurationSteps()) => {
  logger.info([`Setting up Font Awesome ... \n`])

  const successResponse = { error: false, message: 'Font Awesome is ready.' }

  return steps.reduce(async (currentState, step) => {
    const state = await currentState
    const latestState = state.error ? state : await step(state)

    // Determine whether the step was successful.
    const { error, token } = latestState
    const haveToken = !error && token && token.length > 0

    if (haveToken) {
      // Set the token on the state for following steps to use.
      state.token = token
    }

    return error ? latestState : state
  }, Promise.resolve(successResponse))
}

export const stepConfigureNodeEnv = async (options, executable = configureNodeEnv) => {
  logger.info([`Configuring the NODE_ENV environment variable to ${options.env} ...`])

  const result = executable(options.env)

  if (result.error) {
    result.messages = [
      `Failed to set the NODE_ENV environment variable to ${options.env}.\n`,
      `- Confirm the OPS_NODE_ENV env var in the .env file or the env option on the command line.\n`,
      `- Ensure the env option is set to a valid and desirable value.\n`,
    ]
  } else {
    logger.log([`NODE_ENV is set to ${options.env}.`])
    logger.success([`The environment is ready.`])
  }

  return Promise.resolve(result)
}

/**
 * @function stepConfigureGoogle
 * @desc Configure Google Cloud CLI with the project name.
 * @param {Object} options The options for the Google Cloud configuration.
 * @param {string} options.directory The project's root directory.
 * @param {string} options.projectKey The project key.
 * @param {Function} [parser=configureGoogleProject] The parser function.
 * @param {Function} [reader=getProjectName] The reader function.
 * @return {Promise<{error: boolean, message: string}>} The result of the Google Cloud configuration.
 */
export const stepConfigureGoogle = async (
  options,
  parser = configureGoogleProject,
  reader = getProjectName) => {
  logger.info([`Configuring Google Cloud ...`])

  const projectNameResult = await reader(options)
  const { error, projectName } = projectNameResult || {}

  logger.log([`Setting the Google Cloud project to "${projectName}" ...`])

  const result = error ? projectNameResult : await parser(projectName)

  if (result.error) {
    result.messages = [
      `Failed to configure Google Cloud using "${options.projectKey}" as the projectKey.\n`,
      `  1. Review the OPS_PROJECT_KEY env var in the .env file or the "projectKey" flag on the command line.\n`,
      `     Ensure the project key is set to a valid and desirable value.\n\n`,
      `  2. Ensure the .firebaserc file has a property for the corresponding project key.\n`,
      `     Ensure the project name in the .firebaserc file is set to a valid and desirable value.\n\n`,
      `  3. Ensure your gcloud user has access to the project referenced in the .firebaserc file.\n`,
      `     Run "gcloud auth list" to review your auth state.\n`,
    ]
  } else {
    logger.success([`Google Cloud is ready.`])
  }

  return result
}

export const stepConfigureFirebaseProject = async (options, executable = configureFirebase) => {
  const result = await executable(options)

  if (result.error) {
    result.messages = [
      `Failed to configure Firebase using "${options.projectKey}" as the projectKey.\n`,
      `  1. Confirm the OPS_PROJECT_KEY env var in the .env file or the "projectKey" flag on the command line.\n`,
      `     Ensure the project key is set to a valid and desirable value.\n\n`,
      `  2. Ensure the .firebaserc file has a property for the corresponding project key.\n`,
      `     Ensure the project name in the .firebaserc file is set to a valid and desirable value.\n\n`,
      `  3. Ensure your gcloud user has access to the project referenced in the .firebaserc file.\n`,
      `     Run "firebase login:list" to review your auth state.\n`,
    ]
  } else {
    logger.success([`Firebase is ready.`])
  }

  return result
}

export const stepConfigureFontAwesome = async (executable = configureFontAwesome) => {
  const result = await executable()

  if (result.error) {
    result.messages = [`Failed to configure Font Awesome.`]
  }

  return result
}

export const stepFinish = async () => {
  logger.success([`\nThe setup is complete. Happy coding!\n`])

  return { error: false }
}

export const runSteps = async (steps, options) => {
  const step = steps.shift()
  const result = await step(options)
  const runNextStep = !result.error && steps.length

  if (result.error) {
    if (result.message) {
      logger.error([result.message])
    }

    if (result.messages) {
      logger.log(result.messages)
    }
  }

  return runNextStep ? runSteps(steps, options) : result
}

export const setupFirebase = async (options = {}) => {
  logger.info([`Configuring Firebase ...`])

  const allSteps = [
    stepConfigureGoogle,
    stepConfigureFirebaseProject,
    stepFinish,
  ]

  return runSteps(allSteps, options)
}

export const setup = async (options = {}) => {
  logger.info([`Setting up the environment ...`])

  const allSteps = [
    stepConfigureNodeEnv,
    stepConfigureGoogle,
    stepConfigureFirebaseProject,
    stepConfigureFontAwesome.bind(null, configureFontAwesome),
    stepFinish,
  ]

  return runSteps(allSteps, options)
}

/**
 * @section Define CLI
 */

commander
  .name('ops')
  .version('1.0.0', '-v, --version')
  .description('Manage the application.')
  .action(() => {
    if (!TESTING) {
      commander.help()
    }
  })

commander
  .command('setup')
  .description('Setup the development environment.')
  .option('-d, --directory <directory>', `The project's root directory.`, rootDir)
  .option('-e, --env <env>', `The desired NODE_ENV value.`, OPS_NODE_ENV)
  .option('-p, --projectKey <projectKey>', `The property name in the .firebaserc file.`, OPS_PROJECT_KEY)
  .option('-v, --verbose', `Show verbose information.`)
  .option('-x, --debug', `Show debug information.`)
  .action((options) => {
    return setup(options)
  })

commander
  .command('firebase')
  .description('Configure Firebase for the project.')
  .option('-d, --directory <directory>', `The project's root directory.`, rootDir)
  .option('-p, --projectKey <projectKey>', `The property name in the .firebaserc file.`, OPS_PROJECT_KEY)
  .option('-v, --verbose', `Show verbose information.`)
  .option('-x, --debug', `Show debug information.`)
  .action((options) => {
    return setupFirebase(options)
  })

commander
  .command('help')
  .description('Show the help text.')
  .action(() => {
    return commander.help()
  })

// Run the command line interface.
commander.parse(PROCESS.argv)

// If no command is specified, show the help text.
if (!commander.args.length && !TESTING) {
  commander.help()
}

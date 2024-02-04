#!/usr/bin/env node

/**
 *@file OpsJS
 * @desc Manage complex development operations.
 */

/**
 * @section Import dependencies
 * @desc Import dotenv, followed by Node dependencies, followed by third-party
 * dependencies, followed by local dependencies. Use alphabetical order for
 * each section.
 */
import dotenv from 'dotenv'

import { execSync, spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Command } from 'commander'
import inquirer from 'inquirer'
import shell from 'shelljs'

import { logger } from './logger.js'

/**
 * @section Import environment variables
 * @desc Import environment variables defined in the .env file.
 */

const PROCESS = typeof process === 'undefined' ? import.meta : process

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = path.join(__dirname, '../../')

dotenv.config({ path: path.resolve(rootDir, `.env`) })

/**
 * @section Define constants
 */

// Create an instance of the command line interface.
const commander = new Command()

// Define the valid environments and modes using the Firebase configuration file.
const firebasercFile = await fs.readFile('.firebaserc', 'utf8')
const firebaserc = JSON.parse(firebasercFile)

// Get values for the command line options.
const FONT_AWESOME_ACCOUNT_URL = 'fontawesome.com/account'
const FONT_AWESOME_NPM_REGISTRY = 'npm.fontawesome.com/'

const {
  FONT_AWESOME_TOKEN,
  FONT_AWESOME_TOKEN_LOCATION = FONT_AWESOME_ACCOUNT_URL,
  OPS_NODE_ENV = 'development',
  OPS_PROJECT_KEY = Object.keys(firebaserc.projects)[0],
} = PROCESS.env

// Define utility functions.
const controller = new AbortController()
const { signal } = controller

/**
 * @section Define API
 */

/**
 * @function exec
 * @desc Execute a command. This function is a wrapper for the
 * `child_process.spawn` function. It returns a promise that
 * resolves with the result of the operation.
 * @param {string} command The command to execute.
 * @param {Object} options The options for the spawn command.
 * @return {Promise<Object<{ code: number, stderr: string, stdout: string }>>} The result of the operation.
 */
export const exec = (command, options = {}) => {
  return new Promise((resolve) => {
    const cmd = spawn(command, [], { ...options, shell: true, signal, stdio: 'overlapped' })

    let stderr = ''
    let stdout = ''

    logger.log([`Running \`${command}\` ...`])

    cmd.stdout.on('data', (data) => {
      console.log(data.toString())

      stdout += data
    })

    cmd.stderr.on('data', (data) => {
      logger.error([`STDERR: ${data}`])

      stderr += data

      resolve({ code: 1, stderr, stdout })
    })

    cmd.on('exit', (code) => {
      resolve({ code, stdout })
    })
  })
}

/**
 * @function setNodeEnv
 * @param env
 * @return {{error: boolean}}
 */
export const configureNodeEnv = (env) => {
  shell.env['NODE_ENV'] = env

  const error = shell.env['NODE_ENV'] !== env

  return { error }
}

/**
 * @function configureFirebaseProject
 * @param {Object} options
 * @param {string} options.projectKey
 * @return {Promise<{error: boolean}>}
 */
export const configureFirebaseProject = async ({ projectKey }) => {
  const { code } = await exec(`firebase use ${projectKey}`)

  return { error: code !== 0 }
}

/**
 * @function configureGoogleProject
 * @param {Object} options
 * @param {string} options.projectKey
 * @return {Promise<{error: boolean}>}
 */
export const configureGoogleProject = async ({ projectKey }) => {
  const projectName = firebaserc.projects[projectKey]

  if (!projectName) {
    return { error: true }
  }

  /**
   * Use the gcloud command's --no-user-output-enabled flag to ensure only actual errors are directed to stderr.
   * This flag is available on all gcloud commands. Without it, gcloud commands may falsely direct their success
   * message to stderr. For more information, see
   * {@link https://cloud.google.com/sdk/gcloud/reference#--user-output-enabled} and
   * {@link https://unix.stackexchange.com/questions/604248/how-to-stop-stderr-output-from-gcloud-command-in-cron-script-without-stopping-al}
   */
  const { code } = await exec(`gcloud config set project ${projectName} --no-user-output-enabled`)

  return { error: code !== 0 }
}

export const configureFirebase = async (options) => {
  logger.info([`Enabling Firebase's experimental webframeworks feature ...`])

  // Enable firebase webframeworks. Command outputs `{ webframeworks }`.
  await exec(`firebase experiments:enable webframeworks`)

  logger.info([`Signing into Firebase ...`])

  // Sign in to Firebase using interactive shell script.
  execSync(`firebase login`, { stdio: 'inherit' })

  await configureFirebaseProject(options)

  logger.success([`Firebase is ready.`])

  return { error: false }
}

export const configureFontAwesome = async () => {
  logger.info([`Setting up Font Awesome ... \n`])
  logger.info([`Obtain the Font Awesome token from ${FONT_AWESOME_TOKEN_LOCATION}`])

  const promptForFontAwesomeToken = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: 'Enter the Font Awesome token.',
      default: FONT_AWESOME_TOKEN || '',
    },
  ])

  logger.info([`Configuring access to the Font Awesome registry ...`])

  // Set npm config for Font Awesome. Command outputs `{ configset }`.
  await exec(`npm config set "@fortawesome:registry" ${FONT_AWESOME_NPM_REGISTRY}`)

  // Set Font Awesome Token. Command outputs `{ token }`.
  await exec(`npm config set "//${FONT_AWESOME_NPM_REGISTRY}:_authToken" ${promptForFontAwesomeToken.token}`)

  logger.success([`Font Awesome is ready.`])

  return { error: false }
}

const stepConfigureNodeEnv = async (options) => {
  logger.info([`Configuring the NODE_ENV environment variable to ${options.env} ...`])

  const result = configureNodeEnv(options.env)

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

  return result
}

const stepConfigureGoogle = async (options) => {
  logger.info([`Configuring Google Cloud ...`])

  const result = await configureGoogleProject(options)

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

const stepConfigureFirebaseProject = async (options) => {
  const result = await configureFirebase(options)

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
  }

  return result
}

const stepConfigureFontAwesome = async () => {
  const result = await configureFontAwesome()

  if (result.error) {
    result.messages = [`Failed to configure Font Awesome.`]
  }

  return result
}

const stepFinish = async () => {
  logger.success([`\nThe setup is complete. Happy coding!\n`])

  return { error: false }
}

const runSteps = async (steps, options) => {
  const step = steps.shift()
  const result = await step(options)
  const runNextStep = !result.error && steps.length

  if (result.error) {
    logger.error(result.messages)
  }

  return runNextStep ? runSteps(steps, options) : result
}

export const setup = async (options = {}) => {
  logger.info([`Setting up the environment ...`])

  const allSteps = [
    stepConfigureNodeEnv,
    stepConfigureGoogle,
    stepConfigureFirebaseProject,
    stepConfigureFontAwesome,
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
  .usage('[command] [options]')
  .parse(PROCESS.argv)

commander
  .command('setup')
  .description('Setup the development environment.')
  .option('-e, --env <env>', `The desired NODE_ENV value.`, OPS_NODE_ENV)
  .option('-p, --projectKey <projectKey>', `The property name in the .firebaserc file.`, OPS_PROJECT_KEY)
  .parse(PROCESS.argv)
  .action(async (options) => {
    return setup(options)
  })

commander
  .command('help')
  .description('Show the help text.')
  .parse(PROCESS.argv)
  .action(async () => {
    return commander.help()
  })

// Run the command line interface.
commander.parse(PROCESS.argv)

// If no command is specified, show the help text.
if (!commander.args.length) {
  commander.help()
}

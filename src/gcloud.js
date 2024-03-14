/**
 * @file Google Cloud Module
 * @desc This module configures the Google Cloud project.
 * @module gcloud
 * @doc gcloud
 *
 * @requires module:exec
 */

import { exec } from './exec.js'

export const validateGoogleProjectName = (projectName) => {
  const isValidProjectName = typeof projectName === 'string' && projectName.length > 0
  const error = !isValidProjectName
  const message = error
    ? `The Google Cloud project name is invalid.`
    : `The Google Cloud project name is valid.`

  return { error, message }
}

export const setGoogleCloudProject = async (projectName, executable = exec) => {
  const flags = '--no-user-output-enabled'
  const { code } = await executable(`gcloud config set project ${projectName} ${flags}`)

  const error = code !== 0
  const message = error
    ? `Failed to set the Google Cloud project to "${projectName}".`
    : `The Google Cloud project has been set to "${projectName}".`

  return { error, message }
}

/**
 * @function configureGoogleProject
 * @param {string} projectName The name of the Google Cloud project.
 * @param {Function} [executable=exec] The command line executable.
 * @return {Promise<{error: boolean, message: string}>} The result of the configuration.
 *
 * @note Regarding Flags Used
 * We use the gcloud command's `--no-user-output-enabled` flag to ensure
 * only actual errors are directed to stderr. This flag is available
 * on all gcloud commands. Without it, gcloud commands may falsely
 * direct their success message to stderr. For more information, see
 * {@link https://cloud.google.com/sdk/gcloud/reference#--user-output-enabled} and
 * {@link https://unix.stackexchange.com/questions/604248/how-to-stop-stderr-output-from-gcloud-command-in-cron-script-without-stopping-al}
 */
export const configureGoogleProject = async (projectName, executable = exec) => {
  const validationResult = validateGoogleProjectName(projectName)
  const { error } = validationResult

  return error ? validationResult : setGoogleCloudProject(projectName, executable)
}

export const gcloud = {
  configureGoogleProject,
  setGoogleCloudProject,
  validateGoogleProjectName,
}

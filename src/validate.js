/**
 * @file Validate
 * @module validate
 * @desc A module for validating options and other values.
 * @doc validate
 */

/**
 * @function runValidators
 * @desc Run a series of validators to check the validity of an object.
 * @param {Array<Function>} validators An array of functions to validate
 * an object and its properties.
 * @param {Object} successResponse The response to return if all the
 * validators pass.
 * @return {{error: boolean, message: string}} The result of the validation.
 */
export const runValidators = (validators, successResponse) => {
  return validators.reduce((currentResult, fnValidator) => {
    const result = currentResult?.error ? currentResult : fnValidator()

    return result.error ? result : currentResult
  }, successResponse)
}

/**
 * @function validateDirectory
 * @desc Validate the directory option.
 * @param {string} directory The project's root directory.
 * @return {{error: boolean, message: string}} Whether directory is valid.
 */
export const validateDirectory = (directory) => {
  const successResponse = { error: false, message: 'The directory option is valid.' }
  const errorResponse = { error: true, message: `The directory option is required.` }

  const isValidDirectory = typeof directory === 'string' && directory.length > 0

  return (isValidDirectory && successResponse) || errorResponse
}

/**
 * @function validateProjectKey
 * @desc Validate the projectKey option.
 * @param {string} projectKey The project key in the .firebaserc file.
 * @return {false | {error: boolean, message: string}} Whether projectKey is valid.
 */
export const validateProjectKey = (projectKey) => {
  const successResponse = { error: false, message: 'The projectKey option is valid.' }
  const errorResponse = { error: true, message: `The projectKey option is required.` }

  const isValidProjectKey = typeof projectKey === 'string' && projectKey.length > 0

  return (isValidProjectKey && successResponse) || errorResponse
}

export const validateProjectName = (projectName) => {
  const successResponse = { error: false, message: 'The project name is valid.' }
  const errorResponse = { error: true, message: `The project name is invalid.` }

  const isValidProjectName = typeof projectName === 'string' && projectName.length > 0

  return (isValidProjectName && successResponse) || errorResponse
}

export const validateFirebasercProjects = (projects) => {
  const successResponse = {
    error: false,
    message: 'The .firebaserc file contains a valid "projects" property.',
  }
  const errorResponse = {
    error: true,
    message: `The .firebaserc file does not contain a valid "projects" property.`,
  }

  const haveProjects = projects && typeof projects === 'object'
  const haveValidProjectsType = haveProjects && !Array.isArray(projects)
  const haveDefinedProjects = haveValidProjectsType && Object.keys(projects).length > 0

  return (haveDefinedProjects && successResponse) || errorResponse
}

export const validateParsedFirebaserc = (firebaserc) => {
  const successResponse = { error: false, message: 'The .firebaserc file contains a valid object.' }
  const errorResponse = { error: true, message: `The .firebaserc file contains an empty or invalid object.` }

  const haveFirebaserc = () => typeof firebaserc === 'object' && firebaserc
  const isNotEmptyObject = () => Object.keys(firebaserc).length > 0

  const isValidFirebaserc = haveFirebaserc() && isNotEmptyObject()

  return (isValidFirebaserc && successResponse) || errorResponse
}

export const validate = {
  runValidators,
  validateDirectory,
  validateProjectKey,
  validateProjectName,
  validateParsedFirebaserc,
  validateFirebasercProjects,
}

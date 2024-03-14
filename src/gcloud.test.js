/**
 * @file Test Google Cloud Module
 * @see module:gcloud
 */

import { describe, expect, it, jest } from '@jest/globals'

import {
  configureGoogleProject,
  setGoogleCloudProject,
  validateGoogleProjectName,
} from './gcloud.js'

describe('gcloud module', () => {
  describe('validateGoogleProjectName', () => {
    it('should validate a valid project name', () => {
      const projectName = 'my-project'
      const { error, message } = validateGoogleProjectName(projectName)

      expect(error).toBe(false)
      expect(message).toBe('The Google Cloud project name is valid.')
    })

    it('should return error response for an empty project name string', () => {
      const projectName = ''
      const { error, message } = validateGoogleProjectName(projectName)

      expect(error).toBe(true)
      expect(message).toBe('The Google Cloud project name is invalid.')
    })

    it('should return error response for a non-string project name', () => {
      const projectName = 123
      const { error, message } = validateGoogleProjectName(projectName)

      expect(error).toBe(true)
      expect(message).toBe('The Google Cloud project name is invalid.')
    })

    it('should return error response for a null project name', () => {
      const projectName = null
      const { error, message } = validateGoogleProjectName(projectName)

      expect(error).toBe(true)
      expect(message).toBe('The Google Cloud project name is invalid.')
    })
  })

  describe('setGoogleCloudProject', () => {
    it('should set the Google Cloud project', async () => {
      const projectName = 'my-project'
      const executable = jest.fn().mockResolvedValue({ code: 0 })

      await setGoogleCloudProject(projectName, executable)

      expect(executable).toHaveBeenCalledWith('gcloud config set project my-project --no-user-output-enabled')
    })

    it('should return an error response if the project is not set', async () => {
      const projectName = 'my-project'
      const executable = jest.fn().mockResolvedValue({ code: 1 })

      const { error, message } = await setGoogleCloudProject(projectName, executable)

      expect(error).toBe(true)
      expect(message).toBe('Failed to set the Google Cloud project to "my-project".')
    })
  })

  describe('configureGoogleProject', () => {
    it('should configure the Google Cloud project', async () => {
      const projectName = 'my-project'
      const executable = jest.fn().mockResolvedValue({ code: 0 })

      await configureGoogleProject(projectName, executable)

      expect(executable).toHaveBeenCalledWith('gcloud config set project my-project --no-user-output-enabled')
    })

    it('should return an error response if the project name is invalid', async () => {
      const projectName = ''
      const { error, message } = await configureGoogleProject(projectName)

      expect(error).toBe(true)
      expect(message).toBe('The Google Cloud project name is invalid.')
    })
  })
})

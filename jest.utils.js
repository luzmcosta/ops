/**
 * @file Jest Utilities
 * @module jest.utils
 * @doc test
 */

import { jest } from '@jest/globals'

export const generateRandomValue = () => Math.random().toString(36).substring(7)

export const mockConsoleMethod = (method, expectedOutput) => {
  return jest.spyOn(console, method).mockImplementation((arg) => arg)
}

export const mockConsoleMethods = (consoleMock, consoleMethods) => {
  return consoleMethods.reduce((context, method) => {
    context[method] = mockConsoleMethod(method)

    return context
  }, consoleMock)
}

export const restoreConsoleMethod = (consoleMock, method) => {
  consoleMock[method].mockRestore()
}

export const restoreConsoleMethods = (consoleMock, consoleMethods) => {
  return consoleMethods.forEach((method) => {
    restoreConsoleMethod(consoleMock, method)
  })
}

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts','js','json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {useESM: true}]
  },
  extensionsToTreatAsEsm: ['.ts'],
  globals: {},
  moduleNameMapper: {},
  verbose: false
};

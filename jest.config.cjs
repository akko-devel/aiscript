module.exports = {
  collectCoverageFrom: ['./src/**/*.ts'],
  coverageDirectory: './coverage',
  coverageProvider: 'v8',
  preset: 'ts-jest/presets/js-with-ts-esm',
  resolver: 'ts-jest-resolver',
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '<rootDir>/test/**/*'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        diagnostics: {
          exclude: ['!/test/**/*.ts']
        },
        useESM: true
      }
    ]
  }
}

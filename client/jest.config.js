module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', 'jest-fetch-mock'],
  moduleNameMapper: {
    '^@/(.+)': '<rootDir>/src/$1',
  },
};

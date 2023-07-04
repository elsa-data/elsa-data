module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/db-tests/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
};

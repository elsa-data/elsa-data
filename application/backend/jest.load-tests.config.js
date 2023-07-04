module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/load-tests/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
};

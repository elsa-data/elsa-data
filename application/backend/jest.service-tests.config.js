module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/service-tests/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
};

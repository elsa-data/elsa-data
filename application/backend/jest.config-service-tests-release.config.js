module.exports = {
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/service-tests/**/release*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
};

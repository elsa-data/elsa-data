module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/integration-tests/**/*.test.ts"],
};

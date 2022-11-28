module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/integration-tests/**/*.test.ts"],
};

module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/db-tests/**/*.test.ts"],
};

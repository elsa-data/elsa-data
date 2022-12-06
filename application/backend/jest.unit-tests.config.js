module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/unit-tests/**/*.test.ts"],
};

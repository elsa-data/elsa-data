module.exports = {
  preset: "ts-jest",
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/service-tests/**/release*.test.ts"],
};

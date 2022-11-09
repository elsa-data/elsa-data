module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],

  globals: {
    "ts-jest": {
      // ts-jest configuration goes here
    },
  },
};

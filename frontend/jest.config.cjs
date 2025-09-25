/**
 * Jest configuration for the frontend (Next.js + TypeScript)
 * - jsdom environment
 * - ts-jest transformer with ESM support
 * - Testing Library setup
 */

module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "http://localhost/",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "ESNext",
          target: "ES2020",
        },
        useESM: true,
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["<rootDir>/tests/**/*.(test|spec).{ts,tsx}"],
  passWithNoTests: true,
  moduleNameMapper: {
    // Mock CSS imports if ever used
    "^.+\\.(css|less|scss|sass)$": "<rootDir>/tests/__mocks__/styleMock.js",
  },
};

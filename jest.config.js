module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/types/**',
        '!src/server.ts'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts']
};

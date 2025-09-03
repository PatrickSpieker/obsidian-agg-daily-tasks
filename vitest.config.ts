import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable TypeScript support
    globals: true,
    environment: 'node',
    // Test file patterns
    include: ['**/*.test.ts', '**/*.spec.ts'],
    // Exclude node_modules and build outputs
    exclude: ['node_modules', 'lib', '*.js'],
  },
});
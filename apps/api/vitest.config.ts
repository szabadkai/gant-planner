import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80
      },
      exclude: [
        'prisma/**',
        'dist/**',
        'node_modules/**',
        '**/*.config.*',
        '**/*.d.ts'
      ]
    },
    globals: true
  }
});
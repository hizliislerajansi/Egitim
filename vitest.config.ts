import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, '**/* [(]1[)].test.ts'],
  },
});

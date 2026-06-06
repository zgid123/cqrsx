import { defineProject } from 'vitest/config';

export default defineProject({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: {
      label: 'core',
      color: 'cyan',
    },
    globals: true,
    include: ['src/__tests__/**/*.spec.ts'],
  },
});

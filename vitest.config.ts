import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      config: path.resolve(__dirname, 'src/config'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      modules: path.resolve(__dirname, 'src/modules'),
      obsidian: path.resolve(__dirname, 'tests/unit/mocks/obsidian.ts'),
      plugin: path.resolve(__dirname, 'src/plugin'),
      settings: path.resolve(__dirname, 'src/settings.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    setupFiles: ['tests/unit/setup.ts'],
  },
})

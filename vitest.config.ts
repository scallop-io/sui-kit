import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.js', '.mts', '.mjs'],
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    include: ['test/**/*.spec.ts'],
  },
  esbuild: {
    target: 'es2022',
  },
});

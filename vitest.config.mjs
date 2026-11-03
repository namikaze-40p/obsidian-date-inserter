import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // The obsidian package only ships types, so it has no runtime code to import.
      obsidian: fileURLToPath(new URL('./test/stubs/obsidian.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    // vanillajs-datepicker calls document.createRange() when it is imported.
    environment: 'happy-dom',
    setupFiles: ['test/setup.ts'],
  },
});

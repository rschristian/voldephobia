import { defineConfig } from '@sovereignjs/core';
import groupingPlugin from 'vite-plugin-tailwind-grouping';

export default defineConfig({
    plugins: [{
        ...groupingPlugin(),
        apply: 'build',
    }],
});

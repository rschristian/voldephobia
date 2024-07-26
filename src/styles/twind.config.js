import { defineConfig } from '@twind/core';
import presetTailwind from '@twind/preset-tailwind';

export const twindConfig = defineConfig({
    darkMode: 'class',
    presets: [presetTailwind()],
    ignorelist: ['dark', 'loader', 'preact-hint', 'preact-hint__fade-in', 'preact-hint__content'],
    hash: false,
    theme: {
        colors: {
            primary: {
                dim: '#228822',
                DEFAULT: '#44bb44',
            },
            red: '#ff4444',
            content: {
                DEFAULT: '#24292f',
                dark: '#eee',
            },
            page: {
                DEFAULT: '#f6faf6',
                dark: '#1a201a',
            },
            card: {
                DEFAULT: '#f1f3f0',
                dark: '#121612',
            },
            input: {
                DEFAULT: '#fff',
                dark: '#eee',
            },
            highlight: {
                DEFAULT: '#ccc',
                dark: '#333',
            },
            white: {
                muted: '#999',
                DEFAULT: '#ffffff',
            },
            transparent: 'transparent',
        },
        fontSize: {
            xs: '.75rem',
            base: '1rem',
            '3xl': '1.875rem',
            '4xl': '2.5rem',
        },
    },
    variants: [['hocus', '&:hover,&:focus-visible']],
});

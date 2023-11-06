import { defineConfig } from '@twind/core';
import presetTailwind from '@twind/preset-tailwind';

export const twindConfig = defineConfig({
    darkMode: 'class',
    presets: [presetTailwind()],
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
            sm: '.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.5rem',
            '5xl': '3rem',
            '6xl': '4rem',
            '7xl': '5rem',
        },
    },
    variants: [['hocus', '&:hover,&:focus-visible']],
});

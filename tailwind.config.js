import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    DEFAULT: '#261FB3',
                    hover: '#161179',
                    dark: '#0C0950',
                    light: '#D4D2F5',
                    accent: '#261FB3',
                },
                bootstrap: {
                    primary: '#0d6efd',
                    'primary-hover': '#0b5ed7',
                    secondary: '#6c757d',
                    success: '#198754',
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#0dcaf0',
                    dark: '#212529',
                },
            },
        },
    },

    plugins: [forms],
};

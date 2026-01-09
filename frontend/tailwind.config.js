/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                siac: {
                    dark: '#0f172a',
                    primary: '#3b82f6',
                    accent: '#06b6d4',
                }
            }
        },
    },
    plugins: [],
}

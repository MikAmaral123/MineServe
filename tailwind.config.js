/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: '#0f0f13',
                card: '#1a1a20',
                primary: '#6366f1',
                secondary: '#a855f7',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}

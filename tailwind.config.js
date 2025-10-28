// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'platerly-dark':  '#0B1F1F', // App background
        'platerly-light': '#112B2B', // Sidebar / nav
        'platerly-card':  '#173636', // Cards / form blocks
        'platerly-green': '#22C55E', // Accent green
        'platerly-yellow':'#F6C869', // Gold accent
        'platerly-cream': '#F5EBD0', // Light accent
        'platerly-text':  '#FAF3E6', // Primary text
        'platerly-subtle':'#A0A0A0', // (existing)
        // ✅ new tokens used by index.css utilities:
        'platerly-muted':  '#B9C7C7', // label/placeholder text
        'platerly-border': '#1E4949', // subtle borders
        'platerly-accent': '#22C55E', // alias for consistency
      },
    },
  },
  plugins: [],
}

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'recipzee-dark':  '#0B1F1F', // App background
        'recipzee-light': '#112B2B', // Sidebar / nav
        'recipzee-card':  '#173636', // Cards / form blocks
        'recipzee-green': '#22C55E', // Accent green
        'recipzee-yellow':'#F6C869', // Gold accent
        'recipzee-cream': '#F5EBD0', // Light accent
        'recipzee-text':  '#FAF3E6', // Primary text
        'recipzee-subtle':'#A0A0A0', // (existing)
        // ✅ new tokens used by index.css utilities:
        'recipzee-muted':  '#B9C7C7', // label/placeholder text
        'recipzee-border': '#1E4949', // subtle borders
        'recipzee-accent': '#22C55E', // alias for consistency
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          teal: '#075E54',
          lightTeal: '#128C7E',
          green: '#25D366',
          bg: '#ECE5DD',
          bubbleOut: '#DCF8C6',
          bubbleIn: '#FFFFFF',
          darkBg: '#111B21',
          darkHeader: '#202C33',
        },
        gmail: {
          red: '#EA4335',
          hoverRed: '#D93025',
          sidebarSelected: '#FCE8E6',
          sidebarTextSelected: '#D93025',
          bg: '#F6F8FC',
        }
      }
    },
  },
  plugins: [],
}

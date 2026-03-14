/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'vscode': {
          'bg': '#1e1e1e',
          'sidebar': '#252526',
          'active': '#37373d',
          'border': '#3c3c3c',
          'text': '#cccccc',
          'text-muted': '#858585',
          'accent': '#0078d4',
          'accent-hover': '#1a8cff',
          'tab-active': '#1e1e1e',
          'tab-inactive': '#2d2d2d',
          'input': '#3c3c3c',
          'input-border': '#4c4c4c',
          'success': '#4ec9b0',
          'warning': '#dcdcaa',
          'error': '#f44747',
          'info': '#569cd6',
        },
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

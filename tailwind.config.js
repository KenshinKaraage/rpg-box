/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      width: {
        'sidebar': '240px',
        'sidebar-sm': '200px',
        'sidebar-lg': '280px',
        'inspector': '300px',
      },
      height: {
        'header': '56px',
        'toolbar': '40px',
      },
      zIndex: {
        'modal': '100',
        'overlay': '90',
        'dropdown': '50',
        'header': '40',
      },
      // モーダルサイズ規約
      maxWidth: {
        'modal-sm': '400px',
        'modal-md': '500px',
        'modal-lg': '640px',
        'modal-xl': '800px',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

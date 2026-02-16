import { defineConfig } from 'vite'
import path from 'path'
// @ts-ignore
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Use __dirname to ensure it always points to your local src folder
      '@': path.resolve(__dirname, './src')
    },
  },
})
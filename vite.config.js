import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    open: true
  },
  // אותו origin כמו dev (5173) – כך ש-localStorage (הדוחות) משותף בין dev ל-preview.
  preview: {
    port: 5173,
    strictPort: true,
    open: true
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // בבנייה לאתר (GitHub Pages) האפליקציה מתארחת תחת /cleaning-programs/.
  // בפיתוח מקומי משאירים שורש '/' כדי שלא לשנות את כתובת ה-dev.
  base: command === 'build' ? '/cleaning-programs/' : '/',
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  // אותו origin כמו dev (5173) – כך ש-localStorage (הדוחות) משותף בין dev ל-preview.
  preview: {
    port: 5173,
    strictPort: true,
    open: true,
  },
}))

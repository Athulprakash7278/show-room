import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true, // binds to 0.0.0.0
    port: process.env.PORT || 4173,
    allowedHosts: ['show-room-gghh.onrender.com'], // your Render URL
  },
})

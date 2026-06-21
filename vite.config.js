import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/PetTracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Funky Pet Tracker',
        short_name: 'PetTracker',
        description: 'A fun and funky pet tracking PWA',
        theme_color: '#ff477e',
        icons: [
          {
            src: 'https://placehold.co/192x192/ff477e/ffffff.png?text=Pet',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://placehold.co/512x512/ff477e/ffffff.png?text=Pet',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})

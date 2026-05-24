import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(() => ({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, '/')

          if (!moduleId.includes('/node_modules/')) {
            return undefined
          }

          if (moduleId.includes('/node_modules/react/') || moduleId.includes('/node_modules/react-dom/') || moduleId.includes('/node_modules/react-router-dom/') || moduleId.includes('/node_modules/@remix-run/') || moduleId.includes('/node_modules/scheduler/')) {
            return 'react-vendor'
          }

          if (moduleId.includes('/node_modules/@radix-ui/') || moduleId.includes('/node_modules/lucide-react/') || moduleId.includes('/node_modules/class-variance-authority/') || moduleId.includes('/node_modules/clsx/') || moduleId.includes('/node_modules/tailwind-merge/') || moduleId.includes('/node_modules/sonner/')) {
            return 'ui-vendor'
          }

          if (moduleId.includes('/node_modules/recharts/') || moduleId.includes('/node_modules/d3-')) {
            return 'charts-vendor'
          }

          if (moduleId.includes('/node_modules/@react-three/drei/')) {
            return 'react-three-drei'
          }

          if (moduleId.includes('/node_modules/@react-three/fiber/')) {
            return 'react-three-fiber'
          }

          if (moduleId.includes('/node_modules/three/examples/')) {
            return 'three-examples'
          }

          if (moduleId.includes('/node_modules/three/')) {
            return 'three-core'
          }

          if (moduleId.includes('/node_modules/xlsx/')) {
            return 'xlsx-vendor'
          }

          if (moduleId.includes('/node_modules/react-hook-form/') || moduleId.includes('/node_modules/@hookform/') || moduleId.includes('/node_modules/zod/')) {
            return 'forms-vendor'
          }

          if (moduleId.includes('/node_modules/framer-motion/') || moduleId.includes('/node_modules/gsap/') || moduleId.includes('/node_modules/@gsap/')) {
            return 'motion-vendor'
          }

          if (moduleId.includes('/node_modules/zustand/') || moduleId.includes('/node_modules/immer/')) {
            return 'state-vendor'
          }

          if (moduleId.includes('/node_modules/date-fns/')) {
            return 'date-vendor'
          }

          return undefined
        },
      },
    },
  },
}))

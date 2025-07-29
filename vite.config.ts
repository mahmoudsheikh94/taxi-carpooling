import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react(),
      
      // Sentry plugin for production builds
      ...(isProd && process.env.VITE_SENTRY_DSN
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              authToken: process.env.SENTRY_AUTH_TOKEN,
              
              // Upload source maps to Sentry
              sourcemaps: {
                assets: './dist/**',
                ignore: ['node_modules'],
                filesToDeleteAfterUpload: './dist/**/*.map',
              },
              
              // Release configuration
              release: {
                name: process.env.VITE_BUILD_VERSION || 'unknown',
                finalize: true,
                deploy: {
                  env: 'production',
                },
              },
            }),
          ]
        : []),
    ],
    
    // Build configuration
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProd, // Generate source maps for production
      
      // Optimize bundle
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
            'ui-vendor': ['@headlessui/react', '@heroicons/react'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'maps-vendor': ['@googlemaps/js-api-loader'],
            
            // Feature chunks
            'chat-features': [
              './src/components/chat',
              './src/services/supabase/chat.ts',
              './src/services/supabase/typing.ts',
            ],
            'matching-features': [
              './src/components/matching',
              './src/services/matching',
            ],
            'pwa-features': [
              './src/utils/pwa.ts',
              './src/components/ui/InstallPrompt.tsx',
              './src/components/ui/OfflineIndicator.tsx',
            ],
          },
          
          // Asset naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
        
        // External dependencies (if needed)
        external: [],
      },
      
      // Minification
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          safari10: true,
        },
      } : undefined,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
    },
    
    // Development server
    server: {
      port: 5173,
      host: true,
      open: true,
      
      // Proxy configuration for API calls if needed
      proxy: {
        // Add proxy rules if needed
      },
    },
    
    // Preview server
    preview: {
      port: 4173,
      host: true,
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/constants': path.resolve(__dirname, './src/constants'),
        '@/config': path.resolve(__dirname, './src/config'),
      },
    },
    
    // Environment variables
    define: {
      __BUILD_VERSION__: JSON.stringify(
        process.env.VITE_BUILD_VERSION || 
        process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
        `dev-${Date.now()}`
      ),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    
    // CSS configuration
    css: {
      devSourcemap: !isProd,
      postcss: './postcss.config.js',
    },
    
    // Optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'zustand',
        'zod',
        'react-hook-form',
        '@hookform/resolvers',
      ],
      exclude: [
        '@googlemaps/js-api-loader', // Load dynamically
      ],
    },
    
    // Worker configuration
    worker: {
      format: 'es',
      plugins: [],
    },
  };
});

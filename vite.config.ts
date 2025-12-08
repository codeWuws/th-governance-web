import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production'

    return {
        base: '/dataflow/',
        plugins: [
            react(),
            // Gzip 压缩
            viteCompression({
                verbose: true,
                disable: false,
                threshold: 10240,
                algorithm: 'gzip',
                ext: '.gz',
            }),
            // Brotli 压缩
            viteCompression({
                verbose: true,
                disable: false,
                threshold: 10240,
                algorithm: 'brotliCompress',
                ext: '.br',
            }),
            // 打包分析
            isProduction &&
            visualizer({
                filename: 'dist/stats.html',
                open: true,
                gzipSize: true,
                brotliSize: true,
            }),
        ].filter(Boolean),
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
                '@/components': resolve(__dirname, 'src/components'),
                '@/pages': resolve(__dirname, 'src/pages'),
                '@/hooks': resolve(__dirname, 'src/hooks'),
                '@/utils': resolve(__dirname, 'src/utils'),
                '@/types': resolve(__dirname, 'src/types'),
                '@/assets': resolve(__dirname, 'src/assets'),
                '@/styles': resolve(__dirname, 'src/styles'),
            },
        },
        server: {
            port: 3000,
            open: true,
            host: true,
            cors: true,
            proxy: {
                '/api': {
                    target: 'http://192.168.110.34:8888',
                    changeOrigin: true,
                    rewrite: path => path.replace(/^\/api/, ''),
                    configure: (proxy, _options) => {
                        proxy.on('error', (err, _req, _res) => {
                            console.log('proxy error', err)
                        })
                        proxy.on('proxyReq', (_proxyReq, req, _res) => {
                            console.log('Sending Request to the Target:', req.method, req.url)
                        })
                        proxy.on('proxyRes', (proxyRes, req, _res) => {
                            console.log(
                                'Received Response from the Target:',
                                proxyRes.statusCode,
                                req.url
                            )
                        })
                    },
                },
            },
        },
        build: {
            rollupOptions: {
                output: {
                    chunkFileNames: 'assets/js/[name]-[hash].js',
                    entryFileNames: 'assets/js/[name]-[hash].js',
                    assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                    manualChunks(id) {
                        // id为文件的绝对路径
                        if (id.includes('node_modules/.pnpm')) {
                            return id.toString().split('node_modules/.pnpm/')[1].split('/')[0].toString();
                        }
                        if (id.includes('node_modules')) {
                            return id.toString().split('node_modules/')[1].split('/')[0].toString();
                        }
                    },
                },
            },
        },
        esbuild: isProduction ? { drop: ['console', 'debugger'] } : undefined,
        // 优化依赖
        optimizeDeps: {
            include: ['react', 'react-dom'],
            exclude: ['@vitejs/plugin-react'],
        },
        // CSS 预处理器选项
        css: {
            devSourcemap: !isProduction,
            modules: {
                // CSS Modules 配置
                localsConvention: 'camelCaseOnly',
                generateScopedName: isProduction
                    ? '[hash:base64:8]'
                    : '[name]__[local]___[hash:base64:5]',
                hashPrefix: 'th-governance',
            },
            preprocessorOptions: {
                scss: {
                    additionalData: `@use "@/styles/variables.scss" as *; @use "@/styles/mixins.scss" as *;`,
                    charset: false,
                },
            },
            postcss: './postcss.config.js',
        },
    }
})

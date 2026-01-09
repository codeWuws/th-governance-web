import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import './index.scss'
import { store } from './store'
import { registerAllMockProviders } from './utils/mockProviders'
import { getVersionInfo } from './utils/versionControl'
import { logger } from './utils/logger'
import { loadRuntimeConfig } from './utils/configLoader'
import { request } from './utils/request'

/**
 * 初始化应用
 * 在应用启动前加载运行时配置
 */
const initApp = async () => {
    try {
        // 加载运行时配置
        const config = await loadRuntimeConfig()
        
        // 更新 axios 实例的配置
        request.defaults.baseURL = config.apiBaseUrl
        request.defaults.timeout = config.apiTimeout
        
        // 初始化模拟数据提供者（仅在需要时注册）
        registerAllMockProviders()

        // 打印版本信息（开发环境）
        if (import.meta.env.DEV) {
            const versionInfo = getVersionInfo()
            logger.info('应用版本信息:', versionInfo)
            console.log('🚀 应用启动', {
                版本: versionInfo.version,
                模式: versionInfo.isDemo ? '演示版本（仅数据治理模块使用真实接口）' : '开发版本（所有模块使用真实接口）',
            })
        }

        // 渲染应用
        const root = document.getElementById('root')
        if (!root) {
            throw new Error('未找到 root 元素')
        }

        createRoot(root).render(
            <StrictMode>
                <Provider store={store}>
                    <App />
                </Provider>
            </StrictMode>
        )
    } catch (error) {
        console.error('应用初始化失败:', error)
        // 显示错误信息给用户
        const root = document.getElementById('root')
        if (root) {
            root.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: sans-serif;">
                    <h1 style="color: #ff4d4f;">应用初始化失败</h1>
                    <p style="color: #666;">${error instanceof Error ? error.message : '未知错误'}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">请检查配置文件或联系管理员</p>
                </div>
            `
        }
    }
}

// 启动应用
initApp()

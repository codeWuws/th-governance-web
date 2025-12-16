import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import './index.scss'
import { store } from './store'
import { registerAllMockProviders } from './utils/mockProviders'
import { getVersionInfo } from './utils/versionControl'
import { logger } from './utils/logger'

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

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>
)

/**
 * 环境变量工具函数
 */

// 获取环境变量
export const getEnv = (key: string, defaultValue?: string): string => {
    return import.meta.env[key] || defaultValue || ''
}

// 检查是否为开发环境
export const isDevelopment = (): boolean => {
    return import.meta.env.MODE === 'development'
}

// 检查是否为生产环境
export const isProduction = (): boolean => {
    return import.meta.env.MODE === 'production'
}

// 检查是否为测试环境
export const isTest = (): boolean => {
    return import.meta.env.MODE === 'test'
}

// 获取应用配置
export const getAppConfig = () => {
    return {
        title: getEnv('VITE_APP_TITLE', 'React App'),
        version: getEnv('VITE_APP_VERSION', '1.0.0'),
        env: getEnv('VITE_APP_ENV', 'development'),
        apiBaseUrl: getEnv('VITE_APP_API_BASE_URL', 'http://localhost:8080/api'),
        apiTimeout: Number(getEnv('VITE_APP_API_TIMEOUT', '10000')),
        enableDevtools: getEnv('VITE_APP_ENABLE_DEVTOOLS', 'false') === 'true',
        enableAnalytics: getEnv('VITE_APP_ENABLE_ANALYTICS', 'false') === 'true',
        logLevel: getEnv('VITE_APP_LOG_LEVEL', 'info'),
        showPerformance: getEnv('VITE_APP_SHOW_PERFORMANCE', 'false') === 'true',
    }
}

// 打印环境信息
export const printEnvInfo = () => {
    if (isDevelopment()) {
        const config = getAppConfig()
        console.group('🚀 应用环境信息')
        console.log('📦 应用名称:', config.title)
        console.log('🏷️ 版本号:', config.version)
        console.log('🌍 环境:', config.env)
        console.log('🔗 API地址:', config.apiBaseUrl)
        console.log('⏱️ 超时时间:', config.apiTimeout + 'ms')
        console.log('🛠️ 开发工具:', config.enableDevtools ? '开启' : '关闭')
        console.groupEnd()
    }
}

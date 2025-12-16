/**
 * 环境变量工具函数
 * 提供统一的环境变量读取和配置管理
 */

/**
 * 获取环境变量
 * @param key 环境变量键名（必须以 VITE_ 开头）
 * @param defaultValue 默认值（当环境变量不存在时使用）
 * @returns 环境变量的值或默认值
 */
export const getEnv = (key: string, defaultValue?: string): string => {
    return import.meta.env[key] || defaultValue || ''
}

/**
 * 检查是否为开发环境
 * @returns 是否为开发环境
 */
export const isDevelopment = (): boolean => {
    return import.meta.env.MODE === 'development'
}

/**
 * 检查是否为生产环境
 * @returns 是否为生产环境
 */
export const isProduction = (): boolean => {
    return import.meta.env.MODE === 'production'
}

/**
 * 检查是否为测试环境
 * @returns 是否为测试环境
 */
export const isTest = (): boolean => {
    return import.meta.env.MODE === 'test'
}

/**
 * 获取应用配置
 * 从环境变量中读取所有应用配置信息
 * @returns 应用配置对象
 */
export const getAppConfig = () => {
    return {
        // 应用标题
        title: getEnv('VITE_APP_TITLE', 'React App'),
        // 应用版本（注意：这里获取的是版本号，版本模式请使用 versionControl.ts 中的 getAppVersion）
        version: getEnv('VITE_APP_VERSION', '1.0.0'),
        // 应用环境
        env: getEnv('VITE_APP_ENV', 'development'),
        // API 基础地址
        apiBaseUrl: getEnv('VITE_APP_API_BASE_URL', 'http://localhost:8080/api'),
        // API 请求超时时间（毫秒）
        apiTimeout: Number(getEnv('VITE_APP_API_TIMEOUT', '10000')),
        // 是否启用开发工具
        enableDevtools: getEnv('VITE_APP_ENABLE_DEVTOOLS', 'false') === 'true',
        // 是否启用分析统计
        enableAnalytics: getEnv('VITE_APP_ENABLE_ANALYTICS', 'false') === 'true',
        // 日志级别
        logLevel: getEnv('VITE_APP_LOG_LEVEL', 'info'),
        // 是否显示性能监控
        showPerformance: getEnv('VITE_APP_SHOW_PERFORMANCE', 'false') === 'true',
    }
}

/**
 * 打印环境信息
 * 在开发环境下，将应用配置信息输出到控制台
 */
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

/**
 * 配置加载工具
 * 从 public/config.json 动态加载应用配置，支持线上修改配置而无需重新构建
 */

// 配置文件原始格式接口
interface ConfigFileFormat {
    // 新格式：api_url
    api_url?: string
    // 旧格式兼容：apiBaseUrl
    apiBaseUrl?: string
    // API 请求超时时间（毫秒）
    apiTimeout?: number
}

// 应用配置接口
export interface AppRuntimeConfig {
    // API 基础地址（完整URL，如：http://192.168.110.34:8888/api 或相对路径 /api）
    apiBaseUrl: string
    // API 请求超时时间（毫秒）
    apiTimeout: number
}

// 默认配置
const defaultConfig: AppRuntimeConfig = {
    apiBaseUrl: '/api',
    apiTimeout: 10000,
}

// 全局配置缓存
let runtimeConfig: AppRuntimeConfig | null = null
let configLoadPromise: Promise<AppRuntimeConfig> | null = null

/**
 * 加载运行时配置
 * 从 public/config.json 文件加载配置，如果加载失败则使用默认配置
 * @returns 配置对象
 */
export const loadRuntimeConfig = async (): Promise<AppRuntimeConfig> => {
    // 如果已经加载过，直接返回缓存的配置
    if (runtimeConfig) {
        return runtimeConfig
    }

    // 如果正在加载，返回同一个 Promise
    if (configLoadPromise) {
        return configLoadPromise
    }

    // 开始加载配置
    configLoadPromise = (async () => {
        try {
            // 获取配置文件路径（相对于 public 目录）
            const configUrl = `${import.meta.env.BASE_URL}config.json?t=${Date.now()}`
            
            const response = await fetch(configUrl)
            
            if (!response.ok) {
                throw new Error(`加载配置文件失败: ${response.status} ${response.statusText}`)
            }

            const config = await response.json() as ConfigFileFormat
            
            // 将配置文件格式转换为应用配置格式
            // 优先使用新格式 api_url，如果没有则使用旧格式 apiBaseUrl
            const apiBaseUrl = config.api_url || config.apiBaseUrl || defaultConfig.apiBaseUrl
            const apiTimeout = config.apiTimeout ?? defaultConfig.apiTimeout
            
            // 合并默认配置和加载的配置
            runtimeConfig = {
                ...defaultConfig,
                apiBaseUrl,
                apiTimeout,
            }

            // 开发环境下输出配置信息
            if (import.meta.env.DEV) {
                console.log('📋 已加载运行时配置:', runtimeConfig)
            }

            return runtimeConfig
        } catch (error) {
            console.warn('⚠️ 加载配置文件失败，使用默认配置:', error)
            
            // 加载失败时使用默认配置
            runtimeConfig = { ...defaultConfig }
            return runtimeConfig
        } finally {
            // 清除加载 Promise，允许重新加载
            configLoadPromise = null
        }
    })()

    return configLoadPromise
}

/**
 * 获取运行时配置
 * 如果配置未加载，返回默认配置
 * @returns 配置对象
 */
export const getRuntimeConfig = (): AppRuntimeConfig => {
    return runtimeConfig || defaultConfig
}

/**
 * 重新加载配置
 * 用于配置更新后重新加载
 * @returns 配置对象
 */
export const reloadRuntimeConfig = async (): Promise<AppRuntimeConfig> => {
    runtimeConfig = null
    configLoadPromise = null
    const config = await loadRuntimeConfig()
    
    // 通知配置更新（用于更新 axios 实例等）
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('runtimeConfigUpdated', { detail: config }))
    }
    
    return config
}


/**
 * 版本控制工具
 * 支持演示版本和开发版本的切换
 * 演示版本：只保留数据治理模块的接口，其他模块使用模拟数据
 * 开发版本：所有模块都支持接口调用
 */

import { getEnv } from './env'

/**
 * 应用版本类型
 */
export type AppVersion = 'demo' | 'dev'

/**
 * 数据治理模块的接口路径前缀
 * 这些路径在演示版本中会正常调用接口
 */
const DATA_GOVERNANCE_PATHS = [
    '/data/governance', // 数据治理核心接口
]

/**
 * 判断是否为数据治理模块的接口
 * @param url 请求URL
 * @returns 是否为数据治理模块接口
 */
export const isDataGovernanceApi = (url: string): boolean => {
    if (!url) return false
    
    // 处理相对路径和绝对路径
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`
    
    return DATA_GOVERNANCE_PATHS.some(path => normalizedUrl.startsWith(path))
}

/**
 * 获取当前应用版本
 * @returns 应用版本类型
 */
export const getAppVersion = (): AppVersion => {
    const version = getEnv('VITE_APP_VERSION', 'dev').toLowerCase()
    return version === 'demo' ? 'demo' : 'dev'
}

/**
 * 判断是否为演示版本
 * @returns 是否为演示版本
 */
export const isDemoVersion = (): boolean => {
    return getAppVersion() === 'demo'
}

/**
 * 判断是否为开发版本
 * @returns 是否为开发版本
 */
export const isDevVersion = (): boolean => {
    return getAppVersion() === 'dev'
}

/**
 * 判断某个接口是否应该使用模拟数据
 * @param url 请求URL
 * @returns 是否应该使用模拟数据
 */
export const shouldUseMockData = (url: string): boolean => {
    // 开发版本：不使用模拟数据（除非模块自己配置了）
    if (isDevVersion()) {
        return false
    }
    
    // 演示版本：只有数据治理模块使用真实接口，其他模块使用模拟数据
    return !isDataGovernanceApi(url)
}

/**
 * 获取版本信息（用于日志和调试）
 */
export const getVersionInfo = () => {
    return {
        version: getAppVersion(),
        isDemo: isDemoVersion(),
        isDev: isDevVersion(),
    }
}


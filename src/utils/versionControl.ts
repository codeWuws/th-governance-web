/**
 * 版本控制工具
 * 支持演示版本和开发版本的切换
 * 
 * 版本模式说明：
 * - 演示版本（demo）：只保留数据治理模块的接口，其他模块使用模拟数据
 * - 开发版本（dev）：所有模块都支持接口调用（默认）
 * 
 * 配置方式：
 * 在 .env 文件中设置 VITE_APP_VERSION 环境变量
 * - VITE_APP_VERSION=demo  # 演示版本
 * - VITE_APP_VERSION=dev   # 开发版本（默认）
 */

import { getEnv } from './env'

/**
 * 应用版本类型
 * - demo: 演示版本
 * - dev: 开发版本
 */
export type AppVersion = 'demo' | 'dev'

/**
 * 数据治理模块的接口路径前缀
 * 这些路径在演示版本中会正常调用真实接口，不使用模拟数据
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
    
    // 处理相对路径和绝对路径，统一转换为以 / 开头的格式
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`
    
    // 检查 URL 是否以数据治理模块的路径前缀开头
    return DATA_GOVERNANCE_PATHS.some(path => normalizedUrl.startsWith(path))
}

/**
 * 获取当前应用版本
 * 从环境变量 VITE_APP_VERSION 读取版本配置
 * @returns 应用版本类型，默认为 'dev'
 */
export const getAppVersion = (): AppVersion => {
    // 从环境变量读取版本配置，默认值为 'dev'
    const version = getEnv('VITE_APP_VERSION', 'dev').toLowerCase()
    // 只接受 'demo' 或 'dev'，其他值统一返回 'dev'
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
 * 
 * 规则说明：
 * - 开发版本：不使用模拟数据（所有接口都调用真实接口）
 * - 演示版本：只有数据治理模块使用真实接口，其他模块使用模拟数据
 * 
 * @param url 请求URL
 * @returns 是否应该使用模拟数据
 */
export const shouldUseMockData = (url: string): boolean => {
    // 开发版本：不使用模拟数据（除非模块自己配置了）
    if (isDevVersion()) {
        return false
    }
    
    // 演示版本：只有数据治理模块使用真实接口，其他模块使用模拟数据
    // 如果 URL 不是数据治理模块的接口，则使用模拟数据
    return !isDataGovernanceApi(url)
}

/**
 * 获取版本信息（用于日志和调试）
 * @returns 版本信息对象
 */
export const getVersionInfo = () => {
    return {
        version: getAppVersion(),
        isDemo: isDemoVersion(),
        isDev: isDevVersion(),
    }
}


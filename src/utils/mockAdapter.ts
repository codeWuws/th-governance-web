/**
 * 模拟数据适配器
 * 统一管理各模块的模拟数据，支持版本切换
 * 
 * 工作原理：
 * 1. 在请求发送前，通过 handleMockRequest 检查是否应该使用模拟数据
 * 2. shouldUseMockData 函数根据当前版本模式（dev/demo）和请求URL判断
 * 3. 如果是演示版本且非数据治理模块，则使用模拟数据
 * 4. 如果是开发版本，则所有请求都使用真实接口
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { shouldUseMockData } from './versionControl'
import { logger } from './logger'

/**
 * 模拟数据提供者接口
 */
export interface MockDataProvider {
    /**
     * 获取模拟数据
     * @param config 请求配置
     * @returns 模拟数据响应
     */
    getMockData: (config: AxiosRequestConfig) => Promise<AxiosResponse>
}

/**
 * 模拟数据注册表
 * 存储各模块的模拟数据提供者
 */
const mockDataRegistry = new Map<string, MockDataProvider>()

/**
 * 注册模拟数据提供者
 * @param pattern URL匹配模式（支持字符串匹配或正则表达式）
 * @param provider 模拟数据提供者
 */
export const registerMockData = (
    pattern: string | RegExp,
    provider: MockDataProvider
): void => {
    const key = pattern instanceof RegExp ? pattern.toString() : pattern
    mockDataRegistry.set(key, provider)
    logger.debug(`已注册模拟数据提供者: ${key}`)
}

/**
 * 查找匹配的模拟数据提供者
 * @param url 请求URL
 * @returns 匹配的模拟数据提供者，如果没有则返回null
 */
const findMockProvider = (url: string): MockDataProvider | null => {
    for (const [pattern, provider] of mockDataRegistry.entries()) {
        // 正则表达式匹配
        if (pattern.startsWith('/') && pattern.endsWith('/')) {
            try {
                const regex = new RegExp(pattern.slice(1, -1))
                if (regex.test(url)) {
                    return provider
                }
            } catch (error) {
                logger.warn(`无效的正则表达式模式: ${pattern}`, error)
            }
        }
        // 字符串匹配
        else if (url.includes(pattern)) {
            return provider
        }
    }
    return null
}

/**
 * 处理模拟数据请求
 * 根据版本控制逻辑判断是否使用模拟数据
 * 
 * @param config 请求配置
 * @returns 模拟数据响应，如果不应该使用模拟数据则返回 null
 */
export const handleMockRequest = async (
    config: AxiosRequestConfig
): Promise<AxiosResponse | null> => {
    const url = config.url || ''
    
    // 通过版本控制逻辑判断是否应该使用模拟数据
    // shouldUseMockData 会根据当前版本模式（dev/demo）和URL路径进行判断
    if (!shouldUseMockData(url)) {
        // 不应该使用模拟数据，返回 null 让请求继续发送到真实接口
        return null
    }
    
    // 查找匹配的模拟数据提供者
    const provider = findMockProvider(url)
    if (!provider) {
        // 虽然应该使用模拟数据，但没有找到对应的提供者
        // 这种情况在演示版本中不应该发生，记录警告日志
        logger.warn(`未找到匹配的模拟数据提供者: ${url}`)
        return null
    }
    
    try {
        // 使用模拟数据，记录日志
        logger.info(`使用模拟数据: ${config.method?.toUpperCase()} ${url}`)
        const mockResponse = await provider.getMockData(config)
        return mockResponse
    } catch (error) {
        // 模拟数据生成失败，抛出错误
        logger.error(`模拟数据生成失败: ${url}`, error)
        throw error
    }
}

/**
 * 创建简单的模拟响应
 * @param data 响应数据
 * @param status HTTP状态码
 * @param statusText 状态文本
 * @returns Axios响应对象
 */
export const createMockResponse = <T = unknown>(
    data: T,
    status = 200,
    statusText = 'OK'
): AxiosResponse<T> => {
    return {
        data: {
            code: 200,
            msg: 'success',
            data,
        } as unknown as T,
        status,
        statusText,
        headers: {},
        config: {} as AxiosRequestConfig,
    }
}

/**
 * 创建模拟错误响应
 * @param message 错误消息
 * @param status HTTP状态码
 * @returns 抛出错误
 */
export const createMockError = (message: string, status = 500): never => {
    const error = new Error(message) as Error & {
        response?: AxiosResponse
        config?: AxiosRequestConfig
    }
    error.response = {
        data: {
            code: status,
            msg: message,
            data: null,
        },
        status,
        statusText: 'Error',
        headers: {},
        config: {} as AxiosRequestConfig,
    } as AxiosResponse
    throw error
}


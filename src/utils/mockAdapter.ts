/**
 * 模拟数据适配器
 * 统一管理各模块的模拟数据，支持版本切换
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
 * @param config 请求配置
 * @returns 模拟数据响应
 */
export const handleMockRequest = async (
    config: AxiosRequestConfig
): Promise<AxiosResponse | null> => {
    const url = config.url || ''
    
    // 判断是否应该使用模拟数据
    if (!shouldUseMockData(url)) {
        return null
    }
    
    // 查找匹配的模拟数据提供者
    const provider = findMockProvider(url)
    if (!provider) {
        logger.warn(`未找到匹配的模拟数据提供者: ${url}`)
        return null
    }
    
    try {
        logger.info(`使用模拟数据: ${config.method?.toUpperCase()} ${url}`)
        const mockResponse = await provider.getMockData(config)
        return mockResponse
    } catch (error) {
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


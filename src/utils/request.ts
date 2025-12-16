import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios'
import { getEnv } from './env'
import { logger } from './logger'
import { handleMockRequest } from './mockAdapter'

// 扩展 InternalAxiosRequestConfig 接口
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number
        }
    }
}

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
    skipErrorHandler?: boolean // 是否跳过全局错误处理
    showLoading?: boolean // 是否显示加载状态
    timeout?: number // 请求超时时间
    returnDataOnly?: boolean // 是否只返回data字段，默认false返回完整响应对象（包含code、msg、data）
}

// API 响应数据结构
export interface ApiResponse<T = unknown> {
    code: number
    msg: string
    data: T
}

// 错误响应结构
export interface ApiError {
    code: number
    msg: string
    details?: unknown
}

// 请求状态枚举
export const RequestStatus = {
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error',
} as const

export type RequestStatusType = (typeof RequestStatus)[keyof typeof RequestStatus]

// 生成请求 ID
const generateRequestId = (): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 错误处理函数
const handleApiError = (error: AxiosError): Promise<never> => {
    const { response, code } = error

    // 网络错误
    if (!response) {
        if (code === 'ECONNABORTED') {
            return Promise.reject(new Error('请求超时，请稍后重试'))
        }
        if (code === 'ERR_NETWORK') {
            return Promise.reject(new Error('网络连接失败，请检查网络'))
        }
        return Promise.reject(new Error('网络错误，请稍后重试'))
    }

    const { status, data } = response

    // 401状态码特殊处理：清除本地凭证
    if (status === 401) {
        // 未授权：清除本地凭证，但不进行路由跳转，交由调用方自行处理
        // 说明：当前项目没有 /login 页面，且用户期望在错误时不跳转页面
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }

    // 所有非200状态码统一处理：优先返回后端提供的msg
    const errorData = data as { msg?: string }
    const errorMessage = errorData?.msg || `请求失败 (${status})`
    
    return Promise.reject(new Error(errorMessage))
}

// 创建自定义 adapter 以支持模拟数据
const createCustomAdapter = (): ((config: InternalAxiosRequestConfig) => Promise<AxiosResponse>) => {
    return async (config: InternalAxiosRequestConfig) => {
        // 检查是否应该使用模拟数据
        const mockResponse = await handleMockRequest(config)
        if (mockResponse) {
            // 直接返回模拟响应，不发送真实请求
            // 确保响应对象包含 config
            mockResponse.config = config
            return mockResponse
        }
        
        // 使用默认的 adapter 发送真实请求
        // 获取默认的 adapter（xhr 或 http）
        const defaultAdapter = axios.getAdapter(['xhr', 'http'])
        return defaultAdapter(config)
    }
}

// 创建 Axios 实例
const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: getEnv('VITE_APP_API_BASE_URL', '/api'),
        timeout: parseInt(getEnv('VITE_APP_API_TIMEOUT', '10000')),
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        // 允许携带 cookies
        withCredentials: true,
        // 使用自定义 adapter 支持模拟数据
        adapter: createCustomAdapter(),
    })

    return instance
}

// 创建请求实例
const request: AxiosInstance = createAxiosInstance()

// 请求拦截器
request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const startTime = Date.now()
        config.metadata = { startTime }

        // 添加认证 token
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求 ID 用于追踪
        config.headers['X-Request-ID'] = generateRequestId()

        // 开发环境下记录请求日志
        logger.debug('API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            params: config.params,
            data: config.data,
            headers: config.headers,
        })

        return config
    },
    (error: AxiosError) => {
        logger.error('Request Error:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
        const { config, data } = response
        const endTime = Date.now()
        const duration =
            endTime -
            ((config as InternalAxiosRequestConfig & { metadata?: { startTime: number } }).metadata
                ?.startTime || 0)

        // 记录响应日志
        logger.debug('API Response:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            status: response.status,
            duration: `${duration}ms`,
            data: data,
        })

        // 检查业务状态码，如果不是200或0，当作错误处理
        const responseData = data as { code?: number; msg?: string; data?: unknown }
        if (responseData?.code !== undefined && responseData.code !== 200 && responseData.code !== 0) {
            // 优先返回后端提供的msg，最后使用默认值
            const errorMessage = responseData.msg || `请求失败 (业务状态码: ${responseData.code})`
            throw new Error(errorMessage)
        }

        // 默认返回完整响应对象（包含code、msg、data），保持向后兼容
        // 调用方可以根据需要判断 code === 200 或直接使用 data 字段
        
        // 如果配置了只返回data字段，则提取data返回（用于简化调用方代码）
        const requestConfig = config as InternalAxiosRequestConfig & RequestConfig
        if (requestConfig.returnDataOnly && responseData?.data !== undefined) {
            return responseData.data as unknown as AxiosResponse
        }

        // 返回完整响应对象（包含code、msg、data）
        return data
    },
    (error: AxiosError) => {
        const { config, response } = error
        const endTime = Date.now()
        const duration =
            endTime -
            ((config as InternalAxiosRequestConfig & { metadata?: { startTime: number } })?.metadata
                ?.startTime || 0)

        // 记录错误日志
        logger.error('API Error:', error, {
            method: config?.method?.toUpperCase(),
            url: config?.url,
            status: response?.status,
            duration: `${duration}ms`,
            message: error.message,
            data: response?.data,
        } as Record<string, unknown>)

        // 处理不同类型的错误
        return handleApiError(error)
    }
)

// 请求方法封装
export const apiMethods = {
    // GET 请求
    get: <T = unknown>(url: string, config?: RequestConfig): Promise<T> => {
        return request.get(url, config)
    },

    // POST 请求
    post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
        return request.post(url, data, config)
    },

    // PUT 请求
    put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
        return request.put(url, data, config)
    },

    // PATCH 请求
    patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
        return request.patch(url, data, config)
    },

    // DELETE 请求
    delete: <T = unknown>(url: string, config?: RequestConfig): Promise<T> => {
        return request.delete(url, config)
    },

    // 文件上传
    upload: <T = unknown>(
        url: string,
        file: File | FormData,
        config?: RequestConfig
    ): Promise<T> => {
        const formData = file instanceof FormData ? file : new FormData()
        if (file instanceof File) {
            formData.append('file', file)
        }

        return request.post(url, formData, {
            ...config,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...config?.headers,
            },
        })
    },

    // 下载文件
    download: (url: string, filename?: string, config?: RequestConfig): Promise<void> => {
        // 对于下载文件，我们需要直接使用axios实例而不是经过拦截器处理的request
        return axios
            .get(url, {
                ...config,
                responseType: 'blob',
                baseURL: getEnv('VITE_APP_API_BASE_URL', '/api'),
            })
            .then((response: AxiosResponse<Blob>) => {
                const blob = new Blob([response.data])
                const downloadUrl = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = downloadUrl
                link.download = filename || 'download'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(downloadUrl)
            })
    },
}

// 请求取消功能
export class RequestCanceler {
    private pendingRequests = new Map<string, AbortController>()

    // 添加请求
    addRequest(config: AxiosRequestConfig): void {
        const requestKey = this.getRequestKey(config)
        this.cancelRequest(requestKey)

        const controller = new AbortController()
        config.signal = controller.signal
        this.pendingRequests.set(requestKey, controller)
    }

    // 取消请求
    cancelRequest(requestKey: string): void {
        const controller = this.pendingRequests.get(requestKey)
        if (controller) {
            controller.abort()
            this.pendingRequests.delete(requestKey)
        }
    }

    // 取消所有请求
    cancelAllRequests(): void {
        this.pendingRequests.forEach(controller => {
            controller.abort()
        })
        this.pendingRequests.clear()
    }

    // 移除请求
    removeRequest(config: AxiosRequestConfig): void {
        const requestKey = this.getRequestKey(config)
        this.pendingRequests.delete(requestKey)
    }

    // 生成请求唯一标识
    private getRequestKey(config: AxiosRequestConfig): string {
        return `${config.method}_${config.url}_${JSON.stringify(config.params)}`
    }
}

// 创建全局请求取消器实例
export const requestCanceler = new RequestCanceler()

// 导出 axios 实例（用于特殊情况）
export { request }

// SSE 连接配置接口
export interface SSEConfig {
    url: string
    method?: 'GET' | 'POST' // 新增：支持指定HTTP方法
    data?: unknown // 新增：POST请求的数据
    headers?: Record<string, string> // 新增：自定义请求头
    withCredentials?: boolean
    reconnectInterval?: number
    maxReconnectAttempts?: number
    onOpen?: (event: Event) => void
    onMessage?: (event: MessageEvent) => void
    onError?: (event: Event) => void
    onClose?: () => void
    onMaxReconnectAttemptsReached?: () => void
}

// SSE 连接状态
export const SSEStatus = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    MAX_RECONNECT_REACHED: 'max_reconnect_reached', // 新增：达到最大重连次数
} as const

export type SSEStatusType = (typeof SSEStatus)[keyof typeof SSEStatus]

// SSE 管理器类
export class SSEManager {
    private eventSource: EventSource | null = null
    private abortController: AbortController | null = null // 新增：用于fetch请求的取消控制
    private config: SSEConfig
    private status: SSEStatusType = SSEStatus.DISCONNECTED
    private reconnectAttempts = 0
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private isManualDisconnect = false

    constructor(config: SSEConfig) {
        this.config = {
            method: 'GET', // 默认使用GET方法
            withCredentials: true,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            ...config,
        }
    }

    // 连接 SSE
    connect(): void {
        // 如果已达到最大重连次数且不是手动重新连接，则不允许连接
        if (this.status === SSEStatus.MAX_RECONNECT_REACHED && !this.isManualDisconnect) {
            logger.warn('SSE已达到最大重连次数，请手动重置后再连接')
            return
        }

        if (this.eventSource || this.abortController) {
            this.disconnect(false) // 不重置重连计数器
        }

        try {
            this.status = SSEStatus.CONNECTING
            this.isManualDisconnect = false

            // 根据HTTP方法选择连接方式
            if (this.config.method === 'POST') {
                this.connectWithFetch()
            } else {
                this.connectWithEventSource()
            }

            logger.info(`SSE连接已启动 (${this.config.method}):`, this.config.url)
        } catch (error) {
            logger.error('SSE连接失败:', error instanceof Error ? error : new Error(String(error)))
            this.handleError(error as Event)
        }
    }

    // 断开连接
    disconnect(resetReconnectAttempts = true): void {
        this.isManualDisconnect = true

        // 关闭EventSource连接
        if (this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
        }

        // 取消fetch请求
        if (this.abortController) {
            this.abortController.abort()
            this.abortController = null
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        // 只有在手动断开时才重置重连计数器
        if (resetReconnectAttempts) {
            this.reconnectAttempts = 0
            this.status = SSEStatus.DISCONNECTED
        }

        if (this.config.onClose) {
            this.config.onClose()
        }

        logger.info('SSE连接已断开')
    }

    // 使用EventSource连接（GET请求）
    private connectWithEventSource(): void {
        // 构建完整的 URL，复用 request 工具的 baseURL 逻辑
        const fullUrl = this.buildUrl(this.config.url)

        // 创建 EventSource 实例
        this.eventSource = new EventSource(fullUrl, {
            withCredentials: this.config.withCredentials,
        })

        // 设置事件监听器
        this.setupEventSourceListeners()
    }

    // 使用fetch连接（POST请求）
    private async connectWithFetch(): Promise<void> {
        try {
            this.abortController = new AbortController()

            // 构建请求配置
            const fullUrl = this.buildUrl(this.config.url, false) // 不添加token到URL，而是放在headers中
            const headers: Record<string, string> = {
                Accept: 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                ...this.config.headers,
            }

            // 添加认证头
            const token = localStorage.getItem('access_token')
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            const fetchConfig: RequestInit = {
                method: 'POST',
                headers,
                signal: this.abortController.signal,
                credentials: this.config.withCredentials ? 'include' : 'same-origin',
            }

            // 添加请求体
            if (this.config.data) {
                fetchConfig.body = JSON.stringify(this.config.data)
            }

            // 发起fetch请求
            const response = await fetch(fullUrl, fetchConfig)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            if (!response.body) {
                throw new Error('Response body is null')
            }

            // 连接成功
            this.status = SSEStatus.CONNECTED
            this.reconnectAttempts = 0

            if (this.config.onOpen) {
                this.config.onOpen(new Event('open'))
            }

            // 处理流式响应
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()

                if (done) {
                    logger.info('SSE流已结束')
                    break
                }

                // 解码数据
                buffer += decoder.decode(value, { stream: true })

                // 处理SSE消息
                this.processFetchSSEData(buffer)

                // 清空已处理的数据
                const lastNewlineIndex = buffer.lastIndexOf('\n\n')
                if (lastNewlineIndex !== -1) {
                    buffer = buffer.substring(lastNewlineIndex + 2)
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                logger.info('SSE fetch请求被取消')
                return
            }

            logger.error('SSE fetch连接错误:', error instanceof Error ? error : new Error(String(error)))
            this.handleError(new Event('error'))
        }
    }

    // 处理fetch方式的SSE数据
    private processFetchSSEData(buffer: string): void {
        const messages = buffer.split('\n\n')

        for (const message of messages) {
            if (!message.trim()) continue

            const lines = message.split('\n')
            let eventType = 'message'
            let data = ''

            for (const line of lines) {
                if (line.startsWith('event:')) {
                    eventType = line.substring(6).trim()
                } else if (line.startsWith('data:')) {
                    data += line.substring(5).trim() + '\n'
                }
            }

            if (data) {
                // 移除最后的换行符
                data = data.slice(0, -1)

                // 创建MessageEvent并触发回调
                const messageEvent = new MessageEvent(eventType, {
                    data: data,
                    origin: window.location.origin,
                })

                if (this.config.onMessage) {
                    this.config.onMessage(messageEvent)
                }
            }
        }
    }

    // 重置连接状态（用于手动重新开始连接）
    reset(): void {
        this.disconnect(true)
        this.status = SSEStatus.DISCONNECTED
        logger.info('SSE连接状态已重置')
    }

    // 获取连接状态
    getStatus(): SSEStatusType {
        return this.status
    }

    // 是否已连接
    isConnected(): boolean {
        return this.status === SSEStatus.CONNECTED
    }

    // 构建完整的 URL，复用 request 工具的逻辑
    private buildUrl(url: string, addToken = true): string {
        // 如果 URL 已经是完整的 URL，直接返回
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return addToken ? this.addAuthToUrl(url) : url
        }

        // 使用与 request 工具相同的 baseURL
        const baseURL = getEnv('VITE_APP_API_BASE_URL', '/api')

        // 如果 URL 以 /api 开头，直接使用
        if (url.startsWith('/api')) {
            return addToken ? this.addAuthToUrl(url) : url
        }

        // 否则添加 baseURL 前缀
        const fullUrl = `${baseURL}${url.startsWith('/') ? url : `/${url}`}`
        return addToken ? this.addAuthToUrl(fullUrl) : fullUrl
    }

    // 添加认证头（通过 URL 参数，因为 EventSource 不支持自定义 headers）
    private addAuthToUrl(url: string): string {
        const token = localStorage.getItem('access_token')
        if (!token) {
            return url
        }

        const separator = url.includes('?') ? '&' : '?'
        return `${url}${separator}token=${encodeURIComponent(token)}`
    }

    // 设置EventSource事件监听器
    private setupEventSourceListeners(): void {
        if (!this.eventSource) return

        this.eventSource.onopen = (event: Event) => {
            this.status = SSEStatus.CONNECTED
            this.reconnectAttempts = 0

            logger.info('SSE连接已建立')

            if (this.config.onOpen) {
                this.config.onOpen(event)
            }
        }

        this.eventSource.onmessage = (event: MessageEvent) => {
            logger.debug('收到SSE消息:', event.data)

            if (this.config.onMessage) {
                this.config.onMessage(event)
            }
        }

        this.eventSource.onerror = (event: Event) => {
            logger.error('SSE连接错误:', new Error(`SSE connection error: ${event.type}`))
            this.handleError(event)
        }
    }

    // 处理错误和重连
    private handleError(event: Event): void {
        // 如果是手动断开连接，不进行错误处理
        if (this.isManualDisconnect) {
            return
        }

        this.status = SSEStatus.ERROR

        if (this.config.onError) {
            this.config.onError(event)
        }

        // 检查是否还有重连次数
        const maxAttempts = this.config.maxReconnectAttempts || 5

        if (this.reconnectAttempts < maxAttempts) {
            this.reconnectAttempts++

            logger.warn(
                `SSE连接断开，${this.config.reconnectInterval}ms后尝试第${this.reconnectAttempts}次重连 (剩余${maxAttempts - this.reconnectAttempts}次)`
            )

            this.reconnectTimer = setTimeout(() => {
                // 再次检查是否为手动断开，避免在定时器执行期间状态改变
                if (!this.isManualDisconnect) {
                    this.connect()
                }
            }, this.config.reconnectInterval)
        } else {
            // 达到最大重连次数
            this.status = SSEStatus.MAX_RECONNECT_REACHED

            logger.error(`SSE重连次数已达上限(${maxAttempts}次)，停止重连`)

            // 调用达到最大重连次数的回调
            if (this.config.onMaxReconnectAttemptsReached) {
                this.config.onMaxReconnectAttemptsReached()
            }

            // 清理资源但不重置重连计数器
            this.disconnect(false)
        }
    }
}

// 在 apiMethods 对象中添加 SSE 方法
export const api = {
    ...apiMethods,

    // 创建 SSE 连接
    createSSE: (config: SSEConfig): SSEManager => {
        return new SSEManager(config)
    },

    // SSE 便捷方法
    sse: (url: string, options?: Partial<SSEConfig>): SSEManager => {
        return new SSEManager({
            url,
            ...options,
        })
    },
}

// 默认导出 api 对象
export default api
